#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_content_version_snapshot"


def build_report():
    return admin_queue_tooling.content_version_snapshot_report()


def markdown(report):
    lines = [
        "# TFSE Content Version Snapshot",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Audit entries: `{report['counts']['audit_entries']}`",
        "",
        "## Restore Order",
        "",
    ]
    lines.extend(f"{index}. {item}" for index, item in enumerate(report["restore_order"], 1))
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
