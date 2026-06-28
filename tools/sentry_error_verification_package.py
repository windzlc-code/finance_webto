#!/usr/bin/env python3
import json
import sys

import seo_tracking_tooling


FORMAT = "tfse_sentry_error_verification_package"
STATUS_PENDING = "pending_sentry_error_verification"
RELATED_EXPORTS = ["tfse_incident_response_package", "tfse_external_verification_evidence"]


def build_report():
    return seo_tracking_tooling.sentry_verification_report()


def markdown(report):
    lines = [
        "# TFSE Sentry Error Verification Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Status: `{report['status']}`",
        f"- Browser DSN configured: `{report['destinations']['browser_sentry_dsn_configured']}`",
        f"- API base URL configured: `{report['destinations']['api_base_url_configured']}`",
        "",
        "## Required Controls",
        "",
    ]
    lines.extend(f"- {item}" for item in report["required_controls"])
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
