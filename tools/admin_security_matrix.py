#!/usr/bin/env python3
import json
import sys

import admin_cutover_tooling


FORMAT = "tfse_admin_security_matrix"
RELATED_EXPORTS = ["tfse_admin_auth_cutover_check", "tfse_backend_acceptance_matrix"]


def build_report():
    return admin_cutover_tooling.admin_security_matrix_report()


def markdown(report):
    lines = [
        "# TFSE Admin Security Matrix",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Roles: `{len(report['roles'])}`",
        f"- Checks: `{len(report['checks'])}`",
        f"- Blockers: `{len(report['blockers'])}`",
        "",
        "## Roles",
        "",
    ]
    for item in report["roles"]:
        lines.append(f"- `{item['role']}` / {', '.join(item['permissions'])}")
    lines.extend([
        "",
        "## Checks",
        "",
    ])
    for item in report["checks"]:
        lines.append(f"- **{item['label']}** / `{item['status']}` / {item['evidence']}")
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
