from __future__ import annotations

from app.domain.models import (
    AnalysisRun,
    AnalysisSettings,
    BestStep,
    ColumnSummary,
    DatasetOverview,
    FoldSummary,
    PointRange,
    PrefilterSummary,
    Project,
    ProjectDetail,
    Result,
    SelectionStep,
    TargetPlot,
)

GetVariablesResponse = dict[str, list[float | None]]

__all__ = [
    "AnalysisRun",
    "AnalysisSettings",
    "BestStep",
    "ColumnSummary",
    "DatasetOverview",
    "FoldSummary",
    "GetVariablesResponse",
    "PointRange",
    "PrefilterSummary",
    "Project",
    "ProjectDetail",
    "Result",
    "SelectionStep",
    "TargetPlot",
]
