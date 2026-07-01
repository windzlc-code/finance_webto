import { createServer } from "node:http";
import path from "node:path";
import { readDbJson, readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const keepData = process.env.NOTIFICATION_SMOKE_KEEP_DATA === "1";
const webhookUrl = process.env.NOTIFICATION_SMOKE_WEBHOOK_URL || "http://127.0.0.1:3109/bank-club-notification-smoke";
const defaultPassword = "admin123";
const legacyDefaultPassword = "BankClub2026!";

function fail(message) {
  const error = new Error(message);
  error.name = "NotificationSmokeError";
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

function sameOriginHeaders(cookie = "", ip = "127.0.0.167") {
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
    process.env.NOTIFICATION_SMOKE_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    defaultPassword,
    legacyDefaultPassword,
  ].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);

  let loginResult = null;
  for (const password of passwordCandidates) {
    const result = await fetchJson("/api/admin/login", {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", "127.0.0.166"),
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: admin.email, password }),
    });
    loginResult = result;
    if (result.response.ok) break;
  }
  if (!loginResult?.response.ok) {
    fail(`admin login failed HTTP ${loginResult?.response.status}: ${loginResult?.json.message || "unknown error"}. Set NOTIFICATION_SMOKE_ADMIN_PASSWORD to the current local admin password.`);
  }
  const cookie = cookieFromSetCookie(loginResult.response.headers);
  if (!cookie) fail("admin login did not return bank_club_session cookie");
  if (loginResult.json.user?.role !== "super_admin") fail(`admin login returned unexpected role: ${loginResult.json.user?.role}`);
  return { cookie, admin };
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function startWebhook() {
  const expected = new URL(webhookUrl);
  const received = [];
  let failNext = false;
  const server = createServer(async (request, response) => {
    if (request.method !== "POST" || request.url?.split("?")[0] !== expected.pathname) {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: false, message: "not found" }));
      return;
    }

    const rawBody = await readRequestBody(request);
    let payload = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { rawBody };
    }
    const status = failNext ? 500 : 200;
    failNext = false;
    received.push({
      status,
      payload,
      createdAt: new Date().toISOString(),
    });
    response.writeHead(status, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: status < 400 }));
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(Number(expected.port || 80), expected.hostname, resolve);
  });

  return {
    received,
    failNext() {
      failNext = true;
    },
    close() {
      return new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

async function waitForWebhook(webhook, predicate, description) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    const found = webhook.received.find((item) => predicate(item.payload, item));
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail(`timed out waiting for webhook payload: ${description}. Start Next with NOTIFY_WEBHOOK_URL=${webhookUrl}`);
}

async function submitLead(overrides = {}) {
  const form = new FormData();
  const appointment = new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const sessionId = overrides.sessionId || `notification-smoke-${Date.now()}`;
  form.set("website", "");
  form.set("name", overrides.name || "通知閉環煙測使用者");
  form.set("phone", overrides.phone || "0955 456 789");
  form.set("lineId", overrides.lineId || "notificationSmokeLine");
  form.set("identityType", "employee");
  form.set("loanType", "credit");
  form.set("desiredAmount", "500000");
  form.set("appointmentTime", appointment);
  form.set("purpose", "daily");
  form.set("note", "通知煙測：確認新線索通知 Webhook 和後台重送。");
  form.set("consent", "on");
  form.set("sourcePage", "/consultation");
  form.set("sourceChannel", "seo");
  form.set("utmSource", "google");
  form.set("utmMedium", "organic");
  form.set("utmCampaign", "notification-smoke");
  form.set("utmContent", "api");
  form.set("utmTerm", "通知煙測");
  form.set("seoKeyword", "通知煙測");
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
  const webhook = await startWebhook();

  try {
    const { cookie } = await adminLogin(originalDB);
    const headers = { ...sameOriginHeaders(cookie), "content-type": "application/json" };

    const testNotification = await fetchJson("/api/admin/notifications/test", {
      method: "POST",
      headers,
    });
    if (!testNotification.response.ok || testNotification.json.status !== "sent") {
      fail(`admin notification test failed HTTP ${testNotification.response.status}: ${testNotification.json.status || testNotification.json.message || ""}. Start Next with NOTIFY_WEBHOOK_URL=${webhookUrl}`);
    }
    const testPayload = await waitForWebhook(webhook, (payload) => payload.event === "notification_test", "admin notification test");
    if (!testPayload.payload.actor?.email || !testPayload.payload.specialist?.mobile) {
      fail("notification_test payload missing actor or specialist fields");
    }

    const { leadId, sessionId } = await submitLead();
    const leadPayload = await waitForWebhook(webhook, (payload) => payload.event === "lead_created" && payload.lead?.id === leadId, "new lead notification");
    if (leadPayload.payload.lead?.utmTerm !== "通知煙測" || leadPayload.payload.lead?.sourceChannel !== "seo") {
      fail("lead notification payload missing source tracking fields");
    }
    if (!String(leadPayload.payload.lead?.adminUrl || "").includes(`/admin?lead_id=${encodeURIComponent(leadId)}`)) {
      fail(`lead notification payload missing admin lead URL: ${leadPayload.payload.lead?.adminUrl || "missing"}`);
    }

    webhook.failNext();
    const failedLead = await submitLead({
      name: "通知批量重送煙測使用者",
      phone: "0955 456 790",
      lineId: "notificationBatchRetryLine",
      sessionId: `notification-batch-retry-${Date.now()}`,
    });
    const failedLeadPayload = await waitForWebhook(
      webhook,
      (payload, item) => payload.event === "lead_created" && payload.lead?.id === failedLead.leadId && item.status === 500,
      "failed lead notification before batch retry",
    );
    if (!failedLeadPayload.payload.lead?.adminUrl) fail("failed lead notification payload missing admin URL before retry");

    const failedLeadDetail = await fetchJson(`/api/admin/leads/${failedLead.leadId}`, { headers });
    if (
      !failedLeadDetail.response.ok ||
      failedLeadDetail.json.lead?.notificationStatus !== "failed" ||
      failedLeadDetail.json.lead?.notificationAttempts !== 1
    ) {
      fail(`failed lead notification status was not persisted before batch retry HTTP ${failedLeadDetail.response.status}`);
    }

    const batchRetry = await fetchJson("/api/admin/notifications/retry", {
      method: "POST",
      headers,
    });
    if (
      !batchRetry.response.ok ||
      batchRetry.json.processed < 1 ||
      batchRetry.json.sent < 1 ||
      !batchRetry.json.results?.some((item) => item.leadId === failedLead.leadId && item.status === "sent")
    ) {
      fail(`batch notification retry did not resend failed lead HTTP ${batchRetry.response.status}: ${JSON.stringify(batchRetry.json)}`);
    }
    await waitForWebhook(
      webhook,
      (payload, item) => payload.event === "lead_created" && payload.lead?.id === failedLead.leadId && item.status === 200,
      "batch retried lead notification",
    );
    const retriedLeadDetail = await fetchJson(`/api/admin/leads/${failedLead.leadId}`, { headers });
    if (
      !retriedLeadDetail.response.ok ||
      retriedLeadDetail.json.lead?.notificationStatus !== "sent" ||
      retriedLeadDetail.json.lead?.notificationAttempts !== 2 ||
      !retriedLeadDetail.json.lead?.notifiedAt
    ) {
      fail(`batch retried lead status was not persisted HTTP ${retriedLeadDetail.response.status}`);
    }

    const detail = await fetchJson(`/api/admin/leads/${leadId}`, { headers });
    if (!detail.response.ok) fail(`lead detail failed HTTP ${detail.response.status}`);
    if (detail.json.lead?.notificationStatus !== "sent" || detail.json.lead?.notificationAttempts !== 1 || !detail.json.lead?.notifiedAt) {
      fail("lead notification status was not persisted after initial webhook delivery");
    }

    const resend = await fetchJson(`/api/admin/leads/${leadId}/notify`, {
      method: "POST",
      headers,
    });
    if (!resend.response.ok || resend.json.lead?.notificationStatus !== "sent" || resend.json.lead?.notificationAttempts !== 2) {
      fail(`lead notification resend failed HTTP ${resend.response.status}: ${resend.json.message || resend.json.lead?.notificationStatus || ""}`);
    }
    await waitForWebhook(webhook, (payload, item) => payload.event === "lead_created" && payload.lead?.id === leadId && item !== leadPayload, "lead notification resend");

    const privacyPatch = await fetchJson(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        doNotContact: true,
        deletionRequested: true,
        privacyRequestNote: "通知煙測：使用者要求停止聯繫與刪除/停止利用，後續通知應被阻擋。",
      }),
    });
    if (!privacyPatch.response.ok || !privacyPatch.json.lead?.doNotContact || !privacyPatch.json.lead?.deletionRequested) {
      fail(`privacy request patch failed HTTP ${privacyPatch.response.status}: ${privacyPatch.json.message || ""}`);
    }
    const receivedBeforeBlockedNotify = webhook.received.length;
    const blockedResend = await fetchJson(`/api/admin/leads/${leadId}/notify`, {
      method: "POST",
      headers,
    });
    if (
      blockedResend.response.status !== 409 ||
      !String(blockedResend.json.message || "").includes("停止聯繫") ||
      blockedResend.json.lead?.notificationAttempts !== 2 ||
      !String(blockedResend.json.lead?.notificationError || "").includes("停止聯繫")
    ) {
      fail(`privacy-blocked notification resend returned unexpected response HTTP ${blockedResend.response.status}: ${blockedResend.json.message || ""}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (webhook.received.length !== receivedBeforeBlockedNotify) {
      fail("privacy-blocked notification resend should not call webhook");
    }

    webhook.failNext();
    const failedTest = await fetchJson("/api/admin/notifications/test", {
      method: "POST",
      headers,
    });
    if (failedTest.response.status !== 502 || failedTest.json.status !== "failed" || !String(failedTest.json.error || "").includes("Webhook HTTP 500")) {
      fail(`failed webhook path returned unexpected response HTTP ${failedTest.response.status}: ${failedTest.json.status || failedTest.json.message || ""}`);
    }

    const db = await readDbJson(dbPath);
    const auditActions = db.auditLogs.map((log) => log.action);
    for (const action of ["notification_test_sent", "lead_notification_sent", "lead_notification_batch_sent", "lead_notification_resent", "lead_notification_blocked_privacy", "notification_test_failed"]) {
      if (!auditActions.includes(action)) fail(`missing audit action ${action}`);
    }
    const storedLead = db.leads.find((lead) => lead.id === leadId);
    if (!storedLead || storedLead.sessionId !== sessionId) fail("stored lead missing after notification smoke submit");

    console.log(JSON.stringify({
      webhookUrl,
      leadId,
      sessionId,
      adminUrl: leadPayload.payload.lead.adminUrl,
      notificationStatus: storedLead.notificationStatus,
      notificationAttempts: storedLead.notificationAttempts,
      batchRetry: {
        leadId: failedLead.leadId,
        processed: batchRetry.json.processed,
        sent: batchRetry.json.sent,
      },
      privacyBlockedResendStatus: blockedResend.response.status,
      receivedEvents: webhook.received.map((item) => `${item.payload.event}:${item.status}`),
      auditedActions: auditActions.filter((action) => action.includes("notification")),
    }, null, 2));
  } finally {
    await webhook.close();
    if (backup !== null) {
      await writeDbSnapshot(backup, { dbPath, label: "notification-smoke" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
