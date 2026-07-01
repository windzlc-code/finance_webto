from html.parser import HTMLParser
from pathlib import Path
from xml.etree import ElementTree as ET
import json
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "site-config.json"
REQUIRED_DISCLAIMER = "本中心僅彙整公開合法金融商品"
REQUIRED_FILES = (
    "_headers",
    "404.html",
    "500.html",
    ".well-known/security.txt",
    ".github/workflows/tfse-acceptance.yml",
    "DEPLOYMENT.md",
    "LAUNCH_CHECKLIST.md",
    "DATA_MODEL.md",
    "PRODUCTION_BACKEND_PLAN.md",
    "SCLAW_COMPARISON.md",
    "TFSE_TEMPLATE_MAPPING.md",
    "OPERATIONS_RUNBOOK.md",
    "api-contract.json",
    "backend-schema.sql",
    "articles.html",
    "contact.html",
    "contact-us.html",
    "assets/data/institutions.json",
    "assets/data/line-flows.json",
    "assets/data/browser-acceptance-evidence.json",
    "assets/data/admin-record-seeds.json",
    "assets/data/bank-club.json",
    "assets/images/bank-club/bank_club_line_qr.png",
    "assets/images/bank-club/bank_club_logo.png",
    "assets/images/bank-club/home_hero_office.jpg",
    "assets/js/bank-club-admin.js",
    "assets/js/tfse-api.js",
    "assets/js/tfse-faq.js",
    "assets/js/tfse-home-query.js",
    "assets/js/tfse-institutions.js",
    "assets/js/tfse-line.js",
    "assets/js/tfse-public-feedback.js",
    "database.html",
    "mortgage.html",
    "credit-loan.html",
    "vehicle-finance.html",
    "installment.html",
    "credit-union.html",
    "debt-law.html",
    "insurance-finance.html",
    "anti-fraud.html",
    "feed.xml",
    "favicon.ico",
    "free-check.html",
    "robots.txt",
    "search.html",
    "site-config.json",
    "site.webmanifest",
    "sitemap.xml",
    "tools/acceptance_audit.py",
    "tools/accessibility_audit.py",
    "tools/admin_export_cli_coverage_audit.py",
    "tools/admin_auth_cutover_check.py",
    "tools/analytics_debug_verification_package.py",
    "tools/admin_cutover_tooling.py",
    "tools/admin_security_matrix.py",
    "tools/api_contract_audit.py",
    "tools/backup_receipt_verification_package.py",
    "tools/backup_restore_drill_plan.py",
    "tools/backend_acceptance_matrix.py",
    "tools/backend_cutover_roadmap.py",
    "tools/backend_schema_audit.py",
    "tools/browser_acceptance_report.py",
    "tools/browser_acceptance_verify.mjs",
    "tools/bank_club_deployment_manifest.py",
    "tools/bank_club_integration_smoke.mjs",
    "tools/checklist_artifact_coverage_audit.py",
    "tools/content_api_cutover_package.py",
    "tools/crm_capability_audit.py",
    "tools/mock_formal_api.py",
    "tools/data_quality_audit.py",
    "tools/domain_cutover_package.py",
    "tools/external_verification_evidence.py",
    "tools/formal_config_input_packet.py",
    "tools/external_execution_packet.py",
    "tools/formal_backend_migration_package.py",
    "tools/generate_seo_assets.py",
    "tools/host_fallback_deployment_check.py",
    "tools/https_ingress_fix_package.py",
    "tools/incident_response_package.py",
    "tools/launch_health_check.py",
    "tools/launch_cutover_audit.py",
    "tools/launch_countdown_plan.py",
    "tools/launch_execution_plan.py",
    "tools/launch_handoff_manifest.py",
    "tools/operations_task_queue.py",
    "tools/project_plan_coverage_audit.py",
    "tools/operations_runbook_audit.py",
    "tools/plan_closure_report.py",
    "tools/performance_budget_audit.py",
    "tools/monitoring_receipt_checklist.py",
    "tools/navigation_consistency_audit.py",
    "tools/production_env_template.py",
    "tools/production_config_readiness.py",
    "tools/project_phase_audit.py",
    "tools/production_config_audit.py",
    "tools/release_readiness_package.py",
    "tools/release_tooling.py",
    "tools/search_console_verification_package.py",
    "tools/sentry_error_verification_package.py",
    "tools/seo_submission_package.py",
    "tools/seo_tracking_tooling.py",
    "tools/security_headers_deployment_check.py",
    "tools/sclaw_comparison_audit.py",
    "tools/site_config_tooling.py",
    "tools/site_config_approval_package.py",
    "tools/site_config_update_package.py",
    "tools/seo_assets_audit.py",
    "tools/source_freshness_audit.py",
    "tools/tracking_consent_audit.py",
    "tools/turnstile_backend_verification_package.py",
    "tools/validate_site_config.py",
    "tools/line_oa_handoff_check.py",
    "tools/line_oa_setup_package.py",
)
TEMPLATE_RESIDUALS = (
    "模板首頁",
    "网站模板",
    "mobanwang",
    "Exomac",
    "Buy Now",
    "Lorem ipsum",
    "Subscribe Now",
    "We are an agency located in New York",
    "We think strategy",
    "Our team of designers",
    "Designing awesome brands",
    "Creative agency focused",
    "We create a unique action plan",
    "First impressions count",
    "Branding is more than",
    "What exactly is branding",
    "What’s the branding process",
    "What type of creative services",
    "You’ve got questions",
    "Years Experience",
    "Active Projects",
    "Projects Done",
    "Satisfied Clients",
)


class LinkParser(HTMLParser):
    def __init__(self, file_path):
        super().__init__()
        self.file_path = file_path
        self.links = []
        self.images = []
        self.meta = {}
        self.title = ""
        self._in_title = False
        self.base_href = ""

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "title":
            self._in_title = True
        if tag == "meta":
            name = data.get("name") or data.get("property")
            if name:
                self.meta[name] = data.get("content", "")
        if tag == "link" and data.get("rel") == "canonical":
            self.meta["canonical"] = data.get("href", "")
        if tag == "base" and data.get("href"):
            self.base_href = data.get("href", "")
        if tag == "img":
            self.images.append(data)
        for key in ("href", "src"):
            value = data.get(key)
            if value:
                self.links.append((tag, key, value, data))

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def is_local_asset(value):
    lower = value.lower()
    if lower.startswith(("http://", "https://", "mailto:", "tel:", "#", "javascript:", "data:")):
        return False
    if value.startswith("//"):
        return False
    target = value.split("#", 1)[0].split("?", 1)[0]
    return bool(target and not target.endswith("/"))


def html_paths():
    return (
        sorted(ROOT.glob("*.html"))
        + sorted((ROOT / "lp").glob("*.html"))
        + sorted((ROOT / "database").glob("*.html"))
        + sorted((ROOT / "products").glob("*.html"))
        + sorted((ROOT / "articles").glob("*.html"))
    )


def verify_html():
    failures = []
    for path in html_paths():
        text = path.read_text(errors="ignore")
        parser = LinkParser(path)
        parser.feed(text)
        label = path.relative_to(ROOT).as_posix()
        if not parser.title.strip():
            failures.append(f"{label}: missing title")
        for key in ("description", "canonical", "og:title", "og:description", "og:url"):
            if not parser.meta.get(key):
                failures.append(f"{label}: missing {key}")
        if REQUIRED_DISCLAIMER not in text and path.name != "admin.html":
            failures.append(f"{label}: missing disclaimer")
        for image in parser.images:
            alt = image.get("alt", "").strip()
            if not alt:
                failures.append(f"{label}: image missing alt text {image.get('src', '')}")
            if alt.lower() in ("image", "logo image", "team images") or alt.endswith(" Image"):
                failures.append(f"{label}: residual template image alt {alt}")
        for word in TEMPLATE_RESIDUALS:
            if word in text:
                failures.append(f"{label}: residual template text {word}")
        for tag, key, value, attrs in parser.links:
            if key == "href" and value == "#":
                classes = set(attrs.get("class", "").split())
                if "scroll-top" not in classes:
                    failures.append(f"{label}: placeholder href on <{tag}>")
            if not is_local_asset(value):
                continue
            base_dir = path.parent
            if parser.base_href:
                base_dir = (path.parent / parser.base_href).resolve()
            target = base_dir / value.split("#", 1)[0].split("?", 1)[0]
            if not target.exists():
                failures.append(f"{label}: missing asset {value}")
    return failures


def verify_required_files():
    failures = []
    for name in REQUIRED_FILES:
        if not (ROOT / name).exists():
            failures.append(f"{name}: missing required file")
    for page in config().get("canonical_pages", []):
        target = "index.html" if page == "" else page
        if not (ROOT / target).exists():
            failures.append(f"site-config.json: canonical page {target} does not exist")
    return failures


def config():
    try:
        return json.loads(CONFIG_PATH.read_text())
    except Exception:
        return {}


def base_url():
    return str(config().get("base_url", "")).rstrip("/")


def verify_data():
    failures = []
    for name in ("products.json", "articles.json", "categories.json", "landing-pages.json", "faq.json", "compliance-rules.json", "institutions.json", "line-flows.json", "bank-club.json", "browser-acceptance-evidence.json", "source-verification-evidence.json", "admin-record-seeds.json"):
        try:
            json.loads((ROOT / "assets" / "data" / name).read_text())
        except Exception as error:
            failures.append(f"{name}: {error}")
    try:
        contract = json.loads((ROOT / "api-contract.json").read_text())
        endpoints = {(item.get("method"), item.get("path")) for item in contract.get("endpoints", [])}
        required = {
            ("GET", "/api/products"),
            ("GET", "/api/products/:slug"),
            ("GET", "/api/articles"),
            ("GET", "/api/articles/:slug"),
            ("POST", "/api/leads"),
            ("POST", "/api/bank-club/leads"),
            ("POST", "/api/events"),
            ("GET", "/api/search"),
            ("POST", "/api/admin/auth/login"),
            ("GET", "/api/admin/auth/session"),
            ("POST", "/api/admin/auth/logout"),
            ("GET", "/api/admin/leads"),
            ("GET", "/api/admin/bank-club/leads"),
            ("PATCH", "/api/admin/leads/:id/status"),
            ("PATCH", "/api/admin/bank-club/leads/:id/status"),
            ("GET", "/api/admin/leads/follow-ups"),
            ("POST", "/api/admin/compliance/review"),
            ("GET", "/api/admin/audit-logs"),
            ("GET", "/api/admin/reports/retrospective"),
            ("GET", "/api/admin/reports/utm-attribution"),
            ("GET", "/api/admin/reports/server-event-replay"),
            ("GET", "/api/admin/ad-campaigns"),
            ("GET", "/api/admin/launch-health"),
            ("GET", "/api/admin/release-readiness"),
            ("GET", "/api/admin/operations-tasks"),
            ("GET", "/api/admin/incident-response-package"),
            ("GET", "/api/admin/seo-submission-package"),
            ("GET", "/api/admin/search-console-verification-package"),
            ("GET", "/api/admin/seo-indexing-followup-queue"),
            ("GET", "/api/admin/config-readiness"),
            ("GET", "/api/admin/domain-cutover-package"),
            ("GET", "/api/admin/host-fallback-deployment-check"),
            ("GET", "/api/admin/backend-acceptance-matrix"),
            ("GET", "/api/admin/acceptance-checklist"),
            ("GET", "/api/admin/external-verification-evidence"),
            ("GET", "/api/admin/browser-acceptance-report"),
            ("GET", "/api/admin/legal-compliance-review"),
            ("GET", "/api/admin/form-risk-control"),
            ("GET", "/api/admin/source-review-queue"),
            ("GET", "/api/admin/content-version-snapshot"),
            ("GET", "/api/admin/privacy-requests"),
            ("PATCH", "/api/admin/privacy-requests/:lead_id"),
            ("GET", "/api/admin/line-segments"),
        }
        for endpoint in sorted(required - endpoints):
            failures.append(f"api-contract.json: missing {endpoint[0]} {endpoint[1]}")
        lead_endpoint = next((item for item in contract.get("endpoints", []) if item.get("method") == "POST" and item.get("path") == "/api/leads"), {})
        for field in ("income_type", "utm_content", "utm_term", "device_id", "website", "cf_turnstile_response"):
            if field not in lead_endpoint.get("request", []):
                failures.append(f"api-contract.json: POST /api/leads missing request field {field}")
        for rule in ("website honeypot must be empty", "turnstile token required when enabled", "rate limit by IP + device_id", "deduplicate same phone + needs within 24 hours"):
            if rule not in lead_endpoint.get("validation", []):
                failures.append(f"api-contract.json: POST /api/leads missing validation {rule}")
        if "landing_page_view" not in (ROOT / "PRODUCTION_BACKEND_PLAN.md").read_text():
            failures.append("PRODUCTION_BACKEND_PLAN.md: missing landing_page_view event")
        if "site_search" not in (ROOT / "assets/js/tfse-search.js").read_text():
            failures.append("tfse-search.js: missing site_search event")
        compliance_rules = json.loads((ROOT / "assets/data/compliance-rules.json").read_text())
        for term in ("包過", "保證核貸", "快速放款", "內部管道", "額度保證", "秒審", "免審核", "不看聯徵", "黑戶可過", "低利保證", "代收證件", "送件"):
            if term not in compliance_rules.get("forbidden_terms", []):
                failures.append(f"compliance-rules.json: missing forbidden term {term}")
        for word in ("防詐", "不得", "不", "禁止", "若遇到", "提高警覺", "高風險"):
            if word not in compliance_rules.get("allowed_contexts", []):
                failures.append(f"compliance-rules.json: missing allowed context {word}")
        compliance_scan = (ROOT / "tools/compliance_scan.py").read_text(errors="ignore")
        for marker in ("compliance-rules.json", "forbidden_hits", "allowed_contexts", "CONTEXT_WINDOW", "DISPLAY_DATA_FILES", "json_forbidden_hits", "assets/data/landing-pages.json"):
            if marker not in compliance_scan:
                failures.append(f"compliance_scan.py: missing rules-driven marker {marker}")
        data_quality_audit = (ROOT / "tools/data_quality_audit.py").read_text(errors="ignore")
        for marker in ("data quality audit passed", "audit_landing_pages", "audit_line_flows", "valid_url_or_local", "expected at least 40 first-batch articles"):
            if marker not in data_quality_audit:
                failures.append(f"data_quality_audit.py: missing data quality marker {marker}")
        api_contract_audit = (ROOT / "tools/api_contract_audit.py").read_text(errors="ignore")
        for marker in ("api contract audit passed", "LEAD_REQUIRED_REQUEST", "LEAD_REQUIRED_VALIDATION", "mutating admin endpoint must return audit_log", "Cloudflare Turnstile"):
            if marker not in api_contract_audit:
                failures.append(f"api_contract_audit.py: missing API contract marker {marker}")
        performance_audit = (ROOT / "tools/performance_budget_audit.py").read_text(errors="ignore")
        for marker in ("performance budget audit passed", "MAX_DIRECT_ASSET_BYTES", "CRITICAL_PAGES", "audit_global_assets"):
            if marker not in performance_audit:
                failures.append(f"performance_budget_audit.py: missing performance budget marker {marker}")
        backend_schema_audit = (ROOT / "tools/backend_schema_audit.py").read_text(errors="ignore")
        for marker in ("backend schema audit passed", "REQUIRED_TABLES", "LEAD_FORM_FIELDS", "sensitive lead field", "idx_audit_logs_action_created_at"):
            if marker not in backend_schema_audit:
                failures.append(f"backend_schema_audit.py: missing backend schema marker {marker}")
        products = json.loads((ROOT / "assets/data/products.json").read_text())
        if len(products) < 30:
            failures.append("products.json: expected at least 30 example product records")
        product_slugs = set()
        for item in products:
            slug = item.get("slug", "")
            if slug in product_slugs:
                failures.append(f"products.json: duplicate slug {slug}")
            product_slugs.add(slug)
            for field in ("id", "title", "slug", "type", "type_label", "category", "category_label", "source_title", "source_url", "updated_at", "status", "summary"):
                if not item.get(field):
                    failures.append(f"products.json: {item.get('id', 'unknown')} missing {field}")
            if not isinstance(item.get("checks"), list) or len(item.get("checks", [])) < 3:
                failures.append(f"products.json: {item.get('id', 'unknown')} expected at least 3 checks")
        institutions = json.loads((ROOT / "assets/data/institutions.json").read_text())
        if len(institutions) < 5:
            failures.append("institutions.json: expected at least 5 public sources")
        for item in institutions:
            for field in ("id", "name", "type", "official_url", "verification_status", "last_verified_at"):
                if not item.get(field):
                    failures.append(f"institutions.json: {item.get('id', 'unknown')} missing {field}")
        articles = json.loads((ROOT / "assets/data/articles.json").read_text())
        if len(articles) < 40:
            failures.append("articles.json: expected at least 40 first-batch SEO articles")
        published_articles = [item for item in articles if item.get("status") == "published"]
        if len(published_articles) < 40:
            failures.append("articles.json: expected first-batch SEO articles to be published")
        article_slugs = set()
        for item in articles:
            slug = item.get("slug", "")
            if slug in article_slugs:
                failures.append(f"articles.json: duplicate slug {slug}")
            article_slugs.add(slug)
            for field in ("id", "title", "slug", "category", "seo_description", "summary", "keywords", "compliance_note", "status"):
                if not item.get(field):
                    failures.append(f"articles.json: {item.get('id', 'unknown')} missing {field}")
            if item.get("status") not in ("published", "draft", "in_review", "archived"):
                failures.append(f"articles.json: {item.get('id', 'unknown')} invalid status {item.get('status')}")
    except Exception as error:
        failures.append(f"api-contract.json: {error}")
    return failures


def verify_template_mapping():
    failures = []
    text = (ROOT / "TFSE_TEMPLATE_MAPPING.md").read_text(errors="ignore")
    for marker in (
        "不重新设计网站",
        "页面角色映射",
        "模板区块映射",
        "数据与脚本映射",
        "验收与运维映射",
        "保留模板不重设计的边界",
        "index.html",
        "database.html",
        "free-check.html",
        "admin.html",
        "tfse-lead-form.js",
        "browser_acceptance_verify.mjs",
    ):
        if marker not in text:
            failures.append(f"TFSE_TEMPLATE_MAPPING.md: missing mapping marker {marker}")
    return failures


def verify_backend_schema():
    failures = []
    text = (ROOT / "backend-schema.sql").read_text(errors="ignore")
    for marker in (
        "create extension if not exists pgcrypto",
        "create type admin_role",
        "create table admin_users",
        "create table admin_sessions",
        "create table admin_security_matrices",
        "create type lead_status",
        "create table institutions",
        "create table financial_products",
        "create table articles",
        "create table lead_forms",
        "phone_encrypted",
        "consent_privacy = true",
        "create table privacy_request_tasks",
        "create table line_segment_tasks",
        "create table compliance_reviews",
        "create table audit_logs",
        "create table backup_jobs",
        "idx_lead_events_name_created_at",
    ):
        if marker not in text:
            failures.append(f"backend-schema.sql: missing schema marker {marker}")
    return failures


def verify_operations_runbook():
    failures = []
    runbook = (ROOT / "OPERATIONS_RUNBOOK.md").read_text(errors="ignore")
    for marker in (
        "保留 Exomac 前端模板，不重新設計網站",
        "python3 tools/compliance_scan.py",
        "python3 tools/data_quality_audit.py",
        "python3 tools/checklist_artifact_coverage_audit.py --markdown",
        "python3 tools/crm_capability_audit.py --markdown",
        "python3 tools/production_env_template.py --markdown",
        "python3 tools/production_config_readiness.py --markdown",
        "python3 tools/site_config_update_package.py --markdown",
        "python3 tools/site_config_approval_package.py --markdown",
        "python3 tools/api_contract_audit.py",
        "python3 tools/backend_schema_audit.py",
        "python3 tools/performance_budget_audit.py",
        "python3 tools/navigation_consistency_audit.py",
        "python3 tools/sclaw_comparison_audit.py --markdown",
        "python3 tools/accessibility_audit.py",
        "python3 tools/validate_site_config.py",
        "python3 tools/acceptance_audit.py",
        "python3 tools/launch_cutover_audit.py",
        "python3 tools/backend_cutover_roadmap.py --markdown",
        "python3 tools/launch_execution_plan.py --markdown",
        "python3 tools/launch_countdown_plan.py --markdown",
        "python3 tools/formal_config_input_packet.py --markdown",
        "python3 tools/plan_closure_report.py --markdown",
        "python3 tools/project_plan_coverage_audit.py --markdown",
        "python3 tools/external_execution_packet.py --markdown",
        "python3 tools/launch_handoff_manifest.py --markdown",
        "tools/browser_acceptance_verify.mjs",
        "python3 tools/operations_runbook_audit.py",
        "python3 tools/verify_static_site.py",
        "GA4",
        "Search Console",
        "Line OA",
        "Sentry",
        "Turnstile",
        "backend.api_base_url",
        "backup",
        "restore drill",
        "rollback",
        "incident",
        "legal / compliance",
    ):
        if marker not in runbook:
            failures.append(f"OPERATIONS_RUNBOOK.md: missing runbook marker {marker}")
    return failures


def verify_ci_workflow():
    failures = []
    workflow = (ROOT / ".github/workflows/tfse-acceptance.yml").read_text(errors="ignore")
    for marker in (
        "TFSE acceptance",
        "actions/checkout@v4",
        "actions/setup-python@v5",
        "actions/setup-node@v4",
        "playwright@1.61.0",
        "python3 tools/compliance_scan.py",
        "python3 tools/data_quality_audit.py",
        "python3 tools/checklist_artifact_coverage_audit.py --markdown",
        "python3 tools/crm_capability_audit.py --markdown",
        "python3 tools/production_env_template.py --markdown",
        "python3 tools/production_config_readiness.py --markdown",
        "python3 tools/site_config_update_package.py --markdown",
        "python3 tools/site_config_approval_package.py --markdown",
        "python3 tools/api_contract_audit.py",
        "python3 tools/backend_schema_audit.py",
        "python3 tools/performance_budget_audit.py",
        "python3 tools/navigation_consistency_audit.py",
        "python3 tools/sclaw_comparison_audit.py --markdown",
        "python3 tools/accessibility_audit.py",
        "python3 tools/validate_site_config.py",
        "python3 tools/acceptance_audit.py",
        "python3 tools/launch_cutover_audit.py",
        "python3 tools/backend_cutover_roadmap.py --markdown",
        "python3 tools/launch_execution_plan.py --markdown",
        "python3 tools/launch_countdown_plan.py --markdown",
        "python3 tools/formal_config_input_packet.py --markdown",
        "python3 tools/plan_closure_report.py --markdown",
        "python3 tools/project_plan_coverage_audit.py --markdown",
        "python3 tools/external_execution_packet.py --markdown",
        "python3 tools/launch_handoff_manifest.py --markdown",
        "python3 tools/browser_acceptance_report.py --markdown",
        "python3 tools/operations_runbook_audit.py",
        "python3 tools/verify_static_site.py",
        "node tools/browser_acceptance_verify.mjs",
    ):
        if marker not in workflow:
            failures.append(f"tfse-acceptance.yml: missing CI marker {marker}")
    return failures


def verify_page_roles():
    failures = []
    index_text = (ROOT / "index.html").read_text(errors="ignore")
    for marker in ("data-home-query", "data-home-query-need", "data-home-query-results", "assets/js/tfse-home-query.js", "先整理需求，再回到公開來源確認"):
        if marker not in index_text:
            failures.append(f"index.html: missing home query marker {marker}")
    home_query_script = (ROOT / "assets/js/tfse-home-query.js").read_text(errors="ignore")
    for marker in ("assets/data/categories.json", "assets/data/articles.json", "home_query_recommendation", "free-check.html?needs=", "utm_medium=home_query"):
        if marker not in home_query_script:
            failures.append(f"tfse-home-query.js: missing home query marker {marker}")
    contact_text = (ROOT / "contact.html").read_text(errors="ignore")
    if "聯絡我們｜TFSE金融便民中心" not in contact_text or "聯絡 TFSE 金融便民中心" not in contact_text:
        failures.append("contact.html: expected contact page role")
    for marker in ("資料刪除請求", "資料更正請求", "手機末三碼"):
        if marker not in contact_text:
            failures.append(f"contact.html: missing privacy request marker {marker}")
    privacy_text = (ROOT / "privacy.html").read_text(errors="ignore")
    for marker in ("資料刪除請求", "資料更正請求", "手機末三碼"):
        if marker not in privacy_text:
            failures.append(f"privacy.html: missing privacy request marker {marker}")
    cta_pattern = re.compile(r'href="contact\.html"[^>]*>(?:開始|前往|返回)?免費(?:財務)?健檢</a>')
    for path in sorted(ROOT.glob("*.html")):
        for match in cta_pattern.finditer(path.read_text(errors="ignore")):
            failures.append(f"{path.name}: free-check CTA points to contact-us.html at {match.start()}")
    for path in sorted((ROOT / "assets/js").glob("tfse-*.js")):
        for match in cta_pattern.finditer(path.read_text(errors="ignore")):
            failures.append(f"{path.name}: free-check CTA points to contact-us.html at {match.start()}")
    return failures


def verify_admin_crm_filters():
    failures = []
    admin_html = (ROOT / "admin.html").read_text(errors="ignore")
    for marker in ("data-admin-search", "data-admin-status", "data-admin-tag", "data-admin-source", "全部標籤", "全部來源"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing CRM filter marker {marker}")
    admin_script = (ROOT / "assets/js/tfse-admin.js").read_text(errors="ignore")
    for marker in ("tagFilter", "sourceFilter", "matchesTag", "matchesSource", "data-admin-tag", "data-admin-source"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing CRM filter marker {marker}")
    browser_verify = (ROOT / "tools/browser_acceptance_verify.mjs").read_text(errors="ignore")
    for marker in ("admin lead need tag filter", "admin lead source filter", "admin lead status filter", "utm_medium=paid_social"):
        if marker not in browser_verify:
            failures.append(f"browser_acceptance_verify.mjs: missing CRM browser marker {marker}")
    return failures


def verify_lead_forms():
    failures = []
    required_field_names = (
        "display_name",
        "phone",
        "line_id",
        "region",
        "needs",
        "occupation_type",
        "income_type",
        "source_url",
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
        "cf_turnstile_response",
        "consent_privacy",
        "consent_line",
        "website",
    )
    static_form_pages = ("index.html", "index-2.html", "free-check.html")
    for name in static_form_pages:
        text = (ROOT / name).read_text(errors="ignore")
        for field in required_field_names:
            if f'name="{field}"' not in text:
                failures.append(f"{name}: missing lead form field {field}")
        if "data-lead-submit" not in text:
            failures.append(f"{name}: missing explicit lead submit button")

    landing_script = (ROOT / "assets/js/tfse-landing-pages.js").read_text(errors="ignore")
    for marker in ("slugFromPath", "landingPath", "window.location.pathname", "renderFreeCheckEntry", "tfse-unique-entry", "前往唯一免費財務健檢查詢入口"):
        if marker not in landing_script:
            failures.append(f"tfse-landing-pages.js: missing landing alias marker {marker}")

    lead_script = (ROOT / "assets/js/tfse-lead-form.js").read_text(errors="ignore")
    lead_requirements = (
        "SUBMIT_COOLDOWN_MS",
        "form.checkValidity()",
        "form.reportValidity()",
        "findRecentDuplicate",
        "tfse_last_lead_submit_at",
        "tfse_device_id",
        "device_id",
        "form.elements.website",
        "turnstileConfig",
        "loadTurnstileScript",
        "cf_turnstile_response",
        "income_type",
        "lead_submit",
    )
    for marker in lead_requirements:
        if marker not in lead_script:
            failures.append(f"tfse-lead-form.js: missing {marker}")
    config_security = config().get("security", {}).get("turnstile", {})
    for key in ("site_key", "enabled"):
        if key not in config_security:
            failures.append(f"site-config.json: missing security.turnstile.{key}")
    return failures


def verify_sitemap():
    failures = []
    try:
        tree = ET.parse(ROOT / "sitemap.xml")
    except Exception as error:
        return [f"sitemap.xml: {error}"]
    xml = (ROOT / "sitemap.xml").read_text()
    base = base_url()
    if base and f"Sitemap: {base}/sitemap.xml" not in (ROOT / "robots.txt").read_text():
        failures.append("robots.txt: sitemap URL does not match site-config.json")
    if base and f"<loc>{base}/" not in xml:
        failures.append("sitemap.xml: URLs do not match site-config.json")
    for page in config().get("canonical_pages", []):
        expected = f"{base}/" if page == "" else f"{base}/{page}"
        if base and expected not in xml:
            failures.append(f"sitemap.xml: missing canonical page {page or '/'}")
    for slug in re.findall(r'"slug":\s*"([^"]+)"', (ROOT / "assets/data/articles.json").read_text()):
        if slug not in xml:
            failures.append(f"sitemap.xml: missing article slug {slug}")
    for slug in re.findall(r'"slug":\s*"([^"]+)"', (ROOT / "assets/data/products.json").read_text()):
        if slug not in xml:
            failures.append(f"sitemap.xml: missing product slug {slug}")
    for slug in re.findall(r'"slug":\s*"([^"]+)"', (ROOT / "assets/data/categories.json").read_text()):
        if slug not in xml:
            failures.append(f"sitemap.xml: missing category slug {slug}")
    for slug in re.findall(r'"slug":\s*"([^"]+)"', (ROOT / "assets/data/landing-pages.json").read_text()):
        if slug not in xml:
            failures.append(f"sitemap.xml: missing landing page slug {slug}")
        if f"lp/{slug}.html" not in xml:
            failures.append(f"sitemap.xml: missing landing alias lp/{slug}.html")
    if not tree.getroot().tag.endswith("urlset"):
        failures.append("sitemap.xml: root is not urlset")
    try:
        feed_tree = ET.parse(ROOT / "feed.xml")
    except Exception as error:
        failures.append(f"feed.xml: {error}")
        return failures
    feed_root = feed_tree.getroot()
    if feed_root.tag != "rss":
        failures.append("feed.xml: root is not rss")
    feed_text = (ROOT / "feed.xml").read_text(errors="ignore")
    if base and f"<link>{base}/</link>" not in feed_text:
        failures.append("feed.xml: site link does not match site-config.json")
    published_articles = [
        item for item in json.loads((ROOT / "assets/data/articles.json").read_text())
        if item.get("status") == "published"
    ]
    if feed_text.count("<item>") < len(published_articles):
        failures.append("feed.xml: missing published article items")
    for item in published_articles:
        if item.get("slug") and item["slug"] not in feed_text:
            failures.append(f"feed.xml: missing article slug {item['slug']}")
    return failures


def verify_site_urls():
    failures = []
    base = base_url()
    if not base.startswith("https://"):
        failures.append("site-config.json: base_url must be https")
        return failures
    search_console = config().get("search_console", {})
    if "google_site_verification" not in search_console:
        failures.append("site-config.json: missing search_console.google_site_verification")
    google_site_verification = str(search_console.get("google_site_verification", "")).strip()
    og_image = config().get("og_image", "")
    expected_image = f"{base}/{og_image.lstrip('/')}" if og_image else ""
    for path in html_paths():
        parser = LinkParser(path)
        parser.feed(path.read_text(errors="ignore"))
        canonical = parser.meta.get("canonical", "")
        og_url = parser.meta.get("og:url", "")
        og_image_url = parser.meta.get("og:image", "")
        if canonical and not canonical.startswith(base):
            failures.append(f"{path.name}: canonical does not match site-config.json")
        if og_url and not og_url.startswith(base):
            failures.append(f"{path.name}: og:url does not match site-config.json")
        if expected_image and og_image_url != expected_image:
            failures.append(f"{path.name}: og:image does not match site-config.json")
        if 'type="application/rss+xml"' not in path.read_text(errors="ignore"):
            failures.append(f"{path.relative_to(ROOT).as_posix()}: missing RSS alternate link")
        text = path.read_text(errors="ignore")
        for marker in ('rel="manifest" href="site.webmanifest"', 'name="theme-color" content="#1292ee"', 'rel="apple-touch-icon" href="assets/images/favicon.png"'):
            if text.count(marker) != 1:
                failures.append(f"{path.relative_to(ROOT).as_posix()}: expected exactly one {marker}")
        if text.count('id="tfse-structured-data"') != 1:
            failures.append(f"{path.relative_to(ROOT).as_posix()}: expected exactly one structured data block")
        structured_match = re.search(r'<script\s+type="application/ld\+json"\s+id="tfse-structured-data">(.*?)</script>', text, re.IGNORECASE | re.DOTALL)
        if not structured_match:
            failures.append(f"{path.relative_to(ROOT).as_posix()}: missing structured data JSON-LD")
        else:
            try:
                structured_data = json.loads(structured_match.group(1))
            except Exception as error:
                failures.append(f"{path.relative_to(ROOT).as_posix()}: invalid structured data JSON-LD {error}")
            else:
                types = {item.get("@type") for item in structured_data.get("@graph", []) if isinstance(item, dict)}
                if "Organization" not in types or "WebSite" not in types or "WebPage" not in types:
                    failures.append(f"{path.relative_to(ROOT).as_posix()}: structured data missing Organization/WebSite/WebPage")
        if google_site_verification and parser.meta.get("google-site-verification") != google_site_verification:
            failures.append(f"{path.relative_to(ROOT).as_posix()}: missing Google Search Console verification meta")
    for name in ("tfse-categories.js", "tfse-products.js", "tfse-landing-pages.js", "tfse-articles.js"):
        text = (ROOT / "assets" / "js" / name).read_text(errors="ignore")
        if "windzlc-code.github.io/finance_webto" in text and "windzlc-code.github.io/finance_webto" not in base:
            failures.append(f"{name}: contains old GitHub Pages base URL")
    generator = (ROOT / "tools/generate_seo_assets.py").read_text(errors="ignore")
    for marker in ("google_site_verification", "google-site-verification", "update_rss_feed", "feed.xml", "application/rss+xml", "tfse-structured-data", "schema.org", "SearchAction", "update_security_txt", ".well-known/security.txt", "update_app_manifest_links", "site.webmanifest", "theme-color"):
        if marker not in generator:
            failures.append(f"generate_seo_assets.py: missing SEO asset marker {marker}")
    seo_audit = (ROOT / "tools/seo_assets_audit.py").read_text(errors="ignore")
    for marker in ("tools/generate_seo_assets.py", "SEO assets audit passed", "not in sync", "TemporaryDirectory"):
        if marker not in seo_audit:
            failures.append(f"seo_assets_audit.py: missing SEO audit marker {marker}")
    validator = (ROOT / "tools/validate_site_config.py").read_text(errors="ignore")
    for marker in ("backend.api_base_url", "analytics.ga4_measurement_id", "line.oa_url", "canonical_pages", "site-config validation passed"):
        if marker not in validator:
            failures.append(f"validate_site_config.py: missing config validation marker {marker}")
    acceptance_audit = (ROOT / "tools/acceptance_audit.py").read_text(errors="ignore")
    for marker in ("tfse_acceptance_audit", "TFSE project plan chapters 17 and 21", "manual_browser", "external_pending"):
        if marker not in acceptance_audit:
            failures.append(f"acceptance_audit.py: missing acceptance audit marker {marker}")
    browser_report = (ROOT / "tools/browser_acceptance_report.py").read_text(errors="ignore")
    for marker in ("tfse_browser_acceptance_report", "manual_browser", "no_text_overlap", "form_submit_browser", "mobile_browser", "public_feedback_intake"):
        if marker not in browser_report:
            failures.append(f"browser_acceptance_report.py: missing browser acceptance marker {marker}")
    browser_verify = (ROOT / "tools/browser_acceptance_verify.mjs").read_text(errors="ignore")
    for marker in ("tfse_browser_acceptance_verify", "textFitInfo", " text fit ", "mobile menu opens with TFSE links", "mobile submenu expands", "mobile menu closes", "admin mobile menu opens", "admin mobile menu closes", "admin search overlay open close", "lead submission and UTM capture", "public feedback local submission", "formal API public feedback submission", "admin lead follow-up update and audit", "Line quick reply compliance links", "tracking consent banner accept", "admin security matrix export", "admin security headers deployment check export", "admin compliance copy scan", "admin compliance review save with scan payload", "admin retrospective export", "admin tracking consent export", "admin UTM attribution export", "admin server event replay export", "admin monitoring receipt checklist export", "admin launch health export", "admin launch cutover audit export", "admin launch execution plan export", "admin launch countdown plan export", "admin release readiness export", "admin local audit matrix export", "admin operations task queue export", "admin incident response export", "admin SEO submission export", "admin Search Console verification export", "admin Search Console trace save", "admin config readiness export", "admin formal config input packet export", "admin formal config input save", "admin domain cutover package export", "admin host fallback deployment check export", "admin backend roadmap export", "admin backend acceptance matrix export", "admin backend acceptance trace save", "admin acceptance checklist export", "admin project plan coverage export", "admin project phase audit export", "admin external execution packet export", "admin external execution save", "admin launch handoff manifest export", "admin launch handoff checkpoint save", "admin external verification evidence save", "admin external verification evidence export", "admin browser acceptance trace save", "admin browser acceptance report export", "admin source verification evidence save", "admin source review export", "admin source verification evidence export", "admin public feedback API verification export", "admin legal compliance review export", "admin legal compliance API persistence export", "admin form risk control export", "admin ad campaign checklist export", "admin conversion optimization backlog export", "admin privacy and Line queues", "admin privacy request export", "admin privacy fulfillment verification export", "admin Line segment export", "admin CRM follow-up export", "admin lead dedupe queue export", "admin CRM contact log export", "admin CRM API persistence export", "admin content version export", "admin privacy request completion", "admin local backup export", "admin import validation package export", "admin local backup import restore drill", "document.documentElement.scrollWidth"):
        if marker not in browser_verify:
            failures.append(f"browser_acceptance_verify.mjs: missing browser smoke marker {marker}")
    crm_capability_tool = (ROOT / "tools/crm_capability_audit.py").read_text(errors="ignore")
    for marker in ("tfse_crm_capability_audit", "TFSE project plan section 11 + phase 5", "admin_login", "search_name_phone", "source_page_utm", "formal_api_followup"):
        if marker not in crm_capability_tool:
            failures.append(f"crm_capability_audit.py: missing marker {marker}")
    accessibility_audit = (ROOT / "tools/accessibility_audit.py").read_text(errors="ignore")
    for marker in ("accessibility audit passed", "aria-live", "REQUIRED_LEAD_FIELDS", "html lang"):
        if marker not in accessibility_audit:
            failures.append(f"accessibility_audit.py: missing accessibility marker {marker}")
    return failures


def verify_web_manifest():
    failures = []
    try:
        manifest = json.loads((ROOT / "site.webmanifest").read_text())
    except Exception as error:
        return [f"site.webmanifest: {error}"]
    for key in ("name", "short_name", "description", "start_url", "display", "background_color", "theme_color", "icons"):
        if key not in manifest:
            failures.append(f"site.webmanifest: missing {key}")
    if manifest.get("lang") != "zh-TW":
        failures.append("site.webmanifest: lang should be zh-TW")
    if manifest.get("display") != "standalone":
        failures.append("site.webmanifest: display should be standalone")
    icons = manifest.get("icons", [])
    icon_srcs = {item.get("src") for item in icons if isinstance(item, dict)}
    for src in ("assets/images/favicon.png", "assets/images/logo/tfse-logo.png"):
        if src not in icon_srcs:
            failures.append(f"site.webmanifest: missing icon {src}")
        elif not (ROOT / src).exists():
            failures.append(f"site.webmanifest: icon file missing {src}")
    return failures


def verify_security_headers():
    failures = []
    headers = (ROOT / "_headers").read_text(errors="ignore")
    required_headers = (
        "X-Content-Type-Options: nosniff",
        "X-Frame-Options: DENY",
        "Referrer-Policy: strict-origin-when-cross-origin",
        "Permissions-Policy:",
        "Content-Security-Policy:",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
        "/assets/*",
        "Cache-Control: public, max-age=31536000, immutable",
        "/site-config.json",
        "Cache-Control: no-store",
        "/feed.xml",
        "/.well-known/security.txt",
    )
    for marker in required_headers:
        if marker not in headers:
            failures.append(f"_headers: missing {marker}")
    for domain in ("www.googletagmanager.com", "connect.facebook.net", "browser.sentry-cdn.com", "challenges.cloudflare.com"):
        if domain not in headers:
            failures.append(f"_headers: missing CSP domain {domain}")
    security_txt = (ROOT / ".well-known/security.txt").read_text(errors="ignore")
    for marker in ("Contact: mailto:info@tfse.tw", "Preferred-Languages: zh-TW, en", "Canonical:", "Policy:", "Expires:"):
        if marker not in security_txt:
            failures.append(f"security.txt: missing {marker}")
    if "source-policy.html" not in security_txt:
        failures.append("security.txt: policy should point to source-policy.html")
    return failures


def verify_monitoring():
    failures = []
    analytics = config().get("analytics", {})
    for key in ("ga4_measurement_id", "server_event_endpoint", "meta_pixel_id", "sentry_dsn", "sample_rate"):
        if key not in analytics:
            failures.append(f"site-config.json: missing analytics.{key}")

    events_script = (ROOT / "assets/js/tfse-events.js").read_text(errors="ignore")
    for marker in (
        "window.TFSETrack",
        "window.TFSEReportError",
        "tfse_events",
        "tfse_errors",
        "tfse_tracking_consent",
        "hasAnalyticsConsent",
        "renderTrackingConsentBanner",
        "tracking_consent_update",
        "TFSETrackingConsent",
        "sensitiveKeys",
        "ga4_measurement_id",
        "server_event_endpoint",
        "meta_pixel_id",
        "connect.facebook.net/en_US/fbevents.js",
        "trackCustom",
        "PageView",
        "Lead",
        "Search",
        "sentry_dsn",
        "beforeSend",
        "cta_free_check_click",
        "database.html",
        "free-check.html",
        "line_cta_click",
    ):
        if marker not in events_script:
            failures.append(f"tfse-events.js: missing monitoring marker {marker}")

    admin_script = (ROOT / "assets/js/tfse-admin.js").read_text(errors="ignore")
    data_model = (ROOT / "DATA_MODEL.md").read_text(errors="ignore")
    for marker in (
        "tfse_errors",
        "line_cta_click",
        "buildRetrospectiveReport",
        "tfse_retrospective_report",
        "retrospective_export",
        "trackingConsentPayload",
        "tfse_tracking_consent_audit",
        "tracking_consent_export",
        "eventReplayPayload",
        "tfse_server_event_replay_queue",
        "event_replay_export",
        "monitoringReceiptPayload",
        "tfse_monitoring_receipt_checklist",
        "monitoring_receipt_export",
        "sentryVerificationPayload",
        "tfse_sentry_error_verification_package",
        "sentry_verification_export",
        "analyticsDebugPayload",
        "tfse_analytics_debug_verification_package",
        "analytics_debug_export",
        "configDraftPayload",
        "tfse_site_config_update_package",
        "config_draft_export",
        "configApprovalPayload",
        "tfse_site_config_approval_package",
        "config_approval_export",
        "envTemplatePayload",
        "tfse_production_env_template",
        "env_template_export",
        "data-admin-retrospective-export",
        "conversionRate",
        "next_actions",
    ):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing analytics marker {marker}")
    admin_html = (ROOT / "admin.html").read_text(errors="ignore")
    for marker in ("data-admin-retrospective-export", "data-admin-tracking-consent-export", "data-admin-attribution", "data-admin-attribution-export", "data-admin-event-replay", "data-admin-event-replay-export", "data-admin-monitoring-receipt-export", "data-admin-analytics-debug-export", "data-admin-sentry-verification-export", "data-admin-config-draft-export", "data-admin-config-approval-export", "data-admin-env-template-export", "data-admin-follow-ups", "data-admin-follow-ups-export", "data-admin-contact-log-export", "data-admin-crm-api-export", "data-admin-content-versions", "data-admin-content-versions-export", "匯出復盤報告", "匯出追蹤同意檢查包", "數據復盤摘要", "UTM 與投流歸因", "匯出歸因報表", "事件上報重放隊列", "匯出事件重放隊列", "匯出監控收件驗收包", "匯出 GA4/Meta Debug 驗證包", "匯出 Sentry 錯誤收件驗收包", "匯出 site-config 更新包", "匯出配置變更簽核包", "匯出環境變數模板", "CRM 待跟進隊列", "匯出跟進隊列", "匯出聯繫紀錄", "匯出 CRM API 落庫驗收包", "內容版本紀錄", "匯出內容版本紀錄"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing analytics marker {marker}")
    for marker in ("followUpItems", "followUpPayload", "tfse_crm_follow_up_queue", "follow_up_export", "contactLogPayload", "tfse_crm_contact_log", "contact_log_export", "crmApiPersistencePayload", "tfse_crm_api_persistence_package", "crm_api_persistence_export", "leadDedupePayload", "tfse_lead_dedupe_queue", "lead_dedupe_export", "next_follow_up_at", "data-detail-contact-channel", "data-detail-contact-outcome"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing follow-up marker {marker}")
    for marker in ("data-admin-lead-dedupe", "data-admin-lead-dedupe-export", "CRM 重複線索合併建議", "匯出重複線索處理隊列"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing lead dedupe marker {marker}")
    if "lead_contact_logs" not in data_model:
        failures.append("DATA_MODEL.md: missing lead_contact_logs model")
    if "lead_dedupe_queues" not in data_model:
        failures.append("DATA_MODEL.md: missing lead_dedupe_queues model")
    if "crm_api_persistence_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing crm_api_persistence_packages model")
    if "create table crm_api_persistence_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing crm_api_persistence_packages table")
    if "/api/admin/crm-api-persistence-package" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing CRM API persistence endpoint")
    if "create table lead_dedupe_queues" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing lead_dedupe_queues table")
    if "/api/admin/leads/dedupe-queue" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing lead dedupe endpoint")
    for marker in ("contentVersionPayload", "tfse_content_version_snapshot", "content_version_export", "restore_order", "content_version_snapshots", "contentApiCutoverPayload", "tfse_content_api_cutover_package", "content_api_cutover_export", "content_api_cutover_packages"):
        if marker not in admin_script + data_model:
            failures.append(f"content version marker missing {marker}")
    admin_html = (ROOT / "admin.html").read_text(errors="ignore")
    for marker in ("data-admin-content-api-export", "匯出內容 API 切換驗收包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing content api marker {marker}")
    if "create table content_api_cutover_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing content_api_cutover_packages table")
    if "/api/admin/content-api-cutover-package" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing content api cutover endpoint")
    for marker in ("attributionPayload", "tfse_utm_attribution_report", "attribution_export", "utm_standard", "paid_social_leads"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing attribution marker {marker}")
    if "server_event_replay_batches" not in data_model:
        failures.append("DATA_MODEL.md: missing server_event_replay_batches model")
    if "monitoring_receipt_checklists" not in data_model:
        failures.append("DATA_MODEL.md: missing monitoring_receipt_checklists model")
    if "sentry_error_verification_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing sentry_error_verification_packages model")
    if "analytics_debug_verification_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing analytics_debug_verification_packages model")
    if "site_config_update_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing site_config_update_packages model")
    if "site_config_approval_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing site_config_approval_packages model")
    if "production_env_templates" not in data_model:
        failures.append("DATA_MODEL.md: missing production_env_templates model")
    if "create table monitoring_receipt_checklists" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing monitoring_receipt_checklists table")
    if "create table sentry_error_verification_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing sentry_error_verification_packages table")
    if "create table analytics_debug_verification_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing analytics_debug_verification_packages table")
    if "create table site_config_update_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing site_config_update_packages table")
    if "create table site_config_approval_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing site_config_approval_packages table")
    if "create table production_env_templates" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing production_env_templates table")
    if "/api/admin/reports/server-event-replay" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing server event replay endpoint")
    if "/api/admin/reports/monitoring-receipt-checklist" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing monitoring receipt endpoint")
    if "/api/admin/reports/sentry-error-verification" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing sentry error verification endpoint")
    if "/api/admin/reports/analytics-debug-verification" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing analytics debug verification endpoint")
    if "/api/admin/site-config-approval-package" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing site config approval endpoint")
    if "/api/admin/site-config-update-package" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing site config update endpoint")
    if "/api/admin/production-env-template" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing production env template endpoint")
    for marker in ("data-admin-launch-health", "data-admin-launch-health-export", "上線健康檢查", "匯出健康檢查清單"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing launch health marker {marker}")
    for marker in ("launchHealthItems", "launchHealthPayload", "tfse_launch_health_check", "launch_health_export", "Search Console 驗證碼", "Sentry DSN"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing launch health marker {marker}")
    for marker in ("data-admin-launch-cutover-audit", "data-admin-launch-cutover-audit-export", "正式切換阻擋項隊列", "匯出正式切換阻擋項"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing launch cutover marker {marker}")
    for marker in ("launchCutoverAuditPayload", "tfse_launch_cutover_audit", "launch_cutover_audit_export", "pending_external_input", "ready_for_external_execution", "pending_human_review"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing launch cutover marker {marker}")
    for marker in ("data-admin-local-audit-matrix", "data-admin-local-audit-matrix-export", "本機驗收命令對照", "匯出本機驗收命令對照"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing local audit marker {marker}")
    for marker in ("localAuditMatrixPayload", "tfse_local_audit_matrix", "local_audit_matrix_export", "python3 tools/checklist_artifact_coverage_audit.py --markdown", "python3 tools/production_env_template.py --markdown", "python3 tools/production_config_readiness.py --markdown", "python3 tools/site_config_update_package.py --markdown", "python3 tools/site_config_approval_package.py --markdown", "python3 tools/launch_health_check.py --markdown", "python3 tools/domain_cutover_package.py --markdown", "python3 tools/host_fallback_deployment_check.py --markdown", "python3 tools/https_ingress_fix_package.py --markdown", "python3 tools/seo_submission_package.py --markdown", "python3 tools/search_console_verification_package.py --markdown", "python3 tools/tracking_consent_audit.py --markdown", "python3 tools/monitoring_receipt_checklist.py --markdown", "python3 tools/sentry_error_verification_package.py --markdown", "python3 tools/admin_export_cli_coverage_audit.py --markdown", "python3 tools/security_headers_deployment_check.py --markdown", "python3 tools/admin_security_matrix.py --markdown", "python3 tools/admin_auth_cutover_check.py --markdown", "python3 tools/backend_acceptance_matrix.py --markdown", "python3 tools/line_oa_setup_package.py --markdown", "python3 tools/line_oa_handoff_check.py --markdown", "python3 tools/formal_backend_migration_package.py --markdown", "python3 tools/backup_restore_drill_plan.py --markdown", "python3 tools/backup_receipt_verification_package.py --markdown", "python3 tools/content_api_cutover_package.py --markdown", "python3 tools/turnstile_backend_verification_package.py --markdown", "python3 tools/analytics_debug_verification_package.py --markdown", "python3 tools/backend_cutover_roadmap.py --markdown", "python3 tools/plan_closure_report.py --markdown", "python3 tools/external_verification_evidence.py --markdown", "python3 tools/release_readiness_package.py --markdown", "python3 tools/operations_task_queue.py --markdown", "python3 tools/incident_response_package.py --markdown", "ready_with_external_follow_up", "ready_with_manual_follow_up", "LAUNCH_CHECKLIST / OPERATIONS_RUNBOOK local verification commands"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing local audit marker {marker}")
    for marker in ("data-admin-launch-execution-plan", "data-admin-launch-execution-plan-export", "上線執行計畫", "匯出上線執行計畫", "data-admin-launch-countdown-plan", "data-admin-launch-countdown-plan-export", "上線倒數計畫", "匯出上線倒數計畫"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing launch plan marker {marker}")
    for marker in ("launchExecutionPlanPayload", "tfse_launch_execution_plan", "launch_execution_plan_export", "wave_0_prepare_inputs", "wave_3_signoff", "launchCountdownPlanPayload", "tfse_launch_countdown_plan", "launch_countdown_plan_export", "d_minus_3", "go_live", "manual_checks"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing launch plan marker {marker}")
    for marker in ("data-admin-release-readiness", "data-admin-release-readiness-export", "發布凍結與回滾包", "匯出發布交接包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing release readiness marker {marker}")
    for marker in ("releaseReadinessPayload", "tfse_release_readiness_package", "release_readiness_export", "rollback_plan", "required_commands", "handoff_notes"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing release readiness marker {marker}")
    for marker in ("data-admin-plan-coverage", "data-admin-plan-coverage-export", "計畫文檔覆蓋度對賬", "匯出計畫覆蓋報告", "data-admin-plan-requirements", "data-admin-plan-requirements-export", "匯出逐條需求追蹤", "data-admin-plan-closure", "data-admin-plan-closure-export", "計畫閉環狀態總表", "匯出閉環狀態總表", "data-admin-external-execution", "data-admin-external-execution-records", "data-admin-external-execution-form", "data-admin-external-execution-export", "外部執行交接隊列", "匯出外部執行交接包", "data-admin-launch-handoff", "data-admin-launch-handoff-records", "data-admin-launch-handoff-form", "data-admin-launch-handoff-export", "最終上線總交接清單", "匯出總交接清單"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing handoff marker {marker}")
    for marker in ("data-admin-owner-cutover-bundle", "data-admin-owner-cutover-bundle-export", "Owner 切站任務包", "匯出 Owner 切站任務包", "data-admin-release-day-runsheet", "data-admin-release-day-runsheet-export", "匯出上線日 Run Sheet"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing owner/run sheet marker {marker}")
    for marker in ("data-admin-phase-audit", "data-admin-phase-audit-export", "模板套用階段對賬", "匯出階段對賬"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing phase audit marker {marker}")
    for marker in ("projectPlanCoveragePayload", "planRequirementTracePayload", "tfse_project_plan_coverage_report", "tfse_plan_requirement_trace", "project_plan_coverage_export", "plan_requirement_trace_export", "externalExecutionPacketPayload", "tfse_external_execution_packet", "external_execution_export", "external_execution_save", "getExternalExecutionRecords", "saveExternalExecutionRecord", "launchHandoffManifestPayload", "tfse_launch_handoff_manifest", "launch_handoff_export", "launch_handoff_save", "getLaunchHandoffRecords", "saveLaunchHandoffRecord", "recommended_sequence", "owner_handoff", "checkpoint_records", "mergeSeededRecords", "adminSeedRecords", "assets/data/admin-record-seeds.json", "tfse_backend_cutover_roadmap", "plan_closure_status", "tfse_plan_closure_report"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing handoff marker {marker}")
    for marker in ("ownerCutoverBundlePayload", "tfse_owner_cutover_bundle", "owner_cutover_bundle_export", "ownerCutoverPatchTemplate", "owner_patch_template", "env_snippet", "releaseDayRunsheetPayload", "tfse_release_day_runsheet", "release_day_runsheet_export", "ownerCutoverSpecs"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing owner/run sheet marker {marker}")
    for marker in ("projectPhaseAuditPayload", "tfse_project_phase_audit", "project_phase_audit_export", "planClosurePayload", "tfse_plan_closure_report", "plan_closure_export", "local_closed_external_blocked", "phase_0", "phase_8", "local_ready_external_pending"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing phase audit marker {marker}")
    for marker in ("project_plan_coverage_reports", "plan_requirement_traces", "external_execution_packets", "launch_handoff_manifests"):
        if marker not in data_model:
            failures.append(f"DATA_MODEL.md: missing handoff model {marker}")
        if f"create table {marker}" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
            failures.append(f"backend-schema.sql: missing handoff table {marker}")
    if "project_phase_audits" not in data_model:
        failures.append("DATA_MODEL.md: missing project_phase_audits model")
    if "create table project_phase_audits" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing project_phase_audits table")
    if "local_audit_matrices" not in data_model:
        failures.append("DATA_MODEL.md: missing local_audit_matrices model")
    if "create table local_audit_matrices" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing local_audit_matrices table")
    for marker in ("/api/admin/project-plan-coverage-report", "/api/admin/plan-requirement-trace", "/api/admin/external-execution-packet", "/api/admin/launch-handoff-manifest"):
        if marker not in (ROOT / "api-contract.json").read_text(errors="ignore"):
            failures.append(f"api-contract.json: missing handoff endpoint {marker}")
    if "/api/admin/project-phase-audit" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing project phase audit endpoint")
    if "/api/admin/local-audit-matrix" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing local audit matrix endpoint")
    if "launch_cutover_audits" not in data_model:
        failures.append("DATA_MODEL.md: missing launch_cutover_audits model")
    if "create table launch_cutover_audits" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing launch_cutover_audits table")
    if "/api/admin/launch-cutover-audit" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing launch cutover audit endpoint")
    for marker in ("launch_execution_plans", "launch_countdown_plans"):
        if marker not in data_model:
            failures.append(f"DATA_MODEL.md: missing launch plan model {marker}")
        if f"create table {marker}" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
            failures.append(f"backend-schema.sql: missing launch plan table {marker}")
    for marker in ("/api/admin/launch-execution-plan", "/api/admin/launch-countdown-plan"):
        if marker not in (ROOT / "api-contract.json").read_text(errors="ignore"):
            failures.append(f"api-contract.json: missing launch plan endpoint {marker}")
    if "release_readiness_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing release_readiness_packages model")
    if "create table release_readiness_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing release_readiness_packages table")
    if "/api/admin/release-readiness" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing release readiness endpoint")
    for marker in ("data-admin-operations-tasks", "data-admin-operations-tasks-export", "運維任務隊列", "匯出運維任務隊列"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing operations task marker {marker}")
    for marker in ("operationsTaskPayload", "tfse_operations_task_queue", "operations_task_export", "owner_role", "next_review_cycle", "OPERATIONS_RUNBOOK.md"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing operations task marker {marker}")
    if "operations_task_snapshots" not in data_model:
        failures.append("DATA_MODEL.md: missing operations_task_snapshots model")
    if "create table operations_task_snapshots" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing operations_task_snapshots table")
    if "/api/admin/operations-tasks" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing operations tasks endpoint")
    for marker in ("data-admin-incident-response", "data-admin-incident-response-export", "事故響應與回滾記錄", "匯出事故響應包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing incident response marker {marker}")
    for marker in ("incidentResponsePayload", "tfse_incident_response_package", "incident_response_export", "severity_triggers", "verification_commands", "recent_errors"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing incident response marker {marker}")
    if "incident_response_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing incident_response_packages model")
    if "create table incident_response_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing incident_response_packages table")
    if "/api/admin/incident-response-package" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing incident response endpoint")
    for marker in ("data-admin-domain-cutover", "data-admin-domain-cutover-export", "正式網域切換交接包", "匯出網域切換包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing domain cutover marker {marker}")
    for marker in ("domainCutoverPayload", "tfse_domain_cutover_package", "domain_cutover_export", "cutover_steps", "required_commands"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing domain cutover marker {marker}")
    if "domain_cutover_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing domain_cutover_packages model")
    if "create table domain_cutover_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing domain_cutover_packages table")
    if "/api/admin/domain-cutover-package" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing domain cutover endpoint")
    for marker in ("data-admin-host-fallback-export", "匯出主機錯誤頁核對包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing host fallback marker {marker}")
    for marker in ("hostFallbackPayload", "tfse_host_fallback_deployment_check", "host_fallback_export", "critical_routes", "verification_steps"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing host fallback marker {marker}")
    if "host_fallback_deployment_checks" not in data_model:
        failures.append("DATA_MODEL.md: missing host_fallback_deployment_checks model")
    if "create table host_fallback_deployment_checks" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing host_fallback_deployment_checks table")
    if "/api/admin/host-fallback-deployment-check" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing host fallback deployment endpoint")
    for marker in ("data-admin-backend-roadmap", "data-admin-backend-roadmap-export", "正式後端接入路線圖", "匯出後端接入路線圖"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing backend roadmap marker {marker}")
    for marker in ("backendRoadmapPayload", "renderBackendRoadmap", "tfse_backend_cutover_roadmap", "backend_roadmap_export", "priority_sequence", "completion_gates", "PRODUCTION_BACKEND_PLAN.md"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing backend roadmap marker {marker}")
    if "backend_cutover_roadmaps" not in data_model:
        failures.append("DATA_MODEL.md: missing backend_cutover_roadmaps model")
    if "create table backend_cutover_roadmaps" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing backend_cutover_roadmaps table")
    if "/api/admin/backend-cutover-roadmap" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing backend roadmap endpoint")
    backend_roadmap_tool = (ROOT / "tools/backend_cutover_roadmap.py").read_text(errors="ignore")
    for marker in ("tfse_backend_cutover_roadmap", "PRODUCTION_BACKEND_PLAN.md", "launch_cutover_audit", "formal_config_input_packet", "priority_sequence", "completion_gates"):
        if marker not in backend_roadmap_tool:
            failures.append(f"backend_cutover_roadmap.py: missing marker {marker}")
    plan_closure_tool = (ROOT / "tools/plan_closure_report.py").read_text(errors="ignore")
    for marker in ("tfse_plan_closure_report", "local_closed_external_blocked", "production_closed", "TFSE project plan sections 17 + 21", "Remaining External Blockers"):
        if marker not in plan_closure_tool:
            failures.append(f"plan_closure_report.py: missing marker {marker}")
    checklist_coverage_tool = (ROOT / "tools/checklist_artifact_coverage_audit.py").read_text(errors="ignore")
    for marker in ("tfse_checklist_artifact_coverage_audit", "LAUNCH_CHECKLIST.md tfse_* artifact references", "Missing In Admin Script", "Missing In Browser Verify", "tfse_plan_closure_report"):
        if marker not in checklist_coverage_tool:
            failures.append(f"checklist_artifact_coverage_audit.py: missing marker {marker}")
    env_template_tool = (ROOT / "tools/production_env_template.py").read_text(errors="ignore")
    for marker in ("tfse_production_env_template", "PRODUCTION_BACKEND_PLAN.md", "TFSE_TURNSTILE_SECRET_KEY", "GitHub Actions secrets", "tfse_site_config_update_package"):
        if marker not in env_template_tool:
            failures.append(f"production_env_template.py: missing marker {marker}")
    config_readiness_tool = (ROOT / "tools/production_config_readiness.py").read_text(errors="ignore")
    for marker in ("tfse_production_config_readiness", "site-config.json", "Ready count", "tfse_site_config_approval_package"):
        if marker not in config_readiness_tool:
            failures.append(f"production_config_readiness.py: missing marker {marker}")
    site_config_update_tool = (ROOT / "tools/site_config_update_package.py").read_text(errors="ignore")
    for marker in ("tfse_site_config_update_package", "ready_for_manual_merge", "awaiting_draft", "template_patch", "tfse_plan_closure_report"):
        if marker not in site_config_update_tool:
            failures.append(f"site_config_update_package.py: missing marker {marker}")
    site_config_approval_tool = (ROOT / "tools/site_config_approval_package.py").read_text(errors="ignore")
    for marker in ("tfse_site_config_approval_package", "awaiting_approval", "needs_revision_before_approval", "tfse_domain_cutover_package", "approval_checklist"):
        if marker not in site_config_approval_tool:
            failures.append(f"site_config_approval_package.py: missing marker {marker}")
    launch_health_tool = (ROOT / "tools/launch_health_check.py").read_text(errors="ignore")
    for marker in ("tfse_launch_health_check", "site-config.json + static deployment baseline", "Ready count", "tfse_domain_cutover_package"):
        if marker not in launch_health_tool:
            failures.append(f"launch_health_check.py: missing marker {marker}")
    domain_cutover_tool = (ROOT / "tools/domain_cutover_package.py").read_text(errors="ignore")
    for marker in ("tfse_domain_cutover_package", "pending_domain_cutover", "cutover_steps", "required_commands", "tfse_release_readiness_package"):
        if marker not in domain_cutover_tool:
            failures.append(f"domain_cutover_package.py: missing marker {marker}")
    host_fallback_tool = (ROOT / "tools/host_fallback_deployment_check.py").read_text(errors="ignore")
    for marker in ("tfse_host_fallback_deployment_check", "requires_formal_host_verification", "critical_routes", "verification_steps", "tfse_release_readiness_package"):
        if marker not in host_fallback_tool:
            failures.append(f"host_fallback_deployment_check.py: missing marker {marker}")
    https_ingress_tool = (ROOT / "tools/https_ingress_fix_package.py").read_text(errors="ignore")
    for marker in ("tfse_https_ingress_fix_package", "pending_external_network_fix", "https_public_ingress", "live_deployment_check.py --markdown --strict-https", "cloud_firewall_rule_id"):
        if marker not in https_ingress_tool:
            failures.append(f"https_ingress_fix_package.py: missing marker {marker}")
    external_verification_tool = (ROOT / "tools/external_verification_evidence.py").read_text(errors="ignore")
    for marker in ("tfse_external_verification_evidence", "configured_items", "verified_items", "tfse_release_readiness_package", "tfse_plan_closure_report"):
        if marker not in external_verification_tool:
            failures.append(f"external_verification_evidence.py: missing marker {marker}")
    release_readiness_tool = (ROOT / "tools/release_readiness_package.py").read_text(errors="ignore")
    for marker in ("tfse_release_readiness_package", "hold_for_external_or_manual_items", "static_mvp_with_formal_cutover_handoff", "tfse_operations_task_queue", "python3 tools/launch_health_check.py --markdown"):
        if marker not in release_readiness_tool:
            failures.append(f"release_readiness_package.py: missing marker {marker}")
    operations_task_tool = (ROOT / "tools/operations_task_queue.py").read_text(errors="ignore")
    for marker in ("tfse_operations_task_queue", "pending_external", "next_review_cycle", "OPERATIONS_RUNBOOK.md", "tfse_release_readiness_package", "tfse_https_ingress_fix_package", "https_ingress"):
        if marker not in operations_task_tool:
            failures.append(f"operations_task_queue.py: missing marker {marker}")
    incident_response_tool = (ROOT / "tools/incident_response_package.py").read_text(errors="ignore")
    for marker in ("tfse_incident_response_package", "severity_triggers", "verification_commands", "tfse_release_readiness_package", "tfse_operations_task_queue"):
        if marker not in incident_response_tool:
            failures.append(f"incident_response_package.py: missing marker {marker}")
    release_tooling_tool = (ROOT / "tools/release_tooling.py").read_text(errors="ignore")
    for marker in ("RELEASE_REQUIRED_COMMANDS", "python3 tools/launch_health_check.py --markdown", "python3 tools/release_readiness_package.py --markdown", "tfse_external_verification_evidence", "build_domain_cutover_report"):
        if marker not in release_tooling_tool:
            failures.append(f"release_tooling.py: missing marker {marker}")
    seo_submission_tool = (ROOT / "tools/seo_submission_package.py").read_text(errors="ignore")
    for marker in ("tfse_seo_submission_package", "Submission Steps", "canonical_pages", "tfse_search_console_verification_package"):
        if marker not in seo_submission_tool:
            failures.append(f"seo_submission_package.py: missing marker {marker}")
    search_console_tool = (ROOT / "tools/search_console_verification_package.py").read_text(errors="ignore")
    for marker in ("tfse_search_console_verification_package", "ready_for_search_console_submission", "verification_steps", "tfse_seo_indexing_followup_queue"):
        if marker not in search_console_tool:
            failures.append(f"search_console_verification_package.py: missing marker {marker}")
    tracking_consent_tool = (ROOT / "tools/tracking_consent_audit.py").read_text(errors="ignore")
    for marker in ("tfse_tracking_consent_audit", "consent_status", "external_destinations", "tfse_monitoring_receipt_checklist"):
        if marker not in tracking_consent_tool:
            failures.append(f"tracking_consent_audit.py: missing marker {marker}")
    monitoring_tool = (ROOT / "tools/monitoring_receipt_checklist.py").read_text(errors="ignore")
    for marker in ("tfse_monitoring_receipt_checklist", "missing_required_events", "receipt_checks", "tfse_external_verification_evidence"):
        if marker not in monitoring_tool:
            failures.append(f"monitoring_receipt_checklist.py: missing marker {marker}")
    sentry_tool = (ROOT / "tools/sentry_error_verification_package.py").read_text(errors="ignore")
    for marker in ("tfse_sentry_error_verification_package", "pending_sentry_error_verification", "required_controls", "tfse_incident_response_package"):
        if marker not in sentry_tool:
            failures.append(f"sentry_error_verification_package.py: missing marker {marker}")
    cli_coverage_tool = (ROOT / "tools/admin_export_cli_coverage_audit.py").read_text(errors="ignore")
    for marker in ("tfse_admin_export_cli_coverage_audit", "Missing CLI Exports", "assets/js/tfse-admin.js formats vs tools/*.py standalone formats", "tfse_project_plan_coverage_report"):
        if marker not in cli_coverage_tool:
            failures.append(f"admin_export_cli_coverage_audit.py: missing marker {marker}")
    security_headers_tool = (ROOT / "tools/security_headers_deployment_check.py").read_text(errors="ignore")
    for marker in ("tfse_security_headers_deployment_check", "Expected Headers", "verification_commands", "tfse_domain_cutover_package"):
        if marker not in security_headers_tool:
            failures.append(f"security_headers_deployment_check.py: missing marker {marker}")
    admin_security_tool = (ROOT / "tools/admin_security_matrix.py").read_text(errors="ignore")
    for marker in ("tfse_admin_security_matrix", "Roles", "Checks", "tfse_admin_auth_cutover_check"):
        if marker not in admin_security_tool:
            failures.append(f"admin_security_matrix.py: missing marker {marker}")
    admin_auth_tool = (ROOT / "tools/admin_auth_cutover_check.py").read_text(errors="ignore")
    for marker in ("tfse_admin_auth_cutover_check", "ready_for_formal_auth_validation", "cutover_steps", "tfse_backend_acceptance_matrix"):
        if marker not in admin_auth_tool:
            failures.append(f"admin_auth_cutover_check.py: missing marker {marker}")
    backend_acceptance_tool = (ROOT / "tools/backend_acceptance_matrix.py").read_text(errors="ignore")
    for marker in ("tfse_backend_acceptance_matrix", "pending_api_configuration", "required_validation", "tfse_admin_auth_cutover_check"):
        if marker not in backend_acceptance_tool:
            failures.append(f"backend_acceptance_matrix.py: missing marker {marker}")
    line_setup_tool = (ROOT / "tools/line_oa_setup_package.py").read_text(errors="ignore")
    for marker in ("tfse_line_oa_setup_package", "Setup Steps", "quick_replies", "tfse_line_oa_handoff_check"):
        if marker not in line_setup_tool:
            failures.append(f"line_oa_setup_package.py: missing marker {marker}")
    line_handoff_tool = (ROOT / "tools/line_oa_handoff_check.py").read_text(errors="ignore")
    for marker in ("tfse_line_oa_handoff_check", "pending_line_oa_handoff", "handoff_steps", "tfse_external_verification_evidence"):
        if marker not in line_handoff_tool:
            failures.append(f"line_oa_handoff_check.py: missing marker {marker}")
    migration_tool = (ROOT / "tools/formal_backend_migration_package.py").read_text(errors="ignore")
    for marker in ("tfse_formal_backend_migration_package", "sensitive_data_policy", "import_order", "tfse_import_validation_package"):
        if marker not in migration_tool:
            failures.append(f"formal_backend_migration_package.py: missing marker {marker}")
    restore_tool = (ROOT / "tools/backup_restore_drill_plan.py").read_text(errors="ignore")
    for marker in ("tfse_backup_restore_drill_plan", "pending_external_backup_setup", "restore_steps", "tfse_backend_acceptance_matrix"):
        if marker not in restore_tool:
            failures.append(f"backup_restore_drill_plan.py: missing marker {marker}")
    backup_receipt_tool = (ROOT / "tools/backup_receipt_verification_package.py").read_text(errors="ignore")
    for marker in ("tfse_backup_receipt_verification_package", "pending_backup_receipt_verification", "required_receipts", "tfse_external_verification_evidence"):
        if marker not in backup_receipt_tool:
            failures.append(f"backup_receipt_verification_package.py: missing marker {marker}")
    content_api_tool = (ROOT / "tools/content_api_cutover_package.py").read_text(errors="ignore")
    for marker in ("tfse_content_api_cutover_package", "pending_content_api_cutover", "required_api_checks", "tfse_backend_acceptance_matrix"):
        if marker not in content_api_tool:
            failures.append(f"content_api_cutover_package.py: missing marker {marker}")
    turnstile_tool = (ROOT / "tools/turnstile_backend_verification_package.py").read_text(errors="ignore")
    for marker in ("tfse_turnstile_backend_verification_package", "pending_turnstile_backend_verification", "negative_test_cases", "TFSE_TURNSTILE_SECRET_KEY"):
        if marker not in turnstile_tool:
            failures.append(f"turnstile_backend_verification_package.py: missing marker {marker}")
    analytics_debug_tool = (ROOT / "tools/analytics_debug_verification_package.py").read_text(errors="ignore")
    for marker in ("tfse_analytics_debug_verification_package", "pending_analytics_debug_verification", "debug_steps", "tfse_server_event_replay_queue"):
        if marker not in analytics_debug_tool:
            failures.append(f"analytics_debug_verification_package.py: missing marker {marker}")
    for marker in ("data-admin-backend-acceptance", "data-admin-backend-acceptance-export", "data-admin-backend-acceptance-records", "data-admin-backend-acceptance-form", "正式 API 驗收矩陣", "匯出 API 驗收矩陣", "保存 API 驗收留痕"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing backend acceptance marker {marker}")
    for marker in ("backendAcceptancePayload", "backendAcceptanceTrackableItems", "getBackendAcceptanceRecords", "saveBackendAcceptanceRecord", "tfse_backend_acceptance_matrix", "backend_acceptance_export", "backend_acceptance_save", "required_validation", "source_documents", "seed_backend_acceptance_records", "/api/admin/auth/login", "/api/admin/auth/session", "/api/admin/auth/logout"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing backend acceptance marker {marker}")
    for marker in ("admin_users", "admin_sessions", "admin_auth_cutover_checks", "admin_security_matrices", "security_headers_deployment_checks"):
        if marker not in data_model:
            failures.append(f"DATA_MODEL.md: missing {marker} model")
        if f"create table {marker}" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
            failures.append(f"backend-schema.sql: missing {marker} table")
    for marker in ("data-admin-security-matrix", "data-admin-security-matrix-export", "data-admin-security-headers-export", "data-admin-auth-cutover-export", "Admin 權限與安全矩陣", "匯出權限安全矩陣", "匯出安全標頭部署核對包", "匯出 Admin Auth 切換核對包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing admin security marker {marker}")
    for marker in ("permissionMatrix", "adminSecurityMatrixPayload", "tfse_admin_security_matrix", "admin_security_matrix_export", "securityHeadersPayload", "tfse_security_headers_deployment_check", "security_headers_export", "authCutoverPayload", "tfse_admin_auth_cutover_check", "auth_cutover_export", "expected_headers", "csp_allowlist", "csrf_token_hash", "viewer_masking", "cookie_flags"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing admin security marker {marker}")
    for marker in ("/api/admin/auth/login", "/api/admin/auth/session", "/api/admin/auth/logout", "/api/admin/security-matrix", "/api/admin/security-headers-deployment-check", "/api/admin/auth-cutover-check"):
        if marker not in (ROOT / "api-contract.json").read_text(errors="ignore"):
            failures.append(f"api-contract.json: missing auth endpoint {marker}")
    if "backend_acceptance_matrices" not in data_model:
        failures.append("DATA_MODEL.md: missing backend_acceptance_matrices model")
    if "create table backend_acceptance_matrices" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing backend_acceptance_matrices table")
    if "/api/admin/backend-acceptance-matrix" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing backend acceptance endpoint")
    for marker in ("data-admin-external-verification", "data-admin-external-verification-form", "data-admin-external-verification-export", "外部配置驗證留痕", "匯出外部驗證包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing external verification marker {marker}")
    for marker in ("externalVerificationPayload", "tfse_external_verification_evidence", "external_verification_save", "external_verification_export", "tfse_external_verification_records", "seed_external_verification_records"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing external verification marker {marker}")
    if "external_verification_evidence" not in data_model:
        failures.append("DATA_MODEL.md: missing external_verification_evidence model")
    if "create table external_verification_evidence" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing external_verification_evidence table")
    if "/api/admin/external-verification-evidence" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing external verification endpoint")
    for marker in ("data-admin-seo-submission", "data-admin-seo-submission-export", "data-admin-search-console-export", "data-admin-search-console-records", "data-admin-search-console-form", "data-admin-seo-indexing", "data-admin-seo-indexing-export", "SEO 收錄提交包", "匯出 SEO 提交包", "匯出 Search Console 驗證包", "保存 Search Console 留痕", "匯出收錄跟進隊列"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing SEO submission marker {marker}")
    for marker in ("seoSubmissionPayload", "searchConsoleVerificationPayload", "searchConsoleTrackableItems", "getSearchConsoleRecords", "saveSearchConsoleRecord", "seoIndexingQueuePayload", "tfse_seo_submission_package", "tfse_search_console_verification_package", "tfse_seo_indexing_followup_queue", "seo_submission_export", "search_console_export", "search_console_save", "seo_indexing_export", "dynamic_url_patterns", "submission_steps", "url_inspection_samples", "coverage_status", "seed_search_console_records", "Search Console"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing SEO submission marker {marker}")
    if "seo_submission_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing seo_submission_packages model")
    if "search_console_verification_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing search_console_verification_packages model")
    if "seo_indexing_followup_queues" not in data_model:
        failures.append("DATA_MODEL.md: missing seo_indexing_followup_queues model")
    if "create table seo_submission_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing seo_submission_packages table")
    if "create table search_console_verification_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing search_console_verification_packages table")
    if "create table seo_indexing_followup_queues" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing seo_indexing_followup_queues table")
    if "/api/admin/seo-submission-package" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing SEO submission endpoint")
    if "/api/admin/search-console-verification-package" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing Search Console verification endpoint")
    if "/api/admin/seo-indexing-followup-queue" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing SEO indexing followup endpoint")
    for marker in ("data-admin-config-readiness", "data-admin-config-readiness-export", "data-admin-env-template", "data-admin-env-template-export", "正式配置交接包", "匯出配置交接包", "匯出環境變數模板"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing config readiness marker {marker}")
    for marker in ("data-admin-config-input-packet", "data-admin-config-input-records", "data-admin-config-input-form", "data-admin-config-input-packet-export", "正式配置待填總覽", "匯出正式配置待填包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing config input packet marker {marker}")
    for marker in ("configReadinessItems", "configReadinessPayload", "tfse_production_config_readiness", "config_readiness_export", "envTemplatePayload", "tfse_production_env_template", "env_template_export", "formalConfigInputPacketPayload", "tfse_formal_config_input_packet", "config_input_packet_export", "config_input_save", "getConfigInputRecords", "saveConfigInputRecord", "site_config_patch_template", "seed_config_input_records", "TFSE_TURNSTILE_SECRET_KEY", "Cloudflare Turnstile"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing config readiness marker {marker}")
    if "formal_config_input_packets" not in data_model:
        failures.append("DATA_MODEL.md: missing formal_config_input_packets model")
    if "create table formal_config_input_packets" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing formal_config_input_packets table")
    if "/api/admin/formal-config-input-packet" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing formal config input endpoint")
    if "production_env_templates" not in data_model:
        failures.append("DATA_MODEL.md: missing production_env_templates model")
    if "create table production_env_templates" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing production_env_templates table")
    if "/api/admin/production-env-template" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing production env template endpoint")
    for marker in ("data-admin-acceptance-checklist", "data-admin-acceptance-export", "data-admin-browser-acceptance", "data-admin-browser-acceptance-export", "上線驗收清單", "瀏覽器人工驗收留痕", "匯出驗收清單", "匯出瀏覽器驗收留痕"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing acceptance checklist marker {marker}")
    for marker in ("acceptanceChecklistItems", "acceptanceChecklistPayload", "browserAcceptanceReportPayload", "tfse_acceptance_checklist", "tfse_browser_acceptance_report", "acceptance_export", "browser_acceptance_save", "browser_acceptance_export", "TFSE project plan chapter 17", "manual_browser", "status_counts"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing acceptance checklist marker {marker}")
    if "retrospective_reports" not in data_model:
        failures.append("DATA_MODEL.md: missing retrospective_reports model")
    if "tracking_consent_audits" not in data_model:
        failures.append("DATA_MODEL.md: missing tracking_consent_audits model")
    if "utm_attribution_reports" not in data_model:
        failures.append("DATA_MODEL.md: missing utm_attribution_reports model")
    if "content_version_snapshots" not in data_model:
        failures.append("DATA_MODEL.md: missing content_version_snapshots model")
    if "launch_health_checks" not in data_model:
        failures.append("DATA_MODEL.md: missing launch_health_checks model")
    if "acceptance_checklists" not in data_model:
        failures.append("DATA_MODEL.md: missing acceptance_checklists model")
    if "browser_acceptance_reports" not in data_model:
        failures.append("DATA_MODEL.md: missing browser_acceptance_reports model")
    return failures


def verify_line_cta():
    failures = []
    line = config().get("line", {})
    for key in ("oa_url", "label"):
        if key not in line:
            failures.append(f"site-config.json: missing line.{key}")
    if line.get("oa_url") == "contact-us.html#line-cta":
        failures.append("site-config.json: line.oa_url should point to free-check.html#line-cta or official Line OA")
    lead_script = (ROOT / "assets/js/tfse-lead-form.js").read_text(errors="ignore")
    for marker in (
        "data-line-cta",
        "lead_line_cta_shown",
        "line_cta_url",
        "site-config.json",
    ):
        if marker not in lead_script:
            failures.append(f"tfse-lead-form.js: missing Line CTA marker {marker}")
    line_data = json.loads((ROOT / "assets/data/line-flows.json").read_text())
    if len(line_data.get("quick_replies", [])) < 6:
        failures.append("line-flows.json: expected at least 6 quick replies")
    for item in line_data.get("quick_replies", []):
        label = item.get("label", "unknown")
        for marker in ("boundary", "article_href", "database_href", "free_check_href"):
            if not item.get(marker):
                failures.append(f"line-flows.json: quick reply {label} missing {marker}")
        if "utm_source=line" not in item.get("free_check_href", ""):
            failures.append(f"line-flows.json: quick reply {label} free_check_href missing Line UTM")
    for tag in ("form_submitted", "need_installment", "segment_high_debt", "source_fb", "source_seo", "line_opt_in"):
        if tag not in line_data.get("tags", []):
            failures.append(f"line-flows.json: missing {tag} tag")
    line_script = (ROOT / "assets/js/tfse-line.js").read_text(errors="ignore")
    for marker in ("assets/data/line-flows.json", "line_flow_view", "line_quick_reply_click", "data-line-quick-reply", "article_href", "database_href", "free_check_href", "data-line-action"):
        if marker not in line_script:
            failures.append(f"tfse-line.js: missing Line flow marker {marker}")
    admin_html = (ROOT / "admin.html").read_text(errors="ignore")
    admin_script = (ROOT / "assets/js/tfse-admin.js").read_text(errors="ignore")
    for marker in ("data-admin-line-segments", "data-admin-line-segments-export", "data-admin-line-oa-setup-export", "data-admin-line-oa-handoff-export", "data-admin-line-oa-records", "data-admin-line-oa-form", "data-admin-line-optout", "data-admin-line-optout-export", "data-admin-line-optout-api-export", "Line 分群同步隊列", "匯出 Line OA 設定包", "匯出 Line OA 導向驗收包", "保存 Line OA 留痕", "匯出 Line 退訂/投訴隊列", "匯出 Line 退訂/投訴 API 驗收包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing Line segment marker {marker}")
    for marker in ("lineSegmentItems", "lineSegmentPayload", "lineOaSetupPayload", "lineOaHandoffPayload", "lineOaTrackableItems", "getLineOaRecords", "saveLineOaRecord", "lineOptoutPayload", "lineOptoutApiVerificationPayload", "tfse_line_segment_queue", "tfse_line_oa_setup_package", "tfse_line_oa_handoff_check", "tfse_line_optout_complaint_queue", "tfse_line_optout_api_verification_package", "line_segment_export", "line_oa_setup_export", "line_oa_handoff_export", "line_oa_save", "line_optout_export", "line_optout_api_export", "seed_line_oa_records", "source_tags", "setup_steps", "handoff_steps", "cta_routes", "intake_keywords", "停止接收"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing Line segment marker {marker}")
    browser_verify = (ROOT / "tools/browser_acceptance_verify.mjs").read_text(errors="ignore")
    if "admin Line OA setup export" not in browser_verify:
        failures.append("browser_acceptance_verify.mjs: missing Line OA setup smoke marker")
    if "admin Line OA handoff check export" not in browser_verify:
        failures.append("browser_acceptance_verify.mjs: missing Line OA handoff smoke marker")
    if "admin Line OA trace save" not in browser_verify:
        failures.append("browser_acceptance_verify.mjs: missing Line OA trace smoke marker")
    for marker in ("adminRecordSeedPayload", "--admin-record-seed-file", "config_input_records", "external_execution_records", "launch_handoff_records", "line_oa_records", "external_verification_records"):
        if marker not in browser_verify:
            failures.append(f"browser_acceptance_verify.mjs: missing admin seed marker {marker}")
    api_contract = (ROOT / "api-contract.json").read_text(errors="ignore")
    if "/api/admin/line-oa-setup" not in api_contract:
        failures.append("api-contract.json: missing Line OA setup endpoint")
    if "/api/admin/line-oa-handoff-check" not in api_contract:
        failures.append("api-contract.json: missing Line OA handoff endpoint")
    if "/api/admin/line-optout-complaints" not in api_contract:
        failures.append("api-contract.json: missing Line optout complaints endpoint")
    if "/api/admin/line-optout-api-verification" not in api_contract:
        failures.append("api-contract.json: missing Line optout API verification endpoint")
    schema = (ROOT / "backend-schema.sql").read_text(errors="ignore")
    if "create table line_oa_setup_packages" not in schema:
        failures.append("backend-schema.sql: missing line_oa_setup_packages table")
    if "create table line_oa_handoff_checks" not in schema:
        failures.append("backend-schema.sql: missing line_oa_handoff_checks table")
    if "create table line_optout_complaint_tasks" not in schema:
        failures.append("backend-schema.sql: missing line_optout_complaint_tasks table")
    if "create table line_optout_api_verification_packages" not in schema:
        failures.append("backend-schema.sql: missing line_optout_api_verification_packages table")
    for marker in ("line_opt_in", "source_fb", "source_ig", "source_tiktok", "source_seo", "segment_high_debt", "need_installment"):
        if marker not in lead_script:
            failures.append(f"tfse-lead-form.js: missing Line segment marker {marker}")
    if "line_segment_tasks" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing line_segment_tasks model")
    if "line_oa_setup_packages" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing line_oa_setup_packages model")
    if "line_oa_handoff_checks" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing line_oa_handoff_checks model")
    if "line_optout_complaint_tasks" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing line_optout_complaint_tasks model")
    if "line_optout_api_verification_packages" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing line_optout_api_verification_packages model")
    for name in ("free-check.html",):
        text = (ROOT / name).read_text(errors="ignore")
        for marker in ("data-line-flow", "assets/js/tfse-line.js"):
            if marker not in text:
                failures.append(f"{name}: missing Line flow marker {marker}")
    return failures


def verify_api_adapter():
    failures = []
    backend = config().get("backend", {})
    for key in ("api_base_url", "mode", "timeout_ms"):
        if key not in backend:
            failures.append(f"site-config.json: missing backend.{key}")
    api_script = (ROOT / "assets/js/tfse-api.js").read_text(errors="ignore")
    for marker in (
        "window.TFSEApi",
        "submitLead",
        "listLeads",
        "updateLeadStatus",
        "/api/leads",
        "/api/admin/leads",
        "api_fallback_localStorage",
    ):
        if marker not in api_script:
            failures.append(f"tfse-api.js: missing API adapter marker {marker}")
    browser_smoke = (ROOT / "tools/browser_acceptance_verify.mjs").read_text(errors="ignore")
    for marker in ("smokeFormalApiMode", "formal API lead submission", "formal API admin lead list", "formal API admin status update"):
        if marker not in browser_smoke:
            failures.append(f"browser_acceptance_verify.mjs: missing formal API smoke marker {marker}")
    lead_script = (ROOT / "assets/js/tfse-lead-form.js").read_text(errors="ignore")
    if "TFSEApi.submitLead" not in lead_script:
        failures.append("tfse-lead-form.js: missing TFSEApi.submitLead")
    admin_script = (ROOT / "assets/js/tfse-admin.js").read_text(errors="ignore")
    for marker in ("TFSEApi.listLeads", "TFSEApi.updateLeadStatus", "leadSourceMode"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing API adapter marker {marker}")
    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(errors="ignore")
        if "assets/js/tfse-events.js" in text and "assets/js/tfse-api.js" not in text:
            failures.append(f"{path.name}: missing tfse-api.js before events")
    return failures


def verify_content_management():
    failures = []
    admin_script = (ROOT / "assets/js" / "tfse-admin.js").read_text(errors="ignore")
    for marker in (
        "tfse_product_overrides",
        "tfse_article_overrides",
        "tfse_faq_overrides",
        "data-product-save",
        "data-article-save",
        "data-faq-save",
        "product_content_update",
        "article_content_update",
        "faq_content_update",
    ):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing content management marker {marker}")

    products_script = (ROOT / "assets/js" / "tfse-products.js").read_text(errors="ignore")
    for marker in ("applyAdminOverrides", "tfse_product_overrides", "tfse_product_status"):
        if marker not in products_script:
            failures.append(f"tfse-products.js: missing override marker {marker}")
    for marker in ("查看官方來源", "回到資料庫", "不確定是否適合？做免費財務健檢查詢", "free-check.html"):
        if marker not in products_script:
            failures.append(f"tfse-products.js: missing product detail CTA marker {marker}")
    for marker in ("assets/data/articles.json", "assets/data/categories.json", "renderRelatedProducts", "renderRelatedArticles", "renderProductFaq", "data-related-products", "data-related-product-articles", "data-product-faq-list"):
        if marker not in products_script:
            failures.append(f"tfse-products.js: missing product related marker {marker}")
    work_details = (ROOT / "work-details.html").read_text(errors="ignore")
    for marker in ("data-product-related", "data-related-products", "data-related-product-articles", "data-product-faq", "data-product-faq-list", "相關公開資訊與推薦文章", "常見問題", "不協助辦理流程"):
        if marker not in work_details:
            failures.append(f"work-details.html: missing product detail marker {marker}")
    for residual in ("marketing encompasses", "digital channels", "prospective customers", "不協助送件"):
        if residual in work_details or residual in products_script:
            failures.append(f"work-details product detail residual text {residual}")

    articles_script = (ROOT / "assets/js" / "tfse-articles.js").read_text(errors="ignore")
    for marker in ("tfse_article_overrides", "tfse_article_status", "contentOverrides", "tfse_faq_overrides"):
        if marker not in articles_script:
            failures.append(f"tfse-articles.js: missing override marker {marker}")
    blog_details = (ROOT / "blog-details.html").read_text(errors="ignore")
    for marker in ("文章不開放留言收件", "free-check.html?utm_medium=article_cta", "回到資料庫"):
        if marker not in blog_details:
            failures.append(f"blog-details.html: missing article CTA marker {marker}")
    for residual in ('name="email"', 'name="name"', "想補充的查詢問題"):
        if residual in blog_details:
            failures.append(f"blog-details.html: residual unbound article form field {residual}")
    admin_html = (ROOT / "admin.html").read_text(errors="ignore")
    for marker in ("data-admin-article-review", "article_review_submit", "article_review_approve", "article_review_reject", "in_review", "renderArticleReview"):
        if marker not in admin_script and marker not in admin_html:
            failures.append(f"admin article review missing marker {marker}")
    if "示範密碼：TFSE-MVP-2026" in admin_html:
        failures.append("admin.html: MVP password should not be displayed in page copy")
    for marker in ("產生本機測試資料", "sample_lead", "is_sample"):
        if marker not in admin_script and marker not in admin_html:
            failures.append(f"admin sample lead missing marker {marker}")
    if "lead_demo_" in admin_script:
        failures.append("tfse-admin.js: residual demo lead id")
    for marker in ("data-compliance-copy-input", "data-compliance-copy-scan", "data-compliance-copy-result", "文案即時預檢"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing compliance copy scan marker {marker}")
    for marker in ("complianceCopyScanPayload", "forbidden_hits", "high_risk_cta", "has_sensitive_ask", "compliance_copy_scan"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing compliance copy scan marker {marker}")
    if "scan_payload" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing compliance scan_payload")
    if "scan_payload" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing compliance scan_payload")
    for marker in ("data-admin-legal-review", "data-admin-legal-review-export", "法務合規送審包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing legal review marker {marker}")
    for marker in ("legalReviewPayload", "tfse_legal_compliance_review_package", "legal_review_export", "required_external_review", "evidence_files"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing legal review marker {marker}")
    if "legal_compliance_review_packages" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing legal_compliance_review_packages model")
    if "create table legal_compliance_review_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing legal_compliance_review_packages table")
    for marker in ("data-admin-legal-external-review-export", "匯出外部複核留痕"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing legal external review marker {marker}")
    for marker in ("legalExternalReviewPayload", "tfse_legal_external_review_evidence", "legal_external_review_export", "signoff_requirements", "open_items"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing legal external review marker {marker}")
    if "legal_external_review_evidence" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing legal_external_review_evidence model")
    if "create table legal_external_review_evidence" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing legal_external_review_evidence table")
    if "/api/admin/legal-external-review-evidence" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing legal external review endpoint")
    for marker in ("data-admin-compliance-api-export", "匯出合規 API 落庫驗收包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing compliance API persistence marker {marker}")
    for marker in ("complianceApiPersistencePayload", "tfse_compliance_api_persistence_package", "compliance_api_persistence_export", "scan_payload_summary_only", "POST /api/admin/compliance/review"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing compliance API persistence marker {marker}")
    if "compliance_api_persistence_packages" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing compliance_api_persistence_packages model")
    if "create table compliance_api_persistence_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing compliance_api_persistence_packages table")
    if "/api/admin/compliance-api-persistence-package" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing compliance API persistence endpoint")
    for marker in ("data-admin-form-risk", "data-admin-form-risk-export", "data-admin-turnstile-export", "表單風險與防刷檢查", "匯出防刷檢查包", "匯出 Turnstile 後端驗收包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing form risk marker {marker}")
    for marker in ("formRiskPayload", "turnstileBackendPayload", "tfse_form_risk_control_report", "tfse_turnstile_backend_verification_package", "form_risk_export", "turnstile_backend_export", "local_deduplicate_window_hours", "turnstile_configured", "duplicateLeadGroups", "negative_test_cases", "siteverify_endpoint"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing form risk marker {marker}")
    if "form_risk_control_reports" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing form_risk_control_reports model")
    if "turnstile_backend_verification_packages" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing turnstile_backend_verification_packages model")
    if "create table form_risk_control_reports" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing form_risk_control_reports table")
    if "create table turnstile_backend_verification_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing turnstile_backend_verification_packages table")
    if "/api/admin/form-risk-control" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing form risk endpoint")
    if "/api/admin/turnstile-backend-verification" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing Turnstile backend verification endpoint")
    for marker in ("data-admin-privacy-requests", "data-admin-privacy-export", "data-admin-privacy-fulfillment-export", "個資請求隊列", "匯出個資履約驗收包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing privacy request marker {marker}")
    for marker in ("privacyRequestItems", "privacyRequestPayload", "privacyFulfillmentPayload", "tfse_privacy_request_queue", "tfse_privacy_fulfillment_verification_package", "privacy_request_export", "privacy_fulfillment_export", "privacy_request_complete", "lead_fields_scrubbed", "phone_last3"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing privacy request marker {marker}")
    if "privacy_request_tasks" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing privacy_request_tasks model")
    if "privacy_fulfillment_verification_packages" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing privacy_fulfillment_verification_packages model")
    if "create table privacy_fulfillment_verification_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing privacy_fulfillment_verification_packages table")
    if "/api/admin/privacy-fulfillment-verification" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing privacy fulfillment verification endpoint")
    for marker in ("data-admin-data-retention", "data-admin-data-retention-export", "資料保留/刪除排程"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing data retention marker {marker}")
    for marker in ("dataRetentionPayload", "tfse_data_retention_purge_plan", "data_retention_export", "retention_rules", "purge_candidates"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing data retention marker {marker}")
    if "data_retention_purge_plans" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing data_retention_purge_plans model")
    if "create table data_retention_purge_plans" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing data_retention_purge_plans table")
    if "/api/admin/data-retention-purge-plan" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing data retention purge plan endpoint")
    for marker in ("article.status !== \"published\"", "visibleArticles().slice"):
        if marker not in articles_script:
            failures.append(f"tfse-articles.js: missing published-only article marker {marker}")
    faq_script = (ROOT / "assets/js" / "tfse-faq.js").read_text(errors="ignore")
    for marker in ("assets/data/faq.json", "tfse_faq_overrides", "data-faq-list", "faq_view"):
        if marker not in faq_script:
            failures.append(f"tfse-faq.js: missing FAQ marker {marker}")
    free_check = (ROOT / "free-check.html").read_text(errors="ignore")
    for marker in ("data-faq-list", "assets/js/tfse-faq.js", "tfseFaqAccordion"):
        if marker not in free_check:
            failures.append(f"free-check.html: missing FAQ marker {marker}")
    search_script = (ROOT / "assets/js" / "tfse-search.js").read_text(errors="ignore")
    for marker in ("assets/data/faq.json", "tfse_faq_overrides", "FAQ", "free-check.html#tfseFaqAccordion"):
        if marker not in search_script:
            failures.append(f"tfse-search.js: missing FAQ search marker {marker}")
    return failures


def verify_admin_backup():
    failures = []
    admin_html = (ROOT / "admin.html").read_text(errors="ignore")
    for marker in ("data-admin-backup-export", "data-admin-migration-export", "data-admin-import-validation-export", "data-admin-restore-drill-export", "data-admin-backup-receipt-export", "data-admin-backup-import", "data-admin-backup-file", "本機備份與遷移包", "匯出正式備份收據驗收包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing backup marker {marker}")
    admin_script = (ROOT / "assets/js/tfse-admin.js").read_text(errors="ignore")
    for marker in ("backupPayload", "migrationPayload", "importValidationPayload", "restoreDrillPayload", "backupReceiptPayload", "tfse_formal_backend_migration_package", "tfse_import_validation_package", "tfse_backup_restore_drill_plan", "tfse_backup_receipt_verification_package", "api-contract.json", "backend-schema.sql", "sensitive_data_policy", "applyBackup", "tfse_local_backup", "backup_export", "migration_export", "import_validation_export", "restore_drill_export", "backup_receipt_export", "backup_import", "data-admin-backup-export", "faq_overrides"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing backup marker {marker}")
    browser_verify = (ROOT / "tools/browser_acceptance_verify.mjs").read_text(errors="ignore")
    for marker in ("admin local backup export", "admin formal migration package export", "admin import validation package export", "admin backup restore drill plan export", "admin backup receipt verification export", "admin local backup import restore drill", "data-admin-backup-file", "backup_import"):
        if marker not in browser_verify:
            failures.append(f"browser_acceptance_verify.mjs: missing backup smoke marker {marker}")
    deployment = (ROOT / "DEPLOYMENT.md").read_text(errors="ignore")
    if "本機備份包" not in deployment or "還原演練" not in deployment:
        failures.append("DEPLOYMENT.md: missing local backup guidance")
    if "tfse_formal_backend_migration_package" not in deployment:
        failures.append("DEPLOYMENT.md: missing formal migration package guidance")
    data_model = (ROOT / "DATA_MODEL.md").read_text(errors="ignore")
    if "migration_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing migration_packages model")
    if "import_validation_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing import_validation_packages model")
    if "backup_restore_drill_plans" not in data_model:
        failures.append("DATA_MODEL.md: missing backup_restore_drill_plans model")
    if "backup_receipt_verification_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing backup_receipt_verification_packages model")
    if "backup_restore_drill_results" not in data_model:
        failures.append("DATA_MODEL.md: missing backup_restore_drill_results model")
    schema = (ROOT / "backend-schema.sql").read_text(errors="ignore")
    if "create table migration_packages" not in schema:
        failures.append("backend-schema.sql: missing migration_packages table")
    if "create table import_validation_packages" not in schema:
        failures.append("backend-schema.sql: missing import_validation_packages table")
    if "create table backup_restore_drill_plans" not in schema:
        failures.append("backend-schema.sql: missing backup_restore_drill_plans table")
    if "create table backup_receipt_verification_packages" not in schema:
        failures.append("backend-schema.sql: missing backup_receipt_verification_packages table")
    if "create table backup_restore_drill_results" not in schema:
        failures.append("backend-schema.sql: missing backup_restore_drill_results table")
    contract = (ROOT / "api-contract.json").read_text(errors="ignore")
    if "/api/admin/migration-package" not in contract:
        failures.append("api-contract.json: missing migration package endpoint")
    if "/api/admin/import-validation-package" not in contract:
        failures.append("api-contract.json: missing import validation package endpoint")
    if "/api/admin/backup-restore-drill-plan" not in contract:
        failures.append("api-contract.json: missing backup restore drill plan endpoint")
    if "/api/admin/backup-receipt-verification" not in contract:
        failures.append("api-contract.json: missing backup receipt verification endpoint")
    return failures


def verify_institutions():
    failures = []
    source_policy = (ROOT / "source-policy.html").read_text(errors="ignore")
    for marker in ("data-institution-directory", "assets/js/tfse-institutions.js"):
        if marker not in source_policy:
            failures.append(f"source-policy.html: missing institution marker {marker}")
    institutions_script = (ROOT / "assets/js/tfse-institutions.js").read_text(errors="ignore")
    for marker in ("assets/data/institutions.json", "institution_directory_view", "data-institution-source"):
        if marker not in institutions_script:
            failures.append(f"tfse-institutions.js: missing marker {marker}")
    search_script = (ROOT / "assets/js/tfse-search.js").read_text(errors="ignore")
    if "assets/data/institutions.json" not in search_script or "公開來源" not in search_script:
        failures.append("tfse-search.js: missing institution search integration")
    admin_script = (ROOT / "assets/js/tfse-admin.js").read_text(errors="ignore")
    if "institutionData" not in admin_script or "公開來源" not in admin_script:
        failures.append("tfse-admin.js: missing institution compliance summary")
    for marker in (
        "sourceReviewItems",
        "sourceReviewPayload",
        "tfse_source_review_queue",
        "sourceEvidencePayload",
        "tfse_source_verification_evidence",
        "source_evidence_export",
        "data-admin-source-review",
        "source_review_export",
        "超過 90 天未更新",
    ):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing source review marker {marker}")
    admin_html = (ROOT / "admin.html").read_text(errors="ignore")
    for marker in ("data-admin-source-review", "data-admin-source-review-export", "data-admin-source-evidence", "data-admin-source-evidence-export", "data-admin-institution-import-export", "data-admin-public-feedback", "data-admin-public-feedback-export", "data-admin-public-feedback-api-export", "來源復核隊列", "匯出復核清單", "匯出來源留痕包", "匯出機構資料導入驗收包", "匯出資料回報工單包", "匯出資料回報 API 驗收包"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing source review marker {marker}")
    for marker in ("institutionImportPayload", "tfse_institution_import_verification_package", "institution_import_export", "institution_source_versions", "stale_or_unverified_items"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing institution import marker {marker}")
    for marker in ("publicFeedbackPayload", "publicFeedbackApiVerificationPayload", "tfse_public_feedback_intake_package", "tfse_public_feedback_api_verification_package", "public_feedback_export", "public_feedback_api_export", "forbidden_fields", "triage_rules", "POST /api/public-feedback"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing public feedback marker {marker}")
    data_model = (ROOT / "DATA_MODEL.md").read_text(errors="ignore")
    if "source_review_tasks" not in data_model:
        failures.append("DATA_MODEL.md: missing source_review_tasks model")
    if "source_verification_evidence" not in data_model:
        failures.append("DATA_MODEL.md: missing source_verification_evidence model")
    if "institution_import_verification_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing institution_import_verification_packages model")
    if "institution_source_versions" not in data_model:
        failures.append("DATA_MODEL.md: missing institution_source_versions model")
    if "public_feedback_tickets" not in data_model:
        failures.append("DATA_MODEL.md: missing public_feedback_tickets model")
    if "public_feedback_api_verification_packages" not in data_model:
        failures.append("DATA_MODEL.md: missing public_feedback_api_verification_packages model")
    schema_text = (ROOT / "backend-schema.sql").read_text(errors="ignore")
    if "create table institution_import_verification_packages" not in schema_text:
        failures.append("backend-schema.sql: missing institution_import_verification_packages table")
    if "create table institution_source_versions" not in schema_text:
        failures.append("backend-schema.sql: missing institution_source_versions table")
    if "create table public_feedback_tickets" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing public_feedback_tickets table")
    if "create table public_feedback_api_verification_packages" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing public_feedback_api_verification_packages table")
    if "/api/admin/institution-import-verification" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing institution import verification endpoint")
    if "/api/admin/public-feedback-intake" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing public feedback intake endpoint")
    if "/api/admin/public-feedback-api-verification" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing public feedback API verification endpoint")
    if "/api/public-feedback" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing public feedback submit endpoint")
    source_audit = (ROOT / "tools/source_freshness_audit.py").read_text(errors="ignore")
    for marker in ("source freshness audit passed", "REVIEW_CYCLE_DAYS = 90", "placeholder source must be", "已核驗 must use an https source_url", "source_pending"):
        if marker not in source_audit:
            failures.append(f"source_freshness_audit.py: missing source freshness marker {marker}")
    return failures


def verify_category_aliases():
    failures = []
    categories = json.loads((ROOT / "assets/data/categories.json").read_text())
    category_script = (ROOT / "assets/js/tfse-categories.js").read_text(errors="ignore")
    for marker in ("slugFromPath", "categoryAliases", "mortgage.html", "anti-fraud.html"):
        if marker not in category_script:
            failures.append(f"tfse-categories.js: missing category alias marker {marker}")
    sitemap = (ROOT / "sitemap.xml").read_text(errors="ignore")
    for item in categories:
        slug = item.get("slug")
        if not slug:
            continue
        path = ROOT / f"{slug}.html"
        if not path.exists():
            failures.append(f"{slug}.html: missing category alias page")
            continue
        text = path.read_text(errors="ignore")
        for marker in ("data-category-detail", "assets/js/tfse-categories.js", REQUIRED_DISCLAIMER):
            if marker not in text:
                failures.append(f"{slug}.html: missing marker {marker}")
        if f"{slug}.html" not in sitemap:
            failures.append(f"sitemap.xml: missing category alias {slug}.html")
    return failures


def verify_landing_aliases():
    failures = []
    landing_pages = json.loads((ROOT / "assets/data/landing-pages.json").read_text())
    admin_html = (ROOT / "admin.html").read_text(errors="ignore")
    admin_script = (ROOT / "assets/js/tfse-admin.js").read_text(errors="ignore")
    for marker in ("data-admin-ad-campaigns", "data-admin-ad-campaigns-export", "data-admin-conversion-backlog", "data-admin-conversion-backlog-export", "廣告落地頁投流檢查", "匯出投流檢查清單", "匯出轉換優化待辦"):
        if marker not in admin_html:
            failures.append(f"admin.html: missing ad campaign marker {marker}")
    for marker in ("adCampaignItems", "adCampaignPayload", "tfse_ad_campaign_checklist", "ad_campaign_export", "conversionBacklogPayload", "tfse_conversion_optimization_backlog", "conversion_backlog_export", "utm_standard", "adCampaignUtmUrl"):
        if marker not in admin_script:
            failures.append(f"tfse-admin.js: missing ad campaign marker {marker}")
    if "ad_campaign_checklists" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing ad_campaign_checklists model")
    if "conversion_optimization_backlogs" not in (ROOT / "DATA_MODEL.md").read_text(errors="ignore"):
        failures.append("DATA_MODEL.md: missing conversion_optimization_backlogs model")
    if "create table conversion_optimization_backlogs" not in (ROOT / "backend-schema.sql").read_text(errors="ignore"):
        failures.append("backend-schema.sql: missing conversion_optimization_backlogs table")
    if "/api/admin/conversion-optimization-backlog" not in (ROOT / "api-contract.json").read_text(errors="ignore"):
        failures.append("api-contract.json: missing conversion optimization backlog endpoint")
    for item in landing_pages:
        slug = item.get("slug", "")
        path = ROOT / "lp" / f"{slug}.html"
        if not path.exists():
            failures.append(f"lp/{slug}.html: missing landing alias page")
            continue
        text = path.read_text(errors="ignore")
        for marker in ('<base href="../">', "data-lp-detail", "assets/js/tfse-landing-pages.js", "assets/js/tfse-lead-form.js", REQUIRED_DISCLAIMER):
            if marker not in text:
                failures.append(f"lp/{slug}.html: missing marker {marker}")
    return failures


def verify_database_aliases():
    failures = []
    aliases = {
        "database/banks.html": ("bank", "銀行金融商品資料庫"),
        "database/finance-companies.html": ("finance_company", "合法融資公司資料庫"),
        "database/credit-unions.html": ("credit_union", "儲蓄互助社資料庫"),
    }
    sitemap = (ROOT / "sitemap.xml").read_text(errors="ignore")
    database_script = (ROOT / "assets/js/tfse-database.js").read_text(errors="ignore")
    for marker in ("data-default-type", "defaultTypeFromPath", "/database/banks", "/database/finance-companies", "/database/credit-unions"):
        if marker not in database_script:
            failures.append(f"tfse-database.js: missing database alias marker {marker}")
    for name, (default_type, title) in aliases.items():
        path = ROOT / name
        if not path.exists():
            failures.append(f"{name}: missing database alias page")
            continue
        text = path.read_text(errors="ignore")
        for marker in ('<base href="../">', f'data-default-type="{default_type}"', title, REQUIRED_DISCLAIMER):
            if marker not in text:
                failures.append(f"{name}: missing marker {marker}")
        if name not in sitemap:
            failures.append(f"sitemap.xml: missing database alias {name}")
    return failures


def verify_detail_aliases():
    failures = []
    products = json.loads((ROOT / "assets/data/products.json").read_text())
    articles = json.loads((ROOT / "assets/data/articles.json").read_text())
    sitemap = (ROOT / "sitemap.xml").read_text(errors="ignore")

    products_script = (ROOT / "assets/js/tfse-products.js").read_text(errors="ignore")
    for marker in ("products/", "slugFromPath", "siteBase", "return \"products/\""):
        if marker not in products_script:
            failures.append(f"tfse-products.js: missing product alias marker {marker}")
    articles_script = (ROOT / "assets/js/tfse-articles.js").read_text(errors="ignore")
    for marker in ("articles/", "slugFromPath", "siteBase", "return \"articles/\""):
        if marker not in articles_script:
            failures.append(f"tfse-articles.js: missing article alias marker {marker}")

    for item in products:
        slug = item.get("slug")
        if not slug:
            continue
        path = ROOT / "products" / f"{slug}.html"
        if not path.exists():
            failures.append(f"products/{slug}.html: missing product alias page")
            continue
        text = path.read_text(errors="ignore")
        for marker in ('<base href="../">', "data-product-detail", "assets/js/tfse-products.js", REQUIRED_DISCLAIMER):
            if marker not in text:
                failures.append(f"products/{slug}.html: missing marker {marker}")
        if f"products/{slug}.html" not in sitemap:
            failures.append(f"sitemap.xml: missing product alias products/{slug}.html")

    for item in articles:
        slug = item.get("slug")
        if not slug:
            continue
        path = ROOT / "articles" / f"{slug}.html"
        if not path.exists():
            failures.append(f"articles/{slug}.html: missing article alias page")
            continue
        text = path.read_text(errors="ignore")
        for marker in ('<base href="../">', "data-article-detail", "assets/js/tfse-articles.js", REQUIRED_DISCLAIMER):
            if marker not in text:
                failures.append(f"articles/{slug}.html: missing marker {marker}")
        if f"articles/{slug}.html" not in sitemap:
            failures.append(f"sitemap.xml: missing article alias articles/{slug}.html")
    return failures


def main():
    failures = verify_required_files() + verify_html() + verify_data() + verify_template_mapping() + verify_backend_schema() + verify_operations_runbook() + verify_ci_workflow() + verify_page_roles() + verify_admin_crm_filters() + verify_lead_forms() + verify_sitemap() + verify_site_urls() + verify_web_manifest() + verify_security_headers() + verify_monitoring() + verify_line_cta() + verify_api_adapter() + verify_content_management() + verify_admin_backup() + verify_institutions() + verify_category_aliases() + verify_landing_aliases() + verify_database_aliases() + verify_detail_aliases()
    if failures:
        for failure in failures:
            print(failure)
        return 1
    print("static site verification passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
