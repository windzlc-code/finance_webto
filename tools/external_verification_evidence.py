#!/usr/bin/env python3
import json
import sys

import release_tooling


FORMAT = "tfse_external_verification_evidence"
RELATED_EXPORTS = ["tfse_release_readiness_package", "tfse_plan_closure_report"]


def build_report():
    report = release_tooling.build_external_verification_report()
    report["format"] = FORMAT
    report["related_exports"] = list(dict.fromkeys(report.get("related_exports", []) + RELATED_EXPORTS))
    return report


def markdown(report):
    lines = [
        "# TFSE External Verification Evidence",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Required items: `{report['summary']['required_items']}`",
        f"- Configured items: `{report['summary']['configured_items']}`",
        f"- Verified items: `{report['summary']['verified_items']}`",
        f"- Launch pending count: `{report['summary']['launch_pending_count']}`",
        f"- Config pending count: `{report['summary']['config_pending_count']}`",
        "",
        "## Items",
        "",
    ]
    for item in report["items"]:
        lines.extend([
            f"- **{item['label']}**",
            f"  - Service: `{item['service']}`",
            f"  - Configured: `{item['configured']}`",
            f"  - Verified: `{item['verified']}`",
            f"  - Latest passed at: `{item['latest_passed_at'] or '-'}`",
            f"  - Owner: `{item['owner'] or '-'}`",
            f"  - Evidence note: {item['evidence_note'] or '-'}",
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
