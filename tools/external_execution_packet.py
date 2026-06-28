#!/usr/bin/env python3
import argparse
from collections import OrderedDict
from datetime import datetime, timezone
import json
import sys

import launch_cutover_audit
import site_config_tooling


ITEM_SPECS = OrderedDict([
    ("line_oa_setup", {
        "goal": "依既有 Line OA setup package 與 line-flows.json 完成正式圖文選單、quick reply、標籤與自動回覆建立。",
        "dependency_keys": ["line_oa_url"],
        "execution_steps": [
            "在正式 Line OA 後台建立 rich menu、歡迎語、6 個 quick replies 與對應自動回覆。",
            "依 line-flows.json 建立 need_*、segment_*、source_*、form_submitted 等標籤。",
            "確認 quick reply 內的文章、資料庫與免費健檢入口保留 utm_source=line。",
            "檢查 consent_line 為 true 的同步邊界與個資/法務升級規則是否已同步到營運 SOP。",
        ],
        "evidence_fields": ["line_oa_account_id", "rich_menu_id", "quick_reply_count", "tag_count", "welcome_message_checked", "checked_at", "reviewer_role", "evidence_note"],
        "commands_after_execution": [
            "python3 tools/launch_cutover_audit.py",
            "python3 tools/launch_execution_plan.py --markdown",
        ],
    }),
    ("line_oa_handoff", {
        "goal": "完成正式 Line OA 導向、quick reply、退訂關鍵字與手機/桌面截圖留痕。",
        "dependency_keys": ["line_oa_url", "line_oa_setup"],
        "execution_steps": [
            "在 free-check、首頁與落地頁完成一次真實導向，確認 line.oa_url 會開啟正式加友頁。",
            "抽查 quick reply 是否能回到對應文章、資料庫與免費健檢頁。",
            "驗證退訂或停止接收關鍵字有對應處理流程，不會變成持續騷擾。",
            "保存桌面與手機截圖，回填到 tfse_line_oa_handoff_check 或外部驗證留痕。",
        ],
        "evidence_fields": ["checked_url", "line_oa_url", "device", "utm_source", "result", "unsubscribe_keyword_result", "screenshot_url", "checked_at", "reviewer_role", "evidence_note"],
        "commands_after_execution": [
            "python3 tools/launch_cutover_audit.py",
            "python3 tools/launch_countdown_plan.py --markdown",
        ],
    }),
    ("admin_auth_server_cutover", {
        "goal": "將 Admin 登入切到伺服器端 Auth / RBAC / 審計日誌並完成 cookie、CSRF 與 Viewer 遮罩驗證。",
        "dependency_keys": [],
        "execution_steps": [
            "依 api-contract.json 與 tfse_admin_auth_cutover_check 接入 /api/admin/auth/login、session、logout。",
            "確認 httpOnly、Secure、SameSite cookie 與 CSRF 驗證已生效。",
            "以不同角色測試 RBAC 拒絕、Viewer 遮罩與 logout revoke。",
            "保存 audit_logs、cookie flags、CSRF 與未授權拒絕證據。",
        ],
        "evidence_fields": ["checked_endpoint", "method", "status_code", "cookie_flags", "csrf_result", "rbac_result", "viewer_masking_result", "audit_log_id", "checked_at", "reviewer_role", "evidence_note"],
        "commands_after_execution": [
            "python3 tools/launch_cutover_audit.py",
            "NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs",
        ],
    }),
    ("database_backup_strategy", {
        "goal": "啟用正式資料庫每日備份與每週 restore drill，保存 backup receipt 與 restore 證據。",
        "dependency_keys": [],
        "execution_steps": [
            "在正式資料庫或備份服務配置每日 backup job 與失敗通知。",
            "至少完成一次隔離 restore drill，抽查 lead_forms、articles、audit_logs、privacy_request_tasks 與 line_segment_tasks。",
            "記錄 checksum、storage_url、restore_drill_id、RPO/RTO 結果與 audit_log_id。",
            "確認本機 MVP 備份包仍只作遷移前核對，不取代正式備份。",
        ],
        "evidence_fields": ["backup_job_id", "storage_url", "checksum", "restore_drill_id", "rpo_result", "rto_result", "audit_log_id", "checked_at", "reviewer_role", "evidence_note"],
        "commands_after_execution": [
            "python3 tools/launch_cutover_audit.py",
            "python3 tools/launch_execution_plan.py --markdown",
        ],
    }),
    ("institution_import", {
        "goal": "將 institutions.json 與來源版本紀錄正式匯入資料庫，並保存抽查與 audit 證據。",
        "dependency_keys": [],
        "execution_steps": [
            "依 institution import verification package 匯入 institutions 與 institution_source_versions。",
            "抽查 sample_ids、official_url_checked、version_record_count 與 row_count 是否符合預期。",
            "確認來源核驗結果可在正式資料庫與後台追溯，不只停留在 seed JSON。",
            "保存 batch_id、audit_log_id 與 reviewer_role 留痕。",
        ],
        "evidence_fields": ["batch_id", "row_count", "version_record_count", "sample_ids", "official_url_checked", "audit_log_id", "checked_at", "reviewer_role", "evidence_note"],
        "commands_after_execution": [
            "python3 tools/launch_cutover_audit.py",
            "python3 tools/verify_static_site.py",
        ],
    }),
    ("formal_backend_migration", {
        "goal": "把本機產品、文章、FAQ 覆蓋、潛客、來源復核、Line 分群與審計遷移到正式後端版本紀錄。",
        "dependency_keys": [],
        "execution_steps": [
            "從 Admin 匯出 tfse_formal_backend_migration_package 與 tfse_import_validation_package。",
            "依 import_order 將 institutions、categories、financial_products、articles、faq、lead_forms、lead_events、compliance_reviews、audit_logs、source_review_tasks 匯入正式後端。",
            "排除 sample lead 或測試資料，並確認手機 / Line ID 等欄位在伺服器端加密或受遮罩保護。",
            "保存 import_batch_id、entities_imported、sample_leads_excluded、audit_log_id 與抽查結果。",
        ],
        "evidence_fields": ["import_batch_id", "restore_order_step", "entities_imported", "sample_leads_excluded", "audit_log_id", "checked_at", "reviewer_role", "evidence_note"],
        "commands_after_execution": [
            "python3 tools/launch_cutover_audit.py",
            "python3 tools/project_phase_audit.py",
        ],
    }),
    ("host_fallback_deployment", {
        "goal": "在正式主機完成 404 / 500 / server error fallback 配置並保存狀態碼與截圖證據。",
        "dependency_keys": [],
        "execution_steps": [
            "在正式主機或反向代理配置 404 fallback 與平台允許範圍內的 500/server error fallback。",
            "抽查首頁、未知路徑、404.html、500.html 與 server error fallback。",
            "記錄 status_code、fallback_page、viewport、screenshot_url 與平台限制。",
            "若靜態平台不支援真正 500 fallback，需在事故或待辦中標記由正式後端補齊。",
        ],
        "evidence_fields": ["checked_url", "status_code", "fallback_page", "viewport", "result", "screenshot_url", "checked_at", "reviewer_role", "evidence_note"],
        "commands_after_execution": [
            "python3 tools/launch_cutover_audit.py",
            "python3 tools/verify_static_site.py",
        ],
    }),
    ("legal_review_external", {
        "goal": "完成台灣當地法務 / 合規人員對投流、SEO、Line OA、表單與資料展示邊界的正式複核。",
        "dependency_keys": [],
        "execution_steps": [
            "匯出 tfse_legal_compliance_review_package 與 tfse_legal_external_review_evidence 作為送審基礎包。",
            "逐項複核廣告落地頁、首頁、免費健檢、Line OA 話術、SEO 文章、資料來源政策與個資告知。",
            "記錄 review_status、issue_count、required_changes 與 reviewer_role，不保存不必要個資。",
            "未完成簽核前，不放行正式投流、Search Console 大量提交或 Line OA 對外承接。",
        ],
        "evidence_fields": ["review_scope", "review_status", "issue_count", "required_changes", "external_reviewer_role", "signed_at", "evidence_note"],
        "commands_after_execution": [
            "python3 tools/launch_cutover_audit.py",
            "python3 tools/project_plan_coverage_audit.py --markdown",
        ],
    }),
])


def owner_groups(items):
    groups = OrderedDict()
    for item in items:
        groups.setdefault(item["owner"], []).append(item)
    return groups


def latest_record(records, matcher):
    for record in records:
        if matcher(record):
            return record
    return None


def build_report(owner=None, statuses=None):
    audit = launch_cutover_audit.build_report()
    item_map = {item["key"]: item for item in audit["items"]}
    execution_records = sorted(
        site_config_tooling.load_admin_record_seed_records("external_execution_records"),
        key=lambda item: str((item or {}).get("checked_at", "")),
        reverse=True,
    )
    actionable = []
    for key, spec in ITEM_SPECS.items():
        item = item_map.get(key)
        if not item:
            continue
        dependencies = []
        for dependency_key in spec["dependency_keys"]:
            dependency = item_map.get(dependency_key)
            if dependency:
                dependencies.append({
                    "key": dependency["key"],
                    "label": dependency["label"],
                    "status": dependency["status"],
                    "blockers": dependency["blockers"],
                })
        record = latest_record(execution_records, lambda current, current_key=key: current.get("item_key") == current_key)
        actionable.append({
            "key": item["key"],
            "label": item["label"],
            "status": item["status"],
            "owner": item["owner"],
            "goal": spec["goal"],
            "evidence": item["evidence"],
            "latest_record": record,
            "blockers": item["blockers"],
            "related_exports": item["related_exports"],
            "dependency_items": dependencies,
            "execution_steps": spec["execution_steps"],
            "evidence_fields": spec["evidence_fields"],
            "commands_after_execution": spec["commands_after_execution"],
        })

    filtered = [
        item for item in actionable
        if (not owner or item["owner"] == owner)
        and (not statuses or item["status"] in statuses)
    ]

    return {
        "format": "tfse_external_execution_packet",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": ["tools/launch_cutover_audit.py", "assets/js/tfse-admin.js", "LAUNCH_CHECKLIST.md"],
        "filters": {
            "owner": owner or "",
            "statuses": statuses or [],
        },
        "summary": {
            "actionable_items": len(actionable),
            "ready_for_external_execution": sum(1 for item in actionable if item["status"] == "ready_for_external_execution"),
            "pending_human_review": sum(1 for item in actionable if item["status"] == "pending_human_review"),
            "tracked_records": len(execution_records),
            "in_progress_records": sum(1 for item in execution_records if item.get("result") == "in_progress"),
            "completed_records": sum(1 for item in execution_records if item.get("result") == "completed"),
            "filtered_actionable_items": len(filtered),
        },
        "items": filtered,
        "records": execution_records[:150],
        "record_summary": {
            "tracked_count": len(execution_records),
            "in_progress_count": sum(1 for item in execution_records if item.get("result") == "in_progress"),
            "completed_count": sum(1 for item in execution_records if item.get("result") == "completed"),
            "blocked_count": sum(1 for item in execution_records if item.get("result") == "blocked"),
        },
        "owner_handoff": owner_groups(filtered),
        "global_commands": [
            "python3 tools/external_execution_packet.py --markdown",
            "python3 tools/launch_cutover_audit.py",
            "python3 tools/backend_cutover_roadmap.py --markdown",
            "python3 tools/launch_execution_plan.py --markdown",
            "python3 tools/launch_countdown_plan.py --markdown",
            "python3 tools/project_plan_coverage_audit.py --markdown",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE External Execution Packet",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Owner filter: `{report['filters']['owner'] or 'all'}`",
        f"- Status filters: `{', '.join(report['filters']['statuses']) if report['filters']['statuses'] else 'all'}`",
        f"- Actionable items: `{report['summary']['actionable_items']}`",
        f"- Filtered actionable items: `{report['summary']['filtered_actionable_items']}`",
        f"- Ready for external execution: `{report['summary']['ready_for_external_execution']}`",
        f"- Pending human review: `{report['summary']['pending_human_review']}`",
        f"- Tracked execution records: `{report['record_summary']['tracked_count']}` (in progress `{report['record_summary']['in_progress_count']}`, completed `{report['record_summary']['completed_count']}`, blocked `{report['record_summary']['blocked_count']}`)",
        "",
    ]
    for owner, items in report["owner_handoff"].items():
        lines.append(f"## Owner: `{owner}`")
        lines.append("")
        for item in items:
            blockers = "；".join(item["blockers"]) if item["blockers"] else "無"
            exports = "、".join(item["related_exports"]) if item["related_exports"] else "無"
            lines.extend([
                f"### {item['label']}",
                "",
                f"- Status: `{item['status']}`",
                f"- Goal: {item['goal']}",
                f"- Evidence: {item['evidence']}",
                f"- Blockers: {blockers}",
                f"- Related exports: {exports}",
            ])
            if item.get("latest_record"):
                lines.append(
                    f"- Latest record: `{item['latest_record'].get('result', '-')}` / `{item['latest_record'].get('owner', '-')}` / `{item['latest_record'].get('checked_at', '-')}`"
                )
            if item["dependency_items"]:
                lines.append("- Dependencies:")
                for dependency in item["dependency_items"]:
                    dependency_blockers = "；".join(dependency["blockers"]) if dependency["blockers"] else "無"
                    lines.append(f"  - `{dependency['status']}` {dependency['label']}｜阻擋：{dependency_blockers}")
            lines.append("- Execution steps:")
            for index, step in enumerate(item["execution_steps"], 1):
                lines.append(f"  {index}. {step}")
            lines.append(f"- Evidence fields: `{', '.join(item['evidence_fields'])}`")
            lines.append(f"- Commands after execution: `{'; '.join(item['commands_after_execution'])}`")
            lines.append("")
    lines.extend([
        "## Global Commands",
        "",
    ])
    for command in report["global_commands"]:
        lines.append(f"- `{command}`")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--markdown", action="store_true")
    parser.add_argument("--owner")
    parser.add_argument("--status", action="append", dest="statuses")
    args = parser.parse_args()

    report = build_report(owner=args.owner, statuses=args.statuses)
    if args.markdown:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
