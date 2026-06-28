from html.parser import HTMLParser
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
CRITICAL_PAGES = (
    "index.html",
    "database.html",
    "articles.html",
    "blog-details.html",
    "work-details.html",
    "free-check.html",
    "admin.html",
)

MAX_DIRECT_ASSET_BYTES = 2_700_000
MAX_SINGLE_ASSET_BYTES = 950_000
MAX_CSS_BYTES = 1_250_000
MAX_JS_BYTES = 700_000
MAX_IMAGE_BYTES = 700_000
MAX_HTML_BYTES = 100_000


class AssetParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stylesheets = []
        self.scripts = []
        self.images = []
        self.manifest_links = []

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "link":
            rel = data.get("rel", "")
            href = data.get("href", "")
            if href and "stylesheet" in rel:
                self.stylesheets.append(href)
            if href and rel in ("manifest", "apple-touch-icon", "shortcut icon"):
                self.manifest_links.append(href)
        elif tag == "script" and data.get("src"):
            self.scripts.append(data["src"])
        elif tag == "img" and data.get("src"):
            self.images.append(data["src"])


def local_path(value):
    if not value or value.startswith(("http://", "https://", "//", "data:", "mailto:", "tel:", "#")):
        return None
    target = value.split("#", 1)[0].split("?", 1)[0]
    if not target:
        return None
    return (ROOT / target).resolve()


def asset_size(value):
    path = local_path(value)
    if not path:
        return 0, None
    if not str(path).startswith(str(ROOT)) or not path.exists() or not path.is_file():
        return 0, path
    return path.stat().st_size, path


def audit_page(page_name):
    failures = []
    path = ROOT / page_name
    text = path.read_text(encoding="utf-8", errors="ignore")
    html_size = path.stat().st_size
    if html_size > MAX_HTML_BYTES:
        failures.append(f"{page_name}: HTML size {html_size} exceeds {MAX_HTML_BYTES}")

    parser = AssetParser()
    parser.feed(text)
    totals = {"css": 0, "js": 0, "image": 0, "direct": 0}
    all_assets = (
        [("css", value) for value in parser.stylesheets]
        + [("js", value) for value in parser.scripts]
        + [("image", value) for value in parser.images]
        + [("direct", value) for value in parser.manifest_links]
    )
    for kind, value in all_assets:
        size, path_or_missing = asset_size(value)
        if path_or_missing and not path_or_missing.exists():
            failures.append(f"{page_name}: missing asset {value}")
            continue
        totals["direct"] += size
        if kind in totals:
            totals[kind] += size
        if size > MAX_SINGLE_ASSET_BYTES:
            failures.append(f"{page_name}: asset {value} size {size} exceeds {MAX_SINGLE_ASSET_BYTES}")

    if totals["direct"] > MAX_DIRECT_ASSET_BYTES:
        failures.append(f"{page_name}: direct asset total {totals['direct']} exceeds {MAX_DIRECT_ASSET_BYTES}")
    if totals["css"] > MAX_CSS_BYTES:
        failures.append(f"{page_name}: CSS total {totals['css']} exceeds {MAX_CSS_BYTES}")
    if totals["js"] > MAX_JS_BYTES:
        failures.append(f"{page_name}: JS total {totals['js']} exceeds {MAX_JS_BYTES}")
    if totals["image"] > MAX_IMAGE_BYTES:
        failures.append(f"{page_name}: image total {totals['image']} exceeds {MAX_IMAGE_BYTES}")
    return failures


def audit_global_assets():
    failures = []
    for path in (ROOT / "assets").rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp") and path.stat().st_size > 750_000:
            failures.append(f"{path.relative_to(ROOT).as_posix()}: raster asset exceeds 750KB")
    return failures


def main():
    failures = []
    for page in CRITICAL_PAGES:
        failures += audit_page(page)
    failures += audit_global_assets()
    if failures:
        for failure in failures:
            print(failure)
        return 1
    print("performance budget audit passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
