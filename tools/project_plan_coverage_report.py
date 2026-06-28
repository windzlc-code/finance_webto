#!/usr/bin/env python3
import json
import sys

import project_plan_coverage_audit


FORMAT = "tfse_project_plan_coverage_report"


def build_report():
    audit = project_plan_coverage_audit.build_report()
    chapters = (
        audit.get("chapters")
        or audit.get("chapters_detail")
        or audit.get("items", [])
    )
    summary = audit.get("summary", {})
    return {
        "format": FORMAT,
        "version": "2026-06-28",
        "generated_at": audit["generated_at"],
        "generated_by_role": "data_manager",
        "source": "TFSE project plan chapters 1-23",
        "ready_count": summary.get("chapters_ready", 0),
        "local_ready_external_pending_count": summary.get("chapters_local_ready_external_pending", 0),
        "chapters": chapters,
        "related_exports": [
            "tfse_acceptance_checklist",
            "tfse_external_verification_evidence",
            "tfse_formal_config_input_packet",
            "tfse_launch_handoff_manifest",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE Project Plan Coverage Report",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Ready chapters: `{report['ready_count']}`",
        f"- Local ready / external pending: `{report['local_ready_external_pending_count']}`",
        "",
        "## Chapters",
        "",
    ]
    for item in report["chapters"]:
        lines.append(f"- `{item['chapter']}` / `{item['status']}` / {item['title']}")
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
