from __future__ import annotations

from pathlib import Path
from typing import Any

from lvr_open_data_backend import DB_PATH

from . import geocoder as sqlite_geocoder
from . import postgis_repository
from . import repository as sqlite_repository
from .storage_backend import backend_name, should_use_postgis


def real_price_status(db_path: Path = DB_PATH) -> dict[str, Any]:
    if should_use_postgis(db_path=db_path):
        return postgis_repository.real_price_status(db_path)
    status = sqlite_repository.real_price_status(db_path)
    status["backend"] = "sqlite"
    return status


def import_from_open_data(*args: Any, db_path: Path = DB_PATH, **kwargs: Any) -> dict[str, Any]:
    if should_use_postgis(db_path=db_path):
        return postgis_repository.import_from_open_data(*args, db_path=db_path, **kwargs)
    result = sqlite_repository.import_from_open_data(*args, db_path=db_path, **kwargs)
    result["backend"] = "sqlite"
    return result


def insert_transaction(record: dict[str, Any], db_path: Path = DB_PATH) -> int:
    if should_use_postgis(db_path=db_path):
        return postgis_repository.insert_transaction(record, db_path=db_path)
    return sqlite_repository.insert_transaction(record, db_path=db_path)


def insert_transactions_batch(records: list[dict[str, Any]], db_path: Path = DB_PATH) -> int:
    if should_use_postgis(db_path=db_path):
        return postgis_repository.insert_transactions_batch(records, db_path=db_path)
    inserted = 0
    for record in records:
        sqlite_repository.insert_transaction(record, db_path=db_path)
        inserted += 1
    return inserted


def update_transaction_geocode(transaction_id: int, *, db_path: Path = DB_PATH, **kwargs: Any) -> None:
    if should_use_postgis(db_path=db_path):
        postgis_repository.update_transaction_geocode(transaction_id, db_path=db_path, **kwargs)
        return
    sqlite_repository.update_transaction_geocode(transaction_id, db_path=db_path, **kwargs)


def update_transaction_geocodes_batch(
    updates: list[dict[str, Any]] | tuple[dict[str, Any], ...],
    *,
    db_path: Path = DB_PATH,
) -> int:
    if should_use_postgis(db_path=db_path):
        return postgis_repository.update_transaction_geocodes_batch(updates, db_path=db_path)
    updated = 0
    for item in updates:
        transaction_id = item.get("id") or item.get("transaction_id") or item.get("transactionId")
        if transaction_id is None:
            continue
        sqlite_repository.update_transaction_geocode(
            int(transaction_id),
            lat=item.get("lat"),
            lng=item.get("lng"),
            status=str(item.get("status") or "pending"),
            provider=item.get("provider"),
            confidence=item.get("confidence"),
            error=item.get("error"),
            db_path=db_path,
        )
        updated += 1
    return updated


def pending_geocode_items(*args: Any, db_path: Path = DB_PATH, **kwargs: Any) -> list[dict[str, Any]]:
    if should_use_postgis(db_path=db_path):
        return postgis_repository.pending_geocode_items(*args, db_path=db_path, **kwargs)
    return sqlite_repository.pending_geocode_items(*args, db_path=db_path, **kwargs)


def apply_geocode_cache_to_transactions(db_path: Path = DB_PATH, **kwargs: Any):
    if should_use_postgis(db_path=db_path):
        return postgis_repository.apply_geocode_cache_to_transactions(db_path, **kwargs)
    return sqlite_repository.apply_geocode_cache_to_transactions(db_path, **kwargs)


def classify_pending_geocode_transactions(db_path: Path = DB_PATH) -> dict[str, Any]:
    if should_use_postgis(db_path=db_path):
        return postgis_repository.classify_pending_geocode_transactions(db_path)
    return {
        "ok": True,
        "backend": "sqlite",
        "needsCadastralGeocodeMarked": 0,
        "lowPrecisionMarked": 0,
        "message": "SQLite backend keeps pending geocode rows unchanged.",
    }


def query_nearby(*args: Any, db_path: Path = DB_PATH, **kwargs: Any) -> list[dict[str, Any]]:
    if should_use_postgis(db_path=db_path):
        return postgis_repository.query_nearby(*args, db_path=db_path, **kwargs)
    return sqlite_repository.query_nearby(*args, db_path=db_path, **kwargs)


def query_map_search(*args: Any, db_path: Path = DB_PATH, **kwargs: Any) -> dict[str, Any]:
    if should_use_postgis(db_path=db_path):
        return postgis_repository.query_map_search(*args, db_path=db_path, **kwargs)
    result = sqlite_repository.query_map_search(*args, db_path=db_path, **kwargs)
    result["backend"] = "sqlite"
    return result


def query_map_clusters(*args: Any, db_path: Path = DB_PATH, **kwargs: Any) -> list[dict[str, Any]]:
    if should_use_postgis(db_path=db_path):
        return postgis_repository.query_map_clusters(*args, db_path=db_path, **kwargs)
    return sqlite_repository.query_map_clusters(*args, db_path=db_path, **kwargs)


def lookup_transaction_location(payload: dict[str, Any], db_path: Path = DB_PATH):
    if should_use_postgis(db_path=db_path):
        return postgis_repository.lookup_transaction_location(payload, db_path=db_path)
    return sqlite_repository.lookup_transaction_location(payload, db_path=db_path)


def get_case_detail(case_id: int, *, db_path: Path = DB_PATH) -> dict[str, Any] | None:
    if should_use_postgis(db_path=db_path):
        return postgis_repository.get_case_detail(case_id, db_path=db_path)
    return sqlite_repository.get_case_detail(case_id, db_path=db_path)


def geocode_address(address: str, *, db_path: Path = DB_PATH, provider: str = "auto"):
    if should_use_postgis(db_path=db_path):
        return postgis_repository.geocode_address(address, db_path=db_path, provider=provider)
    return sqlite_geocoder.geocode_address(address, db_path=db_path, provider=provider)


def write_cache(address: str, lat: float | None, lng: float | None, *, db_path: Path = DB_PATH, **kwargs: Any):
    if should_use_postgis(db_path=db_path):
        return postgis_repository.write_cache(address, lat, lng, db_path=db_path, **kwargs)
    return sqlite_geocoder.write_cache(address, lat, lng, db_path=db_path, **kwargs)


def write_cache_batch(
    entries: list[dict[str, Any]] | tuple[dict[str, Any], ...],
    *,
    db_path: Path = DB_PATH,
) -> int:
    if should_use_postgis(db_path=db_path):
        return postgis_repository.write_cache_batch(entries, db_path=db_path)
    written = 0
    for item in entries:
        address = str(item.get("address") or item.get("address_raw") or "")
        if not address:
            continue
        sqlite_geocoder.write_cache(
            address,
            item.get("lat"),
            item.get("lng"),
            provider=str(item.get("provider") or "manual"),
            confidence=item.get("confidence", 1.0),
            status=str(item.get("status") or "ok"),
            error=item.get("error"),
            db_path=db_path,
        )
        written += 1
    return written


def active_backend(db_path: Path = DB_PATH) -> str:
    return backend_name(db_path=db_path)
