from __future__ import annotations

import json
import os
import re
import sqlite3
import sys
import urllib.parse
import urllib.request
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from lvr_open_data_backend import DB_PATH

from .address_normalizer import normalize_address, parse_city_district
from .distance import haversine_m
from .geocoder import GeocodeResult
from .storage_backend import database_url
from . import repository as sqlite_repo

VENDOR_PYTHON = Path(__file__).resolve().parents[2] / "vendor" / "python"
if VENDOR_PYTHON.exists() and str(VENDOR_PYTHON) not in sys.path:
    sys.path.insert(0, str(VENDOR_PYTHON))

try:  # Optional dependency: installed only when PostGIS mode is enabled.
    import psycopg
    from psycopg.rows import dict_row
except Exception:  # pragma: no cover - exercised in environments without psycopg.
    psycopg = None  # type: ignore[assignment]
    dict_row = None  # type: ignore[assignment]


MIGRATION_PATH = Path(__file__).resolve().parents[2] / "migrations" / "20260620_real_price_postgis.sql"
_SCHEMA_READY = False
_DOORPLATE_RE = re.compile(r"^(?P<prefix>.+?)(?P<number>\d+)(?:之(?P<sub>\d+))?號")
_ROAD_PREFIX_RE = re.compile(r"^(.+?(?:大道|路|街|道)(?:\d+段)?)")
_MAX_APPROX_ADDRESS_DISTANCE_M = 2500.0

INSERT_COLUMNS = [
    "source",
    "source_type",
    "source_file",
    "source_row_id",
    "raw_case_id",
    "city",
    "district",
    "address_raw",
    "address_normalized",
    "transaction_target",
    "community_name",
    "transaction_date",
    "transaction_date_raw",
    "building_type",
    "building_state",
    "main_use",
    "main_material",
    "floor",
    "floor_raw",
    "floor_level",
    "total_floors",
    "building_area_sqm",
    "building_area_ping",
    "parking_area_sqm",
    "parking_area_ping",
    "parking_price",
    "parking_type",
    "land_area_sqm",
    "land_area_ping",
    "total_price",
    "unit_price_sqm",
    "unit_price_ping",
    "rooms",
    "halls",
    "baths",
    "bathrooms",
    "has_management",
    "completion_date",
    "completion_date_raw",
    "building_age",
    "note",
    "lat",
    "lng",
    "geocode_status",
    "geocode_provider",
    "geocode_confidence",
    "geocode_error",
    "raw_json",
]

DATE_COLUMNS = {"transaction_date", "completion_date"}


def driver_available() -> bool:
    return psycopg is not None


def configured() -> bool:
    return bool(database_url())


def _connect():
    if psycopg is None:
        raise RuntimeError("psycopg is not installed; run `python3 -m pip install 'psycopg[binary]'`.")
    url = database_url()
    if not url:
        raise RuntimeError("DATABASE_URL or REAL_PRICE_DATABASE_URL is required for PostGIS mode.")
    return psycopg.connect(url, row_factory=dict_row)


def ensure_schema() -> None:
    global _SCHEMA_READY
    if _SCHEMA_READY:
        return
    with _connect() as conn:
        if _schema_already_available(conn):
            _SCHEMA_READY = True
            return
        sql = MIGRATION_PATH.read_text(encoding="utf-8")
        for statement in sql.split(";"):
            statement = statement.strip()
            if statement:
                conn.execute(statement)
        conn.commit()
    _SCHEMA_READY = True


def _schema_already_available(conn: Any) -> bool:
    row = conn.execute(
        """
        select
            to_regclass('public.real_price_transactions') is not null as has_transactions,
            to_regclass('public.address_coordinate_cache') is not null as has_cache,
            to_regclass('public.geocode_jobs') is not null as has_jobs,
            to_regclass('public.real_price_stats') is not null as has_stats,
            to_regclass('public.idx_real_price_city_district') is not null as has_city_district_idx,
            to_regclass('public.idx_real_price_address_trgm') is not null as has_address_trgm_idx
        """
    ).fetchone()
    return bool(row and all(bool(value) for value in row.values()))


def real_price_status(db_path: Path = DB_PATH) -> dict[str, Any]:
    if not configured() or not driver_available():
        return {
            "ok": True,
            "backend": "postgis",
            "available": False,
            "databaseUrlConfigured": configured(),
            "driverAvailable": driver_available(),
            "message": "PostGIS backend is selected but DATABASE_URL/psycopg is not ready.",
        }
    try:
        ensure_schema()
        with _connect() as conn:
            total = _cached_stat(
                conn,
                "real_price_transactions.total",
                "select count(*) from real_price_transactions",
            )
            geocoded = _cached_stat(
                conn,
                "real_price_transactions.geocoded",
                "select count(*) from real_price_transactions where geom is not null or (lat is not null and lng is not null)",
            )
            pending = _cached_stat(
                conn,
                "real_price_transactions.pending_geocode",
                "select count(*) from real_price_transactions where geocode_status = 'pending'",
            )
            needs_cadastral = _cached_stat(
                conn,
                "real_price_transactions.needs_cadastral_geocode",
                "select count(*) from real_price_transactions where geocode_status = 'needs_cadastral_geocode'",
            )
            low_precision = _cached_stat(
                conn,
                "real_price_transactions.low_precision",
                "select count(*) from real_price_transactions where geocode_status = 'low_precision'",
            )
            cache_total = _count(conn, "select count(*) from address_coordinate_cache")
    except Exception as exc:
        return {
            "ok": True,
            "backend": "postgis",
            "available": False,
            "databaseUrlConfigured": configured(),
            "driverAvailable": driver_available(),
            "error": str(exc),
        }
    return {
        "ok": True,
        "backend": "postgis",
        "available": total > 0,
        "databaseUrlConfigured": True,
        "driverAvailable": True,
        "transactions": {
            "total": total,
            "geocoded": geocoded,
            "pendingGeocode": pending,
            "needsCadastralGeocode": needs_cadastral,
            "lowPrecisionGeocode": low_precision,
        },
        "addressCache": {"total": cache_total},
    }


def _count(conn: Any, sql: str, params: list[Any] | None = None) -> int:
    row = conn.execute(sql, params or []).fetchone()
    return int((row or {}).get("count") or list(row.values())[0] or 0) if row else 0


def _estimated_table_count(conn: Any, table: str) -> int:
    row = conn.execute("select reltuples::bigint as count from pg_class where oid = %s::regclass", [table]).fetchone()
    estimate = int((row or {}).get("count") or 0)
    if estimate > 0:
        return estimate
    return _count(conn, f"select count(*) from {table}")


def _cached_table_count(conn: Any, table: str) -> int:
    key = f"{table}.total"
    return _cached_stat(conn, key, f"select count(*) from {table}", estimated_table=table)


def _cached_stat(conn: Any, key: str, fallback_sql: str, *, estimated_table: str | None = None) -> int:
    try:
        row = conn.execute("select value from real_price_stats where key = %s", [key]).fetchone()
    except Exception:
        row = None
    cached = int((row or {}).get("value") or 0)
    if cached > 0:
        return cached
    if estimated_table:
        return _estimated_table_count(conn, estimated_table)
    return _count(conn, fallback_sql)


def refresh_real_price_stats(db_path: Path = DB_PATH) -> dict[str, Any]:
    ensure_schema()
    with _connect() as conn:
        total = _count(conn, "select count(*) from real_price_transactions")
        geocoded = _count(
            conn,
            "select count(*) from real_price_transactions where geom is not null or (lat is not null and lng is not null)",
        )
        pending = _count(conn, "select count(*) from real_price_transactions where geocode_status = 'pending'")
        needs_cadastral = _count(
            conn,
            "select count(*) from real_price_transactions where geocode_status = 'needs_cadastral_geocode'",
        )
        low_precision = _count(conn, "select count(*) from real_price_transactions where geocode_status = 'low_precision'")
        for key, value in [
            ("real_price_transactions.total", total),
            ("real_price_transactions.geocoded", geocoded),
            ("real_price_transactions.pending_geocode", pending),
            ("real_price_transactions.needs_cadastral_geocode", needs_cadastral),
            ("real_price_transactions.low_precision", low_precision),
        ]:
            conn.execute(
                """
                insert into real_price_stats (key, value, updated_at)
                values (%s, %s, now())
                on conflict(key) do update set value = excluded.value, updated_at = now()
                """,
                [key, value],
            )
        conn.commit()
    return {
        "ok": True,
        "total": total,
        "geocoded": geocoded,
        "pendingGeocode": pending,
        "needsCadastralGeocode": needs_cadastral,
        "lowPrecisionGeocode": low_precision,
    }


def classify_pending_geocode_transactions(db_path: Path = DB_PATH) -> dict[str, Any]:
    ensure_schema()
    with _connect() as conn:
        land_cur = conn.execute(
            """
            update real_price_transactions
            set geocode_status = 'needs_cadastral_geocode',
                geocode_provider = 'geocode_classifier',
                geocode_error = 'land_lot_requires_cadastral_geocode',
                updated_at = now()
            where geocode_status = 'pending'
              and (lat is null or lng is null or geom is null)
              and address_normalized like '%%地號%%'
            """
        )
        low_cur = conn.execute(
            """
            update real_price_transactions
            set geocode_status = 'low_precision',
                geocode_provider = 'geocode_classifier',
                geocode_error = 'missing_doorplate_number',
                updated_at = now()
            where geocode_status = 'pending'
              and (lat is null or lng is null or geom is null)
              and address_normalized not like '%%地號%%'
              and address_normalized not like '%%號%%'
            """
        )
        land_count = int(land_cur.rowcount or 0)
        low_count = int(low_cur.rowcount or 0)
        conn.commit()
    stats = refresh_real_price_stats(db_path)
    return {
        "ok": True,
        "needsCadastralGeocodeMarked": land_count,
        "lowPrecisionMarked": low_count,
        "stats": stats,
    }


def import_from_open_data(
    *,
    limit: int = 1000,
    min_source_id: int = 0,
    city: str | None = None,
    district: str | None = None,
    transaction_type: str | None = None,
    include_parking_only: bool = False,
    db_path: Path = DB_PATH,
) -> dict[str, Any]:
    ensure_schema()
    source_db = Path(db_path)
    if not source_db.exists():
        return {"ok": False, "error": f"source SQLite DB not found: {source_db}", "imported": 0, "skipped": 0}
    limit = max(1, min(int(limit), 5000))
    where = ["id > ?"]
    params: list[Any] = [int(min_source_id or 0)]
    if city:
        where.append("city_name in (?, ?)")
        params.extend([city, str(city).replace("台", "臺")])
    if district:
        where.append("district = ?")
        params.append(district)
    if transaction_type:
        where.append("transaction_type = ?")
        params.append(transaction_type)
    else:
        where.append("transaction_type in ('sale', 'presale')")
    if not include_parking_only:
        where.append("(target is null or target not in ('車位', '土地'))")
    params.append(limit)
    with sqlite3.connect(source_db) as source:
        source.row_factory = sqlite3.Row
        exists = source.execute("select 1 from sqlite_master where type = 'table' and name = 'lvr_transactions'").fetchone()
        if not exists:
            return {"ok": False, "error": "lvr_transactions not found", "imported": 0, "skipped": 0}
        rows = source.execute(
            f"""
            select *
            from lvr_transactions
            where {" and ".join(where)}
            order by id
            limit ?
            """,
            params,
        ).fetchall()
    imported = 0
    skipped = 0
    last_source_id = int(min_source_id or 0)
    records: list[dict[str, Any]] = []
    for row in rows:
        last_source_id = max(last_source_id, int(row["id"] or 0))
        record = sqlite_repo._record_from_lvr_row(row)
        if not record["address_raw"] or not record["address_normalized"]:
            skipped += 1
            continue
        records.append(record)
        imported += 1
    if records:
        insert_transactions_batch(records, db_path=db_path)
    return {
        "ok": True,
        "backend": "postgis",
        "imported": imported,
        "skipped": skipped,
        "scanned": len(rows),
        "lastSourceId": last_source_id,
        "status": real_price_status(db_path),
    }


def insert_transaction(record: dict[str, Any], db_path: Path = DB_PATH) -> int:
    ensure_schema()
    payload = _prepare_insert_payload(record)
    sql = _insert_sql(returning=True)
    with _connect() as conn:
        row = conn.execute(sql, _insert_values(payload)).fetchone()
        conn.commit()
    return int(row["id"]) if row else 0


def insert_transactions_batch(
    records: list[dict[str, Any]] | tuple[dict[str, Any], ...],
    db_path: Path = DB_PATH,
    update_conflicts: bool = True,
) -> int:
    ensure_schema()
    if not records:
        return 0
    rows = [_insert_values(_prepare_insert_payload(record)) for record in records]
    if len(rows) >= 500:
        _copy_insert_rows(rows, update_conflicts=update_conflicts)
        return len(rows)
    _executemany_insert_rows(rows, update_conflicts=update_conflicts)
    return len(rows)


def _executemany_insert_rows(rows: list[list[Any]], *, update_conflicts: bool) -> None:
    sql = _insert_sql(returning=False, update_conflicts=update_conflicts)
    with _connect() as conn:
        conn.execute("set synchronous_commit to off")
        with conn.cursor() as cur:
            cur.executemany(sql, rows)
        conn.commit()


def _copy_insert_rows(rows: list[list[Any]], *, update_conflicts: bool) -> None:
    copy_columns = INSERT_COLUMNS + ["_geom_lat", "_geom_lng", "_geom_point_lng", "_geom_point_lat"]
    temp_columns = ", ".join(
        [f"{column} { _copy_column_type(column) }" for column in INSERT_COLUMNS]
        + [
            "_geom_lat double precision",
            "_geom_lng double precision",
            "_geom_point_lng double precision",
            "_geom_point_lat double precision",
        ]
    )
    with _connect() as conn:
        conn.execute("set synchronous_commit to off")
        temp_table = "tmp_real_price_import"
        conn.execute(f"create temp table {temp_table} ({temp_columns}) on commit drop")
        with conn.cursor() as cur:
            with cur.copy(f"copy {temp_table} ({', '.join(copy_columns)}) from stdin") as copy:
                for row in rows:
                    copy.write_row(row)
        conn.execute(_copy_insert_sql(temp_table, update_conflicts=update_conflicts))
        conn.commit()


def _copy_column_type(column: str) -> str:
    mapping = {
        "floor_level": "integer",
        "total_floors": "integer",
        "rooms": "integer",
        "halls": "integer",
        "baths": "integer",
        "bathrooms": "integer",
        "has_management": "integer",
        "building_area_sqm": "numeric",
        "building_area_ping": "numeric",
        "parking_area_sqm": "numeric",
        "parking_area_ping": "numeric",
        "parking_price": "numeric",
        "land_area_sqm": "numeric",
        "land_area_ping": "numeric",
        "total_price": "numeric",
        "unit_price_sqm": "numeric",
        "unit_price_ping": "numeric",
        "building_age": "numeric",
        "lat": "double precision",
        "lng": "double precision",
        "geocode_confidence": "numeric",
        "transaction_date": "date",
        "completion_date": "date",
        "raw_json": "jsonb",
    }
    return mapping.get(column, "text")


def _copy_insert_sql(temp_table: str, *, update_conflicts: bool) -> str:
    assignments = ", ".join(
        [_upsert_assignment(column) for column in INSERT_COLUMNS if column not in {"source", "source_row_id"}]
        + ["geom = coalesce(excluded.geom, real_price_transactions.geom)", "updated_at = now()"]
    )
    select_columns = ", ".join(f"dedup.{column}" for column in INSERT_COLUMNS)
    dedup_columns = ", ".join(INSERT_COLUMNS)
    conflict_sql = f"do update set {assignments}" if update_conflicts else "do nothing"
    return f"""
        insert into real_price_transactions ({", ".join(INSERT_COLUMNS + ["geom"])})
        select
            {select_columns},
            case
                when dedup._geom_lat is not null and dedup._geom_lng is not null
                then ST_SetSRID(ST_MakePoint(dedup._geom_point_lng, dedup._geom_point_lat), 4326)::geography
                else null
            end as geom
        from (
            select distinct on (source, source_row_id)
                {dedup_columns}, _geom_lat, _geom_lng, _geom_point_lng, _geom_point_lat
            from {temp_table}
            order by source, source_row_id
        ) dedup
        on conflict(source, source_row_id) {conflict_sql}
    """


def _prepare_insert_payload(record: dict[str, Any]) -> dict[str, Any]:
    payload = dict(record)
    payload.setdefault("source", "moi_lvr")
    payload.setdefault("source_row_id", payload.get("raw_case_id") or payload.get("address_normalized") or "")
    payload["transaction_date"] = _pg_transaction_date_or_none(payload.get("transaction_date"))
    payload["completion_date"] = _pg_date_or_none(payload.get("completion_date"))
    if isinstance(payload.get("raw_json"), (dict, list)):
        payload["raw_json"] = json.dumps(payload["raw_json"], ensure_ascii=False, sort_keys=True)
    return payload


def _insert_values(payload: dict[str, Any]) -> list[Any]:
    values = [_pg_value(payload.get(column)) for column in INSERT_COLUMNS]
    lat = _pg_value(payload.get("lat"))
    lng = _pg_value(payload.get("lng"))
    return values + [lat, lng, lng, lat]


def _insert_sql(*, returning: bool, update_conflicts: bool = True) -> str:
    insert_columns = INSERT_COLUMNS + ["geom"]
    value_placeholders = ["%s"] * len(INSERT_COLUMNS)
    value_placeholders.append(
        "case when %s::double precision is not null and %s::double precision is not null "
        "then ST_SetSRID(ST_MakePoint(%s::double precision, %s::double precision), 4326)::geography else null end"
    )
    assignments = ", ".join(
        [_upsert_assignment(column) for column in INSERT_COLUMNS if column not in {"source", "source_row_id"}]
        + ["geom = coalesce(excluded.geom, real_price_transactions.geom)", "updated_at = now()"]
    )
    return_clause = "returning id" if returning else ""
    conflict_sql = f"do update set {assignments}" if update_conflicts else "do nothing"
    return f"""
        insert into real_price_transactions ({", ".join(insert_columns)})
        values ({", ".join(value_placeholders)})
        on conflict(source, source_row_id) {conflict_sql}
        {return_clause}
    """


def _upsert_assignment(column: str) -> str:
    if column == "raw_json":
        return "raw_json = excluded.raw_json"
    if column == "geocode_status":
        return (
            "geocode_status = case "
            "when real_price_transactions.geocode_status = 'ok' and excluded.lat is null and excluded.lng is null "
            "then real_price_transactions.geocode_status else excluded.geocode_status end"
        )
    if column in {"lat", "lng", "geocode_provider", "geocode_confidence", "geocode_error"}:
        return f"{column} = coalesce(excluded.{column}, real_price_transactions.{column})"
    return f"{column} = excluded.{column}"


def update_transaction_geocode(
    transaction_id: int,
    *,
    lat: float | None,
    lng: float | None,
    status: str,
    provider: str | None = None,
    confidence: float | None = None,
    error: str | None = None,
    db_path: Path = DB_PATH,
) -> None:
    ensure_schema()
    with _connect() as conn:
        conn.execute(
            """
            update real_price_transactions
            set lat = %s,
                lng = %s,
                geom = case
                    when %s::double precision is not null and %s::double precision is not null
                    then ST_SetSRID(ST_MakePoint(%s::double precision, %s::double precision), 4326)::geography
                    else null
                end,
                geocode_status = %s,
                geocode_provider = %s,
                geocode_confidence = %s,
                geocode_error = %s,
                updated_at = now()
            where id = %s
            """,
            [lat, lng, lat, lng, lng, lat, status, provider, confidence, error, int(transaction_id)],
        )
        conn.commit()


def update_transaction_geocodes_batch(
    updates: list[dict[str, Any]] | tuple[dict[str, Any], ...],
    *,
    db_path: Path = DB_PATH,
) -> int:
    ensure_schema()
    rows: list[list[Any]] = []
    for update in updates:
        transaction_id = update.get("id") or update.get("transaction_id") or update.get("transactionId")
        if transaction_id is None:
            continue
        lat = update.get("lat")
        lng = update.get("lng")
        status = str(update.get("status") or "pending")
        provider = update.get("provider")
        confidence = update.get("confidence")
        error = update.get("error")
        rows.append([lat, lng, lat, lng, lng, lat, status, provider, confidence, error, int(transaction_id)])
    if not rows:
        return 0
    with _connect() as conn:
        conn.execute("set synchronous_commit to off")
        with conn.cursor() as cur:
            cur.executemany(
                """
                update real_price_transactions
                set lat = %s,
                    lng = %s,
                    geom = case
                        when %s::double precision is not null and %s::double precision is not null
                        then ST_SetSRID(ST_MakePoint(%s::double precision, %s::double precision), 4326)::geography
                        else null
                    end,
                    geocode_status = %s,
                    geocode_provider = %s,
                    geocode_confidence = %s,
                    geocode_error = %s,
                    updated_at = now()
                where id = %s
                """,
                rows,
            )
        conn.commit()
    return len(rows)


def lookup_cache(address: str, db_path: Path = DB_PATH) -> GeocodeResult:
    normalized = normalize_address(address)
    if not normalized:
        return GeocodeResult(False, str(address or ""), "", status="invalid_address", error="missing address")
    ensure_schema()
    with _connect() as conn:
        row = conn.execute(
            """
            select address_raw, normalized_address, lat, lng, geocode_source,
                   geocode_confidence, geocode_status, geocode_error
            from address_coordinate_cache
            where normalized_address = %s
            """,
            [normalized],
        ).fetchone()
    if not row:
        return GeocodeResult(False, str(address or ""), normalized, status="not_found")
    ok = row.get("lat") is not None and row.get("lng") is not None and str(row.get("geocode_status") or "ok") == "ok"
    return GeocodeResult(
        ok=ok,
        address=str(row.get("address_raw") or address or ""),
        normalized_address=str(row.get("normalized_address") or normalized),
        lat=float(row["lat"]) if row.get("lat") is not None else None,
        lng=float(row["lng"]) if row.get("lng") is not None else None,
        confidence=float(row["geocode_confidence"]) if row.get("geocode_confidence") is not None else None,
        provider=str(row.get("geocode_source") or "postgis_cache"),
        status=str(row.get("geocode_status") or ("ok" if ok else "not_found")),
        error=row.get("geocode_error"),
    )


def write_cache(
    address: str,
    lat: float | None,
    lng: float | None,
    *,
    provider: str = "manual",
    confidence: float | None = 1.0,
    status: str = "ok",
    error: str | None = None,
    db_path: Path = DB_PATH,
) -> GeocodeResult:
    normalized = normalize_address(address)
    if not normalized:
        return GeocodeResult(False, str(address or ""), "", provider=provider, status="invalid_address", error="missing address")
    ensure_schema()
    with _connect() as conn:
        conn.execute(
            """
            insert into address_coordinate_cache (
                address_raw, normalized_address, lat, lng, geom, geocode_source,
                geocode_confidence, geocode_status, geocode_error, created_at, updated_at
            )
            values (
                %s, %s, %s, %s,
                case
                    when %s::double precision is not null and %s::double precision is not null
                    then ST_SetSRID(ST_MakePoint(%s::double precision, %s::double precision), 4326)::geography
                    else null
                end,
                %s, %s, %s, %s, now(), now()
            )
            on conflict(normalized_address) do update set
                address_raw = excluded.address_raw,
                lat = excluded.lat,
                lng = excluded.lng,
                geom = excluded.geom,
                geocode_source = excluded.geocode_source,
                geocode_confidence = excluded.geocode_confidence,
                geocode_status = excluded.geocode_status,
                geocode_error = excluded.geocode_error,
                updated_at = now()
            """,
            [address, normalized, lat, lng, lat, lng, lng, lat, provider, confidence, status, error],
        )
        conn.commit()
    return lookup_cache(address, db_path=db_path)


def write_cache_batch(
    entries: list[dict[str, Any]] | tuple[dict[str, Any], ...],
    *,
    db_path: Path = DB_PATH,
) -> int:
    ensure_schema()
    by_normalized: dict[str, list[Any]] = {}
    for entry in entries:
        address = str(entry.get("address") or entry.get("address_raw") or "")
        normalized = normalize_address(address)
        if not normalized:
            continue
        lat = entry.get("lat")
        lng = entry.get("lng")
        provider = str(entry.get("provider") or "manual")
        confidence = entry.get("confidence", 1.0)
        status = str(entry.get("status") or "ok")
        error = entry.get("error")
        by_normalized[normalized] = [
            address,
            normalized,
            lat,
            lng,
            lat,
            lng,
            lng,
            lat,
            provider,
            confidence,
            status,
            error,
        ]
    rows = list(by_normalized.values())
    if not rows:
        return 0
    with _connect() as conn:
        conn.execute("set synchronous_commit to off")
        with conn.cursor() as cur:
            cur.executemany(
                """
                insert into address_coordinate_cache (
                    address_raw, normalized_address, lat, lng, geom, geocode_source,
                    geocode_confidence, geocode_status, geocode_error, created_at, updated_at
                )
                values (
                    %s, %s, %s, %s,
                    case
                        when %s::double precision is not null and %s::double precision is not null
                        then ST_SetSRID(ST_MakePoint(%s::double precision, %s::double precision), 4326)::geography
                        else null
                    end,
                    %s, %s, %s, %s, now(), now()
                )
                on conflict(normalized_address) do update set
                    address_raw = excluded.address_raw,
                    lat = excluded.lat,
                    lng = excluded.lng,
                    geom = excluded.geom,
                    geocode_source = excluded.geocode_source,
                    geocode_confidence = excluded.geocode_confidence,
                    geocode_status = excluded.geocode_status,
                    geocode_error = excluded.geocode_error,
                    updated_at = now()
                """,
                rows,
            )
        conn.commit()
    return len(rows)


def geocode_address(address: str, *, db_path: Path = DB_PATH, provider: str = "auto") -> GeocodeResult:
    provider_name = str(provider or "auto").strip().lower()
    if provider_name in {"local", "real_price_transactions", "transactions"}:
        normalized = normalize_address(address)
        if not normalized:
            return GeocodeResult(False, str(address or ""), "", status="invalid_address", error="missing address")
    else:
        cached = lookup_cache(address, db_path=db_path)
        if cached.ok:
            return cached
        normalized = normalize_address(address)
    live_error: str | None = None
    if normalized and provider_name in {"auto", "self_hosted_nominatim", "nominatim"}:
        live = _geocode_with_local_nominatim(str(address or ""), normalized)
        if live.ok and live.lat is not None and live.lng is not None:
            return write_cache(
                str(address or normalized),
                live.lat,
                live.lng,
                provider=live.provider,
                confidence=live.confidence or 0.78,
                status="ok",
                error=None,
                db_path=db_path,
            )
        live_error = live.error
    local_match = _lookup_transaction_geocode(address=str(address or normalized), normalized=normalized)
    if local_match.ok and local_match.lat is not None and local_match.lng is not None:
        return write_cache(
            str(address or normalized),
            local_match.lat,
            local_match.lng,
            provider=local_match.provider,
            confidence=local_match.confidence or 0.72,
            status="ok",
            error=None,
            db_path=db_path,
        )
    approximate = _lookup_nearby_transaction_geocode(
        str(address or normalized),
        normalized,
        use_reference_point=provider_name not in {"local", "real_price_transactions", "transactions"},
    )
    if approximate.ok and approximate.lat is not None and approximate.lng is not None:
        return approximate
    if provider_name in {"local", "real_price_transactions", "transactions"}:
        return GeocodeResult(
            False,
            str(address or ""),
            normalized,
            provider="real_price_transactions",
            status="not_found",
            error="地址尚未有本地交易座標可供近似定位。",
        )
    road_match = _geocode_road_level_address(str(address or normalized), normalized)
    if road_match.ok and road_match.lat is not None and road_match.lng is not None:
        return road_match
    return GeocodeResult(
        False,
        str(address or ""),
        normalized,
        provider=provider if provider != "auto" else "postgis_cache",
        status="not_found",
        error=live_error or "地址尚未有 PostGIS 座標快取；自架 Nominatim ready 後會自動嘗試即時定位。",
    )


def _address_parts(normalized: str) -> dict[str, Any]:
    text = normalize_address(normalized)
    door = _DOORPLATE_RE.search(text)
    full_prefix = door.group("prefix") if door else ""
    number = int(door.group("number")) if door else None
    sub_number = int(door.group("sub")) if door and door.group("sub") else 0
    road_match = _ROAD_PREFIX_RE.search(full_prefix or text)
    road_prefix = road_match.group(1) if road_match else full_prefix
    city, district = parse_city_district(text)
    return {
        "normalized": text,
        "city": city,
        "district": district,
        "full_prefix": full_prefix,
        "road_prefix": road_prefix,
        "number": number,
        "sub_number": sub_number,
    }


def _coarse_address_queries(normalized: str) -> list[str]:
    parts = _address_parts(normalized)
    values = [
        parts.get("full_prefix") or "",
        parts.get("road_prefix") or "",
    ]
    output: list[str] = []
    for value in values:
        if value and value not in output and len(value) >= 4:
            output.append(value)
    return output


def _geocode_road_level_address(address: str, normalized: str) -> GeocodeResult:
    for query in _coarse_address_queries(normalized):
        result = _geocode_with_local_nominatim(address, query)
        if result.ok and result.lat is not None and result.lng is not None:
            return GeocodeResult(
                True,
                address,
                normalized,
                lat=result.lat,
                lng=result.lng,
                confidence=0.42,
                provider="self_hosted_nominatim_road",
                status="ok",
            )
    return GeocodeResult(False, address, normalized, provider="self_hosted_nominatim_road", status="not_found")


def _reference_point_for_address(address: str, normalized: str) -> tuple[float, float] | None:
    road_match = _geocode_road_level_address(address, normalized)
    if road_match.ok and road_match.lat is not None and road_match.lng is not None:
        return road_match.lat, road_match.lng
    return None


def _lookup_nearby_transaction_geocode(address: str, normalized: str, *, use_reference_point: bool = True) -> GeocodeResult:
    if not normalized:
        return GeocodeResult(False, address, normalized, provider="real_price_transactions_nearby", status="invalid_address")
    parts = _address_parts(normalized)
    prefixes = _coarse_address_queries(normalized)
    if not prefixes:
        return GeocodeResult(False, address, normalized, provider="real_price_transactions_nearby", status="not_found")
    where = [
        "lat is not null",
        "lng is not null",
        "geocode_status = 'ok'",
        "(" + " or ".join(["address_normalized like %s" for _ in prefixes]) + ")",
    ]
    params = [f"{prefix}%號%" for prefix in prefixes]
    if parts.get("city"):
        where.append("city = %s")
        params.append(parts["city"])
    if parts.get("district"):
        where.append("district = %s")
        params.append(parts["district"])
    sql = f"""
        select address_raw, address_normalized, lat, lng, geocode_provider, geocode_confidence, transaction_date, id
        from real_price_transactions
        where {" and ".join(where)}
        order by transaction_date desc nulls last, id desc
        limit 300
    """
    ensure_schema()
    with _connect() as conn:
        rows = [dict(row) for row in conn.execute(sql, params).fetchall()]
    if not rows:
        return GeocodeResult(False, address, normalized, provider="real_price_transactions_nearby", status="not_found")

    reference = _reference_point_for_address(address, normalized) if use_reference_point else None
    candidates: list[tuple[tuple[float, float, float, float, int], dict[str, Any], str, float | None]] = []
    target_number = parts.get("number")
    for row in rows:
        try:
            lat = float(row["lat"])
            lng = float(row["lng"])
        except (TypeError, ValueError):
            continue
        if not _valid_taiwan_coordinate(lat, lng):
            continue
        reference_distance = haversine_m(lat, lng, reference[0], reference[1]) if reference else None
        if reference_distance is not None and reference_distance > _MAX_APPROX_ADDRESS_DISTANCE_M:
            continue
        row_normalized = str(row.get("address_normalized") or "")
        row_parts = _address_parts(row_normalized)
        target_has_specific_prefix = bool(
            parts.get("full_prefix")
            and parts.get("road_prefix")
            and parts.get("full_prefix") != parts.get("road_prefix")
        )
        same_full_prefix = bool(target_has_specific_prefix and row_parts.get("full_prefix") == parts.get("full_prefix"))
        same_road_prefix = bool(parts.get("road_prefix") and row_parts.get("road_prefix") == parts.get("road_prefix"))
        prefix_rank = 0 if same_full_prefix else 1 if same_road_prefix else 2
        row_number = row_parts.get("number")
        number_delta = abs(float(row_number) - float(target_number)) if row_number is not None and target_number is not None else 9999.0
        parity_rank = (
            0.0
            if row_number is not None and target_number is not None and int(row_number) % 2 == int(target_number) % 2
            else 1.0
            if row_number is not None and target_number is not None
            else 2.0
        )
        score = (
            float(prefix_rank),
            parity_rank,
            number_delta,
            float(reference_distance if reference_distance is not None else 0.0),
            -int(row.get("id") or 0),
        )
        provider = "real_price_transactions_same_lane" if same_full_prefix else "real_price_transactions_same_road"
        candidates.append((score, row, provider, reference_distance))
    if not candidates:
        return GeocodeResult(False, address, normalized, provider="real_price_transactions_nearby", status="not_found")
    candidates.sort(key=lambda item: item[0])
    _, row, provider, reference_distance = candidates[0]
    confidence = 0.58 if provider.endswith("same_lane") else 0.48
    if reference_distance is not None and reference_distance > 1200:
        confidence -= 0.08
    return GeocodeResult(
        True,
        str(row.get("address_raw") or address or normalized),
        normalized,
        lat=float(row["lat"]),
        lng=float(row["lng"]),
        confidence=max(0.35, confidence),
        provider=provider,
        status="ok",
    )


def _lookup_transaction_geocode(*, address: str, normalized: str) -> GeocodeResult:
    if not normalized:
        return GeocodeResult(False, address, normalized, provider="real_price_transactions", status="invalid_address")
    ensure_schema()
    with _connect() as conn:
        row = conn.execute(
            """
            select address_raw, address_normalized, lat, lng, geocode_provider, geocode_confidence
            from real_price_transactions
            where address_normalized = %s
              and lat is not null
              and lng is not null
              and geocode_status = 'ok'
            order by transaction_date desc nulls last, id desc
            limit 1
            """,
            [normalized],
        ).fetchone()
    if not row:
        return GeocodeResult(False, address, normalized, provider="real_price_transactions", status="not_found")
    lat = float(row["lat"])
    lng = float(row["lng"])
    if not _valid_taiwan_coordinate(lat, lng):
        return GeocodeResult(False, address, normalized, provider="real_price_transactions", status="out_of_taiwan")
    return GeocodeResult(
        True,
        str(row.get("address_raw") or address or normalized),
        str(row.get("address_normalized") or normalized),
        lat=lat,
        lng=lng,
        confidence=float(row["geocode_confidence"]) if row.get("geocode_confidence") is not None else 0.72,
        provider=str(row.get("geocode_provider") or "real_price_transactions"),
        status="ok",
    )


def _geocode_with_local_nominatim(address: str, normalized: str) -> GeocodeResult:
    base_url = _local_nominatim_base_url()
    if not base_url:
        return GeocodeResult(False, address, normalized, provider="self_hosted_nominatim", status="disabled")
    params = urllib.parse.urlencode({"format": "json", "limit": "1", "countrycodes": "tw", "q": normalized})
    url = f"{base_url}/search?{params}"
    request = urllib.request.Request(url, headers={"User-Agent": "Found2RealPriceAddressLookup/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=4.0) as response:
            payload = json.loads(response.read().decode("utf-8", errors="replace") or "[]")
    except Exception as exc:
        return GeocodeResult(
            False,
            address,
            normalized,
            provider="self_hosted_nominatim",
            status="unavailable",
            error=f"self_hosted_nominatim_unavailable: {exc}",
        )
    if not isinstance(payload, list) or not payload:
        return GeocodeResult(False, address, normalized, provider="self_hosted_nominatim", status="not_found")
    item = payload[0]
    try:
        lat = float(item.get("lat"))
        lng = float(item.get("lon"))
    except (TypeError, ValueError, AttributeError):
        return GeocodeResult(False, address, normalized, provider="self_hosted_nominatim", status="invalid_response")
    if not _valid_taiwan_coordinate(lat, lng):
        return GeocodeResult(False, address, normalized, provider="self_hosted_nominatim", status="out_of_taiwan")
    return GeocodeResult(
        True,
        address,
        normalized,
        lat=lat,
        lng=lng,
        confidence=0.78,
        provider="self_hosted_nominatim",
        status="ok",
    )


def _local_nominatim_base_url() -> str:
    raw = os.environ.get("NOMINATIM_BASE_URL") or os.environ.get("NOMINATIM_URL") or "http://127.0.0.1:8088"
    base_url = str(raw or "").strip().rstrip("/")
    if not base_url or "nominatim.openstreetmap.org" in base_url:
        return ""
    return base_url


def _valid_taiwan_coordinate(lat: float, lng: float) -> bool:
    return 21.5 <= lat <= 26.7 and 118.0 <= lng <= 123.5


def pending_geocode_items(
    limit: int = 1000,
    *,
    city: str | None = None,
    district: str | None = None,
    db_path: Path = DB_PATH,
) -> list[dict[str, Any]]:
    ensure_schema()
    where = [
        "(lat is null or lng is null or geom is null)",
        "geocode_status = 'pending'",
        "address_normalized is not null",
        "address_normalized <> ''",
        "address_normalized not like '%%地號%%'",
        "address_normalized like '%%號%%'",
    ]
    params: list[Any] = []
    if city:
        where.append("city in (%s, %s)")
        params.extend(sqlite_repo._city_variants(city))
    if district:
        where.append("district = %s")
        params.append(district)
    params.append(max(1, min(int(limit), 10000)))
    with _connect() as conn:
        rows = conn.execute(
            f"""
            with candidates as (
                select distinct on (address_normalized)
                    id, city, district, address_raw, address_normalized
                from real_price_transactions
                where {" and ".join(where)}
                order by address_normalized, id
            )
            select id, city, district, address_raw, address_normalized
            from candidates
            order by id
            limit %s
            """,
            params,
        ).fetchall()
    items: list[dict[str, Any]] = []
    for row in rows:
        normalized = str(row.get("address_normalized") or "")
        geocode_address_value = _geocode_address_for_row(row)
        items.append(
            {
                "id": row.get("id"),
                "city": row.get("city"),
                "district": row.get("district"),
                "address": row.get("address_raw"),
                "address_raw": row.get("address_raw"),
                "address_normalized": normalized,
                "addressNormalized": normalized,
                "geocodeAddress": geocode_address_value,
                "geocode_address": geocode_address_value,
            }
        )
    return items


def apply_geocode_cache_to_transactions(
    db_path: Path = DB_PATH,
    *,
    limit: int | None = None,
    city: str | None = None,
    district: str | None = None,
    dry_run: bool = False,
    mode: str = "replace",
    refresh_stats: bool = False,
    sample_limit: int = 8,
    return_summary: bool = False,
) -> int | dict[str, Any]:
    ensure_schema()
    mode = str(mode or "replace").strip().lower()
    if mode not in {"replace", "missing"}:
        raise ValueError("mode must be 'missing' or 'replace'")
    if not return_summary and not dry_run and limit is None and not city and not district and mode == "replace":
        with _connect() as conn:
            cur = conn.execute(
                """
                update real_price_transactions t
                set lat = c.lat,
                    lng = c.lng,
                    geom = c.geom,
                    geocode_status = 'ok',
                    geocode_provider = c.geocode_source,
                    geocode_confidence = c.geocode_confidence,
                    geocode_error = null,
                    updated_at = now()
                from address_coordinate_cache c
                where t.address_normalized = c.normalized_address
                  and c.lat is not null
                  and c.lng is not null
                  and c.geocode_status = 'ok'
                  and (
                    t.geocode_status <> 'ok'
                    or t.lat is distinct from c.lat
                    or t.lng is distinct from c.lng
                    or t.geom is null
                  )
                """
            )
            applied = int(cur.rowcount or 0)
            conn.commit()
        if refresh_stats and applied:
            refresh_real_price_stats(db_path)
        return applied

    where, params = _geocode_cache_apply_filters(city=city, district=district, mode=mode)
    limit_value = None if limit is None else max(1, min(int(limit), 100000))
    sample_value = max(0, min(int(sample_limit or 0), 50))
    summary: dict[str, Any] = {
        "ok": True,
        "backend": "postgis",
        "dryRun": bool(dry_run),
        "mode": mode,
        "limit": limit_value,
        "city": city,
        "district": district,
        "matchedRows": 0,
        "matchedAddresses": 0,
        "appliedRows": 0,
        "remainingRows": 0,
        "samples": [],
        "citySummary": [],
        "stats": None,
    }
    with _connect() as conn:
        count_row = conn.execute(
            """
            select count(*) as rows, count(distinct t.address_normalized) as addresses
            from real_price_transactions t
            join address_coordinate_cache c on t.address_normalized = c.normalized_address
            where {where}
            """.format(where=where),
            params,
        ).fetchone()
        summary["matchedRows"] = int((count_row or {}).get("rows") or 0)
        summary["matchedAddresses"] = int((count_row or {}).get("addresses") or 0)
        if sample_value:
            sample_params = [*params, sample_value]
            samples = conn.execute(
                """
                select
                    t.id,
                    t.city,
                    t.district,
                    t.address_raw,
                    t.address_normalized,
                    t.lat as current_lat,
                    t.lng as current_lng,
                    c.lat as cache_lat,
                    c.lng as cache_lng,
                    c.geocode_source,
                    c.geocode_confidence
                from real_price_transactions t
                join address_coordinate_cache c on t.address_normalized = c.normalized_address
                where {where}
                order by t.id
                limit %s
                """.format(where=where),
                sample_params,
            ).fetchall()
            summary["samples"] = [_normalize_row(row) for row in samples]
        city_rows = conn.execute(
            """
            select coalesce(t.city, '') as city, count(*) as rows, count(distinct t.address_normalized) as addresses
            from real_price_transactions t
            join address_coordinate_cache c on t.address_normalized = c.normalized_address
            where t.address_normalized = c.normalized_address
              and {where}
            group by coalesce(t.city, '')
            order by rows desc
            limit 12
            """.format(where=where),
            params,
        ).fetchall()
        summary["citySummary"] = [_normalize_row(row) for row in city_rows]
        if dry_run:
            return summary

        limit_sql = "limit %s" if limit_value is not None else ""
        update_params = [*params]
        if limit_value is not None:
            update_params.append(limit_value)
        cur = conn.execute(
            """
            with matched as (
                select
                    t.id,
                    c.lat,
                    c.lng,
                    c.geom,
                    c.geocode_source,
                    c.geocode_confidence
                from real_price_transactions t
                join address_coordinate_cache c on t.address_normalized = c.normalized_address
                where {where}
                order by t.id
                {limit_sql}
            )
            update real_price_transactions t
            set lat = matched.lat,
                lng = matched.lng,
                geom = matched.geom,
                geocode_status = 'ok',
                geocode_provider = matched.geocode_source,
                geocode_confidence = matched.geocode_confidence,
                geocode_error = null,
                updated_at = now()
            from matched
            where t.id = matched.id
            """.format(where=where, limit_sql=limit_sql),
            update_params,
        )
        summary["appliedRows"] = int(cur.rowcount or 0)
        conn.commit()
    if refresh_stats and summary["appliedRows"]:
        summary["stats"] = refresh_real_price_stats(db_path)
    with _connect() as conn:
        remaining_row = conn.execute(
            """
            select count(*) as rows
            from real_price_transactions t
            join address_coordinate_cache c on t.address_normalized = c.normalized_address
            where {where}
            """.format(where=where),
            params,
        ).fetchone()
        summary["remainingRows"] = int((remaining_row or {}).get("rows") or 0)
    return summary if return_summary else int(summary["appliedRows"])


def _geocode_cache_apply_filters(*, city: str | None, district: str | None, mode: str) -> tuple[str, list[Any]]:
    where = [
        "c.lat is not null",
        "c.lng is not null",
        "c.geocode_status = 'ok'",
    ]
    if mode == "missing":
        where.append("(t.lat is null or t.lng is null or t.geom is null)")
    else:
        where.append(
            "("
            "t.geocode_status <> 'ok' "
            "or t.lat is distinct from c.lat "
            "or t.lng is distinct from c.lng "
            "or t.geom is null"
            ")"
        )
    params: list[Any] = []
    city_text = str(city or "").strip()
    if city_text:
        where.append("t.city in (%s, %s)")
        params.extend(sqlite_repo._city_variants(city_text))
    district_text = str(district or "").strip()
    if district_text:
        where.append("t.district = %s")
        params.append(district_text)
    return " and ".join(where), params


def query_nearby(
    lat: float,
    lng: float,
    *,
    radius_km: float,
    limit: int,
    sort: str,
    filters: dict[str, Any] | None = None,
    db_path: Path = DB_PATH,
) -> list[dict[str, Any]]:
    ensure_schema()
    radius_m = float(radius_km) * 1000
    point_sql = "ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography"
    where = ["geom is not null", f"ST_DWithin(geom, {point_sql}, %s)"]
    where_params: list[Any] = [lng, lat, radius_m]
    _append_filters(where, where_params, filters or {})
    order_sql, order_params = _nearby_order_clause(sort)
    sql = f"""
        select *, ST_Distance(geom, {point_sql}) as distance_m
        from real_price_transactions
        where {" and ".join(where)}
        {order_sql}
        limit %s
    """
    with _connect() as conn:
        rows = conn.execute(sql, [lng, lat] + where_params + order_params + [limit]).fetchall()
    return [sqlite_repo._row_to_item(_normalize_row(row), float(row.get("distance_m") or 0)) for row in rows]


def query_map_search(
    filters: dict[str, Any] | None = None,
    *,
    page: int = 1,
    page_size: int = 50,
    sort: str = "transaction_date_desc",
    db_path: Path = DB_PATH,
) -> dict[str, Any]:
    ensure_schema()
    filters = filters or {}
    page = max(1, int(page or 1))
    page_size = max(1, min(int(page_size or 50), 500))
    where: list[str] = []
    params: list[Any] = []
    if _truthy(filters.get("geocoded_only") or filters.get("geocodedOnly")):
        where.append("geom is not null and lat is not null and lng is not null")
    bbox = sqlite_repo._bbox_from_filters(filters)
    if bbox:
        where.append("lat between %s and %s and lng between %s and %s")
        params.extend([bbox["south"], bbox["north"], bbox["west"], bbox["east"]])
    _append_map_filters(where, params, filters)
    where_sql = f"where {' and '.join(where)}" if where else ""
    order_sql, order_params = _map_order_clause(sort, filters)
    count_sql = f"select count(*) from real_price_transactions {where_sql}"
    offset = (page - 1) * page_size
    fetch_limit = page_size + 1
    sql = f"""
        select *
        from real_price_transactions
        {where_sql}
        {order_sql}
        limit %s offset %s
    """
    with _connect() as conn:
        total, total_estimated = _map_total_count(
            conn,
            count_sql,
            params,
            where_sql=where_sql,
            exact_total=_truthy(filters.get("exact_total") or filters.get("exactTotal")),
            has_bbox=bool(bbox),
        )
        rows = conn.execute(sql, params + order_params + [fetch_limit, offset]).fetchall()
    has_more = len(rows) > page_size
    rows = rows[:page_size]
    if total_estimated:
        total = max(total, offset + len(rows) + (1 if has_more else 0))
    center = sqlite_repo._center_from_filters(filters)
    items = [sqlite_repo._row_to_map_item(_normalize_row(row), center=center) for row in rows]
    return {
        "ok": True,
        "backend": "postgis",
        "items": items,
        "total": total,
        "totalEstimated": total_estimated,
        "total_estimated": total_estimated,
        "page": page,
        "page_size": page_size,
        "pageSize": page_size,
        "hasMore": has_more,
        "has_more": has_more,
        "bbox": bbox,
        "geocodedCount": sum(1 for item in items if item.get("lat") is not None and item.get("lng") is not None),
        "sort": sort,
    }


def query_map_clusters(
    filters: dict[str, Any] | None = None,
    *,
    grid_size: int = 500,
    limit: int = 2000,
    db_path: Path = DB_PATH,
) -> list[dict[str, Any]]:
    ensure_schema()
    filters = filters or {}
    where = ["geom is not null", "lat is not null", "lng is not null"]
    params: list[Any] = []
    bbox = sqlite_repo._bbox_from_filters(filters)
    if bbox:
        where.append("lat between %s and %s and lng between %s and %s")
        params.extend([bbox["south"], bbox["north"], bbox["west"], bbox["east"]])
    _append_map_filters(where, params, filters)
    precision = max(50, min(int(grid_size or 500), 5000))
    sql = f"""
        select
            round(avg(lat)::numeric, 7)::float as lat,
            round(avg(lng)::numeric, 7)::float as lng,
            count(*)::int as count,
            avg(unit_price_ping)::float as avg_unit_price_raw_ping,
            avg(total_price)::float as avg_total_price
        from real_price_transactions
        where {" and ".join(where)}
        group by floor(lat * %s)::int, floor(lng * %s)::int
        order by count(*) desc
        limit %s
    """
    with _connect() as conn:
        rows = conn.execute(sql, params + [precision, precision, max(1, min(int(limit or 2000), 5000))]).fetchall()
    clusters: list[dict[str, Any]] = []
    for row in rows:
        avg_unit = sqlite_repo._safe_float(row.get("avg_unit_price_raw_ping"))
        clusters.append(
            {
                "lat": row.get("lat"),
                "lng": row.get("lng"),
                "count": int(row.get("count") or 0),
                "avg_unit_price_ping": round(avg_unit / 10000, 3) if avg_unit is not None else None,
                "avg_unit_price_raw_ping": avg_unit,
                "avg_total_price": sqlite_repo._safe_float(row.get("avg_total_price")),
            }
        )
    return clusters


def lookup_transaction_location(payload: dict[str, Any], db_path: Path = DB_PATH) -> GeocodeResult:
    sq = str(payload.get("sq") or payload.get("caseId") or payload.get("rawCaseId") or "").strip()
    address = str(payload.get("address") or "").strip()
    normalized = normalize_address(address)
    if sq:
        row = _lookup_transaction_location_row(
            "(raw_case_id = %s or source_row_id = %s)",
            [sq, sq],
        )
        if row:
            return _location_result_from_row(row, address or sq, provider="official_case")
    if normalized:
        row = _lookup_transaction_location_row("address_normalized = %s", [normalized])
        if row:
            return _location_result_from_row(row, address, provider="official_case_address")
    approximate = _lookup_nearby_transaction_geocode(address, normalized)
    if approximate.ok and approximate.lat is not None and approximate.lng is not None:
        return GeocodeResult(
            True,
            approximate.address,
            normalized,
            lat=approximate.lat,
            lng=approximate.lng,
            confidence=approximate.confidence,
            provider=f"official_case_{approximate.provider}",
            status="ok",
        )
    road_match = _geocode_road_level_address(address, normalized)
    if road_match.ok and road_match.lat is not None and road_match.lng is not None:
        return GeocodeResult(
            True,
            road_match.address,
            normalized,
            lat=road_match.lat,
            lng=road_match.lng,
            confidence=road_match.confidence,
            provider="official_case_self_hosted_nominatim_road",
            status="ok",
        )
    return GeocodeResult(False, address, normalized, provider="official_case", status="not_found", error="official case has no cached coordinates")


def _lookup_transaction_location_row(condition_sql: str, params: list[Any]) -> dict[str, Any] | None:
    ensure_schema()
    sql = f"""
        select *
        from real_price_transactions
        where lat is not null
          and lng is not null
          and geocode_status = 'ok'
          and {condition_sql}
        order by transaction_date desc nulls last, id desc
        limit 1
    """
    with _connect() as conn:
        row = conn.execute(sql, params).fetchone()
    if not row:
        return None
    lat = float(row["lat"])
    lng = float(row["lng"])
    if not _valid_taiwan_coordinate(lat, lng):
        return None
    return dict(row)


def _location_result_from_row(row: dict[str, Any], address: str, *, provider: str) -> GeocodeResult:
    return GeocodeResult(
        True,
        str(row.get("address_raw") or address or ""),
        str(row.get("address_normalized") or normalize_address(address)),
        lat=float(row["lat"]),
        lng=float(row["lng"]),
        confidence=float(row["geocode_confidence"]) if row.get("geocode_confidence") is not None else 0.85,
        provider=provider,
        status="ok",
    )


def get_case_detail(case_id: int, *, db_path: Path = DB_PATH) -> dict[str, Any] | None:
    ensure_schema()
    with _connect() as conn:
        row = conn.execute("select * from real_price_transactions where id = %s", [int(case_id)]).fetchone()
    if row is None:
        return None
    normalized = _normalize_row(row)
    item = sqlite_repo._row_to_map_item(normalized)
    item.update(
        {
            "land_area_sqm": sqlite_repo._safe_float(normalized["land_area_sqm"]),
            "land_area_ping": sqlite_repo._safe_float(normalized["land_area_ping"]),
            "building_area_sqm": sqlite_repo._safe_float(normalized["building_area_sqm"]),
            "parking_area_sqm": sqlite_repo._safe_float(normalized["parking_area_sqm"]),
            "unit_price_sqm": sqlite_repo._safe_float(normalized["unit_price_sqm"]),
            "main_material": normalized["main_material"],
            "floor_level": normalized["floor_level"],
            "floorLevel": normalized["floor_level"],
            "completion_date": normalized["completion_date"],
            "completionDate": normalized["completion_date"],
            "completion_date_raw": normalized["completion_date_raw"],
            "geocode_status": normalized["geocode_status"],
            "geocode_provider": normalized["geocode_provider"],
            "geocode_confidence": sqlite_repo._safe_float(normalized["geocode_confidence"]),
            "geocode_error": normalized["geocode_error"],
            "raw_case_id": normalized["raw_case_id"],
            "rawCaseId": normalized["raw_case_id"],
        }
    )
    return item


def _append_filters(where: list[str], params: list[Any], filters: dict[str, Any]) -> None:
    source_type = sqlite_repo._normalize_source_type(filters.get("source_type") or filters.get("sourceType"))
    if source_type:
        where.append("(source_type = %s or source_type is null or source_type = '')")
        params.append(source_type)
    city = str(filters.get("city") or "").strip()
    if city:
        where.append("city in (%s, %s)")
        params.extend(sqlite_repo._city_variants(city))
    district = str(filters.get("district") or "").strip()
    if district:
        where.append("district = %s")
        params.append(district)
    target_types = sqlite_repo._list_filter(filters.get("target_types") or filters.get("targetTypes"))
    if target_types:
        target_clauses = []
        for target in target_types:
            target_clauses.append("transaction_target like %s")
            params.append(f"%{target}%")
            if target == "房地":
                target_clauses.append("((transaction_target is null or transaction_target = '') and address_raw not like '%%地號%%')")
        where.append(f"({' or '.join(target_clauses)})")
    exclude_special = str(filters.get("exclude_special") or filters.get("excludeSpecial") or "").lower()
    if exclude_special in {"1", "true", "yes", "on"}:
        where.append(
            "(note is null or (note not like '%%親友%%' and note not like '%%員工%%' and note not like '%%共有人%%' "
            "and note not like '%%特殊關係%%' and note not like '%%急買急賣%%' and note not like '%%瑕疵%%'))"
        )
    building_type = str(filters.get("buildingType") or filters.get("building_type") or "").strip()
    if building_type:
        where.append("(building_type = %s or building_state = %s)")
        params.extend([building_type, building_type])
    main_use = str(filters.get("mainUse") or filters.get("main_use") or "").strip()
    if main_use:
        where.append("main_use like %s")
        params.append(f"%{main_use}%")
    for key, column, op in [
        ("minTotalPrice", "total_price", ">="),
        ("maxTotalPrice", "total_price", "<="),
        ("minUnitPriceWanPing", "unit_price_ping", ">="),
        ("maxUnitPriceWanPing", "unit_price_ping", "<="),
        ("minAreaPing", "building_area_ping", ">="),
        ("maxAreaPing", "building_area_ping", "<="),
    ]:
        value = sqlite_repo._to_float(filters.get(key, filters.get(sqlite_repo._camel_to_snake(key))))
        if value is None:
            continue
        if key.endswith("UnitPriceWanPing"):
            value *= 10000
        where.append(f"{column} {op} %s")
        params.append(value)
    within_months = sqlite_repo._to_float(filters.get("withinMonths", filters.get("within_months")))
    if within_months is not None and within_months > 0:
        cutoff = date.today() - sqlite_repo.timedelta(days=int(within_months * 31))
        where.append("transaction_date >= %s")
        params.append(cutoff.isoformat())


def _append_map_filters(where: list[str], params: list[Any], filters: dict[str, Any]) -> None:
    source_type = sqlite_repo._normalize_source_type(filters.get("source_type") or filters.get("sourceType"))
    if source_type:
        where.append("(source_type = %s or source_type is null or source_type = '')")
        params.append(source_type)
    city = str(filters.get("city") or "").strip()
    if city:
        where.append("city in (%s, %s)")
        params.extend(sqlite_repo._city_variants(city))
    district = str(filters.get("district") or "").strip()
    if district:
        where.append("district = %s")
        params.append(district)
    community_raw = str(filters.get("community") or filters.get("community_name") or filters.get("communityName") or "").strip()
    if community_raw:
        community = normalize_address(community_raw)
        if community:
            where.append("(community_name like %s or address_normalized like %s)")
            params.extend([f"%{community_raw}%", f"%{community}%"])
        else:
            where.append("community_name like %s")
            params.append(f"%{community_raw}%")
    road_raw = filters.get("road") or filters.get("address") or ""
    road = normalize_address(road_raw)
    if road:
        if _truthy(filters.get("include_raw_address_search") or filters.get("includeRawAddressSearch")):
            where.append("(address_normalized like %s or address_raw like %s)")
            params.extend([f"%{road}%", f"%{road_raw}%"])
        else:
            where.append("address_normalized like %s")
            params.append(f"%{road}%")
    target_types = sqlite_repo._list_filter(filters.get("target_types") or filters.get("targetTypes"))
    if target_types:
        target_clauses = []
        for target in target_types:
            target_clauses.append("transaction_target like %s")
            params.append(f"%{target}%")
            if target == "房地":
                target_clauses.append("((transaction_target is null or transaction_target = '') and address_raw not like '%%地號%%')")
        where.append(f"({' or '.join(target_clauses)})")
    for key, column, op in [
        ("start_date", "transaction_date", ">="),
        ("end_date", "transaction_date", "<="),
        ("min_total_price", "total_price", ">="),
        ("max_total_price", "total_price", "<="),
        ("min_unit_price_ping", "unit_price_ping", ">="),
        ("max_unit_price_ping", "unit_price_ping", "<="),
        ("min_area_ping", "building_area_ping", ">="),
        ("max_area_ping", "building_area_ping", "<="),
        ("min_house_age", "building_age", ">="),
        ("max_house_age", "building_age", "<="),
    ]:
        value = filters.get(key)
        if key.endswith("_date"):
            text = str(value or "").strip()
            if text:
                where.append(f"{column} {op} %s")
                params.append(text)
            continue
        number = sqlite_repo._to_float(value)
        if number is not None:
            where.append(f"{column} {op} %s")
            params.append(number)
    exclude_special = str(filters.get("exclude_special") or filters.get("excludeSpecial") or "").lower()
    if exclude_special in {"1", "true", "yes", "on"}:
        where.append(
            "(note is null or (note not like '%%親友%%' and note not like '%%員工%%' and note not like '%%共有人%%' "
            "and note not like '%%特殊關係%%' and note not like '%%急買急賣%%' and note not like '%%瑕疵%%'))"
        )


def _nearby_order_clause(sort: str) -> tuple[str, list[Any]]:
    mapping = {
        "date_desc": "order by transaction_date desc nulls last, distance_m asc",
        "unit_price_desc": "order by unit_price_ping desc nulls last, transaction_date desc nulls last",
        "unit_price_asc": "order by unit_price_ping asc nulls last, distance_m asc",
        "total_price_desc": "order by total_price desc nulls last, transaction_date desc nulls last",
        "total_price_asc": "order by total_price asc nulls last, distance_m asc",
        "area_desc": "order by building_area_ping desc nulls last, transaction_date desc nulls last",
        "area_asc": "order by building_area_ping asc nulls last, distance_m asc",
    }
    return mapping.get(str(sort or ""), "order by distance_m asc, transaction_date desc nulls last"), []


def _map_order_clause(sort: str, filters: dict[str, Any]) -> tuple[str, list[Any]]:
    if sort == "distance_asc" and sqlite_repo._center_from_filters(filters):
        lat, lng = sqlite_repo._center_from_filters(filters) or (0.0, 0.0)
        return "order by ST_Distance(geom, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography) asc nulls last", [lng, lat]
    mapping = {
        "transaction_date_asc": "transaction_date asc nulls last",
        "transaction_date_desc": "transaction_date desc nulls last",
        "total_price_asc": "total_price asc nulls last",
        "total_price_desc": "total_price desc nulls last",
        "unit_price_asc": "unit_price_ping asc nulls last",
        "unit_price_desc": "unit_price_ping desc nulls last",
        "area_asc": "building_area_ping asc nulls last",
        "area_desc": "building_area_ping desc nulls last",
    }
    return f"order by {mapping.get(str(sort or ''), 'transaction_date desc nulls last')}", []


def _geocode_address_for_row(row: dict[str, Any]) -> str:
    normalized = str(row.get("address_normalized") or "").strip()
    city = str(row.get("city") or "").strip()
    district = str(row.get("district") or "").strip()
    if city and normalized.startswith(city):
        return normalized
    if city and district and normalized.startswith(district):
        return f"{city}{normalized}"
    if city and district:
        return f"{city}{district}{normalized}"
    if city:
        return f"{city}{normalized}"
    return normalized


def _normalize_row(row: dict[str, Any]) -> dict[str, Any]:
    return {key: _normalize_value(value) for key, value in dict(row).items()}


def _normalize_value(value: Any) -> Any:
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    if isinstance(value, (date, datetime)):
        return value.date().isoformat() if isinstance(value, datetime) else value.isoformat()
    return value


def _pg_value(value: Any) -> Any:
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, sort_keys=True)
    if value == "":
        return None
    return value


def _pg_date_or_none(value: Any) -> Any:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    text = str(value or "").strip()
    if not text:
        return None
    try:
        parsed = datetime.strptime(text, "%Y-%m-%d").date()
    except ValueError:
        return None
    if parsed.year < 1800 or parsed.year > 2100:
        return None
    return parsed.isoformat()


def _pg_transaction_date_or_none(value: Any) -> Any:
    parsed_text = _pg_date_or_none(value)
    if not parsed_text:
        return None
    parsed = datetime.strptime(parsed_text, "%Y-%m-%d").date()
    if parsed > date.today():
        return None
    return parsed_text


def _map_total_count(
    conn: Any,
    count_sql: str,
    params: list[Any],
    *,
    where_sql: str,
    exact_total: bool = False,
    has_bbox: bool = False,
) -> tuple[int, bool]:
    if not where_sql and not params:
        return _cached_table_count(conn, "real_price_transactions"), False
    if exact_total:
        return _count(conn, count_sql, params), False
    estimated = _estimated_map_count(conn, where_sql=where_sql, params=params)
    return estimated, True


def _estimated_map_count(conn: Any, *, where_sql: str, params: list[Any]) -> int:
    try:
        row = conn.execute(f"explain (format json) select 1 from real_price_transactions {where_sql}", params).fetchone()
        payload = row.get("QUERY PLAN") if row else None
        if isinstance(payload, str):
            payload = json.loads(payload)
        plan = payload[0].get("Plan", {}) if isinstance(payload, list) and payload else {}
        rows = int(plan.get("Plan Rows") or 0)
        return max(0, rows)
    except Exception:
        return 0


def _truthy(value: Any) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}
