#!/usr/bin/env python3
import json
import sys

import admin_cutover_tooling


FORMAT = "tfse_backup_restore_drill_plan"
PENDING_STATUS = "pending_external_backup_setup"
RELATED_EXPORTS = ["tfse_backup_receipt_verification_package", "tfse_backend_acceptance_matrix"]


def build_report():
    return admin_cutover_tooling.backup_restore_drill_report()


def markdown(report):
    lines = [
        "# TFSE Backup Restore Drill Plan",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Status: `{report['status']}`",
        f"- Backend mode: `{report['backend_mode']}`",
        f"- API base URL configured: `{report['api_base_url_configured']}`",
        "",
        "## Restore Steps",
        "",
    ]
    lines.extend(f"{index}. {item}" for index, item in enumerate(report["restore_steps"], 1))
    lines.extend([
        "",
        "## Blockers",
        "",
    ])
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
