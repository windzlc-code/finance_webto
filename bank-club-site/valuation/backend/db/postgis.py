"""PostGIS migration notes for the real-price map-search future path."""

from __future__ import annotations

from pathlib import Path


MIGRATION_PATH = Path(__file__).resolve().parents[2] / "migrations" / "20260620_real_price_postgis.sql"


def migration_sql() -> str:
    return MIGRATION_PATH.read_text(encoding="utf-8")
