#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_legal_compliance_review_package"


def build_report():
    return admin_queue_tooling.legal_compliance_review_package_report()


def markdown(report):
    lines = [
        "# TFSE Legal Compliance Review Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Items: `{len(report['items'])}`",
        "",
        "## Required External Review",
        "",
    ]
    lines.extend(f"- {item}" for item in report["required_external_review"])
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
