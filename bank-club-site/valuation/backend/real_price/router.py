from __future__ import annotations

from typing import Any, Callable

from .service import (
    apply_geocode_cache_api,
    case_detail_api,
    cathay_underwriting_zone_api,
    commit_geocode_api,
    geocode_address_api,
    geocode_official_case_api,
    import_from_open_data_api,
    map_clusters_api,
    map_search_api,
    nearby_api,
    nearby_by_address_api,
    pending_geocode_api,
    real_price_status_api,
)


RouteHandler = Callable[[dict[str, Any]], tuple[int, dict[str, Any]]]


POST_ROUTES: dict[str, RouteHandler] = {
    "api/real-price/nearby": nearby_api,
    "api/real-price/nearby-by-address": nearby_by_address_api,
    "api/real-price/geocode/apply-cache": apply_geocode_cache_api,
    "api/real-price/geocode/commit": commit_geocode_api,
    "api/real-price/import-from-open-data": import_from_open_data_api,
    "api/cathay/underwriting-zone": cathay_underwriting_zone_api,
    "api/geocode/address": geocode_address_api,
    "api/geocode/official-case": geocode_official_case_api,
}


def handle_post_route(path: str, payload: dict[str, Any]) -> tuple[int, dict[str, Any]] | None:
    handler = POST_ROUTES.get(path)
    if handler is None:
        return None
    return handler(payload)


def handle_get_route(path: str) -> tuple[int, dict[str, Any]] | None:
    if path == "api/real-price/status":
        return real_price_status_api()
    if path in {"api/real-price/geocode/pending", "api/real-price/pending-geocode"}:
        return pending_geocode_api()
    if path == "api/real-price/map-search":
        return map_search_api()
    if path == "api/real-price/map-clusters":
        return map_clusters_api()
    if path.startswith("api/real-price/cases/"):
        return case_detail_api(path.rsplit("/", 1)[-1])
    return None
