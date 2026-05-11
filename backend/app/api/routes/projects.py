from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Request, UploadFile

from app.api import schemas
from app.services.projects import ProjectsService

router = APIRouter(tags=["projects"])


def get_projects_service(request: Request) -> ProjectsService:
    return request.app.state.projects_service


@router.post("", response_model=schemas.Project, status_code=201)
async def create_project(
    file: Annotated[UploadFile, File(...)],
    service: Annotated[ProjectsService, Depends(get_projects_service)],
) -> schemas.Project:
    return service.create_project(file)


@router.get("", response_model=list[schemas.Project])
async def list_projects(
    service: Annotated[ProjectsService, Depends(get_projects_service)],
) -> list[schemas.Project]:
    return service.list_projects()


@router.get("/{project_id}", response_model=schemas.ProjectDetail)
async def get_project(
    project_id: str,
    service: Annotated[ProjectsService, Depends(get_projects_service)],
) -> schemas.ProjectDetail:
    return service.get_project(project_id)
