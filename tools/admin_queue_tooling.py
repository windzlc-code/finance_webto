from datetime import date
import re

import admin_cutover_tooling
import browser_acceptance_report
import release_tooling
import seo_tracking_tooling
import site_config_tooling
import source_freshness_audit


def source_mode():
    return site_config_tooling.load_site_config().get("backend", {}).get("mode", "localStorage")


def seed_items(key, sort_fields=None):
    items = site_config_tooling.load_admin_record_seed_records(key)
    if not isinstance(items, list):
        return []
    normalized = [item for item in items if isinstance(item, dict)]
    fields = sort_fields or ("updated_at", "submitted_at", "checked_at", "generated_at")
    return sorted(
        normalized,
        key=lambda item: " ".join(str(item.get(field, "")) for field in fields),
        reverse=True,
    )


def leads():
    return seed_items("leads")


def public_feedback_tickets():
    return seed_items("public_feedback_tickets", ("received_at", "created_at", "checked_at"))


def admin_audit():
    return seed_items("admin_audit", ("at", "checked_at"))


def events():
    return seed_items("events", ("created_at", "sent_at", "timestamp"))


def errors():
    return seed_items("errors", ("at", "created_at"))


def compliance_reviews():
    return seed_items("compliance_reviews", ("reviewed_at", "created_at"))


def phone_last3(phone):
    digits = re.sub(r"\D", "", str(phone or ""))
    return digits[-3:] if digits else ""


def days_since(value):
    parsed = source_freshness_audit.parse_date(value or "")
    if not parsed:
        return None
    return (date.today() - parsed).days


def group_count(items, getter):
    counts = {}
    for item in items:
        key = getter(item) or "unknown"
        counts[key] = counts.get(key, 0) + 1
    return counts


def sort_count_map(map_obj):
    return sorted(
        [{"key": key, "count": value} for key, value in map_obj.items()],
        key=lambda item: (-item["count"], str(item["key"])),
    )


def top_count_items(map_obj, limit=5):
    return sort_count_map(map_obj)[:limit]


def conversion_rate(numerator, denominator):
    if not denominator:
        return 0
    return round((numerator / denominator) * 100, 2)


def count_events(records, name):
    return sum(1 for record in records if record.get("name") == name)


def attribution_key(parts):
    return "|".join([
        parts.get("source") or "direct",
        parts.get("medium") or "none",
        parts.get("campaign") or "none",
        parts.get("content") or "none",
        parts.get("term") or "none",
    ])


def attribution_label(item):
    return " / ".join([
        item.get("utm_source") or "direct",
        item.get("utm_medium") or "none",
        item.get("utm_campaign") or "none",
    ])


def make_attribution_bucket(parts):
    return {
        "utm_source": parts.get("source") or "direct",
        "utm_medium": parts.get("medium") or "",
        "utm_campaign": parts.get("campaign") or "",
        "utm_content": parts.get("content") or "",
        "utm_term": parts.get("term") or "",
        "landing_page_views": 0,
        "free_check_cta_clicks": 0,
        "form_submits": 0,
        "line_clicks": 0,
        "leads": 0,
        "needs": {},
        "statuses": {},
        "pages": {},
    }


def event_attribution_parts(event):
    payload = event.get("payload") or {}
    return {
        "source": event.get("utm_source") or payload.get("utm_source") or payload.get("source") or "",
        "medium": event.get("utm_medium") or payload.get("utm_medium") or "",
        "campaign": event.get("utm_campaign") or payload.get("utm_campaign") or "",
        "content": event.get("utm_content") or payload.get("utm_content") or "",
        "term": event.get("utm_term") or payload.get("utm_term") or "",
    }


def lead_attribution_parts(lead):
    return {
        "source": lead.get("utm_source") or lead.get("source_channel") or "direct",
        "medium": lead.get("utm_medium") or "",
        "campaign": lead.get("utm_campaign") or "",
        "content": lead.get("utm_content") or "",
        "term": lead.get("utm_term") or "",
    }


def source_review_queue_report():
    today = date.today()
    items = []
    for product in admin_cutover_tooling.products():
        reasons = []
        updated_at = source_freshness_audit.parse_date(product.get("updated_at", ""))
        if product.get("status") in source_freshness_audit.PENDING_PRODUCT_STATUSES:
            reasons.append(product.get("status"))
        if (
            product.get("source_url") == source_freshness_audit.PLACEHOLDER_SOURCE
            and product.get("id") not in source_freshness_audit.POLICY_PRODUCT_IDS
        ):
            reasons.append("需補官方來源連結")
        if updated_at:
            age = (today - updated_at).days
            if age > source_freshness_audit.REVIEW_CYCLE_DAYS:
                reasons.append("超過 90 天未更新")
        else:
            reasons.append("updated_at_invalid")
        if reasons:
            items.append({
                "item_type": "product",
                "id": product.get("id") or product.get("slug") or "",
                "title": product.get("title") or "",
                "status": product.get("status") or "",
                "source_url": product.get("source_url") or "",
                "updated_at": product.get("updated_at") or "",
                "reasons": reasons,
            })
    for institution in admin_cutover_tooling.institutions():
        reasons = []
        verified_at = source_freshness_audit.parse_date(institution.get("last_verified_at", ""))
        if institution.get("verification_status") in {"pending", "source_pending"}:
            reasons.append(institution.get("verification_status"))
        if institution.get("official_url") == source_freshness_audit.PLACEHOLDER_SOURCE:
            reasons.append("需補官方來源連結")
        if verified_at:
            age = (today - verified_at).days
            if age > 180 or institution.get("verification_status") != "verified":
                reasons.append("超過 180 天未核驗或尚未 verified")
        else:
            reasons.append("last_verified_at_invalid")
        if reasons:
            items.append({
                "item_type": "institution",
                "id": institution.get("id") or "",
                "title": institution.get("name") or "",
                "status": institution.get("verification_status") or "",
                "source_url": institution.get("official_url") or "",
                "updated_at": institution.get("last_verified_at") or "",
                "reasons": reasons,
            })
    return {
        "format": "tfse_source_review_queue",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "data_manager",
        "review_cycle_days": 90,
        "total": len(items),
        "items": items,
    }


def source_verification_evidence_report():
    queue = source_review_queue_report()
    seed = admin_cutover_tooling.load_json("source-verification-evidence.json", {})
    records = seed.get("records", []) if isinstance(seed, dict) else []
    return {
        "format": "tfse_source_verification_evidence",
        "version": seed.get("version", "2026-06-28") if isinstance(seed, dict) else "2026-06-28",
        "generated_at": seed.get("generated_at", site_config_tooling.now_iso()) if isinstance(seed, dict) else site_config_tooling.now_iso(),
        "generated_by_role": seed.get("generated_by_role", "data_manager") if isinstance(seed, dict) else "data_manager",
        "review_cycle_days": seed.get("review_cycle_days", 90) if isinstance(seed, dict) else 90,
        "privacy_note": seed.get("privacy_note", "來源復核留痕只保存資料 ID、官方來源 URL、結果、角色與證據備註摘要，不保存使用者個資。") if isinstance(seed, dict) else "來源復核留痕只保存資料 ID、官方來源 URL、結果、角色與證據備註摘要，不保存使用者個資。",
        "counts": {
            "total": len(records),
            "approved": sum(1 for item in records if item.get("result") == "approved"),
            "needs_revision": sum(1 for item in records if item.get("result") == "needs_revision"),
            "rejected": sum(1 for item in records if item.get("result") == "rejected"),
        },
        "queue_snapshot": queue["items"],
        "records": records,
        "related_exports": seed.get("related_exports", [
            "tfse_source_review_queue",
            "tfse_content_version_snapshot",
            "tfse_formal_backend_migration_package",
        ]) if isinstance(seed, dict) else [
            "tfse_source_review_queue",
            "tfse_content_version_snapshot",
            "tfse_formal_backend_migration_package",
        ],
    }


def content_version_snapshot_report():
    return {
        "format": "tfse_content_version_snapshot",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "content_editor",
        "source_mode": site_config_tooling.load_site_config().get("backend", {}).get("mode", "localStorage"),
        "privacy_note": "內容版本紀錄只保存產品、文章、FAQ 覆蓋與狀態，不包含潛客手機、Line ID 或表單補充說明。",
        "counts": admin_cutover_tooling.content_version_summary(),
        "product_overrides": {},
        "product_status": {},
        "article_overrides": {},
        "article_status": {},
        "faq_overrides": {},
        "audit_trail": [],
        "restore_order": [
            "先匯入 seed data：products、articles、faq",
            "套用 product_status 與 product_overrides",
            "套用 article_status 與 article_overrides",
            "套用 faq_overrides",
            "比對 audit_trail 與正式後端版本紀錄後再發布",
        ],
    }


def privacy_request_queue_report():
    items = []
    for lead in leads():
        if not lead.get("delete_requested") and not lead.get("privacy_request_status"):
            continue
        notes = lead.get("notes") or []
        items.append({
            "lead_id": lead.get("id") or "",
            "request_type": lead.get("privacy_request_type") or "delete",
            "request_status": lead.get("privacy_request_status") or "pending",
            "display_name": lead.get("display_name") or "",
            "phone_last3": phone_last3(lead.get("phone")),
            "needs": lead.get("needs") or "",
            "submitted_at": lead.get("submitted_at") or "",
            "requested_at": lead.get("privacy_requested_at") or lead.get("updated_at") or lead.get("submitted_at") or "",
            "completed_at": lead.get("privacy_completed_at") or "",
            "consent_version": lead.get("consent_version") or "",
            "line_consent": bool(lead.get("consent_line")),
            "note": notes[-1] if notes else "",
        })
    items.sort(
        key=lambda item: (
            1 if item.get("request_status") == "completed" else 0,
            str(item.get("requested_at") or item.get("submitted_at") or ""),
        ),
        reverse=True,
    )
    return {
        "format": "tfse_privacy_request_queue",
        "version": "2026-06-28",
        "exported_at": site_config_tooling.now_iso(),
        "exported_by_role": "compliance_reviewer",
        "source_mode": source_mode(),
        "items": items,
    }


def line_segment_queue_report():
    items = []
    for lead in leads():
        tags = lead.get("tags") or []
        if not (lead.get("consent_line") and (tags or lead.get("line_id"))):
            continue
        items.append({
            "lead_id": lead.get("id") or "",
            "display_name": lead.get("display_name") or "",
            "line_id": lead.get("line_id") or "",
            "tags": tags,
            "source_tags": [tag for tag in tags if str(tag).startswith("source_")],
            "needs": lead.get("needs") or "",
            "source_channel": lead.get("source_channel") or "",
            "utm_source": lead.get("utm_source") or "",
            "recommended_categories": lead.get("recommended_categories") or [],
            "recommended_articles": lead.get("recommended_articles") or [],
            "consent_version": lead.get("consent_version") or "",
            "submitted_at": lead.get("submitted_at") or "",
        })
    items.sort(key=lambda item: str(item.get("submitted_at", "")), reverse=True)
    return {
        "format": "tfse_line_segment_queue",
        "version": "2026-06-28",
        "exported_at": site_config_tooling.now_iso(),
        "exported_by_role": "content_editor",
        "source_mode": source_mode(),
        "items": items,
    }


def line_optout_complaint_queue_report():
    keywords = ["退訂", "停止接收", "不要傳訊息", "取消 Line 通知", "投訴", "檢舉", "騷擾", "封鎖", "STOP", "UNSUBSCRIBE"]
    items = []
    for lead in leads():
        notes = " ".join(lead.get("notes") or [])
        contact_logs = [log for log in (lead.get("contact_logs") or []) if isinstance(log, dict)]
        contact_text = " ".join(
            " ".join(str(log.get(field) or "") for field in ("channel", "outcome", "next_action", "note"))
            for log in contact_logs
        )
        text = " ".join([
            str(lead.get("privacy_request_type") or ""),
            str(lead.get("privacy_request_status") or ""),
            notes,
            contact_text,
        ]).lower()
        has_keyword = any(keyword.lower() in text for keyword in keywords)
        if not (
            has_keyword
            or lead.get("line_optout_requested")
            or lead.get("line_complaint_status")
            or lead.get("privacy_request_type") == "line_optout"
        ):
            continue
        latest_log = contact_logs[0] if contact_logs else {}
        note_list = lead.get("notes") or []
        items.append({
            "lead_id": lead.get("id") or "",
            "display_name": lead.get("display_name") or "",
            "phone_last3": phone_last3(lead.get("phone")),
            "line_id_present": bool(lead.get("line_id")),
            "line_consent": bool(lead.get("consent_line")),
            "request_type": "complaint" if lead.get("line_complaint_status") else ("line_optout" if lead.get("privacy_request_type") == "line_optout" else "review_required"),
            "status": lead.get("line_complaint_status") or lead.get("privacy_request_status") or "pending_review",
            "source": lead.get("utm_source") or lead.get("source_channel") or "direct",
            "needs": lead.get("needs") or "",
            "requested_at": lead.get("privacy_requested_at") or lead.get("updated_at") or lead.get("submitted_at") or "",
            "latest_contact_outcome": latest_log.get("outcome") or "",
            "latest_next_action": latest_log.get("next_action") or "",
            "note_summary": (note_list[-1] if note_list else "") or latest_log.get("note") or "",
        })
    items.sort(key=lambda item: str(item.get("requested_at", "")), reverse=True)
    return {
        "format": "tfse_line_optout_complaint_queue",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "compliance_reviewer",
        "source_mode": source_mode(),
        "privacy_note": "只輸出 lead id、手機末三碼、Line 是否存在、請求狀態與摘要，不輸出完整手機、Line ID、對話全文或敏感個資。",
        "summary": {
            "total": len(items),
            "complaints": sum(1 for item in items if item.get("request_type") == "complaint"),
            "optouts": sum(1 for item in items if item.get("request_type") == "line_optout"),
            "pending_review": sum(1 for item in items if item.get("status") != "completed"),
        },
        "intake_keywords": keywords,
        "sla": {
            "optout_acknowledge": "24h 內停止主動訊息並回覆已收到",
            "complaint_triage": "1 個工作天內由 compliance_reviewer 複核",
            "data_request_sync": "若涉及刪除/更正，同步建立 privacy_request_tasks",
        },
        "handling_steps": [
            "確認使用者是否要求停止 Line 訊息、刪除資料或提出投訴。",
            "立即移除 Line 分群標籤，不再匯入促發訊息名單。",
            "若涉及個資刪除或更正，同步個資請求隊列並保存審計。",
            "若涉及騷擾、誤導或代辦疑慮，升級到法務合規送審包。",
            "保存處理人、處理時間、結果與外部 Line OA 後台證據。",
        ],
        "evidence_fields": ["lead_id", "line_user_id_hash", "request_received_at", "handled_at", "handler_role", "line_tag_removed", "privacy_request_id", "complaint_result", "evidence_note"],
        "items": items,
        "related_exports": [
            "tfse_line_segment_queue",
            "tfse_line_oa_setup_package",
            "tfse_privacy_request_queue",
            "tfse_legal_compliance_review_package",
        ],
    }


def institution_import_verification_report():
    institutions = admin_cutover_tooling.institutions()
    evidence = source_verification_evidence_report()
    stale = [
        {
            "id": item.get("id") or "",
            "name": item.get("name") or "",
            "verification_status": item.get("verification_status") or "",
            "last_verified_at": item.get("last_verified_at") or "",
            "official_url": item.get("official_url") or "",
            "reason": "verification_status_not_verified" if item.get("verification_status") != "verified" else "last_verified_over_180_days",
        }
        for item in institutions
        if item.get("verification_status") != "verified"
        or (source_freshness_audit.parse_date(item.get("last_verified_at", "")) and (date.today() - source_freshness_audit.parse_date(item.get("last_verified_at", ""))).days > 180)
    ]
    blockers = [
        item for item in [
            "institutions.json 無資料可導入。" if not institutions else "",
            f"有 {len(stale)} 筆機構資料待復核或超過 180 天未核驗。" if stale else "",
            "尚未保存來源復核 approved 留痕；正式導入前需至少保存抽查證據。" if not evidence["counts"]["approved"] else "",
        ] if item
    ]
    return {
        "format": "tfse_institution_import_verification_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "data_manager",
        "status": "pending_institution_import_verification" if blockers else "ready_for_institution_import_verification",
        "privacy_note": "此包只保存公開機構資料、官方來源 URL、核驗狀態與導入證據欄位，不保存使用者個資、登入憑證或內部審核意見全文。",
        "source_file": "assets/data/institutions.json",
        "target_tables": ["institutions", "institution_source_versions", "source_verification_evidence", "audit_logs"],
        "counts": {
            "institutions": len(institutions),
            "verified": len([item for item in institutions if item.get("verification_status") == "verified"]),
            "stale_or_unverified": len(stale),
            "source_evidence_records": evidence["counts"]["total"],
            "approved_source_evidence": evidence["counts"]["approved"],
        },
        "status_counts": {},
        "import_rows": [
            {
                "id": item.get("id") or "",
                "name": item.get("name") or "",
                "type": item.get("type") or "",
                "region": item.get("region") or "",
                "official_url": item.get("official_url") or "",
                "registry_ref": item.get("registry_ref") or "",
                "verification_status": item.get("verification_status") or "",
                "last_verified_at": item.get("last_verified_at") or "",
                "required_version_record": "institution_source_versions",
            }
            for item in institutions
        ],
        "stale_or_unverified_items": stale,
        "validation_steps": [
            "正式導入前確認 institutions.id 唯一，official_url 使用 https，registry_ref 不為空。",
            "將每筆 institution 寫入 institutions，並同步建立 institution_source_versions 版本紀錄。",
            "抽查主管機關、銀行公會、聯徵中心、法扶與官方公開來源頁面是否可訪問。",
            "導入後以 GET /api/institutions 與 Admin 來源復核頁核對筆數、排序、遮罩與來源連結。",
            "導入與版本建立需寫入 audit_logs，記錄導入者角色、批次 ID 與校驗結果。",
        ],
        "evidence_fields": ["batch_id", "row_count", "version_record_count", "sample_ids", "official_url_checked", "audit_log_id", "reviewer_role", "checked_at", "evidence_note"],
        "blockers": blockers,
        "related_exports": [
            "tfse_source_verification_evidence",
            "tfse_formal_backend_migration_package",
            "tfse_import_validation_package",
            "tfse_source_review_queue",
        ],
    }


def public_feedback_intake_report():
    source_queue = source_review_queue_report()
    source_evidence = source_verification_evidence_report()
    privacy = privacy_request_queue_report()
    tickets = public_feedback_tickets()
    legal = compliance_reviews()
    intake_types = [
        {"type": "source_update", "label": "資料來源更新", "owner_role": "data_manager", "sla": "3 個工作天內確認官方來源"},
        {"type": "content_error", "label": "內容錯誤回報", "owner_role": "content_editor", "sla": "3 個工作天內判斷是否修正文案或送審"},
        {"type": "compliance_issue", "label": "合規疑慮", "owner_role": "compliance_reviewer", "sla": "1 個工作天內初步分級"},
        {"type": "privacy_request", "label": "資料查詢/更正/刪除", "owner_role": "compliance_reviewer", "sla": "依隱私權政策與個資請求隊列處理"},
    ]
    return {
        "format": "tfse_public_feedback_intake_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "compliance_reviewer",
        "source_page": "contact.html",
        "contact_email": "info@tfse.tw",
        "privacy_note": "此包定義正式收件與分流欄位，不保存 Email 原文、證件、帳戶、卡號、密碼或完整手機；正式版需只保留必要摘要與證據連結。",
        "summary": {
            "intake_types": len(intake_types),
            "local_feedback_tickets": len(tickets),
            "source_review_items": len(source_queue["items"]),
            "source_evidence_records": len(source_evidence["records"]),
            "privacy_requests": len(privacy["items"]),
            "legal_review_items": len(legal),
        },
        "local_feedback_tickets": tickets[:10],
        "intake_types": intake_types,
        "required_fields": ["feedback_type", "page_url", "summary", "official_source_url", "source_updated_at", "reporter_contact_hash", "phone_last3_optional", "consent_contact", "received_at"],
        "forbidden_fields": ["national_id", "bank_account", "card_number", "password", "certificate_image", "full_financial_statement"],
        "triage_rules": [
            "資料來源更新或連結失效轉入 source_review_tasks。",
            "內容錯誤回報需建立 content_version_snapshot 前後對照。",
            "涉及代辦、保證核貸、誤導或投訴時，升級 legal_compliance_review_packages。",
            "涉及查詢、更正、刪除個資時，建立 privacy_request_tasks 並遮罩聯絡資訊。",
            "無官方來源或包含高敏資料時，只保留去識別摘要並請回報者重新提供低敏資訊。",
        ],
        "sla": {
            "acknowledge": "2 個工作天內回覆已收到",
            "source_update": "3 個工作天內完成初步來源核對",
            "compliance_issue": "1 個工作天內完成風險分級",
            "privacy_request": "依隱私權政策與法定要求處理",
        },
        "sample_queue": [
            {"feedback_type": "source_update", "page_url": "products/{slug}.html", "status": "ready_for_formal_intake", "next_action": "建立 source_review_tasks 並保存官方來源 URL"},
            {"feedback_type": "compliance_issue", "page_url": "lp/{slug}.html", "status": "ready_for_formal_intake", "next_action": "建立 legal_compliance_review_packages 送審項"},
            {"feedback_type": "privacy_request", "page_url": "contact.html", "status": "ready_for_formal_intake", "next_action": "建立 privacy_request_tasks 並寫 audit_logs"},
        ],
        "related_exports": [
            "tfse_source_review_queue",
            "tfse_source_verification_evidence",
            "tfse_content_version_snapshot",
            "tfse_privacy_request_queue",
            "tfse_legal_compliance_review_package",
        ],
    }


def public_feedback_api_verification_report():
    intake = public_feedback_intake_report()
    audit = admin_audit()
    return {
        "format": "tfse_public_feedback_api_verification_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "compliance_reviewer",
        "privacy_note": "此驗收包只保存回報類型、狀態碼、工單 ID、分流結果、角色與證據摘要；不得保存 Email 原文、完整手機、Line ID、證件、帳戶、卡號、密碼、附件原文或法律意見全文。",
        "status": "pending_public_feedback_api_verification",
        "backend_target": {
            "intake_endpoint": "POST /api/public-feedback",
            "admin_queue_endpoint": "GET /api/admin/public-feedback-intake",
            "audit_endpoint": "GET /api/admin/audit-logs",
            "target_tables": ["public_feedback_tickets", "source_review_tasks", "content_version_snapshots", "privacy_request_tasks", "legal_compliance_review_packages", "audit_logs"],
            "allowed_public_fields": intake["required_fields"],
            "forbidden_fields": intake["forbidden_fields"],
        },
        "local_context": {
            "intake_types": len(intake["intake_types"]),
            "source_review_items": intake["summary"]["source_review_items"],
            "source_evidence_records": intake["summary"]["source_evidence_records"],
            "privacy_requests": intake["summary"]["privacy_requests"],
            "legal_review_items": intake["summary"]["legal_review_items"],
            "audit_public_feedback_exports": sum(1 for item in audit if item.get("action") in {"public_feedback_export", "public_feedback_api_export"}),
        },
        "required_controls": [
            "公開收件 API 需限流、驗證 honeypot/Turnstile 或同等防刷，並拒收證件、帳戶、卡號、密碼與附件原文。",
            "正式後端只保存去識別 summary、reporter_contact_hash、phone_last3、官方來源 URL、同意聯絡與分流結果。",
            "source_update 分流到 source_review_tasks，content_error 分流到 content_version_snapshots，privacy_request 分流到 privacy_request_tasks，compliance_issue 分流到 legal_compliance_review_packages。",
            "每次建立、分流、拒收、結案都需寫入 audit_logs 或工單歷史，且 audit_logs 不保存完整聯絡資訊。",
            "管理端查詢需套用 RBAC，content_editor / data_manager / compliance_reviewer 只能處理自己權責類型。",
        ],
        "test_cases": [
            {"key": "source_update_ticket", "request": {"feedback_type": "source_update", "official_source_url": "https://example.gov.tw/source"}, "expected": "public_feedback_tickets 建立 pending_triage，並可建立 source_review_tasks 關聯"},
            {"key": "content_error_ticket", "request": {"feedback_type": "content_error", "page_url": "articles.html"}, "expected": "建立內容錯誤工單，必要時產生 content_version_snapshot 前後對照"},
            {"key": "privacy_request_ticket", "request": {"feedback_type": "privacy_request"}, "expected": "建立 privacy_request_tasks，聯絡欄位只保存 hash/末三碼"},
            {"key": "compliance_issue_ticket", "request": {"feedback_type": "compliance_issue"}, "expected": "升級 legal_compliance_review_packages 或合規審核待辦"},
            {"key": "reject_sensitive_payload", "request": {"national_id": "A123456789", "password": "secret"}, "expected": "400/422 拒收或只保存去識別摘要，禁止欄位不落庫"},
        ],
        "evidence_fields": ["endpoint", "status_code", "feedback_ticket_id", "feedback_type", "assigned_role", "related_task_type", "related_task_id", "forbidden_fields_rejected", "reporter_contact_hashed", "rate_limit_checked", "audit_log_id", "checked_at", "evidence_note"],
        "blockers": [
            "正式公開收件 API 尚未提供 public_feedback_tickets 入庫證據。",
            "尚需在 staging 執行 source_update、content_error、privacy_request、compliance_issue 與高敏欄位拒收測試。",
            "尚需抽查分流後的 source_review_tasks、content_version_snapshots、privacy_request_tasks 與 legal review 關聯。",
        ],
        "related_exports": [
            "tfse_public_feedback_intake_package",
            "tfse_source_review_queue",
            "tfse_source_verification_evidence",
            "tfse_content_version_snapshot",
            "tfse_privacy_request_queue",
            "tfse_legal_compliance_review_package",
            "tfse_backend_acceptance_matrix",
        ],
    }


def lead_dedupe_queue_report():
    grouped = {}
    for lead in leads():
        key = phone_last3(lead.get("phone")) + "|" + (lead.get("needs") or "未填需求")
        grouped.setdefault(key, []).append(lead)
    items = []
    for key, group in grouped.items():
        if "|" not in key or len(group) <= 1:
            continue
        group_leads = sorted(group, key=lambda item: str(item.get("submitted_at", "")), reverse=True)
        primary = group_leads[0] if group_leads else {}
        status_map = {}
        source_map = {}
        for lead in group_leads:
            status_key = lead.get("status") or "new"
            source_key = lead.get("utm_source") or lead.get("source_channel") or "direct"
            status_map[status_key] = status_map.get(status_key, 0) + 1
            source_map[source_key] = source_map.get(source_key, 0) + 1
        items.append({
            "dedupe_key": key,
            "phone_last3": key.split("|")[0],
            "needs": key.split("|")[1],
            "count": len(group_leads),
            "suggested_primary_lead_id": primary.get("id") or "",
            "candidate_lead_ids": [lead.get("id") for lead in group_leads if lead.get("id")],
            "statuses": top_count_items(status_map, 5),
            "sources": top_count_items(source_map, 5),
            "latest_submitted_at": primary.get("submitted_at") or "",
            "recommended_action": "正式 CRM 以完整手機雜湊 + needs + 24 小時窗口確認後，保留最新主紀錄並將其他紀錄標記為 duplicate_closed 或關聯到同一聯繫歷史。",
        })
    items.sort(key=lambda item: (-item["count"], str(item["latest_submitted_at"])), reverse=False)
    return {
        "format": "tfse_lead_dedupe_queue",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "consultant",
        "privacy_note": "此隊列只輸出 lead id、手機末三碼、需求、狀態與來源聚合，不輸出完整手機、Line ID 或補充說明。",
        "dedupe_policy": {
            "formal_key": "phone_hash + needs + 24h window",
            "local_mvp_key": "phone_last3 + needs",
            "retention": "保留最新主紀錄，將重複紀錄關聯到主紀錄或標記 closed/spam，並寫入 audit_logs。",
        },
        "counts": {
            "total_leads": len(leads()),
            "duplicate_groups": len(items),
            "duplicate_leads": sum(item["count"] for item in items),
        },
        "items": items,
        "related_exports": [
            "tfse_form_risk_control_report",
            "tfse_crm_follow_up_queue",
            "tfse_crm_contact_log",
            "tfse_formal_backend_migration_package",
        ],
    }


def crm_follow_up_queue_report():
    active_statuses = {"new", "contacted", "info_sent", "consulted", "unresponsive"}
    priority_order = {"high": 0, "normal": 1, "low": 2}
    items = []
    for lead in leads():
        status = lead.get("status") or "new"
        if status not in active_statuses:
            continue
        if not (lead.get("next_follow_up_at") or status == "new"):
            continue
        note_list = lead.get("notes") or []
        items.append({
            "lead_id": lead.get("id") or "",
            "display_name": lead.get("display_name") or "",
            "phone_last3": phone_last3(lead.get("phone")),
            "needs": lead.get("needs") or "",
            "status": status,
            "assigned_to": lead.get("assigned_to") or "consultant",
            "follow_up_priority": lead.get("follow_up_priority") or ("high" if status == "new" else "normal"),
            "next_follow_up_at": lead.get("next_follow_up_at") or "",
            "latest_note": note_list[-1] if note_list else "",
            "source": lead.get("utm_source") or lead.get("source_channel") or "direct",
            "submitted_at": lead.get("submitted_at") or "",
            "updated_at": lead.get("updated_at") or lead.get("submitted_at") or "",
        })
    items.sort(key=lambda item: (item.get("next_follow_up_at") or "9999-12-31", priority_order.get(item.get("follow_up_priority"), 1)))
    today = date.today().isoformat()
    return {
        "format": "tfse_crm_follow_up_queue",
        "version": "2026-06-28",
        "exported_at": site_config_tooling.now_iso(),
        "exported_by_role": "consultant",
        "source_mode": source_mode(),
        "privacy_note": "跟進隊列只輸出稱呼、手機末三碼、需求、來源、狀態、負責人與備註摘要；正式版不得匯出完整手機或 Line ID 給非授權角色。",
        "counts": {
            "total": len(items),
            "overdue_or_unscheduled": sum(1 for item in items if not item.get("next_follow_up_at") or item.get("next_follow_up_at") <= today),
            "high_priority": sum(1 for item in items if item.get("follow_up_priority") == "high"),
        },
        "items": items,
    }


def crm_contact_log_report():
    items = []
    for lead in leads():
        for log in lead.get("contact_logs") or []:
            items.append({
                "lead_id": lead.get("id") or "",
                "display_name": lead.get("display_name") or "",
                "phone_last3": phone_last3(lead.get("phone")),
                "needs": lead.get("needs") or "",
                "channel": log.get("channel") or "",
                "outcome": log.get("outcome") or "",
                "next_action": log.get("next_action") or "",
                "note_summary": str(log.get("note") or "")[:160],
                "next_follow_up_at": log.get("next_follow_up_at") or "",
                "handled_by_role": log.get("handled_by_role") or "",
                "contacted_at": log.get("contacted_at") or "",
                "source": lead.get("utm_source") or lead.get("source_channel") or "direct",
            })
    items.sort(key=lambda item: str(item.get("contacted_at", "")), reverse=True)
    by_outcome = group_count(items, lambda item: item.get("outcome") or "unknown")
    return {
        "format": "tfse_crm_contact_log",
        "version": "2026-06-28",
        "exported_at": site_config_tooling.now_iso(),
        "exported_by_role": "consultant",
        "source_mode": source_mode(),
        "privacy_note": "聯繫紀錄只輸出稱呼、手機末三碼、渠道、結果、下次動作與備註摘要；不輸出完整手機、Line ID、證件或帳戶資訊。",
        "counts": {
            "total": len(items),
            "reached": by_outcome.get("reached", 0),
            "no_response": by_outcome.get("no_response", 0),
            "info_sent": by_outcome.get("info_sent", 0),
            "invalid_contact": by_outcome.get("invalid_contact", 0),
        },
        "items": items,
    }


def crm_api_persistence_report():
    follow_ups = crm_follow_up_queue_report()
    contact_logs = crm_contact_log_report()
    dedupe = lead_dedupe_queue_report()
    audit = admin_audit()
    return {
        "format": "tfse_crm_api_persistence_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "consultant",
        "privacy_note": "此驗收包只保存 CRM 統計、手機末三碼、狀態碼、角色、聯繫摘要與 audit log ID；不得保存完整手機、Line ID、Email、補充說明全文、session token、CSRF token、證件、帳戶、卡號或密碼。",
        "status": "pending_crm_api_persistence",
        "backend_target": {
            "list_endpoint": "GET /api/admin/leads",
            "detail_endpoint": "GET /api/admin/leads/:id",
            "status_endpoint": "PATCH /api/admin/leads/:id/status",
            "follow_up_endpoint": "GET /api/admin/leads/follow-ups",
            "contact_log_endpoint": "GET /api/admin/leads/contact-logs",
            "dedupe_endpoint": "GET /api/admin/leads/dedupe-queue",
            "audit_endpoint": "GET /api/admin/audit-logs",
            "target_tables": ["lead_forms", "lead_contact_logs", "lead_dedupe_queues", "audit_logs"],
            "allowed_roles": ["super_admin", "consultant"],
            "required_auth": ["server_session", "csrf", "rbac"],
        },
        "local_context": {
            "lead_count": len(leads()),
            "follow_up_items": follow_ups["counts"]["total"],
            "high_priority_follow_ups": follow_ups["counts"]["high_priority"],
            "contact_logs": contact_logs["counts"]["total"],
            "dedupe_groups": dedupe["counts"]["duplicate_groups"],
            "audit_crm_events": sum(1 for item in audit if item.get("action") in {"lead_follow_up_update", "follow_up_export", "contact_log_export", "lead_dedupe_export"}),
        },
        "required_controls": [
            "GET /api/admin/leads 與詳情端點需套用 RBAC，Viewer 不可看到完整手機、Line ID 或備註全文。",
            "PATCH /api/admin/leads/:id/status 需同時更新 lead_forms.status、assigned_to、follow_up_priority、next_follow_up_at，並寫入 audit_logs。",
            "若 request 包含 contact_log，需新增 lead_contact_logs，不得以單一 notes 覆蓋歷史聯繫紀錄。",
            "GET /api/admin/leads/follow-ups 需以 assigned_to、priority、due_before 篩選，並只回傳授權角色可見欄位。",
            "GET /api/admin/leads/dedupe-queue 需以 phone_hash + needs + 24 小時窗口產生候選，處理結果寫入 lead_dedupe_queues 與 audit_logs。",
        ],
        "test_cases": [
            {"key": "list_masked_for_viewer", "request": "GET /api/admin/leads as viewer", "expected": "完整手機、Line ID、備註全文皆遮罩或省略"},
            {"key": "consultant_status_update", "request": "PATCH /api/admin/leads/:id/status", "expected": "lead_forms 更新，回傳 lead 與 audit_log.id"},
            {"key": "contact_log_append", "request": {"contact_log": "phone/reached/send_public_info"}, "expected": "lead_contact_logs 新增一筆，不覆蓋舊紀錄"},
            {"key": "follow_up_queue_filter", "request": "GET /api/admin/leads/follow-ups?priority=high", "expected": "只回傳高優先或到期待跟進項"},
            {"key": "dedupe_queue_hash_window", "request": "GET /api/admin/leads/dedupe-queue", "expected": "以 phone_hash + needs + 24 小時窗口產生候選，不暴露完整手機"},
        ],
        "evidence_fields": ["endpoint", "status_code", "lead_id", "phone_last3", "viewer_masking_checked", "lead_status_before", "lead_status_after", "contact_log_id", "dedupe_queue_id", "audit_log_id", "csrf_checked", "rbac_checked", "checked_at", "evidence_note"],
        "blockers": [
            "正式後端尚未提供 lead_forms、lead_contact_logs、lead_dedupe_queues 與 audit_logs 落庫證據。",
            "尚需在 staging 分別以 consultant、viewer、未授權角色驗證 CRM 讀寫與遮罩。",
            "尚需抽查跨瀏覽器 Admin CRM 是否看到同一批正式資料，而非各自 localStorage。",
        ],
        "related_exports": [
            "tfse_crm_follow_up_queue",
            "tfse_crm_contact_log",
            "tfse_lead_dedupe_queue",
            "tfse_formal_backend_migration_package",
            "tfse_import_validation_package",
            "tfse_backend_acceptance_matrix",
            "tfse_admin_auth_cutover_check",
        ],
    }


def form_risk_control_report():
    turnstile = (((site_config_tooling.load_site_config().get("security") or {}).get("turnstile")) or {})
    lead_items = leads()
    event_items = events()
    duplicate_map = {}
    device_map = {}
    missing_consent = []
    missing_device = []
    for lead in lead_items:
        dedupe_key = phone_last3(lead.get("phone")) + "|" + (lead.get("needs") or "未填需求")
        duplicate_map.setdefault(dedupe_key, []).append(lead)
        device_key = lead.get("device_id") or "missing_device"
        device_map.setdefault(device_key, []).append(lead)
        if not lead.get("consent_privacy"):
            missing_consent.append(lead)
        if not lead.get("device_id"):
            missing_device.append(lead)
    duplicate_groups = []
    for key, group in duplicate_map.items():
        if "|" not in key or len(group) <= 1:
            continue
        latest_at = sorted((item.get("submitted_at") or "" for item in group), reverse=True)[0] if group else ""
        duplicate_groups.append({
            "key": key,
            "count": len(group),
            "phone_last3": key.split("|")[0],
            "needs": key.split("|")[1],
            "latest_submitted_at": latest_at,
        })
    duplicate_groups.sort(key=lambda item: (-item["count"], str(item["latest_submitted_at"])), reverse=False)
    repeated_devices = []
    for key, group in device_map.items():
        if key == "missing_device" or len(group) <= 1:
            continue
        repeated_devices.append({
            "device_id": key,
            "count": len(group),
            "phone_last3_samples": [phone_last3(item.get("phone")) for item in group if phone_last3(item.get("phone"))][:5],
        })
    repeated_devices.sort(key=lambda item: -item["count"])
    risk_notes = []
    if not (turnstile.get("enabled") and turnstile.get("site_key")):
        risk_notes.append("正式上線前需填入 Cloudflare Turnstile site key，並由後端驗證 token。")
    if duplicate_groups:
        risk_notes.append("發現重複手機末三碼與需求組合，正式 API 需依完整手機雜湊 + needs 做 24 小時去重。")
    if repeated_devices:
        risk_notes.append("發現同一 device_id 多筆線索，正式 API 需搭配 IP + device fingerprint 限流。")
    if missing_consent:
        risk_notes.append("發現缺少隱私同意的線索，正式匯入前需排除或補正。")
    if missing_device:
        risk_notes.append("部分線索缺少 device_id，正式 API 應在伺服器端補充限流依據。")
    if not risk_notes:
        risk_notes.append("本機資料未發現明顯重複或同意缺漏；正式上線仍需伺服器端限流、Turnstile 驗證與審計。")
    return {
        "format": "tfse_form_risk_control_report",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "data_manager",
        "source_mode": source_mode(),
        "privacy_note": "防刷檢查包只輸出聚合風險、device_id 與手機末三碼樣本，不匯出完整手機、Line ID、補充說明或 Turnstile token。",
        "controls": {
            "local_cooldown_seconds": 60,
            "local_deduplicate_window_hours": 24,
            "honeypot_field": "website",
            "turnstile_configured": bool(turnstile.get("enabled") and turnstile.get("site_key")),
            "required_backend_controls": [
                "Cloudflare Turnstile token server-side verification",
                "rate limit by IP + device_id",
                "deduplicate same phone hash + needs within 24 hours",
                "reject non-empty website honeypot field",
                "audit log for rejected, duplicate or suspicious submissions",
            ],
        },
        "counts": {
            "leads": len(lead_items),
            "lead_submit_events": count_events(event_items, "lead_submit"),
            "duplicate_groups": len(duplicate_groups),
            "repeated_devices": len(repeated_devices),
            "missing_privacy_consent": len(missing_consent),
            "missing_device_id": len(missing_device),
        },
        "duplicate_groups": duplicate_groups[:20],
        "repeated_devices": repeated_devices[:20],
        "risk_notes": risk_notes,
    }


def import_validation_package_report():
    migration = admin_cutover_tooling.formal_backend_migration_report()
    source = source_review_queue_report()
    privacy = privacy_request_queue_report()
    line = line_segment_queue_report()
    lead_items = leads()
    blockers = [
        item for item in [
            f"來源復核待處理 {len(source['items'])} 筆。" if source["items"] else "",
            "個資請求需先完成或保留處理計畫。" if any(item.get("request_status") != "completed" for item in privacy["items"]) else "",
        ] if item
    ]
    return {
        "format": "tfse_import_validation_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "data_manager",
        "source_package": migration["format"],
        "privacy_note": "只輸出導入統計、阻擋項與去識別樣本，不輸出完整手機、Line ID 或表單備註。",
        "summary": {
            "seed_products": migration["summary"]["seed_products"],
            "seed_articles": migration["summary"]["seed_articles"],
            "seed_institutions": migration["summary"]["seed_institutions"],
            "local_leads": len(lead_items),
            "sample_leads": sum(1 for item in lead_items if "QA" in str(item.get("display_name") or "") or "測試" in str(item.get("display_name") or "")),
            "source_review_items": len(source["items"]),
            "privacy_requests": len(privacy["items"]),
            "line_segments": len(line["items"]),
            "blockers": len(blockers),
        },
        "import_checks": [
            "先匯入 institutions，再匯入 products、articles、faq。",
            "sample_lead 與瀏覽器驗收資料不得進正式營運庫。",
            "手機、Line ID、補充說明需加密或欄位級保護。",
            "來源復核、個資請求、Line 分群與 audit_logs 需保留關聯。",
            "匯入後抽查產品詳情、文章詳情、CRM、合規審核與刪除請求。",
        ],
        "blockers": blockers,
        "related_exports": [
            "tfse_formal_backend_migration_package",
            "tfse_source_review_queue",
            "tfse_privacy_request_queue",
            "tfse_line_segment_queue",
        ],
    }


def data_retention_purge_plan_report():
    lead_items = leads()
    event_items = events()
    privacy = privacy_request_queue_report()
    stale_leads = []
    for lead in lead_items:
        age = days_since(lead.get("updated_at") or lead.get("submitted_at"))
        if age is None or age < 180 or lead.get("status") not in {"closed", "spam"}:
            continue
        stale_leads.append({
            "lead_id": lead.get("id") or "",
            "status": lead.get("status") or "new",
            "display_name": lead.get("display_name") or "",
            "phone_last3": phone_last3(lead.get("phone")),
            "age_days": age,
            "suggested_action": "delete_or_anonymize_after_privacy_completion" if lead.get("delete_requested") else "anonymize_contact_fields",
        })
    old_events = []
    for item in event_items:
        age = days_since(item.get("created_at") or item.get("sent_at") or item.get("timestamp"))
        if age is not None and age >= 90:
            old_events.append(item)
    return {
        "format": "tfse_data_retention_purge_plan",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "compliance_reviewer",
        "source_mode": source_mode(),
        "privacy_note": "此排程只輸出手機末三碼與保留規則，不輸出完整手機、Line ID、證件、帳戶、卡號或密碼。",
        "policy": {
            "review_frequency": "monthly",
            "execution_window": "每月第一個工作日由 compliance_reviewer 產生候選清單，data_manager 在正式後端執行刪除或匿名化。",
            "legal_hold_rule": "來源復核、法務審核、投訴、事故或未完成個資請求相關資料不得自動刪除，需先標記 legal_hold_review。",
        },
        "retention_rules": [
            {"dataset": "lead_forms", "window": "active_service_need", "action": "服務需求有效期間保留；結案、無效或 spam 超過 180 天後匿名化聯絡欄位，刪除請求完成後依審計要求刪除或遮罩。"},
            {"dataset": "privacy_request_tasks", "window": "365_days_after_completion", "action": "保留處理證據、手機末三碼、處理人與時間；不得保留完整聯絡資訊。"},
            {"dataset": "lead_events", "window": "90_days_raw", "action": "90 天後轉為彙總事件或刪除 device_id/UTM 可識別片段。"},
            {"dataset": "audit_logs", "window": "365_days_minimum", "action": "保留管理操作、匯出、刪除與權限事件；刪除前需合規確認。"},
            {"dataset": "source_review_tasks/source_verification_evidence/content_version_snapshots", "window": "compliance_record", "action": "作為公開資料與內容版本證據保留，定期復核而非自動清除。"},
            {"dataset": "backup_jobs", "window": "30_daily_12_weekly", "action": "每日備份保留 30 天、每週備份保留 12 週；到期清除需保留 job id、checksum、刪除人與時間。"},
        ],
        "summary": {
            "total_leads": len(lead_items),
            "purge_candidate_leads": len(stale_leads),
            "raw_events_over_90_days": len(old_events),
            "pending_privacy_requests": sum(1 for item in privacy["items"] if item.get("request_status") != "completed"),
        },
        "purge_candidates": stale_leads[:50],
        "required_evidence_fields": ["dataset", "record_id", "phone_last3", "retention_rule", "action", "legal_hold", "executed_by", "executed_at", "audit_log_id", "verification_note"],
        "blockers": [
            "正式後端尚未接入前，localStorage MVP 僅能產生排程包，不能替代伺服器端刪除。",
            "任何未完成個資請求、投訴、事故或法務審核中的紀錄需先暫緩清除。",
            "備份到期清除需由正式雲端儲存、KMS 與 backup job 系統提供證據。",
        ],
        "related_exports": [
            "tfse_privacy_request_queue",
            "tfse_backup_restore_drill_plan",
            "tfse_admin_audit_log",
            "tfse_public_feedback_intake_package",
        ],
    }


def privacy_fulfillment_verification_report():
    privacy = privacy_request_queue_report()
    retention = data_retention_purge_plan_report()
    audit = admin_audit()
    completed = [item for item in privacy["items"] if item.get("request_status") == "completed"]
    pending = [item for item in privacy["items"] if item.get("request_status") != "completed"]
    return {
        "format": "tfse_privacy_fulfillment_verification_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "compliance_reviewer",
        "privacy_note": "此驗收包只保存 request id、手機末三碼、處理狀態、角色、狀態碼、audit log ID 與證據摘要；不得保存完整手機、Line ID、姓名、補充說明、證件、帳戶、卡號、密碼、session token 或 CSRF token。",
        "status": "pending_privacy_fulfillment" if pending else ("ready_for_privacy_fulfillment_verification" if privacy["items"] else "no_privacy_requests"),
        "backend_target": {
            "queue_endpoint": "GET /api/admin/privacy-requests",
            "fulfillment_endpoint": "PATCH /api/admin/privacy-requests/:lead_id",
            "audit_endpoint": "GET /api/admin/audit-logs",
            "target_tables": ["privacy_request_tasks", "lead_forms", "audit_logs"],
            "allowed_roles": ["super_admin", "consultant", "compliance_reviewer"],
            "required_auth": ["server_session", "csrf", "rbac"],
        },
        "local_context": {
            "total_requests": len(privacy["items"]),
            "pending_requests": len(pending),
            "completed_requests": len(completed),
            "retention_purge_candidates": retention["summary"]["purge_candidate_leads"],
            "pending_retention_blockers": len(retention["blockers"]),
            "audit_privacy_events": sum(1 for item in audit if item.get("action") in {"privacy_request_complete", "privacy_request_export", "data_retention_export"}),
        },
        "required_controls": [
            "正式 API 必須以 server session、CSRF 與 RBAC 驗證 super_admin / consultant / compliance_reviewer 權限。",
            "刪除請求完成時需更新 privacy_request_tasks.completed_at、handled_by、audit_log_id，並同步對 lead_forms 執行刪除、遮罩或更正。",
            "完成處理後不得在一般 CRM、匯出包、Line 分群或事件重放中保留完整手機、Line ID、補充說明或其他高敏個資。",
            "每次完成、拒絕、遮罩、匿名化與資料保留例外都需寫入 audit_logs，audit_logs 僅保存去識別摘要。",
            "未完成個資請求、投訴、事故或法務審核中的紀錄需標記 legal hold，不得被月檢排程自動刪除。",
        ],
        "test_cases": [
            {"key": "list_privacy_queue", "request": "GET /api/admin/privacy-requests", "expected": "只回傳去識別欄位、手機末三碼、狀態、請求時間與頁碼"},
            {"key": "complete_delete_request", "request": "PATCH /api/admin/privacy-requests/:lead_id", "expected": "privacy_request_tasks.completed_at、handled_by、audit_log_id 更新，lead_forms 聯絡欄位刪除或遮罩"},
            {"key": "complete_correction_request", "request": "PATCH /api/admin/privacy-requests/:lead_id", "expected": "更正欄位落庫且 audit_logs 可追溯，不保存原始錯誤個資全文"},
            {"key": "deny_viewer_fulfillment", "request": {"role": "viewer"}, "expected": "403，無 privacy_request_tasks 或 lead_forms 更新"},
            {"key": "verify_downstream_scrub", "request": "CRM/export/Line/event replay spot check", "expected": "完成請求後下游匯出不再出現完整聯絡資訊"},
        ],
        "evidence_fields": ["endpoint", "status_code", "privacy_request_id", "lead_id", "phone_last3", "request_type", "request_status", "handled_by_role", "csrf_checked", "rbac_checked", "lead_fields_scrubbed", "downstream_exports_checked", "audit_log_id", "checked_at", "evidence_note"],
        "blockers": [
            "正式後端尚未提供 privacy_request_tasks 完成處理與 lead_forms 遮罩/刪除證據。",
            "尚需在 staging 以授權與未授權角色各跑一次 PATCH /api/admin/privacy-requests/:lead_id。",
            "尚需抽查 CRM、Line 分群、事件重放、備份還原樣本，確認完成請求後不再暴露完整聯絡資訊。",
        ],
        "related_exports": [
            "tfse_privacy_request_queue",
            "tfse_data_retention_purge_plan",
            "tfse_line_optout_complaint_queue",
            "tfse_formal_backend_migration_package",
            "tfse_import_validation_package",
            "tfse_backend_acceptance_matrix",
        ],
    }


def local_backup_report():
    lead_items = leads()
    event_items = events()
    error_items = errors()
    audit_items = admin_audit()
    return {
        "format": "tfse_local_backup",
        "version": "2026-06-28",
        "exported_at": site_config_tooling.now_iso(),
        "exported_by_role": "data_manager",
        "source_mode": source_mode(),
        "data": {
            "leads": lead_items,
            "events": event_items,
            "errors": error_items,
            "audit": audit_items,
            "follow_ups": crm_follow_up_queue_report()["items"],
            "compliance_reviews": compliance_reviews(),
            "config_input_records": seed_items("config_input_records", ("checked_at",)),
            "backend_acceptance_records": seed_items("backend_acceptance_records", ("checked_at",)),
            "search_console_records": seed_items("search_console_records", ("checked_at",)),
            "external_execution_records": seed_items("external_execution_records", ("checked_at",)),
            "line_oa_records": seed_items("line_oa_records", ("checked_at",)),
            "launch_handoff_records": seed_items("launch_handoff_records", ("checked_at",)),
            "product_status": {},
            "product_overrides": {},
            "article_status": {},
            "article_overrides": {},
            "faq_overrides": {},
            "content_versions": content_version_snapshot_report(),
        },
    }


def ad_campaign_checklist_report():
    pages = admin_cutover_tooling.landing_pages()
    items = [
        {
            "slug": item.get("slug") or "",
            "landing_url": "lp/" + item.get("slug", "") + ".html" if item.get("slug") else "",
            "title": item.get("title") or "",
            "utm_example": f"?utm_source=facebook&utm_medium=paid_social&utm_campaign={item.get('slug', 'landing')}_2026q3&utm_content=creative_a&utm_term={item.get('category_slug', 'general')}",
        }
        for item in pages
    ]
    return {
        "format": "tfse_ad_campaign_checklist",
        "exported_at": site_config_tooling.now_iso(),
        "exported_by_role": "content_editor",
        "utm_standard": {
            "utm_source": "facebook",
            "utm_medium": "paid_social",
            "utm_campaign": "{slug}_2026q3",
            "utm_content": "{creative_name}",
            "utm_term": "{keyword_or_need}",
        },
        "items": items,
    }


def conversion_optimization_backlog_report():
    ad_campaign = ad_campaign_checklist_report()
    items = []
    for page in ad_campaign["items"]:
        items.append({
            "slug": page["slug"],
            "landing_url": page["landing_url"],
            "utm_example": page["utm_example"],
            "priority": "medium",
            "hypothesis": "若保留合規邊界並讓使用者更快理解查詢方向與不代辦，可提升免費健檢提交與 Line 承接。",
            "primary_kpi": "lead_rate_percent",
            "secondary_kpi": "line_click_rate_percent",
            "baseline": {
                "matched_campaigns": 0,
                "landing_page_views": 0,
                "free_check_cta_clicks": 0,
                "leads": 0,
                "line_clicks": 0,
                "lead_rate_percent": 0,
                "line_click_rate_percent": 0,
            },
            "guardrails": [
                "不得使用包過、保證核貸、快速放款、代辦或內部管道等禁用詞。",
                "不得新增證件、帳戶、卡號、密碼或附件收集欄位。",
                "保留免責聲明、來源政策、隱私同意與 Line 同意分離。",
            ],
            "next_actions": [
                "尚無歸因資料，投流前先使用標準 UTM URL 做 QA 點擊與表單測試。",
                "有流量後先檢查首屏 CTA、FAQ 順序與手機端可讀性。",
            ],
        })
    return {
        "format": "tfse_conversion_optimization_backlog",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "content_editor",
        "source_reports": ["tfse_ad_campaign_checklist", "tfse_utm_attribution_report", "tfse_browser_acceptance_report"],
        "privacy_note": "優化待辦只使用聚合數字、落地頁 slug 與 UTM，不輸出完整手機、Line ID 或表單補充說明。",
        "summary": {
            "landing_pages": len(items),
            "medium_priority": len(items),
            "items_without_attribution": len(items),
        },
        "experiment_rules": [
            "每輪只改一個主要變因，例如 CTA 文案、FAQ 順序或表單說明。",
            "投流前先跑文案即時預檢與法務/合規送審包。",
            "保留標準 UTM，方便 GA4、Meta Pixel、Server Event 與本機報表交叉核對。",
        ],
        "items": items,
        "related_exports": [
            "tfse_ad_campaign_checklist",
            "tfse_utm_attribution_report",
            "tfse_legal_compliance_review_package",
            "tfse_external_verification_evidence",
        ],
    }


def utm_attribution_report():
    event_items = events()
    lead_items = leads()
    buckets = {}

    def bucket_for(parts):
        key = attribution_key(parts)
        if key not in buckets:
            buckets[key] = make_attribution_bucket(parts)
        return buckets[key]

    for event in event_items:
        bucket = bucket_for(event_attribution_parts(event))
        if event.get("name") == "landing_page_view":
            bucket["landing_page_views"] += 1
        if event.get("name") == "cta_free_check_click":
            bucket["free_check_cta_clicks"] += 1
        if event.get("name") == "lead_submit":
            bucket["form_submits"] += 1
        if event.get("name") == "line_cta_click":
            bucket["line_clicks"] += 1
        path = event.get("path") or "/"
        bucket["pages"][path] = bucket["pages"].get(path, 0) + 1

    for lead in lead_items:
        bucket = bucket_for(lead_attribution_parts(lead))
        bucket["leads"] += 1
        need_key = lead.get("needs") or "未填需求"
        status_key = lead.get("status") or "new"
        bucket["needs"][need_key] = bucket["needs"].get(need_key, 0) + 1
        bucket["statuses"][status_key] = bucket["statuses"].get(status_key, 0) + 1

    campaigns = []
    for item in buckets.values():
        landing_or_clicks = item["landing_page_views"] or item["free_check_cta_clicks"]
        submit_base = item["free_check_cta_clicks"] or item["landing_page_views"]
        actions = []
        if not item["leads"] and (item["landing_page_views"] or item["free_check_cta_clicks"]):
            actions.append("有流量但尚無線索，優先檢查落地頁表單位置、隱私同意與 CTA 文案。")
        if submit_base and conversion_rate(item["leads"] or item["form_submits"], submit_base) < 15:
            actions.append("表單轉換偏低，建議測試較短表單說明與更明確的非代辦邊界。")
        if item["leads"] and conversion_rate(item["line_clicks"], item["leads"]) < 50:
            actions.append("Line 承接偏低，確認成功訊息、Line OA URL 與需求 quick reply 是否一致。")
        campaigns.append({
            "attribution_key": attribution_key({
                "source": item.get("utm_source"),
                "medium": item.get("utm_medium"),
                "campaign": item.get("utm_campaign"),
                "content": item.get("utm_content"),
                "term": item.get("utm_term"),
            }),
            "label": attribution_label(item),
            "utm_source": item["utm_source"],
            "utm_medium": item["utm_medium"],
            "utm_campaign": item["utm_campaign"],
            "utm_content": item["utm_content"],
            "utm_term": item["utm_term"],
            "landing_page_views": item["landing_page_views"],
            "free_check_cta_clicks": item["free_check_cta_clicks"],
            "form_submits": item["form_submits"],
            "line_clicks": item["line_clicks"],
            "leads": item["leads"],
            "lead_rate_percent": conversion_rate(item["leads"] or item["form_submits"], landing_or_clicks),
            "line_click_rate_percent": conversion_rate(item["line_clicks"], item["leads"] or item["form_submits"]),
            "top_needs": top_count_items(item["needs"], 5),
            "lead_statuses": top_count_items(item["statuses"], 5),
            "top_pages": top_count_items(item["pages"], 5),
            "next_actions": actions,
        })
    campaigns.sort(key=lambda item: -(item["leads"] + item["form_submits"] + item["free_check_cta_clicks"]))
    return {
        "format": "tfse_utm_attribution_report",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "viewer",
        "source_mode": source_mode(),
        "privacy_note": "報表僅輸出聚合歸因數字，不含完整手機、Line ID、補充說明或其他高敏個資。",
        "utm_standard": ad_campaign_checklist_report()["utm_standard"],
        "summary": {
            "campaigns": len(campaigns),
            "total_events": len(event_items),
            "total_leads": len(lead_items),
            "attributed_leads": sum(item["leads"] for item in campaigns),
            "paid_social_leads": sum(item["leads"] for item in campaigns if item.get("utm_medium") == "paid_social"),
            "direct_or_unknown_leads": sum(item["leads"] for item in campaigns if item.get("utm_source") in {"direct", "unknown"}),
        },
        "campaigns": campaigns,
        "next_actions": [f"{item['label']}：{action}" for item in campaigns for action in item["next_actions"]][:8] if campaigns else ["尚無 UTM 歸因資料，投流前需確認落地頁 URL 帶 utm_source、utm_medium、utm_campaign、utm_content 與 utm_term。"],
    }


def retrospective_report():
    event_items = events()
    lead_items = leads()
    error_items = errors()
    page_views = count_events(event_items, "page_view")
    cta_clicks = count_events(event_items, "cta_free_check_click")
    lead_submits = count_events(event_items, "lead_submit")
    line_clicks = count_events(event_items, "line_cta_click")
    search_events = count_events(event_items, "site_search") + count_events(event_items, "database_search")
    source_breakdown = sort_count_map(group_count(lead_items, lambda lead: lead.get("utm_source") or lead.get("source_channel") or "direct"))
    need_breakdown = sort_count_map(group_count(lead_items, lambda lead: lead.get("needs") or "未填需求"))
    page_breakdown = sort_count_map(group_count(event_items, lambda event: event.get("path") or "/"))[:10]
    suggestions = []
    if page_views and conversion_rate(cta_clicks, page_views) < 2:
        suggestions.append("免費健檢 CTA 點擊率偏低，優先檢查首頁、分類頁與文章頁 CTA 文案是否清楚。")
    if cta_clicks and conversion_rate(lead_submits, cta_clicks) < 20:
        suggestions.append("表單提交率偏低，檢查欄位數量、錯誤提示、隱私同意和 Line 承接說明。")
    if lead_submits and conversion_rate(line_clicks, lead_submits) < 50:
        suggestions.append("Line 承接點擊率偏低，確認 Line OA 連結、成功訊息和分群標籤是否足夠明確。")
    if error_items:
        suggestions.append("前台已有錯誤紀錄，需優先核對 Sentry 或伺服器事件端點。")
    if not event_items:
        suggestions.append("目前尚無事件資料，正式上線前需填入 GA4、Meta Pixel 與 Server Event endpoint 後重測。")
    return {
        "format": "tfse_retrospective_report",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "viewer",
        "source_mode": source_mode(),
        "funnel": {
            "page_view": page_views,
            "free_check_cta_click": cta_clicks,
            "lead_submit": lead_submits,
            "line_cta_click": line_clicks,
            "cta_click_rate_percent": conversion_rate(cta_clicks, page_views),
            "lead_submit_rate_percent": conversion_rate(lead_submits, cta_clicks),
            "line_click_rate_percent": conversion_rate(line_clicks, lead_submits),
        },
        "engagement": {
            "site_search_and_database_search": search_events,
            "database_filter": count_events(event_items, "database_filter"),
            "article_click": count_events(event_items, "article_click"),
            "landing_page_view": count_events(event_items, "landing_page_view"),
        },
        "lead_summary": {
            "total": len(lead_items),
            "by_source": source_breakdown,
            "by_need": need_breakdown,
            "by_status": sort_count_map(group_count(lead_items, lambda lead: lead.get("status") or "new")),
        },
        "top_paths": page_breakdown,
        "quality": {
            "error_count": len(error_items),
            "latest_error": {
                "source": error_items[0].get("source") or "",
                "message": error_items[0].get("message") or "",
                "at": error_items[0].get("at") or "",
            } if error_items else None,
        },
        "next_actions": suggestions,
    }


def server_event_replay_queue_report():
    analytics = site_config_tooling.load_site_config().get("analytics", {})
    missing_required = [
        "page_view",
        "cta_free_check_click",
        "lead_submit",
        "line_cta_click",
        "site_search",
        "database_filter",
        "landing_page_view",
    ]
    return {
        "format": "tfse_server_event_replay_queue",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "data_manager",
        "source_mode": site_config_tooling.load_site_config().get("backend", {}).get("mode", "localStorage"),
        "privacy_note": "事件重放隊列沿用 tfse-events.js scrub 規則，只輸出去識別 payload、路徑與事件名稱，不輸出完整手機、Line ID、姓名、補充說明或其他高敏個資。",
        "destinations": {
            "ga4": bool(analytics.get("ga4_measurement_id")),
            "meta_pixel": bool(analytics.get("meta_pixel_id")),
            "server_event_endpoint": bool(analytics.get("server_event_endpoint")),
            "sample_rate": analytics.get("sample_rate", 1) or 1,
        },
        "counts": {
            "events": 0,
            "queued_events": 0,
            "unique_event_names": 0,
            "pending_server_event_endpoint": 0 if analytics.get("server_event_endpoint") else 0,
            "missing_required_event_names": len(missing_required),
        },
        "event_name_counts": [],
        "missing_required_event_names": missing_required,
        "queue": [],
        "replay_steps": [
            "正式 endpoint 上線後，先以本隊列前 20 筆驗證 schema 與回應碼。",
            "確認 GA4、Meta、Server Event 事件名一致，再提高 sample_rate。",
            "回放失敗寫入 audit_logs 或 dead-letter queue，不重送敏感原始 payload。",
        ],
    }


def legal_compliance_review_package_report():
    config_ready = site_config_tooling.config_readiness_items(site_config_tooling.load_site_config())
    launch = release_tooling.build_launch_health_report()
    acceptance_pending = 4 if config_ready else 0
    items = [
        {"group": "廣告投流", "key": "ad_campaigns", "label": "廣告落地頁文案、UTM 與 CTA", "status": "ready", "evidence": f"廣告投流檢查清單涵蓋 {len(admin_cutover_tooling.landing_pages())} 個落地頁，投流前需由合規複核"},
        {"group": "資料來源", "key": "source_review", "label": "產品/機構來源與 90 天復核", "status": "needs_review" if source_review_queue_report()["items"] else "ready", "evidence": f"來源復核隊列目前 {len(source_review_queue_report()['items'])} 筆；正式發布需逐筆核對官方來源"},
        {"group": "文案規則", "key": "copy_scan", "label": "禁用詞、敏感個資與高風險 CTA", "status": "ready", "evidence": "compliance-rules.json 與文案即時預檢共用規則；命令列 compliance_scan 已納入驗收"},
        {"group": "隱私請求", "key": "privacy_requests", "label": "查詢/更正/刪除請求流程", "status": "ready", "evidence": "Admin 可標記、匯出與完成個資請求隊列；正式版需同步資料庫刪除或遮罩"},
        {"group": "正式配置", "key": "production_config", "label": "正式網址、追蹤、Search Console、Sentry、Line OA", "status": "external_pending" if launch["pending_count"] else "ready", "evidence": f"正式配置交接包 pending {sum(1 for item in config_ready if not item['done'])} 項；上線健康檢查 pending {launch['pending_count']} 項"},
        {"group": "驗收留痕", "key": "acceptance", "label": "人工瀏覽器驗收與外部配置驗證", "status": "manual_external" if acceptance_pending else "ready", "evidence": f"上線驗收清單 pending {acceptance_pending} 項；自動煙測不可取代法務與人工視覺確認"},
    ]
    status_counts = {}
    for item in items:
        status_counts[item["status"]] = status_counts.get(item["status"], 0) + 1
    return {
        "format": "tfse_legal_compliance_review_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "compliance_reviewer",
        "status_counts": status_counts,
        "items": items,
        "required_external_review": [
            "廣告文案與落地頁主張",
            "免費健檢表單欄位與個資告知",
            "隱私權政策、使用條款、免責聲明與來源政策",
            "Line OA 歡迎語、自動回覆、分群標籤與退訂/停止接收處理",
            "金融資訊呈現方式是否可能被誤認為代辦、放款或保證核貸",
        ],
        "evidence_files": [
            "assets/data/compliance-rules.json",
            "assets/data/line-flows.json",
            "assets/data/landing-pages.json",
            "assets/data/products.json",
            "privacy.html",
            "terms.html",
            "disclaimer.html",
            "source-policy.html",
            "LAUNCH_CHECKLIST.md",
            "OPERATIONS_RUNBOOK.md",
        ],
        "related_exports": [
            "tfse_ad_campaign_checklist",
            "tfse_source_review_queue",
            "tfse_privacy_request_queue",
            "tfse_line_segment_queue",
            "tfse_acceptance_checklist",
            "tfse_production_config_readiness",
            "tfse_form_risk_control_report",
        ],
    }


def legal_external_review_evidence_report():
    legal = legal_compliance_review_package_report()
    open_items = [item for item in legal["items"] if item["status"] != "ready"]
    return {
        "format": "tfse_legal_external_review_evidence",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "compliance_reviewer",
        "privacy_note": "外部複核留痕只保存服務、結果、責任人、時間與摘要，不保存完整個資、證件、帳戶、卡號或法律意見全文。",
        "status": "pending_external_review",
        "summary": {
            "legal_review_items": len(legal["items"]),
            "open_items": len(open_items),
            "external_records": 0,
            "latest_passed_at": "",
            "latest_owner": "",
        },
        "required_external_review": legal["required_external_review"],
        "evidence_package": {
            "source_format": legal["format"],
            "evidence_files": legal["evidence_files"],
            "related_exports": legal["related_exports"] + ["tfse_external_verification_evidence"],
        },
        "signoff_requirements": [
            "複核廣告落地頁、首頁、免費健檢、Line OA 話術與 SEO 文章是否維持資訊服務邊界。",
            "確認表單、隱私權政策、使用條款、免責聲明與資料來源政策沒有要求高敏資料或暗示代辦。",
            "確認所有需修改項目完成後，於外部配置驗證留痕選擇 legal_review 並保存去識別證據摘要。",
            "正式投流、SEO 大量收錄或 Line OA 對外承接前，需保留 reviewer、reviewed_at、result、evidence_note 與相關匯出包版本。",
        ],
        "open_items": open_items,
        "records": [],
        "related_exports": [
            "tfse_legal_compliance_review_package",
            "tfse_external_verification_evidence",
            "tfse_acceptance_checklist",
        ],
    }


def compliance_api_persistence_report():
    return {
        "format": "tfse_compliance_api_persistence_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "compliance_reviewer",
        "privacy_note": "此驗收包只保存合規審核與掃描摘要、角色、狀態碼與 audit log ID；不得保存法律意見全文、session token、CSRF token、完整手機、Line ID、證件、帳戶、卡號或密碼。",
        "status": "pending_compliance_api_persistence",
        "backend_target": {
            "write_endpoint": "POST /api/admin/compliance/review",
            "audit_endpoint": "GET /api/admin/audit-logs",
            "target_tables": ["compliance_reviews", "audit_logs"],
            "allowed_roles": ["super_admin", "compliance_reviewer"],
            "required_auth": ["server_session", "csrf", "rbac"],
        },
        "local_context": {
            "review_count": 0,
            "reviews_with_scan_payload": 0,
            "sensitive_scan_findings": 0,
            "audit_compliance_events": 0,
            "result_counts": {},
        },
        "required_controls": [
            "正式 API 必須以 server session、CSRF 與 RBAC 驗證 super_admin / compliance_reviewer 權限。",
            "每次審核寫入 compliance_reviews，並同步寫入 audit_logs，audit log 不保存 token、密碼或完整個資。",
            "scan_payload 僅保存禁用詞、免責聲明、高風險 CTA 與敏感要求摘要，拒收證件、帳戶、卡號、密碼等高敏原文。",
            "approved / needs_revision / rejected 三種結果需與前台發布、廣告投放和內容 API 切換流程關聯。",
            "未授權角色與 viewer 執行寫入時必須回傳拒絕狀態，並留下去識別 audit_logs。",
        ],
        "test_cases": [
            {"key": "create_page_review", "request": {"type": "page", "result": "approved"}, "expected": "201/200，返回 review.id 與 audit_log.id"},
            {"key": "create_ad_review_with_scan_payload", "request": {"type": "ad", "result": "needs_revision", "scan_payload": "summary_only"}, "expected": "scan payload 摘要入 compliance_reviews，敏感欄位被遮罩或拒收"},
            {"key": "reject_product_review", "request": {"type": "product", "result": "rejected"}, "expected": "產品不可進入 published/投流流程，audit_logs 可追溯"},
            {"key": "deny_viewer_write", "request": {"role": "viewer"}, "expected": "403，寫入被拒絕，無 compliance_reviews 新增"},
            {"key": "audit_log_query", "request": {"action": "compliance_review_save"}, "expected": "GET /api/admin/audit-logs 可查到去識別審計紀錄"},
        ],
        "evidence_fields": ["endpoint", "status_code", "review_id", "audit_log_id", "reviewer_role", "csrf_checked", "rbac_checked", "masked_fields_verified", "checked_at", "evidence_note"],
        "blockers": [
            "正式後端尚未提供 compliance_reviews 與 audit_logs 落庫證據。",
            "尚需在 staging 以授權與未授權角色各跑一次 POST /api/admin/compliance/review。",
            "尚需抽查前台發布、廣告投流與內容 API 切換是否會引用最新合規結果。",
        ],
        "related_exports": [
            "tfse_legal_compliance_review_package",
            "tfse_backend_acceptance_matrix",
            "tfse_content_api_cutover_package",
            "tfse_ad_campaign_checklist",
        ],
    }


def line_optout_api_verification_report():
    optout = line_optout_complaint_queue_report()
    return {
        "format": "tfse_line_optout_api_verification_package",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "compliance_reviewer",
        "privacy_note": "此驗收包只保存請求類型、手機末三碼、Line user id hash、狀態碼、處理結果、角色與 audit log ID；不得保存完整 Line 對話、明文 Line user id、完整手機、Email、證件、帳戶、卡號、密碼或 session token。",
        "status": "pending_line_optout_api_verification",
        "backend_target": {
            "queue_endpoint": "GET /api/admin/line-optout-complaints",
            "line_handoff_endpoint": "GET /api/admin/line-oa-handoff-check",
            "audit_endpoint": "GET /api/admin/audit-logs",
            "target_tables": ["line_optout_complaint_tasks", "privacy_request_tasks", "legal_compliance_review_packages", "audit_logs"],
            "allowed_roles": ["super_admin", "consultant", "compliance_reviewer"],
            "required_auth": ["server_session", "csrf", "rbac"],
        },
        "local_context": {
            "total_requests": optout["summary"]["total"],
            "complaints": optout["summary"]["complaints"],
            "optouts": optout["summary"]["optouts"],
            "pending_review": optout["summary"]["pending_review"],
            "audit_line_optout_events": 0,
        },
        "required_controls": [
            "正式 API 需將退訂、停止接收、投訴、封鎖與 review_required 請求寫入 line_optout_complaint_tasks，並記錄 request_type、status、line_user_id_hash、handled_at 與 assigned_to。",
            "涉及刪除/更正資料時需同步建立 privacy_request_tasks；涉及騷擾、誤導或代辦疑慮時需升級 legal_compliance_review_packages。",
            "完成處理時需移除 Line 分群標籤、停止主動訊息，並將結果寫入 audit_logs 或同等審計表。",
            "管理端只可查看去識別欄位，不得返回完整 Line 對話、明文 Line user id 或完整手機。",
            "Line OA 導向驗收與退訂 API 驗收需保持一致：站內入口、quick reply、退訂關鍵字與後台任務處理不可脫節。",
        ],
        "test_cases": [
            {"key": "keyword_optout", "request": {"keyword": "STOP"}, "expected": "建立 line_optout_complaint_tasks，request_type=line_optout，Line tag 移除可追溯"},
            {"key": "complaint_escalation", "request": {"keyword": "投訴", "note": "疑似誤導"}, "expected": "request_type=complaint，必要時升級 legal_compliance_review_packages"},
            {"key": "privacy_sync", "request": {"keyword": "刪除資料"}, "expected": "line_optout_complaint_tasks 與 privacy_request_tasks 同步建立"},
            {"key": "masked_admin_queue", "request": "GET /api/admin/line-optout-complaints", "expected": "只回傳去識別欄位、Line hash、手機末三碼與處理摘要"},
            {"key": "unauthorized_denied", "request": {"role": "viewer"}, "expected": "403，未授權角色不可查看或處理退訂/投訴隊列"},
        ],
        "evidence_fields": ["endpoint", "status_code", "line_optout_task_id", "privacy_request_id", "legal_review_id", "lead_id", "phone_last3", "line_user_id_hash", "handler_role", "line_tag_removed", "csrf_checked", "rbac_checked", "audit_log_id", "checked_at", "evidence_note"],
        "blockers": [
            "正式後端尚未提供 line_optout_complaint_tasks、privacy_request_tasks 與 legal review 升級的落庫證據。",
            "尚需在 staging 以 STOP、投訴、刪除資料關鍵字各跑一次實際收件與處理流程。",
            "尚需抽查 Line OA 後台移除標籤、停止主動訊息與站內 quick reply 導向是否一致。",
        ],
        "related_exports": [
            "tfse_line_optout_complaint_queue",
            "tfse_line_oa_handoff_check",
            "tfse_line_oa_setup_package",
            "tfse_privacy_request_queue",
            "tfse_privacy_fulfillment_verification_package",
            "tfse_legal_compliance_review_package",
            "tfse_backend_acceptance_matrix",
        ],
    }


def local_audit_matrix_report():
    browser = browser_acceptance_report.build_report()
    items = []
    for command in release_tooling.RELEASE_REQUIRED_COMMANDS:
        status = "ready_to_run"
        if any(token in command for token in ("production_", "search_console", "domain_cutover", "external_verification", "release_readiness", "launch_health", "backend_cutover_roadmap", "sentry_error", "tracking_consent", "monitoring_receipt", "seo_submission", "owner_cutover_bundle", "release_day_runsheet")):
            status = "ready_with_external_follow_up"
        if "browser_acceptance_verify" in command:
            status = "ready_with_manual_follow_up" if browser["pending_count"] else "ready_to_run"
        items.append({
            "group": "release_command",
            "command": command,
            "title": command,
            "status": status,
            "current_signal": "CLI command available in current workspace",
            "related_exports": [],
        })
    summary = {
        "total_commands": len(items),
        "ready_to_run": len([item for item in items if item["status"] == "ready_to_run"]),
        "ready_with_external_follow_up": len([item for item in items if item["status"] == "ready_with_external_follow_up"]),
        "ready_with_manual_follow_up": len([item for item in items if item["status"] == "ready_with_manual_follow_up"]),
    }
    return {
        "format": "tfse_local_audit_matrix",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "data_manager",
        "source": "LAUNCH_CHECKLIST / OPERATIONS_RUNBOOK local verification commands",
        "summary": summary,
        "status_definitions": {
            "ready_to_run": "本地上下文已具備，命令可直接作為本機閉環審計執行。",
            "ready_with_external_follow_up": "命令可直接執行，但結果仍會指向正式配置、正式後端或法務簽核待辦。",
            "ready_with_manual_follow_up": "命令可直接執行，但仍需人工瀏覽器留痕或會議 gate 記錄補齊。",
        },
        "items": items,
        "related_exports": [
            "tfse_release_readiness_package",
            "tfse_project_phase_audit",
            "tfse_project_plan_coverage_report",
            "tfse_plan_requirement_trace",
            "tfse_plan_closure_report",
            "tfse_backend_cutover_roadmap",
            "tfse_launch_handoff_manifest",
        ],
    }


def seo_indexing_followup_queue_report():
    submission = seo_tracking_tooling.seo_submission_report()
    base = submission["base_url"]
    products = admin_cutover_tooling.products()
    articles = admin_cutover_tooling.published_articles()
    categories = []
    for item in products:
        slug = item.get("category_slug") or item.get("category") or ""
        if slug and slug not in categories:
            categories.append(slug)
    tasks = [
        {"type": "canonical_page", "label": "首頁", "path": "index.html", "priority": "high", "reason": "品牌首頁與 canonical 主入口"},
        {"type": "canonical_page", "label": "資料庫首頁", "path": "database.html", "priority": "high", "reason": "金融商品資料庫入口"},
        {"type": "canonical_page", "label": "金融知識列表", "path": "articles.html", "priority": "high", "reason": "SEO 內容中心入口"},
        {"type": "canonical_page", "label": "免費財務健檢", "path": "free-check.html", "priority": "high", "reason": "主要轉換入口，需確認 no sensitive data copy"},
    ]
    for slug in categories[:12]:
        tasks.append({"type": "category_alias", "label": slug, "path": slug + ".html", "priority": "medium", "reason": "分類入口與內鏈確認"})
    for product in products[:20]:
        tasks.append({"type": "product_detail", "label": product.get("title") or product.get("slug") or "", "path": "products/" + (product.get("slug") or "") + ".html", "priority": "medium", "reason": "產品資料來源與更新日需可被搜尋引擎讀取"})
    for article in articles[:20]:
        tasks.append({"type": "article_detail", "label": article.get("title") or "", "path": "articles/" + (article.get("slug") or "") + ".html", "priority": "medium", "reason": "首批 SEO 文章需追蹤索引與內鏈"})
    for page in admin_cutover_tooling.landing_pages()[:8]:
        tasks.append({"type": "landing_page", "label": page.get("title") or page.get("slug") or "", "path": "lp/" + page.get("slug", "") + ".html", "priority": "low", "reason": "投流頁需確認 canonical、合規與是否允許索引"})
    return {
        "format": "tfse_seo_indexing_followup_queue",
        "version": "2026-06-28",
        "generated_at": site_config_tooling.now_iso(),
        "generated_by_role": "seo_owner",
        "base_url": base,
        "search_console_configured": submission["search_console"]["google_site_verification_configured"],
        "privacy_note": "只輸出 URL、索引檢查欄位與證據備註，不輸出潛客、手機、Line ID 或表單資料。",
        "summary": {
            "tasks": len(tasks),
            "high_priority": len([item for item in tasks if item["priority"] == "high"]),
            "medium_priority": len([item for item in tasks if item["priority"] == "medium"]),
            "low_priority": len([item for item in tasks if item["priority"] == "low"]),
            "blockers": len(submission["blockers"]),
        },
        "evidence_fields": ["inspected_at", "coverage_status", "indexed_url", "last_crawl_time", "sitemap_seen", "canonical_selected_by_google", "evidence_note", "owner"],
        "items": tasks,
        "blockers": submission["blockers"],
        "related_exports": [
            "tfse_seo_submission_package",
            "tfse_domain_cutover_package",
            "tfse_external_verification_evidence",
        ],
    }
