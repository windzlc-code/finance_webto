#!/usr/bin/env python3
import json
import sys

import admin_cutover_tooling


FORMAT = "tfse_analytics_debug_verification_package"
PENDING_STATUS = "pending_analytics_debug_verification"
RELATED_EXPORTS = ["tfse_tracking_consent_audit", "tfse_server_event_replay_queue"]
DEBUG_STEPS = "debug_steps"


def build_report():
    return admin_cutover_tooling.analytics_debug_verification_report()


def markdown(report):
    lines = [
        "# TFSE Analytics Debug Verification Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Status: `{report['status']}`",
        f"- GA4 configured: `{report['destinations']['ga4_measurement_id_configured']}`",
        f"- Meta configured: `{report['destinations']['meta_pixel_id_configured']}`",
        f"- Server event endpoint configured: `{report['destinations']['server_event_endpoint_configured']}`",
        "",
        "## Debug Steps",
        "",
    ]
    lines.extend(f"{index}. {item}" for index, item in enumerate(report["debug_steps"], 1))
    lines.extend([
        "",
        "## Event Mappings",
        "",
    ])
    for item in report["event_mappings"]:
        lines.append(f"- `{item['local_event']}` -> GA4 `{item['ga4_event']}` / Meta `{item['meta_event']}` / observed `{item['observed_count']}`")
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
