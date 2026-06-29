#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import quote
from email.utils import format_datetime
from datetime import datetime, timezone
import html
import json
import re


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "site-config.json"
BASE_URL_RE = re.compile(r"https://[^\"'\s<>]+(?:/finance_webto)?")
KNOWN_HOST_RE = re.compile(r"https://(?:windzlc-code\.github\.io/finance_webto|www\.tfse\.tw|tfse\.tw)")


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def clean_base_url(value):
    return str(value).strip().rstrip("/")


def site_url(path=""):
    base = clean_base_url(load_json(CONFIG_PATH)["base_url"])
    path = str(path).lstrip("/")
    return f"{base}/{path}" if path else f"{base}/"


def product_detail_path(slug):
    return f"products/{quote(str(slug))}.html"


def article_detail_path(slug):
    return f"articles/{quote(str(slug))}.html"


def canonical_path_for_html(path):
    relative = path.relative_to(ROOT).as_posix()
    if relative == "index.html":
        return ""
    if relative == "contact-us.html":
        return "contact.html"
    return relative


def html_paths():
    return (
        sorted(ROOT.glob("*.html"))
        + sorted((ROOT / "lp").glob("*.html"))
        + sorted((ROOT / "database").glob("*.html"))
        + sorted((ROOT / "products").glob("*.html"))
        + sorted((ROOT / "articles").glob("*.html"))
    )


def replace_head_url(text, tag_name, marker, attr, value):
    pattern = re.compile(rf'(<{tag_name}\b(?=[^>]*{re.escape(marker)})[^>]*\b{attr}=)"[^"]*"', re.IGNORECASE)
    return pattern.sub(rf'\1"{value}"', text, count=1)


def update_google_site_verification(text, token):
    pattern = re.compile(r'\n?\s*<meta\s+name="google-site-verification"\s+content="[^"]*"\s*/?>', re.IGNORECASE)
    text = pattern.sub("", text)
    token = str(token or "").strip()
    if not token:
        return text
    meta = f'    <meta name="google-site-verification" content="{html.escape(token, quote=True)}">'
    if '<meta name="viewport"' in text:
        return re.sub(r'(\s*<meta name="viewport"[^>]*>)', r'\1\n' + meta, text, count=1, flags=re.IGNORECASE)
    return text.replace("</head>", meta + "\n</head>", 1)


def update_rss_alternate(text, config):
    title = html.escape(f"{config.get('site_name', 'TFSE金融便民中心')} RSS", quote=True)
    href = html.escape(site_url("feed.xml"), quote=True)
    pattern = re.compile(r'\n?\s*<link\s+rel="alternate"\s+type="application/rss\+xml"[^>]*>', re.IGNORECASE)
    text = pattern.sub("", text)
    link = f'    <link rel="alternate" type="application/rss+xml" title="{title}" href="{href}">'
    if "</head>" in text:
        return text.replace("</head>", link + "\n</head>", 1)
    return text


def ensure_head_tag(text, pattern, tag):
    text = pattern.sub("", text)
    if "</head>" in text:
        return text.replace("</head>", tag + "\n</head>", 1)
    return text


def update_app_manifest_links(text):
    tags = [
        '    <link rel="manifest" href="site.webmanifest">',
        '    <meta name="theme-color" content="#1292ee">',
        '    <link rel="apple-touch-icon" href="assets/images/favicon.png">',
    ]
    replacements = (
        (re.compile(r'\n?\s*<link\s+rel="manifest"[^>]*>', re.IGNORECASE), tags[0]),
        (re.compile(r'\n?\s*<meta\s+name="theme-color"[^>]*>', re.IGNORECASE), tags[1]),
        (re.compile(r'\n?\s*<link\s+rel="apple-touch-icon"[^>]*>', re.IGNORECASE), tags[2]),
    )
    for pattern, tag in replacements:
        text = ensure_head_tag(text, pattern, tag)
    return text


def json_ld_script(data):
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    return '<script type="application/ld+json" id="tfse-structured-data">' + payload + "</script>"


def base_structured_data(config, path):
    site_name = config.get("site_name", "TFSE金融便民中心")
    canonical_path = canonical_path_for_html(path)
    page_url = site_url(canonical_path)
    org_id = site_url("#organization")
    website_id = site_url("#website")
    graph = [
        {
            "@type": "Organization",
            "@id": org_id,
            "name": site_name,
            "url": site_url(),
            "logo": site_url(config.get("og_image", "assets/images/logo/tfse-logo.png")),
            "description": "TFSE 僅彙整公開合法金融商品與法令資訊，非銀行、放款機構或貸款代辦單位。",
        },
        {
            "@type": "WebSite",
            "@id": website_id,
            "name": site_name,
            "url": site_url(),
            "publisher": {"@id": org_id},
            "inLanguage": "zh-TW",
            "potentialAction": {
                "@type": "SearchAction",
                "target": site_url("search.html?q={search_term_string}"),
                "query-input": "required name=search_term_string",
            },
        },
        {
            "@type": "WebPage",
            "@id": page_url + "#webpage",
            "url": page_url,
            "name": site_name,
            "isPartOf": {"@id": website_id},
            "publisher": {"@id": org_id},
            "inLanguage": "zh-TW",
        },
    ]
    relative = path.relative_to(ROOT).as_posix()
    if relative in ("articles.html", "blog-grid.html", "blog-classic.html"):
        articles = [
            item for item in load_json(ROOT / "assets/data/articles.json")
            if item.get("status") == "published"
        ]
        graph.append({
            "@type": "Blog",
            "@id": page_url + "#blog",
            "url": page_url,
            "name": "TFSE 金融知識文章",
            "isPartOf": {"@id": website_id},
            "blogPost": [
                {
                    "@type": "BlogPosting",
                    "headline": item.get("title", ""),
                    "description": item.get("seo_description") or item.get("summary", ""),
                    "dateModified": item.get("updated_at", ""),
                    "url": site_url(article_detail_path(item["slug"])),
                }
                for item in articles[:20]
            ],
        })
    if relative in ("database.html", "service.html", "work.html"):
        products = load_json(ROOT / "assets/data/products.json")
        graph.append({
            "@type": "ItemList",
            "@id": page_url + "#financial-information-list",
            "name": "TFSE 金融公開資訊資料庫",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": index + 1,
                    "url": site_url(product_detail_path(item["slug"])),
                    "name": item.get("title", ""),
                    "description": item.get("summary", ""),
                }
                for index, item in enumerate(products[:30])
            ],
        })
    if relative == "free-check.html":
        graph.append({
            "@type": "Service",
            "@id": page_url + "#free-check",
            "name": "免費財務健檢需求整理",
            "provider": {"@id": org_id},
            "serviceType": "公開金融資訊整理與法令導引",
            "areaServed": "TW",
            "description": "免費健檢僅整理需求與公開資訊查詢方向，不代辦貸款、不代收證件、不保證核貸。",
        })
    return {"@context": "https://schema.org", "@graph": graph}


def update_structured_data(text, config, path):
    pattern = re.compile(r'\n?\s*<script\s+type="application/ld\+json"\s+id="tfse-structured-data">.*?</script>', re.IGNORECASE | re.DOTALL)
    text = pattern.sub("", text)
    script = "    " + json_ld_script(base_structured_data(config, path))
    if "</head>" in text:
        return text.replace("</head>", script + "\n</head>", 1)
    return text


def update_html_meta():
    config = load_json(CONFIG_PATH)
    og_image = site_url(config.get("og_image", "assets/images/logo/tfse-logo.png"))
    google_site_verification = config.get("search_console", {}).get("google_site_verification", "")
    for path in html_paths():
        text = path.read_text(encoding="utf-8")
        canonical = site_url(canonical_path_for_html(path))
        text = replace_head_url(text, "link", 'rel="canonical"', "href", canonical)
        text = replace_head_url(text, "meta", 'property="og:url"', "content", canonical)
        text = replace_head_url(text, "meta", 'property="og:image"', "content", og_image)
        text = update_google_site_verification(text, google_site_verification)
        text = update_rss_alternate(text, config)
        text = update_structured_data(text, config, path)
        text = update_app_manifest_links(text)
        path.write_text(text, encoding="utf-8")


def update_dynamic_base_urls():
    base = clean_base_url(load_json(CONFIG_PATH)["base_url"])
    for name in ("tfse-categories.js", "tfse-products.js", "tfse-landing-pages.js", "tfse-articles.js"):
        path = ROOT / "assets" / "js" / name
        text = path.read_text(encoding="utf-8")
        text = KNOWN_HOST_RE.sub(base, text)
        path.write_text(text, encoding="utf-8")


def with_base_href(text, href):
    if "<base href=" in text:
        return re.sub(r'<base href="[^"]*"\s*/?>', f'<base href="{href}">', text, count=1)
    if '<meta name="viewport"' in text:
        return re.sub(r'(\s*<meta name="viewport"[^>]*>)', r'\1\n    <base href="' + href + '">', text, count=1, flags=re.IGNORECASE)
    return text.replace("</head>", f'    <base href="{href}">\n</head>', 1)


def generate_alias_pages():
    products = load_json(ROOT / "assets/data/products.json")
    articles = load_json(ROOT / "assets/data/articles.json")
    product_template = (ROOT / "work-details.html").read_text(encoding="utf-8")
    article_template = (ROOT / "blog-details.html").read_text(encoding="utf-8")
    contact_template = (ROOT / "contact-us.html").read_text(encoding="utf-8")

    product_dir = ROOT / "products"
    article_dir = ROOT / "articles"
    product_dir.mkdir(exist_ok=True)
    article_dir.mkdir(exist_ok=True)

    product_template = with_base_href(product_template, "../")
    article_template = with_base_href(article_template, "../")

    for item in products:
        (product_dir / f"{item['slug']}.html").write_text(product_template, encoding="utf-8")
    for item in articles:
        (article_dir / f"{item['slug']}.html").write_text(article_template, encoding="utf-8")

    (ROOT / "contact.html").write_text(contact_template, encoding="utf-8")


def sitemap_entries():
    config = load_json(CONFIG_PATH)
    pages = list(config.get("canonical_pages", []))
    seen = set()
    def emit(path):
        url = site_url(path)
        if url in seen:
            return None
        seen.add(url)
        return url

    for page in pages:
        url = emit(page)
        if not url:
            continue
        yield url

    for item in load_json(ROOT / "assets/data/categories.json"):
        url = emit(f"{quote(item['slug'])}.html")
        if url:
            yield url
    for item in load_json(ROOT / "assets/data/landing-pages.json"):
        alias = emit(f"lp/{quote(item['slug'])}.html")
        if alias:
            yield alias
        yield site_url(f"lp.html?slug={quote(item['slug'])}")
    for item in load_json(ROOT / "assets/data/products.json"):
        url = emit(product_detail_path(item["slug"]))
        if url:
            yield url
    for item in load_json(ROOT / "assets/data/articles.json"):
        url = emit(article_detail_path(item["slug"]))
        if url:
            yield url


def update_sitemap():
    changefreq = load_json(CONFIG_PATH).get("default_changefreq", "weekly")
    rows = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc in sitemap_entries():
        rows.append(f"  <url><loc>{loc}</loc><changefreq>{changefreq}</changefreq></url>")
    rows.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(rows) + "\n", encoding="utf-8")


def update_robots():
    text = "\n".join([
        "User-agent: *",
        "Allow: /",
        "",
        f"Sitemap: {site_url('sitemap.xml')}",
        "",
    ])
    (ROOT / "robots.txt").write_text(text, encoding="utf-8")


def rss_pub_date(value):
    try:
        dt = datetime.fromisoformat(str(value)).replace(tzinfo=timezone.utc)
    except ValueError:
        dt = datetime.now(timezone.utc)
    return format_datetime(dt)


def update_rss_feed():
    config = load_json(CONFIG_PATH)
    site_name = config.get("site_name", "TFSE金融便民中心")
    description = "TFSE 金融便民中心最新金融資訊、法令導引與防詐提醒。"
    rows = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        "  <channel>",
        f"    <title>{html.escape(site_name)}</title>",
        f"    <link>{html.escape(site_url())}</link>",
        f"    <atom:link href=\"{html.escape(site_url('feed.xml'))}\" rel=\"self\" type=\"application/rss+xml\" />",
        f"    <description>{html.escape(description)}</description>",
        "    <language>zh-TW</language>",
    ]
    articles = [
        item for item in load_json(ROOT / "assets/data/articles.json")
        if item.get("status") == "published"
    ]
    articles.sort(key=lambda item: item.get("updated_at", ""), reverse=True)
    for item in articles:
        link = site_url(article_detail_path(item["slug"]))
        rows.extend([
            "    <item>",
            f"      <title>{html.escape(item.get('title', ''))}</title>",
            f"      <link>{html.escape(link)}</link>",
            f"      <guid isPermaLink=\"true\">{html.escape(link)}</guid>",
            f"      <pubDate>{rss_pub_date(item.get('updated_at', ''))}</pubDate>",
            f"      <category>{html.escape(item.get('category', ''))}</category>",
            f"      <description>{html.escape(item.get('seo_description') or item.get('summary') or '')}</description>",
            "    </item>",
        ])
    rows.extend(["  </channel>", "</rss>"])
    (ROOT / "feed.xml").write_text("\n".join(rows) + "\n", encoding="utf-8")


def update_security_txt():
    path = ROOT / ".well-known/security.txt"
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"^Canonical: .*$", f"Canonical: {site_url('.well-known/security.txt')}", text, flags=re.MULTILINE)
    text = re.sub(r"^Policy: .*$", f"Policy: {site_url('source-policy.html')}", text, flags=re.MULTILINE)
    path.write_text(text, encoding="utf-8")


def main():
    generate_alias_pages()
    update_html_meta()
    update_dynamic_base_urls()
    update_sitemap()
    update_robots()
    update_rss_feed()
    update_security_txt()
    print(f"SEO assets generated for {clean_base_url(load_json(CONFIG_PATH)['base_url'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
