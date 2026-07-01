#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    ".dockerignore",
    "apps/backadmin/server.py",
    "docker-compose.yml",
    "docker/finance.Dockerfile",
    "docker/bankclub.Dockerfile",
    "docker/backadmin.Dockerfile",
    "docker/finance.nginx.conf",
    "docker/gateway.nginx.conf",
]

TEXT_MARKERS = {
    "docker-compose.yml": [
        "container_name: finance",
        "container_name: bankclub",
        "container_name: backadmin",
        "container_name: gateway",
        "backadmin-data:",
    ],
    "docker/gateway.nginx.conf": [
        "server finance:80",
        "server bankclub:3000",
        "server backadmin:8788",
        "location ^~ /bankclub/api/",
        "location ^~ /api/",
        "location ^~ /admin/",
    ],
    "apps/backadmin/server.py": [
        "class BackadminHandler",
        "TFSE_DB_PATH",
        "/admin.html",
        "Store(Path(args.db))",
    ],
    "bank-club-site/next.config.ts": [
        "BANKCLUB_BASE_PATH",
        "basePath",
    ],
}


def build_failures() -> list[str]:
    failures = []
    for name in REQUIRED_FILES:
        if not (ROOT / name).exists():
            failures.append(f"{name}: missing")
    for name, markers in TEXT_MARKERS.items():
        path = ROOT / name
        text = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
        for marker in markers:
            if marker not in text:
                failures.append(f"{name}: missing marker {marker}")
    return failures


def markdown(failures: list[str]) -> str:
    lines = [
        "# Container Topology Check",
        "",
        f"- OK: `{not failures}`",
        f"- Services: `finance`, `bankclub`, `backadmin`, `gateway`",
        f"- Failures: `{len(failures)}`",
        "",
        "## Failures",
        "",
    ]
    lines.extend(f"- {item}" for item in failures) if failures else lines.append("- 無")
    return "\n".join(lines)


def main() -> int:
    failures = build_failures()
    if "--markdown" in sys.argv:
        print(markdown(failures))
    else:
        for item in failures:
            print(item)
        if not failures:
            print("container topology check passed")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
