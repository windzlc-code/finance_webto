#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    ".github/workflows/tfse-acceptance.yml",
    "admin.html",
    "api-contract.json",
    "assets/css/style.css",
    "assets/data/bank-club.json",
    "assets/images/bank-club/bank_club_line_qr.png",    "assets/images/bank-club/home_hero_office.jpg",
    "assets/js/bank-club-admin.js",
    "backend/tfse_persistent_api.py",
    "bank-club-site/src/app/page.tsx",
    "bank-club-site/src/components/PublicLayout.tsx",
    "docker-compose.yml",
    "docker/gateway.nginx.conf",
    "index.html",
    "site-config.json",
    "tools/bank_club_deployment_manifest.py",
    "tools/bank_club_integration_smoke.mjs",
]

API_ENDPOINTS = {
    ("POST", "/api/bank-club/leads"),
    ("GET", "/api/admin/bank-club/leads"),
    ("PATCH", "/api/admin/bank-club/leads/:id/status"),
}

TEXT_MARKERS = {
    "admin.html": ["data-bank-club-admin", "銀行行員俱樂部後台", 'href="/"', "assets/js/bank-club-admin.js"],
    "index.html": ['href="/"', "前往銀行行員俱樂部"],
    "assets/js/bank-club-admin.js": ["/api/admin/bank-club/leads", "tfse_admin_api_session", "data-bank-export", "source_mode"],
    "backend/tfse_persistent_api.py": ["bank_club_leads", "normalize_api_path", "/api/admin/bank-club/leads", "/api/bank-club/leads", "BANK_CLUB_LEAD_STATUS_RE", 'source_page") or "/"'],
    "bank-club-site/src/app/page.tsx": ["銀行行員俱樂部", "立即免費諮詢", "首頁核心入口"],
    "bank-club-site/src/components/PublicLayout.tsx": ["/tfse/", "TFSE 金融站"],
    "docker-compose.yml": ["finance:", "bankclub:", "backadmin:"],
    "docker/gateway.nginx.conf": ["bankclub_upstream", "finance_upstream", "backadmin_upstream", "location /", "location ^~ /tfse/"],
    "tools/bank_club_integration_smoke.mjs": ["tfse_bank_club_integration_smoke", "Bank Club lead API accepts shared admin payload", "Bank Club admin export includes API leads", "/tfse/api/health"],
    ".github/workflows/tfse-acceptance.yml": ["Bank Club shared admin smoke test", "tools/bank_club_integration_smoke.mjs"],
}


def git_tracked(path: str) -> bool:
    try:
        result = subprocess.run(
            ["git", "ls-files", "--error-unmatch", path],
            cwd=ROOT,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        return result.returncode == 0
    except OSError:
        return True


def build_report() -> dict:
    failures = []
    file_checks = []
    for path in REQUIRED_FILES:
        exists = (ROOT / path).exists()
        tracked = git_tracked(path) if exists else False
        file_checks.append({"path": path, "exists": exists, "git_tracked": tracked})
        if not exists:
            failures.append(f"{path}: missing required Bank Club deployment file")
        elif not tracked:
            failures.append(f"{path}: file exists but is not tracked by git")

    marker_checks = []
    for path, markers in TEXT_MARKERS.items():
        text = (ROOT / path).read_text(encoding="utf-8", errors="ignore") if (ROOT / path).exists() else ""
        for marker in markers:
            ok = marker in text
            marker_checks.append({"path": path, "marker": marker, "ok": ok})
            if not ok:
                failures.append(f"{path}: missing marker {marker}")

    try:
        contract = json.loads((ROOT / "api-contract.json").read_text(encoding="utf-8"))
        endpoints = {(item.get("method"), item.get("path")) for item in contract.get("endpoints", [])}
    except Exception as error:  # noqa: BLE001
        endpoints = set()
        failures.append(f"api-contract.json: {error}")
    endpoint_checks = []
    for method, path in sorted(API_ENDPOINTS):
        ok = (method, path) in endpoints
        endpoint_checks.append({"method": method, "path": path, "ok": ok})
        if not ok:
            failures.append(f"api-contract.json: missing {method} {path}")

    data_checks = []
    try:
        data = json.loads((ROOT / "assets/data/bank-club.json").read_text(encoding="utf-8"))
        for key in ("site", "settings", "services", "articles", "files", "processSteps"):
            ok = key in data and bool(data[key])
            data_checks.append({"key": key, "ok": ok})
            if not ok:
                failures.append(f"assets/data/bank-club.json: missing or empty {key}")
    except Exception as error:  # noqa: BLE001
        failures.append(f"assets/data/bank-club.json: {error}")

    return {
        "format": "tfse_bank_club_deployment_manifest",
        "ok": not failures,
        "summary": {
            "required_files": len(file_checks),
            "untracked_files": sum(1 for item in file_checks if item["exists"] and not item["git_tracked"]),
            "marker_checks": len(marker_checks),
            "endpoint_checks": len(endpoint_checks),
            "failures": len(failures),
        },
        "file_checks": file_checks,
        "marker_checks": marker_checks,
        "endpoint_checks": endpoint_checks,
        "data_checks": data_checks,
        "failures": failures,
        "required_commands": [
            "NODE_PATH=/path/to/node_modules node tools/bank_club_integration_smoke.mjs",
            "python3 tools/live_deployment_check.py --markdown",
        ],
    }


def markdown(report: dict) -> str:
    lines = [
        "# Bank Club Deployment Manifest",
        "",
        f"- OK: `{report['ok']}`",
        f"- Required files: `{report['summary']['required_files']}`",
        f"- Untracked files: `{report['summary']['untracked_files']}`",
        f"- Failures: `{report['summary']['failures']}`",
        "",
        "## Failures",
        "",
    ]
    if report["failures"]:
        lines.extend(f"- {item}" for item in report["failures"])
    else:
        lines.append("- 無")
    lines.extend(["", "## Required Commands", ""])
    lines.extend(f"- `{item}`" for item in report["required_commands"])
    return "\n".join(lines)


def main() -> int:
    report = build_report()
    if "--markdown" in sys.argv:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
