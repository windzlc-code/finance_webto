#!/usr/bin/env python3
from pathlib import Path
import json
import sys


ROOT = Path(__file__).resolve().parents[1]

CONFIG_PATHS = (
    "base_url",
    "site_name",
    "og_image",
    "canonical_pages",
    "analytics.ga4_measurement_id",
    "analytics.meta_pixel_id",
    "analytics.server_event_endpoint",
    "analytics.sentry_dsn",
    "analytics.sample_rate",
    "search_console.google_site_verification",
    "line.oa_url",
    "line.label",
    "backend.api_base_url",
    "backend.mode",
    "backend.timeout_ms",
    "security.turnstile.enabled",
    "security.turnstile.site_key",
)

VALIDATOR_MARKERS = (
    "backend.api_base_url",
    "analytics.ga4_measurement_id",
    "analytics.meta_pixel_id",
    "analytics.server_event_endpoint",
    "analytics.sentry_dsn",
    "search_console.google_site_verification",
    "line.oa_url",
    "security.turnstile.site_key",
    "canonical_pages",
    "site-config validation passed",
)

ADMIN_MARKERS = (
    "configReadinessItems",
    "configReadinessPayload",
    "tfse_production_config_readiness",
    "configDraftPayload",
    "tfse_site_config_update_package",
    "site-config.json",
    "GA4 Measurement ID",
    "Meta Pixel ID",
    "Server Event Endpoint",
    "Sentry DSN",
    "Search Console 驗證碼",
    "Line OA URL",
    "backend.api_base_url",
    "Cloudflare Turnstile",
)

DOC_MARKERS = (
    "site-config.json",
    "GA4",
    "Meta Pixel",
    "Server Event",
    "Sentry",
    "Search Console",
    "Line OA",
    "backend.api_base_url",
    "Turnstile",
    "tfse_site_config_update_package",
    "tools/formal_config_input_packet.py",
)


def nested(data, path):
    value = data
    for part in path.split("."):
        if not isinstance(value, dict) or part not in value:
            return None
        value = value[part]
    return value


def read_text(path):
    return (ROOT / path).read_text(encoding="utf-8", errors="ignore")


def verify_config_shape():
    failures = []
    config = json.loads((ROOT / "site-config.json").read_text(encoding="utf-8"))
    for path in CONFIG_PATHS:
        if nested(config, path) is None:
            failures.append(f"site-config.json: missing {path}")
    if not isinstance(nested(config, "canonical_pages"), list):
        failures.append("site-config.json: canonical_pages must be a list")
    if nested(config, "backend.mode") not in ("localStorage", "api"):
        failures.append("site-config.json: backend.mode must be localStorage or api")
    if not isinstance(nested(config, "security.turnstile.enabled"), bool):
        failures.append("site-config.json: security.turnstile.enabled must be boolean")
    return failures


def verify_validator_contract():
    text = read_text("tools/validate_site_config.py")
    return [f"validate_site_config.py: missing marker {marker}" for marker in VALIDATOR_MARKERS if marker not in text]


def verify_admin_export():
    admin_html = read_text("admin.html")
    admin_js = read_text("assets/js/tfse-admin.js")
    failures = []
    for marker in ("data-admin-config-readiness", "data-admin-config-readiness-export", "data-admin-config-draft-export", "正式配置交接包", "匯出配置交接包", "匯出 site-config 更新包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing config readiness marker {marker}")
    for marker in ADMIN_MARKERS:
        if marker not in admin_js:
            failures.append(f"tfse-admin.js: missing config readiness marker {marker}")
    return failures


def verify_api_contract():
    contract = json.loads((ROOT / "api-contract.json").read_text(encoding="utf-8"))
    endpoint = None
    for item in contract.get("endpoints", []):
        if item.get("method") == "GET" and item.get("path") == "/api/admin/config-readiness":
            endpoint = item
            break
    if not endpoint:
        return ["api-contract.json: missing GET /api/admin/config-readiness"]
    response = set(endpoint.get("response", []))
    required = {"items", "ready_count", "pending_count", "generated_at"}
    missing = sorted(required - response)
    failures = [f"api-contract.json: config-readiness response missing {item}" for item in missing]
    update_endpoint = None
    for item in contract.get("endpoints", []):
        if item.get("method") == "GET" and item.get("path") == "/api/admin/site-config-update-package":
            update_endpoint = item
            break
    if not update_endpoint:
        failures.append("api-contract.json: missing GET /api/admin/site-config-update-package")
    else:
        update_response = set(update_endpoint.get("response", []))
        update_required = {"format", "target_file", "status", "validation", "patch", "generated_at"}
        for item in sorted(update_required - update_response):
            failures.append(f"api-contract.json: site-config-update-package response missing {item}")
    return failures


def verify_docs():
    failures = []
    data_model = read_text("DATA_MODEL.md")
    if "production_config_readiness" not in data_model:
        failures.append("DATA_MODEL.md: missing production_config_readiness model")
    if "site_config_update_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing site_config_update_packages model")
    for marker in ("ready_count", "pending_count", "items", "generated_at"):
        if marker not in data_model:
            failures.append(f"DATA_MODEL.md: missing production_config_readiness field marker {marker}")

    deployment = read_text("DEPLOYMENT.md")
    checklist = read_text("LAUNCH_CHECKLIST.md")
    for marker in DOC_MARKERS:
        if marker not in deployment:
            failures.append(f"DEPLOYMENT.md: missing production config marker {marker}")
        if marker not in checklist:
            failures.append(f"LAUNCH_CHECKLIST.md: missing production config marker {marker}")
    for marker in ("tools/production_config_audit.py", "正式配置交接包"):
        if marker not in deployment:
            failures.append(f"DEPLOYMENT.md: missing audit command marker {marker}")
        if marker not in checklist:
            failures.append(f"LAUNCH_CHECKLIST.md: missing audit command marker {marker}")
    for marker in ("tools/formal_config_input_packet.py", "pending_external_input"):
        if marker not in deployment:
            failures.append(f"DEPLOYMENT.md: missing config packet marker {marker}")
        if marker not in checklist:
            failures.append(f"LAUNCH_CHECKLIST.md: missing config packet marker {marker}")
    return failures


def verify_ci_and_total_audit():
    failures = []
    workflow = read_text(".github/workflows/tfse-acceptance.yml")
    static_verify = read_text("tools/verify_static_site.py")
    for path, text in (
        (".github/workflows/tfse-acceptance.yml", workflow),
        ("tools/verify_static_site.py", static_verify),
    ):
        if "tools/production_config_audit.py" not in text:
            failures.append(f"{path}: missing production config audit marker")
        if "tools/formal_config_input_packet.py" not in text:
            failures.append(f"{path}: missing formal config input packet marker")
    return failures


def main():
    failures = []
    failures.extend(verify_config_shape())
    failures.extend(verify_validator_contract())
    failures.extend(verify_admin_export())
    failures.extend(verify_api_contract())
    failures.extend(verify_docs())
    failures.extend(verify_ci_and_total_audit())

    if failures:
        for failure in failures:
            print(failure)
        return 1
    print("production config audit passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
