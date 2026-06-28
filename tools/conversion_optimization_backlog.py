#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_conversion_optimization_backlog"


def build_report():
    return admin_queue_tooling.conversion_optimization_backlog_report()


def markdown(report):
    return "\n".join([
        "# TFSE Conversion Optimization Backlog",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Landing pages: `{report['summary']['landing_pages']}`",
        f"- Items without attribution: `{report['summary']['items_without_attribution']}`",
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
