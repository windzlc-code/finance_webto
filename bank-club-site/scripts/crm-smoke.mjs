import path from "node:path";
import { readDbJson, readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const keepData = process.env.CRM_SMOKE_KEEP_DATA === "1";
const defaultPassword = "admin123";
const legacyDefaultPassword = "BankClub2026!";
const onePixelPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l3+1MgAAAABJRU5ErkJggg==", "base64");
const expectedLeadStatuses = [
  "new",
  "assigned",
  "contacted",
  "appointment_scheduled",
  "pre_reviewed",
  "pending_documents",
  "documents_received",
  "incomplete_documents",
  "proposal_suggested",
  "submitted_to_bank",
  "bank_reviewing",
  "approved",
  "funded",
  "rejected",
  "customer_gave_up",
  "follow_up_later",
  "invalid",
  "closed",
];
const csvFormulaProbeName = '=HYPERLINK("https://example.com","CRM 煙測使用者")';

function fail(message) {
  const error = new Error(message);
  error.name = "CrmSmokeError";
  throw error;
}

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

function cookieFromSetCookie(headers) {
  const setCookie = headers.get("set-cookie") || "";
  const match = setCookie.match(/bank_club_session=[^;]+/);
  return match?.[0] || "";
}

function sameOriginHeaders(cookie = "", ip = "127.0.0.188") {
  return {
    origin: baseUrl,
    referer: `${baseUrl}/admin`,
    "x-forwarded-for": ip,
    ...(cookie ? { cookie } : {}),
  };
}

async function fetchJson(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const json = await parseJson(response);
  return { response, json };
}

async function adminLogin(db) {
  const admin = db.users.find((user) => user.role === "super_admin") || db.users[0];
  const passwordCandidates = [
    process.env.CRM_SMOKE_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    defaultPassword,
    legacyDefaultPassword,
  ].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);
  let loginResult = null;
  for (const password of passwordCandidates) {
    const result = await fetchJson("/api/admin/login", {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", "127.0.0.189"),
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: admin.email, password }),
    });
    loginResult = result;
    if (result.response.ok) break;
  }
  if (!loginResult?.response.ok) {
    fail(`admin login failed HTTP ${loginResult?.response.status}: ${loginResult?.json.message || "unknown error"}. Set CRM_SMOKE_ADMIN_PASSWORD to the current local admin password.`);
  }
  const cookie = cookieFromSetCookie(loginResult.response.headers);
  if (!cookie) fail("admin login did not return bank_club_session cookie");
  if (loginResult.json.user?.role !== "super_admin") fail(`admin login returned unexpected role: ${loginResult.json.user?.role}`);
  return { cookie, admin };
}

async function submitLead() {
  const form = new FormData();
  const appointment = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const sessionId = `crm-smoke-${Date.now()}`;
  form.set("website", "");
  form.set("name", csvFormulaProbeName);
  form.set("gender", "other");
  form.set("phone", "0912 345 678");
  form.set("lineId", "crmSmokeLine");
  form.set("identityType", "employee");
  form.set("loanType", "credit");
  form.set("desiredAmount", "800000");
  form.set("requestedAmount", "800000");
  form.set("requestedTermYears", "5");
  form.set("caseSource", "company_preferential");
  form.set("programType", "binding");
  form.set("idFront", new File([onePixelPng], "crm-smoke-id-front.png", { type: "image/png" }));
  form.set("idBack", new File([onePixelPng], "crm-smoke-id-back.png", { type: "image/png" }));
  form.set("appointmentTime", appointment);
  form.set("purpose", "unsure");
  form.set("note", "CRM 煙測：表單提交到後台跟進閉環。");
  form.set("consent", "on");
  form.set("sourcePage", "/consultation");
  form.set("sourceChannel", "seo");
  form.set("utmSource", "google");
  form.set("utmMedium", "organic");
  form.set("utmCampaign", "crm-smoke");
  form.set("utmContent", "api");
  form.set("utmTerm", "信貸煙測");
  form.set("seoKeyword", "信貸煙測");
  form.set("sessionId", sessionId);

  const response = await fetch(`${baseUrl}/api/leads`, {
    method: "POST",
    headers: { "x-forwarded-for": `127.0.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}` },
    body: form,
  });
  const json = await parseJson(response);
  if (!response.ok || !json.leadId) {
    fail(`lead submit failed HTTP ${response.status}: ${json.message || "missing leadId"}`);
  }
  return { leadId: json.leadId, sessionId };
}

async function run() {
  const backup = keepData ? null : await readDbSnapshot(dbPath);
  const originalDB = JSON.parse(backup || await readDbSnapshot(dbPath));
  try {
    const { cookie } = await adminLogin(originalDB);
    const { leadId, sessionId } = await submitLead();
    const headers = { ...sameOriginHeaders(cookie), "content-type": "application/json" };

    const list = await fetchJson("/api/admin/leads?loanType=credit&sourceChannel=seo", { headers });
    if (!list.response.ok) fail(`admin lead list failed HTTP ${list.response.status}`);
    const listedLead = list.json.leads?.find((lead) => lead.id === leadId);
    if (!listedLead) fail("submitted lead not found in filtered admin lead list");
    if (listedLead.phone === "0912 345 678" || listedLead.lineId === "crmSmokeLine") {
      fail("admin lead list should mask phone and LINE ID");
    }

    const detail = await fetchJson(`/api/admin/leads/${leadId}`, { headers });
    if (!detail.response.ok) fail(`admin lead detail failed HTTP ${detail.response.status}`);
    if (detail.json.lead?.phone !== "0912 345 678") fail("admin lead detail did not expose full phone for authorized admin");
    if (detail.json.lead?.utmTerm !== "信貸煙測") fail("lead detail missing UTM term");
    if (detail.json.lead?.sourcePage !== "/consultation" || detail.json.lead?.sourceChannel !== "seo") {
      fail("lead detail missing source page/channel");
    }
    if (!detail.json.lead?.consentAt || detail.json.lead?.consentVersion !== "2026-06-30") {
      fail("lead detail missing consent audit fields");
    }

    const patch = await fetchJson(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        status: "contacted",
        documentStatus: "received",
        leadPriority: "needs_review",
        nextFollowUpAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        hasClickedLine: true,
        doNotContact: true,
        deletionRequested: true,
        privacyRequestNote: "CRM 煙測：使用者要求停止聯繫並確認刪除/停止利用請求。",
      }),
    });
    if (!patch.response.ok) fail(`lead status update failed HTTP ${patch.response.status}: ${patch.json.message || ""}`);
    if (
      patch.json.lead?.status !== "contacted" ||
      patch.json.lead?.documentStatus !== "received" ||
      patch.json.lead?.doNotContact !== true ||
      patch.json.lead?.deletionRequested !== true ||
      !patch.json.lead?.privacyRequestNote?.includes("停止聯繫")
    ) {
      fail("lead update did not persist status/document/privacy request fields");
    }
    const statusUpdatedFollowUpAt = patch.json.lead?.lastFollowUpAt || "";
    if (!statusUpdatedFollowUpAt || Number.isNaN(Date.parse(statusUpdatedFollowUpAt))) {
      fail("contacted status update did not refresh lastFollowUpAt");
    }

    const invalidFollowUp = await fetchJson(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ nextFollowUpAt: "不是有效時間" }),
    });
    if (invalidFollowUp.response.status !== 400 || !invalidFollowUp.json.message?.includes("下次跟進時間")) {
      fail(`invalid next follow-up time should be rejected, got HTTP ${invalidFollowUp.response.status}: ${invalidFollowUp.json.message || ""}`);
    }
    const detailAfterInvalidFollowUp = await fetchJson(`/api/admin/leads/${leadId}`, { headers });
    if (detailAfterInvalidFollowUp.json.lead?.nextFollowUpAt !== patch.json.lead.nextFollowUpAt) {
      fail("invalid next follow-up time should not overwrite existing schedule");
    }

    const note = await fetchJson("/api/admin/notes", {
      method: "POST",
      headers,
      body: JSON.stringify({ leadId, body: "已完成電話初步聯繫，提醒不要在網站上傳敏感文件。" }),
    });
    if (!note.response.ok || !note.json.note?.id) {
      fail(`lead note create failed HTTP ${note.response.status}: ${note.json.message || ""}`);
    }

    const sensitiveNote = await fetchJson("/api/admin/notes", {
      method: "POST",
      headers,
      body: JSON.stringify({
        leadId,
        body: "身分證 A123456789，銀行帳號 123456789012，這段應被後台拒絕。",
      }),
    });
    if (sensitiveNote.response.status !== 400 || !sensitiveNote.json.message?.includes("完整敏感文件內容")) {
      fail(`sensitive lead note should be rejected, got HTTP ${sensitiveNote.response.status}: ${sensitiveNote.json.message || ""}`);
    }

    const detailAfterNote = await fetchJson(`/api/admin/leads/${leadId}`, { headers });
    if (!detailAfterNote.json.notes?.some((item) => item.id === note.json.note.id)) {
      fail("lead detail did not include newly created note");
    }
    if (!detailAfterNote.json.lead?.lastFollowUpAt || detailAfterNote.json.lead.lastFollowUpAt !== note.json.note.createdAt) {
      fail("lead note creation did not refresh lastFollowUpAt");
    }
    if (detailAfterNote.json.notes?.some((item) => item.body.includes("A123456789") || item.body.includes("123456789012"))) {
      fail("sensitive lead note content was persisted after rejection");
    }
    if (!detailAfterNote.json.lead?.doNotContact || !detailAfterNote.json.lead?.deletionRequested) {
      fail("lead detail did not include privacy request flags after update");
    }

    const sensitivePrivacyNote = await fetchJson(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        privacyRequestNote: "個資請求備註誤貼身分證 A123456789 與銀行帳號 123456789012，應被拒絕。",
      }),
    });
    if (sensitivePrivacyNote.response.status !== 400 || !sensitivePrivacyNote.json.message?.includes("完整敏感文件內容")) {
      fail(`sensitive privacy request note should be rejected, got HTTP ${sensitivePrivacyNote.response.status}: ${sensitivePrivacyNote.json.message || ""}`);
    }
    const detailAfterSensitivePrivacyNote = await fetchJson(`/api/admin/leads/${leadId}`, { headers });
    if (
      detailAfterSensitivePrivacyNote.json.lead?.privacyRequestNote?.includes("A123456789") ||
      detailAfterSensitivePrivacyNote.json.lead?.privacyRequestNote?.includes("123456789012")
    ) {
      fail("sensitive privacy request note content was persisted after rejection");
    }

    for (const status of expectedLeadStatuses) {
      const statusUpdate = await fetchJson(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      if (!statusUpdate.response.ok || statusUpdate.json.lead?.status !== status) {
        fail(`lead status flow rejected ${status}: HTTP ${statusUpdate.response.status}`);
      }
    }
    const detailAfterStatusFlow = await fetchJson(`/api/admin/leads/${leadId}`, { headers });
    if (detailAfterStatusFlow.json.lead?.status !== expectedLeadStatuses.at(-1)) {
      fail(`lead status flow did not persist final status ${expectedLeadStatuses.at(-1)}`);
    }

    const listAfterPrivacy = await fetchJson("/api/admin/leads?loanType=credit&sourceChannel=seo", { headers });
    const privacyListedLead = listAfterPrivacy.json.leads?.find((lead) => lead.id === leadId);
    if (!privacyListedLead?.doNotContact || !privacyListedLead?.deletionRequested) {
      fail("admin lead list did not retain privacy request flags");
    }

    const summary = await fetchJson("/api/admin/summary", { headers });
    if (!summary.response.ok) fail(`admin summary failed HTTP ${summary.response.status}`);
    if (summary.json.totalLeads < 1 || summary.json.formSubmitsBySource?.seo < 1) {
      fail("admin summary did not include submitted lead/source");
    }
    if (summary.json.conversionRates?.contactedLeads < 1) {
      fail("admin summary did not count contacted lead");
    }
    if (
      summary.json.operationsQueue?.needsManualReview < 1 ||
      summary.json.operationsQueue?.privacyRequests < 1 ||
      summary.json.operationsQueue?.lineClicked < 1 ||
      summary.json.operationsQueue?.documentsReceived < 1
    ) {
      fail(`admin summary operations queue did not include lead follow-up/document/privacy state: ${JSON.stringify(summary.json.operationsQueue || {})}`);
    }

    const exportResponse = await fetch(`${baseUrl}/api/admin/leads/export?loanType=credit&sourceChannel=seo`, {
      headers: sameOriginHeaders(cookie),
    });
    const csv = await exportResponse.text();
    if (!exportResponse.ok || !csv.includes(leadId) || !csv.includes("信貸煙測")) {
      fail(`lead export failed HTTP ${exportResponse.status}`);
    }
    if (csv.includes(`"${csvFormulaProbeName.replaceAll('"', '""')}"`) || !csv.includes(`"'${csvFormulaProbeName.replaceAll('"', '""')}"`)) {
      fail("lead export did not escape spreadsheet formula-like cells");
    }
    if (!csv.includes('"yes","yes","CRM 煙測：使用者要求停止聯繫並確認刪除/停止利用請求。"')) {
      fail("lead export did not include privacy request flags and note");
    }

    const db = await readDbJson(dbPath);
    const auditActions = db.auditLogs.map((log) => log.action);
    for (const action of ["lead_created", "lead_contact_viewed", "lead_updated", "lead_privacy_request_updated", "note_created", "leads_exported"]) {
      if (!auditActions.includes(action)) fail(`missing audit action ${action}`);
    }
    const exportLog = db.auditLogs.find((log) => log.action === "leads_exported");
    if (!exportLog?.targetId.includes("count=") || !exportLog.targetId.includes("loanType=credit") || !exportLog.targetId.includes("sourceChannel=seo")) {
      fail(`lead export audit log did not include export scope: ${exportLog?.targetId || "missing"}`);
    }
    if (!db.events.some((event) => event.eventName === "form_submit" && event.leadId === leadId && event.sessionId === sessionId)) {
      fail("missing form_submit event for submitted lead");
    }

    console.log(JSON.stringify({
      leadId,
      maskedListPhone: listedLead.phone,
      detailPhone: detail.json.lead.phone,
      updatedStatus: patch.json.lead.status,
      privacyRequest: {
        doNotContact: patch.json.lead.doNotContact,
        deletionRequested: patch.json.lead.deletionRequested,
      },
      invalidFollowUpRejection: invalidFollowUp.json.message,
      followUp: {
        statusUpdatedAt: statusUpdatedFollowUpAt,
        lastFollowUpAt: detailAfterNote.json.lead.lastFollowUpAt,
        noteCreatedAt: note.json.note.createdAt,
      },
      statusFlow: {
        checked: expectedLeadStatuses.length,
        finalStatus: detailAfterStatusFlow.json.lead.status,
      },
      noteId: note.json.note.id,
      sensitiveNoteRejection: sensitiveNote.json.message,
      sensitivePrivacyNoteRejection: sensitivePrivacyNote.json.message,
      csvFormulaEscaped: true,
      exportAuditTargetId: exportLog.targetId,
      auditActions: auditActions.filter((action) => ["lead_created", "lead_contact_viewed", "lead_updated", "lead_privacy_request_updated", "note_created", "leads_exported"].includes(action)),
      summary: {
        totalLeads: summary.json.totalLeads,
        contactedLeads: summary.json.conversionRates.contactedLeads,
        seoSubmits: summary.json.formSubmitsBySource.seo,
        operationsQueue: summary.json.operationsQueue,
      },
      exportBytes: csv.length,
    }, null, 2));
  } finally {
    if (backup !== null) {
      await writeDbSnapshot(backup, { dbPath, label: "crm-smoke" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
