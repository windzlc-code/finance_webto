#!/usr/bin/env python3
import json
import sys

import admin_cutover_tooling


FORMAT = "tfse_line_oa_handoff_check"
PENDING_STATUS = "pending_line_oa_handoff"
RELATED_EXPORTS = ["tfse_external_verification_evidence", "tfse_line_oa_setup_package"]


def build_report():
    return admin_cutover_tooling.line_oa_handoff_report()


def markdown(report):
    lines = [
        "# TFSE Line OA Handoff Check",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Status: `{report['status']}`",
        f"- Line OA URL: `{report['line_oa_url'] or '-'}`",
        f"- Official URL ready: `{report['official_url_ready']}`",
        f"- Tracked handoff records: `{report['record_summary']['tracked_count']}` (completed `{report['record_summary']['completed_count']}`, blocked `{report['record_summary']['blocked_count']}`)",
        "",
        "## Handoff Steps",
        "",
    ]
    lines.extend(f"{index}. {item}" for index, item in enumerate(report["handoff_steps"], 1))
    lines.extend([
        "",
        "## CTA Routes",
        "",
    ])
    for item in report.get("cta_routes", []):
        lines.append(f"- `{item['key']}` / {item['page']} / {item['expected']}")
        if item.get("latest_record"):
            lines.append(
                f"  - Latest receipt: `{item['latest_record'].get('result', '-')}` / `{item['latest_record'].get('owner', '-')}` / `{item['latest_record'].get('checked_at', '-')}`"
            )
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
