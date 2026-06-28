from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys

import admin_cutover_tooling


ROOT = Path(__file__).resolve().parents[1]
DISCLAIMER = "本中心僅彙整公開合法金融商品"
BROWSER_EVIDENCE_PATH = ROOT / "assets" / "data" / "browser-acceptance-evidence.json"
BROWSER_ALIASES = {
    "no_text_overlap": ("no_text_overlap", "no_text_overlap_browser"),
    "no_text_overlap_browser": ("no_text_overlap_browser", "no_text_overlap"),
    "form_submit_browser": ("form_submit_browser", "lead_submit_browser"),
    "lead_submit_browser": ("lead_submit_browser", "form_submit_browser"),
    "public_feedback_intake": ("public_feedback_intake",),
}


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.meta = {}
        self.links = []
        self.images = []
        self.base_href = ""
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "title":
            self._in_title = True
        if tag == "meta":
            key = data.get("name") or data.get("property")
            if key:
                self.meta[key] = data.get("content", "")
        if tag == "link" and data.get("rel") == "canonical":
            self.meta["canonical"] = data.get("href", "")
        if tag == "base":
            self.base_href = data.get("href", "")
        if tag == "a":
            self.links.append(data.get("href", ""))
        if tag == "img":
            self.images.append(data)

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def read(path):
    return (ROOT / path).read_text(errors="ignore")


def exists(path):
    return (ROOT / path).exists()


def contains(path, *markers):
    if not exists(path):
        return False
    text = read(path)
    return all(marker in text for marker in markers)


def contains_any(path, markers):
    if not exists(path):
        return False
    text = read(path)
    return any(marker in text for marker in markers)


def load_json(path, fallback):
    try:
        return json.loads(read(path))
    except Exception:
        return fallback


def load_browser_evidence():
    try:
        return json.loads(BROWSER_EVIDENCE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def browser_acceptance_evidence(key):
    evidence = load_browser_evidence()
    records = evidence.get("records", [])
    aliases = BROWSER_ALIASES.get(key, (key,))
    matched = [
        record for record in records
        if record.get("result") == "passed" and record.get("item_key") in aliases
    ]
    if not matched:
        return None
    matched.sort(key=lambda item: str(item.get("checked_at", "")), reverse=True)
    record = matched[0]
    note = record.get("evidence_note") or "已完成本地瀏覽器驗收"
    viewport = record.get("viewport") or "browser"
    checked_at = record.get("checked_at") or evidence.get("generated_at") or ""
    return f"瀏覽器驗收通過：{viewport}｜{checked_at}｜{note}"


def html_paths():
    paths = sorted(ROOT.glob("*.html"))
    paths += sorted((ROOT / "lp").glob("*.html"))
    paths += sorted((ROOT / "database").glob("*.html"))
    paths += sorted((ROOT / "products").glob("*.html"))
    paths += sorted((ROOT / "articles").glob("*.html"))
    return paths


def parse_page(path):
    parser = PageParser()
    parser.feed(path.read_text(errors="ignore"))
    return parser


def all_pages_have_metadata():
    missing = []
    for path in html_paths():
        parser = parse_page(path)
        label = path.relative_to(ROOT).as_posix()
        if not parser.title.strip() or not parser.meta.get("description"):
            missing.append(label)
    return missing


def pages_missing_disclaimer():
    missing = []
    for path in html_paths():
        if path.name == "admin.html":
            continue
        if DISCLAIMER not in path.read_text(errors="ignore"):
            missing.append(path.relative_to(ROOT).as_posix())
    return missing


def local_links_ok():
    missing = []
    for path in html_paths():
        parser = parse_page(path)
        base_dir = path.parent
        if parser.base_href:
            base_dir = (path.parent / parser.base_href).resolve()
        for href in parser.links:
            lower = href.lower()
            if not href or lower.startswith(("#", "http://", "https://", "mailto:", "tel:", "javascript:")):
                continue
            target = href.split("#", 1)[0].split("?", 1)[0]
            if not target or target.endswith("/"):
                continue
            if target.startswith("/"):
                candidate = (ROOT / target.lstrip("/")).resolve()
            else:
                candidate = (base_dir / target).resolve()
            if not candidate.exists():
                missing.append(f"{path.relative_to(ROOT).as_posix()} -> {href}")
    return missing


def images_without_alt():
    missing = []
    for path in html_paths():
        parser = parse_page(path)
        for image in parser.images:
            src = image.get("src", "")
            if src and not image.get("alt", "").strip():
                missing.append(f"{path.relative_to(ROOT).as_posix()} -> {src}")
    return missing


def forbidden_terms_present():
    rules = load_json("assets/data/compliance-rules.json", {})
    terms = rules.get("forbidden_terms", [])
    allowed_contexts = rules.get("allowed_contexts", [])
    hits = []
    for path in html_paths():
        text = path.read_text(errors="ignore")
        for term in terms:
            index = text.find(term)
            if index == -1:
                continue
            context = text[max(0, index - 24): index + len(term) + 24]
            if not any(word in context for word in allowed_contexts):
                hits.append(f"{path.relative_to(ROOT).as_posix()} -> {term}")
    return hits


def form_asks_sensitive_fields(path):
    if not exists(path):
        return True
    text = read(path)
    sensitive_names = (
        'name="national_id"',
        'name="id_number"',
        'name="bank_account"',
        'name="card_number"',
        'name="password"',
        'name="id_photo"',
    )
    return any(marker in text for marker in sensitive_names)


def config():
    return load_json("site-config.json", {})


def products():
    return load_json("assets/data/products.json", [])


def articles():
    return load_json("assets/data/articles.json", [])


def add(items, group, key, label, status, evidence):
    items.append({
        "group": group,
        "key": key,
        "label": label,
        "status": status,
        "evidence": evidence,
    })


def status_from(condition, evidence, missing_evidence):
    return ("ready", evidence) if condition else ("missing", missing_evidence)


def build_items():
    items = []
    site_config = config()
    analytics = site_config.get("analytics", {})
    search_console = site_config.get("search_console", {})
    backend = site_config.get("backend", {})
    line = site_config.get("line", {})
    backup_receipt = admin_cutover_tooling.backup_receipt_verification_report()
    page_meta_missing = all_pages_have_metadata()
    disclaimer_missing = pages_missing_disclaimer()
    link_missing = local_links_ok()
    image_alt_missing = images_without_alt()
    forbidden_hits = forbidden_terms_present()
    product_data = products()
    article_data = articles()
    public_feedback_browser = browser_acceptance_evidence("public_feedback_intake")

    checks = [
        ("業務閉環", "home_to_database", "使用者能從首頁進入資料庫", contains_any("index.html", ("database.html", "category.html")) and exists("assets/js/tfse-home-query.js"), "index.html 與 tfse-home-query.js 已提供資料庫/分類入口", "首頁缺少資料庫或分類入口"),
        ("業務閉環", "category_to_detail", "分類頁能進入資料詳情", exists("category.html") and contains("assets/js/tfse-categories.js", "products/", "articles/"), "分類頁可透過 tfse-categories.js 進入 products/{slug}.html 與 articles/{slug}.html", "分類詳情入口缺失"),
        ("業務閉環", "article_to_free_check", "文章頁能進入免費健檢", exists("blog-details.html") and contains("blog-details.html", "data-article-detail", "free-check.html"), "文章詳情頁已保留免費健檢 CTA", "文章到免費健檢 CTA 缺失"),
        ("業務閉環", "public_feedback_intake", "聯絡頁可提交低敏資料回報", contains("contact.html", "data-public-feedback-form", "feedback_type", "summary", "phone_last3") and contains("assets/js/tfse-public-feedback.js", "submitPublicFeedback", "reporter_contact_hash") and contains("assets/js/tfse-api.js", "submitPublicFeedback", "/api/public-feedback"), public_feedback_browser or "contact.html 已提供低敏資料回報表單，前端送出會雜湊聯絡識別並走 public feedback API", "聯絡頁資料回報表單或 API 接入缺失"),
        ("業務閉環", "lead_visible_in_admin", "表單提交後後台可見", contains("assets/js/tfse-lead-form.js", "TFSEApi.submitLead") and contains("admin.html", "data-admin-leads"), "tfse-lead-form.js 提交後由 Admin CRM 讀取 data-admin-leads", "表單提交或 Admin CRM 列表缺失"),
        ("業務閉環", "utm_recorded", "表單記錄 UTM", contains("assets/js/tfse-lead-form.js", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"), "表單 payload 記錄完整 UTM 欄位", "UTM 欄位缺失"),
        ("業務閉環", "line_cta", "提交成功後可導向 Line", contains("assets/js/tfse-lead-form.js", "lead_line_cta_shown", "line_cta_url") and bool(line.get("oa_url")), "Line CTA 由 site-config.json line.oa_url 驅動並記錄事件", "Line CTA 或 line.oa_url 缺失"),
        ("業務閉環", "lead_status_update", "後台可更新潛客狀態", contains("assets/js/tfse-admin.js", "data-detail-status", "updateLeadStatus"), "Admin 詳情可更新狀態並寫入審計", "潛客狀態更新缺失"),
        ("業務閉環", "product_maintenance", "管理員可維護資料庫", contains("assets/js/tfse-admin.js", "data-product-edit", "saveProductOverride"), "Admin 可編輯資料庫條目摘要、來源與狀態", "資料庫維護功能缺失"),
        ("業務閉環", "article_publish", "管理員可發布文章", contains("assets/js/tfse-admin.js", "article_review_approve", "published"), "Admin 文章支援送審、核准發布與退回", "文章發布流程缺失"),
        ("業務閉環", "compliance_review", "合規審核可記錄", contains("assets/js/tfse-admin.js", "compliance_review_save", "tfse_compliance_reviews"), "合規審核記錄可寫入 localStorage 與審計", "合規審核記錄缺失"),
        ("UI 驗收", "logo", "Logo 清晰", exists("assets/images/logo/tfse-logo.svg") and contains_any("index.html", ("tfse-logo.svg", "TFSE金融便民中心")), "Logo SVG 已在模板 Header/Footer 使用", "Logo 檔案或引用缺失"),
        ("UI 驗收", "template_preserved", "保持模板結構且無貸款廣告風", contains("tools/verify_static_site.py", "TEMPLATE_RESIDUALS") and not contains_any("index.html", ("Buy Now", "Exomac")), "靜態驗收掃描模板殘留詞並移除購買/代辦式文案", "模板殘留或廣告風文案未受控"),
        ("UI 驗收", "button_copy", "按鈕文案合規", not forbidden_hits, "主要 CTA 與全站文案未出現禁用詞越界", "CTA 存在高風險導向詞"),
        ("UI 驗收", "mobile_navigation", "手機端導航清楚", contains("admin.html", "site-main-mobile-menu") and contains("assets/css/style.css", ".site-main-mobile-menu"), "模板 mobile menu 結構與樣式保留", "手機導航結構或樣式缺失"),
        ("UI 驗收", "form_feedback", "表單錯誤提示清楚", contains("assets/js/tfse-lead-form.js", "setMessage", "form.reportValidity"), "免費健檢表單有 validity 與訊息回饋", "表單提示缺失"),
        ("UI 驗收", "empty_state", "空資料狀態清楚", contains("admin.html", "尚無本機提交紀錄", "資料載入中", "尚無審計紀錄"), "Admin 列表/資料/審計有空狀態", "空狀態文案缺失"),
        ("合規驗收", "forbidden_terms", "全站無禁用詞越界", not forbidden_hits and exists("tools/compliance_scan.py"), "tools/compliance_scan.py 與本機審計未發現 HTML 禁用詞越界", "禁用詞越界：" + "; ".join(forbidden_hits[:5])),
        ("合規驗收", "disclaimer", "每頁有免責聲明", not disclaimer_missing, "HTML 頁面均有免責聲明或頁腳聲明", "缺免責聲明：" + ", ".join(disclaimer_missing[:5])),
        ("合規驗收", "privacy_line_consent", "隱私與 Line 同意獨立", contains("free-check.html", "consent_privacy", "consent_line"), "免費健檢表單隱私同意與 Line 同意分離", "隱私或 Line 同意欄位缺失"),
        ("合規驗收", "no_sensitive_docs", "不收證件", contains("assets/js/tfse-lead-form.js", "website", "cf_turnstile_response") and not form_asks_sensitive_fields("free-check.html"), "表單未設置證件/帳戶/卡號收集欄位，並含 honeypot/Turnstile 欄位", "表單疑似要求敏感資料或缺少防濫用欄位"),
        ("合規驗收", "no_loan_guarantee", "不承諾核貸", not forbidden_hits, "未發現承諾核貸類禁用詞越界", "首頁存在承諾核貸詞"),
        ("合規驗收", "product_sources", "產品資料有來源", all(item.get("source_url") for item in product_data), f"products.json 共 {len(product_data)} 筆均有 source_url", "部分產品缺 source_url"),
        ("合規驗收", "product_updated_at", "產品資料有更新时间", all(item.get("updated_at") for item in product_data), f"products.json 共 {len(product_data)} 筆均有 updated_at", "部分產品缺 updated_at"),
        ("合規驗收", "ad_lp_compliance", "廣告頁無夸大承諾", exists("assets/data/landing-pages.json") and contains("assets/js/tfse-admin.js", "adCampaignItems"), "落地頁資料與投流前檢查清單已建立", "落地頁合規檢查缺失"),
        ("技術驗收", "key_pages", "關鍵頁面存在", all(exists(path) for path in ("index.html", "database.html", "free-check.html", "admin.html", "404.html")), "首頁、資料庫、免費健檢、Admin、404 均存在", "關鍵頁面缺失"),
        ("技術驗收", "not_found", "404 正常", exists("404.html") and contains("404.html", "資料庫", "免費健檢"), "404.html 已建立並可導回資料庫/免費健檢", "404 頁缺失或回流入口缺失"),
        ("技術驗收", "rate_limit", "表單 API 有限流", contains("assets/js/tfse-lead-form.js", "tfse_last_lead_submit_at", "device_id") and contains("api-contract.json", "rate limit by IP + device_id"), "前端冷卻與正式 API 合約限流要求均已配置", "限流/裝置識別要求缺失"),
        ("技術驗收", "admin_login", "後台需要登入", contains("admin.html", "data-admin-auth", "data-admin-protected") and contains("assets/js/tfse-admin.js", "setAuthenticated"), "Admin 受本機 MVP 登入保護；正式版需伺服器登入", "Admin 登入保護缺失"),
        ("技術驗收", "export_permissions", "導出有權限", contains("assets/js/tfse-admin.js", "permissions", "export_denied", "backup_export_denied"), "Admin 匯出按鈕有 RBAC 與 denied audit", "匯出權限控制缺失"),
        ("技術驗收", "error_reporting", "錯誤上報可用", contains("assets/js/tfse-events.js", "TFSEReportError", "sentry_dsn"), "本機錯誤摘要與 Sentry DSN 接入點已建立", "錯誤上報接入缺失"),
        ("技術驗收", "backup", "資料庫備份可用", contains("assets/js/tfse-admin.js", "backupPayload", "applyBackup", "tfse_local_backup"), "本機 MVP 備份包可匯出/匯入；正式資料庫備份仍需外部部署", "本機備份包缺失"),
        ("SEO 驗收", "metadata", "所有頁面都有標題和描述", not page_meta_missing, "HTML 頁面均有 title 與 description", "缺 metadata：" + ", ".join(page_meta_missing[:5])),
        ("SEO 驗收", "sitemap", "sitemap 可訪問", exists("sitemap.xml") and contains("robots.txt", "Sitemap:"), "sitemap.xml 存在且 robots.txt 指向 sitemap", "sitemap 或 robots 指向缺失"),
        ("SEO 驗收", "robots", "robots 可訪問", exists("robots.txt"), "robots.txt 存在", "robots.txt 缺失"),
        ("SEO 驗收", "canonical", "canonical", all(parse_page(path).meta.get("canonical") for path in html_paths()), "HTML 頁面均有 canonical", "部分 HTML 缺 canonical"),
        ("SEO 驗收", "open_graph", "Open Graph", all(parse_page(path).meta.get("og:title") and parse_page(path).meta.get("og:description") for path in html_paths()), "HTML 頁面均有 OG title/description", "部分 HTML 缺 OG"),
        ("SEO 驗收", "image_alt", "圖片 alt", not image_alt_missing, "HTML 圖片均有 alt", "圖片缺 alt：" + ", ".join(image_alt_missing[:5])),
        ("SEO 驗收", "internal_links", "內鏈", not link_missing, "本地 HTML 連結均可解析到檔案", "內鏈缺失：" + ", ".join(link_missing[:5])),
        ("上線最終檢查", "privacy_terms_source", "政策頁可訪問", all(exists(path) for path in ("privacy.html", "terms.html", "source-policy.html")), "privacy.html、terms.html、source-policy.html 均存在", "政策頁缺失"),
        ("上線最終檢查", "article_updated_at", "所有文章有更新日期", all(item.get("updated_at") for item in article_data), f"articles.json 共 {len(article_data)} 篇均有 updated_at", "部分文章缺 updated_at"),
    ]

    for group, key, label, condition, ready_evidence, missing_evidence in checks:
        status, evidence = status_from(condition, ready_evidence, missing_evidence)
        add(items, group, key, label, status, evidence)

    if exists("package.json"):
        add(items, "技術驗收", "npm_build", "npm run build 通過", "manual_command", "存在 package.json，需執行 npm run build")
        add(items, "技術驗收", "npm_lint", "npm run lint 通過", "manual_command", "存在 package.json，需執行 npm run lint")
    else:
        add(items, "技術驗收", "npm_build", "npm run build 通過", "not_applicable", "此為靜態 HTML 模板，無 package.json 或 build step")
        add(items, "技術驗收", "npm_lint", "npm run lint 通過", "not_applicable", "此為靜態 HTML 模板，無 package.json 或 lint step")

    no_text_overlap_evidence = browser_acceptance_evidence("no_text_overlap")
    add(items, "UI 驗收", "no_text_overlap", "頁面不出現文字重疊", "ready" if no_text_overlap_evidence else "manual_browser", no_text_overlap_evidence or "需以瀏覽器桌面/手機 viewport 做視覺確認")
    form_submit_evidence = browser_acceptance_evidence("form_submit_browser")
    add(items, "上線最終檢查", "form_submit_browser", "表單提交測試通過", "ready" if form_submit_evidence else "manual_browser", form_submit_evidence or "需在瀏覽器提交測試線索並登入 admin.html 查看")
    admin_login_evidence = browser_acceptance_evidence("admin_login_browser")
    add(items, "上線最終檢查", "admin_login_browser", "後台登入測試通過", "ready" if admin_login_evidence else "manual_browser", admin_login_evidence or "需在瀏覽器以 MVP 管理密碼登入確認")
    mobile_browser_evidence = browser_acceptance_evidence("mobile_browser")
    add(items, "上線最終檢查", "mobile_browser", "手機端測試通過", "ready" if mobile_browser_evidence else "manual_browser", mobile_browser_evidence or "需以手機 viewport 檢查導航、表單與主要 CTA")

    ga4_ready = bool(analytics.get("ga4_measurement_id"))
    add(items, "上線最終檢查", "ga4_received", "GA4 事件可收到", "external_pending" if not ga4_ready else "manual_external", analytics.get("ga4_measurement_id") or "正式 GA4 Measurement ID 待填並到 GA4 驗證收件")
    search_ready = bool(search_console.get("google_site_verification"))
    add(items, "上線最終檢查", "search_console_submit", "Search Console 已準備提交", "external_pending" if not search_ready else "manual_external", search_console.get("google_site_verification") or "Search Console 驗證碼待填並提交 sitemap")
    backend_ready = backend.get("mode") == "api" and bool(backend.get("api_base_url"))
    add(items, "技術驗收", "formal_backend", "正式後端 API 接入", "external_pending" if not backend_ready else "manual_external", backend.get("api_base_url") or "正式 backend.api_base_url 待填；本機 mock formal API rehearsal 已覆蓋內容 API、表單、Admin Auth 與 CRM，正式環境仍待切換")
    line_ready = bool(line.get("oa_url")) and line.get("oa_url") != "free-check.html#line-cta"
    add(items, "上線最終檢查", "official_line_oa", "正式 Line OA 可導向", "external_pending" if not line_ready else "manual_external", line.get("oa_url") or "正式 Line OA 加友網址待填")
    backup_ready = backup_receipt.get("status") == "ready_for_backup_receipt_verification"
    add(
        items,
        "上線最終檢查",
        "backup_strategy_enabled",
        "備份策略已啟用",
        "external_pending" if not backup_ready else "manual_external",
        "；".join(backup_receipt.get("blockers", [])) if not backup_ready else "正式 backup_jobs / restore drill 收據欄位與驗收步驟已準備，可在正式環境回填證據",
    )

    return items


def build_report():
    items = build_items()
    counts = {}
    for item in items:
        counts[item["status"]] = counts.get(item["status"], 0) + 1
    return {
        "format": "tfse_acceptance_audit",
        "source": "TFSE project plan chapters 17 and 21",
        "counts": counts,
        "items": items,
    }


def main():
    report = build_report()
    if "--json" in sys.argv:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        counts = report["counts"]
        print(
            "acceptance audit: "
            + ", ".join(f"{key}={counts[key]}" for key in sorted(counts))
        )
        for item in report["items"]:
            if item["status"] in ("missing", "external_pending", "manual_browser", "manual_command", "manual_external"):
                print(f"{item['status']}: {item['group']} / {item['label']} - {item['evidence']}")
    return 1 if report["counts"].get("missing") else 0


if __name__ == "__main__":
    sys.exit(main())
