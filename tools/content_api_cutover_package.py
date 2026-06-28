#!/usr/bin/env python3
import json
import sys

import admin_cutover_tooling


FORMAT = "tfse_content_api_cutover_package"
PENDING_STATUS = "pending_content_api_cutover"
RELATED_EXPORTS = ["tfse_content_version_snapshot", "tfse_backend_acceptance_matrix"]
REQUIRED_SECTION = "required_api_checks"


def build_report():
    return admin_cutover_tooling.content_api_cutover_report()


def markdown(report):
    lines = [
        "# TFSE Content API Cutover Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Status: `{report['status']}`",
        f"- Products: `{report['seed_counts']['products']}`",
        f"- Published articles: `{report['seed_counts']['published_articles']}`",
        f"- Source review pending: `{report['content_state']['source_review_pending']}`",
        "",
        "## Required API Checks",
        "",
    ]
    for item in report["required_api_checks"]:
        lines.append(f"- `{item['endpoint']}`: {item['expected']}")
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
