from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request

from app.api import schemas
from app.services.datasets import DatasetsService

router = APIRouter(tags=["datasets"])
GetVariablesRequest = Annotated[list[str], Query(min_length=1)]


def get_datasets_service(request: Request) -> DatasetsService:
    return request.app.state.datasets_service


@router.get("/{project_id}/dataset", response_model=schemas.DatasetOverview)
async def get_dataset_overview(
    project_id: str,
    service: Annotated[DatasetsService, Depends(get_datasets_service)],
) -> schemas.DatasetOverview:
    return service.get_overview(project_id)


@router.get("/{project_id}/variables", response_model=schemas.GetVariablesResponse)
async def get_variables(
    project_id: str,
    variables: GetVariablesRequest,
    service: Annotated[DatasetsService, Depends(get_datasets_service)],
) -> schemas.GetVariablesResponse:
    return service.get_variables(project_id, variables)
