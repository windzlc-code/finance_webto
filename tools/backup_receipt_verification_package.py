#!/usr/bin/env python3
import json
import sys

import admin_cutover_tooling


FORMAT = "tfse_backup_receipt_verification_package"
PENDING_STATUS = "pending_backup_receipt_verification"
RELATED_EXPORTS = ["tfse_backup_restore_drill_plan", "tfse_external_verification_evidence"]


def build_report():
    return admin_cutover_tooling.backup_receipt_verification_report()


def markdown(report):
    lines = [
        "# TFSE Backup Receipt Verification Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Status: `{report['status']}`",
        f"- Latest plan status: `{report['latest_plan_status']}`",
        "",
        "## Required Receipts",
        "",
    ]
    for item in report["required_receipts"]:
        lines.append(f"- `{item['key']}`: {item['expected']}")
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
