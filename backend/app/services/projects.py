from __future__ import annotations

from fastapi import HTTPException, UploadFile

from app.domain.models import Project, ProjectDetail, generate_project_id
from app.storage.filesystem import FileSystemStorage

ALLOWED_EXTENSIONS = (".csv", ".csv.zstd", ".parquet", ".parquet.zstd")


class ProjectsService:
    def __init__(self, storage: FileSystemStorage) -> None:
        self.storage = storage

    def create_project(self, file: UploadFile) -> Project:
        if file.filename is None or not is_allowed_file(file.filename):
            raise HTTPException(status_code=400, detail="Invalid file type")

        project = Project(id=generate_project_id(), filename=file.filename)

        try:
            self.storage.save_uploaded_dataset(project.id, file.filename, file.file)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Unable to parse uploaded file") from exc

        self.storage.save_project(project)
        return project

    def list_projects(self) -> list[Project]:
        return self.storage.list_projects()

    def get_project(self, project_id: str) -> ProjectDetail:
        project = self._require_project(project_id)
        return ProjectDetail(
            **project.model_dump(),
            latestRun=self.storage.latest_run(project.id),
        )

    def _require_project(self, project_id: str) -> Project:
        from app.domain.models import parse_project_id

        parsed_id = parse_project_id(project_id)
        project = self.storage.load_project(parsed_id)
        if project is None or not self.storage.project_exists(parsed_id):
            raise HTTPException(status_code=404, detail="Project not found")
        return project


def is_allowed_file(filename: str) -> bool:
    return filename.endswith(ALLOWED_EXTENSIONS)
