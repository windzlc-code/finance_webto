#!/usr/bin/env python3
from pathlib import Path
import json
import sys


ROOT = Path.cwd()
RULES_PATH = ROOT / "assets" / "data" / "compliance-rules.json"
DEFAULT_DISCLAIMER = "本中心僅彙整公開合法金融商品"
CONTEXT_WINDOW = 36
DISPLAY_DATA_FILES = (
    "assets/data/articles.json",
    "assets/data/categories.json",
    "assets/data/faq.json",
    "assets/data/landing-pages.json",
    "assets/data/line-flows.json",
    "assets/data/products.json",
)


def load_rules():
    rules = json.loads(RULES_PATH.read_text(encoding="utf-8"))
    return {
        "required_disclaimer": rules.get("required_disclaimer") or DEFAULT_DISCLAIMER,
        "forbidden_terms": rules.get("forbidden_terms") or [],
        "allowed_contexts": rules.get("allowed_contexts") or [],
    }


def html_files():
    for path in ROOT.rglob("*.html"):
        if ".git" in path.parts or "assets" in path.parts:
            continue
        yield path


def display_data_files():
    for name in DISPLAY_DATA_FILES:
        path = ROOT / name
        if path.exists():
            yield path


def line_number(text, index):
    return text.count("\n", 0, index) + 1


def context_for(text, index, term):
    start = max(0, index - CONTEXT_WINDOW)
    end = min(len(text), index + len(term) + CONTEXT_WINDOW)
    return text[start:end].replace("\n", " ").strip()


def has_allowed_context(context, allowed_contexts):
    return any(word and word in context for word in allowed_contexts)


def forbidden_hits(text, terms, allowed_contexts):
    hits = []
    for term in terms:
        start = 0
        while True:
            index = text.find(term, start)
            if index == -1:
                break
            context = context_for(text, index, term)
            if not has_allowed_context(context, allowed_contexts):
                hits.append((term, line_number(text, index), context))
            start = index + len(term)
    return hits


def scalar_strings(value):
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        result = []
        for item in value:
            result.extend(scalar_strings(item))
        return result
    if isinstance(value, dict):
        result = []
        for item in value.values():
            result.extend(scalar_strings(item))
        return result
    return []


def json_string_entries(value, path="$", inherited_context=""):
    if isinstance(value, dict):
        local_context = " ".join(scalar_strings(value))
        context = " ".join(part for part in (inherited_context, local_context) if part)
        for key, item in value.items():
            yield from json_string_entries(item, f"{path}.{key}", context)
        return
    if isinstance(value, list):
        local_context = " ".join(scalar_strings(value))
        context = " ".join(part for part in (inherited_context, local_context) if part)
        for index, item in enumerate(value):
            yield from json_string_entries(item, f"{path}[{index}]", context)
        return
    if isinstance(value, str):
        yield path, value, " ".join(part for part in (inherited_context, value) if part)


def json_forbidden_hits(data, terms, allowed_contexts):
    hits = []
    for path, value, context in json_string_entries(data):
        for term in terms:
            if term in value and not has_allowed_context(context, allowed_contexts):
                hits.append((term, path, context[:160].replace("\n", " ").strip()))
    return hits


def main():
    failures = []
    rules = load_rules()
    required_disclaimer = rules["required_disclaimer"]

    for path in html_files():
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(ROOT)

        for term, line, context in forbidden_hits(text, rules["forbidden_terms"], rules["allowed_contexts"]):
            failures.append(f'{rel}:{line}: forbidden term "{term}" outside allowed context: {context}')

        if required_disclaimer not in text:
            failures.append(f"{rel}: missing required disclaimer")

    for path in display_data_files():
        rel = path.relative_to(ROOT)
        data = json.loads(path.read_text(encoding="utf-8"))
        for term, json_path, context in json_forbidden_hits(data, rules["forbidden_terms"], rules["allowed_contexts"]):
            failures.append(f'{rel}:{json_path}: forbidden term "{term}" outside allowed context: {context}')

    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1

    print("Compliance scan passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
