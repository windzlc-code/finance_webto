"""Real-price search service facade used by map APIs."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from lvr_open_data_backend import DB_PATH

from backend.real_price.storage import get_case_detail, query_map_search


def search_real_price_cases(
    filters: dict[str, Any],
    *,
    page: int = 1,
    page_size: int = 50,
    sort: str = "transaction_date_desc",
    db_path: Path = DB_PATH,
) -> dict[str, Any]:
    return query_map_search(filters, page=page, page_size=page_size, sort=sort, db_path=db_path)


def load_real_price_case(case_id: int, *, db_path: Path = DB_PATH) -> dict[str, Any] | None:
    return get_case_detail(case_id, db_path=db_path)
