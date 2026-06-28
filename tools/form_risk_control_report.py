#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_form_risk_control_report"


def build_report():
    return admin_queue_tooling.form_risk_control_report()


def markdown(report):
    lines = [
        "# TFSE Form Risk Control Report",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Turnstile configured: `{report['controls']['turnstile_configured']}`",
        "",
        "## Risk Notes",
        "",
    ]
    lines.extend(f"- {item}" for item in report["risk_notes"])
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
