from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path
from typing import BinaryIO

import pandas as pd
from typeid import TypeID

from app.core.config import config
from app.domain.models import AnalysisRun, Project


class FileSystemStorage:
    def __init__(self, data_dir: Path = config.data_dir) -> None:
        self.data_dir = data_dir.resolve()
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def project_path(self, project_id: TypeID) -> Path:
        return self.data_dir / str(project_id)

    def meta_path(self, project_id: TypeID) -> Path:
        return self.project_path(project_id) / "meta.json"

    def data_path(self, project_id: TypeID) -> Path:
        return self.project_path(project_id) / "data.parquet.zstd"

    def runs_path(self, project_id: TypeID) -> Path:
        return self.project_path(project_id) / "runs"

    def run_path(self, project_id: TypeID, run_id: TypeID) -> Path:
        return self.runs_path(project_id) / f"{run_id}.json"

    def project_exists(self, project_id: TypeID) -> bool:
        return self.meta_path(project_id).exists() and self.data_path(project_id).exists()

    def save_project(self, project: Project) -> None:
        project_dir = self.project_path(project.id)
        project_dir.mkdir(parents=True, exist_ok=True)
        write_json_atomic(self.meta_path(project.id), project.model_dump_json())

    def load_project(self, project_id: TypeID) -> Project | None:
        meta_path = self.meta_path(project_id)
        if not meta_path.exists():
            return None
        return Project.model_validate_json(meta_path.read_text(encoding="utf-8"))

    def list_projects(self) -> list[Project]:
        projects: list[Project] = []
        for meta_path in sorted(self.data_dir.glob("project_*/meta.json")):
            try:
                projects.append(Project.model_validate_json(meta_path.read_text(encoding="utf-8")))
            except ValueError:
                continue
        return projects

    def save_uploaded_dataset(
        self, project_id: TypeID, filename: str, source: BinaryIO
    ) -> None:
        project_dir = self.project_path(project_id)
        project_dir.mkdir(parents=True, exist_ok=True)
        data_path = self.data_path(project_id)

        if filename.endswith(".parquet.zstd"):
            with data_path.open("wb") as target:
                shutil.copyfileobj(source, target)
            return

        if filename.endswith(".parquet"):
            df = pd.read_parquet(source)
        elif filename.endswith(".csv.zstd"):
            df = pd.read_csv(source, compression="zstd")
        elif filename.endswith(".csv"):
            df = pd.read_csv(source)
        else:
            raise ValueError("Unsupported file type")

        df.to_parquet(data_path, compression="zstd", index=False)

    def load_dataset(self, project_id: TypeID) -> pd.DataFrame | None:
        data_path = self.data_path(project_id)
        if not data_path.exists():
            return None
        return pd.read_parquet(data_path)

    def save_run(self, run: AnalysisRun) -> None:
        self.runs_path(run.projectId).mkdir(parents=True, exist_ok=True)
        write_json_atomic(self.run_path(run.projectId, run.id), run.model_dump_json())

    def load_run(self, project_id: TypeID, run_id: TypeID) -> AnalysisRun | None:
        run_path = self.run_path(project_id, run_id)
        if not run_path.exists():
            return None
        return AnalysisRun.model_validate_json(run_path.read_text(encoding="utf-8"))

    def list_runs(self, project_id: TypeID) -> list[AnalysisRun]:
        runs_path = self.runs_path(project_id)
        if not runs_path.exists():
            return []

        runs: list[AnalysisRun] = []
        for run_path in sorted(runs_path.glob("run_*.json")):
            try:
                runs.append(AnalysisRun.model_validate_json(run_path.read_text(encoding="utf-8")))
            except ValueError:
                continue
        return sorted(runs, key=lambda run: run.createdAt)

    def latest_run(self, project_id: TypeID) -> AnalysisRun | None:
        runs = self.list_runs(project_id)
        if not runs:
            return None
        return max(runs, key=lambda run: run.createdAt)


def write_json_atomic(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            "w",
            dir=path.parent,
            encoding="utf-8",
            delete=False,
            prefix=f".{path.name}.",
            suffix=".tmp",
        ) as temp_file:
            temp_path = temp_file.name
            temp_file.write(content)
            temp_file.flush()
            os.fsync(temp_file.fileno())
        os.replace(temp_path, path)
    finally:
        if temp_path is not None and os.path.exists(temp_path):
            os.unlink(temp_path)
