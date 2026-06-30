#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
CANONICAL_MENU_LABELS = {
    "首頁",
    "金融便民首頁",
    "資料庫",
    "免費財務健檢查詢",
    "關於 TFSE",
    "金融分類",
    "房貸資訊",
    "信貸與企業融資",
    "債務法令",
    "金融知識",
    "知識列表",
    "知識專欄",
    "文章詳情",
    "CRM",
}
RESIDUAL_MENU_LABELS = {
    "金融商品資料庫",
    "免費財務健檢",
    "金融知識列表",
    "金融知識專欄",
    "金融知識詳情",
    "Homepage",
    "About Us",
    "Services",
    "Buy Now",
}


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.base_href = ""
        self._in_menu_text = False
        self.menu_text = []

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        classes = set(data.get("class", "").split())
        if tag == "span" and "menu-text" in classes:
            self._in_menu_text = True
        if tag == "base" and data.get("href"):
            self.base_href = data.get("href", "")
        for key in ("href", "src", "action"):
            value = data.get(key)
            if value:
                self.links.append((tag, key, value))

    def handle_endtag(self, tag):
        if tag == "span":
            self._in_menu_text = False

    def handle_data(self, data):
        if self._in_menu_text:
            text = " ".join(data.split())
            if text:
                self.menu_text.append(text)


def html_paths():
    paths = sorted(ROOT.glob("*.html"))
    for folder in ("articles", "products", "database", "lp"):
        paths.extend(sorted((ROOT / folder).glob("*.html")))
    return paths


def is_local_url(value):
    lower = value.lower().strip()
    if lower.startswith(("http://", "https://", "mailto:", "tel:", "#", "javascript:", "data:", "//")):
        return False
    target = value.split("#", 1)[0].split("?", 1)[0]
    return bool(target and not target.endswith("/"))


def audit():
    failures = []
    for path in html_paths():
        label = path.relative_to(ROOT).as_posix()
        parser = LinkParser()
        parser.feed(path.read_text(encoding="utf-8", errors="ignore"))
        for text in parser.menu_text:
            if text in RESIDUAL_MENU_LABELS:
                failures.append(f"{label}: residual menu label {text}")
            if re.search(r"[A-Za-z]", text) and text not in CANONICAL_MENU_LABELS:
                failures.append(f"{label}: unexpected English menu label {text}")
        base_dir = path.parent
        if parser.base_href:
            base_dir = (path.parent / parser.base_href).resolve()
        for tag, key, value in parser.links:
            if not is_local_url(value):
                continue
            target = base_dir / value.split("#", 1)[0].split("?", 1)[0]
            if not target.exists():
                failures.append(f"{label}: broken relative {key} on <{tag}>: {value}")
    return failures


def main():
    failures = audit()
    if failures:
        for failure in failures:
            print(failure)
        return 1
    print("navigation consistency audit passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
