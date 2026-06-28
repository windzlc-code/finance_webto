#!/usr/bin/env python3
from datetime import datetime, timezone
from pathlib import Path
import json
import sys

import acceptance_audit


ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8", errors="ignore")


def exists(path):
    return (ROOT / path).exists()


def contains(path, *markers):
    if not exists(path):
        return False
    text = read(path)
    return all(marker in text for marker in markers)


def acceptance_index():
    report = acceptance_audit.build_report()
    return {item["key"]: item for item in report.get("items", [])}


def acceptance_evidence(index, key):
    return index.get(key, {}).get("evidence", "")


def feature(key, label, status, evidence, related_exports):
    return {
        "key": key,
        "label": label,
        "status": status,
        "evidence": evidence,
        "related_exports": related_exports,
    }


def build_report():
    acceptance = acceptance_index()

    features = [
        feature(
            "admin_login",
            "登入保護",
            "ready" if acceptance.get("admin_login", {}).get("status") == "ready" else "missing",
            acceptance_evidence(acceptance, "admin_login") or "admin.html 提供 data-admin-auth、本機密碼與角色選單。",
            ["tfse_admin_auth_cutover_check", "tfse_admin_security_matrix"],
        ),
        feature(
            "lead_list",
            "查看潛客列表",
            "ready" if contains("admin.html", "data-admin-leads") and contains("assets/js/tfse-admin.js", "renderList()", "data-admin-leads") else "missing",
            "admin.html 已提供 data-admin-leads 表格；tfse-admin.js renderList 會渲染潛客清單。",
            ["tfse_crm_follow_up_queue", "tfse_crm_api_persistence_package"],
        ),
        feature(
            "search_name_phone",
            "搜尋手機 / 稱呼 / Line ID / 需求",
            "ready" if contains("admin.html", "data-admin-search") and contains("assets/js/tfse-admin.js", "data-admin-search", "line_id", "needs") else "missing",
            "Admin 搜尋框可按稱呼、手機、Line ID 與需求關鍵字搜尋。",
            ["tfse_crm_api_persistence_package"],
        ),
        feature(
            "need_filter",
            "按需求標籤篩選",
            "ready" if contains("admin.html", "data-admin-tag") and contains("assets/js/tfse-admin.js", "data-admin-tag", "need_credit_loan") else "missing",
            "Admin 提供 need_mortgage / need_credit_loan / need_vehicle / need_debt_law / need_credit_union 篩選。",
            ["tfse_crm_follow_up_queue"],
        ),
        feature(
            "source_filter",
            "按來源篩選",
            "ready" if contains("admin.html", "data-admin-source") and contains("assets/js/tfse-admin.js", "data-admin-source", "utm_source", "source_channel") else "missing",
            "Admin 提供來源篩選，並可依 utm_source / source_channel 聚合線索。",
            ["tfse_utm_attribution_report", "tfse_crm_api_persistence_package"],
        ),
        feature(
            "lead_detail",
            "查看潛客詳情",
            "ready" if contains("assets/js/tfse-admin.js", "請從左側列表選擇一筆紀錄", "Line ID：", "同意版本：") else "missing",
            "潛客詳情面板可查看身份、收入型態、同意版本、刪除請求、標籤與最近聯繫。",
            ["tfse_privacy_request_queue", "tfse_crm_contact_log"],
        ),
        feature(
            "status_update",
            "更新狀態與負責人",
            "ready" if acceptance.get("lead_status_update", {}).get("status") == "ready" and contains("assets/js/tfse-admin.js", "data-detail-status", "data-detail-assignee", "lead_follow_up_update") else "missing",
            acceptance_evidence(acceptance, "lead_status_update") or "潛客詳情可更新狀態、負責角色與優先級，並寫入審計。",
            ["tfse_crm_follow_up_queue", "tfse_crm_api_persistence_package"],
        ),
        feature(
            "notes_contact_log",
            "備註與結構化聯繫紀錄",
            "ready" if contains("assets/js/tfse-admin.js", "data-detail-note", "contactLogPayload", "lead_contact_logs") else "missing",
            "Admin 可新增備註與聯繫紀錄，並可匯出 tfse_crm_contact_log 供正式 CRM 落庫。",
            ["tfse_crm_contact_log", "tfse_crm_api_persistence_package"],
        ),
        feature(
            "source_page_utm",
            "查看來源頁與 UTM",
            "ready" if contains("assets/js/tfse-admin.js", "來源：", "UTM：", "utm_source", "utm_medium", "utm_campaign") else "missing",
            "潛客詳情會顯示 source_url 與完整 UTM 組合。",
            ["tfse_utm_attribution_report", "tfse_crm_api_persistence_package"],
        ),
        feature(
            "export_permissions",
            "匯出受權限控制",
            "ready" if acceptance.get("export_permissions", {}).get("status") == "ready" and contains("assets/js/tfse-admin.js", "permissionMatrix()", "_export_denied") else "missing",
            acceptance_evidence(acceptance, "export_permissions") or "匯出動作受 permissionMatrix 控制，拒絕時會寫入 denied audit。",
            ["tfse_admin_security_matrix", "tfse_crm_api_persistence_package"],
        ),
        feature(
            "product_management",
            "產品資料管理",
            "ready" if acceptance.get("product_maintenance", {}).get("status") == "ready" and contains("assets/js/tfse-admin.js", "saveProductOverride", "data-product-edit", "data-product-save") else "missing",
            acceptance_evidence(acceptance, "product_maintenance") or "Admin 可編輯產品標題、摘要、來源標題與來源網址。",
            ["tfse_content_version_snapshot", "tfse_source_review_queue"],
        ),
        feature(
            "article_management",
            "文章管理與發布",
            "ready" if acceptance.get("article_publish", {}).get("status") == "ready" and contains("assets/js/tfse-admin.js", "saveArticleOverride", "review_article") else "missing",
            acceptance_evidence(acceptance, "article_publish") or "Admin 支援文章送審、核准發布與退回。",
            ["tfse_content_version_snapshot"],
        ),
        feature(
            "compliance_review",
            "合規審核",
            "ready" if acceptance.get("compliance_review", {}).get("status") == "ready" and contains("admin.html", "data-review-save") else "missing",
            acceptance_evidence(acceptance, "compliance_review") or "Admin 提供文案掃描、審核結果與留痕保存。",
            ["tfse_legal_compliance_review_package", "tfse_compliance_api_persistence_package"],
        ),
        feature(
            "audit_logs",
            "審計日誌",
            "ready" if contains("assets/js/tfse-admin.js", "function renderAudit()", "addAudit(", "tfse_admin_audit") else "missing",
            "後台匯出、狀態更新、備份、驗收與審核動作都會寫入本機審計日誌。",
            ["tfse_crm_api_persistence_package", "tfse_admin_security_matrix"],
        ),
        feature(
            "formal_api_followup",
            "正式 API / 跨瀏覽器 CRM 持久化",
            "external_pending" if acceptance.get("formal_backend", {}).get("status") == "external_pending" else "ready",
            acceptance_evidence(acceptance, "formal_backend") or "本機 mock formal API rehearsal 已覆蓋內容 API、表單、Admin Auth 與 CRM；正式環境仍待切換。",
            ["tfse_crm_api_persistence_package", "tfse_backend_cutover_roadmap", "tfse_backend_acceptance_matrix"],
        ),
    ]

    roles = [
        {"role": "super_admin", "label": "Super Admin", "scope": "全部"},
        {"role": "content_editor", "label": "Content Editor", "scope": "文章和 FAQ"},
        {"role": "data_manager", "label": "Data Manager", "scope": "金融資料庫"},
        {"role": "compliance_reviewer", "label": "Compliance Reviewer", "scope": "審核內容和廣告"},
        {"role": "consultant", "label": "Consultant", "scope": "潛客查看和備註，不可刪除"},
        {"role": "viewer", "label": "Viewer", "scope": "只讀報表"},
    ]

    lead_statuses = [
        {"key": "new", "meaning": "新提交"},
        {"key": "contacted", "meaning": "已聯繫"},
        {"key": "info_sent", "meaning": "已發送公開資訊或官方資源"},
        {"key": "consulted", "meaning": "已完成資訊說明或法令導引"},
        {"key": "unresponsive", "meaning": "無回應"},
        {"key": "spam", "meaning": "垃圾或重複"},
        {"key": "closed", "meaning": "結案"},
    ]

    status_counts = {}
    for item in features:
        status_counts[item["status"]] = status_counts.get(item["status"], 0) + 1

    return {
        "format": "tfse_crm_capability_audit",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "TFSE project plan section 11 + phase 5 + local admin implementation",
        "summary": {
            "feature_count": len(features),
            "ready_count": status_counts.get("ready", 0),
            "external_pending_count": status_counts.get("external_pending", 0),
            "missing_count": status_counts.get("missing", 0),
            "role_count": len(roles),
            "lead_status_count": len(lead_statuses),
        },
        "roles": roles,
        "lead_statuses": lead_statuses,
        "features": features,
        "related_exports": [
            "tfse_crm_follow_up_queue",
            "tfse_crm_contact_log",
            "tfse_crm_api_persistence_package",
            "tfse_admin_auth_cutover_check",
            "tfse_admin_security_matrix",
            "tfse_backend_cutover_roadmap",
            "tfse_project_phase_audit",
        ],
    }


def as_markdown(report):
    lines = [
        "# TFSE CRM Capability Audit",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Source: `{report['source']}`",
        f"- Ready: `{report['summary']['ready_count']}` / `{report['summary']['feature_count']}`",
        f"- External pending: `{report['summary']['external_pending_count']}`",
        f"- Missing: `{report['summary']['missing_count']}`",
        "",
        "## CRM Features",
        "",
    ]
    for item in report["features"]:
        exports = "、".join(item["related_exports"]) if item["related_exports"] else "無"
        lines.extend([
            f"- **{item['label']}**",
            f"  - Status: `{item['status']}`",
            f"  - Evidence: {item['evidence']}",
            f"  - Related exports: {exports}",
        ])
    lines.extend([
        "",
        "## Roles",
        "",
    ])
    for role in report["roles"]:
        lines.append(f"- `{role['role']}` / {role['scope']}")
    lines.extend([
        "",
        "## Lead Statuses",
        "",
    ])
    for status in report["lead_statuses"]:
        lines.append(f"- `{status['key']}` / {status['meaning']}")
    return "\n".join(lines)


def main():
    report = build_report()
    if "--markdown" in sys.argv:
        print(as_markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
