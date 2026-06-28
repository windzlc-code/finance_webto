#!/usr/bin/env python3
import argparse
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
import json
import sys

import launch_cutover_audit


ROOT = Path(__file__).resolve().parents[1]


def load_json(path, fallback):
    try:
        return json.loads((ROOT / path).read_text(encoding="utf-8"))
    except Exception:
        return fallback


def nested(data, path, default=""):
    value = data
    for part in path.split("."):
        if not isinstance(value, dict) or part not in value:
            return default
        value = value[part]
    return value


def set_nested(data, path, value):
    cursor = data
    parts = path.split(".")
    for part in parts[:-1]:
        cursor = cursor.setdefault(part, {})
    cursor[parts[-1]] = value


def is_https_url(value):
    return isinstance(value, str) and value.startswith("https://")


def is_official_domain(value):
    if not is_https_url(value):
        return False
    host = urlparse(value).netloc.lower()
    return bool(host) and all(marker not in host for marker in ("127.0.0.1", "localhost", "github.io"))


FIELD_SPECS = OrderedDict([
    ("formal_domain_base_url", {
        "label": "正式網站 Base URL",
        "owner": "data_manager",
        "config_paths": ["base_url"],
        "env_names": ["TFSE_BASE_URL"],
        "placeholder": "https://www.example.com",
        "validator": lambda config: is_official_domain(nested(config, "base_url")),
        "path_validators": {
            "base_url": is_official_domain,
        },
        "validation_hint": "需為正式 HTTPS 自有網域，不可使用 localhost、127.0.0.1 或 github.io。",
        "notes": "填入後需重生 canonical、sitemap、robots、feed 與 Search Console 驗證 meta。",
        "blocked_items": ["formal_domain_base_url"],
        "follow_up_commands": [
            "python3 tools/generate_seo_assets.py",
            "python3 tools/validate_site_config.py",
            "python3 tools/seo_assets_audit.py",
            "python3 tools/verify_static_site.py",
        ],
        "related_exports": ["tfse_domain_cutover_package", "tfse_seo_submission_package"],
    }),
    ("ga4_measurement_id", {
        "label": "GA4 Measurement ID",
        "owner": "data_manager",
        "config_paths": ["analytics.ga4_measurement_id"],
        "env_names": ["TFSE_GA4_MEASUREMENT_ID"],
        "placeholder": "G-XXXXXXXXXX",
        "validator": lambda config: bool(nested(config, "analytics.ga4_measurement_id")),
        "path_validators": {
            "analytics.ga4_measurement_id": lambda value: bool(value),
        },
        "validation_hint": "格式需為 G- 開頭；填入後仍需到 GA4 DebugView / Realtime 驗證收件。",
        "notes": "和 Meta Pixel 一起填完後，才可完成正式 Debug 驗證留痕。",
        "blocked_items": ["ga4_measurement_id", "analytics_debug_verification"],
        "follow_up_commands": [
            "python3 tools/validate_site_config.py",
            "python3 tools/launch_cutover_audit.py",
        ],
        "related_exports": ["tfse_monitoring_receipt_checklist", "tfse_analytics_debug_verification_package"],
    }),
    ("meta_pixel_id", {
        "label": "Meta Pixel ID",
        "owner": "data_manager",
        "config_paths": ["analytics.meta_pixel_id"],
        "env_names": ["TFSE_META_PIXEL_ID"],
        "placeholder": "000000000000000",
        "validator": lambda config: bool(nested(config, "analytics.meta_pixel_id")),
        "path_validators": {
            "analytics.meta_pixel_id": lambda value: bool(value),
        },
        "validation_hint": "需為正式 Pixel ID；填入後仍需到 Meta Events Manager 驗證瀏覽、表單、搜尋與 Line CTA 事件。",
        "notes": "和 GA4 一起填完後，才可完成正式 Debug 驗證留痕。",
        "blocked_items": ["meta_pixel_id", "analytics_debug_verification"],
        "follow_up_commands": [
            "python3 tools/validate_site_config.py",
            "python3 tools/launch_cutover_audit.py",
        ],
        "related_exports": ["tfse_monitoring_receipt_checklist", "tfse_analytics_debug_verification_package"],
    }),
    ("server_event_endpoint", {
        "label": "Server Event Endpoint",
        "owner": "backend_engineer",
        "config_paths": ["analytics.server_event_endpoint"],
        "env_names": ["TFSE_SERVER_EVENT_ENDPOINT"],
        "placeholder": "https://api.example.com/events",
        "validator": lambda config: is_https_url(nested(config, "analytics.server_event_endpoint")),
        "path_validators": {
            "analytics.server_event_endpoint": is_https_url,
        },
        "validation_hint": "需為 HTTPS endpoint，且正式後端只能接收去識別事件。",
        "notes": "填入後需驗證事件不含手機、Line ID、姓名、Email、備註或其他高敏資料。",
        "blocked_items": ["server_event_endpoint"],
        "follow_up_commands": [
            "python3 tools/validate_site_config.py",
            "python3 tools/launch_cutover_audit.py",
        ],
        "related_exports": ["tfse_server_event_replay_queue", "tfse_monitoring_receipt_checklist"],
    }),
    ("line_oa_url", {
        "label": "正式 Line OA 加友網址",
        "owner": "ops_marketing",
        "config_paths": ["line.oa_url"],
        "env_names": ["TFSE_LINE_OA_URL"],
        "placeholder": "https://lin.ee/xxxx",
        "validator": lambda config: is_https_url(nested(config, "line.oa_url")) and nested(config, "line.oa_url") not in ("free-check.html#line-cta", "contact-us.html#line-cta", "contact.html#line-cta"),
        "path_validators": {
            "line.oa_url": lambda value: is_https_url(value) and value not in ("free-check.html#line-cta", "contact-us.html#line-cta", "contact.html#line-cta"),
        },
        "validation_hint": "需為正式 HTTPS Line 加友網址，不可保留站內 MVP 說明錨點。",
        "notes": "填入後即可依既有 setup / handoff package 完成手機與桌面導向驗證。",
        "blocked_items": ["line_oa_url", "line_oa_setup", "line_oa_handoff"],
        "follow_up_commands": [
            "python3 tools/validate_site_config.py",
            "python3 tools/launch_cutover_audit.py",
        ],
        "related_exports": ["tfse_line_oa_setup_package", "tfse_line_oa_handoff_check"],
    }),
    ("search_console_verification", {
        "label": "Google Search Console 驗證碼",
        "owner": "seo_owner",
        "config_paths": ["search_console.google_site_verification"],
        "env_names": ["TFSE_GOOGLE_SITE_VERIFICATION"],
        "placeholder": "google-site-verification-token",
        "validator": lambda config: bool(nested(config, "search_console.google_site_verification")),
        "path_validators": {
            "search_console.google_site_verification": lambda value: bool(value),
        },
        "validation_hint": "填入後需重新生成 HTML head，並於部署後完成 property 驗證與 sitemap 提交。",
        "notes": "通常與正式 base_url 同一波處理，避免重複切換 SEO 資產。",
        "blocked_items": ["search_console_verification", "search_console_submit"],
        "follow_up_commands": [
            "python3 tools/generate_seo_assets.py",
            "python3 tools/validate_site_config.py",
            "python3 tools/seo_assets_audit.py",
            "python3 tools/launch_cutover_audit.py",
        ],
        "related_exports": ["tfse_search_console_verification_package", "tfse_seo_submission_package"],
    }),
    ("backend_api_base_url", {
        "label": "正式 Backend API 模式與 Base URL",
        "owner": "backend_engineer",
        "config_paths": ["backend.mode", "backend.api_base_url"],
        "env_names": ["TFSE_BACKEND_MODE", "TFSE_BACKEND_API_BASE_URL"],
        "placeholder": {
            "backend.mode": "api",
            "backend.api_base_url": "https://api.example.com",
        },
        "validator": lambda config: nested(config, "backend.mode") == "api" and is_https_url(nested(config, "backend.api_base_url")),
        "path_validators": {
            "backend.mode": lambda value: value == "api",
            "backend.api_base_url": is_https_url,
        },
        "validation_hint": "backend.mode 需切到 api，且 backend.api_base_url 需為正式 HTTPS URL。",
        "notes": "這一項會直接解鎖內容 API、Leads API、Admin CRM API、Turnstile server-side 與正式審計接入驗證。",
        "blocked_items": [
            "backend_api_base_url",
            "content_api_cutover",
            "leads_api_persistence",
            "turnstile_backend_verification",
            "admin_crm_api_cutover",
        ],
        "follow_up_commands": [
            "python3 tools/validate_site_config.py",
            "python3 tools/launch_cutover_audit.py",
            "python3 tools/launch_execution_plan.py --markdown",
            "NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs",
        ],
        "related_exports": ["tfse_backend_acceptance_matrix", "tfse_content_api_cutover_package", "tfse_crm_api_persistence_package"],
    }),
    ("sentry_dsn", {
        "label": "正式 Sentry DSN",
        "owner": "ops_engineer",
        "config_paths": ["analytics.sentry_dsn"],
        "env_names": ["TFSE_SENTRY_DSN"],
        "placeholder": "https://public@sentry.example/1",
        "validator": lambda config: is_https_url(nested(config, "analytics.sentry_dsn")),
        "path_validators": {
            "analytics.sentry_dsn": is_https_url,
        },
        "validation_hint": "需為正式 HTTPS DSN；填入後仍需做前台與 API 受控錯誤驗證。",
        "notes": "前台與 API Sentry 收件都需保存 masking、environment、release 與 issue 證據。",
        "blocked_items": ["sentry_dsn", "sentry_verification"],
        "follow_up_commands": [
            "python3 tools/validate_site_config.py",
            "python3 tools/launch_cutover_audit.py",
        ],
        "related_exports": ["tfse_sentry_error_verification_package"],
    }),
])


CONDITIONAL_SPECS = OrderedDict([
    ("turnstile", {
        "label": "Cloudflare Turnstile 正式啟用",
        "owner": "backend_engineer",
        "config_paths": ["security.turnstile.enabled", "security.turnstile.site_key"],
        "env_names": ["TFSE_TURNSTILE_SITE_KEY", "TFSE_TURNSTILE_SECRET_KEY"],
        "placeholder": {
            "security.turnstile.enabled": True,
            "security.turnstile.site_key": "0x4AAAA...",
        },
        "path_validators": {
            "security.turnstile.enabled": lambda value: value is True,
            "security.turnstile.site_key": lambda value: bool(value),
        },
        "validation_hint": "若正式 Leads API 需驗證 token，site-config 需填 site_key，secret key 只能放在伺服器密鑰管理。",
        "notes": "此項不單獨計入 site-config pending counts，但會影響 Turnstile server-side 驗證閉環。",
        "blocked_items": ["turnstile_backend_verification"],
        "related_exports": ["tfse_turnstile_backend_verification_package", "tfse_form_risk_control_report"],
    }),
])


SECRET_INPUTS = [
    {
        "label": "Turnstile Secret Key",
        "owner": "backend_engineer",
        "env_name": "TFSE_TURNSTILE_SECRET_KEY",
        "deploy_target": "API server / CI secret",
        "notes": "只可存放在 secret manager，不可提交到 Git、site-config.json 或前端導出包。",
    },
    {
        "label": "Database URL",
        "owner": "backend_engineer",
        "env_name": "TFSE_DATABASE_URL",
        "deploy_target": "API server / secret manager",
        "notes": "供正式 PostgreSQL、備份與 restore drill 使用。",
    },
    {
        "label": "Admin Session Secret",
        "owner": "backend_engineer",
        "env_name": "TFSE_ADMIN_SESSION_SECRET",
        "deploy_target": "API server / secret manager",
        "notes": "供 Admin Auth cookie/session 簽署使用，不可出現在前端。",
    },
    {
        "label": "Backup Bucket / Storage Path",
        "owner": "infra_owner",
        "env_name": "TFSE_BACKUP_BUCKET",
        "deploy_target": "backup job / infra config",
        "notes": "供每日備份與每週 restore drill 收據留痕使用。",
    },
]


INPUT_KEY_ALIASES = {
    "formal_domain_base_url": ["formal_domain_base_url", "base_url"],
    "ga4_measurement_id": ["ga4_measurement_id"],
    "meta_pixel_id": ["meta_pixel_id"],
    "server_event_endpoint": ["server_event_endpoint"],
    "line_oa_url": ["line_oa_url"],
    "search_console_verification": ["search_console_verification", "google_site_verification"],
    "backend_api_base_url": ["backend_api_base_url", "backend_mode_and_api_base_url"],
    "sentry_dsn": ["sentry_dsn"],
    "turnstile": ["turnstile", "turnstile_site_key"],
}


def current_value(config, paths):
    if len(paths) == 1:
        return nested(config, paths[0], "")
    return {path: nested(config, path, "") for path in paths}


def suggested_value(config, spec):
    placeholder = spec["placeholder"]
    validators = spec.get("path_validators", {})
    if isinstance(placeholder, dict):
        value = {}
        for path, fallback in placeholder.items():
            current = nested(config, path, "")
            validator = validators.get(path, lambda current_value: current_value not in ("", None))
            value[path] = current if validator(current) else fallback
        return value
    path = spec["config_paths"][0]
    current = nested(config, path, "")
    validator = validators.get(path, lambda current_value: current_value not in ("", None))
    return current if validator(current) else placeholder


def build_patch(config):
    patch = {}
    for spec in FIELD_SPECS.values():
        suggested = suggested_value(config, spec)
        if isinstance(suggested, dict):
            for path, value in suggested.items():
                set_nested(patch, path, value)
        else:
            set_nested(patch, spec["config_paths"][0], suggested)
    for spec in CONDITIONAL_SPECS.values():
        validators = spec.get("path_validators", {})
        for path, value in spec["placeholder"].items():
            current = nested(config, path, "")
            validator = validators.get(path, lambda current_value: current_value not in ("", None))
            set_nested(patch, path, current if validator(current) else value)
    return patch


def build_patch_from_items(items):
    patch = {}
    for item in items:
        suggested = item.get("suggested_value")
        if isinstance(suggested, dict):
            for path, value in suggested.items():
                set_nested(patch, path, value)
        elif item.get("config_paths"):
            set_nested(patch, item["config_paths"][0], suggested)
    return patch


def owner_groups(items):
    groups = OrderedDict()
    for item in items:
        groups.setdefault(item["owner"], []).append(item)
    return groups


def load_seed_records(key):
    payload = load_json("assets/data/admin-record-seeds.json", {})
    records = payload.get(key, [])
    if not isinstance(records, list):
        return []
    return sorted(records, key=lambda item: str((item or {}).get("checked_at", "")), reverse=True)


def latest_record(records, matcher):
    for record in records:
        if matcher(record):
            return record
    return None


def filter_owner_groups(groups, owner):
    if not owner:
        return groups
    return OrderedDict((group_owner, items) for group_owner, items in groups.items() if group_owner == owner)


def build_report(owner=None, pending_only=False):
    config = load_json("site-config.json", {})
    audit = launch_cutover_audit.build_report()
    item_map = {item["key"]: item for item in audit["items"]}
    config_input_records = load_seed_records("config_input_records")

    required_inputs = []
    for key, spec in FIELD_SPECS.items():
        blocked = [item_map[item_key] for item_key in spec["blocked_items"] if item_key in item_map]
        aliases = set(INPUT_KEY_ALIASES.get(key, [key]))
        record = latest_record(config_input_records, lambda item, current_aliases=aliases: item.get("input_key") in current_aliases)
        required_inputs.append({
            "key": key,
            "label": spec["label"],
            "owner": spec["owner"],
            "config_paths": spec["config_paths"],
            "env_names": spec["env_names"],
            "current_value": current_value(config, spec["config_paths"]),
            "suggested_value": suggested_value(config, spec),
            "configured": spec["validator"](config),
            "validation_hint": spec["validation_hint"],
            "notes": spec["notes"],
            "latest_record": record,
            "blocked_items": [
                {
                    "key": item["key"],
                    "label": item["label"],
                    "status": item["status"],
                }
                for item in blocked
            ],
            "related_exports": spec["related_exports"],
            "follow_up_commands": spec["follow_up_commands"],
        })

    conditional_inputs = []
    for key, spec in CONDITIONAL_SPECS.items():
        blocked = [item_map[item_key] for item_key in spec["blocked_items"] if item_key in item_map]
        aliases = set(INPUT_KEY_ALIASES.get(key, [key]))
        record = latest_record(config_input_records, lambda item, current_aliases=aliases: item.get("input_key") in current_aliases)
        conditional_inputs.append({
            "key": key,
            "label": spec["label"],
            "owner": spec["owner"],
            "config_paths": spec["config_paths"],
            "env_names": spec["env_names"],
            "current_value": current_value(config, spec["config_paths"]),
            "suggested_value": spec["placeholder"],
            "configured": bool(nested(config, "security.turnstile.enabled")) and bool(nested(config, "security.turnstile.site_key")),
            "validation_hint": spec["validation_hint"],
            "notes": spec["notes"],
            "latest_record": record,
            "blocked_items": [
                {
                    "key": item["key"],
                    "label": item["label"],
                    "status": item["status"],
                }
                for item in blocked
            ],
            "related_exports": spec["related_exports"],
        })

    ready_items = [item for item in audit["items"] if item["status"] == "ready_for_external_execution"]
    pending_items = [item for item in audit["items"] if item["status"] == "pending_external_input"]

    filtered_required_inputs = [item for item in required_inputs if (not owner or item["owner"] == owner) and (not pending_only or not item["configured"])]
    filtered_conditional_inputs = [item for item in conditional_inputs if (not owner or item["owner"] == owner) and (not pending_only or not item["configured"])]
    owner_handoff = owner_groups(filtered_required_inputs + filtered_conditional_inputs)
    owner_patch_templates = OrderedDict(
        (group_owner, build_patch_from_items(items))
        for group_owner, items in owner_handoff.items()
    )

    return {
        "format": "tfse_formal_config_input_packet",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": ["site-config.json", "tools/launch_cutover_audit.py"],
        "template_policy": "保留 Exomac 前端模板結構，只補正式配置、資料與功能接入，不重做前端設計。",
        "filters": {
            "owner": owner or "",
            "pending_only": pending_only,
        },
        "summary": {
            "required_input_count": len(required_inputs),
            "configured_required_inputs": sum(1 for item in required_inputs if item["configured"]),
            "pending_required_inputs": sum(1 for item in required_inputs if not item["configured"]),
            "conditional_input_count": len(conditional_inputs),
            "secret_input_count": len(SECRET_INPUTS),
            "external_execution_ready_count": len(ready_items),
            "pending_external_items": len(pending_items),
            "tracked_records": len(config_input_records),
            "filtered_required_input_count": len(filtered_required_inputs),
            "filtered_conditional_input_count": len(filtered_conditional_inputs),
        },
        "required_inputs": filtered_required_inputs,
        "conditional_inputs": filtered_conditional_inputs,
        "secret_inputs": SECRET_INPUTS,
        "records": config_input_records[:150],
        "record_summary": {
            "tracked_count": len(config_input_records),
            "received_count": sum(1 for item in config_input_records if item.get("result") == "received"),
            "approved_count": sum(1 for item in config_input_records if item.get("result") == "approved"),
        },
        "site_config_patch_template": build_patch(config),
        "ready_for_external_execution": ready_items,
        "pending_external_input_items": pending_items,
        "owner_handoff": owner_handoff,
        "owner_patch_templates": owner_patch_templates,
        "global_follow_up_commands": [
            "python3 tools/formal_config_input_packet.py --markdown",
            "python3 tools/validate_site_config.py",
            "python3 tools/launch_cutover_audit.py",
            "python3 tools/launch_execution_plan.py --markdown",
            "python3 tools/launch_countdown_plan.py --markdown",
            "python3 tools/verify_static_site.py",
        ],
    }


def as_markdown(report):
    lines = [
        "# TFSE Formal Config Input Packet",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Owner filter: `{report['filters']['owner'] or 'all'}`",
        f"- Pending only: `{report['filters']['pending_only']}`",
        f"- Pending required inputs: `{report['summary']['pending_required_inputs']}` / `{report['summary']['required_input_count']}`",
        f"- Filtered required inputs: `{report['summary']['filtered_required_input_count']}`",
        f"- Conditional security inputs: `{report['summary']['conditional_input_count']}`",
        f"- Filtered conditional inputs: `{report['summary']['filtered_conditional_input_count']}`",
        f"- Secret-only server inputs: `{report['summary']['secret_input_count']}`",
        f"- Ready for external execution after inputs: `{report['summary']['external_execution_ready_count']}`",
        f"- Tracked config receipts: `{report['record_summary']['tracked_count']}` (received `{report['record_summary']['received_count']}`, approved `{report['record_summary']['approved_count']}`)",
        "",
        "## Required Inputs",
        "",
    ]
    for owner, items in report["owner_handoff"].items():
        lines.append(f"### Owner: `{owner}`")
        lines.append("")
        for item in items:
            status = "configured" if item.get("configured") else "pending_input"
            blocked = "、".join(entry["label"] for entry in item.get("blocked_items", [])) or "無"
            exports = "、".join(item.get("related_exports", [])) or "無"
            lines.extend([
                f"- **{item['label']}**",
                f"  - Status: `{status}`",
                f"  - Config paths: `{', '.join(item['config_paths'])}`",
                f"  - Env names: `{', '.join(item['env_names'])}`",
                f"  - Current: `{json.dumps(item['current_value'], ensure_ascii=False)}`",
                f"  - Suggested: `{json.dumps(item['suggested_value'], ensure_ascii=False)}`",
                f"  - Validation: {item['validation_hint']}",
                f"  - Unblocks: {blocked}",
                f"  - Related exports: {exports}",
            ])
            if item.get("follow_up_commands"):
                lines.append(f"  - Follow-up commands: `{'; '.join(item['follow_up_commands'])}`")
            lines.append(f"  - Notes: {item['notes']}")
            if item.get("latest_record"):
                lines.append(
                    f"  - Latest receipt: `{item['latest_record'].get('result', '-')}` / `{item['latest_record'].get('owner', '-')}` / `{item['latest_record'].get('checked_at', '-')}`"
                )
        lines.append("")

    lines.extend([
        "## Owner Patch Templates",
        "",
    ])
    if report["owner_patch_templates"]:
        for owner, patch in report["owner_patch_templates"].items():
            lines.extend([
                f"### Owner Patch: `{owner}`",
                "",
                "```json",
                json.dumps(patch, ensure_ascii=False, indent=2),
                "```",
                "",
            ])
    else:
        lines.extend(["- 無", ""])

    lines.extend([
        "## Secret Inputs",
        "",
    ])
    for item in report["secret_inputs"]:
        lines.extend([
            f"- **{item['label']}**",
            f"  - Owner: `{item['owner']}`",
            f"  - Env: `{item['env_name']}`",
            f"  - Target: {item['deploy_target']}",
            f"  - Notes: {item['notes']}",
        ])
    lines.extend([
        "",
        "## Site Config Patch Template",
        "",
        "```json",
        json.dumps(report["site_config_patch_template"], ensure_ascii=False, indent=2),
        "```",
        "",
        "## Ready For External Execution",
        "",
    ])
    for item in report["ready_for_external_execution"]:
        blockers = "；".join(item["blockers"]) if item["blockers"] else "無"
        lines.extend([
            f"- **{item['label']}**",
            f"  - Owner: `{item['owner']}`",
            f"  - Evidence: {item['evidence']}",
            f"  - Blockers: {blockers}",
        ])
    lines.extend([
        "",
        "## Global Follow-up Commands",
        "",
    ])
    for command in report["global_follow_up_commands"]:
        lines.append(f"- `{command}`")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--markdown", action="store_true")
    parser.add_argument("--owner")
    parser.add_argument("--pending-only", action="store_true")
    args = parser.parse_args()

    report = build_report(owner=args.owner, pending_only=args.pending_only)
    if args.markdown:
        print(as_markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
