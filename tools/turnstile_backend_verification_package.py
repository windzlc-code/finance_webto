#!/usr/bin/env python3
import json
import sys

import admin_cutover_tooling


FORMAT = "tfse_turnstile_backend_verification_package"
PENDING_STATUS = "pending_turnstile_backend_verification"
RELATED_EXPORTS = ["tfse_form_risk_control_report", "tfse_backend_acceptance_matrix"]
NEGATIVE_TESTS = "negative_test_cases"
SECRET_ENV_NAME = "TFSE_TURNSTILE_SECRET_KEY"


def build_report():
    return admin_cutover_tooling.turnstile_backend_verification_report()


def markdown(report):
    lines = [
        "# TFSE Turnstile Backend Verification Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Status: `{report['status']}`",
        f"- API base URL configured: `{report['backend_target']['api_base_url_configured']}`",
        f"- Secret env: `{report['backend_target']['secret_env_name']}`",
        "",
        "## Negative Test Cases",
        "",
    ]
    for item in report["negative_test_cases"]:
        lines.append(f"- `{item['case_id']}`: {item['expected']}")
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
