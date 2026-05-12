from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Literal, Self

from fastapi import HTTPException
from pydantic import (
    BaseModel,
    Field,
    PlainSerializer,
    PlainValidator,
    SerializationInfo,
    ValidationInfo,
    WithJsonSchema,
    model_validator,
)
from typeid import TypeID


def validate_typeid(value: str | TypeID, info: ValidationInfo) -> TypeID:
    if isinstance(value, TypeID):
        return value
    return TypeID().from_string(value)


def serialize_typeid(value: TypeID, info: SerializationInfo) -> str:
    return str(value)


TypeIDAnnotated = Annotated[
    TypeID,
    PlainValidator(validate_typeid),
    PlainSerializer(serialize_typeid),
    WithJsonSchema({"type": "string"}),
]


def utc_now() -> datetime:
    return datetime.now(UTC)


def generate_project_id() -> TypeID:
    return TypeID(prefix="project")


def generate_run_id() -> TypeID:
    return TypeID(prefix="run")


def parse_project_id(project_id: str) -> TypeID:
    try:
        return TypeID("project").from_string(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID")


def parse_run_id(run_id: str) -> TypeID:
    try:
        return TypeID("run").from_string(run_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid run ID")


class Project(BaseModel):
    id: TypeIDAnnotated = Field(
        description="The unique identifier for the project",
        examples=["project_01k6wba7gzecgakd2fr2jkx9z8"],
    )
    filename: str = Field(
        description="The uploaded file name", examples=["data.csv", "data.parquet.zstd"]
    )


class PointRange(BaseModel):
    start: int = Field(
        ge=1,
        description="Inclusive 1-indexed start point",
        examples=[1],
    )
    end: int = Field(
        ge=1,
        description="Inclusive 1-indexed end point",
        examples=[300],
    )

    @model_validator(mode="after")
    def validate_order(self) -> Self:
        if self.end < self.start:
            raise ValueError("end must be greater than or equal to start")
        return self


AnalysisBackend = Literal["edmkit", "dimx"]


class AnalysisSettings(BaseModel):
    backend: AnalysisBackend = Field(
        default="edmkit",
        description="Analysis implementation used for greedy variable selection",
        examples=["edmkit", "dimx"],
    )
    targets: list[str] = Field(
        min_length=1,
        description="Target column names. Predicted jointly; auto-excluded from candidate variables.",
        examples=[["FWD", "LEFT_RIGHT"]],
    )
    excludeColumns: list[str] = Field(
        default_factory=list,
        description="Additional columns to exclude from candidate variables",
        examples=[[]],
    )
    maxVariables: int = Field(
        ge=1,
        description="Maximum number of variables to select (greedy forward steps)",
        examples=[10],
    )
    libraryRange: PointRange = Field(
        description="Training (library) point range. Used as the simplex library throughout greedy selection and final scoring.",
        examples=[{"start": 1, "end": 6000}],
    )
    predictionRange: PointRange = Field(
        description="Training (prediction) point range. Held-out prediction targets during greedy variable selection.",
        examples=[{"start": 6001, "end": 8000}],
    )
    holdoutRange: PointRange = Field(
        description="Holdout point range. Final out-of-sample prediction targets used for the best-step plot and holdout rho.",
        examples=[{"start": 8001, "end": 10000}],
    )
    seed: int = Field(
        default=0, description="Random seed for reproducibility", examples=[0]
    )
    prefilterThreshold: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description=(
            "Pre-filter rho threshold in [0, 1]. Candidate variables whose best "
            "univariate embedding rho (across the (E, tau) grid on the training "
            "library + prediction rows) is below this value are dropped before "
            "greedy selection. 0 disables the pre-filter."
        ),
        examples=[0.0, 0.1],
    )


class SelectionStep(BaseModel):
    variable: str = Field(description="Variable added at this step", examples=["TS12"])
    rhoPrediction: float = Field(
        description="Mean Pearson rho on the Training (prediction) range (drives greedy selection)",
        examples=[0.78],
    )
    rhoHoldout: float = Field(
        description="Mean Pearson rho on the Holdout range (true generalization)",
        examples=[0.74],
    )


class TargetPlot(BaseModel):
    name: str = Field(description="Target column name", examples=["FWD"])
    observed: list[float] = Field(
        description="Ground-truth target values over the holdout points"
    )
    predicted: list[float] = Field(
        description="Simplex-projection predictions over the holdout points"
    )


class BestStep(BaseModel):
    stepIndex: int = Field(
        description="1-indexed greedy step that achieved the highest prediction rho",
        examples=[4],
    )
    rho: float = Field(
        description="Mean holdout rho at the selected best step",
        examples=[0.74],
    )
    rhoPrediction: float = Field(
        description="Mean prediction rho used to choose the best step",
        examples=[0.78],
    )
    rhoHoldout: float = Field(
        description="Mean holdout rho at the selected best step",
        examples=[0.74],
    )
    plots: list[TargetPlot] = Field(
        description="Per-target observed-vs-predicted series on the holdout points at the best step"
    )


class FoldSummary(BaseModel):
    librarySize: int
    predictionSize: int
    holdoutSize: int


class PrefilterSummary(BaseModel):
    threshold: float = Field(
        description="Threshold used (matches AnalysisSettings.prefilterThreshold)",
        examples=[0.1],
    )
    total: int = Field(
        description="Number of candidate variables before pre-filtering", examples=[24]
    )
    kept: int = Field(
        description="Number of variables retained after pre-filtering", examples=[13]
    )
    droppedColumns: list[str] = Field(
        default_factory=list,
        description="Names of candidate variables dropped by the pre-filter",
    )


class Result(BaseModel):
    steps: list[SelectionStep] = Field(
        description="Selected variables in greedy order. Each entry is one forward step."
    )
    bestStep: BestStep | None = Field(
        default=None,
        description="Information about the step with the best prediction rho (None if no variables were selected)",
    )
    fold: FoldSummary = Field(description="Effective fold sizes used by the run")
    prefilter: PrefilterSummary | None = Field(
        default=None,
        description=(
            "Pre-filter outcome. None when prefilterThreshold is 0 (filter skipped)."
        ),
    )


RunStatus = Literal["queued", "running", "completed", "failed"]


class AnalysisRun(BaseModel):
    id: TypeIDAnnotated = Field(
        description="The unique identifier for the run",
        examples=["run_01k6wba7gzecgakd2fr2jkx9z8"],
    )
    projectId: TypeIDAnnotated = Field(
        description="Project that owns this run",
        examples=["project_01k6wba7gzecgakd2fr2jkx9z8"],
    )
    status: RunStatus = Field(description="Run lifecycle status")
    error: str | None = Field(default=None, description="Failure message if the run failed")
    createdAt: datetime = Field(description="Run creation timestamp")
    updatedAt: datetime = Field(description="Run last update timestamp")
    settings: AnalysisSettings = Field(description="Analysis settings used for this run")
    result: Result | None = Field(default=None, description="Completed analysis result")


class ProjectDetail(Project):
    latestRun: AnalysisRun | None = Field(
        default=None, description="Most recently created analysis run"
    )


class ColumnSummary(BaseModel):
    name: str = Field(description="Column name", examples=["column1"])
    missing: int = Field(description="Number of missing values", examples=[0])
    mean: float | None = Field(description="Mean value", examples=[0.42])
    std: float | None = Field(description="Standard deviation", examples=[0.12])
    min: float | None = Field(description="Minimum value", examples=[-0.4])
    q1: float | None = Field(description="25th percentile", examples=[0.3])
    q2: float | None = Field(description="50th percentile (median)", examples=[0.5])
    q3: float | None = Field(description="75th percentile", examples=[0.6])
    max: float | None = Field(description="Maximum value", examples=[0.9])
    dtype: str = Field(description="Pandas dtype", examples=["float64"])


class DatasetOverview(BaseModel):
    pointCount: int = Field(description="Total number of points", examples=[600])
    columns: list[ColumnSummary] = Field(description="Per-column summaries")
