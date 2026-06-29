#!/usr/bin/env python3
import json
import sys

import admin_cutover_tooling
import live_deployment_check


FORMAT = "tfse_security_headers_deployment_check"
RELATED_EXPORTS = ["tfse_domain_cutover_package", "tfse_external_verification_evidence"]


def build_report(include_live=False):
    report = admin_cutover_tooling.security_headers_report()
    if include_live:
        live_report = live_deployment_check.build_report(
            live_deployment_check.DEFAULT_BASE_URL,
            live_deployment_check.DEFAULT_HTTPS_URL,
            8.0,
        )
        report["live_deployment"] = {
            "base_url": live_report["base_url"],
            "required_ok": live_report["summary"]["required_ok"],
            "https_ok": live_report["summary"]["https_ok"],
            "external_blockers": live_report["external_blockers"],
            "checked": [
                {
                    "name": item["name"],
                    "url": item["url"],
                    "ok": item["ok"],
                    "status": item["status"],
                    "security_headers_ok": (item.get("security_headers") or {}).get("ok"),
                    "cache_control": item.get("cache_control", ""),
                }
                for item in live_report["checks"]
            ],
        }
    return report


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
    if report.get("live_deployment"):
        live = report["live_deployment"]
        lines.extend([
            "",
            "## Live Deployment Evidence",
            "",
            f"- Base URL: `{live['base_url']}`",
            f"- Required checks OK: `{live['required_ok']}`",
            f"- HTTPS OK: `{live['https_ok']}`",
            f"- External blockers: `{len(live['external_blockers'])}`",
            "",
            "| Check | OK | Status | Headers | Cache-Control |",
            "| --- | --- | --- | --- | --- |",
        ])
        for item in live["checked"]:
            lines.append(
                f"| {item['name']} | {item['ok']} | {item['status']} | {item['security_headers_ok']} | {item['cache_control']} |"
            )
    return "\n".join(lines)


def main():
    report = build_report(include_live="--live" in sys.argv)
    if "--markdown" in sys.argv:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
