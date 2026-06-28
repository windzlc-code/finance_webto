#!/usr/bin/env python3
import argparse
from collections import OrderedDict
from datetime import datetime, timezone
import json
import sys

import backend_cutover_roadmap
import external_execution_packet
import formal_config_input_packet
import launch_countdown_plan
import launch_execution_plan
import launch_handoff_manifest
import operations_task_queue
import plan_closure_report
import production_env_template
import site_config_approval_package


OWNER_SPECS = OrderedDict([
    ("data_manager", {
        "label": "Data Manager",
        "focus": "補齊正式網域、GA4、Meta、配置留痕、Search Console 前置與總交接節點。",
    }),
    ("backend_engineer", {
        "label": "Backend Engineer",
        "focus": "切換正式 backend API、事件端點、Turnstile、Admin Auth、CRM/API 落庫與資料遷移。",
    }),
    ("ops_marketing", {
        "label": "Ops Marketing",
        "focus": "完成正式 Line OA URL、圖文選單、quick reply、退訂與站內承接驗收。",
    }),
    ("seo_owner", {
        "label": "SEO Owner",
        "focus": "補齊 Search Console 驗證碼、正式 property 驗證、sitemap 提交與收錄跟進。",
    }),
    ("ops_engineer", {
        "label": "Ops Engineer",
        "focus": "補齊正式 Sentry DSN 並完成前台/API 受控錯誤驗證留痕。",
    }),
    ("infra_owner", {
        "label": "Infra Owner",
        "focus": "完成正式主機 fallback、每日備份、每週 restore drill 與基礎設施證據留痕。",
    }),
    ("legal_reviewer", {
        "label": "Legal Reviewer",
        "focus": "完成台灣當地法務/合規複核與正式簽核留痕。",
    }),
])

OWNER_CHECKLIST_RULES = {
    "data_manager": {
        "priorities": {
            ("config", "formal_domain_base_url"): 10,
            ("config", "ga4_measurement_id"): 20,
            ("config", "meta_pixel_id"): 30,
            ("verification", "formal_domain_base_url"): 40,
            ("verification", "ga4_measurement_id"): 50,
            ("verification", "meta_pixel_id"): 60,
            ("verification", "analytics_debug_verification"): 70,
            ("execution", "institution_import"): 80,
            ("closeout", "config_input_tracking"): 90,
            ("closeout", "launch_health"): 100,
            ("closeout", "external_verification"): 110,
            ("closeout", "release_readiness"): 120,
        },
        "include_operation_keys": {
            "config_input_tracking",
            "launch_health",
            "external_verification",
            "release_readiness",
        },
    },
    "backend_engineer": {
        "priorities": {
            ("config", "backend_api_base_url"): 10,
            ("env", "TFSE_DATABASE_URL"): 20,
            ("env", "TFSE_ADMIN_SESSION_SECRET"): 30,
            ("config", "server_event_endpoint"): 40,
            ("verification", "backend_api_base_url"): 50,
            ("verification", "leads_api_persistence"): 60,
            ("execution", "admin_auth_server_cutover"): 70,
            ("verification", "admin_crm_api_cutover"): 80,
            ("verification", "server_event_endpoint"): 90,
            ("verification", "content_api_cutover"): 100,
            ("verification", "turnstile_backend_verification"): 110,
            ("execution", "formal_backend_migration"): 120,
            ("closeout", "backend_cutover"): 130,
        },
        "include_operation_keys": {"backend_cutover"},
    },
    "ops_engineer": {
        "priorities": {
            ("config", "sentry_dsn"): 10,
            ("verification", "sentry_dsn"): 20,
            ("verification", "sentry_verification"): 30,
        },
        "include_operation_keys": set(),
    },
}

PHASE_SORT_ORDER = {
    "config": 10,
    "env": 20,
    "verification": 30,
    "execution": 40,
    "closeout": 50,
}

TIMELINE_SLOT_ORDER = OrderedDict([
    ("d_minus_3", "D-3"),
    ("d_minus_2", "D-2"),
    ("d_minus_1", "D-1"),
    ("go_live", "Go-live"),
    ("d_plus_1", "D+1"),
])

TIMELINE_KEY_MAP = {
    "formal_domain_base_url": "d_minus_3",
    "ga4_measurement_id": "d_minus_3",
    "meta_pixel_id": "d_minus_3",
    "server_event_endpoint": "d_minus_3",
    "line_oa_url": "d_minus_3",
    "search_console_verification": "d_minus_3",
    "backend_api_base_url": "d_minus_3",
    "sentry_dsn": "d_minus_3",
    "config_input_tracking": "d_minus_3",
    "line_oa_setup": "d_minus_2",
    "admin_auth_server_cutover": "d_minus_2",
    "database_backup_strategy": "d_minus_2",
    "institution_import": "d_minus_2",
    "formal_backend_migration": "d_minus_2",
    "host_fallback_deployment": "d_minus_2",
    "analytics_debug_verification": "d_minus_1",
    "search_console_submit": "d_minus_1",
    "content_api_cutover": "d_minus_1",
    "leads_api_persistence": "d_minus_1",
    "turnstile_backend_verification": "d_minus_1",
    "admin_crm_api_cutover": "d_minus_1",
    "sentry_verification": "d_minus_1",
    "line_oa_handoff": "d_minus_1",
    "launch_health": "go_live",
    "external_verification": "go_live",
    "release_readiness": "go_live",
    "legal_review_external": "go_live",
}


def dedupe(values):
    seen = set()
    ordered = []
    for item in values:
        if item in seen:
            continue
        seen.add(item)
        ordered.append(item)
    return ordered


def owner_env_value(item):
    if item.get("secret"):
        return "<store-in-secret-manager>"
    return str(item.get("value_hint") or "<fill-me>")


def build_owner_env_snippet(items):
    pending_items = [item for item in items if not item.get("configured")]
    if not pending_items:
        return ""
    return "\n".join(f"{item['name']}={owner_env_value(item)}" for item in pending_items)


def approval_args(owner, pending_only):
    return argparse.Namespace(
        draft_file=None,
        draft_json=None,
        owner=owner,
        pending_only=pending_only,
        markdown=False,
    )


def owner_overview_bundle(owner, config_all, env_all, execution_all, operations_all, closure_status):
    config_items = [
        item for item in config_all["required_inputs"]
        if item["owner"] == owner
    ]
    env_items = [
        item for item in env_all["items"]
        if item["owner"] == owner
    ]
    execution_items = execution_all["owner_handoff"].get(owner, [])
    operations_items = [
        item for item in operations_all["tasks"]
        if item["owner_role"] == owner
    ]
    owner_env_items = [item for item in env_items if not item["configured"]]
    return {
        "owner": owner,
        "label": OWNER_SPECS[owner]["label"],
        "focus": OWNER_SPECS[owner]["focus"],
        "summary": {
            "pending_required_inputs": len(config_items),
            "pending_env_items": sum(1 for item in env_items if not item["configured"]),
            "execution_items": len(execution_items),
            "ready_for_external_execution": sum(1 for item in execution_items if item["status"] == "ready_for_external_execution"),
            "pending_external_input": sum(1 for item in execution_items if item["status"] == "pending_external_input"),
            "pending_human_review": sum(1 for item in execution_items if item["status"] == "pending_human_review"),
            "operations_tasks": len(operations_items),
            "commands": 1,
            "related_exports": 0,
        },
        "config_packet": {"required_inputs": config_items},
        "env_template": {"items": owner_env_items},
        "approval_package": {},
        "execution_packet": {"items": execution_items},
        "execution_plan": {},
        "countdown_plan": {},
        "operations_task_queue": {"tasks": operations_items},
        "launch_handoff_manifest": {},
        "backend_cutover_roadmap": None,
        "owner_patch_template": config_all.get("owner_patch_templates", {}).get(owner, {}),
        "env_snippet": build_owner_env_snippet(owner_env_items),
        "commands": [f"python3 tools/owner_cutover_bundle.py --markdown --owner {owner}"],
        "related_exports": [],
        "blockers": [],
        "plan_closure_status": closure_status,
        "overview_only": True,
        "checklist": [],
        "timeline": [],
    }


def generic_cutover_steps(item):
    return [
        f"依相關交接包完成「{item['label']}」對應的正式外部操作或驗證。",
        "保存截圖、收件結果、驗證記錄或 reviewer 備註到對應留痕包。",
        "完成後重跑 launch_cutover_audit / plan_closure_report，確認狀態已更新。",
    ]


def apply_owner_checklist_rules(owner, checklist):
    rule = OWNER_CHECKLIST_RULES.get(owner)
    if not rule:
        return checklist

    include_operation_keys = rule.get("include_operation_keys")
    filtered = []
    for item in checklist:
        if item["phase"] == "closeout" and include_operation_keys is not None and item["key"] not in include_operation_keys:
            continue
        filtered.append(item)

    priorities = rule.get("priorities", {})
    def sort_key(item):
        custom = priorities.get((item["phase"], item["key"]))
        if custom is not None:
            return (0, custom, item["title"])
        return (1, PHASE_SORT_ORDER.get(item["phase"], 999), item["title"])

    return sorted(filtered, key=sort_key)


def timeline_slot_for_item(item):
    key = item["key"]
    if key in TIMELINE_KEY_MAP:
        return TIMELINE_KEY_MAP[key]
    if item["phase"] == "config":
        return "d_minus_3"
    if item["phase"] == "env":
        return "d_minus_3"
    if item["phase"] == "execution":
        return "d_minus_2"
    if item["phase"] == "verification":
        return "d_minus_1"
    if item["phase"] == "closeout":
        return "go_live"
    return "go_live"


def build_timeline(bundle):
    slots = OrderedDict((slot, []) for slot in TIMELINE_SLOT_ORDER.keys())
    for item in bundle.get("checklist", []):
        slot = timeline_slot_for_item(item)
        slots.setdefault(slot, []).append(item)
    return [
        {
            "slot": slot,
            "label": TIMELINE_SLOT_ORDER.get(slot, slot),
            "items": items,
        }
        for slot, items in slots.items()
        if items
    ]


def build_owner_checklist(bundle):
    if bundle.get("overview_only"):
        return []

    checklist = []
    execution_map = {
        item["key"]: item
        for item in bundle["execution_packet"]["items"]
    }
    covered_cutover_keys = set()

    for item in bundle["config_packet"]["required_inputs"]:
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
            "evidence_fields": item.get("config_paths", []),
            "related_exports": item.get("related_exports", []),
        })

    env_names_from_config = {
        env_name
        for item in bundle["config_packet"]["required_inputs"]
        for env_name in item.get("env_names", [])
    }
    env_names_from_config.update(
        env_name
        for item in bundle["config_packet"].get("conditional_inputs", [])
        for env_name in item.get("env_names", [])
    )
    for item in bundle["env_template"]["items"]:
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
            "evidence_fields": [item["name"]],
            "related_exports": [],
        })

    cutover_groups = bundle["launch_handoff_manifest"].get("cutover_summary", {})
    cutover_items = (
        cutover_groups.get("pending_external_input_items", [])
        + cutover_groups.get("ready_for_external_execution_items", [])
        + cutover_groups.get("pending_human_review_items", [])
    )
    for item in cutover_items:
        covered_cutover_keys.add(item["key"])
        detailed = execution_map.get(item["key"])
        if detailed:
            checklist.append({
                "phase": "execution",
                "key": item["key"],
                "title": item["label"],
                "status": item["status"],
                "steps": detailed.get("execution_steps", []) or generic_cutover_steps(item),
                "commands": detailed.get("commands_after_execution", []),
                "evidence_fields": detailed.get("evidence_fields", []),
                "related_exports": detailed.get("related_exports", []),
            })
        else:
            checklist.append({
                "phase": "verification",
                "key": item["key"],
                "title": item["label"],
                "status": item["status"],
                "steps": generic_cutover_steps(item),
                "commands": [
                    "python3 tools/launch_cutover_audit.py",
                    "python3 tools/plan_closure_report.py --markdown",
                ],
                "evidence_fields": ["external_verification_record", "reviewer_note"],
                "related_exports": item.get("related_exports", []),
            })

    for item in bundle["operations_task_queue"]["tasks"]:
        if item["status"] == "ready":
            continue
        checklist.append({
            "phase": "closeout",
            "key": item["key"],
            "title": item["title"],
            "status": item["status"],
            "steps": [item["next_action"]],
            "commands": [],
            "evidence_fields": ["status_update", "owner_note"],
            "related_exports": [item["related_export"]] if item.get("related_export") else [],
        })

    return apply_owner_checklist_rules(bundle["owner"], checklist)


def owner_bundle(owner, closure_status=None):
    config = formal_config_input_packet.build_report(owner=owner, pending_only=True)
    env = production_env_template.build_report(owner=owner, pending_only=True)
    approval = site_config_approval_package.build_report(approval_args(owner, True))
    execution = external_execution_packet.build_report(owner=owner)
    execution_plan = launch_execution_plan.build_report(owner=owner, pending_only=True)
    countdown = launch_countdown_plan.build_report(owner=owner, pending_only=True)
    operations = operations_task_queue.build_report(owner=owner)
    handoff = launch_handoff_manifest.build_report(owner=owner, pending_only=True)
    closure_status = closure_status or plan_closure_report.build_report()["summary"]["closure_status"]
    backend = backend_cutover_roadmap.build_report() if owner == "backend_engineer" else None

    commands = dedupe(
        handoff.get("owner_shortcuts", [])
        + config.get("global_follow_up_commands", [])
        + execution.get("global_commands", [])
    )

    exports = dedupe(
        [export for item in config["required_inputs"] for export in item.get("related_exports", [])]
        + [export for item in config["conditional_inputs"] for export in item.get("related_exports", [])]
        + [export for item in execution["items"] for export in item.get("related_exports", [])]
        + operations.get("related_exports", [])
    )

    blockers = []
    for item in config["required_inputs"]:
        if not item["configured"]:
            blockers.append(item["label"])
    for item in config["conditional_inputs"]:
        if not item["configured"]:
            blockers.append(item["label"])
    for item in execution["items"]:
        if item["status"] in ("pending_external_input", "pending_human_review"):
            blockers.append(item["label"])

    bundle = {
        "owner": owner,
        "label": OWNER_SPECS[owner]["label"],
        "focus": OWNER_SPECS[owner]["focus"],
        "summary": {
            "pending_required_inputs": len(config["required_inputs"]),
            "pending_env_items": env["filtered_pending_count"],
            "execution_items": len(execution["items"]),
            "ready_for_external_execution": sum(1 for item in execution["items"] if item["status"] == "ready_for_external_execution"),
            "pending_external_input": sum(1 for item in execution["items"] if item["status"] == "pending_external_input"),
            "pending_human_review": sum(1 for item in execution["items"] if item["status"] == "pending_human_review"),
            "operations_tasks": operations["summary"]["filtered_tasks"],
            "commands": len(commands),
            "related_exports": len(exports),
        },
        "config_packet": config,
        "env_template": env,
        "approval_package": approval,
        "execution_packet": execution,
        "execution_plan": execution_plan,
        "countdown_plan": countdown,
        "operations_task_queue": operations,
        "launch_handoff_manifest": handoff,
        "backend_cutover_roadmap": backend,
        "owner_patch_template": config.get("owner_patch_templates", {}).get(owner, {}),
        "env_snippet": build_owner_env_snippet(env["items"]),
        "commands": commands,
        "related_exports": exports,
        "blockers": dedupe(blockers),
        "plan_closure_status": closure_status,
        "overview_only": False,
    }
    bundle["checklist"] = build_owner_checklist(bundle)
    bundle["timeline"] = build_timeline(bundle)
    return bundle


def build_report(owner=None, summary_only=False, checklist_only=False, timeline_only=False):
    if owner:
        closure = plan_closure_report.build_report()
        bundles = [owner_bundle(owner, closure_status=closure["summary"]["closure_status"])]
    elif summary_only:
        config_all = formal_config_input_packet.build_report(pending_only=True)
        env_all = production_env_template.build_report(pending_only=True)
        execution_all = external_execution_packet.build_report()
        operations_all = operations_task_queue.build_report()
        closure = plan_closure_report.build_report()
        bundles = [
            owner_overview_bundle(
                current_owner,
                config_all,
                env_all,
                execution_all,
                operations_all,
                closure["summary"]["closure_status"],
            )
            for current_owner in OWNER_SPECS.keys()
        ]
    else:
        closure = plan_closure_report.build_report()
        bundles = [
            owner_bundle(current_owner, closure_status=closure["summary"]["closure_status"])
            for current_owner in OWNER_SPECS.keys()
        ]
    return {
        "format": "tfse_owner_cutover_bundle",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "template_policy": "保留 Exomac 前端模板結構，只補正式配置、資料、驗證與外部交接，不重做前端設計。",
        "filters": {
            "owner": owner or "",
            "summary_only": summary_only,
            "checklist_only": checklist_only,
            "timeline_only": timeline_only,
        },
        "summary": {
            "owners": len(bundles),
            "owners_with_pending_inputs": sum(1 for item in bundles if item["summary"]["pending_required_inputs"]),
            "owners_with_execution_items": sum(1 for item in bundles if item["summary"]["execution_items"]),
            "owners_with_human_review": sum(1 for item in bundles if item["summary"]["pending_human_review"]),
        },
        "bundles": bundles,
    }


def markdown_owner(bundle):
    if bundle.get("overview_only"):
        return "\n".join([
            f"## `{bundle['owner']}` / {bundle['label']}",
            "",
            f"- Focus: {bundle['focus']}",
            f"- Pending required inputs: `{bundle['summary']['pending_required_inputs']}`",
            f"- Pending env items: `{bundle['summary']['pending_env_items']}`",
            f"- Execution items: `{bundle['summary']['execution_items']}`",
            f"- Ready for external execution: `{bundle['summary']['ready_for_external_execution']}`",
            f"- Pending external input: `{bundle['summary']['pending_external_input']}`",
            f"- Pending human review: `{bundle['summary']['pending_human_review']}`",
            f"- Operations tasks: `{bundle['summary']['operations_tasks']}`",
            f"- Detail command: `python3 tools/owner_cutover_bundle.py --markdown --owner {bundle['owner']}`",
        ])
    lines = [
        f"## `{bundle['owner']}` / {bundle['label']}",
        "",
        f"- Focus: {bundle['focus']}",
        f"- Pending required inputs: `{bundle['summary']['pending_required_inputs']}`",
        f"- Pending env items: `{bundle['summary']['pending_env_items']}`",
        f"- Execution items: `{bundle['summary']['execution_items']}`",
        f"- Ready for external execution: `{bundle['summary']['ready_for_external_execution']}`",
        f"- Pending external input: `{bundle['summary']['pending_external_input']}`",
        f"- Pending human review: `{bundle['summary']['pending_human_review']}`",
        f"- Operations tasks: `{bundle['summary']['operations_tasks']}`",
        f"- Plan closure status: `{bundle['plan_closure_status']}`",
        "",
        "### Pending Config Inputs",
        "",
    ]
    if bundle["config_packet"]["required_inputs"]:
        for item in bundle["config_packet"]["required_inputs"]:
            lines.extend([
                f"- **{item['label']}**",
                f"  - Config paths: `{', '.join(item['config_paths'])}`",
                f"  - Suggested: `{json.dumps(item['suggested_value'], ensure_ascii=False)}`",
                f"  - Validation: {item['validation_hint']}",
            ])
    else:
        lines.append("- 無")
    lines.extend([
        "",
        "### Owner Patch Template",
        "",
    ])
    if bundle.get("owner_patch_template"):
        lines.extend([
            "```json",
            json.dumps(bundle["owner_patch_template"], ensure_ascii=False, indent=2),
            "```",
        ])
    else:
        lines.append("- 無")
    lines.extend([
        "",
        "### Conditional / Env Items",
        "",
    ])
    env_items = bundle["env_template"]["items"]
    if env_items:
        for item in env_items:
            lines.extend([
                f"- **{item['name']}**",
                f"  - Deploy target: `{item['deploy_target']}`",
                f"  - Secret: `{item['secret']}`",
                f"  - Value hint: `{item['value_hint']}`",
            ])
    else:
        lines.append("- 無")
    lines.extend([
        "",
        "### Env Snippet",
        "",
    ])
    if bundle.get("env_snippet"):
        lines.extend([
            "```dotenv",
            bundle["env_snippet"],
            "```",
        ])
    else:
        lines.append("- 無")
    lines.extend([
        "",
        "### Execution Items",
        "",
    ])
    if bundle["execution_packet"]["items"]:
        for item in bundle["execution_packet"]["items"]:
            blockers = "；".join(item["blockers"]) if item["blockers"] else "無"
            lines.extend([
                f"- **{item['label']}**",
                f"  - Status: `{item['status']}`",
                f"  - Goal: {item['goal']}",
                f"  - Blockers: {blockers}",
            ])
    else:
        lines.append("- 無")
    lines.extend([
        "",
        "### Operations Tasks",
        "",
    ])
    if bundle["operations_task_queue"]["tasks"]:
        for item in bundle["operations_task_queue"]["tasks"]:
            lines.extend([
                f"- **{item['title']}**",
                f"  - Status: `{item['status']}`",
                f"  - Priority: `{item['priority']}`",
                f"  - Next action: {item['next_action']}",
            ])
    else:
        lines.append("- 無")
    if bundle["backend_cutover_roadmap"]:
        lines.extend([
            "",
            "### Backend Priority Sequence",
            "",
        ])
        for item in bundle["backend_cutover_roadmap"]["priority_sequence"]:
            blockers = "；".join(item["blockers"]) if item["blockers"] else "無"
            lines.extend([
                f"- **{item['title']}**",
                f"  - Readiness: `{item['readiness']}`",
                f"  - Blockers: {blockers}",
            ])
    lines.extend([
        "",
        "### Owner Commands",
        "",
    ])
    for command in bundle["commands"]:
        lines.append(f"- `{command}`")
    lines.extend([
        "",
        "### Related Exports",
        "",
    ])
    for item in bundle["related_exports"]:
        lines.append(f"- `{item}`")
    return "\n".join(lines)


def markdown_checklist_owner(bundle):
    lines = [
        f"## `{bundle['owner']}` / {bundle['label']}",
        "",
        f"- Focus: {bundle['focus']}",
        f"- Checklist items: `{len(bundle['checklist'])}`",
        "",
    ]
    if not bundle["checklist"]:
        lines.append("- 無")
        return "\n".join(lines)
    for index, item in enumerate(bundle["checklist"], 1):
        lines.extend([
            f"### {index}. {item['title']}",
            "",
            f"- Phase: `{item['phase']}`",
            f"- Status: `{item['status']}`",
            "- Steps:",
        ])
        for step_index, step in enumerate(item["steps"], 1):
            lines.append(f"  {step_index}. {step}")
        if item["evidence_fields"]:
            lines.append(f"- Evidence fields: `{', '.join(item['evidence_fields'])}`")
        if item["commands"]:
            lines.append(f"- Commands: `{'; '.join(item['commands'])}`")
        if item["related_exports"]:
            lines.append(f"- Related exports: `{', '.join(item['related_exports'])}`")
        lines.append("")
    return "\n".join(lines).rstrip()


def markdown_timeline_owner(bundle):
    lines = [
        f"## `{bundle['owner']}` / {bundle['label']}",
        "",
        f"- Focus: {bundle['focus']}",
        f"- Timeline slots: `{len(bundle['timeline'])}`",
        "",
    ]
    if not bundle["timeline"]:
        lines.append("- 無")
        return "\n".join(lines)
    for slot in bundle["timeline"]:
        lines.extend([
            f"### {slot['label']}",
            "",
        ])
        for item in slot["items"]:
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
    return "\n".join(lines).rstrip()


def markdown(report):
    lines = [
        "# TFSE Owner Cutover Bundle",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Template policy: {report['template_policy']}",
        f"- Owner filter: `{report['filters']['owner'] or 'all'}`",
        f"- Summary only: `{report['filters']['summary_only']}`",
        f"- Checklist only: `{report['filters']['checklist_only']}`",
        f"- Timeline only: `{report['filters']['timeline_only']}`",
        f"- Owners: `{report['summary']['owners']}`",
        f"- Owners with pending inputs: `{report['summary']['owners_with_pending_inputs']}`",
        f"- Owners with execution items: `{report['summary']['owners_with_execution_items']}`",
        f"- Owners with human review: `{report['summary']['owners_with_human_review']}`",
        "",
    ]
    for bundle in report["bundles"]:
        if report["filters"]["timeline_only"]:
            lines.append(markdown_timeline_owner(bundle))
        elif report["filters"]["checklist_only"]:
            lines.append(markdown_checklist_owner(bundle))
        else:
            lines.append(markdown_owner(bundle))
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--owner", choices=list(OWNER_SPECS.keys()))
    parser.add_argument("--summary-only", action="store_true")
    parser.add_argument("--checklist-only", action="store_true")
    parser.add_argument("--timeline-only", action="store_true")
    parser.add_argument("--markdown", action="store_true")
    args = parser.parse_args()

    report = build_report(
        owner=args.owner,
        summary_only=args.summary_only,
        checklist_only=args.checklist_only,
        timeline_only=args.timeline_only,
    )
    if args.markdown:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
