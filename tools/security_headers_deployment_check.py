#!/usr/bin/env python3
import json
import sys

import admin_cutover_tooling


FORMAT = "tfse_security_headers_deployment_check"
RELATED_EXPORTS = ["tfse_domain_cutover_package", "tfse_external_verification_evidence"]


def build_report():
    return admin_cutover_tooling.security_headers_report()


def markdown(report):
    lines = [
        "# TFSE Security Headers Deployment Check",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Status: `{report['status']}`",
        "",
        "## Expected Headers",
        "",
    ]
    lines.extend(f"- {item}" for item in report["expected_headers"])
    lines.extend([
        "",
        "## Verification Commands",
        "",
    ])
    lines.extend(f"- `{item}`" for item in report["verification_commands"])
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
