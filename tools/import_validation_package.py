#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_import_validation_package"


def build_report():
    return admin_queue_tooling.import_validation_package_report()


def markdown(report):
    lines = [
        "# TFSE Import Validation Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Source package: `{report['source_package']}`",
        f"- Blockers: `{report['summary']['blockers']}`",
        "",
        "## Import Checks",
        "",
    ]
    lines.extend(f"- {item}" for item in report["import_checks"])
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
