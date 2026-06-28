#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_institution_import_verification_package"


def build_report():
    return admin_queue_tooling.institution_import_verification_report()


def markdown(report):
    lines = [
        "# TFSE Institution Import Verification Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Status: `{report['status']}`",
        f"- Institutions: `{report['counts']['institutions']}`",
        f"- Stale or unverified: `{report['counts']['stale_or_unverified']}`",
        "",
        "## Blockers",
        "",
    ]
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
