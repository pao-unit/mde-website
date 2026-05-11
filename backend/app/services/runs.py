from __future__ import annotations

import pandas as pd
from fastapi import HTTPException

from app.domain.models import (
    AnalysisRun,
    AnalysisSettings,
    PointRange,
    Result,
    generate_run_id,
    parse_project_id,
    parse_run_id,
    utc_now,
)
from app.jobs.executor import AnalysisJob, JobExecutor
from app.storage.filesystem import FileSystemStorage


class RunsService:
    def __init__(self, storage: FileSystemStorage, executor: JobExecutor) -> None:
        self.storage = storage
        self.executor = executor

    def create_run(self, project_id: str, settings: AnalysisSettings) -> AnalysisRun:
        parsed_project_id = parse_project_id(project_id)
        if not self.storage.project_exists(parsed_project_id):
            raise HTTPException(status_code=404, detail="Project not found")

        df = self.storage.load_dataset(parsed_project_id)
        if df is None:
            raise HTTPException(status_code=404, detail="Project not found")

        validate_analysis_settings(df, settings)

        now = utc_now()
        run = AnalysisRun(
            id=generate_run_id(),
            projectId=parsed_project_id,
            status="queued",
            error=None,
            createdAt=now,
            updatedAt=now,
            settings=settings,
            result=None,
        )
        self.storage.save_run(run)

        try:
            self.executor.enqueue(AnalysisJob(project_id=parsed_project_id, run_id=run.id))
        except RuntimeError as exc:
            failed = run.model_copy(
                update={
                    "status": "failed",
                    "error": str(exc),
                    "updatedAt": utc_now(),
                }
            )
            self.storage.save_run(failed)
            raise HTTPException(status_code=503, detail=str(exc)) from exc

        return run

    def get_run(self, project_id: str, run_id: str) -> AnalysisRun:
        parsed_project_id = parse_project_id(project_id)
        parsed_run_id = parse_run_id(run_id)
        run = self.storage.load_run(parsed_project_id, parsed_run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        return run

    def get_result(self, project_id: str, run_id: str) -> Result:
        run = self.get_run(project_id, run_id)

        if run.status == "failed":
            detail = f"Run failed: {run.error}" if run.error else "Run failed"
            raise HTTPException(status_code=409, detail=detail)
        if run.status != "completed":
            raise HTTPException(status_code=409, detail=f"Run is {run.status}")
        if run.result is None:
            raise HTTPException(status_code=500, detail="Completed run has no result")

        return run.result


def validate_analysis_settings(
    df: pd.DataFrame, settings: AnalysisSettings
) -> None:
    target_duplicates = duplicates(settings.targets)
    if target_duplicates:
        raise HTTPException(
            status_code=400,
            detail=f"Duplicate target columns: {', '.join(target_duplicates)}",
        )

    exclude_duplicates = duplicates(settings.excludeColumns)
    if exclude_duplicates:
        raise HTTPException(
            status_code=400,
            detail=f"Duplicate excluded columns: {', '.join(exclude_duplicates)}",
        )

    target_set = set(settings.targets)
    exclude_set = set(settings.excludeColumns)
    overlap = sorted(target_set & exclude_set)
    if overlap:
        raise HTTPException(
            status_code=400,
            detail=f"Columns cannot be both target and excluded: {', '.join(overlap)}",
        )

    missing_targets = [column for column in settings.targets if column not in df.columns]
    if missing_targets:
        raise HTTPException(
            status_code=400,
            detail=f"Target columns not found in dataset: {', '.join(missing_targets)}",
        )

    missing_excludes = [
        column for column in settings.excludeColumns if column not in df.columns
    ]
    if missing_excludes:
        raise HTTPException(
            status_code=400,
            detail=f"Excluded columns not found in dataset: {', '.join(missing_excludes)}",
        )

    non_numeric_targets = [
        column
        for column in settings.targets
        if not pd.api.types.is_numeric_dtype(df[column])
    ]
    if non_numeric_targets:
        raise HTTPException(
            status_code=400,
            detail=f"Target columns must be numeric: {', '.join(non_numeric_targets)}",
        )

    validate_ranges(
        total_points=len(df),
        library_range=settings.libraryRange,
        prediction_range=settings.predictionRange,
        holdout_range=settings.holdoutRange,
    )

    feature_columns = [
        column for column in df.columns if column not in target_set and column not in exclude_set
    ]
    if not feature_columns:
        raise HTTPException(
            status_code=400,
            detail="No candidate variables remain after excluding targets and excluded columns",
        )

    non_numeric_features = [
        column
        for column in feature_columns
        if not pd.api.types.is_numeric_dtype(df[column])
    ]
    if non_numeric_features:
        raise HTTPException(
            status_code=400,
            detail=f"Candidate variables must be numeric or excluded: {', '.join(non_numeric_features)}",
        )

    if settings.maxVariables > len(feature_columns):
        raise HTTPException(
            status_code=400,
            detail=(
                "maxVariables cannot exceed candidate variable count "
                f"({len(feature_columns)})"
            ),
        )


def validate_ranges(
    total_points: int,
    library_range: PointRange,
    prediction_range: PointRange,
    holdout_range: PointRange,
) -> None:
    ranges = {
        "libraryRange": library_range,
        "predictionRange": prediction_range,
        "holdoutRange": holdout_range,
    }
    for name, point_range in ranges.items():
        if point_range.end > total_points:
            raise HTTPException(
                status_code=400,
                detail=f"{name} must be within dataset point count ({total_points})",
            )

    for left_name, right_name in (
        ("libraryRange", "predictionRange"),
        ("libraryRange", "holdoutRange"),
        ("predictionRange", "holdoutRange"),
    ):
        if ranges_overlap(ranges[left_name], ranges[right_name]):
            raise HTTPException(
                status_code=400,
                detail=f"{left_name} and {right_name} must not overlap",
            )


def ranges_overlap(left: PointRange, right: PointRange) -> bool:
    return left.start <= right.end and right.start <= left.end


def duplicates(values: list[str]) -> list[str]:
    seen: set[str] = set()
    duplicated: list[str] = []
    for value in values:
        if value in seen and value not in duplicated:
            duplicated.append(value)
        seen.add(value)
    return duplicated
