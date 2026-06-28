#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_data_retention_purge_plan"


def build_report():
    return admin_queue_tooling.data_retention_purge_plan_report()


def markdown(report):
    lines = [
        "# TFSE Data Retention Purge Plan",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Purge candidate leads: `{report['summary']['purge_candidate_leads']}`",
        "",
        "## Blockers",
        "",
    ]
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
