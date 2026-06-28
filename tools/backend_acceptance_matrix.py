#!/usr/bin/env python3
import json
import sys

import admin_cutover_tooling


FORMAT = "tfse_backend_acceptance_matrix"
PENDING_STATUS = "pending_api_configuration"
RELATED_EXPORTS = ["tfse_admin_auth_cutover_check", "tfse_backend_cutover_roadmap"]
REQUIRED_SECTION = "required_validation"


def build_report():
    return admin_cutover_tooling.backend_acceptance_report()


def markdown(report):
    lines = [
        "# TFSE Backend Acceptance Matrix",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Status: `{report['status']}`",
        f"- Backend mode: `{report['backend_mode']}`",
        f"- API base URL: `{report['api_base_url'] or '-'}`",
        f"- Endpoints: `{report['summary']['endpoints']}`",
        f"- Blockers: `{report['summary']['blockers']}`",
        f"- Tracked endpoint evidence: `{report['record_summary']['tracked_count']}` (passed `{report['record_summary']['passed_count']}`, blocked `{report['record_summary']['blocked_count']}`)",
        "",
        "## Endpoints",
        "",
    ]
    for item in report["endpoints"]:
        line = f"- `{item['method']} {item['path']}` / {item['proof']}"
        if item.get("latest_record"):
            line += f" / latest `{item['latest_record'].get('result', '-')}` @ `{item['latest_record'].get('checked_at', '-')}`"
        lines.append(line)
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
