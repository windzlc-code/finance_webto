#!/usr/bin/env python3
import json
import sys

import seo_tracking_tooling


FORMAT = "tfse_search_console_verification_package"
READY_STATUS = "ready_for_search_console_submission"
RELATED_EXPORTS = ["tfse_seo_indexing_followup_queue", "tfse_seo_submission_package"]


def build_report():
    return seo_tracking_tooling.search_console_verification_report()


def markdown(report):
    lines = [
        "# TFSE Search Console Verification Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Status: `{report['status']}`",
        f"- Base URL: `{report['property']['base_url'] or '-'}`",
        f"- Verification token present: `{report['property']['verification_token_present']}`",
        f"- Tracked Search Console receipts: `{report['record_summary']['tracked_count']}` (verified `{report['record_summary']['verified_count']}`, submitted `{report['record_summary']['submitted_count']}`, blocked `{report['record_summary']['blocked_count']}`)",
        "",
        "## Tracked Items",
        "",
    ]
    for item in report.get("tracked_items", []):
        label = item.get("label") or item.get("key") or "tracked_item"
        target = item.get("target") or item.get("url") or item.get("path") or "-"
        lines.append(f"- **{label}** / `{item['key']}` / {target}")
        if item.get("latest_record"):
            lines.append(
                f"  - Latest receipt: `{item['latest_record'].get('result', '-')}` / `{item['latest_record'].get('owner', '-')}` / `{item['latest_record'].get('checked_at', '-')}`"
            )
    lines.extend([
        "",
        "## Verification Steps",
        "",
    ])
    lines.extend(f"{index}. {item}" for index, item in enumerate(report["verification_steps"], 1))
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
