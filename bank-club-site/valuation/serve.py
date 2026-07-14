#!/usr/bin/env python3
"""
本機開發伺服器：靜態檔案 + /api/lvr/* 官方實價查詢代理（與 Windows serve.ps1 的 API 對齊）。
macOS / Linux：python3 serve.py
瀏覽器開 http://127.0.0.1:5500/ 即可官方查詢，無需另啟 5501。
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import ssl
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import parse_qs, quote, unquote, urlparse
from urllib.request import HTTPCookieProcessor, HTTPSHandler, Request, build_opener

from support_backend import (
    build_minimax_admin_review,
    build_minimax_audit_logs,
    build_minimax_regression_task,
    build_minimax_support_reply,
    clear_support_intakes,
    create_support_intake,
    create_support_message,
    handle_line_webhook,
    handle_telegram_webhook,
    list_support_data,
    poll_telegram_updates_once,
    read_support_attachment,
    support_status,
    telegram_delete_webhook,
    telegram_get_me,
)
from lvr_open_data_backend import open_data_status, search_open_data
from backend.real_price import (
    apply_geocode_cache_api,
    case_detail_api,
    cathay_underwriting_zone_api,
    commit_geocode_api,
    geocode_address_api,
    geocode_official_case_api,
    import_from_open_data_api,
    map_clusters_api,
    map_search_api,
    nearby_api,
    nearby_by_address_api,
    pending_geocode_api,
    real_price_status_api,
)

ROOT = Path(__file__).resolve().parent
OFFICIAL_BASE = "https://lvr.land.moi.gov.tw/R11"
OFFICIAL_REQUEST_TIMEOUT_SEC = 90

_sessions: dict[str, tuple[object, float]] = {}  # sid -> (opener, created_ts)
_telegram_polling_thread: threading.Thread | None = None


def _load_local_env(path: Path) -> None:
    if not path.exists():
        return
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return
    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].strip()
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if not key or not (key[0].isalpha() or key[0] == "_"):
            continue
        if not all(ch.isalnum() or ch == "_" for ch in key):
            continue
        if key in os.environ:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        os.environ[key] = value


_load_local_env(ROOT / ".env.local")


def _ssl_context() -> ssl.SSLContext:
    context = ssl.create_default_context()
    # The official MOI endpoint currently omits a certificate extension that
    # Python 3.12/OpenSSL strict mode requires. Keep normal CA and hostname
    # validation, but allow this known-compatible public endpoint to load.
    context.verify_flags &= ~getattr(ssl, "VERIFY_X509_STRICT", 0)
    return context


def _official_headers() -> dict[str, str]:
    return {
        "Accept": "*/*",
        "Accept-Language": "zh-TW,zh;q=0.9",
        "Referer": f"{OFFICIAL_BASE}/index.html",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
    }


def _decode_official_body(data: bytes) -> str:
    if not data:
        return ""
    try:
        t = data.decode("utf-8")
        if any("\u4e00" <= c <= "\u9fff" for c in t):
            return t
    except UnicodeDecodeError:
        pass
    t = data.decode("iso-8859-1", errors="replace")
    try:
        fixed = t.encode("latin-1", errors="ignore").decode("utf-8", errors="replace")
        if any("\u4e00" <= c <= "\u9fff" for c in fixed):
            return fixed
    except Exception:
        pass
    return t


def _official_fetch(opener: object, url: str, method: str = "GET", body: bytes | None = None) -> tuple[int, str]:
    req = Request(url, data=body, headers=_official_headers(), method=method)
    try:
        with opener.open(req, timeout=OFFICIAL_REQUEST_TIMEOUT_SEC) as resp:
            raw = resp.read()
            return resp.getcode() or 200, _decode_official_body(raw)
    except HTTPError as e:
        raw = e.read() or b""
        code = int(getattr(e, "code", None) or 502)
        return code, _decode_official_body(raw)
    except Exception as e:
        return 502, json.dumps(
            {
                "error": f"official request failed: {e}",
                "remoteHost": "lvr.land.moi.gov.tw",
                "hint": "請檢查網路、防火牆或可連線 https://lvr.land.moi.gov.tw",
            },
            ensure_ascii=False,
        )


def _new_opener_with_session() -> object:
    return build_opener(HTTPSHandler(context=_ssl_context()), HTTPCookieProcessor())


def _cleanup_sessions() -> None:
    now = time.time()
    expired = [sid for sid, (_, t0) in _sessions.items() if now - t0 > 600]
    for sid in expired:
        del _sessions[sid]


def _content_type(path: Path) -> str:
    ext = path.suffix.lower()
    return {
        ".html": "text/html; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
        ".webp": "image/webp",
        ".heic": "image/heic",
        ".heif": "image/heif",
        ".txt": "text/plain; charset=utf-8",
        ".pdf": "application/pdf",
    }.get(ext, "application/octet-stream")


def _env_truthy(name: str, default: str = "") -> bool:
    value = os.environ.get(name, default).strip().lower()
    return value in {"1", "true", "yes", "on", "y"}


def _start_telegram_polling_worker() -> None:
    global _telegram_polling_thread
    if _telegram_polling_thread and _telegram_polling_thread.is_alive():
        return
    if os.environ.get("TELEGRAM_WEBHOOK_URL", "").strip():
        print("[support] Telegram webhook mode enabled; polling worker skipped")
        return
    if not _env_truthy("TELEGRAM_POLLING_ENABLED"):
        return
    if not os.environ.get("TELEGRAM_BOT_TOKEN", "").strip():
        print("[support] Telegram polling skipped: TELEGRAM_BOT_TOKEN is not configured")
        return

    poll_timeout = max(0, min(50, int(float(os.environ.get("TELEGRAM_POLLING_TIMEOUT_SEC", "5") or 5))))
    poll_interval = max(0.5, float(os.environ.get("TELEGRAM_POLLING_INTERVAL_SEC", "1") or 1))

    def _run() -> None:
        print("[support] Telegram polling worker starting")
        me = telegram_get_me()
        if not me.get("ok"):
            print("[support] Telegram polling stopped: getMe failed")
            return
        delete_result = telegram_delete_webhook(drop_pending_updates=False)
        if not delete_result.get("ok"):
            print("[support] Telegram polling stopped: deleteWebhook failed")
            return
        while True:
            result = poll_telegram_updates_once(timeout=poll_timeout)
            if result.get("status") == "ok":
                processed = result.get("processed") or []
                if processed:
                    print("[support] Telegram polling processed %s update(s)" % len(processed))
                time.sleep(poll_interval)
                continue
            state = result.get("state") if isinstance(result.get("state"), dict) else {}
            print("[support] Telegram polling warning: %s" % (state.get("lastError") or "unknown error"))
            time.sleep(max(5.0, poll_interval))

    _telegram_polling_thread = threading.Thread(target=_run, name="telegram-support-polling", daemon=True)
    _telegram_polling_thread.start()


class LvrDevHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt: str, *args) -> None:
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def _send(self, status: int, body: bytes, content_type: str, *, cache_control: str = "no-store") -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", cache_control)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type, X-Telegram-Bot-Api-Secret-Token, X-Line-Signature",
        )
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, status: int, payload: object) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self._send(status, body, "application/json; charset=utf-8")

    @staticmethod
    def _static_cache_control(path: Path) -> str:
        """Keep the app shell current while allowing its immutable assets to warm."""
        if path.suffix.lower() in {".html", ".json"}:
            return "no-cache, max-age=0, must-revalidate"
        return "public, max-age=3600, stale-while-revalidate=86400"

    def _read_body(self) -> bytes:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            return b""
        return self.rfile.read(length)

    def _json_payload(self, body_text: str) -> dict[str, object] | None:
        try:
            payload = json.loads(body_text) if body_text else {}
        except json.JSONDecodeError:
            self._send_json(400, {"error": "invalid json"})
            return None
        if not isinstance(payload, dict):
            self._send_json(400, {"error": "json body must be an object"})
            return None
        return payload

    def _query_limit(self, qs: dict[str, list[str]], default: int = 100, maximum: int = 500) -> int:
        try:
            value = int((qs.get("limit") or [str(default)])[0] or default)
        except (TypeError, ValueError):
            value = default
        return max(1, min(value, maximum))

    def _handle_support_api(
        self,
        normalized: str,
        qs: dict[str, list[str]],
        body_text: str,
        raw_body: bytes,
    ) -> bool:
        if normalized == "api/support/status":
            self._send_json(200, support_status())
            return True

        if normalized == "api/support/intakes":
            if self.command == "GET":
                self._send_json(200, list_support_data(limit=self._query_limit(qs)))
                return True
            payload = self._json_payload(body_text)
            if payload is None:
                return True
            if payload.get("action") == "clear":
                self._send_json(200, clear_support_intakes())
                return True
            self._send_json(200, create_support_intake(payload))
            return True

        if normalized == "api/support/intake" and self.command == "POST":
            payload = self._json_payload(body_text)
            if payload is None:
                return True
            self._send_json(200, create_support_intake(payload))
            return True

        if normalized == "api/support/messages":
            if self.command == "GET":
                data = list_support_data(limit=self._query_limit(qs))
                self._send_json(
                    200,
                    {
                        "status": "ok",
                        "history": data.get("history", []),
                        "messages": data.get("history", []),
                        "attachments": data.get("attachments", []),
                        "storage": data.get("storage", {}),
                    },
                )
                return True
            payload = self._json_payload(body_text)
            if payload is None:
                return True
            self._send_json(200, create_support_message(payload))
            return True

        if normalized == "api/support/message" and self.command == "POST":
            payload = self._json_payload(body_text)
            if payload is None:
                return True
            self._send_json(200, create_support_message(payload))
            return True

        if normalized.startswith("api/support/attachments/") and self.command == "GET":
            attachment_id = normalized.split("/", 3)[-1]
            try:
                _meta, path, mime_type = read_support_attachment(attachment_id)
            except FileNotFoundError:
                self._send_json(404, {"error": "attachment not found"})
                return True
            self._send(200, path.read_bytes(), mime_type or _content_type(path))
            return True

        if normalized == "api/support/telegram/webhook" and self.command == "POST":
            payload = self._json_payload(body_text)
            if payload is None:
                return True
            secret = self.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
            result = handle_telegram_webhook(payload, secret_token=secret)
            self._send_json(403 if result.get("status") == "forbidden" else 200, result)
            return True

        if normalized == "api/support/line/webhook" and self.command == "POST":
            payload = self._json_payload(body_text)
            if payload is None:
                return True
            signature = self.headers.get("X-Line-Signature", "")
            result = handle_line_webhook(payload, raw_body=raw_body, signature=signature)
            self._send_json(403 if result.get("status") == "forbidden" else 200, result)
            return True

        return False

    def _handle_minimax_api(self, normalized: str, qs: dict[str, list[str]], body_text: str) -> bool:
        if normalized == "api/minimax/audit":
            kind = (qs.get("kind") or [""])[0] or None
            self._send_json(200, build_minimax_audit_logs(limit=self._query_limit(qs, default=20), kind=kind))
            return True

        if self.command != "POST":
            self._send_json(405, {"error": "method not allowed"})
            return True

        payload = self._json_payload(body_text)
        if payload is None:
            return True

        if normalized == "api/minimax/support-chat":
            self._send_json(200, build_minimax_support_reply(payload))
            return True
        if normalized == "api/minimax/admin-review":
            self._send_json(200, build_minimax_admin_review(payload))
            return True
        if normalized == "api/minimax/regression-task":
            self._send_json(200, build_minimax_regression_task(payload))
            return True
        return False

    def _handle_api(self, path_only: str, qs: dict[str, list[str]], body_text: str, raw_body: bytes = b"") -> bool:
        normalized = path_only.strip("/").rstrip("/")
        _cleanup_sessions()

        if normalized.startswith("api/support/"):
            return self._handle_support_api(normalized, qs, body_text, raw_body)

        if normalized.startswith("api/minimax/"):
            return self._handle_minimax_api(normalized, qs, body_text)

        if normalized == "api/real-price/status":
            status, payload = real_price_status_api()
            self._send_json(status, payload)
            return True

        if normalized in {"api/real-price/geocode/pending", "api/real-price/pending-geocode"}:
            status, payload = pending_geocode_api(qs)
            self._send_json(status, payload)
            return True

        if normalized == "api/real-price/map-search":
            status, payload = map_search_api(qs)
            self._send_json(status, payload)
            return True

        if normalized == "api/real-price/map-clusters":
            status, payload = map_clusters_api(qs)
            self._send_json(status, payload)
            return True

        if normalized.startswith("api/real-price/cases/"):
            status, payload = case_detail_api(normalized.rsplit("/", 1)[-1])
            self._send_json(status, payload)
            return True

        if normalized == "api/tgos/config":
            app_id = os.environ.get("TGOS_APP_ID") or "x+JLVSx85Lk="
            api_key = os.environ.get("TGOS_API_KEY") or (
                "in8W74q0ogpcfW/STwicK8D5QwCdddJf05/7nb+OtDh8R99YN3T0LurV4xato3TpL/fOfylvJ9Wv/"
                "khZEsXEWxsBmg+GEj4AuokiNXCh14Rei21U5GtJpIkO++Mq3AguFK/ISDEWn4hMzqgrkxNe1Q=="
            )
            self._send_json(
                200,
                {
                    "ok": True,
                    "mode": "env" if os.environ.get("TGOS_APP_ID") and os.environ.get("TGOS_API_KEY") else "lite-default",
                    "appId": app_id,
                    "apiKey": api_key,
                    "scriptBase": "http://api.tgos.tw/TGOS_API/tgos?ver=2",
                },
            )
            return True

        if normalized in {
            "api/real-price/nearby",
            "api/real-price/nearby-by-address",
            "api/real-price/geocode/apply-cache",
            "api/real-price/geocode/commit",
            "api/real-price/import-from-open-data",
            "api/cathay/underwriting-zone",
            "api/geocode/address",
            "api/geocode/official-case",
        }:
            if self.command != "POST":
                self._send_json(405, {"error": "method not allowed"})
                return True
            payload = self._json_payload(body_text)
            if payload is None:
                return True
            if normalized == "api/real-price/nearby":
                status, response = nearby_api(payload)
            elif normalized == "api/real-price/nearby-by-address":
                status, response = nearby_by_address_api(payload)
            elif normalized == "api/real-price/geocode/apply-cache":
                status, response = apply_geocode_cache_api(payload)
            elif normalized == "api/real-price/geocode/commit":
                status, response = commit_geocode_api(payload)
            elif normalized == "api/real-price/import-from-open-data":
                status, response = import_from_open_data_api(payload)
            elif normalized == "api/cathay/underwriting-zone":
                status, response = cathay_underwriting_zone_api(payload)
            elif normalized == "api/geocode/official-case":
                status, response = geocode_official_case_api(payload)
            else:
                status, response = geocode_address_api(payload)
            self._send_json(status, response)
            return True

        if normalized == "api/lvr/opendata/status":
            self._send_json(200, open_data_status())
            return True

        if normalized == "api/lvr/opendata/search":
            if self.command != "POST":
                self._send_json(405, {"error": "method not allowed"})
                return True
            payload = self._json_payload(body_text)
            if payload is None:
                return True
            self._send_json(200, search_open_data(payload))
            return True

        if normalized == "api/lvr/cities":
            opener = _new_opener_with_session()
            status, text = _official_fetch(opener, f"{OFFICIAL_BASE}/SERVICE/CITY")
            self._send(status, text.encode("utf-8"), "application/json; charset=utf-8")
            return True

        if normalized == "api/lvr/towns":
            city = (qs.get("city") or [""])[0]
            if not city:
                self._send(400, b'{"error":"missing city parameter"}', "application/json; charset=utf-8")
                return True
            opener = _new_opener_with_session()
            url = f"{OFFICIAL_BASE}/SERVICE/CITY/{city}/"
            status, text = _official_fetch(opener, url)
            self._send(status, text.encode("utf-8"), "application/json; charset=utf-8")
            return True

        if normalized == "api/lvr/token":
            opener = _new_opener_with_session()
            # 與瀏覽器載入順序對齊，先進列表頁再取 token。
            _official_fetch(opener, f"{OFFICIAL_BASE}/index.html")
            status, ttext = _official_fetch(opener, f"{OFFICIAL_BASE}/jsp/setToken.jsp")
            if status != 200:
                self._send(status if status >= 400 else 500, ttext.encode("utf-8"), "application/json; charset=utf-8")
                return True
            try:
                tok = json.loads(ttext)
            except json.JSONDecodeError:
                self._send(
                    502,
                    json.dumps({"error": "invalid token response"}).encode("utf-8"),
                    "application/json; charset=utf-8",
                )
                return True
            sid = uuid.uuid4().hex
            _sessions[sid] = (opener, time.time())
            out = json.dumps({"sid": sid, "token": tok.get("token")}, ensure_ascii=False)
            self._send(200, out.encode("utf-8"), "application/json; charset=utf-8")
            return True

        if normalized == "api/lvr/md5":
            try:
                payload = json.loads(body_text) if body_text else {}
            except json.JSONDecodeError:
                self._send(400, b'{"error":"invalid json"}', "application/json; charset=utf-8")
                return True
            txt = str(payload.get("text") or "")
            if not txt:
                self._send(400, b'{"error":"missing text"}', "application/json; charset=utf-8")
                return True
            h = hashlib.md5(txt.encode("utf-8")).hexdigest()
            self._send(200, json.dumps({"md5": h}).encode("utf-8"), "application/json; charset=utf-8")
            return True

        if normalized == "api/lvr/query":
            try:
                payload = json.loads(body_text) if body_text else {}
            except json.JSONDecodeError:
                self._send(400, b'{"error":"invalid json"}', "application/json; charset=utf-8")
                return True
            sid = str(payload.get("sid") or "")
            qpath = str(payload.get("path") or "")
            qq = str(payload.get("q") or "")
            if not sid or not qpath or not qq:
                self._send(400, b'{"error":"missing sid, path, or q"}', "application/json; charset=utf-8")
                return True
            row = _sessions.get(sid)
            if not row:
                self._send(410, b'{"error":"official session expired"}', "application/json; charset=utf-8")
                return True
            opener, _ = row
            mode = payload.get("mode")
            # q 為類 Base64，常含 +、/；未經過 percent-encoding 時 + 會被解成空白，官方回傳 400。
            q_enc = quote(qq, safe="")
            if mode == "saleRemark":
                service_url = f"{OFFICIAL_BASE}/SERVICE/QueryPrice/SaleData/{qpath}?q={q_enc}"
            else:
                service_url = f"{OFFICIAL_BASE}/SERVICE/QueryPrice/{qpath}?q={q_enc}"
            status, text = _official_fetch(opener, service_url)
            http_status = status if isinstance(status, int) and 200 <= status <= 599 else 502
            ctype = (
                "application/json; charset=utf-8"
                if 200 <= http_status < 300
                else "text/plain; charset=utf-8"
            )
            self._send(http_status, text.encode("utf-8"), ctype)
            return True

        if normalized == "api/lvr/detail":
            try:
                payload = json.loads(body_text) if body_text else {}
            except json.JSONDecodeError:
                self._send(400, b'{"error":"invalid json"}', "application/json; charset=utf-8")
                return True
            sid = str(payload.get("sid") or "")
            qpath = str(payload.get("path") or "")
            qq = str(payload.get("q") or "")
            if not sid or not qpath or not qq:
                self._send(400, b'{"error":"missing sid, path, or q"}', "application/json; charset=utf-8")
                return True
            row = _sessions.get(sid)
            if not row:
                self._send(410, b'{"error":"official session expired"}', "application/json; charset=utf-8")
                return True
            opener, _ = row
            q_enc = quote(qq, safe="")
            service_url = f"{OFFICIAL_BASE}/SERVICE/QueryPrice/detail/{qpath}/{q_enc}"
            status, text = _official_fetch(opener, service_url)
            http_status = status if isinstance(status, int) and 200 <= status <= 599 else 502
            ctype = (
                "application/json; charset=utf-8"
                if 200 <= http_status < 300
                else "text/plain; charset=utf-8"
            )
            self._send(http_status, text.encode("utf-8"), ctype)
            return True

        return False

    def do_OPTIONS(self) -> None:
        self._send(204, b"", "text/plain")

    def do_GET(self) -> None:
        self._dispatch()

    def do_POST(self) -> None:
        self._dispatch()

    def _dispatch(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if not path or path == "/":
            path = "/index.html"
        qs = parse_qs(parsed.query or "")

        if path.startswith((
            "/api/lvr/",
            "/api/support/",
            "/api/minimax/",
            "/api/real-price/",
            "/api/geocode/",
            "/api/cathay/",
            "/api/tgos/",
        )):
            raw_body = self._read_body() if self.command == "POST" else b""
            body = raw_body.decode("utf-8", errors="replace") if raw_body else ""
            if self._handle_api(path.lstrip("/"), qs, body, raw_body):
                return
            self._send(404, b'{"error":"unknown api"}', "application/json; charset=utf-8")
            return

        safe = (ROOT / path.lstrip("/")).resolve()
        if not safe.is_relative_to(ROOT) or not safe.is_file():
            self._send(404, b"Not Found", "text/plain; charset=utf-8")
            return
        data = safe.read_bytes()
        cache_control = self._static_cache_control(safe)
        # TFSE preloads this exact landing URL before its valuation buttons are
        # clicked. A short private cache eliminates the final document round trip
        # without allowing the operational page to go stale for long.
        if safe.name == "index.html" and (qs.get("from") or [""])[0] in {"tfse", "bank-club"}:
            cache_control = "private, max-age=60, must-revalidate"
        self._send(200, data, _content_type(safe), cache_control=cache_control)


def main() -> None:
    ap = argparse.ArgumentParser(description="Found 靜態站 + LVR 官方 API 代理")
    ap.add_argument("--port", type=int, default=5500, help="監聽埠（預設 5500）")
    ap.add_argument("--bind", default="127.0.0.1", help="綁定位址")
    args = ap.parse_args()
    srv = ThreadingHTTPServer((args.bind, args.port), LvrDevHandler)
    print("Serving http://%s:%s/  (root: %s)" % (args.bind, args.port, ROOT))
    print("同時代理 /api/lvr/* → %s" % OFFICIAL_BASE)
    print("同時提供 /api/real-price/* 與 /api/geocode/address 本機定位實價查詢")
    _start_telegram_polling_worker()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()


if __name__ == "__main__":
    main()
