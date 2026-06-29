#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import ssl
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse


DEFAULT_BASE_URL = "http://www.tfse-fcc.com/"
DEFAULT_HTTPS_URL = "https://www.tfse-fcc.com/"


def fetch(url: str, timeout: float) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": "tfse-live-deployment-check/1.0"})
    try:
        context = ssl._create_unverified_context() if url.startswith("https://") else None
        with urllib.request.urlopen(request, timeout=timeout, context=context) as response:
            body = response.read(4096).decode("utf-8", errors="replace")
            return {
                "ok": 200 <= response.status < 400,
                "status": response.status,
                "content_type": response.headers.get("Content-Type", ""),
                "body": body,
                "sample": body[:240],
                "error": "",
            }
    except urllib.error.HTTPError as exc:
        return {"ok": False, "status": exc.code, "content_type": exc.headers.get("Content-Type", ""), "body": "", "sample": "", "error": str(exc)}
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "status": 0, "content_type": "", "body": "", "sample": "", "error": f"{type(exc).__name__}: {exc}"}


def normalize_base(url: str) -> str:
    return url.rstrip("/") + "/"


def check_json_api(base_url: str, timeout: float) -> dict:
    url = urljoin(normalize_base(base_url), "api/health")
    result = fetch(url, timeout)
    payload = {}
    if result["ok"]:
        try:
            payload = json.loads(result["body"])
        except json.JSONDecodeError:
            result["ok"] = False
            result["error"] = "api health did not return JSON"
    return {
        "name": "api_health",
        "url": url,
        "ok": bool(result["ok"] and payload.get("ok") and payload.get("service") == "tfse_persistent_api"),
        "status": result["status"],
        "service": payload.get("service", ""),
        "counts": {key: payload.get(key) for key in ("leads", "audit_logs", "events", "public_feedback", "compliance_reviews", "privacy_requests")},
        "error": result["error"],
    }


def check_static_url(base_url: str, path: str, timeout: float, expected: str = "") -> dict:
    url = urljoin(normalize_base(base_url), path.lstrip("/"))
    result = fetch(url, timeout)
    ok = bool(result["ok"])
    if expected:
        ok = ok and expected in result["sample"]
    return {
        "name": path.strip("/") or "home",
        "url": url,
        "ok": ok,
        "status": result["status"],
        "content_type": result["content_type"],
        "error": result["error"],
    }


def build_report(base_url: str, https_url: str, timeout: float) -> dict:
    checks = [
        check_static_url(base_url, "/", timeout, "TFSE"),
        check_static_url(base_url, "/robots.txt", timeout, "Sitemap:"),
        check_static_url(base_url, "/sitemap.xml", timeout, "<urlset"),
        check_static_url(base_url, "/feed.xml", timeout, "<rss"),
        check_static_url(base_url, "/.well-known/security.txt", timeout, "Contact:"),
        check_json_api(base_url, timeout),
    ]
    https_check = check_static_url(https_url, "/", timeout, "TFSE")
    https_check["name"] = "https_home"
    https_check["external_blocker_when_failed"] = True
    checks.append(https_check)
    required_checks = [item for item in checks if not item.get("external_blocker_when_failed")]
    external_blockers = []
    if not https_check["ok"]:
        external_blockers.append(
            {
                "key": "https_public_ingress",
                "label": "公网 HTTPS 443 尚未打通",
                "evidence": https_check.get("error") or f"status={https_check.get('status')}",
                "next_action": "在云厂商安全组 / 防火墙开放 TCP 443 后重跑本命令。",
            }
        )
    return {
        "format": "tfse_live_deployment_check",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "base_url": base_url,
        "host": urlparse(base_url).netloc,
        "summary": {
            "required_ok": all(item["ok"] for item in required_checks),
            "https_ok": bool(https_check["ok"]),
            "external_blockers": len(external_blockers),
            "checks": len(checks),
        },
        "checks": checks,
        "external_blockers": external_blockers,
    }


def render_markdown(report: dict) -> str:
    lines = [
        "# TFSE Live Deployment Check",
        "",
        f"- Base URL: `{report['base_url']}`",
        f"- Required checks OK: `{report['summary']['required_ok']}`",
        f"- HTTPS OK: `{report['summary']['https_ok']}`",
        f"- External blockers: `{report['summary']['external_blockers']}`",
        "",
        "| Check | URL | OK | Status | Detail |",
        "| --- | --- | --- | --- | --- |",
    ]
    for item in report["checks"]:
        detail = item.get("error") or item.get("service") or item.get("content_type") or ""
        lines.append(f"| {item['name']} | {item['url']} | {item['ok']} | {item['status']} | {detail} |")
    if report["external_blockers"]:
        lines.extend(["", "## External Blockers"])
        for item in report["external_blockers"]:
            lines.append(f"- `{item['key']}`: {item['label']}。{item['evidence']}；{item['next_action']}")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Check live TFSE static site and staging API endpoints.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--https-url", default=DEFAULT_HTTPS_URL)
    parser.add_argument("--timeout", type=float, default=8.0)
    parser.add_argument("--markdown", action="store_true")
    parser.add_argument("--strict-https", action="store_true", help="Return non-zero when public HTTPS is not reachable.")
    args = parser.parse_args()

    report = build_report(args.base_url, args.https_url, args.timeout)
    if args.markdown:
        print(render_markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    if not report["summary"]["required_ok"]:
        return 1
    if args.strict_https and not report["summary"]["https_ok"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
