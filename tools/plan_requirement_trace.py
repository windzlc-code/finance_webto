#!/usr/bin/env python3
from pathlib import Path
import json
import sys

import acceptance_audit


ROOT = Path(__file__).resolve().parents[1]
PLAN_PATH = ROOT / "TFSE金融独立站现成前端模板套用0-1完整项目计划.md"


def exists(path):
    return (ROOT / path).exists()


def read_text(path):
    return (ROOT / path).read_text(encoding="utf-8", errors="ignore")


def page_has_metadata(path):
    parser = acceptance_audit.parse_page(ROOT / path)
    return bool(parser.title.strip()) and bool(parser.meta.get("description"))


def files_have_metadata(paths):
    checked = []
    missing = []
    for path in paths:
        checked.append(path)
        if not exists(path) or not page_has_metadata(path):
            missing.append(path)
    return checked, missing


def glob_paths(pattern):
    return sorted(path.relative_to(ROOT).as_posix() for path in ROOT.glob(pattern))


def ready_item(section, requirement, evidence, source_key=None):
    return {
        "section": section,
        "requirement": requirement,
        "status": "ready",
        "evidence": evidence,
        "source_key": source_key or "",
    }


def status_item(section, requirement, status, evidence, source_key=None):
    return {
        "section": section,
        "requirement": requirement,
        "status": status,
        "evidence": evidence,
        "source_key": source_key or "",
    }


def custom_color_check():
    css_ok = acceptance_audit.contains("assets/css/style.css", "#1292ee", "#030f27")
    pages_ok = acceptance_audit.contains("index.html", 'theme-color" content="#1292ee"') and acceptance_audit.contains("about.html", 'theme-color" content="#1292ee"')
    if css_ok and pages_ok:
        return status_item("17.2 UI 验收", "颜色符合蓝绿金融和米白底。", "ready", "assets/css/style.css 已固定主色 #1292ee、深色 #030f27，核心页面同步 theme-color。", "custom_color_tokens")
    return status_item("17.2 UI 验收", "颜色符合蓝绿金融和米白底。", "missing", "品牌色 token 或核心页面 theme-color 证据不足。", "custom_color_tokens")


def custom_policy_page(path, label):
    if exists(path):
        return ready_item("21. 上线前最终检查", label, f"{path} 可访问。", path)
    return status_item("21. 上线前最终检查", label, "missing", f"{path} 缺失。", path)


def custom_subset_metadata(section, requirement, paths, source_key):
    checked, missing = files_have_metadata(paths)
    if not missing:
        return ready_item(section, requirement, f"已核对 {len(checked)} 个相关页面均有 title 与 description。", source_key)
    return status_item(section, requirement, "missing", "缺 metadata：" + "、".join(missing[:8]), source_key)


def build_report():
    acceptance = acceptance_audit.build_report()
    acceptance_map = {item["key"]: item for item in acceptance["items"]}

    category_pages = ["category.html"] + [path for path in glob_paths("*.html") if path in {
        "mortgage.html",
        "credit-loan.html",
        "vehicle-finance.html",
        "installment.html",
        "credit-union.html",
        "debt-law.html",
        "insurance-finance.html",
        "anti-fraud.html",
    }]
    article_pages = ["articles.html", "blog-details.html"] + glob_paths("articles/*.html")
    product_pages = ["work-details.html"] + glob_paths("products/*.html")

    requirements = [
        ("17.1 业务闭环", "用户能从首页进入资料库。", "home_to_database"),
        ("17.1 业务闭环", "用户能从分类页进入资料详情。", "category_to_detail"),
        ("17.1 业务闭环", "用户能从文章页进入免费财务健检查询。", "article_to_free_check"),
        ("17.1 业务闭环", "表单提交后后台可见。", "lead_visible_in_admin"),
        ("17.1 业务闭环", "表单记录 UTM。", "utm_recorded"),
        ("17.1 业务闭环", "提交成功后可导向 Line。", "line_cta"),
        ("17.1 业务闭环", "后台可更新潜客状态。", "lead_status_update"),
        ("17.1 业务闭环", "管理员可维护资料库。", "product_maintenance"),
        ("17.1 业务闭环", "管理员可发布文章。", "article_publish"),
        ("17.1 业务闭环", "合规审核可记录。", "compliance_review"),
        ("17.2 UI 验收", "Logo 清晰。", "logo"),
        ("17.2 UI 验收", "页面没有贷款广告风。", "template_preserved"),
        ("17.2 UI 验收", "按钮文案合规。", "button_copy"),
        ("17.2 UI 验收", "手机端导航清楚。", "mobile_navigation"),
        ("17.2 UI 验收", "表单错误提示清楚。", "form_feedback"),
        ("17.2 UI 验收", "空数据状态清楚。", "empty_state"),
        ("17.2 UI 验收", "页面不出现文字重叠。", "no_text_overlap"),
        ("17.3 合规验收", "全站无禁用词。", "forbidden_terms"),
        ("17.3 合规验收", "每页有免责声明。", "disclaimer"),
        ("17.3 合规验收", "表单有隐私同意。", "privacy_line_consent"),
        ("17.3 合规验收", "Line 同意独立勾选。", "privacy_line_consent"),
        ("17.3 合规验收", "不收证件。", "no_sensitive_docs"),
        ("17.3 合规验收", "不承诺核贷。", "no_loan_guarantee"),
        ("17.3 合规验收", "产品资料有来源。", "product_sources"),
        ("17.3 合规验收", "产品资料有更新时间。", "product_updated_at"),
        ("17.3 合规验收", "广告页无夸大承诺。", "ad_lp_compliance"),
        ("17.4 技术验收", "`npm run build` 通过。", "npm_build"),
        ("17.4 技术验收", "`npm run lint` 通过。", "npm_lint"),
        ("17.4 技术验收", "关键页面 200。", "key_pages"),
        ("17.4 技术验收", "404 正常。", "not_found"),
        ("17.4 技术验收", "表单 API 有限流。", "rate_limit"),
        ("17.4 技术验收", "后台需要登录。", "admin_login"),
        ("17.4 技术验收", "导出有权限。", "export_permissions"),
        ("17.4 技术验收", "错误上报可用。", "error_reporting"),
        ("17.4 技术验收", "数据库备份可用。", "backup"),
        ("17.5 SEO 验收", "sitemap。", "sitemap"),
        ("17.5 SEO 验收", "robots。", "robots"),
        ("17.5 SEO 验收", "canonical。", "canonical"),
        ("17.5 SEO 验收", "Open Graph。", "open_graph"),
        ("17.5 SEO 验收", "图片 alt。", "image_alt"),
        ("17.5 SEO 验收", "内链。", "internal_links"),
        ("21. 上线前最终检查", "所有页面都有标题和描述。", "metadata"),
        ("21. 上线前最终检查", "所有页面都有免责声明或页脚免责声明。", "disclaimer"),
        ("21. 上线前最终检查", "免费财务健检查询表单不收证件。", "no_sensitive_docs"),
        ("21. 上线前最终检查", "所有 CTA 没有“代办、包过、保证核贷”。", "no_loan_guarantee"),
        ("21. 上线前最终检查", "所有产品资料有来源链接。", "product_sources"),
        ("21. 上线前最终检查", "所有文章有更新日期。", "article_updated_at"),
        ("21. 上线前最终检查", "表单提交测试通过。", "form_submit_browser"),
        ("21. 上线前最终检查", "后台登录测试通过。", "admin_login_browser"),
        ("21. 上线前最终检查", "手机端测试通过。", "mobile_browser"),
        ("21. 上线前最终检查", "sitemap 可访问。", "sitemap"),
        ("21. 上线前最终检查", "robots 可访问。", "robots"),
        ("21. 上线前最终检查", "GA4 事件可收到。", "ga4_received"),
        ("21. 上线前最终检查", "Search Console 已准备提交。", "search_console_submit"),
        ("21. 上线前最终检查", "备份策略已启用。", "backup_strategy_enabled"),
    ]

    items = []
    for section, requirement, key in requirements:
        record = acceptance_map.get(key)
        if not record:
            items.append(status_item(section, requirement, "missing", f"未找到 acceptance key: {key}", key))
            continue
        items.append(status_item(section, requirement, record["status"], record["evidence"], key))

    items.insert(11, custom_color_check())
    items.append(custom_subset_metadata("17.5 SEO 验收", "首页 metadata。", ["index.html"], "custom_home_metadata"))
    items.append(custom_subset_metadata("17.5 SEO 验收", "分类页 metadata。", category_pages, "custom_category_metadata"))
    items.append(custom_subset_metadata("17.5 SEO 验收", "文章页 metadata。", article_pages, "custom_article_metadata"))
    items.append(custom_subset_metadata("17.5 SEO 验收", "产品页 metadata。", product_pages, "custom_product_metadata"))
    items.append(custom_policy_page("privacy.html", "隐私权政策可访问。"))
    items.append(custom_policy_page("terms.html", "使用条款可访问。"))
    items.append(custom_policy_page("source-policy.html", "资料来源政策可访问。"))

    section_order = {
        "17.1 业务闭环": 1,
        "17.2 UI 验收": 2,
        "17.3 合规验收": 3,
        "17.4 技术验收": 4,
        "17.5 SEO 验收": 5,
        "21. 上线前最终检查": 6,
    }
    items.sort(key=lambda item: (section_order.get(item["section"], 99), item["requirement"]))

    counts = {}
    for item in items:
        counts[item["status"]] = counts.get(item["status"], 0) + 1

    return {
        "format": "tfse_plan_requirement_trace",
        "generated_at": acceptance.get("generated_at", "") if isinstance(acceptance, dict) else "",
        "plan_path": PLAN_PATH.name,
        "source": "TFSE project plan sections 17 and 21",
        "counts": counts,
        "items": items,
    }


def markdown(report):
    lines = [
        "# TFSE Plan Requirement Trace",
        "",
        f"- Plan source: `{report['plan_path']}`",
        f"- Ready: `{report['counts'].get('ready', 0)}`",
        f"- External pending: `{report['counts'].get('external_pending', 0)}`",
        f"- Manual external: `{report['counts'].get('manual_external', 0)}`",
        f"- Manual browser: `{report['counts'].get('manual_browser', 0)}`",
        f"- Not applicable: `{report['counts'].get('not_applicable', 0)}`",
        f"- Missing: `{report['counts'].get('missing', 0)}`",
        "",
    ]

    current_section = None
    for item in report["items"]:
        if item["section"] != current_section:
            current_section = item["section"]
            lines.extend([f"## {current_section}", ""])
        lines.extend([
            f"- `{item['status']}` / {item['requirement']}",
            f"  - Evidence: {item['evidence']}",
        ])
        if item.get("source_key"):
            lines.append(f"  - Source key: `{item['source_key']}`")
    return "\n".join(lines)


def main():
    report = build_report()
    if "--markdown" in sys.argv:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if not report["counts"].get("missing") else 1


if __name__ == "__main__":
    sys.exit(main())
