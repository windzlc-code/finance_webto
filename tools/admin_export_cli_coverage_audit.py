#!/usr/bin/env python3
from datetime import datetime, timezone
from pathlib import Path
import json
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
ADMIN_SCRIPT = ROOT / "assets" / "js" / "tfse-admin.js"
TOOLS_DIR = ROOT / "tools"


FORMAT = "tfse_admin_export_cli_coverage_audit"
ADMIN_EXPORT_PATTERN = re.compile(r'format:\s*"(?P<name>tfse_[a-z0-9_]+)"')
CLI_EXPORT_PATTERN = re.compile(
    r'FORMAT\s*=\s*"(?P<name1>tfse_[a-z0-9_]+)"|'
    r'"format"\s*:\s*"(?P<name2>tfse_[a-z0-9_]+)"'
)


def admin_exports():
    text = ADMIN_SCRIPT.read_text(encoding="utf-8", errors="ignore")
    return sorted(set(match.group("name") for match in ADMIN_EXPORT_PATTERN.finditer(text)))


def cli_exports():
    mapping = {}
    for path in sorted(TOOLS_DIR.glob("*.py")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for match in CLI_EXPORT_PATTERN.finditer(text):
            name = match.group("name1") or match.group("name2")
            if not name:
                continue
            mapping.setdefault(name, []).append(path.name)
    return mapping


def build_report():
    admin = admin_exports()
    cli = cli_exports()
    missing = [name for name in admin if name not in cli]
    return {
        "format": FORMAT,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "assets/js/tfse-admin.js formats vs tools/*.py standalone formats",
        "summary": {
            "admin_export_count": len(admin),
            "cli_export_count": len(cli),
            "covered_count": len(admin) - len(missing),
            "missing_cli_count": len(missing),
        },
        "admin_exports": admin,
        "cli_exports": cli,
        "missing_cli_exports": missing,
        "related_exports": [
            "tfse_launch_handoff_manifest",
            "tfse_plan_closure_report",
            "tfse_project_plan_coverage_report",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE Admin Export CLI Coverage Audit",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Admin exports: `{report['summary']['admin_export_count']}`",
        f"- CLI exports: `{report['summary']['cli_export_count']}`",
        f"- Covered: `{report['summary']['covered_count']}`",
        f"- Missing CLI exports: `{report['summary']['missing_cli_count']}`",
        "",
        "## Missing CLI Exports",
        "",
    ]
    if report["missing_cli_exports"]:
        lines.extend(f"- `{name}`" for name in report["missing_cli_exports"])
    else:
        lines.append("- 無")
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
