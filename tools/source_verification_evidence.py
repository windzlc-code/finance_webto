#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_source_verification_evidence"


def build_report():
    return admin_queue_tooling.source_verification_evidence_report()


def markdown(report):
    lines = [
        "# TFSE Source Verification Evidence",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Records: `{report['counts']['total']}`",
        f"- Queue snapshot: `{len(report['queue_snapshot'])}`",
        "",
        "## Counts",
        "",
        f"- Approved: `{report['counts']['approved']}`",
        f"- Needs revision: `{report['counts']['needs_revision']}`",
        f"- Rejected: `{report['counts']['rejected']}`",
    ]
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
