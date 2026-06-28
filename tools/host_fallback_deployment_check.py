#!/usr/bin/env python3
import json
import sys

import release_tooling


FORMAT = "tfse_host_fallback_deployment_check"
STATUS = "requires_formal_host_verification"
RELATED_EXPORTS = ["tfse_release_readiness_package", "tfse_domain_cutover_package"]


def build_report():
    report = release_tooling.build_host_fallback_report()
    report["format"] = FORMAT
    report["status"] = STATUS
    report["related_exports"] = list(dict.fromkeys(report.get("related_exports", []) + RELATED_EXPORTS))
    return report


def markdown(report):
    lines = [
        "# TFSE Host Fallback Deployment Check",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Status: `{report['status']}`",
        f"- Privacy note: {report['privacy_note']}",
        "",
        "## Critical Routes",
        "",
    ]
    for item in report["critical_routes"]:
        lines.extend([
            f"- **{item['route']}**",
            f"  - Expected: {item['expected']}",
        ])
    lines.extend([
        "",
        "## Verification Steps",
        "",
    ])
    lines.extend(f"{index}. {item}" for index, item in enumerate(report["verification_steps"], 1))
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
