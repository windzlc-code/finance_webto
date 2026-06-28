#!/usr/bin/env python3
import argparse
import json
import sys

import site_config_tooling


def build_report(owner=None, pending_only=False):
    site_config = site_config_tooling.load_site_config()
    all_items = site_config_tooling.env_template_items(site_config)
    items = site_config_tooling.filtered_env_template_items(
        site_config,
        owner=owner,
        pending_only=pending_only,
    )
    return {
        "format": "tfse_production_env_template",
        "generated_at": site_config_tooling.now_iso(),
        "source": "site-config.json + PRODUCTION_BACKEND_PLAN.md",
        "secret_policy": "此包只保存正式環境變數名稱、來源路徑、部署端與示例提示；Turnstile secret、Database URL、Admin session secret 不應寫入前端或提交到 Git。",
        "notable_secret_names": ["TFSE_TURNSTILE_SECRET_KEY", "TFSE_DATABASE_URL", "TFSE_ADMIN_SESSION_SECRET"],
        "filters": {
            "owner": owner or "",
            "pending_only": pending_only,
        },
        "configured_count": sum(1 for item in all_items if item["configured"]),
        "pending_count": sum(1 for item in all_items if not item["configured"]),
        "secret_count": sum(1 for item in all_items if item["secret"]),
        "filtered_configured_count": sum(1 for item in items if item["configured"]),
        "filtered_pending_count": sum(1 for item in items if not item["configured"]),
        "filtered_secret_count": sum(1 for item in items if item["secret"]),
        "target_files": ["site-config.json", ".env.production", "GitHub Actions secrets", "API server environment"],
        "validation_commands": [
            "python3 tools/validate_site_config.py",
            "python3 tools/production_config_audit.py",
            "python3 tools/verify_static_site.py",
            "NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs",
        ],
        "items": items,
        "related_exports": [
            "tfse_production_env_template",
            "tfse_site_config_update_package",
            "tfse_production_config_readiness",
            "tfse_backend_acceptance_matrix",
            "tfse_plan_closure_report",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE Production Env Template",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Source: `{report['source']}`",
        f"- Owner filter: `{report['filters']['owner'] or 'all'}`",
        f"- Pending only: `{report['filters']['pending_only']}`",
        f"- Configured count: `{report['configured_count']}`",
        f"- Pending count: `{report['pending_count']}`",
        f"- Secret count: `{report['secret_count']}`",
        f"- Filtered configured count: `{report['filtered_configured_count']}`",
        f"- Filtered pending count: `{report['filtered_pending_count']}`",
        f"- Filtered secret count: `{report['filtered_secret_count']}`",
        "",
        "## Items",
        "",
    ]
    for item in report["items"]:
        lines.extend([
            f"- **{item['name']}**",
            f"  - Group: `{item['group']}`",
            f"  - Owner: `{item['owner']}`",
            f"  - Source path: `{item['source_path']}`",
            f"  - Configured: `{item['configured']}`",
            f"  - Secret: `{item['secret']}`",
            f"  - Deploy target: `{item['deploy_target']}`",
            f"  - Value hint: `{item['value_hint']}`",
        ])
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--owner")
    parser.add_argument("--pending-only", action="store_true")
    parser.add_argument("--markdown", action="store_true")
    args = parser.parse_args()
    report = build_report(owner=args.owner, pending_only=args.pending_only)
    if args.markdown:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
