from pathlib import Path
import json
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "backend-schema.sql"
CONTRACT = ROOT / "api-contract.json"

REQUIRED_TABLES = {
    "admin_users",
    "admin_sessions",
    "admin_auth_cutover_checks",
    "admin_security_matrices",
    "security_headers_deployment_checks",
    "institutions",
    "institution_source_versions",
    "financial_products",
    "articles",
    "lead_forms",
    "lead_contact_logs",
    "lead_dedupe_queues",
    "crm_api_persistence_packages",
    "privacy_request_tasks",
    "data_retention_purge_plans",
    "privacy_fulfillment_verification_packages",
    "lead_events",
    "line_segment_tasks",
    "line_oa_setup_packages",
    "line_optout_complaint_tasks",
    "line_optout_api_verification_packages",
    "retrospective_reports",
    "tracking_consent_audits",
    "utm_attribution_reports",
    "server_event_replay_batches",
    "monitoring_receipt_checklists",
    "sentry_error_verification_packages",
    "analytics_debug_verification_packages",
    "ad_campaign_checklists",
    "conversion_optimization_backlogs",
    "launch_health_checks",
    "release_readiness_packages",
    "operations_task_snapshots",
    "incident_response_packages",
    "seo_submission_packages",
    "search_console_verification_packages",
    "seo_indexing_followup_queues",
    "production_config_readiness",
    "site_config_update_packages",
    "site_config_approval_packages",
    "production_env_templates",
    "domain_cutover_packages",
    "host_fallback_deployment_checks",
    "backend_acceptance_matrices",
    "acceptance_checklists",
    "external_verification_evidence",
    "browser_acceptance_reports",
    "legal_compliance_review_packages",
    "legal_external_review_evidence",
    "compliance_api_persistence_packages",
    "form_risk_control_reports",
    "turnstile_backend_verification_packages",
    "source_review_tasks",
    "source_verification_evidence",
    "institution_import_verification_packages",
    "public_feedback_tickets",
    "public_feedback_api_verification_packages",
    "content_version_snapshots",
    "content_api_cutover_packages",
    "compliance_reviews",
    "audit_logs",
    "backup_jobs",
    "backup_restore_drill_results",
    "backup_restore_drill_plans",
    "backup_receipt_verification_packages",
    "migration_packages",
    "import_validation_packages",
    "line_oa_handoff_checks",
}

LEAD_FORM_FIELDS = {
    "display_name",
    "phone_encrypted",
    "phone_last3",
    "line_id_encrypted",
    "region",
    "needs",
    "occupation_type",
    "income_type",
    "message_encrypted",
    "consent_privacy",
    "consent_line",
    "consent_version",
    "source_url",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "device_id",
    "tags",
    "status",
    "assigned_to",
    "follow_up_priority",
    "next_follow_up_at",
    "submitted_at",
    "updated_at",
}


def table_block(sql, name):
    pattern = re.compile(rf"create table {re.escape(name)} \((.*?)\);\n", re.IGNORECASE | re.DOTALL)
    match = pattern.search(sql)
    return match.group(1) if match else ""


def column_names(block):
    names = set()
    for line in block.splitlines():
        stripped = line.strip().rstrip(",")
        if not stripped or stripped.startswith("constraint "):
            continue
        names.add(stripped.split()[0])
    return names


def endpoint_paths():
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    return {(item.get("method"), item.get("path")) for item in contract.get("endpoints", [])}


def main():
    sql = SCHEMA.read_text(encoding="utf-8")
    failures = []
    for table in sorted(REQUIRED_TABLES):
        if f"create table {table}" not in sql:
            failures.append(f"backend-schema.sql: missing table {table}")

    lead_block = table_block(sql, "lead_forms")
    lead_columns = column_names(lead_block)
    for field in sorted(LEAD_FORM_FIELDS - lead_columns):
        failures.append(f"backend-schema.sql: lead_forms missing column {field}")
    for marker in ("phone_encrypted", "line_id_encrypted", "message_encrypted"):
        if marker not in lead_columns:
            failures.append(f"backend-schema.sql: sensitive lead field should use {marker}")
    if "constraint lead_privacy_consent_required check (consent_privacy = true)" not in lead_block:
        failures.append("backend-schema.sql: lead_forms must enforce privacy consent")

    for table in ("privacy_request_tasks", "line_segment_tasks"):
        block = table_block(sql, table)
        if "lead_id uuid not null references lead_forms(id)" not in block:
            failures.append(f"backend-schema.sql: {table} must reference lead_forms")

    mutating_admin = {
        ("PATCH", "/api/admin/leads/:id/status"): ("lead_forms", "audit_logs"),
        ("PATCH", "/api/admin/privacy-requests/:lead_id"): ("privacy_request_tasks", "audit_logs"),
        ("POST", "/api/admin/compliance/review"): ("compliance_reviews", "audit_logs"),
        ("POST", "/api/admin/articles/:id/review"): ("articles", "audit_logs"),
    }
    paths = endpoint_paths()
    for endpoint, required_tables in mutating_admin.items():
        if endpoint not in paths:
            failures.append(f"api-contract.json: missing endpoint {endpoint[0]} {endpoint[1]}")
        for table in required_tables:
            if f"create table {table}" not in sql:
                failures.append(f"backend-schema.sql: endpoint {endpoint[1]} requires table {table}")

    for index_name in (
        "idx_financial_products_slug",
        "idx_articles_slug",
        "idx_institutions_seed_id",
        "idx_institution_source_versions_institution",
        "idx_lead_forms_status",
        "idx_lead_forms_submitted_at",
        "idx_crm_api_persistence_packages_status",
        "idx_privacy_request_tasks_status",
        "idx_data_retention_purge_plans_status",
        "idx_privacy_fulfillment_verification_packages_status",
        "idx_line_optout_api_verification_packages_status",
        "idx_legal_external_review_evidence_status",
        "idx_compliance_api_persistence_packages_status",
        "idx_admin_auth_cutover_checks_status",
        "idx_turnstile_backend_verification_packages_status",
        "idx_site_config_approval_packages_status",
        "idx_security_headers_deployment_checks_status",
        "idx_host_fallback_deployment_checks_status",
        "idx_search_console_verification_packages_status",
        "idx_line_oa_handoff_checks_status",
        "idx_sentry_error_verification_packages_status",
        "idx_institution_import_verification_packages_status",
        "idx_public_feedback_api_verification_packages_status",
        "idx_analytics_debug_verification_packages_status",
        "idx_backup_jobs_status_finished_at",
        "idx_backup_restore_drill_results_completed_at",
        "idx_backup_receipt_verification_packages_status",
        "idx_content_api_cutover_packages_status",
        "idx_audit_logs_action_created_at",
    ):
        if index_name not in sql:
            failures.append(f"backend-schema.sql: missing index {index_name}")

    if failures:
        for failure in failures:
            print(failure)
        return 1
    print("backend schema audit passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
