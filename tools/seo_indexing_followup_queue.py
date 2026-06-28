#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_seo_indexing_followup_queue"


def build_report():
    return admin_queue_tooling.seo_indexing_followup_queue_report()


def markdown(report):
    return "\n".join([
        "# TFSE SEO Indexing Followup Queue",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Tasks: `{report['summary']['tasks']}`",
        f"- High priority: `{report['summary']['high_priority']}`",
        f"- Blockers: `{report['summary']['blockers']}`",
    ])


def main():
    report = build_report()
    if "--markdown" in sys.argv:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
