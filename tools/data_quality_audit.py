from pathlib import Path
from urllib.parse import urlparse
import json
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
DISCLAIMER = "本中心僅彙整公開合法金融商品"


def load_json(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def add_missing(failures, source, item_id, item, fields):
    for field in fields:
        value = item.get(field)
        if value is None or value == "" or value == []:
            failures.append(f"{source}: {item_id} missing {field}")


def unique_values(failures, source, items, field):
    seen = {}
    for item in items:
        value = item.get(field, "")
        if not value:
            continue
        if value in seen:
            failures.append(f"{source}: duplicate {field} {value}")
        seen[value] = True


def valid_slug(value):
    return bool(value and SLUG_RE.match(value))


def valid_date(value):
    return bool(value and DATE_RE.match(value))


def valid_url_or_local(value):
    if not value:
        return False
    parsed = urlparse(value)
    if parsed.scheme in ("http", "https") and parsed.netloc:
        return True
    return value.endswith(".html") or ".html?" in value or value.startswith("source-policy.html")


def audit_categories(categories):
    failures = []
    if len(categories) < 8:
        failures.append("categories.json: expected at least 8 TFSE categories")
    unique_values(failures, "categories.json", categories, "slug")
    for item in categories:
        item_id = item.get("slug", "unknown")
        add_missing(failures, "categories.json", item_id, item, ("slug", "title", "short_title", "description", "audience", "needs", "product_categories", "article_keywords", "faq"))
        if item.get("slug") and not valid_slug(item["slug"]):
            failures.append(f"categories.json: invalid slug {item['slug']}")
        if len(item.get("faq", [])) < 2:
            failures.append(f"categories.json: {item_id} expected at least 2 FAQ items")
    return failures


def audit_products(products, categories):
    failures = []
    category_keys = {key for item in categories for key in item.get("product_categories", [])}
    if len(products) < 30:
        failures.append("products.json: expected at least 30 product records")
    unique_values(failures, "products.json", products, "id")
    unique_values(failures, "products.json", products, "slug")
    for item in products:
        item_id = item.get("id") or item.get("slug") or "unknown"
        add_missing(failures, "products.json", item_id, item, ("id", "slug", "title", "type", "type_label", "category", "category_label", "audience", "region", "status", "source_title", "source_url", "updated_at", "summary", "checks"))
        if item.get("slug") and not valid_slug(item["slug"]):
            failures.append(f"products.json: invalid slug {item['slug']}")
        if item.get("category") and item["category"] not in category_keys:
            failures.append(f"products.json: {item_id} category {item['category']} not mapped by categories.json")
        if item.get("updated_at") and not valid_date(item["updated_at"]):
            failures.append(f"products.json: {item_id} updated_at must use YYYY-MM-DD")
        if item.get("source_url") and not valid_url_or_local(item["source_url"]):
            failures.append(f"products.json: {item_id} source_url should be https URL or local policy/detail page")
        if len(item.get("summary", "")) < 24:
            failures.append(f"products.json: {item_id} summary too short for public info card")
        if len(item.get("checks", [])) < 3:
            failures.append(f"products.json: {item_id} expected at least 3 self-check items")
    return failures


def audit_articles(articles):
    failures = []
    if len(articles) < 40:
        failures.append("articles.json: expected at least 40 first-batch articles")
    unique_values(failures, "articles.json", articles, "id")
    unique_values(failures, "articles.json", articles, "slug")
    for item in articles:
        item_id = item.get("id") or item.get("slug") or "unknown"
        add_missing(failures, "articles.json", item_id, item, ("id", "slug", "title", "category", "status", "updated_at", "seo_title", "seo_description", "summary", "keywords", "compliance_note"))
        if item.get("slug") and not valid_slug(item["slug"]):
            failures.append(f"articles.json: invalid slug {item['slug']}")
        if item.get("updated_at") and not valid_date(item["updated_at"]):
            failures.append(f"articles.json: {item_id} updated_at must use YYYY-MM-DD")
        if item.get("status") not in ("published", "draft", "in_review", "archived"):
            failures.append(f"articles.json: {item_id} invalid status {item.get('status')}")
        if len(item.get("seo_description", "")) < 24:
            failures.append(f"articles.json: {item_id} seo_description too short")
        if len(item.get("keywords", [])) < 3:
            failures.append(f"articles.json: {item_id} expected at least 3 keywords")
        if "TFSE" not in item.get("seo_title", ""):
            failures.append(f"articles.json: {item_id} seo_title should include TFSE brand")
    return failures


def audit_landing_pages(pages, categories):
    failures = []
    category_slugs = {item.get("slug") for item in categories}
    if len(pages) < 8:
        failures.append("landing-pages.json: expected first 8 ad landing pages")
    unique_values(failures, "landing-pages.json", pages, "slug")
    for item in pages:
        item_id = item.get("slug", "unknown")
        add_missing(failures, "landing-pages.json", item_id, item, ("slug", "title", "short_title", "pain", "category_slug", "need_label", "product_categories", "article_keywords", "faq"))
        if item.get("slug") and not valid_slug(item["slug"]):
            failures.append(f"landing-pages.json: invalid slug {item['slug']}")
        if item.get("category_slug") not in category_slugs:
            failures.append(f"landing-pages.json: {item_id} category_slug {item.get('category_slug')} not found in categories.json")
        if len(item.get("faq", [])) < 2:
            failures.append(f"landing-pages.json: {item_id} expected at least 2 FAQ items")
    return failures


def audit_institutions(institutions):
    failures = []
    if len(institutions) < 5:
        failures.append("institutions.json: expected at least 5 public sources")
    unique_values(failures, "institutions.json", institutions, "id")
    for item in institutions:
        item_id = item.get("id", "unknown")
        add_missing(failures, "institutions.json", item_id, item, ("id", "name", "type", "type_label", "region", "official_url", "registry_ref", "verification_status", "last_verified_at", "summary"))
        if item.get("official_url") and not valid_url_or_local(item["official_url"]):
            failures.append(f"institutions.json: {item_id} official_url should be https URL or local page")
        if item.get("last_verified_at") and not valid_date(item["last_verified_at"]):
            failures.append(f"institutions.json: {item_id} last_verified_at must use YYYY-MM-DD")
    return failures


def audit_line_flows(line_flows, categories):
    failures = []
    quick_replies = line_flows.get("quick_replies", [])
    tags = set(line_flows.get("tags", []))
    if len(quick_replies) < 6:
        failures.append("line-flows.json: expected at least 6 quick replies")
    category_hrefs = {item.get("slug") + ".html" for item in categories}
    category_hrefs.add("free-check.html")
    for item in quick_replies:
        label = item.get("label", "unknown")
        add_missing(failures, "line-flows.json", label, item, ("label", "tag", "href", "reply", "boundary", "article_href", "database_href", "free_check_href"))
        if item.get("tag") and item["tag"] not in tags:
            failures.append(f"line-flows.json: quick reply {label} tag not listed in tags")
        if item.get("href") and item["href"] not in category_hrefs:
            failures.append(f"line-flows.json: quick reply {label} href {item['href']} not mapped to category/free-check")
        if item.get("boundary") and not any(marker in item["boundary"] for marker in ("不代辦", "不代收", "不代表", "不是", "不是核貸結果")):
            failures.append(f"line-flows.json: quick reply {label} boundary should state TFSE limits")
        for field in ("article_href", "database_href", "free_check_href"):
            if item.get(field) and not valid_url_or_local(item[field]):
                failures.append(f"line-flows.json: quick reply {label} {field} should be local page or https URL")
        if item.get("article_href") and "articles/" not in item["article_href"]:
            failures.append(f"line-flows.json: quick reply {label} article_href should point to article detail")
        if item.get("free_check_href") and "utm_source=line" not in item["free_check_href"]:
            failures.append(f"line-flows.json: quick reply {label} free_check_href should preserve Line UTM")
    for required in ("need_credit_loan", "need_mortgage", "need_vehicle", "need_credit_union", "need_debt_law", "form_submitted", "line_opt_in"):
        if required not in tags:
            failures.append(f"line-flows.json: missing tag {required}")
    return failures


def audit_compliance_rules(rules):
    failures = []
    if DISCLAIMER not in rules.get("required_disclaimer", ""):
        failures.append("compliance-rules.json: required_disclaimer does not match TFSE disclaimer marker")
    for term in ("包過", "保證核貸", "快速放款", "內部管道", "額度保證", "免審核", "不看聯徵", "代收證件", "送件"):
        if term not in rules.get("forbidden_terms", []):
            failures.append(f"compliance-rules.json: missing forbidden term {term}")
    for step in ("免責聲明", "來源", "證件", "CTA", "Line"):
        if not any(step in item for item in rules.get("review_steps", [])):
            failures.append(f"compliance-rules.json: review_steps missing {step}")
    return failures


def audit_browser_acceptance_evidence(evidence):
    failures = []
    if evidence.get("format") != "tfse_browser_acceptance_evidence_seed":
        failures.append("browser-acceptance-evidence.json: unexpected format")
    records = evidence.get("records", [])
    required = {"no_text_overlap", "mobile_browser", "admin_login_browser", "form_submit_browser"}
    keys = {item.get("item_key") for item in records if item.get("result") == "passed"}
    for key in sorted(required - keys):
        failures.append(f"browser-acceptance-evidence.json: missing passed record {key}")
    for item in records:
        item_id = item.get("item_key", "unknown")
        add_missing(failures, "browser-acceptance-evidence.json", item_id, item, ("item_key", "item_label", "group", "viewport", "result", "evidence_note", "checked_by_role", "checked_at", "source_labels"))
        if item.get("result") != "passed":
            failures.append(f"browser-acceptance-evidence.json: {item_id} should be passed")
        if not isinstance(item.get("source_labels"), list) or not item.get("source_labels"):
            failures.append(f"browser-acceptance-evidence.json: {item_id} expected non-empty source_labels")
    return failures


def main():
    try:
        categories = load_json("categories.json")
        products = load_json("products.json")
        articles = load_json("articles.json")
        landing_pages = load_json("landing-pages.json")
        institutions = load_json("institutions.json")
        line_flows = load_json("line-flows.json")
        rules = load_json("compliance-rules.json")
        browser_evidence = load_json("browser-acceptance-evidence.json")
    except Exception as error:
        print(f"data quality audit load failed: {error}")
        return 1

    failures = []
    failures += audit_categories(categories)
    failures += audit_products(products, categories)
    failures += audit_articles(articles)
    failures += audit_landing_pages(landing_pages, categories)
    failures += audit_institutions(institutions)
    failures += audit_line_flows(line_flows, categories)
    failures += audit_compliance_rules(rules)
    failures += audit_browser_acceptance_evidence(browser_evidence)

    if failures:
        for failure in failures:
            print(failure)
        return 1
    print("data quality audit passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
