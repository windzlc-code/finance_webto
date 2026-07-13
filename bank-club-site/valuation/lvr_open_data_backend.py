from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "lvr_opendata" / "db" / "lvr_open_data.sqlite3"
PING_PER_M2 = 0.3025


def _connect(db_path: Path = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def _table_exists(conn: sqlite3.Connection, table: str) -> bool:
    row = conn.execute(
        "select 1 from sqlite_master where type = 'table' and name = ?",
        (table,),
    ).fetchone()
    return row is not None


def _row_count(conn: sqlite3.Connection, table: str) -> int:
    if not _table_exists(conn, table):
        return 0
    row = conn.execute(f"select count(*) as n from {table}").fetchone()
    return int(row["n"] or 0)


def _read_cached_stats(conn: sqlite3.Connection) -> dict[str, str] | None:
    if not _table_exists(conn, "lvr_open_data_stats"):
        return None
    rows = conn.execute("select key, value from lvr_open_data_stats").fetchall()
    if not rows:
        return None
    return {str(row["key"]): str(row["value"]) for row in rows}


def _int_stat(stats: dict[str, str], key: str) -> int:
    try:
        return int(float(stats.get(key, "0") or 0))
    except (TypeError, ValueError):
        return 0


def _storage_available(db_path: Path = DB_PATH) -> dict[str, Any]:
    if not db_path.exists():
        return {
            "ok": True,
            "available": False,
            "dbPath": str(db_path),
            "message": "尚未匯入內政部實價登錄 Open Data CSV。",
        }
    try:
        with _connect(db_path) as conn:
            if not _table_exists(conn, "lvr_transactions"):
                return {
                    "ok": True,
                    "available": False,
                    "dbPath": str(db_path),
                    "message": "資料庫存在，但尚未建立 lvr_transactions。",
                }
    except sqlite3.Error as exc:
        return {"ok": False, "available": False, "dbPath": str(db_path), "error": str(exc)}
    return {"ok": True, "available": True, "dbPath": str(db_path)}


def _round_ping(value: Any) -> float | None:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    return round(numeric * PING_PER_M2, 3)


def _row_to_public(row: sqlite3.Row) -> dict[str, Any]:
    raw_json = row["raw_json"] if "raw_json" in row.keys() else None
    raw: dict[str, Any] = {}
    if raw_json:
        try:
            parsed = json.loads(raw_json)
            if isinstance(parsed, dict):
                raw = parsed
        except json.JSONDecodeError:
            raw = {}
    unit_price_m2 = row["unit_price_m2"]
    unit_price_ping = None
    if unit_price_m2 is not None:
        try:
            unit_price_ping = round(float(unit_price_m2) / PING_PER_M2)
        except (TypeError, ValueError, ZeroDivisionError):
            unit_price_ping = None
    return {
        "id": row["id"],
        "source": "opendata",
        "transactionType": row["transaction_type"],
        "cityCode": row["city_code"],
        "cityName": row["city_name"],
        "district": row["district"],
        "target": row["target"],
        "address": row["address"],
        "transactionDate": row["transaction_date"],
        "transactionDateRaw": row["transaction_date_raw"],
        "buildingState": row["building_state"],
        "mainUse": row["main_use"],
        "mainMaterial": row["main_material"],
        "floor": row["floor"],
        "totalFloors": row["total_floors"],
        "completionDate": row["completion_date"],
        "completionDateRaw": row["completion_date_raw"],
        "landAreaM2": row["land_area_m2"],
        "landAreaPing": _round_ping(row["land_area_m2"]),
        "buildingAreaM2": row["building_area_m2"],
        "buildingAreaPing": _round_ping(row["building_area_m2"]),
        "parkingAreaM2": row["parking_area_m2"],
        "parkingAreaPing": _round_ping(row["parking_area_m2"]),
        "totalPrice": row["total_price"],
        "unitPriceM2": unit_price_m2,
        "unitPricePing": unit_price_ping,
        "parkingType": row["parking_type"],
        "parkingPrice": row["parking_price"],
        "rooms": row["room"],
        "halls": row["hall"],
        "baths": row["bath"],
        "note": row["note"],
        "serial": row["serial"],
        "sourceKind": row["source_kind"],
        "sourcePeriod": row["source_period"],
        "sourceFile": row["source_file"],
        "raw": raw,
    }


def open_data_status(db_path: Path = DB_PATH) -> dict[str, Any]:
    exists = db_path.exists()
    if not exists:
        return {
            "ok": True,
            "available": False,
            "dbPath": str(db_path),
            "message": "尚未匯入內政部實價登錄 Open Data CSV。",
        }
    try:
        with _connect(db_path) as conn:
            if not _table_exists(conn, "lvr_transactions"):
                return {
                    "ok": True,
                    "available": False,
                    "dbPath": str(db_path),
                    "message": "資料庫存在，但尚未建立 lvr_transactions。",
                }
            cached = _read_cached_stats(conn)
            if cached:
                return {
                    "ok": True,
                    "available": True,
                    "dbPath": str(db_path),
                    "transactions": {
                        "total": _int_stat(cached, "transactions.total"),
                        "byType": {
                            "presale": _int_stat(cached, "transactions.presale"),
                            "sale": _int_stat(cached, "transactions.sale"),
                        },
                        "dateRange": {
                            "min": cached.get("transaction_date.min") or None,
                            "max": cached.get("transaction_date.max") or None,
                        },
                    },
                    "subrecords": {
                        "total": _int_stat(cached, "subrecords.total"),
                        "byType": {
                            "build": _int_stat(cached, "subrecords.build"),
                            "land": _int_stat(cached, "subrecords.land"),
                            "park": _int_stat(cached, "subrecords.park"),
                        },
                    },
                    "sources": {
                        "runs": _int_stat(cached, "sources.runs"),
                        "firstImportedAt": cached.get("sources.firstImportedAt") or None,
                        "lastImportedAt": cached.get("sources.lastImportedAt") or None,
                    },
                }
            counts = {
                row["transaction_type"]: row["n"]
                for row in conn.execute(
                    """
                    select transaction_type, count(*) as n
                    from lvr_transactions
                    group by transaction_type
                    order by transaction_type
                    """
                )
            }
            sub_counts = {
                row["subfile_type"]: row["n"]
                for row in conn.execute(
                    """
                    select subfile_type, count(*) as n
                    from lvr_subrecords
                    group by subfile_type
                    order by subfile_type
                    """
                )
            } if _table_exists(conn, "lvr_subrecords") else {}
            date_range = conn.execute(
                """
                select min(transaction_date) as min_date, max(transaction_date) as max_date
                from lvr_transactions
                where transaction_year between 2012 and 2026
                  and transaction_date is not null
                  and transaction_date != ''
                  and transaction_date <= ?
                """
                ,
                (datetime.now().date().isoformat(),),
            ).fetchone()
            imported_range = conn.execute(
                """
                select min(started_at) as first_imported_at, max(finished_at) as last_imported_at
                from lvr_import_runs
                """
            ).fetchone()
            return {
                "ok": True,
                "available": True,
                "dbPath": str(db_path),
                "transactions": {
                    "total": _row_count(conn, "lvr_transactions"),
                    "byType": counts,
                    "dateRange": {
                        "min": date_range["min_date"],
                        "max": date_range["max_date"],
                    },
                },
                "subrecords": {
                    "total": _row_count(conn, "lvr_subrecords"),
                    "byType": sub_counts,
                },
                "sources": {
                    "runs": _row_count(conn, "lvr_import_runs"),
                    "firstImportedAt": imported_range["first_imported_at"],
                    "lastImportedAt": imported_range["last_imported_at"],
                },
            }
    except sqlite3.Error as exc:
        return {
            "ok": False,
            "available": False,
            "dbPath": str(db_path),
            "error": str(exc),
        }


def search_open_data(payload: dict[str, Any] | None = None, db_path: Path = DB_PATH) -> dict[str, Any]:
    payload = payload or {}
    status = _storage_available(db_path)
    if not status.get("available"):
        return {
            "ok": False,
            "error": status.get("message") or status.get("error") or "open data db unavailable",
            "status": status,
            "rows": [],
        }
    where: list[str] = []
    params: list[Any] = []

    transaction_type = str(payload.get("transactionType") or payload.get("type") or "all").strip().lower()
    if transaction_type in {"sale", "a", "不動產買賣"}:
        where.append("transaction_type = ?")
        params.append("sale")
    elif transaction_type in {"presale", "b", "預售屋買賣"}:
        where.append("transaction_type = ?")
        params.append("presale")

    city_code = str(payload.get("cityCode") or "").strip().upper()
    city_name = str(payload.get("cityName") or "").strip()
    district = str(payload.get("district") or payload.get("town") or "").strip()
    address = str(payload.get("addressKeyword") or payload.get("address") or payload.get("keyword") or "").strip()
    building_state = str(payload.get("buildingState") or "").strip()
    if city_code:
        where.append("city_code = ?")
        params.append(city_code)
    if city_name:
        where.append("city_name = ?")
        params.append(city_name)
    if district:
        where.append("district = ?")
        params.append(district)
    if address:
        where.append("address like ?")
        params.append(f"%{address}%")
    if building_state:
        where.append("building_state like ?")
        params.append(f"%{building_state}%")

    include_future_dates = payload.get("includeFutureDates") is True
    if not include_future_dates:
        where.append("(transaction_date is null or transaction_date = '' or transaction_date <= ?)")
        params.append(datetime.now().date().isoformat())

    for field, op, column in [
        ("minTransactionYear", ">=", "transaction_year"),
        ("maxTransactionYear", "<=", "transaction_year"),
        ("minTotalPrice", ">=", "total_price"),
        ("maxTotalPrice", "<=", "total_price"),
    ]:
        value = payload.get(field)
        if value in (None, ""):
            continue
        try:
            numeric = int(float(value))
        except (TypeError, ValueError):
            continue
        where.append(f"{column} {op} ?")
        params.append(numeric)

    try:
        limit = int(payload.get("limit") or 100)
    except (TypeError, ValueError):
        limit = 100
    limit = max(1, min(limit, 500))

    sql = """
        select *
        from lvr_transactions
    """
    if where:
        sql += " where " + " and ".join(where)
    sql += """
        order by
            case when transaction_date is null or transaction_date = '' then 1 else 0 end,
            transaction_date desc,
            id desc
        limit ?
    """
    params.append(limit)

    with _connect(db_path) as conn:
        rows = [_row_to_public(row) for row in conn.execute(sql, params)]
    return {
        "ok": True,
        "source": "opendata",
        "count": len(rows),
        "limit": limit,
        "rows": rows,
        "status": status,
    }
