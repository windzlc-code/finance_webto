#!/usr/bin/env python3
from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


LEADS = []
AUDIT_LOGS = []
SESSIONS = {}
EVENTS = []
PUBLIC_FEEDBACK = []
LEAD_STATUS_RE = re.compile(r"^/api/admin/leads/([^/]+)/status$")
PRODUCT_DETAIL_RE = re.compile(r"^/api/products/([^/]+)$")
ARTICLE_DETAIL_RE = re.compile(r"^/api/articles/([^/]+)$")
ADMIN_PASSWORD = "TFSE-MVP-2026"
ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "assets" / "data"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def json_bytes(payload):
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")


def load_seed(name, fallback):
    try:
        return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))
    except Exception:
        return fallback


PRODUCTS = load_seed("products.json", [])
ARTICLES = load_seed("articles.json", [])
INSTITUTIONS = load_seed("institutions.json", [])
CATEGORIES = load_seed("categories.json", [])


def add_audit(action, target, detail=""):
    AUDIT_LOGS.insert(0, {
        "id": "audit_" + str(len(AUDIT_LOGS) + 1),
        "action": action,
        "target": target,
        "detail": detail,
        "created_at": now_iso(),
    })


def parse_cookie(header):
    cookies = {}
    for part in (header or "").split(";"):
        if "=" not in part:
            continue
        key, value = part.strip().split("=", 1)
        cookies[key] = value
    return cookies


def session_payload(role, session_id):
    permissions = {
        "super_admin": ["export", "backup", "launch_health", "acceptance", "privacy_request", "line_segment", "ad_campaign", "source_review", "update_lead", "manage_product", "manage_article", "review_article", "manage_faq", "compliance", "legal_review", "analytics"],
        "consultant": ["retrospective", "privacy_request", "line_segment", "update_lead", "analytics"],
        "viewer": ["retrospective", "launch_health", "acceptance", "analytics"],
    }
    return {
        "authenticated": True,
        "admin_user": {
            "id": "admin_mock_" + role,
            "role": role,
            "display_name": "Mock " + role,
        },
        "role": role,
        "permissions": permissions.get(role, permissions["viewer"]),
        "csrf_token": "mock_csrf_" + session_id,
        "expires_at": now_iso(),
    }


def role_from_request(handler):
    cookies = parse_cookie(handler.headers.get("Cookie", ""))
    session_id = cookies.get("tfse_admin_session", "")
    return session_id, SESSIONS.get(session_id)


def normalize_origin(handler):
    origin = handler.headers.get("Origin", "")
    return origin or "*"


def parse_query(handler):
    return parse_qs(urlparse(handler.path).query)


def first(query, key, default=""):
    value = query.get(key, [default])
    return value[0] if value else default


def includes_keyword(text, keyword):
    return keyword.lower() in (text or "").lower()


def filter_products(query):
    keyword = first(query, "keyword")
    product_type = first(query, "type")
    category = first(query, "category")
    audience = first(query, "audience")
    region = first(query, "region")
    status = first(query, "status")
    items = []
    for item in PRODUCTS:
        if product_type and item.get("type") != product_type:
            continue
        if category and item.get("category") != category:
            continue
        if audience and not includes_keyword(item.get("audience", ""), audience):
            continue
        if region and not includes_keyword(item.get("region", ""), region):
            continue
        if status and item.get("status") != status:
            continue
        if keyword:
            haystack = " ".join([
                item.get("title", ""),
                item.get("summary", ""),
                item.get("type_label", ""),
                item.get("category_label", ""),
                item.get("source_title", ""),
                " ".join(item.get("checks", [])),
            ])
            if not includes_keyword(haystack, keyword):
                continue
        items.append(item)
    return items


def filter_articles(query):
    keyword = first(query, "keyword")
    category = first(query, "category")
    status = first(query, "status") or "published"
    items = []
    for item in ARTICLES:
        if status and item.get("status") != status:
            continue
        if category and item.get("category") != category:
            continue
        if keyword:
            haystack = " ".join([
                item.get("title", ""),
                item.get("summary", ""),
                item.get("category", ""),
                item.get("seo_description", ""),
                " ".join(item.get("keywords", [])),
            ])
            if not includes_keyword(haystack, keyword):
                continue
        items.append(item)
    return items


def filter_institutions(query):
    keyword = first(query, "keyword")
    institution_type = first(query, "type")
    region = first(query, "region")
    items = []
    for item in INSTITUTIONS:
        if institution_type and item.get("type") != institution_type:
            continue
        if region and not includes_keyword(item.get("region", ""), region):
            continue
        if keyword:
            haystack = " ".join([
                item.get("name", ""),
                item.get("summary", ""),
                item.get("type_label", ""),
                item.get("registry_ref", ""),
            ])
            if not includes_keyword(haystack, keyword):
                continue
        items.append(item)
    return items


def public_search(query):
    keyword = first(query, "q")
    if not keyword:
        return {"products": [], "articles": [], "categories": []}
    category_items = []
    for item in CATEGORIES:
        haystack = " ".join([item.get("title", ""), item.get("short_title", ""), item.get("description", "")])
        if includes_keyword(haystack, keyword):
            category_items.append(item)
    return {
        "products": filter_products({"keyword": [keyword]}),
        "articles": filter_articles({"keyword": [keyword], "status": ["published"]}),
        "categories": category_items,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "TFSEMockFormalAPI/1.0"

    def log_message(self, fmt, *args):
        return

    def _set_headers(self, status=200, content_type="application/json; charset=utf-8"):
        origin = normalize_origin(self)
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.end_headers()

    def _read_json(self):
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def _write_json(self, payload, status=200):
        self._set_headers(status=status)
        self.wfile.write(json_bytes(payload))

    def do_OPTIONS(self):
        self._set_headers(status=204, content_type="text/plain; charset=utf-8")

    def do_GET(self):
        path = urlparse(self.path).path
        query = parse_query(self)
        if path == "/health":
            self._write_json({
                "ok": True,
                "service": "tfse_mock_formal_api",
                "leads": len(LEADS),
                "audit_logs": len(AUDIT_LOGS),
                "events": len(EVENTS),
                "public_feedback": len(PUBLIC_FEEDBACK),
                "generated_at": now_iso(),
            })
            return
        if path == "/api/products":
            items = filter_products(query)
            self._write_json({"items": items, "page": 1, "total": len(items)})
            return
        if path == "/api/articles":
            items = filter_articles(query)
            self._write_json({"items": items, "page": 1, "total": len(items)})
            return
        if path == "/api/institutions":
            items = filter_institutions(query)
            self._write_json({"items": items, "total": len(items)})
            return
        if path == "/api/search":
            self._write_json(public_search(query))
            return
        product_match = PRODUCT_DETAIL_RE.match(path)
        if product_match:
            slug = product_match.group(1)
            product = next((item for item in PRODUCTS if item.get("slug") == slug), None)
            if not product:
                self._write_json({"error": "product_not_found", "slug": slug}, status=404)
                return
            self._write_json(product)
            return
        article_match = ARTICLE_DETAIL_RE.match(path)
        if article_match:
            slug = article_match.group(1)
            article = next((item for item in ARTICLES if item.get("slug") == slug and item.get("status") == "published"), None)
            if not article:
                self._write_json({"error": "article_not_found", "slug": slug}, status=404)
                return
            self._write_json(article)
            return
        if path == "/api/admin/auth/session":
            session_id, role = role_from_request(self)
            if not role:
                self._write_json({"authenticated": False}, status=401)
                return
            self._write_json(session_payload(role, session_id))
            return
        if path == "/api/admin/leads":
            _, role = role_from_request(self)
            if not role:
                self._write_json({"error": "unauthorized"}, status=401)
                return
            self._write_json({"items": LEADS})
            return
        if path == "/api/admin/audit-logs":
            _, role = role_from_request(self)
            if not role:
                self._write_json({"error": "unauthorized"}, status=401)
                return
            self._write_json({"items": AUDIT_LOGS})
            return
        self._write_json({"error": "not_found", "path": path}, status=404)

    def do_POST(self):
        path = urlparse(self.path).path
        if path != "/api/leads":
            if path == "/api/events":
                payload = self._read_json()
                EVENTS.insert(0, {
                    "id": "event_" + str(len(EVENTS) + 1),
                    "name": payload.get("name", ""),
                    "path": payload.get("path", ""),
                    "url": payload.get("url", ""),
                    "payload": payload.get("payload", {}),
                    "at": payload.get("at") or now_iso(),
                })
                self._write_json({"accepted": True}, status=200)
                return
            if path == "/api/public-feedback":
                payload = self._read_json()
                ticket_id = "feedback_" + str(len(PUBLIC_FEEDBACK) + 1)
                ticket = {
                    "ticket_id": ticket_id,
                    "status": "queued",
                    "assigned_role": "data_manager",
                    "related_task_type": payload.get("feedback_type", "content_review"),
                    "disclaimer": "TFSE 僅接收公開資料回報與低敏摘要，不收證件、帳戶或密碼。",
                }
                PUBLIC_FEEDBACK.insert(0, dict(payload, **ticket))
                add_audit("public_feedback_submit", ticket_id, payload.get("feedback_type", ""))
                self._write_json(ticket, status=200)
                return
            if path == "/api/admin/auth/login":
                payload = self._read_json()
                role = payload.get("role") or "viewer"
                if payload.get("password") != ADMIN_PASSWORD:
                    self._write_json({"authenticated": False, "error": "invalid_credentials"}, status=401)
                    return
                session_id = "session_" + str(len(SESSIONS) + 1)
                SESSIONS[session_id] = role
                origin = normalize_origin(self)
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Access-Control-Allow-Credentials", "true")
                self.send_header("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
                self.send_header("Set-Cookie", f"tfse_admin_session={session_id}; Path=/; HttpOnly; SameSite=Lax")
                self.end_headers()
                add_audit("admin_login", role, "mock auth login")
                self.wfile.write(json_bytes(session_payload(role, session_id)))
                return
            if path == "/api/admin/auth/logout":
                cookies = parse_cookie(self.headers.get("Cookie", ""))
                session_id = cookies.get("tfse_admin_session", "")
                if session_id and session_id in SESSIONS:
                    SESSIONS.pop(session_id, None)
                    add_audit("admin_logout", session_id, "mock auth logout")
                origin = normalize_origin(self)
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Access-Control-Allow-Credentials", "true")
                self.send_header("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
                self.send_header("Set-Cookie", "tfse_admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax")
                self.end_headers()
                self.wfile.write(json_bytes({"authenticated": False}))
                return
            self._write_json({"error": "not_found", "path": path}, status=404)
            return
        payload = self._read_json()
        lead_id = payload.get("id") or ("lead_mock_" + str(len(LEADS) + 1))
        lead = dict(payload)
        lead["id"] = lead_id
        lead["status"] = lead.get("status") or "new"
        lead["submitted_at"] = lead.get("submitted_at") or now_iso()
        lead["updated_at"] = now_iso()
        LEADS.insert(0, lead)
        add_audit("lead_submit", lead_id, "mock formal api accepted lead")
        self._write_json({"id": lead_id, "status": lead["status"], "lead": lead}, status=200)

    def do_PATCH(self):
        path = urlparse(self.path).path
        match = LEAD_STATUS_RE.match(path)
        if not match:
            self._write_json({"error": "not_found", "path": path}, status=404)
            return
        _, role = role_from_request(self)
        if not role:
            self._write_json({"error": "unauthorized"}, status=401)
            return
        lead_id = match.group(1)
        payload = self._read_json()
        lead = next((item for item in LEADS if item.get("id") == lead_id), None)
        if not lead:
            self._write_json({"error": "lead_not_found", "id": lead_id}, status=404)
            return
        lead["status"] = payload.get("status") or lead.get("status") or "new"
        if payload.get("assigned_to"):
            lead["assigned_to"] = payload["assigned_to"]
        if payload.get("follow_up_priority"):
            lead["follow_up_priority"] = payload["follow_up_priority"]
        if "next_follow_up_at" in payload:
            lead["next_follow_up_at"] = payload.get("next_follow_up_at") or ""
        if payload.get("contact_log"):
            lead["contact_logs"] = (lead.get("contact_logs") or []) + [payload["contact_log"]]
        if payload.get("note"):
            lead["notes"] = (lead.get("notes") or []) + [payload["note"]]
        lead["updated_at"] = now_iso()
        add_audit("lead_status_update", lead_id, lead["status"])
        self._write_json({"lead": lead}, status=200)


def parse_args():
    parser = argparse.ArgumentParser(description="TFSE local mock formal API server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8788)
    return parser.parse_args()


def main():
    args = parse_args()
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"TFSE mock formal API listening on http://{args.host}:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
