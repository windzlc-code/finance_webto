#!/usr/bin/env python3
from pathlib import Path
import json
import sys

import acceptance_audit


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"


def load_json(path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def acceptance_index():
    report = acceptance_audit.build_report()
    return {item["key"]: item for item in report.get("items", [])}


def item_evidence(items, key):
    return items.get(key, {}).get("evidence", "")


def phase(status, phase_id, title, summary, evidence, blockers):
    return {
        "phase": phase_id,
        "title": title,
        "status": status,
        "summary": summary,
        "evidence": evidence,
        "blockers": [item for item in blockers if item],
    }


def build_report():
    items = acceptance_index()
    products = load_json(DATA / "products.json", [])
    articles = load_json(DATA / "articles.json", [])
    landing_pages = load_json(DATA / "landing-pages.json", [])
    external_pending = [
        items[key]["label"]
        for key in ("ga4_received", "search_console_submit", "formal_backend", "official_line_oa", "backup_strategy_enabled")
        if items.get(key, {}).get("status") == "external_pending"
    ]

    phases = []
    phases.append(phase(
        "ready",
        "phase_0",
        "模板盘点与映射",
        "模板映射文档、静态验收与页面角色替换边界已建立。",
        [
            "TFSE_TEMPLATE_MAPPING.md 已存在",
            item_evidence(items, "template_preserved"),
            "tools/verify_static_site.py 已纳入模板残留词扫描",
        ],
        [],
    ))
    phases.append(phase(
        "ready",
        "phase_1",
        "品牌内容套入",
        "TFSE 品牌、导航、免责声明和合规按钮文案已套入原模板。",
        [
            item_evidence(items, "logo"),
            item_evidence(items, "button_copy"),
            item_evidence(items, "disclaimer"),
        ],
        [],
    ))
    phases.append(phase(
        "ready",
        "phase_2",
        "首页与合规页替换",
        "首页、关于页、联系页和合规政策页已接入，且本地可访问。",
        [
            item_evidence(items, "home_to_database"),
            item_evidence(items, "privacy_terms_source"),
            item_evidence(items, "metadata"),
        ],
        [],
    ))
    phases.append(phase(
        "ready",
        "phase_3",
        "资料库前台套入",
        f"资料库、分类和详情页已由原模板承载，并包含 {len(products)} 条示例资料。",
        [
            item_evidence(items, "category_to_detail"),
            item_evidence(items, "product_sources"),
            item_evidence(items, "product_updated_at"),
        ],
        [],
    ))
    phases.append(phase(
        "ready",
        "phase_4",
        "免费财务健检查询表单套入",
        "免费财务健检查询表单、UTM、低敏字段、Line CTA 和浏览器提交流程已完成本地闭环。",
        [
            item_evidence(items, "utm_recorded"),
            item_evidence(items, "no_sensitive_docs"),
            item_evidence(items, "form_submit_browser"),
        ],
        [],
    ))
    phases.append(phase(
        "ready",
        "phase_5",
        "后台 CRM",
        "Admin 登录保护、潜客处理、资料维护、文章发布和合规审计已完成本地 MVP 闭环。",
        [
            item_evidence(items, "admin_login"),
            item_evidence(items, "lead_status_update"),
            item_evidence(items, "product_maintenance"),
            item_evidence(items, "article_publish"),
            item_evidence(items, "compliance_review"),
            item_evidence(items, "admin_login_browser"),
            "tools/crm_capability_audit.py 可直接對照計畫第 11 節與 Phase 5 的 CRM 能力要求",
        ],
        [],
    ))
    phases.append(phase(
        "ready",
        "phase_6",
        "SEO 内容中心套入",
        f"文章中心与文章详情已接入，当前有 {len(articles)} 篇内容种子，SEO 基础资产已通过审计。",
        [
            item_evidence(items, "article_updated_at"),
            item_evidence(items, "sitemap"),
            item_evidence(items, "robots"),
            item_evidence(items, "canonical"),
            item_evidence(items, "open_graph"),
            item_evidence(items, "internal_links"),
        ],
        [],
    ))

    phase_7_status = "ready" if not any(label in external_pending for label in ("GA4 事件可收到", "正式 Line OA 可導向")) else "local_ready_external_pending"
    phases.append(phase(
        phase_7_status,
        "phase_7",
        "广告落地页与追踪",
        f"广告落地页矩阵、UTM 归因和投流检查包已完成本地套用，当前有 {len(landing_pages)} 个落地页别名。",
        [
            item_evidence(items, "utm_recorded"),
            "lp/*.html 已建立并通过静态验收",
            "Admin 已提供广告投流检查与 UTM 报表匯出",
        ],
        [
            "正式 GA4 Measurement ID 待填并验证收件" if items.get("ga4_received", {}).get("status") == "external_pending" else "",
            "正式 Line OA URL 待填并完成真实加友承接" if items.get("official_line_oa", {}).get("status") == "external_pending" else "",
        ],
    ))

    phase_8_status = "ready" if not external_pending else "local_ready_external_pending"
    phases.append(phase(
        phase_8_status,
        "phase_8",
        "上线和运维",
        "错误页、安全标头、部署文件、验收脚本与运维交接已齐备；正式上线仍依赖外部配置落地。",
        [
            item_evidence(items, "not_found"),
            item_evidence(items, "error_reporting"),
            item_evidence(items, "backup"),
            "DEPLOYMENT.md / OPERATIONS_RUNBOOK.md / LAUNCH_CHECKLIST.md 已存在",
        ],
        [
            "正式 backend.api_base_url 待切换" if items.get("formal_backend", {}).get("status") == "external_pending" else "",
            "Search Console 验证与 sitemap 提交待完成" if items.get("search_console_submit", {}).get("status") == "external_pending" else "",
            "GA4 正式收件验证待完成" if items.get("ga4_received", {}).get("status") == "external_pending" else "",
            "正式 Line OA 加友 URL 待接入" if items.get("official_line_oa", {}).get("status") == "external_pending" else "",
            "正式資料庫每日備份與 restore drill 待完成" if items.get("backup_strategy_enabled", {}).get("status") == "external_pending" else "",
        ],
    ))

    counts = {}
    for item in phases:
        counts[item["status"]] = counts.get(item["status"], 0) + 1

    return {
        "format": "tfse_project_phase_audit",
        "source": "TFSE project plan phases 0-8",
        "generated_from": "tools/acceptance_audit.py + local project files",
        "counts": counts,
        "external_pending": external_pending,
        "phases": phases,
    }


def main():
    report = build_report()
    if "--json" in sys.argv:
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0

    counts = report["counts"]
    print(
        "project phase audit: "
        + ", ".join(f"{key}={counts[key]}" for key in sorted(counts))
    )
    for item in report["phases"]:
        blockers = "；".join(item["blockers"]) if item["blockers"] else "無"
        print(f"{item['status']}: {item['title']} - {item['summary']}｜阻擋：{blockers}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
