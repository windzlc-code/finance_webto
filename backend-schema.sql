-- TFSE production backend schema draft.
-- This file maps the static MVP JSON/localStorage model to PostgreSQL tables.
-- Sensitive fields should be encrypted by the application or a managed secrets/KMS layer.

create extension if not exists pgcrypto;

create type institution_type as enum ('bank', 'finance_company', 'credit_union', 'government', 'legal_resource', 'other');
create type source_status as enum ('source_pending', 'verified', 'needs_update', 'rejected', 'archived');
create type product_type as enum ('bank', 'finance_company', 'credit_union', 'legal_resource');
create type product_category as enum ('mortgage', 'credit_loan', 'vehicle', 'installment', 'credit_union', 'debt_law', 'insurance_finance', 'anti_fraud');
create type product_status as enum ('source_pending', 'verified', 'legal_info', 'public_notice', 'needs_update', 'archived');
create type article_status as enum ('draft', 'in_review', 'published', 'archived');
create type lead_status as enum ('new', 'contacted', 'info_sent', 'consulted', 'unresponsive', 'spam', 'closed');
create type privacy_request_type as enum ('delete', 'correction');
create type privacy_request_status as enum ('pending', 'completed', 'rejected');
create type line_sync_status as enum ('pending', 'exported', 'synced', 'failed');
create type review_status as enum ('pending', 'approved', 'needs_revision', 'rejected');
create type compliance_entity_type as enum ('page', 'article', 'product', 'ad');
create type backup_status as enum ('success', 'failed', 'running');
create type admin_role as enum ('super_admin', 'consultant', 'viewer', 'content_editor', 'data_manager', 'compliance_reviewer');

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  role admin_role not null default 'viewer',
  password_hash text not null,
  mfa_enabled boolean not null default false,
  status text not null default 'active',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references admin_users(id) on delete cascade,
  session_hash text not null unique,
  csrf_token_hash text not null,
  user_agent_hash text,
  ip_hash text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table admin_auth_cutover_checks (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_formal_api_configuration',
  backend_mode text not null default 'localStorage',
  api_base_url_configured boolean not null default false,
  endpoints jsonb not null default '[]'::jsonb,
  schema_tables text[] not null default '{}',
  required_controls text[] not null default '{}',
  cutover_steps text[] not null default '{}',
  evidence_fields text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table admin_security_matrices (
  id uuid primary key default gen_random_uuid(),
  roles jsonb not null default '[]'::jsonb,
  checks jsonb not null default '[]'::jsonb,
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table security_headers_deployment_checks (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'requires_formal_host_verification',
  source_files text[] not null default '{}',
  expected_headers text[] not null default '{}',
  csp_allowlist text[] not null default '{}',
  critical_urls text[] not null default '{}',
  host_notes text[] not null default '{}',
  verification_commands text[] not null default '{}',
  evidence_fields text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table institutions (
  id uuid primary key default gen_random_uuid(),
  seed_id text unique,
  name text not null,
  type institution_type not null,
  type_label text not null,
  region text not null,
  official_url text not null,
  registry_ref text not null,
  status source_status not null default 'source_pending',
  summary text not null,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table institution_source_versions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete cascade,
  source_url text not null,
  registry_ref text not null,
  verification_status source_status not null default 'source_pending',
  evidence_summary text not null default '',
  reviewer_role admin_role,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table financial_products (
  id uuid primary key default gen_random_uuid(),
  seed_id text unique,
  institution_id uuid references institutions(id) on delete set null,
  slug text not null unique,
  title text not null,
  type product_type not null,
  type_label text not null,
  category product_category not null,
  category_label text not null,
  audience text not null,
  region text not null,
  source_title text not null,
  source_url text not null,
  status product_status not null default 'source_pending',
  summary text not null,
  checks jsonb not null default '[]'::jsonb,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table articles (
  id uuid primary key default gen_random_uuid(),
  seed_id text unique,
  slug text not null unique,
  title text not null,
  category text not null,
  status article_status not null default 'draft',
  body text,
  summary text not null,
  seo_title text not null,
  seo_description text not null,
  keywords text[] not null default '{}',
  compliance_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table lead_forms (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  phone_encrypted text not null,
  phone_last3 text not null,
  line_id_encrypted text,
  region text,
  needs text not null,
  occupation_type text,
  income_type text,
  message_encrypted text,
  consent_privacy boolean not null,
  consent_line boolean not null default false,
  consent_version text not null,
  source_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  device_id text,
  tags text[] not null default '{}',
  status lead_status not null default 'new',
  assigned_to text,
  follow_up_priority text not null default 'normal',
  next_follow_up_at date,
  delete_requested boolean not null default false,
  privacy_request_type privacy_request_type,
  privacy_request_status privacy_request_status,
  privacy_requested_at timestamptz,
  privacy_completed_at timestamptz,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_privacy_consent_required check (consent_privacy = true)
);

create table privacy_request_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references lead_forms(id) on delete cascade,
  request_type privacy_request_type not null,
  request_status privacy_request_status not null default 'pending',
  phone_last3 text not null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  handled_by uuid,
  audit_log_id uuid
);

create table data_retention_purge_plans (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'draft',
  review_frequency text not null default 'monthly',
  summary jsonb not null default '{}'::jsonb,
  retention_rules jsonb not null default '[]'::jsonb,
  purge_candidates jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now(),
  executed_by uuid,
  executed_at timestamptz,
  audit_log_id uuid
);

create table privacy_fulfillment_verification_packages (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_privacy_fulfillment',
  backend_target jsonb not null default '{}'::jsonb,
  local_context jsonb not null default '{}'::jsonb,
  required_controls text[] not null default '{}',
  test_cases jsonb not null default '[]'::jsonb,
  evidence_fields text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table lead_contact_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references lead_forms(id) on delete cascade,
  channel text not null,
  outcome text not null,
  next_action text not null,
  note_summary text,
  next_follow_up_at date,
  handled_by uuid,
  handled_by_role text,
  contacted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table lead_dedupe_queues (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null,
  phone_last3 text not null,
  needs text not null,
  suggested_primary_lead_id uuid references lead_forms(id) on delete set null,
  candidate_lead_ids uuid[] not null default '{}',
  dedupe_policy jsonb not null default '{}'::jsonb,
  recommended_action text not null,
  status text not null default 'pending_review',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table crm_api_persistence_packages (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_crm_api_persistence',
  backend_target jsonb not null default '{}'::jsonb,
  local_context jsonb not null default '{}'::jsonb,
  required_controls text[] not null default '{}',
  test_cases jsonb not null default '[]'::jsonb,
  evidence_fields text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references lead_forms(id) on delete set null,
  name text not null,
  path text,
  url text,
  referrer text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table line_segment_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references lead_forms(id) on delete cascade,
  line_id_encrypted text,
  tags text[] not null default '{}',
  sync_status line_sync_status not null default 'pending',
  exported_at timestamptz,
  synced_at timestamptz,
  consent_version text not null
);

create table line_oa_setup_packages (
  id uuid primary key default gen_random_uuid(),
  line_oa_url text,
  welcome_messages jsonb not null default '[]'::jsonb,
  rich_menu jsonb not null default '[]'::jsonb,
  quick_replies jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  reply_principles jsonb not null default '[]'::jsonb,
  segment_sync_queue jsonb not null default '[]'::jsonb,
  compliance_boundaries jsonb not null default '[]'::jsonb,
  records jsonb not null default '[]'::jsonb,
  record_summary jsonb not null default '{}'::jsonb,
  setup_steps jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table line_oa_handoff_checks (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_line_oa_handoff',
  line_oa_url text,
  official_url_ready boolean not null default false,
  source_files text[] not null default '{}',
  cta_routes jsonb not null default '[]'::jsonb,
  quick_reply_checks jsonb not null default '[]'::jsonb,
  handoff_steps text[] not null default '{}',
  evidence_fields text[] not null default '{}',
  compliance_boundaries text[] not null default '{}',
  records jsonb not null default '[]'::jsonb,
  record_summary jsonb not null default '{}'::jsonb,
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table line_optout_complaint_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references lead_forms(id) on delete set null,
  request_type text not null default 'line_optout',
  status text not null default 'pending_review',
  phone_last3 text,
  line_user_id_hash text,
  intake_keyword text,
  evidence_fields jsonb not null default '{}'::jsonb,
  handling_steps jsonb not null default '[]'::jsonb,
  related_exports jsonb not null default '[]'::jsonb,
  assigned_to uuid references admin_users(id),
  requested_at timestamptz not null default now(),
  handled_at timestamptz
);

create table line_optout_api_verification_packages (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_line_optout_api_verification',
  backend_target jsonb not null default '{}'::jsonb,
  local_context jsonb not null default '{}'::jsonb,
  required_controls text[] not null default '{}',
  test_cases jsonb not null default '[]'::jsonb,
  evidence_fields text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid references admin_users(id),
  generated_at timestamptz not null default now()
);

create table retrospective_reports (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  source_mode text not null,
  funnel jsonb not null default '{}'::jsonb,
  engagement jsonb not null default '{}'::jsonb,
  lead_summary jsonb not null default '{}'::jsonb,
  top_paths jsonb not null default '[]'::jsonb,
  quality jsonb not null default '{}'::jsonb,
  next_actions text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table tracking_consent_audits (
  id uuid primary key default gen_random_uuid(),
  consent_status text not null default 'unset',
  consent_record jsonb,
  external_destinations jsonb not null default '{}'::jsonb,
  event_counts jsonb not null default '{}'::jsonb,
  policy jsonb not null default '{}'::jsonb,
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table utm_attribution_reports (
  id uuid primary key default gen_random_uuid(),
  period_start date,
  period_end date,
  source_mode text not null default 'localStorage',
  summary jsonb not null default '{}'::jsonb,
  campaigns jsonb not null default '[]'::jsonb,
  next_actions text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table server_event_replay_batches (
  id uuid primary key default gen_random_uuid(),
  source_mode text not null default 'localStorage',
  destinations jsonb not null default '{}'::jsonb,
  counts jsonb not null default '{}'::jsonb,
  event_name_counts jsonb not null default '[]'::jsonb,
  missing_required_event_names text[] not null default '{}',
  queue jsonb not null default '[]'::jsonb,
  replay_steps text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table ad_campaign_checklists (
  id uuid primary key default gen_random_uuid(),
  landing_slug text not null,
  landing_url text not null,
  utm_example text not null,
  checks text[] not null default '{}',
  review_status review_status not null default 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  generated_at timestamptz not null default now()
);

create table conversion_optimization_backlogs (
  id uuid primary key default gen_random_uuid(),
  source_reports text[] not null default '{}',
  summary jsonb not null default '{}'::jsonb,
  experiment_rules text[] not null default '{}',
  items jsonb not null default '[]'::jsonb,
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table launch_health_checks (
  id uuid primary key default gen_random_uuid(),
  ready_count integer not null default 0,
  pending_count integer not null default 0,
  items jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table launch_cutover_audits (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'LAUNCH_CHECKLIST external cutover section',
  generated_from text[] not null default '{}',
  counts jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table launch_execution_plans (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'launchCutoverAuditPayload',
  summary jsonb not null default '{}'::jsonb,
  waves jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table launch_countdown_plans (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'launchCutoverAuditPayload',
  summary jsonb not null default '{}'::jsonb,
  slots jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table monitoring_receipt_checklists (
  id uuid primary key default gen_random_uuid(),
  destinations jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  required_events text[] not null default '{}',
  missing_required_events text[] not null default '{}',
  receipt_checks text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table sentry_error_verification_packages (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_sentry_error_verification',
  destinations jsonb not null default '{}'::jsonb,
  required_controls text[] not null default '{}',
  test_cases jsonb not null default '[]'::jsonb,
  recent_local_errors jsonb not null default '[]'::jsonb,
  evidence_fields text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table institution_import_verification_packages (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_institution_import_verification',
  source_file text not null default 'assets/data/institutions.json',
  target_tables text[] not null default '{}',
  counts jsonb not null default '{}'::jsonb,
  status_counts jsonb not null default '{}'::jsonb,
  import_rows jsonb not null default '[]'::jsonb,
  stale_or_unverified_items jsonb not null default '[]'::jsonb,
  validation_steps text[] not null default '{}',
  evidence_fields text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table analytics_debug_verification_packages (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_analytics_debug_verification',
  destinations jsonb not null default '{}'::jsonb,
  event_mappings jsonb not null default '[]'::jsonb,
  debug_steps text[] not null default '{}',
  evidence_fields text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table site_config_update_packages (
  id uuid primary key default gen_random_uuid(),
  target_file text not null default 'site-config.json',
  status text not null default 'needs_revision',
  draft_keys text[] not null default '{}',
  validation jsonb not null default '{}'::jsonb,
  patch jsonb not null default '{}'::jsonb,
  current_config_summary jsonb not null default '{}'::jsonb,
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table site_config_approval_packages (
  id uuid primary key default gen_random_uuid(),
  target_file text not null default 'site-config.json',
  status text not null default 'needs_revision_before_approval',
  approval_policy jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  pending_services jsonb not null default '[]'::jsonb,
  draft_package jsonb not null default '{}'::jsonb,
  approval_checklist text[] not null default '{}',
  post_merge_commands text[] not null default '{}',
  required_external_evidence text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table production_env_templates (
  id uuid primary key default gen_random_uuid(),
  configured_count integer not null default 0,
  pending_count integer not null default 0,
  secret_count integer not null default 0,
  target_files text[] not null default '{}',
  validation_commands text[] not null default '{}',
  items jsonb not null default '[]'::jsonb,
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table formal_config_input_packets (
  id uuid primary key default gen_random_uuid(),
  ready_count integer not null default 0,
  pending_count integer not null default 0,
  conditional_pending_count integer not null default 0,
  required_inputs jsonb not null default '[]'::jsonb,
  conditional_inputs jsonb not null default '[]'::jsonb,
  secret_only_inputs jsonb not null default '[]'::jsonb,
  records jsonb not null default '[]'::jsonb,
  record_summary jsonb not null default '{}'::jsonb,
  owner_handoff jsonb not null default '[]'::jsonb,
  site_config_patch_template jsonb not null default '{}'::jsonb,
  follow_up_commands text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table project_plan_coverage_reports (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'TFSE project plan chapters 1-23',
  ready_count integer not null default 0,
  local_ready_external_pending_count integer not null default 0,
  chapters jsonb not null default '[]'::jsonb,
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table plan_requirement_traces (
  id uuid primary key default gen_random_uuid(),
  plan_path text not null default 'TFSE金融独立站现成前端模板套用0-1完整项目计划.md',
  source text not null default 'TFSE project plan sections 17 and 21',
  counts jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table project_phase_audits (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'TFSE project plan phases 0-8',
  counts jsonb not null default '{}'::jsonb,
  external_pending text[] not null default '{}',
  phases jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table local_audit_matrices (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'LAUNCH_CHECKLIST / OPERATIONS_RUNBOOK local verification commands',
  summary jsonb not null default '{}'::jsonb,
  status_definitions jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table external_execution_packets (
  id uuid primary key default gen_random_uuid(),
  actionable_items integer not null default 0,
  ready_for_external_execution_count integer not null default 0,
  pending_human_review_count integer not null default 0,
  items jsonb not null default '[]'::jsonb,
  records jsonb not null default '[]'::jsonb,
  record_summary jsonb not null default '{}'::jsonb,
  follow_up_commands text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table launch_handoff_manifests (
  id uuid primary key default gen_random_uuid(),
  template_policy text not null default '',
  summary jsonb not null default '{}'::jsonb,
  recommended_sequence text[] not null default '{}',
  pending_config_inputs jsonb not null default '[]'::jsonb,
  external_execution_items jsonb not null default '[]'::jsonb,
  owner_handoff jsonb not null default '[]'::jsonb,
  checkpoint_records jsonb not null default '[]'::jsonb,
  required_commands text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table release_readiness_packages (
  id uuid primary key default gen_random_uuid(),
  release_scope jsonb not null default '{}'::jsonb,
  readiness jsonb not null default '{}'::jsonb,
  required_commands text[] not null default '{}',
  deployment_checks text[] not null default '{}',
  rollback_plan text[] not null default '{}',
  artifact_summary jsonb not null default '{}'::jsonb,
  blockers text[] not null default '{}',
  handoff_notes text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table operations_task_snapshots (
  id uuid primary key default gen_random_uuid(),
  status_counts jsonb not null default '{}'::jsonb,
  tasks jsonb not null default '[]'::jsonb,
  next_review_cycle text not null default 'weekly',
  runbook text not null default 'OPERATIONS_RUNBOOK.md',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table incident_response_packages (
  id uuid primary key default gen_random_uuid(),
  severity_hint text not null default 'no_active_local_error',
  signals jsonb not null default '{}'::jsonb,
  top_error_sources jsonb not null default '[]'::jsonb,
  recent_errors jsonb not null default '[]'::jsonb,
  severity_triggers jsonb not null default '{}'::jsonb,
  response_steps text[] not null default '{}',
  verification_commands text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table seo_submission_packages (
  id uuid primary key default gen_random_uuid(),
  base_url text not null,
  search_console jsonb not null default '{}'::jsonb,
  assets jsonb not null default '{}'::jsonb,
  counts jsonb not null default '{}'::jsonb,
  canonical_pages jsonb not null default '[]'::jsonb,
  dynamic_url_patterns jsonb not null default '[]'::jsonb,
  submission_steps text[] not null default '{}',
  blockers text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table search_console_verification_packages (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_search_console_verification',
  property jsonb not null default '{}'::jsonb,
  assets_to_regenerate text[] not null default '{}',
  validation_commands text[] not null default '{}',
  submission_targets jsonb not null default '{}'::jsonb,
  verification_steps text[] not null default '{}',
  url_inspection_samples jsonb not null default '[]'::jsonb,
  evidence_fields text[] not null default '{}',
  records jsonb not null default '[]'::jsonb,
  record_summary jsonb not null default '{}'::jsonb,
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table seo_indexing_followup_queues (
  id uuid primary key default gen_random_uuid(),
  format text not null default 'tfse_seo_indexing_followup_queue',
  base_url text not null,
  search_console_configured boolean not null default false,
  summary jsonb not null default '{}'::jsonb,
  evidence_fields jsonb not null default '[]'::jsonb,
  items jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  related_exports jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table production_config_readiness (
  id uuid primary key default gen_random_uuid(),
  ready_count integer not null default 0,
  pending_count integer not null default 0,
  items jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table domain_cutover_packages (
  id uuid primary key default gen_random_uuid(),
  base_url text not null,
  status text not null,
  summary jsonb not null default '{}'::jsonb,
  assets text[] not null default '{}',
  required_commands text[] not null default '{}',
  cutover_steps text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table host_fallback_deployment_checks (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'requires_formal_host_verification',
  source_files text[] not null default '{}',
  critical_routes jsonb not null default '[]'::jsonb,
  platform_notes text[] not null default '{}',
  verification_steps text[] not null default '{}',
  evidence_fields text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table backend_acceptance_matrices (
  id uuid primary key default gen_random_uuid(),
  backend_mode text not null default 'localStorage',
  api_base_url text not null default '',
  summary jsonb not null default '{}'::jsonb,
  endpoints jsonb not null default '[]'::jsonb,
  records jsonb not null default '[]'::jsonb,
  record_summary jsonb not null default '{}'::jsonb,
  required_validation text[] not null default '{}',
  source_documents text[] not null default '{}',
  related_exports text[] not null default '{}',
  blockers text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table backend_cutover_roadmaps (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'PRODUCTION_BACKEND_PLAN.md + admin acceptance exports',
  summary jsonb not null default '{}'::jsonb,
  priority_sequence jsonb not null default '[]'::jsonb,
  migration_order text[] not null default '{}',
  critical_endpoints jsonb not null default '[]'::jsonb,
  security_controls text[] not null default '{}',
  rehearsal_commands text[] not null default '{}',
  completion_gates text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table acceptance_checklists (
  id uuid primary key default gen_random_uuid(),
  ready_count integer not null default 0,
  pending_count integer not null default 0,
  status_counts jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table external_verification_evidence (
  id uuid primary key default gen_random_uuid(),
  summary jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  records jsonb not null default '[]'::jsonb,
  source_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table browser_acceptance_reports (
  id uuid primary key default gen_random_uuid(),
  base_url text not null,
  passed_count integer not null default 0,
  pending_count integer not null default 0,
  status_counts jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table legal_compliance_review_packages (
  id uuid primary key default gen_random_uuid(),
  status_counts jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  required_external_review jsonb not null default '[]'::jsonb,
  evidence_files jsonb not null default '[]'::jsonb,
  related_exports jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table legal_external_review_evidence (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_external_review',
  summary jsonb not null default '{}'::jsonb,
  required_external_review jsonb not null default '[]'::jsonb,
  evidence_package jsonb not null default '{}'::jsonb,
  signoff_requirements jsonb not null default '[]'::jsonb,
  open_items jsonb not null default '[]'::jsonb,
  records jsonb not null default '[]'::jsonb,
  related_exports jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table compliance_api_persistence_packages (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_compliance_api_persistence',
  backend_target jsonb not null default '{}'::jsonb,
  local_context jsonb not null default '{}'::jsonb,
  required_controls text[] not null default '{}',
  test_cases jsonb not null default '[]'::jsonb,
  evidence_fields text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table form_risk_control_reports (
  id uuid primary key default gen_random_uuid(),
  controls jsonb not null default '{}'::jsonb,
  counts jsonb not null default '{}'::jsonb,
  duplicate_groups jsonb not null default '[]'::jsonb,
  repeated_devices jsonb not null default '[]'::jsonb,
  risk_notes jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table turnstile_backend_verification_packages (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_turnstile_backend_verification',
  frontend_config jsonb not null default '{}'::jsonb,
  backend_target jsonb not null default '{}'::jsonb,
  required_controls text[] not null default '{}',
  negative_test_cases jsonb not null default '[]'::jsonb,
  validation_steps text[] not null default '{}',
  evidence_fields text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  form_risk_summary jsonb not null default '{}'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table source_review_tasks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references financial_products(id) on delete cascade,
  title text not null,
  status review_status not null default 'pending',
  reasons text[] not null default '{}',
  source_url text not null,
  last_product_updated_at date,
  assigned_role text not null default 'data_manager',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table source_verification_evidence (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references financial_products(id) on delete set null,
  product_seed_id text,
  result review_status not null,
  source_url text not null,
  evidence_note text,
  reviewer_role text,
  reviewed_by uuid,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public_feedback_tickets (
  id uuid primary key default gen_random_uuid(),
  feedback_type text not null,
  status text not null default 'pending_triage',
  page_url text,
  summary text not null,
  official_source_url text,
  source_updated_at date,
  reporter_contact_hash text,
  phone_last3 text,
  consent_contact boolean not null default false,
  assigned_role text not null default 'data_manager',
  related_task_type text,
  related_task_id uuid,
  evidence_note text,
  received_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public_feedback_api_verification_packages (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_public_feedback_api_verification',
  backend_target jsonb not null default '{}'::jsonb,
  local_context jsonb not null default '{}'::jsonb,
  required_controls text[] not null default '{}',
  test_cases jsonb not null default '[]'::jsonb,
  evidence_fields text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table content_version_snapshots (
  id uuid primary key default gen_random_uuid(),
  counts jsonb not null default '{}'::jsonb,
  product_overrides jsonb not null default '{}'::jsonb,
  product_status jsonb not null default '{}'::jsonb,
  article_overrides jsonb not null default '{}'::jsonb,
  article_status jsonb not null default '{}'::jsonb,
  faq_overrides jsonb not null default '{}'::jsonb,
  audit_trail jsonb not null default '[]'::jsonb,
  restore_order jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table content_api_cutover_packages (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_content_api_cutover',
  backend_target jsonb not null default '{}'::jsonb,
  seed_counts jsonb not null default '{}'::jsonb,
  content_state jsonb not null default '{}'::jsonb,
  required_api_checks jsonb not null default '[]'::jsonb,
  validation_steps text[] not null default '{}',
  evidence_fields text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table compliance_reviews (
  id uuid primary key default gen_random_uuid(),
  type compliance_entity_type not null,
  target text not null,
  result review_status not null,
  note text,
  scan_payload jsonb,
  reviewer_id uuid,
  reviewed_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  role text not null,
  action text not null,
  target text,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create table backup_jobs (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  status backup_status not null default 'running',
  storage_url text,
  checksum text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table backup_restore_drill_results (
  id uuid primary key default gen_random_uuid(),
  backup_job_id uuid references backup_jobs(id) on delete set null,
  restored_to text not null,
  row_count_checks jsonb not null default '{}'::jsonb,
  rpo_result text not null default '',
  rto_result text not null default '',
  sample_tables text[] not null default '{}',
  findings text not null default '',
  reviewer_role admin_role,
  completed_at timestamptz not null default now()
);

create table migration_packages (
  id uuid primary key default gen_random_uuid(),
  format text not null default 'tfse_formal_backend_migration_package',
  source_mode text not null,
  target_contract text not null,
  target_schema text not null,
  import_order jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  seed_data jsonb not null default '{}'::jsonb,
  local_state jsonb not null default '{}'::jsonb,
  review_queues jsonb not null default '{}'::jsonb,
  sensitive_data_policy jsonb not null default '[]'::jsonb,
  exported_by uuid,
  exported_at timestamptz not null default now()
);

create table import_validation_packages (
  id uuid primary key default gen_random_uuid(),
  source_package text not null,
  summary jsonb not null default '{}'::jsonb,
  import_checks text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table backup_restore_drill_plans (
  id uuid primary key default gen_random_uuid(),
  format text not null default 'tfse_backup_restore_drill_plan',
  status text not null,
  backend_mode text not null,
  api_base_url_configured boolean not null default false,
  rpo_rto jsonb not null default '{}'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  restore_steps jsonb not null default '[]'::jsonb,
  evidence_fields jsonb not null default '[]'::jsonb,
  local_mvp_reference jsonb not null default '{}'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  related_exports jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create table backup_receipt_verification_packages (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_backup_receipt_verification',
  backend_target jsonb not null default '{}'::jsonb,
  required_receipts jsonb not null default '[]'::jsonb,
  receipt_fields text[] not null default '{}',
  restore_drill_fields text[] not null default '{}',
  validation_steps text[] not null default '{}',
  latest_plan_status text not null default '',
  evidence_fields text[] not null default '{}',
  blockers text[] not null default '{}',
  related_exports text[] not null default '{}',
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create index idx_financial_products_slug on financial_products(slug);
create index idx_institutions_seed_id on institutions(seed_id);
create index idx_institution_source_versions_institution on institution_source_versions(institution_id, verified_at desc);
create index idx_financial_products_category on financial_products(category);
create index idx_financial_products_status on financial_products(status);
create index idx_articles_slug on articles(slug);
create index idx_articles_status on articles(status);
create index idx_lead_forms_status on lead_forms(status);
create index idx_lead_forms_follow_up on lead_forms(next_follow_up_at, follow_up_priority);
create index idx_lead_forms_submitted_at on lead_forms(submitted_at desc);
create index idx_lead_forms_utm_source on lead_forms(utm_source);
create index idx_lead_contact_logs_lead_contacted_at on lead_contact_logs(lead_id, contacted_at desc);
create index idx_lead_contact_logs_outcome on lead_contact_logs(outcome, contacted_at desc);
create index idx_lead_dedupe_queues_status on lead_dedupe_queues(status, generated_at desc);
create index idx_crm_api_persistence_packages_status on crm_api_persistence_packages(status, generated_at desc);
create index idx_privacy_request_tasks_status on privacy_request_tasks(request_status);
create index idx_data_retention_purge_plans_status on data_retention_purge_plans(status, generated_at desc);
create index idx_privacy_fulfillment_verification_packages_status on privacy_fulfillment_verification_packages(status, generated_at desc);
create index idx_lead_events_name_created_at on lead_events(name, created_at desc);
create index idx_line_segment_tasks_status on line_segment_tasks(sync_status);
create index idx_line_oa_setup_packages_generated_at on line_oa_setup_packages(generated_at desc);
create index idx_line_oa_handoff_checks_status on line_oa_handoff_checks(status, generated_at desc);
create index idx_line_optout_complaint_tasks_status on line_optout_complaint_tasks(status, requested_at desc);
create index idx_line_optout_api_verification_packages_status on line_optout_api_verification_packages(status, generated_at desc);
create index idx_content_api_cutover_packages_status on content_api_cutover_packages(status, generated_at desc);
create index idx_audit_logs_action_created_at on audit_logs(action, created_at desc);
create index idx_admin_users_role_status on admin_users(role, status);
create index idx_admin_sessions_user_expires_at on admin_sessions(admin_user_id, expires_at desc);
create index idx_admin_auth_cutover_checks_status on admin_auth_cutover_checks(status, generated_at desc);
create index idx_admin_security_matrices_generated_at on admin_security_matrices(generated_at desc);
create index idx_security_headers_deployment_checks_status on security_headers_deployment_checks(status, generated_at desc);
create index idx_tracking_consent_audits_generated_at on tracking_consent_audits(generated_at desc);
create index idx_server_event_replay_batches_generated_at on server_event_replay_batches(generated_at desc);
create index idx_monitoring_receipt_checklists_generated_at on monitoring_receipt_checklists(generated_at desc);
create index idx_sentry_error_verification_packages_status on sentry_error_verification_packages(status, generated_at desc);
create index idx_institution_import_verification_packages_status on institution_import_verification_packages(status, generated_at desc);
create index idx_analytics_debug_verification_packages_status on analytics_debug_verification_packages(status, generated_at desc);
create index idx_conversion_optimization_backlogs_generated_at on conversion_optimization_backlogs(generated_at desc);
create index idx_site_config_update_packages_generated_at on site_config_update_packages(generated_at desc);
create index idx_site_config_approval_packages_status on site_config_approval_packages(status, generated_at desc);
create index idx_production_env_templates_generated_at on production_env_templates(generated_at desc);
create index idx_formal_config_input_packets_generated_at on formal_config_input_packets(generated_at desc);
create index idx_project_plan_coverage_reports_generated_at on project_plan_coverage_reports(generated_at desc);
create index idx_plan_requirement_traces_generated_at on plan_requirement_traces(generated_at desc);
create index idx_project_phase_audits_generated_at on project_phase_audits(generated_at desc);
create index idx_local_audit_matrices_generated_at on local_audit_matrices(generated_at desc);
create index idx_external_execution_packets_generated_at on external_execution_packets(generated_at desc);
create index idx_launch_handoff_manifests_generated_at on launch_handoff_manifests(generated_at desc);
create index idx_launch_cutover_audits_generated_at on launch_cutover_audits(generated_at desc);
create index idx_launch_execution_plans_generated_at on launch_execution_plans(generated_at desc);
create index idx_launch_countdown_plans_generated_at on launch_countdown_plans(generated_at desc);
create index idx_release_readiness_packages_generated_at on release_readiness_packages(generated_at desc);
create index idx_operations_task_snapshots_generated_at on operations_task_snapshots(generated_at desc);
create index idx_incident_response_packages_generated_at on incident_response_packages(generated_at desc);
create index idx_seo_submission_packages_generated_at on seo_submission_packages(generated_at desc);
create index idx_search_console_verification_packages_status on search_console_verification_packages(status, generated_at desc);
create index idx_seo_indexing_followup_queues_generated_at on seo_indexing_followup_queues(generated_at desc);
create index idx_domain_cutover_packages_generated_at on domain_cutover_packages(generated_at desc);
create index idx_host_fallback_deployment_checks_status on host_fallback_deployment_checks(status, generated_at desc);
create index idx_backend_acceptance_matrices_generated_at on backend_acceptance_matrices(generated_at desc);
create index idx_backend_cutover_roadmaps_generated_at on backend_cutover_roadmaps(generated_at desc);
create index idx_external_verification_evidence_generated_at on external_verification_evidence(generated_at desc);
create index idx_migration_packages_exported_at on migration_packages(exported_at desc);
create index idx_import_validation_packages_generated_at on import_validation_packages(generated_at desc);
create index idx_backup_restore_drill_plans_generated_at on backup_restore_drill_plans(generated_at desc);
create index idx_backup_jobs_status_finished_at on backup_jobs(status, finished_at desc);
create index idx_backup_restore_drill_results_completed_at on backup_restore_drill_results(completed_at desc);
create index idx_backup_receipt_verification_packages_status on backup_receipt_verification_packages(status, generated_at desc);
create index idx_legal_compliance_review_packages_generated_at on legal_compliance_review_packages(generated_at desc);
create index idx_legal_external_review_evidence_status on legal_external_review_evidence(status, generated_at desc);
create index idx_compliance_api_persistence_packages_status on compliance_api_persistence_packages(status, generated_at desc);
create index idx_form_risk_control_reports_generated_at on form_risk_control_reports(generated_at desc);
create index idx_turnstile_backend_verification_packages_status on turnstile_backend_verification_packages(status, generated_at desc);
create index idx_source_review_tasks_status on source_review_tasks(status);
create index idx_source_verification_evidence_reviewed_at on source_verification_evidence(reviewed_at desc);
create index idx_source_verification_evidence_product_seed on source_verification_evidence(product_seed_id);
create index idx_public_feedback_tickets_status on public_feedback_tickets(status, received_at desc);
create index idx_public_feedback_api_verification_packages_status on public_feedback_api_verification_packages(status, generated_at desc);
