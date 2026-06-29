#!/usr/bin/env python3
from pathlib import Path
import argparse
import json
import sys


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SCLAW_ROOT = Path("/Library/Github/SCLAW_fz")
DOC = ROOT / "SCLAW_COMPARISON.md"

CAPABILITIES = (
    {
        "key": "source_registry",
        "title": "公開來源登錄與來源治理",
        "sclaw": ("config/source_registry.json", "src/source_registry.py"),
        "tfse": ("assets/data/institutions.json", "source-policy.html", "tools/source_verification_evidence.py"),
        "required_doc": "公開來源登錄與來源治理",
    },
    {
        "key": "search_api",
        "title": "站內搜尋與查詢 API",
        "sclaw": ("app.py", "src/site_search.py"),
        "tfse": ("search.html", "assets/js/tfse-search.js", "api-contract.json"),
        "tfse_markers": ("GET", "/api/search", "site_search"),
        "required_doc": "站內搜尋與查詢 API",
    },
    {
        "key": "seo_structured_data",
        "title": "SEO 與結構化資料",
        "sclaw": ("src/text_utils.py", "templates/article.html"),
        "tfse": ("tools/generate_seo_assets.py", "sitemap.xml", "feed.xml"),
        "tfse_markers": ("tfse-structured-data", "SearchAction", "feed.xml"),
        "required_doc": "SEO 與結構化資料",
    },
    {
        "key": "data_pipeline",
        "title": "資料管線與品質檢查",
        "sclaw": ("scripts/run_pipeline.py", "src/crawler.py", "src/pipeline.py"),
        "tfse": ("tools/data_quality_audit.py", "tools/source_freshness_audit.py", "tools/import_validation_package.py"),
        "required_doc": "資料管線與品質檢查",
    },
    {
        "key": "backend_persistence",
        "title": "後端持久化",
        "sclaw": ("src/db.py", "app.py"),
        "tfse": ("backend/tfse_persistent_api.py", "backend-schema.sql", "tools/persistent_api_smoke.py"),
        "required_doc": "後端持久化",
    },
    {
        "key": "admin_workbench",
        "title": "後台工作台",
        "sclaw": ("templates/social_case_workbench.html", "tests/test_social_case_workbench_template.py"),
        "tfse": ("admin.html", "tools/crm_capability_audit.py", "assets/js/tfse-admin.js"),
        "required_doc": "後台工作台",
    },
    {
        "key": "export_import",
        "title": "匯入匯出與交接",
        "sclaw": ("scripts/export_wordpress_csv.py", "exports"),
        "tfse": ("tools/local_backup.py", "tools/import_validation_package.py", "tools/launch_handoff_manifest.py"),
        "required_doc": "匯入匯出與交接",
    },
    {
        "key": "support_handoff",
        "title": "客服 / 對話承接",
        "sclaw": ("src/dialog_ai.py", "tests/test_support_chat_conversation.py"),
        "tfse": ("assets/data/line-flows.json", "tools/public_feedback_intake_package.py", "tools/crm_follow_up_queue.py"),
        "required_doc": "客服 / 對話承接",
    },
)

DOC_MARKERS = (
    "TFSE 與 SCLAW_fz 對照分析",
    "對照結論",
    "不直接移植的部分",
    "仍需外部閉環",
    "tools/sclaw_comparison_audit.py",
)


def read_text(path):
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def path_exists(root, relative):
    return (root / relative).exists()


def scan_markers(files, markers):
    haystack = "\n".join(read_text(ROOT / item) for item in files if (ROOT / item).is_file())
    return [marker for marker in markers if marker not in haystack]


def build_report(sclaw_root):
    doc_text = read_text(DOC)
    failures = []
    items = []
    sclaw_available = sclaw_root.exists()

    for marker in DOC_MARKERS:
        if marker not in doc_text:
            failures.append(f"SCLAW_COMPARISON.md: missing marker {marker}")
    for capability in CAPABILITIES:
        if capability["required_doc"] not in doc_text:
            failures.append(f"SCLAW_COMPARISON.md: missing capability {capability['required_doc']}")

    for capability in CAPABILITIES:
        tfse_missing = [item for item in capability["tfse"] if not path_exists(ROOT, item)]
        marker_missing = scan_markers(capability["tfse"], capability.get("tfse_markers", ()))
        sclaw_missing = []
        if sclaw_available:
            sclaw_missing = [item for item in capability["sclaw"] if not path_exists(sclaw_root, item)]

        if tfse_missing or marker_missing:
            status = "needs_fix"
        elif sclaw_available and sclaw_missing:
            status = "reference_partial"
        elif sclaw_available:
            status = "ready"
        else:
            status = "documented_reference"

        items.append({
            "key": capability["key"],
            "title": capability["title"],
            "status": status,
            "sclaw_reference_available": sclaw_available,
            "sclaw_missing": sclaw_missing,
            "tfse_missing": tfse_missing,
            "marker_missing": marker_missing,
            "tfse_evidence": list(capability["tfse"]),
            "sclaw_evidence": list(capability["sclaw"]),
        })

        for item in tfse_missing:
            failures.append(f"{capability['title']}: missing TFSE evidence {item}")
        for marker in marker_missing:
            failures.append(f"{capability['title']}: missing TFSE marker {marker}")

    counts = {}
    for item in items:
        counts[item["status"]] = counts.get(item["status"], 0) + 1

    return {
        "format": "tfse_sclaw_comparison_audit",
        "sclaw_root": str(sclaw_root),
        "sclaw_reference_available": sclaw_available,
        "counts": counts,
        "items": items,
        "failures": failures,
    }


def print_markdown(report):
    print("# SCLAW comparison audit")
    print()
    print(f"- SCLAW root: `{report['sclaw_root']}`")
    print(f"- SCLAW reference available: `{str(report['sclaw_reference_available']).lower()}`")
    for status, count in sorted(report["counts"].items()):
        print(f"- {status}: {count}")
    print()
    print("| Capability | Status | TFSE evidence | SCLAW evidence |")
    print("| --- | --- | --- | --- |")
    for item in report["items"]:
        tfse = ", ".join(f"`{evidence}`" for evidence in item["tfse_evidence"])
        sclaw = ", ".join(f"`{evidence}`" for evidence in item["sclaw_evidence"])
        print(f"| {item['title']} | {item['status']} | {tfse} | {sclaw} |")
    if report["failures"]:
        print()
        print("## Failures")
        for failure in report["failures"]:
            print(f"- {failure}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sclaw-root", default=str(DEFAULT_SCLAW_ROOT))
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--markdown", action="store_true")
    args = parser.parse_args()

    report = build_report(Path(args.sclaw_root))
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    elif args.markdown:
        print_markdown(report)
    else:
        counts = ", ".join(f"{key}={report['counts'][key]}" for key in sorted(report["counts"]))
        print(f"SCLAW comparison audit: {counts}")

    return 1 if report["failures"] else 0


if __name__ == "__main__":
    sys.exit(main())
