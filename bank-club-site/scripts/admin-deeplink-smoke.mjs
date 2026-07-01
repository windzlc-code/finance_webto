import path from "node:path";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { chromium } from "@playwright/test";
import { readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const temporarySmokePassword = process.env.ADMIN_DEEPLINK_SMOKE_TEMP_PASSWORD || "BankClubDeepLinkSmoke2026!";
const passwordIterations = 310_000;

function fail(message) {
  const error = new Error(message);
  error.name = "AdminDeepLinkSmokeError";
  throw error;
}

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, passwordIterations, 32, "sha256").toString("base64url");
  return `pbkdf2$sha256$${passwordIterations}$${salt}$${hash}`;
}

function futureDatetimeLocal(hoursFromNow = 48) {
  const date = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function submitSeedLead(runId) {
  const form = new FormData();
  const fields = {
    name: `後台深鏈煙測線索 ${runId}`,
    phone: `0981 ${String(runId).slice(-3)} ${String(Math.floor(Math.random() * 900) + 100)}`,
    lineId: `adminDeepLink${String(runId).slice(-6)}`,
    identityType: "employee",
    loanType: "credit",
    desiredAmount: "280000",
    appointmentTime: futureDatetimeLocal(),
    purpose: "debt_consolidation",
    note: "後台深鏈 smoke 建立的臨時線索，用於驗證通知連結可直達線索詳情。",
    sourcePage: "/admin-deeplink-smoke",
    sourceChannel: "admin-deeplink-smoke",
    sessionId: `admin-deeplink-smoke-${runId}`,
    consent: "on",
  };
  Object.entries(fields).forEach(([key, value]) => form.set(key, value));
  const response = await fetch(`${baseUrl}/api/leads`, {
    method: "POST",
    headers: {
      origin: baseUrl,
      referer: `${baseUrl}/consultation`,
      "x-forwarded-for": `127.10.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`,
      "user-agent": "BankClubAdminDeepLinkSmoke/1.0",
    },
    body: form,
  });
  const json = await parseJson(response);
  if (!response.ok || !json.leadId) {
    fail(`seed lead creation failed HTTP ${response.status}: ${json.message || "missing leadId"}`);
  }
  return { ...fields, leadId: json.leadId };
}

async function loginThroughUi(page) {
  await page.getByPlaceholder("後台密碼").fill(temporarySmokePassword);
  const loginResponsePromise = page.waitForResponse((response) => (
    response.url().endsWith("/api/admin/login") &&
    response.request().method() === "POST"
  ));
  await page.locator("main.admin-login form").evaluate((form) => {
    if (!(form instanceof HTMLFormElement)) throw new Error("admin login form missing");
    form.requestSubmit();
  });
  const loginResponse = await loginResponsePromise;
  const json = await parseJson(loginResponse);
  if (!loginResponse.ok) {
    fail(`admin UI login failed HTTP ${loginResponse.status()}: ${json.message || "unknown error"}`);
  }
  await page.locator(".admin-shell").waitFor({ state: "visible", timeout: 10000 });
}

async function run() {
  const backup = await readDbSnapshot(dbPath);
  let browser;

  try {
    const db = JSON.parse(backup);
    const admin = db.users.find((user) => user.role === "super_admin") || db.users[0];
    if (!admin) fail("admin deep link smoke could not find an admin user");
    admin.passwordHash = hashPassword(temporarySmokePassword);
    admin.twoFactorEnabled = false;
    admin.twoFactorSecret = "";
    admin.twoFactorConfirmedAt = "";
    await writeDbSnapshot(JSON.stringify(db, null, 2), { dbPath, label: "admin-deeplink-smoke" });

    const runId = Date.now();
    const seedLead = await submitSeedLead(runId);

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const browserIssues = [];
    page.on("pageerror", (error) => browserIssues.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      const expectedLocalResourceStatus = /^Failed to load resource: the server responded with a status of (401 \(Unauthorized\)|503 \(Service Unavailable\))$/.test(message.text());
      if (message.type() === "error" && !expectedLocalResourceStatus) {
        browserIssues.push(`console error: ${message.text()}`);
      }
    });

    await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
    await loginThroughUi(page);

    const leadDetailResponsePromise = page.waitForResponse((response) => (
      response.url().includes(`/api/admin/leads/${seedLead.leadId}`) &&
      response.request().method() === "GET"
    ));
    await page.goto(`${baseUrl}/admin?lead_id=${encodeURIComponent(seedLead.leadId)}`, { waitUntil: "networkidle" });
    const leadDetailResponse = await leadDetailResponsePromise;
    if (!leadDetailResponse.ok()) {
      fail(`admin lead deep link failed HTTP ${leadDetailResponse.status()}`);
    }

    const detailPanel = page.locator(".admin-panel").filter({ has: page.getByRole("heading", { name: "線索詳情" }) });
    await detailPanel.getByText(seedLead.name, { exact: false }).waitFor({ state: "visible", timeout: 12000 });
    await detailPanel.getByText(`LINE ID：${seedLead.lineId}`, { exact: false }).waitFor({ state: "visible", timeout: 12000 });

    if (browserIssues.length) fail(`browser errors detected:\n${browserIssues.join("\n")}`);

    console.log(JSON.stringify({
      status: "ok",
      leadId: seedLead.leadId,
      adminUrl: `${baseUrl}/admin?lead_id=${encodeURIComponent(seedLead.leadId)}`,
    }, null, 2));
  } finally {
    await browser?.close().catch(() => undefined);
    await writeDbSnapshot(backup, { dbPath, label: "admin-deeplink-smoke" });
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
