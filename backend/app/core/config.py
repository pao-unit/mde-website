from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATA_DIR = (BACKEND_DIR / "data").resolve()


@dataclass(frozen=True)
class AppConfig:
    data_dir: Path = DEFAULT_DATA_DIR
    job_workers: int = 3


config = AppConfig()
