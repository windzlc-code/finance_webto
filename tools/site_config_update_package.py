#!/usr/bin/env python3
from pathlib import Path
import argparse
import json
import sys

import site_config_tooling


def draft_text_from_args(args):
    if args.draft_file:
        return Path(args.draft_file).read_text(encoding="utf-8")
    if args.draft_json:
        return args.draft_json
    if not sys.stdin.isatty():
        return sys.stdin.read()
    return ""


def build_report(args):
    site_config = site_config_tooling.load_site_config()
    parsed = site_config_tooling.parse_draft_text(draft_text_from_args(args))
    validation = site_config_tooling.validate_config_draft(parsed["data"])
    blockers = parsed["errors"] + validation["errors"]
    if parsed["raw"] and not blockers:
        status = "ready_for_manual_merge"
    elif parsed["raw"]:
        status = "needs_revision"
    else:
        status = "awaiting_draft"

    return {
        "format": "tfse_site_config_update_package",
        "generated_at": site_config_tooling.now_iso(),
        "source": "site-config.json + optional draft patch",
        "target_file": "site-config.json",
        "draft_source": args.draft_file or ("stdin" if parsed["raw"] and not args.draft_json else ("inline_json" if args.draft_json else "template_only")),
        "status": status,
        "draft_keys": list((parsed["data"] or {}).keys()),
        "validation": {
            "errors": blockers,
            "warnings": validation["warnings"] + ([] if parsed["raw"] else ["尚未提供正式草稿；目前輸出的是 template 與 current summary。"]),
            "command_after_merge": [
                "python3 tools/generate_seo_assets.py",
                "python3 tools/validate_site_config.py",
                "python3 tools/production_config_audit.py",
                "python3 tools/verify_static_site.py",
            ],
        },
        "patch": parsed["data"],
        "template_patch": site_config_tooling.suggested_patch_template(site_config),
        "current_config_summary": site_config_tooling.current_config_summary(site_config),
        "config_readiness": {
            "ready_count": sum(1 for item in site_config_tooling.config_readiness_items(site_config) if item["done"]),
            "pending_count": sum(1 for item in site_config_tooling.config_readiness_items(site_config) if not item["done"]),
        },
        "merge_notes": [
            "此工具不會自動修改 site-config.json；正式合併前仍需人工複核。",
            "不得在草稿內放入 Turnstile secret、Database URL、Admin session secret 等真正 secret。",
            "涉及廣告追蹤、Line OA、後端 API、Turnstile 或正式網域時，需在合併前後保存外部驗證留痕。",
        ],
        "related_exports": [
            "tfse_site_config_update_package",
            "tfse_production_config_readiness",
            "tfse_domain_cutover_package",
            "tfse_external_verification_evidence",
            "tfse_plan_closure_report",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE Site Config Update Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Target file: `{report['target_file']}`",
        f"- Status: `{report['status']}`",
        f"- Draft source: `{report['draft_source']}`",
        f"- Draft keys: `{', '.join(report['draft_keys']) if report['draft_keys'] else 'none'}`",
        f"- Config ready: `{report['config_readiness']['ready_count']}` / pending: `{report['config_readiness']['pending_count']}`",
        "",
        "## Validation Errors",
        "",
    ]
    if report["validation"]["errors"]:
        lines.extend(f"- {item}" for item in report["validation"]["errors"])
    else:
        lines.append("- 無")
    lines.extend([
        "",
        "## Validation Warnings",
        "",
    ])
    if report["validation"]["warnings"]:
        lines.extend(f"- {item}" for item in report["validation"]["warnings"])
    else:
        lines.append("- 無")
    lines.extend([
        "",
        "## Current Config Summary",
        "",
        "```json",
        json.dumps(report["current_config_summary"], ensure_ascii=False, indent=2),
        "```",
        "",
        "## Template Patch",
        "",
        "```json",
        json.dumps(report["template_patch"], ensure_ascii=False, indent=2),
        "```",
    ])
    if report["patch"]:
        lines.extend([
            "",
            "## Provided Patch",
            "",
            "```json",
            json.dumps(report["patch"], ensure_ascii=False, indent=2),
            "```",
        ])
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--draft-file")
    parser.add_argument("--draft-json")
    parser.add_argument("--markdown", action="store_true")
    args = parser.parse_args()
    report = build_report(args)
    if args.markdown:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
