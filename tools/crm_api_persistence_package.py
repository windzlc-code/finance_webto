#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_crm_api_persistence_package"


def build_report():
    return admin_queue_tooling.crm_api_persistence_report()


def markdown(report):
    lines = [
        "# TFSE CRM API Persistence Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Status: `{report['status']}`",
        "",
        "## Required Controls",
        "",
    ]
    lines.extend(f"- {item}" for item in report["required_controls"])
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
