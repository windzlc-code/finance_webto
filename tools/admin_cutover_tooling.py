from pathlib import Path
import json

import release_tooling
import site_config_tooling


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "assets" / "data"


def load_json(name, fallback):
    try:
        return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))
    except Exception:
        return fallback


def load_seed_records(key):
    return sorted(
        site_config_tooling.load_admin_record_seed_records(key),
        key=lambda item: str((item or {}).get("checked_at", "")),
        reverse=True,
    )


def latest_record(records, matcher):
    for record in records:
        if matcher(record):
            return record
    return None


def line_flow_data():
    return load_json("line-flows.json", {})


def products():
    return load_json("products.json", [])


def articles():
    return load_json("articles.json", [])


def institutions():
    return load_json("institutions.json", [])


def landing_pages():
    return load_json("landing-pages.json", [])


def published_articles():
    return [
        item for item in articles()
        if str(item.get("status") or "published") == "published"
    ]


def source_review_pending_count():
    pending = 0
    for item in products():
        if item.get("status") in {"來源待核驗", "需更新"} or (
            item.get("source_url") == "source-policy.html"
            and item.get("id") != "product_source_policy"
        ):
            pending += 1
    for item in institutions():
        if item.get("verification_status") in {"pending", "source_pending"}:
            pending += 1
    return pending


def content_version_summary():
    return {
        "product_overrides": 0,
        "product_status_overrides": 0,
        "article_overrides": 0,
        "article_status_overrides": 0,
        "faq_overrides": 0,
        "audit_entries": 0,
    }


def role_label(role):
    labels = {
        "super_admin": "Super Admin",
        "content_editor": "Content Editor",
        "data_manager": "Data Manager",
        "compliance_reviewer": "Compliance Reviewer",
        "consultant": "Consultant",
        "viewer": "Viewer",
    }
    return labels.get(role, "Viewer")


def permission_matrix():
    return {
        "export": ["super_admin", "data_manager"],
        "backup": ["super_admin", "data_manager"],
        "retrospective": ["super_admin", "viewer", "consultant", "content_editor", "data_manager", "compliance_reviewer"],
        "launch_health": ["super_admin", "viewer", "data_manager", "compliance_reviewer"],
        "acceptance": ["super_admin", "viewer", "data_manager", "compliance_reviewer"],
        "privacy_request": ["super_admin", "consultant", "compliance_reviewer"],
        "line_segment": ["super_admin", "consultant", "content_editor"],
        "ad_campaign": ["super_admin", "content_editor", "compliance_reviewer"],
        "source_review": ["super_admin", "data_manager", "compliance_reviewer"],
        "update_lead": ["super_admin", "consultant"],
        "manage_product": ["super_admin", "data_manager"],
        "manage_article": ["super_admin", "content_editor"],
        "review_article": ["super_admin", "content_editor", "compliance_reviewer"],
        "manage_faq": ["super_admin", "content_editor"],
        "compliance": ["super_admin", "compliance_reviewer"],
        "legal_review": ["super_admin", "compliance_reviewer"],
        "analytics": ["super_admin", "viewer", "consultant", "content_editor", "data_manager", "compliance_reviewer"],
    }


def admin_security_matrix_report():
    roles = ["super_admin", "content_editor", "data_manager", "compliance_reviewer", "consultant", "viewer"]
    permissions = permission_matrix()
    matrix = []
    for role in roles:
        matrix.append({
            "role": role,
            "label": role_label(role),
            "permissions": sorted([name for name, allowed in permissions.items() if role in allowed]),
        })
    return {
        "format": "tfse_admin_security_matrix",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "source": "assets/js/tfse-admin.js permissionMatrix + api-contract.json + backend-schema.sql",
        "privacy_note": "此包只輸出角色、權限、正式安全檢查與證據，不包含密碼、session token、CSRF token、手機或 Line ID。",
        "roles": matrix,
        "checks": [
            {"key": "server_session", "label": "正式伺服器 session", "status": "contract_ready", "evidence": "/api/admin/auth/login、/api/admin/auth/session、/api/admin/auth/logout 已納入 API 合約。"},
            {"key": "csrf", "label": "CSRF token", "status": "contract_ready", "evidence": "admin_sessions 保存 csrf_token_hash，登入與登出端點要求 csrf_token。"},
            {"key": "password_hash", "label": "密碼雜湊", "status": "schema_ready", "evidence": "admin_users 僅保存 password_hash，不保存明文密碼。"},
            {"key": "mfa", "label": "MFA 欄位", "status": "schema_ready", "evidence": "admin_users.mfa_enabled 與登入 request.mfa_code 已預留。"},
            {"key": "rbac", "label": "角色權限矩陣", "status": "mvp_ready", "evidence": "本機 MVP 以 permissionMatrix 控制匯出、CRM、資料庫、文章、合規、投流與運維權限。"},
            {"key": "audit", "label": "敏感操作審計", "status": "mvp_ready", "evidence": "匯出、狀態更新、合規審核、個資處理、來源復核等會寫入本機審計；正式版需落 audit_logs。"},
            {"key": "viewer_masking", "label": "Viewer 遮罩", "status": "contract_required", "evidence": "正式版需限制 Viewer 不可看到完整手機、Line ID 或匯出個資。"},
        ],
        "blockers": [
            "正式上線前需以 server-side session 取代本機 MVP 明碼驗證。",
            "正式 API 需以 httpOnly Secure SameSite cookie 保存 session，並在敏感 POST/PATCH 驗證 CSRF。",
            "Viewer 與非授權角色需遮罩完整手機與 Line ID，匯出需寫入 audit_logs。",
        ],
        "related_exports": [
            "tfse_backend_acceptance_matrix",
            "tfse_formal_backend_migration_package",
            "tfse_privacy_request_queue",
            "tfse_admin_auth_cutover_check",
        ],
    }


def security_headers_report():
    site_config = site_config_tooling.load_site_config()
    base = str(site_config.get("base_url") or "").rstrip("/")
    return {
        "format": "tfse_security_headers_deployment_check",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "source_files": ["_headers", ".well-known/security.txt", "DEPLOYMENT.md", "OPERATIONS_RUNBOOK.md"],
        "status": "requires_formal_host_verification",
        "privacy_note": "此包只保存安全標頭、部署檢查與公開 URL，不保存 cookie、session token、CSRF token、密鑰或個資。",
        "expected_headers": [
            "Content-Security-Policy",
            "X-Frame-Options: DENY",
            "X-Content-Type-Options: nosniff",
            "Referrer-Policy: strict-origin-when-cross-origin",
            "Permissions-Policy",
            "Cache-Control for /assets/*",
            "Cache-Control: no-store for /site-config.json",
        ],
        "csp_allowlist": [
            "self",
            "https://www.googletagmanager.com",
            "https://connect.facebook.net",
            "https://browser.sentry-cdn.com",
            "https://challenges.cloudflare.com",
            "https://www.google-analytics.com",
            "https://analytics.google.com",
            "https://www.facebook.com",
            "https://*.ingest.sentry.io",
        ],
        "critical_urls": [
            release_tooling.absolute_url(base, "index.html"),
            release_tooling.absolute_url(base, "free-check.html"),
            release_tooling.absolute_url(base, "admin.html"),
            release_tooling.absolute_url(base, "404.html"),
            release_tooling.absolute_url(base, "500.html"),
            release_tooling.absolute_url(base, "site-config.json"),
            release_tooling.absolute_url(base, ".well-known/security.txt"),
        ],
        "host_notes": [
            "Netlify / Cloudflare Pages 可讀取 _headers；GitHub Pages 需透過 Cloudflare、反向代理或平台規則補上同等 header。",
            "正式主機需設定 404 fallback；500/server error fallback 若靜態主機不支援，需在正式後端接入後配置。",
            "正式加入 GA4、Meta Pixel、Sentry、Turnstile 後，若 CSP 有阻擋，需只新增必要官方網域，不放寬為 *。",
        ],
        "verification_commands": [
            "curl -I " + release_tooling.absolute_url(base, "index.html"),
            "curl -I " + release_tooling.absolute_url(base, "site-config.json"),
            "curl -I " + release_tooling.absolute_url(base, ".well-known/security.txt"),
            "python3 tools/verify_static_site.py",
            "python3 tools/production_config_audit.py",
        ],
        "evidence_fields": ["checked_url", "checked_at", "platform", "header_name", "expected_value", "actual_value", "result", "evidence_note", "reviewer_role"],
        "related_exports": [
            "tfse_admin_security_matrix",
            "tfse_site_config_approval_package",
            "tfse_domain_cutover_package",
            "tfse_external_verification_evidence",
        ],
    }


def auth_cutover_report():
    site_config = site_config_tooling.load_site_config()
    backend = site_config.get("backend", {})
    api_configured = backend.get("mode") == "api" and site_config_tooling.is_https_url(backend.get("api_base_url", ""))
    security = admin_security_matrix_report()
    return {
        "format": "tfse_admin_auth_cutover_check",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "status": "ready_for_formal_auth_validation" if api_configured else "pending_formal_api_configuration",
        "privacy_note": "此包只保存端點、cookie/CSRF/RBAC 檢查、退場步驟與證據欄位，不保存密碼、session token、CSRF token、MFA code、完整手機或 Line ID。",
        "backend_mode": backend.get("mode", "localStorage"),
        "api_base_url_configured": api_configured,
        "endpoints": [
            {"method": "POST", "path": "/api/admin/auth/login", "expected": "驗證 email/password/MFA，簽發 httpOnly Secure SameSite session cookie，回傳 csrf_token 與角色權限摘要"},
            {"method": "GET", "path": "/api/admin/auth/session", "expected": "讀取 server session，回傳 admin_user、role、permissions、expires_at 與 csrf_token，不回傳 password_hash/session_hash"},
            {"method": "POST", "path": "/api/admin/auth/logout", "expected": "驗證 CSRF，撤銷 session，寫入 audit_logs"},
            {"method": "GET", "path": "/api/admin/security-matrix", "expected": "回傳角色權限、session/CSRF/MFA/audit/viewer masking 檢查結果"},
        ],
        "schema_tables": ["admin_users", "admin_sessions", "audit_logs", "admin_security_matrices"],
        "required_controls": [
            "密碼只保存 password_hash，不保存明文或可逆加密。",
            "session token 只保存 session_hash，cookie 必須 httpOnly、Secure、SameSite。",
            "CSRF token 只保存 csrf_token_hash，敏感 POST/PATCH/DELETE 必須驗證。",
            "MFA code 不得寫入 audit_logs、localStorage 或匯出包。",
            "Viewer 與非授權角色需遮罩完整手機、Line ID、Email 與備註。",
            "登入失敗、登出、角色拒絕、匯出、狀態更新與合規審核需寫入 audit_logs。",
            "正式 API 可用後，admin.html 的 MVP 驗證碼只可作本機 fallback，不得暴露正式管理入口。",
        ],
        "cutover_steps": [
            "部署正式 Auth API 與 admin_users/admin_sessions/audit_logs migration。",
            "建立首批 super_admin 與最小權限角色，啟用 MFA 或等效二次驗證策略。",
            "在 staging 測試 login/session/logout、CSRF、cookie 屬性、RBAC 拒絕與 Viewer 遮罩。",
            "填入 site-config.json > backend.mode=api 與 backend.api_base_url，重新跑 browser acceptance formal API smoke。",
            "確認前端不將密碼、MFA code、session token、csrf token 寫入 localStorage、審計或匯出包。",
            "正式切換後保存 checked_endpoint、status_code、cookie_flags、csrf_result、rbac_result、audit_log_id、reviewer_role 與 evidence_note。",
        ],
        "evidence_fields": ["checked_endpoint", "method", "status_code", "cookie_flags", "csrf_result", "rbac_result", "viewer_masking_result", "audit_log_id", "checked_at", "reviewer_role", "evidence_note"],
        "blockers": [
            item for item in [
                "site-config.json > backend.mode/api_base_url 尚未切到正式 HTTPS API。" if not api_configured else "",
                "仍需正式後端實作 server session、CSRF、RBAC、MFA、audit_logs 與 Viewer 遮罩。",
                "正式切換需外部/staging 環境驗證 cookie flags 與 CSRF，不可只用本機 localStorage MVP 宣告完成。",
            ] if item
        ],
        "related_exports": [
            "tfse_admin_security_matrix",
            "tfse_backend_acceptance_matrix",
            "tfse_production_env_template",
            "tfse_external_verification_evidence",
        ],
        "security_matrix_summary": {
            "roles": len(security["roles"]),
            "checks": len(security["checks"]),
            "blockers": len(security["blockers"]),
        },
    }


def backend_acceptance_trackable_items():
    return [
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


def backend_acceptance_report():
    site_config = site_config_tooling.load_site_config()
    backend = site_config.get("backend", {})
    config_items = site_config_tooling.config_readiness_items(site_config)
    api_configured = backend.get("mode") == "api" and bool(backend.get("api_base_url"))
    product_count = len(products())
    article_count = len([item for item in articles() if str(item.get("status") or "published") == "published"])
    records = load_seed_records("backend_acceptance_records")
    endpoints = [
        {
            **item,
            "latest_record": latest_record(records, lambda record, current_key=item["key"]: record.get("endpoint_key") == current_key),
        }
        for item in backend_acceptance_trackable_items()
    ]
    blockers = [
        item for item in [
            "backend.api_base_url 待填，mode 待切 api。" if not api_configured else "",
            "Turnstile site key / token 驗證待補。" if not next(item for item in config_items if item["key"] == "turnstile")["done"] else "",
            "正式 session、CSRF、RBAC、加密與備份待驗。",
            "真實 API、落庫、跨瀏覽器 CRM 待重驗。",
        ] if item
    ]
    return {
        "format": "tfse_backend_acceptance_matrix",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "backend_mode": backend.get("mode", "localStorage"),
        "api_base_url": backend.get("api_base_url", ""),
        "privacy_note": "只輸出端點、證據與阻擋項，不輸出個資。",
        "status": "ready_for_formal_api_validation" if api_configured else "pending_api_configuration",
        "summary": {
            "endpoints": len(endpoints),
            "api_configured": api_configured,
            "migration_seed_products": product_count,
            "migration_seed_articles": article_count,
            "local_leads_to_review": 0,
            "form_risk_notes": 0,
            "blockers": len(blockers),
            "tracked_count": sum(1 for item in endpoints if item.get("latest_record")),
            "passed_count": sum(1 for item in records if item.get("result") == "passed"),
            "blocked_count": sum(1 for item in records if item.get("result") == "blocked"),
        },
        "endpoints": endpoints,
        "records": records[:150],
        "record_summary": {
            "tracked_count": sum(1 for item in endpoints if item.get("latest_record")),
            "passed_count": sum(1 for item in records if item.get("result") == "passed"),
            "blocked_count": sum(1 for item in records if item.get("result") == "blocked"),
        },
        "required_validation": [
            "Admin Auth 需用 server session + CSRF。",
            "lead_forms 入庫並拒收高敏資料。",
            "Admin session、Viewer 遮罩。",
            "CRM/合規/個資/匯出/發布寫 audit_logs。",
            "每日備份與每週還原演練。",
            "API 異常不得用 localStorage 覆蓋正式資料。",
        ],
        "source_documents": ["PRODUCTION_BACKEND_PLAN.md", "api-contract.json", "backend-schema.sql", "DATA_MODEL.md"],
        "related_exports": [
            "tfse_formal_backend_migration_package",
            "tfse_form_risk_control_report",
            "tfse_production_config_readiness",
            "tfse_admin_auth_cutover_check",
        ],
        "blockers": blockers,
    }


def formal_backend_migration_report():
    site_config = site_config_tooling.load_site_config()
    backend = site_config.get("backend", {})
    seed_products = products()
    seed_articles = articles()
    seed_institutions = institutions()
    seed_landings = landing_pages()
    published_count = len(published_articles())
    source_review_pending = source_review_pending_count()
    api_configured = backend.get("mode") == "api" and site_config_tooling.is_https_url(backend.get("api_base_url", ""))
    blockers = [
        item for item in [
            "backend.api_base_url 尚未切到正式 HTTPS API。" if not api_configured else "",
            "來源復核仍有待處理項，正式匯入前需先完成或標記。" if source_review_pending else "",
            "正式去重、Turnstile 驗證、審計與個資請求同步仍需由後端落庫。",
        ] if item
    ]
    return {
        "format": "tfse_formal_backend_migration_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "exported_at": site_config_tooling.now_iso(),
        "exported_by_role": "data_manager",
        "source_mode": backend.get("mode", "localStorage"),
        "target_contract": "api-contract.json",
        "target_schema": "backend-schema.sql",
        "import_order": [
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
        ],
        "seed_data": {
            "institutions": len(seed_institutions),
            "products": len(seed_products),
            "articles": len(seed_articles),
            "landing_pages": len(seed_landings),
        },
        "local_state": {
            "leads": 0,
            "product_status": 0,
            "product_overrides": 0,
            "article_status": 0,
            "article_overrides": 0,
            "faq_overrides": 0,
            "content_versions": content_version_summary(),
            "compliance_reviews": 0,
            "audit": 0,
            "events": 0,
            "errors": 0,
            "event_replay": 0,
        },
        "review_queues": {
            "source_review": source_review_pending,
            "privacy_requests": 0,
            "line_segments": 0,
            "follow_ups": 0,
            "server_event_replay": 0,
        },
        "risk_controls": {
            "turnstile_frontend_enabled": bool(((site_config.get("security") or {}).get("turnstile") or {}).get("enabled")),
            "turnstile_site_key_configured": bool((((site_config.get("security") or {}).get("turnstile")) or {}).get("site_key")),
            "backend_api_configured": api_configured,
            "source_review_pending": source_review_pending,
        },
        "summary": {
            "seed_products": len(seed_products),
            "seed_articles": len(seed_articles),
            "seed_published_articles": published_count,
            "seed_institutions": len(seed_institutions),
            "seed_landing_pages": len(seed_landings),
            "local_leads": 0,
            "source_review_items": source_review_pending,
            "follow_up_items": 0,
        },
        "sensitive_data_policy": [
            "正式匯入前需排除 sample lead 或測試資料。",
            "手機與 Line ID 應於伺服器端加密或欄位級保護。",
            "不得匯入身分證字號、銀行帳號、信用卡號、密碼或證件影像。",
            "privacy_requests 需在正式資料庫同步刪除、遮罩或更正並留存必要審計。",
            "line_segments 僅可匯入已同意 Line 的潛客標籤。",
            "follow_ups 僅可供授權顧問或管理員查看，不得外露完整手機與 Line ID。",
        ],
        "blockers": blockers,
        "related_exports": [
            "tfse_import_validation_package",
            "tfse_content_api_cutover_package",
            "tfse_backup_restore_drill_plan",
            "tfse_backend_acceptance_matrix",
        ],
    }


def backup_restore_drill_report():
    site_config = site_config_tooling.load_site_config()
    backend = site_config.get("backend", {})
    config = site_config_tooling.config_readiness_items(site_config)
    api_configured = backend.get("mode") == "api" and bool(backend.get("api_base_url"))
    turnstile_ready = next(item for item in config if item["key"] == "turnstile")["done"]
    blockers = [
        item for item in [
            "正式 backend.api_base_url 尚未配置，仍不可宣告資料庫備份可用。" if not api_configured else "",
            "Turnstile 正式驗證待補，需避免垃圾資料進入備份。" if not turnstile_ready else "",
            "正式 PostgreSQL 每日備份任務需在雲端或伺服器排程建立並保存成功通知。",
            "每週還原演練需在隔離資料庫完成，不得覆蓋正式資料。",
            "備份 storage URL、checksum、加密/KMS 與保留週期需由正式環境產生證據。",
        ] if item
    ]
    return {
        "format": "tfse_backup_restore_drill_plan",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "data_manager",
        "status": "pending_external_backup_setup" if blockers else "ready_for_restore_drill",
        "privacy_note": "只輸出備份/還原計畫、統計與證據欄位，不輸出完整手機、Line ID、表單備註、資料庫 URL 或密鑰。",
        "backend_mode": backend.get("mode", "localStorage"),
        "api_base_url_configured": api_configured,
        "rpo_rto": {
            "rpo": "24h 內最後一次成功資料庫備份",
            "rto": "4h 內完成隔離資料庫還原、抽查與回報",
            "retention": "每日備份保留 30 天；每週備份保留 12 週；依雲端政策調整",
            "encryption": "備份檔需使用雲端 KMS 或等效伺服器端加密",
        },
        "schedule": [
            {"task": "daily_postgres_backup", "frequency": "daily", "owner": "data_manager", "evidence": "backup_jobs.status=success、storage_url、checksum、完成通知"},
            {"task": "weekly_restore_drill", "frequency": "weekly", "owner": "data_manager", "evidence": "隔離 DB 還原截圖/日誌、抽查表、RPO/RTO 結果"},
            {"task": "monthly_retention_review", "frequency": "monthly", "owner": "super_admin", "evidence": "過期備份清除紀錄、權限與 KMS 檢查"},
        ],
        "restore_steps": [
            "選擇最近一份非生產環境可用備份。",
            "還原到隔離資料庫，不覆蓋正式資料。",
            "執行 migration、enum、索引與權限檢查。",
            "抽查產品、文章、潛客數量、審計、個資請求、Line 分群與事件報表。",
            "記錄 RPO/RTO、checksum、演練人、發現問題與修正期限。",
        ],
        "evidence_fields": ["backup_job_id", "storage_url", "checksum", "started_at", "finished_at", "restored_to", "rpo_result", "rto_result", "reviewer", "findings"],
        "local_mvp_reference": {
            "local_backup_leads": 0,
            "local_backup_events": 0,
            "migration_seed_products": len(products()),
            "migration_seed_articles": len(articles()),
        },
        "blockers": blockers,
        "related_exports": [
            "tfse_local_backup",
            "tfse_formal_backend_migration_package",
            "tfse_import_validation_package",
            "tfse_backend_acceptance_matrix",
        ],
    }


def backup_receipt_verification_report():
    site_config = site_config_tooling.load_site_config()
    backend = site_config.get("backend", {})
    restore_plan = backup_restore_drill_report()
    api_configured = backend.get("mode") == "api" and bool(backend.get("api_base_url"))
    blockers = [
        item for item in [
            "正式 backend.api_base_url 尚未配置，無法驗證資料庫備份任務。" if not api_configured else "",
            "正式備份 job 成功收據需由資料庫或雲端排程產生。",
            "正式還原演練結果需在隔離資料庫完成後回填。",
            "checksum、storage_url、KMS/encryption 與 retention policy 需由正式環境提供證據。",
        ] if item
    ]
    return {
        "format": "tfse_backup_receipt_verification_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "data_manager",
        "status": "pending_backup_receipt_verification" if blockers else "ready_for_backup_receipt_verification",
        "privacy_note": "此包只保存正式備份/還原收據欄位、排程狀態與去識別抽查結果，不保存資料庫 URL、密鑰、完整手機、Line ID、表單備註或備份檔內容。",
        "backend_target": {
            "mode": backend.get("mode", "localStorage"),
            "api_base_url_configured": api_configured,
            "expected_tables": ["backup_jobs", "backup_restore_drill_results", "audit_logs"],
        },
        "required_receipts": [
            {"key": "daily_backup_success", "expected": "最近 24 小時內至少一筆 backup_jobs.status=success"},
            {"key": "checksum_recorded", "expected": "每份正式備份保存 checksum 並可比對"},
            {"key": "encrypted_storage", "expected": "storage 使用 KMS 或等效加密，權限最小化"},
            {"key": "weekly_restore_drill", "expected": "最近 7 天內完成隔離資料庫還原演練"},
            {"key": "audit_linkage", "expected": "備份、還原、失敗重試與權限調整寫入 audit_logs"},
        ],
        "receipt_fields": ["backup_job_id", "status", "started_at", "finished_at", "storage_url", "checksum", "size_bytes", "encryption_key_ref", "retention_until", "notification_id"],
        "restore_drill_fields": ["drill_id", "backup_job_id", "restored_to", "row_count_checks", "rpo_result", "rto_result", "sample_tables", "findings", "reviewer_role", "completed_at"],
        "validation_steps": [
            "確認最近每日備份 job 成功，失敗 job 有重試與告警紀錄。",
            "以 checksum 比對備份檔或雲端快照摘要，確認 storage_url 權限不公開。",
            "每週在隔離資料庫執行還原演練，不覆蓋正式資料。",
            "抽查 lead_forms、articles、financial_products、audit_logs、privacy_request_tasks 與 line_segment_tasks 筆數。",
            "將 backup receipt、restore drill 結果與 audit_log_id 保存到正式後端或運維系統。",
        ],
        "latest_plan_status": restore_plan["status"],
        "evidence_fields": ["checked_case", "backup_job_id", "restore_drill_id", "status", "audit_log_id", "screenshot_url", "reviewer_role", "checked_at", "evidence_note"],
        "blockers": blockers,
        "related_exports": [
            "tfse_backup_restore_drill_plan",
            "tfse_backend_acceptance_matrix",
            "tfse_external_verification_evidence",
            "tfse_data_retention_purge_plan",
        ],
    }


def content_api_cutover_report():
    site_config = site_config_tooling.load_site_config()
    backend = site_config.get("backend", {})
    version_counts = content_version_summary()
    product_count = len(products())
    article_count = len(articles())
    published_count = len(published_articles())
    institution_count = len(institutions())
    landing_count = len(landing_pages())
    source_pending = source_review_pending_count()
    api_configured = backend.get("mode") == "api" and bool(backend.get("api_base_url"))
    blockers = [
        item for item in [
            "正式 backend.api_base_url 尚未配置，前台仍以靜態 JSON 為主要資料來源。" if not api_configured else "",
            "products.json 無 seed 資料。" if not product_count else "",
            "尚無可供 API 發布的 published articles。" if not published_count else "",
            f"仍有 {source_pending} 筆產品來源待復核，正式 API 切換前需處理或標記。" if source_pending else "",
        ] if item
    ]
    return {
        "format": "tfse_content_api_cutover_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "content_editor",
        "status": "pending_content_api_cutover" if blockers else "ready_for_content_api_cutover",
        "privacy_note": "此包只保存公開內容、seed 數量、端點與驗收欄位，不保存潛客手機、Line ID、表單備註、後台 session 或 API token。",
        "backend_target": {
            "mode": backend.get("mode", "localStorage"),
            "api_base_url_configured": api_configured,
            "expected_public_endpoints": ["/api/products", "/api/products/:slug", "/api/articles", "/api/articles/:slug", "/api/institutions", "/api/search"],
            "static_fallback_files": ["assets/data/products.json", "assets/data/articles.json", "assets/data/faq.json", "assets/data/institutions.json"],
        },
        "seed_counts": {
            "products": product_count,
            "articles": article_count,
            "published_articles": published_count,
            "faq": len(load_json("faq.json", [])),
            "institutions": institution_count,
            "landing_pages": landing_count,
        },
        "content_state": {
            "product_overrides": version_counts["product_overrides"],
            "product_status_overrides": version_counts["product_status_overrides"],
            "article_overrides": version_counts["article_overrides"],
            "article_status_overrides": version_counts["article_status_overrides"],
            "faq_overrides": version_counts["faq_overrides"],
            "source_review_pending": source_pending,
        },
        "required_api_checks": [
            {"endpoint": "GET /api/products", "expected": "回傳公開產品列表，不包含後台覆蓋審計或個資"},
            {"endpoint": "GET /api/products/:slug", "expected": "slug、source_url、updated_at、status 與靜態詳情頁一致"},
            {"endpoint": "GET /api/articles", "expected": "只回傳 published 文章，不暴露 draft / in_review / rejected"},
            {"endpoint": "GET /api/articles/:slug", "expected": "SEO title、description、published_at、updated_at 可用"},
            {"endpoint": "GET /api/institutions", "expected": "官方來源 URL、verification_status 與 institution_source_versions 可追溯"},
            {"endpoint": "GET /api/search", "expected": "產品、文章、機構搜尋不回傳敏感資料或未發布內容"},
        ],
        "validation_steps": [
            "先匯出 tfse_content_version_snapshot，確認內容覆蓋與審計順序。",
            "在 staging 設定 backend.api_base_url，逐項比對靜態 JSON 與 API 回應的公開欄位。",
            "確認 articles API 只輸出 published 文章，前台 blog/detail 不可顯示草稿或退回內容。",
            "確認 source_url、updated_at、免責聲明與資料來源政策仍在前台可見。",
            "API 異常時前台可 fallback 靜態 seed，但不得把 localStorage 後台覆蓋誤當正式資料。",
        ],
        "evidence_fields": ["endpoint", "status_code", "row_count", "sample_slug", "matches_static_seed", "published_only", "source_url_checked", "audit_log_id", "reviewer_role", "checked_at", "evidence_note"],
        "blockers": blockers,
        "related_exports": [
            "tfse_content_version_snapshot",
            "tfse_institution_import_verification_package",
            "tfse_source_verification_evidence",
            "tfse_backend_acceptance_matrix",
            "tfse_external_verification_evidence",
        ],
    }


def turnstile_backend_verification_report():
    site_config = site_config_tooling.load_site_config()
    backend = site_config.get("backend", {})
    turnstile = (((site_config.get("security") or {}).get("turnstile")) or {})
    api_configured = backend.get("mode") == "api" and site_config_tooling.is_https_url(backend.get("api_base_url", ""))
    blockers = [
        item for item in [
            "正式 backend.api_base_url 尚未配置，無法驗證 POST /api/leads server-side siteverify。" if not api_configured else "",
            "Cloudflare Turnstile site_key 尚未啟用；前端 widget 不會強制產生 token。" if not (turnstile.get("enabled") and turnstile.get("site_key")) else "",
            "Turnstile secret key 只能存在正式 API server / secrets manager，不得寫入 site-config.json、前端或匯出包。",
            "仍需正式後端以 Cloudflare siteverify 驗證 cf_turnstile_response、remoteip、timeout-or-duplicate 與失敗碼。",
        ] if item
    ]
    return {
        "format": "tfse_turnstile_backend_verification_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "data_manager",
        "status": "pending_turnstile_backend_verification" if blockers else "ready_for_turnstile_backend_verification",
        "privacy_note": "此包只保存控制要求、測試步驟、失敗碼與證據欄位，不保存 Turnstile token、secret key、完整 IP、完整手機、Line ID 或備註。",
        "frontend_config": {
            "enabled": bool(turnstile.get("enabled")),
            "site_key_configured": bool(turnstile.get("site_key")),
            "token_field": "cf_turnstile_response",
            "honeypot_field": "website",
            "device_id_required": True,
        },
        "backend_target": {
            "endpoint": "/api/leads",
            "api_base_url_configured": api_configured,
            "siteverify_endpoint": "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            "secret_env_name": "TFSE_TURNSTILE_SECRET_KEY",
        },
        "required_controls": [
            "拒收空白 cf_turnstile_response。",
            "呼叫 Cloudflare siteverify，驗證 success、hostname/action 與錯誤碼。",
            "將 secret key 放在 API server secrets，不進 Git、不進前端、不進匯出包。",
            "非空 website 蜜罐欄位直接拒收並寫入 audit_logs。",
            "以 IP + device_id 對 POST /api/leads 做 10 分鐘與 24 小時限流。",
            "以 phone_hash + needs 做 24 小時去重，拒絕或關聯重複提交。",
            "拒收身分證、帳戶、卡號、密碼、證件影像等高敏資料。",
            "Turnstile 驗證失敗、限流、蜜罐、重複提交都需回傳安全錯誤並寫入去識別 audit_logs。",
        ],
        "negative_test_cases": [
            {"case_id": "missing_token", "payload_change": "cf_turnstile_response 空白", "expected": "400/403 rejected_turnstile_required"},
            {"case_id": "invalid_token", "payload_change": "cf_turnstile_response 使用無效字串", "expected": "400/403 rejected_turnstile_invalid"},
            {"case_id": "honeypot_filled", "payload_change": "website 欄位填入任意內容", "expected": "400 rejected_honeypot"},
            {"case_id": "rate_limit", "payload_change": "同 IP + device_id 連續提交超過限制", "expected": "429 rate_limited"},
            {"case_id": "duplicate_lead", "payload_change": "同 phone_hash + needs 24 小時內重複", "expected": "409 duplicate_or_linked"},
            {"case_id": "sensitive_payload", "payload_change": "message 含身分證/卡號/帳戶/密碼", "expected": "400 rejected_sensitive_data"},
        ],
        "validation_steps": [
            "部署正式 API 後，確認 TFSE_TURNSTILE_SECRET_KEY 只存在 server env 或 secrets manager。",
            "以瀏覽器提交正常免費財務健檢查詢，確認 widget token 送到 POST /api/leads 且 lead_forms 入庫。",
            "逐項執行 negative_test_cases，確認狀態碼、錯誤碼、audit_logs 與不入庫行為。",
            "抽查 server logs，確認沒有記錄 raw token、secret、完整 IP、完整手機或高敏 message。",
            "保存 checked_case、status_code、error_code、audit_log_id、lead_created、reviewer_role 與 evidence_note。",
        ],
        "evidence_fields": ["checked_case", "status_code", "error_code", "audit_log_id", "lead_created", "rate_limit_key_hash", "checked_at", "reviewer_role", "evidence_note"],
        "blockers": blockers,
        "related_exports": [
            "tfse_form_risk_control_report",
            "tfse_backend_acceptance_matrix",
            "tfse_admin_auth_cutover_check",
            "tfse_external_verification_evidence",
        ],
    }


def analytics_debug_verification_report():
    site_config = site_config_tooling.load_site_config()
    analytics = site_config.get("analytics", {})
    required_mappings = [
        {"local_event": "page_view", "ga4_event": "page_view", "meta_event": "PageView", "expected_payload": ["page_path", "utm_source"]},
        {"local_event": "cta_free_check_click", "ga4_event": "select_content", "meta_event": "Contact", "expected_payload": ["cta", "page_path"]},
        {"local_event": "lead_submit", "ga4_event": "generate_lead", "meta_event": "Lead", "expected_payload": ["needs", "utm_source", "consent_line"]},
        {"local_event": "line_cta_click", "ga4_event": "contact", "meta_event": "Contact", "expected_payload": ["line_oa_url", "utm_source"]},
        {"local_event": "site_search", "ga4_event": "search", "meta_event": "Search", "expected_payload": ["search_term"]},
        {"local_event": "database_filter", "ga4_event": "filter_database", "meta_event": "Search", "expected_payload": ["category", "audience"]},
    ]
    blockers = [
        item for item in [
            "GA4 Measurement ID 待填。" if not analytics.get("ga4_measurement_id") else "",
            "Meta Pixel ID 待填。" if not analytics.get("meta_pixel_id") else "",
            "尚未取得 analytics 追蹤同意，正式 GA4/Meta 不應收件。",
            "本機尚未觀測必要事件：" + "、".join(item["local_event"] for item in required_mappings),
        ] if item
    ]
    return {
        "format": "tfse_analytics_debug_verification_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "viewer",
        "status": "pending_analytics_debug_verification" if blockers else "ready_for_analytics_debug_verification",
        "privacy_note": "只輸出事件名稱、映射、配置狀態、UTM 鍵與證據欄位，不輸出手機、Line ID、姓名、Email、備註或其他高敏個資。",
        "destinations": {
            "ga4_measurement_id_configured": bool(analytics.get("ga4_measurement_id")),
            "meta_pixel_id_configured": bool(analytics.get("meta_pixel_id")),
            "server_event_endpoint_configured": bool(analytics.get("server_event_endpoint")),
            "analytics_consent_granted": False,
            "sample_rate": analytics.get("sample_rate", 1) or 1,
        },
        "event_mappings": [
            {
                "local_event": item["local_event"],
                "ga4_event": item["ga4_event"],
                "meta_event": item["meta_event"],
                "observed_count": 0,
                "expected_payload": item["expected_payload"],
            }
            for item in required_mappings
        ],
        "debug_steps": [
            "填入正式 GA4 Measurement ID 與 Meta Pixel ID 後，先在 staging 或正式小流量環境測試。",
            "接受 analytics 追蹤同意，確認 localStorage 有 tfse_tracking_consent 且事件 tracking_consent_update 已記錄。",
            "依序瀏覽首頁、資料庫、搜尋、篩選、免費財務健檢查詢提交與 Line CTA。",
            "在 GA4 Realtime / DebugView 檢查 page_view、generate_lead、search、contact 等事件。",
            "在 Meta Events Manager 檢查 PageView、Lead、Contact、Search，並確認 Event Match Quality 未使用敏感明文。",
            "若啟用 Server Event endpoint，與 tfse_server_event_replay_queue 對照事件名與去識別 payload。",
            "保存 platform、event_name、observed_at、result、debug_url、screenshot_url、reviewer_role 與 evidence_note。",
        ],
        "evidence_fields": ["platform", "event_name", "local_event", "observed_at", "result", "debug_url", "screenshot_url", "reviewer_role", "evidence_note"],
        "blockers": blockers,
        "related_exports": [
            "tfse_tracking_consent_audit",
            "tfse_server_event_replay_queue",
            "tfse_monitoring_receipt_checklist",
            "tfse_external_verification_evidence",
        ],
    }


def line_oa_setup_report():
    site_config = site_config_tooling.load_site_config()
    flows = line_flow_data()
    quick_replies = flows.get("quick_replies", [])
    records = [
        item for item in load_seed_records("line_oa_records")
        if item.get("phase") == "setup"
    ]
    return {
        "format": "tfse_line_oa_setup_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "source": "assets/data/line-flows.json",
        "line_oa_url": site_config.get("line", {}).get("oa_url", ""),
        "welcome_messages": flows.get("welcome", []),
        "rich_menu": [
            {
                "slot": index + 1,
                "label": reply.get("label"),
                "action_url": reply.get("free_check_href") or reply.get("href"),
                "tag": reply.get("tag"),
                "article_url": reply.get("article_href"),
                "database_url": reply.get("database_href"),
            }
            for index, reply in enumerate(quick_replies)
        ],
        "quick_replies": [
            {
                "label": reply.get("label"),
                "tag": reply.get("tag"),
                "primary_url": reply.get("href"),
                "reply": reply.get("reply"),
                "boundary": reply.get("boundary"),
                "article_url": reply.get("article_href"),
                "database_url": reply.get("database_href"),
                "free_check_url": reply.get("free_check_href"),
            }
            for reply in quick_replies
        ],
        "tags": flows.get("tags", []),
        "reply_principles": flows.get("reply_principles", []),
        "segment_sync_queue": [],
        "compliance_boundaries": [
            "Line OA 不得使用包過、保證核貸、快速放款、內部管道等話術",
            "每則自動回覆需保留 TFSE 僅整理公開資訊、不代辦、不代收證件、不保證核貸的邊界",
            "分群標籤只能套用於已同意 Line 的潛客",
            "不得在 Line 對話要求身分證、帳戶、卡號、密碼或證件影像",
            "使用者要求停止接收或刪除資料時，需同步個資請求隊列",
        ],
        "records": records[:150],
        "record_summary": {
            "tracked_count": len(records),
            "completed_count": sum(1 for item in records if item.get("result") == "completed"),
            "blocked_count": sum(1 for item in records if item.get("result") == "blocked"),
        },
        "setup_steps": [
            "建立 Line OA 歡迎語並貼上 welcome_messages",
            "依 rich_menu 建立 6 個主要入口，URL 保留 utm_source=line",
            "依 tags 建立需求、來源與分群標籤",
            "依 quick_replies 建立自動回覆，每則包含文章、資料庫與免費財務健檢查詢入口",
            "匯入 segment_sync_queue 前先確認 consent_line 為 true",
            "完成後將 site-config.json > line.oa_url 改成正式加友網址並重跑驗收",
        ],
        "related_exports": [
            "tfse_line_oa_handoff_check",
            "tfse_line_segment_queue",
            "tfse_line_optout_complaint_queue",
            "tfse_external_verification_evidence",
        ],
    }


def line_oa_handoff_report():
    site_config = site_config_tooling.load_site_config()
    setup = line_oa_setup_report()
    line = site_config.get("line", {})
    base = str(site_config.get("base_url") or "").rstrip("/")
    official_url = str(line.get("oa_url") or "")
    official_ready = official_url not in ("", "free-check.html#line-cta") and site_config_tooling.is_https_url(official_url)
    records = [
        item for item in load_seed_records("line_oa_records")
        if item.get("phase") == "handoff"
    ]
    cta_routes = [
        {"key": "handoff_route_1", "page": release_tooling.absolute_url(base, "free-check.html"), "selector": "#line-cta", "expected": "表單成功後顯示正式 Line OA 加友 CTA"},
        {"key": "handoff_route_2", "page": release_tooling.absolute_url(base, "index.html"), "selector": "[data-line-action]", "expected": "首頁 CTA 可導向免費財務健檢查詢或 Line 承接說明"},
        {"key": "handoff_route_3", "page": release_tooling.absolute_url(base, "lp.html"), "selector": "[data-line-action]", "expected": "廣告落地頁 Line CTA 保留 UTM 與合規邊界"},
        {"key": "handoff_route_4", "page": release_tooling.absolute_url(base, "contact.html"), "selector": "contact intake", "expected": "資料回報與 Line 承接不得要求高敏資料"},
    ]
    cta_routes = [
        {
            **item,
            "latest_record": latest_record(records, lambda record, current_key=item["key"]: record.get("task_key") == current_key),
        }
        for item in cta_routes
    ]
    blockers = [
        item for item in [
            "site-config.json > line.oa_url 尚未填入正式 HTTPS Line OA 加友網址。" if not official_ready else "",
            "line-flows.json quick_replies 不可為空。" if not setup["quick_replies"] else "",
            "line-flows.json welcome_messages 不可為空。" if not setup["welcome_messages"] else "",
            "Line OA 合規邊界需保留。" if not setup["compliance_boundaries"] else "",
        ] if item
    ]
    return {
        "format": "tfse_line_oa_handoff_check",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "status": "pending_line_oa_handoff" if blockers else "ready_for_line_oa_handoff_verification",
        "line_oa_url": official_url,
        "official_url_ready": official_ready,
        "source_files": ["site-config.json", "assets/data/line-flows.json", "free-check.html", "assets/js/tfse-line.js", "assets/js/tfse-lead-form.js"],
        "cta_routes": cta_routes,
        "quick_reply_checks": [
            {
                "label": reply.get("label"),
                "tag": reply.get("tag"),
                "primary_url": reply.get("primary_url"),
                "article_url": reply.get("article_url"),
                "database_url": reply.get("database_url"),
                "free_check_url": reply.get("free_check_url"),
                "expected_boundary": reply.get("boundary") or "保留 TFSE 僅整理公開資訊、不代辦、不保證核貸",
            }
            for reply in setup["quick_replies"]
        ],
        "handoff_steps": [
            "在 Line OA 後台建立歡迎語、圖文選單、quick reply、自動回覆與分群標籤。",
            "將 site-config.json > line.oa_url 改成正式 HTTPS 加友網址，重新跑 site-config 與瀏覽器驗收。",
            "提交一筆測試免費財務健檢查詢，確認成功訊息與 Line CTA 指向正式 Line OA。",
            "在手機瀏覽器點擊首頁、免費財務健檢查詢、落地頁與 Line quick reply，確認可開啟正式 Line OA。",
            "傳送停止接收、退訂、刪除資料等關鍵字，確認退訂/投訴隊列與個資請求升級流程。",
            "保存 checked_url、line_oa_url、device、result、screenshot_url、reviewer_role 與 evidence_note。",
        ],
        "evidence_fields": ["checked_url", "line_oa_url", "device", "utm_source", "result", "screenshot_url", "checked_at", "reviewer_role", "evidence_note"],
        "compliance_boundaries": setup["compliance_boundaries"],
        "records": records[:150],
        "record_summary": {
            "tracked_count": len(records),
            "completed_count": sum(1 for item in records if item.get("result") == "completed"),
            "blocked_count": sum(1 for item in records if item.get("result") == "blocked"),
        },
        "blockers": blockers,
        "related_exports": [
            "tfse_line_oa_setup_package",
            "tfse_line_segment_queue",
            "tfse_line_optout_complaint_queue",
            "tfse_external_verification_evidence",
            "tfse_legal_compliance_review_package",
        ],
    }
