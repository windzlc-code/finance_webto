#!/usr/bin/env python3
import json
import sys

import admin_queue_tooling


FORMAT = "tfse_server_event_replay_queue"


def build_report():
    return admin_queue_tooling.server_event_replay_queue_report()


def markdown(report):
    return "\n".join([
        "# TFSE Server Event Replay Queue",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Queued events: `{report['counts']['queued_events']}`",
        f"- Missing required event names: `{report['counts']['missing_required_event_names']}`",
    ])


def main():
    report = build_report()
    if "--markdown" in sys.argv:
        print(markdown(report))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
