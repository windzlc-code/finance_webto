from __future__ import annotations

import math


EARTH_RADIUS_M = 6_371_008.8


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1 = math.radians(float(lat1))
    phi2 = math.radians(float(lat2))
    d_phi = math.radians(float(lat2) - float(lat1))
    d_lambda = math.radians(float(lng2) - float(lng1))
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def bounding_box(lat: float, lng: float, radius_km: float) -> tuple[float, float, float, float]:
    lat = float(lat)
    lng = float(lng)
    radius_m = float(radius_km) * 1000
    delta_lat = math.degrees(radius_m / EARTH_RADIUS_M)
    cos_lat = max(math.cos(math.radians(lat)), 0.000001)
    delta_lng = math.degrees(radius_m / EARTH_RADIUS_M / cos_lat)
    return lat - delta_lat, lat + delta_lat, lng - delta_lng, lng + delta_lng
