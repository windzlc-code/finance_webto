from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
import json
import re


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "site-config.json"
ADMIN_RECORD_SEEDS_PATH = ROOT / "assets" / "data" / "admin-record-seeds.json"
ALLOWED_DRAFT_KEYS = {"base_url", "analytics", "search_console", "backend", "security", "line"}
CONFIG_ITEM_OWNER_MAP = {
    "base_url": "data_manager",
    "ga4_measurement_id": "data_manager",
    "meta_pixel_id": "data_manager",
    "server_event_endpoint": "backend_engineer",
    "sentry_dsn": "ops_engineer",
    "search_console": "seo_owner",
    "backend_api": "backend_engineer",
    "turnstile": "backend_engineer",
    "line_oa": "ops_marketing",
}
ENV_ITEM_OWNER_MAP = {
    "TFSE_BASE_URL": "data_manager",
    "TFSE_GA4_MEASUREMENT_ID": "data_manager",
    "TFSE_META_PIXEL_ID": "data_manager",
    "TFSE_SERVER_EVENT_ENDPOINT": "backend_engineer",
    "TFSE_SENTRY_DSN": "ops_engineer",
    "TFSE_GOOGLE_SITE_VERIFICATION": "seo_owner",
    "TFSE_BACKEND_MODE": "backend_engineer",
    "TFSE_BACKEND_API_BASE_URL": "backend_engineer",
    "TFSE_TURNSTILE_SITE_KEY": "backend_engineer",
    "TFSE_TURNSTILE_SECRET_KEY": "backend_engineer",
    "TFSE_LINE_OA_URL": "ops_marketing",
    "TFSE_DATABASE_URL": "backend_engineer",
    "TFSE_ADMIN_SESSION_SECRET": "backend_engineer",
    "TFSE_BACKUP_BUCKET": "infra_owner",
}


def load_site_config():
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def load_admin_record_seeds():
    try:
        return json.loads(ADMIN_RECORD_SEEDS_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def load_admin_record_seed_records(key):
    payload = load_admin_record_seeds()
    records = payload.get(key, [])
    return records if isinstance(records, list) else []


def nested(data, path, default=""):
    value = data
    for part in path.split("."):
        if not isinstance(value, dict) or part not in value:
            return default
        value = value[part]
    return value


def is_https_url(value):
    if not isinstance(value, str):
        return False
    parsed = urlparse(value.strip())
    return parsed.scheme == "https" and bool(parsed.netloc)


def is_relative_url(value):
    if not isinstance(value, str):
        return False
    text = value.strip()
    if not text:
        return False
    return not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", text)


def is_official_https_url(value):
    if not is_https_url(value):
        return False
    host = urlparse(str(value).strip()).netloc.lower()
    return bool(host) and all(marker not in host for marker in ("127.0.0.1", "localhost", "github.io"))


def preferred_hint(current, validator, fallback):
    return current if validator(current) else fallback


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def config_item_owner(key):
    return CONFIG_ITEM_OWNER_MAP.get(key, "data_manager")


def env_item_owner(name):
    return ENV_ITEM_OWNER_MAP.get(name, "data_manager")


def config_readiness_items(site_config):
    analytics = site_config.get("analytics", {})
    search_console = site_config.get("search_console", {})
    backend = site_config.get("backend", {})
    security = site_config.get("security", {})
    turnstile = security.get("turnstile", {})
    line = site_config.get("line", {})
    items = [
        {"group": "網址", "key": "base_url", "label": "正式網站 Base URL", "done": is_https_url(site_config.get("base_url", "")) and "github.io" not in str(site_config.get("base_url", "")), "detail": site_config.get("base_url", "") or "正式網站網址待填"},
        {"group": "追蹤", "key": "ga4_measurement_id", "label": "GA4 Measurement ID", "done": bool(re.match(r"^G-[A-Z0-9]{6,}$", analytics.get("ga4_measurement_id", ""))), "detail": analytics.get("ga4_measurement_id", "") or "GA4 Measurement ID 待填"},
        {"group": "追蹤", "key": "meta_pixel_id", "label": "Meta Pixel ID", "done": bool(re.match(r"^[0-9]{8,}$", analytics.get("meta_pixel_id", ""))), "detail": analytics.get("meta_pixel_id", "") or "Meta Pixel ID 待填"},
        {"group": "追蹤", "key": "server_event_endpoint", "label": "Server Event Endpoint", "done": is_https_url(analytics.get("server_event_endpoint", "")), "detail": analytics.get("server_event_endpoint", "") or "Server Event endpoint 待填"},
        {"group": "監控", "key": "sentry_dsn", "label": "Sentry DSN", "done": is_https_url(analytics.get("sentry_dsn", "")), "detail": analytics.get("sentry_dsn", "") or "Sentry DSN 待填"},
        {"group": "SEO", "key": "search_console", "label": "Search Console 驗證碼", "done": bool(search_console.get("google_site_verification", "")), "detail": search_console.get("google_site_verification", "") or "Search Console 驗證碼待填"},
        {"group": "後端", "key": "backend_api", "label": "backend.api_base_url / mode", "done": backend.get("mode") == "api" and is_https_url(backend.get("api_base_url", "")), "detail": (backend.get("mode") or "localStorage") + " / " + (backend.get("api_base_url", "") or "正式 API URL 待填")},
        {"group": "安全", "key": "turnstile", "label": "Cloudflare Turnstile", "done": (not turnstile.get("enabled")) or bool(turnstile.get("site_key", "")), "detail": ("enabled" if turnstile.get("enabled") else "disabled") + " / " + (turnstile.get("site_key", "") or "site_key 待填")},
        {"group": "承接", "key": "line_oa", "label": "Line OA URL", "done": bool(line.get("oa_url", "")) and line.get("oa_url") != "free-check.html#line-cta" and (is_https_url(line.get("oa_url", "")) or is_relative_url(line.get("oa_url", ""))), "detail": line.get("oa_url", "") or "Line OA 加友網址待填"},
    ]
    for item in items:
        item["owner"] = config_item_owner(item["key"])
    return items


def filtered_config_readiness_items(site_config, owner=None, pending_only=False):
    items = config_readiness_items(site_config)
    return [
        item for item in items
        if (not owner or item["owner"] == owner)
        and (not pending_only or not item["done"])
    ]


def config_draft_template(site_config):
    return {
        "base_url": site_config.get("base_url", ""),
        "analytics": site_config.get("analytics", {}),
        "search_console": site_config.get("search_console", {}),
        "backend": site_config.get("backend", {}),
        "security": site_config.get("security", {}),
        "line": site_config.get("line", {}),
    }


def suggested_patch_template(site_config):
    analytics = site_config.get("analytics", {})
    search_console = site_config.get("search_console", {})
    backend = site_config.get("backend", {})
    line = site_config.get("line", {})
    security = site_config.get("security", {})
    turnstile = security.get("turnstile", {})
    payload = {
        "base_url": preferred_hint(site_config.get("base_url", ""), is_official_https_url, "https://www.example.com"),
        "analytics": {
            "ga4_measurement_id": preferred_hint(analytics.get("ga4_measurement_id", ""), lambda value: bool(re.match(r"^G-[A-Z0-9]{6,}$", str(value))), "G-XXXXXXXXXX"),
            "meta_pixel_id": preferred_hint(analytics.get("meta_pixel_id", ""), lambda value: bool(re.match(r"^[0-9]{8,}$", str(value))), "000000000000000"),
            "server_event_endpoint": preferred_hint(analytics.get("server_event_endpoint", ""), is_https_url, "https://api.example.com/events"),
            "sentry_dsn": preferred_hint(analytics.get("sentry_dsn", ""), is_https_url, "https://public@sentry.example/1"),
        },
        "search_console": {
            "google_site_verification": preferred_hint(search_console.get("google_site_verification", ""), lambda value: bool(value), "google-site-verification-token"),
        },
        "backend": {
            "mode": preferred_hint(backend.get("mode", ""), lambda value: value == "api", "api"),
            "api_base_url": preferred_hint(backend.get("api_base_url", ""), is_https_url, "https://api.example.com"),
        },
        "line": {
            "oa_url": preferred_hint(line.get("oa_url", ""), lambda value: bool(value) and value != "free-check.html#line-cta" and (is_https_url(value) or is_relative_url(value)), "https://lin.ee/xxxx"),
        },
    }
    if turnstile.get("enabled"):
        payload["security"] = {
            "turnstile": {
                "enabled": True,
                "site_key": turnstile.get("site_key", "") or "0x4AAAA...",
            }
        }
    return payload


def parse_draft_text(text):
    raw = (text or "").strip()
    if not raw:
        return {"raw": "", "data": {}, "errors": ["尚未提供 site-config 更新草稿。"]}
    try:
        return {"raw": raw, "data": json.loads(raw), "errors": []}
    except Exception as error:
        return {"raw": raw, "data": {}, "errors": ["JSON 格式錯誤：" + str(error)]}


def validate_config_draft(data):
    errors = []
    warnings = []
    for key in (data or {}).keys():
        if key not in ALLOWED_DRAFT_KEYS:
            warnings.append("未識別欄位：" + key + "，正式合併前需人工確認。")
    if data.get("base_url") and not is_https_url(data.get("base_url")):
        errors.append("base_url 需使用 HTTPS 正式網址。")
    analytics = data.get("analytics") or {}
    if analytics.get("ga4_measurement_id") and not re.match(r"^G-[A-Z0-9]{6,}$", analytics.get("ga4_measurement_id", "")):
        errors.append("GA4 Measurement ID 格式不正確。")
    if analytics.get("meta_pixel_id") and not re.match(r"^[0-9]{8,}$", str(analytics.get("meta_pixel_id", ""))):
        errors.append("Meta Pixel ID 格式不正確。")
    if analytics.get("server_event_endpoint") and not is_https_url(analytics.get("server_event_endpoint")):
        errors.append("Server Event endpoint 需使用 HTTPS。")
    if analytics.get("sentry_dsn") and not is_https_url(analytics.get("sentry_dsn")):
        errors.append("Sentry DSN 需使用 HTTPS。")
    backend = data.get("backend") or {}
    if backend.get("mode") and backend.get("mode") not in {"localStorage", "api"}:
        errors.append("backend.mode 僅允許 localStorage 或 api。")
    if backend.get("mode") == "api" and not is_https_url(backend.get("api_base_url", "")):
        errors.append("backend.api_base_url 需使用 HTTPS。")
    security = data.get("security") or {}
    turnstile = security.get("turnstile") or {}
    if turnstile.get("enabled") and not turnstile.get("site_key"):
        errors.append("Turnstile 啟用時需填入 site_key。")
    line = data.get("line") or {}
    if line.get("oa_url") and not (is_https_url(line.get("oa_url")) or is_relative_url(line.get("oa_url"))):
        errors.append("line.oa_url 需為 HTTPS 或站內相對路徑。")
    search_console = data.get("search_console") or {}
    if search_console.get("google_site_verification") and re.search(r"\s", search_console.get("google_site_verification", "")):
        warnings.append("Search Console 驗證碼含空白，正式填入前請確認是否完整。")
    return {"errors": errors, "warnings": warnings}


def current_config_summary(site_config):
    analytics = site_config.get("analytics", {})
    search_console = site_config.get("search_console", {})
    backend = site_config.get("backend", {})
    line = site_config.get("line", {})
    return {
        "base_url": site_config.get("base_url", ""),
        "ga4_configured": bool(analytics.get("ga4_measurement_id")),
        "meta_pixel_configured": bool(analytics.get("meta_pixel_id")),
        "server_event_configured": bool(analytics.get("server_event_endpoint")),
        "sentry_configured": bool(analytics.get("sentry_dsn")),
        "search_console_configured": bool(search_console.get("google_site_verification")),
        "backend_mode": backend.get("mode", "localStorage"),
        "line_oa_configured": bool(line.get("oa_url")) and line.get("oa_url") != "free-check.html#line-cta",
    }


def env_template_items(site_config):
    analytics = site_config.get("analytics", {})
    search_console = site_config.get("search_console", {})
    backend = site_config.get("backend", {})
    security = site_config.get("security", {})
    turnstile = security.get("turnstile", {})
    line = site_config.get("line", {})
    items = [
        {"group": "static_site", "name": "TFSE_BASE_URL", "source_path": "site-config.json.base_url", "configured": is_official_https_url(site_config.get("base_url", "")), "value_hint": preferred_hint(site_config.get("base_url", ""), is_official_https_url, "https://www.example.com"), "secret": False, "deploy_target": "site-config.json / static host"},
        {"group": "analytics", "name": "TFSE_GA4_MEASUREMENT_ID", "source_path": "site-config.json.analytics.ga4_measurement_id", "configured": bool(re.match(r"^G-[A-Z0-9]{6,}$", analytics.get("ga4_measurement_id", ""))), "value_hint": preferred_hint(analytics.get("ga4_measurement_id", ""), lambda value: bool(re.match(r"^G-[A-Z0-9]{6,}$", str(value))), "G-XXXXXXXXXX"), "secret": False, "deploy_target": "site-config.json / static host"},
        {"group": "analytics", "name": "TFSE_META_PIXEL_ID", "source_path": "site-config.json.analytics.meta_pixel_id", "configured": bool(re.match(r"^[0-9]{8,}$", str(analytics.get("meta_pixel_id", "")))), "value_hint": preferred_hint(analytics.get("meta_pixel_id", ""), lambda value: bool(re.match(r"^[0-9]{8,}$", str(value))), "000000000000000"), "secret": False, "deploy_target": "site-config.json / static host"},
        {"group": "analytics", "name": "TFSE_SERVER_EVENT_ENDPOINT", "source_path": "site-config.json.analytics.server_event_endpoint", "configured": is_https_url(analytics.get("server_event_endpoint", "")), "value_hint": preferred_hint(analytics.get("server_event_endpoint", ""), is_https_url, "https://api.example.com/events"), "secret": False, "deploy_target": "site-config.json / API server"},
        {"group": "monitoring", "name": "TFSE_SENTRY_DSN", "source_path": "site-config.json.analytics.sentry_dsn", "configured": is_https_url(analytics.get("sentry_dsn", "")), "value_hint": preferred_hint(analytics.get("sentry_dsn", ""), is_https_url, "https://public@sentry.example/1"), "secret": False, "deploy_target": "site-config.json / static host"},
        {"group": "seo", "name": "TFSE_GOOGLE_SITE_VERIFICATION", "source_path": "site-config.json.search_console.google_site_verification", "configured": bool(search_console.get("google_site_verification", "")), "value_hint": preferred_hint(search_console.get("google_site_verification", ""), lambda value: bool(value), "google-site-verification-token"), "secret": False, "deploy_target": "site-config.json / generated HTML head"},
        {"group": "backend", "name": "TFSE_BACKEND_MODE", "source_path": "site-config.json.backend.mode", "configured": backend.get("mode") == "api", "value_hint": preferred_hint(backend.get("mode", ""), lambda value: value == "api", "api"), "secret": False, "deploy_target": "site-config.json / API server"},
        {"group": "backend", "name": "TFSE_BACKEND_API_BASE_URL", "source_path": "site-config.json.backend.api_base_url", "configured": is_https_url(backend.get("api_base_url", "")), "value_hint": preferred_hint(backend.get("api_base_url", ""), is_https_url, "https://api.example.com"), "secret": False, "deploy_target": "site-config.json / static host"},
        {"group": "security", "name": "TFSE_TURNSTILE_SITE_KEY", "source_path": "site-config.json.security.turnstile.site_key", "configured": bool(turnstile.get("site_key", "")), "value_hint": preferred_hint(turnstile.get("site_key", ""), lambda value: bool(value), "0x4AAAA..."), "secret": False, "deploy_target": "site-config.json / static host"},
        {"group": "security", "name": "TFSE_TURNSTILE_SECRET_KEY", "source_path": "server env only", "configured": False, "value_hint": "store in secret manager only", "secret": True, "deploy_target": "API server / CI secret"},
        {"group": "line", "name": "TFSE_LINE_OA_URL", "source_path": "site-config.json.line.oa_url", "configured": bool(line.get("oa_url", "")) and line.get("oa_url") != "free-check.html#line-cta", "value_hint": preferred_hint(line.get("oa_url", ""), lambda value: bool(value) and value != "free-check.html#line-cta" and (is_https_url(value) or is_relative_url(value)), "https://lin.ee/xxxx"), "secret": False, "deploy_target": "site-config.json / static host"},
        {"group": "backend", "name": "TFSE_DATABASE_URL", "source_path": "server env only", "configured": False, "value_hint": "store in secret manager only", "secret": True, "deploy_target": "API server / CI secret"},
        {"group": "backend", "name": "TFSE_ADMIN_SESSION_SECRET", "source_path": "server env only", "configured": False, "value_hint": "store in secret manager only", "secret": True, "deploy_target": "API server / CI secret"},
        {"group": "backup", "name": "TFSE_BACKUP_BUCKET", "source_path": "server env only", "configured": False, "value_hint": "backup bucket or storage path", "secret": False, "deploy_target": "API server / backup job"},
    ]
    for item in items:
        item["owner"] = env_item_owner(item["name"])
    return items


def filtered_env_template_items(site_config, owner=None, pending_only=False):
    items = env_template_items(site_config)
    return [
        item for item in items
        if (not owner or item["owner"] == owner)
        and (not pending_only or not item["configured"])
    ]
