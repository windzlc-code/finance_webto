from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class NearbyQuery:
    lat: float
    lng: float
    radius_km: float = 0.5
    limit: int = 100
    sort: str = "distance_asc"


@dataclass(frozen=True)
class RealPriceTransaction:
    id: int | None
    city: str | None
    district: str | None
    address_raw: str
    address_normalized: str | None
    transaction_date: str | None
    building_type: str | None
    building_area_ping: float | None
    parking_area_ping: float | None
    total_price: int | None
    unit_price_ping: float | None
    lat: float | None
    lng: float | None
