#!/usr/bin/env python3
import json
import sys

import admin_cutover_tooling


FORMAT = "tfse_line_oa_setup_package"
RELATED_EXPORTS = ["tfse_line_oa_handoff_check", "tfse_line_segment_queue"]


def build_report():
    return admin_cutover_tooling.line_oa_setup_report()


def markdown(report):
    lines = [
        "# TFSE Line OA Setup Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Line OA URL: `{report['line_oa_url'] or '-'}`",
        f"- Welcome messages: `{len(report['welcome_messages'])}`",
        f"- Quick replies: `{len(report['quick_replies'])}`",
        f"- Tags: `{len(report['tags'])}`",
        f"- Tracked setup records: `{report['record_summary']['tracked_count']}` (completed `{report['record_summary']['completed_count']}`, blocked `{report['record_summary']['blocked_count']}`)",
        "",
        "## Setup Steps",
        "",
    ]
    lines.extend(f"{index}. {item}" for index, item in enumerate(report["setup_steps"], 1))
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
