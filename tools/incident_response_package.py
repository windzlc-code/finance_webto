#!/usr/bin/env python3
import json
import sys

import operations_task_queue
import release_readiness_package
import release_tooling


def build_report():
    release = release_readiness_package.build_report()
    ops = operations_task_queue.build_report()
    high_priority = [
        task for task in ops["tasks"]
        if task["priority"] == "high" and task["status"] != "ready"
    ]
    return {
        "format": "tfse_incident_response_package",
        "generated_at": release_tooling.site_config_tooling.now_iso(),
        "source_mode": "static_mvp_with_formal_cutover_handoff",
        "severity_hint": "investigate" if release["blockers"] else "no_active_local_error",
        "privacy_note": "事故響應包只輸出錯誤來源、去識別訊息、時間與聚合任務，不輸出完整手機、Line ID 或表單補充說明。",
        "signals": {
            "local_error_count": 0,
            "event_count": 0,
            "release_blockers": len(release["blockers"]),
            "high_priority_operations_tasks": len(high_priority),
        },
        "top_error_sources": [],
        "recent_errors": [],
        "severity_triggers": {
            "p0": [
                "免費財務健檢查詢無法提交",
                "Admin 未授權可見",
                "正式個資外洩或疑似外洩",
                "全站不可用",
            ],
            "p1": [
                "主要資料庫或分類頁不可用",
                "Line OA 導流失效",
                "GA4 / Sentry / Server Event 全部中斷",
                "Search Console 發現大量索引錯誤",
            ],
        },
        "response_steps": [
            "先判定 P0/P1 與影響頁面，涉及個資、登入或錯誤導流時先停用入口或回滾。",
            "檢查 Sentry、Server Event、部署紀錄、API logs 與 tfse_errors。",
            "若靜態站不可用，回滾上一個可用部署版本並驗證 index.html、database.html、free-check.html、admin.html。",
            "正式 API 異常時停止寫入或切維護，不用 localStorage 覆蓋正式資料。",
            "修復後重跑審計與煙測，記錄原因、處置、回滾時間與復盤。",
        ],
        "verification_commands": [
            "python3 tools/compliance_scan.py",
            "python3 tools/validate_site_config.py",
            "python3 tools/verify_static_site.py",
            "NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs",
        ],
        "related_exports": [
            "tfse_release_readiness_package",
            "tfse_operations_task_queue",
            "tfse_server_event_replay_queue",
            "tfse_browser_acceptance_report",
            "tfse_local_backup",
            "tfse_owner_cutover_bundle",
            "tfse_release_day_runsheet",
            "tfse_launch_handoff_manifest",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE Incident Response Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Severity hint: `{report['severity_hint']}`",
        f"- Release blockers: `{report['signals']['release_blockers']}`",
        f"- High-priority operations tasks: `{report['signals']['high_priority_operations_tasks']}`",
        "",
        "## Severity Triggers",
        "",
        "### P0",
        "",
    ]
    lines.extend(f"- {item}" for item in report["severity_triggers"]["p0"])
    lines.extend([
        "",
        "### P1",
        "",
    ])
    lines.extend(f"- {item}" for item in report["severity_triggers"]["p1"])
    lines.extend([
        "",
        "## Response Steps",
        "",
    ])
    lines.extend(f"{index}. {item}" for index, item in enumerate(report["response_steps"], 1))
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
