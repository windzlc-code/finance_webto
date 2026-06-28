#!/usr/bin/env python3
import argparse
import json
import sys

import site_config_tooling


def build_report(owner=None, pending_only=False):
    site_config = site_config_tooling.load_site_config()
    all_items = site_config_tooling.config_readiness_items(site_config)
    items = site_config_tooling.filtered_config_readiness_items(
        site_config,
        owner=owner,
        pending_only=pending_only,
    )
    return {
        "format": "tfse_production_config_readiness",
        "generated_at": site_config_tooling.now_iso(),
        "source": "site-config.json",
        "filters": {
            "owner": owner or "",
            "pending_only": pending_only,
        },
        "ready_count": sum(1 for item in all_items if item["done"]),
        "pending_count": sum(1 for item in all_items if not item["done"]),
        "filtered_ready_count": sum(1 for item in items if item["done"]),
        "filtered_pending_count": sum(1 for item in items if not item["done"]),
        "items": items,
        "related_exports": [
            "tfse_site_config_update_package",
            "tfse_site_config_approval_package",
            "tfse_formal_config_input_packet",
            "tfse_plan_closure_report",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE Production Config Readiness",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Source: `{report['source']}`",
        f"- Owner filter: `{report['filters']['owner'] or 'all'}`",
        f"- Pending only: `{report['filters']['pending_only']}`",
        f"- Ready count: `{report['ready_count']}`",
        f"- Pending count: `{report['pending_count']}`",
        f"- Filtered ready count: `{report['filtered_ready_count']}`",
        f"- Filtered pending count: `{report['filtered_pending_count']}`",
        "",
        "## Items",
        "",
    ]
    for item in report["items"]:
        lines.extend([
            f"- **{item['label']}**",
            f"  - Group: `{item['group']}`",
            f"  - Owner: `{item['owner']}`",
            f"  - Ready: `{item['done']}`",
            f"  - Detail: {item['detail']}",
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
