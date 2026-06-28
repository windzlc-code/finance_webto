#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import urlparse
import argparse
import json
import sys

import production_config_readiness
import site_config_update_package
import site_config_tooling


def is_official_https_domain(value):
    if not site_config_tooling.is_https_url(value):
        return False
    host = urlparse(value).netloc.lower()
    return bool(host) and all(marker not in host for marker in ("127.0.0.1", "localhost", "github.io"))


def domain_status(site_config):
    base_url = str(site_config.get("base_url", "")).rstrip("/")
    search_console = site_config.get("search_console", {})
    canonical_pages = site_config.get("canonical_pages", [])
    blockers = [
        "" if is_official_https_domain(base_url) else "base_url 需為正式 HTTPS 自有網域。",
        "" if search_console.get("google_site_verification") else "Search Console 驗證碼待填。",
        "" if canonical_pages else "canonical_pages 不可為空。",
    ]
    blockers = [item for item in blockers if item]
    return {
        "base_url": base_url,
        "status": "ready_for_domain_cutover" if not blockers else "pending_domain_cutover",
        "blockers": blockers,
    }


def owner_patch_template(site_config, owner):
    draft = site_config_tooling.suggested_patch_template(site_config)
    filtered = {}
    if owner == "data_manager":
        if "base_url" in draft:
            filtered["base_url"] = draft["base_url"]
        analytics = draft.get("analytics", {})
        subset = {
            key: value for key, value in analytics.items()
            if key in {"ga4_measurement_id", "meta_pixel_id"}
        }
        if subset:
            filtered["analytics"] = subset
    elif owner == "backend_engineer":
        analytics = draft.get("analytics", {})
        subset = {
            key: value for key, value in analytics.items()
            if key == "server_event_endpoint"
        }
        if subset:
            filtered["analytics"] = subset
        if draft.get("backend"):
            filtered["backend"] = draft["backend"]
        security = draft.get("security")
        if security:
            filtered["security"] = security
    elif owner == "ops_engineer":
        analytics = draft.get("analytics", {})
        subset = {
            key: value for key, value in analytics.items()
            if key == "sentry_dsn"
        }
        if subset:
            filtered["analytics"] = subset
    elif owner == "seo_owner":
        if draft.get("search_console"):
            filtered["search_console"] = draft["search_console"]
    elif owner == "ops_marketing":
        if draft.get("line"):
            filtered["line"] = draft["line"]
    return filtered


def build_report(args):
    site_config = site_config_tooling.load_site_config()
    readiness = production_config_readiness.build_report()
    draft_args = argparse.Namespace(
        draft_file=args.draft_file,
        draft_json=args.draft_json,
        markdown=False,
    )
    draft = site_config_update_package.build_report(draft_args)
    pending_services = [
        {
            "key": item["key"],
            "label": item["label"],
            "group": item["group"],
            "owner": item["owner"],
            "detail": item["detail"],
        }
        for item in readiness["items"]
        if not item["done"]
    ]
    if args.owner:
        pending_services = [
            item for item in pending_services
            if item["owner"] == args.owner
        ]
    env_items = site_config_tooling.filtered_env_template_items(
        site_config,
        owner=args.owner,
        pending_only=args.pending_only,
    )
    owner_templates = {}
    owners = [args.owner] if args.owner else [
        "data_manager",
        "backend_engineer",
        "ops_engineer",
        "seo_owner",
        "ops_marketing",
    ]
    for owner in owners:
        patch = owner_patch_template(site_config, owner)
        if patch:
            owner_templates[owner] = patch

    domain = domain_status(site_config)
    return {
        "format": "tfse_site_config_approval_package",
        "generated_at": site_config_tooling.now_iso(),
        "target_file": "site-config.json",
        "status": "awaiting_approval" if draft["status"] == "ready_for_manual_merge" else "needs_revision_before_approval",
        "approval_policy": {
            "required_roles": ["data_manager", "compliance_reviewer", "super_admin"],
            "merge_owner": "data_manager",
            "final_signoff_owner": "super_admin",
            "compliance_gate": "涉及廣告追蹤、Line OA、後端 API、Turnstile 或正式網域時，需先保存法務/合規外部複核留痕。",
        },
        "summary": {
            "config_ready_count": readiness["ready_count"],
            "config_pending_count": readiness["pending_count"],
            "filtered_pending_services": len(pending_services),
            "filtered_env_items": len(env_items),
            "draft_status": draft["status"],
            "draft_error_count": len(draft["validation"]["errors"]),
            "draft_warning_count": len(draft["validation"]["warnings"]),
            "domain_status": domain["status"],
            "domain_blockers": len(domain["blockers"]),
        },
        "filters": {
            "owner": args.owner or "",
            "pending_only": args.pending_only,
        },
        "pending_services": pending_services,
        "env_items": env_items,
        "owner_patch_templates": owner_templates,
        "draft_package": {
            "status": draft["status"],
            "draft_keys": draft["draft_keys"],
            "validation": draft["validation"],
            "current_config_summary": draft["current_config_summary"],
        },
        "approval_checklist": [
            "確認草稿不含 secret、資料庫 URL、Admin session secret 或 Turnstile secret key 真值。",
            "確認 base_url、GA4、Meta Pixel、Sentry、Server Event、Search Console、Line OA、backend.api_base_url 與 Turnstile 格式通過預檢。",
            "人工合併 site-config.json 後執行 SEO 重生與配置驗證命令。",
            "完成 GA4、Meta Pixel、Server Event、Sentry、Search Console、Line OA 與正式後端 API 的外部收件/導向留痕。",
            "匯出並保存發布凍結、網域切換、監控收件與外部配置驗證包。",
        ],
        "post_merge_commands": [
            "python3 tools/generate_seo_assets.py",
            "python3 tools/validate_site_config.py",
            "python3 tools/production_config_audit.py",
            "python3 tools/seo_assets_audit.py",
            "python3 tools/verify_static_site.py",
            "python3 tools/acceptance_audit.py",
        ],
        "required_external_evidence": ["ga4", "meta_pixel", "server_event", "sentry", "search_console", "line_oa", "backend_api", "legal_review"],
        "domain_cutover": domain,
        "related_exports": [
            "tfse_site_config_approval_package",
            "tfse_site_config_update_package",
            "tfse_production_config_readiness",
            "tfse_domain_cutover_package",
            "tfse_plan_closure_report",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE Site Config Approval Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Target file: `{report['target_file']}`",
        f"- Status: `{report['status']}`",
        f"- Owner filter: `{report['filters']['owner'] or 'all'}`",
        f"- Pending only: `{report['filters']['pending_only']}`",
        f"- Config ready count: `{report['summary']['config_ready_count']}`",
        f"- Config pending count: `{report['summary']['config_pending_count']}`",
        f"- Filtered pending services: `{report['summary']['filtered_pending_services']}`",
        f"- Filtered env items: `{report['summary']['filtered_env_items']}`",
        f"- Draft status: `{report['summary']['draft_status']}`",
        f"- Domain status: `{report['summary']['domain_status']}`",
        "",
        "## Pending Services",
        "",
    ]
    if report["pending_services"]:
        for item in report["pending_services"]:
            lines.extend([
                f"- **{item['label']}**",
                f"  - Group: `{item['group']}`",
                f"  - Owner: `{item['owner']}`",
                f"  - Detail: {item['detail']}",
            ])
    else:
        lines.append("- 無")
    lines.extend([
        "",
        "## Environment Items",
        "",
    ])
    if report["env_items"]:
        for item in report["env_items"]:
            lines.extend([
                f"- **{item['name']}**",
                f"  - Owner: `{item['owner']}`",
                f"  - Deploy target: `{item['deploy_target']}`",
                f"  - Configured: `{item['configured']}`",
                f"  - Secret: `{item['secret']}`",
                f"  - Value hint: `{item['value_hint']}`",
            ])
    else:
        lines.append("- 無")
    lines.extend([
        "",
        "## Approval Checklist",
        "",
    ])
    lines.extend(f"- {item}" for item in report["approval_checklist"])
    if report["owner_patch_templates"]:
        lines.extend([
            "",
            "## Owner Patch Templates",
            "",
        ])
        for owner, patch in report["owner_patch_templates"].items():
            lines.extend([
                f"### `{owner}`",
                "",
                "```json",
                json.dumps(patch, ensure_ascii=False, indent=2),
                "```",
                "",
            ])
    lines.extend([
        "",
        "## Domain Cutover",
        "",
        f"- Status: `{report['domain_cutover']['status']}`",
    ])
    if report["domain_cutover"]["blockers"]:
        lines.extend(f"- {item}" for item in report["domain_cutover"]["blockers"])
    else:
        lines.append("- 無")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--draft-file")
    parser.add_argument("--draft-json")
    parser.add_argument("--owner")
    parser.add_argument("--pending-only", action="store_true")
    parser.add_argument("--markdown", action="store_true")
    args = parser.parse_args()
    report = build_report(args)
    if args.markdown:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
