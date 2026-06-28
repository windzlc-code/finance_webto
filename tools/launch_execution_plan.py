#!/usr/bin/env python3
import argparse
from collections import OrderedDict
from datetime import datetime, timezone
import json
import sys

import launch_cutover_audit


WAVES = OrderedDict([
    ("wave_0_prepare_inputs", {
        "title": "波次 0：補齊正式配置輸入",
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
        "goal": "先補齊 site-config 與正式平台入口資訊，讓後續驗證與切換具備執行條件。",
    }),
    ("wave_1_enable_platforms", {
        "title": "波次 1：完成平台接入與部署切換",
        "keys": [
            "line_oa_setup",
            "line_oa_handoff",
            "admin_auth_server_cutover",
            "database_backup_strategy",
            "institution_import",
            "formal_backend_migration",
            "host_fallback_deployment",
        ],
        "goal": "把正式平台、資料、備份與主機層能力接好，建立可切換的運營底座。",
    }),
    ("wave_2_verify_observability", {
        "title": "波次 2：驗證追蹤、SEO 與 API 收件",
        "keys": [
            "analytics_debug_verification",
            "search_console_submit",
            "content_api_cutover",
            "leads_api_persistence",
            "turnstile_backend_verification",
            "admin_crm_api_cutover",
            "sentry_verification",
        ],
        "goal": "在正式配置與平台接入後，逐項保存外部收件、SEO 與 API 驗收證據。",
    }),
    ("wave_3_signoff", {
        "title": "波次 3：最終人工簽核",
        "keys": [
            "legal_review_external",
        ],
        "goal": "完成法務 / 合規最終複核，讓正式對外承接具備簽核依據。",
    }),
])


def owner_buckets(items):
    buckets = OrderedDict()
    for item in items:
        buckets.setdefault(item["owner"], []).append(item)
    return buckets


def filtered_items(items, owner=None, statuses=None):
    return [
        item for item in items
        if (not owner or item["owner"] == owner)
        and (not statuses or item["status"] in statuses)
    ]


def build_report(owner=None, wave=None, statuses=None, pending_only=False):
    audit = launch_cutover_audit.build_report()
    item_map = {item["key"]: item for item in audit["items"]}
    waves = []
    for wave_id, config in WAVES.items():
        if wave and wave_id != wave:
            continue
        items = [item_map[key] for key in config["keys"] if key in item_map]
        if pending_only:
            items = [item for item in items if item["status"] != "completed"]
        items = filtered_items(items, owner=owner, statuses=statuses)
        counts = {}
        for item in items:
            counts[item["status"]] = counts.get(item["status"], 0) + 1
        waves.append({
            "wave": wave_id,
            "title": config["title"],
            "goal": config["goal"],
            "counts": counts,
            "owners": owner_buckets(items),
            "items": items,
        })
    return {
        "format": "tfse_launch_execution_plan",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "tools/launch_cutover_audit.py",
        "filters": {
            "owner": owner or "",
            "wave": wave or "",
            "statuses": statuses or [],
            "pending_only": pending_only,
        },
        "summary": audit["summary"],
        "waves": waves,
    }


def markdown(report):
    lines = [
        "# TFSE Launch Execution Plan",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Source: `{report['source']}`",
        f"- Owner filter: `{report['filters']['owner'] or 'all'}`",
        f"- Wave filter: `{report['filters']['wave'] or 'all'}`",
        f"- Status filters: `{', '.join(report['filters']['statuses']) if report['filters']['statuses'] else 'all'}`",
        f"- Pending only: `{report['filters']['pending_only']}`",
        f"- Official config pending: `{report['summary']['official_config_pending']}`",
        f"- Ready for external execution: `{report['summary']['external_execution_ready']}`",
        f"- Human review pending: `{report['summary']['human_review_pending']}`",
        "",
    ]
    for wave in report["waves"]:
        lines.extend([
            f"## {wave['title']}",
            "",
            f"- Goal: {wave['goal']}",
            f"- Status counts: `{json.dumps(wave['counts'], ensure_ascii=False)}`",
            "",
        ])
        for owner, items in wave["owners"].items():
            lines.append(f"### Owner: `{owner}`")
            lines.append("")
            for item in items:
                blockers = "；".join(item["blockers"]) if item["blockers"] else "無"
                exports = "、".join(item["related_exports"]) if item["related_exports"] else "無"
                lines.extend([
                    f"- **{item['label']}**",
                    f"  - Status: `{item['status']}`",
                    f"  - Evidence: {item['evidence']}",
                    f"  - Blockers: {blockers}",
                    f"  - Related: {exports}",
                ])
            lines.append("")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--owner")
    parser.add_argument("--wave")
    parser.add_argument("--status", action="append")
    parser.add_argument("--pending-only", action="store_true")
    parser.add_argument("--markdown", action="store_true")
    args = parser.parse_args()
    report = build_report(
        owner=args.owner,
        wave=args.wave,
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
