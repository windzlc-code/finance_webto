from pathlib import Path
import json
import sys


ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "api-contract.json"

PUBLIC_ENDPOINTS = {
    ("GET", "/api/products"),
    ("GET", "/api/products/:slug"),
    ("GET", "/api/institutions"),
    ("GET", "/api/articles"),
    ("GET", "/api/articles/:slug"),
    ("POST", "/api/leads"),
    ("POST", "/api/events"),
    ("POST", "/api/public-feedback"),
    ("GET", "/api/search"),
}

ADMIN_ENDPOINTS = {
    ("POST", "/api/admin/auth/login"),
    ("GET", "/api/admin/auth/session"),
    ("GET", "/api/admin/security-matrix"),
    ("GET", "/api/admin/security-headers-deployment-check"),
    ("GET", "/api/admin/auth-cutover-check"),
    ("POST", "/api/admin/auth/logout"),
    ("GET", "/api/admin/leads"),
    ("GET", "/api/admin/leads/:id"),
    ("PATCH", "/api/admin/leads/:id/status"),
    ("GET", "/api/admin/leads/contact-logs"),
    ("GET", "/api/admin/leads/follow-ups"),
    ("GET", "/api/admin/leads/dedupe-queue"),
    ("GET", "/api/admin/crm-api-persistence-package"),
    ("GET", "/api/admin/privacy-requests"),
    ("PATCH", "/api/admin/privacy-requests/:lead_id"),
    ("GET", "/api/admin/data-retention-purge-plan"),
    ("GET", "/api/admin/privacy-fulfillment-verification"),
    ("GET", "/api/admin/line-segments"),
    ("GET", "/api/admin/line-oa-setup"),
    ("GET", "/api/admin/line-oa-handoff-check"),
    ("GET", "/api/admin/line-optout-complaints"),
    ("GET", "/api/admin/line-optout-api-verification"),
    ("POST", "/api/admin/products"),
    ("PATCH", "/api/admin/products/:id"),
    ("POST", "/api/admin/articles"),
    ("PATCH", "/api/admin/articles/:id"),
    ("POST", "/api/admin/articles/:id/review"),
    ("POST", "/api/admin/compliance/review"),
    ("GET", "/api/admin/audit-logs"),
    ("GET", "/api/admin/reports/retrospective"),
    ("GET", "/api/admin/reports/tracking-consent-audit"),
    ("GET", "/api/admin/reports/server-event-replay"),
    ("GET", "/api/admin/reports/monitoring-receipt-checklist"),
    ("GET", "/api/admin/reports/sentry-error-verification"),
    ("GET", "/api/admin/reports/analytics-debug-verification"),
    ("GET", "/api/admin/ad-campaigns"),
    ("GET", "/api/admin/conversion-optimization-backlog"),
    ("GET", "/api/admin/launch-health"),
    ("GET", "/api/admin/release-readiness"),
    ("GET", "/api/admin/operations-tasks"),
    ("GET", "/api/admin/incident-response-package"),
    ("GET", "/api/admin/seo-submission-package"),
    ("GET", "/api/admin/search-console-verification-package"),
    ("GET", "/api/admin/seo-indexing-followup-queue"),
    ("GET", "/api/admin/config-readiness"),
    ("GET", "/api/admin/site-config-update-package"),
    ("GET", "/api/admin/site-config-approval-package"),
    ("GET", "/api/admin/production-env-template"),
    ("GET", "/api/admin/domain-cutover-package"),
    ("GET", "/api/admin/host-fallback-deployment-check"),
    ("GET", "/api/admin/backend-acceptance-matrix"),
    ("GET", "/api/admin/acceptance-checklist"),
    ("GET", "/api/admin/external-verification-evidence"),
    ("GET", "/api/admin/legal-compliance-review"),
    ("GET", "/api/admin/legal-external-review-evidence"),
    ("GET", "/api/admin/compliance-api-persistence-package"),
    ("GET", "/api/admin/form-risk-control"),
    ("GET", "/api/admin/turnstile-backend-verification"),
    ("GET", "/api/admin/source-review-queue"),
    ("GET", "/api/admin/source-verification-evidence"),
    ("GET", "/api/admin/institution-import-verification"),
    ("GET", "/api/admin/public-feedback-intake"),
    ("GET", "/api/admin/public-feedback-api-verification"),
    ("GET", "/api/admin/migration-package"),
    ("GET", "/api/admin/content-api-cutover-package"),
    ("GET", "/api/admin/import-validation-package"),
    ("GET", "/api/admin/backup-restore-drill-plan"),
    ("GET", "/api/admin/backup-receipt-verification"),
}

LEAD_REQUIRED_REQUEST = {
    "display_name",
    "phone",
    "line_id",
    "region",
    "needs",
    "occupation_type",
    "income_type",
    "message",
    "consent_privacy",
    "consent_line",
    "consent_version",
    "source_url",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "device_id",
    "website",
    "cf_turnstile_response",
}

LEAD_REQUIRED_VALIDATION = {
    "no national id",
    "no bank account",
    "no card number",
    "privacy consent required",
    "line consent optional and separate",
    "website honeypot must be empty",
    "turnstile token required when enabled",
    "rate limit by IP + device_id",
    "deduplicate same phone + needs within 24 hours",
}

REPORT_ENDPOINTS = {
    "/api/admin/security-matrix",
    "/api/admin/security-headers-deployment-check",
    "/api/admin/reports/retrospective",
    "/api/admin/reports/tracking-consent-audit",
    "/api/admin/reports/utm-attribution",
    "/api/admin/reports/server-event-replay",
    "/api/admin/reports/monitoring-receipt-checklist",
    "/api/admin/reports/sentry-error-verification",
    "/api/admin/leads/dedupe-queue",
    "/api/admin/crm-api-persistence-package",
    "/api/admin/ad-campaigns",
    "/api/admin/conversion-optimization-backlog",
    "/api/admin/launch-health",
    "/api/admin/release-readiness",
    "/api/admin/operations-tasks",
    "/api/admin/incident-response-package",
    "/api/admin/seo-submission-package",
    "/api/admin/seo-indexing-followup-queue",
    "/api/admin/config-readiness",
    "/api/admin/site-config-update-package",
    "/api/admin/site-config-approval-package",
    "/api/admin/production-env-template",
    "/api/admin/domain-cutover-package",
    "/api/admin/backend-acceptance-matrix",
    "/api/admin/acceptance-checklist",
    "/api/admin/external-verification-evidence",
    "/api/admin/browser-acceptance-report",
    "/api/admin/legal-compliance-review",
    "/api/admin/legal-external-review-evidence",
    "/api/admin/compliance-api-persistence-package",
    "/api/admin/form-risk-control",
    "/api/admin/turnstile-backend-verification",
    "/api/admin/data-retention-purge-plan",
    "/api/admin/privacy-fulfillment-verification",
    "/api/admin/line-optout-api-verification",
    "/api/admin/source-review-queue",
    "/api/admin/source-verification-evidence",
    "/api/admin/institution-import-verification",
    "/api/admin/public-feedback-api-verification",
    "/api/admin/content-version-snapshot",
    "/api/admin/content-api-cutover-package",
    "/api/admin/migration-package",
    "/api/admin/import-validation-package",
    "/api/admin/backup-restore-drill-plan",
    "/api/admin/backup-receipt-verification",
}


def load_contract():
    return json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))


def endpoint_map(contract):
    return {(item.get("method"), item.get("path")): item for item in contract.get("endpoints", [])}


def require_fields(failures, endpoint, key, required):
    actual = set(endpoint.get(key, []))
    for field in sorted(required - actual):
        failures.append(f"{endpoint.get('method')} {endpoint.get('path')}: missing {key} {field}")


def audit_contract(contract):
    failures = []
    if contract.get("base_path") != "/api":
        failures.append("api-contract.json: base_path must be /api")
    security = contract.get("security", {})
    if "Bearer session token" not in security.get("admin", []):
        failures.append("api-contract.json: admin security must require Bearer session token")
    if "role based access control" not in security.get("admin", []):
        failures.append("api-contract.json: admin security must require role based access control")
    rate_limit = security.get("rate_limit", {})
    if "IP + device fingerprint" not in rate_limit.get("POST /api/leads", ""):
        failures.append("api-contract.json: POST /api/leads rate limit must include IP + device fingerprint")
    if "Cloudflare Turnstile" not in security.get("bot_protection", ""):
        failures.append("api-contract.json: bot_protection must mention Cloudflare Turnstile")

    endpoints = endpoint_map(contract)
    for endpoint in sorted(PUBLIC_ENDPOINTS | ADMIN_ENDPOINTS):
        if endpoint not in endpoints:
            failures.append(f"api-contract.json: missing {endpoint[0]} {endpoint[1]}")
    if len(endpoints) != len(contract.get("endpoints", [])):
        failures.append("api-contract.json: duplicate method/path endpoint")

    for (method, path), endpoint in endpoints.items():
        auth = endpoint.get("auth", "")
        if not endpoint.get("purpose"):
            failures.append(f"{method} {path}: missing purpose")
        if path.startswith("/api/admin/") and path not in {"/api/admin/auth/login"} and not auth.startswith("admin:"):
            failures.append(f"{method} {path}: admin endpoint must declare admin RBAC auth")
        if path == "/api/admin/auth/login" and "csrf" not in auth:
            failures.append("POST /api/admin/auth/login: must require csrf")
        if method in ("POST", "PATCH") and path.startswith("/api/admin/"):
            if "audit_log" not in endpoint.get("response", []):
                failures.append(f"{method} {path}: mutating admin endpoint must return audit_log")
        if path in REPORT_ENDPOINTS and "generated_at" not in endpoint.get("response", []):
            failures.append(f"{method} {path}: report endpoint must return generated_at")

    lead_endpoint = endpoints.get(("POST", "/api/leads"), {})
    require_fields(failures, lead_endpoint, "request", LEAD_REQUIRED_REQUEST)
    require_fields(failures, lead_endpoint, "validation", LEAD_REQUIRED_VALIDATION)
    require_fields(failures, lead_endpoint, "response", {"id", "status", "recommended_categories", "recommended_articles", "line_url", "disclaimer"})

    events_endpoint = endpoints.get(("POST", "/api/events"), {})
    require_fields(failures, events_endpoint, "request", {"name", "path", "url", "referrer", "payload", "at"})

    lead_status_endpoint = endpoints.get(("PATCH", "/api/admin/leads/:id/status"), {})
    require_fields(failures, lead_status_endpoint, "request", {"status", "note", "assigned_to", "follow_up_priority", "next_follow_up_at", "contact_log"})

    privacy_endpoint = endpoints.get(("PATCH", "/api/admin/privacy-requests/:lead_id"), {})
    require_fields(failures, privacy_endpoint, "request", {"request_status", "note"})
    line_endpoint = endpoints.get(("GET", "/api/admin/line-segments"), {})
    if "Line OA" not in line_endpoint.get("purpose", "") or "已同意 Line" not in line_endpoint.get("purpose", ""):
        failures.append("GET /api/admin/line-segments: purpose must constrain Line OA sync to consenting leads")

    return failures


def main():
    try:
        contract = load_contract()
    except Exception as error:
        print(f"api contract audit load failed: {error}")
        return 1
    failures = audit_contract(contract)
    if failures:
        for failure in failures:
            print(failure)
        return 1
    print("api contract audit passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
