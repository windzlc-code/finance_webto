#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_retrospective_report"


def build_report():
    return admin_queue_tooling.retrospective_report()


def markdown(report):
    lines = [
        "# TFSE Retrospective Report",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Lead submits: `{report['funnel']['lead_submit']}`",
        f"- Errors: `{report['quality']['error_count']}`",
        "",
        "## Next Actions",
        "",
    ]
    lines.extend(f"- {item}" for item in report["next_actions"])
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
