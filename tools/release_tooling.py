from pathlib import Path
from urllib.parse import urlparse
import json

import site_config_tooling


ROOT = Path(__file__).resolve().parents[1]


RELEASE_REQUIRED_COMMANDS = [
    "python3 tools/compliance_scan.py",
    "python3 tools/data_quality_audit.py",
    "python3 tools/checklist_artifact_coverage_audit.py --markdown",
    "python3 tools/crm_capability_audit.py --markdown",
    "python3 tools/source_freshness_audit.py",
    "python3 tools/api_contract_audit.py",
    "python3 tools/backend_schema_audit.py",
    "python3 tools/performance_budget_audit.py",
    "python3 tools/seo_assets_audit.py",
    "python3 tools/production_config_audit.py",
    "python3 tools/production_env_template.py --markdown",
    "python3 tools/production_config_readiness.py --markdown",
    "python3 tools/site_config_update_package.py --markdown",
    "python3 tools/site_config_approval_package.py --markdown",
    "python3 tools/accessibility_audit.py",
    "python3 tools/operations_runbook_audit.py",
    "python3 tools/validate_site_config.py",
    "python3 tools/launch_health_check.py --markdown",
    "python3 tools/domain_cutover_package.py --markdown",
    "python3 tools/host_fallback_deployment_check.py --markdown",
    "python3 tools/https_ingress_fix_package.py --markdown",
    "python3 tools/seo_submission_package.py --markdown",
    "python3 tools/search_console_verification_package.py --markdown",
    "python3 tools/tracking_consent_audit.py --markdown",
    "python3 tools/monitoring_receipt_checklist.py --markdown",
    "python3 tools/sentry_error_verification_package.py --markdown",
    "python3 tools/admin_export_cli_coverage_audit.py --markdown",
    "python3 tools/security_headers_deployment_check.py --markdown",
    "python3 tools/admin_security_matrix.py --markdown",
    "python3 tools/admin_auth_cutover_check.py --markdown",
    "python3 tools/backend_acceptance_matrix.py --markdown",
    "python3 tools/line_oa_setup_package.py --markdown",
    "python3 tools/line_oa_handoff_check.py --markdown",
    "python3 tools/formal_backend_migration_package.py --markdown",
    "python3 tools/backup_restore_drill_plan.py --markdown",
    "python3 tools/backup_receipt_verification_package.py --markdown",
    "python3 tools/content_api_cutover_package.py --markdown",
    "python3 tools/turnstile_backend_verification_package.py --markdown",
    "python3 tools/analytics_debug_verification_package.py --markdown",
    "python3 tools/acceptance_checklist.py --markdown",
    "python3 tools/project_plan_coverage_report.py --markdown",
    "python3 tools/plan_requirement_trace.py --markdown",
    "python3 tools/source_review_queue.py --markdown",
    "python3 tools/source_verification_evidence.py --markdown",
    "python3 tools/content_version_snapshot.py --markdown",
    "python3 tools/privacy_request_queue.py --markdown",
    "python3 tools/line_segment_queue.py --markdown",
    "python3 tools/line_optout_complaint_queue.py --markdown",
    "python3 tools/institution_import_verification_package.py --markdown",
    "python3 tools/public_feedback_intake_package.py --markdown",
    "python3 tools/public_feedback_api_verification_package.py --markdown",
    "python3 tools/lead_dedupe_queue.py --markdown",
    "python3 tools/crm_follow_up_queue.py --markdown",
    "python3 tools/crm_contact_log.py --markdown",
    "python3 tools/crm_api_persistence_package.py --markdown",
    "python3 tools/form_risk_control_report.py --markdown",
    "python3 tools/import_validation_package.py --markdown",
    "python3 tools/data_retention_purge_plan.py --markdown",
    "python3 tools/privacy_fulfillment_verification_package.py --markdown",
    "python3 tools/local_backup.py --markdown",
    "python3 tools/ad_campaign_checklist.py --markdown",
    "python3 tools/conversion_optimization_backlog.py --markdown",
    "python3 tools/utm_attribution_report.py --markdown",
    "python3 tools/retrospective_report.py --markdown",
    "python3 tools/server_event_replay_queue.py --markdown",
    "python3 tools/legal_compliance_review_package.py --markdown",
    "python3 tools/legal_external_review_evidence.py --markdown",
    "python3 tools/compliance_api_persistence_package.py --markdown",
    "python3 tools/line_optout_api_verification_package.py --markdown",
    "python3 tools/local_audit_matrix.py --markdown",
    "python3 tools/seo_indexing_followup_queue.py --markdown",
    "python3 tools/acceptance_audit.py",
    "python3 tools/launch_cutover_audit.py",
    "python3 tools/backend_cutover_roadmap.py --markdown",
    "python3 tools/launch_execution_plan.py --markdown",
    "python3 tools/launch_countdown_plan.py --markdown",
    "python3 tools/formal_config_input_packet.py --markdown",
    "python3 tools/plan_closure_report.py --markdown",
    "python3 tools/project_phase_audit.py",
    "python3 tools/project_plan_coverage_audit.py --markdown",
    "python3 tools/external_execution_packet.py --markdown",
    "python3 tools/owner_cutover_bundle.py --markdown --summary-only",
    "python3 tools/release_day_runsheet.py --markdown",
    "python3 tools/external_verification_evidence.py --markdown",
    "python3 tools/release_readiness_package.py --markdown",
    "python3 tools/operations_task_queue.py --markdown",
    "python3 tools/incident_response_package.py --markdown",
    "python3 tools/launch_handoff_manifest.py --markdown",
    "python3 tools/verify_static_site.py",
    "NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs",
    "NODE_PATH=/path/to/node_modules node tools/bank_club_integration_smoke.mjs",
]


def load_site_config():
    return site_config_tooling.load_site_config()


def load_json(path, fallback):
    try:
        return json.loads((ROOT / path).read_text(encoding="utf-8"))
    except Exception:
        return fallback


def is_official_domain(value):
    if not site_config_tooling.is_https_url(value):
        return False
    host = urlparse(value.strip()).netloc.lower()
    return bool(host) and all(marker not in host for marker in ("127.0.0.1", "localhost", "github.io"))


def absolute_url(base_url, path):
    base = str(base_url or "").rstrip("/")
    path = str(path or "").lstrip("/")
    if not base:
        return path or "/"
    return base + "/" + path if path else base + "/"


def launch_health_items(site_config):
    analytics = site_config.get("analytics", {})
    search_console = site_config.get("search_console", {})
    line = site_config.get("line", {})
    return [
        {"key": "base_url", "label": "正式網址設定", "done": bool(site_config.get("base_url")), "detail": site_config.get("base_url") or "尚未設定"},
        {"key": "sitemap", "label": "sitemap.xml", "done": True, "detail": "sitemap.xml 已納入靜態驗收"},
        {"key": "robots", "label": "robots.txt", "done": True, "detail": "robots.txt 指向 sitemap"},
        {"key": "error_pages", "label": "404 / 500 頁", "done": True, "detail": "404.html 與 500.html 已建立"},
        {"key": "ga4", "label": "GA4 Measurement ID", "done": bool(analytics.get("ga4_measurement_id")), "detail": analytics.get("ga4_measurement_id") or "正式 ID 待填"},
        {"key": "meta_pixel", "label": "Meta Pixel ID", "done": bool(analytics.get("meta_pixel_id")), "detail": analytics.get("meta_pixel_id") or "正式 Pixel 待填"},
        {"key": "server_event", "label": "Server Event Endpoint", "done": bool(analytics.get("server_event_endpoint")), "detail": analytics.get("server_event_endpoint") or "正式事件 API 待填"},
        {"key": "sentry", "label": "Sentry DSN", "done": bool(analytics.get("sentry_dsn")), "detail": analytics.get("sentry_dsn") or "正式 DSN 待填"},
        {"key": "search_console", "label": "Search Console 驗證碼", "done": bool(search_console.get("google_site_verification")), "detail": search_console.get("google_site_verification") or "驗證碼待填"},
        {"key": "line_oa", "label": "Line OA URL", "done": bool(line.get("oa_url")) and line.get("oa_url") != "free-check.html#line-cta", "detail": line.get("oa_url") or "Line OA 待填"},
        {"key": "backup", "label": "本機備份包", "done": True, "detail": "Admin 可匯出/匯入本機 MVP 備份包"},
        {"key": "compliance_scan", "label": "合規掃描", "done": True, "detail": "tools/compliance_scan.py 已納入驗收命令"},
        {"key": "config_validation", "label": "站點配置格式校驗", "done": True, "detail": "tools/validate_site_config.py 可檢查正式 ID、URL 與 canonical 設定格式"},
    ]


def build_launch_health_report(site_config=None):
    site_config = site_config or load_site_config()
    items = launch_health_items(site_config)
    return {
        "format": "tfse_launch_health_check",
        "generated_at": site_config_tooling.now_iso(),
        "source": "site-config.json + static deployment baseline",
        "ready_count": sum(1 for item in items if item["done"]),
        "pending_count": sum(1 for item in items if not item["done"]),
        "items": items,
        "related_exports": [
            "tfse_production_config_readiness",
            "tfse_domain_cutover_package",
            "tfse_external_verification_evidence",
        ],
    }


def build_domain_cutover_report(site_config=None):
    site_config = site_config or load_site_config()
    base_url = str(site_config.get("base_url") or "").rstrip("/")
    search_console = site_config.get("search_console", {})
    canonical_pages = site_config.get("canonical_pages", [])
    blockers = [
        "" if is_official_domain(base_url) else "base_url 需為正式 HTTPS 網域。",
        "" if search_console.get("google_site_verification") else "Search Console 驗證碼待填。",
        "" if canonical_pages else "canonical_pages 不可為空。",
    ]
    blockers = [item for item in blockers if item]
    return {
        "format": "tfse_domain_cutover_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "source": "site-config.json + generated SEO assets",
        "base_url": base_url,
        "status": "pending_domain_cutover" if blockers else "ready_for_domain_cutover",
        "summary": {
            "canonical_pages": len(canonical_pages),
            "search_console_configured": bool(search_console.get("google_site_verification")),
            "blockers": len(blockers),
        },
        "assets": ["sitemap.xml", "robots.txt", "feed.xml", "site.webmanifest", ".well-known/security.txt"],
        "required_commands": [
            "python3 tools/generate_seo_assets.py",
            "python3 tools/seo_assets_audit.py",
            "python3 tools/validate_site_config.py",
            "python3 tools/verify_static_site.py",
            "NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs",
        ],
        "cutover_steps": [
            "更新 site-config.json > base_url 與 Search Console 驗證碼。",
            "重生 SEO 資產並確認 canonical、OG、JSON-LD、RSS、robots、sitemap。",
            "部署後抽查首頁、資料庫、文章、產品詳情、落地頁與 404/500。",
            "Search Console 驗證網域並提交 sitemap。",
            "若 canonical 或主頁不可用，回滾上一版並重新生成。",
        ],
        "blockers": blockers,
        "related_exports": [
            "tfse_seo_submission_package",
            "tfse_production_config_readiness",
            "tfse_release_readiness_package",
        ],
    }


def build_host_fallback_report(site_config=None):
    site_config = site_config or load_site_config()
    base_url = str(site_config.get("base_url") or "").rstrip("/")
    year = site_config_tooling.now_iso()[:4]
    return {
        "format": "tfse_host_fallback_deployment_check",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "source": "404.html + 500.html + deployment docs",
        "status": "requires_formal_host_verification",
        "source_files": ["404.html", "500.html", "DEPLOYMENT.md", "OPERATIONS_RUNBOOK.md", "site-config.json"],
        "privacy_note": "此包只保存公開 URL、檢查步驟與結果欄位，不保存 cookie、session、錯誤堆疊全文或個資。",
        "critical_routes": [
            {"route": absolute_url(base_url, "404.html"), "expected": "自訂 404 可導回資料庫、文章與免費財務健檢查詢"},
            {"route": absolute_url(base_url, "500.html"), "expected": "自訂 500/server error fallback 可導回首頁、資料庫與聯絡入口"},
            {"route": absolute_url(base_url, f"missing-page-{year}.html"), "expected": "正式主機未知路徑應回 404 狀態或顯示 404.html"},
            {"route": absolute_url(base_url, "api/server-error-probe"), "expected": "正式後端若接入 server error fallback，應回 5xx 且不暴露 stack trace"},
        ],
        "platform_notes": [
            "Netlify / Cloudflare Pages 可設定 404.html fallback；500 fallback 依平台支援度決定。",
            "GitHub Pages 支援自訂 404.html，但不支援真正 500 fallback；正式後端接入後需在 server 層配置。",
            "錯誤頁不得收集額外個資或顯示 stack trace、內部路徑、session/cookie。",
        ],
        "verification_steps": [
            "部署後直接訪問 /404.html 與 /500.html。",
            "訪問不存在的 HTML 路徑，確認狀態碼、頁面文案與回流 CTA。",
            "若有正式後端，觸發受控 server error probe 或 staging 測試，確認 500 fallback 不暴露堆疊。",
            "用瀏覽器桌面/手機確認錯誤頁無文字重疊且保留 TFSE 免責聲明。",
            "保存 checked_url、status_code、screenshot_url、result、reviewer_role 與 evidence_note。",
        ],
        "evidence_fields": ["checked_url", "status_code", "fallback_page", "viewport", "result", "screenshot_url", "checked_at", "reviewer_role", "evidence_note"],
        "blockers": [
            "正式主機尚未部署時，本機只能確認 404.html / 500.html 檔案存在。",
            "靜態主機不支援 500 fallback 時，需在正式後端或反向代理層配置。",
            "未知路徑狀態碼與 fallback 行為需部署後以平台實測確認。",
        ],
        "related_exports": [
            "tfse_domain_cutover_package",
            "tfse_security_headers_deployment_check",
            "tfse_release_readiness_package",
            "tfse_browser_acceptance_report",
        ],
    }


def build_external_verification_report(site_config=None, records=None):
    site_config = site_config or load_site_config()
    if records is None:
        records = site_config_tooling.load_admin_record_seed_records("external_verification_records")
    records = sorted(
        list(records or []),
        key=lambda item: str((item or {}).get("checked_at", "")),
        reverse=True,
    )
    analytics = site_config.get("analytics", {})
    search_console = site_config.get("search_console", {})
    line = site_config.get("line", {})
    backend = site_config.get("backend", {})
    launch = build_launch_health_report(site_config)
    config_items = site_config_tooling.config_readiness_items(site_config)
    latest_passed = {}
    for record in records:
        if record.get("result") != "passed":
            continue
        service = record.get("service")
        if service and service not in latest_passed:
            latest_passed[service] = record
    items = [
        {"service": "ga4", "label": "GA4 事件收件", "configured": bool(analytics.get("ga4_measurement_id"))},
        {"service": "meta_pixel", "label": "Meta Pixel 事件收件", "configured": bool(analytics.get("meta_pixel_id"))},
        {"service": "server_event", "label": "Server Event endpoint", "configured": bool(analytics.get("server_event_endpoint"))},
        {"service": "sentry", "label": "Sentry 錯誤收件", "configured": bool(analytics.get("sentry_dsn"))},
        {"service": "search_console", "label": "Search Console / sitemap", "configured": bool(search_console.get("google_site_verification"))},
        {"service": "line_oa", "label": "Line OA 導向", "configured": bool(line.get("oa_url")) and line.get("oa_url") != "free-check.html#line-cta"},
        {"service": "backend_api", "label": "正式後端 API", "configured": backend.get("mode") == "api" and bool(backend.get("api_base_url"))},
        {"service": "legal_review", "label": "法務合規複核", "configured": False},
    ]
    normalized = []
    for item in items:
        record = latest_passed.get(item["service"])
        normalized.append({
            "service": item["service"],
            "label": item["label"],
            "configured": item["configured"],
            "verified": bool(record),
            "latest_passed_at": record.get("checked_at", "") if record else "",
            "owner": record.get("owner", "") if record else "",
            "evidence_note": record.get("evidence_note", "") if record else "",
        })
    return {
        "format": "tfse_external_verification_evidence",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "privacy_note": "外部驗證只保存服務、結果、責任人與證據備註，不填個資。",
        "source_exports": [
            "tfse_launch_health_check",
            "tfse_production_config_readiness",
            "tfse_release_readiness_package",
        ],
        "summary": {
            "required_items": len(normalized),
            "configured_items": sum(1 for item in normalized if item["configured"]),
            "verified_items": sum(1 for item in normalized if item["verified"]),
            "launch_pending_count": launch["pending_count"],
            "config_pending_count": sum(1 for item in config_items if not item["done"]),
        },
        "items": normalized,
        "records": records[:100],
        "related_exports": [
            "tfse_launch_health_check",
            "tfse_production_config_readiness",
            "tfse_release_readiness_package",
            "tfse_plan_closure_report",
        ],
    }
