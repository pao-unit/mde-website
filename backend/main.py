from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from typing import Annotated

import pandas as pd
from fastapi import APIRouter, FastAPI, HTTPException, Query, UploadFile
from pydantic import (
    BaseModel,
    Field,
    PlainSerializer,
    PlainValidator,
    SerializationInfo,
    ValidationInfo,
)
from typeid import TypeID

from MDE import MDE
from patch import reset_argv  # type: ignore

cpu_count: int = os.cpu_count() or 1
executor: ThreadPoolExecutor | None = None


class Job:
    def __init__(self, project_id: TypeID) -> None:
        self.project_id = project_id


def enqueue_job(job: Job) -> None:
    if executor is None:
        raise HTTPException(status_code=503, detail="Executor not initialized")
    try:
        executor.submit(execute_job, job)
    except RuntimeError:
        raise HTTPException(status_code=503, detail="Executor is shutting down")


def execute_job(job: Job) -> None:
    project_id = job.project_id

    data_path = get_data_path(project_id)
    df = pd.read_parquet(data_path)

    settings_path = get_settings_path(project_id)
    with open(settings_path, "r") as f:
        settings = Settings.model_validate_json(f.read())

    result_path = get_result_path(project_id)

    with reset_argv():
        mde = MDE(
            df,
            target=settings.target,
            removeColumns=settings.removeColumns,
            D=settings.D,
            lib=settings.lib,
            pred=settings.pred,
            cores=cpu_count,
            plot=False,
        )

        mde.Run()
        if mde.MDEOut is None:
            raise RuntimeError("MDE computation failed")

        mde.MDEOut.to_parquet(result_path, compression="zstd", index=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global executor
    executor = ThreadPoolExecutor(max_workers=3)
    yield
    if executor is not None:
        executor.shutdown(wait=True)


app = FastAPI(lifespan=lifespan)
api = APIRouter()


def validate_typeid(value: str | TypeID, info: ValidationInfo) -> TypeID:
    if isinstance(value, TypeID):
        return value
    else:
        return TypeID().from_string(value)


def serialize_typeid(value: TypeID, info: SerializationInfo) -> str:
    return str(value)


TypeIDAnnotated = Annotated[
    TypeID, PlainValidator(validate_typeid), PlainSerializer(serialize_typeid)
]


def generate_project_id() -> TypeID:
    return TypeID(prefix="project")


def parse_project_id(project_id: str) -> TypeID:
    try:
        return TypeID("project").from_string(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID")


def get_project_path(project_id: TypeID) -> str:
    return f"./data/{project_id}"


def get_meta_path(project_id: TypeID) -> str:
    return os.path.join(get_project_path(project_id), "meta.json")


def get_settings_path(project_id: TypeID) -> str:
    return os.path.join(get_project_path(project_id), "settings.json")


def get_data_path(project_id: TypeID) -> str:
    return os.path.join(get_project_path(project_id), "data.parquet.zstd")


def get_result_path(project_id: TypeID) -> str:
    return os.path.join(get_project_path(project_id), "result.parquet.zstd")


def is_allowed_file(filename: str) -> bool:
    allowed_extensions = {".csv", ".csv.zstd", ".parquet", ".parquet.zstd"}
    return any(filename.endswith(ext) for ext in allowed_extensions)


class Project(BaseModel):
    id: TypeIDAnnotated = Field(
        description="The unique identifier for the project",
        examples=["project_01k6wba7gzecgakd2fr2jkx9z8"],
    )
    filename: str = Field(
        description="The uploaded file name", examples=["data.csv", "data.parquet.zstd"]
    )


# TODO: limit size middleware
@api.post("/projects", response_model=Project)
async def create_project(file: UploadFile) -> Project:
    if file.filename is None or not is_allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Invalid file type")

    id = generate_project_id()
    project = Project(id=id, filename=file.filename)

    project_path = get_project_path(id)
    os.makedirs(project_path, exist_ok=True)

    meta_path = get_meta_path(id)
    with open(meta_path, "w") as f:
        f.write(project.model_dump_json())

    data_path = get_data_path(id)
    if file.filename.endswith(".parquet.zstd"):
        with open(data_path, "wb") as f:
            f.write(file.file.read())
    elif file.filename.endswith(".parquet"):
        df = pd.read_parquet(file.file)
        df.to_parquet(data_path, compression="zstd", index=False)
    elif file.filename.endswith(".csv") or file.filename.endswith(".csv.zstd"):
        df = pd.read_csv(file.file)
        df.to_parquet(data_path, compression="zstd", index=False)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    return project


class Settings(BaseModel):
    target: str = Field(description="The target column name", examples=["target"])
    removeColumns: list[str] = Field(
        description="Columns to remove", examples=[["index", "FWD", "Left_Right"]]
    )
    D: int = Field(description="The number of dimensions", examples=[10])
    lib: list[int] = Field(
        description="Library range to use", min_length=2, max_length=2, examples=[[1, 300]]
    )
    pred: list[int] = Field(
        description="Prediction range to use", min_length=2, max_length=2, examples=[[301, 600]]
    )


@api.post("/projects/{project_id}/settings")
async def run(project_id: str, settings: Settings):
    project_id_parsed = parse_project_id(project_id)

    data_path = get_data_path(project_id_parsed)
    if not os.path.exists(data_path):
        raise HTTPException(status_code=404, detail="Project not found")

    # TODO: check existing job

    settings_path = get_settings_path(project_id_parsed)
    with open(settings_path, "w") as f:
        f.write(settings.model_dump_json())

    enqueue_job(Job(project_id_parsed))

    return {"projectId": str(project_id_parsed)}


GetVariablesRequest = Annotated[list[str], Query(min_length=1)]
GetVariablesResponse = dict[str, list[float]]


@api.get("/projects/{project_id}/variables", response_model=GetVariablesResponse)
async def get_variables(project_id: str, variables: GetVariablesRequest):
    project_id_parsed = parse_project_id(project_id)

    data_path = get_data_path(project_id_parsed)
    if not os.path.exists(data_path):
        raise HTTPException(status_code=404, detail="Project not found")
    df = pd.read_parquet(data_path)

    missing_vars = [var for var in variables if var not in df.columns]
    if len(missing_vars) > 0:
        raise HTTPException(
            status_code=400, detail=f"Variables not found in dataset: {', '.join(missing_vars)}"
        )

    return {key: df[key].tolist() for key in variables}


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
    rowCount: int = Field(description="Total number of rows", examples=[600])
    columns: list[ColumnSummary] = Field(description="Per-column summaries")


@api.get("/projects/{project_id}/dataset", response_model=DatasetOverview)
async def get_dataset_overview(project_id: str) -> DatasetOverview:
    project_id_parsed = parse_project_id(project_id)

    data_path = get_data_path(project_id_parsed)
    if not os.path.exists(data_path):
        raise HTTPException(status_code=404, detail="Project not found")

    df = pd.read_parquet(data_path)

    desc = df.describe()
    missing = df.isnull().sum().astype(int)

    columns = []
    for col in df.columns:
        if col in desc.columns:
            columns.append(
                ColumnSummary(
                    name=col,
                    missing=missing[col],
                    mean=desc[col]["mean"],
                    std=desc[col]["std"],
                    min=desc[col]["min"],
                    q1=desc[col]["25%"],
                    q2=desc[col]["50%"],
                    q3=desc[col]["75%"],
                    max=desc[col]["max"],
                    dtype=str(df[col].dtype),
                )
            )
        else:
            columns.append(
                ColumnSummary(
                    name=col,
                    missing=missing[col],
                    mean=None,
                    std=None,
                    min=None,
                    q1=None,
                    q2=None,
                    q3=None,
                    max=None,
                    dtype=str(df[col].dtype),
                )
            )

    return DatasetOverview(rowCount=len(df), columns=columns)


Result = dict[str, float]


class GetProjectResponse(Project):
    settings: Settings | None = Field(description="MDE settings", examples=[None])
    result: Result | None = Field(description="MDE result", examples=[None])


@api.get("/projects/{project_id}")
async def get_project(project_id: str) -> GetProjectResponse:
    project_id_parsed = parse_project_id(project_id)

    meta_path = get_meta_path(project_id_parsed)
    if not os.path.exists(meta_path):
        raise HTTPException(status_code=404, detail="Project not found")
    with open(meta_path, "r") as f:
        project: Project = Project.model_validate_json(f.read())

    settings_path = get_settings_path(project_id_parsed)
    if os.path.exists(settings_path):
        with open(settings_path, "r") as f:
            settings = Settings.model_validate_json(f.read())
    else:
        return GetProjectResponse(
            **project.model_dump(),
            settings=None,
            result=None,
        )

    result_path = get_result_path(project_id_parsed)
    if os.path.exists(result_path):
        df = pd.read_parquet(result_path)
    else:
        return GetProjectResponse(
            **project.model_dump(),
            settings=settings,
            result=None,
        )

    result = {row["variables"]: row["rho"] for _, row in df.iterrows()}

    return GetProjectResponse(
        **project.model_dump(),
        settings=settings,
        result=result,
    )


app.include_router(api, prefix="/api")
