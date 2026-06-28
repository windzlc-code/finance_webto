#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import urlparse
import json
import sys


ROOT = Path(__file__).resolve().parents[1]


def read_text(path):
    return (ROOT / path).read_text(encoding="utf-8", errors="ignore")


def load_json(path, fallback):
    try:
        return json.loads((ROOT / path).read_text(encoding="utf-8"))
    except Exception:
        return fallback


def contains(path, *markers):
    text = read_text(path)
    return all(marker in text for marker in markers)


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


def package_ready(markers):
    return all(contains(path, *items) for path, items in markers)


def item(status, key, label, owner, evidence, blockers, related_exports):
    return {
        "status": status,
        "key": key,
        "label": label,
        "owner": owner,
        "evidence": evidence,
        "blockers": [value for value in blockers if value],
        "related_exports": related_exports,
    }


def build_report():
    site_config = load_json("site-config.json", {})
    analytics = site_config.get("analytics", {})
    search_console = site_config.get("search_console", {})
    backend = site_config.get("backend", {})
    line = site_config.get("line", {})
    turnstile = nested(site_config, "security.turnstile", {}) or {}

    base_url = str(site_config.get("base_url") or "").strip()
    ga4 = str(analytics.get("ga4_measurement_id") or "").strip()
    meta = str(analytics.get("meta_pixel_id") or "").strip()
    server_event = str(analytics.get("server_event_endpoint") or "").strip()
    sentry = str(analytics.get("sentry_dsn") or "").strip()
    search_verification = str(search_console.get("google_site_verification") or "").strip()
    line_url = str(line.get("oa_url") or "").strip()
    backend_url = str(backend.get("api_base_url") or "").strip()
    backend_mode = str(backend.get("mode") or "").strip()
    line_official_ready = is_https_url(line_url) and line_url not in ("free-check.html#line-cta", "contact-us.html#line-cta", "contact.html#line-cta")
    backend_ready = backend_mode == "api" and is_https_url(backend_url)

    markers = {
        "domain_cutover": [("assets/js/tfse-admin.js", ("tfse_domain_cutover_package", "domainCutoverPayload"))],
        "analytics_debug": [("assets/js/tfse-admin.js", ("tfse_analytics_debug_verification_package", "analyticsDebugPayload"))],
        "line_setup": [("assets/js/tfse-admin.js", ("tfse_line_oa_setup_package", "lineOaSetupPayload")), ("assets/data/line-flows.json", ("quick_replies",))],
        "line_handoff": [("assets/js/tfse-admin.js", ("tfse_line_oa_handoff_check", "lineOaHandoffPayload"))],
        "search_console": [("assets/js/tfse-admin.js", ("tfse_search_console_verification_package", "searchConsoleVerificationPayload"))],
        "admin_auth": [("assets/js/tfse-admin.js", ("tfse_admin_auth_cutover_check", "authCutoverPayload")), ("api-contract.json", ("/api/admin/auth/login", "/api/admin/auth/session", "/api/admin/auth/logout"))],
        "backup_receipt": [("assets/js/tfse-admin.js", ("tfse_backup_receipt_verification_package", "backupReceiptPayload"))],
        "institution_import": [("assets/js/tfse-admin.js", ("tfse_institution_import_verification_package", "institutionImportPayload")), ("assets/data/institutions.json", ("registry_ref",))],
        "migration": [("assets/js/tfse-admin.js", ("tfse_formal_backend_migration_package", "migrationPayload"))],
        "content_api": [("assets/js/tfse-admin.js", ("tfse_content_api_cutover_package", "contentApiCutoverPayload"))],
        "turnstile": [("assets/js/tfse-admin.js", ("tfse_turnstile_backend_verification_package", "turnstileBackendPayload")), ("api-contract.json", ("cf_turnstile_response", "turnstile token required when enabled"))],
        "sentry": [("assets/js/tfse-admin.js", ("tfse_sentry_error_verification_package", "sentryVerificationPayload"))],
        "host_fallback": [("assets/js/tfse-admin.js", ("tfse_host_fallback_deployment_check", "hostFallbackPayload")), ("LAUNCH_CHECKLIST.md", ("tfse_host_fallback_deployment_check",))],
        "legal_review": [("assets/js/tfse-admin.js", ("tfse_legal_external_review_evidence", "legalExternalReviewPayload"))],
    }

    items = []
    items.append(item(
        "pending_external_input" if not is_official_domain(base_url) else "ready_for_external_execution",
        "formal_domain_base_url",
        "正式網域切換與 SEO 資產重生",
        "data_manager",
        "Domain cutover package、SEO asset generator 與 checklist 已就緒。",
        [
            "" if is_official_domain(base_url) else "site-config.json base_url 仍非正式自有網域。",
            "" if package_ready(markers["domain_cutover"]) else "正式網域切換交接包或相關文檔缺失。",
        ],
        ["tfse_domain_cutover_package", "python3 tools/generate_seo_assets.py"],
    ))
    items.append(item(
        "pending_external_input" if not ga4 else "ready_for_external_execution",
        "ga4_measurement_id",
        "GA4 Measurement ID 填入與收件驗證",
        "data_manager",
        "GA4 欄位、事件映射與監控收件驗收包已存在。",
        ["" if ga4 else "site-config.json analytics.ga4_measurement_id 尚未填入正式 ID。"],
        ["tfse_monitoring_receipt_checklist", "tfse_analytics_debug_verification_package"],
    ))
    items.append(item(
        "pending_external_input" if not meta else "ready_for_external_execution",
        "meta_pixel_id",
        "Meta Pixel ID 填入與收件驗證",
        "data_manager",
        "Meta Pixel 欄位、事件映射與 Debug 驗證包已存在。",
        ["" if meta else "site-config.json analytics.meta_pixel_id 尚未填入正式 ID。"],
        ["tfse_monitoring_receipt_checklist", "tfse_analytics_debug_verification_package"],
    ))
    items.append(item(
        "ready_for_external_execution" if ga4 and meta and package_ready(markers["analytics_debug"]) else "pending_external_input",
        "analytics_debug_verification",
        "GA4 / Meta Debug 驗證留痕",
        "data_manager",
        "後台可匯出 tfse_analytics_debug_verification_package 保存 DebugView / Events Manager 證據。",
        [
            "" if package_ready(markers["analytics_debug"]) else "GA4 / Meta Debug 驗證包缺失。",
            "" if ga4 and meta else "正式 GA4 / Meta Pixel 尚未填入，無法做外部 Debug 驗證。",
        ],
        ["tfse_analytics_debug_verification_package"],
    ))
    items.append(item(
        "pending_external_input" if not is_https_url(server_event) else "ready_for_external_execution",
        "server_event_endpoint",
        "Server Event endpoint 填入與去識別事件落庫",
        "backend_engineer",
        "Server Event 欄位、事件重放隊列與驗收包已就緒。",
        ["" if is_https_url(server_event) else "site-config.json analytics.server_event_endpoint 尚未填入正式 endpoint。"],
        ["tfse_server_event_replay_queue", "tfse_monitoring_receipt_checklist"],
    ))
    items.append(item(
        "pending_external_input" if not line_official_ready else "ready_for_external_execution",
        "line_oa_url",
        "正式 Line OA 加友 URL 切換",
        "ops_marketing",
        "Line OA setup / handoff package 與站內 CTA 已就緒。",
        ["" if line_official_ready else "site-config.json line.oa_url 仍指向本機 MVP 說明錨點或非正式 URL。"] + ([] if package_ready(markers["line_setup"]) else ["Line OA setup package 或 line-flows.json 缺失。"]),
        ["tfse_line_oa_setup_package", "tfse_line_oa_handoff_check"],
    ))
    items.append(item(
        "ready_for_external_execution" if package_ready(markers["line_setup"]) else "pending_local_prep",
        "line_oa_setup",
        "正式 Line OA 圖文選單 / 分群 / 自動回覆建立",
        "ops_marketing",
        "line-flows.json 與 Line OA setup package 可直接作為實際建立清單。",
        ["" if package_ready(markers["line_setup"]) else "Line OA setup package 或 line-flows.json 缺失。", "" if line_official_ready else "正式 Line OA URL 尚未填入。"],
        ["tfse_line_oa_setup_package"],
    ))
    items.append(item(
        "ready_for_external_execution" if package_ready(markers["line_handoff"]) else "pending_local_prep",
        "line_oa_handoff",
        "正式 Line OA 導向 / quick reply / 退訂留痕",
        "ops_marketing",
        "後台可匯出 Line OA handoff 驗收包並保存手機 / 桌面截圖證據。",
        ["" if package_ready(markers["line_handoff"]) else "Line OA handoff package 缺失。", "" if line_official_ready else "正式 Line OA URL 尚未填入。"],
        ["tfse_line_oa_handoff_check"],
    ))
    items.append(item(
        "pending_external_input" if not search_verification else "ready_for_external_execution",
        "search_console_verification",
        "Search Console 驗證碼填入與 SEO 資產重生",
        "seo_owner",
        "Search Console 驗證包、sitemap / robots 與 SEO 提交包已就緒。",
        ["" if search_verification else "site-config.json search_console.google_site_verification 尚未填入。"],
        ["tfse_search_console_verification_package", "tfse_seo_submission_package"],
    ))
    items.append(item(
        "ready_for_external_execution" if search_verification and package_ready(markers["search_console"]) else "pending_external_input",
        "search_console_submit",
        "Search Console property 驗證與 sitemap 提交",
        "seo_owner",
        "後台已提供 Search Console 驗證包、SEO submission package 與 indexing queue。",
        [
            "" if package_ready(markers["search_console"]) else "Search Console verification package 缺失。",
            "" if search_verification else "正式 Search Console 驗證碼尚未填入。",
        ],
        ["tfse_search_console_verification_package", "tfse_seo_submission_package", "tfse_seo_indexing_followup_queue"],
    ))
    items.append(item(
        "ready_for_external_execution" if package_ready(markers["admin_auth"]) else "pending_local_prep",
        "admin_auth_server_cutover",
        "伺服器端 Admin Auth / RBAC / 審計日誌接入",
        "backend_engineer",
        "Admin Auth cutover package、API contract 與安全矩陣已存在。",
        ["" if package_ready(markers["admin_auth"]) else "Admin Auth cutover package 或 API contract 缺失。"],
        ["tfse_admin_auth_cutover_check", "tfse_admin_security_matrix"],
    ))
    items.append(item(
        "ready_for_external_execution" if package_ready(markers["backup_receipt"]) else "pending_local_prep",
        "database_backup_strategy",
        "正式資料庫每日備份 / 每週還原演練",
        "infra_owner",
        "備份還原 drill package 與 backup receipt verification package 已存在。",
        ["" if package_ready(markers["backup_receipt"]) else "Backup receipt verification package 缺失。"],
        ["tfse_backup_restore_drill_plan", "tfse_backup_receipt_verification_package"],
    ))
    items.append(item(
        "ready_for_external_execution" if package_ready(markers["institution_import"]) else "pending_local_prep",
        "institution_import",
        "機構資料正式匯入與來源版本紀錄",
        "data_manager",
        "institutions.json 與 institution import verification package 已存在。",
        ["" if package_ready(markers["institution_import"]) else "Institution import verification package 或 seed 資料缺失。"],
        ["tfse_institution_import_verification_package"],
    ))
    items.append(item(
        "ready_for_external_execution" if package_ready(markers["migration"]) else "pending_local_prep",
        "formal_backend_migration",
        "本機內容 / 線索 / 審計遷移到正式後端",
        "backend_engineer",
        "正式遷移包已存在，可對照 restore_order 逐步導入正式版本紀錄。",
        ["" if package_ready(markers["migration"]) else "Formal backend migration package 缺失。"],
        ["tfse_formal_backend_migration_package"],
    ))
    items.append(item(
        "pending_external_input" if not backend_ready else "ready_for_external_execution",
        "backend_api_base_url",
        "正式 backend.api_base_url 切換與前台重驗",
        "backend_engineer",
        "前端 API adapter、mock formal API rehearsal 與 backend acceptance matrix 已就緒。",
        ["" if backend_ready else "site-config.json backend.mode / backend.api_base_url 尚未切到正式 API。"],
        ["tfse_backend_acceptance_matrix", "tfse_content_api_cutover_package"],
    ))
    items.append(item(
        "ready_for_external_execution" if backend_ready and package_ready(markers["content_api"]) else "pending_external_input",
        "content_api_cutover",
        "正式內容 API 驗收與切換",
        "backend_engineer",
        "前端已支援 products / articles / institutions / search API，cutover package 已存在。",
        [
            "" if package_ready(markers["content_api"]) else "Content API cutover package 缺失。",
            "" if backend_ready else "正式 backend.api_base_url 尚未配置。",
        ],
        ["tfse_content_api_cutover_package"],
    ))
    items.append(item(
        "ready_for_external_execution" if backend_ready else "pending_external_input",
        "leads_api_persistence",
        "POST /api/leads 正式落庫取代 localStorage",
        "backend_engineer",
        "Lead API contract、CRM API persistence package 與 mock rehearsal 已存在。",
        ["" if backend_ready else "正式 backend.api_base_url 尚未配置，無法切到正式 leads API。"],
        ["tfse_crm_api_persistence_package", "tfse_backend_acceptance_matrix"],
    ))
    items.append(item(
        "ready_for_external_execution" if backend_ready and turnstile.get("enabled") and turnstile.get("site_key") and package_ready(markers["turnstile"]) else "pending_external_input",
        "turnstile_backend_verification",
        "Turnstile server-side 驗證 / 限流 / 去重",
        "backend_engineer",
        "前端 token 欄位、風險控制報表與 backend verification package 已存在。",
        [
            "" if package_ready(markers["turnstile"]) else "Turnstile backend verification package 或 API contract 缺失。",
            "" if backend_ready else "正式 backend.api_base_url 尚未配置。",
            "" if turnstile.get("enabled") and turnstile.get("site_key") else "Cloudflare Turnstile 尚未在正式配置中啟用。",
        ],
        ["tfse_turnstile_backend_verification_package", "tfse_form_risk_control_report"],
    ))
    items.append(item(
        "ready_for_external_execution" if backend_ready else "pending_external_input",
        "admin_crm_api_cutover",
        "Admin CRM / 合規審核 / 審計日誌接入正式 API",
        "backend_engineer",
        "Admin 已具備 CRM / compliance / audit export 與 mock API rehearsal。",
        ["" if backend_ready else "正式 backend.api_base_url 尚未配置。"],
        ["tfse_crm_api_persistence_package", "tfse_compliance_api_persistence_package", "tfse_backend_acceptance_matrix"],
    ))
    items.append(item(
        "pending_external_input" if not is_https_url(sentry) else "ready_for_external_execution",
        "sentry_dsn",
        "正式 Sentry DSN 填入",
        "ops_engineer",
        "前端錯誤摘要與 Sentry 驗收包已存在。",
        ["" if is_https_url(sentry) else "site-config.json analytics.sentry_dsn 尚未填入正式 DSN。"],
        ["tfse_sentry_error_verification_package"],
    ))
    items.append(item(
        "ready_for_external_execution" if is_https_url(sentry) and package_ready(markers["sentry"]) else "pending_external_input",
        "sentry_verification",
        "前台 / API Sentry 受控錯誤驗證",
        "ops_engineer",
        "後台可匯出 tfse_sentry_error_verification_package 保存 issue / masking / release 證據。",
        [
            "" if package_ready(markers["sentry"]) else "Sentry verification package 缺失。",
            "" if is_https_url(sentry) else "正式 Sentry DSN 尚未填入。",
        ],
        ["tfse_sentry_error_verification_package"],
    ))
    items.append(item(
        "ready_for_external_execution" if package_ready(markers["host_fallback"]) else "pending_local_prep",
        "host_fallback_deployment",
        "正式主機 404 / 500 / server error fallback 配置",
        "infra_owner",
        "主機 fallback deployment check 已存在，可於部署後逐項留痕。",
        ["" if package_ready(markers["host_fallback"]) else "Host fallback deployment check 缺失。"],
        ["tfse_host_fallback_deployment_check"],
    ))
    items.append(item(
        "pending_human_review",
        "legal_review_external",
        "台灣當地法務 / 合規人員正式複核",
        "legal_reviewer",
        "法務複核包、外部留痕與待複核項清單已存在。",
        ["" if package_ready(markers["legal_review"]) else "Legal external review package 缺失。"],
        ["tfse_legal_compliance_review_package", "tfse_legal_external_review_evidence"],
    ))

    counts = {}
    for entry in items:
        counts[entry["status"]] = counts.get(entry["status"], 0) + 1

    return {
        "format": "tfse_launch_cutover_audit",
        "source": "LAUNCH_CHECKLIST external cutover section",
        "generated_from": ["site-config.json", "assets/js/tfse-admin.js", "api-contract.json", "LAUNCH_CHECKLIST.md"],
        "counts": counts,
        "summary": {
            "official_config_pending": sum(1 for entry in items if entry["status"] == "pending_external_input"),
            "external_execution_ready": sum(1 for entry in items if entry["status"] == "ready_for_external_execution"),
            "human_review_pending": sum(1 for entry in items if entry["status"] == "pending_human_review"),
            "local_prep_missing": sum(1 for entry in items if entry["status"] == "pending_local_prep"),
        },
        "items": items,
    }


def main():
    report = build_report()
    if "--json" in sys.argv:
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0

    counts = report["counts"]
    print(
        "launch cutover audit: "
        + ", ".join(f"{key}={counts[key]}" for key in sorted(counts))
    )
    for entry in report["items"]:
        blockers = "；".join(entry["blockers"]) if entry["blockers"] else "無"
        print(f"{entry['status']}: {entry['label']}｜owner={entry['owner']}｜阻擋：{blockers}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
