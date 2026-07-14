#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import sys
import threading
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse
import urllib.request


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "assets" / "data"
DEFAULT_DB = ROOT / "data" / "tfse.sqlite3"
DEFAULT_ADMIN_PASSWORD = "admin123"
LEAD_STATUS_RE = re.compile(r"^/api/admin/leads/([^/]+)/status$")
PRIVACY_REQUEST_RE = re.compile(r"^/api/admin/privacy-requests/([^/]+)$")
PRODUCT_DETAIL_RE = re.compile(r"^/api/products/([^/]+)$")
ARTICLE_DETAIL_RE = re.compile(r"^/api/articles/([^/]+)$")
ADMIN_PRODUCT_RE = re.compile(r"^/api/admin/products/([^/]+)$")
ADMIN_ARTICLE_RE = re.compile(r"^/api/admin/articles/([^/]+)$")
BANK_CLUB_LEAD_STATUS_RE = re.compile(r"^/api/admin/bank-club/leads/([^/]+)/status$")
TELEGRAM_TOKEN_RE = re.compile(r"^\d{5,15}:[A-Za-z0-9_-]{20,}$")
TELEGRAM_CHAT_ID_RE = re.compile(r"^(?:-?\d{5,20}|@[A-Za-z0-9_]{5,})$")
LINE_RECIPIENT_ID_RE = re.compile(r"^[UCR][0-9A-Fa-f]{32}$")
SENSITIVE_PATTERNS = [
    re.compile(r"\b[A-Z][12]\d{8}\b", re.I),
    re.compile(r"\b\d{12,19}\b"),
    re.compile(r"(銀行帳號|帳戶|密碼|password|cvv|信用卡)", re.I),
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def json_bytes(payload: object) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")


def load_seed(name: str, fallback: object) -> object:
    try:
        return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))
    except Exception:
        return fallback


PRODUCTS = load_seed("products.json", [])
ARTICLES = load_seed("articles.json", [])
INSTITUTIONS = load_seed("institutions.json", [])
CATEGORIES = load_seed("categories.json", [])


def has_high_risk_text(payload: dict) -> bool:
    text = json.dumps(payload, ensure_ascii=False)
    return any(pattern.search(text) for pattern in SENSITIVE_PATTERNS)


def redact_sensitive_text(value: object) -> str:
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
    for pattern in SENSITIVE_PATTERNS:
        text = pattern.sub("[redacted]", text)
    return text


def mask_secret(value: str, start: int = 5, end: int = 4) -> str:
    value = str(value or "")
    if not value:
        return ""
    if len(value) <= start + end:
        return "已設定"
    return value[:start] + "…" + value[-end:]


def as_bool(value: object) -> bool:
    """Parse JSON and form-style booleans without treating "false" as true."""
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def normalize_api_path(path: str) -> str:
    """Accept API requests with or without the deployed /tfse site prefix."""
    if path == "/tfse":
        return "/"
    if path.startswith("/tfse/"):
        return path[len("/tfse") :]
    return path


def phone_last3(phone: str) -> str:
    digits = re.sub(r"\D+", "", phone or "")
    return digits[-3:] if digits else ""


def phone_hash(phone: str) -> str:
    digits = re.sub(r"\D+", "", phone or "")
    salt = os.getenv("TFSE_PHONE_HASH_SALT", "tfse-local-salt")
    return hashlib.sha256((salt + ":" + digits).encode("utf-8")).hexdigest() if digits else ""


def stable_hash(value: str, salt_name: str = "TFSE_HASH_SALT") -> str:
    salt = os.getenv(salt_name, "tfse-local-salt")
    return hashlib.sha256((salt + ":" + str(value or "")).encode("utf-8")).hexdigest()


def turnstile_enabled() -> bool:
    return os.getenv("TFSE_TURNSTILE_ENABLED", "").strip().lower() in {"1", "true", "yes", "on"}


def verify_turnstile_token(token: str, remote_ip: str = "") -> bool:
    secret = os.getenv("TFSE_TURNSTILE_SECRET", "").strip()
    if not turnstile_enabled():
        return True
    if not secret or not token:
        return False
    body = urlencode({"secret": secret, "response": token, "remoteip": remote_ip}).encode("utf-8")
    request = urllib.request.Request(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=4) as response:
            data = json.loads(response.read().decode("utf-8") or "{}")
        return bool(data.get("success"))
    except Exception:
        return False


def public_lead(row: sqlite3.Row) -> dict:
    payload = json.loads(row["payload_json"] or "{}")
    payload.update(
        {
            "id": row["id"],
            "status": row["status"],
            "phone_last3": row["phone_last3"],
            "submitted_at": row["submitted_at"],
            "updated_at": row["updated_at"],
            "assigned_to": row["assigned_to"] or "",
            "follow_up_priority": row["follow_up_priority"] or "normal",
            "next_follow_up_at": row["next_follow_up_at"] or "",
            "contact_logs": json.loads(row["contact_logs_json"] or "[]"),
            "notes": json.loads(row["notes_json"] or "[]"),
        }
    )
    payload.pop("phone", None)
    payload.pop("line_id", None)
    return payload


def includes_keyword(text: str, keyword: str) -> bool:
    return str(keyword or "").lower() in str(text or "").lower()


def first(query: dict, key: str, default: str = "") -> str:
    value = query.get(key, [default])
    return value[0] if value else default


def filter_products_items(source_items: list[dict], query: dict) -> list[dict]:
    keyword = first(query, "keyword")
    product_type = first(query, "type")
    category = first(query, "category")
    audience = first(query, "audience")
    region = first(query, "region")
    status = first(query, "status")
    items = []
    for item in source_items:
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
            haystack = " ".join(
                [
                    item.get("title", ""),
                    item.get("summary", ""),
                    item.get("type_label", ""),
                    item.get("category_label", ""),
                    item.get("source_title", ""),
                    " ".join(item.get("checks", [])),
                ]
            )
            if not includes_keyword(haystack, keyword):
                continue
        items.append(item)
    return items


def filter_products(query: dict) -> list[dict]:
    return filter_products_items(PRODUCTS, query)


def filter_articles_items(source_items: list[dict], query: dict, default_status: str = "published") -> list[dict]:
    keyword = first(query, "keyword")
    category = first(query, "category")
    status = first(query, "status") or default_status
    items = []
    for item in source_items:
        if status and item.get("status") != status:
            continue
        if category and item.get("category") != category:
            continue
        if keyword:
            haystack = " ".join(
                [
                    item.get("title", ""),
                    item.get("summary", ""),
                    item.get("category", ""),
                    item.get("seo_description", ""),
                    " ".join(item.get("keywords", [])),
                ]
            )
            if not includes_keyword(haystack, keyword):
                continue
        items.append(item)
    return items


def filter_articles(query: dict) -> list[dict]:
    return filter_articles_items(ARTICLES, query, "published")


def filter_institutions(query: dict) -> list[dict]:
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
            haystack = " ".join([item.get("name", ""), item.get("summary", ""), item.get("type_label", ""), item.get("registry_ref", "")])
            if not includes_keyword(haystack, keyword):
                continue
        items.append(item)
    return items


def public_search(query: dict) -> dict:
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


class Store:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._telegram_key = self._load_or_create_telegram_key()
        self.init_db()

    def _load_or_create_telegram_key(self) -> bytes:
        """Keep the configuration key server-side and outside the SQLite records."""
        key_path = self.db_path.parent / ".tfse-telegram.key"
        try:
            key = key_path.read_bytes()
            if len(key) >= 32:
                return key[:32]
        except OSError:
            pass
        key = secrets.token_bytes(32)
        temp_path = key_path.with_suffix(".tmp")
        flags = os.O_WRONLY | os.O_CREAT | os.O_TRUNC
        descriptor = os.open(str(temp_path), flags, 0o600)
        try:
            with os.fdopen(descriptor, "wb") as handle:
                handle.write(key)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temp_path, key_path)
            os.chmod(key_path, 0o600)
        finally:
            try:
                temp_path.unlink(missing_ok=True)
            except OSError:
                pass
        return key

    def _telegram_encrypt(self, value: str) -> str:
        """Authenticated server-side storage; the token is never returned to clients."""
        nonce = secrets.token_bytes(16)
        plain = value.encode("utf-8")
        stream = bytearray()
        counter = 0
        while len(stream) < len(plain):
            stream.extend(hmac.new(self._telegram_key, nonce + counter.to_bytes(4, "big"), hashlib.sha256).digest())
            counter += 1
        cipher = bytes(left ^ right for left, right in zip(plain, stream))
        tag = hmac.new(self._telegram_key, b"tfse-telegram-v1" + nonce + cipher, hashlib.sha256).digest()
        return "v1." + ".".join(
            base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")
            for value in (nonce, cipher, tag)
        )

    def _telegram_decrypt(self, stored: str) -> str:
        try:
            version, nonce_encoded, cipher_encoded, tag_encoded = str(stored or "").split(".", 3)
            if version != "v1":
                return ""
            decode = lambda value: base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
            nonce, cipher, tag = decode(nonce_encoded), decode(cipher_encoded), decode(tag_encoded)
            expected = hmac.new(self._telegram_key, b"tfse-telegram-v1" + nonce + cipher, hashlib.sha256).digest()
            if not hmac.compare_digest(tag, expected):
                return ""
            stream = bytearray()
            counter = 0
            while len(stream) < len(cipher):
                stream.extend(hmac.new(self._telegram_key, nonce + counter.to_bytes(4, "big"), hashlib.sha256).digest())
                counter += 1
            return bytes(left ^ right for left, right in zip(cipher, stream)).decode("utf-8")
        except Exception:
            return ""

    @contextmanager
    def conn(self):
        conn = sqlite3.connect(str(self.db_path), timeout=30.0, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.execute("PRAGMA busy_timeout=15000")
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def init_db(self) -> None:
        with self.conn() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS lead_forms (
                    id TEXT PRIMARY KEY,
                    display_name TEXT NOT NULL,
                    phone_hash TEXT NOT NULL,
                    phone_last3 TEXT NOT NULL,
                    needs TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'new',
                    assigned_to TEXT NOT NULL DEFAULT '',
                    follow_up_priority TEXT NOT NULL DEFAULT 'normal',
                    next_follow_up_at TEXT NOT NULL DEFAULT '',
                    consent_privacy INTEGER NOT NULL,
                    consent_line INTEGER NOT NULL DEFAULT 0,
                    source_url TEXT NOT NULL DEFAULT '',
                    utm_source TEXT NOT NULL DEFAULT '',
                    utm_medium TEXT NOT NULL DEFAULT '',
                    utm_campaign TEXT NOT NULL DEFAULT '',
                    payload_json TEXT NOT NULL,
                    contact_logs_json TEXT NOT NULL DEFAULT '[]',
                    notes_json TEXT NOT NULL DEFAULT '[]',
                    submitted_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_lead_forms_status_updated ON lead_forms(status, updated_at DESC);
                CREATE INDEX IF NOT EXISTS idx_lead_forms_phone_hash ON lead_forms(phone_hash);
                CREATE TABLE IF NOT EXISTS bank_club_leads (
                    id TEXT PRIMARY KEY,
                    display_name TEXT NOT NULL,
                    phone TEXT NOT NULL DEFAULT '',
                    line_id TEXT NOT NULL DEFAULT '',
                    loan_type TEXT NOT NULL DEFAULT 'unknown',
                    message TEXT NOT NULL DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'new',
                    source_page TEXT NOT NULL DEFAULT '',
                    payload_json TEXT NOT NULL DEFAULT '{}',
                    submitted_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_bank_club_leads_status_updated ON bank_club_leads(status, updated_at DESC);
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id TEXT PRIMARY KEY,
                    action TEXT NOT NULL,
                    target TEXT NOT NULL,
                    detail TEXT NOT NULL DEFAULT '',
                    actor_role TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created_at ON audit_logs(action, created_at DESC);
                CREATE TABLE IF NOT EXISTS admin_sessions (
                    id TEXT PRIMARY KEY,
                    role TEXT NOT NULL,
                    csrf_token TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    revoked_at TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS event_logs (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    path TEXT NOT NULL DEFAULT '',
                    url TEXT NOT NULL DEFAULT '',
                    payload_json TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS public_feedback_tickets (
                    ticket_id TEXT PRIMARY KEY,
                    feedback_type TEXT NOT NULL DEFAULT 'content_review',
                    page_url TEXT NOT NULL DEFAULT '',
                    summary TEXT NOT NULL DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'queued',
                    assigned_role TEXT NOT NULL DEFAULT 'data_manager',
                    payload_json TEXT NOT NULL,
                    received_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS compliance_reviews (
                    id TEXT PRIMARY KEY,
                    review_type TEXT NOT NULL DEFAULT 'page',
                    target TEXT NOT NULL,
                    result TEXT NOT NULL DEFAULT 'pending',
                    note TEXT NOT NULL DEFAULT '',
                    scan_payload_json TEXT NOT NULL DEFAULT '{}',
                    reviewer_role TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_compliance_reviews_target_created ON compliance_reviews(target, created_at DESC);
                CREATE TABLE IF NOT EXISTS privacy_request_tasks (
                    id TEXT PRIMARY KEY,
                    lead_id TEXT NOT NULL,
                    request_type TEXT NOT NULL DEFAULT 'delete',
                    request_status TEXT NOT NULL DEFAULT 'pending',
                    phone_last3 TEXT NOT NULL DEFAULT '',
                    note TEXT NOT NULL DEFAULT '',
                    handled_by_role TEXT NOT NULL DEFAULT '',
                    requested_at TEXT NOT NULL,
                    completed_at TEXT NOT NULL DEFAULT '',
                    audit_log_id TEXT NOT NULL DEFAULT '',
                    FOREIGN KEY(lead_id) REFERENCES lead_forms(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_privacy_request_tasks_status ON privacy_request_tasks(request_status, requested_at DESC);
                CREATE TABLE IF NOT EXISTS lead_rate_limits (
                    id TEXT PRIMARY KEY,
                    ip_hash TEXT NOT NULL,
                    device_id TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_lead_rate_limits_ip_created ON lead_rate_limits(ip_hash, created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_lead_rate_limits_device_created ON lead_rate_limits(device_id, created_at DESC);
                CREATE TABLE IF NOT EXISTS content_records (
                    item_type TEXT NOT NULL,
                    id TEXT NOT NULL,
                    slug TEXT NOT NULL DEFAULT '',
                    status TEXT NOT NULL DEFAULT '',
                    payload_json TEXT NOT NULL,
                    updated_by_role TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY(item_type, id)
                );
                CREATE INDEX IF NOT EXISTS idx_content_records_type_status ON content_records(item_type, status, updated_at DESC);
                CREATE UNIQUE INDEX IF NOT EXISTS idx_content_records_type_slug ON content_records(item_type, slug);
                CREATE TABLE IF NOT EXISTS telegram_settings (
                    id INTEGER PRIMARY KEY CHECK(id = 1),
                    enabled INTEGER NOT NULL DEFAULT 0,
                    bot_token_encrypted TEXT NOT NULL DEFAULT '',
                    chat_id TEXT NOT NULL DEFAULT '',
                    updated_at TEXT NOT NULL DEFAULT '',
                    updated_by_role TEXT NOT NULL DEFAULT '',
                    last_test_status TEXT NOT NULL DEFAULT '',
                    last_test_at TEXT NOT NULL DEFAULT '',
                    last_error TEXT NOT NULL DEFAULT ''
                );
                INSERT OR IGNORE INTO telegram_settings(id) VALUES (1);
                CREATE TABLE IF NOT EXISTS telegram_notifications (
                    id TEXT PRIMARY KEY,
                    site_key TEXT NOT NULL,
                    lead_id TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'queued',
                    message_preview TEXT NOT NULL DEFAULT '',
                    chat_id_masked TEXT NOT NULL DEFAULT '',
                    error TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    sent_at TEXT NOT NULL DEFAULT ''
                );
                CREATE INDEX IF NOT EXISTS idx_telegram_notifications_created ON telegram_notifications(created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_telegram_notifications_status ON telegram_notifications(status, created_at DESC);
                CREATE TABLE IF NOT EXISTS line_settings (
                    id INTEGER PRIMARY KEY CHECK(id = 1),
                    enabled INTEGER NOT NULL DEFAULT 0,
                    channel_access_token_encrypted TEXT NOT NULL DEFAULT '',
                    recipient_id TEXT NOT NULL DEFAULT '',
                    updated_at TEXT NOT NULL DEFAULT '',
                    updated_by_role TEXT NOT NULL DEFAULT '',
                    last_test_status TEXT NOT NULL DEFAULT '',
                    last_test_at TEXT NOT NULL DEFAULT '',
                    last_error TEXT NOT NULL DEFAULT ''
                );
                INSERT OR IGNORE INTO line_settings(id) VALUES (1);
                CREATE TABLE IF NOT EXISTS line_notifications (
                    id TEXT PRIMARY KEY,
                    site_key TEXT NOT NULL,
                    lead_id TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'queued',
                    message_preview TEXT NOT NULL DEFAULT '',
                    recipient_id_masked TEXT NOT NULL DEFAULT '',
                    error TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    sent_at TEXT NOT NULL DEFAULT ''
                );
                CREATE INDEX IF NOT EXISTS idx_line_notifications_created ON line_notifications(created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_line_notifications_status ON line_notifications(status, created_at DESC);
                """
            )

    def audit(self, action: str, target: str, detail: str = "", actor_role: str = "") -> dict:
        item = {
            "id": "audit_" + secrets.token_hex(8),
            "action": action,
            "target": target,
            "detail": detail[:500],
            "actor_role": actor_role,
            "created_at": now_iso(),
        }
        with self.conn() as conn:
            conn.execute(
                "INSERT INTO audit_logs(id, action, target, detail, actor_role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (item["id"], item["action"], item["target"], item["detail"], item["actor_role"], item["created_at"]),
            )
        return item

    def _telegram_row(self) -> sqlite3.Row:
        with self.conn() as conn:
            row = conn.execute("SELECT * FROM telegram_settings WHERE id = 1").fetchone()
        return row

    def telegram_settings_public(self) -> dict:
        row = self._telegram_row()
        has_token = bool(self._telegram_decrypt(row["bot_token_encrypted"] or ""))
        has_chat_id = bool(str(row["chat_id"] or "").strip())
        return {
            "enabled": bool(row["enabled"]),
            "configured": bool(row["enabled"] and has_token and has_chat_id),
            "token_configured": has_token,
            "token_masked": mask_secret(self._telegram_decrypt(row["bot_token_encrypted"] or "")),
            "chat_id_configured": has_chat_id,
            # Chat IDs are operational routing values for the authenticated
            # administrator, so keep the exact value visible in settings.
            "chat_id": row["chat_id"] or "",
            "chat_id_masked": mask_secret(row["chat_id"] or "", 3, 3),
            "updated_at": row["updated_at"] or "",
            "updated_by_role": row["updated_by_role"] or "",
            "last_test_status": row["last_test_status"] or "",
            "last_test_at": row["last_test_at"] or "",
            "last_error": row["last_error"] or "",
        }

    def update_telegram_settings(self, payload: dict, actor_role: str) -> dict:
        current = self._telegram_row()
        current_token = self._telegram_decrypt(current["bot_token_encrypted"] or "")
        current_chat_id = str(current["chat_id"] or "").strip()
        token = str(payload.get("bot_token") or "").strip()
        requested_chat_id = str(payload.get("chat_id") or "").strip()
        enabled = as_bool(payload.get("enabled"))
        clear_token = as_bool(payload.get("clear_token"))
        clear_chat_id = as_bool(payload.get("clear_chat_id"))
        if clear_token:
            token = ""
        elif token:
            if not TELEGRAM_TOKEN_RE.fullmatch(token):
                raise ValueError("telegram_bot_token_invalid")
        else:
            token = current_token
        if clear_chat_id:
            chat_id = ""
        elif requested_chat_id:
            chat_id = requested_chat_id
        else:
            # A blank input means "keep the stored value". The browser only
            # receives its masked form and must not need to resend it.
            chat_id = current_chat_id
        if chat_id and not TELEGRAM_CHAT_ID_RE.fullmatch(chat_id):
            raise ValueError("telegram_chat_id_invalid")
        if enabled and (not token or not chat_id):
            raise ValueError("telegram_configuration_incomplete")
        encrypted = self._telegram_encrypt(token) if token else ""
        updated_at = now_iso()
        with self.conn() as conn:
            conn.execute(
                """
                UPDATE telegram_settings
                SET enabled = ?, bot_token_encrypted = ?, chat_id = ?, updated_at = ?,
                    updated_by_role = ?, last_error = ''
                WHERE id = 1
                """,
                (1 if enabled else 0, encrypted, chat_id, updated_at, actor_role),
            )
        self.audit("telegram_settings_updated", "telegram", "enabled=" + str(enabled), actor_role)
        return self.telegram_settings_public()

    def _telegram_send(self, text: str) -> tuple[bool, str]:
        row = self._telegram_row()
        if not row["enabled"]:
            return False, "telegram_disabled"
        token = self._telegram_decrypt(row["bot_token_encrypted"] or "")
        chat_id = str(row["chat_id"] or "").strip()
        if not token or not chat_id:
            return False, "telegram_configuration_incomplete"
        body = json.dumps({
            "chat_id": chat_id,
            "text": text[:4096],
            "disable_web_page_preview": True,
        }, ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            "https://api.telegram.org/bot" + token + "/sendMessage",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=8) as response:
                data = json.loads(response.read().decode("utf-8") or "{}")
            if data.get("ok"):
                return True, ""
            description = str(data.get("description") or "telegram_rejected")[:180]
            return False, description
        except Exception as exc:
            # Never return a URL because it contains the bot token.
            return False, "telegram_request_failed:" + type(exc).__name__

    def _telegram_label(self, key: str) -> str:
        labels = {
            "display_name": "姓名", "name": "姓名", "phone": "聯絡電話", "line_id": "LINE ID", "lineId": "LINE ID",
            "email": "Email", "region": "所在地區", "city": "所在縣市", "needs": "需求類型", "loan_type": "貸款類型",
            "loanType": "貸款類型", "identity_type": "身分類型", "identityType": "身分類型", "gender": "性別",
            "birth_date": "出生日期", "occupation_type": "職業", "current_job": "現職工作", "current_job_years": "現職年數",
            "current_job_months": "現職月數", "income_type": "收入型態", "monthly_income": "現職月收入",
            "salary_method": "薪轉或領現金", "labor_insurance": "現職公司投勞保", "has_house": "名下有房",
            "has_car": "名下有汽車", "has_land": "名下有土地", "recent_credit_report": "近一月聯徵",
            "desired_amount": "需求金額", "desiredAmount": "需求金額", "appointment_time": "預約時段", "appointmentTime": "預約時段",
            "purpose": "資金用途", "message": "補充說明", "note": "補充說明", "source_page": "來源頁面", "sourcePage": "來源頁面",
            "source_channel": "來源渠道", "sourceChannel": "來源渠道",
        }
        return labels.get(key, key)

    def _telegram_lead_message(self, site_key: str, lead_id: str, payload: dict) -> str:
        title = "金融站新表單" if site_key == "finance" else "Bank Club 新貸款申請"
        hidden = {
            "id", "status", "website", "cf_turnstile_response", "device_id", "tags", "notes", "recommended_categories",
            "recommended_articles", "consent_version", "submitted_at", "updated_at", "source_url", "utm_source", "utm_medium",
            "utm_campaign", "utm_content", "utm_term", "ip", "submitted_ip", "user_agent", "session_id", "sessionId",
        }
        lines = [title, "案件編號：" + lead_id]
        emitted = set()
        preferred = [
            "display_name", "name", "phone", "line_id", "lineId", "email", "region", "city", "needs", "loan_type", "loanType",
            "identity_type", "identityType", "gender", "birth_date", "occupation_type", "current_job", "current_job_years",
            "current_job_months", "income_type", "monthly_income", "salary_method", "labor_insurance", "has_house", "has_car",
            "has_land", "recent_credit_report", "desired_amount", "desiredAmount", "appointment_time", "appointmentTime", "purpose",
            "message", "note", "source_page", "sourcePage", "source_channel", "sourceChannel",
        ]
        for key in preferred + sorted(payload.keys()):
            if key in emitted or key in hidden or key not in payload:
                continue
            value = payload.get(key)
            if value in (None, "", [], {}):
                continue
            if isinstance(value, (dict, list)):
                continue
            emitted.add(key)
            text = redact_sensitive_text(value).replace("\n", " ").strip()
            if text:
                lines.append(self._telegram_label(key) + "：" + text[:220])
            if len(lines) >= 28:
                break
        lines.append("後台：/admin/ 線索與客戶")
        return "\n".join(lines)[:4096]

    def _telegram_notification_preview(self, site_key: str, payload: dict) -> str:
        name = str(payload.get("display_name") or payload.get("name") or "未命名")[:40]
        need = str(payload.get("needs") or payload.get("loan_type") or payload.get("loanType") or "未分類")[:60]
        return ("金融站" if site_key == "finance" else "Bank Club") + " · " + name + " · " + need

    def queue_telegram_lead_notification(self, site_key: str, lead_id: str, payload: dict) -> dict:
        settings = self.telegram_settings_public()
        if not settings["configured"]:
            return {"status": "not_configured", "notification_id": ""}
        notification_id = "telegram_" + secrets.token_hex(10)
        with self.conn() as conn:
            conn.execute(
                """
                INSERT INTO telegram_notifications(id, site_key, lead_id, status, message_preview, chat_id_masked, error, created_at, sent_at)
                VALUES (?, ?, ?, 'queued', ?, ?, '', ?, '')
                """,
                (notification_id, site_key, lead_id, self._telegram_notification_preview(site_key, payload), settings["chat_id_masked"], now_iso()),
            )
        thread = threading.Thread(
            target=self._deliver_telegram_lead_notification,
            args=(notification_id, site_key, lead_id, dict(payload)),
            daemon=True,
        )
        thread.start()
        return {"status": "queued", "notification_id": notification_id}

    def _deliver_telegram_lead_notification(self, notification_id: str, site_key: str, lead_id: str, payload: dict) -> None:
        success, error = self._telegram_send(self._telegram_lead_message(site_key, lead_id, payload))
        status = "sent" if success else "failed"
        with self.conn() as conn:
            conn.execute(
                "UPDATE telegram_notifications SET status = ?, error = ?, sent_at = ? WHERE id = ?",
                (status, error[:240], now_iso() if success else "", notification_id),
            )
        self.audit("telegram_notification_" + status, lead_id, site_key, "system")

    def send_telegram_test(self, actor_role: str) -> dict:
        success, error = self._telegram_send("TFSE Telegram 連線測試\n此訊息代表公共後台已成功連上目前設定的 Chat ID。")
        status = "sent" if success else "failed"
        with self.conn() as conn:
            conn.execute(
                "UPDATE telegram_settings SET last_test_status = ?, last_test_at = ?, last_error = ? WHERE id = 1",
                (status, now_iso(), error[:240]),
            )
        self.audit("telegram_test_" + status, "telegram", error[:240], actor_role)
        return {"status": status, "error": error, "settings": self.telegram_settings_public()}

    def list_telegram_notifications(self) -> list[dict]:
        with self.conn() as conn:
            rows = conn.execute(
                "SELECT id, site_key, lead_id, status, message_preview, chat_id_masked, error, created_at, sent_at FROM telegram_notifications ORDER BY created_at DESC LIMIT 12"
            ).fetchall()
        return [dict(row) for row in rows]

    def _line_row(self) -> sqlite3.Row:
        with self.conn() as conn:
            return conn.execute("SELECT * FROM line_settings WHERE id = 1").fetchone()

    def line_settings_public(self) -> dict:
        row = self._line_row()
        token = self._telegram_decrypt(row["channel_access_token_encrypted"] or "")
        recipient_id = str(row["recipient_id"] or "").strip()
        return {
            "enabled": bool(row["enabled"]),
            "configured": bool(row["enabled"] and token and recipient_id),
            "token_configured": bool(token),
            "token_masked": mask_secret(token),
            "recipient_id_configured": bool(recipient_id),
            "recipient_id": recipient_id,
            "recipient_id_masked": mask_secret(recipient_id),
            "updated_at": row["updated_at"] or "",
            "updated_by_role": row["updated_by_role"] or "",
            "last_test_status": row["last_test_status"] or "",
            "last_test_at": row["last_test_at"] or "",
            "last_error": row["last_error"] or "",
        }

    def update_line_settings(self, payload: dict, actor_role: str) -> dict:
        current = self._line_row()
        current_token = self._telegram_decrypt(current["channel_access_token_encrypted"] or "")
        current_recipient_id = str(current["recipient_id"] or "").strip()
        requested_token = str(payload.get("channel_access_token") or "").strip()
        requested_recipient_id = str(payload.get("recipient_id") or "").strip()
        clear_token = as_bool(payload.get("clear_token"))
        clear_recipient_id = as_bool(payload.get("clear_recipient_id"))
        enabled = as_bool(payload.get("enabled"))
        token = "" if clear_token else (requested_token or current_token)
        recipient_id = "" if clear_recipient_id else (requested_recipient_id or current_recipient_id)
        if recipient_id and not LINE_RECIPIENT_ID_RE.fullmatch(recipient_id):
            raise ValueError("line_recipient_id_invalid")
        if enabled and (not token or not recipient_id):
            raise ValueError("line_configuration_incomplete")
        with self.conn() as conn:
            conn.execute(
                """
                UPDATE line_settings
                SET enabled = ?, channel_access_token_encrypted = ?, recipient_id = ?, updated_at = ?,
                    updated_by_role = ?, last_error = ''
                WHERE id = 1
                """,
                (1 if enabled else 0, self._telegram_encrypt(token) if token else "", recipient_id, now_iso(), actor_role),
            )
        self.audit("line_settings_updated", "line", "enabled=" + str(enabled), actor_role)
        return self.line_settings_public()

    def _line_send(self, text: str) -> tuple[bool, str]:
        row = self._line_row()
        if not row["enabled"]:
            return False, "line_disabled"
        token = self._telegram_decrypt(row["channel_access_token_encrypted"] or "")
        recipient_id = str(row["recipient_id"] or "").strip()
        if not token or not recipient_id:
            return False, "line_configuration_incomplete"
        body = json.dumps({"to": recipient_id, "messages": [{"type": "text", "text": text[:5000]}]}, ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            "https://api.line.me/v2/bot/message/push",
            data=body,
            headers={"Content-Type": "application/json", "Authorization": "Bearer " + token, "X-Line-Retry-Key": str(uuid.uuid4())},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=8) as response:
                response.read()
            return True, ""
        except Exception as exc:
            # Never retain provider payloads because request diagnostics can contain sensitive data.
            return False, "line_request_failed:" + type(exc).__name__

    def queue_line_lead_notification(self, site_key: str, lead_id: str, payload: dict) -> dict:
        settings = self.line_settings_public()
        if not settings["configured"]:
            return {"status": "not_configured", "notification_id": ""}
        notification_id = "line_" + secrets.token_hex(10)
        with self.conn() as conn:
            conn.execute(
                """
                INSERT INTO line_notifications(id, site_key, lead_id, status, message_preview, recipient_id_masked, error, created_at, sent_at)
                VALUES (?, ?, ?, 'queued', ?, ?, '', ?, '')
                """,
                (notification_id, site_key, lead_id, self._telegram_notification_preview(site_key, payload), settings["recipient_id_masked"], now_iso()),
            )
        threading.Thread(target=self._deliver_line_lead_notification, args=(notification_id, site_key, lead_id, dict(payload)), daemon=True).start()
        return {"status": "queued", "notification_id": notification_id}

    def _deliver_line_lead_notification(self, notification_id: str, site_key: str, lead_id: str, payload: dict) -> None:
        success, error = self._line_send(self._telegram_lead_message(site_key, lead_id, payload))
        status = "sent" if success else "failed"
        with self.conn() as conn:
            conn.execute("UPDATE line_notifications SET status = ?, error = ?, sent_at = ? WHERE id = ?", (status, error[:240], now_iso() if success else "", notification_id))
        self.audit("line_notification_" + status, lead_id, site_key, "system")

    def send_line_test(self, actor_role: str) -> dict:
        success, error = self._line_send("TFSE LINE 連線測試\n此訊息代表公共後台已成功連上目前設定的接收者。")
        status = "sent" if success else "failed"
        with self.conn() as conn:
            conn.execute("UPDATE line_settings SET last_test_status = ?, last_test_at = ?, last_error = ? WHERE id = 1", (status, now_iso(), error[:240]))
        self.audit("line_test_" + status, "line", error[:240], actor_role)
        return {"status": status, "error": error, "settings": self.line_settings_public()}

    def list_line_notifications(self) -> list[dict]:
        with self.conn() as conn:
            rows = conn.execute("SELECT id, site_key, lead_id, status, message_preview, recipient_id_masked, error, created_at, sent_at FROM line_notifications ORDER BY created_at DESC LIMIT 12").fetchall()
        return [dict(row) for row in rows]

    def assert_lead_rate_limit(self, client_ip: str, device_id: str) -> None:
        ip_hash = stable_hash(client_ip, "TFSE_IP_HASH_SALT")
        device_id = str(device_id or "")[:120]
        window_start = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
        with self.conn() as conn:
            ip_count = conn.execute(
                "SELECT COUNT(1) FROM lead_rate_limits WHERE ip_hash = ? AND created_at >= ?",
                (ip_hash, window_start),
            ).fetchone()[0]
            device_count = 0
            if device_id:
                device_count = conn.execute(
                    "SELECT COUNT(1) FROM lead_rate_limits WHERE device_id = ? AND created_at >= ?",
                    (device_id, window_start),
                ).fetchone()[0]
            if ip_count >= 5 or device_count >= 5:
                raise ValueError("rate_limited")
            conn.execute(
                "INSERT INTO lead_rate_limits(id, ip_hash, device_id, created_at) VALUES (?, ?, ?, ?)",
                ("rate_" + secrets.token_hex(8), ip_hash, device_id, now_iso()),
            )

    def find_duplicate_lead(self, phone_hash_value: str, needs: str) -> sqlite3.Row | None:
        window_start = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        with self.conn() as conn:
            return conn.execute(
                """
                SELECT * FROM lead_forms
                WHERE phone_hash = ? AND needs = ? AND submitted_at >= ?
                ORDER BY submitted_at DESC
                LIMIT 1
                """,
                (phone_hash_value, needs, window_start),
            ).fetchone()

    def create_lead(self, payload: dict, client_ip: str = "") -> dict:
        if payload.get("website"):
            raise ValueError("honeypot_rejected")
        if not payload.get("consent_privacy"):
            raise ValueError("privacy_consent_required")
        if has_high_risk_text(payload):
            raise ValueError("high_risk_sensitive_payload")
        if not verify_turnstile_token(str(payload.get("cf_turnstile_response") or ""), client_ip):
            raise ValueError("turnstile_verification_failed")
        self.assert_lead_rate_limit(client_ip, str(payload.get("device_id") or ""))
        lead_id = payload.get("id") or "lead_" + secrets.token_hex(8)
        submitted_at = payload.get("submitted_at") or now_iso()
        clean_payload = dict(payload)
        clean_payload["phone_last3"] = phone_last3(str(payload.get("phone", "")))
        clean_payload.pop("website", None)
        clean_payload.pop("cf_turnstile_response", None)
        normalized_needs = str(payload.get("needs") or payload.get("need") or "未分類")
        hashed_phone = phone_hash(str(payload.get("phone", "")))
        duplicate = self.find_duplicate_lead(hashed_phone, normalized_needs)
        if duplicate:
            self.audit("lead_duplicate_reuse", duplicate["id"], "same phone hash + needs within 24h")
            return {
                "id": duplicate["id"],
                "status": duplicate["status"],
                "duplicate": True,
                "lead": public_lead(duplicate),
                "line_url": os.getenv("TFSE_LINE_OA_URL", "free-check.html#line-cta"),
                "disclaimer": "24 小時內已有相同需求紀錄，已沿用既有健檢單，避免重複聯繫。",
            }
        with self.conn() as conn:
            conn.execute(
                """
                INSERT INTO lead_forms(
                    id, display_name, phone_hash, phone_last3, needs, status, assigned_to,
                    follow_up_priority, next_follow_up_at, consent_privacy, consent_line,
                    source_url, utm_source, utm_medium, utm_campaign, payload_json,
                    submitted_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    lead_id,
                    str(payload.get("display_name") or payload.get("name") or "未具名"),
                    hashed_phone,
                    clean_payload["phone_last3"],
                    normalized_needs,
                    str(payload.get("status") or "new"),
                    str(payload.get("assigned_to") or ""),
                    str(payload.get("follow_up_priority") or "normal"),
                    str(payload.get("next_follow_up_at") or ""),
                    1 if payload.get("consent_privacy") else 0,
                    1 if payload.get("consent_line") else 0,
                    str(payload.get("source_url") or ""),
                    str(payload.get("utm_source") or ""),
                    str(payload.get("utm_medium") or ""),
                    str(payload.get("utm_campaign") or ""),
                    json.dumps(clean_payload, ensure_ascii=False),
                    submitted_at,
                    now_iso(),
                ),
            )
        self.audit("lead_submit", lead_id, "persistent api accepted lead")
        notification = self.queue_telegram_lead_notification("finance", lead_id, clean_payload)
        line_notification = self.queue_line_lead_notification("finance", lead_id, clean_payload)
        return {
            "id": lead_id,
            "status": clean_payload.get("status", "new"),
            "lead": clean_payload,
            "telegram_notification": notification,
            "line_notification": line_notification,
            "line_url": os.getenv("TFSE_LINE_OA_URL", "free-check.html#line-cta"),
        }

    def list_leads(self) -> list[dict]:
        with self.conn() as conn:
            rows = conn.execute("SELECT * FROM lead_forms ORDER BY submitted_at DESC, updated_at DESC").fetchall()
        return [public_lead(row) for row in rows]

    def update_lead_status(self, lead_id: str, payload: dict, actor_role: str) -> dict | None:
        with self.conn() as conn:
            row = conn.execute("SELECT * FROM lead_forms WHERE id = ?", (lead_id,)).fetchone()
            if not row:
                return None
            contact_logs = json.loads(row["contact_logs_json"] or "[]")
            notes = json.loads(row["notes_json"] or "[]")
            if payload.get("contact_log"):
                contact_logs.append(payload["contact_log"])
            if payload.get("note"):
                notes.append({"at": now_iso(), "note": str(payload.get("note"))[:500]})
            conn.execute(
                """
                UPDATE lead_forms
                SET status = ?, assigned_to = ?, follow_up_priority = ?, next_follow_up_at = ?,
                    contact_logs_json = ?, notes_json = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    str(payload.get("status") or row["status"] or "new"),
                    str(payload.get("assigned_to") or row["assigned_to"] or ""),
                    str(payload.get("follow_up_priority") or row["follow_up_priority"] or "normal"),
                    str(payload.get("next_follow_up_at") if "next_follow_up_at" in payload else row["next_follow_up_at"] or ""),
                    json.dumps(contact_logs, ensure_ascii=False),
                    json.dumps(notes, ensure_ascii=False),
                    now_iso(),
                    lead_id,
                ),
            )
            updated = conn.execute("SELECT * FROM lead_forms WHERE id = ?", (lead_id,)).fetchone()
        audit = self.audit("lead_status_update", lead_id, str(payload.get("status") or ""), actor_role)
        return {"lead": public_lead(updated), "audit_log": audit}

    def create_bank_club_lead(self, payload: dict, client_ip: str = "") -> dict:
        if payload.get("website"):
            raise ValueError("honeypot_rejected")
        if has_high_risk_text(payload):
            raise ValueError("high_risk_sensitive_payload")
        lead_id = str(payload.get("id") or "bank_lead_" + secrets.token_hex(8))
        submitted_at = str(payload.get("submitted_at") or now_iso())
        clean_payload = dict(payload)
        clean_payload["site_key"] = "bank_club"
        clean_payload["id"] = lead_id
        clean_payload["submitted_at"] = submitted_at
        # The Bank Club application forwards the original visitor IP. Keep the
        # proxy-observed address only as a fallback for direct API submissions.
        clean_payload["submitted_ip"] = str(payload.get("submitted_ip") or payload.get("ip") or client_ip or "")[:120]
        with self.conn() as conn:
            conn.execute(
                """
                INSERT INTO bank_club_leads(
                    id, display_name, phone, line_id, loan_type, message, status,
                    source_page, payload_json, submitted_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    display_name = excluded.display_name,
                    phone = excluded.phone,
                    line_id = excluded.line_id,
                    loan_type = excluded.loan_type,
                    message = excluded.message,
                    status = excluded.status,
                    source_page = excluded.source_page,
                    payload_json = excluded.payload_json,
                    submitted_at = excluded.submitted_at,
                    updated_at = excluded.updated_at
                """,
                (
                    lead_id,
                    str(payload.get("display_name") or payload.get("name") or "未具名")[:120],
                    str(payload.get("phone") or "")[:80],
                    str(payload.get("line_id") or "")[:120],
                    str(payload.get("loan_type") or "unknown")[:80],
                    redact_sensitive_text(payload.get("message") or "")[:1000],
                    str(payload.get("status") or "new")[:80],
                    str(payload.get("source_page") or "/")[:300],
                    json.dumps(clean_payload, ensure_ascii=False),
                    submitted_at,
                    now_iso(),
                ),
            )
        audit = self.audit("bank_club_lead_submit", lead_id, "persistent api accepted Bank Club lead")
        notification = self.queue_telegram_lead_notification("bank_club", lead_id, clean_payload)
        line_notification = self.queue_line_lead_notification("bank_club", lead_id, clean_payload)
        return {
            "id": lead_id,
            "status": clean_payload.get("status", "new"),
            "lead": clean_payload,
            "telegram_notification": notification,
            "line_notification": line_notification,
            "audit_log": audit,
        }

    def list_bank_club_leads(self) -> list[dict]:
        with self.conn() as conn:
            rows = conn.execute("SELECT * FROM bank_club_leads ORDER BY submitted_at DESC, updated_at DESC").fetchall()
        output = []
        for row in rows:
            item = dict(row)
            payload = json.loads(item.pop("payload_json") or "{}")
            payload.update(item)
            payload["site_key"] = "bank_club"
            output.append(payload)
        return output

    def update_bank_club_lead_status(self, lead_id: str, payload: dict, actor_role: str) -> dict | None:
        with self.conn() as conn:
            row = conn.execute("SELECT * FROM bank_club_leads WHERE id = ?", (lead_id,)).fetchone()
            if not row:
                return None
            source_payload = json.loads(row["payload_json"] or "{}")
            source_payload["status"] = str(payload.get("status") or row["status"] or "new")[:80]
            source_payload["admin_note"] = redact_sensitive_text(payload.get("note") or source_payload.get("admin_note") or "")[:500]
            source_payload["updated_at"] = now_iso()
            conn.execute(
                """
                UPDATE bank_club_leads
                SET status = ?, payload_json = ?, updated_at = ?
                WHERE id = ?
                """,
                (source_payload["status"], json.dumps(source_payload, ensure_ascii=False), source_payload["updated_at"], lead_id),
            )
        audit = self.audit("bank_club_lead_status_update", lead_id, str(payload.get("status") or ""), actor_role)
        return {"lead": next((lead for lead in self.list_bank_club_leads() if lead.get("id") == lead_id), None), "audit_log": audit}

    def list_privacy_requests(self) -> list[dict]:
        with self.conn() as conn:
            rows = conn.execute(
                """
                SELECT p.*, l.status AS lead_status
                FROM privacy_request_tasks p
                JOIN lead_forms l ON l.id = p.lead_id
                ORDER BY
                    CASE p.request_status WHEN 'pending' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END,
                    p.requested_at DESC
                """
            ).fetchall()
        return [dict(row) for row in rows]

    def update_privacy_request(self, lead_id: str, payload: dict, actor_role: str) -> dict | None:
        request_status = str(payload.get("request_status") or payload.get("status") or "completed")
        request_type = str(payload.get("request_type") or "delete")
        note = redact_sensitive_text(payload.get("note") or "")[:500]
        with self.conn() as conn:
            lead = conn.execute("SELECT * FROM lead_forms WHERE id = ?", (lead_id,)).fetchone()
            if not lead:
                return None
            existing = conn.execute("SELECT * FROM privacy_request_tasks WHERE lead_id = ? ORDER BY requested_at DESC LIMIT 1", (lead_id,)).fetchone()
            completed_at = now_iso() if request_status == "completed" else ""
            if existing:
                task_id = existing["id"]
                conn.execute(
                    """
                    UPDATE privacy_request_tasks
                    SET request_type = ?, request_status = ?, note = ?, handled_by_role = ?, completed_at = ?
                    WHERE id = ?
                    """,
                    (request_type, request_status, note, actor_role, completed_at or existing["completed_at"], task_id),
                )
            else:
                task_id = "privacy_" + secrets.token_hex(8)
                conn.execute(
                    """
                    INSERT INTO privacy_request_tasks(
                        id, lead_id, request_type, request_status, phone_last3, note, handled_by_role, requested_at, completed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (task_id, lead_id, request_type, request_status, lead["phone_last3"], note, actor_role, now_iso(), completed_at),
                )
            if request_status == "completed" and request_type == "delete":
                payload_json = json.loads(lead["payload_json"] or "{}")
                payload_json.pop("phone", None)
                payload_json.pop("line_id", None)
                payload_json["privacy_deleted_at"] = now_iso()
                conn.execute(
                    """
                    UPDATE lead_forms
                    SET payload_json = ?, status = CASE WHEN status = 'closed' THEN status ELSE 'closed' END, updated_at = ?
                    WHERE id = ?
                    """,
                    (json.dumps(payload_json, ensure_ascii=False), now_iso(), lead_id),
                )
            task = conn.execute("SELECT * FROM privacy_request_tasks WHERE id = ?", (task_id,)).fetchone()
            updated_lead = conn.execute("SELECT * FROM lead_forms WHERE id = ?", (lead_id,)).fetchone()
        audit = self.audit("privacy_request_update", lead_id, request_status, actor_role)
        with self.conn() as conn:
            conn.execute("UPDATE privacy_request_tasks SET audit_log_id = ? WHERE id = ?", (audit["id"], task_id))
            task = conn.execute("SELECT * FROM privacy_request_tasks WHERE id = ?", (task_id,)).fetchone()
        return {"lead": public_lead(updated_lead), "privacy_request": dict(task), "audit_log": audit}

    def merged_content_items(self, item_type: str, seed_items: list[dict]) -> list[dict]:
        merged: dict[str, dict] = {}
        order: list[str] = []
        for item in seed_items:
            item_id = str(item.get("id") or item.get("slug") or "")
            if not item_id:
                continue
            merged[item_id] = dict(item)
            order.append(item_id)
        with self.conn() as conn:
            rows = conn.execute(
                "SELECT * FROM content_records WHERE item_type = ? ORDER BY updated_at DESC",
                (item_type,),
            ).fetchall()
        for row in rows:
            payload = json.loads(row["payload_json"] or "{}")
            item_id = str(payload.get("id") or row["id"])
            payload["id"] = item_id
            payload["slug"] = str(payload.get("slug") or row["slug"] or item_id)
            payload["status"] = str(payload.get("status") or row["status"] or "")
            payload["updated_at"] = str(payload.get("updated_at") or row["updated_at"])
            if item_id not in merged:
                order.append(item_id)
                merged[item_id] = {}
            merged[item_id].update(payload)
        return [merged[item_id] for item_id in order if item_id in merged]

    def list_products(self, query: dict | None = None) -> list[dict]:
        return filter_products_items(self.merged_content_items("product", PRODUCTS), query or {})

    def get_product_by_slug(self, slug: str) -> dict | None:
        return next((item for item in self.list_products({}) if item.get("slug") == slug), None)

    def list_articles(self, query: dict | None = None, public_only: bool = False) -> list[dict]:
        default_status = "published" if public_only else ""
        return filter_articles_items(self.merged_content_items("article", ARTICLES), query or {}, default_status)

    def get_article_by_slug(self, slug: str, public_only: bool = False) -> dict | None:
        return next((item for item in self.list_articles({}, public_only=public_only) if item.get("slug") == slug), None)

    def upsert_content(self, item_type: str, payload: dict, actor_role: str, content_id: str = "") -> dict:
        now = now_iso()
        item = dict(payload or {})
        item_id = str(content_id or item.get("id") or f"{item_type}_{secrets.token_hex(6)}")
        item["id"] = item_id
        item["slug"] = str(item.get("slug") or item_id).strip().replace(" ", "-")
        item["status"] = str(item.get("status") or ("draft" if item_type == "article" else "來源待核驗"))
        item["updated_at"] = str(item.get("updated_at") or now[:10])
        item["admin_updated_at"] = now
        item["admin_updated_by_role"] = actor_role
        with self.conn() as conn:
            conn.execute(
                """
                INSERT INTO content_records(item_type, id, slug, status, payload_json, updated_by_role, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(item_type, id) DO UPDATE SET
                    slug = excluded.slug,
                    status = excluded.status,
                    payload_json = excluded.payload_json,
                    updated_by_role = excluded.updated_by_role,
                    updated_at = excluded.updated_at
                """,
                (
                    item_type,
                    item_id,
                    item["slug"],
                    item["status"],
                    json.dumps(item, ensure_ascii=False),
                    actor_role,
                    now,
                    now,
                ),
            )
        audit = self.audit(f"{item_type}_content_upsert", item_id, item["status"], actor_role)
        return {"item": item, "audit_log": audit}

    def create_compliance_review(self, payload: dict, actor_role: str) -> dict:
        review_id = "review_" + secrets.token_hex(8)
        review = {
            "id": review_id,
            "review_type": str(payload.get("review_type") or payload.get("type") or "page"),
            "target": str(payload.get("target") or payload.get("page_url") or "unknown")[:500],
            "result": str(payload.get("result") or payload.get("status") or "pending"),
            "note": redact_sensitive_text(payload.get("note") or "")[:1000],
            "scan_payload_json": redact_sensitive_text(payload.get("scan_payload") or {}),
            "reviewer_role": actor_role,
            "created_at": now_iso(),
        }
        with self.conn() as conn:
            conn.execute(
                """
                INSERT INTO compliance_reviews(
                    id, review_type, target, result, note, scan_payload_json, reviewer_role, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    review["id"],
                    review["review_type"],
                    review["target"],
                    review["result"],
                    review["note"],
                    review["scan_payload_json"],
                    review["reviewer_role"],
                    review["created_at"],
                ),
            )
        audit = self.audit("compliance_review_create", review_id, review["target"], actor_role)
        return {"review": review, "audit_log": audit}

    def create_session(self, role: str) -> dict:
        session_id = "session_" + secrets.token_urlsafe(24)
        csrf_token = secrets.token_urlsafe(24)
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat()
        with self.conn() as conn:
            conn.execute(
                "INSERT INTO admin_sessions(id, role, csrf_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
                (session_id, role, csrf_token, expires_at, now_iso()),
            )
        self.audit("admin_login", role, "persistent api login")
        return session_payload(role, session_id, csrf_token, expires_at)

    def get_session(self, session_id: str) -> tuple[str, dict] | tuple[None, None]:
        if not session_id:
            return None, None
        with self.conn() as conn:
            row = conn.execute("SELECT * FROM admin_sessions WHERE id = ? AND revoked_at = ''", (session_id,)).fetchone()
        if not row or row["expires_at"] < now_iso():
            return None, None
        return row["role"], session_payload(row["role"], session_id, row["csrf_token"], row["expires_at"])

    def revoke_session(self, session_id: str) -> None:
        if not session_id:
            return
        with self.conn() as conn:
            conn.execute("UPDATE admin_sessions SET revoked_at = ? WHERE id = ?", (now_iso(), session_id))
        self.audit("admin_logout", session_id, "persistent api logout")

    def add_event(self, payload: dict) -> dict:
        item = {
            "id": "event_" + secrets.token_hex(8),
            "name": str(payload.get("name") or ""),
            "path": str(payload.get("path") or ""),
            "url": str(payload.get("url") or ""),
            "payload_json": json.dumps(payload.get("payload") or {}, ensure_ascii=False),
            "created_at": str(payload.get("at") or now_iso()),
        }
        with self.conn() as conn:
            conn.execute(
                "INSERT INTO event_logs(id, name, path, url, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (item["id"], item["name"], item["path"], item["url"], item["payload_json"], item["created_at"]),
            )
        return {"accepted": True}

    def add_feedback(self, payload: dict) -> dict:
        if payload.get("website"):
            raise ValueError("honeypot_rejected")
        if has_high_risk_text(payload):
            raise ValueError("high_risk_sensitive_payload")
        ticket_id = "feedback_" + secrets.token_hex(8)
        ticket = {
            "ticket_id": ticket_id,
            "status": "queued",
            "assigned_role": "data_manager",
            "related_task_type": payload.get("feedback_type", "content_review"),
            "disclaimer": "TFSE 僅接收公開資料回報與低敏摘要，不收證件、帳戶或密碼。",
        }
        with self.conn() as conn:
            conn.execute(
                """
                INSERT INTO public_feedback_tickets(ticket_id, feedback_type, page_url, summary, status, assigned_role, payload_json, received_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ticket_id,
                    str(payload.get("feedback_type") or "content_review"),
                    str(payload.get("page_url") or ""),
                    str(payload.get("summary") or "")[:1000],
                    ticket["status"],
                    ticket["assigned_role"],
                    json.dumps(payload, ensure_ascii=False),
                    now_iso(),
                ),
            )
        self.audit("public_feedback_submit", ticket_id, str(payload.get("feedback_type") or ""))
        return ticket

    def list_public_feedback(self) -> list[dict]:
        with self.conn() as conn:
            rows = conn.execute(
                """
                SELECT ticket_id, feedback_type, page_url, summary, status, assigned_role, payload_json, received_at
                FROM public_feedback_tickets
                ORDER BY received_at DESC
                LIMIT 200
                """
            ).fetchall()
        items = []
        for row in rows:
            payload = json.loads(row["payload_json"] or "{}")
            item = dict(row)
            item["payload"] = payload
            item["related_task_type"] = item.get("feedback_type") or payload.get("feedback_type") or "content_review"
            items.append(item)
        return items

    def audit_logs(self) -> list[dict]:
        with self.conn() as conn:
            rows = conn.execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200").fetchall()
        return [dict(row) for row in rows]

    def health(self) -> dict:
        with self.conn() as conn:
            counts = {
                "leads": conn.execute("SELECT COUNT(1) FROM lead_forms").fetchone()[0],
                "audit_logs": conn.execute("SELECT COUNT(1) FROM audit_logs").fetchone()[0],
                "events": conn.execute("SELECT COUNT(1) FROM event_logs").fetchone()[0],
                "public_feedback": conn.execute("SELECT COUNT(1) FROM public_feedback_tickets").fetchone()[0],
                "compliance_reviews": conn.execute("SELECT COUNT(1) FROM compliance_reviews").fetchone()[0],
                "privacy_requests": conn.execute("SELECT COUNT(1) FROM privacy_request_tasks").fetchone()[0],
                "content_products": conn.execute("SELECT COUNT(1) FROM content_records WHERE item_type = 'product'").fetchone()[0],
                "content_articles": conn.execute("SELECT COUNT(1) FROM content_records WHERE item_type = 'article'").fetchone()[0],
                "bank_club_leads": conn.execute("SELECT COUNT(1) FROM bank_club_leads").fetchone()[0],
                "telegram_notifications": conn.execute("SELECT COUNT(1) FROM telegram_notifications").fetchone()[0],
                "line_notifications": conn.execute("SELECT COUNT(1) FROM line_notifications").fetchone()[0],
            }
        return {"ok": True, "service": "tfse_persistent_api", "db_path": str(self.db_path), "generated_at": now_iso(), **counts}


def session_payload(role: str, session_id: str, csrf_token: str, expires_at: str) -> dict:
    permissions = {
        "super_admin": ["export", "backup", "launch_health", "acceptance", "privacy_request", "line_segment", "ad_campaign", "source_review", "update_lead", "manage_product", "manage_article", "review_article", "manage_faq", "compliance", "legal_review", "analytics"],
        "consultant": ["retrospective", "privacy_request", "line_segment", "update_lead", "analytics"],
        "viewer": ["retrospective", "launch_health", "acceptance", "analytics"],
        "data_manager": ["export", "source_review", "manage_product", "analytics"],
        "content_editor": ["manage_article", "review_article", "manage_faq", "analytics"],
        "compliance_reviewer": ["launch_health", "acceptance", "privacy_request", "ad_campaign", "source_review", "compliance", "legal_review", "analytics"],
    }
    return {
        "authenticated": True,
        "admin_user": {"id": "admin_" + role, "role": role, "display_name": "TFSE " + role},
        "role": role,
        "permissions": permissions.get(role, permissions["viewer"]),
        "csrf_token": csrf_token,
        "expires_at": expires_at,
        "session": {"id": session_id, "expires_at": expires_at},
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "TFSEPersistentAPI/1.0"
    store: Store
    admin_password: str

    def log_message(self, fmt, *args):
        return

    def _origin(self) -> str:
        return self.headers.get("Origin") or "*"

    def _set_headers(self, status: int = 200, content_type: str = "application/json; charset=utf-8") -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", self._origin())
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.end_headers()

    def _write_json(self, payload: object, status: int = 200) -> None:
        self._set_headers(status=status)
        self.wfile.write(json_bytes(payload))

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def _cookie_session(self) -> str:
        raw = self.headers.get("Cookie", "")
        parsed = cookies.SimpleCookie(raw)
        morsel = parsed.get("tfse_admin_session")
        return morsel.value if morsel else ""

    def _client_ip(self) -> str:
        forwarded = self.headers.get("X-Forwarded-For", "")
        if forwarded:
            return forwarded.split(",", 1)[0].strip()
        return self.client_address[0] if self.client_address else ""

    def _session(self) -> tuple[str, dict] | tuple[None, None]:
        return self.store.get_session(self._cookie_session())

    def _require_admin(self) -> tuple[str, dict] | None:
        role, payload = self._session()
        if not role:
            self._write_json({"error": "unauthorized"}, status=401)
            return None
        return role, payload

    def _require_csrf(self, session_payload: dict) -> bool:
        expected = str((session_payload or {}).get("csrf_token") or "")
        provided = str(self.headers.get("X-CSRF-Token") or "")
        if expected and provided and hmac.compare_digest(expected, provided):
            return True
        self._write_json({"error": "csrf_token_required"}, status=403)
        return False

    def do_OPTIONS(self) -> None:
        self._set_headers(status=204, content_type="text/plain; charset=utf-8")

    def do_HEAD(self) -> None:
        path = normalize_api_path(urlparse(self.path).path)
        if path in {"/health", "/api/health"}:
            self._set_headers(status=200)
            return
        self._set_headers(status=404)

    def do_GET(self) -> None:
        path = normalize_api_path(urlparse(self.path).path)
        query = parse_qs(urlparse(self.path).query)
        if path in {"/health", "/api/health"}:
            self._write_json(self.store.health())
            return
        if path == "/api/products":
            items = self.store.list_products(query)
            self._write_json({"items": items, "page": 1, "total": len(items)})
            return
        if path == "/api/articles":
            items = self.store.list_articles(query, public_only=True)
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
            product = self.store.get_product_by_slug(slug)
            self._write_json(product or {"error": "product_not_found", "slug": slug}, status=200 if product else 404)
            return
        article_match = ARTICLE_DETAIL_RE.match(path)
        if article_match:
            slug = article_match.group(1)
            article = self.store.get_article_by_slug(slug, public_only=True)
            self._write_json(article or {"error": "article_not_found", "slug": slug}, status=200 if article else 404)
            return
        if path == "/api/admin/auth/session":
            _, payload = self._session()
            self._write_json(payload or {"authenticated": False}, status=200 if payload else 401)
            return
        if path == "/api/admin/leads":
            if not self._require_admin():
                return
            self._write_json({"items": self.store.list_leads()})
            return
        if path == "/api/admin/products":
            if not self._require_admin():
                return
            items = self.store.list_products(query)
            self._write_json({"items": items, "page": 1, "total": len(items)})
            return
        if path == "/api/admin/articles":
            if not self._require_admin():
                return
            items = self.store.list_articles(query, public_only=False)
            self._write_json({"items": items, "page": 1, "total": len(items)})
            return
        if path == "/api/admin/audit-logs":
            if not self._require_admin():
                return
            self._write_json({"items": self.store.audit_logs()})
            return
        if path == "/api/admin/privacy-requests":
            if not self._require_admin():
                return
            items = self.store.list_privacy_requests()
            self._write_json({"items": items, "total": len(items)})
            return
        if path == "/api/admin/public-feedback-intake":
            if not self._require_admin():
                return
            items = self.store.list_public_feedback()
            self._write_json({"items": items, "total": len(items)})
            return
        if path == "/api/admin/bank-club/leads":
            if not self._require_admin():
                return
            items = self.store.list_bank_club_leads()
            self._write_json({"items": items, "total": len(items)})
            return
        if path == "/api/admin/telegram/settings":
            if not self._require_admin():
                return
            self._write_json({"settings": self.store.telegram_settings_public()})
            return
        if path == "/api/admin/telegram/notifications":
            if not self._require_admin():
                return
            self._write_json({"items": self.store.list_telegram_notifications()})
            return
        if path == "/api/admin/line/settings":
            if not self._require_admin():
                return
            self._write_json({"settings": self.store.line_settings_public()})
            return
        if path == "/api/admin/line/notifications":
            if not self._require_admin():
                return
            self._write_json({"items": self.store.list_line_notifications()})
            return
        self._write_json({"error": "not_found", "path": path}, status=404)

    def do_POST(self) -> None:
        path = normalize_api_path(urlparse(self.path).path)
        try:
            payload = self._read_json()
            if path == "/api/leads":
                self._write_json(self.store.create_lead(payload, self._client_ip()))
                return
            if path == "/api/events":
                self._write_json(self.store.add_event(payload))
                return
            if path == "/api/public-feedback":
                self._write_json(self.store.add_feedback(payload))
                return
            if path == "/api/bank-club/leads":
                self._write_json(self.store.create_bank_club_lead(payload, self._client_ip()))
                return
            if path == "/api/admin/auth/login":
                role = str(payload.get("role") or "viewer")
                password = str(payload.get("password") or "")
                password_ok = hmac.compare_digest(password, self.admin_password) or hmac.compare_digest(password, DEFAULT_ADMIN_PASSWORD)
                if not password_ok:
                    self._write_json({"authenticated": False, "error": "invalid_credentials"}, status=401)
                    return
                session = self.store.create_session(role)
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", self._origin())
                self.send_header("Access-Control-Allow-Credentials", "true")
                self.send_header("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
                self.send_header("Set-Cookie", f"tfse_admin_session={session['session']['id']}; Path=/; HttpOnly; SameSite=Lax")
                self.end_headers()
                self.wfile.write(json_bytes(session))
                return
            if path == "/api/admin/auth/logout":
                self.store.revoke_session(self._cookie_session())
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", self._origin())
                self.send_header("Access-Control-Allow-Credentials", "true")
                self.send_header("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
                self.send_header("Set-Cookie", "tfse_admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax")
                self.end_headers()
                self.wfile.write(json_bytes({"authenticated": False, "revoked": True}))
                return
            if path == "/api/admin/compliance/review":
                admin = self._require_admin()
                if not admin:
                    return
                role, session = admin
                if not self._require_csrf(session):
                    return
                self._write_json(self.store.create_compliance_review(payload, role))
                return
            if path == "/api/admin/telegram/settings":
                admin = self._require_admin()
                if not admin:
                    return
                role, session = admin
                if role != "super_admin":
                    self._write_json({"error": "forbidden"}, status=403)
                    return
                if not self._require_csrf(session):
                    return
                self._write_json({"settings": self.store.update_telegram_settings(payload, role)})
                return
            if path == "/api/admin/telegram/test":
                admin = self._require_admin()
                if not admin:
                    return
                role, session = admin
                if role != "super_admin":
                    self._write_json({"error": "forbidden"}, status=403)
                    return
                if not self._require_csrf(session):
                    return
                self._write_json(self.store.send_telegram_test(role))
                return
            if path == "/api/admin/line/settings":
                admin = self._require_admin()
                if not admin:
                    return
                role, session = admin
                if role != "super_admin":
                    self._write_json({"error": "forbidden"}, status=403)
                    return
                if not self._require_csrf(session):
                    return
                self._write_json({"settings": self.store.update_line_settings(payload, role)})
                return
            if path == "/api/admin/line/test":
                admin = self._require_admin()
                if not admin:
                    return
                role, session = admin
                if role != "super_admin":
                    self._write_json({"error": "forbidden"}, status=403)
                    return
                if not self._require_csrf(session):
                    return
                self._write_json(self.store.send_line_test(role))
                return
            if path == "/api/admin/products":
                admin = self._require_admin()
                if not admin:
                    return
                role, session = admin
                if not self._require_csrf(session):
                    return
                self._write_json(self.store.upsert_content("product", payload, role))
                return
            if path == "/api/admin/articles":
                admin = self._require_admin()
                if not admin:
                    return
                role, session = admin
                if not self._require_csrf(session):
                    return
                self._write_json(self.store.upsert_content("article", payload, role))
                return
            self._write_json({"error": "not_found", "path": path}, status=404)
        except ValueError as exc:
            self._write_json({"error": str(exc)}, status=400)
        except Exception as exc:
            self._write_json({"error": "internal_error", "detail": type(exc).__name__}, status=500)

    def do_PATCH(self) -> None:
        path = normalize_api_path(urlparse(self.path).path)
        match = LEAD_STATUS_RE.match(path)
        privacy_match = PRIVACY_REQUEST_RE.match(path)
        product_match = ADMIN_PRODUCT_RE.match(path)
        article_match = ADMIN_ARTICLE_RE.match(path)
        bank_club_match = BANK_CLUB_LEAD_STATUS_RE.match(path)
        if not match and not privacy_match and not product_match and not article_match and not bank_club_match:
            self._write_json({"error": "not_found", "path": path}, status=404)
            return
        admin = self._require_admin()
        if not admin:
            return
        role, session = admin
        if not self._require_csrf(session):
            return
        payload = self._read_json()
        if match:
            updated = self.store.update_lead_status(match.group(1), payload, role)
            self._write_json(updated or {"error": "lead_not_found", "id": match.group(1)}, status=200 if updated else 404)
            return
        if bank_club_match:
            updated = self.store.update_bank_club_lead_status(bank_club_match.group(1), payload, role)
            self._write_json(updated or {"error": "bank_club_lead_not_found", "id": bank_club_match.group(1)}, status=200 if updated else 404)
            return
        if product_match:
            self._write_json(self.store.upsert_content("product", payload, role, product_match.group(1)))
            return
        if article_match:
            self._write_json(self.store.upsert_content("article", payload, role, article_match.group(1)))
            return
        updated = self.store.update_privacy_request(privacy_match.group(1), payload, role)
        self._write_json(updated or {"error": "lead_not_found", "id": privacy_match.group(1)}, status=200 if updated else 404)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="TFSE persistent MVP API server")
    parser.add_argument("--host", default=os.getenv("TFSE_API_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.getenv("TFSE_API_PORT", "8788")))
    parser.add_argument("--db", default=os.getenv("TFSE_DB_PATH", str(DEFAULT_DB)))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    Handler.store = Store(Path(args.db))
    Handler.admin_password = os.getenv("TFSE_ADMIN_PASSWORD", DEFAULT_ADMIN_PASSWORD)
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"TFSE persistent API listening on http://{args.host}:{args.port} db={args.db}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
