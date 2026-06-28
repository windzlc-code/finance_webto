#!/usr/bin/env python3
import json
import sys

import seo_tracking_tooling


FORMAT = "tfse_tracking_consent_audit"
RELATED_EXPORTS = ["tfse_monitoring_receipt_checklist", "tfse_external_verification_evidence"]


def build_report():
    return seo_tracking_tooling.tracking_consent_report()


def markdown(report):
    lines = [
        "# TFSE Tracking Consent Audit",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Consent status: `{report['consent_status']}`",
        f"- External destinations configured: `{sum(1 for value in report['external_destinations'].values() if value)}`",
        "",
        "## Policy",
        "",
    ]
    for key, value in report["policy"].items():
        lines.append(f"- **{key}**: {value}")
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
