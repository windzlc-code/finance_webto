import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import { chromium } from "@playwright/test";
import { mutateDbJson, readDbJson, readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const keepData = process.env.ADMIN_UI_SMOKE_KEEP_DATA === "1";
const screenshotDir = process.env.ADMIN_UI_SMOKE_SCREENSHOT_DIR || path.join("/tmp", "bank-club-admin-ui-smoke");
const defaultPassword = "admin123";
const legacyDefaultPassword = "BankClub2026!";
const temporarySmokePassword = process.env.ADMIN_UI_SMOKE_TEMP_PASSWORD || "BankClubUiSmoke2026!";
const passwordIterations = 310_000;
const totpAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const totpStepMs = 30_000;

function fail(message, details = []) {
  const error = new Error([message, ...details].filter(Boolean).join("\n"));
  error.name = "AdminUiSmokeError";
  throw error;
}

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

async function readDb() {
  return readDbJson(dbPath);
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, passwordIterations, 32, "sha256").toString("base64url");
  return `pbkdf2$sha256$${passwordIterations}$${salt}$${hash}`;
}

function decodeBase32(secret) {
  const normalized = secret.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  let bits = "";
  for (const char of normalized) {
    const value = totpAlphabet.indexOf(char);
    if (value === -1) fail(`invalid TOTP secret character: ${char}`);
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

function counterBuffer(counter) {
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter >>> 0, 4);
  return buffer;
}

function generateTotp(secret, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / totpStepMs);
  const hmac = createHmac("sha1", decodeBase32(secret)).update(counterBuffer(counter)).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 10 ** 6).padStart(6, "0");
}

async function freshTotp(secret) {
  const remainingMs = totpStepMs - (Date.now() % totpStepMs);
  if (remainingMs < 5000) {
    await new Promise((resolve) => setTimeout(resolve, remainingMs + 300));
  }
  return generateTotp(secret);
}

async function prepareTemporaryAdminPassword() {
  const originalAdminSecurity = await mutateDbJson((db) => {
    const admin = db.users.find((user) => user.role === "super_admin") || db.users[0];
    if (!admin) fail("admin UI smoke could not find a backend user to log in");
    const snapshot = {
      id: admin.id,
      passwordHash: admin.passwordHash,
      twoFactorEnabled: admin.twoFactorEnabled,
      twoFactorSecret: admin.twoFactorSecret,
      twoFactorConfirmedAt: admin.twoFactorConfirmedAt,
    };
    admin.passwordHash = hashPassword(temporarySmokePassword);
    admin.twoFactorEnabled = false;
    admin.twoFactorSecret = "";
    admin.twoFactorConfirmedAt = "";
    return snapshot;
  }, { dbPath, label: "admin-ui-smoke" });
  return { password: temporarySmokePassword, originalAdminSecurity };
}

async function restoreAdminSecurity(originalAdminSecurity) {
  if (!originalAdminSecurity) return;
  await mutateDbJson((db) => {
    const admin = db.users.find((user) => user.id === originalAdminSecurity.id);
    if (!admin) return;
    admin.passwordHash = originalAdminSecurity.passwordHash;
    admin.twoFactorEnabled = originalAdminSecurity.twoFactorEnabled;
    admin.twoFactorSecret = originalAdminSecurity.twoFactorSecret;
    admin.twoFactorConfirmedAt = originalAdminSecurity.twoFactorConfirmedAt;
  }, { dbPath, label: "admin-ui-smoke" });
}

function futureDatetimeLocal(hoursFromNow = 48) {
  const date = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function tinyPngFile(name) {
  const pngBytes = Uint8Array.from([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
    0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
    0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 248, 15, 4, 0, 9,
    251, 3, 253, 167, 80, 188, 204, 0, 0, 0, 0, 73, 69, 78, 68,
    174, 66, 96, 130,
  ]);
  return new File([pngBytes], name, { type: "image/png" });
}

async function submitSeedLead(runId) {
  const form = new FormData();
  const fields = {
    name: `後台 UI 煙測線索 ${runId}`,
    phone: `0977 ${String(runId).slice(-3)} ${String(Math.floor(Math.random() * 900) + 100)}`,
    lineId: `adminUiSmoke${String(runId).slice(-6)}`,
    identityType: "employee",
    loanType: "credit",
    desiredAmount: "360000",
    appointmentTime: futureDatetimeLocal(),
    purpose: "debt_consolidation",
    note: "後台 UI smoke 建立的臨時線索，用於驗證列表、詳情、狀態更新與備註。",
    sourcePage: "/admin-ui-smoke",
    sourceChannel: "admin-ui-smoke",
    utmSource: "playwright",
    utmMedium: "ui-smoke",
    utmCampaign: "admin-ui",
    utmContent: "dashboard",
    utmTerm: "後台管理煙測",
    seoKeyword: "後台管理測試",
    sessionId: `admin-ui-smoke-${runId}`,
    consent: "on",
  };
  Object.entries(fields).forEach(([key, value]) => form.set(key, value));
  form.set("requestedAmount", "7000000");
  form.set("requestedTermYears", "10");
  form.set("caseSource", "company_preferential");
  form.set("programType", "binding");
  form.set("idFront", tinyPngFile(`admin-ui-id-front-${runId}.png`));
  form.set("idBack", tinyPngFile(`admin-ui-id-back-${runId}.png`));
  const response = await fetch(`${baseUrl}/api/leads`, {
    method: "POST",
    headers: {
      origin: baseUrl,
      referer: `${baseUrl}/consultation`,
      "x-forwarded-for": `127.0.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`,
      "user-agent": "BankClubAdminUiSmoke/1.0",
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
  const passwordCandidates = [
    process.env.ADMIN_UI_SMOKE_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    temporarySmokePassword,
    defaultPassword,
    legacyDefaultPassword,
  ].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);

  let lastError = "";
  for (const password of passwordCandidates) {
    if (await page.locator(".admin-shell").isVisible({ timeout: 500 }).catch(() => false)) return;
    const passwordInput = page.getByPlaceholder("後台密碼");
    await passwordInput.waitFor({ state: "visible", timeout: 8000 });
    await passwordInput.fill(password);
    const loginResponsePromise = page.waitForResponse((response) => (
      response.url().endsWith("/api/admin/login") &&
      response.request().method() === "POST"
    ));
    await page.locator("main.admin-login form").evaluate((form) => {
      if (!(form instanceof HTMLFormElement)) throw new Error("admin login form missing");
      form.requestSubmit();
    });
    const loginResponse = await loginResponsePromise;
    const loginJson = await loginResponse.json().catch(() => ({}));
    if (loginResponse.ok()) {
      await Promise.all([
        page.waitForResponse((response) => response.url().includes("/api/admin/summary") && response.request().method() === "GET", { timeout: 12000 }).catch(() => null),
        page.waitForResponse((response) => response.url().includes("/api/admin/leads") && response.request().method() === "GET", { timeout: 12000 }).catch(() => null),
      ]);
    }
    await page.waitForLoadState("networkidle").catch(() => undefined);
    if (await page.locator(".admin-shell").isVisible({ timeout: 12000 }).catch(() => false)) {
      return;
    }
    lastError = `${loginJson.message || await page.locator(".form-error").textContent().catch(() => "登入後未看到後台管理系統")}｜loginBody=${loginResponse.request().postData() || ""}`;
  }
  fail(`admin UI login failed. ${lastError || "Set ADMIN_UI_SMOKE_ADMIN_PASSWORD to the current local admin password."}`);
}

async function clickTab(page, buttonName, headingName) {
  await page.getByRole("button", { name: buttonName }).click();
  await page.getByRole("heading", { name: headingName }).waitFor({ state: "visible", timeout: 8000 });
}

async function assertNoFrameworkOverlay(page) {
  const overlayText = /Unhandled Runtime Error|Application error|Next\.js|webpack|Vite Error/i;
  if (await page.locator("body").getByText(overlayText).isVisible({ timeout: 500 }).catch(() => false)) {
    fail("framework error overlay detected on admin UI");
  }
}

async function waitForDb(predicate, description) {
  const deadline = Date.now() + 20000;
  let lastDb = null;
  while (Date.now() < deadline) {
    const db = await readDb();
    lastDb = db;
    if (predicate(db)) return db;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail(`timed out waiting for database state: ${description}`, [
    lastDb ? JSON.stringify({
      settings: lastDb.settings,
      auditActions: lastDb.auditLogs?.map((log) => `${log.action}:${log.targetType}:${log.targetId}`).slice(0, 20),
      users: lastDb.users?.map((user) => ({
        id: user.id,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        hasTwoFactorSecret: Boolean(user.twoFactorSecret),
      })),
      leads: lastDb.leads?.length,
      events: lastDb.events?.length,
    }, null, 2) : "no database snapshot available",
  ]);
}

async function fetchAdminJson(page, pathname) {
  return page.evaluate(async (targetPath) => {
    const response = await fetch(targetPath, { cache: "no-store" });
    const json = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, json };
  }, pathname);
}

async function waitForAdminJson(page, pathname, predicate, description, summarize = (json) => json) {
  const deadline = Date.now() + 20000;
  let lastResult = null;
  while (Date.now() < deadline) {
    const result = await fetchAdminJson(page, pathname);
    lastResult = result;
    if (result.ok && predicate(result.json)) return result.json;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail(`timed out waiting for admin API state: ${description}`, [
    lastResult ? JSON.stringify({
      status: lastResult.status,
      snapshot: summarize(lastResult.json),
    }, null, 2) : "no API snapshot available",
  ]);
}

function withSmokePoll(url, attempt) {
  const parsed = new URL(url);
  parsed.searchParams.set("settings_smoke_poll", String(attempt));
  parsed.searchParams.set("settings_smoke_ts", String(Date.now()));
  return parsed.toString();
}

async function waitForPageTexts(page, url, headingName, expectedTexts, description) {
  const deadline = Date.now() + 20000;
  let lastText = "";
  let attempt = 0;
  while (Date.now() < deadline) {
    const targetUrl = withSmokePoll(url, attempt);
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: headingName }).waitFor({ state: "visible", timeout: 8000 });
    lastText = await page.locator("body").innerText();
    const missing = expectedTexts.filter((text) => !lastText.includes(text));
    if (!missing.length) return lastText;
    attempt += 1;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail(`${description} did not reflect updated site settings`, [
    `missing: ${expectedTexts.filter((text) => !lastText.includes(text)).join(", ") || "unknown"}`,
  ]);
}

async function waitForAuditActions(page, expectedActions, description) {
  return waitForAdminJson(
    page,
    "/api/admin/audit-logs",
    (json) => expectedActions.every((action) => json.auditLogs?.some((log) => log.action === action.name && (!action.targetId || log.targetId === action.targetId))),
    description,
    (json) => ({
      auditActions: json.auditLogs?.map((log) => `${log.action}:${log.targetType}:${log.targetId}`).slice(0, 20),
    }),
  );
}

async function run() {
  const backup = keepData ? null : await readDbSnapshot(dbPath);
  const runId = Date.now();
    const screenshots = {
      login: path.join(screenshotDir, "login.png"),
      dashboard: path.join(screenshotDir, "dashboard.png"),
      leadDetail: path.join(screenshotDir, "lead-detail.png"),
      articles: path.join(screenshotDir, "articles.png"),
      files: path.join(screenshotDir, "files.png"),
      stats: path.join(screenshotDir, "stats.png"),
      settings: path.join(screenshotDir, "settings.png"),
      settingsUpdated: path.join(screenshotDir, "settings-updated.png"),
    contactSettings: path.join(screenshotDir, "contact-settings.png"),
    successSettings: path.join(screenshotDir, "success-settings.png"),
    twoFactor: path.join(screenshotDir, "two-factor.png"),
    launch: path.join(screenshotDir, "launch-checklist.png"),
  };
  let browser = null;
  let originalAdminSecurity = null;

  try {
    await mkdir(screenshotDir, { recursive: true });
    const preparedAdmin = await prepareTemporaryAdminPassword();
    originalAdminSecurity = preparedAdmin.originalAdminSecurity;
    const seedLead = await submitSeedLead(runId);
    const noteBody = `後台 UI smoke 跟進備註 ${runId}`;
    const uploadedFileTitle = `後台 UI 上傳文件 ${runId}`;
    const uploadedFileName = `admin-ui-upload-${runId}.md`;
    let uploadedFileId = "";

    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1200 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    const browserIssues = [];
    page.on("pageerror", (error) => browserIssues.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      const text = message.text();
      const expectedLocalResourceStatus = /^Failed to load resource: the server responded with a status of (401 \(Unauthorized\)|503 \(Service Unavailable\))$/.test(text);
      if (message.type() === "error" && !expectedLocalResourceStatus) browserIssues.push(`console error: ${text}`);
    });

    await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
    const title = await page.title();
    if (!page.url().startsWith(`${baseUrl}/admin`)) fail(`admin page identity mismatch: ${page.url()}`);
    if (!(await page.getByRole("heading", { name: "銀行俱樂部後台" }).isVisible())) {
      fail("admin login screen did not render");
    }
    const loginLogo = page.locator("main.admin-login img[alt='國泰人壽綠色樹形 Logo']");
    if ((await loginLogo.count()) !== 1) {
      fail("admin login screen should render the brand logo from the plan asset");
    }
    const loginLogoBox = await loginLogo.boundingBox();
    if (!loginLogoBox || loginLogoBox.width < 70 || loginLogoBox.height < 44) {
      fail(`admin login brand logo rendered at an unexpected size: ${loginLogoBox ? `${Math.round(loginLogoBox.width)}x${Math.round(loginLogoBox.height)}` : "missing box"}`);
    }
    if (!(await page.getByText("線索、內容、文件與上線檢查管理入口").isVisible())) {
      fail("admin login screen missing independent admin management descriptor");
    }
    await assertNoFrameworkOverlay(page);
    await page.screenshot({ path: screenshots.login, fullPage: true });

    await loginThroughUi(page);
    await page.getByText("總線索").waitFor({ state: "visible", timeout: 10000 });
    for (const label of ["總線索", "新線索", "文章", "文件", "線索列表", "線索詳情"]) {
      if (!(await page.getByText(label).first().isVisible())) fail(`dashboard missing label: ${label}`);
    }
    await assertNoFrameworkOverlay(page);
    await page.screenshot({ path: screenshots.dashboard, fullPage: true });

    await waitForAdminJson(
      page,
      `/api/admin/leads?q=${encodeURIComponent(seedLead.name)}`,
      (json) => json.leads?.some((lead) => lead.id === seedLead.leadId),
      "seed lead is queryable before opening detail",
      (json) => ({ leads: json.leads?.slice(0, 5).map((lead) => ({ id: lead.id, name: lead.name })) }),
    );
    const leadRow = page.locator(".lead-row").filter({ hasText: seedLead.name });
    if (!(await leadRow.isVisible({ timeout: 3000 }).catch(() => false))) {
      const filterForm = page.locator(".filter-form");
      await filterForm.locator('input[name="q"]').fill(seedLead.name);
      await Promise.all([
        page.waitForResponse((response) => response.url().includes("/api/admin/leads?") && response.request().method() === "GET"),
        filterForm.getByRole("button", { name: "套用篩選" }).click(),
      ]);
    }
    await leadRow.waitFor({ state: "visible", timeout: 8000 });
    const leadRowText = await leadRow.innerText();
    if (leadRowText.includes(seedLead.phone) || leadRowText.includes(seedLead.lineId)) {
      fail("admin lead list row exposed full phone or LINE ID before opening detail view");
    }
    const leadDetailResponse = page.waitForResponse((response) => (
      response.url().includes(`/api/admin/leads/${seedLead.leadId}`) &&
      response.request().method() === "GET"
    ));
    await leadRow.click();
    const openedLeadResponse = await leadDetailResponse;
    if (!openedLeadResponse.ok()) fail(`lead detail UI open failed HTTP ${openedLeadResponse.status()}`);
    const leadDetailPanel = page.locator(".admin-panel").filter({ has: page.getByRole("heading", { name: "線索詳情" }) });
    await leadDetailPanel.getByText(seedLead.name, { exact: false }).waitFor({ state: "visible", timeout: 12000 });
    await leadDetailPanel.getByText(`LINE ID：${seedLead.lineId}`, { exact: false }).waitFor({ state: "visible", timeout: 12000 });

    const deepLinkLeadResponse = page.waitForResponse((response) => (
      response.url().includes(`/api/admin/leads/${seedLead.leadId}`) &&
      response.request().method() === "GET"
    ));
    await page.goto(`${baseUrl}/admin?lead_id=${encodeURIComponent(seedLead.leadId)}`, { waitUntil: "networkidle" });
    const deepLinkResponse = await deepLinkLeadResponse;
    if (!deepLinkResponse.ok()) fail(`admin lead deep link failed HTTP ${deepLinkResponse.status()}`);
    const deepLinkedLeadDetailPanel = page.locator(".admin-panel").filter({ has: page.getByRole("heading", { name: "線索詳情" }) });
    await deepLinkedLeadDetailPanel.getByText(seedLead.name, { exact: false }).waitFor({ state: "visible", timeout: 12000 });
    await deepLinkedLeadDetailPanel.getByText(`LINE ID：${seedLead.lineId}`, { exact: false }).waitFor({ state: "visible", timeout: 12000 });
    const statusPatch = page.waitForResponse((response) => (
      response.url().includes(`/api/admin/leads/${seedLead.leadId}`) &&
      response.request().method() === "PATCH"
    ));
    await page.locator(".detail-controls label").filter({ hasText: "案件狀態" }).locator("select").selectOption("contacted");
    const statusResponse = await statusPatch;
    if (!statusResponse.ok()) fail(`lead status UI update failed HTTP ${statusResponse.status()}`);
    const statusJson = await statusResponse.json().catch(() => ({}));
    if (!statusJson.lead?.lastFollowUpAt || Number.isNaN(Date.parse(statusJson.lead.lastFollowUpAt))) {
      fail("lead status UI update did not return refreshed lastFollowUpAt");
    }
    await waitForAdminJson(
      page,
      `/api/admin/leads/${seedLead.leadId}`,
      (json) => json.lead?.status === "contacted" && Boolean(json.lead?.lastFollowUpAt),
      "lead detail API reflects contacted status and refreshed lastFollowUpAt",
      (json) => ({ status: json.lead?.status, lastFollowUpAt: json.lead?.lastFollowUpAt }),
    );

    const stableLeadResponse = page.waitForResponse((response) => (
      response.url().includes(`/api/admin/leads/${seedLead.leadId}`) &&
      response.request().method() === "GET"
    ));
    await page.goto(`${baseUrl}/admin?lead_id=${encodeURIComponent(seedLead.leadId)}`, { waitUntil: "networkidle" });
    const stableLeadDetail = await stableLeadResponse;
    if (!stableLeadDetail.ok()) fail(`stable lead detail reload failed HTTP ${stableLeadDetail.status()}`);
    await page.locator(".admin-panel").filter({ has: page.getByRole("heading", { name: "線索詳情" }) })
      .getByText(seedLead.name, { exact: false })
      .waitFor({ state: "visible", timeout: 12000 });

    const noteRequest = page.waitForResponse((response) => (
      response.url().endsWith("/api/admin/notes") &&
      response.request().method() === "POST"
    ));
    const noteRefresh = page.waitForResponse((response) => (
      response.url().includes(`/api/admin/leads/${seedLead.leadId}`) &&
      response.request().method() === "GET"
    )).catch(() => null);
    await page.locator('textarea[name="body"]').fill(noteBody);
    await page.getByRole("button", { name: "新增備註" }).click();
    const noteResponse = await noteRequest;
    if (!noteResponse.ok()) {
      const noteErrorText = await noteResponse.text().catch(() => "");
      fail(`lead note UI create failed HTTP ${noteResponse.status()}`, [
        `request=${noteResponse.request().postData() || ""}`,
        `response=${noteErrorText}`,
      ]);
    }
    const noteJson = await noteResponse.json().catch(() => ({}));
    if (!noteJson.note?.id) fail("lead note UI create did not return note id");
    await noteRefresh;
    let noteRendered = await page.getByText(noteBody).isVisible({ timeout: 8000 }).catch(() => false);
    if (!noteRendered) {
      const reopenLeadResponse = page.waitForResponse((response) => (
        response.url().includes(`/api/admin/leads/${seedLead.leadId}`) &&
        response.request().method() === "GET"
      ));
      await page.locator(".lead-row").filter({ hasText: seedLead.name }).click();
      const reopenedLead = await reopenLeadResponse;
      if (!reopenedLead.ok()) fail(`lead detail UI reopen after note failed HTTP ${reopenedLead.status()}`);
      noteRendered = await page.getByText(noteBody).isVisible({ timeout: 12000 }).catch(() => false);
    }
    if (!noteRendered) {
      fail("lead note was saved but did not render in admin lead detail UI after refresh");
    }
    await page.screenshot({ path: screenshots.leadDetail, fullPage: true });

    await clickTab(page, "文章管理", "文章管理");
    if (!(await page.getByText("文章分類").isVisible())) fail("article management category panel missing");
    if (!(await page.getByText("FB：").first().isVisible())) fail("article management should display FB post status");
    const queuePatchResponse = page.waitForResponse((response) => (
      response.url().includes("/api/admin/articles/") &&
      response.request().method() === "PATCH"
    ));
    await page.getByRole("button", { name: "複製待發布 FB 隊列" }).click();
    const firstQueuePatch = await queuePatchResponse;
    if (!firstQueuePatch.ok()) fail(`FB queue article update failed HTTP ${firstQueuePatch.status()}`);
    await page.getByText(/已複製 \d+ 篇 FB 待發布草稿/).waitFor({ state: "visible", timeout: 12000 });
    const copiedFbQueue = await page.evaluate(() => navigator.clipboard.readText());
    for (const expectedText of ["【1/", "---", "提醒：", "/blog/", "utm_source=facebook", "utm_medium=group_post", "延伸閱讀："]) {
      if (!copiedFbQueue.includes(expectedText)) fail(`copied FB queue missing "${expectedText}"`);
    }
    const articlesAfterQueueCopy = await waitForAdminJson(
      page,
      "/api/admin/articles",
      (json) => json.articles?.some((article) => article.fbPostStatus === "copied"),
      "article API reflects FB copied draft queue",
      (json) => ({ fbStatuses: json.articles?.map((article) => article.fbPostStatus).slice(0, 10) }),
    );
    const copiedQueueArticle = articlesAfterQueueCopy.articles.find((article) => article.status === "published" && article.fbPostStatus === "copied");
    if (!copiedQueueArticle?.slug) fail("FB copied queue did not return a published copied article for posted URL import");
    const importedFbPostUrl = `https://www.facebook.com/groups/bankclub/posts/admin-ui-smoke-${runId}`;
    await page.locator('textarea[name="fbPostImport"]').fill(`${copiedQueueArticle.slug} ${importedFbPostUrl}`);
    const importPatchResponse = page.waitForResponse((response) => (
      response.url().includes(`/api/admin/articles/${copiedQueueArticle.id}`) &&
      response.request().method() === "PATCH"
    ));
    await page.getByRole("button", { name: "匯入已發 FB" }).click();
    const firstImportPatch = await importPatchResponse;
    if (!firstImportPatch.ok()) fail(`FB posted URL import failed HTTP ${firstImportPatch.status()}`);
    await page.getByText("已回填 1 篇 FB 貼文網址").waitFor({ state: "visible", timeout: 8000 });
    await waitForAdminJson(
      page,
      "/api/admin/articles",
      (json) => json.articles?.some((article) =>
        article.id === copiedQueueArticle.id &&
        article.fbPostStatus === "posted" &&
        article.fbPostUrl === importedFbPostUrl &&
        Boolean(article.fbPostedAt),
      ),
      "article API reflects imported FB posted URL",
      (json) => ({ article: json.articles?.find((article) => article.id === copiedQueueArticle.id) }),
    );
    await page.getByRole("button", { name: "複製 FB" }).first().click();
    await page.getByText("FB 貼文已複製").waitFor({ state: "visible", timeout: 8000 });
    const copiedFbPost = await page.evaluate(() => navigator.clipboard.readText());
    for (const expectedText of ["提醒：", "/blog/", "utm_source=facebook", "utm_medium=group_post", "延伸閱讀："]) {
      if (!copiedFbPost.includes(expectedText)) fail(`copied FB post missing "${expectedText}"`);
    }
    await page.screenshot({ path: screenshots.articles, fullPage: true });
    await clickTab(page, "文件資源", "文件資源管理");
    if (!(await page.getByText("新增文件").isVisible())) fail("file management create form missing");
    const createFileForm = page.locator("form.file-form").first();
    await createFileForm.locator('input[name="title"]').fill(uploadedFileTitle);
    await createFileForm.locator('select[name="type"]').selectOption("qa_card");
    await createFileForm.locator('select[name="visibility"]').selectOption("public");
    await createFileForm.locator('textarea[name="description"]').fill("後台 UI smoke 透過檔案 input 匯入的公開 QA 素材。");
    await createFileForm.locator('input[name="sourceFile"]').setInputFiles({
      name: uploadedFileName,
      mimeType: "text/markdown",
      buffer: Buffer.from([
        "後台 UI 上傳文件 v1",
        "此檔案用於驗證後台文件資源可透過真實 file input 匯入公開清單。",
        "不包含身分證、薪轉、銀行流水或其他敏感個資。",
      ].join("\n")),
    });
    const fileCreateResponsePromise = page.waitForResponse((response) => (
      response.url().endsWith("/api/admin/files") &&
      response.request().method() === "POST"
    ));
    await createFileForm.getByRole("button", { name: "新增文件" }).click();
    const fileCreateResponse = await fileCreateResponsePromise;
    const fileCreateJson = await fileCreateResponse.json().catch(() => ({}));
    uploadedFileId = fileCreateJson.file?.id || "";
    if (!fileCreateResponse.ok() || !uploadedFileId) {
      fail(`file upload UI create failed HTTP ${fileCreateResponse.status()}: ${fileCreateJson.message || "missing file id"}`);
    }
    await page.getByText("文件已建立。").waitFor({ state: "visible", timeout: 8000 });
    await waitForAdminJson(
      page,
      "/api/admin/files",
      (json) => json.files?.some((file) =>
        file.id === uploadedFileId &&
        file.title === uploadedFileTitle &&
        file.sourceFilename === uploadedFileName &&
        file.version === 1 &&
        file.visibility === "public",
      ),
      "public file resource uploaded through admin UI",
      (json) => ({
        files: json.files?.slice(0, 5).map((file) => ({
          id: file.id,
          title: file.title,
          sourceFilename: file.sourceFilename,
          visibility: file.visibility,
          version: file.version,
        })),
      }),
    );
    if (!(await page.getByText(uploadedFileTitle).isVisible({ timeout: 3000 }).catch(() => false))) {
      await page.reload({ waitUntil: "networkidle" });
      await page.locator(".admin-shell").waitFor({ state: "visible", timeout: 10000 });
      await clickTab(page, "文件資源", "文件資源管理");
    }
    await page.getByText(uploadedFileTitle).waitFor({ state: "visible", timeout: 8000 });
    await page.getByText(`來源檔：${uploadedFileName}`, { exact: false }).waitFor({ state: "visible", timeout: 8000 });
    await waitForAuditActions(
      page,
      [{ name: "file_created", targetId: uploadedFileId }],
      "public file upload audit log written through admin UI",
    );
    await page.screenshot({ path: screenshots.files, fullPage: true });
    await clickTab(page, "帳號權限", "帳號權限與密碼重設");
    if (!(await page.getByText("角色說明").isVisible())) fail("user role help panel missing");
    const auditRefresh = page.waitForResponse((response) => (
      response.url().endsWith("/api/admin/audit-logs") &&
      response.request().method() === "GET"
    )).catch(() => null);
    await clickTab(page, "操作日誌", "操作日誌");
    await auditRefresh;
    if (!(await page.getByText(/article_updated|file_created|note_created/).first().isVisible())) fail("audit log did not render recent UI actions");

    await clickTab(page, "統計儀表板", "轉化追蹤");
    for (const label of ["頁面瀏覽", "表單提交", "文件下載", "文章諮詢貢獻", "內容營運隊列", "已發布但未完成 FB 導流", "FB 已複製待發布", "SEO 關鍵字來源", "FB / UTM 活動成效", "文件下載排行", "頁面 CTA 點擊排行", "貸款類型 CTA 興趣", "貸款類型轉化率", "營運待辦隊列", "缺少跟進計畫", "通知派送狀態", "未設定通知", "尚未成功通知", "通知送達率", "批量重送未成功通知"]) {
      if (!(await page.getByText(label).first().isVisible())) fail(`statistics panel missing label: ${label}`);
    }
    await waitForAdminJson(
      page,
      "/api/admin/summary",
      (json) => (json.notificationOperations?.notConfigured || 0) >= 1 &&
        (json.notificationOperations?.unsent || 0) >= 1 &&
        typeof json.notificationOperations?.deliveryRate === "number",
      "notification operations counted not-configured lead delivery state",
      (json) => ({ notificationOperations: json.notificationOperations }),
    );
    const batchNotificationResponse = page.waitForResponse((response) => (
      response.url().endsWith("/api/admin/notifications/retry") &&
      response.request().method() === "POST"
    ));
    await page.getByRole("button", { name: "批量重送未成功通知" }).click();
    const batchNotificationResult = await batchNotificationResponse;
    const batchNotificationJson = await batchNotificationResult.json().catch(() => ({}));
    if (!batchNotificationResult.ok() || batchNotificationJson.processed < 1) {
      fail(`batch notification retry UI failed HTTP ${batchNotificationResult.status()}: ${JSON.stringify(batchNotificationJson)}`);
    }
    await page.getByText(/批量通知已處理 \d+ 筆/).waitFor({ state: "visible", timeout: 8000 });
    await page.screenshot({ path: screenshots.stats, fullPage: true });

    await clickTab(page, "站點設定", "站點設定");
    for (const label of ["LINE 連結", "LINE QR Code 圖片", "FB 社團連結", "資料備份", "帳號安全"]) {
      if (!(await page.getByText(label).first().isVisible())) fail(`settings panel missing label: ${label}`);
    }
    await page.screenshot({ path: screenshots.settings, fullPage: true });

    const securityPanel = page.locator(".backup-actions").filter({ hasText: "帳號安全" });
    await securityPanel.getByText("目前狀態：未啟用").waitFor({ state: "visible", timeout: 8000 });
    await securityPanel.getByRole("button", { name: "產生 2FA 密鑰" }).click();
    await page.getByText("已產生二階段驗證密鑰").waitFor({ state: "visible", timeout: 8000 });
    const twoFactorSecret = await securityPanel.locator(".two-factor-setup input").first().inputValue();
    if (!/^[A-Z2-7]+$/.test(twoFactorSecret)) fail(`2FA UI did not render a valid secret: ${twoFactorSecret}`);
    await securityPanel.locator('.two-factor-setup input[name="token"]').fill(await freshTotp(twoFactorSecret));
    const enableTwoFactorResponse = page.waitForResponse((response) => (
      response.url().endsWith("/api/admin/two-factor") &&
      response.request().method() === "POST" &&
      response.request().postData()?.includes('"enable"')
    ));
    await securityPanel.getByRole("button", { name: "啟用 2FA" }).click();
    const enableResponse = await enableTwoFactorResponse;
    const enableJson = await enableResponse.json().catch(() => ({}));
    if (!enableResponse.ok() || enableJson.twoFactor?.enabled !== true) {
      fail(`2FA UI enable failed HTTP ${enableResponse.status()}: ${enableJson.message || "missing enabled state"}`);
    }
    if (!(await securityPanel.getByText("目前狀態：已啟用").isVisible({ timeout: 3000 }).catch(() => false))) {
      await page.reload({ waitUntil: "networkidle" });
      await page.locator(".admin-shell").waitFor({ state: "visible", timeout: 10000 });
      await clickTab(page, "站點設定", "站點設定");
    }
    const enabledStatusPanel = page.locator(".backup-actions").filter({ hasText: "帳號安全" });
    await enabledStatusPanel.getByText("目前狀態：已啟用").waitFor({ state: "visible", timeout: 8000 });
    const enabledTwoFactorDB = await waitForDb(
      (db) => {
        const admin = db.users.find((item) => item.id === originalAdminSecurity?.id);
        return admin?.twoFactorEnabled && admin.twoFactorSecret ? db : null;
      },
      "2FA enabled state persisted before login enforcement check",
    );
    const enabledTwoFactorAdmin = enabledTwoFactorDB.users.find((item) => item.id === originalAdminSecurity?.id);
    const enabledTwoFactorSecret = enabledTwoFactorAdmin?.twoFactorSecret || "";
    if (enabledTwoFactorSecret !== twoFactorSecret) {
      fail("2FA UI secret did not match persisted admin secret");
    }
    await page.screenshot({ path: screenshots.twoFactor, fullPage: true });

    await page.getByRole("button", { name: "登出" }).click();
    await page.getByRole("heading", { name: "銀行俱樂部後台" }).waitFor({ state: "visible", timeout: 8000 });
    const loginInputs = await page.locator("main.admin-login input").evaluateAll((inputs) => inputs.map((input) => input.getAttribute("name")));
    if (loginInputs.length !== 1 || loginInputs[0] !== "password") {
      fail(`admin login should only render password input, got ${loginInputs.join(",")}`);
    }
    await loginThroughUi(page);
    await page.locator(".admin-shell").waitFor({ state: "visible", timeout: 10000 });

    await clickTab(page, "站點設定", "站點設定");
    const enabledSecurityPanel = page.locator(".backup-actions").filter({ hasText: "帳號安全" });
    await enabledSecurityPanel.locator('input[name="token"]').fill(await freshTotp(enabledTwoFactorSecret));
    const disableTwoFactorResponse = page.waitForResponse((response) => (
      response.url().endsWith("/api/admin/two-factor") &&
      response.request().method() === "POST" &&
      response.request().postData()?.includes('"disable"')
    ));
    await enabledSecurityPanel.getByRole("button", { name: "停用 2FA" }).click();
    const disableResponse = await disableTwoFactorResponse;
    const disableJson = await disableResponse.json().catch(() => ({}));
    if (!disableResponse.ok() || disableJson.twoFactor?.enabled !== false) {
      fail(`2FA UI disable failed HTTP ${disableResponse.status()}: ${disableJson.message || "missing disabled state"}`);
    }
    if (!(await enabledSecurityPanel.getByText("目前狀態：未啟用").isVisible({ timeout: 3000 }).catch(() => false))) {
      await page.reload({ waitUntil: "networkidle" });
      await page.locator(".admin-shell").waitFor({ state: "visible", timeout: 10000 });
      await clickTab(page, "站點設定", "站點設定");
    }
    await page.locator(".backup-actions").filter({ hasText: "帳號安全" }).getByText("目前狀態：未啟用").waitFor({ state: "visible", timeout: 8000 });
    await waitForDb(
      (db) => {
        const admin = db.users.find((item) => item.id === originalAdminSecurity?.id);
        const auditActions = db.auditLogs.map((log) => log.action);
        return admin?.twoFactorEnabled === false &&
          !admin.twoFactorSecret &&
          auditActions.includes("two_factor_prepare") &&
          auditActions.includes("two_factor_enabled") &&
          auditActions.includes("two_factor_disabled");
      },
      "2FA enabled, enforced on login, disabled, and audited through admin UI",
    );

    const updatedSettings = {
      brandName: "銀行俱樂部 Smoke",
      companyName: "銀行俱樂部顧問測試公司",
      officeName: "設定同步測試通訊處",
      specialistName: `設定煙測專員 ${runId}`,
      specialistTitle: "設定同步顧問",
      address: "235 新北市中和區設定同步路 88 號",
      phone: "02 2243 7000",
      fax: "02 2928 7000",
      mobile: "0972 700 888",
      email: "settings-smoke@example.com",
    };
    const settingsForm = page.locator("form.settings-form");
    for (const [name, value] of Object.entries(updatedSettings)) {
      await settingsForm.locator(`[name="${name}"]`).fill(value);
      const filledValue = await settingsForm.locator(`[name="${name}"]`).inputValue();
      if (filledValue !== value) {
        fail(`site settings input ${name} did not retain filled value: ${filledValue}`);
      }
    }
    const settingsPatch = page.waitForResponse((response) => (
      response.url().endsWith("/api/admin/settings") &&
      response.request().method() === "PATCH"
    ));
    await settingsForm.evaluate((form) => {
      if (!(form instanceof HTMLFormElement)) throw new Error("settings form missing");
      form.requestSubmit();
    });
    const settingsResponse = await settingsPatch;
    if (!settingsResponse.ok()) fail(`site settings UI update failed HTTP ${settingsResponse.status()}`);
    const settingsJson = await settingsResponse.json().catch(() => ({}));
    if (!Object.entries(updatedSettings).every(([key, value]) => settingsJson.settings?.[key] === value)) {
      fail("site settings PATCH response did not include updated values", [
        JSON.stringify({
          requestBody: settingsResponse.request().postData(),
          responseSettings: settingsJson.settings,
        }, null, 2),
      ]);
    }
    await page.getByText("站點設定已更新。").waitFor({ state: "visible", timeout: 8000 });
    await waitForDb(
      (db) => Object.entries(updatedSettings).every(([key, value]) => db.settings?.[key] === value),
      "site settings written through admin UI",
    );
    await waitForAuditActions(
      page,
      [{ name: "settings_updated", targetId: "site" }],
      "settings_updated audit log written through admin UI",
    );
    await page.screenshot({ path: screenshots.settingsUpdated, fullPage: true });

    await waitForPageTexts(page, `${baseUrl}/contact?settings_smoke=${runId}`, "聯絡我們", [
      updatedSettings.specialistName,
      updatedSettings.specialistTitle,
      updatedSettings.companyName,
      updatedSettings.officeName,
      updatedSettings.address,
      updatedSettings.phone,
      updatedSettings.fax,
      updatedSettings.mobile,
      updatedSettings.email,
    ], "contact page");
    const contactQrAlt = await page.locator("#line-qr img").getAttribute("alt");
    if (!contactQrAlt?.includes(updatedSettings.specialistName)) {
      fail(`contact LINE QR alt did not include updated specialist name: ${contactQrAlt || "missing"}`);
    }
    await page.screenshot({ path: screenshots.contactSettings, fullPage: true });

    await waitForPageTexts(page, `${baseUrl}/success?lead_id=admin-settings-smoke-${runId}`, "已收到您的諮詢需求", [
      updatedSettings.specialistName,
      updatedSettings.specialistTitle,
      updatedSettings.mobile,
      updatedSettings.email,
    ], "success page");
    const successQrAlt = await page.locator(".success-contact img").getAttribute("alt");
    if (!successQrAlt?.includes(updatedSettings.specialistName)) {
      fail(`success LINE QR alt did not include updated specialist name: ${successQrAlt || "missing"}`);
    }
    await page.screenshot({ path: screenshots.successSettings, fullPage: true });

    await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
    await page.locator(".admin-shell").waitFor({ state: "visible", timeout: 10000 });
    await clickTab(page, "上線檢查", "上線檢查");
    await page.locator(".launch-check").first().waitFor({ state: "visible", timeout: 10000 });
    const launchCount = await page.locator(".launch-check").count();
    if (launchCount < 20) fail(`launch checklist rendered too few checks: ${launchCount}`);
    for (const label of ["通過", "警告", "失敗"]) {
      if (!(await page.getByText(label).first().isVisible())) fail(`launch checklist missing total label: ${label}`);
    }
    await page.screenshot({ path: screenshots.launch, fullPage: true });

    if (browserIssues.length) fail("admin UI reported console/page errors", browserIssues);

    const db = await readDb();
    const lead = db.leads.find((item) => item.id === seedLead.leadId);
    console.log(JSON.stringify({
      browserPath: "Repository Playwright admin UI smoke",
      loginMode: preparedAdmin.password === temporarySmokePassword ? "temporary smoke password restored after run" : "provided password",
      pageIdentity: { url: `${baseUrl}/admin`, title },
      lead: {
        id: seedLead.leadId,
        name: lead?.name,
        status: lead?.status,
        sourcePage: lead?.sourcePage,
        sourceChannel: lead?.sourceChannel,
      },
      verifiedTabs: ["線索管理", "文章管理", "文件資源", "帳號權限", "操作日誌", "統計儀表板", "站點設定", "上線檢查"],
      settingsSync: {
        specialistName: updatedSettings.specialistName,
        specialistTitle: updatedSettings.specialistTitle,
        contactPage: "/contact",
        successPage: "/success",
      },
      twoFactorUi: {
        enabled: true,
        loginPagePasswordOnly: true,
        disabled: true,
      },
      uploadedFile: {
        id: uploadedFileId,
        title: uploadedFileTitle,
        sourceFilename: uploadedFileName,
      },
      copiedFbPostPreview: copiedFbPost.slice(0, 160),
      launchChecksRendered: launchCount,
      screenshots,
    }, null, 2));
  } finally {
    if (browser) await browser.close();
    if (backup !== null) {
      await writeDbSnapshot(backup, { dbPath, label: "admin-ui-smoke" });
    } else {
      await restoreAdminSecurity(originalAdminSecurity);
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
