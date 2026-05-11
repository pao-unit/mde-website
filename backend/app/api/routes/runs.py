from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.api import schemas
from app.services.runs import RunsService

router = APIRouter(tags=["runs"])


def get_runs_service(request: Request) -> RunsService:
    return request.app.state.runs_service


@router.post("/{project_id}/runs", response_model=schemas.AnalysisRun, status_code=202)
async def create_run(
    project_id: str,
    settings: schemas.AnalysisSettings,
    service: Annotated[RunsService, Depends(get_runs_service)],
) -> schemas.AnalysisRun:
    return service.create_run(project_id, settings)


@router.get("/{project_id}/runs/{run_id}", response_model=schemas.AnalysisRun)
async def get_run(
    project_id: str,
    run_id: str,
    service: Annotated[RunsService, Depends(get_runs_service)],
) -> schemas.AnalysisRun:
    return service.get_run(project_id, run_id)


@router.get("/{project_id}/runs/{run_id}/result", response_model=schemas.Result)
async def get_run_result(
    project_id: str,
    run_id: str,
    service: Annotated[RunsService, Depends(get_runs_service)],
) -> schemas.Result:
    return service.get_result(project_id, run_id)
