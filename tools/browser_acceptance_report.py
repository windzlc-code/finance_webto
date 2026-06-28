from datetime import datetime, timezone
import json
import sys

import acceptance_audit


DEFAULT_BASE_URL = "http://127.0.0.1:4173"
BROWSER_KEYS = {"no_text_overlap", "form_submit_browser", "admin_login_browser", "mobile_browser", "public_feedback_intake"}
BROWSER_EVIDENCE_PATH = acceptance_audit.ROOT / "assets" / "data" / "browser-acceptance-evidence.json"

SCENARIOS = {
    "no_text_overlap": {
        "viewports": ["1440x900", "390x844"],
        "pages": [
            "/index.html",
            "/database.html",
            "/articles/credit-score-debt-ratio-check.html",
            "/free-check.html",
            "/admin.html",
        ],
        "steps": [
            "Open each page at desktop and mobile viewport.",
            "Check that headings, buttons, form labels, cards, tables and footer text do not overlap or clip.",
            "Check that the original template header, mobile menu and footer remain visually intact.",
        ],
        "expected": "No visible text overlap, broken wrapping, clipped primary CTA or unreadable form/control text.",
    },
    "form_submit_browser": {
        "viewports": ["1440x900"],
        "pages": ["/free-check.html?utm_source=qa&utm_medium=browser_acceptance&utm_campaign=manual"],
        "steps": [
            "Fill display name, phone, region, at least one need, privacy consent and optional Line consent.",
            "Submit the free check form without entering any sensitive document, card, account or password data.",
            "Open /admin.html, log in with the MVP admin password and confirm the test lead is visible.",
            "Select the test lead and update its status or note, then confirm the audit panel records the action.",
        ],
        "expected": "Lead is stored, UTM values are present, Line CTA is shown when configured and Admin CRM can update status.",
    },
    "public_feedback_intake": {
        "viewports": ["1440x900"],
        "pages": ["/contact.html"],
        "steps": [
            "Open contact.html and fill feedback type, page URL, summary, optional official source URL and optional phone last-3 using only low-sensitive content.",
            "Submit once in local mode and confirm a feedback ticket is created without storing raw email, full phone, ID, account or password data.",
            "Switch to formal API rehearsal mode and submit again, then confirm POST /api/public-feedback succeeds and the success message shows a ticket id.",
            "Confirm the contact page remains an information/reporting page and the original template layout is still intact.",
        ],
        "expected": "Low-sensitive public feedback can be submitted from contact.html in both local and formal API rehearsal modes, with hashed contact identifiers and visible success feedback.",
    },
    "admin_login_browser": {
        "viewports": ["1440x900"],
        "pages": ["/admin.html"],
        "steps": [
            "Open Admin in a fresh browser session or clear local auth state.",
            "Confirm protected CRM/data sections are hidden before login.",
            "Log in with the MVP admin password and Super Admin role.",
            "Confirm CRM, data management, launch health, config readiness and acceptance checklist panels render.",
            "Confirm export buttons are enabled for Super Admin and denied/audited for restricted roles when tested.",
        ],
        "expected": "Admin protected panels require login, Super Admin can export, restricted roles cannot perform unauthorized exports.",
    },
    "mobile_browser": {
        "viewports": ["390x844", "430x932"],
        "pages": ["/index.html", "/database.html", "/articles.html", "/free-check.html", "/admin.html"],
        "steps": [
            "Open each page with a mobile viewport.",
            "Open and close the mobile menu, then navigate to database, articles and free check pages.",
            "Check that form inputs, selects, checkboxes, CTA buttons and admin tables remain usable without horizontal scrolling.",
            "Confirm footer policy links and Line CTA remain reachable.",
        ],
        "expected": "Mobile navigation, CTA flow, forms and key Admin panels are usable and readable on common phone widths.",
    },
}


def load_browser_evidence():
    try:
        return json.loads(BROWSER_EVIDENCE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def browser_evidence_record(key):
    evidence = load_browser_evidence()
    aliases = acceptance_audit.BROWSER_ALIASES.get(key, (key,))
    matched = [
        record for record in evidence.get("records", [])
        if record.get("result") == "passed" and record.get("item_key") in aliases
    ]
    if not matched:
        return None
    matched.sort(key=lambda item: str(item.get("checked_at", "")), reverse=True)
    return matched[0]


def browser_items():
    return [
        item for item in acceptance_audit.build_report()["items"]
        if item.get("key") in BROWSER_KEYS
    ]


def build_report(base_url=DEFAULT_BASE_URL):
    items = []
    for item in browser_items():
        scenario = SCENARIOS.get(item["key"], {})
        record = browser_evidence_record(item["key"])
        items.append({
            "key": item["key"],
            "group": item["group"],
            "label": item["label"],
            "status": "passed" if record else "manual_browser",
            "base_url": base_url,
            "viewports": scenario.get("viewports", ["1440x900"]),
            "pages": [base_url.rstrip("/") + page for page in scenario.get("pages", ["/index.html"])],
            "steps": scenario.get("steps", [item["evidence"]]),
            "expected": scenario.get("expected", item["evidence"]),
            "result": "passed" if record else "pending",
            "evidence_notes": record.get("evidence_note", "") if record else "",
            "checked_at": record.get("checked_at", "") if record else "",
            "source_labels": record.get("source_labels", []) if record else [],
        })
    return {
        "format": "tfse_browser_acceptance_report",
        "source": "tools/acceptance_audit.py browser items",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "base_url": base_url,
        "pending_count": len([item for item in items if item["result"] != "passed"]),
        "items": items,
    }


def markdown(report):
    lines = [
        "# TFSE Browser Acceptance Report",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Base URL: `{report['base_url']}`",
        f"- Pending browser items: `{report['pending_count']}`",
        "",
        "Run local preview before testing:",
        "",
        "```sh",
        "python3 -m http.server 4173",
        "```",
        "",
        "Optional automated smoke test for form, Admin CRM and mobile overflow:",
        "",
        "```sh",
        "NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs",
        "```",
        "",
    ]
    for item in report["items"]:
        lines.extend([
            f"## {item['label']}",
            "",
            f"- Key: `{item['key']}`",
            f"- Group: `{item['group']}`",
            f"- Status: `{item['status']}`",
            f"- Result: `{item['result']}`",
            f"- Viewports: `{', '.join(item['viewports'])}`",
            f"- Checked at: `{item.get('checked_at', '') or '-'}`",
            "- Pages:",
        ])
        lines.extend(f"  - {page}" for page in item["pages"])
        lines.append("- Steps:")
        lines.extend(f"  {index}. {step}" for index, step in enumerate(item["steps"], 1))
        lines.extend([
            f"- Expected: {item['expected']}",
            "- Evidence notes:",
            f"  - {item.get('evidence_notes', '') or ''}",
            "",
        ])
    return "\n".join(lines)


def main():
    base_url = DEFAULT_BASE_URL
    if "--base-url" in sys.argv:
        index = sys.argv.index("--base-url")
        if index + 1 >= len(sys.argv):
            print("--base-url requires a value", file=sys.stderr)
            return 2
        base_url = sys.argv[index + 1]
    report = build_report(base_url)
    if "--markdown" in sys.argv:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
