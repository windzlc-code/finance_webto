#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import urlparse
import json
import re
import sys


ROOT = Path.cwd()
CONFIG_PATH = ROOT / "site-config.json"


OPTIONAL_PATTERNS = {
    "analytics.ga4_measurement_id": re.compile(r"^G-[A-Z0-9]{6,}$"),
    "analytics.meta_pixel_id": re.compile(r"^\d{8,}$"),
    "search_console.google_site_verification": re.compile(r"^[A-Za-z0-9_-]{10,}$"),
    "security.turnstile.site_key": re.compile(r"^[A-Za-z0-9_-]{10,}$"),
}


def nested(config, path, default=""):
    value = config
    for part in path.split("."):
        if not isinstance(value, dict):
            return default
        value = value.get(part, default)
    return value


def valid_url(value, *, allow_relative=False, require_https=True):
    text = str(value or "").strip()
    if allow_relative and text and not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", text):
        return True
    parsed = urlparse(text)
    if not parsed.scheme or not parsed.netloc:
        return False
    if require_https and parsed.scheme != "https":
        return False
    return True


def main():
    failures = []
    warnings = []
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

    base_url = str(config.get("base_url", "")).strip().rstrip("/")
    if not valid_url(base_url, require_https=True):
        failures.append("site-config.json: base_url must be an absolute https URL")
    if base_url.endswith("/"):
        failures.append("site-config.json: base_url must not end with a slash")

    og_image = str(config.get("og_image", "")).strip()
    if not og_image:
        failures.append("site-config.json: og_image is required")
    elif valid_url(og_image, require_https=True):
        pass
    elif not (ROOT / og_image).exists():
        failures.append(f"site-config.json: og_image local asset does not exist: {og_image}")

    backend_mode = nested(config, "backend.mode")
    if backend_mode not in ("localStorage", "api"):
        failures.append("site-config.json: backend.mode must be localStorage or api")

    api_base_url = str(nested(config, "backend.api_base_url")).strip()
    if api_base_url:
        if not valid_url(api_base_url, require_https=True):
            failures.append("site-config.json: backend.api_base_url must be an absolute https URL when set")
        if api_base_url.endswith("/"):
            failures.append("site-config.json: backend.api_base_url must not end with a slash")
    elif backend_mode == "api":
        failures.append("site-config.json: backend.mode api requires backend.api_base_url")

    timeout_ms = nested(config, "backend.timeout_ms", 0)
    if not isinstance(timeout_ms, int) or timeout_ms < 1000 or timeout_ms > 30000:
        failures.append("site-config.json: backend.timeout_ms must be an integer between 1000 and 30000")

    sample_rate = nested(config, "analytics.sample_rate", 1)
    if not isinstance(sample_rate, (int, float)) or sample_rate < 0 or sample_rate > 1:
        failures.append("site-config.json: analytics.sample_rate must be between 0 and 1")

    server_event_endpoint = str(nested(config, "analytics.server_event_endpoint")).strip()
    if server_event_endpoint and not valid_url(server_event_endpoint, require_https=True):
        failures.append("site-config.json: analytics.server_event_endpoint must be an absolute https URL when set")

    sentry_dsn = str(nested(config, "analytics.sentry_dsn")).strip()
    if sentry_dsn and not valid_url(sentry_dsn, require_https=True):
        failures.append("site-config.json: analytics.sentry_dsn must be an absolute https URL when set")

    line_url = str(nested(config, "line.oa_url")).strip()
    if not line_url:
        failures.append("site-config.json: line.oa_url is required")
    elif not valid_url(line_url, allow_relative=True, require_https=True):
        failures.append("site-config.json: line.oa_url must be a relative URL or an absolute https URL")
    elif line_url in ("contact-us.html#line-cta", "contact.html#line-cta"):
        failures.append("site-config.json: line.oa_url should not point to contact.html#line-cta")
    elif line_url == "free-check.html#line-cta":
        warnings.append("site-config.json: line.oa_url still points to the local MVP Line explanation anchor")

    turnstile_enabled = bool(nested(config, "security.turnstile.enabled", False))
    turnstile_site_key = str(nested(config, "security.turnstile.site_key")).strip()
    if turnstile_enabled and not turnstile_site_key:
        failures.append("site-config.json: enabled Turnstile requires security.turnstile.site_key")

    for path, pattern in OPTIONAL_PATTERNS.items():
        value = str(nested(config, path)).strip()
        if value and not pattern.match(value):
            failures.append(f"site-config.json: {path} has an invalid format")

    canonical_pages = config.get("canonical_pages", [])
    if not isinstance(canonical_pages, list) or "" not in canonical_pages or "index.html" not in canonical_pages:
        failures.append("site-config.json: canonical_pages must include root and index.html")
    for page in canonical_pages:
        target = "index.html" if page == "" else page
        if not (ROOT / target).exists():
            failures.append(f"site-config.json: canonical page does not exist: {target}")

    if failures:
        for failure in failures:
            print(failure, file=sys.stderr)
        return 1

    for warning in warnings:
        print("warning: " + warning)
    print("site-config validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
