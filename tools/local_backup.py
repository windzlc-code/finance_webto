#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_local_backup"


def build_report():
    return admin_queue_tooling.local_backup_report()


def markdown(report):
    return "\n".join([
        "# TFSE Local Backup",
        "",
        f"- Exported at: `{report['exported_at']}`",
        f"- Source mode: `{report['source_mode']}`",
        f"- Leads: `{len(report['data']['leads'])}`",
        f"- Events: `{len(report['data']['events'])}`",
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
