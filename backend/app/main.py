from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import APIRouter, FastAPI

from app.api.routes import datasets, projects, runs
from app.core.config import config
from app.jobs.executor import JobExecutor
from app.services.datasets import DatasetsService
from app.services.projects import ProjectsService
from app.services.runs import RunsService
from app.storage.filesystem import FileSystemStorage


def create_app() -> FastAPI:
    storage = FileSystemStorage(config.data_dir)
    job_executor = JobExecutor(storage, max_workers=config.job_workers)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        job_executor.start()
        yield
        job_executor.shutdown()

    app = FastAPI(lifespan=lifespan)
    app.state.storage = storage
    app.state.job_executor = job_executor
    app.state.projects_service = ProjectsService(storage)
    app.state.datasets_service = DatasetsService(storage)
    app.state.runs_service = RunsService(storage, job_executor)

    api = APIRouter()
    api.include_router(projects.router, prefix="/projects")
    api.include_router(datasets.router, prefix="/projects")
    api.include_router(runs.router, prefix="/projects")
    app.include_router(api, prefix="/api")

    return app


app = create_app()
