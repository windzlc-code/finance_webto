#!/usr/bin/env python3
import argparse
from collections import OrderedDict
from datetime import datetime, timezone
import json
import sys

import launch_cutover_audit


SLOTS = OrderedDict([
    ("d_minus_3", {
        "title": "D-3：補齊正式配置與平台入口",
        "keys": [
            "formal_domain_base_url",
            "ga4_measurement_id",
            "meta_pixel_id",
            "server_event_endpoint",
            "line_oa_url",
            "search_console_verification",
            "backend_api_base_url",
            "sentry_dsn",
        ],
        "goal": "把所有正式平台 URL、ID、DSN 與 site-config 入口資訊補齊。",
    }),
    ("d_minus_2", {
        "title": "D-2：完成平台接入與資料準備",
        "keys": [
            "line_oa_setup",
            "admin_auth_server_cutover",
            "database_backup_strategy",
            "institution_import",
            "formal_backend_migration",
            "host_fallback_deployment",
        ],
        "goal": "完成正式平台、資料、備份與主機層切換前準備。",
    }),
    ("d_minus_1", {
        "title": "D-1：驗證 SEO、追蹤與 API 收件",
        "keys": [
            "analytics_debug_verification",
            "search_console_submit",
            "content_api_cutover",
            "leads_api_persistence",
            "turnstile_backend_verification",
            "admin_crm_api_cutover",
            "sentry_verification",
            "line_oa_handoff",
        ],
        "goal": "保留正式外部收件與 API 驗收證據，確認切換後對外可用。",
    }),
    ("go_live", {
        "title": "Go-live：最終簽核與發布",
        "keys": [
            "legal_review_external",
        ],
        "goal": "完成最終人工簽核與發布前最後核對。",
    }),
    ("d_plus_1", {
        "title": "D+1：發布後複查",
        "keys": [],
        "goal": "發布後複查收件、SEO、Lead 流程與異常告警。",
    }),
])


def group_by_owner(items):
    owners = OrderedDict()
    for item in items:
        owners.setdefault(item["owner"], []).append(item)
    return owners


def filtered_items(items, owner=None, statuses=None):
    return [
        item for item in items
        if (not owner or item["owner"] == owner)
        and (not statuses or item["status"] in statuses)
    ]


def build_report(owner=None, slot=None, statuses=None, pending_only=False):
    audit = launch_cutover_audit.build_report()
    item_map = {item["key"]: item for item in audit["items"]}
    slots = []
    slot_filter = slot
    for slot_id, slot_config in SLOTS.items():
        if slot_filter and slot_id != slot_filter:
            continue
        items = [item_map[key] for key in slot_config["keys"] if key in item_map]
        if pending_only:
            items = [item for item in items if item["status"] != "completed"]
        items = filtered_items(items, owner=owner, statuses=statuses)
        counts = {}
        for item in items:
            counts[item["status"]] = counts.get(item["status"], 0) + 1
        manual_checks = []
        if slot_id == "go_live":
            manual_checks = [
                "確認最新 tfse_acceptance_checklist、tfse_browser_acceptance_report 與 tfse_release_readiness_package 均已匯出。",
                "確認 external verification records 已補齊 GA4 / Search Console / backend / Line OA 等已完成項。",
                "法務 / 合規 reviewer 完成 signoff 後，再放行對外投流、SEO 提交與 Line OA 承接。",
            ]
        elif slot_id == "d_plus_1":
            manual_checks = [
                "檢查 GA4 / Meta / Server Event / Sentry 是否持續收件。",
                "抽查首頁、資料庫、免費財務健檢查詢、聯絡頁資料回報與 Admin CRM 是否仍可用。",
                "檢查 Search Console coverage / URL Inspection、Line OA quick reply、退訂關鍵字與 lead follow-up 是否正常。",
            ]
        slots.append({
            "slot": slot_id,
            "title": slot_config["title"],
            "goal": slot_config["goal"],
            "counts": counts,
            "owners": group_by_owner(items),
            "items": items,
            "manual_checks": manual_checks,
        })
    return {
        "format": "tfse_launch_countdown_plan",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "tools/launch_cutover_audit.py",
        "filters": {
            "owner": owner or "",
            "slot": slot or "",
            "statuses": statuses or [],
            "pending_only": pending_only,
        },
        "summary": audit["summary"],
        "slots": slots,
    }


def markdown(report):
    lines = [
        "# TFSE Launch Countdown Plan",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Source: `{report['source']}`",
        f"- Owner filter: `{report['filters']['owner'] or 'all'}`",
        f"- Slot filter: `{report['filters']['slot'] or 'all'}`",
        f"- Status filters: `{', '.join(report['filters']['statuses']) if report['filters']['statuses'] else 'all'}`",
        f"- Pending only: `{report['filters']['pending_only']}`",
        f"- Official config pending: `{report['summary']['official_config_pending']}`",
        f"- Ready for external execution: `{report['summary']['external_execution_ready']}`",
        f"- Human review pending: `{report['summary']['human_review_pending']}`",
        "",
    ]
    for slot in report["slots"]:
        lines.extend([
            f"## {slot['title']}",
            "",
            f"- Goal: {slot['goal']}",
            f"- Status counts: `{json.dumps(slot['counts'], ensure_ascii=False)}`",
            "",
        ])
        for owner, items in slot["owners"].items():
            lines.append(f"### Owner: `{owner}`")
            lines.append("")
            for item in items:
                blockers = "；".join(item["blockers"]) if item["blockers"] else "無"
                lines.extend([
                    f"- **{item['label']}**",
                    f"  - Status: `{item['status']}`",
                    f"  - Evidence: {item['evidence']}",
                    f"  - Blockers: {blockers}",
                ])
            lines.append("")
        if slot["manual_checks"]:
            lines.append("### Manual Checks")
            lines.append("")
            for index, check in enumerate(slot["manual_checks"], 1):
                lines.append(f"{index}. {check}")
            lines.append("")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--owner")
    parser.add_argument("--slot")
    parser.add_argument("--status", action="append")
    parser.add_argument("--pending-only", action="store_true")
    parser.add_argument("--markdown", action="store_true")
    args = parser.parse_args()
    report = build_report(
        owner=args.owner,
        slot=args.slot,
        statuses=args.status,
        pending_only=args.pending_only,
    )
    if args.markdown:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
