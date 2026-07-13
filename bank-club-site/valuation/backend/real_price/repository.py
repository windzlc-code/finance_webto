from __future__ import annotations

import json
import sqlite3
from datetime import date, timedelta
from pathlib import Path
from typing import Any

from lvr_open_data_backend import DB_PATH, PING_PER_M2

from .address_normalizer import chinese_number_to_int, normalize_address
from .distance import bounding_box, haversine_m
from .geocoder import ensure_geocode_cache
from .geocoder import GeocodeResult


MAX_SQL_FETCH = 5000

_COLUMN_DEFS: dict[str, str] = {
    "source": "text not null default 'moi_lvr'",
    "source_type": "text",
    "source_file": "text",
    "source_row_id": "text",
    "city": "text",
    "district": "text",
    "address_raw": "text not null default ''",
    "address_normalized": "text",
    "transaction_target": "text",
    "community_name": "text",
    "transaction_date": "text",
    "transaction_date_raw": "text",
    "building_type": "text",
    "building_state": "text",
    "main_use": "text",
    "main_material": "text",
    "floor": "text",
    "floor_raw": "text",
    "floor_level": "integer",
    "total_floors": "integer",
    "building_area_sqm": "real",
    "building_area_ping": "real",
    "parking_area_sqm": "real",
    "parking_area_ping": "real",
    "parking_price": "integer",
    "parking_type": "text",
    "land_area_sqm": "real",
    "land_area_ping": "real",
    "total_price": "integer",
    "unit_price_sqm": "real",
    "unit_price_ping": "real",
    "rooms": "integer",
    "halls": "integer",
    "baths": "integer",
    "bathrooms": "integer",
    "has_management": "integer",
    "completion_date": "text",
    "completion_date_raw": "text",
    "building_age": "real",
    "note": "text",
    "lat": "real",
    "lng": "real",
    "geocode_status": "text not null default 'pending'",
    "geocode_provider": "text",
    "geocode_confidence": "real",
    "geocode_error": "text",
    "raw_case_id": "text",
    "raw_json": "text",
    "imported_at": "text not null default current_timestamp",
    "created_at": "text",
    "updated_at": "text",
}


def connect(db_path: Path = DB_PATH) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)
    return conn


def ensure_schema(conn: sqlite3.Connection) -> None:
    ensure_geocode_cache(conn)
    conn.executescript(
        """
        create table if not exists real_price_transactions (
            id integer primary key autoincrement,
            source text not null default 'moi_lvr',
            source_type text,
            source_file text,
            source_row_id text,
            city text,
            district text,
            address_raw text not null,
            address_normalized text,
            transaction_target text,
            community_name text,
            transaction_date text,
            transaction_date_raw text,
            building_type text,
            building_state text,
            main_use text,
            main_material text,
            floor text,
            floor_raw text,
            floor_level integer,
            total_floors integer,
            building_area_sqm real,
            building_area_ping real,
            parking_area_sqm real,
            parking_area_ping real,
            parking_price integer,
            parking_type text,
            land_area_sqm real,
            land_area_ping real,
            total_price integer,
            unit_price_sqm real,
            unit_price_ping real,
            rooms integer,
            halls integer,
            baths integer,
            bathrooms integer,
            has_management integer,
            completion_date text,
            completion_date_raw text,
            building_age real,
            note text,
            lat real,
            lng real,
            geocode_status text not null default 'pending',
            geocode_provider text,
            geocode_confidence real,
            geocode_error text,
            raw_case_id text,
            raw_json text,
            imported_at text not null default current_timestamp,
            created_at text default current_timestamp,
            updated_at text default current_timestamp
        );

        create unique index if not exists ux_real_price_source_row
            on real_price_transactions(source, source_row_id);
        create index if not exists idx_real_price_city_district
            on real_price_transactions(city, district);
        create index if not exists idx_real_price_date
            on real_price_transactions(transaction_date);
        create index if not exists idx_real_price_unit_price_ping
            on real_price_transactions(unit_price_ping);
        create index if not exists idx_real_price_lat_lng
            on real_price_transactions(lat, lng);
        create index if not exists idx_real_price_geocode_status
            on real_price_transactions(geocode_status);
        create index if not exists idx_real_price_address_normalized
            on real_price_transactions(address_normalized);
        """
    )
    _ensure_columns(conn, "real_price_transactions", _COLUMN_DEFS)
    conn.executescript(
        """
        create index if not exists idx_real_price_source_type
            on real_price_transactions(source_type);
        create index if not exists idx_real_price_transaction_target
            on real_price_transactions(transaction_target);
        """
    )
    conn.commit()


def _ensure_columns(conn: sqlite3.Connection, table: str, definitions: dict[str, str]) -> None:
    existing = {str(row[1]) for row in conn.execute(f"pragma table_info({table})").fetchall()}
    for column, definition in definitions.items():
        if column not in existing:
            conn.execute(f"alter table {table} add column {column} {definition}")


def real_price_status(db_path: Path = DB_PATH) -> dict[str, Any]:
    if not db_path.exists():
        return {
            "ok": True,
            "available": False,
            "dbPath": str(db_path),
            "message": "尚未建立實價定位資料庫。",
        }
    with connect(db_path) as conn:
        total = _count(conn, "select count(*) from real_price_transactions")
        geocoded = _count(conn, "select count(*) from real_price_transactions where lat is not null and lng is not null")
        pending = _count(conn, "select count(*) from real_price_transactions where geocode_status = 'pending'")
    return {
        "ok": True,
        "available": total > 0,
        "dbPath": str(db_path),
        "transactions": {"total": total, "geocoded": geocoded, "pendingGeocode": pending},
    }


def _count(conn: sqlite3.Connection, sql: str) -> int:
    try:
        row = conn.execute(sql).fetchone()
        return int(row[0] or 0)
    except sqlite3.Error:
        return 0


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
    with connect(db_path) as conn:
        exists = conn.execute("select 1 from sqlite_master where type = 'table' and name = 'lvr_transactions'").fetchone()
        if not exists:
            return {"ok": False, "error": "lvr_transactions not found", "imported": 0, "skipped": 0}
        rows = conn.execute(
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
    for row in rows:
        last_source_id = max(last_source_id, int(row["id"] or 0))
        record = _record_from_lvr_row(row)
        if not record["address_raw"] or not record["address_normalized"]:
            skipped += 1
            continue
        insert_transaction(record, db_path=db_path)
        imported += 1
    return {
        "ok": True,
        "imported": imported,
        "skipped": skipped,
        "scanned": len(rows),
        "lastSourceId": last_source_id,
        "status": real_price_status(db_path),
    }


def _record_from_lvr_row(row: sqlite3.Row) -> dict[str, Any]:
    total_floors = _parse_floor_number(row["total_floors"])
    floor_level = _parse_floor_number(row["floor"])
    unit_price_sqm = _safe_float(row["unit_price_m2"])
    completion_date = row["completion_date"]
    return {
        "source": "lvr_open_data",
        "source_type": row["transaction_type"],
        "source_file": row["source_file"],
        "source_row_id": row["row_hash"] or row["serial"] or f"lvr:{row['id']}",
        "raw_case_id": row["serial"] or row["row_hash"] or f"lvr:{row['id']}",
        "city": str(row["city_name"] or "").replace("臺", "台"),
        "district": row["district"],
        "address_raw": row["address"],
        "address_normalized": normalize_address(row["address"]),
        "transaction_target": row["target"],
        "transaction_date": row["transaction_date"],
        "transaction_date_raw": row["transaction_date_raw"],
        "building_type": row["building_state"],
        "building_state": row["building_state"],
        "main_use": row["main_use"],
        "main_material": row["main_material"],
        "floor": row["floor"],
        "floor_raw": row["floor"],
        "floor_level": floor_level,
        "total_floors": total_floors,
        "building_area_sqm": _safe_float(row["building_area_m2"]),
        "building_area_ping": sqm_to_ping(row["building_area_m2"]),
        "parking_area_sqm": _safe_float(row["parking_area_m2"]),
        "parking_area_ping": sqm_to_ping(row["parking_area_m2"]),
        "parking_price": row["parking_price"],
        "parking_type": row["parking_type"],
        "land_area_sqm": _safe_float(row["land_area_m2"]),
        "land_area_ping": sqm_to_ping(row["land_area_m2"]),
        "total_price": row["total_price"],
        "unit_price_sqm": unit_price_sqm,
        "unit_price_ping": round(unit_price_sqm / PING_PER_M2, 3) if unit_price_sqm is not None else None,
        "rooms": row["room"],
        "halls": row["hall"],
        "baths": row["bath"],
        "bathrooms": row["bath"],
        "has_management": 1 if str(row["has_management"] or "").strip() == "有" else 0 if row["has_management"] else None,
        "completion_date": completion_date,
        "completion_date_raw": row["completion_date_raw"],
        "building_age": _building_age(completion_date),
        "note": row["note"],
        "geocode_status": "pending",
        "raw_json": row["raw_json"],
    }


def _parse_floor_number(value: Any) -> int | None:
    text = str(value or "").strip()
    if not text:
        return None
    import re

    digit_match = re.search(r"-?\d+", text)
    if digit_match:
        return int(digit_match.group(0))
    match = re.search(r"([零〇一二兩三四五六七八九十百千]+)", text)
    return chinese_number_to_int(match.group(1)) if match else None


def _building_age(completion_date: Any) -> float | None:
    text = str(completion_date or "").strip()
    if not text:
        return None
    try:
        year, month, day = [int(part) for part in text.split("-")]
        completed = date(year, month, day)
    except ValueError:
        return None
    return round((date.today() - completed).days / 365.25, 1)


def insert_transaction(record: dict[str, Any], db_path: Path = DB_PATH) -> int:
    payload = dict(record)
    payload.setdefault("source", "moi_lvr")
    columns = [
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
    for key in ("raw_json",):
        if isinstance(payload.get(key), (dict, list)):
            payload[key] = json.dumps(payload[key], ensure_ascii=False, sort_keys=True)
    placeholders = ", ".join("?" for _ in columns)
    assignments = ", ".join(_upsert_assignment(column) for column in columns if column not in {"source", "source_row_id"})
    sql = f"""
        insert into real_price_transactions ({", ".join(columns)})
        values ({placeholders})
        on conflict(source, source_row_id) do update set {assignments}
    """
    with connect(db_path) as conn:
        cur = conn.execute(sql, [payload.get(column) for column in columns])
        conn.commit()
        return int(cur.lastrowid or 0)


def _upsert_assignment(column: str) -> str:
    if column in {"lat", "lng", "geocode_provider", "geocode_confidence", "geocode_error"}:
        return f"{column} = coalesce(excluded.{column}, real_price_transactions.{column})"
    if column == "geocode_status":
        return (
            "geocode_status = case "
            "when real_price_transactions.geocode_status = 'ok' and excluded.lat is null and excluded.lng is null "
            "then real_price_transactions.geocode_status "
            "else excluded.geocode_status end"
        )
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
    with connect(db_path) as conn:
        conn.execute(
            """
            update real_price_transactions
            set lat = ?, lng = ?, geocode_status = ?, geocode_provider = ?,
                geocode_confidence = ?, geocode_error = ?
            where id = ?
            """,
            (lat, lng, status, provider, confidence, error, transaction_id),
        )
        conn.commit()


def pending_geocode_rows(
    limit: int = 1000,
    *,
    city: str | None = None,
    district: str | None = None,
    db_path: Path = DB_PATH,
) -> list[sqlite3.Row]:
    where = [
        "(lat is null or lng is null)",
        "geocode_status = 'pending'",
        "address_normalized is not null",
        "address_normalized <> ''",
    ]
    params: list[Any] = []
    if city:
        where.append("city in (?, ?)")
        params.extend([city, str(city).replace("台", "臺")])
    if district:
        where.append("district = ?")
        params.append(district)
    params.append(max(1, min(int(limit), 10000)))
    with connect(db_path) as conn:
        return conn.execute(
            f"""
            select id, city, district, address_raw, address_normalized
            from real_price_transactions
            where {" and ".join(where)}
            order by id
            limit ?
            """,
            params,
        ).fetchall()


def pending_geocode_items(
    limit: int = 1000,
    *,
    city: str | None = None,
    district: str | None = None,
    db_path: Path = DB_PATH,
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for row in pending_geocode_rows(limit=limit, city=city, district=district, db_path=db_path):
        normalized = str(row["address_normalized"] or "")
        geocode_address = _geocode_address_for_row(row)
        items.append(
            {
                "id": row["id"],
                "city": row["city"],
                "district": row["district"],
                "address": row["address_raw"],
                "address_raw": row["address_raw"],
                "address_normalized": normalized,
                "addressNormalized": normalized,
                "geocodeAddress": geocode_address,
                "geocode_address": geocode_address,
            }
        )
    return items


def _geocode_address_for_row(row: sqlite3.Row) -> str:
    normalized = str(row["address_normalized"] or "").strip()
    city = str(row["city"] or "").strip()
    district = str(row["district"] or "").strip()
    if city and normalized.startswith(city):
        return normalized
    if city and district and normalized.startswith(district):
        return f"{city}{normalized}"
    if city and district:
        return f"{city}{district}{normalized}"
    if city:
        return f"{city}{normalized}"
    return normalized


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
    mode = str(mode or "replace").strip().lower()
    if mode not in {"replace", "missing"}:
        raise ValueError("mode must be 'missing' or 'replace'")
    if not return_summary and not dry_run and limit is None and not city and not district and mode == "replace":
        with connect(db_path) as conn:
            cur = conn.execute(
                """
                update real_price_transactions
                set lat = (
                        select geocode_cache.lat from geocode_cache
                        where geocode_cache.address_normalized = real_price_transactions.address_normalized
                    ),
                    lng = (
                        select geocode_cache.lng from geocode_cache
                        where geocode_cache.address_normalized = real_price_transactions.address_normalized
                    ),
                    geocode_status = 'ok',
                    geocode_provider = (
                        select geocode_cache.provider from geocode_cache
                        where geocode_cache.address_normalized = real_price_transactions.address_normalized
                    ),
                    geocode_confidence = (
                        select geocode_cache.confidence from geocode_cache
                        where geocode_cache.address_normalized = real_price_transactions.address_normalized
                    ),
                    geocode_error = null
                where address_normalized in (
                    select address_normalized from geocode_cache
                    where lat is not null and lng is not null and status = 'ok'
                )
                """
            )
            conn.commit()
            return int(cur.rowcount or 0)

    where, params = _geocode_cache_apply_filters(city=city, district=district, mode=mode)
    limit_value = None if limit is None else max(1, min(int(limit), 100000))
    sample_value = max(0, min(int(sample_limit or 0), 50))
    summary: dict[str, Any] = {
        "ok": True,
        "backend": "sqlite",
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
    with connect(db_path) as conn:
        count_row = conn.execute(
            """
            select count(*) as rows, count(distinct real_price_transactions.address_normalized) as addresses
            from real_price_transactions
            join geocode_cache on geocode_cache.address_normalized = real_price_transactions.address_normalized
            where {where}
            """.format(where=where),
            params,
        ).fetchone()
        summary["matchedRows"] = int((count_row or {})["rows"] or 0)
        summary["matchedAddresses"] = int((count_row or {})["addresses"] or 0)
        if sample_value:
            samples = conn.execute(
                """
                select
                    real_price_transactions.id,
                    real_price_transactions.city,
                    real_price_transactions.district,
                    real_price_transactions.address_raw,
                    real_price_transactions.address_normalized,
                    real_price_transactions.lat as current_lat,
                    real_price_transactions.lng as current_lng,
                    geocode_cache.lat as cache_lat,
                    geocode_cache.lng as cache_lng,
                    geocode_cache.provider as geocode_source,
                    geocode_cache.confidence as geocode_confidence
                from real_price_transactions
                join geocode_cache on geocode_cache.address_normalized = real_price_transactions.address_normalized
                where {where}
                order by real_price_transactions.id
                limit ?
                """.format(where=where),
                [*params, sample_value],
            ).fetchall()
            summary["samples"] = [dict(row) for row in samples]
        city_rows = conn.execute(
            """
            select coalesce(real_price_transactions.city, '') as city,
                   count(*) as rows,
                   count(distinct real_price_transactions.address_normalized) as addresses
            from real_price_transactions
            join geocode_cache on geocode_cache.address_normalized = real_price_transactions.address_normalized
            where {where}
            group by coalesce(real_price_transactions.city, '')
            order by rows desc
            limit 12
            """.format(where=where),
            params,
        ).fetchall()
        summary["citySummary"] = [dict(row) for row in city_rows]
        if dry_run:
            return summary
        limit_sql = "limit ?" if limit_value is not None else ""
        matched_rows = conn.execute(
            """
            select
                real_price_transactions.id,
                geocode_cache.lat,
                geocode_cache.lng,
                geocode_cache.provider,
                geocode_cache.confidence
            from real_price_transactions
            join geocode_cache on geocode_cache.address_normalized = real_price_transactions.address_normalized
            where {where}
            order by real_price_transactions.id
            {limit_sql}
            """.format(where=where, limit_sql=limit_sql),
            [*params, *([limit_value] if limit_value is not None else [])],
        ).fetchall()
        for row in matched_rows:
            conn.execute(
                """
                update real_price_transactions
                set lat = ?,
                    lng = ?,
                    geocode_status = 'ok',
                    geocode_provider = ?,
                    geocode_confidence = ?,
                    geocode_error = null
                where id = ?
                """,
                [row["lat"], row["lng"], row["provider"], row["confidence"], row["id"]],
            )
        summary["appliedRows"] = len(matched_rows)
        conn.commit()
        remaining_row = conn.execute(
            """
            select count(*) as rows
            from real_price_transactions
            join geocode_cache on geocode_cache.address_normalized = real_price_transactions.address_normalized
            where {where}
            """.format(where=where),
            params,
        ).fetchone()
        summary["remainingRows"] = int((remaining_row or {})["rows"] or 0)
        if refresh_stats and summary["appliedRows"]:
            summary["stats"] = real_price_status(db_path)
    return summary if return_summary else int(summary["appliedRows"])


def _geocode_cache_apply_filters(*, city: str | None, district: str | None, mode: str) -> tuple[str, list[Any]]:
    where = [
        "geocode_cache.lat is not null",
        "geocode_cache.lng is not null",
        "geocode_cache.status = 'ok'",
    ]
    if mode == "missing":
        where.append("(real_price_transactions.lat is null or real_price_transactions.lng is null)")
    params: list[Any] = []
    city_text = str(city or "").strip()
    if city_text:
        where.append("real_price_transactions.city in (?, ?)")
        params.extend([city_text, city_text.replace("台", "臺")])
    district_text = str(district or "").strip()
    if district_text:
        where.append("real_price_transactions.district = ?")
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
    min_lat, max_lat, min_lng, max_lng = bounding_box(lat, lng, radius_km)
    where = ["lat between ? and ?", "lng between ? and ?"]
    params: list[Any] = [min_lat, max_lat, min_lng, max_lng]
    filters = filters or {}
    _append_filters(where, params, filters)

    sql = f"""
        select *
        from real_price_transactions
        where lat is not null
          and lng is not null
          and {" and ".join(where)}
        limit ?
    """
    params.append(MAX_SQL_FETCH)
    with connect(db_path) as conn:
        rows = conn.execute(sql, params).fetchall()

    items: list[dict[str, Any]] = []
    for row in rows:
        if row["lat"] is None or row["lng"] is None:
            continue
        distance_m = haversine_m(lat, lng, float(row["lat"]), float(row["lng"]))
        if distance_m <= radius_km * 1000:
            items.append(_row_to_item(row, distance_m))
    items.sort(key=_sort_key(sort), reverse=_sort_reverse(sort))
    return items[:limit]


def query_map_search(
    filters: dict[str, Any] | None = None,
    *,
    page: int = 1,
    page_size: int = 50,
    sort: str = "transaction_date_desc",
    db_path: Path = DB_PATH,
) -> dict[str, Any]:
    filters = filters or {}
    page = max(1, int(page or 1))
    page_size = max(1, min(int(page_size or 50), 500))
    where: list[str] = []
    params: list[Any] = []
    if _truthy(filters.get("geocoded_only") or filters.get("geocodedOnly")):
        where.extend(["lat is not null", "lng is not null"])
    bbox = _bbox_from_filters(filters)
    if bbox:
        where.extend(["lat between ? and ?", "lng between ? and ?"])
        params.extend([bbox["south"], bbox["north"], bbox["west"], bbox["east"]])
    _append_map_filters(where, params, filters)
    where_sql = f"where {' and '.join(where)}" if where else ""
    order_sql, order_params = _map_order_clause(sort, filters)
    count_sql = f"select count(*) from real_price_transactions {where_sql}"
    sql = f"""
        select *
        from real_price_transactions
        {where_sql}
        {order_sql}
        limit ? offset ?
    """
    with connect(db_path) as conn:
        total_row = conn.execute(count_sql, params).fetchone()
        total = int(total_row[0] or 0) if total_row else 0
        rows = conn.execute(sql, params + order_params + [page_size, (page - 1) * page_size]).fetchall()
    center = _center_from_filters(filters)
    items = [_row_to_map_item(row, center=center) for row in rows]
    return {
        "ok": True,
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pageSize": page_size,
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
    result = query_map_search(
        filters,
        page=1,
        page_size=max(1, min(int(limit or 2000), 5000)),
        sort="transaction_date_desc",
        db_path=db_path,
    )
    buckets: dict[tuple[int, int], list[dict[str, Any]]] = {}
    precision = max(50, min(int(grid_size or 500), 5000))
    for item in result["items"]:
        lat = _safe_float(item.get("lat"))
        lng = _safe_float(item.get("lng"))
        if lat is None or lng is None:
            continue
        key = (int(lat * precision), int(lng * precision))
        buckets.setdefault(key, []).append(item)
    clusters: list[dict[str, Any]] = []
    for bucket_items in buckets.values():
        count = len(bucket_items)
        avg_lat = sum(float(item["lat"]) for item in bucket_items) / count
        avg_lng = sum(float(item["lng"]) for item in bucket_items) / count
        avg_unit = _avg([item.get("unitPriceRawPing") for item in bucket_items])
        avg_total = _avg([item.get("total_price") for item in bucket_items])
        clusters.append(
            {
                "lat": round(avg_lat, 7),
                "lng": round(avg_lng, 7),
                "count": count,
                "avg_unit_price_ping": round(avg_unit / 10000, 3) if avg_unit is not None else None,
                "avg_unit_price_raw_ping": avg_unit,
                "avg_total_price": avg_total,
            }
        )
    clusters.sort(key=lambda item: int(item["count"]), reverse=True)
    return clusters


def lookup_transaction_location(payload: dict[str, Any], db_path: Path = DB_PATH) -> GeocodeResult:
    sq = str(payload.get("sq") or payload.get("caseId") or payload.get("rawCaseId") or "").strip()
    address = str(payload.get("address") or "").strip()
    normalized = normalize_address(address)
    params: list[Any] = []
    where = ["lat is not null", "lng is not null", "geocode_status = 'ok'"]
    if sq:
        where.append("(raw_case_id = ? or source_row_id = ?)")
        params.extend([sq, sq])
        row = _lookup_transaction_location_row(where, params, db_path=db_path)
        if row:
            return _location_result_from_row(row, address or sq, provider="official_case")
        where = ["lat is not null", "lng is not null", "geocode_status = 'ok'"]
        params = []
    if normalized:
        where.append("address_normalized = ?")
        params.append(normalized)
        row = _lookup_transaction_location_row(where, params, db_path=db_path)
        if row:
            return _location_result_from_row(row, address, provider="official_case_address")
    return GeocodeResult(False, address, normalized, provider="official_case", status="not_found", error="official case has no cached coordinates")


def _lookup_transaction_location_row(where: list[str], params: list[Any], *, db_path: Path) -> sqlite3.Row | None:
    sql = f"""
        select *
        from real_price_transactions
        where {" and ".join(where)}
        order by transaction_date desc nulls last, id desc
        limit 1
    """
    with connect(db_path) as conn:
        return conn.execute(sql, params).fetchone()


def _location_result_from_row(row: sqlite3.Row, address: str, *, provider: str) -> GeocodeResult:
    return GeocodeResult(
        True,
        str(row["address_raw"] or address or ""),
        str(row["address_normalized"] or normalize_address(address)),
        lat=_safe_float(row["lat"]),
        lng=_safe_float(row["lng"]),
        confidence=_safe_float(row["geocode_confidence"]) or 0.85,
        provider=provider,
        status="ok",
    )


def get_case_detail(case_id: int, *, db_path: Path = DB_PATH) -> dict[str, Any] | None:
    with connect(db_path) as conn:
        row = conn.execute("select * from real_price_transactions where id = ?", (int(case_id),)).fetchone()
    if row is None:
        return None
    item = _row_to_map_item(row)
    item.update(
        {
            "land_area_sqm": _safe_float(row["land_area_sqm"]),
            "land_area_ping": _safe_float(row["land_area_ping"]),
            "building_area_sqm": _safe_float(row["building_area_sqm"]),
            "parking_area_sqm": _safe_float(row["parking_area_sqm"]),
            "unit_price_sqm": _safe_float(row["unit_price_sqm"]),
            "main_material": row["main_material"],
            "floor_level": row["floor_level"],
            "floorLevel": row["floor_level"],
            "completion_date": row["completion_date"],
            "completionDate": row["completion_date"],
            "completion_date_raw": row["completion_date_raw"],
            "geocode_status": row["geocode_status"],
            "geocode_provider": row["geocode_provider"],
            "geocode_confidence": _safe_float(row["geocode_confidence"]),
            "geocode_error": row["geocode_error"],
            "raw_case_id": row["raw_case_id"],
            "rawCaseId": row["raw_case_id"],
        }
    )
    return item


def _append_map_filters(where: list[str], params: list[Any], filters: dict[str, Any]) -> None:
    source_type = _normalize_source_type(filters.get("source_type") or filters.get("sourceType"))
    if source_type:
        where.append("(source_type = ? or source_type is null or source_type = '')")
        params.append(source_type)
    city = str(filters.get("city") or "").strip()
    if city:
        where.append("city in (?, ?)")
        params.extend(_city_variants(city))
    district = str(filters.get("district") or "").strip()
    if district:
        where.append("district = ?")
        params.append(district)
    community_raw = str(filters.get("community") or filters.get("community_name") or filters.get("communityName") or "").strip()
    if community_raw:
        where.append("(community_name like ? or address_raw like ?)")
        params.extend([f"%{community_raw}%", f"%{community_raw}%"])
    road = normalize_address(filters.get("road") or filters.get("address") or "")
    if road:
        where.append("(address_normalized like ? or address_raw like ?)")
        params.extend([f"%{road}%", f"%{filters.get('road') or filters.get('address')}%"])
    target_types = _list_filter(filters.get("target_types") or filters.get("targetTypes"))
    if target_types:
        target_clauses = []
        for target in target_types:
            if not target:
                continue
            target_clauses.append("transaction_target like ?")
            params.append(f"%{target}%")
            if target == "房地":
                target_clauses.append("((transaction_target is null or transaction_target = '') and address_raw not like '%地號%')")
        if target_clauses:
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
                where.append(f"{column} {op} ?")
                params.append(text)
            continue
        number = _to_float(value)
        if number is not None:
            where.append(f"{column} {op} ?")
            params.append(number)
    exclude_special = str(filters.get("exclude_special") or filters.get("excludeSpecial") or "").lower()
    if exclude_special in {"1", "true", "yes", "on"}:
        where.append(
            "(note is null or (note not like '%親友%' and note not like '%員工%' and note not like '%共有人%' "
            "and note not like '%特殊關係%' and note not like '%急買急賣%' and note not like '%瑕疵%'))"
        )


def _bbox_from_filters(filters: dict[str, Any]) -> dict[str, float] | None:
    try:
        north = float(filters.get("north"))
        south = float(filters.get("south"))
        east = float(filters.get("east"))
        west = float(filters.get("west"))
    except (TypeError, ValueError):
        return None
    if not (-90 <= south <= north <= 90 and -180 <= west <= east <= 180):
        return None
    return {"north": north, "south": south, "east": east, "west": west}


def _center_from_filters(filters: dict[str, Any]) -> tuple[float, float] | None:
    try:
        lat = float(filters.get("center_lat") or filters.get("centerLat"))
        lng = float(filters.get("center_lng") or filters.get("centerLng"))
    except (TypeError, ValueError):
        return None
    if -90 <= lat <= 90 and -180 <= lng <= 180:
        return lat, lng
    return None


def _map_order_clause(sort: str, filters: dict[str, Any]) -> tuple[str, list[Any]]:
    sort = str(sort or "transaction_date_desc")
    if sort == "distance_asc" and _center_from_filters(filters):
        lat, lng = _center_from_filters(filters) or (0.0, 0.0)
        return "order by ((lat - ?) * (lat - ?) + (lng - ?) * (lng - ?)) asc, transaction_date desc", [lat, lat, lng, lng]
    mapping = {
        "transaction_date_asc": "transaction_date asc",
        "transaction_date_desc": "transaction_date desc",
        "total_price_asc": "total_price asc",
        "total_price_desc": "total_price desc",
        "unit_price_asc": "unit_price_ping asc",
        "unit_price_desc": "unit_price_ping desc",
        "area_asc": "building_area_ping asc",
        "area_desc": "building_area_ping desc",
    }
    return f"order by {mapping.get(sort, 'transaction_date desc')}", []


def _normalize_source_type(value: Any) -> str:
    text = str(value or "").strip().lower()
    return {"buy": "sale", "sale": "sale", "presale": "presale", "rent": "rent"}.get(text, "")


def _city_variants(value: str) -> list[str]:
    text = str(value or "").strip()
    normalized = text.replace("臺", "台")
    traditional = normalized.replace("台", "臺")
    return [normalized, traditional]


def _list_filter(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        parts = value.split(",")
    elif isinstance(value, (list, tuple, set)):
        parts = list(value)
    else:
        parts = [value]
    return [str(part).strip() for part in parts if str(part).strip()]


def _avg(values: list[Any]) -> float | None:
    numbers = [_safe_float(value) for value in values]
    numbers = [number for number in numbers if number is not None]
    if not numbers:
        return None
    return round(sum(numbers) / len(numbers), 3)


def _append_filters(where: list[str], params: list[Any], filters: dict[str, Any]) -> None:
    source_type = _normalize_source_type(filters.get("source_type") or filters.get("sourceType"))
    if source_type:
        where.append("(source_type = ? or source_type is null or source_type = '')")
        params.append(source_type)
    city = str(filters.get("city") or "").strip()
    if city:
        where.append("city in (?, ?)")
        params.extend(_city_variants(city))
    district = str(filters.get("district") or "").strip()
    if district:
        where.append("district = ?")
        params.append(district)
    target_types = _list_filter(filters.get("target_types") or filters.get("targetTypes"))
    if target_types:
        target_clauses = []
        for target in target_types:
            if not target:
                continue
            target_clauses.append("transaction_target like ?")
            params.append(f"%{target}%")
            if target == "房地":
                target_clauses.append("((transaction_target is null or transaction_target = '') and address_raw not like '%地號%')")
        if target_clauses:
            where.append(f"({' or '.join(target_clauses)})")
    exclude_special = str(filters.get("exclude_special") or filters.get("excludeSpecial") or "").lower()
    if exclude_special in {"1", "true", "yes", "on"}:
        where.append(
            "(note is null or (note not like '%親友%' and note not like '%員工%' and note not like '%共有人%' "
            "and note not like '%特殊關係%' and note not like '%急買急賣%' and note not like '%瑕疵%'))"
        )
    building_type = str(filters.get("buildingType") or "").strip()
    building_type = building_type or str(filters.get("building_type") or "").strip()
    if building_type:
        where.append("(building_type = ? or building_state = ?)")
        params.extend([building_type, building_type])
    main_use = str(filters.get("mainUse") or "").strip()
    main_use = main_use or str(filters.get("main_use") or "").strip()
    if main_use:
        where.append("main_use like ?")
        params.append(f"%{main_use}%")
    for key, column, op in [
        ("minTotalPrice", "total_price", ">="),
        ("maxTotalPrice", "total_price", "<="),
        ("minUnitPriceWanPing", "unit_price_ping", ">="),
        ("maxUnitPriceWanPing", "unit_price_ping", "<="),
        ("minAreaPing", "building_area_ping", ">="),
        ("maxAreaPing", "building_area_ping", "<="),
    ]:
        snake_key = _camel_to_snake(key)
        value = _to_float(filters.get(key, filters.get(snake_key)))
        if value is None:
            continue
        if key.endswith("UnitPriceWanPing"):
            value *= 10000
        where.append(f"{column} {op} ?")
        params.append(value)
    within_months = _to_float(filters.get("withinMonths", filters.get("within_months")))
    if within_months is not None and within_months > 0:
        cutoff = date.today() - timedelta(days=int(within_months * 31))
        where.append("transaction_date >= ?")
        params.append(cutoff.isoformat())


def _camel_to_snake(key: str) -> str:
    return "".join([f"_{ch.lower()}" if ch.isupper() else ch for ch in key]).lstrip("_")


def _to_float(value: Any) -> float | None:
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _truthy(value: Any) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def _sort_key(sort: str):
    if sort == "date_desc":
        return lambda item: ((item.get("transaction_date") or ""), -float(item.get("distance_m") or 0))
    if sort == "unit_price_desc":
        return lambda item: (float(item.get("unit_price_ping") or 0), (item.get("transaction_date") or ""))
    if sort == "unit_price_asc":
        return lambda item: (float(item.get("unit_price_ping") or 0), -float(item.get("distance_m") or 0))
    if sort == "total_price_desc":
        return lambda item: (int(item.get("total_price") or 0), (item.get("transaction_date") or ""))
    if sort == "total_price_asc":
        return lambda item: (int(item.get("total_price") or 0), -float(item.get("distance_m") or 0))
    if sort == "area_desc":
        return lambda item: (float(item.get("building_area_ping") or 0), (item.get("transaction_date") or ""))
    if sort == "area_asc":
        return lambda item: (float(item.get("building_area_ping") or 0), -float(item.get("distance_m") or 0))
    return lambda item: (float(item.get("distance_m") or 0), item.get("transaction_date") or "")


def _sort_reverse(sort: str) -> bool:
    return sort in {"date_desc", "unit_price_desc", "total_price_desc", "area_desc"}


def _row_to_item(row: sqlite3.Row, distance_m: float) -> dict[str, Any]:
    unit_price_ping = _safe_float(row["unit_price_ping"])
    return {
        "id": row["id"],
        "source": row["source"],
        "source_type": row["source_type"],
        "sourceType": row["source_type"],
        "city": row["city"],
        "district": row["district"],
        "address": row["address_raw"],
        "addressNormalized": row["address_normalized"],
        "transaction_target": row["transaction_target"],
        "transactionTarget": row["transaction_target"],
        "community_name": row["community_name"],
        "communityName": row["community_name"],
        "transaction_date": row["transaction_date"],
        "transactionDate": row["transaction_date"],
        "building_type": row["building_type"] or row["building_state"],
        "buildingType": row["building_type"] or row["building_state"],
        "building_state": row["building_state"],
        "main_use": row["main_use"],
        "floor": row["floor_raw"] or row["floor"],
        "floor_raw": row["floor_raw"] or row["floor"],
        "total_floors": row["total_floors"],
        "building_area_ping": _safe_float(row["building_area_ping"]),
        "buildingAreaPing": _safe_float(row["building_area_ping"]),
        "parking_area_ping": _safe_float(row["parking_area_ping"]),
        "parkingAreaPing": _safe_float(row["parking_area_ping"]),
        "parking_price": row["parking_price"],
        "parking_type": row["parking_type"],
        "land_area_ping": _safe_float(row["land_area_ping"]),
        "total_price": row["total_price"],
        "totalPrice": row["total_price"],
        "unit_price_ping": round(unit_price_ping / 10000, 3) if unit_price_ping is not None else None,
        "unitPriceWanPing": round(unit_price_ping / 10000, 3) if unit_price_ping is not None else None,
        "unitPriceRawPing": unit_price_ping,
        "lat": _safe_float(row["lat"]),
        "lng": _safe_float(row["lng"]),
        "distance_m": round(distance_m, 1),
        "distanceM": round(distance_m, 1),
        "completion_date": row["completion_date"],
        "building_age": _safe_float(row["building_age"]),
        "rooms": row["rooms"],
        "halls": row["halls"],
        "baths": row["bathrooms"] if row["bathrooms"] is not None else row["baths"],
        "bathrooms": row["bathrooms"] if row["bathrooms"] is not None else row["baths"],
        "note": row["note"],
        "hasManagement": bool(row["has_management"]) if row["has_management"] is not None else None,
    }


def _row_to_map_item(row: sqlite3.Row, center: tuple[float, float] | None = None) -> dict[str, Any]:
    unit_price_ping = _safe_float(row["unit_price_ping"])
    lat = _safe_float(row["lat"])
    lng = _safe_float(row["lng"])
    distance_m = haversine_m(center[0], center[1], lat, lng) if center and lat is not None and lng is not None else None
    has_parking = bool(row["parking_type"] or _safe_float(row["parking_area_ping"]) or row["parking_price"])
    return {
        "id": row["id"],
        "source": row["source"],
        "source_type": row["source_type"],
        "sourceType": row["source_type"],
        "city": row["city"],
        "district": row["district"],
        "address": row["address_raw"],
        "address_normalized": row["address_normalized"],
        "addressNormalized": row["address_normalized"],
        "community_name": row["community_name"],
        "communityName": row["community_name"],
        "transaction_target": row["transaction_target"],
        "transactionTarget": row["transaction_target"],
        "transaction_date": row["transaction_date"],
        "transactionDate": row["transaction_date"],
        "total_price": row["total_price"],
        "totalPrice": row["total_price"],
        "unit_price_ping": round(unit_price_ping / 10000, 3) if unit_price_ping is not None else None,
        "unitPriceWanPing": round(unit_price_ping / 10000, 3) if unit_price_ping is not None else None,
        "unitPriceRawPing": unit_price_ping,
        "building_area_ping": _safe_float(row["building_area_ping"]),
        "buildingAreaPing": _safe_float(row["building_area_ping"]),
        "parking_area_ping": _safe_float(row["parking_area_ping"]),
        "parkingAreaPing": _safe_float(row["parking_area_ping"]),
        "parking_price": row["parking_price"],
        "parkingPrice": row["parking_price"],
        "parking_type": row["parking_type"],
        "parkingType": row["parking_type"],
        "has_parking": has_parking,
        "hasParking": has_parking,
        "building_type": row["building_type"] or row["building_state"],
        "buildingType": row["building_type"] or row["building_state"],
        "main_use": row["main_use"],
        "mainUse": row["main_use"],
        "floor": row["floor_raw"] or row["floor"],
        "floor_level": row["floor_level"],
        "floorLevel": row["floor_level"],
        "total_floors": row["total_floors"],
        "totalFloors": row["total_floors"],
        "house_age": _safe_float(row["building_age"]),
        "houseAge": _safe_float(row["building_age"]),
        "building_age": _safe_float(row["building_age"]),
        "rooms": row["rooms"],
        "halls": row["halls"],
        "bathrooms": row["bathrooms"] if row["bathrooms"] is not None else row["baths"],
        "note": row["note"],
        "lat": lat,
        "lng": lng,
        "distance_m": round(distance_m, 1) if distance_m is not None else None,
        "distanceM": round(distance_m, 1) if distance_m is not None else None,
    }


def _safe_float(value: Any) -> float | None:
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def sqm_to_ping(value: Any) -> float | None:
    numeric = _safe_float(value)
    if numeric is None:
        return None
    return round(numeric * PING_PER_M2, 3)
