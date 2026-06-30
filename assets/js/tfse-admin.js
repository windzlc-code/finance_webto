(function () {
    "use strict";

    var list = document.querySelector("[data-admin-leads]");
    var detail = document.querySelector("[data-admin-detail]");
    var search = document.querySelector("[data-admin-search]");
    var status = document.querySelector("[data-admin-status]");
    var tagFilter = document.querySelector("[data-admin-tag]");
    var sourceFilter = document.querySelector("[data-admin-source]");
    var exportButton = document.querySelector("[data-admin-export]");
    var seedButton = document.querySelector("[data-admin-seed]");
    var refreshButton = document.querySelector("[data-admin-refresh]");
    var currentDatePill = document.querySelector("[data-admin-current-date]");
    var realMetricsPanel = document.querySelector("[data-admin-real-metrics]");
    var followUpsPanel = document.querySelector("[data-admin-follow-ups]");
    var followUpsExportButton = document.querySelector("[data-admin-follow-ups-export]");
    var contactLogExportButton = document.querySelector("[data-admin-contact-log-export]");
    var crmApiExportButton = document.querySelector("[data-admin-crm-api-export]");
    var leadDedupePanel = document.querySelector("[data-admin-lead-dedupe]");
    var leadDedupeExportButton = document.querySelector("[data-admin-lead-dedupe-export]");
    var productsTable = document.querySelector("[data-admin-products]");
    var productCreateForm = document.querySelector("[data-admin-product-create-form]");
    var productCreateStatus = document.querySelector("[data-admin-product-create-status]");
    var sourceReviewPanel = document.querySelector("[data-admin-source-review]");
    var sourceReviewExportButton = document.querySelector("[data-admin-source-review-export]");
    var sourceEvidencePanel = document.querySelector("[data-admin-source-evidence]");
    var sourceEvidenceProduct = document.querySelector("[data-source-evidence-product]");
    var sourceEvidenceResult = document.querySelector("[data-source-evidence-result]");
    var sourceEvidenceUrl = document.querySelector("[data-source-evidence-url]");
    var sourceEvidenceNote = document.querySelector("[data-source-evidence-note]");
    var sourceEvidenceSaveButton = document.querySelector("[data-source-evidence-save]");
    var sourceEvidenceExportButton = document.querySelector("[data-admin-source-evidence-export]");
    var institutionImportExportButton = document.querySelector("[data-admin-institution-import-export]");
    var publicFeedbackPanel = document.querySelector("[data-admin-public-feedback]");
    var publicFeedbackExportButton = document.querySelector("[data-admin-public-feedback-export]");
    var publicFeedbackApiExportButton = document.querySelector("[data-admin-public-feedback-api-export]");
    var articlesTable = document.querySelector("[data-admin-articles]");
    var articleCreateForm = document.querySelector("[data-admin-article-create-form]");
    var articleCreateStatus = document.querySelector("[data-admin-article-create-status]");
    var articleReviewPanel = document.querySelector("[data-admin-article-review]");
    var contentVersionsPanel = document.querySelector("[data-admin-content-versions]");
    var contentVersionsExportButton = document.querySelector("[data-admin-content-versions-export]");
    var contentApiExportButton = document.querySelector("[data-admin-content-api-export]");
    var faqPanel = document.querySelector("[data-admin-faq]");
    var compliancePanel = document.querySelector("[data-admin-compliance]");
    var complianceButton = document.querySelector("[data-admin-run-compliance]");
    var formRiskPanel = document.querySelector("[data-admin-form-risk]");
    var formRiskExportButton = document.querySelector("[data-admin-form-risk-export]");
    var turnstileExportButton = document.querySelector("[data-admin-turnstile-export]");
    var authPanel = document.querySelector("[data-admin-auth]");
    var protectedPanels = document.querySelectorAll("[data-admin-protected]");
    var passwordInput = document.querySelector("[data-admin-password]");
    var roleSelect = document.querySelector("[data-admin-role]");
    var loginButton = document.querySelector("[data-admin-login]");
    var loginMessage = document.querySelector("[data-admin-login-message]");
    var visualConsolePanel = document.querySelector("[data-admin-visual-console]");
    var completionOverviewPanel = document.querySelector("[data-admin-completion-overview]");
    var securityMatrixPanel = document.querySelector("[data-admin-security-matrix]");
    var securityMatrixExportButton = document.querySelector("[data-admin-security-matrix-export]");
    var securityHeadersExportButton = document.querySelector("[data-admin-security-headers-export]");
    var authCutoverExportButton = document.querySelector("[data-admin-auth-cutover-export]");
    var analyticsPanel = document.querySelector("[data-admin-analytics]");
    var eventsPanel = document.querySelector("[data-admin-events]");
    var clearEventsButton = document.querySelector("[data-admin-clear-events]");
    var retrospectiveExportButton = document.querySelector("[data-admin-retrospective-export]");
    var trackingConsentExportButton = document.querySelector("[data-admin-tracking-consent-export]");
    var attributionPanel = document.querySelector("[data-admin-attribution]");
    var attributionExportButton = document.querySelector("[data-admin-attribution-export]");
    var eventReplayPanel = document.querySelector("[data-admin-event-replay]");
    var eventReplayExportButton = document.querySelector("[data-admin-event-replay-export]");
    var monitoringReceiptExportButton = document.querySelector("[data-admin-monitoring-receipt-export]");
    var analyticsDebugExportButton = document.querySelector("[data-admin-analytics-debug-export]");
    var sentryVerificationExportButton = document.querySelector("[data-admin-sentry-verification-export]");
    var launchHealthPanel = document.querySelector("[data-admin-launch-health]");
    var launchHealthExportButton = document.querySelector("[data-admin-launch-health-export]");
    var releaseReadinessPanel = document.querySelector("[data-admin-release-readiness]");
    var releaseReadinessExportButton = document.querySelector("[data-admin-release-readiness-export]");
    var localAuditMatrixPanel = document.querySelector("[data-admin-local-audit-matrix]");
    var localAuditMatrixExportButton = document.querySelector("[data-admin-local-audit-matrix-export]");
    var planCoveragePanel = document.querySelector("[data-admin-plan-coverage]");
    var planCoverageExportButton = document.querySelector("[data-admin-plan-coverage-export]");
    var planRequirementsPanel = document.querySelector("[data-admin-plan-requirements]");
    var planRequirementsExportButton = document.querySelector("[data-admin-plan-requirements-export]");
    var phaseAuditPanel = document.querySelector("[data-admin-phase-audit]");
    var phaseAuditExportButton = document.querySelector("[data-admin-phase-audit-export]");
    var planClosurePanel = document.querySelector("[data-admin-plan-closure]");
    var planClosureExportButton = document.querySelector("[data-admin-plan-closure-export]");
    var externalExecutionPanel = document.querySelector("[data-admin-external-execution]");
    var externalExecutionExportButton = document.querySelector("[data-admin-external-execution-export]");
    var externalExecutionRecordsPanel = document.querySelector("[data-admin-external-execution-records]");
    var externalExecutionForm = document.querySelector("[data-admin-external-execution-form]");
    var externalExecutionItem = document.querySelector("[data-external-execution-item]");
    var externalExecutionResult = document.querySelector("[data-external-execution-result]");
    var externalExecutionOwner = document.querySelector("[data-external-execution-owner]");
    var externalExecutionNote = document.querySelector("[data-external-execution-note]");
    var launchHandoffPanel = document.querySelector("[data-admin-launch-handoff]");
    var launchHandoffExportButton = document.querySelector("[data-admin-launch-handoff-export]");
    var launchHandoffRecordsPanel = document.querySelector("[data-admin-launch-handoff-records]");
    var launchHandoffForm = document.querySelector("[data-admin-launch-handoff-form]");
    var launchHandoffCheckpoint = document.querySelector("[data-launch-handoff-checkpoint]");
    var launchHandoffResult = document.querySelector("[data-launch-handoff-result]");
    var launchHandoffOwner = document.querySelector("[data-launch-handoff-owner]");
    var launchHandoffNote = document.querySelector("[data-launch-handoff-note]");
    var ownerCutoverBundlePanel = document.querySelector("[data-admin-owner-cutover-bundle]");
    var ownerCutoverBundleExportButton = document.querySelector("[data-admin-owner-cutover-bundle-export]");
    var releaseDayRunsheetPanel = document.querySelector("[data-admin-release-day-runsheet]");
    var releaseDayRunsheetExportButton = document.querySelector("[data-admin-release-day-runsheet-export]");
    var operationsTasksPanel = document.querySelector("[data-admin-operations-tasks]");
    var operationsTasksExportButton = document.querySelector("[data-admin-operations-tasks-export]");
    var incidentResponsePanel = document.querySelector("[data-admin-incident-response]");
    var incidentResponseExportButton = document.querySelector("[data-admin-incident-response-export]");
    var configReadinessPanel = document.querySelector("[data-admin-config-readiness]");
    var configReadinessExportButton = document.querySelector("[data-admin-config-readiness-export]");
    var configDraftPanel = document.querySelector("[data-admin-config-draft]");
    var configDraftInput = document.querySelector("[data-admin-config-draft-input]");
    var configDraftTemplateButton = document.querySelector("[data-admin-config-draft-template]");
    var configDraftExportButton = document.querySelector("[data-admin-config-draft-export]");
    var configApprovalExportButton = document.querySelector("[data-admin-config-approval-export]");
    var envTemplatePanel = document.querySelector("[data-admin-env-template]");
    var envTemplateExportButton = document.querySelector("[data-admin-env-template-export]");
    var configInputPacketPanel = document.querySelector("[data-admin-config-input-packet]");
    var configInputPacketExportButton = document.querySelector("[data-admin-config-input-packet-export]");
    var configInputRecordsPanel = document.querySelector("[data-admin-config-input-records]");
    var configInputForm = document.querySelector("[data-admin-config-input-form]");
    var configInputKey = document.querySelector("[data-config-input-key]");
    var configInputResult = document.querySelector("[data-config-input-result]");
    var configInputOwner = document.querySelector("[data-config-input-owner]");
    var configInputNote = document.querySelector("[data-config-input-note]");
    var launchCutoverAuditPanel = document.querySelector("[data-admin-launch-cutover-audit]");
    var launchCutoverAuditExportButton = document.querySelector("[data-admin-launch-cutover-audit-export]");
    var launchExecutionPlanPanel = document.querySelector("[data-admin-launch-execution-plan]");
    var launchExecutionPlanExportButton = document.querySelector("[data-admin-launch-execution-plan-export]");
    var launchCountdownPlanPanel = document.querySelector("[data-admin-launch-countdown-plan]");
    var launchCountdownPlanExportButton = document.querySelector("[data-admin-launch-countdown-plan-export]");
    var domainCutoverPanel = document.querySelector("[data-admin-domain-cutover]");
    var domainCutoverExportButton = document.querySelector("[data-admin-domain-cutover-export]");
    var hostFallbackExportButton = document.querySelector("[data-admin-host-fallback-export]");
    var backendRoadmapPanel = document.querySelector("[data-admin-backend-roadmap]");
    var backendRoadmapExportButton = document.querySelector("[data-admin-backend-roadmap-export]");
    var backendAcceptancePanel = document.querySelector("[data-admin-backend-acceptance]");
    var backendAcceptanceExportButton = document.querySelector("[data-admin-backend-acceptance-export]");
    var backendAcceptanceRecordsPanel = document.querySelector("[data-admin-backend-acceptance-records]");
    var backendAcceptanceForm = document.querySelector("[data-admin-backend-acceptance-form]");
    var backendAcceptanceEndpoint = document.querySelector("[data-backend-acceptance-endpoint]");
    var backendAcceptanceResult = document.querySelector("[data-backend-acceptance-result]");
    var backendAcceptanceOwner = document.querySelector("[data-backend-acceptance-owner]");
    var backendAcceptanceNote = document.querySelector("[data-backend-acceptance-note]");
    var seoSubmissionPanel = document.querySelector("[data-admin-seo-submission]");
    var seoSubmissionExportButton = document.querySelector("[data-admin-seo-submission-export]");
    var searchConsoleExportButton = document.querySelector("[data-admin-search-console-export]");
    var searchConsoleRecordsPanel = document.querySelector("[data-admin-search-console-records]");
    var searchConsoleForm = document.querySelector("[data-admin-search-console-form]");
    var searchConsoleTarget = document.querySelector("[data-search-console-target]");
    var searchConsoleResult = document.querySelector("[data-search-console-result]");
    var searchConsoleOwner = document.querySelector("[data-search-console-owner]");
    var searchConsoleNote = document.querySelector("[data-search-console-note]");
    var seoIndexingPanel = document.querySelector("[data-admin-seo-indexing]");
    var seoIndexingExportButton = document.querySelector("[data-admin-seo-indexing-export]");
    var acceptanceChecklistPanel = document.querySelector("[data-admin-acceptance-checklist]");
    var acceptanceExportButton = document.querySelector("[data-admin-acceptance-export]");
    var externalVerificationPanel = document.querySelector("[data-admin-external-verification]");
    var externalVerificationForm = document.querySelector("[data-admin-external-verification-form]");
    var externalVerificationService = document.querySelector("[data-external-verification-service]");
    var externalVerificationResult = document.querySelector("[data-external-verification-result]");
    var externalVerificationOwner = document.querySelector("[data-external-verification-owner]");
    var externalVerificationNote = document.querySelector("[data-external-verification-note]");
    var externalVerificationExportButton = document.querySelector("[data-admin-external-verification-export]");
    var browserAcceptancePanel = document.querySelector("[data-admin-browser-acceptance]");
    var browserAcceptanceForm = document.querySelector("[data-admin-browser-acceptance-form]");
    var browserAcceptanceItem = document.querySelector("[data-browser-acceptance-item]");
    var browserAcceptanceViewport = document.querySelector("[data-browser-acceptance-viewport]");
    var browserAcceptanceResult = document.querySelector("[data-browser-acceptance-result]");
    var browserAcceptanceNote = document.querySelector("[data-browser-acceptance-note]");
    var browserAcceptanceExportButton = document.querySelector("[data-admin-browser-acceptance-export]");
    var privacyRequestsPanel = document.querySelector("[data-admin-privacy-requests]");
    var privacyExportButton = document.querySelector("[data-admin-privacy-export]");
    var privacyFulfillmentExportButton = document.querySelector("[data-admin-privacy-fulfillment-export]");
    var dataRetentionPanel = document.querySelector("[data-admin-data-retention]");
    var dataRetentionExportButton = document.querySelector("[data-admin-data-retention-export]");
    var lineSegmentsPanel = document.querySelector("[data-admin-line-segments]");
    var lineSegmentsExportButton = document.querySelector("[data-admin-line-segments-export]");
    var lineOaSetupExportButton = document.querySelector("[data-admin-line-oa-setup-export]");
    var lineOaHandoffExportButton = document.querySelector("[data-admin-line-oa-handoff-export]");
    var lineOaRecordsPanel = document.querySelector("[data-admin-line-oa-records]");
    var lineOaForm = document.querySelector("[data-admin-line-oa-form]");
    var lineOaTask = document.querySelector("[data-line-oa-task]");
    var lineOaResult = document.querySelector("[data-line-oa-result]");
    var lineOaOwner = document.querySelector("[data-line-oa-owner]");
    var lineOaNote = document.querySelector("[data-line-oa-note]");
    var lineOptoutPanel = document.querySelector("[data-admin-line-optout]");
    var lineOptoutExportButton = document.querySelector("[data-admin-line-optout-export]");
    var lineOptoutApiExportButton = document.querySelector("[data-admin-line-optout-api-export]");
    var adCampaignsPanel = document.querySelector("[data-admin-ad-campaigns]");
    var adCampaignsExportButton = document.querySelector("[data-admin-ad-campaigns-export]");
    var conversionBacklogPanel = document.querySelector("[data-admin-conversion-backlog]");
    var conversionBacklogExportButton = document.querySelector("[data-admin-conversion-backlog-export]");
    var auditPanel = document.querySelector("[data-admin-audit]");
    var reviewType = document.querySelector("[data-review-type]");
    var reviewTarget = document.querySelector("[data-review-target]");
    var reviewResult = document.querySelector("[data-review-result]");
    var reviewNote = document.querySelector("[data-review-note]");
    var reviewSave = document.querySelector("[data-review-save]");
    var complianceCopyInput = document.querySelector("[data-compliance-copy-input]");
    var complianceCopyScan = document.querySelector("[data-compliance-copy-scan]");
    var complianceCopyResult = document.querySelector("[data-compliance-copy-result]");
    var legalReviewPanel = document.querySelector("[data-admin-legal-review]");
    var legalReviewExportButton = document.querySelector("[data-admin-legal-review-export]");
    var legalExternalReviewExportButton = document.querySelector("[data-admin-legal-external-review-export]");
    var complianceApiExportButton = document.querySelector("[data-admin-compliance-api-export]");
    var backupExportButton = document.querySelector("[data-admin-backup-export]");
    var migrationExportButton = document.querySelector("[data-admin-migration-export]");
    var importValidationExportButton = document.querySelector("[data-admin-import-validation-export]");
    var restoreDrillExportButton = document.querySelector("[data-admin-restore-drill-export]");
    var backupReceiptExportButton = document.querySelector("[data-admin-backup-receipt-export]");
    var backupImportButton = document.querySelector("[data-admin-backup-import]");
    var backupFileInput = document.querySelector("[data-admin-backup-file]");
    var backupStatus = document.querySelector("[data-admin-backup-status]");

    if (!list) return;

    var selectedId = "";
    var productData = [];
    var articleData = [];
    var faqData = [];
    var institutionData = [];
    var landingPageData = [];
    var lineFlowData = {};
    var complianceRules = null;
    var siteConfigData = {};
    var browserAcceptanceSeedRecords = [];
    var sourceEvidenceSeedRecords = [];
    var adminRecordSeedData = {};
    var visualConsoleState = {
        tab: "dashboard",
        status: "all",
        source: "all",
        owner: "all",
        query: "",
        selectedLeadId: "",
        page: 1,
        pageSize: 8
    };
    var adminPassword = "admin123";
    var leadSourceMode = "localStorage";
    var publicFeedbackSourceMode = "localStorage";
    var productSourceMode = "static";
    var articleSourceMode = "static";
    var publicFeedbackItemsCache = [];
    var editingProductId = "";
    var editingArticleId = "";
    var editingFaqId = "";
    var latestComplianceScanPayload = null;

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function makeAdminSlug(value, fallbackPrefix) {
        var base = String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return base || (fallbackPrefix + "-" + Date.now().toString(36));
    }

    function formatAdminSnippet(content) {
        if (!String(content || "").trim()) {
            return "";
        }
        return "<pre style=\"margin-top:12px; padding:12px; border:1px solid rgba(3,15,39,0.12); border-radius:6px; background:#f7f9fc; color:#030f27; white-space:pre-wrap; word-break:break-word; font-size:12px; line-height:1.6;\">" + escapeHtml(content) + "</pre>";
    }

    function renderPatchEnvDetails(patchTemplate, envSnippet) {
        var patchContent = patchTemplate && Object.keys(patchTemplate).length
            ? formatAdminSnippet(JSON.stringify(patchTemplate, null, 2))
            : "";
        var envContent = String(envSnippet || "").trim()
            ? formatAdminSnippet(String(envSnippet || "").trim())
            : "";
        if (!patchContent && !envContent) {
            return "";
        }
        return [
            "<details style=\"margin-top:12px;\">",
            "<summary style=\"cursor:pointer; color:#1292ee;\">查看 patch / env 片段</summary>",
            patchContent ? "<p style=\"margin-top:12px;\"><strong>Patch template</strong></p>" + patchContent : "",
            envContent ? "<p style=\"margin-top:12px;\"><strong>.env snippet</strong></p>" + envContent : "",
            "</details>"
        ].join("");
    }

    function getLeads() {
        try {
            return JSON.parse(localStorage.getItem("tfse_leads") || "[]").filter(function (lead) {
                return lead && !lead.is_sample && (lead.tags || []).indexOf("sample_lead") === -1 && String(lead.id || "").indexOf("lead_sample_") !== 0;
            });
        } catch (error) {
            return [];
        }
    }

    function saveLeads(leads) {
        localStorage.setItem("tfse_leads", JSON.stringify(leads));
    }

    function syncLeadsFromApi() {
        if (!window.TFSEApi || !window.TFSEApi.listLeads) {
            renderList();
            renderFollowUps();
            renderLeadDedupe();
            renderLineOptout();
            return Promise.resolve({ mode: "localStorage" });
        }
        return window.TFSEApi.listLeads().then(function (result) {
            leadSourceMode = result.mode || "localStorage";
            if (Array.isArray(result.items) && result.mode === "api") {
                saveLeads(result.items);
            }
            renderList();
            renderFollowUps();
            renderLeadDedupe();
            renderAnalytics();
            renderAttribution();
            renderConversionBacklog();
            renderLineOptout();
            renderRealMetrics();
            renderVisualConsole();
            return result;
        });
    }

    function syncPublicFeedbackFromApi() {
        if (!window.TFSEApi || !window.TFSEApi.listPublicFeedback) {
            publicFeedbackItemsCache = safeReadStorage("tfse_public_feedback_tickets", []);
            renderPublicFeedback();
            return Promise.resolve({ mode: "localStorage", items: publicFeedbackItemsCache });
        }
        return window.TFSEApi.listPublicFeedback().then(function (result) {
            publicFeedbackSourceMode = result.mode || "localStorage";
            publicFeedbackItemsCache = Array.isArray(result.items) ? result.items : [];
            if (result.mode === "api") {
                try {
                    localStorage.setItem("tfse_public_feedback_tickets", JSON.stringify(publicFeedbackItemsCache));
                } catch (error) {
                    // Keep admin rendering resilient when storage is unavailable.
                }
            }
            renderRealMetrics();
            renderPublicFeedback();
            return result;
        });
    }

    function syncAdminContentFromApi() {
        if (!isAuthenticated()) {
            productSourceMode = "static";
            articleSourceMode = "static";
            renderProducts();
            renderArticles();
            renderContentVersions();
            renderCompliance();
            return Promise.resolve({ mode: "static_unauthenticated" });
        }
        if (!window.TFSEApi || !window.TFSEApi.adminListProducts || !window.TFSEApi.adminListArticles) {
            renderProducts();
            renderArticles();
            renderContentVersions();
            renderCompliance();
            return Promise.resolve({ mode: "static" });
        }
        return Promise.all([
            window.TFSEApi.adminListProducts({}),
            window.TFSEApi.adminListArticles({ status: "" })
        ]).then(function (results) {
            var productResult = results[0] || {};
            var articleResult = results[1] || {};
            productSourceMode = productResult.mode || productSourceMode;
            articleSourceMode = articleResult.mode || articleSourceMode;
            if (Array.isArray(productResult.items)) {
                productData = productResult.items;
            }
            if (Array.isArray(articleResult.items)) {
                articleData = articleResult.items;
            }
            renderProducts();
            renderArticles();
            renderContentVersions();
            renderCompliance();
            renderSourceReview();
            return {
                mode: productSourceMode + "/" + articleSourceMode,
                products: productData.length,
                articles: articleData.length
            };
        }).catch(function (error) {
            addAudit("admin_content_sync_failed", error && error.message ? error.message : error);
            renderProducts();
            renderArticles();
            renderCompliance();
            return { mode: "api_error", error: error };
        });
    }

    function isAuthenticated() {
        return localStorage.getItem("tfse_admin_auth") === "true";
    }

    function authSource() {
        return localStorage.getItem("tfse_admin_auth_source") || "local_mvp";
    }

    function setAuthenticated(value, source) {
        if (value) {
            localStorage.setItem("tfse_admin_auth", "true");
            localStorage.setItem("tfse_admin_auth_source", source || authSource() || "local_mvp");
        } else {
            localStorage.removeItem("tfse_admin_auth");
            localStorage.removeItem("tfse_admin_auth_source");
        }
    }

    function currentRole() {
        return localStorage.getItem("tfse_admin_role") || "viewer";
    }

    function setRole(value) {
        localStorage.setItem("tfse_admin_role", value || "viewer");
    }

    function roleLabel(role) {
        var labels = {
            super_admin: "Super Admin",
            content_editor: "Content Editor",
            data_manager: "Data Manager",
            compliance_reviewer: "Compliance Reviewer",
            consultant: "Consultant",
            viewer: "Viewer"
        };
        return labels[role] || "Viewer";
    }

    function permissionMatrix() {
        return {
            export: ["super_admin", "data_manager"],
            backup: ["super_admin", "data_manager"],
            retrospective: ["super_admin", "viewer", "consultant", "content_editor", "data_manager", "compliance_reviewer"],
            launch_health: ["super_admin", "viewer", "data_manager", "compliance_reviewer"],
            acceptance: ["super_admin", "viewer", "data_manager", "compliance_reviewer"],
            privacy_request: ["super_admin", "consultant", "compliance_reviewer"],
            line_segment: ["super_admin", "consultant", "content_editor"],
            ad_campaign: ["super_admin", "content_editor", "compliance_reviewer"],
            source_review: ["super_admin", "data_manager", "compliance_reviewer"],
            update_lead: ["super_admin", "consultant"],
            manage_product: ["super_admin", "data_manager"],
            manage_article: ["super_admin", "content_editor"],
            review_article: ["super_admin", "content_editor", "compliance_reviewer"],
            manage_faq: ["super_admin", "content_editor"],
            compliance: ["super_admin", "compliance_reviewer"],
            legal_review: ["super_admin", "compliance_reviewer"],
            analytics: ["super_admin", "viewer", "consultant", "content_editor", "data_manager", "compliance_reviewer"]
        };
    }

    function can(permission) {
        var role = currentRole();
        return (permissionMatrix()[permission] || []).indexOf(role) !== -1;
    }

    function adminSecurityMatrixPayload() {
        var roles = ["super_admin", "content_editor", "data_manager", "compliance_reviewer", "consultant", "viewer"];
        var permissions = permissionMatrix();
        var matrix = roles.map(function (role) {
            return {
                role: role,
                label: roleLabel(role),
                permissions: Object.keys(permissions).filter(function (permission) {
                    return permissions[permission].indexOf(role) !== -1;
                }).sort()
            };
        });
        return {
            format: "tfse_admin_security_matrix",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            privacy_note: "此包只輸出角色、權限、正式安全檢查與證據，不包含密碼、session token、CSRF token、手機或 Line ID。",
            roles: matrix,
            checks: [
                { key: "server_session", label: "正式伺服器 session", status: "contract_ready", evidence: "/api/admin/auth/login、/api/admin/auth/session、/api/admin/auth/logout 已納入 API 合約。" },
                { key: "csrf", label: "CSRF token", status: "contract_ready", evidence: "admin_sessions 保存 csrf_token_hash，登入與登出端點要求 csrf_token。" },
                { key: "password_hash", label: "密碼雜湊", status: "schema_ready", evidence: "admin_users 僅保存 password_hash，不保存明文密碼。" },
                { key: "mfa", label: "MFA 欄位", status: "schema_ready", evidence: "admin_users.mfa_enabled 與登入 request.mfa_code 已預留。" },
                { key: "rbac", label: "角色權限矩陣", status: "mvp_ready", evidence: "本機 MVP 以 permissionMatrix 控制匯出、CRM、資料庫、文章、合規、投流與運維權限。" },
                { key: "audit", label: "敏感操作審計", status: "mvp_ready", evidence: "匯出、狀態更新、合規審核、個資處理、來源復核等會寫入本機審計；正式版需落 audit_logs。" },
                { key: "viewer_masking", label: "Viewer 遮罩", status: "contract_required", evidence: "正式版需限制 Viewer 不可看到完整手機、Line ID 或匯出個資。" }
            ],
            blockers: [
                "正式上線前需以 server-side session 取代本機 MVP 明碼驗證。",
                "正式 API 需以 httpOnly Secure SameSite cookie 保存 session，並在敏感 POST/PATCH 驗證 CSRF。",
                "Viewer 與非授權角色需遮罩完整手機與 Line ID，匯出需寫入 audit_logs。"
            ],
            related_exports: ["tfse_backend_acceptance_matrix", "tfse_formal_backend_migration_package", "tfse_privacy_request_queue", "tfse_admin_audit_log"]
        };
    }

    function securityHeadersPayload() {
        var base = (siteConfigData.base_url || "").replace(/\/$/, "");
        var absolute = function (path) {
            return base ? base + "/" + path.replace(/^\//, "") : path;
        };
        return {
            format: "tfse_security_headers_deployment_check",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source_files: ["_headers", ".well-known/security.txt", "DEPLOYMENT.md", "OPERATIONS_RUNBOOK.md"],
            status: "requires_formal_host_verification",
            privacy_note: "此包只保存安全標頭、部署檢查與公開 URL，不保存 cookie、session token、CSRF token、密鑰或個資。",
            expected_headers: [
                "Content-Security-Policy",
                "X-Frame-Options: DENY",
                "X-Content-Type-Options: nosniff",
                "Referrer-Policy: strict-origin-when-cross-origin",
                "Permissions-Policy",
                "Cache-Control for /assets/*",
                "Cache-Control: no-store for /site-config.json"
            ],
            csp_allowlist: [
                "self",
                "https://www.googletagmanager.com",
                "https://connect.facebook.net",
                "https://browser.sentry-cdn.com",
                "https://challenges.cloudflare.com",
                "https://www.google-analytics.com",
                "https://analytics.google.com",
                "https://www.facebook.com",
                "https://*.ingest.sentry.io"
            ],
            critical_urls: [
                absolute("index.html"),
                absolute("free-check.html"),
                absolute("admin.html"),
                absolute("404.html"),
                absolute("500.html"),
                absolute("site-config.json"),
                absolute(".well-known/security.txt")
            ],
            host_notes: [
                "Netlify / Cloudflare Pages 可讀取 _headers；GitHub Pages 需透過 Cloudflare、反向代理或平台規則補上同等 header。",
                "正式主機需設定 404 fallback；500/server error fallback 若靜態主機不支援，需在正式後端接入後配置。",
                "正式加入 GA4、Meta Pixel、Sentry、Turnstile 後，若 CSP 有阻擋，需只新增必要官方網域，不放寬為 *。"
            ],
            verification_commands: [
                "curl -I " + absolute("index.html"),
                "curl -I " + absolute("site-config.json"),
                "curl -I " + absolute(".well-known/security.txt"),
                "python3 tools/verify_static_site.py",
                "python3 tools/production_config_audit.py"
            ],
            evidence_fields: ["checked_url", "checked_at", "platform", "header_name", "expected_value", "actual_value", "result", "evidence_note", "reviewer_role"],
            related_exports: ["tfse_admin_security_matrix", "tfse_site_config_approval_package", "tfse_domain_cutover_package", "tfse_external_verification_evidence"]
        };
    }

    function authCutoverPayload() {
        var backend = ((siteConfigData || {}).backend) || {};
        var security = adminSecurityMatrixPayload();
        var apiConfigured = backend.mode === "api" && !!backend.api_base_url && isHttpsUrl(backend.api_base_url);
        return {
            format: "tfse_admin_auth_cutover_check",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            status: apiConfigured ? "ready_for_formal_auth_validation" : "pending_formal_api_configuration",
            privacy_note: "此包只保存端點、cookie/CSRF/RBAC 檢查、退場步驟與證據欄位，不保存密碼、session token、CSRF token、MFA code、完整手機或 Line ID。",
            backend_mode: backend.mode || "localStorage",
            api_base_url_configured: apiConfigured,
            endpoints: [
                { method: "POST", path: "/api/admin/auth/login", expected: "驗證 email/password/MFA，簽發 httpOnly Secure SameSite session cookie，回傳 csrf_token 與角色權限摘要" },
                { method: "GET", path: "/api/admin/auth/session", expected: "讀取 server session，回傳 admin_user、role、permissions、expires_at 與 csrf_token，不回傳 password_hash/session_hash" },
                { method: "POST", path: "/api/admin/auth/logout", expected: "驗證 CSRF，撤銷 session，寫入 audit_logs" },
                { method: "GET", path: "/api/admin/security-matrix", expected: "回傳角色權限、session/CSRF/MFA/audit/viewer masking 檢查結果" }
            ],
            schema_tables: ["admin_users", "admin_sessions", "audit_logs", "admin_security_matrices"],
            required_controls: [
                "密碼只保存 password_hash，不保存明文或可逆加密。",
                "session token 只保存 session_hash，cookie 必須 httpOnly、Secure、SameSite。",
                "CSRF token 只保存 csrf_token_hash，敏感 POST/PATCH/DELETE 必須驗證。",
                "MFA code 不得寫入 audit_logs、localStorage 或匯出包。",
                "Viewer 與非授權角色需遮罩完整手機、Line ID、Email 與備註。",
                "登入失敗、登出、角色拒絕、匯出、狀態更新與合規審核需寫入 audit_logs。",
                "正式 API 可用後，admin.html 的 MVP 驗證碼只可作本機 fallback，不得暴露正式管理入口。"
            ],
            cutover_steps: [
                "部署正式 Auth API 與 admin_users/admin_sessions/audit_logs migration。",
                "建立首批 super_admin 與最小權限角色，啟用 MFA 或等效二次驗證策略。",
                "在 staging 測試 login/session/logout、CSRF、cookie 屬性、RBAC 拒絕與 Viewer 遮罩。",
                "填入 site-config.json > backend.mode=api 與 backend.api_base_url，重新跑 browser acceptance formal API smoke。",
                "確認前端不將密碼、MFA code、session token、csrf token 寫入 localStorage、審計或匯出包。",
                "正式切換後保存 checked_endpoint、status_code、cookie_flags、csrf_result、rbac_result、audit_log_id、reviewer_role 與 evidence_note。"
            ],
            evidence_fields: ["checked_endpoint", "method", "status_code", "cookie_flags", "csrf_result", "rbac_result", "viewer_masking_result", "audit_log_id", "checked_at", "reviewer_role", "evidence_note"],
            blockers: [
                apiConfigured ? "" : "site-config.json > backend.mode/api_base_url 尚未切到正式 HTTPS API。",
                "仍需正式後端實作 server session、CSRF、RBAC、MFA、audit_logs 與 Viewer 遮罩。",
                "正式切換需外部/staging 環境驗證 cookie flags 與 CSRF，不可只用本機 localStorage MVP 宣告完成。"
            ].filter(Boolean),
            related_exports: ["tfse_admin_security_matrix", "tfse_backend_acceptance_matrix", "tfse_production_env_template", "tfse_external_verification_evidence"],
            security_matrix_summary: {
                roles: security.roles.length,
                checks: security.checks.length,
                blockers: security.blockers.length
            }
        };
    }

    function renderAuthState() {
        var authed = isAuthenticated();
        if (authPanel) authPanel.style.display = authed ? "none" : "";
        Array.prototype.slice.call(protectedPanels).forEach(function (panel) {
            panel.style.display = authed ? "" : "none";
        });
        if (securityMatrixExportButton) securityMatrixExportButton.disabled = authed && !can("launch_health");
        if (securityHeadersExportButton) securityHeadersExportButton.disabled = authed && !can("launch_health");
        if (authCutoverExportButton) authCutoverExportButton.disabled = authed && !can("launch_health");
        if (exportButton) exportButton.disabled = authed && !can("export");
        if (followUpsExportButton) followUpsExportButton.disabled = authed && !can("update_lead");
        if (contactLogExportButton) contactLogExportButton.disabled = authed && !can("update_lead");
        if (leadDedupeExportButton) leadDedupeExportButton.disabled = authed && !can("update_lead");
        if (backupExportButton) backupExportButton.disabled = authed && !can("backup");
        if (importValidationExportButton) importValidationExportButton.disabled = authed && !can("backup");
        if (restoreDrillExportButton) restoreDrillExportButton.disabled = authed && !can("backup");
        if (backupReceiptExportButton) backupReceiptExportButton.disabled = authed && !can("backup");
        if (backupImportButton) backupImportButton.disabled = authed && !can("backup");
        if (backupFileInput) backupFileInput.disabled = authed && !can("backup");
        if (retrospectiveExportButton) retrospectiveExportButton.disabled = authed && !can("retrospective");
        if (trackingConsentExportButton) trackingConsentExportButton.disabled = authed && !can("retrospective");
        if (attributionExportButton) attributionExportButton.disabled = authed && !can("retrospective");
        if (eventReplayExportButton) eventReplayExportButton.disabled = authed && !can("analytics");
        if (monitoringReceiptExportButton) monitoringReceiptExportButton.disabled = authed && !can("analytics");
        if (analyticsDebugExportButton) analyticsDebugExportButton.disabled = authed && !can("analytics");
        if (sentryVerificationExportButton) sentryVerificationExportButton.disabled = authed && !can("analytics");
        if (launchHealthExportButton) launchHealthExportButton.disabled = authed && !can("launch_health");
        if (releaseReadinessExportButton) releaseReadinessExportButton.disabled = authed && !can("launch_health");
        if (localAuditMatrixExportButton) localAuditMatrixExportButton.disabled = authed && !can("launch_health");
        if (planCoverageExportButton) planCoverageExportButton.disabled = authed && !can("launch_health");
        if (planRequirementsExportButton) planRequirementsExportButton.disabled = authed && !can("launch_health");
        if (phaseAuditExportButton) phaseAuditExportButton.disabled = authed && !can("launch_health");
        if (planClosureExportButton) planClosureExportButton.disabled = authed && !can("launch_health");
        if (externalExecutionExportButton) externalExecutionExportButton.disabled = authed && !can("launch_health");
        if (launchHandoffExportButton) launchHandoffExportButton.disabled = authed && !can("launch_health");
        if (operationsTasksExportButton) operationsTasksExportButton.disabled = authed && !can("launch_health");
        if (incidentResponseExportButton) incidentResponseExportButton.disabled = authed && !can("launch_health");
        if (configReadinessExportButton) configReadinessExportButton.disabled = authed && !can("launch_health");
        if (configDraftTemplateButton) configDraftTemplateButton.disabled = authed && !can("launch_health");
        if (configDraftExportButton) configDraftExportButton.disabled = authed && !can("launch_health");
        if (configApprovalExportButton) configApprovalExportButton.disabled = authed && !can("launch_health");
        if (envTemplateExportButton) envTemplateExportButton.disabled = authed && !can("launch_health");
        if (launchCutoverAuditExportButton) launchCutoverAuditExportButton.disabled = authed && !can("launch_health");
        if (launchExecutionPlanExportButton) launchExecutionPlanExportButton.disabled = authed && !can("launch_health");
        if (launchCountdownPlanExportButton) launchCountdownPlanExportButton.disabled = authed && !can("launch_health");
        if (domainCutoverExportButton) domainCutoverExportButton.disabled = authed && !can("launch_health");
        if (hostFallbackExportButton) hostFallbackExportButton.disabled = authed && !can("launch_health");
        if (backendRoadmapExportButton) backendRoadmapExportButton.disabled = authed && !can("launch_health");
        if (backendAcceptanceExportButton) backendAcceptanceExportButton.disabled = authed && !can("launch_health");
        if (seoSubmissionExportButton) seoSubmissionExportButton.disabled = authed && !can("launch_health");
        if (searchConsoleExportButton) searchConsoleExportButton.disabled = authed && !can("launch_health");
        if (seoIndexingExportButton) seoIndexingExportButton.disabled = authed && !can("launch_health");
        if (acceptanceExportButton) acceptanceExportButton.disabled = authed && !can("acceptance");
        if (externalVerificationExportButton) externalVerificationExportButton.disabled = authed && !can("launch_health");
        if (browserAcceptanceExportButton) browserAcceptanceExportButton.disabled = authed && !can("acceptance");
        if (privacyExportButton) privacyExportButton.disabled = authed && !can("privacy_request");
        if (dataRetentionExportButton) dataRetentionExportButton.disabled = authed && !can("privacy_request");
        if (lineSegmentsExportButton) lineSegmentsExportButton.disabled = authed && !can("line_segment");
        if (lineOaSetupExportButton) lineOaSetupExportButton.disabled = authed && !can("line_segment");
        if (lineOaHandoffExportButton) lineOaHandoffExportButton.disabled = authed && !can("line_segment");
        if (lineOptoutExportButton) lineOptoutExportButton.disabled = authed && !can("line_segment");
        if (adCampaignsExportButton) adCampaignsExportButton.disabled = authed && !can("ad_campaign");
        if (conversionBacklogExportButton) conversionBacklogExportButton.disabled = authed && !can("ad_campaign");
        if (sourceReviewExportButton) sourceReviewExportButton.disabled = authed && !can("source_review");
        if (sourceEvidenceSaveButton) sourceEvidenceSaveButton.disabled = authed && !can("source_review");
        if (sourceEvidenceExportButton) sourceEvidenceExportButton.disabled = authed && !can("source_review");
        if (institutionImportExportButton) institutionImportExportButton.disabled = authed && !can("source_review");
        if (contentVersionsExportButton) contentVersionsExportButton.disabled = authed && !(can("manage_product") || can("manage_article") || can("manage_faq") || can("review_article"));
        if (contentApiExportButton) contentApiExportButton.disabled = authed && !(can("manage_product") || can("manage_article") || can("manage_faq") || can("review_article"));
        if (reviewSave) reviewSave.disabled = authed && !can("compliance");
        if (complianceButton) complianceButton.disabled = authed && !can("compliance");
        if (formRiskExportButton) formRiskExportButton.disabled = authed && !can("compliance");
        if (turnstileExportButton) turnstileExportButton.disabled = authed && !can("compliance");
        if (complianceCopyScan) complianceCopyScan.disabled = authed && !can("compliance");
        if (legalReviewExportButton) legalReviewExportButton.disabled = authed && !can("legal_review");
        if (legalExternalReviewExportButton) legalExternalReviewExportButton.disabled = authed && !can("legal_review");
        if (loginMessage && authed) loginMessage.textContent = "目前角色：" + roleLabel(currentRole()) + "｜來源：" + authSource() + "。正式版需由伺服器驗證角色。";
    }

    function renderAfterLogin() {
        renderAuthState();
        renderAdminSecurityMatrix();
        syncAdminContentFromApi();
        renderFaq();
        renderContentVersions();
        renderAdCampaigns();
        renderConversionBacklog();
        renderFormRisk();
        renderEventReplay();
        renderLaunchHealth();
        renderReleaseReadiness();
        renderLocalAuditMatrix();
        renderOperationsTasks();
        renderConfigReadiness();
        renderConfigInputPacket();
        renderProjectPhaseAudit();
        renderLaunchCutoverAudit();
        renderLaunchExecutionPlan();
        renderLaunchCountdownPlan();
        renderEnvTemplate();
        renderDomainCutover();
        renderBackendRoadmap();
        renderBackendAcceptance();
        renderSeoSubmission();
        renderSeoIndexingQueue();
        renderIncidentResponse();
        renderHandoffPanels();
        renderAcceptanceChecklist();
        renderExternalVerification();
        renderBrowserAcceptance();
        renderLegalReview();
        syncLeadsFromApi();
        renderCompliance();
        renderAttribution();
        renderConversionBacklog();
        renderAudit();
        renderVisualConsole();
    }

    function syncAuthFromApi() {
        if (!window.TFSEApi || !window.TFSEApi.getAdminSession) return Promise.resolve({ mode: "localStorage", authenticated: isAuthenticated() });
        return window.TFSEApi.getAdminSession().then(function (result) {
            if (result && result.mode === "api" && result.authenticated) {
                setRole(result.role || currentRole());
                setAuthenticated(true, "api_session");
            } else if (result && result.mode === "api" && !result.authenticated) {
                setAuthenticated(false);
            }
            renderAuthState();
            return result;
        });
    }

    function getAuditLog() {
        try {
            return JSON.parse(localStorage.getItem("tfse_admin_audit") || "[]");
        } catch (error) {
            return [];
        }
    }

    function addAudit(action, target) {
        var log = getAuditLog();
        log.unshift({
            action: action,
            target: target || "",
            role: currentRole(),
            at: new Date().toISOString()
        });
        localStorage.setItem("tfse_admin_audit", JSON.stringify(log.slice(0, 100)));
        renderAudit();
    }

    function getComplianceReviews() {
        try {
            return JSON.parse(localStorage.getItem("tfse_compliance_reviews") || "[]");
        } catch (error) {
            return [];
        }
    }

    function saveComplianceReview(record) {
        var reviews = getComplianceReviews();
        reviews.unshift(record);
        localStorage.setItem("tfse_compliance_reviews", JSON.stringify(reviews.slice(0, 100)));
        addAudit("compliance_review_save", record.target + ":" + record.result);
        if (window.TFSEApi && window.TFSEApi.saveComplianceReview) {
            window.TFSEApi.saveComplianceReview(record).then(function (result) {
                addAudit("compliance_review_persist", record.target + ":" + (result.mode || "localStorage"));
            }).catch(function (error) {
                addAudit("compliance_review_persist_failed", record.target + ":" + (error && error.message ? error.message : error));
            });
        }
    }

    function safeReadStorage(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
        } catch (error) {
            return fallback;
        }
    }

    function writeStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function adminSeedRecords(key, sourceTag) {
        return [];
    }

    function recordSignature(record) {
        var normalized = {};
        Object.keys(record || {}).sort().forEach(function (key) {
            if (key === "source") return;
            normalized[key] = record[key];
        });
        return JSON.stringify(normalized);
    }

    function recordTimestamp(record) {
        return String((record && (record.checked_at || record.reviewed_at || record.generated_at)) || "");
    }

    function mergeSeededRecords(storageKey, seedRecords) {
        var records = safeReadStorage(storageKey, []);
        var seen = {};
        return records.filter(function (record) {
            if (!record || typeof record !== "object") return false;
            var signature = recordSignature(record);
            if (seen[signature]) return false;
            seen[signature] = true;
            return true;
        }).sort(function (a, b) {
            return recordTimestamp(b).localeCompare(recordTimestamp(a));
        });
    }

    function backupPayload() {
        return {
            format: "tfse_local_backup",
            version: "2026-06-27",
            exported_at: new Date().toISOString(),
            exported_by_role: currentRole(),
            source_mode: leadSourceMode,
            data: {
                leads: getLeads(),
                events: safeReadStorage("tfse_events", []),
                errors: safeReadStorage("tfse_errors", []),
                audit: getAuditLog(),
                follow_ups: followUpPayload().items,
                compliance_reviews: getComplianceReviews(),
                config_input_records: getConfigInputRecords(),
                backend_acceptance_records: getBackendAcceptanceRecords(),
                search_console_records: getSearchConsoleRecords(),
                external_execution_records: getExternalExecutionRecords(),
                line_oa_records: getLineOaRecords(),
                launch_handoff_records: getLaunchHandoffRecords(),
                product_status: safeReadStorage("tfse_product_status", {}),
                product_overrides: getProductOverrides(),
                article_status: safeReadStorage("tfse_article_status", {}),
                article_overrides: getArticleOverrides(),
                faq_overrides: getFaqOverrides(),
                content_versions: contentVersionPayload()
            }
        };
    }

    function objectCount(value) {
        return value && typeof value === "object" ? Object.keys(value).length : 0;
    }

    function migrationPayload() {
        var productOverrides = getProductOverrides();
        var articleOverrides = getArticleOverrides();
        var faqOverrides = getFaqOverrides();
        var productStatus = safeReadStorage("tfse_product_status", {});
        var articleStatusOverrides = safeReadStorage("tfse_article_status", {});
        var leads = getLeads();
        var complianceReviews = getComplianceReviews();
        var audit = getAuditLog();
        var sourceReview = sourceReviewPayload();
        var generatedAt = new Date().toISOString();
        return {
            format: "tfse_formal_backend_migration_package",
            version: "2026-06-27",
            generated_at: generatedAt,
            exported_at: generatedAt,
            exported_by_role: currentRole(),
            source_mode: leadSourceMode,
            target_contract: "api-contract.json",
            target_schema: "backend-schema.sql",
            import_order: [
                "institutions",
                "categories",
                "financial_products",
                "articles",
                "faq",
                "lead_forms",
                "lead_events",
                "compliance_reviews",
                "audit_logs",
                "source_review_tasks"
            ],
            seed_data: {
                institutions: institutionData,
                products: productData,
                articles: articleData,
                faq: faqData,
                landing_pages: landingPageData
            },
            local_state: {
                leads: leads,
                product_status: productStatus,
                product_overrides: productOverrides,
                article_status: articleStatusOverrides,
                article_overrides: articleOverrides,
                faq_overrides: faqOverrides,
                content_versions: contentVersionPayload(),
                compliance_reviews: complianceReviews,
                audit: audit,
                events: safeReadStorage("tfse_events", []),
                errors: safeReadStorage("tfse_errors", []),
                event_replay: eventReplayPayload()
            },
            review_queues: {
                source_review: sourceReview.items,
                privacy_requests: privacyRequestPayload().items,
                line_segments: lineSegmentPayload().items,
                follow_ups: followUpPayload().items,
                server_event_replay: eventReplayPayload().queue
            },
            risk_controls: formRiskPayload(),
            summary: {
                seed_products: productData.length,
                seed_articles: articleData.length,
                seed_institutions: institutionData.length,
                local_leads: leads.length,
                product_status_overrides: objectCount(productStatus),
                product_content_overrides: objectCount(productOverrides),
                article_status_overrides: objectCount(articleStatusOverrides),
                article_content_overrides: objectCount(articleOverrides),
                faq_overrides: objectCount(faqOverrides),
                compliance_reviews: complianceReviews.length,
                audit_entries: audit.length,
                source_review_items: sourceReview.items.length,
                follow_up_items: followUpPayload().items.length
            },
            sensitive_data_policy: [
                "正式匯入前需排除 sample lead 或測試資料",
                "手機與 Line ID 應於伺服器端加密或欄位級保護",
                "不得匯入身分證字號、銀行帳號、信用卡號、密碼或證件影像",
                "privacy_requests 需在正式資料庫同步刪除、遮罩或更正並留存必要審計",
                "line_segments 僅可匯入已同意 Line 的潛客標籤",
                "follow_ups 僅可供授權顧問或管理員查看，匯出時不得包含完整手機與 Line ID"
            ]
        };
    }

    function importValidationPayload() {
        var migration = migrationPayload();
        var leads = getLeads();
        var sampleLeads = leads.filter(function (lead) {
            return lead.is_sample || (lead.tags || []).indexOf("sample_lead") !== -1;
        });
        var source = sourceReviewPayload();
        var privacy = privacyRequestPayload();
        var line = lineSegmentPayload();
        var blockers = [
            sampleLeads.length ? "sample_lead 測試資料需排除 " + sampleLeads.length + " 筆。" : "",
            source.items.length ? "來源復核待處理 " + source.items.length + " 筆。" : "",
            privacy.items.filter(function (item) { return item.request_status !== "completed"; }).length ? "個資請求需先完成或保留處理計畫。" : ""
        ].filter(Boolean);
        return {
            format: "tfse_import_validation_package",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source_package: migration.format,
            privacy_note: "只輸出導入統計、阻擋項與去識別樣本，不輸出完整手機、Line ID 或表單備註。",
            summary: {
                seed_products: migration.summary.seed_products,
                seed_articles: migration.summary.seed_articles,
                seed_institutions: migration.summary.seed_institutions,
                local_leads: leads.length,
                sample_leads: sampleLeads.length,
                source_review_items: source.items.length,
                privacy_requests: privacy.items.length,
                line_segments: line.items.length,
                blockers: blockers.length
            },
            import_checks: [
                "先匯入 institutions，再匯入 products、articles、faq。",
                "sample_lead 與瀏覽器驗收資料不得進正式營運庫。",
                "手機、Line ID、補充說明需加密或欄位級保護。",
                "來源復核、個資請求、Line 分群與 audit_logs 需保留關聯。",
                "匯入後抽查產品詳情、文章詳情、CRM、合規審核與刪除請求。"
            ],
            blockers: blockers,
            related_exports: ["tfse_formal_backend_migration_package", "tfse_source_review_queue", "tfse_privacy_request_queue", "tfse_line_segment_queue"]
        };
    }

    function restoreDrillPayload() {
        var backend = (siteConfigData && siteConfigData.backend) || {};
        var config = configReadinessPayload();
        var backup = backupPayload();
        var migration = migrationPayload();
        var apiConfigured = backend.mode === "api" && !!backend.api_base_url;
        var blockers = [
            apiConfigured ? "" : "正式 backend.api_base_url 尚未配置，仍不可宣告資料庫備份可用。",
            config.items.find(function (item) { return item.key === "turnstile"; }).done ? "" : "Turnstile 正式驗證待補，需避免垃圾資料進入備份。",
            "正式 PostgreSQL 每日備份任務需在雲端/伺服器排程建立並保存成功通知。",
            "每週還原演練需在隔離資料庫完成，不得覆蓋正式資料。",
            "備份 storage URL、checksum、加密/KMS 與保留週期需由正式環境產生證據。"
        ].filter(Boolean);
        return {
            format: "tfse_backup_restore_drill_plan",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            status: blockers.length ? "pending_external_backup_setup" : "ready_for_restore_drill",
            privacy_note: "只輸出備份/還原計畫、統計與證據欄位，不輸出完整手機、Line ID、表單備註、資料庫 URL 或密鑰。",
            backend_mode: backend.mode || "localStorage",
            api_base_url_configured: apiConfigured,
            rpo_rto: {
                rpo: "24h 內最後一次成功資料庫備份",
                rto: "4h 內完成隔離資料庫還原、抽查與回報",
                retention: "每日備份保留 30 天；每週備份保留 12 週；依雲端政策調整",
                encryption: "備份檔需使用雲端 KMS 或等效伺服器端加密"
            },
            schedule: [
                { task: "daily_postgres_backup", frequency: "daily", owner: "data_manager", evidence: "backup_jobs.status=success、storage_url、checksum、完成通知" },
                { task: "weekly_restore_drill", frequency: "weekly", owner: "data_manager", evidence: "隔離 DB 還原截圖/日誌、抽查表、RPO/RTO 結果" },
                { task: "monthly_retention_review", frequency: "monthly", owner: "super_admin", evidence: "過期備份清除紀錄、權限與 KMS 檢查" }
            ],
            restore_steps: [
                "選擇最近一份非生產環境可用備份。",
                "還原到隔離資料庫，不覆蓋正式資料。",
                "執行 migration、enum、索引與權限檢查。",
                "抽查產品、文章、潛客數量、審計、個資請求、Line 分群與事件報表。",
                "記錄 RPO/RTO、checksum、演練人、發現問題與修正期限。"
            ],
            evidence_fields: ["backup_job_id", "storage_url", "checksum", "started_at", "finished_at", "restored_to", "rpo_result", "rto_result", "reviewer", "findings"],
            local_mvp_reference: {
                local_backup_leads: backup.data.leads.length,
                local_backup_events: backup.data.events.length,
                migration_seed_products: migration.summary.seed_products,
                migration_seed_articles: migration.summary.seed_articles
            },
            blockers: blockers,
            related_exports: ["tfse_local_backup", "tfse_formal_backend_migration_package", "tfse_import_validation_package", "tfse_backend_acceptance_matrix"]
        };
    }

    function backupReceiptPayload() {
        var backend = (siteConfigData && siteConfigData.backend) || {};
        var restorePlan = restoreDrillPayload();
        var apiConfigured = backend.mode === "api" && !!backend.api_base_url;
        var blockers = [
            apiConfigured ? "" : "正式 backend.api_base_url 尚未配置，無法驗證資料庫備份任務。",
            "正式備份 job 成功收據需由資料庫或雲端排程產生。",
            "正式還原演練結果需在隔離資料庫完成後回填。",
            "checksum、storage_url、KMS/encryption 與 retention policy 需由正式環境提供證據。"
        ].filter(Boolean);
        return {
            format: "tfse_backup_receipt_verification_package",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            status: blockers.length ? "pending_backup_receipt_verification" : "ready_for_backup_receipt_verification",
            privacy_note: "此包只保存正式備份/還原收據欄位、排程狀態與去識別抽查結果，不保存資料庫 URL、密鑰、完整手機、Line ID、表單備註或備份檔內容。",
            backend_target: {
                mode: backend.mode || "localStorage",
                api_base_url_configured: apiConfigured,
                expected_tables: ["backup_jobs", "backup_restore_drill_results", "audit_logs"]
            },
            required_receipts: [
                { key: "daily_backup_success", expected: "最近 24 小時內至少一筆 backup_jobs.status=success" },
                { key: "checksum_recorded", expected: "每份正式備份保存 checksum 並可比對" },
                { key: "encrypted_storage", expected: "storage 使用 KMS 或等效加密，權限最小化" },
                { key: "weekly_restore_drill", expected: "最近 7 天內完成隔離資料庫還原演練" },
                { key: "audit_linkage", expected: "備份、還原、失敗重試與權限調整寫入 audit_logs" }
            ],
            receipt_fields: ["backup_job_id", "status", "started_at", "finished_at", "storage_url", "checksum", "size_bytes", "encryption_key_ref", "retention_until", "notification_id"],
            restore_drill_fields: ["drill_id", "backup_job_id", "restored_to", "row_count_checks", "rpo_result", "rto_result", "sample_tables", "findings", "reviewer_role", "completed_at"],
            validation_steps: [
                "確認最近每日備份 job 成功，失敗 job 有重試與告警紀錄。",
                "以 checksum 比對備份檔或雲端快照摘要，確認 storage_url 權限不公開。",
                "每週在隔離資料庫執行還原演練，不覆蓋正式資料。",
                "抽查 lead_forms、articles、financial_products、audit_logs、privacy_request_tasks 與 line_segment_tasks 筆數。",
                "將 backup receipt、restore drill 結果與 audit_log_id 保存到正式後端或運維系統。"
            ],
            latest_plan_status: restorePlan.status,
            evidence_fields: ["checked_case", "backup_job_id", "restore_drill_id", "status", "audit_log_id", "screenshot_url", "reviewer_role", "checked_at", "evidence_note"],
            blockers: blockers,
            related_exports: ["tfse_backup_restore_drill_plan", "tfse_backend_acceptance_matrix", "tfse_external_verification_evidence", "tfse_data_retention_purge_plan"]
        };
    }

    function renderBackupStatus(message) {
        if (!backupStatus) return;
        var payload = backupPayload();
        var receipt = backupReceiptPayload();
        backupStatus.innerHTML = [
            "<p>" + escapeHtml(message || "可匯出本機 MVP 狀態，供正式後端遷移前核對與復原演練。") + "</p>",
            "<p>目前本機資料：潛客 " + payload.data.leads.length + " 筆；事件 " + payload.data.events.length + " 筆；審計 " + payload.data.audit.length + " 筆；合規審核 " + payload.data.compliance_reviews.length + " 筆。</p>",
            "<p>正式遷移包會同時打包 seed JSON、內容覆蓋、來源復核、個資請求、Line 分群與匯入順序；正式備份演練計畫用於後端每日備份與每週還原演練交接。</p>",
            "<p>正式備份收據驗收：" + escapeHtml(receipt.status) + "；需保存收據欄位 " + receipt.receipt_fields.length + " 項。</p>"
        ].join("");
    }

    function downloadJson(filename, payload) {
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    function phoneLast3(phone) {
        var normalized = String(phone || "").replace(/\D/g, "");
        return normalized ? normalized.slice(-3) : "";
    }

    function privacyRequestItems(includeCompleted) {
        return getLeads().filter(function (lead) {
            if (!lead.delete_requested && !lead.privacy_request_status) return false;
            return includeCompleted || lead.privacy_request_status !== "completed";
        }).sort(function (a, b) {
            var aDone = a.privacy_request_status === "completed" ? 1 : 0;
            var bDone = b.privacy_request_status === "completed" ? 1 : 0;
            if (aDone !== bDone) return aDone - bDone;
            return String(b.updated_at || b.submitted_at || "").localeCompare(String(a.updated_at || a.submitted_at || ""));
        });
    }

    function privacyRequestPayload() {
        return {
            format: "tfse_privacy_request_queue",
            exported_at: new Date().toISOString(),
            exported_by_role: currentRole(),
            source_mode: leadSourceMode,
            items: privacyRequestItems(true).map(function (lead) {
                return {
                    lead_id: lead.id,
                    request_type: lead.privacy_request_type || "delete",
                    request_status: lead.privacy_request_status || "pending",
                    display_name: lead.display_name || "",
                    phone_last3: phoneLast3(lead.phone),
                    needs: lead.needs || "",
                    submitted_at: lead.submitted_at || "",
                    requested_at: lead.privacy_requested_at || lead.updated_at || lead.submitted_at || "",
                    completed_at: lead.privacy_completed_at || "",
                    consent_version: lead.consent_version || "",
                    line_consent: !!lead.consent_line,
                    note: (lead.notes || []).slice(-1)[0] || ""
                };
            })
        };
    }

    function daysSince(value) {
        var time = Date.parse(value || "");
        if (!time) return null;
        return Math.floor((Date.now() - time) / 86400000);
    }

    function dataRetentionPayload() {
        var leads = getLeads();
        var events = getEvents();
        var privacy = privacyRequestPayload();
        var staleLeads = leads.filter(function (lead) {
            var age = daysSince(lead.updated_at || lead.submitted_at);
            return age !== null && age >= 180 && ["closed", "spam"].indexOf(lead.status) !== -1;
        }).map(function (lead) {
            return {
                lead_id: lead.id,
                status: lead.status || "new",
                display_name: lead.display_name || "",
                phone_last3: phoneLast3(lead.phone),
                age_days: daysSince(lead.updated_at || lead.submitted_at),
                suggested_action: lead.delete_requested ? "delete_or_anonymize_after_privacy_completion" : "anonymize_contact_fields"
            };
        });
        var oldEvents = events.filter(function (event) {
            var age = daysSince(event.created_at || event.sent_at || event.timestamp);
            return age !== null && age >= 90;
        });
        return {
            format: "tfse_data_retention_purge_plan",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source_mode: leadSourceMode,
            privacy_note: "此排程只輸出手機末三碼與保留規則，不輸出完整手機、Line ID、證件、帳戶、卡號或密碼。",
            policy: {
                review_frequency: "monthly",
                execution_window: "每月第一個工作日由 compliance_reviewer 產生候選清單，data_manager 在正式後端執行刪除或匿名化。",
                legal_hold_rule: "來源復核、法務審核、投訴、事故或未完成個資請求相關資料不得自動刪除，需先標記 legal_hold_review。"
            },
            retention_rules: [
                { dataset: "lead_forms", window: "active_service_need", action: "服務需求有效期間保留；結案、無效或 spam 超過 180 天後匿名化聯絡欄位，刪除請求完成後依審計要求刪除或遮罩。" },
                { dataset: "privacy_request_tasks", window: "365_days_after_completion", action: "保留處理證據、手機末三碼、處理人與時間；不得保留完整聯絡資訊。" },
                { dataset: "lead_events", window: "90_days_raw", action: "90 天後轉為彙總事件或刪除 device_id/UTM 可識別片段。" },
                { dataset: "audit_logs", window: "365_days_minimum", action: "保留管理操作、匯出、刪除與權限事件；刪除前需合規確認。" },
                { dataset: "source_review_tasks/source_verification_evidence/content_version_snapshots", window: "compliance_record", action: "作為公開資料與內容版本證據保留，定期復核而非自動清除。" },
                { dataset: "backup_jobs", window: "30_daily_12_weekly", action: "每日備份保留 30 天、每週備份保留 12 週；到期清除需保留 job id、checksum、刪除人與時間。" }
            ],
            summary: {
                total_leads: leads.length,
                purge_candidate_leads: staleLeads.length,
                raw_events_over_90_days: oldEvents.length,
                pending_privacy_requests: privacy.items.filter(function (item) { return item.request_status !== "completed"; }).length
            },
            purge_candidates: staleLeads.slice(0, 50),
            required_evidence_fields: ["dataset", "record_id", "phone_last3", "retention_rule", "action", "legal_hold", "executed_by", "executed_at", "audit_log_id", "verification_note"],
            blockers: [
                "正式後端尚未接入前，localStorage MVP 僅能產生排程包，不能替代伺服器端刪除。",
                "任何未完成個資請求、投訴、事故或法務審核中的紀錄需先暫緩清除。",
                "備份到期清除需由正式雲端儲存、KMS 與 backup job 系統提供證據。"
            ],
            related_exports: ["tfse_privacy_request_queue", "tfse_backup_restore_drill_plan", "tfse_admin_audit_log", "tfse_public_feedback_intake_package"]
        };
    }

    function privacyFulfillmentPayload() {
        var privacy = privacyRequestPayload();
        var retention = dataRetentionPayload();
        var audit = getAuditLog();
        var completed = privacy.items.filter(function (item) {
            return item.request_status === "completed";
        });
        var pending = privacy.items.filter(function (item) {
            return item.request_status !== "completed";
        });
        return {
            format: "tfse_privacy_fulfillment_verification_package",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            privacy_note: "此驗收包只保存 request id、手機末三碼、處理狀態、角色、狀態碼、audit log ID 與證據摘要；不得保存完整手機、Line ID、姓名、補充說明、證件、帳戶、卡號、密碼、session token 或 CSRF token。",
            status: pending.length ? "pending_privacy_fulfillment" : (privacy.items.length ? "ready_for_privacy_fulfillment_verification" : "no_privacy_requests"),
            backend_target: {
                queue_endpoint: "GET /api/admin/privacy-requests",
                fulfillment_endpoint: "PATCH /api/admin/privacy-requests/:lead_id",
                audit_endpoint: "GET /api/admin/audit-logs",
                target_tables: ["privacy_request_tasks", "lead_forms", "audit_logs"],
                allowed_roles: ["super_admin", "consultant", "compliance_reviewer"],
                required_auth: ["server_session", "csrf", "rbac"]
            },
            local_context: {
                total_requests: privacy.items.length,
                pending_requests: pending.length,
                completed_requests: completed.length,
                retention_purge_candidates: retention.summary.purge_candidate_leads,
                pending_retention_blockers: retention.blockers.length,
                audit_privacy_events: audit.filter(function (item) {
                    return item.action === "privacy_request_complete" || item.action === "privacy_request_export" || item.action === "data_retention_export";
                }).length
            },
            required_controls: [
                "正式 API 必須以 server session、CSRF 與 RBAC 驗證 super_admin / consultant / compliance_reviewer 權限。",
                "刪除請求完成時需更新 privacy_request_tasks.completed_at、handled_by、audit_log_id，並同步對 lead_forms 執行刪除、遮罩或更正。",
                "完成處理後不得在一般 CRM、匯出包、Line 分群或事件重放中保留完整手機、Line ID、補充說明或其他高敏個資。",
                "每次完成、拒絕、遮罩、匿名化與資料保留例外都需寫入 audit_logs，audit_logs 僅保存去識別摘要。",
                "未完成個資請求、投訴、事故或法務審核中的紀錄需標記 legal hold，不得被月檢排程自動刪除。"
            ],
            test_cases: [
                { key: "list_privacy_queue", request: "GET /api/admin/privacy-requests", expected: "只回傳去識別欄位、手機末三碼、狀態、請求時間與頁碼" },
                { key: "complete_delete_request", request: "PATCH /api/admin/privacy-requests/:lead_id", expected: "privacy_request_tasks.completed_at、handled_by、audit_log_id 更新，lead_forms 聯絡欄位刪除或遮罩" },
                { key: "complete_correction_request", request: "PATCH /api/admin/privacy-requests/:lead_id", expected: "更正欄位落庫且 audit_logs 可追溯，不保存原始錯誤個資全文" },
                { key: "deny_viewer_fulfillment", request: { role: "viewer" }, expected: "403，無 privacy_request_tasks 或 lead_forms 更新" },
                { key: "verify_downstream_scrub", request: "CRM/export/Line/event replay spot check", expected: "完成請求後下游匯出不再出現完整聯絡資訊" }
            ],
            evidence_fields: [
                "endpoint",
                "status_code",
                "privacy_request_id",
                "lead_id",
                "phone_last3",
                "request_type",
                "request_status",
                "handled_by_role",
                "csrf_checked",
                "rbac_checked",
                "lead_fields_scrubbed",
                "downstream_exports_checked",
                "audit_log_id",
                "checked_at",
                "evidence_note"
            ],
            blockers: [
                "正式後端尚未提供 privacy_request_tasks 完成處理與 lead_forms 遮罩/刪除證據。",
                "尚需在 staging 以授權與未授權角色各跑一次 PATCH /api/admin/privacy-requests/:lead_id。",
                "尚需抽查 CRM、Line 分群、事件重放、備份還原樣本，確認完成請求後不再暴露完整聯絡資訊。"
            ],
            related_exports: [
                "tfse_privacy_request_queue",
                "tfse_data_retention_purge_plan",
                "tfse_line_optout_complaint_queue",
                "tfse_formal_backend_migration_package",
                "tfse_import_validation_package",
                "tfse_backend_acceptance_matrix"
            ]
        };
    }

    function lineSegmentItems() {
        return getLeads().filter(function (lead) {
            return !!lead.consent_line && ((lead.tags || []).length || lead.line_id);
        }).sort(function (a, b) {
            return String(b.submitted_at || "").localeCompare(String(a.submitted_at || ""));
        });
    }

    function lineSegmentPayload() {
        return {
            format: "tfse_line_segment_queue",
            exported_at: new Date().toISOString(),
            exported_by_role: currentRole(),
            source_mode: leadSourceMode,
            items: lineSegmentItems().map(function (lead) {
                return {
                    lead_id: lead.id,
                    display_name: lead.display_name || "",
                    line_id: lead.line_id || "",
                    tags: lead.tags || [],
                    source_tags: (lead.tags || []).filter(function (tag) { return tag.indexOf("source_") === 0; }),
                    needs: lead.needs || "",
                    source_channel: lead.source_channel || "",
                    utm_source: lead.utm_source || "",
                    recommended_categories: lead.recommended_categories || [],
                    recommended_articles: lead.recommended_articles || [],
                    consent_version: lead.consent_version || "",
                    submitted_at: lead.submitted_at || ""
                };
            })
        };
    }

    function lineOptoutItems() {
        var keywords = ["退訂", "停止", "不要傳", "不要通知", "取消", "投訴", "檢舉", "騷擾", "封鎖", "unsubscribe", "stop"];
        return getLeads().filter(function (lead) {
            var notes = (lead.notes || []).join(" ");
            var contactLogs = lead.contact_logs || [];
            var contactText = contactLogs.map(function (log) {
                return [log.channel, log.outcome, log.next_action, log.note].join(" ");
            }).join(" ");
            var text = [lead.privacy_request_type, lead.privacy_request_status, notes, contactText].join(" ").toLowerCase();
            var hasKeyword = keywords.some(function (keyword) {
                return text.indexOf(keyword.toLowerCase()) !== -1;
            });
            return hasKeyword || lead.line_optout_requested || lead.line_complaint_status || lead.privacy_request_type === "line_optout";
        }).sort(function (a, b) {
            return String(b.updated_at || b.privacy_requested_at || b.submitted_at || "").localeCompare(String(a.updated_at || a.privacy_requested_at || a.submitted_at || ""));
        });
    }

    function lineOptoutPayload() {
        var items = lineOptoutItems().map(function (lead) {
            var latestLog = (lead.contact_logs || [])[0] || {};
            return {
                lead_id: lead.id,
                display_name: lead.display_name || "",
                phone_last3: phoneLast3(lead.phone),
                line_id_present: !!lead.line_id,
                line_consent: !!lead.consent_line,
                request_type: lead.line_complaint_status ? "complaint" : (lead.privacy_request_type === "line_optout" ? "line_optout" : "review_required"),
                status: lead.line_complaint_status || lead.privacy_request_status || "pending_review",
                source: lead.utm_source || lead.source_channel || "direct",
                needs: lead.needs || "",
                requested_at: lead.privacy_requested_at || lead.updated_at || lead.submitted_at || "",
                latest_contact_outcome: latestLog.outcome || "",
                latest_next_action: latestLog.next_action || "",
                note_summary: (lead.notes || []).slice(-1)[0] || latestLog.note || ""
            };
        });
        return {
            format: "tfse_line_optout_complaint_queue",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source_mode: leadSourceMode,
            privacy_note: "只輸出 lead id、手機末三碼、Line 是否存在、請求狀態與摘要，不輸出完整手機、Line ID、對話全文或敏感個資。",
            summary: {
                total: items.length,
                complaints: items.filter(function (item) { return item.request_type === "complaint"; }).length,
                optouts: items.filter(function (item) { return item.request_type === "line_optout"; }).length,
                pending_review: items.filter(function (item) { return item.status !== "completed"; }).length
            },
            intake_keywords: ["退訂", "停止接收", "不要傳訊息", "取消 Line 通知", "投訴", "檢舉", "騷擾", "封鎖", "STOP", "UNSUBSCRIBE"],
            sla: {
                optout_acknowledge: "24h 內停止主動訊息並回覆已收到",
                complaint_triage: "1 個工作天內由 compliance_reviewer 複核",
                data_request_sync: "若涉及刪除/更正，同步建立 privacy_request_tasks"
            },
            handling_steps: [
                "確認使用者是否要求停止 Line 訊息、刪除資料或提出投訴。",
                "立即移除 Line 分群標籤，不再匯入促發訊息名單。",
                "若涉及個資刪除或更正，同步個資請求隊列並保存審計。",
                "若涉及騷擾、誤導或代辦疑慮，升級到法務合規送審包。",
                "保存處理人、處理時間、結果與外部 Line OA 後台證據。"
            ],
            evidence_fields: ["lead_id", "line_user_id_hash", "request_received_at", "handled_at", "handler_role", "line_tag_removed", "privacy_request_id", "complaint_result", "evidence_note"],
            items: items,
            related_exports: ["tfse_line_segment_queue", "tfse_line_oa_setup_package", "tfse_privacy_request_queue", "tfse_legal_compliance_review_package"]
        };
    }

    function lineOptoutApiVerificationPayload() {
        var optout = lineOptoutPayload();
        var audit = getAuditLog();
        return {
            format: "tfse_line_optout_api_verification_package",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            privacy_note: "此驗收包只保存請求類型、手機末三碼、Line user id hash、狀態碼、處理結果、角色與 audit log ID；不得保存完整 Line 對話、明文 Line user id、完整手機、Email、證件、帳戶、卡號、密碼或 session token。",
            status: "pending_line_optout_api_verification",
            backend_target: {
                queue_endpoint: "GET /api/admin/line-optout-complaints",
                line_handoff_endpoint: "GET /api/admin/line-oa-handoff-check",
                audit_endpoint: "GET /api/admin/audit-logs",
                target_tables: ["line_optout_complaint_tasks", "privacy_request_tasks", "legal_compliance_review_packages", "audit_logs"],
                allowed_roles: ["super_admin", "consultant", "compliance_reviewer"],
                required_auth: ["server_session", "csrf", "rbac"]
            },
            local_context: {
                total_requests: optout.summary.total,
                complaints: optout.summary.complaints,
                optouts: optout.summary.optouts,
                pending_review: optout.summary.pending_review,
                audit_line_optout_events: audit.filter(function (item) {
                    return item.action === "line_optout_export" || item.action === "line_oa_handoff_export";
                }).length
            },
            required_controls: [
                "正式 API 需將退訂、停止接收、投訴、封鎖與 review_required 請求寫入 line_optout_complaint_tasks，並記錄 request_type、status、line_user_id_hash、handled_at 與 assigned_to。",
                "涉及刪除/更正資料時需同步建立 privacy_request_tasks；涉及騷擾、誤導或代辦疑慮時需升級 legal_compliance_review_packages。",
                "完成處理時需移除 Line 分群標籤、停止主動訊息，並將結果寫入 audit_logs 或同等審計表。",
                "管理端只可查看去識別欄位，不得返回完整 Line 對話、明文 Line user id 或完整手機。",
                "Line OA 導向驗收與退訂 API 驗收需保持一致：站內入口、quick reply、退訂關鍵字與後台任務處理不可脫節。"
            ],
            test_cases: [
                { key: "keyword_optout", request: { keyword: "STOP" }, expected: "建立 line_optout_complaint_tasks，request_type=line_optout，Line tag 移除可追溯" },
                { key: "complaint_escalation", request: { keyword: "投訴", note: "疑似誤導" }, expected: "request_type=complaint，必要時升級 legal_compliance_review_packages" },
                { key: "privacy_sync", request: { keyword: "刪除資料" }, expected: "line_optout_complaint_tasks 與 privacy_request_tasks 同步建立" },
                { key: "masked_admin_queue", request: "GET /api/admin/line-optout-complaints", expected: "只回傳去識別欄位、Line hash、手機末三碼與處理摘要" },
                { key: "unauthorized_denied", request: { role: "viewer" }, expected: "403，未授權角色不可查看或處理退訂/投訴隊列" }
            ],
            evidence_fields: [
                "endpoint",
                "status_code",
                "line_optout_task_id",
                "privacy_request_id",
                "legal_review_id",
                "lead_id",
                "phone_last3",
                "line_user_id_hash",
                "handler_role",
                "line_tag_removed",
                "csrf_checked",
                "rbac_checked",
                "audit_log_id",
                "checked_at",
                "evidence_note"
            ],
            blockers: [
                "正式後端尚未提供 line_optout_complaint_tasks、privacy_request_tasks 與 legal review 升級的落庫證據。",
                "尚需在 staging 以 STOP、投訴、刪除資料關鍵字各跑一次實際收件與處理流程。",
                "尚需抽查 Line OA 後台移除標籤、停止主動訊息與站內 quick reply 導向是否一致。"
            ],
            related_exports: [
                "tfse_line_optout_complaint_queue",
                "tfse_line_oa_handoff_check",
                "tfse_line_oa_setup_package",
                "tfse_privacy_request_queue",
                "tfse_privacy_fulfillment_verification_package",
                "tfse_legal_compliance_review_package",
                "tfse_backend_acceptance_matrix"
            ]
        };
    }

    function lineOaSetupPayload() {
        var flows = lineFlowData || {};
        var quickReplies = flows.quick_replies || [];
        var records = getLineOaRecords().filter(function (record) {
            return record.phase === "setup";
        });
        return {
            format: "tfse_line_oa_setup_package",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source: "assets/data/line-flows.json",
            line_oa_url: (siteConfigData.line || {}).oa_url || "",
            welcome_messages: flows.welcome || [],
            rich_menu: quickReplies.map(function (reply, index) {
                return {
                    slot: index + 1,
                    label: reply.label,
                    action_url: reply.free_check_href || reply.href,
                    tag: reply.tag,
                    article_url: reply.article_href,
                    database_url: reply.database_href
                };
            }),
            quick_replies: quickReplies.map(function (reply) {
                return {
                    label: reply.label,
                    tag: reply.tag,
                    primary_url: reply.href,
                    reply: reply.reply,
                    boundary: reply.boundary,
                    article_url: reply.article_href,
                    database_url: reply.database_href,
                    free_check_url: reply.free_check_href
                };
            }),
            tags: flows.tags || [],
            reply_principles: flows.reply_principles || [],
            segment_sync_queue: lineSegmentPayload().items,
            compliance_boundaries: [
                "Line OA 不得使用包過、保證核貸、快速放款、內部管道等話術",
                "每則自動回覆需保留 TFSE 僅整理公開資訊、不代辦、不代收證件、不保證核貸的邊界",
                "分群標籤只能套用於已同意 Line 的潛客",
                "不得在 Line 對話要求身分證、帳戶、卡號、密碼或證件影像",
                "使用者要求停止接收或刪除資料時，需同步個資請求隊列"
            ],
            records: records,
            record_summary: {
                tracked_count: records.length,
                completed_count: records.filter(function (item) { return item.result === "completed"; }).length,
                blocked_count: records.filter(function (item) { return item.result === "blocked"; }).length
            },
            setup_steps: [
                "建立 Line OA 歡迎語並貼上 welcome_messages",
                "依 rich_menu 建立 6 個主要入口，URL 保留 utm_source=line",
                "依 tags 建立需求、來源與分群標籤",
                "依 quick_replies 建立自動回覆，每則包含文章、資料庫與免費財務健檢查詢入口",
                "匯入 segment_sync_queue 前先確認 consent_line 為 true",
                "完成後將 site-config.json > line.oa_url 改成正式加友網址並重跑驗收"
            ]
        };
    }

    function lineOaHandoffPayload() {
        var setup = lineOaSetupPayload();
        var line = (siteConfigData.line || {});
        var baseUrl = (siteConfigData.base_url || "").replace(/\/$/, "");
        var officialUrl = line.oa_url || "";
        var officialReady = !!officialUrl && officialUrl !== "free-check.html#line-cta" && isHttpsUrl(officialUrl);
        var records = getLineOaRecords().filter(function (record) {
            return record.phase === "handoff";
        });
        function absolute(path) {
            path = String(path || "").replace(/^\//, "");
            return baseUrl ? baseUrl + "/" + path : path;
        }
        var ctaRoutes = [
            { key: "handoff_route_1", page: absolute("free-check.html"), selector: "#line-cta", expected: "表單成功後顯示正式 Line OA 加友 CTA" },
            { key: "handoff_route_2", page: absolute("index.html"), selector: "[data-line-action]", expected: "首頁 CTA 可導向免費財務健檢查詢或 Line 承接說明" },
            { key: "handoff_route_3", page: absolute("lp.html"), selector: "[data-line-action]", expected: "廣告落地頁 Line CTA 保留 UTM 與合規邊界" },
            { key: "handoff_route_4", page: absolute("contact.html"), selector: "contact intake", expected: "資料回報與 Line 承接不得要求高敏資料" }
        ].map(function (route) {
            route.latest_record = latestLineOaRecord(route.key);
            return route;
        });
        var blockers = [
            officialReady ? "" : "site-config.json > line.oa_url 尚未填入正式 HTTPS Line OA 加友網址。",
            setup.quick_replies.length ? "" : "line-flows.json quick_replies 不可為空。",
            setup.welcome_messages.length ? "" : "line-flows.json welcome_messages 不可為空。",
            setup.compliance_boundaries.length ? "" : "Line OA 合規邊界需保留。"
        ].filter(Boolean);
        return {
            format: "tfse_line_oa_handoff_check",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            status: blockers.length ? "pending_line_oa_handoff" : "ready_for_line_oa_handoff_verification",
            line_oa_url: officialUrl,
            official_url_ready: officialReady,
            source_files: ["site-config.json", "assets/data/line-flows.json", "free-check.html", "assets/js/tfse-line.js", "assets/js/tfse-lead-form.js"],
            cta_routes: ctaRoutes,
            quick_reply_checks: setup.quick_replies.map(function (reply) {
                return {
                    label: reply.label,
                    tag: reply.tag,
                    primary_url: reply.primary_url,
                    article_url: reply.article_url,
                    database_url: reply.database_url,
                    free_check_url: reply.free_check_url,
                    expected_boundary: reply.boundary || "保留 TFSE 僅整理公開資訊、不代辦、不保證核貸"
                };
            }),
            handoff_steps: [
                "在 Line OA 後台建立歡迎語、圖文選單、quick reply、自動回覆與分群標籤。",
                "將 site-config.json > line.oa_url 改成正式 HTTPS 加友網址，重新跑 site-config 與瀏覽器驗收。",
                "提交一筆測試免費財務健檢查詢，確認成功訊息與 Line CTA 指向正式 Line OA。",
                "在手機瀏覽器點擊首頁、免費財務健檢查詢、落地頁與 Line quick reply，確認可開啟正式 Line OA。",
                "傳送停止接收、退訂、刪除資料等關鍵字，確認退訂/投訴隊列與個資請求升級流程。",
                "保存 checked_url、line_oa_url、device、result、screenshot_url、reviewer_role 與 evidence_note。"
            ],
            evidence_fields: ["checked_url", "line_oa_url", "device", "utm_source", "result", "screenshot_url", "checked_at", "reviewer_role", "evidence_note"],
            compliance_boundaries: setup.compliance_boundaries,
            records: records,
            record_summary: {
                tracked_count: records.length,
                completed_count: records.filter(function (item) { return item.result === "completed"; }).length,
                blocked_count: records.filter(function (item) { return item.result === "blocked"; }).length
            },
            blockers: blockers,
            related_exports: ["tfse_line_oa_setup_package", "tfse_line_segment_queue", "tfse_line_optout_complaint_queue", "tfse_external_verification_evidence", "tfse_legal_compliance_review_package"]
        };
    }

    function getBrowserAcceptanceRecords() {
        return mergeSeededRecords("tfse_browser_acceptance_records", []).filter(function (record) {
            return !!record.item_key;
        });
    }

    function saveBrowserAcceptanceRecord(record) {
        var records = getBrowserAcceptanceRecords();
        records.unshift(record);
        writeStorage("tfse_browser_acceptance_records", records.slice(0, 100));
    }

    function getExternalVerificationRecords() {
        return mergeSeededRecords("tfse_external_verification_records", adminSeedRecords("external_verification_records", "seed_external_verification_records"));
    }

    function saveExternalVerificationRecord(record) {
        var records = getExternalVerificationRecords();
        records.unshift(record);
        writeStorage("tfse_external_verification_records", records.slice(0, 100));
    }

    function getConfigInputRecords() {
        return mergeSeededRecords("tfse_config_input_records", adminSeedRecords("config_input_records", "seed_config_input_records"));
    }

    function saveConfigInputRecord(record) {
        var records = getConfigInputRecords();
        records.unshift(record);
        writeStorage("tfse_config_input_records", records.slice(0, 150));
    }

    function latestConfigInputRecord(key) {
        return getConfigInputRecords().find(function (record) {
            return record && record.input_key === key;
        }) || null;
    }

    function getBackendAcceptanceRecords() {
        return mergeSeededRecords("tfse_backend_acceptance_records", adminSeedRecords("backend_acceptance_records", "seed_backend_acceptance_records"));
    }

    function saveBackendAcceptanceRecord(record) {
        var records = getBackendAcceptanceRecords();
        records.unshift(record);
        writeStorage("tfse_backend_acceptance_records", records.slice(0, 150));
    }

    function latestBackendAcceptanceRecord(key) {
        return getBackendAcceptanceRecords().find(function (record) {
            return record && record.endpoint_key === key;
        }) || null;
    }

    function getSearchConsoleRecords() {
        return mergeSeededRecords("tfse_search_console_records", adminSeedRecords("search_console_records", "seed_search_console_records"));
    }

    function saveSearchConsoleRecord(record) {
        var records = getSearchConsoleRecords();
        records.unshift(record);
        writeStorage("tfse_search_console_records", records.slice(0, 150));
    }

    function latestSearchConsoleRecord(key) {
        return getSearchConsoleRecords().find(function (record) {
            return record && record.target_key === key;
        }) || null;
    }

    function getExternalExecutionRecords() {
        return mergeSeededRecords("tfse_external_execution_records", adminSeedRecords("external_execution_records", "seed_external_execution_records"));
    }

    function saveExternalExecutionRecord(record) {
        var records = getExternalExecutionRecords();
        records.unshift(record);
        writeStorage("tfse_external_execution_records", records.slice(0, 150));
    }

    function latestExternalExecutionRecord(key) {
        return getExternalExecutionRecords().find(function (record) {
            return record && record.item_key === key;
        }) || null;
    }

    function getLineOaRecords() {
        return mergeSeededRecords("tfse_line_oa_records", adminSeedRecords("line_oa_records", "seed_line_oa_records"));
    }

    function saveLineOaRecord(record) {
        var records = getLineOaRecords();
        records.unshift(record);
        writeStorage("tfse_line_oa_records", records.slice(0, 150));
    }

    function latestLineOaRecord(key) {
        return getLineOaRecords().find(function (record) {
            return record && record.task_key === key;
        }) || null;
    }

    function getLaunchHandoffRecords() {
        return mergeSeededRecords("tfse_launch_handoff_records", adminSeedRecords("launch_handoff_records", "seed_launch_handoff_records"));
    }

    function saveLaunchHandoffRecord(record) {
        var records = getLaunchHandoffRecords();
        records.unshift(record);
        writeStorage("tfse_launch_handoff_records", records.slice(0, 150));
    }

    function latestBrowserAcceptanceRecord(key) {
        var aliases = {
            no_text_overlap: ["no_text_overlap", "no_text_overlap_browser"],
            no_text_overlap_browser: ["no_text_overlap_browser", "no_text_overlap"],
            form_submit_browser: ["form_submit_browser", "lead_submit_browser"],
            lead_submit_browser: ["lead_submit_browser", "form_submit_browser"],
            public_feedback_intake: ["public_feedback_intake"]
        };
        var allowedKeys = aliases[key] || [key];
        return getBrowserAcceptanceRecords().find(function (record) {
            return allowedKeys.indexOf(record.item_key) !== -1 && record.result === "passed";
        }) || null;
    }

    function browserAcceptanceRecordsForKey(key) {
        var aliases = {
            no_text_overlap: ["no_text_overlap", "no_text_overlap_browser"],
            no_text_overlap_browser: ["no_text_overlap_browser", "no_text_overlap"],
            form_submit_browser: ["form_submit_browser", "lead_submit_browser"],
            lead_submit_browser: ["lead_submit_browser", "form_submit_browser"],
            public_feedback_intake: ["public_feedback_intake"]
        };
        var allowedKeys = aliases[key] || [key];
        return getBrowserAcceptanceRecords().filter(function (record) {
            return allowedKeys.indexOf(record.item_key) !== -1;
        });
    }

    function browserAcceptanceEvidence(item) {
        var record = latestBrowserAcceptanceRecord(item.key);
        if (!record) return null;
        return "瀏覽器驗收通過：" + record.viewport + "｜" + formatDate(record.checked_at) + "｜" + (record.evidence_note || "已完成桌面/手機瀏覽器確認");
    }

    function landingPagePath(page) {
        return "lp/" + encodeURIComponent(page.slug) + ".html";
    }

    function adCampaignUtmUrl(page) {
        var base = landingPagePath(page);
        var campaign = page.slug.replace(/-/g, "_") + "_2026q3";
        var content = page.slug.replace(/-/g, "_") + "_a";
        return base + "?utm_source=facebook&utm_medium=paid_social&utm_campaign=" + campaign + "&utm_content=" + content + "&utm_term=" + encodeURIComponent(page.need_label || page.short_title || page.slug);
    }

    function adCampaignItems() {
        return landingPageData.map(function (page) {
            return {
                slug: page.slug,
                title: page.title,
                short_title: page.short_title,
                category_slug: page.category_slug,
                need_label: page.need_label,
                url: landingPagePath(page),
                utm_example: adCampaignUtmUrl(page),
                product_categories: page.product_categories || [],
                article_keywords: page.article_keywords || [],
                faq_count: (page.faq || []).length,
                checks: [
                    "痛點標題",
                    "合法資訊查詢說明",
                    "不代辦、不收證件、不保證核貸",
                    "三步流程",
                    "對應資訊卡片",
                    "FAQ",
                    "免費財務健檢查詢表單",
                    "Line CTA",
                    "免責聲明"
                ]
            };
        });
    }

    function adCampaignPayload() {
        return {
            format: "tfse_ad_campaign_checklist",
            exported_at: new Date().toISOString(),
            exported_by_role: currentRole(),
            utm_standard: {
                utm_source: "facebook",
                utm_medium: "paid_social",
                utm_campaign: "{slug}_2026q3",
                utm_content: "{creative_name}",
                utm_term: "{keyword_or_need}"
            },
            items: adCampaignItems()
        };
    }

    function conversionBacklogItems() {
        var attribution = attributionPayload();
        var campaigns = attribution.campaigns || [];
        return adCampaignItems().map(function (page) {
            var matches = campaigns.filter(function (campaign) {
                var campaignText = [
                    campaign.utm_campaign,
                    campaign.utm_content,
                    campaign.utm_term,
                    campaign.label,
                    (campaign.top_pages || []).map(function (item) { return item.key; }).join(" ")
                ].join(" ").toLowerCase();
                return campaignText.indexOf(page.slug.replace(/-/g, "_").toLowerCase()) !== -1 || campaignText.indexOf(page.slug.toLowerCase()) !== -1;
            });
            var views = matches.reduce(function (sum, item) { return sum + (item.landing_page_views || 0); }, 0);
            var ctaClicks = matches.reduce(function (sum, item) { return sum + (item.free_check_cta_clicks || 0); }, 0);
            var leads = matches.reduce(function (sum, item) { return sum + (item.leads || item.form_submits || 0); }, 0);
            var lineClicks = matches.reduce(function (sum, item) { return sum + (item.line_clicks || 0); }, 0);
            var leadRate = conversionRate(leads, ctaClicks || views);
            var lineRate = conversionRate(lineClicks, leads);
            var actions = [];
            if (!matches.length) actions.push("尚無歸因資料，投流前先使用標準 UTM URL 做 QA 點擊與表單測試。");
            if ((views || ctaClicks) && !leads) actions.push("有流量但尚無線索，檢查首屏 CTA、表單位置、隱私同意與手機端可讀性。");
            if ((ctaClicks || views) && leadRate < 15) actions.push("線索率低於 15%，測試較短說明、FAQ 前移與更清楚的不代辦邊界。");
            if (leads && lineRate < 50) actions.push("Line 承接低於 50%，檢查成功訊息、Line OA URL 與 quick reply 對應需求。");
            if (!actions.length) actions.push("維持目前文案，下一輪只測試單一變因，避免同時更動 CTA、FAQ 與表單欄位。");
            return {
                slug: page.slug,
                landing_url: page.url,
                utm_example: page.utm_example,
                priority: actions.length > 1 || (!matches.length && page.slug !== "free-check") ? "medium" : "normal",
                hypothesis: "若保留合規邊界並讓使用者更快理解「查詢方向」與「不代辦」，可提升免費財務健檢查詢提交與 Line 承接。",
                primary_kpi: "lead_rate_percent",
                secondary_kpi: "line_click_rate_percent",
                baseline: {
                    matched_campaigns: matches.length,
                    landing_page_views: views,
                    free_check_cta_clicks: ctaClicks,
                    leads: leads,
                    line_clicks: lineClicks,
                    lead_rate_percent: leadRate,
                    line_click_rate_percent: lineRate
                },
                guardrails: [
                    "不得使用包過、保證核貸、快速放款、代辦或內部管道等禁用詞。",
                    "不得新增證件、帳戶、卡號、密碼或附件收集欄位。",
                    "保留免責聲明、來源政策、隱私同意與 Line 同意分離。"
                ],
                next_actions: actions.slice(0, 4)
            };
        });
    }

    function conversionBacklogPayload() {
        var items = conversionBacklogItems();
        return {
            format: "tfse_conversion_optimization_backlog",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source_reports: ["tfse_ad_campaign_checklist", "tfse_utm_attribution_report", "tfse_browser_acceptance_report"],
            privacy_note: "優化待辦只使用聚合數字、落地頁 slug 與 UTM，不輸出完整手機、Line ID 或表單補充說明。",
            summary: {
                landing_pages: items.length,
                medium_priority: items.filter(function (item) { return item.priority === "medium"; }).length,
                items_without_attribution: items.filter(function (item) { return !item.baseline.matched_campaigns; }).length
            },
            experiment_rules: [
                "每輪只改一個主要變因，例如 CTA 文案、FAQ 順序或表單說明。",
                "投流前先跑文案即時預檢與法務/合規送審包。",
                "保留標準 UTM，方便 GA4、Meta Pixel、Server Event 與本機報表交叉核對。"
            ],
            items: items,
            related_exports: ["tfse_ad_campaign_checklist", "tfse_utm_attribution_report", "tfse_legal_compliance_review_package", "tfse_external_verification_evidence"]
        };
    }

    function statusLabel(done) {
        return done ? "已準備" : "待配置";
    }

    function auditStatusLabel(status, done) {
        if (status === "manual_browser") return "瀏覽器待驗";
        if (status === "manual_external" || status === "external_pending") return "外部待驗";
        if (status === "not_applicable") return "靜態版不適用";
        if (status === "missing") return "待補";
        return statusLabel(done);
    }

    function launchHealthItems() {
        var analytics = (siteConfigData && siteConfigData.analytics) || {};
        var searchConsole = (siteConfigData && siteConfigData.search_console) || {};
        var line = (siteConfigData && siteConfigData.line) || {};
        return [
            { key: "base_url", label: "正式網址設定", done: !!siteConfigData.base_url, detail: siteConfigData.base_url || "尚未設定" },
            { key: "sitemap", label: "sitemap.xml", done: true, detail: "sitemap.xml 已納入靜態驗收" },
            { key: "robots", label: "robots.txt", done: true, detail: "robots.txt 指向 sitemap" },
            { key: "error_pages", label: "404 / 500 頁", done: true, detail: "404.html 與 500.html 已建立" },
            { key: "ga4", label: "GA4 Measurement ID", done: !!analytics.ga4_measurement_id, detail: analytics.ga4_measurement_id || "正式 ID 待填" },
            { key: "meta_pixel", label: "Meta Pixel ID", done: !!analytics.meta_pixel_id, detail: analytics.meta_pixel_id || "正式 Pixel 待填" },
            { key: "server_event", label: "Server Event Endpoint", done: !!analytics.server_event_endpoint, detail: analytics.server_event_endpoint || "正式事件 API 待填" },
            { key: "sentry", label: "Sentry DSN", done: !!analytics.sentry_dsn, detail: analytics.sentry_dsn || "正式 DSN 待填" },
            { key: "search_console", label: "Search Console 驗證碼", done: !!searchConsole.google_site_verification, detail: searchConsole.google_site_verification || "驗證碼待填" },
            { key: "line_oa", label: "Line OA URL", done: !!line.oa_url && line.oa_url !== "free-check.html#line-cta", detail: line.oa_url || "Line OA 待填" },
            { key: "backup", label: "本機備份包", done: true, detail: "Admin 可匯出/匯入本機 MVP 備份包" },
            { key: "compliance_scan", label: "合規掃描", done: true, detail: "tools/compliance_scan.py 已納入驗收命令" },
            { key: "config_validation", label: "站點配置格式校驗", done: true, detail: "tools/validate_site_config.py 可檢查正式 ID、URL 與 canonical 設定格式" }
        ];
    }

    function launchHealthPayload() {
        var items = launchHealthItems();
        return {
            format: "tfse_launch_health_check",
            exported_at: new Date().toISOString(),
            exported_by_role: currentRole(),
            ready_count: items.filter(function (item) { return item.done; }).length,
            pending_count: items.filter(function (item) { return !item.done; }).length,
            items: items
        };
    }

    function isHttpsUrl(value) {
        return /^https:\/\/[^/\s?#]+[^\s]*$/i.test(String(value || ""));
    }

    function isRelativeUrl(value) {
        return /^[A-Za-z0-9._~/-]+(\?[^#\s]*)?(#[A-Za-z0-9_-]+)?$/.test(String(value || ""));
    }

    function isOfficialDomainUrl(value) {
        if (!isHttpsUrl(value)) return false;
        try {
            var host = new URL(String(value || "")).hostname.toLowerCase();
            return !!host && host.indexOf("127.0.0.1") === -1 && host.indexOf("localhost") === -1 && host.indexOf("github.io") === -1;
        } catch (error) {
            return false;
        }
    }

    function preferredHint(current, validator, fallback) {
        return validator(current) ? current : fallback;
    }

    function configReadinessItems() {
        var analytics = (siteConfigData && siteConfigData.analytics) || {};
        var searchConsole = (siteConfigData && siteConfigData.search_console) || {};
        var backend = (siteConfigData && siteConfigData.backend) || {};
        var security = (siteConfigData && siteConfigData.security) || {};
        var turnstile = security.turnstile || {};
        var line = (siteConfigData && siteConfigData.line) || {};
        var canonicalPages = siteConfigData.canonical_pages || [];
        return [
            { group: "SEO", key: "base_url", label: "正式網域", done: isHttpsUrl(siteConfigData.base_url), detail: siteConfigData.base_url || "尚未設定 HTTPS 正式網域" },
            { group: "SEO", key: "canonical_pages", label: "Canonical 頁面清單", done: canonicalPages.indexOf("") !== -1 && canonicalPages.indexOf("index.html") !== -1, detail: canonicalPages.length + " 頁已列入 site-config.json" },
            { group: "SEO", key: "search_console", label: "Search Console 驗證碼", done: !!searchConsole.google_site_verification, detail: searchConsole.google_site_verification || "正式驗證碼待填" },
            { group: "追蹤", key: "ga4", label: "GA4 Measurement ID", done: /^G-[A-Z0-9]{6,}$/.test(analytics.ga4_measurement_id || ""), detail: analytics.ga4_measurement_id || "正式 GA4 ID 待填" },
            { group: "追蹤", key: "meta_pixel", label: "Meta Pixel ID", done: /^[0-9]{8,}$/.test(analytics.meta_pixel_id || ""), detail: analytics.meta_pixel_id || "正式 Pixel ID 待填" },
            { group: "追蹤", key: "server_event", label: "Server Event Endpoint", done: !analytics.server_event_endpoint || isHttpsUrl(analytics.server_event_endpoint), detail: analytics.server_event_endpoint || "未啟用正式事件 API" },
            { group: "追蹤", key: "sentry", label: "Sentry DSN", done: !analytics.sentry_dsn || isHttpsUrl(analytics.sentry_dsn), detail: analytics.sentry_dsn || "正式 DSN 待填" },
            { group: "後端", key: "backend_mode", label: "後端模式", done: backend.mode === "api" ? isHttpsUrl(backend.api_base_url) : backend.mode === "localStorage", detail: backend.mode === "api" ? (backend.api_base_url || "API URL 待填") : "目前為 localStorage MVP" },
            { group: "安全", key: "turnstile", label: "Cloudflare Turnstile", done: !turnstile.enabled || !!turnstile.site_key, detail: turnstile.enabled ? (turnstile.site_key || "site key 待填") : "MVP 未啟用 Turnstile 強制驗證" },
            { group: "承接", key: "line_oa", label: "Line OA URL", done: !!line.oa_url && line.oa_url !== "free-check.html#line-cta" && (isHttpsUrl(line.oa_url) || isRelativeUrl(line.oa_url)), detail: line.oa_url || "Line OA 加友網址待填" }
        ];
    }

    function configReadinessPayload() {
        var items = configReadinessItems();
        return {
            format: "tfse_production_config_readiness",
            exported_at: new Date().toISOString(),
            exported_by_role: currentRole(),
            source: "site-config.json",
            ready_count: items.filter(function (item) { return item.done; }).length,
            pending_count: items.filter(function (item) { return !item.done; }).length,
            items: items
        };
    }

    function configDraftTemplate() {
        return JSON.stringify({
            base_url: siteConfigData.base_url || "",
            analytics: siteConfigData.analytics || {},
            search_console: siteConfigData.search_console || {},
            backend: siteConfigData.backend || {},
            security: siteConfigData.security || {},
            line: siteConfigData.line || {}
        }, null, 2);
    }

    function parseConfigDraft() {
        var raw = configDraftInput ? configDraftInput.value.trim() : "";
        if (!raw) raw = localStorage.getItem("tfse_site_config_update_draft") || "";
        if (!raw) {
            return { raw: "", data: {}, errors: ["尚未貼上 site-config 更新草稿。"] };
        }
        try {
            return { raw: raw, data: JSON.parse(raw), errors: [] };
        } catch (error) {
            return { raw: raw, data: {}, errors: ["JSON 格式錯誤：" + error.message] };
        }
    }

    function validateConfigDraft(data) {
        var errors = [];
        var warnings = [];
        var allowed = ["base_url", "analytics", "search_console", "backend", "security", "line"];
        Object.keys(data || {}).forEach(function (key) {
            if (allowed.indexOf(key) === -1) warnings.push("未識別欄位：" + key + "，正式合併前需人工確認。");
        });
        if (data.base_url && !isHttpsUrl(data.base_url)) errors.push("base_url 需使用 HTTPS 正式網址。");
        if (data.analytics) {
            if (data.analytics.ga4_measurement_id && !/^G-[A-Z0-9]{6,}$/.test(data.analytics.ga4_measurement_id)) errors.push("GA4 Measurement ID 格式不正確。");
            if (data.analytics.meta_pixel_id && !/^[0-9]{8,}$/.test(data.analytics.meta_pixel_id)) errors.push("Meta Pixel ID 格式不正確。");
            if (data.analytics.server_event_endpoint && !isHttpsUrl(data.analytics.server_event_endpoint)) errors.push("Server Event endpoint 需使用 HTTPS。");
            if (data.analytics.sentry_dsn && !isHttpsUrl(data.analytics.sentry_dsn)) errors.push("Sentry DSN 需使用 HTTPS。");
        }
        if (data.backend) {
            if (data.backend.mode === "api" && !isHttpsUrl(data.backend.api_base_url)) errors.push("backend.api_base_url 需使用 HTTPS。");
            if (data.backend.mode && ["localStorage", "api"].indexOf(data.backend.mode) === -1) errors.push("backend.mode 僅允許 localStorage 或 api。");
        }
        if (data.security && data.security.turnstile && data.security.turnstile.enabled && !data.security.turnstile.site_key) {
            errors.push("Turnstile 啟用時需填入 site_key。");
        }
        if (data.line && data.line.oa_url && !(isHttpsUrl(data.line.oa_url) || isRelativeUrl(data.line.oa_url))) {
            errors.push("line.oa_url 需為 HTTPS 或站內相對路徑。");
        }
        if (data.search_console && data.search_console.google_site_verification && /\s/.test(data.search_console.google_site_verification)) {
            warnings.push("Search Console 驗證碼含空白，正式填入前請確認是否完整。");
        }
        return { errors: errors, warnings: warnings };
    }

    function configDraftPayload() {
        var parsed = parseConfigDraft();
        var validation = validateConfigDraft(parsed.data);
        var blockers = parsed.errors.concat(validation.errors);
        return {
            format: "tfse_site_config_update_package",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source: "admin site-config update draft",
            target_file: "site-config.json",
            status: blockers.length ? "needs_revision" : "ready_for_manual_merge",
            draft_keys: Object.keys(parsed.data || {}),
            validation: {
                errors: blockers,
                warnings: validation.warnings,
                command_after_merge: [
                    "python3 tools/generate_seo_assets.py",
                    "python3 tools/validate_site_config.py",
                    "python3 tools/production_config_audit.py",
                    "python3 tools/verify_static_site.py"
                ]
            },
            patch: parsed.data,
            current_config_summary: {
                base_url: siteConfigData.base_url || "",
                ga4_configured: !!((siteConfigData.analytics || {}).ga4_measurement_id),
                meta_pixel_configured: !!((siteConfigData.analytics || {}).meta_pixel_id),
                server_event_configured: !!((siteConfigData.analytics || {}).server_event_endpoint),
                sentry_configured: !!((siteConfigData.analytics || {}).sentry_dsn),
                search_console_configured: !!((siteConfigData.search_console || {}).google_site_verification),
                backend_mode: (siteConfigData.backend || {}).mode || "localStorage",
                line_oa_configured: !!((siteConfigData.line || {}).oa_url) && (siteConfigData.line || {}).oa_url !== "free-check.html#line-cta"
            },
            related_exports: ["tfse_production_config_readiness", "tfse_domain_cutover_package", "tfse_monitoring_receipt_checklist", "tfse_external_verification_evidence"]
        };
    }

    function configApprovalPayload() {
        var readiness = configReadinessPayload();
        var draft = configDraftPayload();
        var external = externalVerificationPayload();
        var domain = domainCutoverPayload();
        var pendingServices = readiness.items.filter(function (item) {
            return !item.done;
        }).map(function (item) {
            return {
                key: item.key,
                label: item.label,
                group: item.group,
                detail: item.detail
            };
        });
        return {
            format: "tfse_site_config_approval_package",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            target_file: "site-config.json",
            status: draft.status === "ready_for_manual_merge" ? "awaiting_approval" : "needs_revision_before_approval",
            approval_policy: {
                required_roles: ["data_manager", "compliance_reviewer", "super_admin"],
                merge_owner: "data_manager",
                final_signoff_owner: "super_admin",
                compliance_gate: "涉及廣告追蹤、Line OA、後端 API、Turnstile 或正式網域時，需先保存法務/合規外部複核留痕。"
            },
            summary: {
                config_ready_count: readiness.ready_count,
                config_pending_count: readiness.pending_count,
                draft_status: draft.status,
                draft_error_count: draft.validation.errors.length,
                draft_warning_count: draft.validation.warnings.length,
                external_verified_items: external.summary.verified_items,
                domain_status: domain.status
            },
            pending_services: pendingServices,
            draft_package: {
                status: draft.status,
                draft_keys: draft.draft_keys,
                validation: draft.validation,
                current_config_summary: draft.current_config_summary
            },
            approval_checklist: [
                "確認草稿不含 secret、資料庫 URL、Admin session secret 或 Turnstile secret key 真值。",
                "確認 base_url、GA4、Meta Pixel、Sentry、Server Event、Search Console、Line OA、backend.api_base_url 與 Turnstile 格式通過預檢。",
                "人工合併 site-config.json 後執行 SEO 重生與配置驗證命令。",
                "完成 GA4、Meta Pixel、Server Event、Sentry、Search Console、Line OA 與正式後端 API 的外部收件/導向留痕。",
                "匯出並保存發布凍結、網域切換、監控收件與外部配置驗證包。"
            ],
            post_merge_commands: [
                "python3 tools/generate_seo_assets.py",
                "python3 tools/validate_site_config.py",
                "python3 tools/production_config_audit.py",
                "python3 tools/seo_assets_audit.py",
                "python3 tools/verify_static_site.py",
                "python3 tools/acceptance_audit.py"
            ],
            required_external_evidence: ["ga4", "meta_pixel", "server_event", "sentry", "search_console", "line_oa", "backend_api", "legal_review"],
            related_exports: ["tfse_site_config_update_package", "tfse_production_config_readiness", "tfse_domain_cutover_package", "tfse_external_verification_evidence", "tfse_release_readiness_package"]
        };
    }

    function envTemplateItems() {
        var analytics = (siteConfigData && siteConfigData.analytics) || {};
        var searchConsole = (siteConfigData && siteConfigData.search_console) || {};
        var backend = (siteConfigData && siteConfigData.backend) || {};
        var security = (siteConfigData && siteConfigData.security) || {};
        var turnstile = security.turnstile || {};
        var line = (siteConfigData && siteConfigData.line) || {};
        return [
            { group: "static_site", name: "TFSE_BASE_URL", source_path: "site-config.json.base_url", configured: isOfficialDomainUrl(siteConfigData.base_url), value_hint: preferredHint(siteConfigData.base_url || "", isOfficialDomainUrl, "https://www.example.com"), secret: false, deploy_target: "site-config.json / static host" },
            { group: "analytics", name: "TFSE_GA4_MEASUREMENT_ID", source_path: "site-config.json.analytics.ga4_measurement_id", configured: /^G-[A-Z0-9]{6,}$/.test(analytics.ga4_measurement_id || ""), value_hint: preferredHint(analytics.ga4_measurement_id || "", function (value) { return /^G-[A-Z0-9]{6,}$/.test(String(value || "")); }, "G-XXXXXXXXXX"), secret: false, deploy_target: "site-config.json / static host" },
            { group: "analytics", name: "TFSE_META_PIXEL_ID", source_path: "site-config.json.analytics.meta_pixel_id", configured: /^[0-9]{8,}$/.test(analytics.meta_pixel_id || ""), value_hint: preferredHint(analytics.meta_pixel_id || "", function (value) { return /^[0-9]{8,}$/.test(String(value || "")); }, "000000000000000"), secret: false, deploy_target: "site-config.json / static host" },
            { group: "analytics", name: "TFSE_SERVER_EVENT_ENDPOINT", source_path: "site-config.json.analytics.server_event_endpoint", configured: !!analytics.server_event_endpoint && isHttpsUrl(analytics.server_event_endpoint), value_hint: preferredHint(analytics.server_event_endpoint || "", isHttpsUrl, "https://api.example.com/events"), secret: false, deploy_target: "site-config.json / API server" },
            { group: "monitoring", name: "TFSE_SENTRY_DSN", source_path: "site-config.json.analytics.sentry_dsn", configured: !!analytics.sentry_dsn && isHttpsUrl(analytics.sentry_dsn), value_hint: preferredHint(analytics.sentry_dsn || "", isHttpsUrl, "https://public@sentry.example/1"), secret: false, deploy_target: "site-config.json / static host" },
            { group: "seo", name: "TFSE_GOOGLE_SITE_VERIFICATION", source_path: "site-config.json.search_console.google_site_verification", configured: !!searchConsole.google_site_verification, value_hint: preferredHint(searchConsole.google_site_verification || "", function (value) { return !!value; }, "google-site-verification-token"), secret: false, deploy_target: "site-config.json / generated HTML head" },
            { group: "backend", name: "TFSE_BACKEND_MODE", source_path: "site-config.json.backend.mode", configured: backend.mode === "api", value_hint: preferredHint(backend.mode || "", function (value) { return value === "api"; }, "api"), secret: false, deploy_target: "site-config.json / API server" },
            { group: "backend", name: "TFSE_BACKEND_API_BASE_URL", source_path: "site-config.json.backend.api_base_url", configured: !!backend.api_base_url && isHttpsUrl(backend.api_base_url), value_hint: preferredHint(backend.api_base_url || "", isHttpsUrl, "https://api.example.com"), secret: false, deploy_target: "site-config.json / static host" },
            { group: "security", name: "TFSE_TURNSTILE_SITE_KEY", source_path: "site-config.json.security.turnstile.site_key", configured: !!turnstile.site_key, value_hint: preferredHint(turnstile.site_key || "", function (value) { return !!value; }, "0x4AAAA..."), secret: false, deploy_target: "site-config.json / static host" },
            { group: "security", name: "TFSE_TURNSTILE_SECRET_KEY", source_path: "server env only", configured: false, value_hint: "store in secret manager only", secret: true, deploy_target: "API server / CI secret" },
            { group: "line", name: "TFSE_LINE_OA_URL", source_path: "site-config.json.line.oa_url", configured: !!line.oa_url && line.oa_url !== "free-check.html#line-cta", value_hint: preferredHint(line.oa_url || "", function (value) { return !!value && value !== "free-check.html#line-cta" && (isHttpsUrl(value) || isRelativeUrl(value)); }, "https://lin.ee/xxxx"), secret: false, deploy_target: "site-config.json / static host" },
            { group: "backend", name: "TFSE_DATABASE_URL", source_path: "server env only", configured: false, value_hint: "store in secret manager only", secret: true, deploy_target: "API server / CI secret" },
            { group: "backend", name: "TFSE_ADMIN_SESSION_SECRET", source_path: "server env only", configured: false, value_hint: "store in secret manager only", secret: true, deploy_target: "API server / CI secret" },
            { group: "backup", name: "TFSE_BACKUP_BUCKET", source_path: "server env only", configured: false, value_hint: "backup bucket or storage path", secret: false, deploy_target: "API server / backup job" }
        ];
    }

    function envTemplatePayload() {
        var items = envTemplateItems();
        return {
            format: "tfse_production_env_template",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source: "site-config.json + PRODUCTION_BACKEND_PLAN.md",
            secret_policy: "此包只保存正式環境變數名稱、來源路徑、部署端與示例提示；Turnstile secret、Database URL、Admin session secret 不應寫入前端或提交到 Git。",
            configured_count: items.filter(function (item) { return item.configured; }).length,
            pending_count: items.filter(function (item) { return !item.configured; }).length,
            secret_count: items.filter(function (item) { return item.secret; }).length,
            target_files: ["site-config.json", ".env.production", "GitHub Actions secrets", "API server environment"],
            validation_commands: [
                "python3 tools/validate_site_config.py",
                "python3 tools/production_config_audit.py",
                "python3 tools/verify_static_site.py",
                "NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs"
            ],
            items: items,
            related_exports: ["tfse_production_config_readiness", "tfse_site_config_update_package", "tfse_backend_acceptance_matrix", "tfse_monitoring_receipt_checklist"]
        };
    }

    function externalVerificationState(service) {
        return externalVerificationPayload().items.find(function (item) {
            return item.service === service;
        }) || null;
    }

    function handoffPlanLocalBlockers() {
        var acceptance = acceptanceChecklistPayload();
        var counts = acceptance.status_counts || {};
        return (counts.missing || 0) + (counts.manual_browser || 0) + (counts.manual_command || 0) + (counts.pending || 0);
    }

    function handoffPlanClosureStatus() {
        var acceptance = acceptanceChecklistPayload();
        var cutover = launchCutoverAuditPayload();
        var localBlockers = handoffPlanLocalBlockers();
        if (localBlockers) return "local_gap_remaining";
        if ((acceptance.status_counts.external_pending || 0)
            || (acceptance.status_counts.manual_external || 0)
            || (cutover.counts.pending_external_input || 0)
            || (cutover.counts.ready_for_external_execution || 0)
            || (cutover.counts.pending_human_review || 0)) {
            return "local_closed_external_blocked";
        }
        return "production_closed";
    }

    function releaseRequiredCommands() {
        return [
            "python3 tools/compliance_scan.py",
            "python3 tools/data_quality_audit.py",
            "python3 tools/checklist_artifact_coverage_audit.py --markdown",
            "python3 tools/crm_capability_audit.py --markdown",
            "python3 tools/source_freshness_audit.py",
            "python3 tools/api_contract_audit.py",
            "python3 tools/backend_schema_audit.py",
            "python3 tools/performance_budget_audit.py",
            "python3 tools/seo_assets_audit.py",
            "python3 tools/production_config_audit.py",
            "python3 tools/production_env_template.py --markdown",
            "python3 tools/production_config_readiness.py --markdown",
            "python3 tools/site_config_update_package.py --markdown",
            "python3 tools/site_config_approval_package.py --markdown",
            "python3 tools/launch_health_check.py --markdown",
            "python3 tools/domain_cutover_package.py --markdown",
            "python3 tools/host_fallback_deployment_check.py --markdown",
            "python3 tools/https_ingress_fix_package.py --markdown",
            "python3 tools/seo_submission_package.py --markdown",
            "python3 tools/search_console_verification_package.py --markdown",
            "python3 tools/tracking_consent_audit.py --markdown",
            "python3 tools/monitoring_receipt_checklist.py --markdown",
            "python3 tools/sentry_error_verification_package.py --markdown",
            "python3 tools/admin_export_cli_coverage_audit.py --markdown",
            "python3 tools/security_headers_deployment_check.py --markdown",
            "python3 tools/admin_security_matrix.py --markdown",
            "python3 tools/admin_auth_cutover_check.py --markdown",
            "python3 tools/backend_acceptance_matrix.py --markdown",
            "python3 tools/line_oa_setup_package.py --markdown",
            "python3 tools/line_oa_handoff_check.py --markdown",
            "python3 tools/formal_backend_migration_package.py --markdown",
            "python3 tools/backup_restore_drill_plan.py --markdown",
            "python3 tools/backup_receipt_verification_package.py --markdown",
            "python3 tools/content_api_cutover_package.py --markdown",
            "python3 tools/turnstile_backend_verification_package.py --markdown",
            "python3 tools/analytics_debug_verification_package.py --markdown",
            "python3 tools/acceptance_checklist.py --markdown",
            "python3 tools/project_plan_coverage_report.py --markdown",
            "python3 tools/plan_requirement_trace.py --markdown",
            "python3 tools/source_review_queue.py --markdown",
            "python3 tools/source_verification_evidence.py --markdown",
            "python3 tools/content_version_snapshot.py --markdown",
            "python3 tools/privacy_request_queue.py --markdown",
            "python3 tools/line_segment_queue.py --markdown",
            "python3 tools/line_optout_complaint_queue.py --markdown",
            "python3 tools/institution_import_verification_package.py --markdown",
            "python3 tools/public_feedback_intake_package.py --markdown",
            "python3 tools/public_feedback_api_verification_package.py --markdown",
            "python3 tools/lead_dedupe_queue.py --markdown",
            "python3 tools/crm_follow_up_queue.py --markdown",
            "python3 tools/crm_contact_log.py --markdown",
            "python3 tools/crm_api_persistence_package.py --markdown",
            "python3 tools/form_risk_control_report.py --markdown",
            "python3 tools/import_validation_package.py --markdown",
            "python3 tools/data_retention_purge_plan.py --markdown",
            "python3 tools/privacy_fulfillment_verification_package.py --markdown",
            "python3 tools/local_backup.py --markdown",
            "python3 tools/ad_campaign_checklist.py --markdown",
            "python3 tools/conversion_optimization_backlog.py --markdown",
            "python3 tools/utm_attribution_report.py --markdown",
            "python3 tools/retrospective_report.py --markdown",
            "python3 tools/server_event_replay_queue.py --markdown",
            "python3 tools/legal_compliance_review_package.py --markdown",
            "python3 tools/legal_external_review_evidence.py --markdown",
            "python3 tools/compliance_api_persistence_package.py --markdown",
            "python3 tools/line_optout_api_verification_package.py --markdown",
            "python3 tools/local_audit_matrix.py --markdown",
            "python3 tools/seo_indexing_followup_queue.py --markdown",
            "python3 tools/accessibility_audit.py",
            "python3 tools/operations_runbook_audit.py",
            "python3 tools/validate_site_config.py",
            "python3 tools/acceptance_audit.py",
            "python3 tools/launch_cutover_audit.py",
            "python3 tools/backend_cutover_roadmap.py --markdown",
            "python3 tools/launch_execution_plan.py --markdown",
            "python3 tools/launch_countdown_plan.py --markdown",
            "python3 tools/formal_config_input_packet.py --markdown",
            "python3 tools/plan_closure_report.py --markdown",
            "python3 tools/project_phase_audit.py",
            "python3 tools/project_plan_coverage_audit.py --markdown",
            "python3 tools/external_execution_packet.py --markdown",
            "python3 tools/owner_cutover_bundle.py --markdown --summary-only",
            "python3 tools/release_day_runsheet.py --markdown",
            "python3 tools/external_verification_evidence.py --markdown",
            "python3 tools/release_readiness_package.py --markdown",
            "python3 tools/operations_task_queue.py --markdown",
            "python3 tools/incident_response_package.py --markdown",
            "python3 tools/launch_handoff_manifest.py --markdown",
            "python3 tools/verify_static_site.py",
            "NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs"
        ];
    }

    function localAuditMatrixPayload() {
        var config = configReadinessPayload();
        var configPacket = formalConfigInputPacketPayload();
        var phaseAudit = projectPhaseAuditPayload();
        var planCoverage = projectPlanCoveragePayload();
        var acceptance = acceptanceChecklistPayload();
        var browser = browserAcceptanceReportPayload();
        var cutover = launchCutoverAuditPayload();
        var backendRoadmap = backendRoadmapPayload();
        var execution = launchExecutionPlanPayload();
        var countdown = launchCountdownPlanPayload();
        var externalExecution = externalExecutionPacketPayload();
        var launchHealth = launchHealthPayload();
        var domainCutover = domainCutoverPayload();
        var seoSubmission = seoSubmissionPayload();
        var searchConsoleVerification = searchConsoleVerificationPayload();
        var trackingConsent = trackingConsentPayload();
        var monitoringReceipt = monitoringReceiptPayload();
        var sentryVerification = sentryVerificationPayload();
        var securityHeaders = securityHeadersPayload();
        var adminSecurityMatrix = adminSecurityMatrixPayload();
        var adminAuthCutover = authCutoverPayload();
        var backendAcceptance = backendAcceptancePayload();
        var lineOaSetup = lineOaSetupPayload();
        var lineOaHandoff = lineOaHandoffPayload();
        var migration = migrationPayload();
        var backupRestore = restoreDrillPayload();
        var backupReceipt = backupReceiptPayload();
        var contentApiCutover = contentApiCutoverPayload();
        var turnstileBackend = turnstileBackendPayload();
        var analyticsDebug = analyticsDebugPayload();
        var externalVerification = externalVerificationPayload();
        var releaseReadiness = releaseReadinessPayload();
        var operationsTasks = operationsTaskPayload();
        var incidentResponse = incidentResponsePayload();
        var handoff = launchHandoffManifestPayload();
        var ga4Pending = !(externalVerificationState("ga4") || {}).verified;
        var searchConsolePending = !(externalVerificationState("search_console") || {}).verified;

        function item(group, command, title, status, currentSignal, relatedExports) {
            return {
                group: group,
                command: command,
                title: title,
                status: status,
                current_signal: currentSignal,
                related_exports: relatedExports || []
            };
        }

        var items = [
            item("static_integrity", "python3 tools/compliance_scan.py", "合規掃描", "ready_to_run", "文案禁用詞、免責聲明與敏感個資規則已接入本地審核。", ["tfse_legal_compliance_review_package"]),
            item("static_integrity", "python3 tools/data_quality_audit.py", "資料品質審計", "ready_to_run", "分類、產品、文章、FAQ、落地頁與來源資料結構已掛入模板資料層。", ["tfse_content_version_snapshot", "tfse_source_review_queue"]),
            item("static_integrity", "python3 tools/checklist_artifact_coverage_audit.py --markdown", "交接包覆蓋度審計", "ready_to_run", "LAUNCH_CHECKLIST.md 中提到的 tfse_* 交接包已全部接入 Admin 導出與瀏覽器煙測。", ["tfse_project_plan_coverage_report", "tfse_plan_closure_report"]),
            item("static_integrity", "python3 tools/crm_capability_audit.py --markdown", "CRM 能力對賬", "ready_to_run", "可直接對照計畫文檔第 11 節與 Phase 5，核對登入、搜尋、篩選、詳情、狀態更新、聯繫紀錄、UTM、匯出權限與審計日誌。", ["tfse_crm_follow_up_queue", "tfse_crm_contact_log", "tfse_crm_api_persistence_package", "tfse_project_phase_audit"]),
            item("static_integrity", "python3 tools/source_freshness_audit.py", "來源時效審計", "ready_to_run", "公開來源、復核週期與來源占位規則已本地化。", ["tfse_source_review_queue", "tfse_source_verification_evidence"]),
            item("contract_integrity", "python3 tools/api_contract_audit.py", "API 合約審計", "ready_to_run", "前台 / Admin API 合約已覆蓋公開端點、RBAC、審計與隱私隊列。", ["tfse_backend_acceptance_matrix", "tfse_admin_auth_cutover_check"]),
            item("contract_integrity", "python3 tools/backend_schema_audit.py", "資料庫 Schema 審計", "ready_to_run", "正式 schema 已覆蓋潛客、內容、合規、Line、審計與備份表。", ["tfse_formal_backend_migration_package", "tfse_backup_receipt_verification_package"]),
            item("frontend_integrity", "python3 tools/performance_budget_audit.py", "前端性能預算審計", "ready_to_run", "關鍵頁直接資源預算已對齊；Admin 重量已降回預算內。", ["tfse_browser_acceptance_report"]),
            item("frontend_integrity", "python3 tools/accessibility_audit.py", "可用性 / 無障礙審計", "ready_to_run", "語系、圖片 alt、表單提示與 honeypot 隱藏規則已接入。", ["tfse_browser_acceptance_report"]),
            item("frontend_integrity", "python3 tools/seo_assets_audit.py", "SEO 資產重生審計", "ready_to_run", "canonical、OG、JSON-LD、robots、sitemap、feed 與 security.txt 可重生。", ["tfse_seo_submission_package", "tfse_domain_cutover_package"]),
            item("frontend_integrity", "python3 tools/verify_static_site.py", "整站靜態驗收", "ready_to_run", "模板保留、頁面資產、後台面板、交接包與煙測標記均已納入。", ["tfse_release_readiness_package"]),
            item("config_release", "python3 tools/production_config_audit.py", "正式配置覆蓋審計", config.pending_count ? "ready_with_external_follow_up" : "ready_to_run", "正式配置待填 " + config.pending_count + " 項；命令可直接跑，但會持續暴露未填的正式服務。", ["tfse_production_config_readiness", "tfse_site_config_update_package"]),
            item("config_release", "python3 tools/production_env_template.py --markdown", "正式環境變數模板", config.pending_count ? "ready_with_external_follow_up" : "ready_to_run", "site-config、API server、CI 與備份任務所需變數已可由 CLI 匯出。", ["tfse_production_env_template", "tfse_site_config_update_package"]),
            item("config_release", "python3 tools/production_config_readiness.py --markdown", "正式配置就緒度報告", config.pending_count ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接列出目前 ready / pending 的正式配置項。", ["tfse_production_config_readiness", "tfse_formal_config_input_packet"]),
            item("config_release", "python3 tools/site_config_update_package.py --markdown", "site-config 更新草稿預檢", "ready_with_external_follow_up", "未提供 draft 時會輸出 template 與 current summary；提供正式片段後可切成 ready_for_manual_merge。", ["tfse_site_config_update_package", "tfse_production_config_readiness"]),
            item("config_release", "python3 tools/site_config_approval_package.py --markdown", "site-config 配置簽核包", "ready_with_external_follow_up", "CLI 可輸出待審批摘要、pending services、domain cutover 狀態與合併後命令。", ["tfse_site_config_approval_package", "tfse_site_config_update_package"]),
            item("config_release", "python3 tools/launch_health_check.py --markdown", "上線健康檢查總表", launchHealth.pending_count ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接匯出正式網址、追蹤、Search Console、Line OA、備份與合規掃描總表；目前 pending " + launchHealth.pending_count + " 項。", ["tfse_launch_health_check", "tfse_external_verification_evidence"]),
            item("config_release", "python3 tools/domain_cutover_package.py --markdown", "正式網域切換 CLI 包", domainCutover.summary.blockers ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接彙整 base_url、canonical、SEO 資產、Search Console 與切換阻擋；目前 blocker " + domainCutover.summary.blockers + " 項。", ["tfse_domain_cutover_package", "tfse_release_readiness_package"]),
            item("config_release", "python3 tools/host_fallback_deployment_check.py --markdown", "主機錯誤頁 / fallback CLI 包", "ready_with_external_follow_up", "CLI 可直接輸出 404 / 500、未知路徑與 server error fallback 的正式主機驗證清單。", ["tfse_host_fallback_deployment_check", "tfse_release_readiness_package"]),
            item("config_release", "python3 tools/https_ingress_fix_package.py --markdown", "HTTPS 443 入站修復 CLI 包", "ready_with_external_follow_up", "CLI 可直接輸出 DNS、雲安全組、主機防火牆、反向代理、TLS 憑證與驗證命令。", ["tfse_live_deployment_check", "tfse_domain_cutover_package", "tfse_security_headers_deployment_check"]),
            item("config_release", "python3 tools/seo_submission_package.py --markdown", "SEO 提交 CLI 包", seoSubmission.blockers.length ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接匯出 canonical、產品/文章/分類/落地頁數量與 SEO 提交流程；目前 blocker " + seoSubmission.blockers.length + " 項。", ["tfse_seo_submission_package", "tfse_search_console_verification_package"]),
            item("config_release", "python3 tools/search_console_verification_package.py --markdown", "Search Console CLI 包", searchConsoleVerification.blockers.length ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接輸出 property 驗證、sitemap 提交與 URL Inspection 樣本；目前 blocker " + searchConsoleVerification.blockers.length + " 項。", ["tfse_search_console_verification_package", "tfse_seo_indexing_followup_queue"]),
            item("config_release", "python3 tools/tracking_consent_audit.py --markdown", "Tracking consent CLI 包", trackingConsent.blockers.length ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接檢查 analytics 同意與外部追蹤目的地邊界；目前 blocker " + trackingConsent.blockers.length + " 項。", ["tfse_tracking_consent_audit", "tfse_monitoring_receipt_checklist"]),
            item("config_release", "python3 tools/monitoring_receipt_checklist.py --markdown", "監控收件 CLI 包", monitoringReceipt.summary.blockers ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接列出 GA4、Meta、Server Event、Sentry 收件缺口；目前 blocker " + monitoringReceipt.summary.blockers + " 項。", ["tfse_monitoring_receipt_checklist", "tfse_external_verification_evidence"]),
            item("config_release", "python3 tools/sentry_error_verification_package.py --markdown", "Sentry 驗收 CLI 包", sentryVerification.blockers.length ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接匯出前台/API Sentry 驗收與遮罩規則；目前 blocker " + sentryVerification.blockers.length + " 項。", ["tfse_sentry_error_verification_package", "tfse_incident_response_package"]),
            item("config_release", "python3 tools/admin_export_cli_coverage_audit.py --markdown", "Admin/CLI 覆蓋度審計", "ready_to_run", "CLI 可直接對照 Admin 既有 tfse_* 導出與 tools/*.py 的 standalone 覆蓋度。", ["tfse_launch_handoff_manifest", "tfse_project_plan_coverage_report"]),
            item("config_release", "python3 tools/security_headers_deployment_check.py --markdown", "安全標頭部署 CLI 包", "ready_with_external_follow_up", "CLI 可直接輸出正式主機 header、CSP allowlist 與 security.txt 驗證命令。", ["tfse_security_headers_deployment_check", "tfse_domain_cutover_package"]),
            item("config_release", "python3 tools/admin_security_matrix.py --markdown", "Admin 安全矩陣 CLI 包", adminSecurityMatrix.blockers.length ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接輸出角色權限矩陣與正式 session/CSRF/MFA/audit/viewer masking 檢查；目前 blocker " + adminSecurityMatrix.blockers.length + " 項。", ["tfse_admin_security_matrix", "tfse_admin_auth_cutover_check"]),
            item("config_release", "python3 tools/admin_auth_cutover_check.py --markdown", "Admin Auth 切換 CLI 包", adminAuthCutover.blockers.length ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接輸出正式 Auth API、cookie/CSRF/RBAC/MFA 切換步驟與 blockers；目前 blocker " + adminAuthCutover.blockers.length + " 項。", ["tfse_admin_auth_cutover_check", "tfse_backend_acceptance_matrix"]),
            item("config_release", "python3 tools/backend_acceptance_matrix.py --markdown", "正式 API 驗收 CLI 包", backendAcceptance.summary.blockers ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接輸出 leads、Admin Auth、CRM、事件、內容 API、合規與個資流程的驗收矩陣；目前 blocker " + backendAcceptance.summary.blockers + " 項。", ["tfse_backend_acceptance_matrix", "tfse_backend_cutover_roadmap"]),
            item("config_release", "python3 tools/line_oa_setup_package.py --markdown", "Line OA setup CLI 包", lineOaSetup.quick_replies.length ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接輸出歡迎語、rich menu、quick replies、標籤與 setup 步驟。", ["tfse_line_oa_setup_package", "tfse_line_oa_handoff_check"]),
            item("config_release", "python3 tools/line_oa_handoff_check.py --markdown", "Line OA handoff CLI 包", lineOaHandoff.blockers.length ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接輸出站內 CTA、quick reply、正式 URL 與手機驗收流程；目前 blocker " + lineOaHandoff.blockers.length + " 項。", ["tfse_line_oa_handoff_check", "tfse_external_verification_evidence"]),
            item("config_release", "python3 tools/formal_backend_migration_package.py --markdown", "正式後端遷移 CLI 包", (migration.review_queues.source_review || !backendAcceptance.summary.api_configured) ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接輸出 seed 匯入順序、內容/來源隊列、敏感資料邊界與遷移 blockers；目前來源待復核 " + migration.review_queues.source_review + " 項。", ["tfse_formal_backend_migration_package", "tfse_import_validation_package"]),
            item("config_release", "python3 tools/backup_restore_drill_plan.py --markdown", "備份還原演練 CLI 包", backupRestore.blockers.length ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接輸出每日備份、每週還原演練、RPO/RTO 與證據欄位；目前 blocker " + backupRestore.blockers.length + " 項。", ["tfse_backup_restore_drill_plan", "tfse_backup_receipt_verification_package"]),
            item("config_release", "python3 tools/backup_receipt_verification_package.py --markdown", "備份收據驗收 CLI 包", backupReceipt.blockers.length ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接輸出 backup_jobs / restore drill 收據欄位與驗收步驟；目前 blocker " + backupReceipt.blockers.length + " 項。", ["tfse_backup_receipt_verification_package", "tfse_external_verification_evidence"]),
            item("config_release", "python3 tools/content_api_cutover_package.py --markdown", "內容 API 切換 CLI 包", contentApiCutover.blockers.length ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接輸出 products/articles/institutions/search 公開 API 驗收與靜態 fallback 邊界；目前 blocker " + contentApiCutover.blockers.length + " 項。", ["tfse_content_api_cutover_package", "tfse_backend_acceptance_matrix"]),
            item("config_release", "python3 tools/turnstile_backend_verification_package.py --markdown", "Turnstile 後端驗收 CLI 包", turnstileBackend.blockers.length ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接輸出 server-side siteverify、rate limit、去重與負向測試案例；目前 blocker " + turnstileBackend.blockers.length + " 項。", ["tfse_turnstile_backend_verification_package", "tfse_form_risk_control_report"]),
            item("config_release", "python3 tools/analytics_debug_verification_package.py --markdown", "Analytics Debug CLI 包", analyticsDebug.blockers.length ? "ready_with_external_follow_up" : "ready_to_run", "CLI 可直接輸出 GA4 / Meta / server event 映射、debug 步驟與證據欄位；目前 blocker " + analyticsDebug.blockers.length + " 項。", ["tfse_analytics_debug_verification_package", "tfse_monitoring_receipt_checklist"]),
            item("config_release", "python3 tools/validate_site_config.py", "site-config 格式驗證", configPacket.pending_count ? "ready_with_external_follow_up" : "ready_to_run", "目前格式路徑已建立；正式待填輸入仍有 " + configPacket.pending_count + " 項。", ["tfse_formal_config_input_packet", "tfse_site_config_approval_package"]),
            item("launch_closure", "python3 tools/acceptance_audit.py", "第 17 / 21 章驗收對賬", acceptance.pending_count ? "ready_with_external_follow_up" : "ready_to_run", "ready " + acceptance.ready_count + " 項；pending " + acceptance.pending_count + " 項。", ["tfse_acceptance_checklist"]),
            item("launch_closure", "python3 tools/browser_acceptance_report.py --markdown", "人工瀏覽器留痕模板", browser.pending_count ? "ready_with_manual_follow_up" : "ready_to_run", "瀏覽器留痕已通過 " + browser.passed_count + " 項；仍待留痕 " + browser.pending_count + " 項。", ["tfse_browser_acceptance_report"]),
            item("launch_closure", "NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs", "Playwright 煙測", browser.pending_count ? "ready_with_manual_follow_up" : "ready_to_run", "桌面 / 手機、Admin、導出與 formal API rehearsal 已有自動煙測鏈。", ["tfse_browser_acceptance_report", "tfse_external_verification_evidence"]),
            item("launch_closure", "python3 tools/launch_cutover_audit.py", "正式切換阻擋項審計", (cutover.summary.official_config_pending || cutover.summary.human_review_pending) ? "ready_with_external_follow_up" : "ready_to_run", "pending_external_input " + (cutover.summary.official_config_pending || 0) + "；ready_for_external_execution " + (cutover.summary.external_execution_ready || 0) + "；pending_human_review " + (cutover.summary.human_review_pending || 0) + "。", ["tfse_launch_cutover_audit"]),
            item("launch_closure", "python3 tools/backend_cutover_roadmap.py --markdown", "正式後端接入路線圖", backendRoadmap.summary.blockers ? "ready_with_external_follow_up" : "ready_to_run", "後端步驟 " + backendRoadmap.summary.total_steps + " 項；已具備 " + backendRoadmap.summary.ready_steps + " 項；API configured " + (backendRoadmap.summary.api_configured ? "是" : "否") + "。", ["tfse_backend_cutover_roadmap"]),
            item("launch_closure", "python3 tools/launch_execution_plan.py --markdown", "正式上線作戰計畫", execution.summary.official_config_pending ? "ready_with_external_follow_up" : "ready_to_run", "Phase 外部切換已拆成 4 個 wave，可按 owner 執行。", ["tfse_launch_execution_plan"]),
            item("launch_closure", "python3 tools/launch_countdown_plan.py --markdown", "正式上線倒排計畫", countdown.summary.official_config_pending ? "ready_with_external_follow_up" : "ready_to_run", "已拆成 D-3 / D-2 / D-1 / Go-live / D+1。", ["tfse_launch_countdown_plan"]),
            item("launch_closure", "python3 tools/formal_config_input_packet.py --markdown", "正式配置待填收斂", configPacket.pending_count ? "ready_with_external_follow_up" : "ready_to_run", "owner 待填 " + configPacket.pending_count + " 項；已留痕 " + configPacket.record_summary.tracked_count + " 項。", ["tfse_formal_config_input_packet"]),
            item("launch_closure", "python3 tools/plan_closure_report.py --markdown", "計畫閉環狀態總表", handoff.summary.plan_closure_status === "production_closed" ? "ready_to_run" : "ready_with_external_follow_up", "目前狀態 " + handoff.summary.plan_closure_status + "；本地阻擋 " + handoff.summary.plan_local_blockers + " 項。", ["tfse_plan_closure_report", "tfse_launch_handoff_manifest"]),
            item("launch_closure", "python3 tools/project_phase_audit.py", "模板套用階段對賬", (phaseAudit.counts.local_ready_external_pending || 0) ? "ready_with_external_follow_up" : "ready_to_run", "Phase ready " + (phaseAudit.counts.ready || 0) + "；local_ready_external_pending " + (phaseAudit.counts.local_ready_external_pending || 0) + "。", ["tfse_project_phase_audit"]),
            item("launch_closure", "python3 tools/project_plan_coverage_audit.py --markdown", "計畫 1-23 章對賬", planCoverage.local_ready_external_pending_count ? "ready_with_external_follow_up" : "ready_to_run", "章節 ready " + planCoverage.ready_count + "；external pending " + planCoverage.local_ready_external_pending_count + "。", ["tfse_project_plan_coverage_report"]),
            item("launch_closure", "python3 tools/plan_requirement_trace.py --markdown", "計畫逐條需求追蹤", (ga4Pending || searchConsolePending || backupReceipt.blockers.length) ? "ready_with_external_follow_up" : "ready_to_run", "可逐條追蹤第 17 / 21 章需求的 ready / external_pending / manual_browser。", ["tfse_plan_requirement_trace", "tfse_project_plan_coverage_report", "tfse_plan_closure_report"]),
            item("launch_closure", "python3 tools/external_execution_packet.py --markdown", "外部執行交接隊列", externalExecution.actionable_items ? "ready_with_external_follow_up" : "ready_to_run", "可交付外部執行 " + externalExecution.ready_for_external_execution_count + " 項；人工複核 " + externalExecution.pending_human_review_count + " 項。", ["tfse_external_execution_packet"]),
            item("launch_closure", "python3 tools/owner_cutover_bundle.py --markdown --summary-only", "Owner 切站任務包", externalExecution.actionable_items ? "ready_with_external_follow_up" : "ready_to_run", "可依 owner 直接拆分待填配置、執行清單與時序。", ["tfse_owner_cutover_bundle", "tfse_external_execution_packet", "tfse_plan_closure_report"]),
            item("launch_closure", "python3 tools/release_day_runsheet.py --markdown", "上線日 Run Sheet", handoff.summary.release_status === "ready_for_static_release" ? "ready_to_run" : "ready_with_external_follow_up", "可把 D-3 / D-2 / D-1 / Go-live / D+1 的 owner 任務壓成單一執行表。", ["tfse_release_day_runsheet", "tfse_owner_cutover_bundle", "tfse_launch_countdown_plan"]),
            item("launch_closure", "python3 tools/external_verification_evidence.py --markdown", "外部配置驗證 CLI 包", externalVerification.summary.verified_items < externalVerification.summary.required_items ? "ready_with_external_follow_up" : "ready_to_run", "configured " + externalVerification.summary.configured_items + " 項；verified " + externalVerification.summary.verified_items + " 項。", ["tfse_external_verification_evidence", "tfse_launch_health_check"]),
            item("launch_closure", "python3 tools/release_readiness_package.py --markdown", "發布凍結與回滾 CLI 包", releaseReadiness.readiness.release_status === "ready_for_static_release" ? "ready_to_run" : "ready_with_external_follow_up", "CLI 發布狀態：" + releaseReadiness.readiness.release_status + "；blockers " + releaseReadiness.blockers.length + " 項。", ["tfse_release_readiness_package", "tfse_operations_task_queue"]),
            item("launch_closure", "python3 tools/operations_task_queue.py --markdown", "運維任務隊列 CLI 包", operationsTasks.status_counts.pending_external || operationsTasks.status_counts.hold || operationsTasks.status_counts.needs_review ? "ready_with_external_follow_up" : "ready_to_run", "待處理任務狀態：" + JSON.stringify(operationsTasks.status_counts), ["tfse_operations_task_queue", "tfse_incident_response_package"]),
            item("launch_closure", "python3 tools/incident_response_package.py --markdown", "事故響應 CLI 包", incidentResponse.signals.release_blockers ? "ready_with_external_follow_up" : "ready_to_run", "P0/P1 觸發條件、回應步驟與高優先任務已可由 CLI 匯出。", ["tfse_incident_response_package", "tfse_release_readiness_package"]),
            item("launch_closure", "python3 tools/launch_handoff_manifest.py --markdown", "最終上線總交接清單", handoff.summary.release_status === "ready_for_static_release" ? "ready_to_run" : "ready_with_external_follow_up", "發布狀態：" + handoff.summary.release_status + "；checkpoint 留痕 " + handoff.summary.checkpoint_records + " 筆。", ["tfse_launch_handoff_manifest"]),
            item("ops_integrity", "python3 tools/operations_runbook_audit.py", "運維 Runbook 審計", "ready_to_run", "部署、監控、備份、rollback、incident 與 legal / compliance 章節已存在。", ["tfse_incident_response_package", "tfse_operations_task_queue"])
        ];

        var statusCounts = {};
        items.forEach(function (entry) {
            statusCounts[entry.status] = (statusCounts[entry.status] || 0) + 1;
        });

        return {
            format: "tfse_local_audit_matrix",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source: "LAUNCH_CHECKLIST / OPERATIONS_RUNBOOK local verification commands",
            summary: {
                total_commands: items.length,
                ready_to_run: statusCounts.ready_to_run || 0,
                ready_with_external_follow_up: statusCounts.ready_with_external_follow_up || 0,
                ready_with_manual_follow_up: statusCounts.ready_with_manual_follow_up || 0
            },
            status_definitions: {
                ready_to_run: "本地上下文已具備，命令可直接作為本機閉環審計執行。",
                ready_with_external_follow_up: "命令可直接執行，但結果仍會指向正式配置、正式後端或法務簽核待辦。",
                ready_with_manual_follow_up: "命令可直接執行，但仍需人工瀏覽器留痕或會議 gate 記錄補齊。"
            },
            items: items,
            related_exports: ["tfse_release_readiness_package", "tfse_project_phase_audit", "tfse_project_plan_coverage_report", "tfse_plan_requirement_trace", "tfse_plan_closure_report", "tfse_backend_cutover_roadmap", "tfse_launch_handoff_manifest"]
        };
    }

    var ownerCutoverSpecs = {
        data_manager: {
            label: "Data Manager",
            focus: "補齊正式網域、GA4、Meta、配置留痕、Search Console 前置與總交接節點。"
        },
        backend_engineer: {
            label: "Backend Engineer",
            focus: "切換正式 backend API、事件端點、Turnstile、Admin Auth、CRM/API 落庫與資料遷移。"
        },
        ops_marketing: {
            label: "Ops Marketing",
            focus: "完成正式 Line OA URL、圖文選單、quick reply、退訂與站內承接驗收。"
        },
        seo_owner: {
            label: "SEO Owner",
            focus: "補齊 Search Console 驗證碼、正式 property 驗證、sitemap 提交與收錄跟進。"
        },
        ops_engineer: {
            label: "Ops Engineer",
            focus: "補齊正式 Sentry DSN 並完成前台/API 受控錯誤驗證留痕。"
        },
        infra_owner: {
            label: "Infra Owner",
            focus: "完成正式主機 fallback、每日備份、每週 restore drill 與基礎設施證據留痕。"
        },
        legal_reviewer: {
            label: "Legal Reviewer",
            focus: "完成台灣當地法務/合規複核與正式簽核留痕。"
        }
    };

    var ownerCutoverRulePriorities = {
        data_manager: {
            "config:base_url": 10,
            "config:ga4_measurement_id": 20,
            "config:meta_pixel_id": 30,
            "verification:analytics_debug_verification": 70,
            "execution:institution_import": 80,
            "closeout:config_input_tracking": 90,
            "closeout:launch_health": 100,
            "closeout:external_verification": 110,
            "closeout:release_readiness": 120
        },
        backend_engineer: {
            "config:backend_mode_and_api_base_url": 10,
            "env:TFSE_DATABASE_URL": 20,
            "env:TFSE_ADMIN_SESSION_SECRET": 30,
            "config:server_event_endpoint": 40,
            "verification:leads_api_persistence": 60,
            "execution:admin_auth_server_cutover": 70,
            "verification:admin_crm_api_cutover": 80,
            "verification:content_api_cutover": 100,
            "verification:turnstile_backend_verification": 110,
            "execution:formal_backend_migration": 120,
            "closeout:backend_cutover": 130
        },
        ops_engineer: {
            "config:sentry_dsn": 10,
            "verification:sentry_verification": 30
        }
    };

    var ownerCutoverCloseoutItems = {
        data_manager: [
            { phase: "closeout", key: "config_input_tracking", title: "正式配置收件留痕", status: "pending_external", steps: ["逐項保存 received / validated / blocked 與 owner 備註。"], commands: [] },
            { phase: "closeout", key: "launch_health", title: "上線健康檢查", status: "pending_external", steps: ["外部服務完成後驗證收件與導向。"], commands: [] },
            { phase: "closeout", key: "external_verification", title: "外部配置驗證留痕", status: "pending_external", steps: ["正式服務配置後逐項保存 passed / blocked 證據。"], commands: [] },
            { phase: "closeout", key: "release_readiness", title: "發布凍結與回滾交接", status: "hold", steps: ["部署前確認凍結、命令、備份/遷移與回滾。"], commands: [] }
        ],
        backend_engineer: [
            { phase: "closeout", key: "backend_cutover", title: "正式後端接入路線圖", status: "pending_external", steps: ["依 roadmap 順序完成 leads API、Admin Auth、CRM、事件、內容 API 與備份還原。"], commands: [] }
        ]
    };

    var ownerCutoverCloseoutAllowlist = {
        data_manager: { config_input_tracking: true, launch_health: true, external_verification: true, release_readiness: true },
        backend_engineer: { backend_cutover: true },
        ops_engineer: {}
    };

    var ownerCutoverPhaseOrder = { config: 10, env: 20, verification: 30, execution: 40, closeout: 50 };
    var ownerCutoverTimelineSlots = [
        { slot: "d_minus_3", label: "D-3" },
        { slot: "d_minus_2", label: "D-2" },
        { slot: "d_minus_1", label: "D-1" },
        { slot: "go_live", label: "Go-live" },
        { slot: "d_plus_1", label: "D+1" }
    ];
    var ownerCutoverTimelineKeyMap = {
        base_url: "d_minus_3",
        ga4_measurement_id: "d_minus_3",
        meta_pixel_id: "d_minus_3",
        server_event_endpoint: "d_minus_3",
        line_oa_url: "d_minus_3",
        google_site_verification: "d_minus_3",
        backend_mode_and_api_base_url: "d_minus_3",
        sentry_dsn: "d_minus_3",
        config_input_tracking: "d_minus_3",
        line_oa_setup: "d_minus_2",
        admin_auth_server_cutover: "d_minus_2",
        database_backup_strategy: "d_minus_2",
        institution_import: "d_minus_2",
        formal_backend_migration: "d_minus_2",
        host_fallback_deployment: "d_minus_2",
        analytics_debug_verification: "d_minus_1",
        search_console_submit: "d_minus_1",
        content_api_cutover: "d_minus_1",
        leads_api_persistence: "d_minus_1",
        turnstile_backend_verification: "d_minus_1",
        admin_crm_api_cutover: "d_minus_1",
        sentry_verification: "d_minus_1",
        line_oa_handoff: "d_minus_1",
        launch_health: "go_live",
        external_verification: "go_live",
        release_readiness: "go_live",
        legal_review_external: "go_live"
    };

    function ownerForEnvItem(item) {
        if (item.owner) return item.owner;
        var mapping = {
            TFSE_BASE_URL: "data_manager",
            TFSE_GA4_MEASUREMENT_ID: "data_manager",
            TFSE_META_PIXEL_ID: "data_manager",
            TFSE_SERVER_EVENT_ENDPOINT: "backend_engineer",
            TFSE_SENTRY_DSN: "ops_engineer",
            TFSE_GOOGLE_SITE_VERIFICATION: "seo_owner",
            TFSE_BACKEND_MODE: "backend_engineer",
            TFSE_BACKEND_API_BASE_URL: "backend_engineer",
            TFSE_TURNSTILE_SITE_KEY: "backend_engineer",
            TFSE_TURNSTILE_SECRET_KEY: "backend_engineer",
            TFSE_LINE_OA_URL: "ops_marketing",
            TFSE_DATABASE_URL: "backend_engineer",
            TFSE_ADMIN_SESSION_SECRET: "backend_engineer",
            TFSE_BACKUP_BUCKET: "infra_owner"
        };
        return mapping[item.name] || "data_manager";
    }

    function ownerCutoverPatchTemplate(owner, configPacket) {
        var draft = (configPacket && configPacket.site_config_patch_template) || {};
        var filtered = {};
        function cloneSubset(source, keys) {
            var subset = {};
            keys.forEach(function (key) {
                if (source && Object.prototype.hasOwnProperty.call(source, key)) {
                    subset[key] = source[key];
                }
            });
            return subset;
        }
        if (owner === "data_manager") {
            if (draft.base_url) filtered.base_url = draft.base_url;
            var analyticsSubset = cloneSubset(draft.analytics || {}, ["ga4_measurement_id", "meta_pixel_id"]);
            if (Object.keys(analyticsSubset).length) filtered.analytics = analyticsSubset;
        } else if (owner === "backend_engineer") {
            var backendAnalytics = cloneSubset(draft.analytics || {}, ["server_event_endpoint"]);
            if (Object.keys(backendAnalytics).length) filtered.analytics = backendAnalytics;
            if (draft.backend) filtered.backend = draft.backend;
            if (draft.security) filtered.security = draft.security;
        } else if (owner === "ops_engineer") {
            var sentrySubset = cloneSubset(draft.analytics || {}, ["sentry_dsn"]);
            if (Object.keys(sentrySubset).length) filtered.analytics = sentrySubset;
        } else if (owner === "seo_owner") {
            if (draft.search_console) filtered.search_console = draft.search_console;
        } else if (owner === "ops_marketing") {
            if (draft.line) filtered.line = draft.line;
        }
        return filtered;
    }

    function ownerEnvSnippet(items) {
        var pending = (items || []).filter(function (item) {
            return !item.configured;
        });
        if (!pending.length) return "";
        return pending.map(function (item) {
            return item.name + "=" + (item.secret ? "<store-in-secret-manager>" : String(item.value_hint || "<fill-me>"));
        }).join("\n");
    }

    function genericOwnerCutoverSteps() {
        return [
            "依相關交接包完成正式外部操作或驗證。",
            "保存截圖、收件結果、驗證記錄或 reviewer 備註到對應留痕包。",
            "完成後重跑 launch_cutover_audit / plan_closure_report，確認狀態已更新。"
        ];
    }

    function applyOwnerCutoverChecklistRules(owner, checklist) {
        var allowlist = ownerCutoverCloseoutAllowlist[owner];
        var priorities = ownerCutoverRulePriorities[owner] || {};
        var filtered = checklist.filter(function (item) {
            if (item.phase !== "closeout" || !allowlist) return true;
            return !!allowlist[item.key];
        });
        return filtered.sort(function (a, b) {
            var aKey = a.phase + ":" + a.key;
            var bKey = b.phase + ":" + b.key;
            var aPriority = Object.prototype.hasOwnProperty.call(priorities, aKey) ? priorities[aKey] : null;
            var bPriority = Object.prototype.hasOwnProperty.call(priorities, bKey) ? priorities[bKey] : null;
            if (aPriority !== null && bPriority !== null) return aPriority - bPriority;
            if (aPriority !== null) return -1;
            if (bPriority !== null) return 1;
            var aPhase = ownerCutoverPhaseOrder[a.phase] || 999;
            var bPhase = ownerCutoverPhaseOrder[b.phase] || 999;
            if (aPhase !== bPhase) return aPhase - bPhase;
            return String(a.title || "").localeCompare(String(b.title || ""));
        });
    }

    function ownerCutoverTimelineSlotForItem(item) {
        if (ownerCutoverTimelineKeyMap[item.key]) return ownerCutoverTimelineKeyMap[item.key];
        if (item.phase === "config" || item.phase === "env") return "d_minus_3";
        if (item.phase === "execution") return "d_minus_2";
        if (item.phase === "verification") return "d_minus_1";
        return "go_live";
    }

    function ownerCutoverChecklist(owner) {
        var configPacket = formalConfigInputPacketPayload();
        var envTemplate = envTemplatePayload();
        var cutover = launchCutoverAuditPayload();
        var execution = externalExecutionPacketPayload();
        var executionMap = {};
        var envNamesFromConfig = {};
        var checklist = [];

        execution.items.forEach(function (item) {
            executionMap[item.key] = item;
        });

        configPacket.required_inputs.filter(function (item) {
            return item.owner_role === owner && !item.done;
        }).forEach(function (item) {
            checklist.push({
                phase: "config",
                key: item.key,
                title: item.label,
                status: "pending_config_input",
                steps: [
                    "更新 " + item.config_paths.join(", ") + "。",
                    "使用建議值作為正式填值模板。",
                    item.validation_hint || "完成後重新驗證格式與正式收件。"
                ],
                commands: item.follow_up_commands || []
            });
        });

        configPacket.required_inputs.filter(function (item) {
            return item.owner_role === owner;
        }).forEach(function (item) {
            (item.env_names || []).forEach(function (name) {
                envNamesFromConfig[name] = true;
            });
        });
        (configPacket.conditional_inputs || []).filter(function (item) {
            return item.owner_role === owner;
        }).forEach(function (item) {
            (item.env_names || []).forEach(function (name) {
                envNamesFromConfig[name] = true;
            });
        });

        (envTemplate.items || []).filter(function (item) {
            return ownerForEnvItem(item) === owner && !item.configured && !envNamesFromConfig[item.name];
        }).forEach(function (item) {
            checklist.push({
                phase: "env",
                key: item.name,
                title: item.name,
                status: "pending_env_input",
                steps: [
                    "在 " + item.deploy_target + " 補齊 " + item.name + "。",
                    "參考提示值 " + item.value_hint + "。",
                    "若屬 secret，僅放在 secret manager / CI，不寫入前端或 Git。"
                ],
                commands: []
            });
        });

        cutover.items.filter(function (item) {
            return item.owner === owner && ["pending_external_input", "ready_for_external_execution", "pending_human_review"].indexOf(item.status) !== -1;
        }).forEach(function (item) {
            var detailed = executionMap[item.key];
            checklist.push({
                phase: item.status === "ready_for_external_execution" ? "execution" : (item.status === "pending_human_review" ? "execution" : "verification"),
                key: item.key,
                title: item.label,
                status: item.status,
                steps: detailed && detailed.next_action ? [detailed.next_action] : genericOwnerCutoverSteps(),
                commands: [
                    "python3 tools/launch_cutover_audit.py",
                    "python3 tools/plan_closure_report.py --markdown"
                ]
            });
        });

        (ownerCutoverCloseoutItems[owner] || []).forEach(function (item) {
            checklist.push({
                phase: item.phase,
                key: item.key,
                title: item.title,
                status: item.status,
                steps: item.steps.slice(),
                commands: item.commands.slice()
            });
        });

        return applyOwnerCutoverChecklistRules(owner, checklist);
    }

    function ownerCutoverTimeline(checklist) {
        var slotBuckets = {};
        checklist.forEach(function (item) {
            var slot = ownerCutoverTimelineSlotForItem(item);
            slotBuckets[slot] = slotBuckets[slot] || [];
            slotBuckets[slot].push(item);
        });
        return ownerCutoverTimelineSlots.filter(function (item) {
            return (slotBuckets[item.slot] || []).length;
        }).map(function (item) {
            return {
                slot: item.slot,
                label: item.label,
                items: slotBuckets[item.slot] || []
            };
        });
    }

    function ownerCutoverBundlePayload() {
        var closure = planClosurePayload();
        var configPacket = formalConfigInputPacketPayload();
        var envTemplate = envTemplatePayload();
        var bundles = Object.keys(ownerCutoverSpecs).map(function (owner) {
            var checklist = ownerCutoverChecklist(owner);
            var timeline = ownerCutoverTimeline(checklist);
            var ownerEnvItems = (envTemplate.items || []).filter(function (item) {
                return ownerForEnvItem(item) === owner && !item.configured;
            });
            var counts = checklist.reduce(function (bucket, item) {
                bucket[item.status] = (bucket[item.status] || 0) + 1;
                return bucket;
            }, {});
            return {
                owner: owner,
                label: ownerCutoverSpecs[owner].label,
                focus: ownerCutoverSpecs[owner].focus,
                summary: {
                    pending_required_inputs: checklist.filter(function (item) { return item.phase === "config"; }).length,
                    pending_env_items: checklist.filter(function (item) { return item.phase === "env"; }).length,
                    execution_items: checklist.filter(function (item) { return item.phase === "execution" || item.phase === "verification"; }).length,
                    ready_for_external_execution: counts.ready_for_external_execution || 0,
                    pending_external_input: counts.pending_external_input || 0,
                    pending_human_review: counts.pending_human_review || 0,
                    operations_tasks: checklist.filter(function (item) { return item.phase === "closeout"; }).length
                },
                owner_patch_template: ownerCutoverPatchTemplate(owner, configPacket),
                env_snippet: ownerEnvSnippet(ownerEnvItems),
                checklist: checklist,
                timeline: timeline,
                plan_closure_status: closure.summary.closure_status
            };
        });
        return {
            format: "tfse_owner_cutover_bundle",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            template_policy: "保留 Exomac 前端模板結構，只補正式配置、資料、驗證與外部交接，不重做前端設計。",
            filters: {
                owner: "",
                summary_only: false,
                checklist_only: false,
                timeline_only: false
            },
            summary: {
                owners: bundles.length,
                owners_with_pending_inputs: bundles.filter(function (item) { return item.summary.pending_required_inputs > 0; }).length,
                owners_with_execution_items: bundles.filter(function (item) { return item.summary.execution_items > 0; }).length,
                owners_with_human_review: bundles.filter(function (item) { return item.summary.pending_human_review > 0; }).length
            },
            bundles: bundles,
            related_exports: [
                "tfse_formal_config_input_packet",
                "tfse_external_execution_packet",
                "tfse_launch_handoff_manifest",
                "tfse_plan_closure_report",
                "tfse_release_day_runsheet"
            ]
        };
    }

    function releaseDayRunsheetPayload() {
        var countdown = launchCountdownPlanPayload();
        var ownerBundle = ownerCutoverBundlePayload();
        var closure = planClosurePayload();
        var ownerMap = {};
        ownerBundle.bundles.forEach(function (bundle) {
            ownerMap[bundle.owner] = bundle;
        });
        var slots = countdown.slots.map(function (slotItem) {
            var ownerGroups = [];
            Object.keys(ownerMap).forEach(function (owner) {
                var slot = (ownerMap[owner].timeline || []).filter(function (timelineItem) {
                    return timelineItem.slot === slotItem.slot;
                })[0];
                if (!slot || !slot.items.length) return;
                ownerGroups.push({
                    owner: owner,
                    label: ownerMap[owner].label,
                    focus: ownerMap[owner].focus,
                    owner_patch_template: ownerMap[owner].owner_patch_template || {},
                    env_snippet: ownerMap[owner].env_snippet || "",
                    items: slot.items
                });
            });
            return {
                slot: slotItem.slot,
                title: slotItem.title,
                goal: slotItem.goal,
                manual_checks: slotItem.manual_checks || [],
                owner_groups: ownerGroups
            };
        });
        return {
            format: "tfse_release_day_runsheet",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            template_policy: "保留 Exomac 前端模板結構，只補正式配置、資料、驗證與交接執行，不重做前端設計。",
            filters: {
                owner: "",
                slot: ""
            },
            summary: {
                slots: slots.length,
                owners: ownerBundle.bundles.filter(function (bundle) { return bundle.timeline.length; }).length,
                plan_closure_status: closure.summary.closure_status,
                local_closed: closure.summary.local_closed,
                production_closed: closure.summary.production_closed
            },
            slots: slots,
            related_exports: [
                "tfse_owner_cutover_bundle",
                "tfse_launch_countdown_plan",
                "tfse_launch_handoff_manifest",
                "tfse_plan_closure_report"
            ]
        };
    }

    function formalConfigInputPacketPayload() {
        var analytics = (siteConfigData && siteConfigData.analytics) || {};
        var searchConsole = (siteConfigData && siteConfigData.search_console) || {};
        var backend = (siteConfigData && siteConfigData.backend) || {};
        var security = (siteConfigData && siteConfigData.security) || {};
        var turnstile = security.turnstile || {};
        var line = (siteConfigData && siteConfigData.line) || {};
        var records = getConfigInputRecords();
        var requiredInputs = [
            {
                key: "base_url",
                label: "正式網站 Base URL",
                owner_role: "data_manager",
                config_paths: ["base_url"],
                done: isHttpsUrl(siteConfigData.base_url),
                current_value: siteConfigData.base_url || "",
                suggested_value: "https://www.example.com"
            },
            {
                key: "ga4_measurement_id",
                label: "GA4 Measurement ID",
                owner_role: "data_manager",
                config_paths: ["analytics.ga4_measurement_id"],
                done: /^G-[A-Z0-9]{6,}$/.test(analytics.ga4_measurement_id || ""),
                current_value: analytics.ga4_measurement_id || "",
                suggested_value: "G-XXXXXXXXXX"
            },
            {
                key: "meta_pixel_id",
                label: "Meta Pixel ID",
                owner_role: "data_manager",
                config_paths: ["analytics.meta_pixel_id"],
                done: /^[0-9]{8,}$/.test(analytics.meta_pixel_id || ""),
                current_value: analytics.meta_pixel_id || "",
                suggested_value: "000000000000000"
            },
            {
                key: "server_event_endpoint",
                label: "Server Event Endpoint",
                owner_role: "backend_engineer",
                config_paths: ["analytics.server_event_endpoint"],
                done: isHttpsUrl(analytics.server_event_endpoint || ""),
                current_value: analytics.server_event_endpoint || "",
                suggested_value: "https://api.example.com/events"
            },
            {
                key: "line_oa_url",
                label: "正式 Line OA 加友網址",
                owner_role: "ops_marketing",
                config_paths: ["line.oa_url"],
                done: !!line.oa_url && line.oa_url !== "free-check.html#line-cta" && (isHttpsUrl(line.oa_url) || isRelativeUrl(line.oa_url)),
                current_value: line.oa_url || "",
                suggested_value: "https://lin.ee/xxxx"
            },
            {
                key: "google_site_verification",
                label: "Google Search Console 驗證碼",
                owner_role: "seo_owner",
                config_paths: ["search_console.google_site_verification"],
                done: !!searchConsole.google_site_verification,
                current_value: searchConsole.google_site_verification || "",
                suggested_value: "google-site-verification-token"
            },
            {
                key: "backend_mode_and_api_base_url",
                label: "正式 Backend API 模式與 Base URL",
                owner_role: "backend_engineer",
                config_paths: ["backend.mode", "backend.api_base_url"],
                done: backend.mode === "api" && isHttpsUrl(backend.api_base_url || ""),
                current_value: JSON.stringify({
                    mode: backend.mode || "localStorage",
                    api_base_url: backend.api_base_url || ""
                }),
                suggested_value: JSON.stringify({
                    mode: "api",
                    api_base_url: "https://api.example.com"
                })
            },
            {
                key: "sentry_dsn",
                label: "正式 Sentry DSN",
                owner_role: "ops_engineer",
                config_paths: ["analytics.sentry_dsn"],
                done: isHttpsUrl(analytics.sentry_dsn || ""),
                current_value: analytics.sentry_dsn || "",
                suggested_value: "https://public@sentry.example/1"
            }
        ];
        requiredInputs = requiredInputs.map(function (item) {
            var record = latestConfigInputRecord(item.key);
            item.latest_record = record;
            item.tracking_status = record ? record.result : "untracked";
            return item;
        });
        var conditionalInputs = [];
        if (turnstile.enabled) {
            conditionalInputs.push({
                key: "turnstile_site_key",
                label: "Cloudflare Turnstile 正式啟用",
                owner_role: "backend_engineer",
                config_paths: ["security.turnstile.enabled", "security.turnstile.site_key"],
                done: !!turnstile.site_key,
                current_value: JSON.stringify({
                    enabled: !!turnstile.enabled,
                    site_key: turnstile.site_key || ""
                }),
                suggested_value: JSON.stringify({
                    enabled: true,
                    site_key: "0x4AAAA..."
                })
            });
        }
        var secretOnlyInputs = [
            { key: "turnstile_secret_key", label: "Turnstile Secret Key", owner_role: "backend_engineer", store: "secret manager / CI", value_hint: "server secret only" },
            { key: "database_url", label: "正式 Database URL", owner_role: "backend_engineer", store: "secret manager / API server", value_hint: "postgres://..." },
            { key: "admin_session_secret", label: "Admin Session Secret", owner_role: "backend_engineer", store: "secret manager / API server", value_hint: "long random secret" },
            { key: "backup_bucket", label: "備份 Bucket / Storage Path", owner_role: "infra_owner", store: "backup job / infra", value_hint: "s3://bucket/path or provider bucket" }
        ];
        return {
            format: "tfse_formal_config_input_packet",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source: "site-config.json + TFSE金融独立站现成前端模板套用0-1完整项目计划.md",
            ready_count: requiredInputs.filter(function (item) { return item.done; }).length,
            pending_count: requiredInputs.filter(function (item) { return !item.done; }).length,
            conditional_pending_count: conditionalInputs.filter(function (item) { return !item.done; }).length,
            required_inputs: requiredInputs,
            conditional_inputs: conditionalInputs,
            secret_only_inputs: secretOnlyInputs,
            records: records,
            record_summary: {
                tracked_count: requiredInputs.filter(function (item) { return !!item.latest_record; }).length,
                validated_count: records.filter(function (item) { return item.result === "validated"; }).length,
                blocked_count: records.filter(function (item) { return item.result === "blocked"; }).length
            },
            owner_handoff: ["data_manager", "backend_engineer", "ops_marketing", "seo_owner", "ops_engineer", "infra_owner"].map(function (owner) {
                return {
                    owner_role: owner,
                    pending_items: requiredInputs.filter(function (item) {
                        return item.owner_role === owner && !item.done;
                    }).map(function (item) {
                        return item.label;
                    })
                };
            }).filter(function (item) {
                return item.pending_items.length;
            }),
            site_config_patch_template: {
                base_url: preferredHint(siteConfigData.base_url || "", isOfficialDomainUrl, "https://www.example.com"),
                analytics: {
                    ga4_measurement_id: preferredHint(analytics.ga4_measurement_id || "", function (value) { return /^G-[A-Z0-9]{6,}$/.test(String(value || "")); }, "G-XXXXXXXXXX"),
                    meta_pixel_id: preferredHint(analytics.meta_pixel_id || "", function (value) { return /^[0-9]{8,}$/.test(String(value || "")); }, "000000000000000"),
                    server_event_endpoint: preferredHint(analytics.server_event_endpoint || "", isHttpsUrl, "https://api.example.com/events"),
                    sentry_dsn: preferredHint(analytics.sentry_dsn || "", isHttpsUrl, "https://public@sentry.example/1")
                },
                security: {
                    turnstile: {
                        enabled: !!turnstile.enabled,
                        site_key: preferredHint(turnstile.site_key || "", function (value) { return !!value; }, "0x4AAAA...")
                    }
                },
                search_console: {
                    google_site_verification: preferredHint(searchConsole.google_site_verification || "", function (value) { return !!value; }, "google-site-verification-token")
                },
                backend: {
                    mode: preferredHint(backend.mode || "", function (value) { return value === "api"; }, "api"),
                    api_base_url: preferredHint(backend.api_base_url || "", isHttpsUrl, "https://api.example.com")
                },
                line: {
                    oa_url: preferredHint(line.oa_url || "", function (value) { return !!value && value !== "free-check.html#line-cta" && (isHttpsUrl(value) || isRelativeUrl(value)); }, "https://lin.ee/xxxx")
                }
            },
            follow_up_commands: [
                "python3 tools/formal_config_input_packet.py --markdown",
                "python3 tools/validate_site_config.py",
                "python3 tools/production_config_audit.py",
                "python3 tools/verify_static_site.py"
            ],
            related_exports: ["tfse_production_config_readiness", "tfse_site_config_update_package", "tfse_site_config_approval_package", "tfse_launch_handoff_manifest"]
        };
    }

    function projectPlanCoveragePayload() {
        var configPacket = formalConfigInputPacketPayload();
        var legalExternal = legalExternalReviewPayload();
        var ga4Pending = !(externalVerificationState("ga4") || {}).verified;
        var searchConsolePending = !(externalVerificationState("search_console") || {}).verified;
        var backendPending = !(externalVerificationState("backend_api") || {}).configured;
        var linePending = !(externalVerificationState("line_oa") || {}).configured;
        var legalPending = legalExternal.status !== "external_review_passed";
        var sentryPending = !(externalVerificationState("sentry") || {}).configured;
        var backupPending = !(externalVerificationState("backup") || {}).verified;

        function chapter(chapterKey, title, readySummary, pendingBlockers) {
            var pending = pendingBlockers.filter(Boolean);
            return {
                chapter: chapterKey,
                title: title,
                status: pending.length ? "local_ready_external_pending" : "ready",
                summary: pending.length ? "本地交付已完成，剩餘事項集中在正式配置、正式接入或外部簽核。" : readySummary,
                blockers: pending
            };
        }

        var chapters = [
            chapter("chapter_1", "项目定位", "品牌定位、資訊服務邊界與免責聲明已套入模板頁面。", []),
            chapter("chapter_2", "现成前端模板套用路线", "模板映射、內容替換與交付邊界已固定，不重做前端設計。", []),
            chapter("chapter_3", "品牌体系", "品牌名、Slogan、禁用詞與免責聲明規則已落地。", []),
            chapter("chapter_4", "模板视觉套用规范", "已維持原模板結構，只替換內容、資料與功能掛載。", []),
            chapter("chapter_5", "技术选型", "靜態 MVP 與正式後端遷移路線均已建立。", []),
            chapter("chapter_6", "模板目录接入方式", "業務腳本、資料種子與審計工具均為增量接入。", []),
            chapter("chapter_7", "页面架构", "首頁、資料庫、文章、免費財務健檢查詢、政策、聯絡與 Admin 皆已落地。", []),
            chapter("chapter_8", "组件清单", "查詢、表單、內容、合規與後台組件已掛入既有模板容器。", []),
            chapter("chapter_9", "数据模型", "正式資料模型、schema 與種子資料已齊備。", []),
            chapter("chapter_10", "API 设计", "API 合約、前端適配層與正式切換驗收包已建立。", []),
            chapter("chapter_11", "后台 CRM", "Admin CRM、審計、跟進與內容維護已本地閉環。", []),
            chapter("chapter_12", "SEO 系统", "SEO 資產、內容矩陣、提交包與驗收流程已建立。", []),
            chapter("chapter_13", "广告落地页系统", "8 個落地頁、UTM、事件與投流檢查包已落地。", [
                ga4Pending ? "正式 GA4 收件仍待驗證。" : "",
                linePending ? "正式 Line OA URL 仍待填入。" : ""
            ]),
            chapter("chapter_14", "Line 私域闭环", "Line tags、welcome flow、handoff、opt-out 與 complaint 包已建立。", [
                linePending ? "正式 Line OA URL 尚未接入。" : ""
            ]),
            chapter("chapter_15", "合规机制", "禁用詞掃描、來源複核、公開回報、個資請求與送審包已具備。", [
                legalPending ? "台灣當地法務 / 合規正式複核仍待完成。" : ""
            ]),
            chapter("chapter_16", "开发任务拆解", "Phase 0-8 與切換任務均已拆解到審計與交接腳本。", [
                backendPending ? "正式 backend.api_base_url 待切換。" : "",
                searchConsolePending ? "Search Console 驗證與 sitemap 提交待完成。" : "",
                ga4Pending ? "GA4 正式收件驗證待完成。" : "",
                linePending ? "正式 Line OA 加友 URL 待接入。" : ""
            ]),
            chapter("chapter_17", "验收清单", "驗收清單、瀏覽器留痕與外部驗證表單已落地到後台。", [
                ga4Pending ? "GA4 事件可收到。" : "",
                searchConsolePending ? "Search Console 已準備提交。" : "",
                backendPending ? "正式後端 API 接入。" : "",
                linePending ? "正式 Line OA 可導向。" : "",
                backupPending ? "備份策略已啟用。" : ""
            ]),
            chapter("chapter_18", "第一版 MVP 范围", "MVP 範圍已完成，且超出最低交付。", []),
            chapter("chapter_19", "现成前端模板接入顺序", "仍維持先複用模板、再補業務與驗收的路徑。", []),
            chapter("chapter_20", "风险清单", "風險掃描、回滾、備份、隱私與法務邊界均已有對應包。", []),
            chapter("chapter_21", "上线前最终检查", "acceptance、cutover、countdown、execution 與 config packet 均已建立。", [
                configPacket.pending_count ? "正式 base_url / Search Console / GA4 / Line OA / backend.api_base_url / Sentry 仍待配置或驗證。" : "",
                sentryPending ? "正式 Sentry 驗證仍待完成。" : "",
                backupPending ? "正式資料庫每日備份與 restore drill 仍待完成。" : ""
            ]),
            chapter("chapter_22", "官方来源和上线前法务备注", "來源政策、公開回報與法務提醒已落地。", [
                legalPending ? "法務 / 合規外部複核尚未完成。" : ""
            ]),
            chapter("chapter_23", "最终判断", "目前已達成保留原模板、套入 TFSE 業務閉環的本地完整狀態。", [
                configPacket.pending_count ? "正式配置待填 " + configPacket.pending_count + " 項。" : "",
                backendPending ? "正式後端 API 與資料落庫仍待切換。" : "",
                legalPending ? "台灣當地法務 / 合規簽核仍待完成。" : ""
            ])
        ];
        return {
            format: "tfse_project_plan_coverage_report",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source: "TFSE project plan chapters 1-23",
            ready_count: chapters.filter(function (item) { return item.status === "ready"; }).length,
            local_ready_external_pending_count: chapters.filter(function (item) { return item.status === "local_ready_external_pending"; }).length,
            chapters: chapters,
            related_exports: ["tfse_acceptance_checklist", "tfse_plan_requirement_trace", "tfse_external_verification_evidence", "tfse_formal_config_input_packet", "tfse_launch_handoff_manifest"]
        };
    }

    function projectPhaseAuditPayload() {
        var acceptanceItems = acceptanceChecklistItems();
        var legalExternal = legalExternalReviewPayload();
        var ga4Pending = !(externalVerificationState("ga4") || {}).verified;
        var searchConsolePending = !(externalVerificationState("search_console") || {}).verified;
        var backendPending = !(externalVerificationState("backend_api") || {}).configured;
        var linePending = !(externalVerificationState("line_oa") || {}).configured;
        var legalPending = legalExternal.status !== "external_review_passed";
        var backupPending = !(externalVerificationState("backup") || {}).verified;
        var externalPending = [];

        function evidenceFor(key, fallback) {
            var item = acceptanceItems.find(function (entry) {
                return entry.key === key;
            });
            return item ? item.evidence : (fallback || "");
        }

        function phase(status, phaseId, title, summary, evidence, blockers) {
            return {
                phase: phaseId,
                title: title,
                status: status,
                summary: summary,
                evidence: evidence.filter(Boolean),
                blockers: blockers.filter(Boolean)
            };
        }

        if (ga4Pending) externalPending.push("GA4 事件可收到");
        if (searchConsolePending) externalPending.push("Search Console 已準備提交");
        if (backendPending) externalPending.push("正式後端 API 接入");
        if (linePending) externalPending.push("正式 Line OA 可導向");
        if (backupPending) externalPending.push("備份策略已啟用");

        var phases = [
            phase(
                "ready",
                "phase_0",
                "模板盤點與映射",
                "模板映射文檔、靜態驗收與頁面角色替換邊界已建立。",
                [
                    "TFSE_TEMPLATE_MAPPING.md 已存在",
                    evidenceFor("template_preserved"),
                    "tools/verify_static_site.py 已納入模板殘留詞掃描"
                ],
                []
            ),
            phase(
                "ready",
                "phase_1",
                "品牌內容套入",
                "TFSE 品牌、導航、免責聲明和合規按鈕文案已套入原模板。",
                [
                    evidenceFor("logo"),
                    evidenceFor("button_copy"),
                    evidenceFor("disclaimer")
                ],
                []
            ),
            phase(
                "ready",
                "phase_2",
                "首頁與合規頁替換",
                "首頁、關於頁、聯絡頁和合規政策頁已接入，且本地可訪問。",
                [
                    evidenceFor("home_to_database", "首頁與需求查詢面板可導向資料庫。"),
                    "privacy.html、terms.html、source-policy.html 均存在",
                    evidenceFor("metadata_sitemap", "HTML 頁面均有 title 與 description")
                ],
                []
            ),
            phase(
                "ready",
                "phase_3",
                "資料庫前台套入",
                "資料庫、分類和詳情頁已由原模板承載，並包含 " + productData.length + " 條示例資料。",
                [
                    evidenceFor("category_to_detail"),
                    evidenceFor("product_sources"),
                    "products.json 共 " + productData.length + " 筆均有 updated_at"
                ],
                []
            ),
            phase(
                "ready",
                "phase_4",
                "免費財務健檢查詢表單套入",
                "免費財務健檢查詢表單、UTM、低敏字段、Line CTA 和瀏覽器提交流程已完成本地閉環。",
                [
                    evidenceFor("utm_recorded"),
                    evidenceFor("no_sensitive_docs"),
                    evidenceFor("lead_submit_browser")
                ],
                []
            ),
            phase(
                "ready",
                "phase_5",
                "後台 CRM",
                "Admin 登入保護、潛客處理、資料維護、文章發布和合規審計已完成本地 MVP 閉環。",
                [
                    evidenceFor("admin_login"),
                    evidenceFor("lead_status_update"),
                    evidenceFor("product_maintenance"),
                    evidenceFor("article_publish"),
                    evidenceFor("compliance_review"),
                    evidenceFor("admin_login_browser")
                ],
                []
            ),
            phase(
                "ready",
                "phase_6",
                "SEO 內容中心套入",
                "文章中心與文章詳情已接入，當前有 " + articleData.length + " 篇內容種子，SEO 基礎資產已通過審計。",
                [
                    "articles.json 共 " + articleData.length + " 篇均有 updated_at",
                    "sitemap.xml 存在且 robots.txt 指向 sitemap",
                    "robots.txt 存在",
                    evidenceFor("metadata_sitemap"),
                    "本地 HTML 連結均可解析到檔案"
                ],
                []
            ),
            phase(
                (!ga4Pending && !linePending) ? "ready" : "local_ready_external_pending",
                "phase_7",
                "廣告落地頁與追蹤",
                "廣告落地頁矩陣、UTM 歸因和投流檢查包已完成本地套用，當前有 " + landingPageData.length + " 個落地頁別名。",
                [
                    evidenceFor("utm_recorded"),
                    "lp/*.html 已建立並通過靜態驗收",
                    "Admin 已提供廣告投流檢查與 UTM 報表匯出"
                ],
                [
                    ga4Pending ? "正式 GA4 Measurement ID 待填並驗證收件" : "",
                    linePending ? "正式 Line OA URL 待填並完成真實加友承接" : ""
                ]
            ),
            phase(
                externalPending.length ? "local_ready_external_pending" : "ready",
                "phase_8",
                "上線和運維",
                "錯誤頁、安全標頭、部署文件、驗收腳本與運維交接已齊備；正式上線仍依賴外部配置落地。",
                [
                    "404.html 已建立並可導回資料庫/免費財務健檢查詢",
                    evidenceFor("external_monitoring", "本機錯誤摘要與 Sentry DSN 接入點已建立"),
                    evidenceFor("backup"),
                    "DEPLOYMENT.md / OPERATIONS_RUNBOOK.md / LAUNCH_CHECKLIST.md 已存在"
                ],
                [
                    backendPending ? "正式 backend.api_base_url 待切換" : "",
                    searchConsolePending ? "Search Console 驗證與 sitemap 提交待完成" : "",
                    ga4Pending ? "GA4 正式收件驗證待完成" : "",
                    linePending ? "正式 Line OA 加友 URL 待接入" : "",
                    backupPending ? "正式資料庫每日備份與 restore drill 待完成" : ""
                ]
            )
        ];

        var counts = {};
        phases.forEach(function (item) {
            counts[item.status] = (counts[item.status] || 0) + 1;
        });

        return {
            format: "tfse_project_phase_audit",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source: "TFSE project plan phases 0-8",
            generated_from: "acceptanceChecklistItems + local datasets + launch health exports",
            counts: counts,
            external_pending: externalPending,
            phases: phases
        };
    }

    function planRequirementTracePayload() {
        var acceptance = acceptanceChecklistItems();
        var acceptanceMap = {};
        var ga4Pending = !(externalVerificationState("ga4") || {}).verified;
        var searchConsolePending = !(externalVerificationState("search_console") || {}).verified;
        var backendPending = !(externalVerificationState("backend_api") || {}).configured;
        var linePending = !(externalVerificationState("line_oa") || {}).configured;
        var backupPending = !(externalVerificationState("backup") || {}).verified;
        var productCount = productData.length;
        var articleCount = articleData.length;
        acceptance.forEach(function (item) {
            acceptanceMap[item.key] = item;
        });

        function fromAcceptance(section, requirement, key) {
            var record = acceptanceMap[key];
            return {
                section: section,
                requirement: requirement,
                status: record ? record.status : "missing",
                evidence: record ? record.evidence : ("未找到 acceptance key: " + key),
                source_key: key
            };
        }

        function custom(section, requirement, status, evidence, sourceKey) {
            return {
                section: section,
                requirement: requirement,
                status: status,
                evidence: evidence,
                source_key: sourceKey || ""
            };
        }

        var items = [
            fromAcceptance("17.1 业务闭环", "用户能从首页进入资料库。", "home_to_database"),
            fromAcceptance("17.1 业务闭环", "用户能从分类页进入资料详情。", "category_to_detail"),
            fromAcceptance("17.1 业务闭环", "用户能从文章页进入免费财务健检查询。", "article_to_free_check"),
            fromAcceptance("17.1 业务闭环", "表单提交后后台可见。", "lead_visible_in_admin"),
            fromAcceptance("17.1 业务闭环", "表单记录 UTM。", "utm_recorded"),
            fromAcceptance("17.1 业务闭环", "提交成功后可导向 Line。", "line_cta"),
            fromAcceptance("17.1 业务闭环", "后台可更新潜客状态。", "lead_status_update"),
            fromAcceptance("17.1 业务闭环", "管理员可维护资料库。", "product_maintenance"),
            fromAcceptance("17.1 业务闭环", "管理员可发布文章。", "article_publish"),
            fromAcceptance("17.1 业务闭环", "合规审核可记录。", "compliance_review"),
            fromAcceptance("17.2 UI 验收", "Logo 清晰。", "logo"),
            custom("17.2 UI 验收", "颜色符合蓝绿金融和米白底。", "ready", "assets/css/style.css 已固定主色 #1292ee、深色 #030f27；核心页面同步 theme-color。", "custom_color_tokens"),
            fromAcceptance("17.2 UI 验收", "页面没有贷款广告风。", "template_preserved"),
            fromAcceptance("17.2 UI 验收", "按钮文案合规。", "button_copy"),
            fromAcceptance("17.2 UI 验收", "手机端导航清楚。", "mobile_browser"),
            fromAcceptance("17.2 UI 验收", "表单错误提示清楚。", "form_feedback"),
            fromAcceptance("17.2 UI 验收", "空数据状态清楚。", "empty_state"),
            fromAcceptance("17.2 UI 验收", "页面不出现文字重叠。", "no_text_overlap_browser"),
            fromAcceptance("17.3 合规验收", "全站无禁用词。", "forbidden_terms"),
            fromAcceptance("17.3 合规验收", "每页有免责声明。", "disclaimer"),
            fromAcceptance("17.3 合规验收", "表单有隐私同意。", "privacy_line_consent"),
            fromAcceptance("17.3 合规验收", "Line 同意独立勾选。", "privacy_line_consent"),
            fromAcceptance("17.3 合规验收", "不收证件。", "no_sensitive_docs"),
            custom("17.3 合规验收", "不承诺核贷。", "ready", "首頁、資料庫、文章、落地頁 CTA 均維持中性資訊導向；合規掃描持續檢查保證核貸/代辦等越界文案。", "custom_no_loan_guarantee"),
            fromAcceptance("17.3 合规验收", "产品资料有来源。", "product_sources"),
            custom("17.3 合规验收", "产品资料有更新时间。", "ready", "products.json " + productCount + " 筆均保留 updated_at。", "custom_product_updated_at"),
            custom("17.3 合规验收", "广告页无夸大承诺。", "ready", "落地頁沿用原模板框架，已替換為 TFSE 中性資訊與免費財務健檢查詢導向。", "custom_ad_lp_compliance"),
            custom("17.4 技术验收", "`npm run build` 通过。", "not_applicable", "目前以靜態 HTML 模板與增量腳本交付，未依賴 npm build 作為唯一發版路徑。", "custom_npm_build"),
            custom("17.4 技术验收", "`npm run lint` 通过。", "not_applicable", "目前以 Python / 靜態審計工具為主，不以 npm lint 作為唯一交付門檻。", "custom_npm_lint"),
            custom("17.4 技术验收", "关键页面 200。", "ready", "verify_static_site.py 與 browser_acceptance_verify.mjs 已覆蓋首頁、資料庫、文章、免費財務健檢查詢、聯絡與 Admin。", "custom_key_pages"),
            custom("17.4 技术验收", "404 正常。", "ready", "404.html 與 500.html 已建立，並在驗收腳本中納管。", "custom_not_found"),
            custom("17.4 技术验收", "表单 API 有限流。", backendPending ? "external_pending" : "ready", backendPending ? "正式 leads API 限流 / 去重 / Turnstile server-side 驗證仍待正式後端接入。" : "正式後端 leads API 已具備限流與去重條件。", "custom_rate_limit"),
            fromAcceptance("17.4 技术验收", "后台需要登录。", "admin_login"),
            fromAcceptance("17.4 技术验收", "导出有权限。", "export_permissions"),
            fromAcceptance("17.4 技术验收", "错误上报可用。", "external_monitoring"),
            fromAcceptance("17.4 技术验收", "数据库备份可用。", "backup"),
            custom("17.5 SEO 验收", "sitemap。", "ready", "sitemap.xml 已生成並納入審計。", "custom_sitemap"),
            custom("17.5 SEO 验收", "robots。", "ready", "robots.txt 已存在並指向 sitemap。", "custom_robots"),
            custom("17.5 SEO 验收", "canonical。", "ready", "核心頁已接入 canonical。", "custom_canonical"),
            custom("17.5 SEO 验收", "Open Graph。", "ready", "核心頁已接入 Open Graph 與分享圖。", "custom_open_graph"),
            custom("17.5 SEO 验收", "图片 alt。", "ready", "可用性審計已納入圖片 alt 基線。", "custom_image_alt"),
            custom("17.5 SEO 验收", "内链。", "ready", "首頁、分類、文章、產品與免費財務健檢查詢之間已建立站內導流。", "custom_internal_links"),
            custom("17.5 SEO 验收", "首页 metadata。", "ready", "首頁 metadata 已納入靜態驗收。", "custom_home_metadata"),
            custom("17.5 SEO 验收", "分类页 metadata。", "ready", "category + 8 個金融分類頁 metadata 已納入靜態驗收。", "custom_category_metadata"),
            custom("17.5 SEO 验收", "文章页 metadata。", "ready", "articles.html 與 " + articleCount + " 篇 articles/ 文章詳情 metadata 已納入靜態驗收。", "custom_article_metadata"),
            custom("17.5 SEO 验收", "产品页 metadata。", "ready", productCount + " 個產品詳情頁 metadata 已納入靜態驗收。", "custom_product_metadata"),
            custom("21. 上线前最终检查", "所有页面都有标题和描述。", "ready", "全站 metadata 基線已由 verify_static_site.py 檢查。", "custom_metadata_all"),
            fromAcceptance("21. 上线前最终检查", "所有页面都有免责声明或页脚免责声明。", "disclaimer"),
            fromAcceptance("21. 上线前最终检查", "免费财务健检查询表单不收证件。", "no_sensitive_docs"),
            custom("21. 上线前最终检查", "所有 CTA 没有“代办、包过、保证核贷”。", "ready", "CTA 已統一為免費財務健檢查詢、查看資訊、聯絡 TFSE 等中性描述。", "custom_cta_compliance"),
            fromAcceptance("21. 上线前最终检查", "所有产品资料有来源链接。", "product_sources"),
            custom("21. 上线前最终检查", "所有文章有更新日期。", "ready", articleCount + " 篇文章種子均帶 updated_at。", "custom_article_updated_at"),
            fromAcceptance("21. 上线前最终检查", "表单提交测试通过。", "lead_submit_browser"),
            fromAcceptance("21. 上线前最终检查", "后台登录测试通过。", "admin_login_browser"),
            fromAcceptance("21. 上线前最终检查", "手机端测试通过。", "mobile_browser"),
            custom("21. 上线前最终检查", "sitemap 可访问。", "ready", "sitemap.xml 可由靜態部署直接提供。", "custom_sitemap_access"),
            custom("21. 上线前最终检查", "robots 可访问。", "ready", "robots.txt 可由靜態部署直接提供。", "custom_robots_access"),
            custom("21. 上线前最终检查", "GA4 事件可收到。", ga4Pending ? "external_pending" : "ready", ga4Pending ? "正式 GA4 仍待接入與收件驗證。" : "GA4 正式收件已留痕。", "ga4_received"),
            custom("21. 上线前最终检查", "Search Console 已准备提交。", searchConsolePending ? "external_pending" : "ready", searchConsolePending ? "Search Console 驗證 / sitemap 提交仍待外部操作。" : "Search Console 驗證與提交已留痕。", "search_console_submit"),
            custom("21. 上线前最终检查", "备份策略已启用。", backupPending ? "external_pending" : "ready", backupPending ? "正式資料庫每日備份與 restore drill 仍待完成。" : "正式備份策略與 restore drill 已留痕。", "backup_strategy_enabled"),
            custom("21. 上线前最终检查", "隐私权政策可访问。", "ready", "privacy.html 可訪問。", "privacy.html"),
            custom("21. 上线前最终检查", "使用条款可访问。", "ready", "terms.html 可訪問。", "terms.html"),
            custom("21. 上线前最终检查", "资料来源政策可访问。", "ready", "source-policy.html 可訪問。", "source-policy.html")
        ];

        var counts = {};
        items.forEach(function (item) {
            counts[item.status] = (counts[item.status] || 0) + 1;
        });

        return {
            format: "tfse_plan_requirement_trace",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            plan_path: "TFSE金融独立站现成前端模板套用0-1完整项目计划.md",
            source: "TFSE project plan sections 17 and 21",
            counts: counts,
            items: items,
            related_exports: [
                "tfse_acceptance_checklist",
                "tfse_project_phase_audit",
                "tfse_project_plan_coverage_report",
                "tfse_plan_closure_report"
            ]
        };
    }

    function planClosurePayload() {
        var acceptance = acceptanceChecklistPayload();
        var phaseAudit = projectPhaseAuditPayload();
        var coverage = projectPlanCoveragePayload();
        var cutover = launchCutoverAuditPayload();
        var localBlockingStatuses = ["missing", "manual_browser", "manual_command", "pending"];
        var externalBlockingStatuses = ["external_pending", "manual_external"];
        var localBlockers = acceptance.items.filter(function (item) {
            return localBlockingStatuses.indexOf(item.status) !== -1;
        });
        var externalBlockers = acceptance.items.filter(function (item) {
            return externalBlockingStatuses.indexOf(item.status) !== -1;
        });
        var notApplicable = acceptance.items.filter(function (item) {
            return item.status === "not_applicable";
        });
        var externalActions = cutover.items.filter(function (item) {
            return ["pending_external_input", "ready_for_external_execution", "pending_human_review"].indexOf(item.status) !== -1;
        }).map(function (item) {
            return {
                key: item.key,
                label: item.label,
                status: item.status,
                owner: item.owner,
                blockers: item.blockers || []
            };
        });
        var localClosed = !localBlockers.length;
        var productionClosed = localClosed && !externalBlockers.length && !externalActions.length;
        var closureStatus = productionClosed
            ? "production_closed"
            : localClosed
                ? "local_closed_external_blocked"
                : "local_gap_remaining";
        var conclusions = [];
        if (localClosed) {
            conclusions.push("本地模板套用、內容替換、資料層、表單、CRM、SEO、審計與交接包已完成閉環。");
        } else {
            conclusions.push("仍存在可在本地繼續補齊的缺口，尚未達到本地閉環。");
        }
        if (externalBlockers.length || externalActions.length) {
            conclusions.push("正式上線閉環仍受正式配置、正式後端、外部平台驗證或法務簽核阻擋。");
        }
        if (notApplicable.length) {
            conclusions.push("部分原始計畫驗收項對靜態 HTML 模板不適用，已單獨標記避免誤判未完成。");
        }
        return {
            format: "tfse_plan_closure_report",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source: "TFSE project plan sections 17 + 21, phases 0-8, chapters 1-23",
            template_policy: "保留 Exomac 前端模板結構，只替換 TFSE 文案、資料、配置與功能接入，不重做前端設計。",
            summary: {
                closure_status: closureStatus,
                local_closed: localClosed,
                production_closed: productionClosed,
                acceptance_ready: acceptance.ready_count,
                acceptance_local_blockers: localBlockers.length,
                acceptance_external_blockers: externalBlockers.length,
                acceptance_not_applicable: notApplicable.length,
                phase_ready: phaseAudit.counts.ready || 0,
                phase_local_ready_external_pending: phaseAudit.counts.local_ready_external_pending || 0,
                plan_chapters_ready: coverage.ready_count,
                plan_chapters_local_ready_external_pending: coverage.local_ready_external_pending_count,
                cutover_pending_external_input: cutover.counts.pending_external_input || 0,
                cutover_ready_for_external_execution: cutover.counts.ready_for_external_execution || 0,
                cutover_pending_human_review: cutover.counts.pending_human_review || 0
            },
            conclusions: conclusions,
            local_blockers: localBlockers,
            external_blockers: externalBlockers,
            not_applicable: notApplicable,
            external_actions: externalActions,
            related_exports: [
                "tfse_acceptance_checklist",
                "tfse_plan_requirement_trace",
                "tfse_project_phase_audit",
                "tfse_project_plan_coverage_report",
                "tfse_launch_cutover_audit",
                "tfse_launch_handoff_manifest"
            ]
        };
    }

    function externalExecutionPacketPayload() {
        var configPacket = formalConfigInputPacketPayload();
        var linePendingConfig = !configPacket.required_inputs.filter(function (item) { return item.key === "line_oa_url"; })[0].done;
        var backendPendingConfig = !configPacket.required_inputs.filter(function (item) { return item.key === "backend_mode_and_api_base_url"; })[0].done;
        var items = [
            {
                key: "line_oa_setup",
                title: "正式 Line OA 圖文選單 / 分群 / 自動回覆建立",
                owner_role: "ops_marketing",
                status: "ready_for_external_execution",
                dependency_keys: ["line_oa_url"],
                dependency_status: linePendingConfig ? "pending_config_input" : "config_ready",
                next_action: "建立正式加友 URL、welcome flow、quick reply、tag 與 menu。",
                evidence_fields: ["official_url", "menu_version", "reply_flow_version", "checked_at", "reviewer_role", "evidence_note"]
            },
            {
                key: "line_oa_handoff",
                title: "正式 Line OA 導向 / quick reply / 退訂留痕",
                owner_role: "ops_marketing",
                status: "ready_for_external_execution",
                dependency_keys: ["line_oa_url"],
                dependency_status: linePendingConfig ? "pending_config_input" : "config_ready",
                next_action: "匯出 handoff check，核對 CTA、quick reply、退訂關鍵字與手機導向。",
                evidence_fields: ["checked_route", "device", "result", "checked_at", "reviewer_role", "evidence_note"]
            },
            {
                key: "admin_auth_server_cutover",
                title: "伺服器端 Admin Auth / RBAC / 審計日誌接入",
                owner_role: "backend_engineer",
                status: "ready_for_external_execution",
                dependency_keys: ["backend_mode_and_api_base_url", "admin_session_secret"],
                dependency_status: backendPendingConfig ? "pending_config_input" : "config_ready",
                next_action: "以正式 session、CSRF、RBAC 取代本機 MVP 驗證碼。",
                evidence_fields: ["checked_endpoint", "cookie_flags", "csrf_result", "rbac_result", "audit_log_id", "checked_at"]
            },
            {
                key: "database_backup_strategy",
                title: "正式資料庫每日備份 / 每週還原演練",
                owner_role: "infra_owner",
                status: "ready_for_external_execution",
                dependency_keys: ["database_url", "backup_bucket"],
                dependency_status: "pending_secret_setup",
                next_action: "建立每日備份 job、checksum、隔離還原演練與留痕。",
                evidence_fields: ["backup_job_id", "restore_run_id", "checksum", "rpo", "rto", "checked_at"]
            },
            {
                key: "institution_import",
                title: "機構資料正式匯入與來源版本紀錄",
                owner_role: "data_manager",
                status: "ready_for_external_execution",
                dependency_keys: ["backend_mode_and_api_base_url"],
                dependency_status: backendPendingConfig ? "pending_config_input" : "config_ready",
                next_action: "依 source review 與 import validation 包完成正式資料匯入。",
                evidence_fields: ["import_batch_id", "imported_rows", "source_version", "checked_at", "reviewer_role"]
            },
            {
                key: "formal_backend_migration",
                title: "本機內容 / 線索 / 審計遷移到正式後端",
                owner_role: "backend_engineer",
                status: "ready_for_external_execution",
                dependency_keys: ["backend_mode_and_api_base_url", "database_url"],
                dependency_status: backendPendingConfig ? "pending_config_input" : "config_ready",
                next_action: "匯出 migration package，導入 staging / production 並保留差異留痕。",
                evidence_fields: ["migration_batch_id", "lead_rows", "article_rows", "audit_rows", "checked_at"]
            },
            {
                key: "host_fallback_deployment",
                title: "正式主機 404 / 500 / server error fallback 配置",
                owner_role: "infra_owner",
                status: "ready_for_external_execution",
                dependency_keys: ["base_url"],
                dependency_status: configPacket.required_inputs.filter(function (item) { return item.key === "base_url"; })[0].done ? "config_ready" : "pending_config_input",
                next_action: "完成正式主機 fallback、_headers 與錯誤頁抽查。",
                evidence_fields: ["checked_url", "status_code", "fallback_result", "checked_at", "reviewer_role"]
            },
            {
                key: "legal_review_external",
                title: "台灣當地法務 / 合規人員正式複核",
                owner_role: "legal_reviewer",
                status: "pending_human_review",
                dependency_keys: ["legal_review"],
                dependency_status: "requires_human_signoff",
                next_action: "複核投流、Line OA、表單、免責聲明與來源政策後保存去識別簽核摘要。",
                evidence_fields: ["reviewer_name", "reviewed_at", "result", "scope", "evidence_note"]
            }
        ];
        items = items.map(function (item) {
            var record = latestExternalExecutionRecord(item.key);
            item.latest_record = record;
            item.execution_status = record ? record.result : "untracked";
            return item;
        });
        var records = getExternalExecutionRecords();
        return {
            format: "tfse_external_execution_packet",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            actionable_items: items.length,
            ready_for_external_execution_count: items.filter(function (item) { return item.status === "ready_for_external_execution"; }).length,
            pending_human_review_count: items.filter(function (item) { return item.status === "pending_human_review"; }).length,
            items: items,
            records: records,
            record_summary: {
                tracked_count: items.filter(function (item) { return !!item.latest_record; }).length,
                completed_count: records.filter(function (item) { return item.result === "completed"; }).length,
                blocked_count: records.filter(function (item) { return item.result === "blocked"; }).length
            },
            follow_up_commands: [
                "python3 tools/external_execution_packet.py --markdown",
                "python3 tools/launch_cutover_audit.py",
                "python3 tools/backend_cutover_roadmap.py --markdown",
                "python3 tools/project_phase_audit.py",
                "python3 tools/project_plan_coverage_audit.py --markdown",
                "python3 tools/launch_handoff_manifest.py --markdown"
            ],
            related_exports: ["tfse_formal_config_input_packet", "tfse_project_phase_audit", "tfse_domain_cutover_package", "tfse_backend_cutover_roadmap", "tfse_backend_acceptance_matrix", "tfse_launch_handoff_manifest"]
        };
    }

    function launchHandoffManifestPayload() {
        var configPacket = formalConfigInputPacketPayload();
        var externalExecution = externalExecutionPacketPayload();
        var backendRoadmap = backendRoadmapPayload();
        var planCoverage = projectPlanCoveragePayload();
        var acceptance = acceptanceChecklistPayload();
        var external = externalVerificationPayload();
        var legalExternal = legalExternalReviewPayload();
        var checkpointRecords = getLaunchHandoffRecords();
        var ownerHandoff = [];
        var releaseStatus = (configPacket.pending_count
            || externalExecution.ready_for_external_execution_count
            || externalExecution.pending_human_review_count
            || planCoverage.local_ready_external_pending_count
            || acceptance.pending_count
            || legalExternal.status !== "ready_for_launch_review")
            ? "hold_for_external_or_manual_items"
            : "ready_for_static_release";

        configPacket.owner_handoff.forEach(function (item) {
            ownerHandoff.push({
                owner_role: item.owner_role,
                source: "config_required_inputs",
                items: item.pending_items
            });
        });
        externalExecution.items.forEach(function (item) {
            var existing = ownerHandoff.filter(function (entry) {
                return entry.owner_role === item.owner_role && entry.source === "external_execution";
            })[0];
            if (!existing) {
                existing = {
                    owner_role: item.owner_role,
                    source: "external_execution",
                    items: []
                };
                ownerHandoff.push(existing);
            }
            existing.items.push(item.title);
        });

        return {
            format: "tfse_launch_handoff_manifest",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            template_policy: "保留 Exomac 前端模板結構，只替換 TFSE 文案、資料、配置與功能接入，不重做前端設計。",
            summary: {
                config_inputs_pending: configPacket.pending_count,
                cutover_ready_for_execution: externalExecution.ready_for_external_execution_count,
                human_review_pending: externalExecution.pending_human_review_count,
                plan_chapters_ready: planCoverage.ready_count,
                plan_chapters_local_ready_external_pending: planCoverage.local_ready_external_pending_count,
                acceptance_pending: acceptance.pending_count,
                external_verified_items: external.summary.verified_items,
                legal_review_status: legalExternal.status,
                release_status: releaseStatus,
                checkpoint_records: checkpointRecords.length,
                plan_closure_status: handoffPlanClosureStatus(),
                plan_local_blockers: handoffPlanLocalBlockers(),
                backend_roadmap_ready_steps: backendRoadmap.summary.ready_steps,
                backend_roadmap_total_steps: backendRoadmap.summary.total_steps
            },
            recommended_sequence: [
                "先補齊正式網址、追蹤、Search Console、backend API、Line OA 與 Sentry 等待填配置。",
                "配置到位後，先依 tfse_backend_cutover_roadmap 對齊 leads API、Admin Auth、CRM、事件、內容 API 與備份還原順序。",
                "再完成 Line OA、Admin Auth、正式備份、機構匯入、正式遷移與主機 fallback。",
                "同步保存 Search Console、GA4/Meta、Sentry、Turnstile、內容 API 與 CRM API 的外部證據。",
                "最後完成台灣當地法務 / 合規簽核，再重跑 coverage / cutover / acceptance 審計。"
            ],
            pending_config_inputs: configPacket.required_inputs.filter(function (item) { return !item.done; }),
            external_execution_items: externalExecution.items,
            owner_handoff: ownerHandoff,
            checkpoint_records: checkpointRecords,
            required_commands: releaseRequiredCommands(),
            related_exports: [
                "tfse_local_audit_matrix",
                "tfse_formal_config_input_packet",
                "tfse_backend_cutover_roadmap",
                "tfse_external_execution_packet",
                "tfse_owner_cutover_bundle",
                "tfse_release_day_runsheet",
                "tfse_project_phase_audit",
                "tfse_project_plan_coverage_report",
                "tfse_plan_closure_report",
                "tfse_release_readiness_package",
                "tfse_acceptance_checklist"
            ]
        };
    }

    function launchCutoverAuditPayload() {
        var analytics = (siteConfigData.analytics || {});
        var searchConsole = (siteConfigData.search_console || {});
        var backend = (siteConfigData.backend || {});
        var line = (siteConfigData.line || {});
        var turnstile = (((siteConfigData || {}).security || {}).turnstile) || {};
        var lineSetup = lineOaSetupPayload();
        var lineHandoff = lineOaHandoffPayload();
        var searchConsolePayload = searchConsoleVerificationPayload();
        var backendAcceptance = backendAcceptancePayload();
        var contentApi = contentApiCutoverPayload();
        var sentry = sentryVerificationPayload();
        var analyticsDebug = analyticsDebugPayload();
        var backupReceipt = backupReceiptPayload();
        var institutionImport = institutionImportPayload();
        var migration = migrationPayload();
        var hostFallback = hostFallbackPayload();
        var legalExternal = legalExternalReviewPayload();
        var baseUrl = String(siteConfigData.base_url || "").trim();
        var ga4 = String(analytics.ga4_measurement_id || "").trim();
        var meta = String(analytics.meta_pixel_id || "").trim();
        var serverEvent = String(analytics.server_event_endpoint || "").trim();
        var searchVerification = String(searchConsole.google_site_verification || "").trim();
        var lineUrl = String(line.oa_url || "").trim();
        var backendUrl = String(backend.api_base_url || "").trim();
        var backendMode = String(backend.mode || "").trim();
        var sentryDsn = String(analytics.sentry_dsn || "").trim();
        var lineOfficialReady = isHttpsUrl(lineUrl) && lineUrl !== "free-check.html#line-cta" && lineUrl !== "contact.html#line-cta";
        var backendReady = backendMode === "api" && isHttpsUrl(backendUrl);
        var items = [];

        function add(status, key, label, owner, evidence, blockers, relatedExports) {
            items.push({
                status: status,
                key: key,
                label: label,
                owner: owner,
                evidence: evidence,
                blockers: blockers.filter(Boolean),
                related_exports: relatedExports || []
            });
        }

        add(
            isOfficialDomainUrl(baseUrl) ? "ready_for_external_execution" : "pending_external_input",
            "formal_domain_base_url",
            "正式網域切換與 SEO 資產重生",
            "data_manager",
            "Domain cutover package、SEO 提交包與 sitemap / robots 重生鏈路已就緒。",
            [isOfficialDomainUrl(baseUrl) ? "" : "site-config.json base_url 仍非正式自有網域。"],
            ["tfse_domain_cutover_package", "tfse_seo_submission_package"]
        );
        add(
            ga4 ? "ready_for_external_execution" : "pending_external_input",
            "ga4_measurement_id",
            "GA4 Measurement ID 填入與收件驗證",
            "data_manager",
            "GA4 欄位、監控收件清單與 Debug 驗證包已存在。",
            [ga4 ? "" : "site-config.json analytics.ga4_measurement_id 尚未填入正式 ID。"],
            ["tfse_monitoring_receipt_checklist", "tfse_analytics_debug_verification_package"]
        );
        add(
            meta ? "ready_for_external_execution" : "pending_external_input",
            "meta_pixel_id",
            "Meta Pixel ID 填入與收件驗證",
            "data_manager",
            "Meta Pixel 欄位、監控收件清單與 Debug 驗證包已存在。",
            [meta ? "" : "site-config.json analytics.meta_pixel_id 尚未填入正式 ID。"],
            ["tfse_monitoring_receipt_checklist", "tfse_analytics_debug_verification_package"]
        );
        add(
            ga4 && meta ? "ready_for_external_execution" : "pending_external_input",
            "analytics_debug_verification",
            "GA4 / Meta Debug 驗證留痕",
            "data_manager",
            "analytics debug package 已具備，後台也可保存外部驗證留痕。",
            [
                ga4 && meta ? "" : "正式 GA4 / Meta Pixel 尚未填入，無法做外部 Debug 驗證。",
                analyticsDebug.blockers.length ? "analytics debug package 仍有待辦 " + analyticsDebug.blockers.length + " 項。" : ""
            ],
            ["tfse_analytics_debug_verification_package", "tfse_external_verification_evidence"]
        );
        add(
            isHttpsUrl(serverEvent) ? "ready_for_external_execution" : "pending_external_input",
            "server_event_endpoint",
            "Server Event endpoint 填入與去識別事件落庫",
            "backend_engineer",
            "Server Event endpoint、事件重放隊列與監控收件清單已就緒。",
            [isHttpsUrl(serverEvent) ? "" : "site-config.json analytics.server_event_endpoint 尚未填入正式 endpoint。"],
            ["tfse_server_event_replay_queue", "tfse_monitoring_receipt_checklist"]
        );
        add(
            lineOfficialReady ? "ready_for_external_execution" : "pending_external_input",
            "line_oa_url",
            "正式 Line OA 加友 URL 切換",
            "ops_marketing",
            "Line OA setup / handoff package、站內 CTA 與 Line flow seed 已就緒。",
            [lineOfficialReady ? "" : "site-config.json line.oa_url 仍指向本機 MVP 說明錨點或非正式 URL。"],
            ["tfse_line_oa_setup_package", "tfse_line_oa_handoff_check"]
        );
        add(
            lineSetup.quick_replies.length ? "ready_for_external_execution" : "pending_local_prep",
            "line_oa_setup",
            "正式 Line OA 圖文選單 / 分群 / 自動回覆建立",
            "ops_marketing",
            "Line OA setup package 已具備；目前設定留痕 " + lineSetup.record_summary.tracked_count + " 筆。",
            [
                lineSetup.quick_replies.length ? "" : "Line OA setup package quick_replies 不可為空。",
                lineOfficialReady ? "" : "正式 Line OA URL 尚未填入。"
            ],
            ["tfse_line_oa_setup_package"]
        );
        add(
            lineHandoff.cta_routes.length ? "ready_for_external_execution" : "pending_local_prep",
            "line_oa_handoff",
            "正式 Line OA 導向 / quick reply / 退訂留痕",
            "ops_marketing",
            "Line OA handoff package 已具備；目前導向留痕 " + lineHandoff.record_summary.tracked_count + " 筆。",
            [
                lineHandoff.cta_routes.length ? "" : "Line OA handoff package 缺少站內 CTA 驗收路徑。",
                lineOfficialReady ? "" : "正式 Line OA URL 尚未填入。"
            ],
            ["tfse_line_oa_handoff_check", "tfse_line_optout_complaint_queue"]
        );
        add(
            searchVerification ? "ready_for_external_execution" : "pending_external_input",
            "search_console_verification",
            "Search Console 驗證碼填入與 SEO 資產重生",
            "seo_owner",
            "Search Console 驗證包、SEO 提交包與 indexing queue 已就緒。",
            [searchVerification ? "" : "site-config.json search_console.google_site_verification 尚未填入。"],
            ["tfse_search_console_verification_package", "tfse_seo_submission_package"]
        );
        add(
            searchVerification ? "ready_for_external_execution" : "pending_external_input",
            "search_console_submit",
            "Search Console property 驗證與 sitemap 提交",
            "seo_owner",
            "Search Console 驗證包已具備；目前留痕 " + searchConsolePayload.record_summary.tracked_count + " 筆。",
            [
                searchVerification ? "" : "正式 Search Console 驗證碼尚未填入。",
                searchConsolePayload.blockers.length ? "Search Console 驗證包仍有待辦 " + searchConsolePayload.blockers.length + " 項。" : ""
            ],
            ["tfse_search_console_verification_package", "tfse_seo_indexing_followup_queue"]
        );
        add(
            "ready_for_external_execution",
            "admin_auth_server_cutover",
            "伺服器端 Admin Auth / RBAC / 審計日誌接入",
            "backend_engineer",
            "Admin Auth cutover package 與 backend acceptance matrix 已存在；API 驗收留痕 " + backendAcceptance.record_summary.tracked_count + " 筆。",
            [],
            ["tfse_admin_auth_cutover_check", "tfse_backend_acceptance_matrix"]
        );
        add(
            "ready_for_external_execution",
            "database_backup_strategy",
            "正式資料庫每日備份 / 每週還原演練",
            "infra_owner",
            "backup receipt verification package 已存在；本機備份包可作遷移前核對。",
            [backupReceipt.blockers && backupReceipt.blockers.length ? "backup receipt package 仍有待辦 " + backupReceipt.blockers.length + " 項。" : ""],
            ["tfse_backup_restore_drill_plan", "tfse_backup_receipt_verification_package"]
        );
        add(
            institutionImport.import_rows.length ? "ready_for_external_execution" : "pending_local_prep",
            "institution_import",
            "機構資料正式匯入與來源版本紀錄",
            "data_manager",
            "institution import verification package 已存在；可匯入 " + institutionImport.import_rows.length + " 筆。",
            [institutionImport.import_rows.length ? "" : "institution import verification package 缺少可用 seed。"],
            ["tfse_institution_import_verification_package"]
        );
        add(
            "ready_for_external_execution",
            "formal_backend_migration",
            "本機內容 / 線索 / 審計遷移到正式後端",
            "backend_engineer",
            "正式遷移包已存在；目前產品 " + migration.summary.seed_products + " 筆、文章 " + migration.summary.seed_articles + " 篇。",
            [],
            ["tfse_formal_backend_migration_package"]
        );
        add(
            backendReady ? "ready_for_external_execution" : "pending_external_input",
            "backend_api_base_url",
            "正式 backend.api_base_url 切換與前台重驗",
            "backend_engineer",
            "前端 API adapter、formal API rehearsal 與 backend acceptance matrix 已就緒。",
            [backendReady ? "" : "site-config.json backend.mode / backend.api_base_url 尚未切到正式 API。"],
            ["tfse_backend_acceptance_matrix", "tfse_content_api_cutover_package"]
        );
        add(
            backendReady ? "ready_for_external_execution" : "pending_external_input",
            "content_api_cutover",
            "正式內容 API 驗收與切換",
            "backend_engineer",
            "content API cutover package 已存在；blockers " + contentApi.blockers.length + " 項。",
            [
                backendReady ? "" : "正式 backend.api_base_url 尚未配置。",
                contentApi.blockers.length ? "content API cutover 仍有待辦 " + contentApi.blockers.length + " 項。" : ""
            ],
            ["tfse_content_api_cutover_package"]
        );
        add(
            backendReady ? "ready_for_external_execution" : "pending_external_input",
            "leads_api_persistence",
            "POST /api/leads 正式落庫取代 localStorage",
            "backend_engineer",
            "lead API contract、CRM persistence package 與 formal API rehearsal 已存在。",
            [backendReady ? "" : "正式 backend.api_base_url 尚未配置，無法切到正式 leads API。"],
            ["tfse_crm_api_persistence_package", "tfse_backend_acceptance_matrix"]
        );
        add(
            backendReady && turnstile.enabled && turnstile.site_key ? "ready_for_external_execution" : "pending_external_input",
            "turnstile_backend_verification",
            "Turnstile server-side 驗證 / 限流 / 去重",
            "backend_engineer",
            "Turnstile backend package、表單風險控制與 API contract 已存在。",
            [
                backendReady ? "" : "正式 backend.api_base_url 尚未配置。",
                turnstile.enabled && turnstile.site_key ? "" : "Cloudflare Turnstile 尚未在正式配置中啟用。"
            ],
            ["tfse_turnstile_backend_verification_package", "tfse_form_risk_control_report"]
        );
        add(
            backendReady ? "ready_for_external_execution" : "pending_external_input",
            "admin_crm_api_cutover",
            "Admin CRM / 合規審核 / 審計日誌接入正式 API",
            "backend_engineer",
            "Admin CRM / compliance / audit export 與 mock API rehearsal 已存在。",
            [backendReady ? "" : "正式 backend.api_base_url 尚未配置。"],
            ["tfse_crm_api_persistence_package", "tfse_compliance_api_persistence_package", "tfse_backend_acceptance_matrix"]
        );
        add(
            isHttpsUrl(sentryDsn) ? "ready_for_external_execution" : "pending_external_input",
            "sentry_dsn",
            "正式 Sentry DSN 填入",
            "ops_engineer",
            "Sentry 驗收包與本機錯誤摘要已存在。",
            [isHttpsUrl(sentryDsn) ? "" : "site-config.json analytics.sentry_dsn 尚未填入正式 DSN。"],
            ["tfse_sentry_error_verification_package"]
        );
        add(
            isHttpsUrl(sentryDsn) ? "ready_for_external_execution" : "pending_external_input",
            "sentry_verification",
            "前台 / API Sentry 受控錯誤驗證",
            "ops_engineer",
            "Sentry verification package 已存在；blockers " + sentry.blockers.length + " 項。",
            [
                isHttpsUrl(sentryDsn) ? "" : "正式 Sentry DSN 尚未填入。",
                sentry.blockers.length ? "Sentry verification package 仍有待辦 " + sentry.blockers.length + " 項。" : ""
            ],
            ["tfse_sentry_error_verification_package"]
        );
        add(
            "ready_for_external_execution",
            "host_fallback_deployment",
            "正式主機 404 / 500 / server error fallback 配置",
            "infra_owner",
            "host fallback deployment check 已存在；blockers " + hostFallback.blockers.length + " 項。",
            [],
            ["tfse_host_fallback_deployment_check"]
        );
        add(
            "pending_human_review",
            "legal_review_external",
            "台灣當地法務 / 合規人員正式複核",
            "legal_reviewer",
            "法務複核包與外部留痕機制已存在；目前狀態 " + legalExternal.status + "。",
            [],
            ["tfse_legal_compliance_review_package", "tfse_legal_external_review_evidence"]
        );

        var counts = items.reduce(function (bucket, item) {
            bucket[item.status] = (bucket[item.status] || 0) + 1;
            return bucket;
        }, {});

        return {
            format: "tfse_launch_cutover_audit",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source: "LAUNCH_CHECKLIST external cutover section",
            generated_from: ["site-config.json", "assets/js/tfse-admin.js", "api-contract.json", "LAUNCH_CHECKLIST.md"],
            counts: counts,
            summary: {
                official_config_pending: counts.pending_external_input || 0,
                external_execution_ready: counts.ready_for_external_execution || 0,
                human_review_pending: counts.pending_human_review || 0,
                local_prep_missing: counts.pending_local_prep || 0
            },
            items: items
        };
    }

    function launchExecutionPlanPayload() {
        var audit = launchCutoverAuditPayload();
        var itemMap = {};
        audit.items.forEach(function (item) {
            itemMap[item.key] = item;
        });
        var waves = [
            {
                wave: "wave_0_prepare_inputs",
                title: "波次 0：補齊正式配置輸入",
                goal: "先補齊 site-config 與正式平台入口資訊，讓後續驗證與切換具備執行條件。",
                keys: ["formal_domain_base_url", "ga4_measurement_id", "meta_pixel_id", "server_event_endpoint", "line_oa_url", "search_console_verification", "backend_api_base_url", "sentry_dsn"]
            },
            {
                wave: "wave_1_enable_platforms",
                title: "波次 1：完成平台接入與部署切換",
                goal: "把正式平台、資料、備份與主機層能力接好，建立可切換的運營底座。",
                keys: ["line_oa_setup", "line_oa_handoff", "admin_auth_server_cutover", "database_backup_strategy", "institution_import", "formal_backend_migration", "host_fallback_deployment"]
            },
            {
                wave: "wave_2_verify_observability",
                title: "波次 2：驗證追蹤、SEO 與 API 收件",
                goal: "在正式配置與平台接入後，逐項保存外部收件、SEO 與 API 驗收證據。",
                keys: ["analytics_debug_verification", "search_console_submit", "content_api_cutover", "leads_api_persistence", "turnstile_backend_verification", "admin_crm_api_cutover", "sentry_verification"]
            },
            {
                wave: "wave_3_signoff",
                title: "波次 3：最終人工簽核",
                goal: "完成法務 / 合規最終複核，讓正式對外承接具備簽核依據。",
                keys: ["legal_review_external"]
            }
        ].map(function (wave) {
            var items = wave.keys.map(function (key) { return itemMap[key]; }).filter(Boolean);
            var counts = items.reduce(function (bucket, item) {
                bucket[item.status] = (bucket[item.status] || 0) + 1;
                return bucket;
            }, {});
            var owners = {};
            items.forEach(function (item) {
                owners[item.owner] = owners[item.owner] || [];
                owners[item.owner].push(item);
            });
            return {
                wave: wave.wave,
                title: wave.title,
                goal: wave.goal,
                counts: counts,
                owners: owners,
                items: items
            };
        });
        return {
            format: "tfse_launch_execution_plan",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source: "launchCutoverAuditPayload",
            summary: audit.summary,
            waves: waves
        };
    }

    function launchCountdownPlanPayload() {
        var audit = launchCutoverAuditPayload();
        var itemMap = {};
        audit.items.forEach(function (item) {
            itemMap[item.key] = item;
        });
        var slots = [
            {
                slot: "d_minus_3",
                title: "D-3：補齊正式配置與平台入口",
                goal: "把所有正式平台 URL、ID、DSN 與 site-config 入口資訊補齊。",
                keys: ["formal_domain_base_url", "ga4_measurement_id", "meta_pixel_id", "server_event_endpoint", "line_oa_url", "search_console_verification", "backend_api_base_url", "sentry_dsn"],
                manual_checks: []
            },
            {
                slot: "d_minus_2",
                title: "D-2：完成平台接入與資料準備",
                goal: "完成正式平台、資料、備份與主機層切換前準備。",
                keys: ["line_oa_setup", "admin_auth_server_cutover", "database_backup_strategy", "institution_import", "formal_backend_migration", "host_fallback_deployment"],
                manual_checks: []
            },
            {
                slot: "d_minus_1",
                title: "D-1：驗證 SEO、追蹤與 API 收件",
                goal: "保留正式外部收件與 API 驗收證據，確認切換後對外可用。",
                keys: ["analytics_debug_verification", "search_console_submit", "content_api_cutover", "leads_api_persistence", "turnstile_backend_verification", "admin_crm_api_cutover", "sentry_verification", "line_oa_handoff"],
                manual_checks: []
            },
            {
                slot: "go_live",
                title: "Go-live：最終簽核與發布",
                goal: "完成最終人工簽核與發布前最後核對。",
                keys: ["legal_review_external"],
                manual_checks: [
                    "確認最新 tfse_acceptance_checklist、tfse_browser_acceptance_report 與 tfse_release_readiness_package 均已匯出。",
                    "確認 external verification records 已補齊 GA4 / Search Console / backend / Line OA 等已完成項。",
                    "法務 / 合規 reviewer 完成 signoff 後，再放行對外投流、SEO 提交與 Line OA 承接。"
                ]
            },
            {
                slot: "d_plus_1",
                title: "D+1：發布後複查",
                goal: "發布後複查收件、SEO、Lead 流程與異常告警。",
                keys: [],
                manual_checks: [
                    "檢查 GA4 / Meta / Server Event / Sentry 是否持續收件。",
                    "抽查首頁、資料庫、免費財務健檢查詢、聯絡頁資料回報與 Admin CRM 是否仍可用。",
                    "檢查 Search Console coverage / URL Inspection、Line OA quick reply、退訂關鍵字與 lead follow-up 是否正常。"
                ]
            }
        ].map(function (slot) {
            var items = slot.keys.map(function (key) { return itemMap[key]; }).filter(Boolean);
            var counts = items.reduce(function (bucket, item) {
                bucket[item.status] = (bucket[item.status] || 0) + 1;
                return bucket;
            }, {});
            var owners = {};
            items.forEach(function (item) {
                owners[item.owner] = owners[item.owner] || [];
                owners[item.owner].push(item);
            });
            return {
                slot: slot.slot,
                title: slot.title,
                goal: slot.goal,
                counts: counts,
                owners: owners,
                items: items,
                manual_checks: slot.manual_checks
            };
        });
        return {
            format: "tfse_launch_countdown_plan",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source: "launchCutoverAuditPayload",
            summary: audit.summary,
            slots: slots
        };
    }

    function domainCutoverPayload() {
        var baseUrl = (siteConfigData.base_url || "").replace(/\/$/, "");
        var searchConsole = (siteConfigData.search_console || {});
        var canonicalPages = siteConfigData.canonical_pages || [];
        var ready = isHttpsUrl(baseUrl);
        var blockers = [
            ready ? "" : "base_url 需為正式 HTTPS 網域。",
            searchConsole.google_site_verification ? "" : "Search Console 驗證碼待填。",
            canonicalPages.length ? "" : "canonical_pages 不可為空。"
        ].filter(Boolean);
        return {
            format: "tfse_domain_cutover_package",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            base_url: baseUrl,
            status: blockers.length ? "pending_domain_cutover" : "ready_for_domain_cutover",
            summary: {
                canonical_pages: canonicalPages.length,
                search_console_configured: !!searchConsole.google_site_verification,
                blockers: blockers.length
            },
            assets: ["sitemap.xml", "robots.txt", "feed.xml", "site.webmanifest", ".well-known/security.txt"],
            required_commands: [
                "python3 tools/generate_seo_assets.py",
                "python3 tools/seo_assets_audit.py",
                "python3 tools/validate_site_config.py",
                "python3 tools/verify_static_site.py",
                "NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs"
            ],
            cutover_steps: [
                "更新 site-config.json > base_url 與 Search Console 驗證碼。",
                "重生 SEO 資產並確認 canonical、OG、JSON-LD、RSS、robots、sitemap。",
                "部署後抽查首頁、資料庫、文章、產品詳情、落地頁與 404/500。",
                "Search Console 驗證網域並提交 sitemap。",
                "若 canonical 或主頁不可用，回滾上一版並重新生成。"
            ],
            blockers: blockers,
            related_exports: ["tfse_seo_submission_package", "tfse_production_config_readiness", "tfse_release_readiness_package"]
        };
    }

    function hostFallbackPayload() {
        var baseUrl = (siteConfigData.base_url || "").replace(/\/$/, "");
        var absolute = function (path) {
            return baseUrl ? baseUrl + "/" + path.replace(/^\//, "") : path;
        };
        return {
            format: "tfse_host_fallback_deployment_check",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            status: "requires_formal_host_verification",
            source_files: ["404.html", "500.html", "DEPLOYMENT.md", "OPERATIONS_RUNBOOK.md", "site-config.json"],
            privacy_note: "此包只保存公開 URL、檢查步驟與結果欄位，不保存 cookie、session、錯誤堆疊全文或個資。",
            critical_routes: [
                { route: absolute("404.html"), expected: "自訂 404 可導回資料庫、文章與免費財務健檢查詢" },
                { route: absolute("500.html"), expected: "自訂 500/server error fallback 可導回首頁、資料庫與聯絡入口" },
                { route: absolute("missing-page-" + new Date().getFullYear() + ".html"), expected: "正式主機未知路徑應回 404 狀態或顯示 404.html" },
                { route: absolute("api/server-error-probe"), expected: "正式後端若接入 server error fallback，應回 5xx 且不暴露 stack trace" }
            ],
            platform_notes: [
                "Netlify / Cloudflare Pages 可設定 404.html fallback；500 fallback 依平台支援度決定。",
                "GitHub Pages 支援自訂 404.html，但不支援真正 500 fallback；正式後端接入後需在 server 層配置。",
                "錯誤頁不得收集額外個資或顯示 stack trace、內部路徑、session/cookie。"
            ],
            verification_steps: [
                "部署後直接訪問 /404.html 與 /500.html。",
                "訪問不存在的 HTML 路徑，確認狀態碼、頁面文案與回流 CTA。",
                "若有正式後端，觸發受控 server error probe 或 staging 測試，確認 500 fallback 不暴露堆疊。",
                "用瀏覽器桌面/手機確認錯誤頁無文字重疊且保留 TFSE 免責聲明。",
                "保存 checked_url、status_code、screenshot_url、result、reviewer_role 與 evidence_note。"
            ],
            evidence_fields: ["checked_url", "status_code", "fallback_page", "viewport", "result", "screenshot_url", "checked_at", "reviewer_role", "evidence_note"],
            blockers: [
                "正式主機尚未部署時，本機只能確認 404.html / 500.html 檔案存在。",
                "靜態主機不支援 500 fallback 時，需在正式後端或反向代理層配置。",
                "未知路徑狀態碼與 fallback 行為需部署後以平台實測確認。"
            ],
            related_exports: ["tfse_domain_cutover_package", "tfse_security_headers_deployment_check", "tfse_release_readiness_package", "tfse_browser_acceptance_report"]
        };
    }

    function backendAcceptanceTrackableItems() {
        return [
            ["auth_login", "驗證", "POST", "/api/admin/auth/login", "httpOnly session"],
            ["auth_session", "驗證", "GET", "/api/admin/auth/session", "RBAC 權限"],
            ["auth_logout", "驗證", "POST", "/api/admin/auth/logout", "撤銷 session"],
            ["lead_create", "前台", "POST", "/api/leads", "入庫/Turnstile/限流"],
            ["admin_leads", "後台", "GET", "/api/admin/leads", "CRM 跨瀏覽器可讀"],
            ["lead_status_update", "後台", "PATCH", "/api/admin/leads/:id/status", "狀態落庫+audit_log"],
            ["lead_followups", "後台", "GET", "/api/admin/leads/follow-ups", "待跟進隊列"],
            ["events_intake", "事件", "POST", "/api/events", "去識別事件落庫"],
            ["products_api", "內容", "GET", "/api/products", "API 供產品資料"],
            ["articles_api", "內容", "GET", "/api/articles", "只回傳已發布"],
            ["compliance_review", "合規", "POST", "/api/admin/compliance/review", "審核落庫"],
            ["audit_logs", "審計", "GET", "/api/admin/audit-logs", "動作可追蹤"],
            ["privacy_request", "個資", "PATCH", "/api/admin/privacy-requests/:lead_id", "刪除/更正同步"]
        ].map(function (item) {
            return {
                key: item[0],
                group: item[1],
                method: item[2],
                path: item[3],
                proof: item[4]
            };
        });
    }

    function searchConsoleTrackableItems(payload) {
        var items = [
            {
                key: "property_verify",
                label: "Property 驗證",
                type: "property",
                target: ((payload.property || {}).base_url) || "正式 base_url 待填",
                expected: "Verify 通過"
            },
            {
                key: "sitemap_submit",
                label: "Sitemap 提交",
                type: "sitemap",
                target: ((payload.submission_targets || {}).sitemap) || "正式 base_url 待填",
                expected: "sitemap submitted / success"
            }
        ];
        (payload.url_inspection_samples || []).forEach(function (item, index) {
            items.push({
                key: "inspection_" + (index + 1),
                label: "URL Inspection " + (index + 1),
                type: item.type,
                target: item.url || item.path || "/",
                expected: item.expected
            });
        });
        return items.map(function (item) {
            item.latest_record = latestSearchConsoleRecord(item.key);
            return item;
        });
    }

    function lineOaTrackableItems() {
        var handoff = lineOaHandoffPayload();
        var items = [
            { key: "setup_welcome", phase: "setup", label: "歡迎語建立", detail: "將 welcome_messages 建入正式 Line OA" },
            { key: "setup_rich_menu", phase: "setup", label: "圖文選單建立", detail: "依 rich_menu 建立主要入口" },
            { key: "setup_tags", phase: "setup", label: "標籤與分群建立", detail: "建立需求、來源與分群標籤" },
            { key: "setup_quick_replies", phase: "setup", label: "quick reply / 自動回覆", detail: "依 quick_replies 建立承接入口與合規邊界" },
            { key: "setup_segment_import", phase: "setup", label: "分群同步匯入", detail: "只匯入 consent_line=true 的資料" },
            { key: "setup_official_url", phase: "setup", label: "正式 Line OA URL 回填", detail: "回填 site-config.json > line.oa_url" }
        ];
        handoff.cta_routes.forEach(function (route, index) {
            items.push({
                key: route.key || ("handoff_route_" + (index + 1)),
                phase: "handoff",
                label: "站內 CTA 驗收 " + (index + 1),
                detail: route.page + " ｜ " + route.expected
            });
        });
        items.push({
            key: "handoff_optout_keywords",
            phase: "handoff",
            label: "退訂 / 刪除資料關鍵字驗收",
            detail: "確認停止接收、退訂、刪除資料會進入隊列"
        });
        return items.map(function (item) {
            item.latest_record = latestLineOaRecord(item.key);
            return item;
        });
    }

    function backendRoadmapPayload() {
        var backend = (siteConfigData && siteConfigData.backend) || {};
        var migration = migrationPayload();
        var importValidation = importValidationPayload();
        var backendAcceptance = backendAcceptancePayload();
        var authCutover = authCutoverPayload();
        var crmApi = crmApiPersistencePayload();
        var complianceApi = complianceApiPersistencePayload();
        var privacyFulfillment = privacyFulfillmentPayload();
        var turnstileVerification = turnstileBackendPayload();
        var backupReceipt = backupReceiptPayload();
        var contentApi = contentApiCutoverPayload();
        var apiConfigured = backend.mode === "api" && !!backend.api_base_url;

        function step(stepId, title, goal, readiness, blockers, relatedExports) {
            return {
                step: stepId,
                title: title,
                goal: goal,
                readiness: readiness,
                blockers: blockers.filter(Boolean),
                related_exports: relatedExports || []
            };
        }

        var steps = [
            step(
                "step_1_leads_api",
                "先接入 POST /api/leads",
                "優先把免費財務健檢查詢提交從 localStorage 切到正式 lead_forms，避免潛客只停留在瀏覽器。",
                apiConfigured ? "ready_for_formal_api_validation" : "pending_api_configuration",
                [
                    apiConfigured ? "" : "site-config.json backend.mode / backend.api_base_url 尚未切到正式 API。",
                    turnstileVerification.status === "pending_turnstile_backend_verification" ? "Turnstile server-side 驗證、限流與去重仍待 staging 驗收。" : ""
                ],
                ["tfse_backend_acceptance_matrix", "tfse_turnstile_backend_verification_package", "tfse_form_risk_control_report"]
            ),
            step(
                "step_2_admin_auth",
                "再切換 Admin Auth",
                "用伺服器 session、CSRF、RBAC 與 Viewer 遮罩取代前端 MVP 密碼。",
                apiConfigured ? authCutover.status : "pending_api_configuration",
                [
                    apiConfigured ? "" : "正式後端尚未提供 auth/login/session/logout。",
                    "MFA、cookie flags、audit_logs 與 logout revoke 需在正式環境重驗。"
                ],
                ["tfse_admin_auth_cutover_check", "tfse_admin_security_matrix", "tfse_backend_acceptance_matrix"]
            ),
            step(
                "step_3_crm_writeback",
                "接入 CRM / 審計落庫",
                "讓 Admin CRM、聯繫紀錄、重複線索、合規審核與個資請求能跨瀏覽器共享並保留 audit_logs。",
                apiConfigured ? crmApi.status : "pending_api_configuration",
                [
                    apiConfigured ? "" : "GET/PATCH /api/admin/leads 仍未接入正式 API。",
                    complianceApi.status === "pending_compliance_api_persistence" ? "合規審核正式落庫證據仍待建立。" : "",
                    privacyFulfillment.status === "pending_privacy_fulfillment_verification" ? "個資請求正式履約與遮罩 / 刪除證據仍待建立。" : ""
                ],
                ["tfse_crm_api_persistence_package", "tfse_compliance_api_persistence_package", "tfse_privacy_fulfillment_verification_package"]
            ),
            step(
                "step_4_events_and_tracking",
                "接入 POST /api/events 與外部追蹤",
                "把去識別事件寫入伺服器並同步 GA4 / Meta / Server Event / Sentry。",
                apiConfigured ? "ready_for_external_tracking_validation" : "pending_api_configuration",
                [
                    apiConfigured ? "" : "正式事件 API 尚未配置。",
                    !((siteConfigData.analytics || {}).ga4_measurement_id) ? "GA4 Measurement ID 尚未填入。" : "",
                    !((siteConfigData.analytics || {}).server_event_endpoint) ? "Server Event endpoint 尚未填入。" : "",
                    !((siteConfigData.analytics || {}).sentry_dsn) ? "Sentry DSN 尚未填入。" : ""
                ],
                ["tfse_monitoring_receipt_checklist", "tfse_analytics_debug_verification_package", "tfse_sentry_error_verification_package"]
            ),
            step(
                "step_5_content_api",
                "接入內容 API",
                "讓 /api/products、/api/articles、/api/institutions、/api/search 成為正式資料來源，靜態 JSON 降級為 seed / fallback。",
                apiConfigured ? contentApi.status : "pending_api_configuration",
                [
                    apiConfigured ? "" : "正式內容 API 尚未配置。",
                    importValidation.summary.blockers ? "正式匯入前仍有 " + importValidation.summary.blockers + " 項資料導入阻擋。" : ""
                ],
                ["tfse_content_api_cutover_package", "tfse_formal_backend_migration_package", "tfse_import_validation_package"]
            ),
            step(
                "step_6_backup_and_restore",
                "最後完成備份 / 還原 / 運維門檻",
                "建立每日備份、每週還原演練、審計與 migration 後抽查，才算正式後端切換完成。",
                backupReceipt.status || "pending_backup_receipt_verification",
                [
                    backupReceipt.status === "pending_backup_receipt_verification" ? "正式 backup_jobs / restore drill / checksum 證據仍待建立。" : "",
                    importValidation.summary.blockers ? "遷移資料仍需排除 sample_lead 並處理來源 / 個資阻擋項。" : ""
                ],
                ["tfse_backup_receipt_verification_package", "tfse_backup_restore_drill_plan", "tfse_formal_backend_migration_package"]
            )
        ];

        return {
            format: "tfse_backend_cutover_roadmap",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source: "PRODUCTION_BACKEND_PLAN.md + admin acceptance exports",
            summary: {
                api_configured: apiConfigured,
                migration_seed_products: migration.summary.seed_products,
                migration_seed_articles: migration.summary.seed_articles,
                migration_local_leads: migration.summary.local_leads,
                import_validation_blockers: importValidation.summary.blockers,
                backend_acceptance_blockers: backendAcceptance.summary.blockers,
                total_steps: steps.length,
                ready_steps: steps.filter(function (item) { return item.readiness !== "pending_api_configuration"; }).length
            },
            priority_sequence: steps,
            migration_order: migration.import_order,
            critical_endpoints: backendAcceptanceTrackableItems(),
            security_controls: [
                "Server-side session + CSRF + RBAC + Viewer masking",
                "Turnstile siteverify、蜜罐、IP + device_id 限流、24h 重複提交識別",
                "audit_logs 覆蓋匯出、狀態更新、審核、刪除請求與發布",
                "手機、Line ID、補充說明需加密或欄位級保護"
            ],
            rehearsal_commands: [
                "python3 tools/mock_formal_api.py --port 8788",
                "NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs --backend-base-url http://127.0.0.1:8788",
                "python3 tools/validate_site_config.py",
                "python3 tools/backend_schema_audit.py",
                "python3 tools/api_contract_audit.py"
            ],
            completion_gates: [
                "POST /api/leads 成功落 lead_forms，且拒收高敏資料。",
                "Admin login/session/logout 改為伺服器驗證，並有 RBAC / audit_logs。",
                "CRM / 合規 / 個資請求可跨瀏覽器共享同一批正式資料。",
                "內容 API、事件 API、外部追蹤與 Sentry 收件均有 staging / production 證據。",
                "每日備份成功、每週 restore drill 可驗證。"
            ],
            related_exports: [
                "tfse_formal_backend_migration_package",
                "tfse_import_validation_package",
                "tfse_backend_acceptance_matrix",
                "tfse_admin_auth_cutover_check",
                "tfse_crm_api_persistence_package",
                "tfse_compliance_api_persistence_package",
                "tfse_privacy_fulfillment_verification_package",
                "tfse_turnstile_backend_verification_package",
                "tfse_content_api_cutover_package",
                "tfse_backup_receipt_verification_package"
            ]
        };
    }

    function backendAcceptancePayload() {
        var backend = (siteConfigData && siteConfigData.backend) || {};
        var config = configReadinessPayload();
        var migration = migrationPayload();
        var formRisk = formRiskPayload();
        var apiConfigured = backend.mode === "api" && !!backend.api_base_url;
        var records = getBackendAcceptanceRecords();
        var endpoints = backendAcceptanceTrackableItems().map(function (item) {
            item.latest_record = latestBackendAcceptanceRecord(item.key);
            return item;
        });
        var blockers = [
            apiConfigured ? "" : "backend.api_base_url 待填，mode 待切 api。",
            config.items.find(function (item) { return item.key === "turnstile"; }).done ? "" : "Turnstile site key / token 驗證待補。",
            "正式 session、CSRF、RBAC、加密與備份待驗。",
            "真實 API、落庫、跨瀏覽器 CRM 待重驗。"
        ].filter(Boolean);
        return {
            format: "tfse_backend_acceptance_matrix",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            backend_mode: backend.mode || "localStorage",
            api_base_url: backend.api_base_url || "",
            privacy_note: "只輸出端點、證據與阻擋項，不輸出個資。",
            status: apiConfigured ? "ready_for_formal_api_validation" : "pending_api_configuration",
            summary: {
                endpoints: endpoints.length,
                api_configured: apiConfigured,
                migration_seed_products: migration.summary.seed_products,
                migration_seed_articles: migration.summary.seed_articles,
                local_leads_to_review: migration.summary.local_leads,
                form_risk_notes: formRisk.risk_notes.length,
                blockers: blockers.length,
                tracked_count: endpoints.filter(function (item) { return !!item.latest_record; }).length,
                passed_count: records.filter(function (item) { return item.result === "passed"; }).length,
                blocked_count: records.filter(function (item) { return item.result === "blocked"; }).length
            },
            endpoints: endpoints,
            records: records,
            record_summary: {
                tracked_count: endpoints.filter(function (item) { return !!item.latest_record; }).length,
                passed_count: records.filter(function (item) { return item.result === "passed"; }).length,
                blocked_count: records.filter(function (item) { return item.result === "blocked"; }).length
            },
            required_validation: [
                "Admin Auth 需用 server session + CSRF。",
                "lead_forms 入庫並拒收高敏資料。",
                "Admin session、Viewer 遮罩。",
                "CRM/合規/個資/匯出/發布寫 audit_logs。",
                "每日備份與每週還原演練。",
                "API 異常不得用 localStorage 覆蓋正式資料。"
            ],
            source_documents: ["PRODUCTION_BACKEND_PLAN.md", "api-contract.json", "backend-schema.sql", "DATA_MODEL.md"],
            related_exports: ["tfse_formal_backend_migration_package", "tfse_form_risk_control_report", "tfse_production_config_readiness"],
            blockers: blockers
        };
    }

    function seoSubmissionPayload() {
        var baseUrl = (siteConfigData.base_url || "").replace(/\/$/, "");
        var searchConsole = (siteConfigData.search_console || {});
        var canonicalPages = siteConfigData.canonical_pages || [];
        var publishedArticles = articleData.filter(function (article) {
            return (getArticleStatusOverrides()[article.id] || article.status || "published") === "published";
        });
        var categorySlugs = Array.prototype.slice.call(new Set(productData.map(function (item) {
            return item.category_slug || item.category || "";
        }).filter(Boolean)));
        function absolute(path) {
            path = String(path || "").replace(/^\//, "");
            return path ? baseUrl + "/" + path : baseUrl + "/";
        }
        return {
            format: "tfse_seo_submission_package",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            base_url: baseUrl || "",
            search_console: {
                google_site_verification_configured: !!searchConsole.google_site_verification,
                verification_source: "site-config.json > search_console.google_site_verification",
                sitemap_submit_url: baseUrl ? absolute("sitemap.xml") : "正式 base_url 待填"
            },
            assets: {
                sitemap: absolute("sitemap.xml"),
                robots: absolute("robots.txt"),
                rss_feed: absolute("feed.xml"),
                security_txt: absolute(".well-known/security.txt"),
                manifest: absolute("site.webmanifest")
            },
            counts: {
                canonical_pages: canonicalPages.length,
                products: productData.length,
                published_articles: publishedArticles.length,
                categories: categorySlugs.length,
                landing_pages: landingPageData.length
            },
            canonical_pages: canonicalPages.map(function (page) {
                return {
                    path: page || "/",
                    url: absolute(page)
                };
            }),
            dynamic_url_patterns: [
                { type: "product_detail", example: productData[0] ? absolute("products/" + encodeURIComponent(productData[0].slug) + ".html") : absolute("products/{slug}.html"), count: productData.length },
                { type: "article_detail", example: publishedArticles[0] ? absolute("articles/" + encodeURIComponent(publishedArticles[0].slug) + ".html") : absolute("articles/{slug}.html"), count: publishedArticles.length },
                { type: "category_alias", example: categorySlugs[0] ? absolute(categorySlugs[0] + ".html") : absolute("{category}.html"), count: categorySlugs.length },
                { type: "landing_alias", example: landingPageData[0] ? absolute("lp/" + landingPageData[0].slug + ".html") : absolute("lp/{slug}.html"), count: landingPageData.length }
            ],
            submission_steps: [
                "正式網域確認後，更新 site-config.json > base_url。",
                "填入 Google Search Console 驗證碼，執行 python3 tools/generate_seo_assets.py。",
                "執行 python3 tools/seo_assets_audit.py 與 python3 tools/verify_static_site.py，確認 canonical、OG、JSON-LD、RSS、robots 與 sitemap 同步。",
                "在 Search Console 驗證網域後提交 sitemap.xml。",
                "提交後抽查首頁、資料庫頁、文章頁、產品詳情與落地頁的 canonical 和結構化資料。"
            ],
            blockers: [
                !baseUrl ? "正式 base_url 待填" : "",
                !searchConsole.google_site_verification ? "Google Search Console 驗證碼待填" : "",
                !canonicalPages.length ? "canonical_pages 清單不可為空" : ""
            ].filter(Boolean)
        };
    }

    function searchConsoleVerificationPayload() {
        var submission = seoSubmissionPayload();
        var searchConsole = (siteConfigData.search_console || {});
        var baseUrl = submission.base_url || "";
        var verificationToken = searchConsole.google_site_verification || "";
        var sitemapUrl = baseUrl ? baseUrl.replace(/\/$/, "") + "/sitemap.xml" : "正式 base_url 待填";
        var records = getSearchConsoleRecords();
        var blockers = [
            !baseUrl ? "正式 base_url 待填，Search Console 屬性不可用 GitHub Pages 臨時 URL 代替正式網域。" : "",
            !verificationToken ? "Google Search Console 驗證碼待填。" : "",
            !submission.counts.canonical_pages ? "canonical_pages 清單不可為空，需先重生 SEO 資產。" : ""
        ].filter(Boolean);
        return {
            format: "tfse_search_console_verification_package",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            status: blockers.length ? "pending_search_console_verification" : "ready_for_search_console_submission",
            property: {
                recommended_type: "url_prefix",
                base_url: baseUrl || "",
                verification_method: "HTML meta tag",
                verification_source: "site-config.json > search_console.google_site_verification",
                verification_token_present: !!verificationToken
            },
            assets_to_regenerate: ["sitemap.xml", "robots.txt", "feed.xml", "site.webmanifest", "canonical meta", "Open Graph URL", "JSON-LD url"],
            validation_commands: [
                "python3 tools/generate_seo_assets.py",
                "python3 tools/seo_assets_audit.py",
                "python3 tools/verify_static_site.py",
                "python3 tools/validate_site_config.py"
            ],
            submission_targets: {
                sitemap: sitemapUrl,
                robots: baseUrl ? baseUrl.replace(/\/$/, "") + "/robots.txt" : "正式 base_url 待填",
                home: baseUrl || "正式 base_url 待填",
                search_console_service: "https://search.google.com/search-console"
            },
            verification_steps: [
                "在 Search Console 新增 URL prefix property，輸入正式 base_url。",
                "取得 HTML meta 驗證碼後填入 site-config.json > search_console.google_site_verification。",
                "重新生成 SEO 資產並跑 validation_commands。",
                "部署正式主機後在 Search Console 點擊 Verify。",
                "提交 sitemap.xml，並對首頁、database.html、articles.html、產品詳情與文章詳情使用 URL Inspection。",
                "保存 property_url、sitemap_url、verification_result、submitted_at、coverage_status 與 evidence_note。"
            ],
            url_inspection_samples: submission.canonical_pages.slice(0, 6).map(function (page) {
                var key = "inspection_" + (submission.canonical_pages.indexOf(page) + 1);
                return { key: key, type: "canonical_page", path: page.path, url: page.url, expected: "URL is on Google 或已提交索引請求", latest_record: latestSearchConsoleRecord(key) };
            }).concat(submission.dynamic_url_patterns.slice(0, 2).map(function (item) {
                var key = "inspection_" + (submission.canonical_pages.slice(0, 6).length + submission.dynamic_url_patterns.slice(0, 2).indexOf(item) + 1);
                return { key: key, type: item.type, path: item.example, url: item.example, expected: "canonical 正確且無 duplicate selected canonical 問題", latest_record: latestSearchConsoleRecord(key) };
            })),
            evidence_fields: ["property_url", "verification_method", "verification_result", "sitemap_url", "sitemap_status", "inspected_url", "coverage_status", "indexed_url", "last_crawl_time", "checked_at", "reviewer_role", "evidence_note"],
            records: records,
            record_summary: {
                tracked_count: records.length,
                verified_count: records.filter(function (item) { return item.result === "verified"; }).length,
                submitted_count: records.filter(function (item) { return item.result === "submitted"; }).length,
                blocked_count: records.filter(function (item) { return item.result === "blocked"; }).length
            },
            blockers: blockers,
            related_exports: ["tfse_seo_submission_package", "tfse_seo_indexing_followup_queue", "tfse_domain_cutover_package", "tfse_external_verification_evidence"]
        };
    }

    function seoIndexingQueuePayload() {
        var submission = seoSubmissionPayload();
        var baseUrl = submission.base_url || "";
        function absolute(path) {
            path = String(path || "").replace(/^\//, "");
            return path ? baseUrl + "/" + path : baseUrl + "/";
        }
        function task(type, title, path, priority, reason) {
            return {
                type: type,
                title: title,
                path: path || "/",
                url: absolute(path),
                priority: priority,
                reason: reason,
                status: submission.blockers.length ? "pending_site_config" : "ready_for_search_console_check",
                required_actions: [
                    "確認頁面 200、canonical、title、description、JSON-LD 與免責聲明。",
                    "正式 Search Console 驗證後提交 sitemap 或使用 URL Inspection。",
                    "保存 inspected_at、coverage_status、indexed_url、last_crawl_time 與證據備註。",
                    "若顯示 excluded / duplicate / crawled_not_indexed，回到內容、內鏈與 canonical 檢查。"
                ]
            };
        }
        var publishedArticles = articleData.filter(function (article) {
            return (getArticleStatusOverrides()[article.id] || article.status || "published") === "published";
        });
        var categories = Array.prototype.slice.call(new Set(productData.map(function (product) {
            return product.category_slug || product.category || "";
        }).filter(Boolean)));
        var tasks = [];
        tasks.push(task("canonical_page", "首頁", "", "high", "品牌首頁與主要查詢入口"));
        tasks.push(task("canonical_page", "資料庫首頁", "database.html", "high", "金融商品資料庫入口"));
        tasks.push(task("canonical_page", "金融知識列表", "articles.html", "high", "SEO 內容中心入口"));
        tasks.push(task("canonical_page", "免費財務健檢", "free-check.html", "high", "主要轉換入口，需確認 no sensitive data copy"));
        categories.slice(0, 12).forEach(function (slug) {
            tasks.push(task("category_alias", slug, slug + ".html", "medium", "分類入口與內鏈確認"));
        });
        productData.slice(0, 20).forEach(function (product) {
            tasks.push(task("product_detail", product.title || product.name || product.slug, "products/" + encodeURIComponent(product.slug) + ".html", "medium", "產品資料來源與更新日需可被搜尋引擎讀取"));
        });
        publishedArticles.slice(0, 20).forEach(function (article) {
            tasks.push(task("article_detail", article.title, "articles/" + encodeURIComponent(article.slug) + ".html", "medium", "首批 SEO 文章需追蹤索引與內鏈"));
        });
        landingPageData.slice(0, 8).forEach(function (page) {
            tasks.push(task("landing_page", page.title || page.slug, "lp/" + page.slug + ".html", "low", "投流頁需確認 canonical、合規與是否允許索引"));
        });
        return {
            format: "tfse_seo_indexing_followup_queue",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            base_url: baseUrl,
            search_console_configured: submission.search_console.google_site_verification_configured,
            privacy_note: "只輸出 URL、索引檢查欄位與證據備註，不輸出潛客、手機、Line ID 或表單資料。",
            summary: {
                tasks: tasks.length,
                high_priority: tasks.filter(function (item) { return item.priority === "high"; }).length,
                medium_priority: tasks.filter(function (item) { return item.priority === "medium"; }).length,
                low_priority: tasks.filter(function (item) { return item.priority === "low"; }).length,
                blockers: submission.blockers.length
            },
            evidence_fields: ["inspected_at", "coverage_status", "indexed_url", "last_crawl_time", "sitemap_seen", "canonical_selected_by_google", "evidence_note", "owner"],
            items: tasks,
            blockers: submission.blockers,
            related_exports: ["tfse_seo_submission_package", "tfse_domain_cutover_package", "tfse_external_verification_evidence"]
        };
    }

    function releaseReadinessPayload() {
        var launch = launchHealthPayload();
        var config = configReadinessPayload();
        var configPacket = formalConfigInputPacketPayload();
        var externalExecution = externalExecutionPacketPayload();
        var handoff = launchHandoffManifestPayload();
        var acceptance = acceptanceChecklistPayload();
        var browser = browserAcceptanceReportPayload();
        var legal = legalReviewPayload();
        var seo = seoSubmissionPayload();
        var domain = domainCutoverPayload();
        var backup = backupPayload();
        var migration = migrationPayload();
        var importValidation = importValidationPayload();
        var backendAcceptance = backendAcceptancePayload();
        var now = new Date().toISOString();
        var blockers = [];
        if (launch.pending_count) blockers.push("上線健康檢查仍有 " + launch.pending_count + " 項待配置或待外部驗證。");
        if (config.pending_count) blockers.push("正式配置交接包仍有 " + config.pending_count + " 項待填。");
        if (acceptance.pending_count) blockers.push("上線驗收清單仍有 " + acceptance.pending_count + " 項待驗。");
        if (browser.pending_count) blockers.push("瀏覽器人工驗收仍有 " + browser.pending_count + " 項未留痕。");
        if (seo.blockers.length) blockers.push("SEO 收錄提交包仍有 " + seo.blockers.length + " 項待處理。");
        if (domain.blockers.length) blockers.push("正式網域切換仍有 " + domain.blockers.length + " 項待處理。");
        if ((legal.status_counts.external_pending || 0) + (legal.status_counts.manual_external || 0) + (legal.status_counts.needs_review || 0)) {
            blockers.push("法務/合規送審包仍有外部或人工複核項。");
        }
        if (configPacket.pending_count && !configPacket.record_summary.tracked_count) {
            blockers.push("正式配置待填項尚未保存任何收件留痕。");
        }
        if (externalExecution.ready_for_external_execution_count && !externalExecution.record_summary.tracked_count) {
            blockers.push("外部執行交接隊列尚未保存任何執行留痕。");
        }
        if (!handoff.summary.checkpoint_records) {
            blockers.push("最終上線總交接清單尚未保存會議 / gate 留痕。");
        }
        return {
            format: "tfse_release_readiness_package",
            version: "2026-06-27",
            generated_at: now,
            generated_by_role: currentRole(),
            source_mode: leadSourceMode,
            release_scope: {
                template_policy: "保留 Exomac 前端模板結構，只替換 TFSE 文案、資料、配置與功能接入。",
                static_mvp: true,
                target_documents: ["OPERATIONS_RUNBOOK.md", "DEPLOYMENT.md", "LAUNCH_CHECKLIST.md", "api-contract.json", "backend-schema.sql"]
            },
            readiness: {
                launch_ready_count: launch.ready_count,
                launch_pending_count: launch.pending_count,
                config_ready_count: config.ready_count,
                config_pending_count: config.pending_count,
                config_tracked_count: configPacket.record_summary.tracked_count,
                acceptance_ready_count: acceptance.ready_count,
                acceptance_pending_count: acceptance.pending_count,
                browser_passed_count: browser.passed_count,
                browser_pending_count: browser.pending_count,
                external_execution_tracked_count: externalExecution.record_summary.tracked_count,
                handoff_checkpoint_records: handoff.summary.checkpoint_records,
                legal_status_counts: legal.status_counts,
                release_status: blockers.length ? "hold_for_external_or_manual_items" : "ready_for_static_release"
            },
            required_commands: releaseRequiredCommands(),
            deployment_checks: [
                "部署前凍結內容與設定，不改版式。",
                "確認 sitemap、robots、feed、錯誤頁、_headers、security.txt 隨站發布。",
                "正式網域切換後執行 generate_seo_assets.py 並重跑驗收。",
                "外部服務填入後驗證 GA4、Meta、Server Event、Sentry、Search Console、Line OA。"
            ],
            rollback_plan: [
                "保留上一個可用靜態部署版本或主機快照。",
                "若主站不可用，先回滾靜態部署，再驗證 index.html、database.html、free-check.html、admin.html 與 404.html。",
                "若正式 API 異常，先停止寫入或切維護，不用 localStorage 覆蓋正式資料。",
                "回滾後記錄影響頁面、時間、修復版本與原因。"
            ],
            artifact_summary: {
                backup_format: backup.format,
                backup_leads: backup.data.leads.length,
                backup_events: backup.data.events.length,
                seo_submission_format: seo.format,
                seo_canonical_pages: seo.counts.canonical_pages,
                seo_published_articles: seo.counts.published_articles,
                domain_cutover_format: domain.format,
                domain_cutover_blockers: domain.summary.blockers,
                migration_format: migration.format,
                migration_seed_products: migration.summary.seed_products,
                migration_seed_articles: migration.summary.seed_articles,
                migration_local_leads: migration.summary.local_leads,
                import_validation_format: importValidation.format,
                import_validation_blockers: importValidation.summary.blockers,
                backend_acceptance_format: backendAcceptance.format,
                backend_acceptance_blockers: backendAcceptance.summary.blockers,
                legal_review_format: legal.format,
                browser_acceptance_format: browser.format,
                config_input_format: configPacket.format,
                config_input_tracked: configPacket.record_summary.tracked_count,
                external_execution_format: externalExecution.format,
                external_execution_tracked: externalExecution.record_summary.tracked_count,
                launch_handoff_format: handoff.format,
                launch_handoff_records: handoff.summary.checkpoint_records
            },
            blockers: blockers,
            handoff_notes: [
                "此包是靜態 MVP 與正式部署交接清單，不取代正式後端備份、法務意見或外部服務收件驗證。",
                "正式上線前需將 external_pending 和 manual_browser 項逐項留痕或由責任人簽核。",
                "如需正式後端接入，先匯出 tfse_formal_backend_migration_package，再依 PRODUCTION_BACKEND_PLAN.md 匯入。"
            ],
            related_exports: [
                "tfse_launch_health_check",
                "tfse_domain_cutover_package",
                "tfse_external_verification_evidence",
                "tfse_owner_cutover_bundle",
                "tfse_release_day_runsheet",
                "tfse_launch_handoff_manifest",
                "tfse_operations_task_queue",
                "tfse_incident_response_package"
            ]
        };
    }

    function operationsTaskPayload() {
        var launch = launchHealthPayload();
        var config = configReadinessPayload();
        var configPacket = formalConfigInputPacketPayload();
        var externalExecutionPacket = externalExecutionPacketPayload();
        var handoffManifest = launchHandoffManifestPayload();
        var acceptance = acceptanceChecklistPayload();
        var browser = browserAcceptanceReportPayload();
        var legal = legalReviewPayload();
        var source = sourceReviewPayload();
        var privacy = privacyRequestPayload();
        var formRisk = formRiskPayload();
        var seo = seoSubmissionPayload();
        var domain = domainCutoverPayload();
        var configDraft = configDraftPayload();
        var monitoring = monitoringReceiptPayload();
        var sentry = sentryVerificationPayload();
        var trackingConsent = trackingConsentPayload();
        var release = releaseReadinessPayload();
        var backendAcceptance = backendAcceptancePayload();
        var importValidation = importValidationPayload();
        var backupReceipt = backupReceiptPayload();
        var tasks = [];
        function add(group, key, title, owner_role, status, priority, evidence, next_action, related_export) {
            tasks.push({
                group: group,
                key: key,
                title: title,
                owner_role: owner_role,
                status: status,
                priority: priority,
                evidence: evidence,
                next_action: next_action,
                related_export: related_export
            });
        }
        add("上線配置", "production_config", "正式配置待填與驗證", "data_manager", config.pending_count ? "pending_external" : "ready", config.pending_count ? "high" : "normal", "正式配置待辦 " + config.pending_count + " 項", "填入正式網域、追蹤、後端、安全與 Line OA 後重驗。", "tfse_production_config_readiness");
        add("上線配置", "config_input_tracking", "正式配置收件留痕", "data_manager", configPacket.pending_count ? (configPacket.record_summary.tracked_count ? "manual_external" : "pending_external") : "ready", configPacket.pending_count ? "high" : "normal", "待填 " + configPacket.pending_count + " 項；已留痕 " + configPacket.record_summary.tracked_count + " 項", "逐項保存 received / validated / blocked 與 owner 備註。", "tfse_formal_config_input_packet");
        add("上線配置", "site_config_update", "site-config 更新草稿預檢", "data_manager", configDraft.status === "ready_for_manual_merge" ? "manual_external" : "pending_external", configDraft.validation.errors.length ? "high" : "normal", "草稿錯誤 " + configDraft.validation.errors.length + " 項；警告 " + configDraft.validation.warnings.length + " 項", "貼上正式配置片段，匯出更新包，人工合併後重生 SEO 資產並重跑驗收。", "tfse_site_config_update_package");
        add("上線配置", "launch_health", "上線健康檢查", "data_manager", launch.pending_count ? "pending_external" : "ready", launch.pending_count ? "high" : "normal", "健康檢查待辦 " + launch.pending_count + " 項", "外部服務完成後驗證收件與導向。", "tfse_launch_health_check");
        add("SEO", "seo_submission", "Search Console 與 sitemap 提交", "content_editor", seo.blockers.length ? "pending_external" : "ready", seo.blockers.length ? "high" : "normal", "SEO 提交阻擋 " + seo.blockers.length + " 項", "base_url 與驗證碼完成後提交 sitemap 並抽查 canonical / JSON-LD。", "tfse_seo_submission_package");
        add("SEO", "domain_cutover", "正式網域切換交接", "data_manager", domain.blockers.length ? "pending_external" : "ready", domain.blockers.length ? "high" : "normal", "網域切換阻擋 " + domain.blockers.length + " 項", "更新 base_url、重生 SEO 資產、驗證 Search Console 與 sitemap。", "tfse_domain_cutover_package");
        add("基礎設施", "https_ingress", "HTTPS 443 公網入站修復", "infra_owner", "pending_external", "high", "需執行 python3 tools/https_ingress_fix_package.py --markdown 取得 TCP 22/80/443 證據", "開放雲安全組與主機防火牆 443，確認反代與 TLS 憑證後重跑 strict HTTPS 驗收。", "tfse_https_ingress_fix_package");
        add("監控", "monitoring_receipt", "GA4/Meta/Sentry 收件驗收", "data_manager", monitoring.summary.blockers ? "pending_external" : "ready", monitoring.summary.blockers ? "high" : "normal", "監控阻擋 " + monitoring.summary.blockers + " 項", "填入正式追蹤配置後逐項核對收件並保存外部留痕。", "tfse_monitoring_receipt_checklist");
        add("監控", "sentry_error_verification", "Sentry 錯誤收件驗收", "data_manager", sentry.blockers.length ? "pending_external" : "ready", sentry.blockers.length ? "high" : "normal", "Sentry 阻擋 " + sentry.blockers.length + " 項", "正式 DSN 與 API Sentry 上線後保存測試錯誤、遮罩與 issue 證據。", "tfse_sentry_error_verification_package");
        add("監控", "tracking_consent", "外部追蹤同意留痕", "data_manager", trackingConsent.blockers.length ? "pending_external" : "ready", trackingConsent.blockers.length ? "high" : "normal", "追蹤同意阻擋 " + trackingConsent.blockers.length + " 項", "正式 GA4/Meta/Server Event 收件前確認使用者同意事件與隱私頁說明。", "tfse_tracking_consent_audit");
        add("合規", "legal_review", "法務/合規送審", "compliance_reviewer", ((legal.status_counts.external_pending || 0) + (legal.status_counts.manual_external || 0) + (legal.status_counts.needs_review || 0)) ? "needs_review" : "ready", "high", "送審項目 " + legal.items.length + " 項", "投流、SEO 收錄或 Line OA 對外承接前完成外部複核。", "tfse_legal_compliance_review_package");
        add("合規", "form_risk", "表單防刷與隱私同意檢查", "compliance_reviewer", formRisk.risk_notes.length ? "monitor" : "ready", "normal", "風險提示 " + formRisk.risk_notes.length + " 項", "POST /api/leads 上線時驗證 Turnstile、限流、蜜罐與重複提交。", "tfse_form_risk_control_report");
        add("後端", "backend_acceptance", "正式 API 驗收矩陣", "data_manager", backendAcceptance.summary.api_configured ? "manual_external" : "pending_external", "high", "API 驗收阻擋 " + backendAcceptance.summary.blockers + " 項", "正式 API URL、登入、資料庫、審計與備份完成後逐項驗收。", "tfse_backend_acceptance_matrix");
        add("後端", "import_validation", "正式資料導入驗收", "data_manager", importValidation.summary.blockers ? "needs_review" : "ready", importValidation.summary.blockers ? "high" : "normal", "導入阻擋 " + importValidation.summary.blockers + " 項", "匯入正式後端前排除測試資料並核對來源、個資與 Line 分群。", "tfse_import_validation_package");
        add("備份", "backup_receipt_verification", "正式備份收據與還原結果驗收", "data_manager", backupReceipt.blockers.length ? "pending_external" : "ready", backupReceipt.blockers.length ? "high" : "normal", "備份收據阻擋 " + backupReceipt.blockers.length + " 項", "正式備份排程與隔離還原完成後保存 checksum、RPO/RTO 與 audit_logs。", "tfse_backup_receipt_verification_package");
        add("資料", "source_review", "資料來源復核", "data_manager", source.items.length ? "needs_review" : "ready", source.items.length ? "high" : "normal", "來源復核 " + source.items.length + " 筆", "優先處理待核驗、需更新或超期資料。", "source_review_tasks");
        add("個資", "privacy_requests", "個資查詢/更正/刪除請求", "compliance_reviewer", privacy.items.filter(function (item) { return item.request_status !== "completed"; }).length ? "pending" : "ready", "high", "累計請求 " + privacy.items.length + " 筆", "正式版需同步刪除、遮罩或更正並保存審計。", "tfse_privacy_request_queue");
        add("驗收", "browser_acceptance", "人工瀏覽器驗收留痕", "viewer", browser.pending_count ? "manual_browser" : "ready", browser.pending_count ? "high" : "normal", "待留痕 " + browser.pending_count + " 項", "補齊桌面與手機證據備註。", "tfse_browser_acceptance_report");
        add("驗收", "acceptance_checklist", "第 17 章上線驗收清單", "data_manager", acceptance.pending_count ? "pending" : "ready", acceptance.pending_count ? "high" : "normal", "待驗 " + acceptance.pending_count + " 項", "完成或簽核 manual_browser / external_pending。", "tfse_acceptance_checklist");
        add("切換", "external_execution_tracking", "外部執行交接留痕", "data_manager", externalExecutionPacket.ready_for_external_execution_count ? (externalExecutionPacket.record_summary.tracked_count ? "manual_external" : "pending_external") : "ready", externalExecutionPacket.ready_for_external_execution_count ? "high" : "normal", "可執行 " + externalExecutionPacket.ready_for_external_execution_count + " 項；已留痕 " + externalExecutionPacket.record_summary.tracked_count + " 項", "按任務保存 in_progress / completed / blocked 與去識別執行摘要。", "tfse_external_execution_packet");
        add("切換", "launch_handoff_checkpoints", "最終上線總交接會議留痕", "data_manager", handoffManifest.summary.checkpoint_records ? "manual_external" : "pending_external", handoffManifest.summary.checkpoint_records ? "normal" : "high", "checkpoint 留痕 " + handoffManifest.summary.checkpoint_records + " 筆", "保存 config_sync / external_execution / legal_signoff / release_gate 決議。", "tfse_launch_handoff_manifest");
        add("發布", "release_readiness", "發布凍結與回滾交接", "data_manager", release.blockers.length ? "hold" : "ready", release.blockers.length ? "high" : "normal", "發布阻擋 " + release.blockers.length + " 項", "部署前確認凍結、命令、備份/遷移與回滾。", "tfse_release_readiness_package");
        add("備份", "restore_drill", "正式備份與還原演練", "data_manager", "external_pending", "high", "本機備份包不可取代正式資料庫備份", "正式 PostgreSQL 啟用每日備份與每週 restore drill。", "backup_jobs");
        add("Line", "line_oa", "正式 Line OA 圖文選單與分群", "content_editor", launch.items.find(function (item) { return item.key === "line_oa"; }).done ? "manual_external" : "pending_external", "high", "Line OA URL 與 line-flows.json", "依設定包建立歡迎語、quick reply、標籤並驗證導向。", "tfse_line_oa_setup_package");
        var statusCounts = tasks.reduce(function (bucket, task) {
            bucket[task.status] = (bucket[task.status] || 0) + 1;
            return bucket;
        }, {});
        return {
            format: "tfse_operations_task_queue",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source_mode: leadSourceMode,
            privacy_note: "運維任務隊列只輸出任務、責任角色、狀態與聚合證據，不輸出完整手機、Line ID 或表單補充說明。",
            status_counts: statusCounts,
            tasks: tasks,
            next_review_cycle: "weekly",
            runbook: "OPERATIONS_RUNBOOK.md",
            related_exports: [
                "tfse_release_readiness_package",
                "tfse_external_verification_evidence",
                "tfse_incident_response_package",
                "tfse_owner_cutover_bundle",
                "tfse_release_day_runsheet"
            ]
        };
    }

    function incidentResponsePayload() {
        var errors = getErrors();
        var events = getEvents();
        var release = releaseReadinessPayload();
        var ops = operationsTaskPayload();
        var topErrorSources = sortCountMap(groupCount(errors, function (error) {
            return error.source || "unknown";
        }));
        var recentErrors = errors.slice(0, 20).map(function (error) {
            return {
                source: error.source || "",
                message: String(error.message || "").slice(0, 180),
                at: error.at || ""
            };
        });
        var p0Triggers = [
            "免費財務健檢查詢無法提交",
            "Admin 未授權可見",
            "正式個資外洩或疑似外洩",
            "全站不可用"
        ];
        var p1Triggers = [
            "主要資料庫或分類頁不可用",
            "Line OA 導流失效",
            "GA4 / Sentry / Server Event 全部中斷",
            "Search Console 發現大量索引錯誤"
        ];
        return {
            format: "tfse_incident_response_package",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source_mode: leadSourceMode,
            severity_hint: errors.length ? "investigate" : "no_active_local_error",
            privacy_note: "事故響應包只輸出錯誤來源、去識別訊息、時間與聚合任務，不輸出完整手機、Line ID 或表單補充說明。",
            signals: {
                local_error_count: errors.length,
                event_count: events.length,
                release_blockers: release.blockers.length,
                high_priority_operations_tasks: ops.tasks.filter(function (task) {
                    return task.priority === "high" && task.status !== "ready";
                }).length
            },
            top_error_sources: topErrorSources,
            recent_errors: recentErrors,
            severity_triggers: {
                p0: p0Triggers,
                p1: p1Triggers
            },
            response_steps: [
                "先判定 P0/P1 與影響頁面，涉及個資、登入或錯誤導流時先停用入口或回滾。",
                "檢查 Sentry、Server Event、部署紀錄、API logs 與 tfse_errors。",
                "若靜態站不可用，回滾上一個可用部署版本並驗證 index.html、database.html、free-check.html、admin.html。",
                "正式 API 異常時停止寫入或切維護，不用 localStorage 覆蓋正式資料。",
                "修復後重跑審計與煙測，記錄原因、處置、回滾時間與復盤。"
            ],
            verification_commands: [
                "python3 tools/compliance_scan.py",
                "python3 tools/validate_site_config.py",
                "python3 tools/verify_static_site.py",
                "NODE_PATH=/path/to/node_modules node tools/browser_acceptance_verify.mjs"
            ],
            related_exports: [
                "tfse_release_readiness_package",
                "tfse_operations_task_queue",
                "tfse_server_event_replay_queue",
                "tfse_browser_acceptance_report",
                "tfse_local_backup",
                "tfse_owner_cutover_bundle",
                "tfse_release_day_runsheet",
                "tfse_launch_handoff_manifest"
            ]
        };
    }

    function externalVerificationPayload() {
        var records = getExternalVerificationRecords();
        var launch = launchHealthPayload();
        var config = configReadinessPayload();
        var required = [
            { service: "ga4", label: "GA4 事件收件", configured: !!((siteConfigData.analytics || {}).ga4_measurement_id) },
            { service: "meta_pixel", label: "Meta Pixel 事件收件", configured: !!((siteConfigData.analytics || {}).meta_pixel_id) },
            { service: "server_event", label: "Server Event endpoint", configured: !!((siteConfigData.analytics || {}).server_event_endpoint) },
            { service: "sentry", label: "Sentry 錯誤收件", configured: !!((siteConfigData.analytics || {}).sentry_dsn) },
            { service: "search_console", label: "Search Console / sitemap", configured: !!((siteConfigData.search_console || {}).google_site_verification) },
            { service: "line_oa", label: "Line OA 導向", configured: !!((siteConfigData.line || {}).oa_url) && (siteConfigData.line || {}).oa_url !== "free-check.html#line-cta" },
            { service: "backend_api", label: "正式後端 API", configured: (siteConfigData.backend || {}).mode === "api" && !!((siteConfigData.backend || {}).api_base_url) },
            { service: "legal_review", label: "法務合規複核", configured: false }
        ];
        var latestPassed = records.reduce(function (bucket, record) {
            if (record.result === "passed" && !bucket[record.service]) bucket[record.service] = record;
            return bucket;
        }, {});
        var items = required.map(function (item) {
            var record = latestPassed[item.service] || null;
            return {
                service: item.service,
                label: item.label,
                configured: item.configured,
                verified: !!record,
                latest_passed_at: record ? record.checked_at : "",
                owner: record ? record.owner : "",
                evidence_note: record ? record.evidence_note : ""
            };
        });
        return {
            format: "tfse_external_verification_evidence",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            privacy_note: "外部驗證只保存服務、結果、責任人與證據備註，不填個資。",
            source_exports: ["tfse_launch_health_check", "tfse_production_config_readiness", "tfse_release_readiness_package"],
            summary: {
                required_items: items.length,
                configured_items: items.filter(function (item) { return item.configured; }).length,
                verified_items: items.filter(function (item) { return item.verified; }).length,
                launch_pending_count: launch.pending_count,
                config_pending_count: config.pending_count
            },
            items: items,
            records: records.slice(0, 100)
        };
    }

    function legalReviewItems() {
        var launch = launchHealthPayload();
        var configReady = configReadinessPayload();
        var acceptance = acceptanceChecklistPayload();
        return [
            { group: "站點邊界", key: "disclaimer", label: "全站免責聲明與非代辦邊界", status: "ready", evidence: "所有頁面保留 TFSE 免責聲明；禁止承諾核貸、代收證件或代辦送件" },
            { group: "表單個資", key: "lead_form_fields", label: "免費財務健檢查詢表單欄位與個資告知", status: "ready", evidence: "表單只收稱呼、手機、Line ID、地區、需求、身份、收入型態與補充說明；不收證件、帳戶、卡號或密碼" },
            { group: "Line 承接", key: "line_flow", label: "Line OA 歡迎語、自動回覆與分群標籤", status: "external_pending", evidence: "line-flows.json 已建立話術與 quick reply；正式 Line OA 需外部照表建立並驗證" },
            { group: "廣告投流", key: "ad_campaigns", label: "廣告落地頁文案、UTM 與 CTA", status: "ready", evidence: "廣告投流檢查清單涵蓋 " + adCampaignItems().length + " 個落地頁，投流前需由合規複核" },
            { group: "資料來源", key: "source_review", label: "產品/機構來源與 90 天復核", status: sourceReviewItems().length ? "needs_review" : "ready", evidence: "來源復核隊列目前 " + sourceReviewItems().length + " 筆；正式發布需逐筆核對官方來源" },
            { group: "文案規則", key: "copy_scan", label: "禁用詞、敏感個資與高風險 CTA", status: "ready", evidence: "compliance-rules.json 與文案即時預檢共用規則；命令列 compliance_scan 已納入驗收" },
            { group: "隱私請求", key: "privacy_requests", label: "查詢/更正/刪除請求流程", status: "ready", evidence: "Admin 可標記、匯出與完成個資請求隊列；正式版需同步資料庫刪除或遮罩" },
            { group: "正式配置", key: "production_config", label: "正式網址、追蹤、Search Console、Sentry、Line OA", status: configReady.pending_count ? "external_pending" : "ready", evidence: "正式配置交接包 pending " + configReady.pending_count + " 項；上線健康檢查 pending " + launch.pending_count + " 項" },
            { group: "驗收留痕", key: "acceptance", label: "人工瀏覽器驗收與外部配置驗證", status: acceptance.pending_count ? "manual_external" : "ready", evidence: "上線驗收清單 pending " + acceptance.pending_count + " 項；自動煙測不可取代法務與人工視覺確認" }
        ];
    }

    function legalReviewPayload() {
        var items = legalReviewItems();
        var statusCounts = items.reduce(function (bucket, item) {
            bucket[item.status] = (bucket[item.status] || 0) + 1;
            return bucket;
        }, {});
        return {
            format: "tfse_legal_compliance_review_package",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            status_counts: statusCounts,
            items: items,
            required_external_review: [
                "廣告文案與落地頁主張",
                "免費財務健檢查詢表單欄位與個資告知",
                "隱私權政策、使用條款、免責聲明與來源政策",
                "Line OA 歡迎語、自動回覆、分群標籤與退訂/停止接收處理",
                "金融資訊呈現方式是否可能被誤認為代辦、放款或保證核貸"
            ],
            evidence_files: [
                "assets/data/compliance-rules.json",
                "assets/data/line-flows.json",
                "assets/data/landing-pages.json",
                "assets/data/products.json",
                "privacy.html",
                "terms.html",
                "disclaimer.html",
                "source-policy.html",
                "LAUNCH_CHECKLIST.md",
                "OPERATIONS_RUNBOOK.md"
            ],
            related_exports: [
                "tfse_ad_campaign_checklist",
                "tfse_source_review_queue",
                "tfse_privacy_request_queue",
                "tfse_line_segment_queue",
                "tfse_acceptance_checklist",
                "tfse_production_config_readiness",
                "tfse_form_risk_control_report"
            ]
        };
    }

    function legalExternalReviewPayload() {
        var legal = legalReviewPayload();
        var external = externalVerificationPayload();
        var legalRecords = external.records.filter(function (record) {
            return record.service === "legal_review";
        });
        var latestPassed = legalRecords.filter(function (record) {
            return record.result === "passed";
        })[0] || null;
        var openItems = legal.items.filter(function (item) {
            return item.status !== "ready";
        });
        return {
            format: "tfse_legal_external_review_evidence",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            privacy_note: "外部複核留痕只保存服務、結果、責任人、時間與摘要，不保存完整個資、證件、帳戶、卡號或法律意見全文。",
            status: latestPassed ? "external_review_passed" : (legalRecords.length ? "external_review_in_progress" : "pending_external_review"),
            summary: {
                legal_review_items: legal.items.length,
                open_items: openItems.length,
                external_records: legalRecords.length,
                latest_passed_at: latestPassed ? latestPassed.checked_at : "",
                latest_owner: latestPassed ? latestPassed.owner : ""
            },
            required_external_review: legal.required_external_review,
            evidence_package: {
                source_format: legal.format,
                evidence_files: legal.evidence_files,
                related_exports: legal.related_exports.concat(["tfse_external_verification_evidence"])
            },
            signoff_requirements: [
                "複核廣告落地頁、首頁、免費財務健檢查詢、Line OA 話術與 SEO 文章是否維持資訊服務邊界。",
                "確認表單、隱私權政策、使用條款、免責聲明與資料來源政策沒有要求高敏資料或暗示代辦。",
                "確認所有需修改項目完成後，於外部配置驗證留痕選擇 legal_review 並保存去識別證據摘要。",
                "正式投流、SEO 大量收錄或 Line OA 對外承接前，需保留 reviewer、reviewed_at、result、evidence_note 與相關匯出包版本。"
            ],
            open_items: openItems,
            records: legalRecords,
            related_exports: ["tfse_legal_compliance_review_package", "tfse_external_verification_evidence", "tfse_acceptance_checklist"]
        };
    }

    function complianceApiPersistencePayload() {
        var reviews = getComplianceReviews();
        var audit = getAuditLog();
        var reviewsWithScan = reviews.filter(function (review) {
            return review.scan_payload;
        });
        var resultCounts = reviews.reduce(function (bucket, review) {
            bucket[review.result] = (bucket[review.result] || 0) + 1;
            return bucket;
        }, {});
        var sensitiveScanFindings = reviewsWithScan.filter(function (review) {
            return review.scan_payload && review.scan_payload.has_sensitive_ask;
        }).length;
        return {
            format: "tfse_compliance_api_persistence_package",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            privacy_note: "此驗收包只保存合規審核與掃描摘要、角色、狀態碼與 audit log ID；不得保存法律意見全文、session token、CSRF token、完整手機、Line ID、證件、帳戶、卡號或密碼。",
            status: reviews.length && audit.some(function (item) { return item.action === "compliance_review_save"; }) ? "ready_for_compliance_api_persistence" : "pending_compliance_api_persistence",
            backend_target: {
                write_endpoint: "POST /api/admin/compliance/review",
                audit_endpoint: "GET /api/admin/audit-logs",
                target_tables: ["compliance_reviews", "audit_logs"],
                allowed_roles: ["super_admin", "compliance_reviewer"],
                required_auth: ["server_session", "csrf", "rbac"]
            },
            local_context: {
                review_count: reviews.length,
                reviews_with_scan_payload: reviewsWithScan.length,
                sensitive_scan_findings: sensitiveScanFindings,
                audit_compliance_events: audit.filter(function (item) {
                    return item.action === "compliance_review_save" || item.action === "compliance_copy_scan";
                }).length,
                result_counts: resultCounts
            },
            required_controls: [
                "正式 API 必須以 server session、CSRF 與 RBAC 驗證 super_admin / compliance_reviewer 權限。",
                "每次審核寫入 compliance_reviews，並同步寫入 audit_logs，audit log 不保存 token、密碼或完整個資。",
                "scan_payload 僅保存禁用詞、免責聲明、高風險 CTA 與敏感要求摘要，拒收證件、帳戶、卡號、密碼等高敏原文。",
                "approved / needs_revision / rejected 三種結果需與前台發布、廣告投放和內容 API 切換流程關聯。",
                "未授權角色與 viewer 執行寫入時必須回傳拒絕狀態，並留下去識別 audit_logs。"
            ],
            test_cases: [
                { key: "create_page_review", request: { type: "page", result: "approved" }, expected: "201/200，返回 review.id 與 audit_log.id" },
                { key: "create_ad_review_with_scan_payload", request: { type: "ad", result: "needs_revision", scan_payload: "summary_only" }, expected: "scan payload 摘要入 compliance_reviews，敏感欄位被遮罩或拒收" },
                { key: "reject_product_review", request: { type: "product", result: "rejected" }, expected: "產品不可進入 published/投流流程，audit_logs 可追溯" },
                { key: "deny_viewer_write", request: { role: "viewer" }, expected: "403，寫入被拒絕，無 compliance_reviews 新增" },
                { key: "audit_log_query", request: { action: "compliance_review_save" }, expected: "GET /api/admin/audit-logs 可查到去識別審計紀錄" }
            ],
            evidence_fields: [
                "endpoint",
                "status_code",
                "review_id",
                "audit_log_id",
                "reviewer_role",
                "csrf_checked",
                "rbac_checked",
                "masked_fields_verified",
                "scan_payload_summary_only",
                "checked_at",
                "evidence_note"
            ],
            blockers: [
                "正式後端尚未提供 compliance_reviews / audit_logs 落庫截圖或查詢證據。",
                "尚需在 staging 以授權與未授權角色各跑一次 POST /api/admin/compliance/review。",
                "尚需確認 scan_payload 對高敏資料只保存摘要或拒收，不保存原文。"
            ],
            related_exports: [
                "tfse_legal_compliance_review_package",
                "tfse_legal_external_review_evidence",
                "tfse_form_risk_control_report",
                "tfse_content_api_cutover_package",
                "tfse_acceptance_checklist",
                "tfse_backend_acceptance_matrix"
            ]
        };
    }

    function contentVersionPayload() {
        var productOverrides = getProductOverrides();
        var articleOverrides = getArticleOverrides();
        var faqOverrides = getFaqOverrides();
        var productStatus = getProductStatusOverrides();
        var articleStatus = getArticleStatusOverrides();
        var audit = getAuditLog().filter(function (item) {
            return [
                "product_content_update",
                "product_status_update",
                "article_content_update",
                "article_review_submit",
                "article_review_approve",
                "article_review_reject",
                "article_review_reopen",
                "faq_content_update"
            ].indexOf(item.action) !== -1;
        });
        return {
            format: "tfse_content_version_snapshot",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source_mode: leadSourceMode,
            privacy_note: "內容版本紀錄只保存產品、文章、FAQ 覆蓋與狀態，不包含潛客手機、Line ID 或表單補充說明。",
            counts: {
                product_overrides: objectCount(productOverrides),
                product_status_overrides: objectCount(productStatus),
                article_overrides: objectCount(articleOverrides),
                article_status_overrides: objectCount(articleStatus),
                faq_overrides: objectCount(faqOverrides),
                audit_entries: audit.length
            },
            product_overrides: productOverrides,
            product_status: productStatus,
            article_overrides: articleOverrides,
            article_status: articleStatus,
            faq_overrides: faqOverrides,
            audit_trail: audit.slice(0, 100),
            restore_order: [
                "先匯入 seed data：products、articles、faq",
                "套用 product_status 與 product_overrides",
                "套用 article_status 與 article_overrides",
                "套用 faq_overrides",
                "比對 audit_trail 與正式後端版本紀錄後再發布"
            ]
        };
    }

    function contentApiCutoverPayload() {
        var backend = ((siteConfigData || {}).backend) || {};
        var contentVersion = contentVersionPayload();
        var publishedArticles = articleData.filter(function (item) {
            return articleStatus(item.id) === "published";
        });
        var sourceQueue = sourceReviewPayload();
        var blockers = [
            backend.mode === "api" && backend.api_base_url ? "" : "正式 backend.api_base_url 尚未配置，前台仍以靜態 JSON 為主要資料來源。",
            productData.length ? "" : "products.json 無 seed 資料。",
            publishedArticles.length ? "" : "尚無可供 API 發布的 published articles。",
            sourceQueue.items.length ? "仍有 " + sourceQueue.items.length + " 筆產品來源待復核，正式 API 切換前需處理或標記。" : ""
        ].filter(Boolean);
        return {
            format: "tfse_content_api_cutover_package",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            status: blockers.length ? "pending_content_api_cutover" : "ready_for_content_api_cutover",
            privacy_note: "此包只保存公開內容、seed 數量、端點與驗收欄位，不保存潛客手機、Line ID、表單備註、後台 session 或 API token。",
            backend_target: {
                mode: backend.mode || "localStorage",
                api_base_url_configured: !!(backend.mode === "api" && backend.api_base_url),
                expected_public_endpoints: ["/api/products", "/api/products/:slug", "/api/articles", "/api/articles/:slug", "/api/institutions", "/api/search"],
                static_fallback_files: ["assets/data/products.json", "assets/data/articles.json", "assets/data/faq.json", "assets/data/institutions.json"]
            },
            seed_counts: {
                products: productData.length,
                articles: articleData.length,
                published_articles: publishedArticles.length,
                faq: faqData.length,
                institutions: institutionData.length,
                landing_pages: landingPageData.length
            },
            content_state: {
                product_overrides: contentVersion.counts.product_overrides,
                product_status_overrides: contentVersion.counts.product_status_overrides,
                article_overrides: contentVersion.counts.article_overrides,
                article_status_overrides: contentVersion.counts.article_status_overrides,
                faq_overrides: contentVersion.counts.faq_overrides,
                source_review_pending: sourceQueue.items.length
            },
            required_api_checks: [
                { endpoint: "GET /api/products", expected: "回傳公開產品列表，不包含後台覆蓋審計或個資" },
                { endpoint: "GET /api/products/:slug", expected: "slug、source_url、updated_at、status 與靜態詳情頁一致" },
                { endpoint: "GET /api/articles", expected: "只回傳 published 文章，不暴露 draft / in_review / rejected" },
                { endpoint: "GET /api/articles/:slug", expected: "SEO title、description、published_at、updated_at 可用" },
                { endpoint: "GET /api/institutions", expected: "官方來源 URL、verification_status 與 institution_source_versions 可追溯" },
                { endpoint: "GET /api/search", expected: "產品、文章、機構搜尋不回傳敏感資料或未發布內容" }
            ],
            validation_steps: [
                "先匯出 tfse_content_version_snapshot，確認內容覆蓋與審計順序。",
                "在 staging 設定 backend.api_base_url，逐項比對靜態 JSON 與 API 回應的公開欄位。",
                "確認 articles API 只輸出 published 文章，前台 blog/detail 不可顯示草稿或退回內容。",
                "確認 source_url、updated_at、免責聲明與資料來源政策仍在前台可見。",
                "API 異常時前台可 fallback 靜態 seed，但不得把 localStorage 後台覆蓋誤當正式資料。"
            ],
            evidence_fields: ["endpoint", "status_code", "row_count", "sample_slug", "matches_static_seed", "published_only", "source_url_checked", "audit_log_id", "reviewer_role", "checked_at", "evidence_note"],
            blockers: blockers,
            related_exports: ["tfse_content_version_snapshot", "tfse_institution_import_verification_package", "tfse_source_verification_evidence", "tfse_backend_acceptance_matrix", "tfse_external_verification_evidence"]
        };
    }

    function groupedItems(items, keyFn) {
        return items.reduce(function (bucket, item) {
            var key = keyFn(item) || "unknown";
            bucket[key] = bucket[key] || [];
            bucket[key].push(item);
            return bucket;
        }, {});
    }

    function duplicateLeadGroups(leads) {
        var groups = groupedItems(leads, function (lead) {
            return phoneLast3(lead.phone) + "|" + (lead.needs || "未填需求");
        });
        return Object.keys(groups).filter(function (key) {
            return groups[key].length > 1 && key.indexOf("|") > 0;
        }).map(function (key) {
            return {
                key: key,
                count: groups[key].length,
                phone_last3: key.split("|")[0],
                needs: key.split("|")[1],
                latest_submitted_at: groups[key].map(function (lead) { return lead.submitted_at || ""; }).sort().reverse()[0] || ""
            };
        }).sort(function (a, b) { return b.count - a.count; });
    }

    function leadDedupePayload() {
        var leads = getLeads();
        var groups = groupedItems(leads, function (lead) {
            return phoneLast3(lead.phone) + "|" + (lead.needs || "未填需求");
        });
        var items = Object.keys(groups).filter(function (key) {
            return key.indexOf("|") > 0 && groups[key].length > 1;
        }).map(function (key) {
            var groupLeads = groups[key].slice().sort(function (a, b) {
                return String(b.submitted_at || "").localeCompare(String(a.submitted_at || ""));
            });
            var primary = groupLeads[0] || {};
            return {
                dedupe_key: key,
                phone_last3: key.split("|")[0],
                needs: key.split("|")[1],
                count: groupLeads.length,
                suggested_primary_lead_id: primary.id || "",
                candidate_lead_ids: groupLeads.map(function (lead) { return lead.id; }).filter(Boolean),
                statuses: topCountItems(groupLeads.reduce(function (bucket, lead) {
                    bucket[lead.status || "new"] = (bucket[lead.status || "new"] || 0) + 1;
                    return bucket;
                }, {}), 5),
                sources: topCountItems(groupLeads.reduce(function (bucket, lead) {
                    var source = lead.utm_source || lead.source_channel || "direct";
                    bucket[source] = (bucket[source] || 0) + 1;
                    return bucket;
                }, {}), 5),
                latest_submitted_at: primary.submitted_at || "",
                recommended_action: "正式 CRM 以完整手機雜湊 + needs + 24 小時窗口確認後，保留最新主紀錄並將其他紀錄標記為 duplicate_closed 或關聯到同一聯繫歷史。"
            };
        }).sort(function (a, b) {
            return b.count - a.count || String(b.latest_submitted_at).localeCompare(String(a.latest_submitted_at));
        });
        return {
            format: "tfse_lead_dedupe_queue",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            privacy_note: "此隊列只輸出 lead id、手機末三碼、需求、狀態與來源聚合，不輸出完整手機、Line ID 或補充說明。",
            dedupe_policy: {
                formal_key: "phone_hash + needs + 24h window",
                local_mvp_key: "phone_last3 + needs",
                retention: "保留最新主紀錄，將重複紀錄關聯到主紀錄或標記 closed/spam，並寫入 audit_logs。"
            },
            counts: {
                total_leads: leads.length,
                duplicate_groups: items.length,
                duplicate_leads: items.reduce(function (sum, item) { return sum + item.count; }, 0)
            },
            items: items,
            related_exports: ["tfse_form_risk_control_report", "tfse_crm_follow_up_queue", "tfse_crm_contact_log", "tfse_formal_backend_migration_package"]
        };
    }

    function formRiskPayload() {
        var leads = getLeads();
        var events = getEvents();
        var turnstile = (((siteConfigData || {}).security || {}).turnstile) || {};
        var deviceGroups = groupedItems(leads, function (lead) { return lead.device_id || "missing_device"; });
        var repeatedDevices = Object.keys(deviceGroups).filter(function (key) {
            return key !== "missing_device" && deviceGroups[key].length > 1;
        }).map(function (key) {
            return {
                device_id: key,
                count: deviceGroups[key].length,
                phone_last3_samples: deviceGroups[key].map(function (lead) { return phoneLast3(lead.phone); }).filter(Boolean).slice(0, 5)
            };
        }).sort(function (a, b) { return b.count - a.count; });
        var missingConsent = leads.filter(function (lead) { return !lead.consent_privacy; });
        var missingDevice = leads.filter(function (lead) { return !lead.device_id; });
        var duplicateGroups = duplicateLeadGroups(leads);
        var leadSubmitEvents = events.filter(function (event) { return event.name === "lead_submit"; }).length;
        var risks = [];
        if (!turnstile.enabled || !turnstile.site_key) risks.push("正式上線前需填入 Cloudflare Turnstile site key，並由後端驗證 token。");
        if (duplicateGroups.length) risks.push("發現重複手機末三碼與需求組合，正式 API 需依完整手機雜湊 + needs 做 24 小時去重。");
        if (repeatedDevices.length) risks.push("發現同一 device_id 多筆線索，正式 API 需搭配 IP + device fingerprint 限流。");
        if (missingConsent.length) risks.push("發現缺少隱私同意的線索，正式匯入前需排除或補正。");
        if (missingDevice.length) risks.push("部分線索缺少 device_id，正式 API 應在伺服器端補充限流依據。");
        if (!risks.length) risks.push("本機資料未發現明顯重複或同意缺漏；正式上線仍需伺服器端限流、Turnstile 驗證與審計。");
        return {
            format: "tfse_form_risk_control_report",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source_mode: leadSourceMode,
            privacy_note: "防刷檢查包只輸出聚合風險、device_id 與手機末三碼樣本，不匯出完整手機、Line ID、補充說明或 Turnstile token。",
            controls: {
                local_cooldown_seconds: 60,
                local_deduplicate_window_hours: 24,
                honeypot_field: "website",
                turnstile_configured: !!(turnstile.enabled && turnstile.site_key),
                required_backend_controls: [
                    "Cloudflare Turnstile token server-side verification",
                    "rate limit by IP + device_id",
                    "deduplicate same phone hash + needs within 24 hours",
                    "reject non-empty website honeypot field",
                    "audit log for rejected, duplicate or suspicious submissions"
                ]
            },
            counts: {
                leads: leads.length,
                lead_submit_events: leadSubmitEvents,
                duplicate_groups: duplicateGroups.length,
                repeated_devices: repeatedDevices.length,
                missing_privacy_consent: missingConsent.length,
                missing_device_id: missingDevice.length
            },
            duplicate_groups: duplicateGroups.slice(0, 20),
            repeated_devices: repeatedDevices.slice(0, 20),
            risk_notes: risks
        };
    }

    function turnstileBackendPayload() {
        var risk = formRiskPayload();
        var backend = ((siteConfigData || {}).backend) || {};
        var turnstile = (((siteConfigData || {}).security || {}).turnstile) || {};
        var apiConfigured = backend.mode === "api" && !!backend.api_base_url && isHttpsUrl(backend.api_base_url);
        var blockers = [
            apiConfigured ? "" : "正式 backend.api_base_url 尚未配置，無法驗證 POST /api/leads server-side siteverify。",
            turnstile.enabled && turnstile.site_key ? "" : "Cloudflare Turnstile site_key 尚未啟用；前端 widget 不會強制產生 token。",
            "Turnstile secret key 只能存在正式 API server / secrets manager，不得寫入 site-config.json、前端或匯出包。",
            "仍需正式後端以 Cloudflare siteverify 驗證 cf_turnstile_response、remoteip、timeout-or-duplicate 與失敗碼。"
        ].filter(Boolean);
        return {
            format: "tfse_turnstile_backend_verification_package",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            status: blockers.length ? "pending_turnstile_backend_verification" : "ready_for_turnstile_backend_verification",
            privacy_note: "此包只保存控制要求、測試步驟、失敗碼與證據欄位，不保存 Turnstile token、secret key、完整 IP、完整手機、Line ID 或備註。",
            frontend_config: {
                enabled: !!turnstile.enabled,
                site_key_configured: !!turnstile.site_key,
                token_field: "cf_turnstile_response",
                honeypot_field: "website",
                device_id_required: true
            },
            backend_target: {
                endpoint: "/api/leads",
                api_base_url_configured: apiConfigured,
                siteverify_endpoint: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                secret_env_name: "TFSE_TURNSTILE_SECRET_KEY"
            },
            required_controls: [
                "拒收空白 cf_turnstile_response。",
                "呼叫 Cloudflare siteverify，驗證 success、hostname/action 與錯誤碼。",
                "將 secret key 放在 API server secrets，不進 Git、不進前端、不進匯出包。",
                "非空 website 蜜罐欄位直接拒收並寫入 audit_logs。",
                "以 IP + device_id 對 POST /api/leads 做 10 分鐘與 24 小時限流。",
                "以 phone_hash + needs 做 24 小時去重，拒絕或關聯重複提交。",
                "拒收身分證、帳戶、卡號、密碼、證件影像等高敏資料。",
                "Turnstile 驗證失敗、限流、蜜罐、重複提交都需回傳安全錯誤並寫入去識別 audit_logs。"
            ],
            negative_test_cases: [
                { case_id: "missing_token", payload_change: "cf_turnstile_response 空白", expected: "400/403 rejected_turnstile_required" },
                { case_id: "invalid_token", payload_change: "cf_turnstile_response 使用無效字串", expected: "400/403 rejected_turnstile_invalid" },
                { case_id: "honeypot_filled", payload_change: "website 欄位填入任意內容", expected: "400 rejected_honeypot" },
                { case_id: "rate_limit", payload_change: "同 IP + device_id 連續提交超過限制", expected: "429 rate_limited" },
                { case_id: "duplicate_lead", payload_change: "同 phone_hash + needs 24 小時內重複", expected: "409 duplicate_or_linked" },
                { case_id: "sensitive_payload", payload_change: "message 含身分證/卡號/帳戶/密碼", expected: "400 rejected_sensitive_data" }
            ],
            validation_steps: [
                "部署正式 API 後，確認 TFSE_TURNSTILE_SECRET_KEY 只存在 server env 或 secrets manager。",
                "以瀏覽器提交正常免費財務健檢查詢，確認 widget token 送到 POST /api/leads 且 lead_forms 入庫。",
                "逐項執行 negative_test_cases，確認狀態碼、錯誤碼、audit_logs 與不入庫行為。",
                "抽查 server logs，確認沒有記錄 raw token、secret、完整 IP、完整手機或高敏 message。",
                "保存 checked_case、status_code、error_code、audit_log_id、lead_created、reviewer_role 與 evidence_note。"
            ],
            evidence_fields: ["checked_case", "status_code", "error_code", "audit_log_id", "lead_created", "rate_limit_key_hash", "checked_at", "reviewer_role", "evidence_note"],
            blockers: blockers,
            related_exports: ["tfse_form_risk_control_report", "tfse_backend_acceptance_matrix", "tfse_admin_auth_cutover_check", "tfse_external_verification_evidence"],
            form_risk_summary: {
                leads: risk.counts.leads,
                duplicate_groups: risk.counts.duplicate_groups,
                repeated_devices: risk.counts.repeated_devices,
                missing_device_id: risk.counts.missing_device_id,
                risk_notes: risk.risk_notes.length
            }
        };
    }

    function acceptanceChecklistItems() {
        var launch = launchHealthPayload();
        var launchReady = launch.ready_count;
        var launchPending = launch.pending_count;
        return [
            { group: "業務閉環", key: "home_to_database", label: "使用者能從首頁進入資料庫", done: true, evidence: "首頁導航、CTA 與需求查詢面板可導向 database.html / category.html" },
            { group: "業務閉環", key: "category_to_detail", label: "分類頁能進入資料詳情", done: true, evidence: "分類頁與資料庫卡片使用 products/{slug}.html" },
            { group: "業務閉環", key: "article_to_free_check", label: "文章頁能進入免費財務健檢查詢", done: true, evidence: "文章詳情 CTA 指向 free-check.html?utm_medium=article_cta" },
            { group: "業務閉環", key: "public_feedback_intake", label: "聯絡頁可提交低敏資料回報", done: false, status: "manual_browser", evidence: "需在 contact.html 提交低敏資料回報，確認本機工單建立，並以正式 API 模式重測送出成功。" },
            { group: "業務閉環", key: "lead_visible_in_admin", label: "表單提交後後台可見", done: true, evidence: "tfse-lead-form.js -> TFSEApi.submitLead，本機 fallback 寫入 tfse_leads，Admin CRM 讀取" },
            { group: "業務閉環", key: "utm_recorded", label: "表單記錄 UTM", done: true, evidence: "表單含 utm_source / utm_medium / utm_campaign / utm_content / utm_term" },
            { group: "業務閉環", key: "line_cta", label: "提交成功後可導向 Line", done: true, evidence: "site-config.json line.oa_url 與 lead_line_cta_shown / line_cta_click 事件" },
            { group: "業務閉環", key: "lead_status_update", label: "後台可更新潛客狀態", done: true, evidence: "Admin detail 可更新狀態並寫入 audit" },
            { group: "業務閉環", key: "product_maintenance", label: "管理員可維護資料庫", done: true, evidence: "Admin 可編輯產品摘要、來源與復核狀態" },
            { group: "業務閉環", key: "article_publish", label: "管理員可發布文章", done: true, evidence: "Admin 支援 draft / in_review / published 流程" },
            { group: "業務閉環", key: "compliance_review", label: "合規審核可記錄", done: true, evidence: "合規審核紀錄與文案即時預檢可寫入本機審計" },
            { group: "UI 驗收", key: "logo", label: "Logo 清晰", done: true, evidence: "Header / Footer 使用透明底 tfse-logo.png 並配置 alt" },
            { group: "UI 驗收", key: "template_preserved", label: "保持模板結構且無貸款廣告風", done: true, evidence: "未重做版式，套用金融資訊、合規與來源文案" },
            { group: "UI 驗收", key: "button_copy", label: "按鈕文案合規", done: true, evidence: "主要 CTA 使用免費財務健檢查詢、查看資訊、回到資料庫等中性文案" },
            { group: "UI 驗收", key: "mobile_browser", label: "手機端導航清楚", done: false, status: "manual_browser", evidence: "需以手機 viewport 實測 Header menu、主要 CTA、表單欄位與頁腳連結" },
            { group: "UI 驗收", key: "form_feedback", label: "表單錯誤與成功提示清楚", done: true, evidence: "lead form 使用 validity、冷卻、重複提交與成功 Line CTA 狀態" },
            { group: "UI 驗收", key: "empty_state", label: "空資料狀態清楚", done: true, evidence: "Admin、資料庫、文章、FAQ、事件均有空狀態文案" },
            { group: "UI 驗收", key: "no_text_overlap_browser", label: "頁面不出現文字重疊", done: false, status: "manual_browser", evidence: "需以桌面與手機 viewport 實測首頁、資料庫、文章、免費財務健檢查詢與 Admin 主要區塊" },
            { group: "合規驗收", key: "forbidden_terms", label: "全站無禁用詞越界", done: true, evidence: "tools/compliance_scan.py passed" },
            { group: "合規驗收", key: "disclaimer", label: "每頁有免責聲明", done: true, evidence: "verify_static_site.py 驗證 REQUIRED_DISCLAIMER" },
            { group: "合規驗收", key: "privacy_line_consent", label: "隱私與 Line 同意獨立", done: true, evidence: "表單含 consent_privacy 與 consent_line" },
            { group: "合規驗收", key: "no_sensitive_docs", label: "不收證件或高敏資料", done: true, evidence: "表單欄位與 API 合約排除證件、帳戶、卡號、密碼" },
            { group: "合規驗收", key: "product_sources", label: "產品資料有來源與更新日", done: true, evidence: "products.json 每筆驗證 source_title / source_url / updated_at" },
            { group: "技術驗收", key: "static_verification", label: "靜態驗收通過", done: true, evidence: "python3 tools/verify_static_site.py passed" },
            { group: "技術驗收", key: "admin_login", label: "後台需要登入", done: true, evidence: "Admin protected panels require MVP login; formal backend pending" },
            { group: "技術驗收", key: "admin_login_browser", label: "後台登入測試通過", done: false, status: "manual_browser", evidence: "需在瀏覽器以 MVP 管理密碼登入 admin.html 並確認受保護面板可見" },
            { group: "技術驗收", key: "lead_submit_browser", label: "表單提交測試通過", done: false, status: "manual_browser", evidence: "需在瀏覽器提交免費財務健檢查詢測試線索，確認 Admin CRM 可看到並可更新狀態" },
            { group: "技術驗收", key: "export_permissions", label: "導出有權限", done: true, evidence: "Admin export buttons apply RBAC and audit denied/export actions" },
            { group: "技術驗收", key: "external_monitoring", label: "正式錯誤上報與外部追蹤可用", done: launchPending === 0, evidence: launchPending ? "GA4 / Meta Pixel / Sentry / Search Console / Line OA 等正式配置仍需外部填入" : "上線健康檢查已無待配置項" },
            { group: "技術驗收", key: "backup", label: "備份策略可用", done: true, evidence: "本機 MVP 備份包已可匯出/匯入；正式 PostgreSQL 備份仍需外部部署" },
            { group: "SEO 驗收", key: "metadata_sitemap", label: "metadata、sitemap、robots 完成", done: true, evidence: "全站 title/description/canonical/OG、sitemap.xml、robots.txt 已驗證" },
            { group: "SEO 驗收", key: "content_matrix", label: "SEO 內容矩陣完成首批", done: true, evidence: "articles.json 至少 40 篇 published SEO 文章" },
            { group: "SEO 驗收", key: "search_console", label: "Search Console 可驗證", done: launchPending === 0 || !!((siteConfigData.search_console || {}).google_site_verification), evidence: "site-config.json 已預留 google_site_verification；正式驗證碼需外部填入" }
        ].map(function (item) {
            var browserEvidence = browserAcceptanceEvidence(item);
            if (item.status === "manual_browser" && browserEvidence) {
                item.done = true;
                item.status = "ready";
                item.evidence = browserEvidence;
            }
            item.status = item.status || (item.done ? "ready" : "external_pending");
            item.launch_ready_count = launchReady;
            item.launch_pending_count = launchPending;
            return item;
        });
    }

    function acceptanceChecklistPayload() {
        var items = acceptanceChecklistItems();
        var statusCounts = {};
        items.forEach(function (item) {
            statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
        });
        return {
            format: "tfse_acceptance_checklist",
            source: "TFSE project plan chapter 17",
            exported_at: new Date().toISOString(),
            exported_by_role: currentRole(),
            ready_count: items.filter(function (item) { return item.done; }).length,
            pending_count: items.filter(function (item) { return !item.done; }).length,
            status_counts: statusCounts,
            items: items
        };
    }

    function browserAcceptanceReportPayload() {
        var checklist = acceptanceChecklistPayload();
        var manualItems = checklist.items.filter(function (item) {
            return item.status === "manual_browser" || [
                "public_feedback_intake",
                "mobile_browser",
                "no_text_overlap_browser",
                "admin_login_browser",
                "lead_submit_browser"
            ].indexOf(item.key) !== -1;
        });
        var records = getBrowserAcceptanceRecords();
        var statusCounts = { passed: 0, manual_browser: 0, needs_fix: 0 };
        records.forEach(function (record) {
            statusCounts[record.result] = (statusCounts[record.result] || 0) + 1;
        });
        return {
            format: "tfse_browser_acceptance_report",
            version: "2026-06-27",
            source: "admin_manual_browser_acceptance",
            base_url: siteConfigData.base_url || "",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            pending_count: manualItems.filter(function (item) { return !latestBrowserAcceptanceRecord(item.key); }).length,
            passed_count: manualItems.filter(function (item) { return !!latestBrowserAcceptanceRecord(item.key); }).length,
            status_counts: statusCounts,
            items: manualItems.map(function (item) {
                var latestPassed = latestBrowserAcceptanceRecord(item.key);
                var itemRecords = browserAcceptanceRecordsForKey(item.key);
                return {
                    group: item.group,
                    key: item.key,
                    label: item.label,
                    status: latestPassed ? "passed" : "manual_browser",
                    required_evidence: item.evidence,
                    records: itemRecords
                };
            })
        };
    }

    function markPrivacyRequestHandled(leadId) {
        var now = new Date().toISOString();
        var leads = getLeads().map(function (lead) {
            if (lead.id !== leadId) return lead;
            lead.delete_requested = true;
            lead.privacy_request_type = lead.privacy_request_type || "delete";
            lead.privacy_request_status = "completed";
            lead.privacy_completed_at = now;
            lead.status = "closed";
            lead.updated_at = now;
            lead.notes = (lead.notes || []).concat(formatDate(now) + " 個資刪除/更正請求已完成本機處理演練；正式版需同步執行伺服器資料庫刪除或遮罩。");
            return lead;
        });
        saveLeads(leads);
        addAudit("privacy_request_complete", leadId);
    }

    function applyBackup(payload) {
        if (!payload || payload.format !== "tfse_local_backup" || !payload.data) {
            throw new Error("不是 TFSE 本機備份包");
        }
        writeStorage("tfse_leads", payload.data.leads || []);
        writeStorage("tfse_events", payload.data.events || []);
        writeStorage("tfse_errors", payload.data.errors || []);
        writeStorage("tfse_admin_audit", payload.data.audit || []);
        writeStorage("tfse_compliance_reviews", payload.data.compliance_reviews || []);
        writeStorage("tfse_config_input_records", payload.data.config_input_records || []);
        writeStorage("tfse_backend_acceptance_records", payload.data.backend_acceptance_records || []);
        writeStorage("tfse_search_console_records", payload.data.search_console_records || []);
        writeStorage("tfse_external_execution_records", payload.data.external_execution_records || []);
        writeStorage("tfse_line_oa_records", payload.data.line_oa_records || []);
        writeStorage("tfse_launch_handoff_records", payload.data.launch_handoff_records || []);
        writeStorage("tfse_product_status", payload.data.product_status || {});
        writeStorage("tfse_product_overrides", payload.data.product_overrides || {});
        writeStorage("tfse_article_status", payload.data.article_status || {});
        writeStorage("tfse_article_overrides", payload.data.article_overrides || {});
        writeStorage("tfse_faq_overrides", payload.data.faq_overrides || {});
    }

    function renderAudit() {
        if (!auditPanel) return;
        var log = getAuditLog();
        var reviews = getComplianceReviews();
        if (!log.length && !reviews.length) {
            auditPanel.innerHTML = "<p>尚無審計紀錄。</p>";
            return;
        }
        auditPanel.innerHTML = [
            "<p>目前角色：" + escapeHtml(roleLabel(currentRole())) + "</p>",
            "<p>合規審核：" + reviews.length + " 筆；最近：" + (reviews[0] ? escapeHtml(reviews[0].target + " / " + reviews[0].result) : "尚無") + "。</p>",
            log.slice(0, 8).map(function (item) {
                return "<p><strong>" + escapeHtml(item.action) + "</strong><br>" + escapeHtml(formatDate(item.at)) + " ｜ " + escapeHtml(item.role || "-") + " ｜ " + escapeHtml(item.target || "-") + "</p>";
            }).join("")
        ].join("");
    }

    function renderAdminSecurityMatrix() {
        if (!securityMatrixPanel) return;
        var payload = adminSecurityMatrixPayload();
        var headers = securityHeadersPayload();
        var authCutover = authCutoverPayload();
        securityMatrixPanel.innerHTML = [
            "<p>角色：" + payload.roles.length + " 組；權限項：" + Object.keys(permissionMatrix()).length + "；正式安全檢查：" + payload.checks.length + " 項；阻擋：" + payload.blockers.length + " 項。</p>",
            "<p>安全標頭部署核對：" + escapeHtml(headers.status) + "；需抽查 URL " + headers.critical_urls.length + " 個；正式主機需以 curl 或平台 header 檢查留痕。</p>",
            "<p>Admin Auth 切換：" + escapeHtml(authCutover.status) + "；需驗收 " + authCutover.endpoints.length + " 個 Auth/RBAC 端點。</p>",
            payload.roles.map(function (item) {
                return "<p><strong>" + escapeHtml(item.label) + "</strong><br>" + escapeHtml(item.permissions.join("、") || "無") + "</p>";
            }).join("")
        ].join("");
    }

    function followUpItems() {
        var activeStatuses = ["new", "contacted", "info_sent", "consulted", "unresponsive"];
        return getLeads().filter(function (lead) {
            return activeStatuses.indexOf(lead.status || "new") !== -1 && (lead.next_follow_up_at || (lead.status || "new") === "new");
        }).map(function (lead) {
            return {
                lead_id: lead.id,
                display_name: lead.display_name || "",
                phone_last3: phoneLast3(lead.phone),
                needs: lead.needs || "",
                status: lead.status || "new",
                assigned_to: lead.assigned_to || "consultant",
                follow_up_priority: lead.follow_up_priority || ((lead.status || "new") === "new" ? "high" : "normal"),
                next_follow_up_at: lead.next_follow_up_at || "",
                latest_note: (lead.notes || []).slice(-1)[0] || "",
                source: lead.utm_source || lead.source_channel || "direct",
                submitted_at: lead.submitted_at || "",
                updated_at: lead.updated_at || lead.submitted_at || ""
            };
        }).sort(function (a, b) {
            var priorityOrder = { high: 0, normal: 1, low: 2 };
            var aDate = a.next_follow_up_at || "9999-12-31";
            var bDate = b.next_follow_up_at || "9999-12-31";
            if (aDate !== bDate) return aDate.localeCompare(bDate);
            return (priorityOrder[a.follow_up_priority] || 1) - (priorityOrder[b.follow_up_priority] || 1);
        });
    }

    function followUpPayload() {
        var items = followUpItems();
        return {
            format: "tfse_crm_follow_up_queue",
            version: "2026-06-27",
            exported_at: new Date().toISOString(),
            exported_by_role: currentRole(),
            source_mode: leadSourceMode,
            privacy_note: "跟進隊列只輸出稱呼、手機末三碼、需求、來源、狀態、負責人與備註摘要；正式版不得匯出完整手機或 Line ID 給非授權角色。",
            counts: {
                total: items.length,
                overdue_or_unscheduled: items.filter(function (item) {
                    return !item.next_follow_up_at || item.next_follow_up_at <= new Date().toISOString().slice(0, 10);
                }).length,
                high_priority: items.filter(function (item) { return item.follow_up_priority === "high"; }).length
            },
            items: items
        };
    }

    function contactLogItems() {
        return getLeads().reduce(function (items, lead) {
            return items.concat((lead.contact_logs || []).map(function (log) {
                return {
                    lead_id: lead.id,
                    display_name: lead.display_name || "",
                    phone_last3: phoneLast3(lead.phone),
                    needs: lead.needs || "",
                    channel: log.channel || "",
                    outcome: log.outcome || "",
                    next_action: log.next_action || "",
                    note_summary: String(log.note || "").slice(0, 160),
                    next_follow_up_at: log.next_follow_up_at || "",
                    handled_by_role: log.handled_by_role || "",
                    contacted_at: log.contacted_at || "",
                    source: lead.utm_source || lead.source_channel || "direct"
                };
            }));
        }, []).sort(function (a, b) {
            return String(b.contacted_at || "").localeCompare(String(a.contacted_at || ""));
        });
    }

    function contactLogPayload() {
        var items = contactLogItems();
        var byOutcome = groupCount(items, function (item) { return item.outcome || "unknown"; });
        return {
            format: "tfse_crm_contact_log",
            version: "2026-06-27",
            exported_at: new Date().toISOString(),
            exported_by_role: currentRole(),
            source_mode: leadSourceMode,
            privacy_note: "聯繫紀錄只輸出稱呼、手機末三碼、渠道、結果、下次動作與備註摘要；不輸出完整手機、Line ID、證件或帳戶資訊。",
            counts: {
                total: items.length,
                reached: byOutcome.reached || 0,
                no_response: byOutcome.no_response || 0,
                info_sent: byOutcome.info_sent || 0,
                invalid_contact: byOutcome.invalid_contact || 0
            },
            items: items
        };
    }

    function crmApiPersistencePayload() {
        var followUps = followUpPayload();
        var contactLogs = contactLogPayload();
        var dedupe = leadDedupePayload();
        var audit = getAuditLog();
        var leads = getLeads();
        return {
            format: "tfse_crm_api_persistence_package",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            privacy_note: "此驗收包只保存 CRM 統計、手機末三碼、狀態碼、角色、聯繫摘要與 audit log ID；不得保存完整手機、Line ID、Email、補充說明全文、session token、CSRF token、證件、帳戶、卡號或密碼。",
            status: "pending_crm_api_persistence",
            backend_target: {
                list_endpoint: "GET /api/admin/leads",
                detail_endpoint: "GET /api/admin/leads/:id",
                status_endpoint: "PATCH /api/admin/leads/:id/status",
                follow_up_endpoint: "GET /api/admin/leads/follow-ups",
                contact_log_endpoint: "GET /api/admin/leads/contact-logs",
                dedupe_endpoint: "GET /api/admin/leads/dedupe-queue",
                audit_endpoint: "GET /api/admin/audit-logs",
                target_tables: ["lead_forms", "lead_contact_logs", "lead_dedupe_queues", "audit_logs"],
                allowed_roles: ["super_admin", "consultant"],
                required_auth: ["server_session", "csrf", "rbac"]
            },
            local_context: {
                lead_count: leads.length,
                follow_up_items: followUps.counts.total,
                high_priority_follow_ups: followUps.counts.high_priority,
                contact_logs: contactLogs.counts.total,
                dedupe_groups: dedupe.counts ? dedupe.counts.duplicate_groups : 0,
                audit_crm_events: audit.filter(function (item) {
                    return item.action === "lead_follow_up_update" || item.action === "follow_up_export" || item.action === "contact_log_export" || item.action === "lead_dedupe_export";
                }).length
            },
            required_controls: [
                "GET /api/admin/leads 與詳情端點需套用 RBAC，Viewer 不可看到完整手機、Line ID 或備註全文。",
                "PATCH /api/admin/leads/:id/status 需同時更新 lead_forms.status、assigned_to、follow_up_priority、next_follow_up_at，並寫入 audit_logs。",
                "若 request 包含 contact_log，需新增 lead_contact_logs，不得以單一 notes 覆蓋歷史聯繫紀錄。",
                "GET /api/admin/leads/follow-ups 需以 assigned_to、priority、due_before 篩選，並只回傳授權角色可見欄位。",
                "GET /api/admin/leads/dedupe-queue 需以 phone_hash + needs + 24 小時窗口產生候選，處理結果寫入 lead_dedupe_queues 與 audit_logs。"
            ],
            test_cases: [
                { key: "list_masked_for_viewer", request: "GET /api/admin/leads as viewer", expected: "完整手機、Line ID、備註全文皆遮罩或省略" },
                { key: "consultant_status_update", request: "PATCH /api/admin/leads/:id/status", expected: "lead_forms 更新，回傳 lead 與 audit_log.id" },
                { key: "contact_log_append", request: { contact_log: "phone/reached/send_public_info" }, expected: "lead_contact_logs 新增一筆，不覆蓋舊紀錄" },
                { key: "follow_up_queue_filter", request: "GET /api/admin/leads/follow-ups?priority=high", expected: "只回傳高優先或到期待跟進項" },
                { key: "dedupe_queue_hash_window", request: "GET /api/admin/leads/dedupe-queue", expected: "以 phone_hash + needs + 24 小時窗口產生候選，不暴露完整手機" }
            ],
            evidence_fields: [
                "endpoint",
                "status_code",
                "lead_id",
                "phone_last3",
                "viewer_masking_checked",
                "lead_status_before",
                "lead_status_after",
                "contact_log_id",
                "dedupe_queue_id",
                "audit_log_id",
                "csrf_checked",
                "rbac_checked",
                "checked_at",
                "evidence_note"
            ],
            blockers: [
                "正式後端尚未提供 lead_forms、lead_contact_logs、lead_dedupe_queues 與 audit_logs 落庫證據。",
                "尚需在 staging 分別以 consultant、viewer、未授權角色驗證 CRM 讀寫與遮罩。",
                "尚需抽查跨瀏覽器 Admin CRM 是否看到同一批正式資料，而非各自 localStorage。"
            ],
            related_exports: [
                "tfse_crm_follow_up_queue",
                "tfse_crm_contact_log",
                "tfse_lead_dedupe_queue",
                "tfse_formal_backend_migration_package",
                "tfse_import_validation_package",
                "tfse_backend_acceptance_matrix",
                "tfse_admin_auth_cutover_check"
            ]
        };
    }

    function renderFollowUps() {
        if (!followUpsPanel) return;
        var payload = followUpPayload();
        if (!payload.items.length) {
            followUpsPanel.innerHTML = "<p>目前沒有待跟進潛客。新提交、已聯繫或已發送資訊但未結案的紀錄會出現在此。</p>";
            return;
        }
        followUpsPanel.innerHTML = [
            "<p>待跟進：" + payload.counts.total + " 筆；今日/未排程：" + payload.counts.overdue_or_unscheduled + " 筆；高優先：" + payload.counts.high_priority + " 筆。</p>",
            "<p>結構化聯繫紀錄：" + contactLogPayload().counts.total + " 筆，可供正式 CRM 匯入與稽核。</p>",
            payload.items.slice(0, 8).map(function (item) {
                return [
                    "<p><strong>" + escapeHtml(item.display_name || "-") + "</strong> ｜ " + escapeHtml(item.status) + " ｜ " + escapeHtml(item.follow_up_priority),
                    "<br>負責：" + escapeHtml(item.assigned_to) + " ｜ 下次：" + escapeHtml(item.next_follow_up_at || "未排程") + " ｜ 手機末三碼：" + escapeHtml(item.phone_last3 || "-"),
                    "<br>需求：" + escapeHtml(item.needs || "-") + " ｜ 來源：" + escapeHtml(item.source || "direct"),
                    item.latest_note ? "<br>最近備註：" + escapeHtml(item.latest_note) : "",
                    "</p>"
                ].join("");
            }).join("")
        ].join("");
    }

    function renderLeadDedupe() {
        if (!leadDedupePanel) return;
        var payload = leadDedupePayload();
        if (!payload.items.length) {
            leadDedupePanel.innerHTML = "<p>目前沒有疑似重複線索。正式 API 仍需用完整手機雜湊 + needs + 24 小時窗口做去重。</p>";
            return;
        }
        leadDedupePanel.innerHTML = [
            "<p>疑似重複組合：" + payload.counts.duplicate_groups + " 組；涉及線索：" + payload.counts.duplicate_leads + " 筆。清單只顯示手機末三碼與需求，不輸出完整個資。</p>",
            payload.items.slice(0, 6).map(function (item) {
                return [
                    "<p><strong>" + escapeHtml(item.needs) + "</strong>",
                    "<br>手機末三碼：" + escapeHtml(item.phone_last3 || "-") + " ｜ 筆數：" + item.count + " ｜ 建議主紀錄：" + escapeHtml(item.suggested_primary_lead_id || "-"),
                    "<br>最新提交：" + escapeHtml(formatDate(item.latest_submitted_at)),
                    "</p>"
                ].join("");
            }).join("")
        ].join("");
    }

    function renderPrivacyRequests() {
        if (!privacyRequestsPanel) return;
        var pending = privacyRequestItems(false);
        var all = privacyRequestItems(true);
        if (!all.length) {
            privacyRequestsPanel.innerHTML = "<p>目前沒有個資刪除或更正請求。使用者可由聯絡頁或隱私權政策提出請求，後台可在潛客詳情標記。</p>";
            return;
        }
        privacyRequestsPanel.innerHTML = [
            "<p>待處理：" + pending.length + " 筆；累計請求：" + all.length + " 筆。匯出清單僅保留手機末三碼供比對，避免擴散完整個資。</p>",
            all.slice(0, 8).map(function (lead) {
                var isCompleted = lead.privacy_request_status === "completed";
                return [
                    "<p><strong>" + escapeHtml(lead.display_name || "-") + "</strong>",
                    "<br>手機末三碼：" + escapeHtml(phoneLast3(lead.phone) || "-") + " ｜ 需求：" + escapeHtml(lead.needs || "-"),
                    "<br>狀態：" + escapeHtml(isCompleted ? "已完成處理演練" : "待處理") + " ｜ 請求時間：" + escapeHtml(formatDate(lead.privacy_requested_at || lead.updated_at || lead.submitted_at)),
                    isCompleted ? "<br>完成時間：" + escapeHtml(formatDate(lead.privacy_completed_at)) : "<br><button class=\"btn btn-light btn-hover-primary mt-2\" data-privacy-complete=\"" + escapeHtml(lead.id) + "\"" + (can("privacy_request") ? "" : " disabled") + ">標記已完成處理</button>",
                    "</p>"
                ].join("");
            }).join("")
        ].join("");

        Array.prototype.slice.call(privacyRequestsPanel.querySelectorAll("[data-privacy-complete]")).forEach(function (button) {
            button.addEventListener("click", function () {
                if (!can("privacy_request")) return;
                markPrivacyRequestHandled(button.getAttribute("data-privacy-complete"));
                renderList();
                renderPrivacyRequests();
                renderDataRetention();
                renderCompliance();
                renderBackupStatus();
            });
        });
    }

    function renderDataRetention() {
        if (!dataRetentionPanel) return;
        var payload = dataRetentionPayload();
        dataRetentionPanel.innerHTML = [
            "<p>資料保留月檢：候選線索 " + payload.summary.purge_candidate_leads + " 筆；90 天以上原始事件 " + payload.summary.raw_events_over_90_days + " 筆；未完成個資請求 " + payload.summary.pending_privacy_requests + " 筆。</p>",
            "<p>正式後端需依排程執行匿名化、刪除、legal hold 與審計留痕；本機 MVP 僅輸出手機末三碼與處理規則。</p>",
            payload.purge_candidates.slice(0, 5).map(function (item) {
                return [
                    "<p><strong>" + escapeHtml(item.display_name || item.lead_id) + "</strong>",
                    "<br>狀態：" + escapeHtml(item.status) + " ｜ 手機末三碼：" + escapeHtml(item.phone_last3 || "-") + " ｜ 年齡：" + escapeHtml(String(item.age_days || 0)) + " 天",
                    "<br>建議：" + escapeHtml(item.suggested_action),
                    "</p>"
                ].join("");
            }).join("")
        ].join("");
    }

    function renderLineSegments() {
        if (!lineSegmentsPanel) return;
        var items = lineSegmentItems();
        var setup = lineOaSetupPayload();
        var handoff = lineOaHandoffPayload();
        var tasks = lineOaTrackableItems();
        if (lineOaTask) {
            lineOaTask.innerHTML = tasks.map(function (item) {
                return "<option value=\"" + escapeHtml(item.key) + "\">" + escapeHtml(item.label) + "</option>";
            }).join("");
        }
        if (!items.length) {
            lineSegmentsPanel.innerHTML = [
                "<p>目前沒有可同步的 Line 分群資料。使用者需勾選 Line 同意，並留下 Line ID 或需求標籤。</p>",
                "<p>Line OA 設定留痕：" + setup.record_summary.tracked_count + " 筆；導向驗收留痕：" + handoff.record_summary.tracked_count + " 筆；需抽查 " + handoff.cta_routes.length + " 個站內承接入口。</p>"
            ].join("");
            if (lineOaRecordsPanel) {
                lineOaRecordsPanel.innerHTML = handoff.records.length || setup.records.length
                    ? getLineOaRecords().slice(0, 5).map(function (record) {
                        return "<p><strong>" + escapeHtml(record.task_label) + "</strong><br>" + escapeHtml(record.result) + " ｜ " + escapeHtml(record.owner || "-") + " ｜ " + escapeHtml(formatDate(record.checked_at)) + "<br>" + escapeHtml(record.evidence_note || "無補充") + "</p>";
                    }).join("")
                    : "<p>尚未保存 Line OA 設定 / 導向留痕。</p>";
            }
            return;
        }
        lineSegmentsPanel.innerHTML = [
            "<p>可同步：" + items.length + " 筆。清單只供正式 Line OA 分群或人工標籤匯入，不應作為貸款推銷名單。</p>",
            "<p>Line OA 設定留痕：" + setup.record_summary.tracked_count + " 筆；導向驗收：" + escapeHtml(handoff.status) + "；正式 URL：" + escapeHtml(handoff.official_url_ready ? "已配置" : "待填") + "。</p>",
            items.slice(0, 8).map(function (lead) {
                return [
                    "<p><strong>" + escapeHtml(lead.display_name || "-") + "</strong>",
                    "<br>Line ID：" + escapeHtml(lead.line_id || "待補") + " ｜ 來源：" + escapeHtml(lead.utm_source || lead.source_channel || "direct"),
                    "<br>標籤：" + escapeHtml((lead.tags || []).join(", ") || "-"),
                    "<br>建議文章：" + escapeHtml((lead.recommended_articles || []).slice(0, 2).join("、") || "-"),
                    "</p>"
                ].join("");
            }).join("")
        ].join("");
        if (lineOaRecordsPanel) {
            lineOaRecordsPanel.innerHTML = getLineOaRecords().length ? getLineOaRecords().slice(0, 5).map(function (record) {
                return "<p><strong>" + escapeHtml(record.task_label) + "</strong><br>" + escapeHtml(record.result) + " ｜ " + escapeHtml(record.owner || "-") + " ｜ " + escapeHtml(formatDate(record.checked_at)) + "<br>" + escapeHtml(record.evidence_note || "無補充") + "</p>";
            }).join("") : "<p>尚未保存 Line OA 設定 / 導向留痕。</p>";
        }
    }

    function renderLineOptout() {
        if (!lineOptoutPanel) return;
        var payload = lineOptoutPayload();
        if (!payload.items.length) {
            lineOptoutPanel.innerHTML = "<p>目前沒有 Line 退訂或投訴待辦；正式 Line OA 仍需監聽停止接收、封鎖、檢舉與個資刪除關鍵字。</p>";
            return;
        }
        lineOptoutPanel.innerHTML = [
            "<p>退訂/投訴待辦：" + payload.summary.total + " 筆；投訴：" + payload.summary.complaints + "；退訂：" + payload.summary.optouts + "；待處理：" + payload.summary.pending_review + "。</p>",
            payload.items.slice(0, 6).map(function (item) {
                return [
                    "<p><strong>" + escapeHtml(item.display_name || item.lead_id) + "</strong>",
                    "<br>類型：" + escapeHtml(item.request_type) + " ｜ 狀態：" + escapeHtml(item.status) + " ｜ 手機末三碼：" + escapeHtml(item.phone_last3 || "-"),
                    "<br>來源：" + escapeHtml(item.source) + " ｜ 需求：" + escapeHtml(item.needs || "-"),
                    "</p>"
                ].join("");
            }).join("")
        ].join("");
    }

    function renderAdCampaigns() {
        if (!adCampaignsPanel) return;
        var items = adCampaignItems();
        if (!items.length) {
            adCampaignsPanel.innerHTML = "<p>尚無廣告落地頁資料。</p>";
            return;
        }
        adCampaignsPanel.innerHTML = [
            "<p>落地頁：" + items.length + " 頁。投流前需逐頁確認 UTM、表單、Line CTA、FAQ 與免責聲明。</p>",
            items.map(function (item) {
                return [
                    "<p><strong>" + escapeHtml(item.short_title || item.slug) + "</strong>",
                    "<br>URL：<a href=\"" + escapeHtml(item.url) + "\" target=\"_blank\" rel=\"noopener\">" + escapeHtml(item.url) + "</a>",
                    "<br>UTM 範例：<code>" + escapeHtml(item.utm_example) + "</code>",
                    "<br>分類：" + escapeHtml(item.category_slug || "-") + " ｜ FAQ：" + item.faq_count + " 題 ｜ 檢查：" + item.checks.length + " 項",
                    "</p>"
                ].join("");
            }).join("")
        ].join("");
    }

    function renderConversionBacklog() {
        if (!conversionBacklogPanel) return;
        var payload = conversionBacklogPayload();
        conversionBacklogPanel.innerHTML = [
            "<p>轉換優化待辦：" + payload.items.length + " 項；中優先：" + payload.summary.medium_priority + "；尚無歸因：" + payload.summary.items_without_attribution + "。</p>",
            payload.items.slice(0, 5).map(function (item) {
                return [
                    "<p><strong>" + escapeHtml(item.slug) + "</strong> ｜ " + escapeHtml(item.priority),
                    "<br>基準：線索 " + item.baseline.leads + "；線索率 " + item.baseline.lead_rate_percent + "%；Line " + item.baseline.line_click_rate_percent + "%",
                    "<br>下一步：" + escapeHtml(item.next_actions[0] || "-"),
                    "</p>"
                ].join("");
            }).join("")
        ].join("");
    }

    function renderLaunchHealth() {
        if (!launchHealthPanel) return;
        var payload = launchHealthPayload();
        launchHealthPanel.innerHTML = [
            "<p>已準備：" + payload.ready_count + " 項；待配置：" + payload.pending_count + " 項。正式外部服務需填入 ID/DSN/Endpoint 後再做收件驗證。</p>",
            payload.items.map(function (item) {
                return [
                    "<p><strong>" + escapeHtml(item.label) + "</strong>",
                    "<br>" + escapeHtml(statusLabel(item.done)) + " ｜ " + escapeHtml(item.detail),
                    "</p>"
                ].join("");
            }).join("")
        ].join("");
    }

    function renderReleaseReadiness() {
        if (!releaseReadinessPanel) return;
        var payload = releaseReadinessPayload();
        releaseReadinessPanel.innerHTML = [
            "<p>發布狀態：" + escapeHtml(payload.readiness.release_status) + "；健康待配置：" + payload.readiness.launch_pending_count + " 項；正式配置待填：" + payload.readiness.config_pending_count + " 項；驗收待辦：" + payload.readiness.acceptance_pending_count + " 項。</p>",
            "<p>配置留痕：" + payload.readiness.config_tracked_count + " 項；外部執行留痕：" + payload.readiness.external_execution_tracked_count + " 項；總交接 checkpoint：" + payload.readiness.handoff_checkpoint_records + " 筆。</p>",
            "<p>本機備份：潛客 " + payload.artifact_summary.backup_leads + " 筆；事件 " + payload.artifact_summary.backup_events + " 筆。正式遷移包：產品 " + payload.artifact_summary.migration_seed_products + " 筆；文章 " + payload.artifact_summary.migration_seed_articles + " 篇。</p>",
            payload.blockers.length ? payload.blockers.slice(0, 6).map(function (item) {
                return "<p><strong>發布阻擋</strong><br>" + escapeHtml(item) + "</p>";
            }).join("") : "<p>自動檢查未發現發布阻擋；仍需依 Runbook 做人工與外部服務驗證。</p>"
        ].join("");
    }

    function renderOperationsTasks() {
        if (!operationsTasksPanel) return;
        var payload = operationsTaskPayload();
        var high = payload.tasks.filter(function (task) { return task.priority === "high" && task.status !== "ready"; });
        operationsTasksPanel.innerHTML = [
            "<p>任務：" + payload.tasks.length + " 項；高優先未完成：" + high.length + " 項；下次檢視週期：" + escapeHtml(payload.next_review_cycle) + "。</p>",
            "<p>配置收件、外部執行與總交接留痕已納入任務隊列，避免只看待填清單卻不知道是否有人接手。</p>",
            high.slice(0, 8).map(function (task) {
                return [
                    "<p><strong>" + escapeHtml(task.group + "｜" + task.title) + "</strong>",
                    "<br>狀態：" + escapeHtml(task.status) + " ｜ 負責：" + escapeHtml(task.owner_role),
                    "<br>" + escapeHtml(task.next_action),
                    "</p>"
                ].join("");
            }).join("") || "<p>目前沒有高優先未完成任務；仍需依 Runbook 做週期檢查。</p>"
        ].join("");
    }

    function renderIncidentResponse() {
        if (!incidentResponsePanel) return;
        var payload = incidentResponsePayload();
        incidentResponsePanel.innerHTML = [
            "<p>本機錯誤：" + payload.signals.local_error_count + " 筆；事件：" + payload.signals.event_count + " 筆；發布阻擋：" + payload.signals.release_blockers + " 項；高優先任務：" + payload.signals.high_priority_operations_tasks + " 項。</p>",
            "<p>狀態提示：" + escapeHtml(payload.severity_hint) + "。</p>",
            payload.recent_errors.length ? payload.recent_errors.slice(0, 5).map(function (error) {
                return "<p><strong>" + escapeHtml(error.source || "unknown") + "</strong><br>" + escapeHtml(formatDate(error.at)) + " ｜ " + escapeHtml(error.message || "-") + "</p>";
            }).join("") : "<p>目前沒有本機錯誤紀錄；正式上線後仍需以 Sentry / API logs / Server Event 交叉確認。</p>"
        ].join("");
    }

    function renderConfigReadiness() {
        if (!configReadinessPanel) return;
        var payload = configReadinessPayload();
        var groups = {};
        payload.items.forEach(function (item) {
            groups[item.group] = groups[item.group] || [];
            groups[item.group].push(item);
        });
        configReadinessPanel.innerHTML = [
            "<p>正式配置已準備：" + payload.ready_count + " 項；待填或待外部驗證：" + payload.pending_count + " 項。此交接包對應 site-config.json 與 tools/validate_site_config.py。</p>",
            Object.keys(groups).map(function (group) {
                return [
                    "<h6 class=\"mt-4\">" + escapeHtml(group) + "</h6>",
                    groups[group].map(function (item) {
                        return [
                            "<p><strong>" + escapeHtml(item.label) + "</strong>",
                            "<br>" + escapeHtml(statusLabel(item.done)) + " ｜ " + escapeHtml(item.detail),
                            "</p>"
                        ].join("");
                    }).join("")
                ].join("");
            }).join("")
        ].join("");
    }

    function renderConfigDraft() {
        if (!configDraftPanel) return;
        var payload = configDraftPayload();
        var messages = payload.validation.errors.concat(payload.validation.warnings);
        configDraftPanel.innerHTML = [
            "<p>site-config 更新包狀態：" + escapeHtml(payload.status) + "；草稿欄位：" + escapeHtml(payload.draft_keys.join(", ") || "尚未貼上") + "。</p>",
            messages.length ? messages.slice(0, 6).map(function (message) {
                return "<p>" + escapeHtml(message) + "</p>";
            }).join("") : "<p>草稿格式可供人工合併；合併後需重生 SEO 資產並重新驗收。</p>"
        ].join("");
    }

    function renderEnvTemplate() {
        if (!envTemplatePanel) return;
        var payload = envTemplatePayload();
        var requiredSecrets = payload.items.filter(function (item) { return item.secret; }).map(function (item) {
            return item.name;
        }).join(", ");
        envTemplatePanel.innerHTML = [
            "<p>環境變數模板：" + payload.items.length + " 項；目前已配置：" + payload.configured_count + "；待填：" + payload.pending_count + "；需密鑰管理：" + payload.secret_count + "。</p>",
            "<p>後端密鑰只列變數名，不輸出真實值：" + escapeHtml(requiredSecrets || "無") + "。</p>"
        ].join("");
    }

    function renderLocalAuditMatrix() {
        if (!localAuditMatrixPanel) return;
        var payload = localAuditMatrixPayload();
        var followUpItems = payload.items.filter(function (item) {
            return item.status !== "ready_to_run";
        });
        localAuditMatrixPanel.innerHTML = [
            "<p>命令總數：" + payload.summary.total_commands + "；可直接執行：" + payload.summary.ready_to_run + "；執行後仍指向外部待辦：" + payload.summary.ready_with_external_follow_up + "；仍需人工留痕：" + payload.summary.ready_with_manual_follow_up + "。</p>",
            followUpItems.slice(0, 8).map(function (item) {
                return "<p><strong>" + escapeHtml(item.title) + "</strong><br><code>" + escapeHtml(item.command) + "</code><br>" + escapeHtml(item.current_signal) + "</p>";
            }).join("") || "<p>目前所有本機驗收命令都可直接作為本地閉環審計執行。</p>"
        ].join("");
    }

    function renderConfigInputPacket() {
        if (!configInputPacketPanel) return;
        var payload = formalConfigInputPacketPayload();
        if (configInputKey) {
            configInputKey.innerHTML = payload.required_inputs.map(function (item) {
                return "<option value=\"" + escapeHtml(item.key) + "\">" + escapeHtml(item.label) + "</option>";
            }).join("");
        }
        configInputPacketPanel.innerHTML = [
            "<p>必填輸入：" + payload.required_inputs.length + " 項；待填：" + payload.pending_count + "；條件性輸入待補：" + payload.conditional_pending_count + "；secret-only：" + payload.secret_only_inputs.length + " 項。</p>",
            "<p>已留痕：" + payload.record_summary.tracked_count + " 項；已驗證：" + payload.record_summary.validated_count + "；受阻：" + payload.record_summary.blocked_count + "。</p>",
            payload.required_inputs.filter(function (item) { return !item.done; }).slice(0, 8).map(function (item) {
                var tracking = item.latest_record ? "｜ 留痕：" + item.latest_record.result + " / " + formatDate(item.latest_record.checked_at) : "";
                return "<p><strong>" + escapeHtml(item.label) + "</strong><br>負責：" + escapeHtml(item.owner_role) + " ｜ 路徑：" + escapeHtml(item.config_paths.join(", ")) + tracking + "<br>建議值：" + escapeHtml(item.suggested_value) + "</p>";
            }).join("") || "<p>正式配置必填項已全部具備；仍請保存外部收件驗證留痕。</p>",
            payload.owner_handoff.length ? "<p>待交接角色：" + escapeHtml(payload.owner_handoff.map(function (item) { return item.owner_role; }).join("、")) + "。</p>" : "<p>目前沒有待交接的正式配置角色。</p>"
        ].join("");
        if (configInputRecordsPanel) {
            configInputRecordsPanel.innerHTML = payload.records.length ? payload.records.slice(0, 5).map(function (record) {
                return "<p><strong>" + escapeHtml(record.input_label) + "</strong><br>" + escapeHtml(record.result) + " ｜ " + escapeHtml(record.owner || "-") + " ｜ " + escapeHtml(formatDate(record.checked_at)) + "<br>" + escapeHtml(record.evidence_note || "無補充") + "</p>";
            }).join("") : "<p>尚未保存正式配置收件留痕。</p>";
        }
    }

    function renderProjectPlanCoverage() {
        if (!planCoveragePanel) return;
        var payload = projectPlanCoveragePayload();
        planCoveragePanel.innerHTML = [
            "<p>計畫章節 ready：" + payload.ready_count + "；local-ready-external-pending：" + payload.local_ready_external_pending_count + "。此對賬對應 1-23 章，不改模板，只核對交付閉環。</p>",
            payload.chapters.filter(function (item) {
                return item.status !== "ready";
            }).slice(0, 8).map(function (item) {
                return "<p><strong>" + escapeHtml(item.chapter + "｜" + item.title) + "</strong><br>" + escapeHtml(item.blockers.join("；") || item.summary) + "</p>";
            }).join("") || "<p>目前 1-23 章皆已達本地與外部閉環。</p>"
        ].join("");
    }

    function renderPlanRequirementTrace() {
        if (!planRequirementsPanel) return;
        var payload = planRequirementTracePayload();
        var focusItems = payload.items.filter(function (item) {
            return item.status !== "ready" && item.status !== "not_applicable";
        });
        planRequirementsPanel.innerHTML = [
            "<p>逐條需求 ready：" + (payload.counts.ready || 0) + "；external_pending：" + (payload.counts.external_pending || 0) + "；manual_browser：" + (payload.counts.manual_browser || 0) + "；missing：" + (payload.counts.missing || 0) + "。</p>",
            "<p>這份對賬直接對應原始計畫第 17 / 21 章，用來確認我們是在原模板上補內容與功能，而不是重做設計。</p>",
            focusItems.length ? focusItems.slice(0, 8).map(function (item) {
                return "<p><strong>" + escapeHtml(item.section + "｜" + item.requirement) + "</strong><br>" + escapeHtml(item.evidence) + "</p>";
            }).join("") : "<p>第 17 / 21 章需求目前均已達 ready 或 not_applicable。</p>"
        ].join("");
    }

    function renderProjectPhaseAudit() {
        if (!phaseAuditPanel) return;
        var payload = projectPhaseAuditPayload();
        var pendingPhases = payload.phases.filter(function (item) {
            return item.status === "local_ready_external_pending";
        });
        phaseAuditPanel.innerHTML = [
            "<p>Phase ready：" + (payload.counts.ready || 0) + "；待正式配置 / 簽核：" + (payload.counts.local_ready_external_pending || 0) + "。</p>",
            pendingPhases.length ? pendingPhases.map(function (item) {
                return "<p><strong>" + escapeHtml(item.phase + "｜" + item.title) + "</strong><br>" + escapeHtml(item.summary) + "<br>阻擋：" + escapeHtml(item.blockers.join("；")) + "</p>";
            }).join("") : "<p>Phase 0-8 目前均已本地或外部閉環。</p>",
            payload.external_pending.length ? "<p><strong>仍待正式切換的驗收標籤</strong><br>" + escapeHtml(payload.external_pending.join("、")) + "</p>" : ""
        ].join("");
    }

    function renderPlanClosure() {
        if (!planClosurePanel) return;
        var payload = planClosurePayload();
        planClosurePanel.innerHTML = [
            "<p>閉環狀態：" + escapeHtml(payload.summary.closure_status) + "；本地閉環：" + (payload.summary.local_closed ? "是" : "否") + "；正式閉環：" + (payload.summary.production_closed ? "是" : "否") + "。</p>",
            "<p>驗收 ready：" + payload.summary.acceptance_ready + "；本地阻擋：" + payload.summary.acceptance_local_blockers + "；外部阻擋：" + payload.summary.acceptance_external_blockers + "；不適用：" + payload.summary.acceptance_not_applicable + "。</p>",
            payload.conclusions.map(function (item) {
                return "<p>" + escapeHtml(item) + "</p>";
            }).join(""),
            payload.external_blockers.slice(0, 4).map(function (item) {
                return "<p><strong>" + escapeHtml(item.label) + "</strong><br>" + escapeHtml(item.evidence) + "</p>";
            }).join("") || "<p>目前沒有外部阻擋，已達正式閉環。</p>"
        ].join("");
    }

    function renderExternalExecution() {
        if (!externalExecutionPanel) return;
        var payload = externalExecutionPacketPayload();
        if (externalExecutionItem) {
            externalExecutionItem.innerHTML = payload.items.map(function (item) {
                return "<option value=\"" + escapeHtml(item.key) + "\">" + escapeHtml(item.title) + "</option>";
            }).join("");
        }
        externalExecutionPanel.innerHTML = [
            "<p>可交外部執行：" + payload.ready_for_external_execution_count + " 項；待人工複核：" + payload.pending_human_review_count + " 項；總隊列：" + payload.actionable_items + " 項。</p>",
            "<p>已留痕：" + payload.record_summary.tracked_count + " 項；已完成：" + payload.record_summary.completed_count + "；受阻：" + payload.record_summary.blocked_count + "。</p>",
            payload.items.slice(0, 8).map(function (item) {
                var tracking = item.latest_record ? " ｜ 留痕：" + item.latest_record.result + " / " + formatDate(item.latest_record.checked_at) : "";
                return "<p><strong>" + escapeHtml(item.title) + "</strong><br>負責：" + escapeHtml(item.owner_role) + " ｜ 狀態：" + escapeHtml(item.status) + tracking + "<br>" + escapeHtml(item.next_action) + "</p>";
            }).join("")
        ].join("");
        if (externalExecutionRecordsPanel) {
            externalExecutionRecordsPanel.innerHTML = payload.records.length ? payload.records.slice(0, 5).map(function (record) {
                return "<p><strong>" + escapeHtml(record.item_title) + "</strong><br>" + escapeHtml(record.result) + " ｜ " + escapeHtml(record.owner || "-") + " ｜ " + escapeHtml(formatDate(record.checked_at)) + "<br>" + escapeHtml(record.evidence_note || "無補充") + "</p>";
            }).join("") : "<p>尚未保存外部執行留痕。</p>";
        }
    }

    function renderLaunchHandoffManifest() {
        if (!launchHandoffPanel) return;
        var payload = launchHandoffManifestPayload();
        launchHandoffPanel.innerHTML = [
            "<p>配置待填：" + payload.summary.config_inputs_pending + "；可執行切換：" + payload.summary.cutover_ready_for_execution + "；人工簽核待辦：" + payload.summary.human_review_pending + "；發布狀態：" + escapeHtml(payload.summary.release_status) + "。</p>",
            "<p>章節對賬：ready " + payload.summary.plan_chapters_ready + "；external pending " + payload.summary.plan_chapters_local_ready_external_pending + "；驗收待辦 " + payload.summary.acceptance_pending + "。</p>",
            "<p>閉環判斷：" + escapeHtml(payload.summary.plan_closure_status) + "；本地阻擋 " + payload.summary.plan_local_blockers + " 項。</p>",
            "<p>總交接留痕：" + payload.summary.checkpoint_records + " 筆；外部驗證已通過 " + payload.summary.external_verified_items + " 項。</p>",
            payload.recommended_sequence.slice(0, 4).map(function (item, index) {
                return "<p><strong>步驟 " + (index + 1) + "</strong><br>" + escapeHtml(item) + "</p>";
            }).join("")
        ].join("");
        if (launchHandoffRecordsPanel) {
            launchHandoffRecordsPanel.innerHTML = payload.checkpoint_records.length ? payload.checkpoint_records.slice(0, 5).map(function (record) {
                return "<p><strong>" + escapeHtml(record.checkpoint) + "</strong><br>" + escapeHtml(record.result) + " ｜ " + escapeHtml(record.owner || "-") + " ｜ " + escapeHtml(formatDate(record.checked_at)) + "<br>" + escapeHtml(record.evidence_note || "無補充") + "</p>";
            }).join("") : "<p>尚未保存總交接會議留痕。</p>";
        }
    }

    function renderOwnerCutoverBundle() {
        if (!ownerCutoverBundlePanel) return;
        var payload = ownerCutoverBundlePayload();
        ownerCutoverBundlePanel.innerHTML = [
            "<p>Owners：" + payload.summary.owners + "；待填配置 owner：" + payload.summary.owners_with_pending_inputs + "；有執行項 owner：" + payload.summary.owners_with_execution_items + "；待人工簽核 owner：" + payload.summary.owners_with_human_review + "。</p>",
            payload.bundles.map(function (bundle) {
                var patchReady = bundle.owner_patch_template && Object.keys(bundle.owner_patch_template).length ? "yes" : "no";
                var envLines = bundle.env_snippet ? bundle.env_snippet.split("\n").filter(Boolean).length : 0;
                return "<div style=\"margin-bottom:20px;\"><p><strong>" + escapeHtml(bundle.owner + " / " + bundle.label) + "</strong><br>Focus：" + escapeHtml(bundle.focus) + "<br>待填 " + bundle.summary.pending_required_inputs + "｜env " + bundle.summary.pending_env_items + "｜執行 " + bundle.summary.execution_items + "｜簽核 " + bundle.summary.pending_human_review + "<br>Patch：" + patchReady + "｜Env lines：" + envLines + "</p>" + renderPatchEnvDetails(bundle.owner_patch_template, bundle.env_snippet) + "</div>";
            }).join("")
        ].join("");
    }

    function renderReleaseDayRunsheet() {
        if (!releaseDayRunsheetPanel) return;
        var payload = releaseDayRunsheetPayload();
        releaseDayRunsheetPanel.innerHTML = [
            "<p>Run Sheet 時段：" + payload.summary.slots + "；涉及 owner：" + payload.summary.owners + "；閉環狀態：" + escapeHtml(payload.summary.plan_closure_status) + "。</p>",
            payload.slots.map(function (slot) {
                var ownerMeta = slot.owner_groups.map(function (group) {
                    var patchReady = group.owner_patch_template && Object.keys(group.owner_patch_template).length ? "yes" : "no";
                    var envLines = group.env_snippet ? group.env_snippet.split("\n").filter(Boolean).length : 0;
                    return "<div style=\"margin-top:12px;\"><strong>" + escapeHtml(group.owner + " / " + group.label) + "</strong><br>patch:" + patchReady + " ｜ env:" + envLines + renderPatchEnvDetails(group.owner_patch_template, group.env_snippet) + "</div>";
                }).join("");
                return "<div style=\"margin-bottom:20px;\"><p><strong>" + escapeHtml(slot.title) + "</strong><br>Goal：" + escapeHtml(slot.goal) + "<br>Owner groups：" + slot.owner_groups.length + (slot.manual_checks.length ? "<br>Manual checks：" + slot.manual_checks.length : "") + "</p>" + (ownerMeta || "") + "</div>";
            }).join("")
        ].join("");
    }

    function renderHandoffPanels() {
        renderConfigInputPacket();
        renderProjectPlanCoverage();
        renderPlanRequirementTrace();
        renderProjectPhaseAudit();
        renderPlanClosure();
        renderExternalExecution();
        renderLaunchHandoffManifest();
        renderOwnerCutoverBundle();
        renderReleaseDayRunsheet();
        renderCompletionOverview();
    }

    function renderLaunchCutoverAudit() {
        if (!launchCutoverAuditPanel) return;
        var payload = launchCutoverAuditPayload();
        var pendingExternal = payload.items.filter(function (item) { return item.status === "pending_external_input"; });
        var readyExternal = payload.items.filter(function (item) { return item.status === "ready_for_external_execution"; });
        var humanReview = payload.items.filter(function (item) { return item.status === "pending_human_review"; });
        launchCutoverAuditPanel.innerHTML = [
            "<p>待正式輸入：" + payload.summary.official_config_pending + " 項；可外部執行：" + payload.summary.external_execution_ready + " 項；待人工複核：" + payload.summary.human_review_pending + " 項；本地前置缺失：" + payload.summary.local_prep_missing + " 項。</p>",
            pendingExternal.slice(0, 8).map(function (item) {
                return "<p><strong>" + escapeHtml(item.label) + "</strong><br>負責：" + escapeHtml(item.owner) + " ｜ " + escapeHtml(item.blockers.join("；") || item.evidence) + "</p>";
            }).join("") || "<p>目前沒有待正式輸入的切換阻擋項。</p>",
            readyExternal.length ? "<p><strong>下一批可直接外部執行</strong><br>" + escapeHtml(readyExternal.slice(0, 4).map(function (item) { return item.label; }).join("、")) + "。</p>" : "<p>目前沒有可直接外部執行的切換項。</p>",
            humanReview.length ? "<p><strong>人工複核</strong><br>" + escapeHtml(humanReview.map(function (item) { return item.label; }).join("、")) + "。</p>" : ""
        ].join("");
    }

    function renderLaunchExecutionPlan() {
        if (!launchExecutionPlanPanel) return;
        var payload = launchExecutionPlanPayload();
        launchExecutionPlanPanel.innerHTML = [
            "<p>正式輸入待補：" + payload.summary.official_config_pending + " 項；可外部執行：" + payload.summary.external_execution_ready + " 項；人工複核：" + payload.summary.human_review_pending + " 項。</p>",
            payload.waves.map(function (wave) {
                var keyOwners = Object.keys(wave.owners);
                return "<p><strong>" + escapeHtml(wave.title) + "</strong><br>" + escapeHtml(wave.goal) + "<br>負責角色：" + escapeHtml(keyOwners.join("、") || "無") + " ｜ 任務：" + wave.items.length + " 項</p>";
            }).join("")
        ].join("");
    }

    function renderLaunchCountdownPlan() {
        if (!launchCountdownPlanPanel) return;
        var payload = launchCountdownPlanPayload();
        launchCountdownPlanPanel.innerHTML = [
            "<p>D-3 到 D+1 已按切換節點拆好；正式輸入待補 " + payload.summary.official_config_pending + " 項，人工複核 " + payload.summary.human_review_pending + " 項。</p>",
            payload.slots.map(function (slot) {
                return "<p><strong>" + escapeHtml(slot.title) + "</strong><br>" + escapeHtml(slot.goal) + "<br>任務：" + slot.items.length + " 項 ｜ 手動複查：" + slot.manual_checks.length + " 項</p>";
            }).join("")
        ].join("");
    }

    function renderDomainCutover() {
        if (!domainCutoverPanel) return;
        var payload = domainCutoverPayload();
        var fallback = hostFallbackPayload();
        domainCutoverPanel.innerHTML = [
            "<p>Base URL：" + escapeHtml(payload.base_url || "待填") + "；Canonical：" + payload.summary.canonical_pages + " 頁；Search Console：" + (payload.summary.search_console_configured ? "已配置" : "待填") + "；阻擋：" + payload.summary.blockers + " 項。</p>",
            "<p>主機錯誤頁核對：" + escapeHtml(fallback.status) + "；需抽查 " + fallback.critical_routes.length + " 個 404/500/fallback 路徑。</p>",
            payload.blockers.length ? payload.blockers.map(function (item) {
                return "<p><strong>切換前待辦</strong><br>" + escapeHtml(item) + "</p>";
            }).join("") : "<p>網域切換資料已具備；部署後仍需提交 sitemap 並抽查主要頁面。</p>"
        ].join("");
    }

    function renderBackendRoadmap() {
        if (!backendRoadmapPanel) return;
        var payload = backendRoadmapPayload();
        var pendingSteps = payload.priority_sequence.filter(function (item) {
            return item.blockers.length;
        });
        backendRoadmapPanel.innerHTML = [
            "<p>正式 API 已配置：" + (payload.summary.api_configured ? "是" : "否") + "；路線步驟：" + payload.summary.total_steps + "；已具備執行條件：" + payload.summary.ready_steps + "。</p>",
            "<p>遷移參考：產品 " + payload.summary.migration_seed_products + " 筆；文章 " + payload.summary.migration_seed_articles + " 篇；本機線索 " + payload.summary.migration_local_leads + " 筆。</p>",
            pendingSteps.slice(0, 6).map(function (item) {
                return "<p><strong>" + escapeHtml(item.title) + "</strong><br>" + escapeHtml(item.goal) + "<br>阻擋：" + escapeHtml(item.blockers.join("；")) + "</p>";
            }).join("") || "<p>後端切換路線圖目前已無本地阻擋；可按順序執行正式接入。</p>"
        ].join("");
    }

    function renderBackendAcceptance() {
        if (!backendAcceptancePanel) return;
        var payload = backendAcceptancePayload();
        if (backendAcceptanceEndpoint) {
            backendAcceptanceEndpoint.innerHTML = payload.endpoints.map(function (item) {
                return "<option value=\"" + escapeHtml(item.key) + "\">" + escapeHtml(item.method + " " + item.path) + "</option>";
            }).join("");
        }
        var keyEndpoints = payload.endpoints.slice(0, 6).map(function (item) {
            var tracking = item.latest_record ? "<br>留痕：" + escapeHtml(item.latest_record.result) + " ｜ " + escapeHtml(formatDate(item.latest_record.checked_at)) : "";
            return [
                "<p><strong>" + escapeHtml(item.method + " " + item.path) + "</strong>",
                "<br>" + escapeHtml(item.group + " ｜ " + item.proof) + tracking,
                "</p>"
            ].join("");
        }).join("");
        backendAcceptancePanel.innerHTML = [
            "<p>後端模式：" + escapeHtml(payload.backend_mode) + "；API 已配置：" + (payload.summary.api_configured ? "是" : "否") + "；端點：" + payload.summary.endpoints + " 個；阻擋項：" + payload.summary.blockers + " 項。</p>",
            "<p>驗收留痕：" + payload.record_summary.tracked_count + " 筆；通過：" + payload.record_summary.passed_count + "；受阻：" + payload.record_summary.blocked_count + "。</p>",
            "<p>本矩陣對應 PRODUCTION_BACKEND_PLAN.md、api-contract.json、backend-schema.sql 與 DATA_MODEL.md。</p>",
            keyEndpoints,
            payload.blockers.slice(0, 4).map(function (item) {
                return "<p><strong>正式接入待辦</strong><br>" + escapeHtml(item) + "</p>";
            }).join("")
        ].join("");
        if (backendAcceptanceRecordsPanel) {
            backendAcceptanceRecordsPanel.innerHTML = payload.records.length ? payload.records.slice(0, 5).map(function (record) {
                return "<p><strong>" + escapeHtml(record.endpoint_label) + "</strong><br>" + escapeHtml(record.result) + " ｜ " + escapeHtml(record.owner || "-") + " ｜ " + escapeHtml(formatDate(record.checked_at)) + "<br>" + escapeHtml(record.evidence_note || "無補充") + "</p>";
            }).join("") : "<p>尚未保存正式 API 驗收留痕。</p>";
        }
    }

    function renderSeoSubmission() {
        if (!seoSubmissionPanel) return;
        var payload = seoSubmissionPayload();
        var searchConsole = searchConsoleVerificationPayload();
        var targets = searchConsoleTrackableItems(searchConsole);
        if (searchConsoleTarget) {
            searchConsoleTarget.innerHTML = targets.map(function (item) {
                return "<option value=\"" + escapeHtml(item.key) + "\">" + escapeHtml(item.label) + "</option>";
            }).join("");
        }
        seoSubmissionPanel.innerHTML = [
            "<p>Canonical：" + payload.counts.canonical_pages + " 頁；產品詳情：" + payload.counts.products + " 筆；已發布文章：" + payload.counts.published_articles + " 篇；落地頁：" + payload.counts.landing_pages + " 頁。</p>",
            "<p>Search Console：" + (payload.search_console.google_site_verification_configured ? "已配置驗證碼" : "驗證碼待填") + "；Sitemap：" + escapeHtml(payload.search_console.sitemap_submit_url) + "。</p>",
            "<p>Search Console 驗證包：" + escapeHtml(searchConsole.status) + "；URL Inspection 抽查 " + searchConsole.url_inspection_samples.length + " 項；留痕 " + searchConsole.record_summary.tracked_count + " 筆。</p>",
            payload.blockers.length ? payload.blockers.map(function (item) {
                return "<p><strong>提交前待辦</strong><br>" + escapeHtml(item) + "</p>";
            }).join("") : "<p>SEO 提交包已具備；正式提交後仍需在 Search Console 查看收錄與索引狀態。</p>"
        ].join("");
        if (searchConsoleRecordsPanel) {
            searchConsoleRecordsPanel.innerHTML = searchConsole.records.length ? searchConsole.records.slice(0, 5).map(function (record) {
                return "<p><strong>" + escapeHtml(record.target_label) + "</strong><br>" + escapeHtml(record.result) + " ｜ " + escapeHtml(record.owner || "-") + " ｜ " + escapeHtml(formatDate(record.checked_at)) + "<br>" + escapeHtml(record.evidence_note || "無補充") + "</p>";
            }).join("") : "<p>尚未保存 Search Console 驗證 / 提交留痕。</p>";
        }
    }

    function renderSeoIndexingQueue() {
        if (!seoIndexingPanel) return;
        var payload = seoIndexingQueuePayload();
        var preview = payload.items.slice(0, 5).map(function (item) {
            return "<p><strong>" + escapeHtml(item.title) + "</strong><br>" + escapeHtml(item.priority) + " ｜ " + escapeHtml(item.path) + "<br>" + escapeHtml(item.status) + "</p>";
        }).join("");
        seoIndexingPanel.innerHTML = [
            "<p>收錄跟進：" + payload.summary.tasks + " 項；高優先：" + payload.summary.high_priority + "；Search Console：" + (payload.search_console_configured ? "已配置驗證碼" : "待正式驗證") + "。</p>",
            payload.blockers.length ? payload.blockers.map(function (item) {
                return "<p><strong>跟進前待辦</strong><br>" + escapeHtml(item) + "</p>";
            }).join("") : "<p>URL 跟進隊列已可交給 Search Console 檢查；實際 coverage/indexed 狀態仍需外部留痕。</p>",
            preview
        ].join("");
    }

    function simpleStatusText(status) {
        var map = {
            ready: "已完成",
            manual_external: "需人工確認",
            manual_browser: "需人工驗收",
            pending_external: "待外部處理",
            pending: "待處理",
            hold: "暫停上線",
            needs_review: "待複核",
            monitor: "需持續觀察",
            external_pending: "待外部配置",
            local_closed_external_blocked: "本地已完成，卡在外部"
        };
        return map[status] || status || "待確認";
    }

    function completionPriorityScore(task) {
        var statusScore = {
            hold: 7,
            pending_external: 6,
            external_pending: 6,
            pending: 5,
            needs_review: 4,
            manual_external: 3,
            manual_browser: 3,
            monitor: 2,
            ready: 0
        };
        return (task.priority === "high" ? 10 : 0) + (statusScore[task.status] || 1);
    }

    function completionJumpButton(selector, label, style) {
        return "<button type=\"button\" class=\"" + escapeHtml(style || "tfse-completion-link") + "\" data-admin-completion-jump=\"" + escapeHtml(selector) + "\">" + escapeHtml(label) + "</button>";
    }

    function renderCompletionOverview() {
        if (!completionOverviewPanel) return;
        var closure = planClosurePayload();
        var release = releaseReadinessPayload();
        var launch = launchHealthPayload();
        var external = externalVerificationPayload();
        var operations = operationsTaskPayload();
        var handoff = launchHandoffManifestPayload();
        var blockers = (closure.external_blockers || []).slice(0, 5);
        var activeTasks = operations.tasks.filter(function (task) {
            return task.status !== "ready";
        }).sort(function (a, b) {
            return completionPriorityScore(b) - completionPriorityScore(a);
        });
        var readyTotal = closure.summary.acceptance_ready + closure.summary.acceptance_not_applicable;
        var acceptanceTotal = readyTotal + closure.summary.acceptance_local_blockers + closure.summary.acceptance_external_blockers;
        var completionPercent = acceptanceTotal ? Math.round((readyTotal / acceptanceTotal) * 100) : 0;
        var productionClosed = closure.summary.production_closed;
        var heroClass = productionClosed ? "is-ready" : "is-blocked";
        var heroTitle = productionClosed ? "可以進入正式上線" : "本地已完成，正式上線還差外部事項";
        var heroNote = productionClosed
            ? "目前閉環檢查沒有阻擋項，仍建議匯出交接包並做最後人工確認。"
            : "網站內容、功能與本地驗收已完成；剩下的多是正式配置、外部平台、備份與法務留痕。";
        var quickActions = [
            completionJumpButton("[data-admin-operations-tasks]", "看待辦清單", "tfse-completion-primary"),
            completionJumpButton("[data-admin-config-input-packet]", "填正式配置", "tfse-completion-link"),
            completionJumpButton("[data-admin-external-execution-form]", "保存外部留痕", "tfse-completion-link"),
            completionJumpButton("[data-admin-launch-handoff-form]", "保存交接決議", "tfse-completion-link")
        ].join("");
        completionOverviewPanel.innerHTML = [
            "<div class=\"tfse-completion-hero " + heroClass + "\">",
                "<div>",
                    "<span class=\"tfse-completion-eyebrow\">完成度總覽</span>",
                    "<h3>" + escapeHtml(heroTitle) + "</h3>",
                    "<p>" + escapeHtml(heroNote) + "</p>",
                    "<div class=\"tfse-completion-actions\">" + quickActions + "</div>",
                "</div>",
                "<div class=\"tfse-completion-score\" aria-label=\"驗收完成度\">",
                    "<b>" + completionPercent + "%</b>",
                    "<span>驗收完成度</span>",
                    "<small>" + escapeHtml(simpleStatusText(closure.summary.closure_status)) + "</small>",
                "</div>",
            "</div>",
            "<div class=\"tfse-completion-kpis\">",
                "<article><i class=\"fa fa-check-circle\"></i><span>本地閉環</span><strong>" + (closure.summary.local_closed ? "已完成" : "未完成") + "</strong><small>本地阻擋 " + closure.summary.acceptance_local_blockers + " 項</small></article>",
                "<article><i class=\"fa fa-cloud-upload-alt\"></i><span>正式上線</span><strong>" + (productionClosed ? "可推進" : "待外部") + "</strong><small>外部阻擋 " + closure.summary.acceptance_external_blockers + " 項</small></article>",
                "<article><i class=\"fa fa-heartbeat\"></i><span>健康檢查</span><strong>" + launch.ready_count + " / " + launch.items.length + "</strong><small>待配置 " + launch.pending_count + " 項</small></article>",
                "<article><i class=\"fa fa-clipboard-list\"></i><span>運維任務</span><strong>" + operations.tasks.length + " 項</strong><small>高優先未完成 " + activeTasks.filter(function (task) { return task.priority === "high"; }).length + " 項</small></article>",
                "<article><i class=\"fa fa-shield-alt\"></i><span>外部驗證</span><strong>" + external.summary.verified_items + " / " + external.summary.required_items + "</strong><small>已配置 " + external.summary.configured_items + " 項</small></article>",
            "</div>",
            "<div class=\"tfse-completion-grid\">",
                "<div class=\"tfse-completion-card tfse-completion-next\">",
                    "<div class=\"tfse-completion-card-head\"><span>照這個順序做</span>" + completionJumpButton("[data-admin-owner-cutover-bundle]", "看 Owner 包", "tfse-completion-mini") + "</div>",
                    activeTasks.slice(0, 5).map(function (task, index) {
                        return [
                            "<article>",
                                "<b>" + (index + 1) + "</b>",
                                "<div><strong>" + escapeHtml(task.title) + "</strong>",
                                "<p>" + escapeHtml(task.next_action) + "</p>",
                                "<small>" + escapeHtml(task.group) + " ｜ " + escapeHtml(task.owner_role) + " ｜ " + escapeHtml(simpleStatusText(task.status)) + "</small></div>",
                            "</article>"
                        ].join("");
                    }).join("") || "<p>目前沒有未完成任務。</p>",
                "</div>",
                "<div class=\"tfse-completion-card\">",
                    "<div class=\"tfse-completion-card-head\"><span>目前卡在哪</span>" + completionJumpButton("[data-admin-launch-cutover-audit]", "看阻擋項", "tfse-completion-mini") + "</div>",
                    blockers.map(function (item) {
                        return "<p><strong>" + escapeHtml(item.label) + "</strong><br>" + escapeHtml(item.evidence) + "</p>";
                    }).join("") || "<p>目前沒有外部阻擋。</p>",
                    "<div class=\"tfse-completion-handoff\">",
                        "<span>交接留痕</span><strong>" + handoff.summary.checkpoint_records + " 筆</strong>",
                        "<span>發布狀態</span><strong>" + escapeHtml(simpleStatusText(release.readiness.release_status)) + "</strong>",
                    "</div>",
                "</div>",
            "</div>",
            "<div class=\"tfse-completion-exportbar\">",
                "<span>要交付給老板、運維或外部人員時，優先匯出這幾個包：</span>",
                completionJumpButton("[data-admin-plan-closure-export]", "閉環總表", "tfse-completion-export"),
                completionJumpButton("[data-admin-operations-tasks-export]", "任務隊列", "tfse-completion-export"),
                completionJumpButton("[data-admin-release-readiness-export]", "發布交接", "tfse-completion-export"),
                completionJumpButton("[data-admin-launch-handoff-export]", "總交接清單", "tfse-completion-export"),
            "</div>"
        ].join("");
    }

    function renderAcceptanceChecklist() {
        if (!acceptanceChecklistPanel) return;
        var payload = acceptanceChecklistPayload();
        var groups = {};
        payload.items.forEach(function (item) {
            groups[item.group] = groups[item.group] || [];
            groups[item.group].push(item);
        });
        acceptanceChecklistPanel.innerHTML = [
            "<p>已準備：" + payload.ready_count + " 項；待外部配置或正式驗證：" + payload.pending_count + " 項。此清單對應專案計畫第 17 章驗收項目。</p>",
            "<p>狀態統計：ready " + (payload.status_counts.ready || 0) + "；manual_browser " + (payload.status_counts.manual_browser || 0) + "；external_pending " + (payload.status_counts.external_pending || 0) + "。</p>",
            Object.keys(groups).map(function (group) {
                return [
                    "<h6 class=\"mt-4\">" + escapeHtml(group) + "</h6>",
                    groups[group].map(function (item) {
                        return [
                            "<p><strong>" + escapeHtml(item.label) + "</strong>",
                            "<br>" + escapeHtml(auditStatusLabel(item.status, item.done)) + " ｜ " + escapeHtml(item.evidence),
                            "</p>"
                        ].join("");
                    }).join("")
                ].join("");
            }).join("")
        ].join("");
    }

    function renderExternalVerification() {
        if (!externalVerificationPanel) return;
        var payload = externalVerificationPayload();
        var pending = payload.items.filter(function (item) { return !item.verified; });
        externalVerificationPanel.innerHTML = [
            "<p>需驗證：" + payload.summary.required_items + " 項；已配置：" + payload.summary.configured_items + "；已通過：" + payload.summary.verified_items + "。</p>",
            pending.slice(0, 8).map(function (item) {
                return "<p><strong>" + escapeHtml(item.label) + "</strong><br>" + (item.configured ? "已配置，待收件留痕" : "待正式配置") + "</p>";
            }).join("") || "<p>外部配置均已留痕通過；正式上線後仍需週期複查。</p>"
        ].join("");
    }

    function renderBrowserAcceptance() {
        if (!browserAcceptancePanel) return;
        var payload = browserAcceptanceReportPayload();
        var records = getBrowserAcceptanceRecords();
        if (browserAcceptanceItem) {
            browserAcceptanceItem.innerHTML = [
                "<option value=\"\">選擇待驗項目</option>",
                payload.items.map(function (item) {
                    return "<option value=\"" + escapeHtml(item.key) + "\">" + escapeHtml(item.group + "｜" + item.label) + "</option>";
                }).join("")
            ].join("");
        }
        browserAcceptancePanel.innerHTML = [
            "<p>瀏覽器驗收項目：" + payload.items.length + " 項；已留痕通過：" + payload.passed_count + " 項；待留痕：" + payload.pending_count + " 項。</p>",
            "<p>留痕需填寫頁面、viewport、瀏覽器或截圖/錄影連結；不得填寫證件、帳戶、卡號、密碼等敏感資料。</p>",
            records.length ? records.slice(0, 6).map(function (record) {
                return [
                    "<p><strong>" + escapeHtml(record.item_label || record.item_key) + "</strong>",
                    "<br>" + escapeHtml(record.result + " ｜ " + record.viewport + " ｜ " + formatDate(record.checked_at)),
                    "<br>" + escapeHtml(record.evidence_note || "-"),
                    "</p>"
                ].join("");
            }).join("") : "<p>尚無人工驗收留痕。</p>"
        ].join("");
    }

    function renderLegalReview() {
        if (!legalReviewPanel) return;
        var payload = legalReviewPayload();
        var external = legalExternalReviewPayload();
        legalReviewPanel.innerHTML = [
            "<p>送審項目：" + payload.items.length + " 項；需外部/人工複核：" + ((payload.status_counts.external_pending || 0) + (payload.status_counts.manual_external || 0) + (payload.status_counts.needs_review || 0)) + " 項。此包供正式投流、SEO 大量收錄與 Line OA 對外承接前交給法務/合規複核。</p>",
            "<p>外部複核狀態：" + escapeHtml(external.status) + "；留痕 " + external.summary.external_records + " 筆；最近通過：" + escapeHtml(external.summary.latest_passed_at || "尚未完成") + "。</p>",
            payload.items.map(function (item) {
                return [
                    "<p><strong>" + escapeHtml(item.group + "｜" + item.label) + "</strong>",
                    "<br>" + escapeHtml(auditStatusLabel(item.status, item.status === "ready")) + " ｜ " + escapeHtml(item.evidence),
                    "</p>"
                ].join("");
            }).join("")
        ].join("");
    }

    function renderContentVersions() {
        if (!contentVersionsPanel) return;
        var payload = contentVersionPayload();
        var apiCutover = contentApiCutoverPayload();
        contentVersionsPanel.innerHTML = [
            "<p>內容覆蓋：產品 " + payload.counts.product_overrides + " 筆；文章 " + payload.counts.article_overrides + " 筆；FAQ " + payload.counts.faq_overrides + " 筆。</p>",
            "<p>狀態覆蓋：產品 " + payload.counts.product_status_overrides + " 筆；文章 " + payload.counts.article_status_overrides + " 筆；相關審計 " + payload.counts.audit_entries + " 筆。</p>",
            "<p>內容 API 切換：" + escapeHtml(apiCutover.status) + "；公開端點 " + apiCutover.backend_target.expected_public_endpoints.length + " 項；阻擋 " + apiCutover.blockers.length + " 項。</p>",
            payload.audit_trail.length ? payload.audit_trail.slice(0, 8).map(function (item) {
                return "<p><strong>" + escapeHtml(item.action) + "</strong><br>" + escapeHtml(formatDate(item.at)) + " ｜ " + escapeHtml(item.role || "-") + " ｜ " + escapeHtml(item.target || "-") + "</p>";
            }).join("") : "<p>尚無內容版本覆蓋。編輯產品、文章或 FAQ 後會在此累積版本紀錄。</p>"
        ].join("");
    }

    function renderFormRisk() {
        if (!formRiskPanel) return;
        var payload = formRiskPayload();
        var turnstile = turnstileBackendPayload();
        formRiskPanel.innerHTML = [
            "<p>線索：" + payload.counts.leads + " 筆；重複組合：" + payload.counts.duplicate_groups + " 組；同裝置多筆：" + payload.counts.repeated_devices + " 組。</p>",
            "<p>Turnstile：" + (payload.controls.turnstile_configured ? "已配置" : "待正式配置") + "；缺隱私同意：" + payload.counts.missing_privacy_consent + " 筆；缺 device_id：" + payload.counts.missing_device_id + " 筆。</p>",
            "<p>後端 Turnstile 驗收：" + escapeHtml(turnstile.status) + "；負向測試 " + turnstile.negative_test_cases.length + " 項。</p>",
            payload.risk_notes.slice(0, 5).map(function (note) {
                return "<p><strong>檢查建議</strong><br>" + escapeHtml(note) + "</p>";
            }).join("")
        ].join("");
    }

    function getEvents() {
        try {
            return JSON.parse(localStorage.getItem("tfse_events") || "[]");
        } catch (error) {
            return [];
        }
    }

    function getErrors() {
        try {
            return JSON.parse(localStorage.getItem("tfse_errors") || "[]");
        } catch (error) {
            return [];
        }
    }

    function countEvents(events, name) {
        return events.filter(function (event) {
            return event.name === name;
        }).length;
    }

    function groupCount(items, getter) {
        return items.reduce(function (bucket, item) {
            var key = getter(item) || "unknown";
            bucket[key] = (bucket[key] || 0) + 1;
            return bucket;
        }, {});
    }

    function sortCountMap(map) {
        return Object.keys(map).map(function (key) {
            return { key: key, count: map[key] };
        }).sort(function (a, b) {
            return b.count - a.count;
        });
    }

    function conversionRate(numerator, denominator) {
        if (!denominator) return 0;
        return Math.round((numerator / denominator) * 10000) / 100;
    }

    function attributionKey(parts) {
        return [
            parts.source || "direct",
            parts.medium || "none",
            parts.campaign || "none",
            parts.content || "none",
            parts.term || "none"
        ].join("|");
    }

    function attributionLabel(item) {
        return [
            item.utm_source || "direct",
            item.utm_medium || "none",
            item.utm_campaign || "none"
        ].join(" / ");
    }

    function makeAttributionBucket(parts) {
        return {
            utm_source: parts.source || "direct",
            utm_medium: parts.medium || "",
            utm_campaign: parts.campaign || "",
            utm_content: parts.content || "",
            utm_term: parts.term || "",
            landing_page_views: 0,
            free_check_cta_clicks: 0,
            form_submits: 0,
            line_clicks: 0,
            leads: 0,
            needs: {},
            statuses: {},
            pages: {}
        };
    }

    function eventAttributionParts(event) {
        var payload = event.payload || {};
        return {
            source: event.utm_source || payload.utm_source || payload.source || "",
            medium: event.utm_medium || payload.utm_medium || "",
            campaign: event.utm_campaign || payload.utm_campaign || "",
            content: event.utm_content || payload.utm_content || "",
            term: event.utm_term || payload.utm_term || ""
        };
    }

    function leadAttributionParts(lead) {
        return {
            source: lead.utm_source || lead.source_channel || "direct",
            medium: lead.utm_medium || "",
            campaign: lead.utm_campaign || "",
            content: lead.utm_content || "",
            term: lead.utm_term || ""
        };
    }

    function topCountItems(map, limit) {
        return sortCountMap(map).slice(0, limit || 5);
    }

    function attributionPayload() {
        var events = getEvents();
        var leads = getLeads();
        var buckets = {};
        function bucketFor(parts) {
            var key = attributionKey(parts);
            if (!buckets[key]) buckets[key] = makeAttributionBucket(parts);
            return buckets[key];
        }

        events.forEach(function (event) {
            var bucket = bucketFor(eventAttributionParts(event));
            if (event.name === "landing_page_view") bucket.landing_page_views += 1;
            if (event.name === "cta_free_check_click") bucket.free_check_cta_clicks += 1;
            if (event.name === "lead_submit") bucket.form_submits += 1;
            if (event.name === "line_cta_click") bucket.line_clicks += 1;
            var path = event.path || "/";
            bucket.pages[path] = (bucket.pages[path] || 0) + 1;
        });

        leads.forEach(function (lead) {
            var bucket = bucketFor(leadAttributionParts(lead));
            bucket.leads += 1;
            bucket.needs[lead.needs || "未填需求"] = (bucket.needs[lead.needs || "未填需求"] || 0) + 1;
            bucket.statuses[lead.status || "new"] = (bucket.statuses[lead.status || "new"] || 0) + 1;
        });

        var campaigns = Object.keys(buckets).map(function (key) {
            var item = buckets[key];
            var landingOrClicks = item.landing_page_views || item.free_check_cta_clicks;
            var submitBase = item.free_check_cta_clicks || item.landing_page_views;
            var actions = [];
            if (!item.leads && (item.landing_page_views || item.free_check_cta_clicks)) {
                actions.push("有流量但尚無線索，優先檢查落地頁表單位置、隱私同意與 CTA 文案。");
            }
            if (submitBase && conversionRate(item.leads || item.form_submits, submitBase) < 15) {
                actions.push("表單轉換偏低，建議測試較短表單說明與更明確的非代辦邊界。");
            }
            if (item.leads && conversionRate(item.line_clicks, item.leads) < 50) {
                actions.push("Line 承接偏低，確認成功訊息、Line OA URL 與需求 quick reply 是否一致。");
            }
            return {
                attribution_key: key,
                label: attributionLabel(item),
                utm_source: item.utm_source,
                utm_medium: item.utm_medium,
                utm_campaign: item.utm_campaign,
                utm_content: item.utm_content,
                utm_term: item.utm_term,
                landing_page_views: item.landing_page_views,
                free_check_cta_clicks: item.free_check_cta_clicks,
                form_submits: item.form_submits,
                line_clicks: item.line_clicks,
                leads: item.leads,
                lead_rate_percent: conversionRate(item.leads || item.form_submits, landingOrClicks),
                line_click_rate_percent: conversionRate(item.line_clicks, item.leads || item.form_submits),
                top_needs: topCountItems(item.needs, 5),
                lead_statuses: topCountItems(item.statuses, 5),
                top_pages: topCountItems(item.pages, 5),
                next_actions: actions
            };
        }).sort(function (a, b) {
            return (b.leads + b.form_submits + b.free_check_cta_clicks) - (a.leads + a.form_submits + a.free_check_cta_clicks);
        });

        return {
            format: "tfse_utm_attribution_report",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source_mode: leadSourceMode,
            privacy_note: "報表僅輸出聚合歸因數字，不含完整手機、Line ID、補充說明或其他高敏個資。",
            utm_standard: adCampaignPayload().utm_standard,
            summary: {
                campaigns: campaigns.length,
                total_events: events.length,
                total_leads: leads.length,
                attributed_leads: campaigns.reduce(function (sum, item) { return sum + item.leads; }, 0),
                paid_social_leads: campaigns.filter(function (item) { return item.utm_medium === "paid_social"; }).reduce(function (sum, item) { return sum + item.leads; }, 0),
                direct_or_unknown_leads: campaigns.filter(function (item) { return item.utm_source === "direct" || item.utm_source === "unknown"; }).reduce(function (sum, item) { return sum + item.leads; }, 0)
            },
            campaigns: campaigns,
            next_actions: campaigns.length ? campaigns.reduce(function (list, item) {
                return list.concat(item.next_actions.map(function (action) {
                    return item.label + "：" + action;
                }));
            }, []).slice(0, 8) : ["尚無 UTM 歸因資料，投流前需確認落地頁 URL 帶 utm_source、utm_medium、utm_campaign、utm_content 與 utm_term。"]
        };
    }

    function buildRetrospectiveReport() {
        var events = getEvents();
        var leads = getLeads();
        var errors = getErrors();
        var pageViews = countEvents(events, "page_view");
        var ctaClicks = countEvents(events, "cta_free_check_click");
        var leadSubmits = countEvents(events, "lead_submit");
        var lineClicks = countEvents(events, "line_cta_click");
        var searchEvents = countEvents(events, "site_search") + countEvents(events, "database_search");
        var sourceBreakdown = sortCountMap(groupCount(leads, function (lead) {
            return lead.utm_source || lead.source_channel || "direct";
        }));
        var needBreakdown = sortCountMap(groupCount(leads, function (lead) {
            return lead.needs || "未填需求";
        }));
        var pageBreakdown = sortCountMap(groupCount(events, function (event) {
            return event.path || "/";
        })).slice(0, 10);
        var suggestions = [];

        if (pageViews && conversionRate(ctaClicks, pageViews) < 2) {
            suggestions.push("免費財務健檢查詢 CTA 點擊率偏低，優先檢查首頁、分類頁與文章頁 CTA 文案是否清楚。");
        }
        if (ctaClicks && conversionRate(leadSubmits, ctaClicks) < 20) {
            suggestions.push("表單提交率偏低，檢查欄位數量、錯誤提示、隱私同意和 Line 承接說明。");
        }
        if (leadSubmits && conversionRate(lineClicks, leadSubmits) < 50) {
            suggestions.push("Line 承接點擊率偏低，確認 Line OA 連結、成功訊息和分群標籤是否足夠明確。");
        }
        if (errors.length) {
            suggestions.push("前台已有錯誤紀錄，需優先核對 Sentry 或伺服器事件端點。");
        }
        if (!events.length) {
            suggestions.push("目前尚無事件資料，正式上線前需填入 GA4、Meta Pixel 與 Server Event endpoint 後重測。");
        }

        return {
            format: "tfse_retrospective_report",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source_mode: leadSourceMode,
            funnel: {
                page_view: pageViews,
                free_check_cta_click: ctaClicks,
                lead_submit: leadSubmits,
                line_cta_click: lineClicks,
                cta_click_rate_percent: conversionRate(ctaClicks, pageViews),
                lead_submit_rate_percent: conversionRate(leadSubmits, ctaClicks),
                line_click_rate_percent: conversionRate(lineClicks, leadSubmits)
            },
            engagement: {
                site_search_and_database_search: searchEvents,
                database_filter: countEvents(events, "database_filter"),
                article_click: countEvents(events, "article_click"),
                landing_page_view: countEvents(events, "landing_page_view")
            },
            lead_summary: {
                total: leads.length,
                by_source: sourceBreakdown,
                by_need: needBreakdown,
                by_status: sortCountMap(groupCount(leads, function (lead) { return lead.status || "new"; }))
            },
            top_paths: pageBreakdown,
            quality: {
                error_count: errors.length,
                latest_error: errors[0] ? {
                    source: errors[0].source || "",
                    message: errors[0].message || "",
                    at: errors[0].at || ""
                } : null
            },
            next_actions: suggestions
        };
    }

    function trackingConsentRecord() {
        try {
            return JSON.parse(localStorage.getItem("tfse_tracking_consent") || "null");
        } catch (error) {
            return null;
        }
    }

    function trackingConsentPayload() {
        var events = getEvents();
        var consent = trackingConsentRecord();
        var analytics = (siteConfigData && siteConfigData.analytics) || {};
        var externalConfigured = !!(analytics.ga4_measurement_id || analytics.meta_pixel_id || analytics.server_event_endpoint);
        var consentEvents = events.filter(function (event) {
            return event.name === "tracking_consent_update";
        });
        var blockers = [];
        if (externalConfigured && !(consent && consent.analytics)) blockers.push("正式外部追蹤已配置或待配置，但目前未取得 analytics 同意。");
        if (!consentEvents.length) blockers.push("尚無 tracking_consent_update 本機事件留痕。");
        return {
            format: "tfse_tracking_consent_audit",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            storage_key: "tfse_tracking_consent",
            consent_status: consent ? (consent.analytics ? "granted" : "declined") : "unset",
            consent_record: consent || null,
            external_destinations: {
                ga4: !!analytics.ga4_measurement_id,
                meta_pixel: !!analytics.meta_pixel_id,
                server_event_endpoint: !!analytics.server_event_endpoint,
                sentry_error_reporting: !!analytics.sentry_dsn
            },
            event_counts: {
                total_events: events.length,
                consent_updates: consentEvents.length,
                local_page_views: countEvents(events, "page_view")
            },
            policy: {
                local_events: "本機去識別事件可用於 MVP 復盤，不直接送往外部平台。",
                external_analytics: "GA4、Meta Pixel 與 Server Event 需取得 analytics 同意後才轉發。",
                error_reporting: "Sentry 僅收錯誤摘要，beforeSend 會遮罩敏感欄位。"
            },
            blockers: blockers,
            related_exports: ["tfse_retrospective_report", "tfse_monitoring_receipt_checklist", "tfse_external_verification_evidence", "tfse_legal_compliance_review_package"]
        };
    }

    function eventReplayPayload() {
        var events = getEvents();
        var analytics = ((siteConfigData || {}).analytics) || {};
        var requiredNames = [
            "page_view",
            "cta_free_check_click",
            "lead_submit",
            "line_cta_click",
            "site_search",
            "database_filter",
            "landing_page_view"
        ];
        var queue = events.slice(0, 100).map(function (event, index) {
            return {
                replay_id: "event_" + String(index + 1).padStart(3, "0"),
                name: event.name || "",
                path: event.path || "",
                url_path: event.url ? String(event.url).replace(/^https?:\/\/[^/]+/i, "") : "",
                referrer_path: event.referrer ? String(event.referrer).replace(/^https?:\/\/[^/]+/i, "") : "",
                payload: event.payload || {},
                at: event.at || "",
                delivery_status: analytics.server_event_endpoint ? "ready_for_server_event_endpoint" : "pending_server_event_endpoint"
            };
        });
        var observed = groupCount(events, function (event) { return event.name || "unknown"; });
        var missingRequired = requiredNames.filter(function (name) { return !observed[name]; });
        var destinations = {
            ga4: !!analytics.ga4_measurement_id,
            meta_pixel: !!analytics.meta_pixel_id,
            server_event_endpoint: !!analytics.server_event_endpoint,
            sample_rate: analytics.sample_rate || 1
        };
        return {
            format: "tfse_server_event_replay_queue",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source_mode: leadSourceMode,
            privacy_note: "事件重放隊列沿用 tfse-events.js scrub 規則，只輸出去識別 payload、路徑與事件名稱，不輸出完整手機、Line ID、姓名、補充說明或其他高敏個資。",
            destinations: destinations,
            counts: {
                events: events.length,
                queued_events: queue.length,
                unique_event_names: Object.keys(observed).length,
                pending_server_event_endpoint: analytics.server_event_endpoint ? 0 : queue.length,
                missing_required_event_names: missingRequired.length
            },
            event_name_counts: sortCountMap(observed),
            missing_required_event_names: missingRequired,
            queue: queue,
            replay_steps: [
                "正式 endpoint 上線後，先以本隊列前 20 筆驗證 schema 與回應碼。",
                "確認 GA4、Meta、Server Event 事件名一致，再提高 sample_rate。",
                "回放失敗寫入 audit_logs 或 dead-letter queue，不重送敏感原始 payload。"
            ]
        };
    }

    function monitoringReceiptPayload() {
        var events = getEvents();
        var errors = getErrors();
        var analytics = ((siteConfigData || {}).analytics) || {};
        var required = ["page_view", "cta_free_check_click", "database_search", "lead_submit", "line_cta_click"];
        var observed = groupCount(events, function (event) { return event.name || "unknown"; });
        var missing = required.filter(function (name) { return !observed[name]; });
        var blockers = [
            analytics.ga4_measurement_id ? "" : "GA4 Measurement ID 待填。",
            analytics.meta_pixel_id ? "" : "Meta Pixel ID 待填。",
            analytics.server_event_endpoint ? "" : "Server Event endpoint 待填。",
            analytics.sentry_dsn ? "" : "Sentry DSN 待填。",
            missing.length ? "本機尚未觀測事件：" + missing.join("、") : ""
        ].filter(Boolean);
        return {
            format: "tfse_monitoring_receipt_checklist",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            privacy_note: "只輸出事件名、配置狀態與收件核對項，不輸出高敏個資。",
            destinations: {
                ga4: !!analytics.ga4_measurement_id,
                meta_pixel: !!analytics.meta_pixel_id,
                server_event_endpoint: !!analytics.server_event_endpoint,
                sentry: !!analytics.sentry_dsn,
                sample_rate: analytics.sample_rate || 1
            },
            summary: {
                events: events.length,
                errors: errors.length,
                required_events: required.length,
                missing_required_events: missing.length,
                blockers: blockers.length
            },
            required_events: required,
            missing_required_events: missing,
            receipt_checks: [
                "GA4 Realtime / DebugView 可看到必要事件。",
                "Meta Events Manager 可看到 PageView、Lead、Contact、Search。",
                "Server Event endpoint 可收到去識別 payload 並落庫。",
                "Sentry 可收到測試錯誤且 beforeSend 已遮罩個資。",
                "核對後在外部配置驗證留痕保存責任人與證據備註。"
            ],
            blockers: blockers,
            related_exports: ["tfse_server_event_replay_queue", "tfse_external_verification_evidence", "tfse_launch_health_check"]
        };
    }

    function sentryVerificationPayload() {
        var errors = getErrors();
        var analytics = ((siteConfigData || {}).analytics) || {};
        var blockers = [
            analytics.sentry_dsn ? "" : "Sentry DSN 待填。",
            errors.length ? "" : "本機尚未觀測測試錯誤；正式驗收需觸發受控前台錯誤。",
            ((siteConfigData || {}).backend || {}).api_base_url ? "" : "正式後端 API 尚未配置；server-side Sentry 需於 API 上線後驗證。"
        ].filter(Boolean);
        var recentErrors = errors.slice(0, 10).map(function (error) {
            return {
                source: error.source || "unknown",
                message_preview: String(error.message || "").slice(0, 160),
                at: error.at || "",
                path: error.path || ""
            };
        });
        return {
            format: "tfse_sentry_error_verification_package",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            status: blockers.length ? "pending_sentry_error_verification" : "ready_for_sentry_error_verification",
            privacy_note: "此包只保存 DSN 是否配置、去識別錯誤摘要、驗收步驟與外部證據欄位；不得保存 stack trace 全文、cookie、session、完整手機、Line ID、備註或表單原文。",
            destinations: {
                browser_sentry_dsn_configured: !!analytics.sentry_dsn,
                server_sentry_required: true,
                api_base_url_configured: !!(((siteConfigData || {}).backend || {}).api_base_url),
                local_error_count: errors.length
            },
            required_controls: [
                "前台 Sentry Browser SDK 只在正式 DSN 配置後載入。",
                "beforeSend 或等效 hook 需遮罩 phone、line_id、message、cookie、authorization、token、cf_turnstile_response。",
                "正式 API 需啟用 server-side Sentry，並以環境標籤區分 production / staging。",
                "source map 若上傳到 Sentry，不得公開暴露於靜態站根目錄。",
                "P0/P1 錯誤需能連到 incident response 與 rollback 記錄。"
            ],
            test_cases: [
                { key: "browser_test_error", expected: "Sentry issues 收到受控前台測試錯誤，payload 無敏感欄位" },
                { key: "api_test_error", expected: "正式 API staging 收到受控 server error，response 不暴露 stack trace" },
                { key: "sensitive_payload_masking", expected: "手機、Line ID、cookie、token、備註在 Sentry event 中被遮罩或移除" },
                { key: "environment_tag", expected: "environment、release、page_path 或 route 標籤可用於排查" },
                { key: "incident_linkage", expected: "P0/P1 測試事件可回填 incident_response_package 或 audit_logs" }
            ],
            recent_local_errors: recentErrors,
            evidence_fields: ["checked_case", "sentry_issue_id", "environment", "release", "masked_fields_verified", "screenshot_url", "reviewer_role", "checked_at", "evidence_note"],
            blockers: blockers,
            related_exports: ["tfse_monitoring_receipt_checklist", "tfse_incident_response_package", "tfse_external_verification_evidence", "tfse_host_fallback_deployment_check"]
        };
    }

    function analyticsDebugPayload() {
        var events = getEvents();
        var analytics = ((siteConfigData || {}).analytics) || {};
        var consent = trackingConsentRecord();
        var requiredMappings = [
            { local_event: "page_view", ga4_event: "page_view", meta_event: "PageView", expected_payload: ["page_path", "utm_source"] },
            { local_event: "cta_free_check_click", ga4_event: "select_content", meta_event: "Contact", expected_payload: ["cta", "page_path"] },
            { local_event: "lead_submit", ga4_event: "generate_lead", meta_event: "Lead", expected_payload: ["needs", "utm_source", "consent_line"] },
            { local_event: "line_cta_click", ga4_event: "contact", meta_event: "Contact", expected_payload: ["line_oa_url", "utm_source"] },
            { local_event: "site_search", ga4_event: "search", meta_event: "Search", expected_payload: ["search_term"] },
            { local_event: "database_filter", ga4_event: "filter_database", meta_event: "Search", expected_payload: ["category", "audience"] }
        ];
        var observed = groupCount(events, function (event) { return event.name || "unknown"; });
        var missing = requiredMappings.filter(function (item) { return !observed[item.local_event]; });
        var blockers = [
            analytics.ga4_measurement_id ? "" : "GA4 Measurement ID 待填。",
            analytics.meta_pixel_id ? "" : "Meta Pixel ID 待填。",
            consent && consent.analytics ? "" : "尚未取得 analytics 追蹤同意，正式 GA4/Meta 不應收件。",
            missing.length ? "本機尚未觀測必要事件：" + missing.map(function (item) { return item.local_event; }).join("、") : ""
        ].filter(Boolean);
        return {
            format: "tfse_analytics_debug_verification_package",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            status: blockers.length ? "pending_analytics_debug_verification" : "ready_for_analytics_debug_verification",
            privacy_note: "只輸出事件名稱、映射、配置狀態、UTM 鍵與證據欄位，不輸出手機、Line ID、姓名、Email、備註或其他高敏個資。",
            destinations: {
                ga4_measurement_id_configured: !!analytics.ga4_measurement_id,
                meta_pixel_id_configured: !!analytics.meta_pixel_id,
                server_event_endpoint_configured: !!analytics.server_event_endpoint,
                analytics_consent_granted: !!(consent && consent.analytics),
                sample_rate: analytics.sample_rate || 1
            },
            event_mappings: requiredMappings.map(function (item) {
                return {
                    local_event: item.local_event,
                    ga4_event: item.ga4_event,
                    meta_event: item.meta_event,
                    observed_count: observed[item.local_event] || 0,
                    expected_payload: item.expected_payload
                };
            }),
            debug_steps: [
                "填入正式 GA4 Measurement ID 與 Meta Pixel ID 後，先在 staging 或正式小流量環境測試。",
                "接受 analytics 追蹤同意，確認 localStorage 有 tfse_tracking_consent 且事件 tracking_consent_update 已記錄。",
                "依序瀏覽首頁、資料庫、搜尋、篩選、免費財務健檢查詢提交與 Line CTA。",
                "在 GA4 Realtime / DebugView 檢查 page_view、generate_lead、search、contact 等事件。",
                "在 Meta Events Manager 檢查 PageView、Lead、Contact、Search，並確認 Event Match Quality 未使用敏感明文。",
                "若啟用 Server Event endpoint，與 tfse_server_event_replay_queue 對照事件名與去識別 payload。",
                "保存 platform、event_name、observed_at、result、debug_url、screenshot_url、reviewer_role 與 evidence_note。"
            ],
            evidence_fields: ["platform", "event_name", "local_event", "observed_at", "result", "debug_url", "screenshot_url", "reviewer_role", "evidence_note"],
            blockers: blockers,
            related_exports: ["tfse_tracking_consent_audit", "tfse_server_event_replay_queue", "tfse_monitoring_receipt_checklist", "tfse_external_verification_evidence"]
        };
    }

    function getArticleStatusOverrides() {
        try {
            return JSON.parse(localStorage.getItem("tfse_article_status") || "{}");
        } catch (error) {
            return {};
        }
    }

    function getArticleOverrides() {
        try {
            return JSON.parse(localStorage.getItem("tfse_article_overrides") || "{}");
        } catch (error) {
            return {};
        }
    }

    function articleView(article) {
        var overrides = getArticleOverrides()[article.id] || {};
        var copy = {};
        Object.keys(article).forEach(function (key) {
            copy[key] = article[key];
        });
        Object.keys(overrides).forEach(function (key) {
            copy[key] = overrides[key];
        });
        copy.status = articleStatus(copy);
        return copy;
    }

    function saveArticleOverride(articleId, fields) {
        var current = articleView(articleData.filter(function (item) { return item.id === articleId; })[0] || { id: articleId });
        var payload = Object.assign({}, current, fields, { id: articleId });
        var overrides = getArticleOverrides();
        overrides[articleId] = Object.assign({}, overrides[articleId] || {}, fields, {
            local_updated_at: new Date().toISOString()
        });
        localStorage.setItem("tfse_article_overrides", JSON.stringify(overrides));
        addAudit("article_content_update", articleId + ":" + articleSourceMode);
        if (window.TFSEApi && window.TFSEApi.saveAdminArticle) {
            window.TFSEApi.saveAdminArticle(articleId, payload).then(function (result) {
                articleSourceMode = result.mode || articleSourceMode;
                addAudit("article_content_persist", articleId + ":" + articleSourceMode);
                if (result.item && result.mode === "api") syncAdminContentFromApi();
            }).catch(function (error) {
                addAudit("article_content_persist_failed", articleId + ":" + (error && error.message ? error.message : error));
            });
        }
    }

    function saveArticleStatus(articleId, nextStatus, action) {
        var current = articleView(articleData.filter(function (item) { return item.id === articleId; })[0] || { id: articleId });
        var payload = Object.assign({}, current, { id: articleId, status: nextStatus, updated_at: new Date().toISOString().slice(0, 10) });
        var overrides = getArticleStatusOverrides();
        overrides[articleId] = nextStatus;
        localStorage.setItem("tfse_article_status", JSON.stringify(overrides));
        var contentOverrides = getArticleOverrides();
        contentOverrides[articleId] = Object.assign({}, contentOverrides[articleId] || {}, {
            status: nextStatus,
            local_updated_at: new Date().toISOString()
        });
        localStorage.setItem("tfse_article_overrides", JSON.stringify(contentOverrides));
        addAudit(action || "article_status_update", articleId + ":" + nextStatus + ":" + articleSourceMode);
        if (window.TFSEApi && window.TFSEApi.saveAdminArticle) {
            window.TFSEApi.saveAdminArticle(articleId, payload).then(function (result) {
                articleSourceMode = result.mode || articleSourceMode;
                addAudit((action || "article_status_update") + "_persist", articleId + ":" + nextStatus + ":" + articleSourceMode);
                if (result.item && result.mode === "api") syncAdminContentFromApi();
            }).catch(function (error) {
                addAudit("article_status_persist_failed", articleId + ":" + (error && error.message ? error.message : error));
            });
        }
    }

    function getFaqOverrides() {
        try {
            return JSON.parse(localStorage.getItem("tfse_faq_overrides") || "{}");
        } catch (error) {
            return {};
        }
    }

    function faqView(item, index) {
        var id = item.id || "faq_" + index;
        var overrides = getFaqOverrides()[id] || {};
        var copy = {
            id: id,
            question: item.question,
            answer: item.answer
        };
        Object.keys(overrides).forEach(function (key) {
            copy[key] = overrides[key];
        });
        return copy;
    }

    function saveFaqOverride(faqId, fields) {
        var overrides = getFaqOverrides();
        overrides[faqId] = Object.assign({}, overrides[faqId] || {}, fields, {
            local_updated_at: new Date().toISOString()
        });
        localStorage.setItem("tfse_faq_overrides", JSON.stringify(overrides));
        addAudit("faq_content_update", faqId);
    }

    function articleStatus(article) {
        var overrides = getArticleStatusOverrides();
        return overrides[article.id] || article.status || "draft";
    }

    function getProductStatusOverrides() {
        try {
            return JSON.parse(localStorage.getItem("tfse_product_status") || "{}");
        } catch (error) {
            return {};
        }
    }

    function getProductOverrides() {
        try {
            return JSON.parse(localStorage.getItem("tfse_product_overrides") || "{}");
        } catch (error) {
            return {};
        }
    }

    function productView(product) {
        var overrides = getProductOverrides()[product.id] || {};
        var copy = {};
        Object.keys(product).forEach(function (key) {
            copy[key] = product[key];
        });
        Object.keys(overrides).forEach(function (key) {
            copy[key] = overrides[key];
        });
        copy.status = productStatus(copy);
        return copy;
    }

    function productStatus(product) {
        var overrides = getProductStatusOverrides();
        return overrides[product.id] || product.status || "來源待核驗";
    }

    function daysSince(value) {
        var time = Date.parse(value || "");
        if (!time) return 9999;
        return Math.floor((Date.now() - time) / (24 * 60 * 60 * 1000));
    }

    function sourceReviewItems() {
        return productData.map(function (item) {
            var product = productView(item);
            var status = productStatus(product);
            var sourceUrl = product.source_url || "";
            var updatedDays = daysSince(product.updated_at);
            var reasons = [];

            if (status === "來源待核驗" || status === "需更新") reasons.push(status);
            if ((!sourceUrl || sourceUrl === "source-policy.html") && product.id !== "product_source_policy") reasons.push("需補官方來源連結");
            if (updatedDays > 90) reasons.push("超過 90 天未更新");

            return {
                id: product.id,
                title: product.title,
                category: product.category,
                status: status,
                source_title: product.source_title || "",
                source_url: sourceUrl || "source-policy.html",
                updated_at: product.updated_at || "",
                days_since_update: updatedDays,
                reasons: reasons
            };
        }).filter(function (item) {
            return item.reasons.length > 0;
        }).sort(function (a, b) {
            if (a.status === "需更新" && b.status !== "需更新") return -1;
            if (b.status === "需更新" && a.status !== "需更新") return 1;
            return b.days_since_update - a.days_since_update;
        });
    }

    function sourceReviewPayload() {
        var items = sourceReviewItems();
        return {
            format: "tfse_source_review_queue",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            review_cycle_days: 90,
            total: items.length,
            items: items
        };
    }

    function getSourceEvidenceRecords() {
        return mergeSeededRecords("tfse_source_evidence_records", sourceEvidenceSeedRecords || []);
    }

    function saveSourceEvidenceRecords(records) {
        localStorage.setItem("tfse_source_evidence_records", JSON.stringify(records.slice(0, 200)));
    }

    function sourceEvidencePayload() {
        var records = getSourceEvidenceRecords();
        return {
            format: "tfse_source_verification_evidence",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            review_cycle_days: 90,
            privacy_note: "來源復核留痕只保存資料 ID、官方來源 URL、結果、角色與證據備註摘要，不保存使用者個資。",
            counts: {
                total: records.length,
                approved: records.filter(function (item) { return item.result === "approved"; }).length,
                needs_revision: records.filter(function (item) { return item.result === "needs_revision"; }).length,
                rejected: records.filter(function (item) { return item.result === "rejected"; }).length
            },
            queue_snapshot: sourceReviewPayload().items,
            records: records,
            related_exports: ["tfse_source_review_queue", "tfse_content_version_snapshot", "tfse_formal_backend_migration_package"]
        };
    }

    function institutionImportPayload() {
        var evidence = sourceEvidencePayload();
        var statuses = groupCount(institutionData, function (item) { return item.verification_status || "unknown"; });
        var stale = institutionData.filter(function (item) {
            return daysSince(item.last_verified_at) > 180 || item.verification_status !== "verified";
        }).map(function (item) {
            return {
                id: item.id,
                name: item.name,
                verification_status: item.verification_status || "",
                last_verified_at: item.last_verified_at || "",
                official_url: item.official_url || "",
                reason: item.verification_status !== "verified" ? "verification_status_not_verified" : "last_verified_over_180_days"
            };
        });
        var importRows = institutionData.map(function (item) {
            return {
                id: item.id,
                name: item.name,
                type: item.type,
                region: item.region,
                official_url: item.official_url,
                registry_ref: item.registry_ref,
                verification_status: item.verification_status,
                last_verified_at: item.last_verified_at,
                required_version_record: "institution_source_versions"
            };
        });
        var blockers = [
            institutionData.length ? "" : "institutions.json 無資料可導入。",
            stale.length ? "有 " + stale.length + " 筆機構資料待復核或超過 180 天未核驗。" : "",
            evidence.counts.approved ? "" : "尚未保存來源復核 approved 留痕；正式導入前需至少保存抽查證據。"
        ].filter(Boolean);
        return {
            format: "tfse_institution_import_verification_package",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            status: blockers.length ? "pending_institution_import_verification" : "ready_for_institution_import_verification",
            privacy_note: "此包只保存公開機構資料、官方來源 URL、核驗狀態與導入證據欄位，不保存使用者個資、登入憑證或內部審核意見全文。",
            source_file: "assets/data/institutions.json",
            target_tables: ["institutions", "institution_source_versions", "source_verification_evidence", "audit_logs"],
            counts: {
                institutions: institutionData.length,
                verified: institutionData.filter(function (item) { return item.verification_status === "verified"; }).length,
                stale_or_unverified: stale.length,
                source_evidence_records: evidence.counts.total,
                approved_source_evidence: evidence.counts.approved
            },
            status_counts: statuses,
            import_rows: importRows,
            stale_or_unverified_items: stale,
            validation_steps: [
                "正式導入前確認 institutions.id 唯一，official_url 使用 https，registry_ref 不為空。",
                "將每筆 institution 寫入 institutions，並同步建立 institution_source_versions 版本紀錄。",
                "抽查主管機關、銀行公會、聯徵中心、法扶與官方公開來源頁面是否可訪問。",
                "導入後以 GET /api/institutions 與 Admin 來源復核頁核對筆數、排序、遮罩與來源連結。",
                "導入與版本建立需寫入 audit_logs，記錄導入者角色、批次 ID 與校驗結果。"
            ],
            evidence_fields: ["batch_id", "row_count", "version_record_count", "sample_ids", "official_url_checked", "audit_log_id", "reviewer_role", "checked_at", "evidence_note"],
            blockers: blockers,
            related_exports: ["tfse_source_verification_evidence", "tfse_formal_backend_migration_package", "tfse_import_validation_package", "tfse_source_review_queue"]
        };
    }

    function publicFeedbackPayload() {
        var sourceQueue = sourceReviewPayload();
        var sourceEvidence = sourceEvidencePayload();
        var privacy = privacyRequestPayload();
        var legal = legalReviewPayload();
        var localTickets = publicFeedbackItemsCache.length ? publicFeedbackItemsCache : safeReadStorage("tfse_public_feedback_tickets", []);
        var intakeTypes = [
            { type: "source_update", label: "資料來源更新", owner_role: "data_manager", sla: "3 個工作天內確認官方來源" },
            { type: "content_error", label: "內容錯誤回報", owner_role: "content_editor", sla: "3 個工作天內判斷是否修正文案或送審" },
            { type: "compliance_issue", label: "合規疑慮", owner_role: "compliance_reviewer", sla: "1 個工作天內初步分級" },
            { type: "privacy_request", label: "資料查詢/更正/刪除", owner_role: "compliance_reviewer", sla: "依隱私權政策與個資請求隊列處理" }
        ];
        return {
            format: "tfse_public_feedback_intake_package",
            version: "2026-06-27",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            source_page: "contact.html",
            contact_email: "info@tfse.tw",
            privacy_note: "此包定義正式收件與分流欄位，不保存 Email 原文、證件、帳戶、卡號、密碼或完整手機；正式版需只保留必要摘要與證據連結。",
            summary: {
                intake_types: intakeTypes.length,
                local_feedback_tickets: localTickets.length,
                feedback_source_mode: publicFeedbackSourceMode,
                source_review_items: sourceQueue.items.length,
                source_evidence_records: sourceEvidence.records.length,
                privacy_requests: privacy.items.length,
                legal_review_items: legal.items.length
            },
            local_feedback_tickets: localTickets.slice(0, 10),
            intake_types: intakeTypes,
            required_fields: ["feedback_type", "page_url", "summary", "official_source_url", "source_updated_at", "reporter_contact_hash", "phone_last3_optional", "consent_contact", "received_at"],
            forbidden_fields: ["national_id", "bank_account", "card_number", "password", "certificate_image", "full_financial_statement"],
            triage_rules: [
                "資料來源更新或連結失效轉入 source_review_tasks。",
                "內容錯誤回報需建立 content_version_snapshot 前後對照。",
                "涉及代辦、保證核貸、誤導或投訴時，升級 legal_compliance_review_packages。",
                "涉及查詢、更正、刪除個資時，建立 privacy_request_tasks 並遮罩聯絡資訊。",
                "無官方來源或包含高敏資料時，只保留去識別摘要並請回報者重新提供低敏資訊。"
            ],
            sla: {
                acknowledge: "2 個工作天內回覆已收到",
                source_update: "3 個工作天內完成初步來源核對",
                compliance_issue: "1 個工作天內完成風險分級",
                privacy_request: "依隱私權政策與法定要求處理"
            },
            sample_queue: [
                { feedback_type: "source_update", page_url: "products/{slug}.html", status: "ready_for_formal_intake", next_action: "建立 source_review_tasks 並保存官方來源 URL" },
                { feedback_type: "compliance_issue", page_url: "lp/{slug}.html", status: "ready_for_formal_intake", next_action: "建立 legal_compliance_review_packages 送審項" },
                { feedback_type: "privacy_request", page_url: "contact.html", status: "ready_for_formal_intake", next_action: "建立 privacy_request_tasks 並寫 audit_logs" }
            ],
            related_exports: ["tfse_source_review_queue", "tfse_source_verification_evidence", "tfse_content_version_snapshot", "tfse_privacy_request_queue", "tfse_legal_compliance_review_package"]
        };
    }

    function publicFeedbackApiVerificationPayload() {
        var intake = publicFeedbackPayload();
        var audit = getAuditLog();
        return {
            format: "tfse_public_feedback_api_verification_package",
            version: "2026-06-28",
            generated_at: new Date().toISOString(),
            generated_by_role: currentRole(),
            privacy_note: "此驗收包只保存回報類型、狀態碼、工單 ID、分流結果、角色與證據摘要；不得保存 Email 原文、完整手機、Line ID、證件、帳戶、卡號、密碼、附件原文或法律意見全文。",
            status: "pending_public_feedback_api_verification",
            backend_target: {
                intake_endpoint: "POST /api/public-feedback",
                admin_queue_endpoint: "GET /api/admin/public-feedback-intake",
                audit_endpoint: "GET /api/admin/audit-logs",
                target_tables: ["public_feedback_tickets", "source_review_tasks", "content_version_snapshots", "privacy_request_tasks", "legal_compliance_review_packages", "audit_logs"],
                allowed_public_fields: intake.required_fields,
                forbidden_fields: intake.forbidden_fields
            },
            local_context: {
                intake_types: intake.intake_types.length,
                source_review_items: intake.summary.source_review_items,
                source_evidence_records: intake.summary.source_evidence_records,
                privacy_requests: intake.summary.privacy_requests,
                legal_review_items: intake.summary.legal_review_items,
                audit_public_feedback_exports: audit.filter(function (item) {
                    return item.action === "public_feedback_export" || item.action === "public_feedback_api_export";
                }).length
            },
            required_controls: [
                "公開收件 API 需限流、驗證 honeypot/Turnstile 或同等防刷，並拒收證件、帳戶、卡號、密碼與附件原文。",
                "正式後端只保存去識別 summary、reporter_contact_hash、phone_last3、官方來源 URL、同意聯絡與分流結果。",
                "source_update 分流到 source_review_tasks，content_error 分流到 content_version_snapshots，privacy_request 分流到 privacy_request_tasks，compliance_issue 分流到 legal_compliance_review_packages。",
                "每次建立、分流、拒收、結案都需寫入 audit_logs 或工單歷史，且 audit_logs 不保存完整聯絡資訊。",
                "管理端查詢需套用 RBAC，content_editor / data_manager / compliance_reviewer 只能處理自己權責類型。"
            ],
            test_cases: [
                { key: "source_update_ticket", request: { feedback_type: "source_update", official_source_url: "https://example.gov.tw/source" }, expected: "public_feedback_tickets 建立 pending_triage，並可建立 source_review_tasks 關聯" },
                { key: "content_error_ticket", request: { feedback_type: "content_error", page_url: "articles.html" }, expected: "建立內容錯誤工單，必要時產生 content_version_snapshot 前後對照" },
                { key: "privacy_request_ticket", request: { feedback_type: "privacy_request" }, expected: "建立 privacy_request_tasks，聯絡欄位只保存 hash/末三碼" },
                { key: "compliance_issue_ticket", request: { feedback_type: "compliance_issue" }, expected: "升級 legal_compliance_review_packages 或合規審核待辦" },
                { key: "reject_sensitive_payload", request: { national_id: "A123456789", password: "secret" }, expected: "400/422 拒收或只保存去識別摘要，禁止欄位不落庫" }
            ],
            evidence_fields: [
                "endpoint",
                "status_code",
                "feedback_ticket_id",
                "feedback_type",
                "assigned_role",
                "related_task_type",
                "related_task_id",
                "forbidden_fields_rejected",
                "reporter_contact_hashed",
                "rate_limit_checked",
                "audit_log_id",
                "checked_at",
                "evidence_note"
            ],
            blockers: [
                "正式公開收件 API 尚未提供 public_feedback_tickets 入庫證據。",
                "尚需在 staging 執行 source_update、content_error、privacy_request、compliance_issue 與高敏欄位拒收測試。",
                "尚需抽查分流後的 source_review_tasks、content_version_snapshots、privacy_request_tasks 與 legal review 關聯。"
            ],
            related_exports: [
                "tfse_public_feedback_intake_package",
                "tfse_source_review_queue",
                "tfse_source_verification_evidence",
                "tfse_content_version_snapshot",
                "tfse_privacy_request_queue",
                "tfse_legal_compliance_review_package",
                "tfse_backend_acceptance_matrix"
            ]
        };
    }

    function saveProductOverride(productId, fields) {
        var current = productView(productData.filter(function (item) { return item.id === productId; })[0] || { id: productId });
        var payload = Object.assign({}, current, fields, { id: productId });
        var overrides = getProductOverrides();
        overrides[productId] = Object.assign({}, overrides[productId] || {}, fields, {
            local_updated_at: new Date().toISOString()
        });
        localStorage.setItem("tfse_product_overrides", JSON.stringify(overrides));
        addAudit("product_content_update", productId + ":" + productSourceMode);
        if (window.TFSEApi && window.TFSEApi.saveAdminProduct) {
            window.TFSEApi.saveAdminProduct(productId, payload).then(function (result) {
                productSourceMode = result.mode || productSourceMode;
                addAudit("product_content_persist", productId + ":" + productSourceMode);
                if (result.item && result.mode === "api") syncAdminContentFromApi();
            }).catch(function (error) {
                addAudit("product_content_persist_failed", productId + ":" + (error && error.message ? error.message : error));
            });
        }
    }

    function saveProductStatus(productId, nextStatus) {
        var current = productView(productData.filter(function (item) { return item.id === productId; })[0] || { id: productId });
        var payload = Object.assign({}, current, { id: productId, status: nextStatus, updated_at: new Date().toISOString().slice(0, 10) });
        var overrides = getProductStatusOverrides();
        overrides[productId] = nextStatus;
        localStorage.setItem("tfse_product_status", JSON.stringify(overrides));
        var contentOverrides = getProductOverrides();
        contentOverrides[productId] = Object.assign({}, contentOverrides[productId] || {}, {
            status: nextStatus,
            local_updated_at: new Date().toISOString()
        });
        localStorage.setItem("tfse_product_overrides", JSON.stringify(contentOverrides));
        addAudit("product_status_update", productId + ":" + nextStatus + ":" + productSourceMode);
        if (window.TFSEApi && window.TFSEApi.saveAdminProduct) {
            window.TFSEApi.saveAdminProduct(productId, payload).then(function (result) {
                productSourceMode = result.mode || productSourceMode;
                addAudit("product_status_persist", productId + ":" + nextStatus + ":" + productSourceMode);
                if (result.item && result.mode === "api") syncAdminContentFromApi();
            }).catch(function (error) {
                addAudit("product_status_persist_failed", productId + ":" + (error && error.message ? error.message : error));
            });
        }
    }

    function formatDate(value) {
        if (!value) return "-";
        try {
            return new Date(value).toLocaleString("zh-TW", { hour12: false });
        } catch (error) {
            return value;
        }
    }

    function renderCurrentDatePill() {
        if (!currentDatePill) return;
        var now = new Date();
        var weekday = ["日", "一", "二", "三", "四", "五", "六"][now.getDay()];
        currentDatePill.innerHTML = '<i class="fa fa-calendar"></i> ' + now.toLocaleDateString("zh-TW") + "（" + weekday + "）";
    }

    function renderRealMetrics() {
        if (!realMetricsPanel) return;
        var leads = getLeads();
        var followUps = followUpPayload();
        var legal = legalReviewPayload();
        var sourceCounts = visualTopCounts(leads, visualSourceOfLead);
        var pendingFeedback = publicFeedbackItemsCache.filter(function (item) {
            return (item.status || "queued") !== "closed" && (item.status || "queued") !== "resolved";
        }).length;
        var legalReviewCount = (legal.status_counts.needs_review || 0) + (legal.status_counts.external_pending || 0) + (legal.status_counts.manual_external || 0);
        realMetricsPanel.innerHTML = [
            "<article><span>今日待處理</span><strong>" + (followUps.counts.overdue_or_unscheduled || 0) + "</strong><small>高優先 " + (followUps.counts.high_priority || 0) + "</small><i class=\"fa fa-clipboard-list\"></i></article>",
            "<article><span>免費財務健檢查詢名單</span><strong>" + leads.length + "</strong><small>待聯繫 " + leads.filter(function (lead) { return (lead.status || "new") === "new"; }).length + "</small><i class=\"fa fa-heart\"></i></article>",
            "<article><span>來源追蹤（本月）</span><strong>" + Object.keys(sourceCounts).length + "</strong><small>有效來源 " + leads.length + "</small><i class=\"fa fa-search\"></i></article>",
            "<article><span>合規掃描（本月）</span><strong>" + legal.items.length + "</strong><small>需檢視 " + legalReviewCount + "</small><i class=\"fa fa-shield-alt\"></i></article>",
            "<article><span>資料回報工單</span><strong>" + publicFeedbackItemsCache.length + "</strong><small>待處理 " + pendingFeedback + "</small><i class=\"fa fa-inbox\"></i></article>"
        ].join("");
    }

    function loadJson(path, fallback) {
        return fetch(path)
            .then(function (response) {
                if (!response.ok) throw new Error(path + " " + response.status);
                return response.json();
            })
            .catch(function () {
                return fallback;
            });
    }

    function seedLeads() {
        addAudit("seed_leads_disabled", "後台已禁止產生測試線索，請使用前台表單提交真實資料。");
    }

    function createAdminProduct(payload) {
        var id = "product_admin_" + Date.now().toString(36);
        var item = Object.assign({
            id: id,
            slug: makeAdminSlug(payload.title, "product"),
            type: "admin_created",
            category: payload.category || "未分類",
            audience: "公開金融資訊查詢",
            region: "台灣",
            status: "來源待核驗",
            updated_at: new Date().toISOString().slice(0, 10)
        }, payload);
        productData.unshift(item);
        saveProductOverride(id, item);
        renderProducts();
        renderContentVersions();
        renderCompliance();
        return item;
    }

    function createAdminArticle(payload) {
        var id = "article_admin_" + Date.now().toString(36);
        var item = Object.assign({
            id: id,
            slug: makeAdminSlug(payload.title, "article"),
            category: payload.category || "未分類",
            status: "draft",
            keywords: [],
            updated_at: new Date().toISOString().slice(0, 10)
        }, payload);
        articleData.unshift(item);
        saveArticleOverride(id, item);
        renderArticles();
        renderArticleReview();
        renderContentVersions();
        renderCompliance();
        return item;
    }

    function filteredLeads() {
        var query = search ? search.value.trim().toLowerCase() : "";
        var statusValue = status ? status.value : "all";
        var tagValue = tagFilter ? tagFilter.value : "all";
        var sourceValue = sourceFilter ? sourceFilter.value : "all";

        return getLeads().filter(function (lead) {
            var haystack = [
                lead.display_name,
                lead.phone,
                lead.line_id,
                lead.needs,
                lead.region,
                (lead.tags || []).join(" ")
            ].join(" ").toLowerCase();
            var matchesSearch = !query || haystack.indexOf(query) !== -1;
            var matchesStatus = statusValue === "all" || lead.status === statusValue;
            var matchesTag = tagValue === "all" || (lead.tags || []).indexOf(tagValue) !== -1;
            var sourceHaystack = [lead.source_channel, lead.utm_source, lead.utm_medium].join(" ");
            var matchesSource = sourceValue === "all" || sourceHaystack.indexOf(sourceValue) !== -1;
            return matchesSearch && matchesStatus && matchesTag && matchesSource;
        });
    }

    function visualStatusLabel(value) {
        return {
            new: "待聯繫",
            contacted: "已聯繫",
            info_sent: "已發資料",
            consulted: "諮詢中",
            unresponsive: "待回覆",
            spam: "無效",
            closed: "成交",
            ready: "合規通過",
            needs_review: "需檢視",
            external_pending: "待外部設定",
            manual_external: "待人工驗收"
        }[value || "new"] || value || "待聯繫";
    }

    function visualSourceLabel(value) {
        return {
            seo: "Google 搜尋",
            direct: "官網免費財務健檢查詢",
            facebook: "FB/IG 廣告",
            paid_social: "社群廣告",
            line: "LINE OA",
            referral: "合作夥伴轉介"
        }[value || "direct"] || value || "官網";
    }

    function visualOwnerLabel(value) {
        return {
            consultant: "顧問組",
            data_manager: "資料管理",
            compliance_reviewer: "合規審核",
            admin: "管理員"
        }[value || "consultant"] || value || "顧問組";
    }

    function visualSourceOfLead(lead) {
        return lead.utm_source || lead.source_channel || "direct";
    }

    function visualOwnerOfLead(lead) {
        return lead.assigned_to || "consultant";
    }

    function visualFilteredLeads() {
        var query = String(visualConsoleState.query || "").trim().toLowerCase();
        var tabStatus = {
            consult: "consulted",
            clients: "closed"
        };
        return getLeads().filter(function (lead) {
            var sourceValue = visualSourceOfLead(lead);
            var ownerValue = visualOwnerOfLead(lead);
            var statusValue = lead.status || "new";
            var haystack = [
                lead.display_name,
                lead.phone,
                lead.line_id,
                lead.region,
                lead.needs,
                sourceValue,
                ownerValue,
                (lead.tags || []).join(" ")
            ].join(" ").toLowerCase();
            return (!query || haystack.indexOf(query) !== -1)
                && (!tabStatus[visualConsoleState.tab] || statusValue === tabStatus[visualConsoleState.tab])
                && (visualConsoleState.status === "all" || statusValue === visualConsoleState.status)
                && (visualConsoleState.source === "all" || sourceValue === visualConsoleState.source)
                && (visualConsoleState.owner === "all" || ownerValue === visualConsoleState.owner);
        }).sort(function (a, b) {
            return String(b.updated_at || b.submitted_at || "").localeCompare(String(a.updated_at || a.submitted_at || ""));
        });
    }

    function visualTopCounts(items, getter) {
        return items.reduce(function (bucket, item) {
            var key = getter(item) || "direct";
            bucket[key] = (bucket[key] || 0) + 1;
            return bucket;
        }, {});
    }

    function visualCountRows(counts, labeler, total) {
        var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
        if (!keys.length) keys = ["direct"];
        return keys.slice(0, 6).map(function (key) {
            var count = counts[key] || 0;
            var percent = total ? Math.round((count / total) * 100) : 0;
            return [
                "<div class=\"tfse-visual-bar-row\">",
                "<span>" + escapeHtml(labeler(key)) + "</span>",
                "<b><i style=\"width:" + percent + "%\"></i></b>",
                "<em>" + count + "（" + percent + "%）</em>",
                "</div>"
            ].join("");
        }).join("");
    }

    function visualMetricPayload() {
        var leads = getLeads();
        var followUps = followUpPayload();
        var legal = legalReviewPayload();
        var lineItems = lineSegmentPayload().items || [];
        var sourceCounts = visualTopCounts(leads, visualSourceOfLead);
        return {
            leads: leads,
            followUps: followUps,
            legal: legal,
            lineItems: lineItems,
            sourceCounts: sourceCounts,
            metrics: [
                {
                    label: "今日待處理",
                    value: followUps.counts.overdue_or_unscheduled || followUps.counts.total || 0,
                    hint: "高優先 " + (followUps.counts.high_priority || 0),
                    icon: "fa-clipboard-list",
                    tone: "blue"
                },
                {
                    label: "免費財務健檢查詢名單",
                    value: leads.length,
                    hint: "待聯繫 " + leads.filter(function (lead) { return (lead.status || "new") === "new"; }).length,
                    icon: "fa-heart",
                    tone: "gold"
                },
                {
                    label: "來源追蹤（本月）",
                    value: Object.keys(sourceCounts).length,
                    hint: "有效來源 " + leads.length,
                    icon: "fa-search",
                    tone: "green"
                },
                {
                    label: "合規掃描（本月）",
                    value: legal.items.length,
                    hint: "需檢視 " + ((legal.status_counts.needs_review || 0) + (legal.status_counts.external_pending || 0) + (legal.status_counts.manual_external || 0)),
                    icon: "fa-shield-alt",
                    tone: "blue"
                },
                {
                    label: "Line OA 佇列",
                    value: lineItems.length,
                    hint: "可分群 " + lineItems.filter(function (item) { return (item.tags || []).length; }).length,
                    icon: "fa-comments",
                    tone: "green"
                }
            ]
        };
    }

    function visualRenderMetricCards(metrics) {
        return metrics.map(function (item) {
            return [
                "<article class=\"tfse-visual-metric is-" + escapeHtml(item.tone) + "\">",
                "<span>" + escapeHtml(item.label) + "</span>",
                "<strong>" + escapeHtml(item.value) + "</strong>",
                "<small>" + escapeHtml(item.hint) + "</small>",
                "<i class=\"fa " + escapeHtml(item.icon) + "\"></i>",
                "</article>"
            ].join("");
        }).join("");
    }

    function visualRenderLeadRows(leads, emptyText) {
        if (!leads.length) {
            return "<tr><td colspan=\"7\" class=\"tfse-visual-empty\">" + escapeHtml(emptyText || "目前沒有符合篩選的真實線索。請從前台免費財務健檢查詢表單提交，或確認正式 API 已連線。") + "</td></tr>";
        }
        var start = (visualConsoleState.page - 1) * visualConsoleState.pageSize;
        return leads.slice(start, start + visualConsoleState.pageSize).map(function (lead) {
            var statusValue = lead.status || "new";
            var selectedClass = lead.id === visualConsoleState.selectedLeadId ? " is-selected" : "";
            return [
                "<tr class=\"" + selectedClass + "\" data-visual-row=\"" + escapeHtml(lead.id) + "\">",
                "<td>" + escapeHtml(formatDate(lead.submitted_at || lead.updated_at)) + "</td>",
                "<td><strong>" + escapeHtml(lead.display_name || "未命名") + "</strong><small>手機末三碼 " + escapeHtml(phoneLast3(lead.phone) || "---") + "</small></td>",
                "<td>" + escapeHtml(visualSourceLabel(visualSourceOfLead(lead))) + "</td>",
                "<td><span class=\"tfse-visual-status is-" + escapeHtml(statusValue) + "\">" + escapeHtml(visualStatusLabel(statusValue)) + "</span></td>",
                "<td>" + escapeHtml(visualOwnerLabel(visualOwnerOfLead(lead))) + "</td>",
                "<td>" + escapeHtml(lead.next_follow_up_at || "今日回覆") + "</td>",
                "<td><button type=\"button\" class=\"tfse-visual-mini-btn\" data-visual-lead-view=\"" + escapeHtml(lead.id) + "\">檢視</button></td>",
                "</tr>"
            ].join("");
        }).join("");
    }

    function visualSelectedLead(leads) {
        var selected = leads.filter(function (lead) { return lead.id === visualConsoleState.selectedLeadId; })[0];
        return selected || leads[0] || getLeads()[0] || null;
    }

    function visualLeadActionButtons(lead) {
        return "<div class=\"tfse-visual-status-actions\"><button type=\"button\" data-visual-status-set=\"contacted\" data-visual-status-lead=\"" + escapeHtml(lead.id) + "\">已聯繫</button><button type=\"button\" data-visual-status-set=\"info_sent\" data-visual-status-lead=\"" + escapeHtml(lead.id) + "\">已發資料</button><button type=\"button\" data-visual-status-set=\"closed\" data-visual-status-lead=\"" + escapeHtml(lead.id) + "\">成交</button></div>";
    }

    function visualLeadField(label, value) {
        return "<div class=\"tfse-visual-detail-field\"><span>" + escapeHtml(label) + "</span><strong>" + escapeHtml(value || "-") + "</strong></div>";
    }

    function visualRenderLeadFullDetail(lead) {
        if (!lead) return "";
        var tags = (lead.tags || []).join("、");
        var categories = (lead.recommended_categories || []).join("、");
        var articles = (lead.recommended_articles || []).join("、");
        var notes = (lead.notes || []).slice(-3).join(" / ");
        return [
            "<div class=\"tfse-visual-detail-panel\" tabindex=\"-1\" data-visual-lead-detail-panel>",
            "<div class=\"tfse-visual-detail-head\"><div><span>表單詳情</span><h4>" + escapeHtml(lead.display_name || "未命名線索") + "</h4></div><button type=\"button\" data-visual-lead-close>收起</button></div>",
            "<div class=\"tfse-visual-detail-grid\">",
            visualLeadField("姓名/稱呼", lead.display_name),
            visualLeadField("手機", lead.phone),
            visualLeadField("Line ID", lead.line_id),
            visualLeadField("所在地區", lead.region),
            visualLeadField("需求類型", lead.needs),
            visualLeadField("身份類型", lead.occupation_type),
            visualLeadField("收入型態", lead.income_type),
            visualLeadField("目前狀態", visualStatusLabel(lead.status || "new")),
            visualLeadField("來源", visualSourceLabel(visualSourceOfLead(lead))),
            visualLeadField("負責人", visualOwnerLabel(visualOwnerOfLead(lead))),
            visualLeadField("提交時間", formatDate(lead.submitted_at)),
            visualLeadField("更新時間", formatDate(lead.updated_at || lead.submitted_at)),
            "</div>",
            "<div class=\"tfse-visual-detail-message\"><span>目前困擾/補充說明</span><p>" + escapeHtml(lead.message || "未填寫") + "</p></div>",
            "<div class=\"tfse-visual-detail-grid is-wide\">",
            visualLeadField("隱私同意", lead.consent_privacy ? "已同意" : "未同意"),
            visualLeadField("Line 提醒", lead.consent_line ? "已同意" : "未同意"),
            visualLeadField("標籤", tags || "-"),
            visualLeadField("推薦分類", categories || "-"),
            visualLeadField("推薦文章", articles || "-"),
            visualLeadField("最近備註", notes || "-"),
            "</div>",
            visualLeadActionButtons(lead),
            "</div>"
        ].join("");
    }

    function visualRenderLeadDetail(lead) {
        if (!lead) return "<div class=\"tfse-visual-side-card\"><h4>快速檢視</h4><p>目前沒有真實線索可操作。後台不再產生測試資料，請以前台表單或正式 API 建立資料。</p></div>";
        return "<div class=\"tfse-visual-side-card tfse-visual-lead-card\"><h4>線索快速操作</h4><strong>" + escapeHtml(lead.display_name || "未命名線索") + "</strong><p>" + escapeHtml(lead.needs || "尚未填寫需求") + "</p><p>手機：" + escapeHtml(lead.phone || "-") + "<br>Line：" + escapeHtml(lead.line_id || "-") + "</p>" + visualLeadActionButtons(lead) + "</div>";
    }

    function visualRenderSidebar() {
        var items = [
            ["dashboard", "fa-tachometer-alt", "儀表板"],
            ["leads", "fa-user-friends", "線索管理"],
            ["freecheck", "fa-heart", "免費財務健檢查詢"],
            ["consult", "fa-clipboard-list", "諮詢案件"],
            ["clients", "fa-users", "客戶管理"],
            ["schedule", "fa-calendar-alt", "行事曆"],
            ["tasks", "fa-tasks", "任務管理"],
            ["compliance", "fa-shield-alt", "合規掃描"],
            ["reports", "fa-chart-bar", "報表分析"],
            ["settings", "fa-cog", "系統設定"]
        ];
        return "<aside class=\"tfse-visual-sidebar\"><a class=\"tfse-visual-brand\" href=\"index.html\" target=\"_blank\" rel=\"noopener\"><img src=\"assets/images/logo/tfse-logo.png\" alt=\"TFSE 金融便民中心\"></a><nav>" + items.map(function (item) {
            var active = visualConsoleState.tab === item[0] ? " is-active" : "";
            return "<button type=\"button\" class=\"" + active + "\" data-visual-tab=\"" + item[0] + "\"><i class=\"fa " + item[1] + "\"></i><span>" + item[2] + "</span></button>";
        }).join("") + "</nav><button type=\"button\" class=\"tfse-visual-collapse\" data-visual-trigger=\"[data-admin-export]\"><i class=\"fa fa-download\"></i><span>匯出線索 JSON</span></button></aside>";
    }

    function visualPageTitles() {
        return {
            dashboard: "CRM 儀表板",
            leads: "線索管理",
            freecheck: "免費財務健檢查詢",
            consult: "諮詢案件",
            clients: "客戶管理",
            schedule: "行事曆",
            tasks: "任務管理",
            compliance: "合規掃描",
            reports: "報表分析",
            settings: "系統設定"
        };
    }

    function visualRenderFilters() {
        return "<div class=\"tfse-visual-filters\"><label><span>狀態</span><select data-visual-filter=\"status\"><option value=\"all\">全部狀態</option><option value=\"new\">待聯繫</option><option value=\"contacted\">已聯繫</option><option value=\"info_sent\">已發資料</option><option value=\"consulted\">諮詢中</option><option value=\"closed\">成交</option></select></label><label><span>來源</span><select data-visual-filter=\"source\"><option value=\"all\">全部來源</option><option value=\"direct\">官網</option><option value=\"seo\">Google 搜尋</option><option value=\"facebook\">FB/IG</option><option value=\"paid_social\">社群廣告</option><option value=\"line\">LINE OA</option><option value=\"referral\">合作轉介</option></select></label><label><span>負責人</span><select data-visual-filter=\"owner\"><option value=\"all\">全部負責人</option><option value=\"consultant\">顧問組</option><option value=\"data_manager\">資料管理</option><option value=\"compliance_reviewer\">合規審核</option></select></label><label class=\"tfse-visual-search\"><span>搜尋</span><input data-visual-filter=\"query\" type=\"search\" value=\"" + escapeHtml(visualConsoleState.query) + "\" placeholder=\"姓名 / 手機 / Email / 需求\"></label><a class=\"tfse-visual-real-entry\" href=\"free-check.html\" target=\"_blank\" rel=\"noopener\"><i class=\"fa fa-external-link-alt\"></i> 前台提交真實資料</a></div>";
    }

    function visualLeadStageCounts() {
        var leads = getLeads();
        return leads.reduce(function (counts, lead) {
            var statusValue = lead.status || "new";
            counts.total += 1;
            counts[statusValue] = (counts[statusValue] || 0) + 1;
            if (statusValue !== "closed" && statusValue !== "spam") counts.open += 1;
            if (String(lead.follow_up_priority || "").toLowerCase() === "high") counts.high_priority += 1;
            if ((lead.tags || []).indexOf("line_opt_in") !== -1 || lead.consent_line) counts.line_opt_in += 1;
            return counts;
        }, { total: 0, open: 0, high_priority: 0, line_opt_in: 0 });
    }

    function visualLeadWorkspaceMeta() {
        var counts = visualLeadStageCounts();
        var tab = visualConsoleState.tab === "dashboard" ? "leads" : visualConsoleState.tab;
        var meta = {
            leads: {
                eyebrow: "完整管線",
                empty: "目前沒有符合篩選的真實線索。請從前台免費財務健檢查詢表單提交，或確認正式 API 已連線。",
                cards: [
                    ["全部真實線索", counts.total, "所有已提交或 API 寫入的名單"],
                    ["待處理管線", counts.open, "未成交、未排除的跟進對象"],
                    ["諮詢中", counts.consulted || 0, "已進入人工諮詢的案件"],
                    ["成交客戶", counts.closed || 0, "已完成轉換的客戶"]
                ]
            },
            freecheck: {
                eyebrow: "前台收件",
                empty: "目前沒有免費財務健檢查詢提交資料。請點擊「前台提交真實資料」完成一筆表單，後台才會出現資料。",
                cards: [
                    ["待聯繫", counts.new || 0, "新提交且尚未回覆"],
                    ["已聯繫", counts.contacted || 0, "已完成首次聯繫"],
                    ["已發資料", counts.info_sent || 0, "已寄送公開資訊或說明"],
                    ["Line 同意", counts.line_opt_in || 0, "可後續 Line 提醒"]
                ]
            },
            consult: {
                eyebrow: "人工諮詢",
                empty: "目前沒有狀態為「諮詢中」的真實案件。請在線索快速操作把有效案件推進到諮詢階段。",
                cards: [
                    ["諮詢中案件", counts.consulted || 0, "目前正在人工跟進"],
                    ["高優先", counts.high_priority || 0, "需要優先處理的跟進"],
                    ["已發資料", counts.info_sent || 0, "可轉入諮詢的潛在案件"],
                    ["待聯繫", counts.new || 0, "尚未完成首次聯繫"]
                ]
            },
            clients: {
                eyebrow: "成交服務",
                empty: "目前沒有已成交客戶。只有狀態更新為「成交」的真實線索會進入此分欄。",
                cards: [
                    ["成交客戶", counts.closed || 0, "已完成轉換"],
                    ["仍在管線", counts.open || 0, "未成交的跟進名單"],
                    ["諮詢中", counts.consulted || 0, "可能轉成交案件"],
                    ["Line 同意", counts.line_opt_in || 0, "可做後續服務提醒"]
                ]
            }
        };
        return meta[tab] || meta.leads;
    }

    function visualRenderLeadStageSummary(meta) {
        return "<div class=\"tfse-visual-stage-summary\">" + meta.cards.map(function (card) {
            return "<article><small>" + escapeHtml(card[0]) + "</small><strong>" + escapeHtml(card[1]) + "</strong><span>" + escapeHtml(card[2]) + "</span></article>";
        }).join("") + "</div>";
    }

    function visualRenderLeadWorkspace(leads, title, description) {
        var totalPages = Math.max(1, Math.ceil(leads.length / visualConsoleState.pageSize));
        if (visualConsoleState.page > totalPages) visualConsoleState.page = totalPages;
        var pageStart = leads.length ? ((visualConsoleState.page - 1) * visualConsoleState.pageSize) + 1 : 0;
        var pageEnd = Math.min(leads.length, visualConsoleState.page * visualConsoleState.pageSize);
        var meta = visualLeadWorkspaceMeta();
        return [
            "<div class=\"tfse-visual-table-card\">",
            "<div class=\"tfse-visual-module-head\"><div><span class=\"tfse-visual-eyebrow\">" + escapeHtml(meta.eyebrow) + "</span><h3>" + escapeHtml(title) + "</h3><p>" + escapeHtml(description) + "</p></div><button type=\"button\" data-visual-refresh><i class=\"fa fa-sync-alt\"></i> 更新資料</button></div>",
            "<div class=\"tfse-visual-tabs\"><button type=\"button\" class=\"" + (visualConsoleState.tab === "dashboard" || visualConsoleState.tab === "leads" ? "is-active" : "") + "\" data-visual-tab=\"leads\">線索總覽</button><button type=\"button\" class=\"" + (visualConsoleState.tab === "freecheck" ? "is-active" : "") + "\" data-visual-tab=\"freecheck\">免費財務健檢查詢</button><button type=\"button\" class=\"" + (visualConsoleState.tab === "consult" ? "is-active" : "") + "\" data-visual-tab=\"consult\">諮詢中案件</button><button type=\"button\" class=\"" + (visualConsoleState.tab === "clients" ? "is-active" : "") + "\" data-visual-tab=\"clients\">成交客戶</button></div>",
            visualRenderLeadStageSummary(meta),
            visualRenderFilters(),
            "<div class=\"tfse-visual-table-wrap\"><table><thead><tr><th>建立時間</th><th>姓名</th><th>來源</th><th>狀態</th><th>負責人</th><th>下一次行動</th><th>動作</th></tr></thead><tbody>" + visualRenderLeadRows(leads, meta.empty) + "</tbody></table></div>",
            visualConsoleState.selectedLeadId ? visualRenderLeadFullDetail(visualSelectedLead(leads)) : "",
            "<div class=\"tfse-visual-pager\"><span>顯示 " + pageStart + " - " + pageEnd + " 筆，共 " + leads.length + " 筆</span>" + Array.from({ length: totalPages }).slice(0, 5).map(function (_, index) { var page = index + 1; return "<button type=\"button\" class=\"" + (visualConsoleState.page === page ? "is-active" : "") + "\" data-visual-page=\"" + page + "\">" + page + "</button>"; }).join("") + "</div>",
            "</div>"
        ].join("");
    }

    function visualLeadCard(lead, actionLabel) {
        var statusValue = lead.status || "new";
        return [
            "<article class=\"tfse-visual-module-card\">",
            "<small>" + escapeHtml(formatDate(lead.next_follow_up_at || lead.submitted_at || lead.updated_at)) + "</small>",
            "<h4>" + escapeHtml(lead.display_name || "未命名線索") + "</h4>",
            "<p>" + escapeHtml(lead.needs || "尚未填寫需求") + "</p>",
            "<div class=\"tfse-visual-pill-row\"><span class=\"tfse-visual-status is-" + escapeHtml(statusValue) + "\">" + escapeHtml(visualStatusLabel(statusValue)) + "</span><span>" + escapeHtml(visualSourceLabel(visualSourceOfLead(lead))) + "</span></div>",
            "<button type=\"button\" class=\"tfse-visual-mini-btn\" data-visual-lead-view=\"" + escapeHtml(lead.id) + "\">" + escapeHtml(actionLabel || "檢視") + "</button>",
            "</article>"
        ].join("");
    }

    function visualRenderCalendar(payload) {
        var items = payload.leads.slice().sort(function (a, b) {
            return String(a.next_follow_up_at || a.submitted_at || "").localeCompare(String(b.next_follow_up_at || b.submitted_at || ""));
        }).slice(0, 12);
        return [
            "<div class=\"tfse-visual-table-card\">",
            "<div class=\"tfse-visual-module-head\"><div><h3>行事曆</h3><p>只顯示真實線索的下一次行動與跟進安排，可直接檢視並更新狀態。</p></div><button type=\"button\" data-visual-trigger=\"[data-admin-follow-ups-export]\"><i class=\"fa fa-calendar-check\"></i> 匯出跟進隊列</button></div>",
            items.length ? "<div class=\"tfse-visual-card-grid\">" + items.map(function (lead) { return visualLeadCard(lead, "查看行程"); }).join("") + "</div>" : "<div class=\"tfse-visual-empty-block\">目前沒有真實行程。請先由前台免費財務健檢查詢表單提交資料，或確認正式 API 已連線。</div>",
            "</div>"
        ].join("");
    }

    function visualRenderTasks(payload) {
        var leads = payload.leads.filter(function (lead) {
            var statusValue = lead.status || "new";
            return statusValue !== "closed" && statusValue !== "spam";
        }).slice(0, 12);
        var pendingFeedback = publicFeedbackItemsCache.filter(function (item) {
            return (item.status || "queued") !== "closed" && (item.status || "queued") !== "resolved";
        }).length;
        return [
            "<div class=\"tfse-visual-table-card\">",
            "<div class=\"tfse-visual-module-head\"><div><h3>任務管理</h3><p>把未成交線索、資料回報、合規復核集中成可執行待辦。</p></div><button type=\"button\" data-visual-trigger=\"[data-admin-contact-log-export]\"><i class=\"fa fa-file-export\"></i> 匯出聯繫紀錄</button></div>",
            "<div class=\"tfse-visual-card-grid is-compact\"><article class=\"tfse-visual-module-card\"><small>線索待辦</small><h4>" + leads.length + "</h4><p>尚未完成成交或排除的真實線索。</p><button type=\"button\" data-visual-tab=\"leads\">處理線索</button></article><article class=\"tfse-visual-module-card\"><small>資料回報</small><h4>" + pendingFeedback + "</h4><p>來自公開端的資料更正工單。</p><button type=\"button\" data-visual-trigger=\"[data-admin-public-feedback-export]\">匯出工單</button></article><article class=\"tfse-visual-module-card\"><small>合規復核</small><h4>" + ((payload.legal.status_counts.needs_review || 0) + (payload.legal.status_counts.external_pending || 0)) + "</h4><p>需要人工檢視的頁面與內容。</p><button type=\"button\" data-visual-tab=\"compliance\">前往掃描</button></article></div>",
            leads.length ? "<div class=\"tfse-visual-data-list\">" + leads.slice(0, 6).map(function (lead) { return visualLeadCard(lead, "處理"); }).join("") + "</div>" : "<div class=\"tfse-visual-empty-block\">目前沒有真實待辦線索。</div>",
            "</div>"
        ].join("");
    }

    function visualRenderComplianceModule(payload) {
        var legalCounts = payload.legal.status_counts || {};
        var items = (payload.legal.items || []).slice(0, 8);
        return [
            "<div class=\"tfse-visual-table-card\">",
            "<div class=\"tfse-visual-module-head\"><div><h3>合規掃描</h3><p>合規資料來自現有頁面、內容規則與人工留痕，不使用假資料填充。</p></div><button type=\"button\" data-visual-trigger=\"[data-admin-run-compliance]\"><i class=\"fa fa-shield-alt\"></i> 重新掃描</button></div>",
            "<div class=\"tfse-visual-card-grid is-compact\"><article class=\"tfse-visual-module-card\"><small>合規通過</small><h4>" + (legalCounts.ready || 0) + "</h4><p>目前可直接保留上線的項目。</p></article><article class=\"tfse-visual-module-card\"><small>風險提示</small><h4>" + (legalCounts.needs_review || 0) + "</h4><p>需要人工確認文案或來源。</p></article><article class=\"tfse-visual-module-card\"><small>外部待設定</small><h4>" + (legalCounts.external_pending || 0) + "</h4><p>依賴正式平台或 API 設定。</p></article></div>",
            items.length ? "<div class=\"tfse-visual-data-list\">" + items.map(function (item) { return "<article class=\"tfse-visual-module-card\"><small>" + escapeHtml(visualStatusLabel(item.status)) + "</small><h4>" + escapeHtml(item.label || item.title || item.key || "合規項目") + "</h4><p>" + escapeHtml(item.detail || item.note || "等待合規留痕。") + "</p></article>"; }).join("") + "</div>" : "<div class=\"tfse-visual-empty-block\">目前沒有合規掃描項目。</div>",
            "<div class=\"tfse-visual-action-row\"><button type=\"button\" data-visual-trigger=\"[data-admin-legal-review-export]\">匯出送審包</button><button type=\"button\" data-visual-trigger=\"[data-admin-compliance-api-export]\">匯出 API 驗收包</button></div>",
            "</div>"
        ].join("");
    }

    function visualRenderReportsModule(payload) {
        return [
            "<div class=\"tfse-visual-table-card\">",
            "<div class=\"tfse-visual-module-head\"><div><h3>報表分析</h3><p>報表只根據目前可讀到的真實線索、來源、回報與合規狀態生成。</p></div><button type=\"button\" data-visual-trigger=\"[data-admin-attribution-export]\"><i class=\"fa fa-chart-line\"></i> 匯出歸因報表</button></div>",
            "<div class=\"tfse-visual-split\"><div class=\"tfse-visual-module-card\"><h4>來源分布</h4>" + visualCountRows(payload.sourceCounts, visualSourceLabel, payload.leads.length || 1) + "</div><div class=\"tfse-visual-module-card\"><h4>數據摘要</h4><ul class=\"tfse-visual-checklist\"><li><span>真實線索</span><b>" + payload.leads.length + "</b></li><li><span>公開回報工單</span><b>" + publicFeedbackItemsCache.length + "</b></li><li><span>合規掃描項</span><b>" + payload.legal.items.length + "</b></li><li><span>資料模式</span><b>" + escapeHtml(leadSourceMode) + "</b></li></ul></div></div>",
            "<div class=\"tfse-visual-action-row\"><button type=\"button\" data-visual-trigger=\"[data-admin-export]\">匯出線索 JSON</button><button type=\"button\" data-visual-trigger=\"[data-admin-line-segments-export]\">匯出 Line 分群</button><button type=\"button\" data-visual-trigger=\"[data-admin-backup-export]\">匯出備份包</button></div>",
            "</div>"
        ].join("");
    }

    function visualRenderSettingsModule() {
        var backend = (siteConfigData && siteConfigData.backend) || {};
        var apiReady = backend.mode === "api" && !!backend.api_base_url;
        return [
            "<div class=\"tfse-visual-table-card\">",
            "<div class=\"tfse-visual-module-head\"><div><h3>系統設定</h3><p>這裡直接顯示目前是不是正式 API 模式，避免把本機暫存誤認成後端。</p></div><button type=\"button\" data-visual-trigger=\"[data-admin-config-draft-template]\"><i class=\"fa fa-cog\"></i> 載入配置範本</button></div>",
            "<div class=\"tfse-visual-card-grid is-compact\"><article class=\"tfse-visual-module-card\"><small>後端模式</small><h4>" + escapeHtml(backend.mode || "localStorage") + "</h4><p>" + (apiReady ? "已配置 API：" + escapeHtml(backend.api_base_url) : "尚未在 site-config.json 設定 backend.mode=api 與 api_base_url。") + "</p></article><article class=\"tfse-visual-module-card\"><small>線索來源</small><h4>" + escapeHtml(leadSourceMode) + "</h4><p>前台表單會優先走 API，未配置時才使用瀏覽器 localStorage。</p></article><article class=\"tfse-visual-module-card\"><small>內容來源</small><h4>" + escapeHtml(productSourceMode + " / " + articleSourceMode) + "</h4><p>產品與文章可走 API；未登入或未配置時回退靜態資料。</p></article></div>",
            "<div class=\"tfse-visual-action-row\"><button type=\"button\" data-visual-trigger=\"[data-admin-config-readiness-export]\">匯出配置交接包</button><button type=\"button\" data-visual-trigger=\"[data-admin-backend-acceptance-export]\">匯出 API 驗收矩陣</button><button type=\"button\" data-visual-trigger=\"[data-admin-backend-roadmap-export]\">匯出後端路線圖</button></div>",
            "</div>"
        ].join("");
    }

    function visualRenderMainModule(payload, leads) {
        if (visualConsoleState.tab === "schedule") return visualRenderCalendar(payload);
        if (visualConsoleState.tab === "tasks") return visualRenderTasks(payload);
        if (visualConsoleState.tab === "compliance") return visualRenderComplianceModule(payload);
        if (visualConsoleState.tab === "reports") return visualRenderReportsModule(payload);
        if (visualConsoleState.tab === "settings") return visualRenderSettingsModule();
        if (visualConsoleState.tab === "freecheck") return visualRenderLeadWorkspace(leads, "免費財務健檢查詢名單", "從前台免費財務健檢查詢表單或正式 API 進來的真實資料，可檢視並更新跟進狀態。");
        if (visualConsoleState.tab === "consult") return visualRenderLeadWorkspace(leads, "諮詢中案件", "只顯示狀態為諮詢中的真實線索，便於集中跟進。");
        if (visualConsoleState.tab === "clients") return visualRenderLeadWorkspace(leads, "成交客戶", "只顯示已成交的真實客戶，方便後續服務與備份。");
        return visualRenderLeadWorkspace(leads, "線索總覽", "集中管理前台提交與 API 寫入的真實線索，支援篩選、檢視與狀態更新。");
    }

    function visualRenderConnectionCard() {
        var backend = (siteConfigData && siteConfigData.backend) || {};
        var apiReady = backend.mode === "api" && !!backend.api_base_url;
        return "<div class=\"tfse-visual-side-card\"><h4><i class=\"fa fa-plug\"></i> 資料連線狀態</h4><ul class=\"tfse-visual-checklist\"><li><span>後端模式</span><b>" + escapeHtml(backend.mode || "localStorage") + "</b></li><li><span>API URL</span><b>" + (apiReady ? "已配置" : "未配置") + "</b></li><li><span>線索來源</span><b>" + escapeHtml(leadSourceMode) + "</b></li></ul><p>" + (apiReady ? "目前會優先讀寫正式 API。" : "目前是本機暫存/靜態回退模式；若直接用 file:// 打開，不會連到後端。") + "</p></div>";
    }

    function renderVisualConsole() {
        if (!visualConsolePanel) return;
        var payload = visualMetricPayload();
        var leads = visualFilteredLeads();
        var selectedLead = visualSelectedLead(leads);
        var legalCounts = payload.legal.status_counts || {};
        var lineItems = (payload.lineItems || []).slice(0, 3);
        var notificationCount = (payload.followUps.counts.overdue_or_unscheduled || 0) + publicFeedbackItemsCache.length;
        var pageTitles = visualPageTitles();
        visualConsolePanel.innerHTML = [
            "<div class=\"tfse-visual-shell\">",
            visualRenderSidebar(),
            "<main class=\"tfse-visual-main\">",
            "<header class=\"tfse-visual-topbar\"><div><button type=\"button\" class=\"tfse-visual-menu\" data-visual-tab=\"dashboard\"><i class=\"fa fa-bars\"></i></button><h2>" + escapeHtml(pageTitles[visualConsoleState.tab] || "CRM 儀表板") + "</h2></div><div class=\"tfse-visual-userbar\"><span class=\"tfse-visual-bell\"><i class=\"fa fa-bell\"></i><b>" + notificationCount + "</b></span><span>TFSE 金融便民中心</span><strong>" + escapeHtml(roleLabel(currentRole())) + "</strong><button type=\"button\" data-visual-refresh><i class=\"fa fa-sync-alt\"></i> 更新資料</button></div></header>",
            "<section class=\"tfse-visual-metrics\">" + visualRenderMetricCards(payload.metrics) + "</section>",
            "<section class=\"tfse-visual-workgrid\">",
            visualRenderMainModule(payload, leads),
            "<aside class=\"tfse-visual-rightcol\">",
            visualRenderLeadDetail(selectedLead),
            visualRenderConnectionCard(),
            "<div class=\"tfse-visual-side-card\"><h4><i class=\"fa fa-chart-line\"></i> 來源追蹤分析</h4>" + visualCountRows(payload.sourceCounts, visualSourceLabel, payload.leads.length || 1) + "<button type=\"button\" data-visual-trigger=\"[data-admin-attribution-export]\">匯出完整報表</button></div>",
            "<div class=\"tfse-visual-side-card\"><h4><i class=\"fa fa-shield-alt\"></i> 合規掃描摘要</h4><ul class=\"tfse-visual-checklist\"><li><span>合規通過</span><b>" + (legalCounts.ready || 0) + "</b></li><li><span>風險提示</span><b>" + (legalCounts.needs_review || 0) + "</b></li><li><span>待外部設定</span><b>" + (legalCounts.external_pending || 0) + "</b></li><li><span>待人工驗收</span><b>" + (legalCounts.manual_external || 0) + "</b></li></ul><button type=\"button\" data-visual-trigger=\"[data-admin-legal-review-export]\">匯出合規掃描</button></div>",
            "<div class=\"tfse-visual-side-card\"><h4><i class=\"fa fa-comments\"></i> Line OA 即時待列</h4>" + (lineItems.length ? lineItems.map(function (item) { return "<div class=\"tfse-visual-line-item\"><span>" + escapeHtml(item.display_name || "未命名") + "</span><small>" + escapeHtml((item.tags || []).slice(0, 2).join("、") || "待分群") + "</small></div>"; }).join("") : "<p>目前沒有待分群的 Line 線索。</p>") + "<button type=\"button\" data-visual-trigger=\"[data-admin-line-segments-export]\">匯出 Line 分群</button></div>",
            "</aside></section></main></div>"
        ].join("");
        var statusSelect = visualConsolePanel.querySelector("[data-visual-filter='status']");
        var sourceSelect = visualConsolePanel.querySelector("[data-visual-filter='source']");
        var ownerSelect = visualConsolePanel.querySelector("[data-visual-filter='owner']");
        if (statusSelect) statusSelect.value = visualConsoleState.status;
        if (sourceSelect) sourceSelect.value = visualConsoleState.source;
        if (ownerSelect) ownerSelect.value = visualConsoleState.owner;
    }

    function updateVisualLeadStatus(leadId, statusValue) {
        if (!can("update_lead")) {
            addAudit("visual_lead_status_update_denied", leadId + ":" + statusValue);
            renderAudit();
            return;
        }
        var lead = getLeads().filter(function (item) { return item.id === leadId; })[0];
        if (!lead) return;
        var note = "可視化後台快速更新：" + visualStatusLabel(statusValue);
        var meta = {
            assigned_to: lead.assigned_to || "consultant",
            follow_up_priority: lead.follow_up_priority || (statusValue === "closed" ? "normal" : "high"),
            next_follow_up_at: lead.next_follow_up_at || "",
            contact_log: {
                at: new Date().toISOString(),
                channel: "admin_visual_console",
                status: statusValue,
                note: note,
                operator_role: currentRole()
            }
        };
        var updater = window.TFSEApi && window.TFSEApi.updateLeadStatus
            ? window.TFSEApi.updateLeadStatus(leadId, statusValue, note, meta)
            : Promise.resolve().then(function () {
                var leads = getLeads();
                leads.forEach(function (item) {
                    if (item.id !== leadId) return;
                    item.status = statusValue;
                    item.assigned_to = meta.assigned_to;
                    item.follow_up_priority = meta.follow_up_priority;
                    item.next_follow_up_at = meta.next_follow_up_at;
                    item.contact_logs = (item.contact_logs || []).concat(meta.contact_log);
                    item.notes = (item.notes || []).concat(new Date().toISOString() + " " + note);
                    item.updated_at = new Date().toISOString();
                });
                saveLeads(leads);
                return { mode: "localStorage" };
            });
        updater.then(function (result) {
            leadSourceMode = result.mode || leadSourceMode;
            addAudit("visual_lead_status_update", leadId + ":" + statusValue + ":" + leadSourceMode);
            return syncLeadsFromApi();
        }).then(function () {
            renderVisualConsole();
            renderAudit();
        }).catch(function (error) {
            addAudit("visual_lead_status_update_failed", leadId + ":" + statusValue + ":" + (error && error.message ? error.message : error));
            renderAudit();
        });
    }

    function renderList() {
        var leads = filteredLeads();
        if (!leads.length) {
            list.innerHTML = "<tr><td colspan=\"5\">尚無符合條件的潛客紀錄。</td></tr>";
            if (detail) detail.innerHTML = "<p>請從左側列表選擇一筆紀錄。</p>";
            return;
        }

        list.innerHTML = leads.map(function (lead) {
            return [
                "<tr data-lead-id=\"" + escapeHtml(lead.id) + "\">",
                "<td>" + escapeHtml(formatDate(lead.submitted_at)) + "</td>",
                "<td><strong>" + escapeHtml(lead.display_name || "-") + "</strong><br>" + escapeHtml(lead.phone || "-") + "</td>",
                "<td>" + escapeHtml(lead.needs || "-") + "<br><small>" + escapeHtml(lead.region || "未填地區") + "</small></td>",
                "<td>" + escapeHtml(lead.is_sample ? "sample" : (lead.utm_source || lead.source_channel || "direct")) + "</td>",
                "<td>" + escapeHtml(lead.status || "new") + "</td>",
                "</tr>"
            ].join("");
        }).join("");

        Array.prototype.slice.call(list.querySelectorAll("[data-lead-id]")).forEach(function (row) {
            row.addEventListener("click", function () {
                selectedId = row.getAttribute("data-lead-id");
                renderDetail();
            });
        });

        if (!selectedId && leads[0]) selectedId = leads[0].id;
        renderDetail();
        renderPrivacyRequests();
        renderDataRetention();
        renderLineSegments();
        renderLineOptout();
    }

    function renderDetail() {
        if (!detail) return;
        var lead = getLeads().filter(function (item) { return item.id === selectedId; })[0];
        if (!lead) {
            detail.innerHTML = "<p>請從左側列表選擇一筆紀錄。</p>";
            return;
        }

        detail.innerHTML = [
            "<p><strong>" + escapeHtml(lead.display_name || "-") + "</strong> ｜ " + escapeHtml(lead.phone || "-") + "</p>",
            lead.is_sample ? "<p>資料標記：本機測試資料，正式匯入前請刪除或排除。</p>" : "",
            "<p>資料來源：" + escapeHtml(leadSourceMode) + "</p>",
            "<p>Line ID：" + escapeHtml(lead.line_id || "未填") + "</p>",
            "<p>需求：" + escapeHtml(lead.needs || "-") + "</p>",
            "<p>身份：" + escapeHtml(lead.occupation_type || "-") + "</p>",
            "<p>收入型態：" + escapeHtml(lead.income_type || "未填") + "</p>",
            "<p>來源：" + escapeHtml(lead.source_url || "-") + "</p>",
            "<p>UTM：" + escapeHtml([lead.utm_source, lead.utm_medium, lead.utm_campaign, lead.utm_content, lead.utm_term].filter(Boolean).join(" / ") || "-") + "</p>",
            "<p>同意版本：" + escapeHtml(lead.consent_version || "未記錄") + "；隱私同意：" + escapeHtml(lead.consent_privacy ? "是" : "否") + "；Line 同意：" + escapeHtml(lead.consent_line ? "是" : "否") + "</p>",
            "<p>刪除請求：" + escapeHtml(lead.delete_requested ? "已標記" : "未標記") + "；處理狀態：" + escapeHtml(lead.privacy_request_status || "未建立") + "</p>",
            "<p>標籤：" + escapeHtml((lead.tags || []).join(", ") || "-") + "</p>",
            "<p>備註：" + escapeHtml((lead.notes || []).join(" / ") || "尚無備註") + "</p>",
            "<p>最近聯繫：" + escapeHtml((lead.contact_logs || []).slice(-1)[0] ? ((lead.contact_logs || []).slice(-1)[0].channel + " / " + (lead.contact_logs || []).slice(-1)[0].outcome + " / " + formatDate((lead.contact_logs || []).slice(-1)[0].contacted_at)) : "尚無結構化聯繫紀錄") + "</p>",
            "<label>狀態</label>",
            "<select data-detail-status>",
            ["new", "contacted", "info_sent", "consulted", "unresponsive", "spam", "closed"].map(function (item) {
                return "<option value=\"" + item + "\"" + (item === lead.status ? " selected" : "") + ">" + item + "</option>";
            }).join(""),
            "</select>",
            "<label class=\"mt-3\">負責角色</label>",
            "<select data-detail-assignee>",
            ["consultant", "super_admin", "compliance_reviewer", "data_manager"].map(function (item) {
                return "<option value=\"" + item + "\"" + (item === (lead.assigned_to || "consultant") ? " selected" : "") + ">" + item + "</option>";
            }).join(""),
            "</select>",
            "<label class=\"mt-3\">跟進優先級</label>",
            "<select data-detail-priority>",
            ["high", "normal", "low"].map(function (item) {
                return "<option value=\"" + item + "\"" + (item === (lead.follow_up_priority || "normal") ? " selected" : "") + ">" + item + "</option>";
            }).join(""),
            "</select>",
            "<label class=\"mt-3\">聯繫渠道</label>",
            "<select data-detail-contact-channel>",
            ["phone", "line", "email", "manual_note"].map(function (item) {
                return "<option value=\"" + item + "\">" + item + "</option>";
            }).join(""),
            "</select>",
            "<label class=\"mt-3\">聯繫結果</label>",
            "<select data-detail-contact-outcome>",
            ["not_contacted", "reached", "info_sent", "left_message", "no_response", "invalid_contact"].map(function (item) {
                return "<option value=\"" + item + "\">" + item + "</option>";
            }).join(""),
            "</select>",
            "<label class=\"mt-3\">下次動作</label>",
            "<select data-detail-next-action>",
            ["follow_up", "send_public_info", "line_reminder", "close_no_need", "privacy_request"].map(function (item) {
                return "<option value=\"" + item + "\">" + item + "</option>";
            }).join(""),
            "</select>",
            "<label class=\"mt-3\">下次跟進日</label>",
            "<input data-detail-follow-up type=\"date\" value=\"" + escapeHtml(lead.next_follow_up_at || "") + "\">",
            "<textarea data-detail-note placeholder=\"新增備註\"></textarea>",
            "<button class=\"btn btn-primary btn-hover-secondary mt-4\" data-detail-save" + (can("update_lead") ? "" : " disabled") + ">更新紀錄</button> ",
            "<button class=\"btn btn-light btn-hover-primary mt-4\" data-detail-delete-request" + (can("update_lead") ? "" : " disabled") + ">標記刪除請求</button>"
        ].join("");

        detail.querySelector("[data-detail-save]").addEventListener("click", function () {
            if (!can("update_lead")) return;
            var nextStatus = detail.querySelector("[data-detail-status]").value;
            var nextAssignee = detail.querySelector("[data-detail-assignee]").value;
            var nextPriority = detail.querySelector("[data-detail-priority]").value;
            var contactChannel = detail.querySelector("[data-detail-contact-channel]").value;
            var contactOutcome = detail.querySelector("[data-detail-contact-outcome]").value;
            var nextAction = detail.querySelector("[data-detail-next-action]").value;
            var nextFollowUp = detail.querySelector("[data-detail-follow-up]").value;
            var note = detail.querySelector("[data-detail-note]").value.trim();
            var contactLog = {
                id: "contact_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8),
                channel: contactChannel,
                outcome: contactOutcome,
                next_action: nextAction,
                note: note,
                next_follow_up_at: nextFollowUp,
                handled_by_role: currentRole(),
                contacted_at: new Date().toISOString()
            };
            var followUpNote = "負責：" + nextAssignee + "；優先級：" + nextPriority + "；渠道：" + contactChannel + "；結果：" + contactOutcome + "；下次動作：" + nextAction + "；下次跟進：" + (nextFollowUp || "未排程");
            var fullNote = followUpNote + (note ? "；" + note : "");
            var meta = {
                assigned_to: nextAssignee,
                follow_up_priority: nextPriority,
                next_follow_up_at: nextFollowUp,
                contact_log: contactLog
            };
            var updater = window.TFSEApi && window.TFSEApi.updateLeadStatus ? window.TFSEApi.updateLeadStatus(lead.id, nextStatus, fullNote, meta) : Promise.resolve().then(function () {
                var leads = getLeads().map(function (item) {
                    if (item.id !== lead.id) return item;
                    item.status = nextStatus;
                    item.assigned_to = nextAssignee;
                    item.follow_up_priority = nextPriority;
                    item.next_follow_up_at = nextFollowUp;
                    item.updated_at = new Date().toISOString();
                    item.contact_logs = (item.contact_logs || []).concat(contactLog);
                    item.notes = (item.notes || []).concat(formatDate(item.updated_at) + " " + fullNote);
                    return item;
                });
                saveLeads(leads);
                return { mode: "localStorage" };
            });

            updater.then(function (result) {
                leadSourceMode = result.mode || leadSourceMode;
                addAudit("lead_follow_up_update", lead.id + ":" + nextStatus + ":" + nextAssignee + ":" + leadSourceMode);
                renderList();
                renderFollowUps();
                renderLeadDedupe();
            });
        });
        detail.querySelector("[data-detail-delete-request]").addEventListener("click", function () {
            if (!can("update_lead")) return;
            var leads = getLeads().map(function (item) {
                if (item.id !== lead.id) return item;
                item.delete_requested = true;
                item.privacy_request_type = "delete";
                item.privacy_request_status = item.privacy_request_status === "completed" ? "completed" : "pending";
                item.privacy_requested_at = item.privacy_requested_at || new Date().toISOString();
                item.status = "closed";
                item.updated_at = new Date().toISOString();
                item.notes = (item.notes || []).concat(formatDate(item.updated_at) + " 使用者資料刪除請求已標記，正式版需執行資料庫刪除流程。");
                return item;
            });
            saveLeads(leads);
            addAudit("lead_delete_request", lead.id);
            renderList();
            renderFollowUps();
            renderPrivacyRequests();
            renderDataRetention();
            renderCompliance();
        });
    }

    function renderProducts() {
        if (!productsTable) return;
        if (!productData.length) {
            productsTable.innerHTML = "<tr><td colspan=\"3\">尚無資料庫條目。</td></tr>";
            renderSourceReview();
            return;
        }

        productsTable.innerHTML = "<tr><td colspan=\"3\"><strong>資料來源：</strong>" + escapeHtml(productSourceMode) + "；編輯後會先保存本機覆蓋，API 模式下同步寫入後端 content_records。</td></tr>" + productData.map(function (item) {
            var product = productView(item);
            var status = productStatus(product);
            var editRow = editingProductId === product.id ? [
                "<tr><td colspan=\"3\">",
                "<label>標題</label><input data-product-edit-title=\"" + escapeHtml(product.id) + "\" type=\"text\" value=\"" + escapeHtml(product.title) + "\">",
                "<label class=\"mt-3\">摘要</label><textarea data-product-edit-summary=\"" + escapeHtml(product.id) + "\">" + escapeHtml(product.summary) + "</textarea>",
                "<label class=\"mt-3\">來源標題</label><input data-product-edit-source-title=\"" + escapeHtml(product.id) + "\" type=\"text\" value=\"" + escapeHtml(product.source_title || "") + "\">",
                "<label class=\"mt-3\">來源網址</label><input data-product-edit-source-url=\"" + escapeHtml(product.id) + "\" type=\"text\" value=\"" + escapeHtml(product.source_url || "") + "\">",
                "<button class=\"btn btn-primary btn-hover-secondary mt-4\" data-product-save=\"" + escapeHtml(product.id) + "\">保存資料</button> ",
                "<button class=\"btn btn-light btn-hover-primary mt-4\" data-product-cancel=\"" + escapeHtml(product.id) + "\">取消</button>",
                "</td></tr>"
            ].join("") : "";
            return [
                "<tr>",
                "<td><strong>" + escapeHtml(product.title) + "</strong><br><small>" + escapeHtml(product.category || "-") + "</small></td>",
                "<td>" + escapeHtml(product.audience || "-") + "<br><small>" + escapeHtml(product.region || "全台") + "</small></td>",
                "<td>" + escapeHtml(status) + "<br><select data-product-status=\"" + escapeHtml(product.id) + "\"" + (can("manage_product") ? "" : " disabled") + ">" + ["來源待核驗", "已核驗", "法令資訊", "宣導資訊", "需更新"].map(function (option) {
                    return "<option value=\"" + option + "\"" + (option === status ? " selected" : "") + ">" + option + "</option>";
                }).join("") + "</select><br><button class=\"btn btn-light btn-hover-primary mt-2\" data-product-edit=\"" + escapeHtml(product.id) + "\"" + (can("manage_product") ? "" : " disabled") + ">編輯</button></td>",
                "</tr>",
                editRow
            ].join("");
        }).join("");

        Array.prototype.slice.call(productsTable.querySelectorAll("[data-product-status]")).forEach(function (select) {
            select.addEventListener("change", function () {
                if (!can("manage_product")) return;
                saveProductStatus(select.getAttribute("data-product-status"), select.value);
                renderProducts();
                renderContentVersions();
                renderCompliance();
                renderSourceReview();
            });
        });
        Array.prototype.slice.call(productsTable.querySelectorAll("[data-product-edit]")).forEach(function (button) {
            button.addEventListener("click", function () {
                if (!can("manage_product")) return;
                editingProductId = button.getAttribute("data-product-edit");
                renderProducts();
            });
        });
        Array.prototype.slice.call(productsTable.querySelectorAll("[data-product-cancel]")).forEach(function (button) {
            button.addEventListener("click", function () {
                editingProductId = "";
                renderProducts();
            });
        });
        Array.prototype.slice.call(productsTable.querySelectorAll("[data-product-save]")).forEach(function (button) {
            button.addEventListener("click", function () {
                if (!can("manage_product")) return;
                var productId = button.getAttribute("data-product-save");
                saveProductOverride(productId, {
                    title: productsTable.querySelector("[data-product-edit-title=\"" + productId + "\"]").value.trim(),
                    summary: productsTable.querySelector("[data-product-edit-summary=\"" + productId + "\"]").value.trim(),
                    source_title: productsTable.querySelector("[data-product-edit-source-title=\"" + productId + "\"]").value.trim(),
                    source_url: productsTable.querySelector("[data-product-edit-source-url=\"" + productId + "\"]").value.trim(),
                    updated_at: new Date().toISOString().slice(0, 10)
                });
                editingProductId = "";
                renderProducts();
                renderContentVersions();
                renderCompliance();
                renderSourceReview();
            });
        });
        renderSourceReview();
    }

    function renderSourceReview() {
        if (!sourceReviewPanel) return;
        var queue = sourceReviewItems();
        var evidence = sourceEvidencePayload();
        var institutionImport = institutionImportPayload();
        renderPublicFeedback();
        if (sourceEvidencePanel) {
            sourceEvidencePanel.innerHTML = [
                "<p>來源留痕：" + evidence.counts.total + " 筆；已通過：" + evidence.counts.approved + "；需修正：" + evidence.counts.needs_revision + "；退回：" + evidence.counts.rejected + "。</p>",
                "<p>機構導入：" + escapeHtml(institutionImport.status) + "；種子 " + institutionImport.counts.institutions + " 筆；待復核 " + institutionImport.counts.stale_or_unverified + " 筆。</p>",
                evidence.records.slice(0, 3).map(function (item) {
                    return "<p><strong>" + escapeHtml(item.product_id) + "</strong><br>" + escapeHtml(item.result) + " ｜ " + escapeHtml(item.source_url || "-") + "</p>";
                }).join("")
            ].join("");
        }
        if (!queue.length) {
            sourceReviewPanel.innerHTML = "<p>目前沒有待復核來源。</p>";
            return;
        }
        sourceReviewPanel.innerHTML = [
            "<p>待復核資料：" + queue.length + " 筆；優先處理「需更新」與仍使用來源政策占位的條目。</p>",
            queue.slice(0, 8).map(function (item) {
                return [
                    "<p><strong>" + escapeHtml(item.title) + "</strong>",
                    "<br>" + escapeHtml(item.status) + " ｜ " + escapeHtml(item.category || "-") + " ｜ 更新 " + escapeHtml(item.updated_at || "-"),
                    "<br>原因：" + escapeHtml(item.reasons.join("、")),
                    "<br><a href=\"" + escapeHtml(item.source_url || "source-policy.html") + "\" target=\"_blank\" rel=\"noopener\">查看來源</a></p>"
                ].join("");
            }).join("")
        ].join("");
    }

    function renderPublicFeedback() {
        if (!publicFeedbackPanel) return;
        var payload = publicFeedbackPayload();
        publicFeedbackPanel.innerHTML = [
            "<p>資料回報入口：" + escapeHtml(payload.source_page) + "；收件類型：" + payload.summary.intake_types + "；低敏工單：" + payload.summary.local_feedback_tickets + "；來源待復核：" + payload.summary.source_review_items + "；來源留痕：" + payload.summary.source_evidence_records + "。</p>",
            "<p>目前收件來源：" + escapeHtml(payload.summary.feedback_source_mode || "localStorage") + "；後台會優先查詢正式 API，失敗時才顯示本機暫存。</p>",
            "<p>正式版需把 Email/API 收件轉成工單，只保存低敏摘要、官方來源 URL、處理角色與證據連結。</p>",
            (payload.local_feedback_tickets || []).length ? "<p><strong>最近本機工單：</strong>" + payload.local_feedback_tickets.slice(0, 3).map(function (item) { return escapeHtml((item.feedback_type || "content_error") + " / " + (item.page_url || "n/a")); }).join(" ｜ ") + "</p>" : "",
            payload.intake_types.map(function (item) {
                return "<p><strong>" + escapeHtml(item.label) + "</strong><br>" + escapeHtml(item.owner_role + " ｜ " + item.sla) + "</p>";
            }).join("")
        ].join("");
    }

    function articleStatusLabel(status) {
        var labels = {
            draft: "草稿",
            in_review: "待審",
            published: "已發布",
            archived: "已封存"
        };
        return labels[status] || status || "草稿";
    }

    function articleReviewButtons(article) {
        var status = articleStatus(article);
        var id = escapeHtml(article.id);
        var buttons = [];
        if (status === "published" && can("review_article")) {
            buttons.push("<button class=\"btn btn-light btn-hover-primary mt-2\" data-article-review-status=\"" + id + "\" data-next-status=\"in_review\" data-article-review-action=\"article_review_reopen\">送回待審</button>");
        }
        if ((status === "draft" || status === "archived") && can("manage_article")) {
            buttons.push("<button class=\"btn btn-light btn-hover-primary mt-2\" data-article-review-status=\"" + id + "\" data-next-status=\"in_review\" data-article-review-action=\"article_review_submit\">送審</button>");
        }
        if (status === "in_review" && can("review_article")) {
            buttons.push("<button class=\"btn btn-primary btn-hover-secondary mt-2\" data-article-review-status=\"" + id + "\" data-next-status=\"published\" data-article-review-action=\"article_review_approve\">核准發布</button>");
            buttons.push("<button class=\"btn btn-light btn-hover-primary mt-2\" data-article-review-status=\"" + id + "\" data-next-status=\"draft\" data-article-review-action=\"article_review_reject\">退回草稿</button>");
        }
        return buttons.join(" ");
    }

    function articleReviewItems() {
        return articleData.map(articleView).filter(function (article) {
            return articleStatus(article) !== "published";
        }).sort(function (a, b) {
            var order = { in_review: 0, draft: 1, archived: 2 };
            return (order[articleStatus(a)] || 9) - (order[articleStatus(b)] || 9);
        });
    }

    function renderArticleReview() {
        if (!articleReviewPanel) return;
        var queue = articleReviewItems();
        if (!queue.length) {
            articleReviewPanel.innerHTML = "<p>目前沒有待審文章。已發布文章仍可在文章表格中送回待審。</p>";
            return;
        }
        var waiting = queue.filter(function (article) {
            return articleStatus(article) === "in_review";
        }).length;
        articleReviewPanel.innerHTML = [
            "<p><strong>" + waiting + "</strong> 篇待審，<strong>" + queue.length + "</strong> 篇未發布內容需追蹤。</p>",
            queue.slice(0, 8).map(function (article) {
                return [
                    "<p><strong>" + escapeHtml(article.title) + "</strong>",
                    "<br>" + escapeHtml(articleStatusLabel(articleStatus(article))) + " ｜ " + escapeHtml(article.category || "-") + " ｜ 更新 " + escapeHtml(article.updated_at || "-"),
                    "<br>" + articleReviewButtons(article),
                    "</p>"
                ].join("");
            }).join("")
        ].join("");
    }

    function renderArticles() {
        if (!articlesTable) return;
        if (!articleData.length) {
            articlesTable.innerHTML = "<tr><td colspan=\"3\">尚無文章資料。</td></tr>";
            return;
        }

        articlesTable.innerHTML = "<tr><td colspan=\"3\"><strong>資料來源：</strong>" + escapeHtml(articleSourceMode) + "；文章狀態與內容編輯會保存版本覆蓋，API 模式下同步寫入後端 content_records。</td></tr>" + articleData.map(function (item) {
            var article = articleView(item);
            var status = articleStatus(article);
            var editRow = editingArticleId === article.id ? [
                "<tr><td colspan=\"3\">",
                "<label>標題</label><input data-article-edit-title=\"" + escapeHtml(article.id) + "\" type=\"text\" value=\"" + escapeHtml(article.title) + "\">",
                "<label class=\"mt-3\">摘要</label><textarea data-article-edit-summary=\"" + escapeHtml(article.id) + "\">" + escapeHtml(article.summary) + "</textarea>",
                "<label class=\"mt-3\">SEO 描述</label><textarea data-article-edit-seo=\"" + escapeHtml(article.id) + "\">" + escapeHtml(article.seo_description || "") + "</textarea>",
                "<label class=\"mt-3\">合規備註</label><textarea data-article-edit-note=\"" + escapeHtml(article.id) + "\">" + escapeHtml(article.compliance_note || "") + "</textarea>",
                "<button class=\"btn btn-primary btn-hover-secondary mt-4\" data-article-save=\"" + escapeHtml(article.id) + "\">保存文章</button> ",
                "<button class=\"btn btn-light btn-hover-primary mt-4\" data-article-cancel=\"" + escapeHtml(article.id) + "\">取消</button>",
                "</td></tr>"
            ].join("") : "";
            return [
                "<tr>",
                "<td><strong>" + escapeHtml(article.title) + "</strong><br><small>" + escapeHtml(article.updated_at || "-") + "</small></td>",
                "<td>" + escapeHtml(article.category || "-") + "</td>",
                "<td>" + escapeHtml(articleStatusLabel(status)) + "<br>" + articleReviewButtons(article) + " <button class=\"btn btn-light btn-hover-primary mt-2\" data-article-edit=\"" + escapeHtml(article.id) + "\"" + (can("manage_article") ? "" : " disabled") + ">編輯</button></td>",
                "</tr>",
                editRow
            ].join("");
        }).join("");

        Array.prototype.slice.call(articlesTable.querySelectorAll("[data-article-review-status]")).forEach(function (button) {
            button.addEventListener("click", function () {
                if (!can("review_article") && !can("manage_article")) return;
                saveArticleStatus(button.getAttribute("data-article-review-status"), button.getAttribute("data-next-status"), button.getAttribute("data-article-review-action"));
                renderArticles();
                renderArticleReview();
                renderContentVersions();
                renderCompliance();
                renderAudit();
            });
        });
        Array.prototype.slice.call(articlesTable.querySelectorAll("[data-article-edit]")).forEach(function (button) {
            button.addEventListener("click", function () {
                if (!can("manage_article")) return;
                editingArticleId = button.getAttribute("data-article-edit");
                renderArticles();
            });
        });
        Array.prototype.slice.call(articlesTable.querySelectorAll("[data-article-cancel]")).forEach(function (button) {
            button.addEventListener("click", function () {
                editingArticleId = "";
                renderArticles();
            });
        });
        Array.prototype.slice.call(articlesTable.querySelectorAll("[data-article-save]")).forEach(function (button) {
            button.addEventListener("click", function () {
                if (!can("manage_article")) return;
                var articleId = button.getAttribute("data-article-save");
                saveArticleOverride(articleId, {
                    title: articlesTable.querySelector("[data-article-edit-title=\"" + articleId + "\"]").value.trim(),
                    summary: articlesTable.querySelector("[data-article-edit-summary=\"" + articleId + "\"]").value.trim(),
                    seo_description: articlesTable.querySelector("[data-article-edit-seo=\"" + articleId + "\"]").value.trim(),
                    compliance_note: articlesTable.querySelector("[data-article-edit-note=\"" + articleId + "\"]").value.trim(),
                    updated_at: new Date().toISOString().slice(0, 10)
                });
                editingArticleId = "";
                renderArticles();
                renderContentVersions();
                renderCompliance();
                renderArticleReview();
            });
        });
        renderArticleReview();
    }

    function renderFaq() {
        if (!faqPanel) return;
        if (!faqData.length) {
            faqPanel.innerHTML = "<p>尚無 FAQ。</p>";
            return;
        }

        faqPanel.innerHTML = faqData.map(function (item, index) {
            var faq = faqView(item, index);
            var editRow = editingFaqId === faq.id && can("manage_faq") ? [
                "<div class=\"mb-4\">",
                "<label>問題</label><input data-faq-edit-question=\"" + escapeHtml(faq.id) + "\" type=\"text\" value=\"" + escapeHtml(faq.question) + "\">",
                "<label class=\"mt-3\">回答</label><textarea data-faq-edit-answer=\"" + escapeHtml(faq.id) + "\">" + escapeHtml(faq.answer) + "</textarea>",
                "<button class=\"btn btn-primary btn-hover-secondary mt-3\" data-faq-save=\"" + escapeHtml(faq.id) + "\">儲存 FAQ</button> ",
                "<button class=\"btn btn-light btn-hover-primary mt-3\" data-faq-cancel=\"" + escapeHtml(faq.id) + "\">取消</button>",
                "</div>"
            ].join("") : "";
            return [
                "<p><strong>" + escapeHtml(faq.question) + "</strong><br>",
                escapeHtml(faq.answer) + "</p>",
                can("manage_faq") ? "<button class=\"btn btn-light btn-hover-primary mt-2\" data-faq-edit=\"" + escapeHtml(faq.id) + "\">編輯 FAQ</button>" : "",
                editRow
            ].join("");
        }).join("");

        Array.prototype.slice.call(faqPanel.querySelectorAll("[data-faq-edit]")).forEach(function (button) {
            button.addEventListener("click", function () {
                if (!can("manage_faq")) return;
                editingFaqId = button.getAttribute("data-faq-edit");
                renderFaq();
            });
        });
        Array.prototype.slice.call(faqPanel.querySelectorAll("[data-faq-cancel]")).forEach(function (button) {
            button.addEventListener("click", function () {
                editingFaqId = "";
                renderFaq();
            });
        });
        Array.prototype.slice.call(faqPanel.querySelectorAll("[data-faq-save]")).forEach(function (button) {
            button.addEventListener("click", function () {
                if (!can("manage_faq")) return;
                var faqId = button.getAttribute("data-faq-save");
                saveFaqOverride(faqId, {
                    question: faqPanel.querySelector("[data-faq-edit-question=\"" + faqId + "\"]").value.trim(),
                    answer: faqPanel.querySelector("[data-faq-edit-answer=\"" + faqId + "\"]").value.trim(),
                    updated_at: new Date().toISOString().slice(0, 10)
                });
                editingFaqId = "";
                renderFaq();
                renderContentVersions();
                renderCompliance();
                renderBackupStatus();
            });
        });
    }

    function hasAllowedContext(text, term) {
        if (!complianceRules || !complianceRules.allowed_contexts) return false;
        var index = text.indexOf(term);
        if (index === -1) return true;
        var start = Math.max(0, index - 24);
        var end = Math.min(text.length, index + term.length + 24);
        var context = text.slice(start, end);
        return complianceRules.allowed_contexts.some(function (word) {
            return context.indexOf(word) !== -1;
        });
    }

    function complianceCopyScanPayload(text) {
        var rules = complianceRules || {};
        var copy = String(text || "").trim();
        var forbiddenHits = (rules.forbidden_terms || []).filter(function (term) {
            return copy.indexOf(term) !== -1 && !hasAllowedContext(copy, term);
        });
        var highRiskCta = ["立即申請", "馬上辦理", "快速撥款", "一定過件"].filter(function (term) {
            return copy.indexOf(term) !== -1 && !hasAllowedContext(copy, term);
        });
        var disclaimer = rules.required_disclaimer || "";
        var hasDisclaimer = !disclaimer || copy.indexOf(disclaimer) !== -1;
        var hasSensitiveAsk = ["身分證", "帳戶密碼", "信用卡號", "金融卡密碼", "存摺影本"].some(function (term) {
            return copy.indexOf(term) !== -1;
        });
        var issues = [];
        forbiddenHits.forEach(function (term) { issues.push("禁用詞需修改：" + term); });
        highRiskCta.forEach(function (term) { issues.push("CTA 可能過度導向：" + term); });
        if (!hasDisclaimer) issues.push("缺少必要免責聲明關鍵字：" + disclaimer);
        if (hasSensitiveAsk) issues.push("文案疑似要求敏感個資或證件，需改為低敏資訊說明。");
        return {
            status: issues.length ? "needs_revision" : "approved",
            issues: issues,
            forbidden_hits: forbiddenHits,
            high_risk_cta: highRiskCta,
            has_disclaimer: hasDisclaimer,
            has_sensitive_ask: hasSensitiveAsk,
            scanned_at: new Date().toISOString()
        };
    }

    function renderComplianceCopyResult(payload) {
        if (!complianceCopyResult) return;
        if (!payload) {
            complianceCopyResult.innerHTML = "<p>尚未掃描文案。</p>";
            return;
        }
        complianceCopyResult.innerHTML = [
            "<p>掃描結果：<strong>" + escapeHtml(payload.status) + "</strong></p>",
            payload.issues.length ? "<ul>" + payload.issues.map(function (item) {
                return "<li>" + escapeHtml(item) + "</li>";
            }).join("") + "</ul>" : "<p>未發現禁用詞、敏感資料要求或缺免責聲明問題。</p>",
            "<p>掃描時間：" + escapeHtml(formatDate(payload.scanned_at)) + "</p>"
        ].join("");
    }

    function renderCompliance() {
        if (!compliancePanel) return;
        if (!complianceRules) {
            compliancePanel.innerHTML = "<p>合規規則尚未載入。</p>";
            return;
        }

        var allArticleText = articleData.map(function (item) {
            var article = articleView(item);
            return [article.title, article.summary, article.seo_description, article.compliance_note].join(" ");
        }).join(" ");
        var forbiddenHits = (complianceRules.forbidden_terms || []).filter(function (term) {
            return allArticleText.indexOf(term) !== -1 && !hasAllowedContext(allArticleText, term);
        });
        var missingProductSource = productData.filter(function (item) {
            return !productStatus(item);
        }).length;
        var articleDrafts = articleData.filter(function (item) {
            return articleStatus(articleView(item)) !== "published";
        }).length;
        var productOverrideCount = Object.keys(getProductOverrides()).length;
        var articleOverrideCount = Object.keys(getArticleOverrides()).length;
        var faqOverrideCount = Object.keys(getFaqOverrides()).length;
        var verifiedInstitutions = institutionData.filter(function (item) {
            return item.verification_status === "verified";
        }).length;
        var pendingInstitutions = institutionData.filter(function (item) {
            return item.verification_status !== "verified";
        }).length;
        var auditLog = getAuditLog();
        var reviews = getComplianceReviews();
        var backup = backupPayload();
        var privacyPending = privacyRequestItems(false).length;
        var privacyTotal = privacyRequestItems(true).length;
        var lineSegments = lineSegmentItems().length;
        var adCampaigns = adCampaignItems().length;

        compliancePanel.innerHTML = [
            "<p>資料庫條目：" + productData.length + " 筆；缺少來源狀態：" + missingProductSource + " 筆。</p>",
            "<p>公開來源：" + institutionData.length + " 筆；已核驗：" + verifiedInstitutions + " 筆；待核驗/需更新：" + pendingInstitutions + " 筆。</p>",
            "<p>文章內容：" + articleData.length + " 篇；待發布草稿：" + articleDrafts + " 篇。</p>",
            "<p>本機內容覆蓋：資料庫 " + productOverrideCount + " 筆；文章 " + articleOverrideCount + " 筆；FAQ " + faqOverrideCount + " 筆。正式版需寫入 API 與版本紀錄。</p>",
            "<p>合規審核紀錄：" + reviews.length + " 筆；最近結果：" + (reviews[0] ? escapeHtml(reviews[0].result) : "尚無") + "。</p>",
            "<p>個資請求：" + privacyTotal + " 筆；待處理：" + privacyPending + " 筆；正式版需同步執行伺服器刪除、遮罩與審計留存。</p>",
            "<p>Line 分群同步：" + lineSegments + " 筆已同意 Line 的標籤資料；正式版需由 Line OA 或後端同步。</p>",
            "<p>廣告落地頁：" + adCampaigns + " 頁；投流前需核對 UTM、FAQ、表單、Line CTA 與免責聲明。</p>",
            "<p>FAQ：" + faqData.length + " 題；必要免責聲明關鍵字：「" + escapeHtml(complianceRules.required_disclaimer || "") + "」。</p>",
            "<p>禁用詞異常：" + (forbiddenHits.length ? escapeHtml(forbiddenHits.join(", ")) : "未發現越界語境") + "。</p>",
            "<p>文案即時預檢：可用於投流前檢查廣告、頁面或文章文案是否含禁用詞、缺免責聲明或敏感個資要求。</p>",
            "<p>最近審計紀錄：" + (auditLog[0] ? escapeHtml(formatDate(auditLog[0].at) + " " + auditLog[0].action + " " + auditLog[0].target) : "尚無紀錄") + "。</p>",
            "<p>本機備份範圍：潛客 " + backup.data.leads.length + " 筆；事件 " + backup.data.events.length + " 筆；內容覆蓋 " + (Object.keys(backup.data.product_overrides).length + Object.keys(backup.data.article_overrides).length) + " 筆。</p>",
            "<p>審核步驟：</p>",
            "<ul>" + (complianceRules.review_steps || []).map(function (step) {
                return "<li>" + escapeHtml(step) + "</li>";
            }).join("") + "</ul>"
        ].join("");
    }

    function renderAnalytics() {
        var events = getEvents();
        var errors = getErrors();
        var report = buildRetrospectiveReport();
        var attribution = attributionPayload();
        var trackingConsent = trackingConsentPayload();
        if (analyticsPanel) {
            analyticsPanel.innerHTML = [
                "<p>事件總數：" + events.length + " 筆。</p>",
                "<p>頁面瀏覽：" + countEvents(events, "page_view") + "；免費財務健檢查詢 CTA：" + countEvents(events, "cta_free_check_click") + "。</p>",
                "<p>資料庫搜尋：" + countEvents(events, "database_search") + "；資料庫篩選：" + countEvents(events, "database_filter") + "。</p>",
                "<p>文章點擊：" + countEvents(events, "article_click") + "；落地頁瀏覽：" + countEvents(events, "landing_page_view") + "；表單提交：" + countEvents(events, "lead_submit") + "。</p>",
                "<p>Line 承接展示：" + countEvents(events, "lead_line_cta_shown") + "；Line 點擊：" + countEvents(events, "line_cta_click") + "。</p>",
                "<p>漏斗轉換：CTA " + report.funnel.cta_click_rate_percent + "%；表單 " + report.funnel.lead_submit_rate_percent + "%；Line " + report.funnel.line_click_rate_percent + "%。</p>",
                "<p>主要來源：" + (report.lead_summary.by_source[0] ? escapeHtml(report.lead_summary.by_source[0].key + " " + report.lead_summary.by_source[0].count + " 筆") : "尚無潛客來源") + "。</p>",
                "<p>UTM 歸因：" + attribution.summary.campaigns + " 組來源；付費社群線索 " + attribution.summary.paid_social_leads + " 筆；direct/unknown " + attribution.summary.direct_or_unknown_leads + " 筆。</p>",
                "<p>追蹤同意：" + escapeHtml(trackingConsent.consent_status) + "；同意更新事件 " + trackingConsent.event_counts.consent_updates + " 筆；外部追蹤阻擋 " + trackingConsent.blockers.length + " 項。</p>",
                "<p>下一步建議：" + escapeHtml(report.next_actions[0] || "持續累積事件、潛客與來源資料後每週匯出復盤。") + "</p>",
                "<p>前台錯誤：" + errors.length + " 筆；最近：" + (errors[0] ? escapeHtml(errors[0].message || "-") : "尚無") + "。</p>",
                "<p>說明：正式版應在 site-config.json 填入 GA4、伺服器事件 API 與 Sentry；此處為本機 MVP 復盤。</p>"
            ].join("");
        }
        if (eventsPanel) {
            if (!events.length) {
                eventsPanel.innerHTML = "<p>尚無事件紀錄。</p>" + (errors.length ? errors.slice(0, 4).map(function (error) {
                    return "<p><strong>錯誤：" + escapeHtml(error.source || "-") + "</strong><br>" + escapeHtml(formatDate(error.at)) + " ｜ " + escapeHtml(error.message || "-") + "</p>";
                }).join("") : "");
                return;
            }
            eventsPanel.innerHTML = events.slice(0, 8).map(function (event) {
                return "<p><strong>" + escapeHtml(event.name) + "</strong><br>" + escapeHtml(formatDate(event.at)) + " ｜ " + escapeHtml(event.path || "-") + "</p>";
            }).join("") + errors.slice(0, 4).map(function (error) {
                return "<p><strong>錯誤：" + escapeHtml(error.source || "-") + "</strong><br>" + escapeHtml(formatDate(error.at)) + " ｜ " + escapeHtml(error.message || "-") + "</p>";
            }).join("");
        }
        renderBackupStatus();
    }

    function renderAttribution() {
        if (!attributionPanel) return;
        var payload = attributionPayload();
        attributionPanel.innerHTML = [
            "<p>歸因來源：" + payload.summary.campaigns + " 組；事件 " + payload.summary.total_events + " 筆；線索 " + payload.summary.total_leads + " 筆。報表只保留聚合數字，不輸出高敏個資。</p>",
            payload.campaigns.length ? payload.campaigns.slice(0, 8).map(function (item) {
                return [
                    "<p><strong>" + escapeHtml(item.label) + "</strong>",
                    "<br>線索 " + item.leads + " 筆；表單事件 " + item.form_submits + "；CTA " + item.free_check_cta_clicks + "；Line " + item.line_clicks,
                    "<br>線索率 " + item.lead_rate_percent + "%；Line 承接率 " + item.line_click_rate_percent + "%",
                    item.top_needs.length ? "<br>主要需求：" + escapeHtml(item.top_needs.map(function (need) { return need.key + " " + need.count; }).join("、")) : "",
                    item.next_actions.length ? "<br>建議：" + escapeHtml(item.next_actions[0]) : "",
                    "</p>"
                ].join("");
            }).join("") : "<p>尚無 UTM 歸因資料。投流 URL 需包含 utm_source、utm_medium、utm_campaign、utm_content 與 utm_term，表單提交後會自動入庫。</p>"
        ].join("");
    }

    function renderEventReplay() {
        if (!eventReplayPanel) return;
        var payload = eventReplayPayload();
        var analyticsDebug = analyticsDebugPayload();
        var sentryVerification = sentryVerificationPayload();
        eventReplayPanel.innerHTML = [
            "<p>待重放事件：" + payload.counts.queued_events + " 筆；事件類型：" + payload.counts.unique_event_names + " 種；Server Event endpoint：" + (payload.destinations.server_event_endpoint ? "已配置" : "待正式配置") + "。</p>",
            "<p>缺少必要事件：" + (payload.missing_required_event_names.length ? escapeHtml(payload.missing_required_event_names.join("、")) : "無") + "。</p>",
            "<p>GA4/Meta Debug：" + escapeHtml(analyticsDebug.status) + "；事件映射 " + analyticsDebug.event_mappings.length + " 項。</p>",
            "<p>Sentry 錯誤收件：" + escapeHtml(sentryVerification.status) + "；測試案例 " + sentryVerification.test_cases.length + " 項。</p>",
            payload.event_name_counts.slice(0, 8).map(function (item) {
                return "<p><strong>" + escapeHtml(item.key) + "</strong><br>" + item.count + " 筆</p>";
            }).join("") || "<p>尚無本機事件，請先以瀏覽器瀏覽首頁、資料庫、文章與免費財務健檢查詢流程。</p>"
        ].join("");
    }

    function loadAdminData() {
        return Promise.all([
            loadJson("assets/data/products.json", []),
            loadJson("assets/data/articles.json", []),
            loadJson("assets/data/faq.json", []),
            loadJson("assets/data/institutions.json", []),
            loadJson("assets/data/compliance-rules.json", null),
            loadJson("assets/data/landing-pages.json", []),
            loadJson("assets/data/line-flows.json", {}),
            loadJson("site-config.json", {}),
            loadJson("assets/data/browser-acceptance-evidence.json", {}),
            loadJson("assets/data/source-verification-evidence.json", {})
        ]).then(function (data) {
            productData = data[0] || [];
            articleData = data[1] || [];
            faqData = data[2] || [];
            institutionData = data[3] || [];
            complianceRules = data[4];
            landingPageData = data[5] || [];
            lineFlowData = data[6] || {};
            siteConfigData = data[7] || {};
            browserAcceptanceSeedRecords = [];
            sourceEvidenceSeedRecords = [];
            adminRecordSeedData = {};
            if (configDraftInput && !configDraftInput.value) configDraftInput.value = localStorage.getItem("tfse_site_config_update_draft") || "";
            syncAdminContentFromApi();
            renderFaq();
            renderContentVersions();
            renderCompliance();
            renderFormRisk();
            renderAnalytics();
            renderAttribution();
            renderEventReplay();
            renderAdCampaigns();
            renderConversionBacklog();
            renderLaunchHealth();
            renderReleaseReadiness();
            renderLocalAuditMatrix();
            renderOperationsTasks();
            renderConfigReadiness();
            renderConfigDraft();
            renderEnvTemplate();
            renderHandoffPanels();
            renderLaunchCutoverAudit();
            renderLaunchExecutionPlan();
            renderLaunchCountdownPlan();
            renderDomainCutover();
            renderBackendRoadmap();
            renderBackendAcceptance();
            renderSeoSubmission();
            renderSeoIndexingQueue();
            renderIncidentResponse();
            renderAcceptanceChecklist();
            renderExternalVerification();
            renderBrowserAcceptance();
            renderLegalReview();
            renderAdminSecurityMatrix();
            renderLeadDedupe();
            renderRealMetrics();
            renderVisualConsole();
            renderCurrentDatePill();
        });
    }

    if (search) search.addEventListener("input", renderList);
    if (status) status.addEventListener("change", renderList);
    if (tagFilter) tagFilter.addEventListener("change", renderList);
    if (sourceFilter) sourceFilter.addEventListener("change", renderList);
    if (visualConsolePanel) {
        visualConsolePanel.addEventListener("click", function (event) {
            var tabButton = event.target.closest("[data-visual-tab]");
            if (tabButton) {
                visualConsoleState.tab = tabButton.getAttribute("data-visual-tab") || "dashboard";
                visualConsoleState.page = 1;
                renderVisualConsole();
                return;
            }
            var viewButton = event.target.closest("[data-visual-lead-view]");
            if (viewButton) {
                visualConsoleState.selectedLeadId = viewButton.getAttribute("data-visual-lead-view") || "";
                renderVisualConsole();
                var detailPanel = visualConsolePanel.querySelector("[data-visual-lead-detail-panel]");
                if (detailPanel) {
                    detailPanel.focus();
                    detailPanel.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                return;
            }
            var closeButton = event.target.closest("[data-visual-lead-close]");
            if (closeButton) {
                visualConsoleState.selectedLeadId = "";
                renderVisualConsole();
                return;
            }
            var statusButton = event.target.closest("[data-visual-status-set]");
            if (statusButton) {
                updateVisualLeadStatus(statusButton.getAttribute("data-visual-status-lead"), statusButton.getAttribute("data-visual-status-set"));
                return;
            }
            var pageButton = event.target.closest("[data-visual-page]");
            if (pageButton) {
                visualConsoleState.page = Math.max(1, Number(pageButton.getAttribute("data-visual-page")) || 1);
                renderVisualConsole();
                return;
            }
            var triggerButton = event.target.closest("[data-visual-trigger]");
            if (triggerButton) {
                var target = document.querySelector(triggerButton.getAttribute("data-visual-trigger"));
                if (target) target.click();
                return;
            }
            var visualRefresh = event.target.closest("[data-visual-refresh]");
            if (visualRefresh) {
                if (refreshButton) refreshButton.click();
                else {
                    loadAdminData();
                    renderAfterLogin();
                }
            }
        });
        visualConsolePanel.addEventListener("input", function (event) {
            var target = event.target.closest("[data-visual-filter]");
            if (!target) return;
            visualConsoleState[target.getAttribute("data-visual-filter")] = target.value || "";
            visualConsoleState.page = 1;
            renderVisualConsole();
        });
        visualConsolePanel.addEventListener("change", function (event) {
            var target = event.target.closest("[data-visual-filter]");
            if (!target) return;
            visualConsoleState[target.getAttribute("data-visual-filter")] = target.value || "";
            visualConsoleState.page = 1;
            renderVisualConsole();
        });
    }
    if (refreshButton) refreshButton.addEventListener("click", function () {
        refreshButton.disabled = true;
        refreshButton.innerHTML = '<i class="fa fa-sync-alt fa-spin"></i> 更新中';
        Promise.resolve(loadAdminData()).then(function () {
            renderAfterLogin();
            addAudit("crm_dashboard_refresh", "local_mvp");
        }).finally(function () {
            refreshButton.disabled = false;
            refreshButton.innerHTML = '<i class="fa fa-sync-alt"></i> 更新資料';
        });
    });
    if (productCreateForm) productCreateForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!can("manage_product")) {
            addAudit("product_create_denied", "admin_product_form");
            if (productCreateStatus) productCreateStatus.innerHTML = "<p>目前角色沒有新增資料權限。</p>";
            return;
        }
        var formData = new FormData(productCreateForm);
        var item = createAdminProduct({
            title: String(formData.get("title") || "").trim(),
            category: String(formData.get("category") || "").trim(),
            summary: String(formData.get("summary") || "").trim(),
            source_url: String(formData.get("source_url") || "").trim()
        });
        productCreateForm.reset();
        addAudit("product_create", item.id + ":" + productSourceMode);
        if (productCreateStatus) productCreateStatus.innerHTML = "<p>已新增資料：「" + escapeHtml(item.title) + "」。來源：" + escapeHtml(productSourceMode) + "。</p>";
    });
    if (articleCreateForm) articleCreateForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!can("manage_article")) {
            addAudit("article_create_denied", "admin_article_form");
            if (articleCreateStatus) articleCreateStatus.innerHTML = "<p>目前角色沒有新增文章權限。</p>";
            return;
        }
        var formData = new FormData(articleCreateForm);
        var item = createAdminArticle({
            title: String(formData.get("title") || "").trim(),
            category: String(formData.get("category") || "").trim(),
            summary: String(formData.get("summary") || "").trim(),
            seo_description: String(formData.get("seo_description") || "").trim()
        });
        articleCreateForm.reset();
        addAudit("article_create", item.id + ":" + articleSourceMode);
        if (articleCreateStatus) articleCreateStatus.innerHTML = "<p>已新增文章草稿：「" + escapeHtml(item.title) + "」。來源：" + escapeHtml(articleSourceMode) + "。</p>";
    });
    if (completionOverviewPanel) completionOverviewPanel.addEventListener("click", function (event) {
        var button = event.target.closest("[data-admin-completion-jump]");
        if (!button) return;
        var target = document.querySelector(button.getAttribute("data-admin-completion-jump"));
        if (!target) return;
        if (target.tagName === "BUTTON") {
            target.click();
            return;
        }
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        if (target.focus) target.focus({ preventScroll: true });
    });
    if (seedButton) seedButton.addEventListener("click", function () {
        addAudit("seed_leads_disabled", "後台已禁止產生測試資料。");
        renderList();
        renderFollowUps();
        renderLeadDedupe();
        renderAnalytics();
        renderAttribution();
        renderConversionBacklog();
        renderEventReplay();
        renderBackupStatus();
        renderCompliance();
        renderFormRisk();
    });
    if (securityMatrixExportButton) securityMatrixExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("admin_security_matrix_export_denied", "tfse-admin-security-matrix.json");
            renderAudit();
            return;
        }
        var filename = "tfse-admin-security-matrix-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("admin_security_matrix_export", filename);
        downloadJson(filename, adminSecurityMatrixPayload());
        renderAdminSecurityMatrix();
        renderAudit();
    });
    if (securityHeadersExportButton) securityHeadersExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("security_headers_export_denied", "tfse-security-headers-deployment-check.json");
            renderAudit();
            return;
        }
        var filename = "tfse-security-headers-deployment-check-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("security_headers_export", filename);
        downloadJson(filename, securityHeadersPayload());
        renderAdminSecurityMatrix();
        renderAudit();
    });
    if (authCutoverExportButton) authCutoverExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("auth_cutover_export_denied", "tfse-admin-auth-cutover-check.json");
            renderAudit();
            return;
        }
        var filename = "tfse-admin-auth-cutover-check-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("auth_cutover_export", filename);
        downloadJson(filename, authCutoverPayload());
        renderAdminSecurityMatrix();
        renderAudit();
    });
    if (loginButton) loginButton.addEventListener("click", function () {
        var selectedRole = roleSelect ? roleSelect.value : "viewer";
        var password = passwordInput ? passwordInput.value : "";
        if (window.TFSEApi && window.TFSEApi.loginAdmin) {
            window.TFSEApi.loginAdmin({ password: password, role: selectedRole }).then(function (result) {
                if (result && result.mode === "api" && result.authenticated) {
                    setRole(result.role || selectedRole);
                    setAuthenticated(true, "api");
                    addAudit("admin_login", roleLabel(currentRole()) + ":api");
                    renderAfterLogin();
                    return;
                }
                if (password === adminPassword) {
                    setRole(selectedRole);
                    setAuthenticated(true, "local_mvp");
                    addAudit("admin_login", roleLabel(currentRole()) + ":local_mvp");
                    if (loginMessage) loginMessage.textContent = "API Auth 尚未配置，已使用本機 MVP 驗證。";
                    renderAfterLogin();
                    return;
                }
                if (loginMessage) loginMessage.textContent = "密碼不正確，請確認後再試。";
            }).catch(function (error) {
                if (password === adminPassword && !(error && (error.status === 401 || error.status === 403))) {
                    setRole(selectedRole);
                    setAuthenticated(true, "api_fallback_local_mvp");
                    addAudit("admin_login", roleLabel(currentRole()) + ":api_fallback_local_mvp");
                    if (loginMessage) loginMessage.textContent = "Auth API 暫時不可用，已退回本機 MVP 驗證。";
                    renderAfterLogin();
                    return;
                }
                if (loginMessage) loginMessage.textContent = error && (error.status === 401 || error.status === 403)
                    ? "Auth API 驗證失敗，請確認密碼或角色。"
                    : "密碼不正確，請確認後再試。";
            });
            return;
        }
        if (password === adminPassword) {
            setRole(selectedRole);
            setAuthenticated(true, "local_mvp");
            addAudit("admin_login", roleLabel(currentRole()) + ":local_mvp");
            renderAfterLogin();
            return;
        }
        if (loginMessage) loginMessage.textContent = "密碼不正確，請確認後再試。";
    });
    if (complianceButton) complianceButton.addEventListener("click", function () {
        if (!can("compliance")) return;
        addAudit("compliance_review", "admin_summary");
        renderCompliance();
        renderFormRisk();
    });
    if (complianceCopyScan) complianceCopyScan.addEventListener("click", function () {
        if (!can("compliance")) return;
        var payload = complianceCopyScanPayload(complianceCopyInput ? complianceCopyInput.value : "");
        latestComplianceScanPayload = payload;
        renderComplianceCopyResult(payload);
        addAudit("compliance_copy_scan", payload.status);
        if (reviewNote && payload.issues.length) {
            reviewNote.value = payload.issues.join("；");
        }
    });
    if (reviewSave) reviewSave.addEventListener("click", function () {
        if (!can("compliance")) return;
        var target = reviewTarget ? reviewTarget.value.trim() : "";
        if (!target) {
            if (reviewNote) reviewNote.value = "請先填寫審核對象。";
            return;
        }
        saveComplianceReview({
            id: "review_" + Date.now().toString(36),
            type: reviewType ? reviewType.value : "page",
            target: target,
            result: reviewResult ? reviewResult.value : "approved",
            note: reviewNote ? reviewNote.value.trim() : "",
            scan_payload: latestComplianceScanPayload,
            reviewer_role: currentRole(),
            reviewed_at: new Date().toISOString()
        });
        if (reviewTarget) reviewTarget.value = "";
        if (reviewNote) reviewNote.value = "";
        latestComplianceScanPayload = null;
        renderCompliance();
        renderAudit();
    });
    if (clearEventsButton) clearEventsButton.addEventListener("click", function () {
        localStorage.removeItem("tfse_events");
        addAudit("events_clear", "local_mvp");
        renderAnalytics();
        renderAttribution();
        renderConversionBacklog();
        renderEventReplay();
        renderIncidentResponse();
        renderCompliance();
        renderFormRisk();
    });
    if (retrospectiveExportButton) retrospectiveExportButton.addEventListener("click", function () {
        if (!can("retrospective")) {
            addAudit("retrospective_export_denied", "tfse-retrospective-report.json");
            renderAnalytics();
            renderAttribution();
            renderConversionBacklog();
            renderEventReplay();
            return;
        }
        var filename = "tfse-retrospective-report-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("retrospective_export", filename);
        downloadJson(filename, buildRetrospectiveReport());
        renderAnalytics();
        renderAttribution();
        renderConversionBacklog();
        renderEventReplay();
        renderAudit();
    });
    if (trackingConsentExportButton) trackingConsentExportButton.addEventListener("click", function () {
        if (!can("retrospective")) {
            addAudit("tracking_consent_export_denied", "tfse-tracking-consent-audit.json");
            renderAnalytics();
            renderAudit();
            return;
        }
        var filename = "tfse-tracking-consent-audit-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("tracking_consent_export", filename);
        downloadJson(filename, trackingConsentPayload());
        renderAnalytics();
        renderAudit();
    });
    if (attributionExportButton) attributionExportButton.addEventListener("click", function () {
        if (!can("retrospective")) {
            addAudit("attribution_export_denied", "tfse-utm-attribution-report.json");
            renderAudit();
            return;
        }
        var filename = "tfse-utm-attribution-report-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("attribution_export", filename);
        downloadJson(filename, attributionPayload());
        renderAudit();
    });
    if (eventReplayExportButton) eventReplayExportButton.addEventListener("click", function () {
        if (!can("analytics")) {
            addAudit("event_replay_export_denied", "tfse-server-event-replay-queue.json");
            renderAudit();
            return;
        }
        var filename = "tfse-server-event-replay-queue-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("event_replay_export", filename);
        downloadJson(filename, eventReplayPayload());
        renderAudit();
    });
    if (monitoringReceiptExportButton) monitoringReceiptExportButton.addEventListener("click", function () {
        if (!can("analytics")) {
            addAudit("monitoring_receipt_export_denied", "tfse-monitoring-receipt-checklist.json");
            renderAudit();
            return;
        }
        var filename = "tfse-monitoring-receipt-checklist-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("monitoring_receipt_export", filename);
        downloadJson(filename, monitoringReceiptPayload());
        renderAudit();
    });
    if (analyticsDebugExportButton) analyticsDebugExportButton.addEventListener("click", function () {
        if (!can("analytics")) {
            addAudit("analytics_debug_export_denied", "tfse-analytics-debug-verification-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-analytics-debug-verification-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("analytics_debug_export", filename);
        downloadJson(filename, analyticsDebugPayload());
        renderEventReplay();
        renderAudit();
    });
    if (sentryVerificationExportButton) sentryVerificationExportButton.addEventListener("click", function () {
        if (!can("analytics")) {
            addAudit("sentry_verification_export_denied", "tfse-sentry-error-verification-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-sentry-error-verification-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("sentry_verification_export", filename);
        downloadJson(filename, sentryVerificationPayload());
        renderEventReplay();
        renderAudit();
    });
    if (launchHealthExportButton) launchHealthExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("launch_health_export_denied", "tfse-launch-health-check.json");
            renderAudit();
            return;
        }
        var filename = "tfse-launch-health-check-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("launch_health_export", filename);
        downloadJson(filename, launchHealthPayload());
        renderReleaseReadiness();
        renderOperationsTasks();
        renderAudit();
    });
    if (releaseReadinessExportButton) releaseReadinessExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("release_readiness_export_denied", "tfse-release-readiness-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-release-readiness-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("release_readiness_export", filename);
        downloadJson(filename, releaseReadinessPayload());
        renderSeoSubmission();
        renderSeoIndexingQueue();
        renderOperationsTasks();
        renderAudit();
    });
    if (localAuditMatrixExportButton) localAuditMatrixExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("local_audit_matrix_export_denied", "tfse-local-audit-matrix.json");
            renderAudit();
            return;
        }
        var filename = "tfse-local-audit-matrix-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("local_audit_matrix_export", filename);
        downloadJson(filename, localAuditMatrixPayload());
        renderLocalAuditMatrix();
        renderAudit();
    });
    if (planCoverageExportButton) planCoverageExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("project_plan_coverage_export_denied", "tfse-project-plan-coverage-report.json");
            renderAudit();
            return;
        }
        var filename = "tfse-project-plan-coverage-report-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("project_plan_coverage_export", filename);
        downloadJson(filename, projectPlanCoveragePayload());
        renderHandoffPanels();
        renderAudit();
    });
    if (planRequirementsExportButton) planRequirementsExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("plan_requirement_trace_export_denied", "tfse-plan-requirement-trace.json");
            renderAudit();
            return;
        }
        var filename = "tfse-plan-requirement-trace-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("plan_requirement_trace_export", filename);
        downloadJson(filename, planRequirementTracePayload());
        renderHandoffPanels();
        renderAudit();
    });
    if (phaseAuditExportButton) phaseAuditExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("project_phase_audit_export_denied", "tfse-project-phase-audit.json");
            renderAudit();
            return;
        }
        var filename = "tfse-project-phase-audit-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("project_phase_audit_export", filename);
        downloadJson(filename, projectPhaseAuditPayload());
        renderHandoffPanels();
        renderAudit();
    });
    if (planClosureExportButton) planClosureExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("plan_closure_export_denied", "tfse-plan-closure-report.json");
            renderAudit();
            return;
        }
        var filename = "tfse-plan-closure-report-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("plan_closure_export", filename);
        downloadJson(filename, planClosurePayload());
        renderHandoffPanels();
        renderAudit();
    });
    if (externalExecutionExportButton) externalExecutionExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("external_execution_export_denied", "tfse-external-execution-packet.json");
            renderAudit();
            return;
        }
        var filename = "tfse-external-execution-packet-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("external_execution_export", filename);
        downloadJson(filename, externalExecutionPacketPayload());
        renderHandoffPanels();
        renderAudit();
    });
    if (launchHandoffExportButton) launchHandoffExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("launch_handoff_export_denied", "tfse-launch-handoff-manifest.json");
            renderAudit();
            return;
        }
        var filename = "tfse-launch-handoff-manifest-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("launch_handoff_export", filename);
        downloadJson(filename, launchHandoffManifestPayload());
        renderHandoffPanels();
        renderAudit();
    });
    if (ownerCutoverBundleExportButton) ownerCutoverBundleExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("owner_cutover_bundle_export_denied", "tfse-owner-cutover-bundle.json");
            renderAudit();
            return;
        }
        var filename = "tfse-owner-cutover-bundle-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("owner_cutover_bundle_export", filename);
        downloadJson(filename, ownerCutoverBundlePayload());
        renderHandoffPanels();
        renderAudit();
    });
    if (releaseDayRunsheetExportButton) releaseDayRunsheetExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("release_day_runsheet_export_denied", "tfse-release-day-runsheet.json");
            renderAudit();
            return;
        }
        var filename = "tfse-release-day-runsheet-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("release_day_runsheet_export", filename);
        downloadJson(filename, releaseDayRunsheetPayload());
        renderHandoffPanels();
        renderAudit();
    });
    if (externalExecutionForm) externalExecutionForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!can("launch_health")) {
            addAudit("external_execution_save_denied", "external_execution");
            renderAudit();
            return;
        }
        var payload = externalExecutionPacketPayload();
        var selected = payload.items.find(function (item) {
            return item.key === (externalExecutionItem ? externalExecutionItem.value : "");
        });
        if (!selected) {
            if (externalExecutionRecordsPanel) externalExecutionRecordsPanel.innerHTML = "<p>請先選擇要留痕的外部執行任務。</p>";
            return;
        }
        var record = {
            item_key: selected.key,
            item_title: selected.title,
            owner_role: selected.owner_role,
            result: externalExecutionResult ? externalExecutionResult.value : "in_progress",
            owner: externalExecutionOwner ? externalExecutionOwner.value.trim() || selected.owner_role : selected.owner_role,
            evidence_note: externalExecutionNote ? externalExecutionNote.value.trim() : "",
            checked_by_role: currentRole(),
            checked_at: new Date().toISOString()
        };
        saveExternalExecutionRecord(record);
        addAudit("external_execution_save", selected.key + ":" + record.result);
        if (externalExecutionNote) externalExecutionNote.value = "";
        renderHandoffPanels();
        renderOperationsTasks();
        renderReleaseReadiness();
        renderAudit();
    });
    if (launchHandoffForm) launchHandoffForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!can("launch_health")) {
            addAudit("launch_handoff_save_denied", "launch_handoff");
            renderAudit();
            return;
        }
        var record = {
            checkpoint: launchHandoffCheckpoint ? launchHandoffCheckpoint.value : "config_sync",
            result: launchHandoffResult ? launchHandoffResult.value : "ready",
            owner: launchHandoffOwner ? launchHandoffOwner.value.trim() || currentRole() : currentRole(),
            evidence_note: launchHandoffNote ? launchHandoffNote.value.trim() : "",
            checked_by_role: currentRole(),
            checked_at: new Date().toISOString()
        };
        saveLaunchHandoffRecord(record);
        addAudit("launch_handoff_save", record.checkpoint + ":" + record.result);
        if (launchHandoffNote) launchHandoffNote.value = "";
        renderHandoffPanels();
        renderReleaseReadiness();
        renderOperationsTasks();
        renderAudit();
    });
    if (operationsTasksExportButton) operationsTasksExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("operations_task_export_denied", "tfse-operations-task-queue.json");
            renderAudit();
            return;
        }
        var filename = "tfse-operations-task-queue-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("operations_task_export", filename);
        downloadJson(filename, operationsTaskPayload());
        renderIncidentResponse();
        renderAudit();
    });
    if (incidentResponseExportButton) incidentResponseExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("incident_response_export_denied", "tfse-incident-response-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-incident-response-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("incident_response_export", filename);
        downloadJson(filename, incidentResponsePayload());
        renderAudit();
    });
    if (configReadinessExportButton) configReadinessExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("config_readiness_export_denied", "tfse-production-config-readiness.json");
            renderAudit();
            return;
        }
        var filename = "tfse-production-config-readiness-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("config_readiness_export", filename);
        downloadJson(filename, configReadinessPayload());
        renderSeoSubmission();
        renderSeoIndexingQueue();
        renderDomainCutover();
        renderBackendAcceptance();
        renderReleaseReadiness();
        renderOperationsTasks();
        renderEnvTemplate();
        renderAudit();
    });
    if (configDraftTemplateButton) configDraftTemplateButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("config_draft_template_denied", "site-config.json");
            renderAudit();
            return;
        }
        if (configDraftInput) {
            configDraftInput.value = configDraftTemplate();
            localStorage.setItem("tfse_site_config_update_draft", configDraftInput.value);
        }
        addAudit("config_draft_template_loaded", "site-config.json");
        renderConfigDraft();
        renderAudit();
    });
    if (configDraftInput) configDraftInput.addEventListener("input", function () {
        localStorage.setItem("tfse_site_config_update_draft", configDraftInput.value);
        renderConfigDraft();
    });
    if (configDraftExportButton) configDraftExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("config_draft_export_denied", "tfse-site-config-update-package.json");
            renderAudit();
            return;
        }
        if (configDraftInput) localStorage.setItem("tfse_site_config_update_draft", configDraftInput.value.trim());
        var filename = "tfse-site-config-update-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("config_draft_export", filename);
        downloadJson(filename, configDraftPayload());
        renderConfigDraft();
        renderAudit();
    });
    if (configApprovalExportButton) configApprovalExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("config_approval_export_denied", "tfse-site-config-approval-package.json");
            renderAudit();
            return;
        }
        if (configDraftInput) localStorage.setItem("tfse_site_config_update_draft", configDraftInput.value.trim());
        var filename = "tfse-site-config-approval-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("config_approval_export", filename);
        downloadJson(filename, configApprovalPayload());
        renderConfigDraft();
        renderAudit();
    });
    if (envTemplateExportButton) envTemplateExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("env_template_export_denied", "tfse-production-env-template.json");
            renderAudit();
            return;
        }
        var filename = "tfse-production-env-template-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("env_template_export", filename);
        downloadJson(filename, envTemplatePayload());
        renderEnvTemplate();
        renderAudit();
    });
    if (configInputPacketExportButton) configInputPacketExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("config_input_packet_export_denied", "tfse-formal-config-input-packet.json");
            renderAudit();
            return;
        }
        var filename = "tfse-formal-config-input-packet-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("config_input_packet_export", filename);
        downloadJson(filename, formalConfigInputPacketPayload());
        renderHandoffPanels();
        renderAudit();
    });
    if (launchCutoverAuditExportButton) launchCutoverAuditExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("launch_cutover_audit_export_denied", "tfse-launch-cutover-audit.json");
            renderAudit();
            return;
        }
        var filename = "tfse-launch-cutover-audit-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("launch_cutover_audit_export", filename);
        downloadJson(filename, launchCutoverAuditPayload());
        renderLaunchCutoverAudit();
        renderReleaseReadiness();
        renderOperationsTasks();
        renderAudit();
    });
    if (launchExecutionPlanExportButton) launchExecutionPlanExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("launch_execution_plan_export_denied", "tfse-launch-execution-plan.json");
            renderAudit();
            return;
        }
        var filename = "tfse-launch-execution-plan-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("launch_execution_plan_export", filename);
        downloadJson(filename, launchExecutionPlanPayload());
        renderLaunchExecutionPlan();
        renderAudit();
    });
    if (launchCountdownPlanExportButton) launchCountdownPlanExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("launch_countdown_plan_export_denied", "tfse-launch-countdown-plan.json");
            renderAudit();
            return;
        }
        var filename = "tfse-launch-countdown-plan-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("launch_countdown_plan_export", filename);
        downloadJson(filename, launchCountdownPlanPayload());
        renderLaunchCountdownPlan();
        renderAudit();
    });
    if (configInputForm) configInputForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!can("launch_health")) {
            addAudit("config_input_save_denied", "formal_config_input");
            renderAudit();
            return;
        }
        var payload = formalConfigInputPacketPayload();
        var selected = payload.required_inputs.find(function (item) {
            return item.key === (configInputKey ? configInputKey.value : "");
        });
        if (!selected) {
            if (configInputRecordsPanel) configInputRecordsPanel.innerHTML = "<p>請先選擇要留痕的正式配置項。</p>";
            return;
        }
        var record = {
            input_key: selected.key,
            input_label: selected.label,
            owner_role: selected.owner_role,
            result: configInputResult ? configInputResult.value : "received",
            owner: configInputOwner ? configInputOwner.value.trim() || selected.owner_role : selected.owner_role,
            evidence_note: configInputNote ? configInputNote.value.trim() : "",
            checked_by_role: currentRole(),
            checked_at: new Date().toISOString()
        };
        saveConfigInputRecord(record);
        addAudit("config_input_save", selected.key + ":" + record.result);
        if (configInputNote) configInputNote.value = "";
        renderHandoffPanels();
        renderConfigReadiness();
        renderReleaseReadiness();
        renderOperationsTasks();
        renderAudit();
    });
    if (domainCutoverExportButton) domainCutoverExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("domain_cutover_export_denied", "tfse-domain-cutover-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-domain-cutover-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("domain_cutover_export", filename);
        downloadJson(filename, domainCutoverPayload());
        renderAudit();
    });
    if (hostFallbackExportButton) hostFallbackExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("host_fallback_export_denied", "tfse-host-fallback-deployment-check.json");
            renderAudit();
            return;
        }
        var filename = "tfse-host-fallback-deployment-check-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("host_fallback_export", filename);
        downloadJson(filename, hostFallbackPayload());
        renderDomainCutover();
        renderAudit();
    });
    if (backendAcceptanceExportButton) backendAcceptanceExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("backend_acceptance_export_denied", "tfse-backend-acceptance-matrix.json");
            renderAudit();
            return;
        }
        var filename = "tfse-backend-acceptance-matrix-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("backend_acceptance_export", filename);
        downloadJson(filename, backendAcceptancePayload());
        renderAudit();
    });
    if (backendRoadmapExportButton) backendRoadmapExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("backend_roadmap_export_denied", "tfse-backend-cutover-roadmap.json");
            renderAudit();
            return;
        }
        var filename = "tfse-backend-cutover-roadmap-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("backend_roadmap_export", filename);
        downloadJson(filename, backendRoadmapPayload());
        renderBackendRoadmap();
        renderBackendAcceptance();
        renderLaunchCutoverAudit();
        renderReleaseReadiness();
        renderOperationsTasks();
        renderAudit();
    });
    if (backendAcceptanceForm) backendAcceptanceForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!can("launch_health")) {
            addAudit("backend_acceptance_save_denied", "backend_acceptance");
            renderAudit();
            return;
        }
        var payload = backendAcceptancePayload();
        var selected = payload.endpoints.find(function (item) {
            return item.key === (backendAcceptanceEndpoint ? backendAcceptanceEndpoint.value : "");
        });
        if (!selected) {
            if (backendAcceptanceRecordsPanel) backendAcceptanceRecordsPanel.innerHTML = "<p>請先選擇要留痕的 API 驗收端點。</p>";
            return;
        }
        var record = {
            endpoint_key: selected.key,
            endpoint_label: selected.method + " " + selected.path,
            owner_role: "data_manager",
            result: backendAcceptanceResult ? backendAcceptanceResult.value : "passed",
            owner: backendAcceptanceOwner ? backendAcceptanceOwner.value.trim() || "data_manager" : "data_manager",
            evidence_note: backendAcceptanceNote ? backendAcceptanceNote.value.trim() : "",
            checked_by_role: currentRole(),
            checked_at: new Date().toISOString()
        };
        saveBackendAcceptanceRecord(record);
        addAudit("backend_acceptance_save", selected.key + ":" + record.result);
        if (backendAcceptanceNote) backendAcceptanceNote.value = "";
        renderBackendAcceptance();
        renderLaunchCutoverAudit();
        renderReleaseReadiness();
        renderOperationsTasks();
        renderAudit();
    });
    if (seoSubmissionExportButton) seoSubmissionExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("seo_submission_export_denied", "tfse-seo-submission-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-seo-submission-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("seo_submission_export", filename);
        downloadJson(filename, seoSubmissionPayload());
        renderSeoIndexingQueue();
        renderReleaseReadiness();
        renderOperationsTasks();
        renderAudit();
    });
    if (searchConsoleExportButton) searchConsoleExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("search_console_export_denied", "tfse-search-console-verification-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-search-console-verification-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("search_console_export", filename);
        downloadJson(filename, searchConsoleVerificationPayload());
        renderSeoSubmission();
        renderSeoIndexingQueue();
        renderAudit();
    });
    if (searchConsoleForm) searchConsoleForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!can("launch_health")) {
            addAudit("search_console_save_denied", "search_console");
            renderAudit();
            return;
        }
        var payload = searchConsoleVerificationPayload();
        var targets = searchConsoleTrackableItems(payload);
        var selected = targets.find(function (item) {
            return item.key === (searchConsoleTarget ? searchConsoleTarget.value : "");
        });
        if (!selected) {
            if (searchConsoleRecordsPanel) searchConsoleRecordsPanel.innerHTML = "<p>請先選擇要留痕的 Search Console 驗收目標。</p>";
            return;
        }
        var record = {
            target_key: selected.key,
            target_label: selected.label,
            target_type: selected.type,
            result: searchConsoleResult ? searchConsoleResult.value : "verified",
            owner: searchConsoleOwner ? searchConsoleOwner.value.trim() || "seo_owner" : "seo_owner",
            evidence_note: searchConsoleNote ? searchConsoleNote.value.trim() : "",
            checked_by_role: currentRole(),
            checked_at: new Date().toISOString()
        };
        saveSearchConsoleRecord(record);
        addAudit("search_console_save", selected.key + ":" + record.result);
        if (searchConsoleNote) searchConsoleNote.value = "";
        renderSeoSubmission();
        renderSeoIndexingQueue();
        renderLaunchCutoverAudit();
        renderReleaseReadiness();
        renderOperationsTasks();
        renderAudit();
    });
    if (seoIndexingExportButton) seoIndexingExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("seo_indexing_export_denied", "tfse-seo-indexing-followup-queue.json");
            renderAudit();
            return;
        }
        var filename = "tfse-seo-indexing-followup-queue-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("seo_indexing_export", filename);
        downloadJson(filename, seoIndexingQueuePayload());
        renderSeoIndexingQueue();
        renderAudit();
    });
    if (acceptanceExportButton) acceptanceExportButton.addEventListener("click", function () {
        if (!can("acceptance")) {
            addAudit("acceptance_export_denied", "tfse-acceptance-checklist.json");
            renderAudit();
            return;
        }
        var filename = "tfse-acceptance-checklist-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("acceptance_export", filename);
        downloadJson(filename, acceptanceChecklistPayload());
        renderReleaseReadiness();
        renderOperationsTasks();
        renderAudit();
    });
    if (externalVerificationForm) externalVerificationForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!can("launch_health")) {
            addAudit("external_verification_save_denied", "external_services");
            renderAudit();
            return;
        }
        var service = externalVerificationService ? externalVerificationService.value : "ga4";
        var result = externalVerificationResult ? externalVerificationResult.value : "passed";
        var record = {
            service: service,
            result: result,
            owner: externalVerificationOwner ? externalVerificationOwner.value.trim() || currentRole() : currentRole(),
            evidence_note: externalVerificationNote ? externalVerificationNote.value.trim() : "",
            checked_by_role: currentRole(),
            checked_at: new Date().toISOString()
        };
        saveExternalVerificationRecord(record);
        addAudit("external_verification_save", service + ":" + result);
        if (externalVerificationNote) externalVerificationNote.value = "";
        renderExternalVerification();
        renderLegalReview();
        renderReleaseReadiness();
        renderOperationsTasks();
        renderHandoffPanels();
        renderAudit();
    });
    if (externalVerificationExportButton) externalVerificationExportButton.addEventListener("click", function () {
        if (!can("launch_health")) {
            addAudit("external_verification_export_denied", "tfse-external-verification-evidence.json");
            renderAudit();
            return;
        }
        var filename = "tfse-external-verification-evidence-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("external_verification_export", filename);
        downloadJson(filename, externalVerificationPayload());
        renderAudit();
    });
    if (browserAcceptanceForm) browserAcceptanceForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!can("acceptance")) {
            addAudit("browser_acceptance_save_denied", "manual_browser");
            renderAudit();
            return;
        }
        var payload = browserAcceptanceReportPayload();
        var selected = payload.items.find(function (item) {
            return item.key === (browserAcceptanceItem ? browserAcceptanceItem.value : "");
        });
        if (!selected) {
            if (browserAcceptancePanel) browserAcceptancePanel.innerHTML = "<p>請先選擇要留痕的瀏覽器驗收項目。</p>";
            return;
        }
        var record = {
            item_key: selected.key,
            item_label: selected.label,
            group: selected.group,
            viewport: browserAcceptanceViewport ? browserAcceptanceViewport.value : "desktop",
            result: browserAcceptanceResult ? browserAcceptanceResult.value : "passed",
            evidence_note: browserAcceptanceNote ? browserAcceptanceNote.value.trim() : "",
            checked_by_role: currentRole(),
            checked_at: new Date().toISOString()
        };
        saveBrowserAcceptanceRecord(record);
        addAudit("browser_acceptance_save", selected.key + ":" + record.result);
        if (browserAcceptanceNote) browserAcceptanceNote.value = "";
        renderAcceptanceChecklist();
        renderBrowserAcceptance();
        renderLegalReview();
        renderReleaseReadiness();
        renderHandoffPanels();
        renderAudit();
    });
    if (browserAcceptanceExportButton) browserAcceptanceExportButton.addEventListener("click", function () {
        if (!can("acceptance")) {
            addAudit("browser_acceptance_export_denied", "tfse-browser-acceptance-report.json");
            renderAudit();
            return;
        }
        var filename = "tfse-browser-acceptance-report-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("browser_acceptance_export", filename);
        downloadJson(filename, browserAcceptanceReportPayload());
        renderAudit();
    });
    if (legalReviewExportButton) legalReviewExportButton.addEventListener("click", function () {
        if (!can("legal_review")) {
            addAudit("legal_review_export_denied", "tfse-legal-compliance-review.json");
            renderAudit();
            return;
        }
        var filename = "tfse-legal-compliance-review-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("legal_review_export", filename);
        downloadJson(filename, legalReviewPayload());
        renderAudit();
    });
    if (legalExternalReviewExportButton) legalExternalReviewExportButton.addEventListener("click", function () {
        if (!can("legal_review")) {
            addAudit("legal_external_review_export_denied", "tfse-legal-external-review-evidence.json");
            renderAudit();
            return;
        }
        var filename = "tfse-legal-external-review-evidence-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("legal_external_review_export", filename);
        downloadJson(filename, legalExternalReviewPayload());
        renderLegalReview();
        renderAudit();
    });
    if (complianceApiExportButton) complianceApiExportButton.addEventListener("click", function () {
        if (!can("legal_review")) {
            addAudit("compliance_api_persistence_export_denied", "tfse-compliance-api-persistence-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-compliance-api-persistence-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("compliance_api_persistence_export", filename);
        downloadJson(filename, complianceApiPersistencePayload());
        renderAudit();
    });
    if (formRiskExportButton) formRiskExportButton.addEventListener("click", function () {
        if (!can("compliance")) {
            addAudit("form_risk_export_denied", "tfse-form-risk-control-report.json");
            renderAudit();
            return;
        }
        var filename = "tfse-form-risk-control-report-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("form_risk_export", filename);
        downloadJson(filename, formRiskPayload());
        renderAudit();
    });
    if (turnstileExportButton) turnstileExportButton.addEventListener("click", function () {
        if (!can("compliance")) {
            addAudit("turnstile_backend_export_denied", "tfse-turnstile-backend-verification-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-turnstile-backend-verification-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("turnstile_backend_export", filename);
        downloadJson(filename, turnstileBackendPayload());
        renderFormRisk();
        renderAudit();
    });
    if (sourceReviewExportButton) sourceReviewExportButton.addEventListener("click", function () {
        if (!can("source_review")) {
            addAudit("source_review_export_denied", "tfse-source-review-queue.json");
            renderAudit();
            return;
        }
        var filename = "tfse-source-review-queue-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("source_review_export", filename);
        downloadJson(filename, sourceReviewPayload());
        renderAudit();
    });
    if (sourceEvidenceSaveButton) sourceEvidenceSaveButton.addEventListener("click", function () {
        if (!can("source_review")) {
            addAudit("source_evidence_save_denied", "source_review");
            renderAudit();
            return;
        }
        var productId = sourceEvidenceProduct ? sourceEvidenceProduct.value.trim() : "";
        var sourceUrl = sourceEvidenceUrl ? sourceEvidenceUrl.value.trim() : "";
        if (!productId || !/^https:\/\/[^/\s?#]+[^\s]*$/i.test(sourceUrl)) {
            if (sourceEvidenceNote) sourceEvidenceNote.value = "請填寫資料 ID，且官方來源 URL 需使用 https。";
            return;
        }
        var records = getSourceEvidenceRecords();
        records.unshift({
            id: "source_evidence_" + Date.now().toString(36),
            product_id: productId,
            result: sourceEvidenceResult ? sourceEvidenceResult.value : "approved",
            source_url: sourceUrl,
            evidence_note: sourceEvidenceNote ? sourceEvidenceNote.value.trim().slice(0, 300) : "",
            reviewer_role: currentRole(),
            reviewed_at: new Date().toISOString()
        });
        saveSourceEvidenceRecords(records);
        addAudit("source_evidence_save", productId + ":" + (sourceEvidenceResult ? sourceEvidenceResult.value : "approved"));
        if (sourceEvidenceProduct) sourceEvidenceProduct.value = "";
        if (sourceEvidenceUrl) sourceEvidenceUrl.value = "";
        if (sourceEvidenceNote) sourceEvidenceNote.value = "";
        renderSourceReview();
        renderAudit();
    });
    if (sourceEvidenceExportButton) sourceEvidenceExportButton.addEventListener("click", function () {
        if (!can("source_review")) {
            addAudit("source_evidence_export_denied", "tfse-source-verification-evidence.json");
            renderAudit();
            return;
        }
        var filename = "tfse-source-verification-evidence-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("source_evidence_export", filename);
        downloadJson(filename, sourceEvidencePayload());
        renderAudit();
    });
    if (institutionImportExportButton) institutionImportExportButton.addEventListener("click", function () {
        if (!can("source_review")) {
            addAudit("institution_import_export_denied", "tfse-institution-import-verification-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-institution-import-verification-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("institution_import_export", filename);
        downloadJson(filename, institutionImportPayload());
        renderSourceReview();
        renderAudit();
    });
    if (publicFeedbackExportButton) publicFeedbackExportButton.addEventListener("click", function () {
        if (!can("source_review")) {
            addAudit("public_feedback_export_denied", "tfse-public-feedback-intake-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-public-feedback-intake-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("public_feedback_export", filename);
        downloadJson(filename, publicFeedbackPayload());
        renderPublicFeedback();
        renderAudit();
    });
    if (publicFeedbackApiExportButton) publicFeedbackApiExportButton.addEventListener("click", function () {
        if (!can("source_review")) {
            addAudit("public_feedback_api_export_denied", "tfse-public-feedback-api-verification-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-public-feedback-api-verification-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("public_feedback_api_export", filename);
        downloadJson(filename, publicFeedbackApiVerificationPayload());
        renderPublicFeedback();
        renderAudit();
    });
    if (contentVersionsExportButton) contentVersionsExportButton.addEventListener("click", function () {
        if (!(can("manage_product") || can("manage_article") || can("manage_faq") || can("review_article"))) {
            addAudit("content_version_export_denied", "tfse-content-version-snapshot.json");
            renderAudit();
            return;
        }
        var filename = "tfse-content-version-snapshot-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("content_version_export", filename);
        downloadJson(filename, contentVersionPayload());
        renderAudit();
    });
    if (contentApiExportButton) contentApiExportButton.addEventListener("click", function () {
        if (!(can("manage_product") || can("manage_article") || can("manage_faq") || can("review_article"))) {
            addAudit("content_api_cutover_export_denied", "tfse-content-api-cutover-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-content-api-cutover-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("content_api_cutover_export", filename);
        downloadJson(filename, contentApiCutoverPayload());
        renderContentVersions();
        renderAudit();
    });
    if (privacyExportButton) privacyExportButton.addEventListener("click", function () {
        if (!can("privacy_request")) {
            addAudit("privacy_request_export_denied", "tfse-privacy-request-queue.json");
            renderAudit();
            return;
        }
        var filename = "tfse-privacy-request-queue-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("privacy_request_export", filename);
        downloadJson(filename, privacyRequestPayload());
        renderAudit();
    });
    if (privacyFulfillmentExportButton) privacyFulfillmentExportButton.addEventListener("click", function () {
        if (!can("privacy_request")) {
            addAudit("privacy_fulfillment_export_denied", "tfse-privacy-fulfillment-verification-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-privacy-fulfillment-verification-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("privacy_fulfillment_export", filename);
        downloadJson(filename, privacyFulfillmentPayload());
        renderAudit();
    });
    if (dataRetentionExportButton) dataRetentionExportButton.addEventListener("click", function () {
        if (!can("privacy_request")) {
            addAudit("data_retention_export_denied", "tfse-data-retention-purge-plan.json");
            renderAudit();
            return;
        }
        var filename = "tfse-data-retention-purge-plan-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("data_retention_export", filename);
        downloadJson(filename, dataRetentionPayload());
        renderDataRetention();
        renderAudit();
    });
    if (lineSegmentsExportButton) lineSegmentsExportButton.addEventListener("click", function () {
        if (!can("line_segment")) {
            addAudit("line_segment_export_denied", "tfse-line-segment-queue.json");
            renderAudit();
            return;
        }
        var filename = "tfse-line-segment-queue-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("line_segment_export", filename);
        downloadJson(filename, lineSegmentPayload());
        renderAudit();
    });
    if (lineOaSetupExportButton) lineOaSetupExportButton.addEventListener("click", function () {
        if (!can("line_segment")) {
            addAudit("line_oa_setup_export_denied", "tfse-line-oa-setup.json");
            renderAudit();
            return;
        }
        var filename = "tfse-line-oa-setup-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("line_oa_setup_export", filename);
        downloadJson(filename, lineOaSetupPayload());
        renderAudit();
    });
    if (lineOaHandoffExportButton) lineOaHandoffExportButton.addEventListener("click", function () {
        if (!can("line_segment")) {
            addAudit("line_oa_handoff_export_denied", "tfse-line-oa-handoff-check.json");
            renderAudit();
            return;
        }
        var filename = "tfse-line-oa-handoff-check-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("line_oa_handoff_export", filename);
        downloadJson(filename, lineOaHandoffPayload());
        renderLineSegments();
        renderAudit();
    });
    if (lineOaForm) lineOaForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!can("line_segment")) {
            addAudit("line_oa_save_denied", "line_oa");
            renderAudit();
            return;
        }
        var selected = lineOaTrackableItems().find(function (item) {
            return item.key === (lineOaTask ? lineOaTask.value : "");
        });
        if (!selected) {
            if (lineOaRecordsPanel) lineOaRecordsPanel.innerHTML = "<p>請先選擇要留痕的 Line OA 任務。</p>";
            return;
        }
        var record = {
            task_key: selected.key,
            task_label: selected.label,
            phase: selected.phase,
            result: lineOaResult ? lineOaResult.value : "completed",
            owner: lineOaOwner ? lineOaOwner.value.trim() || currentRole() : currentRole(),
            evidence_note: lineOaNote ? lineOaNote.value.trim() : "",
            checked_by_role: currentRole(),
            checked_at: new Date().toISOString()
        };
        saveLineOaRecord(record);
        addAudit("line_oa_save", selected.key + ":" + record.result);
        if (lineOaNote) lineOaNote.value = "";
        renderLineSegments();
        renderLaunchCutoverAudit();
        renderReleaseReadiness();
        renderOperationsTasks();
        renderAudit();
    });
    if (lineOptoutExportButton) lineOptoutExportButton.addEventListener("click", function () {
        if (!can("line_segment")) {
            addAudit("line_optout_export_denied", "tfse-line-optout-complaint-queue.json");
            renderAudit();
            return;
        }
        var filename = "tfse-line-optout-complaint-queue-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("line_optout_export", filename);
        downloadJson(filename, lineOptoutPayload());
        renderLineOptout();
        renderAudit();
    });
    if (lineOptoutApiExportButton) lineOptoutApiExportButton.addEventListener("click", function () {
        if (!can("privacy_request")) {
            addAudit("line_optout_api_export_denied", "tfse-line-optout-api-verification-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-line-optout-api-verification-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("line_optout_api_export", filename);
        downloadJson(filename, lineOptoutApiVerificationPayload());
        renderLineOptout();
        renderAudit();
    });
    if (adCampaignsExportButton) adCampaignsExportButton.addEventListener("click", function () {
        if (!can("ad_campaign")) {
            addAudit("ad_campaign_export_denied", "tfse-ad-campaign-checklist.json");
            renderAudit();
            return;
        }
        var filename = "tfse-ad-campaign-checklist-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("ad_campaign_export", filename);
        downloadJson(filename, adCampaignPayload());
        renderConversionBacklog();
        renderAudit();
    });
    if (conversionBacklogExportButton) conversionBacklogExportButton.addEventListener("click", function () {
        if (!can("ad_campaign")) {
            addAudit("conversion_backlog_export_denied", "tfse-conversion-optimization-backlog.json");
            renderAudit();
            return;
        }
        var filename = "tfse-conversion-optimization-backlog-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("conversion_backlog_export", filename);
        downloadJson(filename, conversionBacklogPayload());
        renderConversionBacklog();
        renderAudit();
    });
    if (exportButton) exportButton.addEventListener("click", function () {
        if (!can("export")) {
            addAudit("lead_export_denied", "tfse-leads.json");
            renderCompliance();
            return;
        }
        addAudit("lead_export", "tfse-leads.json");
        var data = JSON.stringify(getLeads(), null, 2);
        var blob = new Blob([data], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "tfse-leads.json";
        link.click();
        URL.revokeObjectURL(url);
    });
    if (followUpsExportButton) followUpsExportButton.addEventListener("click", function () {
        if (!can("update_lead")) {
            addAudit("follow_up_export_denied", "tfse-crm-follow-up-queue.json");
            renderAudit();
            return;
        }
        var filename = "tfse-crm-follow-up-queue-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("follow_up_export", filename);
        downloadJson(filename, followUpPayload());
        renderAudit();
    });
    if (contactLogExportButton) contactLogExportButton.addEventListener("click", function () {
        if (!can("update_lead")) {
            addAudit("contact_log_export_denied", "tfse-crm-contact-log.json");
            renderAudit();
            return;
        }
        var filename = "tfse-crm-contact-log-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("contact_log_export", filename);
        downloadJson(filename, contactLogPayload());
        renderAudit();
    });
    if (crmApiExportButton) crmApiExportButton.addEventListener("click", function () {
        if (!can("update_lead")) {
            addAudit("crm_api_persistence_export_denied", "tfse-crm-api-persistence-package.json");
            renderAudit();
            return;
        }
        var filename = "tfse-crm-api-persistence-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("crm_api_persistence_export", filename);
        downloadJson(filename, crmApiPersistencePayload());
        renderAudit();
    });
    if (leadDedupeExportButton) leadDedupeExportButton.addEventListener("click", function () {
        if (!can("update_lead")) {
            addAudit("lead_dedupe_export_denied", "tfse-lead-dedupe-queue.json");
            renderAudit();
            return;
        }
        var filename = "tfse-lead-dedupe-queue-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("lead_dedupe_export", filename);
        downloadJson(filename, leadDedupePayload());
        renderLeadDedupe();
        renderAudit();
    });
    if (backupExportButton) backupExportButton.addEventListener("click", function () {
        if (!can("backup")) {
            addAudit("backup_export_denied", "tfse-local-backup.json");
            renderBackupStatus("目前角色沒有備份匯出權限。");
            return;
        }
        var filename = "tfse-local-backup-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("backup_export", filename);
        downloadJson(filename, backupPayload());
        renderBackupStatus("已產生本機備份包。正式營運仍需伺服器資料庫備份與還原演練。");
        renderCompliance();
    });
    if (migrationExportButton) migrationExportButton.addEventListener("click", function () {
        if (!can("backup")) {
            addAudit("migration_export_denied", "tfse-formal-migration-package.json");
            renderBackupStatus("目前角色沒有正式遷移包匯出權限。");
            return;
        }
        var filename = "tfse-formal-migration-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("migration_export", filename);
        downloadJson(filename, migrationPayload());
        renderBackupStatus("已產生正式遷移包。匯入正式後端前仍需法務、個資與資料庫欄位核對。");
        renderAudit();
    });
    if (importValidationExportButton) importValidationExportButton.addEventListener("click", function () {
        if (!can("backup")) {
            addAudit("import_validation_export_denied", "tfse-import-validation-package.json");
            renderBackupStatus("目前角色沒有資料導入驗收包匯出權限。");
            return;
        }
        var filename = "tfse-import-validation-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("import_validation_export", filename);
        downloadJson(filename, importValidationPayload());
        renderBackupStatus("已產生資料導入驗收包。正式匯入前請核對測試資料、來源復核與個資請求。");
        renderAudit();
    });
    if (restoreDrillExportButton) restoreDrillExportButton.addEventListener("click", function () {
        if (!can("backup")) {
            addAudit("restore_drill_export_denied", "tfse-backup-restore-drill-plan.json");
            renderBackupStatus("目前角色沒有正式備份演練計畫匯出權限。");
            return;
        }
        var filename = "tfse-backup-restore-drill-plan-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("restore_drill_export", filename);
        downloadJson(filename, restoreDrillPayload());
        renderBackupStatus("已產生正式備份演練計畫。請在正式 PostgreSQL、排程、儲存與隔離還原環境完成外部驗證。");
        renderAudit();
    });
    if (backupReceiptExportButton) backupReceiptExportButton.addEventListener("click", function () {
        if (!can("backup")) {
            addAudit("backup_receipt_export_denied", "tfse-backup-receipt-verification-package.json");
            renderBackupStatus("目前角色沒有正式備份收據驗收包匯出權限。");
            return;
        }
        var filename = "tfse-backup-receipt-verification-package-" + new Date().toISOString().slice(0, 10) + ".json";
        addAudit("backup_receipt_export", filename);
        downloadJson(filename, backupReceiptPayload());
        renderBackupStatus("已產生正式備份收據驗收包。請在正式資料庫備份 job 與隔離還原演練完成後回填證據。");
        renderAudit();
    });
    if (backupImportButton) backupImportButton.addEventListener("click", function () {
        if (!can("backup")) {
            addAudit("backup_import_denied", "local_mvp");
            renderBackupStatus("目前角色沒有備份復原權限。");
            return;
        }
        var file = backupFileInput && backupFileInput.files ? backupFileInput.files[0] : null;
        if (!file) {
            renderBackupStatus("請先選擇 TFSE 本機備份 JSON。");
            return;
        }
        file.text().then(function (text) {
            applyBackup(JSON.parse(text));
            addAudit("backup_import", file.name);
            selectedId = "";
            renderAuthState();
            renderList();
            renderFollowUps();
            renderProducts();
            renderArticles();
            renderContentVersions();
            renderCompliance();
            renderFormRisk();
            renderAnalytics();
            renderAttribution();
            renderEventReplay();
            renderReleaseReadiness();
            renderLocalAuditMatrix();
            renderSeoSubmission();
            renderSeoIndexingQueue();
            renderHandoffPanels();
            renderLaunchCutoverAudit();
            renderLaunchExecutionPlan();
            renderLaunchCountdownPlan();
            renderDomainCutover();
            renderBackendRoadmap();
            renderBackendAcceptance();
            renderOperationsTasks();
            renderIncidentResponse();
            renderExternalVerification();
            renderLeadDedupe();
            renderLineOptout();
            renderAudit();
            renderBackupStatus("已匯入備份包，請抽查潛客、審計與內容覆蓋資料。");
        }).catch(function (error) {
            if (window.TFSEReportError) window.TFSEReportError("backup_import_failed", error && error.message ? error.message : error, {});
            renderBackupStatus("備份包匯入失敗：" + (error && error.message ? error.message : error));
        });
    });

    renderAuthState();
    syncAuthFromApi().then(function (result) {
        if (!(result && result.mode === "api" && !result.authenticated)) syncLeadsFromApi();
    });
    renderAnalytics();
    renderAttribution();
    renderConversionBacklog();
    renderEventReplay();
    renderReleaseReadiness();
    renderLocalAuditMatrix();
    renderSeoSubmission();
    renderSeoIndexingQueue();
    renderConfigDraft();
    renderEnvTemplate();
    renderHandoffPanels();
    renderLaunchCutoverAudit();
    renderLaunchExecutionPlan();
    renderLaunchCountdownPlan();
    renderDomainCutover();
    renderBackendRoadmap();
    renderBackendAcceptance();
    renderOperationsTasks();
    renderIncidentResponse();
    renderExternalVerification();
    renderAdminSecurityMatrix();
    renderLeadDedupe();
    renderDataRetention();
    renderLineOptout();
    renderAudit();
    renderBackupStatus();
    loadAdminData();
})();
