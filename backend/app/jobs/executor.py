from __future__ import annotations

import logging
import os
import sysconfig
import warnings
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

from typeid import TypeID

from app.analysis.runner import run_analysis
from app.domain.models import AnalysisRun, utc_now
from app.storage.filesystem import FileSystemStorage

logger = logging.getLogger(__name__)

if (
    sysconfig.get_config_var("Py_GIL_DISABLED")
    and os.environ.get("PYTHON_GIL") != "0"
):
    warnings.warn(
        "Run with PYTHON_GIL=0 to keep the GIL disabled; "
        "otherwise the worker pool will not scale.",
        stacklevel=2,
    )


@dataclass(frozen=True)
class AnalysisJob:
    project_id: TypeID
    run_id: TypeID


class JobExecutor:
    def __init__(self, storage: FileSystemStorage, max_workers: int = 3) -> None:
        self.storage = storage
        self.max_workers = max_workers
        self._executor: ThreadPoolExecutor | None = None

    def start(self) -> None:
        if self._executor is None:
            self._executor = ThreadPoolExecutor(max_workers=self.max_workers)

    def shutdown(self) -> None:
        if self._executor is not None:
            self._executor.shutdown(wait=True)
            self._executor = None

    def enqueue(self, job: AnalysisJob) -> None:
        if self._executor is None:
            raise RuntimeError("Executor not initialized")
        try:
            self._executor.submit(self._execute, job)
        except RuntimeError as exc:
            raise RuntimeError("Executor is shutting down") from exc

    def _execute(self, job: AnalysisJob) -> None:
        run = self.storage.load_run(job.project_id, job.run_id)
        if run is None:
            logger.error("Analysis run not found: project=%s run=%s", job.project_id, job.run_id)
            return

        run = self._mark_running(run)
        try:
            df = self.storage.load_dataset(job.project_id)
            if df is None:
                raise RuntimeError("Project dataset not found")

            result = run_analysis(df, run.settings)
            completed = run.model_copy(
                update={
                    "status": "completed",
                    "error": None,
                    "updatedAt": utc_now(),
                    "result": result,
                }
            )
            self.storage.save_run(completed)
        except Exception as exc:
            logger.exception("Analysis run failed: project=%s run=%s", job.project_id, job.run_id)
            failed = run.model_copy(
                update={
                    "status": "failed",
                    "error": str(exc),
                    "updatedAt": utc_now(),
                    "result": None,
                }
            )
            self.storage.save_run(failed)

    def _mark_running(self, run: AnalysisRun) -> AnalysisRun:
        running = run.model_copy(
            update={
                "status": "running",
                "error": None,
                "updatedAt": utc_now(),
            }
        )
        self.storage.save_run(running)
        return running
