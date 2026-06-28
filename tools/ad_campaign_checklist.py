#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_ad_campaign_checklist"


def build_report():
    return admin_queue_tooling.ad_campaign_checklist_report()


def markdown(report):
    lines = [
        "# TFSE Ad Campaign Checklist",
        "",
        f"- Exported at: `{report['exported_at']}`",
        f"- Items: `{len(report['items'])}`",
        "",
        "## UTM Standard",
        "",
    ]
    for key, value in report["utm_standard"].items():
        lines.append(f"- `{key}`: `{value}`")
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
