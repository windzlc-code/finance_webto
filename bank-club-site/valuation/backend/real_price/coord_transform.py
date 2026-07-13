from __future__ import annotations

import math


def twd97_to_wgs84(x: float, y: float) -> tuple[float, float]:
    """Convert TWD97 TM2 zone 121 coordinates to WGS84 lat/lng."""
    x = float(x) - 250000.0
    y = float(y)
    lon0 = math.radians(121.0)
    k0 = 0.9999
    a = 6378137.0
    b = 6356752.314245
    e = math.sqrt(1 - (b * b) / (a * a))
    e1sq = e * e / (1 - e * e)
    m = y / k0
    mu = m / (a * (1.0 - e**2 / 4.0 - 3.0 * e**4 / 64.0 - 5.0 * e**6 / 256.0))
    e1 = (1.0 - math.sqrt(1.0 - e * e)) / (1.0 + math.sqrt(1.0 - e * e))
    j1 = 3.0 * e1 / 2.0 - 27.0 * e1**3 / 32.0
    j2 = 21.0 * e1**2 / 16.0 - 55.0 * e1**4 / 32.0
    j3 = 151.0 * e1**3 / 96.0
    j4 = 1097.0 * e1**4 / 512.0
    fp = mu + j1 * math.sin(2.0 * mu) + j2 * math.sin(4.0 * mu) + j3 * math.sin(6.0 * mu) + j4 * math.sin(8.0 * mu)
    sin_fp = math.sin(fp)
    cos_fp = math.cos(fp)
    tan_fp = math.tan(fp)
    c1 = e1sq * cos_fp**2
    t1 = tan_fp**2
    r1 = a * (1.0 - e * e) / ((1.0 - e * e * sin_fp**2) ** 1.5)
    n1 = a / math.sqrt(1.0 - e * e * sin_fp**2)
    d = x / (n1 * k0)
    q1 = n1 * tan_fp / r1
    q2 = d**2 / 2.0
    q3 = (5.0 + 3.0 * t1 + 10.0 * c1 - 4.0 * c1**2 - 9.0 * e1sq) * d**4 / 24.0
    q4 = (61.0 + 90.0 * t1 + 298.0 * c1 + 45.0 * t1**2 - 252.0 * e1sq - 3.0 * c1**2) * d**6 / 720.0
    lat = fp - q1 * (q2 - q3 + q4)
    q5 = d
    q6 = (1.0 + 2.0 * t1 + c1) * d**3 / 6.0
    q7 = (5.0 - 2.0 * c1 + 28.0 * t1 - 3.0 * c1**2 + 8.0 * e1sq + 24.0 * t1**2) * d**5 / 120.0
    lng = lon0 + (q5 - q6 + q7) / cos_fp
    return math.degrees(lat), math.degrees(lng)
