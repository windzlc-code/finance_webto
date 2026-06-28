#!/usr/bin/env python3
import json
import sys

import acceptance_audit
import site_config_tooling


FORMAT = "tfse_acceptance_checklist"


def build_report():
    audit = acceptance_audit.build_report()
    status_counts = {}
    for item in audit["items"]:
        status_counts[item["status"]] = status_counts.get(item["status"], 0) + 1
    ready_statuses = {"ready", "not_applicable"}
    ready_count = sum(1 for item in audit["items"] if item.get("status") in ready_statuses)
    pending_count = len(audit["items"]) - ready_count
    return {
        "format": FORMAT,
        "source": "TFSE project plan chapter 17",
        "exported_at": site_config_tooling.now_iso(),
        "exported_by_role": "data_manager",
        "ready_count": ready_count,
        "pending_count": pending_count,
        "status_counts": status_counts,
        "items": [
            {
                **item,
                "done": item.get("status") in ready_statuses,
            }
            for item in audit["items"]
        ],
    }


def markdown(report):
    lines = [
        "# TFSE Acceptance Checklist",
        "",
        f"- Exported at: `{report['exported_at']}`",
        f"- Ready: `{report['ready_count']}`",
        f"- Pending: `{report['pending_count']}`",
        "",
        "## Pending Items",
        "",
    ]
    pending = [item for item in report["items"] if not item["done"]]
    if pending:
        lines.extend(f"- `{item['group']}` / {item['label']} / `{item['status']}`" for item in pending)
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
