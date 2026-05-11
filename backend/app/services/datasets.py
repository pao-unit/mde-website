from __future__ import annotations

import math
from typing import SupportsFloat, cast

import pandas as pd
from fastapi import HTTPException

from app.domain.models import (
    ColumnSummary,
    DatasetOverview,
    parse_project_id,
)
from app.storage.filesystem import FileSystemStorage


class DatasetsService:
    def __init__(self, storage: FileSystemStorage) -> None:
        self.storage = storage

    def get_overview(self, project_id: str) -> DatasetOverview:
        df = self._require_dataset(project_id)
        columns = [summarize_column(name, df[name]) for name in df.columns]
        return DatasetOverview(pointCount=len(df), columns=columns)

    def get_variables(
        self, project_id: str, variables: list[str]
    ) -> dict[str, list[float | None]]:
        df = self._require_dataset(project_id)

        missing_vars = [variable for variable in variables if variable not in df.columns]
        if missing_vars:
            raise HTTPException(
                status_code=400,
                detail=f"Variables not found in dataset: {', '.join(missing_vars)}",
            )

        non_numeric = [
            variable
            for variable in variables
            if not pd.api.types.is_numeric_dtype(df[variable])
        ]
        if non_numeric:
            raise HTTPException(
                status_code=400,
                detail=f"Variables must be numeric: {', '.join(non_numeric)}",
            )

        return {
            variable: series_to_float_list(df[variable])
            for variable in variables
        }

    def _require_dataset(self, project_id: str) -> pd.DataFrame:
        parsed_id = parse_project_id(project_id)
        if not self.storage.project_exists(parsed_id):
            raise HTTPException(status_code=404, detail="Project not found")

        df = self.storage.load_dataset(parsed_id)
        if df is None:
            raise HTTPException(status_code=404, detail="Project not found")
        return df


def summarize_column(name: str, series: pd.Series) -> ColumnSummary:
    missing = int(series.isna().sum())
    dtype = str(series.dtype)

    if not pd.api.types.is_numeric_dtype(series):
        return ColumnSummary(
            name=name,
            missing=missing,
            mean=None,
            std=None,
            min=None,
            q1=None,
            q2=None,
            q3=None,
            max=None,
            dtype=dtype,
        )

    desc = series.describe(percentiles=[0.25, 0.5, 0.75])
    return ColumnSummary(
        name=name,
        missing=missing,
        mean=clean_float(desc.get("mean")),
        std=clean_float(desc.get("std")),
        min=clean_float(desc.get("min")),
        q1=clean_float(desc.get("25%")),
        q2=clean_float(desc.get("50%")),
        q3=clean_float(desc.get("75%")),
        max=clean_float(desc.get("max")),
        dtype=dtype,
    )


def series_to_float_list(series: pd.Series) -> list[float | None]:
    return [clean_float(value) for value in series.to_numpy()]


def clean_float(value: object) -> float | None:
    if value is None or pd.isna(value):
        return None
    number = float(cast(SupportsFloat, value))
    if not math.isfinite(number):
        return None
    return number
