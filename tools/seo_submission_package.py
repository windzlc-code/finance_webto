#!/usr/bin/env python3
import json
import sys

import seo_tracking_tooling


FORMAT = "tfse_seo_submission_package"
RELATED_EXPORTS = ["tfse_search_console_verification_package", "tfse_domain_cutover_package"]


def build_report():
    return seo_tracking_tooling.seo_submission_report()


def markdown(report):
    lines = [
        "# TFSE SEO Submission Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Base URL: `{report['base_url'] or '-'}`",
        f"- Canonical pages: `{report['counts']['canonical_pages']}`",
        f"- Products: `{report['counts']['products']}`",
        f"- Published articles: `{report['counts']['published_articles']}`",
        f"- Categories: `{report['counts']['categories']}`",
        f"- Landing pages: `{report['counts']['landing_pages']}`",
        "",
        "## Submission Steps",
        "",
    ]
    lines.extend(f"{index}. {item}" for index, item in enumerate(report["submission_steps"], 1))
    lines.extend([
        "",
        "## Blockers",
        "",
    ])
    if report["blockers"]:
        lines.extend(f"- {item}" for item in report["blockers"])
    else:
        lines.append("- 無")
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
