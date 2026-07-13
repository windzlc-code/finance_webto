from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from lvr_open_data_backend import DB_PATH

from .address_normalizer import normalize_address


@dataclass(frozen=True)
class GeocodeResult:
    ok: bool
    address: str
    normalized_address: str
    lat: float | None = None
    lng: float | None = None
    confidence: float | None = None
    provider: str = "local_cache"
    status: str = "not_found"
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "address": self.address,
            "address_raw": self.address,
            "normalizedAddress": self.normalized_address,
            "address_normalized": self.normalized_address,
            "lat": self.lat,
            "lng": self.lng,
            "confidence": self.confidence,
            "provider": self.provider,
            "status": self.status,
            "error": self.error,
        }


def ensure_geocode_cache(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        create table if not exists geocode_cache (
            id integer primary key autoincrement,
            address_raw text not null,
            address_normalized text not null unique,
            lat real,
            lng real,
            provider text,
            confidence real,
            status text not null default 'ok',
            error text,
            created_at text not null default current_timestamp,
            updated_at text not null default current_timestamp
        )
        """
    )
    conn.execute("create index if not exists idx_geocode_cache_normalized on geocode_cache(address_normalized)")


def _connect(db_path: Path = DB_PATH) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    ensure_geocode_cache(conn)
    return conn


def lookup_cache(address: str, db_path: Path = DB_PATH) -> GeocodeResult:
    normalized = normalize_address(address)
    if not normalized:
        return GeocodeResult(False, str(address or ""), "", status="invalid_address", error="missing address")
    with _connect(db_path) as conn:
        row = conn.execute(
            """
            select address_raw, address_normalized, lat, lng, provider, confidence, status, error
            from geocode_cache
            where address_normalized = ?
            """,
            (normalized,),
        ).fetchone()
    if not row:
        return GeocodeResult(False, str(address or ""), normalized, status="not_found")
    ok = row["lat"] is not None and row["lng"] is not None and str(row["status"] or "ok") == "ok"
    return GeocodeResult(
        ok=ok,
        address=str(row["address_raw"] or address or ""),
        normalized_address=str(row["address_normalized"] or normalized),
        lat=float(row["lat"]) if row["lat"] is not None else None,
        lng=float(row["lng"]) if row["lng"] is not None else None,
        confidence=float(row["confidence"]) if row["confidence"] is not None else None,
        provider=str(row["provider"] or "local_cache"),
        status=str(row["status"] or ("ok" if ok else "not_found")),
        error=row["error"],
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
    now = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    with _connect(db_path) as conn:
        conn.execute(
            """
            insert into geocode_cache (
                address_raw, address_normalized, lat, lng, provider, confidence, status, error, created_at, updated_at
            ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            on conflict(address_normalized) do update set
                address_raw = excluded.address_raw,
                lat = excluded.lat,
                lng = excluded.lng,
                provider = excluded.provider,
                confidence = excluded.confidence,
                status = excluded.status,
                error = excluded.error,
                updated_at = excluded.updated_at
            """,
            (address, normalized, lat, lng, provider, confidence, status, error, now, now),
        )
        conn.commit()
    return lookup_cache(address, db_path=db_path)


def geocode_address(address: str, *, db_path: Path = DB_PATH, provider: str = "auto") -> GeocodeResult:
    cached = lookup_cache(address, db_path=db_path)
    if cached.ok:
        return cached
    normalized = normalize_address(address)
    if not normalized:
        return cached
    return GeocodeResult(
        False,
        str(address or ""),
        normalized,
        provider=provider if provider != "auto" else "local_cache",
        status="not_found",
        error="地址尚未有座標快取；請先匯入或執行 geocode_real_price.py 建立座標。",
    )
