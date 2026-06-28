#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_crm_contact_log"


def build_report():
    return admin_queue_tooling.crm_contact_log_report()


def markdown(report):
    return "\n".join([
        "# TFSE CRM Contact Log",
        "",
        f"- Exported at: `{report['exported_at']}`",
        f"- Total: `{report['counts']['total']}`",
        f"- Reached: `{report['counts']['reached']}`",
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
