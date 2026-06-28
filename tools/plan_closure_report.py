#!/usr/bin/env python3
from datetime import datetime, timezone
import json
import sys

import acceptance_audit
import launch_cutover_audit
import project_phase_audit
import project_plan_coverage_audit


LOCAL_BLOCKING_STATUSES = {"missing", "manual_browser", "manual_command", "pending"}
EXTERNAL_BLOCKING_STATUSES = {"external_pending", "manual_external"}


def build_report():
    acceptance = acceptance_audit.build_report()
    phase_audit = project_phase_audit.build_report()
    coverage = project_plan_coverage_audit.build_report()
    cutover = launch_cutover_audit.build_report()

    local_blockers = [
        {
            "group": item["group"],
            "key": item["key"],
            "label": item["label"],
            "status": item["status"],
            "evidence": item["evidence"],
        }
        for item in acceptance["items"]
        if item["status"] in LOCAL_BLOCKING_STATUSES
    ]
    external_blockers = [
        {
            "group": item["group"],
            "key": item["key"],
            "label": item["label"],
            "status": item["status"],
            "evidence": item["evidence"],
        }
        for item in acceptance["items"]
        if item["status"] in EXTERNAL_BLOCKING_STATUSES
    ]
    not_applicable = [
        {
            "group": item["group"],
            "key": item["key"],
            "label": item["label"],
            "status": item["status"],
            "evidence": item["evidence"],
        }
        for item in acceptance["items"]
        if item["status"] == "not_applicable"
    ]
    external_actions = [
        {
            "key": item["key"],
            "label": item["label"],
            "status": item["status"],
            "owner": item["owner"],
            "blockers": item.get("blockers", []),
        }
        for item in cutover["items"]
        if item["status"] in ("pending_external_input", "ready_for_external_execution", "pending_human_review")
    ]

    local_closed = not local_blockers
    production_closed = local_closed and not external_blockers and not external_actions
    closure_status = (
        "production_closed"
        if production_closed
        else "local_closed_external_blocked"
        if local_closed
        else "local_gap_remaining"
    )

    conclusions = []
    if local_closed:
        conclusions.append("本地模板套用、內容替換、資料層、表單、CRM、SEO、審計與交接包已完成閉環。")
    else:
        conclusions.append("仍存在可在本地繼續補齊的缺口，尚未達到本地閉環。")
    if external_blockers or external_actions:
        conclusions.append("正式上線閉環仍受正式配置、正式後端、外部平台驗證或法務簽核阻擋。")
    if not_applicable:
        conclusions.append("部分原始計畫驗收項對靜態 HTML 模板不適用，已單獨標記避免誤判未完成。")

    return {
        "format": "tfse_plan_closure_report",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "TFSE project plan sections 17 + 21, phases 0-8, chapters 1-23",
        "template_policy": "保留 Exomac 前端模板結構，只替換 TFSE 文案、資料、配置與功能接入，不重做前端設計。",
        "summary": {
            "closure_status": closure_status,
            "local_closed": local_closed,
            "production_closed": production_closed,
            "acceptance_ready": acceptance["counts"].get("ready", 0),
            "acceptance_local_blockers": len(local_blockers),
            "acceptance_external_blockers": len(external_blockers),
            "acceptance_not_applicable": len(not_applicable),
            "phase_ready": phase_audit["counts"].get("ready", 0),
            "phase_local_ready_external_pending": phase_audit["counts"].get("local_ready_external_pending", 0),
            "plan_chapters_ready": coverage["summary"]["chapters_ready"],
            "plan_chapters_local_ready_external_pending": coverage["summary"]["chapters_local_ready_external_pending"],
            "cutover_pending_external_input": cutover["counts"].get("pending_external_input", 0),
            "cutover_ready_for_external_execution": cutover["counts"].get("ready_for_external_execution", 0),
            "cutover_pending_human_review": cutover["counts"].get("pending_human_review", 0),
        },
        "conclusions": conclusions,
        "local_blockers": local_blockers,
        "external_blockers": external_blockers,
        "not_applicable": not_applicable,
        "external_actions": external_actions,
        "related_exports": [
            "tfse_acceptance_checklist",
            "tfse_project_phase_audit",
            "tfse_project_plan_coverage_report",
            "tfse_launch_cutover_audit",
            "tfse_launch_handoff_manifest",
        ],
    }


def markdown(report):
    summary = report["summary"]
    lines = [
        "# TFSE Plan Closure Report",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Template policy: {report['template_policy']}",
        f"- Closure status: `{summary['closure_status']}`",
        f"- Local closed: `{summary['local_closed']}`",
        f"- Production closed: `{summary['production_closed']}`",
        f"- Acceptance ready: `{summary['acceptance_ready']}`",
        f"- Acceptance local blockers: `{summary['acceptance_local_blockers']}`",
        f"- Acceptance external blockers: `{summary['acceptance_external_blockers']}`",
        f"- Acceptance not applicable: `{summary['acceptance_not_applicable']}`",
        f"- Phase ready: `{summary['phase_ready']}` / local-ready-external-pending: `{summary['phase_local_ready_external_pending']}`",
        f"- Plan chapters ready: `{summary['plan_chapters_ready']}` / local-ready-external-pending: `{summary['plan_chapters_local_ready_external_pending']}`",
        "",
        "## Conclusions",
        "",
    ]
    for item in report["conclusions"]:
        lines.append(f"- {item}")
    lines.extend([
        "",
        "## Remaining External Blockers",
        "",
    ])
    if report["external_blockers"]:
        for item in report["external_blockers"]:
            lines.extend([
                f"- **{item['label']}**",
                f"  - Group: `{item['group']}`",
                f"  - Status: `{item['status']}`",
                f"  - Evidence: {item['evidence']}",
            ])
    else:
        lines.append("- 無")
    lines.extend([
        "",
        "## External Execution Queue",
        "",
    ])
    if report["external_actions"]:
        for item in report["external_actions"]:
            lines.extend([
                f"- **{item['label']}**",
                f"  - Owner: `{item['owner']}`",
                f"  - Status: `{item['status']}`",
                f"  - Blocking reason: {'；'.join(item['blockers']) if item['blockers'] else '無'}",
            ])
    else:
        lines.append("- 無")
    lines.extend([
        "",
        "## Not Applicable",
        "",
    ])
    if report["not_applicable"]:
        for item in report["not_applicable"]:
            lines.append(f"- `{item['label']}`: {item['evidence']}")
    else:
        lines.append("- 無")
    if report["local_blockers"]:
        lines.extend([
            "",
            "## Local Blockers",
            "",
        ])
        for item in report["local_blockers"]:
            lines.append(f"- `{item['label']}` / `{item['status']}`: {item['evidence']}")
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
