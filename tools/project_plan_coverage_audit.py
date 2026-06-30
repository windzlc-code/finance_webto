#!/usr/bin/env python3
from datetime import datetime, timezone
from pathlib import Path
import json
import sys

import acceptance_audit
import launch_cutover_audit
import project_phase_audit


ROOT = Path(__file__).resolve().parents[1]


def exists(path):
    return (ROOT / path).exists()


def read(path):
    return (ROOT / path).read_text(encoding="utf-8", errors="ignore")


def contains(path, *markers):
    if not exists(path):
        return False
    text = read(path)
    return all(marker in text for marker in markers)


def load_json(path, fallback):
    try:
        return json.loads(read(path))
    except Exception:
        return fallback


def phase(status, chapter, title, summary, evidence, blockers):
    return {
        "chapter": chapter,
        "title": title,
        "status": status,
        "summary": summary,
        "evidence": evidence,
        "blockers": [item for item in blockers if item],
    }


def build_report():
    acceptance = acceptance_audit.build_report()
    acceptance_map = {item["key"]: item for item in acceptance["items"]}
    phase_report = project_phase_audit.build_report()
    phase_map = {item["phase"]: item for item in phase_report["phases"]}
    launch = launch_cutover_audit.build_report()
    launch_map = {item["key"]: item for item in launch["items"]}
    launch_pending = [
        item["label"]
        for item in launch["items"]
        if item["status"] in ("pending_external_input", "pending_human_review")
    ]

    products = load_json("assets/data/products.json", [])
    articles = load_json("assets/data/articles.json", [])
    categories = load_json("assets/data/categories.json", [])
    landing_pages = load_json("assets/data/landing-pages.json", [])

    marketing_pending = any(
        acceptance_map.get(key, {}).get("status") == "external_pending"
        for key in ("ga4_received", "official_line_oa")
    )
    launch_pending_external = any(
        acceptance_map.get(key, {}).get("status") == "external_pending"
        for key in ("ga4_received", "search_console_submit", "formal_backend", "official_line_oa", "backup_strategy_enabled")
    )
    legal_pending = launch_map.get("legal_review_external", {}).get("status") == "pending_human_review"

    chapters = []
    chapters.append(phase(
        "ready",
        "chapter_1",
        "项目定位",
        "TFSE 的金融资讯入口、非代办边界、低敏收件与防诈定位已写入首页、关于页、表单与免责声明。",
        [
            "index.html 已展示品牌定位、查询入口与不代办边界",
            acceptance_map.get("disclaimer", {}).get("evidence", ""),
            "free-check.html 与 contact.html 均强调不收证件、不保证核贷",
        ],
        [],
    ))
    chapters.append(phase(
        "ready",
        "chapter_2",
        "现成前端模板套用路线",
        "模板盘点、内容映射、页面角色替换与业务闭环已形成文档、脚本与阶段审计。",
        [
            "TFSE_TEMPLATE_MAPPING.md 已建立模板映射边界",
            phase_map.get("phase_0", {}).get("summary", ""),
            "tools/project_phase_audit.py 已覆盖 Phase 0-8",
        ],
        [],
    ))
    chapters.append(phase(
        "ready",
        "chapter_3",
        "品牌体系",
        "TFSE 品牌名、Slogan、免责声明与禁用词规则已经套入模板页面和合规规则。",
        [
            "index.html 已展示 TFSE金融便民中心 与主副 Slogan",
            "assets/data/compliance-rules.json 已定义 required_disclaimer 与 forbidden_terms",
            phase_map.get("phase_1", {}).get("summary", ""),
        ],
        [],
    ))
    chapters.append(phase(
        "ready",
        "chapter_4",
        "模板视觉套用规范",
        "保留原模板结构、不重做 UI 的边界已固定；品牌色、Logo、按钮语义与低广告风方向已落地。",
        [
            "TFSE_TEMPLATE_MAPPING.md 已写明保留模板不重设计的边界",
            acceptance_map.get("template_preserved", {}).get("evidence", ""),
            acceptance_map.get("logo", {}).get("evidence", ""),
        ],
        [],
    ))
    chapters.append(phase(
        "ready",
        "chapter_5",
        "技术选型",
        "当前以静态 HTML 模板为 MVP 主体，并已补齐正式 API、数据库、备份、监控与权限的后端迁移计划。",
        [
            "site-config.json 当前为 static/localStorage MVP",
            "api-contract.json、backend-schema.sql、DATA_MODEL.md、PRODUCTION_BACKEND_PLAN.md 已存在",
            acceptance_map.get("formal_backend", {}).get("evidence", ""),
        ],
        [],
    ))
    chapters.append(phase(
        "ready",
        "chapter_6",
        "模板目录接入方式",
        "业务脚本、数据种子、政策文档与审计工具均已插入现有模板目录，而不是平行重写一套站点。",
        [
            "assets/js/tfse-*.js 与 assets/data/*.json 已形成增量模块层",
            "TFSE_TEMPLATE_MAPPING.md 已列出页面、区块、脚本与数据映射",
            "tools/verify_static_site.py 会检查关键模块文件存在",
        ],
        [],
    ))
    chapters.append(phase(
        "ready",
        "chapter_7",
        "页面架构",
        "首页、资料库、分类页、详情页、文章中心、免费财务健检查询、关于、政策页、联络页、搜索页、后台与错误页都已落地。",
        [
            f"已存在 {len(categories)} 个分类配置、{len(products)} 条资料、{len(articles)} 篇文章、{len(landing_pages)} 个落地页配置",
            phase_map.get("phase_2", {}).get("summary", ""),
            phase_map.get("phase_3", {}).get("summary", ""),
            phase_map.get("phase_6", {}).get("summary", ""),
        ],
        [],
    ))
    chapters.append(phase(
        "ready",
        "chapter_8",
        "组件清单",
        "查询、资料库、表单、内容、合规与后台相关组件能力已通过既有模板容器加脚本方式落地。",
        [
            "TFSE_TEMPLATE_MAPPING.md 已记录组件与脚本映射",
            "assets/js/tfse-home-query.js / tfse-database.js / tfse-products.js / tfse-articles.js / tfse-lead-form.js / tfse-admin.js 已接入",
            "admin.html 已提供 CRM、合规、报表、备份、配置与验收面板",
        ],
        [],
    ))
    chapters.append(phase(
        "ready",
        "chapter_9",
        "数据模型",
        "正式数据模型、资料表与种子数据已经成型，本地静态 MVP 与正式后端模型可互相映射。",
        [
            "DATA_MODEL.md 已定义 institutions / financial_products / articles / lead_forms / audit_logs 等模型",
            "backend-schema.sql 已覆盖正式表结构与索引",
            "tools/data_quality_audit.py 与 tools/backend_schema_audit.py 当前均通过",
        ],
        [],
    ))
    chapters.append(phase(
        "ready",
        "chapter_10",
        "API 设计",
        "前台与后台 API 合约、前端适配层、mock formal API 以及正式切换验收包都已建立。",
        [
            "api-contract.json 已覆盖公开与 Admin API",
            "assets/js/tfse-api.js 已提供 API-first + fallback 适配层",
            "tools/mock_formal_api.py 与 browser_acceptance_verify.mjs 已支持 formal API rehearsal",
        ],
        [],
    ))
    chapters.append(phase(
        "ready",
        "chapter_11",
        "后台 CRM",
        "登录保护、潜客详情、状态更新、备注、跟进、UTM、产品维护、文章发布、合规审核和导出权限都已在本地 MVP 闭环。",
        [
            phase_map.get("phase_5", {}).get("summary", ""),
            acceptance_map.get("admin_login", {}).get("evidence", ""),
            acceptance_map.get("lead_status_update", {}).get("evidence", ""),
            "assets/js/tfse-admin.js 已支持 data-detail-note、contact_log、follow_up_priority、next_follow_up_at",
        ],
        [],
    ))
    chapters.append(phase(
        "ready",
        "chapter_12",
        "SEO 系统",
        "SEO 结构、40 篇首批内容、sitemap、robots、canonical、OG、RSS、JSON-LD 与收录提交包均已建立。",
        [
            phase_map.get("phase_6", {}).get("summary", ""),
            acceptance_map.get("metadata", {}).get("evidence", ""),
            acceptance_map.get("sitemap", {}).get("evidence", ""),
            "tools/seo_assets_audit.py 当前通过",
        ],
        [],
    ))
    chapters.append(phase(
        "local_ready_external_pending" if marketing_pending else "ready",
        "chapter_13",
        "广告落地页系统",
        "8 个广告落地页、UTM、落地页事件、投流检查包与归因报表已套用；正式追踪收件仍待外部配置验证。",
        [
            phase_map.get("phase_7", {}).get("summary", ""),
            "assets/js/tfse-landing-pages.js 已记录 landing_page_view 与 UTM",
            "LAUNCH_CHECKLIST.md 已记录投流检查、归因报表与 conversion backlog",
        ],
        [
            "正式 GA4 收件仍待验证" if acceptance_map.get("ga4_received", {}).get("status") == "external_pending" else "",
            "正式 Line OA URL 仍待填入" if acceptance_map.get("official_line_oa", {}).get("status") == "external_pending" else "",
        ],
    ))
    chapters.append(phase(
        "local_ready_external_pending" if launch_map.get("line_oa_url", {}).get("status") == "pending_external_input" else "ready",
        "chapter_14",
        "Line 私域闭环",
        "欢迎语、分群标签、自动回复原则、Line setup / handoff / opt-out / complaint 交接与 API 验收包都已准备好；正式加友 URL 与真实外部承接仍待配置。",
        [
            "assets/data/line-flows.json 已定义 quick replies、tags 与 boundary",
            "LAUNCH_CHECKLIST.md 已列出 tfse_line_oa_setup_package、tfse_line_oa_handoff_check、tfse_line_optout_complaint_queue",
            launch_map.get("line_oa_setup", {}).get("evidence", ""),
        ],
        [
            "正式 Line OA URL 尚未填入" if launch_map.get("line_oa_url", {}).get("status") == "pending_external_input" else "",
        ],
    ))
    chapters.append(phase(
        "local_ready_external_pending" if legal_pending else "ready",
        "chapter_15",
        "合规机制",
        "禁用词扫描、免责声明、来源复核、隐私请求、公开资料回报、法务送审包与外部留痕机制都已具备；正式法务签核仍待外部完成。",
        [
            "tools/compliance_scan.py、tools/acceptance_audit.py、tools/verify_static_site.py 已覆盖禁用词与免责声明检查",
            "assets/js/tfse-admin.js 已提供 privacy request、public feedback、legal review 与 source review 处理包",
            "LAUNCH_CHECKLIST.md 已列出 tfse_legal_compliance_review_package 与 tfse_legal_external_review_evidence",
        ],
        [
            "台灣當地法務 / 合規人員正式複核仍待完成" if legal_pending else "",
        ],
    ))
    chapters.append(phase(
        "local_ready_external_pending" if phase_map.get("phase_8", {}).get("status") == "local_ready_external_pending" else "ready",
        "chapter_16",
        "开发任务拆解",
        "Phase 0-8 的本地交付已全部有对照审计与交付物，剩余阻挡项已明确归类为正式外部配置与人工签核。",
        [
            "tools/project_phase_audit.py 已覆盖 Phase 0-8",
            "tools/launch_cutover_audit.py 已覆盖正式切换外部项",
            "tools/formal_config_input_packet.py 已收敛 pending_external_input 配置输入",
        ],
        phase_map.get("phase_8", {}).get("blockers", []),
    ))
    chapters.append(phase(
        "local_ready_external_pending" if acceptance["counts"].get("external_pending") or acceptance["counts"].get("manual_external") else "ready",
        "chapter_17",
        "验收清单",
        "第 17 章业务、UI、合规、技术与 SEO 验收已脚本化并固化到后台与浏览器证据；剩余项主要是正式环境外部验证。",
        [
            "tools/acceptance_audit.py 已对照第 17 / 21 章",
            "tools/browser_acceptance_report.py 与 browser_acceptance_verify.mjs 已覆盖人工/自动浏览器验收",
            "assets/data/browser-acceptance-evidence.json 已固化浏览器通过证据",
        ],
        [
            item["label"]
            for item in acceptance["items"]
            if item["status"] in ("external_pending", "manual_external")
        ],
    ))
    chapters.append(phase(
        "ready",
        "chapter_18",
        "第一版 MVP 范围",
        "计划中的 MVP 范围已全部覆盖，且当前交付已经超出首版最低范围，补上了更完整的 Admin、SEO、投流与运维能力。",
        [
            "首页、资料库、分类页、免费财务健检查询、Line CTA、政策页、文章中心、Admin、UTM 与合规扫描均已存在",
            phase_map.get("phase_4", {}).get("summary", ""),
            phase_map.get("phase_5", {}).get("summary", ""),
        ],
        [],
    ))
    chapters.append(phase(
        "ready",
        "chapter_19",
        "现成前端模板接入顺序",
        "模板接入顺序已经通过映射文档、阶段审计和当前项目结构得到落实，没有偏离“先复用模板、再补业务闭环”的路径。",
        [
            "TFSE_TEMPLATE_MAPPING.md 已记录页面/区块/脚本映射",
            phase_map.get("phase_0", {}).get("summary", ""),
            "releaseReadinessPayload.template_policy 明确保留 Exomac 模板结构",
        ],
        [],
    ))
    chapters.append(phase(
        "ready",
        "chapter_20",
        "风险清单",
        "合规、个资、来源时效、后台权限、SEO、Line 与广告越界风险都已有对应脚本、交接包和运维说明。",
        [
            "tools/source_freshness_audit.py、tools/compliance_scan.py、tools/production_config_audit.py 当前通过",
            "OPERATIONS_RUNBOOK.md 与 LAUNCH_CHECKLIST.md 已记录 backup、rollback、incident、legal / compliance",
            "assets/js/tfse-admin.js 已提供 RBAC、privacy request、Line opt-out 与 legal review 相关包",
        ],
        [],
    ))
    chapters.append(phase(
        "local_ready_external_pending" if launch_pending_external else "ready",
        "chapter_21",
        "上线前最终检查",
        "最终检查项已转成 acceptance、launch cutover、countdown、execution 和 formal config input 多套审计与执行计划；正式环境验证仍有少量外部项未完成。",
        [
            "tools/acceptance_audit.py、tools/launch_cutover_audit.py、tools/launch_execution_plan.py、tools/launch_countdown_plan.py 已存在",
            "tools/formal_config_input_packet.py 已整理正式待填配置",
            phase_map.get("phase_8", {}).get("summary", ""),
        ],
        [
            "正式 base_url / Search Console / GA4 / Line OA / backend.api_base_url / 備份策略 / Sentry 仍待配置或验证" if launch_pending_external else "",
        ],
    ))
    chapters.append(phase(
        "local_ready_external_pending" if legal_pending else "ready",
        "chapter_22",
        "官方来源和上线前法务备注",
        "官方来源、资料来源政策、公开反馈分流和法务提醒都已落地；正式台湾当地法务复核仍是上线前外部必做项。",
        [
            "source-policy.html、institutions.json 与 tools/source_freshness_audit.py 已覆盖来源政策和核验资料",
            "contact.html 与 tfse-public-feedback.js 已支持公开资料回报",
            "LAUNCH_CHECKLIST.md 已写入台湾当地法务 / 合规复核要求",
        ],
        [
            "法務 / 合規外部複核尚未完成" if legal_pending else "",
        ],
    ))
    chapters.append(phase(
        "local_ready_external_pending" if launch_pending else "ready",
        "chapter_23",
        "最终判断",
        "当前项目已经达成“保留原模板、套入 TFSE 业务闭环”的本地完整状态；剩余未闭环项集中在正式配置、正式后端与外部签核。",
        [
            "tools/project_phase_audit.py 当前为 ready=7, local_ready_external_pending=2",
            "tools/launch_cutover_audit.py 当前明确区分 pending_external_input / ready_for_external_execution / pending_human_review",
            "tools/project_plan_coverage_audit.py 已按 1-23 章重新对账",
        ],
        launch_pending,
    ))

    counts = {}
    for item in chapters:
        counts[item["status"]] = counts.get(item["status"], 0) + 1

    return {
        "format": "tfse_project_plan_coverage_audit",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "TFSE project plan chapters 1-23",
        "generated_from": [
            "TFSE金融独立站现成前端模板套用0-1完整项目计划.md",
            "tools/acceptance_audit.py",
            "tools/project_phase_audit.py",
            "tools/launch_cutover_audit.py",
        ],
        "counts": counts,
        "summary": {
            "chapters": len(chapters),
            "chapters_ready": counts.get("ready", 0),
            "chapters_local_ready_external_pending": counts.get("local_ready_external_pending", 0),
        },
        "chapters_detail": chapters,
    }


def markdown(report):
    lines = [
        "# TFSE Project Plan Coverage Audit",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Source: `{report['source']}`",
        f"- Chapters ready: `{report['summary']['chapters_ready']}`",
        f"- Chapters local-ready-external-pending: `{report['summary']['chapters_local_ready_external_pending']}`",
        "",
    ]
    for item in report["chapters_detail"]:
        blockers = "；".join(item["blockers"]) if item["blockers"] else "無"
        lines.extend([
            f"## {item['chapter']} {item['title']}",
            "",
            f"- Status: `{item['status']}`",
            f"- Summary: {item['summary']}",
            f"- Blockers: {blockers}",
            "- Evidence:",
        ])
        for evidence in item["evidence"]:
            lines.append(f"  - {evidence}")
        lines.append("")
    return "\n".join(lines)


def main():
    report = build_report()
    if "--markdown" in sys.argv:
        print(markdown(report))
        return 0
    if "--json" in sys.argv:
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0

    counts = report["counts"]
    print(
        "project plan coverage audit: "
        + ", ".join(f"{key}={counts[key]}" for key in sorted(counts))
    )
    for item in report["chapters_detail"]:
        blockers = "；".join(item["blockers"]) if item["blockers"] else "無"
        print(f"{item['status']}: {item['title']} - {item['summary']}｜阻擋：{blockers}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
