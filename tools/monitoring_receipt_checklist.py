#!/usr/bin/env python3
import json
import sys

import seo_tracking_tooling


FORMAT = "tfse_monitoring_receipt_checklist"
RELATED_EXPORTS = ["tfse_external_verification_evidence", "tfse_launch_health_check"]


def build_report():
    return seo_tracking_tooling.monitoring_receipt_report()


def markdown(report):
    lines = [
        "# TFSE Monitoring Receipt Checklist",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Missing required events: `{report['summary']['missing_required_events']}` / `{report['summary']['required_events']}`",
        f"- Blockers: `{report['summary']['blockers']}`",
        "",
        "## Receipt Checks",
        "",
    ]
    lines.extend(f"- {item}" for item in report["receipt_checks"])
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
