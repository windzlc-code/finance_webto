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


def fetch(url: str, timeout: float, method: str = "GET") -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": "tfse-live-deployment-check/1.0"}, method=method)
    try:
        context = ssl._create_unverified_context() if url.startswith("https://") else None
        with urllib.request.urlopen(request, timeout=timeout, context=context) as response:
            body = response.read(4096).decode("utf-8", errors="replace")
            return {
                "ok": 200 <= response.status < 400,
                "status": response.status,
                "content_type": response.headers.get("Content-Type", ""),
                "headers": {key.lower(): value for key, value in response.headers.items()},
                "body": body,
                "sample": body[:240],
                "error": "",
            }
    except urllib.error.HTTPError as exc:
        body = exc.read(4096).decode("utf-8", errors="replace")
        return {"ok": False, "status": exc.code, "content_type": exc.headers.get("Content-Type", ""), "headers": {key.lower(): value for key, value in exc.headers.items()}, "body": body, "sample": body[:240], "error": str(exc)}
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "status": 0, "content_type": "", "headers": {}, "body": "", "sample": "", "error": f"{type(exc).__name__}: {exc}"}


def security_header_status(headers: dict) -> dict:
    expected = {
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "referrer-policy": "strict-origin-when-cross-origin",
        "permissions-policy": "camera=()",
        "content-security-policy": "frame-ancestors 'none'",
    }
    details = {}
    for key, needle in expected.items():
        value = headers.get(key, "")
        details[key] = bool(value and needle.lower() in value.lower())
    return {"ok": all(details.values()), "details": details}


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
        "security_headers": security_header_status(result.get("headers", {})),
        "counts": {key: payload.get(key) for key in ("leads", "audit_logs", "events", "public_feedback", "compliance_reviews", "privacy_requests", "bank_club_leads")},
        "error": result["error"],
    }


def check_api_options(base_url: str, path: str, timeout: float) -> dict:
    url = urljoin(normalize_base(base_url), path.lstrip("/"))
    result = fetch(url, timeout, method="OPTIONS")
    methods = result.get("headers", {}).get("access-control-allow-methods", "")
    ok = bool(result["status"] == 204 and "POST" in methods and "OPTIONS" in methods)
    return {
        "name": path.strip("/").replace("/", "_") + "_options",
        "url": url,
        "ok": ok,
        "status": result["status"],
        "content_type": result["content_type"],
        "allowed_methods": methods,
        "error": result["error"],
    }


def check_api_auth_required(base_url: str, path: str, timeout: float) -> dict:
    url = urljoin(normalize_base(base_url), path.lstrip("/"))
    result = fetch(url, timeout)
    ok = bool(result["status"] == 401 and "unauthorized" in result.get("body", ""))
    return {
        "name": path.strip("/").replace("/", "_") + "_auth",
        "url": url,
        "ok": ok,
        "status": result["status"],
        "content_type": result["content_type"],
        "error": result["error"],
    }


def check_static_url(base_url: str, path: str, timeout: float, expected: str = "", cache_contains: str = "") -> dict:
    url = urljoin(normalize_base(base_url), path.lstrip("/"))
    result = fetch(url, timeout)
    ok = bool(result["ok"])
    if expected:
        ok = ok and expected in result["sample"]
    headers = result.get("headers", {})
    security = security_header_status(headers)
    cache_ok = True
    if cache_contains:
        cache_ok = cache_contains.lower() in headers.get("cache-control", "").lower()
    ok = ok and security["ok"] and cache_ok
    return {
        "name": path.strip("/") or "home",
        "url": url,
        "ok": ok,
        "status": result["status"],
        "content_type": result["content_type"],
        "security_headers": security,
        "cache_control": headers.get("cache-control", ""),
        "cache_ok": cache_ok,
        "error": result["error"],
    }


def build_report(base_url: str, https_url: str, timeout: float) -> dict:
    checks = [
        check_static_url(base_url, "/", timeout, "Bank"),
        check_static_url(base_url, "/tfse/", timeout, "TFSE"),
        check_static_url(base_url, "/robots.txt", timeout, "Sitemap:", "max-age=3600"),
        check_static_url(base_url, "/sitemap.xml", timeout, "<urlset", "max-age=3600"),
        check_static_url(base_url, "/feed.xml", timeout, "<rss", "max-age=3600"),
        check_static_url(base_url, "/.well-known/security.txt", timeout, "Contact:", "max-age=86400"),
        check_static_url(base_url, "/tfse/site-config.json", timeout, '"base_url"', "no-store"),
        check_static_url(base_url, "/tfse/assets/images/logo/tfse-logo.png", timeout, "", "immutable"),
        check_static_url(base_url, "/admin/", timeout, "Bank Club"),
        check_json_api(base_url, timeout),
        check_api_options(base_url, "/api/bank-club/leads", timeout),
        check_api_auth_required(base_url, "/api/admin/bank-club/leads", timeout),
    ]
    https_check = check_static_url(https_url, "/", timeout, "Bank")
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
        security = item.get("security_headers", {})
        security_label = "headers=ok" if security.get("ok") else "headers=missing"
        cache = item.get("cache_control", "")
        cache_label = f"; cache={cache}" if cache else ""
        detail = item.get("error") or item.get("service") or item.get("content_type") or ""
        if item.get("allowed_methods"):
            detail = f"{detail}; methods={item['allowed_methods']}".strip("; ")
        if item.get("counts"):
            detail = f"{detail}; counts={json.dumps(item['counts'], ensure_ascii=False)}".strip("; ")
        if item.get("status"):
            detail = f"{detail}; {security_label}{cache_label}".strip("; ")
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
