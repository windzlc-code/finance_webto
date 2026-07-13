"""Geospatial query facade.

Callers use one facade while storage switches between PostGIS and the legacy
SQLite fallback through backend.real_price.storage.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from lvr_open_data_backend import DB_PATH

from backend.real_price.storage import query_map_clusters, query_map_search


def bbox_search(filters: dict[str, Any], *, db_path: Path = DB_PATH) -> dict[str, Any]:
    return query_map_search(filters, db_path=db_path)


def grid_clusters(filters: dict[str, Any], *, grid_size: int = 500, db_path: Path = DB_PATH) -> list[dict[str, Any]]:
    return query_map_clusters(filters, grid_size=grid_size, db_path=db_path)
