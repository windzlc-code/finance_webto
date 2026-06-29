#!/usr/bin/env python3
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
import json
import sys

import formal_config_input_packet
import launch_cutover_audit


ROOT = Path(__file__).resolve().parents[1]

MIGRATION_ORDER = [
    "institutions",
    "categories",
    "financial_products",
    "articles",
    "faq",
    "lead_forms",
    "lead_events",
    "compliance_reviews",
    "audit_logs",
    "source_review_tasks",
]

CRITICAL_ENDPOINTS = [
    {"key": "auth_login", "group": "驗證", "method": "POST", "path": "/api/admin/auth/login", "proof": "httpOnly session"},
    {"key": "auth_session", "group": "驗證", "method": "GET", "path": "/api/admin/auth/session", "proof": "RBAC 權限"},
    {"key": "auth_logout", "group": "驗證", "method": "POST", "path": "/api/admin/auth/logout", "proof": "撤銷 session"},
    {"key": "lead_create", "group": "前台", "method": "POST", "path": "/api/leads", "proof": "入庫/Turnstile/限流"},
    {"key": "admin_leads", "group": "後台", "method": "GET", "path": "/api/admin/leads", "proof": "CRM 跨瀏覽器可讀"},
    {"key": "lead_status_update", "group": "後台", "method": "PATCH", "path": "/api/admin/leads/:id/status", "proof": "狀態落庫+audit_log"},
    {"key": "lead_followups", "group": "後台", "method": "GET", "path": "/api/admin/leads/follow-ups", "proof": "待跟進隊列"},
    {"key": "events_intake", "group": "事件", "method": "POST", "path": "/api/events", "proof": "去識別事件落庫"},
    {"key": "products_api", "group": "內容", "method": "GET", "path": "/api/products", "proof": "API 供產品資料"},
    {"key": "articles_api", "group": "內容", "method": "GET", "path": "/api/articles", "proof": "只回傳已發布"},
    {"key": "compliance_review", "group": "合規", "method": "POST", "path": "/api/admin/compliance/review", "proof": "審核落庫"},
    {"key": "audit_logs", "group": "審計", "method": "GET", "path": "/api/admin/audit-logs", "proof": "動作可追蹤"},
    {"key": "privacy_request", "group": "個資", "method": "PATCH", "path": "/api/admin/privacy-requests/:lead_id", "proof": "刪除/更正同步"},
]


def load_json(path, fallback):
    try:
        return json.loads((ROOT / path).read_text(encoding="utf-8"))
    except Exception:
        return fallback


def nested(data, path, default=None):
    value = data
    for part in path.split("."):
        if not isinstance(value, dict) or part not in value:
            return default
        value = value[part]
    return value


def is_https_url(value):
    return isinstance(value, str) and value.startswith("https://")


def is_official_domain(value):
    if not is_https_url(value):
        return False
    host = urlparse(value).netloc.lower()
    return bool(host) and all(marker not in host for marker in ("127.0.0.1", "localhost", "github.io"))


def status_index():
    report = launch_cutover_audit.build_report()
    return {item["key"]: item for item in report.get("items", [])}, report


def step(step_id, title, goal, readiness, blockers, related_exports):
    return {
        "step": step_id,
        "title": title,
        "goal": goal,
        "readiness": readiness,
        "blockers": [item for item in blockers if item],
        "related_exports": related_exports,
    }


def merge_blockers(item_map, *keys):
    blockers = []
    for key in keys:
        blockers.extend(item_map.get(key, {}).get("blockers", []))
    return blockers


def build_report():
    site_config = load_json("site-config.json", {})
    products = load_json("assets/data/products.json", [])
    articles = load_json("assets/data/articles.json", [])
    institutions = load_json("assets/data/institutions.json", [])
    item_map, audit = status_index()
    config_packet = formal_config_input_packet.build_report()

    backend_mode = str(nested(site_config, "backend.mode", "") or "").strip()
    backend_url = str(nested(site_config, "backend.api_base_url", "") or "").strip()
    api_configured = backend_mode == "api" and is_https_url(backend_url) and is_official_domain(backend_url)

    step_1_ready = "ready_for_formal_api_validation" if api_configured else "pending_api_configuration"
    step_2_ready = item_map.get("admin_auth_server_cutover", {}).get("status", "pending_api_configuration") if api_configured else "pending_api_configuration"
    step_3_ready = item_map.get("admin_crm_api_cutover", {}).get("status", "pending_api_configuration") if api_configured else "pending_api_configuration"
    step_4_ready = "ready_for_external_tracking_validation" if api_configured else "pending_api_configuration"
    step_5_ready = item_map.get("content_api_cutover", {}).get("status", "pending_api_configuration") if api_configured else "pending_api_configuration"
    step_6_ready = item_map.get("database_backup_strategy", {}).get("status", "pending_backup_receipt_verification")

    steps = [
        step(
            "step_1_leads_api",
            "先接入 POST /api/leads",
            "優先把免費健檢提交從 localStorage 切到正式 lead_forms，避免潛客只停留在瀏覽器。",
            step_1_ready,
            merge_blockers(item_map, "backend_api_base_url", "leads_api_persistence", "turnstile_backend_verification"),
            ["tfse_backend_acceptance_matrix", "tfse_turnstile_backend_verification_package", "tfse_form_risk_control_report"],
        ),
        step(
            "step_2_admin_auth",
            "再切換 Admin Auth",
            "用伺服器 session、CSRF、RBAC 與 Viewer 遮罩取代前端 MVP 密碼。",
            step_2_ready,
            merge_blockers(item_map, "admin_auth_server_cutover"),
            ["tfse_admin_auth_cutover_check", "tfse_admin_security_matrix", "tfse_backend_acceptance_matrix"],
        ),
        step(
            "step_3_crm_writeback",
            "接入 CRM / 審計落庫",
            "讓 Admin CRM、聯繫紀錄、重複線索、合規審核與個資請求能跨瀏覽器共享並保留 audit_logs。",
            step_3_ready,
            merge_blockers(item_map, "formal_backend_migration", "admin_crm_api_cutover"),
            ["tfse_crm_api_persistence_package", "tfse_compliance_api_persistence_package", "tfse_privacy_fulfillment_verification_package"],
        ),
        step(
            "step_4_events_and_tracking",
            "接入 POST /api/events 與外部追蹤",
            "把去識別事件寫入伺服器並同步 GA4 / Meta / Server Event / Sentry。",
            step_4_ready,
            merge_blockers(item_map, "server_event_endpoint", "ga4_measurement_id", "meta_pixel_id", "analytics_debug_verification", "sentry_dsn"),
            ["tfse_monitoring_receipt_checklist", "tfse_analytics_debug_verification_package", "tfse_sentry_error_verification_package"],
        ),
        step(
            "step_5_content_api",
            "接入內容 API",
            "讓 /api/products、/api/articles、/api/institutions、/api/search 成為正式資料來源，靜態 JSON 降級為 seed / fallback。",
            step_5_ready,
            merge_blockers(item_map, "institution_import", "backend_api_base_url", "content_api_cutover"),
            ["tfse_content_api_cutover_package", "tfse_formal_backend_migration_package", "tfse_institution_import_verification_package"],
        ),
        step(
            "step_6_backup_and_restore",
            "最後完成備份 / 還原 / 運維門檻",
            "建立每日備份、每週還原演練、審計與 migration 後抽查，才算正式後端切換完成。",
            step_6_ready,
            merge_blockers(item_map, "database_backup_strategy", "formal_backend_migration"),
            ["tfse_backup_receipt_verification_package", "tfse_backup_restore_drill_plan", "tfse_formal_backend_migration_package"],
        ),
    ]

    ready_steps = sum(1 for item in steps if item["readiness"] not in ("pending_api_configuration", "pending_backup_receipt_verification"))
    blockers = [item for step_item in steps for item in step_item["blockers"]]

    return {
        "format": "tfse_backend_cutover_roadmap",
        "version": "2026-06-28",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "PRODUCTION_BACKEND_PLAN.md + launch_cutover_audit + formal_config_input_packet",
        "summary": {
            "api_configured": api_configured,
            "seed_products": len(products),
            "seed_articles": len(articles),
            "seed_institutions": len(institutions),
            "required_inputs_pending": config_packet["summary"]["pending_required_inputs"],
            "launch_external_input_pending": audit["counts"].get("pending_external_input", 0),
            "launch_ready_for_external_execution": audit["counts"].get("ready_for_external_execution", 0),
            "launch_human_review_pending": audit["counts"].get("pending_human_review", 0),
            "total_steps": len(steps),
            "ready_steps": ready_steps,
            "blockers": len(blockers),
        },
        "priority_sequence": steps,
        "migration_order": MIGRATION_ORDER,
        "critical_endpoints": CRITICAL_ENDPOINTS,
        "security_controls": [
            "Server-side session + CSRF + RBAC + Viewer masking",
            "Turnstile siteverify、蜜罐、IP + device_id 限流、24h 重複提交識別",
            "audit_logs 覆蓋匯出、狀態更新、審核、刪除請求與發布",
            "手機、Line ID、補充說明需加密或欄位級保護",
        ],
        "rehearsal_commands": [
            "python3 tools/backend_cutover_roadmap.py --markdown",
            "python3 tools/mock_formal_api.py --port 8788",
            "python3 backend/tfse_persistent_api.py --port 8788 --db data/tfse.sqlite3",
            "python3 tools/persistent_api_smoke.py",
            "NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs --backend-base-url http://127.0.0.1:8788",
            "python3 tools/validate_site_config.py",
            "python3 tools/backend_schema_audit.py",
            "python3 tools/api_contract_audit.py",
        ],
        "completion_gates": [
            "POST /api/leads 成功落 lead_forms，且拒收高敏資料。",
            "Admin login/session/logout 改為伺服器驗證，並有 RBAC / audit_logs。",
            "CRM / 合規 / 個資請求可跨瀏覽器共享同一批正式資料。",
            "內容 API、事件 API、外部追蹤與 Sentry 收件均有 staging / production 證據。",
            "每日備份成功、每週 restore drill 可驗證。",
        ],
        "related_exports": [
            "tfse_formal_config_input_packet",
            "tfse_launch_cutover_audit",
            "tfse_formal_backend_migration_package",
            "tfse_institution_import_verification_package",
            "tfse_backend_acceptance_matrix",
            "tfse_admin_auth_cutover_check",
            "tfse_crm_api_persistence_package",
            "tfse_compliance_api_persistence_package",
            "tfse_privacy_fulfillment_verification_package",
            "tfse_turnstile_backend_verification_package",
            "tfse_content_api_cutover_package",
            "tfse_backup_receipt_verification_package",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE Backend Cutover Roadmap",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Source: `{report['source']}`",
        f"- API configured: `{report['summary']['api_configured']}`",
        f"- Steps ready: `{report['summary']['ready_steps']}` / `{report['summary']['total_steps']}`",
        f"- Required inputs pending: `{report['summary']['required_inputs_pending']}`",
        f"- Launch external input pending: `{report['summary']['launch_external_input_pending']}`",
        "",
        "## Priority Sequence",
        "",
    ]
    for index, item in enumerate(report["priority_sequence"], 1):
        blockers = "；".join(item["blockers"]) if item["blockers"] else "無"
        exports = "、".join(item["related_exports"]) if item["related_exports"] else "無"
        lines.extend([
            f"### {index}. {item['title']}",
            "",
            f"- Step: `{item['step']}`",
            f"- Readiness: `{item['readiness']}`",
            f"- Goal: {item['goal']}",
            f"- Blockers: {blockers}",
            f"- Related exports: {exports}",
            "",
        ])
    lines.extend([
        "## Rehearsal Commands",
        "",
    ])
    for command in report["rehearsal_commands"]:
        lines.append(f"- `{command}`")
    lines.extend([
        "",
        "## Completion Gates",
        "",
    ])
    for gate in report["completion_gates"]:
        lines.append(f"- {gate}")
    return "\n".join(lines)


def main():
    report = build_report()
    if "--markdown" in sys.argv:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
