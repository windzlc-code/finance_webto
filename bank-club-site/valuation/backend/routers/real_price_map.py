"""Real-price map route adapters.

The live local app is served by ``serve.py``.  This module keeps the map-search
contract isolated so a later FastAPI router can call the same service functions
without changing frontend URLs.
"""

from __future__ import annotations

from typing import Any

from backend.real_price.service import case_detail_api, map_clusters_api, map_search_api


def map_search(query: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    return map_search_api(query)


def map_clusters(query: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    return map_clusters_api(query)


def case_detail(case_id: int | str) -> tuple[int, dict[str, Any]]:
    return case_detail_api(case_id)
