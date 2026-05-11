# Backend API

Built on Python 3.14t (free-threaded) + FastAPI + `edmkit` / `edmkit-search`.

## Setup

```bash
uv sync
```

## Running dev server

```bash
PYTHON_GIL=0 uv run fastapi dev main.py --reload
```

## Running prod server

```bash
PYTHON_GIL=0 uv run fastapi run main.py
```

`PYTHON_GIL=0` must be set at interpreter startup so transitive imports (`usearch.compiled`) cannot re-enable the GIL.
