#!/usr/bin/env python3
import json
import sys

import release_tooling


FORMAT = "tfse_launch_health_check"
SOURCE_LABEL = "site-config.json + static deployment baseline"
RELATED_EXPORTS = ["tfse_domain_cutover_package", "tfse_external_verification_evidence"]


def build_report():
    report = release_tooling.build_launch_health_report()
    report["format"] = FORMAT
    report["source"] = SOURCE_LABEL
    report["related_exports"] = RELATED_EXPORTS
    return report


def markdown(report):
    lines = [
        "# TFSE Launch Health Check",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Source: `{report['source']}`",
        f"- Ready count: `{report['ready_count']}`",
        f"- Pending count: `{report['pending_count']}`",
        "",
        "## Items",
        "",
    ]
    for item in report["items"]:
        lines.extend([
            f"- **{item['label']}**",
            f"  - Key: `{item['key']}`",
            f"  - Ready: `{item['done']}`",
            f"  - Detail: {item['detail']}",
        ])
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
