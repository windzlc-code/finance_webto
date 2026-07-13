from __future__ import annotations

import base64
import hmac
import json
import mimetypes
import os
import re
import sqlite3
import time
import uuid
import urllib.error
import urllib.request
from hashlib import sha256
from pathlib import Path
from typing import Any

from backend.minimax_adapter import (
    list_audit_logs,
    minimax_admin_review,
    minimax_regression_task,
    minimax_support_chat,
)


ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("SUPPORT_DATA_DIR") or (ROOT / "data" / "support"))
DB_PATH = DATA_DIR / "support.sqlite3"
ATTACHMENT_DIR = DATA_DIR / "attachments"
TELEGRAM_STATE_PATH = DATA_DIR / "telegram_polling.json"
REQUEST_TIMEOUT_SEC = float(os.environ.get("SUPPORT_NOTIFY_TIMEOUT_SEC", "10"))
SUPPORT_ATTACHMENT_MAX_BYTES = int(os.environ.get("SUPPORT_ATTACHMENT_MAX_BYTES", str(20 * 1024 * 1024)))
SUPPORT_ATTACHMENT_MAX_FILES = int(os.environ.get("SUPPORT_ATTACHMENT_MAX_FILES", "3"))
ATTACHMENT_ALLOWED_MIME = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _coerce_text(value: Any, max_len: int = 4000) -> str:
    text = str(value or "").strip()
    return text[:max_len]


def _json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _json_loads(value: str | None, fallback: Any) -> Any:
    if not value:
        return fallback
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


def _ensure_columns(conn: sqlite3.Connection, table: str, columns: dict[str, str]) -> None:
    existing = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})")}
    for name, definition in columns.items():
        if name not in existing:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {name} {definition}")


def _connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ATTACHMENT_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS support_intakes (
            id TEXT PRIMARY KEY,
            source TEXT NOT NULL,
            name TEXT,
            contact TEXT,
            note TEXT,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            last_messages_json TEXT,
            notify_results_json TEXT
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS support_messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT,
            source TEXT NOT NULL,
            direction TEXT NOT NULL,
            role TEXT NOT NULL,
            sender_id TEXT,
            text TEXT,
            created_at TEXT NOT NULL,
            raw_json TEXT
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS support_attachments (
            id TEXT PRIMARY KEY,
            case_id TEXT,
            message_id TEXT,
            intake_id TEXT,
            file_name TEXT NOT NULL,
            mime_type TEXT,
            size INTEGER NOT NULL,
            storage_path TEXT NOT NULL,
            url TEXT NOT NULL,
            created_at TEXT NOT NULL,
            meta_json TEXT
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_support_intakes_created ON support_intakes(created_at DESC)")
    _ensure_columns(conn, "support_intakes", {
        "case_id": "TEXT",
        "ocr_context_json": "TEXT",
        "related_messages_json": "TEXT",
    })
    conn.execute("CREATE INDEX IF NOT EXISTS idx_support_intakes_case_id ON support_intakes(case_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_support_messages_created ON support_messages(created_at DESC)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_support_attachments_created ON support_attachments(created_at DESC)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_support_attachments_case_id ON support_attachments(case_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_support_attachments_message_id ON support_attachments(message_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_support_attachments_intake_id ON support_attachments(intake_id)")
    conn.commit()
    return conn


def _row_to_intake(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "source": row["source"],
        "name": row["name"] or "",
        "contact": row["contact"] or "",
        "note": row["note"] or "",
        "status": row["status"],
        "createdAt": row["created_at"],
        "lastMessages": _json_loads(row["last_messages_json"], []),
        "notifyResults": _json_loads(row["notify_results_json"], []),
        "caseId": row["case_id"] or "",
        "ocrContext": _json_loads(row["ocr_context_json"], {}),
        "relatedMessages": _json_loads(row["related_messages_json"], []),
    }


def _row_to_message(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "conversationId": row["conversation_id"] or "",
        "source": row["source"],
        "direction": row["direction"],
        "role": row["role"],
        "senderId": row["sender_id"] or "",
        "text": row["text"] or "",
        "createdAt": row["created_at"],
        "raw": _json_loads(row["raw_json"], {}),
    }


def _row_to_attachment(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "caseId": row["case_id"] or "",
        "messageId": row["message_id"] or "",
        "intakeId": row["intake_id"] or "",
        "fileName": row["file_name"] or "",
        "mimeType": row["mime_type"] or "",
        "size": int(row["size"] or 0),
        "url": row["url"] or "",
        "createdAt": row["created_at"] or "",
        "meta": _json_loads(row["meta_json"], {}),
    }


def _format_file_size(size: int) -> str:
    try:
        value = int(size or 0)
    except (TypeError, ValueError):
        value = 0
    if value >= 1024 * 1024:
        return f"{value / (1024 * 1024):.1f} MB"
    if value >= 1024:
        return f"{value / 1024:.0f} KB"
    return f"{value} B"


def _safe_attachment_filename(value: Any) -> str:
    name = Path(_coerce_text(value, 180) or "ocr-upload").name
    name = re.sub(r"[\x00-\x1f/\\:]+", "_", name).strip(" ._")
    return name[:160] or "ocr-upload"


def _attachment_extension(file_name: str, mime_type: str) -> str:
    suffix = Path(file_name).suffix.lower()
    if suffix in {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}:
        return suffix
    guessed = mimetypes.guess_extension(mime_type or "") or ""
    if guessed == ".jpe":
        return ".jpg"
    return guessed if guessed in {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"} else ".bin"


def _attachment_public_url(attachment_id: str) -> str:
    return f"/api/support/attachments/{attachment_id}"


def _support_public_base_url() -> str:
    base = (
        os.environ.get("SUPPORT_PUBLIC_BASE_URL")
        or os.environ.get("APP_PUBLIC_BASE_URL")
        or os.environ.get("PUBLIC_BASE_URL")
        or "http://127.0.0.1:5502"
    )
    return _coerce_text(base, 300).rstrip("/") or "http://127.0.0.1:5502"


def _absolute_support_url(value: Any) -> str:
    url = _coerce_text(value, 500)
    if not url:
        return ""
    if url.startswith(("http://", "https://")):
        return url
    return f"{_support_public_base_url()}/{url.lstrip('/')}"


def _normalize_attachment_meta(value: Any, limit: int = SUPPORT_ATTACHMENT_MAX_FILES) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    normalized: list[dict[str, Any]] = []
    for item in value[: max(0, int(limit or SUPPORT_ATTACHMENT_MAX_FILES))]:
        if not isinstance(item, dict):
            continue
        normalized.append({
            "id": _coerce_text(item.get("id"), 120),
            "caseId": _coerce_text(item.get("caseId") or item.get("case_id"), 120),
            "messageId": _coerce_text(item.get("messageId") or item.get("message_id"), 120),
            "intakeId": _coerce_text(item.get("intakeId") or item.get("intake_id"), 120),
            "fileName": _safe_attachment_filename(item.get("fileName") or item.get("name")),
            "mimeType": _coerce_text(item.get("mimeType") or item.get("type"), 80),
            "size": int(item.get("size") or 0) if str(item.get("size") or "0").isdigit() else 0,
            "url": _coerce_text(item.get("url"), 300),
            "createdAt": _coerce_text(item.get("createdAt"), 80),
            "skipped": bool(item.get("skipped")),
            "reason": _coerce_text(item.get("reason"), 300),
        })
    return normalized


def _sanitize_raw_payload(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        return {}
    sanitized = dict(payload)
    attachments = []
    for item in payload.get("attachments") or []:
        if not isinstance(item, dict):
            continue
        clean = {
            key: value
            for key, value in item.items()
            if key not in {"base64", "data", "dataUrl", "content"}
        }
        attachments.append(clean)
    if attachments:
        sanitized["attachments"] = attachments
    return sanitized


def _decode_attachment_payload(item: dict[str, Any]) -> bytes:
    raw = item.get("base64") or item.get("data") or item.get("dataUrl") or ""
    if not isinstance(raw, str) or not raw.strip():
        raise ValueError("附件缺少 base64 內容")
    if "," in raw and raw.split(",", 1)[0].lower().startswith("data:"):
        raw = raw.split(",", 1)[1]
    return base64.b64decode(raw, validate=True)


def save_support_attachments(
    value: Any,
    *,
    case_id: str = "",
    message_id: str = "",
    intake_id: str = "",
) -> list[dict[str, Any]]:
    if not isinstance(value, list) or not value:
        return []
    saved: list[dict[str, Any]] = []
    today_dir = ATTACHMENT_DIR / time.strftime("%Y%m%d", time.localtime())
    today_dir.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        for item in value[:SUPPORT_ATTACHMENT_MAX_FILES]:
            if not isinstance(item, dict):
                continue
            file_name = _safe_attachment_filename(item.get("fileName") or item.get("name"))
            mime_type = _coerce_text(item.get("mimeType") or item.get("type"), 80)
            if mime_type == "image/jpg":
                mime_type = "image/jpeg"
            declared_size = int(item.get("size") or 0) if str(item.get("size") or "0").isdigit() else 0
            if mime_type not in ATTACHMENT_ALLOWED_MIME:
                saved.append({
                    "fileName": file_name,
                    "mimeType": mime_type,
                    "size": declared_size,
                    "skipped": True,
                    "reason": "只支援 PDF/JPG/PNG/WebP/HEIC 附件",
                })
                continue
            if declared_size and declared_size > SUPPORT_ATTACHMENT_MAX_BYTES:
                saved.append({
                    "fileName": file_name,
                    "mimeType": mime_type,
                    "size": declared_size,
                    "skipped": True,
                    "reason": f"附件超過 {_format_file_size(SUPPORT_ATTACHMENT_MAX_BYTES)} 限制",
                })
                continue
            try:
                content = _decode_attachment_payload(item)
            except Exception as exc:
                saved.append({
                    "fileName": file_name,
                    "mimeType": mime_type,
                    "size": declared_size,
                    "skipped": True,
                    "reason": f"附件解碼失敗：{exc}",
                })
                continue
            if len(content) > SUPPORT_ATTACHMENT_MAX_BYTES:
                saved.append({
                    "fileName": file_name,
                    "mimeType": mime_type,
                    "size": len(content),
                    "skipped": True,
                    "reason": f"附件超過 {_format_file_size(SUPPORT_ATTACHMENT_MAX_BYTES)} 限制",
                })
                continue
            attachment_id = f"att-{int(time.time() * 1000):x}-{uuid.uuid4().hex[:10]}"
            storage_path = today_dir / f"{attachment_id}{_attachment_extension(file_name, mime_type)}"
            storage_path.write_bytes(content)
            meta = {
                "originalName": file_name,
                "lastModified": _coerce_text(item.get("lastModified"), 80),
                "source": _coerce_text(item.get("source"), 80) or "support-widget",
            }
            record = {
                "id": attachment_id,
                "caseId": case_id,
                "messageId": message_id,
                "intakeId": intake_id,
                "fileName": file_name,
                "mimeType": mime_type,
                "size": len(content),
                "url": _attachment_public_url(attachment_id),
                "createdAt": _now_iso(),
                "meta": meta,
            }
            conn.execute(
                """
                INSERT INTO support_attachments
                (id, case_id, message_id, intake_id, file_name, mime_type, size,
                 storage_path, url, created_at, meta_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record["id"],
                    record["caseId"],
                    record["messageId"],
                    record["intakeId"],
                    record["fileName"],
                    record["mimeType"],
                    record["size"],
                    str(storage_path),
                    record["url"],
                    record["createdAt"],
                    _json_dumps(meta),
                ),
            )
            saved.append(record)
        conn.commit()
    return saved


def link_support_attachments(
    attachments: Any,
    *,
    case_id: str = "",
    message_id: str = "",
    intake_id: str = "",
) -> list[dict[str, Any]]:
    meta = [item for item in _normalize_attachment_meta(attachments) if item.get("id")]
    if not meta:
        return _normalize_attachment_meta(attachments)
    ids = [item["id"] for item in meta]
    with _connect() as conn:
        for attachment_id in ids:
            conn.execute(
                """
                UPDATE support_attachments
                SET case_id = COALESCE(NULLIF(?, ''), case_id),
                    message_id = COALESCE(NULLIF(?, ''), message_id),
                    intake_id = COALESCE(NULLIF(?, ''), intake_id)
                WHERE id = ?
                """,
                (case_id, message_id, intake_id, attachment_id),
            )
        conn.commit()
        placeholders = ",".join("?" for _ in ids)
        return [
            _row_to_attachment(row)
            for row in conn.execute(
                f"SELECT * FROM support_attachments WHERE id IN ({placeholders}) ORDER BY created_at DESC",
                ids,
            )
        ]


def _format_attachment_brief(attachments: Any) -> str:
    clean = [
        item for item in _normalize_attachment_meta(attachments, limit=8)
        if item.get("fileName") and not item.get("skipped")
    ]
    if not clean:
        return ""
    return "、".join(
        f"{item['fileName']}（{_format_file_size(item.get('size') or 0)}）"
        for item in clean
    )


def _format_attachment_link_lines(attachments: Any) -> list[str]:
    clean = [
        item for item in _normalize_attachment_meta(attachments, limit=8)
        if item.get("fileName") and not item.get("skipped")
    ]
    lines: list[str] = []
    for item in clean:
        url = _absolute_support_url(item.get("url"))
        size = _format_file_size(item.get("size") or 0)
        if url:
            lines.append(f"- {item['fileName']}（{size}）：{url}")
        else:
            lines.append(f"- {item['fileName']}（{size}）")
    return lines


def _attach_records(items: list[dict[str, Any]], attachments: list[dict[str, Any]], *, item_id_key: str) -> None:
    by_id: dict[str, list[dict[str, Any]]] = {}
    by_case: dict[str, list[dict[str, Any]]] = {}
    for attachment in attachments:
        owner_id = attachment.get(item_id_key) or ""
        if owner_id:
            by_id.setdefault(owner_id, []).append(attachment)
        case_id = attachment.get("caseId") or ""
        if case_id:
            by_case.setdefault(case_id, []).append(attachment)
    for item in items:
        merged: list[dict[str, Any]] = []
        seen: set[str] = set()
        for attachment in by_id.get(item.get("id") or "", []) + by_case.get(item.get("caseId") or "", []):
            attachment_id = attachment.get("id") or ""
            if not attachment_id or attachment_id in seen:
                continue
            seen.add(attachment_id)
            merged.append(attachment)
        item["attachments"] = merged


def read_support_attachment(attachment_id: str) -> tuple[dict[str, Any], Path, str]:
    clean_id = _coerce_text(attachment_id, 160)
    if not re.fullmatch(r"att-[A-Za-z0-9-]+", clean_id or ""):
        raise FileNotFoundError("attachment not found")
    with _connect() as conn:
        row = conn.execute("SELECT * FROM support_attachments WHERE id = ?", (clean_id,)).fetchone()
    if not row:
        raise FileNotFoundError("attachment not found")
    path = Path(row["storage_path"])
    try:
        path.relative_to(ATTACHMENT_DIR)
    except ValueError:
        raise FileNotFoundError("attachment not found") from None
    if not path.exists() or not path.is_file():
        raise FileNotFoundError("attachment file missing")
    meta = _row_to_attachment(row)
    return meta, path, meta.get("mimeType") or "application/octet-stream"


def support_status() -> dict[str, Any]:
    telegram_token = bool(os.environ.get("TELEGRAM_BOT_TOKEN"))
    telegram_chat = bool(os.environ.get("TELEGRAM_CHAT_ID"))
    line_token = bool(os.environ.get("LINE_CHANNEL_ACCESS_TOKEN"))
    line_secret = bool(os.environ.get("LINE_CHANNEL_SECRET"))
    line_to = bool(os.environ.get("LINE_SUPPORT_TO") or os.environ.get("LINE_PUSH_TO"))
    return {
        "status": "ok",
        "storage": {
            "type": "sqlite",
            "path": str(DB_PATH),
            "available": True,
        },
        "telegram": {
            "configured": telegram_token and telegram_chat,
            "botToken": telegram_token,
            "chatId": telegram_chat,
            "webhookSecret": bool(os.environ.get("TELEGRAM_WEBHOOK_SECRET")),
            "webhookUrl": bool(os.environ.get("TELEGRAM_WEBHOOK_URL")),
            "mode": "webhook"
            if os.environ.get("TELEGRAM_WEBHOOK_URL")
            else ("polling" if os.environ.get("TELEGRAM_POLLING_ENABLED", "").strip().lower() in {"1", "true", "yes", "on", "y"} else "push-only"),
            "polling": telegram_polling_status(),
        },
        "line": {
            "configured": line_token and line_secret,
            "pushConfigured": line_token and line_to,
            "channelAccessToken": line_token,
            "channelSecret": line_secret,
            "pushTarget": line_to,
        },
    }


def list_support_data(limit: int = 100) -> dict[str, Any]:
    limit = max(1, min(int(limit or 100), 500))
    with _connect() as conn:
        intakes = [
            _row_to_intake(row)
            for row in conn.execute("SELECT * FROM support_intakes ORDER BY created_at DESC LIMIT ?", (limit,))
        ]
        messages = [
            _row_to_message(row)
            for row in conn.execute("SELECT * FROM support_messages ORDER BY created_at DESC LIMIT ?", (limit,))
        ]
        attachments = [
            _row_to_attachment(row)
            for row in conn.execute("SELECT * FROM support_attachments ORDER BY created_at DESC LIMIT ?", (limit * 3,))
        ]
    _attach_records(intakes, attachments, item_id_key="intakeId")
    _attach_records(messages, attachments, item_id_key="messageId")
    return {
        "status": "ok",
        "intakes": intakes,
        "history": messages,
        "attachments": attachments,
        "storage": support_status()["storage"],
    }


def clear_support_intakes() -> dict[str, Any]:
    with _connect() as conn:
        deleted = conn.execute("DELETE FROM support_intakes").rowcount
        conn.commit()
    return {"status": "ok", "deleted": deleted}


def _post_json(
    url: str,
    payload: dict[str, Any],
    headers: dict[str, str],
    timeout_sec: float | None = None,
) -> dict[str, Any]:
    data = _json_dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec or REQUEST_TIMEOUT_SEC) as res:
            body = res.read().decode("utf-8", errors="replace")
            return {
                "ok": 200 <= res.status < 300,
                "status": res.status,
                "body": _json_loads(body, body),
            }
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return {"ok": False, "status": exc.code, "body": _json_loads(body, body)}
    except Exception as exc:
        return {"ok": False, "status": None, "error": str(exc)}


def send_telegram_message(text: str, chat_id: str | None = None) -> dict[str, Any]:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    target_chat_id = (chat_id or os.environ.get("TELEGRAM_CHAT_ID") or "").strip()
    if not token or not target_chat_id:
        return {"provider": "telegram", "ok": False, "skipped": True, "reason": "TELEGRAM_BOT_TOKEN 或 TELEGRAM_CHAT_ID 未設定"}
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    result = _post_json(
        url,
        {
            "chat_id": target_chat_id,
            "text": text,
            "disable_web_page_preview": True,
        },
        {"Content-Type": "application/json"},
    )
    return {"provider": "telegram", **result}


def _telegram_api_post(
    method: str,
    payload: dict[str, Any] | None = None,
    timeout_sec: float | None = None,
) -> dict[str, Any]:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        return {"provider": "telegram", "ok": False, "skipped": True, "reason": "TELEGRAM_BOT_TOKEN 未設定"}
    safe_method = re.sub(r"[^A-Za-z0-9_]", "", method or "")
    if not safe_method:
        return {"provider": "telegram", "ok": False, "skipped": True, "reason": "telegram method 不合法"}
    return {
        "provider": "telegram",
        **_post_json(
            f"https://api.telegram.org/bot{token}/{safe_method}",
            payload or {},
            {"Content-Type": "application/json"},
            timeout_sec=timeout_sec,
        ),
    }


def _load_telegram_polling_state() -> dict[str, Any]:
    try:
        return _json_loads(TELEGRAM_STATE_PATH.read_text(encoding="utf-8"), {})
    except OSError:
        return {}


def _save_telegram_polling_state(state: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    safe_state = state if isinstance(state, dict) else {}
    TELEGRAM_STATE_PATH.write_text(json.dumps(safe_state, ensure_ascii=False, indent=2), encoding="utf-8")


def telegram_polling_status() -> dict[str, Any]:
    state = _load_telegram_polling_state()
    enabled = (
        os.environ.get("TELEGRAM_POLLING_ENABLED", "").strip().lower() in {"1", "true", "yes", "on", "y"}
        and not os.environ.get("TELEGRAM_WEBHOOK_URL", "").strip()
    )
    return {
        "configured": bool(os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()),
        "enabled": enabled,
        "statePath": str(TELEGRAM_STATE_PATH),
        "nextOffset": state.get("nextOffset"),
        "lastRunAt": state.get("lastRunAt") or "",
        "lastUpdateAt": state.get("lastUpdateAt") or "",
        "lastError": "" if not enabled else (state.get("lastError") or ""),
        "processedCount": int(state.get("processedCount") or 0),
    }


def telegram_delete_webhook(drop_pending_updates: bool = False) -> dict[str, Any]:
    return _telegram_api_post("deleteWebhook", {"drop_pending_updates": bool(drop_pending_updates)})


def telegram_get_me() -> dict[str, Any]:
    return _telegram_api_post("getMe", {})


def telegram_set_webhook(url: str, secret_token: str = "") -> dict[str, Any]:
    safe_url = _coerce_text(url, 2000)
    if not safe_url.startswith("https://"):
        return {"provider": "telegram", "ok": False, "reason": "Telegram webhook URL 必須是 HTTPS"}
    payload: dict[str, Any] = {
        "url": safe_url,
        "allowed_updates": ["message", "edited_message"],
    }
    if secret_token:
        payload["secret_token"] = _coerce_text(secret_token, 256)
    return _telegram_api_post("setWebhook", payload, timeout_sec=15)


def telegram_get_webhook_info() -> dict[str, Any]:
    return _telegram_api_post("getWebhookInfo", {}, timeout_sec=15)


def _telegram_update_is_from_bot(update: dict[str, Any]) -> bool:
    message = update.get("message") or update.get("edited_message") or {}
    sender = message.get("from") if isinstance(message, dict) else {}
    return bool(isinstance(sender, dict) and sender.get("is_bot"))


def poll_telegram_updates_once(timeout: int = 20, limit: int = 25) -> dict[str, Any]:
    state = _load_telegram_polling_state()
    payload: dict[str, Any] = {
        "timeout": max(0, min(50, int(timeout))),
        "limit": max(1, min(100, int(limit))),
        "allowed_updates": ["message", "edited_message"],
    }
    next_offset = state.get("nextOffset")
    if isinstance(next_offset, int) and next_offset > 0:
        payload["offset"] = next_offset
    # Telegram keeps long-poll requests open for `timeout` seconds. The local HTTP
    # client must wait longer, otherwise our next poll can collide with the prior
    # still-open Telegram request and produce a false getUpdates conflict.
    request_timeout = float(payload["timeout"]) + 10.0
    result = _telegram_api_post("getUpdates", payload, timeout_sec=max(15.0, request_timeout))
    now = _now_iso()
    if not result.get("ok"):
        state["lastRunAt"] = now
        state["lastError"] = _coerce_text(
            result.get("error")
            or ((result.get("body") or {}).get("description") if isinstance(result.get("body"), dict) else "")
            or "telegram getUpdates failed",
            300,
        )
        _save_telegram_polling_state(state)
        return {"status": "error", "poll": result, "processed": [], "state": telegram_polling_status()}

    body = result.get("body") if isinstance(result.get("body"), dict) else {}
    updates = body.get("result") if isinstance(body.get("result"), list) else []
    processed: list[dict[str, Any]] = []
    max_update_id = state.get("nextOffset", 0) - 1 if isinstance(state.get("nextOffset"), int) else 0
    for update in updates:
        if not isinstance(update, dict):
            continue
        update_id = int(update.get("update_id") or 0)
        if update_id:
            max_update_id = max(max_update_id, update_id)
        if _telegram_update_is_from_bot(update):
            processed.append({"updateId": update_id, "skipped": True, "reason": "from bot"})
            continue
        secret = os.environ.get("TELEGRAM_WEBHOOK_SECRET", "").strip()
        handled = handle_telegram_webhook(update, secret_token=secret)
        processed.append({
            "updateId": update_id,
            "status": handled.get("status"),
            "recorded": handled.get("recorded"),
            "sendOk": (handled.get("sendResult") or {}).get("ok") if isinstance(handled.get("sendResult"), dict) else None,
        })
    if max_update_id:
        state["nextOffset"] = max_update_id + 1
    state["lastRunAt"] = now
    if processed:
        state["lastUpdateAt"] = now
        state["processedCount"] = int(state.get("processedCount") or 0) + len([item for item in processed if item.get("recorded")])
    state["lastError"] = ""
    _save_telegram_polling_state(state)
    return {
        "status": "ok",
        "updateCount": len(updates),
        "processed": processed,
        "state": telegram_polling_status(),
    }


def send_line_push(text: str) -> dict[str, Any]:
    token = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "").strip()
    target = (os.environ.get("LINE_SUPPORT_TO") or os.environ.get("LINE_PUSH_TO") or "").strip()
    if not token or not target:
        return {"provider": "line", "ok": False, "skipped": True, "reason": "LINE_CHANNEL_ACCESS_TOKEN 或 LINE_SUPPORT_TO 未設定"}
    result = _post_json(
        "https://api.line.me/v2/bot/message/push",
        {"to": target, "messages": [{"type": "text", "text": text}]},
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
    )
    return {"provider": "line", **result}


OCR_CASE_KEYWORDS = (
    "ocr", "謄本", "門牌", "地址", "辨識", "解析", "欄位", "案件",
    "主建物", "附屬", "共有", "面積", "坪數", "車位", "總樓層",
    "標的樓層", "建物型態", "主要用途", "建築完成日期",
)


CASE_ID_PATTERNS = (
    re.compile(r"(?:案件編號|案件號碼|案號|編號|case\s*id|case|案件)\s*[：:#=]?\s*([A-Za-z0-9][A-Za-z0-9_.\-]{2,80})", re.I),
    re.compile(r"\b(OCR[-_A-Za-z0-9]{4,80})\b", re.I),
)


def _normalize_message_list(value: Any, limit: int = 12) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    normalized = []
    for item in value[-limit:]:
        if not isinstance(item, dict):
            continue
        normalized.append({
            "role": _coerce_text(item.get("role"), 40) or "user",
            "content": _coerce_text(item.get("content") or item.get("text"), 1000),
            "meta": _coerce_text(item.get("meta") or item.get("source"), 120),
            "createdAt": _coerce_text(item.get("createdAt"), 80),
        })
    return normalized


def _normalize_ocr_context(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        return {}
    fields = value.get("fields") if isinstance(value.get("fields"), dict) else {}
    field_results = value.get("fieldResults") if isinstance(value.get("fieldResults"), dict) else {}
    mapping = value.get("mapping") if isinstance(value.get("mapping"), dict) else {}
    diagnostics = value.get("diagnostics") if isinstance(value.get("diagnostics"), dict) else {}
    return {
        "hasData": bool(value.get("hasData") or fields or field_results or mapping),
        "fields": {str(k): _coerce_text(v, 600) for k, v in fields.items() if _coerce_text(v, 600)},
        "fieldResults": field_results,
        "mapping": {str(k): _coerce_text(v, 600) for k, v in mapping.items() if _coerce_text(v, 600)},
        "diagnostics": diagnostics,
    }


def _ocr_field(context: dict[str, Any], *keys: str) -> str:
    fields = context.get("fields") if isinstance(context.get("fields"), dict) else {}
    mapping = context.get("mapping") if isinstance(context.get("mapping"), dict) else {}
    for key in keys:
        value = _coerce_text(fields.get(key) or mapping.get(key), 300)
        if value:
            return value
    return ""


def _clean_case_id(value: Any) -> str:
    text = _coerce_text(value, 100).strip(" \t\r\n，。；;、()（）[]【】<>《》「」'\"")
    return text[:80]


def extract_ocr_case_id(payload: dict[str, Any], text: str) -> str:
    direct = _clean_case_id(payload.get("caseId") or payload.get("case_id"))
    if direct:
        return direct
    for pattern in CASE_ID_PATTERNS:
        match = pattern.search(text or "")
        if match:
            return _clean_case_id(match.group(1))
    context = _normalize_ocr_context(payload.get("ocrContext") or payload.get("ocr_context"))
    return _clean_case_id(
        _ocr_field(context, "caseId", "case_id", "案件編號", "sourceFile", "source_file")
    )


def _has_ocr_context(context: dict[str, Any]) -> bool:
    return bool(context.get("hasData") or context.get("fields") or context.get("fieldResults") or context.get("mapping"))


def is_ocr_case_message(text: str, payload: dict[str, Any]) -> bool:
    context = _normalize_ocr_context(payload.get("ocrContext") or payload.get("ocr_context"))
    if extract_ocr_case_id(payload, text):
        return True
    normalized = _coerce_text(text, 1200).lower()
    if not normalized:
        return False
    has_keyword = any(keyword.lower() in normalized for keyword in OCR_CASE_KEYWORDS)
    if not has_keyword:
        return False
    return _has_ocr_context(context) or any(anchor in normalized for anchor in ("ocr", "謄本", "案件", "辨識", "解析"))


def _brief_ocr_context(context: dict[str, Any]) -> str:
    pairs = [
        ("檔案", _ocr_field(context, "sourceFile", "source_file")),
        ("門牌", _ocr_field(context, "propertyAddress", "建物門牌", "地址")),
        ("查詢地址", _ocr_field(context, "queryAddress", "查詢地址")),
        ("主建物", _ocr_field(context, "mainArea", "主建物面積坪")),
        ("附屬", _ocr_field(context, "attachArea", "附屬建物面積坪")),
        ("共有", _ocr_field(context, "commonArea", "共有部分面積坪")),
        ("車位", _ocr_field(context, "parkingArea", "車位權狀坪數")),
        ("車位數", _ocr_field(context, "parkingCount", "車位數量")),
        ("總樓層", _ocr_field(context, "totalFloors", "總樓層數")),
        ("樓層", _ocr_field(context, "unitFloor", "標的所在樓層")),
        ("型態", _ocr_field(context, "buildingType", "建物型態")),
        ("用途", _ocr_field(context, "purpose", "主要用途")),
    ]
    text = " / ".join(f"{label}:{value}" for label, value in pairs if value)
    return _coerce_text(text, 1200)


def _brief_query_result(context: dict[str, Any]) -> str:
    pairs = [
        ("每坪單價", _ocr_field(context, "avgUnitPrice", "avg_unit_price", "每坪單價")),
        ("房屋價值", _ocr_field(context, "houseValue", "house_value", "房屋價值")),
    ]
    text = " / ".join(f"{label}：{value}" for label, value in pairs if value)
    return _coerce_text(text, 600)


def _build_ocr_case_note(
    case_id: str,
    text: str,
    context: dict[str, Any],
    messages: list[dict[str, Any]],
    attachments: Any = None,
) -> str:
    parts = ["智能客服 OCR 案件查詢自動留單"]
    if case_id:
        parts.append(f"案件編號：{case_id}")
    attachment_brief = _format_attachment_brief(attachments)
    if attachment_brief:
        parts.append(f"上傳附件：{attachment_brief}")
    if text:
        parts.append(f"客戶訊息：{_coerce_text(text, 1200)}")
    context_brief = _brief_ocr_context(context)
    if context_brief:
        parts.append(f"OCR資料：{context_brief}")
    query_result = _brief_query_result(context)
    if query_result:
        parts.append(f"查詢結果：{query_result}")
    if messages:
        last = " / ".join(
            _coerce_text(item.get("content"), 180)
            for item in messages[-5:]
            if _coerce_text(item.get("content"), 180)
        )
        if last:
            parts.append(f"最近對話：{last}")
    return "\n".join(parts)


def _save_support_intake(record: dict[str, Any]) -> None:
    with _connect() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO support_intakes
            (id, source, name, contact, note, status, created_at, last_messages_json,
             notify_results_json, case_id, ocr_context_json, related_messages_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["id"],
                record["source"],
                record["name"],
                record["contact"],
                record["note"],
                record["status"],
                record["createdAt"],
                _json_dumps(record.get("lastMessages") or []),
                _json_dumps(record.get("notifyResults") or []),
                record.get("caseId") or "",
                _json_dumps(record.get("ocrContext") or {}),
                _json_dumps(record.get("relatedMessages") or []),
            ),
        )
        conn.commit()


def _format_intake_notice(record: dict[str, Any]) -> str:
    lines = [
        "估價系統客服留單",
        f"編號：{record['id']}",
        f"來源：{record['source']}",
    ]
    if record.get("caseId"):
        lines.append(f"案件：{record['caseId']}")
    context_brief = _brief_ocr_context(record.get("ocrContext") or {})
    if context_brief:
        lines.append(f"OCR：{context_brief}")
    query_result = _brief_query_result(record.get("ocrContext") or {})
    if query_result:
        lines.append(f"查詢結果：{query_result}")
    attachment_brief = _format_attachment_brief(record.get("attachments") or [])
    if attachment_brief:
        lines.append(f"附件：{attachment_brief}")
    attachment_links = _format_attachment_link_lines(record.get("attachments") or [])
    if attachment_links:
        lines.append("OCR原始檔：")
        lines.extend(attachment_links)
    lines.extend([
        f"稱呼：{record.get('name') or '未填'}",
        f"聯絡：{record.get('contact') or '未填'}",
        f"時間：{record['createdAt']}",
        f"內容：{record.get('note') or '未填'}",
    ])
    return "\n".join(lines)


def _format_message_notice(record: dict[str, Any]) -> str:
    raw = record.get("raw") if isinstance(record.get("raw"), dict) else {}
    context = _normalize_ocr_context(raw.get("ocrContext") or raw.get("ocr_context"))
    case_id = extract_ocr_case_id(raw, _coerce_text(record.get("text"), 4000))
    lines = [
        "估價系統智能客服訊息",
        f"來源：{record.get('source') or 'web'}",
        f"時間：{record.get('createdAt') or _now_iso()}",
        f"內容：{record.get('text') or '未填'}",
    ]
    if case_id:
        lines.append(f"案件：{case_id}")
    query_result = _brief_query_result(context)
    if query_result:
        lines.append(f"查詢結果：{query_result}")
    attachment_brief = _format_attachment_brief(record.get("attachments") or [])
    if attachment_brief:
        lines.append(f"附件：{attachment_brief}")
    attachment_links = _format_attachment_link_lines(record.get("attachments") or [])
    if attachment_links:
        lines.append("OCR原始檔：")
        lines.extend(attachment_links)
    return "\n".join(lines)


def notify_support(record: dict[str, Any]) -> list[dict[str, Any]]:
    text = _format_intake_notice(record)
    results = []
    if os.environ.get("TELEGRAM_BOT_TOKEN") and os.environ.get("TELEGRAM_CHAT_ID"):
        results.append(send_telegram_message(text))
    if os.environ.get("LINE_CHANNEL_ACCESS_TOKEN") and (os.environ.get("LINE_SUPPORT_TO") or os.environ.get("LINE_PUSH_TO")):
        results.append(send_line_push(text))
    if not results:
        results.append({"provider": "local", "ok": True, "skipped": True, "reason": "尚未設定 LINE/Telegram，已保存到本機後台"})
    return results


def notify_support_message(record: dict[str, Any]) -> list[dict[str, Any]]:
    text = _format_message_notice(record)
    results = []
    if os.environ.get("TELEGRAM_BOT_TOKEN") and os.environ.get("TELEGRAM_CHAT_ID"):
        results.append(send_telegram_message(text))
    if os.environ.get("LINE_CHANNEL_ACCESS_TOKEN") and (os.environ.get("LINE_SUPPORT_TO") or os.environ.get("LINE_PUSH_TO")):
        results.append(send_line_push(text))
    if not results:
        results.append({"provider": "local", "ok": True, "skipped": True, "reason": "尚未設定 LINE/Telegram，已保存到本機後台"})
    return results


def create_support_intake(payload: dict[str, Any]) -> dict[str, Any]:
    created_at = _now_iso()
    ocr_context = _normalize_ocr_context(payload.get("ocrContext") or payload.get("ocr_context"))
    related_messages = _normalize_message_list(
        payload.get("relatedMessages") or payload.get("related_messages") or payload.get("conversationHistory") or []
    )
    last_messages = _normalize_message_list(payload.get("lastMessages") if isinstance(payload.get("lastMessages"), list) else related_messages)
    record = {
        "id": _coerce_text(payload.get("id")) or f"support-{int(time.time() * 1000):x}",
        "source": _coerce_text(payload.get("source"), 80) or "web",
        "name": _coerce_text(payload.get("name"), 120),
        "contact": _coerce_text(payload.get("contact"), 200),
        "note": _coerce_text(payload.get("note"), 3000),
        "status": _coerce_text(payload.get("status"), 80) or "new",
        "createdAt": _coerce_text(payload.get("createdAt"), 80) or created_at,
        "lastMessages": last_messages,
        "caseId": extract_ocr_case_id(payload, _coerce_text(payload.get("note"), 3000)),
        "ocrContext": ocr_context,
        "relatedMessages": related_messages,
    }
    record["attachments"] = save_support_attachments(
        payload.get("attachments"),
        case_id=record["caseId"],
        intake_id=record["id"],
    )
    record["notifyResults"] = notify_support(record)
    _save_support_intake(record)
    return {"status": "ok", "record": record, "notifyResults": record["notifyResults"]}


def create_ocr_case_intake(message_record: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    text = _coerce_text(message_record.get("text"), 4000)
    ocr_context = _normalize_ocr_context(payload.get("ocrContext") or payload.get("ocr_context"))
    related_messages = _normalize_message_list(
        payload.get("conversationHistory") or payload.get("relatedMessages") or payload.get("lastMessages") or []
    )
    if not related_messages:
        related_messages = [{
            "role": message_record.get("role") or "user",
            "content": text,
            "meta": message_record.get("source") or "web",
            "createdAt": message_record.get("createdAt") or _now_iso(),
        }]
    case_id = extract_ocr_case_id(payload, text)
    fingerprint_src = "|".join([
        case_id,
        _ocr_field(ocr_context, "sourceFile", "source_file"),
        _ocr_field(ocr_context, "propertyAddress", "建物門牌", "地址"),
        text[:240],
    ])
    if case_id:
        safe_case = re.sub(r"[^A-Za-z0-9_.-]+", "-", case_id).strip("-")[:80] or sha256(case_id.encode("utf-8")).hexdigest()[:12]
        intake_id = f"ocr-case-{safe_case}"
    else:
        intake_id = f"ocr-case-{sha256(fingerprint_src.encode('utf-8')).hexdigest()[:16]}"
    attachments = link_support_attachments(
        message_record.get("attachments") or payload.get("attachments"),
        case_id=case_id,
        message_id=message_record.get("id") or "",
        intake_id=intake_id,
    )
    record = {
        "id": intake_id,
        "source": "web-ocr",
        "name": "OCR 案件查詢",
        "contact": "",
        "note": _build_ocr_case_note(case_id, text, ocr_context, related_messages, attachments),
        "status": "new",
        "createdAt": message_record.get("createdAt") or _now_iso(),
        "lastMessages": related_messages,
        "notifyResults": [{
            "provider": "local",
            "ok": True,
            "skipped": True,
            "reason": "智能客服 OCR 案件已自動歸檔到客戶留單管理",
        }],
        "caseId": case_id,
        "ocrContext": ocr_context,
        "relatedMessages": related_messages,
        "attachments": attachments,
    }
    _save_support_intake(record)
    return {"status": "ok", "record": record, "notifyResults": record["notifyResults"]}


def record_support_message(
    *,
    source: str,
    direction: str,
    role: str,
    text: str,
    sender_id: str = "",
    conversation_id: str = "",
    raw: dict[str, Any] | None = None,
) -> dict[str, Any]:
    record = {
        "id": f"msg-{int(time.time() * 1000):x}-{uuid.uuid4().hex[:8]}",
        "conversationId": conversation_id,
        "source": source,
        "direction": direction,
        "role": role,
        "senderId": sender_id,
        "text": _coerce_text(text, 4000),
        "createdAt": _now_iso(),
        "raw": raw or {},
    }
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO support_messages
            (id, conversation_id, source, direction, role, sender_id, text, created_at, raw_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["id"],
                record["conversationId"],
                record["source"],
                record["direction"],
                record["role"],
                record["senderId"],
                record["text"],
                record["createdAt"],
                _json_dumps(record["raw"]),
            ),
        )
        conn.commit()
    return record


def create_support_message(payload: dict[str, Any]) -> dict[str, Any]:
    source = _coerce_text(payload.get("source"), 80) or "web"
    direction = _coerce_text(payload.get("direction"), 40) or "inbound"
    role = _coerce_text(payload.get("role"), 40) or "user"
    text = _coerce_text(payload.get("text") or payload.get("content"), 4000)
    case_id = extract_ocr_case_id(payload, text)
    record = record_support_message(
        source=source,
        direction=direction,
        role=role,
        text=text,
        sender_id=_coerce_text(payload.get("senderId"), 160) or "browser",
        conversation_id=_coerce_text(payload.get("conversationId"), 160) or "web",
        raw=_sanitize_raw_payload(payload) if isinstance(payload, dict) else {},
    )
    record["attachments"] = save_support_attachments(
        payload.get("attachments"),
        case_id=case_id,
        message_id=record["id"],
    )
    notify_results: list[dict[str, Any]] = []
    if record["source"] == "web" and record["direction"] == "inbound" and record["role"] == "user" and record["text"]:
        notify_results = notify_support_message(record)
        if is_ocr_case_message(record["text"], payload):
            auto_intake = create_ocr_case_intake(record, payload)
        else:
            auto_intake = None
    else:
        auto_intake = None
    record["notifyResults"] = notify_results
    return {"status": "ok", "record": record, "notifyResults": notify_results, "autoIntake": auto_intake}


def build_support_reply(text: str) -> str:
    normalized = _coerce_text(text, 800).lower()
    if any(keyword in normalized for keyword in ["ocr", "謄本", "門牌", "辨識"]):
        return "已收到 OCR/謄本問題。請先展開網站的「欄位辨識診斷」查看 raw 值與來源；我也已把這則訊息記錄到客服後台。"
    if any(keyword in normalized for keyword in ["排序", "分數", "比較案例", "單價"]):
        return "目前比較案例依 Comparable Score 100 分制排序：地址接近度最高25、屋齡17、總樓層15、總面積15、交易日期10、樓別接近度8、主要用途5、單價5，再取排序後前 3 筆計算平均單價。我已將你的問題記錄到客服後台。"
    if any(keyword in normalized for keyword in ["貸款", "土增", "土地增值稅"]):
        return "房貸試算器內已整合償債能力試算，土地增值稅仍保留獨立試算頁。這則訊息已記錄到客服後台，方便後續人工確認。"
    return "已收到，這則訊息已記錄到估價系統客服後台。若要加速處理，請附上謄本檔名、錯誤欄位與正確值。"


def build_minimax_support_reply(payload: dict[str, Any], client: Any = None) -> dict[str, Any]:
    safe_payload = payload if isinstance(payload, dict) else {}
    result = minimax_support_chat(safe_payload, client=client)
    if result.get("ok") and result.get("reply"):
        return result
    fallback_reason = _coerce_text(result.get("fallbackReason") or "minimaxSupportUnavailable", 240)
    return {
        "ok": False,
        "engine": "minimax_m3",
        "mode": "support",
        "model": result.get("model") or "MiniMax-M3",
        "reply": build_support_reply(str(safe_payload.get("text") or safe_payload.get("message") or "")),
        "warnings": result.get("warnings") or [fallback_reason],
        "fallbackRecommended": True,
        "fallbackReason": fallback_reason,
        "audit": result.get("audit"),
    }


def build_minimax_admin_review(payload: dict[str, Any], client: Any = None) -> dict[str, Any]:
    result = minimax_admin_review(payload if isinstance(payload, dict) else {}, client=client)
    if not isinstance(result.get("items"), list):
        result["items"] = []
    return result


def build_minimax_regression_task(payload: dict[str, Any], client: Any = None) -> dict[str, Any]:
    result = minimax_regression_task(payload if isinstance(payload, dict) else {}, client=client)
    if not isinstance(result.get("tasks"), list):
        result["tasks"] = []
    return result


def build_minimax_audit_logs(limit: int = 20, kind: str | None = None) -> dict[str, Any]:
    return list_audit_logs(limit=limit, kind=kind)


def handle_telegram_webhook(payload: dict[str, Any], secret_token: str = "") -> dict[str, Any]:
    expected_secret = os.environ.get("TELEGRAM_WEBHOOK_SECRET", "").strip()
    if expected_secret and not hmac.compare_digest(secret_token or "", expected_secret):
        return {"status": "forbidden", "error": "invalid telegram secret token"}

    message = payload.get("message") or payload.get("edited_message") or {}
    chat = message.get("chat") if isinstance(message, dict) else {}
    sender = message.get("from") if isinstance(message, dict) else {}
    text = _coerce_text(message.get("text") or message.get("caption") or "")
    chat_id = str(chat.get("id") or "")
    sender_id = str(sender.get("id") or "")
    if text:
        support_chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
        from_support_chat = bool(support_chat_id and chat_id == support_chat_id)
        record_support_message(
            source="telegram",
            direction="inbound",
            role="assistant" if from_support_chat else "user",
            text=text,
            sender_id=sender_id,
            conversation_id=chat_id,
            raw=payload,
        )
        if from_support_chat:
            return {"status": "ok", "recorded": True, "routedToClient": True}
        reply_payload = build_minimax_support_reply({
            "text": text,
            "source": "telegram",
            "conversationId": chat_id,
            "senderId": sender_id,
        })
        reply = _coerce_text(reply_payload.get("reply"), 4000) or build_support_reply(text)
        send_result = send_telegram_message(reply, chat_id=chat_id)
        record_support_message(
            source="telegram",
            direction="outbound",
            role="assistant",
            text=reply,
            sender_id="bot",
            conversation_id=chat_id,
            raw={"sendResult": send_result, "replyPayload": reply_payload},
        )
        return {"status": "ok", "recorded": True, "reply": reply, "sendResult": send_result}
    return {"status": "ok", "recorded": False, "reason": "no text message"}


def verify_line_signature(raw_body: bytes, signature: str) -> bool:
    secret = os.environ.get("LINE_CHANNEL_SECRET", "").strip()
    if not secret:
        return False
    digest = hmac.new(secret.encode("utf-8"), raw_body, sha256).digest()
    expected = base64.b64encode(digest).decode("ascii")
    return hmac.compare_digest(signature or "", expected)


def _line_reply(reply_token: str, text: str) -> dict[str, Any]:
    token = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "").strip()
    if not token or not reply_token:
        return {"provider": "line", "ok": False, "skipped": True, "reason": "LINE token 或 replyToken 不足"}
    return _post_json(
        "https://api.line.me/v2/bot/message/reply",
        {"replyToken": reply_token, "messages": [{"type": "text", "text": text}]},
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
    )


def handle_line_webhook(payload: dict[str, Any], raw_body: bytes, signature: str) -> dict[str, Any]:
    if not verify_line_signature(raw_body, signature):
        return {"status": "forbidden", "error": "invalid line signature"}

    results = []
    for event in payload.get("events") or []:
        if not isinstance(event, dict):
            continue
        message = event.get("message") or {}
        if message.get("type") != "text":
            continue
        source = event.get("source") or {}
        sender_id = str(source.get("userId") or source.get("groupId") or source.get("roomId") or "")
        text = _coerce_text(message.get("text") or "")
        record_support_message(
            source="line",
            direction="inbound",
            role="user",
            text=text,
            sender_id=sender_id,
            conversation_id=sender_id,
            raw=event,
        )
        reply = build_support_reply(text)
        send_result = _line_reply(str(event.get("replyToken") or ""), reply)
        record_support_message(
            source="line",
            direction="outbound",
            role="assistant",
            text=reply,
            sender_id="bot",
            conversation_id=sender_id,
            raw={"sendResult": send_result},
        )
        results.append({"reply": reply, "sendResult": send_result})
    return {"status": "ok", "results": results}
