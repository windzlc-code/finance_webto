#!/usr/bin/env python3
from __future__ import annotations

import json
import socket
import sys
from urllib.parse import urlparse

import live_deployment_check
import site_config_tooling


FORMAT = "tfse_https_ingress_fix_package"
STATUS = "pending_external_network_fix"


def tcp_probe(host, port, timeout=6.0):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return {"port": port, "ok": True, "error": ""}
    except OSError as error:
        return {"port": port, "ok": False, "error": f"{type(error).__name__}: {error}"}


def build_report():
    site_config = site_config_tooling.load_site_config()
    configured_url = str(site_config.get("base_url") or live_deployment_check.DEFAULT_HTTPS_URL).rstrip("/") + "/"
    https_url = configured_url.replace("http://", "https://", 1)
    http_url = https_url.replace("https://", "http://", 1)
    host = urlparse(https_url).netloc
    tcp_checks = [tcp_probe(host, port) for port in (22, 80, 443)]
    tcp_by_port = {item["port"]: item for item in tcp_checks}
    live_report = live_deployment_check.build_report(http_url, https_url, timeout=8.0)
    https_check = next((item for item in live_report["checks"] if item["name"] == "https_home"), {})
    blocker = next((item for item in live_report.get("external_blockers", []) if item["key"] == "https_public_ingress"), {})
    return {
        "format": FORMAT,
        "status": "ready_for_https_verification" if live_report["summary"]["https_ok"] else STATUS,
        "generated_at": site_config_tooling.now_iso(),
        "http_url": http_url,
        "https_url": https_url,
        "host": host,
        "tcp_checks": tcp_checks,
        "current_evidence": {
            "http_required_ok": live_report["summary"]["required_ok"],
            "https_ok": live_report["summary"]["https_ok"],
            "tcp_22_ok": tcp_by_port.get(22, {}).get("ok", False),
            "tcp_80_ok": tcp_by_port.get(80, {}).get("ok", False),
            "tcp_443_ok": tcp_by_port.get(443, {}).get("ok", False),
            "https_status": https_check.get("status", 0),
            "https_error": https_check.get("error", ""),
            "external_blocker": blocker.get("label", ""),
        },
        "diagnosis_order": [
            "DNS A/AAAA 記錄指向目前部署主機，且 www 與裸域策略一致。",
            "雲廠商安全組 / 防火牆 inbound 已開放 TCP 443，來源至少包含 0.0.0.0/0 與 ::/0。",
            "主機防火牆已允許 443，例如 ufw allow 443/tcp 或等效規則。",
            "Nginx / Caddy / Cloudflare Tunnel / 反向代理已綁定 server_name 並 listen 443 ssl。",
            "TLS 憑證覆蓋 www.tfse-fcc.com，憑證鏈完整且未過期。",
            "443 代理到正確前端與 /api/health，且安全標頭與 cache 策略與 HTTP 檢查一致。",
        ],
        "server_commands": [
            "sudo ss -ltnp | grep ':443'",
            "sudo nginx -t",
            "sudo systemctl status nginx --no-pager",
            "sudo ufw status verbose",
            "sudo certbot certificates",
            "curl -I --max-time 10 https://www.tfse-fcc.com/",
            "curl -I --max-time 10 https://www.tfse-fcc.com/tfse/",
            "curl -I --max-time 10 https://www.tfse-fcc.com/admin/",
            "curl -sS --max-time 10 https://www.tfse-fcc.com/api/health",
            "curl -I -X OPTIONS --max-time 10 https://www.tfse-fcc.com/api/bank-club/leads",
            "curl -i --max-time 10 https://www.tfse-fcc.com/api/admin/bank-club/leads",
        ],
        "local_verification_commands": [
            "python3 tools/live_deployment_check.py --markdown",
            "python3 tools/live_deployment_check.py --markdown --strict-https",
            "python3 tools/security_headers_deployment_check.py --markdown",
            "python3 tools/host_fallback_deployment_check.py --markdown",
        ],
        "evidence_fields": [
            "cloud_firewall_rule_id",
            "server_firewall_status",
            "reverse_proxy_config_path",
            "certificate_subject",
            "certificate_expires_at",
            "curl_https_home_status",
            "curl_api_health_status",
            "live_deployment_check_result",
            "reviewer_role",
            "checked_at",
        ],
        "rollback_note": "若開放 443 後首頁、API 或安全標頭異常，先回復反代配置到上一版，保留 HTTP 可訪問性，再逐項檢查憑證與 upstream。",
        "related_exports": [
            "tfse_live_deployment_check",
            "tfse_domain_cutover_package",
            "tfse_host_fallback_deployment_check",
            "tfse_security_headers_deployment_check",
            "tfse_external_verification_evidence",
        ],
    }


def markdown(report):
    lines = [
        "# TFSE HTTPS Ingress Fix Package",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Status: `{report['status']}`",
        f"- HTTPS URL: `{report['https_url']}`",
        f"- HTTP required checks OK: `{report['current_evidence']['http_required_ok']}`",
        f"- HTTPS OK: `{report['current_evidence']['https_ok']}`",
        f"- HTTPS error: `{report['current_evidence']['https_error'] or '-'}`",
        f"- TCP 22 OK: `{report['current_evidence']['tcp_22_ok']}`",
        f"- TCP 80 OK: `{report['current_evidence']['tcp_80_ok']}`",
        f"- TCP 443 OK: `{report['current_evidence']['tcp_443_ok']}`",
        "",
        "## TCP Checks",
        "",
        "| Port | OK | Error |",
        "| --- | --- | --- |",
    ]
    for item in report["tcp_checks"]:
        lines.append(f"| {item['port']} | {item['ok']} | {item['error'] or '-'} |")
    lines.extend([
        "",
        "## Diagnosis Order",
        "",
    ])
    lines.extend(f"{index}. {item}" for index, item in enumerate(report["diagnosis_order"], 1))
    lines.extend(["", "## Server Commands", ""])
    lines.extend(f"- `{item}`" for item in report["server_commands"])
    lines.extend(["", "## Local Verification Commands", ""])
    lines.extend(f"- `{item}`" for item in report["local_verification_commands"])
    lines.extend(["", "## Evidence Fields", ""])
    lines.extend(f"- `{item}`" for item in report["evidence_fields"])
    lines.extend(["", "## Rollback Note", "", report["rollback_note"]])
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
