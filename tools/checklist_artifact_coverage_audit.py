#!/usr/bin/env python3
from datetime import datetime, timezone
from pathlib import Path
import json
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
CHECKLIST = ROOT / "LAUNCH_CHECKLIST.md"
ADMIN_SCRIPT = ROOT / "assets" / "js" / "tfse-admin.js"
BROWSER_VERIFY = ROOT / "tools" / "browser_acceptance_verify.mjs"


EXPORT_PATTERN = re.compile(r"`(tfse_[a-z0-9_]+)`")


def read(path):
    return path.read_text(encoding="utf-8", errors="ignore")


def referenced_exports():
    return sorted(set(EXPORT_PATTERN.findall(read(CHECKLIST))))


def present_in(path, names):
    text = read(path)
    return sorted(name for name in names if name in text)


def missing_from(path, names):
    text = read(path)
    return sorted(name for name in names if name not in text)


def build_report():
    names = referenced_exports()
    missing_admin = missing_from(ADMIN_SCRIPT, names)
    missing_browser = missing_from(BROWSER_VERIFY, names)

    return {
        "format": "tfse_checklist_artifact_coverage_audit",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "LAUNCH_CHECKLIST.md tfse_* artifact references",
        "summary": {
            "referenced_exports": len(names),
            "present_in_admin_script": len(names) - len(missing_admin),
            "present_in_browser_verify": len(names) - len(missing_browser),
            "missing_in_admin_script": len(missing_admin),
            "missing_in_browser_verify": len(missing_browser),
        },
        "referenced_exports": names,
        "admin_script_present": present_in(ADMIN_SCRIPT, names),
        "browser_verify_present": present_in(BROWSER_VERIFY, names),
        "missing": {
            "admin_script": missing_admin,
            "browser_verify": missing_browser,
        },
        "related_exports": [
            "tfse_project_plan_coverage_report",
            "tfse_plan_closure_report",
            "tfse_launch_handoff_manifest",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE Checklist Artifact Coverage Audit",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Source: `{report['source']}`",
        f"- Referenced exports: `{report['summary']['referenced_exports']}`",
        f"- Present in admin script: `{report['summary']['present_in_admin_script']}`",
        f"- Present in browser verify: `{report['summary']['present_in_browser_verify']}`",
        "",
        "## Missing In Admin Script",
        "",
    ]
    if report["missing"]["admin_script"]:
        lines.extend(f"- `{name}`" for name in report["missing"]["admin_script"])
    else:
        lines.append("- 無")
    lines.extend([
        "",
        "## Missing In Browser Verify",
        "",
    ])
    if report["missing"]["browser_verify"]:
        lines.extend(f"- `{name}`" for name in report["missing"]["browser_verify"])
    else:
        lines.append("- 無")
    if not report["missing"]["admin_script"] and not report["missing"]["browser_verify"]:
        lines.extend([
            "",
            "## Conclusion",
            "",
            "- `LAUNCH_CHECKLIST.md` 中提到的交接包，已全部接入 Admin 導出與瀏覽器煙測覆蓋。",
        ])
    return "\n".join(lines)


def main():
    report = build_report()
    if "--markdown" in sys.argv:
        print(markdown(report))
        return 0
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if report["missing"]["admin_script"] or report["missing"]["browser_verify"] else 0


if __name__ == "__main__":
    sys.exit(main())
