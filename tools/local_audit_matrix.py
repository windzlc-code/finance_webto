#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_local_audit_matrix"


def build_report():
    return admin_queue_tooling.local_audit_matrix_report()


def markdown(report):
    return "\n".join([
        "# TFSE Local Audit Matrix",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Total commands: `{report['summary']['total_commands']}`",
        f"- Ready to run: `{report['summary']['ready_to_run']}`",
        f"- Ready with external follow up: `{report['summary']['ready_with_external_follow_up']}`",
        f"- Ready with manual follow up: `{report['summary']['ready_with_manual_follow_up']}`",
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
