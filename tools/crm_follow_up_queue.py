#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_crm_follow_up_queue"


def build_report():
    return admin_queue_tooling.crm_follow_up_queue_report()


def markdown(report):
    return "\n".join([
        "# TFSE CRM Follow Up Queue",
        "",
        f"- Exported at: `{report['exported_at']}`",
        f"- Total: `{report['counts']['total']}`",
        f"- High priority: `{report['counts']['high_priority']}`",
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
