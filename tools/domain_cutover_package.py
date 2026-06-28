#!/usr/bin/env python3
import json
import sys

import release_tooling


FORMAT = "tfse_domain_cutover_package"
STATUS_PENDING = "pending_domain_cutover"
RELATED_EXPORTS = ["tfse_release_readiness_package", "tfse_production_config_readiness"]


def build_report():
    report = release_tooling.build_domain_cutover_report()
    report["format"] = FORMAT
    report["related_exports"] = list(dict.fromkeys(report.get("related_exports", []) + RELATED_EXPORTS))
    return report


def markdown(report):
    lines = [
        "# TFSE Domain Cutover Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Base URL: `{report['base_url'] or '-'}`",
        f"- Status: `{report['status']}`",
        f"- Canonical pages: `{report['summary']['canonical_pages']}`",
        f"- Search Console configured: `{report['summary']['search_console_configured']}`",
        f"- Blockers: `{report['summary']['blockers']}`",
        "",
        "## Assets",
        "",
    ]
    lines.extend(f"- `{item}`" for item in report["assets"])
    lines.extend([
        "",
        "## Required Commands",
        "",
    ])
    lines.extend(f"- `{item}`" for item in report["required_commands"])
    lines.extend([
        "",
        "## Cutover Steps",
        "",
    ])
    lines.extend(f"{index}. {item}" for index, item in enumerate(report["cutover_steps"], 1))
    lines.extend([
        "",
        "## Blockers",
        "",
    ])
    if report["blockers"]:
        lines.extend(f"- {item}" for item in report["blockers"])
    else:
        lines.append("- 無")
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
