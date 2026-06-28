#!/usr/bin/env python3
import json
import sys

import admin_cutover_tooling


FORMAT = "tfse_formal_backend_migration_package"
RELATED_EXPORTS = ["tfse_import_validation_package", "tfse_content_api_cutover_package"]


def build_report():
    return admin_cutover_tooling.formal_backend_migration_report()


def markdown(report):
    lines = [
        "# TFSE Formal Backend Migration Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Source mode: `{report['source_mode']}`",
        f"- Target contract: `{report['target_contract']}`",
        f"- Target schema: `{report['target_schema']}`",
        f"- Seed products: `{report['summary']['seed_products']}`",
        f"- Seed articles: `{report['summary']['seed_articles']}`",
        f"- Source review items: `{report['summary']['source_review_items']}`",
        "",
        "## Import Order",
        "",
    ]
    lines.extend(f"{index}. {item}" for index, item in enumerate(report["import_order"], 1))
    lines.extend([
        "",
        "## Sensitive Data Policy",
        "",
    ])
    lines.extend(f"- {item}" for item in report["sensitive_data_policy"])
    lines.extend([
        "",
        "## Blockers",
        "",
    ])
    lines.extend(f"- {item}" for item in report["blockers"])
    return "\n".join(lines)


def main():
    report = build_report()
    if "--markdown" in sys.argv:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
