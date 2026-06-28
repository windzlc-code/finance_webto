#!/usr/bin/env python3
import argparse
from collections import OrderedDict
from datetime import datetime, timezone
import json
import sys

import acceptance_audit
import backend_cutover_roadmap
import external_execution_packet
import formal_config_input_packet
import launch_cutover_audit
import launch_execution_plan
import launch_countdown_plan
import plan_closure_report
import project_phase_audit
import project_plan_coverage_audit
import release_tooling
import site_config_tooling


def owner_merge(sections):
    buckets = OrderedDict()
    for section_name, items in sections:
        for owner, owner_items in items.items():
            bucket = buckets.setdefault(owner, [])
            for item in owner_items:
                bucket.append({
                    "section": section_name,
                    "key": item.get("key"),
                    "label": item.get("label"),
                    "status": item.get("status", "pending"),
                })
    return buckets


def filter_items(items, owner=None, statuses=None):
    return [
        item for item in items
        if (not owner or item.get("owner") == owner or item.get("owner_role") == owner)
        and (not statuses or item.get("status") in statuses)
    ]


def owner_shortcuts(owner=None, statuses=None, pending_only=False):
    commands = [
        "python3 tools/launch_handoff_manifest.py --markdown",
        "python3 tools/owner_cutover_bundle.py --markdown --summary-only",
        "python3 tools/release_day_runsheet.py --markdown",
    ]
    if owner:
        status_flags = "".join(f" --status {status}" for status in (statuses or []))
        pending_flag = " --pending-only" if pending_only else ""
        commands.extend([
            f"python3 tools/formal_config_input_packet.py --markdown --owner {owner}{pending_flag}",
            f"python3 tools/external_execution_packet.py --markdown --owner {owner}{status_flags}",
            f"python3 tools/launch_execution_plan.py --markdown --owner {owner}{status_flags}{pending_flag}",
            f"python3 tools/launch_countdown_plan.py --markdown --owner {owner}{status_flags}{pending_flag}",
            f"python3 tools/owner_cutover_bundle.py --markdown --owner {owner}",
            f"python3 tools/owner_cutover_bundle.py --markdown --owner {owner} --checklist-only",
            f"python3 tools/owner_cutover_bundle.py --markdown --owner {owner} --timeline-only",
            f"python3 tools/release_day_runsheet.py --markdown --owner {owner}",
            f"python3 tools/operations_task_queue.py --markdown --owner {owner}",
        ])
    return commands


def build_report(owner=None, statuses=None, pending_only=False):
    acceptance = acceptance_audit.build_report()
    phases = project_phase_audit.build_report()
    coverage = project_plan_coverage_audit.build_report()
    cutover = launch_cutover_audit.build_report()
    config_packet = formal_config_input_packet.build_report(
        owner=owner,
        pending_only=pending_only,
    )
    execution_packet = external_execution_packet.build_report(
        owner=owner,
        statuses=statuses,
    )
    execution_plan = launch_execution_plan.build_report(
        owner=owner,
        statuses=statuses,
        pending_only=pending_only,
    )
    countdown = launch_countdown_plan.build_report(
        owner=owner,
        statuses=statuses,
        pending_only=pending_only,
    )
    backend_roadmap = backend_cutover_roadmap.build_report()
    closure = plan_closure_report.build_report()
    launch_handoff_records = sorted(
        site_config_tooling.load_admin_record_seed_records("launch_handoff_records"),
        key=lambda item: str((item or {}).get("checked_at", "")),
        reverse=True,
    )

    pending_acceptance = [
        {
            "group": item["group"],
            "key": item["key"],
            "label": item["label"],
            "status": item["status"],
            "evidence": item["evidence"],
        }
        for item in acceptance["items"]
        if item["status"] in ("external_pending", "manual_external")
    ]
    if statuses:
        pending_acceptance = [
            item for item in pending_acceptance
            if item["status"] in statuses
        ]
    external_inputs = [
        item for item in config_packet["required_inputs"]
        if not item["configured"]
    ]
    conditional_inputs = [
        item for item in config_packet["conditional_inputs"]
        if not item["configured"]
    ]
    human_reviews = [
        item for item in execution_packet["items"]
        if item["status"] == "pending_human_review"
    ]
    if pending_only:
        pending_acceptance = [item for item in pending_acceptance if item["status"] != "ready"]
        human_reviews = [item for item in human_reviews if item["status"] != "ready"]

    pending_external_input_items = filter_items([
        item for item in cutover["items"]
        if item["status"] == "pending_external_input"
    ], owner=owner, statuses=statuses)
    ready_for_external_execution_items = filter_items([
        item for item in cutover["items"]
        if item["status"] == "ready_for_external_execution"
    ], owner=owner, statuses=statuses)
    pending_human_review_items = filter_items([
        item for item in cutover["items"]
        if item["status"] == "pending_human_review"
    ], owner=owner, statuses=statuses)

    return {
        "format": "tfse_launch_handoff_manifest",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "template_policy": "保留 Exomac 前端模板結構，只替換 TFSE 文案、資料、配置與功能接入，不重做前端設計。",
        "filters": {
            "owner": owner or "",
            "statuses": statuses or [],
            "pending_only": pending_only,
        },
        "summary": {
            "acceptance_external_pending": len(pending_acceptance),
            "phase_ready": phases["counts"].get("ready", 0),
            "phase_local_ready_external_pending": phases["counts"].get("local_ready_external_pending", 0),
            "plan_chapters_ready": coverage["summary"]["chapters_ready"],
            "plan_chapters_local_ready_external_pending": coverage["summary"]["chapters_local_ready_external_pending"],
            "config_inputs_pending": len(external_inputs),
            "config_conditionals_pending": len(conditional_inputs),
            "config_inputs_tracked": config_packet["summary"].get("tracked_records", 0),
            "cutover_pending_external_input": cutover["summary"]["official_config_pending"],
            "cutover_ready_for_external_execution": cutover["summary"]["external_execution_ready"],
            "cutover_human_review_pending": cutover["summary"]["human_review_pending"],
            "execution_items": execution_packet["summary"]["actionable_items"],
            "execution_tracked_records": execution_packet["summary"].get("tracked_records", 0),
            "launch_handoff_tracked_records": len(launch_handoff_records),
            "backend_ready_steps": backend_roadmap["summary"]["ready_steps"],
            "backend_total_steps": backend_roadmap["summary"]["total_steps"],
            "plan_closure_status": closure["summary"]["closure_status"],
            "plan_local_blockers": closure["summary"]["acceptance_local_blockers"],
            "filtered_execution_items": len(execution_packet["items"]),
            "filtered_pending_external_input_items": len(pending_external_input_items),
            "filtered_ready_for_external_execution_items": len(ready_for_external_execution_items),
            "filtered_pending_human_review_items": len(pending_human_review_items),
        },
        "acceptance_pending": pending_acceptance,
        "config_packet": {
            "summary": config_packet["summary"],
            "required_inputs_pending": external_inputs,
            "conditional_inputs_pending": conditional_inputs,
            "secret_inputs": config_packet["secret_inputs"],
        },
        "cutover_summary": {
            "counts": cutover["counts"],
            "pending_external_input_items": pending_external_input_items,
            "ready_for_external_execution_items": ready_for_external_execution_items,
            "pending_human_review_items": pending_human_review_items,
        },
        "execution_packet": {
            "summary": execution_packet["summary"],
            "items": execution_packet["items"],
            "pending_human_review_items": human_reviews,
        },
        "launch_handoff_records": launch_handoff_records[:150],
        "launch_handoff_record_summary": {
            "tracked_count": len(launch_handoff_records),
            "ready_count": sum(1 for item in launch_handoff_records if item.get("result") == "ready"),
            "blocked_count": sum(1 for item in launch_handoff_records if item.get("result") == "blocked"),
        },
        "phase_audit": phases,
        "plan_coverage": coverage,
        "launch_execution_plan": execution_plan,
        "launch_countdown_plan": countdown,
        "plan_closure": closure,
        "owner_handoff": owner_merge([
            ("config_required_inputs", config_packet["owner_handoff"]),
            ("external_execution", execution_packet["owner_handoff"]),
        ]),
        "recommended_sequence": [
            "先依 tfse_formal_config_input_packet 補齊正式網址、追蹤、Search Console、backend API、Line OA 與 Sentry 等待填配置。",
            "配置到位後，先依 tfse_backend_cutover_roadmap 對齊 leads API、Admin Auth、CRM、事件、內容 API 與備份還原的切換順序。",
            "再依 tfse_external_execution_packet 完成 Line OA 建置、Admin Auth cutover、正式備份、機構匯入、正式遷移與主機 fallback。",
            "同步保留 Search Console、GA4/Meta、Sentry、Turnstile、內容 API 與 CRM API 的外部證據。",
            "最後完成台灣當地法務 / 合規簽核，再重跑 launch_cutover / project_plan_coverage / acceptance 類審計。",
        ],
        "owner_shortcuts": owner_shortcuts(owner=owner, statuses=statuses, pending_only=pending_only),
        "required_commands": release_tooling.RELEASE_REQUIRED_COMMANDS,
        "related_exports": [
            "tfse_local_audit_matrix",
            "tfse_formal_config_input_packet",
            "tfse_backend_cutover_roadmap",
            "tfse_external_execution_packet",
            "tfse_owner_cutover_bundle",
            "tfse_release_day_runsheet",
            "tfse_project_phase_audit",
            "tfse_project_plan_coverage_report",
            "tfse_plan_closure_report",
            "tfse_release_readiness_package",
            "tfse_acceptance_checklist",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE Launch Handoff Manifest",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Template policy: {report['template_policy']}",
        f"- Owner filter: `{report['filters']['owner'] or 'all'}`",
        f"- Status filters: `{', '.join(report['filters']['statuses']) if report['filters']['statuses'] else 'all'}`",
        f"- Pending only: `{report['filters']['pending_only']}`",
        f"- Config inputs pending: `{report['summary']['config_inputs_pending']}`",
        f"- Config input receipts tracked: `{report['summary']['config_inputs_tracked']}`",
        f"- Cutover ready for execution: `{report['summary']['cutover_ready_for_external_execution']}`",
        f"- Human review pending: `{report['summary']['cutover_human_review_pending']}`",
        f"- External execution records tracked: `{report['summary']['execution_tracked_records']}`",
        f"- Launch handoff checkpoints tracked: `{report['summary']['launch_handoff_tracked_records']}`",
        f"- Filtered execution items: `{report['summary']['filtered_execution_items']}`",
        f"- Filtered pending external input items: `{report['summary']['filtered_pending_external_input_items']}`",
        f"- Filtered ready-for-execution items: `{report['summary']['filtered_ready_for_external_execution_items']}`",
        f"- Filtered pending human review items: `{report['summary']['filtered_pending_human_review_items']}`",
        f"- Plan chapters ready: `{report['summary']['plan_chapters_ready']}` / local-ready-external-pending: `{report['summary']['plan_chapters_local_ready_external_pending']}`",
        f"- Backend roadmap ready steps: `{report['summary']['backend_ready_steps']}` / `{report['summary']['backend_total_steps']}`",
        f"- Plan closure status: `{report['summary']['plan_closure_status']}`",
        "",
        "## Recommended Sequence",
        "",
    ]
    for index, step in enumerate(report["recommended_sequence"], 1):
        lines.append(f"{index}. {step}")
    lines.extend([
        "",
        "## Pending Config Inputs",
        "",
    ])
    if report["config_packet"]["required_inputs_pending"]:
        for item in report["config_packet"]["required_inputs_pending"]:
            lines.extend([
                f"- **{item['label']}**",
                f"  - Owner: `{item['owner']}`",
                f"  - Config paths: `{', '.join(item['config_paths'])}`",
                f"  - Suggested: `{json.dumps(item['suggested_value'], ensure_ascii=False)}`",
            ])
    else:
        lines.append("- 無")
    lines.extend([
        "",
        "## External Execution Owners",
        "",
    ])
    if report["owner_handoff"]:
        for owner, items in report["owner_handoff"].items():
            lines.append(f"### `{owner}`")
            lines.append("")
            for item in items:
                lines.append(f"- `{item['section']}` / `{item['status']}` / {item['label']}")
            lines.append("")
    else:
        lines.append("- 無")
        lines.append("")
    lines.extend([
        "## Owner Shortcuts",
        "",
    ])
    for command in report["owner_shortcuts"]:
        lines.append(f"- `{command}`")
    lines.extend([
        "",
        "## Required Commands",
        "",
    ])
    for command in report["required_commands"]:
        lines.append(f"- `{command}`")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--owner")
    parser.add_argument("--status", action="append")
    parser.add_argument("--pending-only", action="store_true")
    parser.add_argument("--markdown", action="store_true")
    args = parser.parse_args()
    report = build_report(owner=args.owner, statuses=args.status, pending_only=args.pending_only)
    if args.markdown:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
