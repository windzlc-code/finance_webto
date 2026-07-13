"""Lightweight real-price model shape for the map-search contract."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RealPriceCase:
    id: int
    city: str | None
    district: str | None
    address: str
    transaction_date: str | None
    total_price: int | None
    unit_price_ping: float | None
    building_area_ping: float | None
    lat: float | None
    lng: float | None
