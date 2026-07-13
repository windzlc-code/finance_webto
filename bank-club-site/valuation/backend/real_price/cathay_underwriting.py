from __future__ import annotations

import json
import os
import shutil
import subprocess
from typing import Any

from . import postgis_repository


def lookup_zone_by_coordinate(lat: float, lng: float) -> dict[str, Any]:
    lat = _coordinate(lat, "lat")
    lng = _coordinate(lng, "lng")
    direct = _lookup_zone_by_coordinate_direct(lat, lng)
    if direct is not None:
        return direct
    return _lookup_zone_by_coordinate_docker(lat, lng)


def _lookup_zone_by_coordinate_direct(lat: float, lng: float) -> dict[str, Any] | None:
    try:
        with postgis_repository._connect() as conn:
            row = conn.execute(
                """
                select row_to_json(x)::text as zone_json
                from lookup_cathay_underwriting_zone(%s, %s) x
                limit 1
                """,
                [lng, lat],
            ).fetchone()
    except Exception:
        return None
    zone = json.loads(row["zone_json"]) if row and row.get("zone_json") else None
    return _zone_response(lat, lng, zone, backend="postgis-direct")


def _lookup_zone_by_coordinate_docker(lat: float, lng: float) -> dict[str, Any]:
    sql = (
        "select coalesce(("
        f"select row_to_json(x)::text from lookup_cathay_underwriting_zone({lng:.15f},{lat:.15f}) x limit 1"
        "), 'null');"
    )
    container = os.environ.get("REAL_PRICE_POSTGIS_DOCKER_CONTAINER", "found-realprice-postgis")
    docker_bin = _docker_binary()
    proc = subprocess.run(
        [
            docker_bin,
            "exec",
            "-i",
            container,
            "psql",
            "-U",
            "found",
            "-d",
            "found_realprice",
            "-q",
            "-t",
            "-A",
            "-v",
            "ON_ERROR_STOP=1",
        ],
        input=sql,
        text=True,
        capture_output=True,
        check=False,
        timeout=20,
    )
    if proc.returncode != 0:
        return {
            "ok": False,
            "error": "cathay_underwriting_lookup_failed",
            "message": (proc.stderr or proc.stdout or "").strip(),
            "backend": "postgis-docker-psql",
        }
    line = next((item.strip() for item in proc.stdout.splitlines() if item.strip()), "null")
    zone = json.loads(line) if line != "null" else None
    return _zone_response(lat, lng, zone, backend="postgis-docker-psql")


def _zone_response(lat: float, lng: float, zone: dict[str, Any] | None, *, backend: str) -> dict[str, Any]:
    return {
        "ok": zone is not None,
        "backend": backend,
        "lat": lat,
        "lng": lng,
        "zone": zone,
        "message": None if zone else "座標未落在承作分區圖層內。",
    }


def _coordinate(value: float, name: str) -> float:
    parsed = float(value)
    if name == "lat" and not -90 <= parsed <= 90:
        raise ValueError("lat out of range")
    if name == "lng" and not -180 <= parsed <= 180:
        raise ValueError("lng out of range")
    return parsed


def _docker_binary() -> str:
    configured = os.environ.get("DOCKER_BIN", "").strip()
    if configured:
        return configured
    found = shutil.which("docker")
    if found:
        return found
    for candidate in (
        "/opt/homebrew/bin/docker",
        "/usr/local/bin/docker",
        "/Applications/Docker.app/Contents/Resources/bin/docker",
    ):
        if os.path.exists(candidate):
            return candidate
    return "docker"
