from __future__ import annotations

import os
from pathlib import Path

from lvr_open_data_backend import DB_PATH


def database_url() -> str:
    return str(os.environ.get("REAL_PRICE_DATABASE_URL") or os.environ.get("DATABASE_URL") or "").strip()


def requested_backend() -> str:
    value = str(os.environ.get("REAL_PRICE_DB_BACKEND") or os.environ.get("REAL_PRICE_STORAGE") or "auto").strip().lower()
    if value in {"postgres", "postgresql", "pg", "postgis"}:
        return "postgis"
    if value in {"sqlite", "sqlite3", "local"}:
        return "sqlite"
    return "auto"


def should_use_postgis(*, db_path: Path = DB_PATH) -> bool:
    # Tests and one-off scripts pass a temporary SQLite path; keep those isolated.
    if Path(db_path) != Path(DB_PATH):
        return False
    backend = requested_backend()
    if backend == "sqlite":
        return False
    if backend == "postgis":
        return True
    return bool(database_url())


def backend_name(*, db_path: Path = DB_PATH) -> str:
    return "postgis" if should_use_postgis(db_path=db_path) else "sqlite"
