#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_lead_dedupe_queue"


def build_report():
    return admin_queue_tooling.lead_dedupe_queue_report()


def markdown(report):
    return "\n".join([
        "# TFSE Lead Dedupe Queue",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Duplicate groups: `{report['counts']['duplicate_groups']}`",
        f"- Duplicate leads: `{report['counts']['duplicate_leads']}`",
    ])


def main():
    report = build_report()
    if "--markdown" in sys.argv:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
