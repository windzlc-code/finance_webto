#!/usr/bin/env python3
import json
import sys

import acceptance_audit
import backend_cutover_roadmap
import browser_acceptance_report
import domain_cutover_package
import external_execution_packet
import external_verification_evidence
import formal_config_input_packet
import launch_health_check
import production_config_readiness
import release_tooling


PRIMARY_REQUIRED_COMMAND = "python3 tools/launch_health_check.py --markdown"


def build_report():
    launch = launch_health_check.build_report()
    config = production_config_readiness.build_report()
    config_packet = formal_config_input_packet.build_report()
    acceptance = acceptance_audit.build_report()
    browser = browser_acceptance_report.build_report()
    domain = domain_cutover_package.build_report()
    external = external_execution_packet.build_report()
    verification = external_verification_evidence.build_report()
    backend = backend_cutover_roadmap.build_report()
    config_tracked_records = config_packet["summary"].get("tracked_records", 0)

    blockers = []
    if launch["pending_count"]:
        blockers.append(f"上線健康檢查仍有 {launch['pending_count']} 項待配置或待外部驗證。")
    if config["pending_count"]:
        blockers.append(f"正式配置交接包仍有 {config['pending_count']} 項待填。")
    acceptance_pending = sum(
        1 for item in acceptance["items"]
        if item["status"] in ("external_pending", "manual_external", "manual_browser")
    )
    if acceptance_pending:
        blockers.append(f"上線驗收清單仍有 {acceptance_pending} 項待驗。")
    if browser["pending_count"]:
        blockers.append(f"瀏覽器人工驗收仍有 {browser['pending_count']} 項未留痕。")
    if domain["blockers"]:
        blockers.append(f"正式網域切換仍有 {len(domain['blockers'])} 項待處理。")
    if config_packet["summary"]["pending_required_inputs"]:
        blockers.append("正式配置待填項尚未全部完成。")
    external_tracked_records = external["summary"].get("tracked_records", 0)
    if external["summary"]["ready_for_external_execution"] and not external_tracked_records:
        blockers.append("外部執行交接隊列尚未保存任何執行留痕。")
    if verification["summary"]["verified_items"] < verification["summary"]["configured_items"]:
        blockers.append("外部配置服務尚未完成完整驗證留痕。")

    release_status = "hold_for_external_or_manual_items" if blockers else "ready_for_static_release"
    return {
        "format": "tfse_release_readiness_package",
        "generated_at": release_tooling.site_config_tooling.now_iso(),
        "source_mode": "static_mvp_with_formal_cutover_handoff",
        "release_scope": {
            "template_policy": "保留 Exomac 前端模板結構，只替換 TFSE 文案、資料、配置與功能接入。",
            "static_mvp": True,
            "target_documents": ["OPERATIONS_RUNBOOK.md", "DEPLOYMENT.md", "LAUNCH_CHECKLIST.md", "api-contract.json", "backend-schema.sql"],
        },
        "readiness": {
            "launch_ready_count": launch["ready_count"],
            "launch_pending_count": launch["pending_count"],
            "config_ready_count": config["ready_count"],
            "config_pending_count": config["pending_count"],
            "config_tracked_count": config_tracked_records,
            "acceptance_ready_count": acceptance["counts"].get("ready", 0),
            "acceptance_pending_count": acceptance_pending,
            "browser_pending_count": browser["pending_count"],
            "external_execution_tracked_count": external_tracked_records,
            "external_verified_count": verification["summary"]["verified_items"],
            "external_configured_count": verification["summary"]["configured_items"],
            "backend_ready_steps": backend["summary"]["ready_steps"],
            "backend_total_steps": backend["summary"]["total_steps"],
            "release_status": release_status,
        },
        "required_commands": release_tooling.RELEASE_REQUIRED_COMMANDS,
        "deployment_checks": [
            "部署前凍結內容與設定，不改版式。",
            "確認 sitemap、robots、feed、錯誤頁、_headers、security.txt 隨站發布。",
            "正式網域切換後執行 generate_seo_assets.py 並重跑驗收。",
            "外部服務填入後驗證 GA4、Meta、Server Event、Sentry、Search Console、Line OA。",
        ],
        "rollback_plan": [
            "保留上一個可用靜態部署版本或主機快照。",
            "若主站不可用，先回滾靜態部署，再驗證 index.html、database.html、free-check.html、admin.html 與 404.html。",
            "若正式 API 異常，先停止寫入或切維護，不用 localStorage 覆蓋正式資料。",
            "回滾後記錄影響頁面、時間、修復版本與原因。",
        ],
        "artifact_summary": {
            "launch_health_format": launch["format"],
            "launch_health_pending_count": launch["pending_count"],
            "config_readiness_format": config["format"],
            "config_pending_count": config["pending_count"],
            "config_input_format": config_packet["format"],
            "config_input_tracked": config_tracked_records,
            "acceptance_format": acceptance["format"],
            "browser_acceptance_format": browser["format"],
            "domain_cutover_format": domain["format"],
            "domain_cutover_blockers": domain["summary"]["blockers"],
            "external_execution_format": external["format"],
            "external_execution_tracked": external_tracked_records,
            "external_verification_format": verification["format"],
            "external_verified_count": verification["summary"]["verified_items"],
            "backend_roadmap_format": backend["format"],
            "backend_ready_steps": backend["summary"]["ready_steps"],
        },
        "blockers": blockers,
        "handoff_notes": [
            "此包是靜態 MVP 與正式部署交接清單，不取代正式後端備份、法務意見或外部服務收件驗證。",
            "正式上線前需將 external_pending、manual_external 與 manual_browser 項逐項留痕或由責任人簽核。",
            "如需正式後端接入，先匯出 tfse_backend_cutover_roadmap，再依 PRODUCTION_BACKEND_PLAN.md 執行。",
        ],
        "related_exports": [
            "tfse_launch_health_check",
            "tfse_domain_cutover_package",
            "tfse_external_verification_evidence",
            "tfse_owner_cutover_bundle",
            "tfse_release_day_runsheet",
            "tfse_launch_handoff_manifest",
            "tfse_operations_task_queue",
            "tfse_incident_response_package",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE Release Readiness Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Release status: `{report['readiness']['release_status']}`",
        f"- Launch pending count: `{report['readiness']['launch_pending_count']}`",
        f"- Config pending count: `{report['readiness']['config_pending_count']}`",
        f"- Config receipts tracked: `{report['readiness']['config_tracked_count']}`",
        f"- Acceptance pending count: `{report['readiness']['acceptance_pending_count']}`",
        f"- Browser pending count: `{report['readiness']['browser_pending_count']}`",
        f"- External execution records tracked: `{report['readiness']['external_execution_tracked_count']}`",
        f"- External verified/configured: `{report['readiness']['external_verified_count']}` / `{report['readiness']['external_configured_count']}`",
        "",
        "## Blockers",
        "",
    ]
    if report["blockers"]:
        lines.extend(f"- {item}" for item in report["blockers"])
    else:
        lines.append("- 無")
    lines.extend([
        "",
        "## Required Commands",
        "",
    ])
    lines.extend(f"- `{item}`" for item in report["required_commands"])
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
