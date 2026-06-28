#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_source_review_queue"


def build_report():
    return admin_queue_tooling.source_review_queue_report()


def markdown(report):
    lines = [
        "# TFSE Source Review Queue",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Review cycle days: `{report['review_cycle_days']}`",
        f"- Total items: `{report['total']}`",
        "",
        "## Items",
        "",
    ]
    lines.extend(f"- `{item['item_type']}` / `{item['id']}` / {'、'.join(item['reasons'])}" for item in report["items"])
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
