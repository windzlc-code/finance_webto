#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from http.cookiejar import CookieJar
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def request_json(opener, base_url: str, method: str, path: str, payload: dict | None = None, timeout: float = 5.0) -> dict:
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(base_url.rstrip("/") + path, data=data, headers=headers, method=method)
    with opener.open(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8") or "{}")


def expect_json_error(opener, base_url: str, method: str, path: str, payload: dict, expected_status: int, expected_error: str) -> dict:
    try:
        response = request_json(opener, base_url, method, path, payload)
    except urllib.error.HTTPError as exc:
        body = json.loads(exc.read().decode("utf-8") or "{}")
        if exc.code != expected_status:
            raise AssertionError(f"expected HTTP {expected_status}, got {exc.code}: {body}") from exc
        if body.get("error") != expected_error:
            raise AssertionError(f"expected error {expected_error}, got {body}") from exc
        return body
    raise AssertionError(f"expected HTTP {expected_status}/{expected_error}, got success: {response}")


def wait_for_health(opener, base_url: str, timeout_s: float = 8.0) -> dict:
    deadline = time.time() + timeout_s
    last_error = ""
    while time.time() < deadline:
        try:
            data = request_json(opener, base_url, "GET", "/api/health", timeout=1.5)
            if data.get("ok"):
                return data
        except Exception as exc:  # noqa: BLE001
            last_error = f"{type(exc).__name__}: {exc}"
        time.sleep(0.2)
    raise RuntimeError(f"persistent API did not become healthy: {last_error}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke test TFSE persistent API")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8799)
    parser.add_argument("--keep-server", action="store_true")
    args = parser.parse_args()

    base_url = f"http://{args.host}:{args.port}"
    cookie_jar = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))

    with tempfile.TemporaryDirectory(prefix="tfse-api-smoke-") as temp_dir:
        db_path = Path(temp_dir) / "tfse.sqlite3"
        proc = subprocess.Popen(
            [
                sys.executable,
                str(ROOT / "backend" / "tfse_persistent_api.py"),
                "--host",
                args.host,
                "--port",
                str(args.port),
                "--db",
                str(db_path),
            ],
            cwd=str(ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        try:
            health = wait_for_health(opener, base_url)
            expect_json_error(
                opener,
                base_url,
                "POST",
                "/api/leads",
                {"display_name": "未同意測試", "phone": "0912-000-001", "needs": "金融資訊查詢"},
                400,
                "privacy_consent_required",
            )
            expect_json_error(
                opener,
                base_url,
                "POST",
                "/api/leads",
                {"display_name": "蜜罐測試", "phone": "0912-000-002", "needs": "金融資訊查詢", "website": "https://spam.example", "consent_privacy": True},
                400,
                "honeypot_rejected",
            )
            expect_json_error(
                opener,
                base_url,
                "POST",
                "/api/leads",
                {"display_name": "敏感資料測試", "phone": "0912-000-003", "needs": "金融資訊查詢", "message": "我的信用卡 4111111111111111", "consent_privacy": True},
                400,
                "high_risk_sensitive_payload",
            )
            lead_payload = {
                "id": "lead_smoke_001",
                "display_name": "測試使用者",
                "phone": "0912-345-678",
                "line_id": "tfse-smoke",
                "region": "台北市",
                "needs": "金融資訊查詢",
                "occupation_type": "office_worker",
                "income_type": "salary",
                "message": "希望了解合法公開資訊。",
                "consent_privacy": True,
                "consent_line": True,
                "consent_version": "2026-06",
                "source_url": "http://127.0.0.1/free-check.html",
                "utm_source": "smoke",
                "device_id": "smoke-device-001",
            }
            lead = request_json(opener, base_url, "POST", "/api/leads", lead_payload)
            if lead.get("id") != "lead_smoke_001":
                raise AssertionError(f"lead id mismatch: {lead}")
            duplicate_payload = dict(lead_payload)
            duplicate_payload["id"] = "lead_smoke_duplicate"
            duplicate_payload["device_id"] = "smoke-device-duplicate"
            duplicate = request_json(opener, base_url, "POST", "/api/leads", duplicate_payload)
            if duplicate.get("id") != "lead_smoke_001" or not duplicate.get("duplicate"):
                raise AssertionError(f"duplicate lead was not reused: {duplicate}")

            login = request_json(opener, base_url, "POST", "/api/admin/auth/login", {"password": "TFSE-MVP-2026", "role": "super_admin"})
            if not login.get("authenticated"):
                raise AssertionError(f"admin login failed: {login}")

            leads = request_json(opener, base_url, "GET", "/api/admin/leads")
            if not any(item.get("id") == "lead_smoke_001" for item in leads.get("items", [])):
                raise AssertionError(f"submitted lead not visible in admin list: {leads}")

            patched = request_json(
                opener,
                base_url,
                "PATCH",
                "/api/admin/leads/lead_smoke_001/status",
                {"status": "contacted", "note": "smoke follow-up", "assigned_to": "consultant", "contact_log": {"channel": "line", "outcome": "sent"}},
            )
            if (patched.get("lead") or {}).get("status") != "contacted":
                raise AssertionError(f"lead status update failed: {patched}")

            feedback = request_json(opener, base_url, "POST", "/api/public-feedback", {"feedback_type": "content_review", "summary": "公開資料回報測試", "page_url": "/source-policy.html"})
            if not feedback.get("ticket_id"):
                raise AssertionError(f"feedback ticket missing: {feedback}")

            compliance = request_json(
                opener,
                base_url,
                "POST",
                "/api/admin/compliance/review",
                {
                    "review_type": "page",
                    "target": "/free-check.html",
                    "result": "approved",
                    "note": "smoke compliance review",
                    "scan_payload": {"forbidden_terms": [], "privacy_notice": True},
                },
            )
            if not (compliance.get("review") or {}).get("id"):
                raise AssertionError(f"compliance review missing: {compliance}")

            privacy = request_json(
                opener,
                base_url,
                "PATCH",
                "/api/admin/privacy-requests/lead_smoke_001",
                {"request_type": "delete", "request_status": "completed", "note": "smoke privacy fulfillment"},
            )
            if (privacy.get("privacy_request") or {}).get("request_status") != "completed":
                raise AssertionError(f"privacy request update failed: {privacy}")

            privacy_queue = request_json(opener, base_url, "GET", "/api/admin/privacy-requests")
            if not any(item.get("lead_id") == "lead_smoke_001" for item in privacy_queue.get("items", [])):
                raise AssertionError(f"privacy request not visible in queue: {privacy_queue}")

            audits = request_json(opener, base_url, "GET", "/api/admin/audit-logs")
            actions = {item.get("action") for item in audits.get("items", [])}
            for action in ("lead_submit", "lead_duplicate_reuse", "admin_login", "lead_status_update", "public_feedback_submit", "compliance_review_create", "privacy_request_update"):
                if action not in actions:
                    raise AssertionError(f"missing audit action {action}: {audits}")

            final_health = request_json(opener, base_url, "GET", "/api/health")
            if final_health.get("leads") != 1 or final_health.get("compliance_reviews") != 1 or final_health.get("privacy_requests") != 1:
                raise AssertionError(f"final health missing compliance/privacy counts: {final_health}")
            print(
                json.dumps(
                    {
                        "ok": True,
                        "format": "tfse_persistent_api_smoke",
                        "initial_health": health,
                        "final_health": final_health,
                        "verified": [
                            "health",
                            "lead_reject_without_privacy_consent",
                            "lead_reject_honeypot",
                            "lead_reject_sensitive_payload",
                            "lead_submit",
                            "lead_duplicate_reuse",
                            "admin_login",
                            "admin_lead_list",
                            "lead_status_patch",
                            "public_feedback",
                            "compliance_review",
                            "privacy_request_fulfillment",
                            "audit_logs",
                        ],
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return 0
        finally:
            if not args.keep_server:
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()


if __name__ == "__main__":
    raise SystemExit(main())
