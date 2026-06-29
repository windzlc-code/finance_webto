#!/usr/bin/env python3
from pathlib import Path
import argparse
import json
import sys

import acceptance_audit
import backend_cutover_roadmap
import browser_acceptance_report
import domain_cutover_package
import external_execution_packet
import external_verification_evidence
import formal_config_input_packet
import https_ingress_fix_package
import launch_health_check
import production_config_readiness
import release_readiness_package
import source_freshness_audit
ROOT = Path(__file__).resolve().parents[1]


def source_review_count():
    pending = 0
    try:
        products = json.loads((ROOT / "assets" / "data" / "products.json").read_text(encoding="utf-8"))
        institutions = json.loads((ROOT / "assets" / "data" / "institutions.json").read_text(encoding="utf-8"))
    except Exception:
        return pending
    for item in products:
        if item.get("status") in {"來源待核驗", "需更新"} or (
            item.get("source_url") == "source-policy.html"
            and item.get("id") not in source_freshness_audit.POLICY_PRODUCT_IDS
        ):
            pending += 1
    for item in institutions:
        if item.get("verification_status") in {"pending", "source_pending"}:
            pending += 1
    return pending


def build_report(owner=None, statuses=None, priorities=None):
    launch = launch_health_check.build_report()
    config = production_config_readiness.build_report()
    config_packet = formal_config_input_packet.build_report()
    acceptance = acceptance_audit.build_report()
    browser = browser_acceptance_report.build_report()
    domain = domain_cutover_package.build_report()
    https_ingress = https_ingress_fix_package.build_report()
    external = external_execution_packet.build_report()
    verification = external_verification_evidence.build_report()
    release = release_readiness_package.build_report()
    backend = backend_cutover_roadmap.build_report()
    external_tracked_records = external["summary"].get("tracked_records", 0)
    config_tracked_records = config_packet["summary"].get("tracked_records", 0)

    tasks = []

    def add(group, key, title, owner_role, status, priority, evidence, next_action, related_export):
        tasks.append({
            "group": group,
            "key": key,
            "title": title,
            "owner_role": owner_role,
            "status": status,
            "priority": priority,
            "evidence": evidence,
            "next_action": next_action,
            "related_export": related_export,
        })

    add("上線配置", "production_config", "正式配置待填與驗證", "data_manager", "pending_external" if config["pending_count"] else "ready", "high" if config["pending_count"] else "normal", f"正式配置待辦 {config['pending_count']} 項", "填入正式網域、追蹤、後端、安全與 Line OA 後重驗。", "tfse_production_config_readiness")
    add("上線配置", "config_input_tracking", "正式配置收件留痕", "data_manager", "pending_external" if config_packet["summary"]["pending_required_inputs"] else "ready", "high" if config_packet["summary"]["pending_required_inputs"] else "normal", f"待填 {config_packet['summary']['pending_required_inputs']} 項；已留痕 {config_tracked_records} 項", "逐項保存 received / validated / blocked 與 owner 備註。", "tfse_formal_config_input_packet")
    add("上線配置", "launch_health", "上線健康檢查", "data_manager", "pending_external" if launch["pending_count"] else "ready", "high" if launch["pending_count"] else "normal", f"健康檢查待辦 {launch['pending_count']} 項", "外部服務完成後驗證收件與導向。", "tfse_launch_health_check")
    add("SEO", "domain_cutover", "正式網域切換交接", "data_manager", "pending_external" if domain["blockers"] else "ready", "high" if domain["blockers"] else "normal", f"網域切換阻擋 {len(domain['blockers'])} 項", "更新 base_url、重生 SEO 資產、驗證 Search Console 與 sitemap。", "tfse_domain_cutover_package")
    add("基礎設施", "https_ingress", "HTTPS 443 公網入站修復", "infra_owner", "pending_external" if not https_ingress["current_evidence"]["tcp_443_ok"] else "ready", "high" if not https_ingress["current_evidence"]["tcp_443_ok"] else "normal", f"TCP 22={https_ingress['current_evidence']['tcp_22_ok']} / 80={https_ingress['current_evidence']['tcp_80_ok']} / 443={https_ingress['current_evidence']['tcp_443_ok']}", "開放雲安全組與主機防火牆 443，確認反代與 TLS 憑證後重跑 strict HTTPS 驗收。", "tfse_https_ingress_fix_package")
    add("監控", "external_verification", "外部配置驗證留痕", "data_manager", "pending_external" if verification["summary"]["verified_items"] < verification["summary"]["required_items"] else "ready", "high" if verification["summary"]["verified_items"] < verification["summary"]["required_items"] else "normal", f"已驗證 {verification['summary']['verified_items']} / {verification['summary']['required_items']} 項", "正式服務配置後逐項保存 passed / blocked 證據。", "tfse_external_verification_evidence")
    add("後端", "backend_cutover", "正式後端接入路線圖", "backend_engineer", "pending_external" if backend["summary"]["ready_steps"] < backend["summary"]["total_steps"] else "ready", "high", f"後端已具備 {backend['summary']['ready_steps']} / {backend['summary']['total_steps']} 步", "依 roadmap 順序完成 leads API、Admin Auth、CRM、事件、內容 API 與備份還原。", "tfse_backend_cutover_roadmap")
    add("切換", "external_execution", "外部執行交接留痕", "data_manager", "pending_external" if external["summary"]["ready_for_external_execution"] else "ready", "high" if external["summary"]["ready_for_external_execution"] else "normal", f"可執行 {external['summary']['ready_for_external_execution']} 項；已留痕 {external_tracked_records} 項", "按 owner 保存 in_progress / completed / blocked 與去識別執行摘要。", "tfse_external_execution_packet")
    add("驗收", "browser_acceptance", "人工瀏覽器驗收留痕", "viewer", "manual_browser" if browser["pending_count"] else "ready", "high" if browser["pending_count"] else "normal", f"待留痕 {browser['pending_count']} 項", "補齊桌面與手機證據備註。", "tfse_browser_acceptance_report")
    pending_acceptance = sum(
        1 for item in acceptance["items"]
        if item["status"] not in ("ready", "not_applicable")
    )
    add("驗收", "acceptance_checklist", "第 17 / 21 章上線驗收清單", "data_manager", "pending" if pending_acceptance else "ready", "high" if pending_acceptance else "normal", f"待驗 {pending_acceptance} 項", "完成或簽核 manual_browser / external_pending / manual_external。", "tfse_acceptance_checklist")
    source_pending = source_review_count()
    add("資料", "source_review", "資料來源復核", "data_manager", "needs_review" if source_pending else "ready", "high" if source_pending else "normal", f"來源待復核 {source_pending} 項", "優先處理待核驗、需更新或超期資料。", "tfse_source_review_queue")
    add("發布", "release_readiness", "發布凍結與回滾交接", "data_manager", "hold" if release["blockers"] else "ready", "high" if release["blockers"] else "normal", f"發布阻擋 {len(release['blockers'])} 項", "部署前確認凍結、命令、備份/遷移與回滾。", "tfse_release_readiness_package")

    filtered_tasks = [
        task for task in tasks
        if (not owner or task["owner_role"] == owner)
        and (not statuses or task["status"] in statuses)
        and (not priorities or task["priority"] in priorities)
    ]

    status_counts = {}
    for task in filtered_tasks:
        status_counts[task["status"]] = status_counts.get(task["status"], 0) + 1

    return {
        "format": "tfse_operations_task_queue",
        "generated_at": release_readiness_package.release_tooling.site_config_tooling.now_iso(),
        "privacy_note": "運維任務隊列只輸出任務、責任角色、狀態與聚合證據，不輸出完整手機、Line ID 或表單補充說明。",
        "filters": {
            "owner": owner or "",
            "statuses": statuses or [],
            "priorities": priorities or [],
        },
        "status_counts": status_counts,
        "summary": {
            "all_tasks": len(tasks),
            "filtered_tasks": len(filtered_tasks),
            "config_tracked_records": config_tracked_records,
            "external_tracked_records": external_tracked_records,
        },
        "tasks": filtered_tasks,
        "next_review_cycle": "weekly",
        "runbook": "OPERATIONS_RUNBOOK.md",
        "related_exports": [
            "tfse_release_readiness_package",
            "tfse_https_ingress_fix_package",
            "tfse_external_verification_evidence",
            "tfse_incident_response_package",
            "tfse_owner_cutover_bundle",
            "tfse_release_day_runsheet",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE Operations Task Queue",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Next review cycle: `{report['next_review_cycle']}`",
        f"- Runbook: `{report['runbook']}`",
        f"- Owner filter: `{report['filters']['owner'] or 'all'}`",
        f"- Status filters: `{', '.join(report['filters']['statuses']) if report['filters']['statuses'] else 'all'}`",
        f"- Priority filters: `{', '.join(report['filters']['priorities']) if report['filters']['priorities'] else 'all'}`",
        f"- Total tasks: `{report['summary']['all_tasks']}`",
        f"- Filtered tasks: `{report['summary']['filtered_tasks']}`",
        f"- Config tracked records: `{report['summary']['config_tracked_records']}`",
        f"- External tracked records: `{report['summary']['external_tracked_records']}`",
        "",
        "## Status Counts",
        "",
    ]
    for key, value in sorted(report["status_counts"].items()):
        lines.append(f"- `{key}`: `{value}`")
    lines.extend([
        "",
        "## Tasks",
        "",
    ])
    for item in report["tasks"]:
        lines.extend([
            f"- **{item['title']}**",
            f"  - Group: `{item['group']}`",
            f"  - Owner: `{item['owner_role']}`",
            f"  - Status: `{item['status']}`",
            f"  - Priority: `{item['priority']}`",
            f"  - Evidence: {item['evidence']}",
            f"  - Next action: {item['next_action']}",
        ])
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--owner")
    parser.add_argument("--status", action="append")
    parser.add_argument("--priority", action="append")
    parser.add_argument("--markdown", action="store_true")
    args = parser.parse_args()
    report = build_report(owner=args.owner, statuses=args.status, priorities=args.priority)
    if args.markdown:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
