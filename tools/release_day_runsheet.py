#!/usr/bin/env python3
import argparse
from collections import OrderedDict
from datetime import datetime, timezone
import json
import sys

import external_execution_packet
import formal_config_input_packet
import launch_cutover_audit
import launch_countdown_plan
import owner_cutover_bundle
import plan_closure_report
import production_env_template


CLOSEOUT_ITEMS = {
    "data_manager": [
        {
            "phase": "closeout",
            "key": "config_input_tracking",
            "title": "正式配置收件留痕",
            "status": "pending_external",
            "steps": ["逐項保存 received / validated / blocked 與 owner 備註。"],
            "commands": [],
        },
        {
            "phase": "closeout",
            "key": "launch_health",
            "title": "上線健康檢查",
            "status": "pending_external",
            "steps": ["外部服務完成後驗證收件與導向。"],
            "commands": [],
        },
        {
            "phase": "closeout",
            "key": "external_verification",
            "title": "外部配置驗證留痕",
            "status": "pending_external",
            "steps": ["正式服務配置後逐項保存 passed / blocked 證據。"],
            "commands": [],
        },
        {
            "phase": "closeout",
            "key": "release_readiness",
            "title": "發布凍結與回滾交接",
            "status": "hold",
            "steps": ["部署前確認凍結、命令、備份/遷移與回滾。"],
            "commands": [],
        },
    ],
    "backend_engineer": [
        {
            "phase": "closeout",
            "key": "backend_cutover",
            "title": "正式後端接入路線圖",
            "status": "pending_external",
            "steps": ["依 roadmap 順序完成 leads API、Admin Auth、CRM、事件、內容 API 與備份還原。"],
            "commands": [],
        },
    ],
}


def lightweight_owner_bundle(owner, closure_status):
    config = formal_config_input_packet.build_report(owner=owner, pending_only=True)
    env = production_env_template.build_report(owner=owner, pending_only=True)
    execution = external_execution_packet.build_report(owner=owner)
    audit = launch_cutover_audit.build_report()
    audit_items = [
        item for item in audit["items"]
        if item["owner"] == owner and item["status"] in ("pending_external_input", "ready_for_external_execution", "pending_human_review")
    ]
    execution_map = {item["key"]: item for item in execution["items"]}
    checklist = []

    for item in config["required_inputs"]:
        checklist.append({
            "phase": "config",
            "key": item["key"],
            "title": item["label"],
            "status": "pending_config_input",
            "steps": [
                f"更新 `{', '.join(item['config_paths'])}`。",
                f"使用建議值 `{json.dumps(item['suggested_value'], ensure_ascii=False)}` 作為正式填值模板。",
                item["validation_hint"],
            ],
            "commands": item.get("follow_up_commands", []),
        })

    env_names_from_config = {
        env_name
        for item in config["required_inputs"]
        for env_name in item.get("env_names", [])
    }
    env_names_from_config.update(
        env_name
        for item in config.get("conditional_inputs", [])
        for env_name in item.get("env_names", [])
    )
    for item in env["items"]:
        if item["name"] in env_names_from_config:
            continue
        checklist.append({
            "phase": "env",
            "key": item["name"],
            "title": item["name"],
            "status": "pending_env_input" if not item.get("configured") else "configured",
            "steps": [
                f"在 `{item['deploy_target']}` 補齊 `{item['name']}`。",
                f"參考提示值 `{item['value_hint']}`。",
                "若屬 secret，僅放在 secret manager / CI，不寫入前端或 Git。",
            ],
            "commands": [],
        })

    for item in audit_items:
        detailed = execution_map.get(item["key"])
        if detailed:
            checklist.append({
                "phase": "execution" if item["status"] in ("ready_for_external_execution", "pending_human_review") else "verification",
                "key": item["key"],
                "title": item["label"],
                "status": item["status"],
                "steps": detailed.get("execution_steps", []) or owner_cutover_bundle.generic_cutover_steps(item),
                "commands": detailed.get("commands_after_execution", []),
            })
        else:
            checklist.append({
                "phase": "verification",
                "key": item["key"],
                "title": item["label"],
                "status": item["status"],
                "steps": owner_cutover_bundle.generic_cutover_steps(item),
                "commands": [
                    "python3 tools/launch_cutover_audit.py",
                    "python3 tools/plan_closure_report.py --markdown",
                ],
            })

    checklist.extend(CLOSEOUT_ITEMS.get(owner, []))
    checklist = owner_cutover_bundle.apply_owner_checklist_rules(owner, checklist)
    bundle = {
        "owner": owner,
        "label": owner_cutover_bundle.OWNER_SPECS[owner]["label"],
        "focus": owner_cutover_bundle.OWNER_SPECS[owner]["focus"],
        "owner_patch_template": config.get("owner_patch_templates", {}).get(owner, {}),
        "env_snippet": owner_cutover_bundle.build_owner_env_snippet(env["items"]),
        "checklist": checklist,
        "timeline": [],
        "plan_closure_status": closure_status,
    }
    bundle["timeline"] = owner_cutover_bundle.build_timeline(bundle)
    return bundle


def timeline_index(owners=None, closure_status=None):
    selected = owners or list(owner_cutover_bundle.OWNER_SPECS.keys())
    bundles = [
        lightweight_owner_bundle(owner, closure_status=closure_status)
        for owner in selected
    ]
    slot_map = OrderedDict()
    for bundle in bundles:
        for slot in bundle.get("timeline", []):
            slot_entry = slot_map.setdefault(slot["slot"], [])
            slot_entry.append({
                "owner": bundle["owner"],
                "label": bundle["label"],
                "focus": bundle["focus"],
                "owner_patch_template": bundle.get("owner_patch_template", {}),
                "env_snippet": bundle.get("env_snippet", ""),
                "items": slot["items"],
            })
    return slot_map


def filtered_owner_groups(owner_groups, owner=None):
    if not owner:
        return owner_groups
    return [item for item in owner_groups if item["owner"] == owner]


def build_report(owner=None, slot=None):
    countdown = launch_countdown_plan.build_report()
    closure = plan_closure_report.build_report()
    selected_owners = [owner] if owner else None
    slot_index = timeline_index(
        owners=selected_owners,
        closure_status=closure["summary"]["closure_status"],
    )

    slots = []
    for slot_item in countdown["slots"]:
        slot_id = slot_item["slot"]
        if slot and slot_id != slot:
            continue
        owner_groups = filtered_owner_groups(slot_index.get(slot_id, []), owner=owner)
        if owner and not owner_groups and slot_item["owners"]:
            # Keep empty slots only when explicitly filtering by slot.
            continue
        slots.append({
            "slot": slot_id,
            "title": slot_item["title"],
            "goal": slot_item["goal"],
            "manual_checks": slot_item["manual_checks"],
            "owner_groups": owner_groups,
        })

    return {
        "format": "tfse_release_day_runsheet",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "template_policy": "保留 Exomac 前端模板結構，只補正式配置、資料、驗證與交接執行，不重做前端設計。",
        "filters": {
            "owner": owner or "",
            "slot": slot or "",
        },
        "summary": {
            "slots": len(slots),
            "owners": len({group["owner"] for slot_item in slots for group in slot_item["owner_groups"]}),
            "plan_closure_status": closure["summary"]["closure_status"],
            "local_closed": closure["summary"]["local_closed"],
            "production_closed": closure["summary"]["production_closed"],
        },
        "slots": slots,
        "related_exports": [
            "tfse_owner_cutover_bundle",
            "tfse_launch_countdown_plan",
            "tfse_launch_handoff_manifest",
            "tfse_plan_closure_report",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE Release Day Run Sheet",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Template policy: {report['template_policy']}",
        f"- Owner filter: `{report['filters']['owner'] or 'all'}`",
        f"- Slot filter: `{report['filters']['slot'] or 'all'}`",
        f"- Slots: `{report['summary']['slots']}`",
        f"- Owners: `{report['summary']['owners']}`",
        f"- Plan closure status: `{report['summary']['plan_closure_status']}`",
        f"- Local closed: `{report['summary']['local_closed']}`",
        f"- Production closed: `{report['summary']['production_closed']}`",
        "",
    ]
    for slot_item in report["slots"]:
        lines.extend([
            f"## {slot_item['title']}",
            "",
            f"- Goal: {slot_item['goal']}",
            "",
        ])
        if not slot_item["owner_groups"]:
            lines.append("- 無")
            lines.append("")
            continue
        for group in slot_item["owner_groups"]:
            patch_template = group.get("owner_patch_template") or {}
            env_snippet = str(group.get("env_snippet", "") or "").strip()
            lines.extend([
                f"### `{group['owner']}` / {group['label']}",
                "",
                f"- Focus: {group['focus']}",
                f"- Patch template: `{'yes' if patch_template else 'no'}`",
                f"- Env snippet lines: `{len([line for line in env_snippet.splitlines() if line.strip()])}`",
                "",
            ])
            if patch_template:
                lines.extend([
                    "#### Patch Template",
                    "",
                    "```json",
                    json.dumps(patch_template, ensure_ascii=False, indent=2),
                    "```",
                    "",
                ])
            if env_snippet:
                lines.extend([
                    "#### Env Snippet",
                    "",
                    "```sh",
                    env_snippet,
                    "```",
                    "",
                ])
            for item in group["items"]:
                lines.extend([
                    f"- **{item['title']}**",
                    f"  - Phase: `{item['phase']}`",
                    f"  - Status: `{item['status']}`",
                ])
                if item["steps"]:
                    lines.append(f"  - First step: {item['steps'][0]}")
                if item["commands"]:
                    lines.append(f"  - Commands: `{'; '.join(item['commands'])}`")
            lines.append("")
        if slot_item["manual_checks"]:
            lines.append("### Manual Checks")
            lines.append("")
            for index, check in enumerate(slot_item["manual_checks"], 1):
                lines.append(f"{index}. {check}")
            lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--owner", choices=list(owner_cutover_bundle.OWNER_SPECS.keys()))
    parser.add_argument("--slot")
    parser.add_argument("--markdown", action="store_true")
    args = parser.parse_args()

    report = build_report(owner=args.owner, slot=args.slot)
    if args.markdown:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
