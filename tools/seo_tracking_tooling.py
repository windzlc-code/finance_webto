from pathlib import Path
from urllib.parse import quote
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


def load_products():
    return load_json("products.json", [])


def load_articles():
    return load_json("articles.json", [])


def load_landing_pages():
    return load_json("landing-pages.json", [])


def load_line_flows():
    return load_json("line-flows.json", {})


def base_url(site_config):
    return str(site_config.get("base_url") or "").rstrip("/")


def absolute(base, path):
    base = str(base or "").rstrip("/")
    path = str(path or "").lstrip("/")
    if not base:
        return path or "/"
    return base + "/" + path if path else base + "/"


def published_articles():
    return [
        item for item in load_articles()
        if str(item.get("status") or "published") == "published"
    ]


def category_slugs():
    values = []
    for item in load_products():
        slug = item.get("category_slug") or item.get("category") or ""
        if slug and slug not in values:
            values.append(slug)
    return values


def seo_submission_report():
    site_config = site_config_tooling.load_site_config()
    base = base_url(site_config)
    search_console = site_config.get("search_console", {})
    canonical_pages = site_config.get("canonical_pages", [])
    products = load_products()
    articles = published_articles()
    landings = load_landing_pages()
    categories = category_slugs()
    return {
        "format": "tfse_seo_submission_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "source": "site-config.json + assets/data/products.json + assets/data/articles.json + assets/data/landing-pages.json",
        "base_url": base,
        "search_console": {
            "google_site_verification_configured": bool(search_console.get("google_site_verification")),
            "verification_source": "site-config.json > search_console.google_site_verification",
            "sitemap_submit_url": absolute(base, "sitemap.xml") if base else "正式 base_url 待填",
        },
        "assets": {
            "sitemap": absolute(base, "sitemap.xml"),
            "robots": absolute(base, "robots.txt"),
            "rss_feed": absolute(base, "feed.xml"),
            "security_txt": absolute(base, ".well-known/security.txt"),
            "manifest": absolute(base, "site.webmanifest"),
        },
        "counts": {
            "canonical_pages": len(canonical_pages),
            "products": len(products),
            "published_articles": len(articles),
            "categories": len(categories),
            "landing_pages": len(landings),
        },
        "canonical_pages": [
            {"path": page or "/", "url": absolute(base, page)}
            for page in canonical_pages
        ],
        "dynamic_url_patterns": [
            {
                "type": "product_detail",
                "example": absolute(base, "products/" + quote(products[0]["slug"]) + ".html") if products else absolute(base, "products/{slug}.html"),
                "count": len(products),
            },
            {
                "type": "article_detail",
                "example": absolute(base, "articles/" + quote(articles[0]["slug"]) + ".html") if articles else absolute(base, "articles/{slug}.html"),
                "count": len(articles),
            },
            {
                "type": "category_alias",
                "example": absolute(base, categories[0] + ".html") if categories else absolute(base, "{category}.html"),
                "count": len(categories),
            },
            {
                "type": "landing_alias",
                "example": absolute(base, "lp/" + landings[0]["slug"] + ".html") if landings else absolute(base, "lp/{slug}.html"),
                "count": len(landings),
            },
        ],
        "submission_steps": [
            "正式網域確認後，更新 site-config.json > base_url。",
            "填入 Google Search Console 驗證碼，執行 python3 tools/generate_seo_assets.py。",
            "執行 python3 tools/seo_assets_audit.py 與 python3 tools/verify_static_site.py，確認 canonical、OG、JSON-LD、RSS、robots 與 sitemap 同步。",
            "在 Search Console 驗證網域後提交 sitemap.xml。",
            "提交後抽查首頁、資料庫頁、文章頁、產品詳情與落地頁的 canonical 和結構化資料。",
        ],
        "blockers": [
            item for item in [
                "正式 base_url 待填" if not base else "",
                "Google Search Console 驗證碼待填" if not search_console.get("google_site_verification") else "",
                "canonical_pages 清單不可為空" if not canonical_pages else "",
            ] if item
        ],
        "related_exports": [
            "tfse_search_console_verification_package",
            "tfse_domain_cutover_package",
            "tfse_external_verification_evidence",
        ],
    }


def search_console_verification_report():
    submission = seo_submission_report()
    site_config = site_config_tooling.load_site_config()
    search_console = site_config.get("search_console", {})
    base = submission["base_url"]
    verification_token = str(search_console.get("google_site_verification") or "")
    records = load_seed_records("search_console_records")
    blockers = [
        item for item in [
            "正式 base_url 待填，Search Console 屬性不可用 GitHub Pages 臨時 URL 代替正式網域。" if not release_tooling.is_official_domain(base) else "",
            "Google Search Console 驗證碼待填。" if not verification_token else "",
            "canonical_pages 清單不可為空，需先重生 SEO 資產。" if not submission["counts"]["canonical_pages"] else "",
        ] if item
    ]
    samples = []
    for index, page in enumerate(submission["canonical_pages"][:6], 1):
        samples.append({
            "key": f"inspection_{index}",
            "type": "canonical_page",
            "path": page["path"],
            "url": page["url"],
            "expected": "URL is on Google 或已提交索引請求",
            "latest_record": latest_record(records, lambda record, current_key=f"inspection_{index}": record.get("target_key") == current_key),
        })
    start = len(samples)
    for index, item in enumerate(submission["dynamic_url_patterns"][:2], 1):
        samples.append({
            "key": f"inspection_{start + index}",
            "type": item["type"],
            "path": item["example"],
            "url": item["example"],
            "expected": "canonical 正確且無 duplicate selected canonical 問題",
            "latest_record": latest_record(records, lambda record, current_key=f"inspection_{start + index}": record.get("target_key") == current_key),
        })
    tracked_items = [
        {
            "key": "property_verify",
            "label": "Property 驗證",
            "type": "property",
            "target": base or "正式 base_url 待填",
            "expected": "Verify 通過",
            "latest_record": latest_record(records, lambda record: record.get("target_key") == "property_verify"),
        },
        {
            "key": "sitemap_submit",
            "label": "Sitemap 提交",
            "type": "sitemap",
            "target": absolute(base, "sitemap.xml") if base else "正式 base_url 待填",
            "expected": "sitemap submitted / success",
            "latest_record": latest_record(records, lambda record: record.get("target_key") == "sitemap_submit"),
        },
    ] + samples
    return {
        "format": "tfse_search_console_verification_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "status": "pending_search_console_verification" if blockers else "ready_for_search_console_submission",
        "property": {
            "recommended_type": "url_prefix",
            "base_url": base,
            "verification_method": "HTML meta tag",
            "verification_source": "site-config.json > search_console.google_site_verification",
            "verification_token_present": bool(verification_token),
        },
        "assets_to_regenerate": ["sitemap.xml", "robots.txt", "feed.xml", "site.webmanifest", "canonical meta", "Open Graph URL", "JSON-LD url"],
        "validation_commands": [
            "python3 tools/generate_seo_assets.py",
            "python3 tools/seo_assets_audit.py",
            "python3 tools/verify_static_site.py",
            "python3 tools/validate_site_config.py",
        ],
        "submission_targets": {
            "sitemap": absolute(base, "sitemap.xml") if base else "正式 base_url 待填",
            "robots": absolute(base, "robots.txt") if base else "正式 base_url 待填",
            "home": base or "正式 base_url 待填",
            "search_console_service": "https://search.google.com/search-console",
        },
        "verification_steps": [
            "在 Search Console 新增 URL prefix property，輸入正式 base_url。",
            "取得 HTML meta 驗證碼後填入 site-config.json > search_console.google_site_verification。",
            "重新生成 SEO 資產並跑 validation_commands。",
            "部署正式主機後在 Search Console 點擊 Verify。",
            "提交 sitemap.xml，並對首頁、database.html、articles.html、產品詳情與文章詳情使用 URL Inspection。",
            "保存 property_url、sitemap_url、verification_result、submitted_at、coverage_status 與 evidence_note。",
        ],
        "url_inspection_samples": samples,
        "tracked_items": tracked_items,
        "evidence_fields": ["property_url", "verification_method", "verification_result", "sitemap_url", "sitemap_status", "inspected_url", "coverage_status", "indexed_url", "last_crawl_time", "checked_at", "reviewer_role", "evidence_note"],
        "records": records[:150],
        "record_summary": {
            "tracked_count": sum(1 for item in tracked_items if item.get("latest_record")),
            "verified_count": sum(1 for item in records if item.get("result") == "verified"),
            "submitted_count": sum(1 for item in records if item.get("result") == "submitted"),
            "blocked_count": sum(1 for item in records if item.get("result") == "blocked"),
        },
        "blockers": blockers,
        "related_exports": [
            "tfse_seo_submission_package",
            "tfse_seo_indexing_followup_queue",
            "tfse_domain_cutover_package",
            "tfse_external_verification_evidence",
        ],
    }


def tracking_consent_report():
    site_config = site_config_tooling.load_site_config()
    analytics = site_config.get("analytics", {})
    external_configured = bool(
        analytics.get("ga4_measurement_id")
        or analytics.get("meta_pixel_id")
        or analytics.get("server_event_endpoint")
    )
    blockers = []
    if external_configured:
        blockers.append("正式外部追蹤已配置或待配置，但目前未取得 analytics 同意。")
    blockers.append("尚無 tracking_consent_update 本機事件留痕。")
    return {
        "format": "tfse_tracking_consent_audit",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "storage_key": "tfse_tracking_consent",
        "consent_status": "unset",
        "consent_record": None,
        "external_destinations": {
            "ga4": bool(analytics.get("ga4_measurement_id")),
            "meta_pixel": bool(analytics.get("meta_pixel_id")),
            "server_event_endpoint": bool(analytics.get("server_event_endpoint")),
            "sentry_error_reporting": bool(analytics.get("sentry_dsn")),
        },
        "event_counts": {"total_events": 0, "consent_updates": 0, "local_page_views": 0},
        "policy": {
            "local_events": "本機去識別事件可用於 MVP 復盤，不直接送往外部平台。",
            "external_analytics": "GA4、Meta Pixel 與 Server Event 需取得 analytics 同意後才轉發。",
            "error_reporting": "Sentry 僅收錯誤摘要，beforeSend 會遮罩敏感欄位。",
        },
        "blockers": blockers,
        "related_exports": [
            "tfse_retrospective_report",
            "tfse_monitoring_receipt_checklist",
            "tfse_external_verification_evidence",
            "tfse_legal_compliance_review_package",
        ],
    }


def monitoring_receipt_report():
    site_config = site_config_tooling.load_site_config()
    analytics = site_config.get("analytics", {})
    required = ["page_view", "cta_free_check_click", "database_search", "lead_submit", "line_cta_click"]
    missing = list(required)
    blockers = [
        item for item in [
            "GA4 Measurement ID 待填。" if not analytics.get("ga4_measurement_id") else "",
            "Meta Pixel ID 待填。" if not analytics.get("meta_pixel_id") else "",
            "Server Event endpoint 待填。" if not analytics.get("server_event_endpoint") else "",
            "Sentry DSN 待填。" if not analytics.get("sentry_dsn") else "",
            "本機尚未觀測事件：" + "、".join(missing) if missing else "",
        ] if item
    ]
    return {
        "format": "tfse_monitoring_receipt_checklist",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "privacy_note": "只輸出事件名、配置狀態與收件核對項，不輸出高敏個資。",
        "destinations": {
            "ga4": bool(analytics.get("ga4_measurement_id")),
            "meta_pixel": bool(analytics.get("meta_pixel_id")),
            "server_event_endpoint": bool(analytics.get("server_event_endpoint")),
            "sentry": bool(analytics.get("sentry_dsn")),
            "sample_rate": analytics.get("sample_rate", 1) or 1,
        },
        "summary": {
            "events": 0,
            "errors": 0,
            "required_events": len(required),
            "missing_required_events": len(missing),
            "blockers": len(blockers),
        },
        "required_events": required,
        "missing_required_events": missing,
        "receipt_checks": [
            "GA4 Realtime / DebugView 可看到必要事件。",
            "Meta Events Manager 可看到 PageView、Lead、Contact、Search。",
            "Server Event endpoint 可收到去識別 payload 並落庫。",
            "Sentry 可收到測試錯誤且 beforeSend 已遮罩個資。",
            "核對後在外部配置驗證留痕保存責任人與證據備註。",
        ],
        "blockers": blockers,
        "related_exports": [
            "tfse_server_event_replay_queue",
            "tfse_external_verification_evidence",
            "tfse_launch_health_check",
        ],
    }


def sentry_verification_report():
    site_config = site_config_tooling.load_site_config()
    analytics = site_config.get("analytics", {})
    backend = site_config.get("backend", {})
    blockers = [
        item for item in [
            "Sentry DSN 待填。" if not analytics.get("sentry_dsn") else "",
            "本機尚未觀測測試錯誤；正式驗收需觸發受控前台錯誤。",
            "正式後端 API 尚未配置；server-side Sentry 需於 API 上線後驗證。" if not backend.get("api_base_url") else "",
        ] if item
    ]
    return {
        "format": "tfse_sentry_error_verification_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "status": "pending_sentry_error_verification" if blockers else "ready_for_sentry_error_verification",
        "privacy_note": "此包只保存 DSN 是否配置、去識別錯誤摘要、驗收步驟與外部證據欄位；不得保存 stack trace 全文、cookie、session、完整手機、Line ID、備註或表單原文。",
        "destinations": {
            "browser_sentry_dsn_configured": bool(analytics.get("sentry_dsn")),
            "server_sentry_required": True,
            "api_base_url_configured": bool(backend.get("api_base_url")),
            "local_error_count": 0,
        },
        "required_controls": [
            "前台 Sentry Browser SDK 只在正式 DSN 配置後載入。",
            "beforeSend 或等效 hook 需遮罩 phone、line_id、message、cookie、authorization、token、cf_turnstile_response。",
            "正式 API 需啟用 server-side Sentry，並以環境標籤區分 production / staging。",
            "source map 若上傳到 Sentry，不得公開暴露於靜態站根目錄。",
            "P0/P1 錯誤需能連到 incident response 與 rollback 記錄。",
        ],
        "test_cases": [
            {"key": "browser_test_error", "expected": "Sentry issues 收到受控前台測試錯誤，payload 無敏感欄位"},
            {"key": "api_test_error", "expected": "正式 API staging 收到受控 server error，response 不暴露 stack trace"},
            {"key": "sensitive_payload_masking", "expected": "手機、Line ID、cookie、token、備註在 Sentry event 中被遮罩或移除"},
            {"key": "environment_tag", "expected": "environment、release、page_path 或 route 標籤可用於排查"},
            {"key": "incident_linkage", "expected": "P0/P1 測試事件可回填 incident_response_package 或 audit_logs"},
        ],
        "recent_local_errors": [],
        "evidence_fields": ["checked_case", "sentry_issue_id", "environment", "release", "masked_fields_verified", "screenshot_url", "reviewer_role", "checked_at", "evidence_note"],
        "blockers": blockers,
        "related_exports": [
            "tfse_monitoring_receipt_checklist",
            "tfse_incident_response_package",
            "tfse_external_verification_evidence",
            "tfse_host_fallback_deployment_check",
        ],
    }
