from __future__ import annotations

from typing import Any


NEARBY_SORTS = {
    "distance_asc",
    "date_desc",
    "unit_price_desc",
    "unit_price_asc",
    "total_price_desc",
    "total_price_asc",
    "area_desc",
    "area_asc",
}

RADIUS_CHOICES_KM = (0.1, 0.3, 0.5, 1.0, 3.0)


def error_response(message: str, *, code: str | None = None) -> dict[str, Any]:
    payload: dict[str, Any] = {"ok": False, "error": message}
    if code:
        payload["code"] = code
    return payload
