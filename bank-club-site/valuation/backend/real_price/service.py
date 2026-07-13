from __future__ import annotations

from pathlib import Path
from typing import Any

from lvr_open_data_backend import DB_PATH

from .storage import (
    apply_geocode_cache_to_transactions,
    geocode_address,
    get_case_detail,
    import_from_open_data,
    lookup_transaction_location,
    pending_geocode_items,
    query_map_clusters,
    query_map_search,
    query_nearby,
    real_price_status,
    update_transaction_geocode,
    write_cache,
)
from .cathay_underwriting import lookup_zone_by_coordinate


MAX_RADIUS_KM = 3.0
MIN_RADIUS_KM = 0.1
MAX_LIMIT = 500
DEFAULT_LIMIT = 100
MIN_UNDERWRITING_GEOCODE_CONFIDENCE = 0.7
UNDERWRITING_UNSAFE_GEOCODE_PROVIDERS = (
    "same_road",
    "same_lane",
    "nearby",
    "nominatim_road",
)


def real_price_status_api(*, db_path: Path = DB_PATH) -> tuple[int, dict[str, Any]]:
    return 200, real_price_status(db_path)


def pending_geocode_api(query: dict[str, Any] | None = None, *, db_path: Path = DB_PATH) -> tuple[int, dict[str, Any]]:
    query = query or {}
    try:
        limit = _limit(_first_query(query, "limit", DEFAULT_LIMIT))
    except ValueError as exc:
        return _error(400, str(exc))
    city = str(_first_query(query, "city", "") or "").strip() or None
    district = str(_first_query(query, "district", "") or "").strip() or None
    items = pending_geocode_items(limit=limit, city=city, district=district, db_path=db_path)
    return 200, {"ok": True, "count": len(items), "items": items}


def apply_geocode_cache_api(payload: dict[str, Any] | None = None, *, db_path: Path = DB_PATH) -> tuple[int, dict[str, Any]]:
    payload = payload or {}
    dry_run = _truthy(payload.get("dryRun", payload.get("dry_run", False)))
    limit_raw = payload.get("limit", payload.get("batchSize", payload.get("batch_size", 5000)))
    limit = None
    if limit_raw not in (None, "", "all", "ALL"):
        try:
            limit = _positive_int(limit_raw, "limit", maximum=100000)
        except ValueError as exc:
            return _error(400, str(exc))
    mode = str(payload.get("mode") or ("missing" if not _truthy(payload.get("replaceExisting")) else "replace")).strip().lower()
    if mode not in {"missing", "replace"}:
        return _error(400, "mode must be missing or replace")
    try:
        sample_limit = _non_negative_int(payload.get("sampleLimit", payload.get("sample_limit", 8)), "sampleLimit", maximum=50)
    except ValueError as exc:
        return _error(400, str(exc))
    try:
        result = apply_geocode_cache_to_transactions(
            db_path,
            limit=limit,
            city=str(payload.get("city") or "").strip() or None,
            district=str(payload.get("district") or "").strip() or None,
            dry_run=dry_run,
            mode=mode,
            refresh_stats=not dry_run and _truthy(payload.get("refreshStats", True)),
            sample_limit=sample_limit,
            return_summary=True,
        )
    except Exception as exc:  # pragma: no cover - server safety net
        return _error(500, f"apply_geocode_cache_failed: {exc}")
    return 200, result


def commit_geocode_api(payload: dict[str, Any], *, db_path: Path = DB_PATH) -> tuple[int, dict[str, Any]]:
    address = str(payload.get("address") or payload.get("address_raw") or "").strip()
    transaction_id = payload.get("id") or payload.get("transactionId")
    provider = str(payload.get("provider") or "local")
    confidence = _optional_float(payload.get("confidence"))
    status = str(payload.get("status") or "ok").strip() or "ok"
    error = str(payload.get("error") or "").strip() or None
    lat = _optional_float(payload.get("lat"))
    lng = _optional_float(payload.get("lng"))
    if status == "ok" and (lat is None or lng is None):
        return _error(400, "missing lat/lng")
    if not address and not transaction_id:
        return _error(400, "missing address or transaction id")
    if address and lat is not None and lng is not None:
        write_cache(address, lat, lng, provider=provider, confidence=confidence or 0.9, status=status, error=error, db_path=db_path)
    if transaction_id:
        try:
            update_transaction_geocode(
                int(transaction_id),
                lat=lat,
                lng=lng,
                status=status,
                provider=provider,
                confidence=confidence,
                error=error,
                db_path=db_path,
            )
        except (TypeError, ValueError):
            return _error(400, "invalid transaction id")
    return 200, {"ok": True, "id": transaction_id, "address": address, "lat": lat, "lng": lng, "status": status}


def import_from_open_data_api(payload: dict[str, Any], *, db_path: Path = DB_PATH) -> tuple[int, dict[str, Any]]:
    try:
        limit = _limit(payload.get("limit", DEFAULT_LIMIT))
    except ValueError as exc:
        return _error(400, str(exc))
    result = import_from_open_data(
        limit=limit,
        min_source_id=int(payload.get("minSourceId") or payload.get("min_source_id") or 0),
        city=str(payload.get("city") or "").strip() or None,
        district=str(payload.get("district") or "").strip() or None,
        transaction_type=str(payload.get("transactionType") or payload.get("transaction_type") or "").strip() or None,
        include_parking_only=bool(payload.get("includeParkingOnly") or payload.get("include_parking_only")),
        db_path=db_path,
    )
    return (200 if result.get("ok") else 400), result


def geocode_address_api(payload: dict[str, Any], *, db_path: Path = DB_PATH) -> tuple[int, dict[str, Any]]:
    address = str(payload.get("address") or payload.get("query") or "").strip()
    if not address:
        return _error(400, "missing address")
    result = geocode_address(address, db_path=db_path, provider=str(payload.get("provider") or "auto"))
    status = 200 if result.ok else 404
    return status, result.to_dict()


def geocode_official_case_api(payload: dict[str, Any], *, db_path: Path = DB_PATH) -> tuple[int, dict[str, Any]]:
    result = lookup_transaction_location(payload, db_path=db_path)
    status = 200 if result.ok else 404
    return status, result.to_dict()


def cathay_underwriting_zone_api(payload: dict[str, Any], *, db_path: Path = DB_PATH) -> tuple[int, dict[str, Any]]:
    address = str(payload.get("address") or payload.get("query") or "").strip()
    try:
        lat = _optional_float(payload.get("lat"))
        lng = _optional_float(payload.get("lng"))
        geocode_payload: dict[str, Any] | None = None
        if (lat is None or lng is None) and address:
            geo = geocode_address(address, db_path=db_path, provider=str(payload.get("provider") or "auto"))
            geocode_payload = geo.to_dict()
            if not geo.ok or geo.lat is None or geo.lng is None:
                return 404, {
                    "ok": False,
                    "error": "geocode_not_found",
                    "message": geo.error or "地址尚未有座標。",
                    "geocode": geocode_payload,
                }
            if not _geocode_reliable_for_underwriting(geo):
                return 404, _underwriting_low_confidence_response(geo, geocode_payload)
            lat = geo.lat
            lng = geo.lng
        if lat is None or lng is None:
            return _error(400, "missing lat/lng or address")
        result = lookup_zone_by_coordinate(lat, lng)
        if geocode_payload is not None:
            result["geocode"] = geocode_payload
        return (200 if result.get("ok") else 404), result
    except ValueError as exc:
        return _error(400, str(exc))
    except Exception as exc:  # pragma: no cover - server safety net
        return _error(500, f"cathay_underwriting_lookup_failed: {exc}")


def _geocode_reliable_for_underwriting(geo: Any) -> bool:
    provider = str(getattr(geo, "provider", "") or "").lower()
    if any(token in provider for token in UNDERWRITING_UNSAFE_GEOCODE_PROVIDERS):
        return False
    confidence = _optional_float(getattr(geo, "confidence", None))
    return confidence is None or confidence >= MIN_UNDERWRITING_GEOCODE_CONFIDENCE


def _underwriting_low_confidence_response(geo: Any, geocode_payload: dict[str, Any] | None = None) -> dict[str, Any]:
    provider = str(getattr(geo, "provider", "") or "unknown")
    confidence = _optional_float(getattr(geo, "confidence", None))
    confidence_label = "--" if confidence is None else f"{confidence:.2f}"
    return {
        "ok": False,
        "error": "geocode_low_confidence",
        "message": (
            f"定位信心不足（{provider} / {confidence_label}），"
            "為避免承作分區誤判，請補正門牌座標或等待精準定位完成。"
        ),
        "geocode": geocode_payload or geo.to_dict(),
    }


def nearby_by_address_api(payload: dict[str, Any], *, db_path: Path = DB_PATH) -> tuple[int, dict[str, Any]]:
    address = str(payload.get("address") or payload.get("query") or "").strip()
    if not address:
        return _error(400, "missing address")
    geo = geocode_address(address, db_path=db_path, provider=str(payload.get("provider") or "auto"))
    if not geo.ok or geo.lat is None or geo.lng is None:
        return 404, {
            "ok": False,
            "error": "geocode_not_found",
            "message": geo.error or "地址尚未有座標。",
            "geocode": geo.to_dict(),
        }
    next_payload = dict(payload)
    next_payload["lat"] = geo.lat
    next_payload["lng"] = geo.lng
    status, body = nearby_api(next_payload, db_path=db_path)
    body["geocode"] = geo.to_dict()
    return status, body


def nearby_api(payload: dict[str, Any], *, db_path: Path = DB_PATH) -> tuple[int, dict[str, Any]]:
    try:
        lat = _required_float(payload.get("lat"), "lat")
        lng = _required_float(payload.get("lng"), "lng")
        radius_km = _radius(payload.get("radiusKm", payload.get("radius_km", 0.5)))
        limit = _limit(payload.get("limit", DEFAULT_LIMIT))
    except ValueError as exc:
        return _error(400, str(exc))
    sort = str(payload.get("sort") or "distance_asc")
    filters = payload.get("filters") if isinstance(payload.get("filters"), dict) else {}
    try:
        items = query_nearby(
            lat,
            lng,
            radius_km=radius_km,
            limit=limit,
            sort=sort,
            filters=filters,
            db_path=db_path,
        )
    except Exception as exc:  # pragma: no cover - server safety net
        return _error(500, f"real_price_query_failed: {exc}")
    return 200, {
        "ok": True,
        "query": {
            "lat": lat,
            "lng": lng,
            "radiusKm": radius_km,
            "radius_km": radius_km,
            "limit": limit,
            "sort": sort,
            "count": len(items),
        },
        "items": items,
    }


def map_search_api(query: dict[str, Any] | None = None, *, db_path: Path = DB_PATH) -> tuple[int, dict[str, Any]]:
    query = _flatten_query(query or {})
    try:
        page = _positive_int(query.get("page", 1), "page", maximum=100000)
        page_size = _positive_int(query.get("page_size", query.get("pageSize", 50)), "page_size", maximum=500)
    except ValueError as exc:
        return _error(400, str(exc))
    sort = str(query.get("sort") or "transaction_date_desc")
    try:
        result = query_map_search(query, page=page, page_size=page_size, sort=sort, db_path=db_path)
    except Exception as exc:  # pragma: no cover - server safety net
        return _error(500, f"real_price_map_search_failed: {exc}")
    return 200, result


def map_clusters_api(query: dict[str, Any] | None = None, *, db_path: Path = DB_PATH) -> tuple[int, dict[str, Any]]:
    query = _flatten_query(query or {})
    try:
        grid_size = _positive_int(query.get("grid_size", query.get("gridSize", 500)), "grid_size", maximum=5000)
    except ValueError as exc:
        return _error(400, str(exc))
    clusters = query_map_clusters(query, grid_size=grid_size, db_path=db_path)
    return 200, {"ok": True, "clusters": clusters, "count": len(clusters)}


def case_detail_api(case_id: Any, *, db_path: Path = DB_PATH) -> tuple[int, dict[str, Any]]:
    try:
        parsed_id = int(case_id)
    except (TypeError, ValueError):
        return _error(400, "invalid case id")
    detail = get_case_detail(parsed_id, db_path=db_path)
    if detail is None:
        return _error(404, "case not found")
    return 200, {"ok": True, "item": detail, **detail}


def _error(status: int, message: str) -> tuple[int, dict[str, Any]]:
    return status, {"ok": False, "error": message}


def _first_query(query: dict[str, Any], key: str, default: Any = None) -> Any:
    value = query.get(key, default)
    if isinstance(value, list):
        return value[0] if value else default
    return value


def _flatten_query(query: dict[str, Any]) -> dict[str, Any]:
    flattened: dict[str, Any] = {}
    for key, value in query.items():
        flattened[key] = value[0] if isinstance(value, list) and value else value
    return flattened


def _optional_float(value: Any) -> float | None:
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _required_float(value: Any, name: str) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"missing or invalid {name}") from None
    if name == "lat" and not -90 <= parsed <= 90:
        raise ValueError("lat out of range")
    if name == "lng" and not -180 <= parsed <= 180:
        raise ValueError("lng out of range")
    return parsed


def _radius(value: Any) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        raise ValueError("invalid radiusKm") from None
    if parsed < MIN_RADIUS_KM or parsed > MAX_RADIUS_KM:
        raise ValueError(f"radiusKm must be between {MIN_RADIUS_KM} and {MAX_RADIUS_KM}")
    return parsed


def _limit(value: Any) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValueError("invalid limit") from None
    if parsed < 1:
        raise ValueError("limit must be positive")
    return min(parsed, MAX_LIMIT)


def _positive_int(value: Any, name: str, *, maximum: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"invalid {name}") from None
    if parsed < 1:
        raise ValueError(f"{name} must be positive")
    return min(parsed, maximum)


def _non_negative_int(value: Any, name: str, *, maximum: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"invalid {name}") from None
    if parsed < 0:
        raise ValueError(f"{name} must be zero or positive")
    return min(parsed, maximum)


def _truthy(value: Any) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}
