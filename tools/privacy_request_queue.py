#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_privacy_request_queue"


def build_report():
    return admin_queue_tooling.privacy_request_queue_report()


def markdown(report):
    lines = [
        "# TFSE Privacy Request Queue",
        "",
        f"- Exported at: `{report['exported_at']}`",
        f"- Source mode: `{report['source_mode']}`",
        f"- Items: `{len(report['items'])}`",
    ]
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
