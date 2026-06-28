#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_line_optout_complaint_queue"


def build_report():
    return admin_queue_tooling.line_optout_complaint_queue_report()


def markdown(report):
    lines = [
        "# TFSE Line Optout Complaint Queue",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Total: `{report['summary']['total']}`",
        f"- Pending review: `{report['summary']['pending_review']}`",
        "",
        "## Handling Steps",
        "",
    ]
    lines.extend(f"{index}. {item}" for index, item in enumerate(report["handling_steps"], 1))
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
