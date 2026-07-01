import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { readDbJson, readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const keepData = process.env.FORM_SMOKE_KEEP_DATA === "1";
const screenshotDir = process.env.FORM_SMOKE_SCREENSHOT_DIR || path.join("/tmp", "bank-club-form-smoke");
const defaultPassword = "admin123";
const legacyDefaultPassword = "BankClub2026!";

function fail(message, details = []) {
  const error = new Error([message, ...details].join("\n"));
  error.name = "FormSmokeError";
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

function sameOriginHeaders(cookie = "", ip = "127.0.0.127") {
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
    process.env.FORM_SMOKE_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    defaultPassword,
    legacyDefaultPassword,
  ].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);

  let loginResult = null;
  for (const password of passwordCandidates) {
    const result = await fetchJson("/api/admin/login", {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", "127.0.0.126"),
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: admin.email, password }),
    });
    loginResult = result;
    if (result.response.ok) break;
  }
  if (!loginResult?.response.ok) {
    fail(`admin login failed HTTP ${loginResult?.response.status}: ${loginResult?.json.message || "unknown error"}. Set FORM_SMOKE_ADMIN_PASSWORD to the current local admin password.`);
  }
  const cookie = cookieFromSetCookie(loginResult.response.headers);
  if (!cookie) fail("admin login did not return bank_club_session cookie");
  if (loginResult.json.user?.role !== "super_admin") fail(`admin login returned unexpected role: ${loginResult.json.user?.role}`);
  return { cookie };
}

function futureDatetimeLocal(hoursFromNow = 54) {
  const date = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function extractLeadId(url) {
  const parsed = new URL(url);
  const leadId = parsed.searchParams.get("lead_id");
  if (!leadId) fail(`success URL missing lead_id: ${url}`);
  return leadId;
}

async function readDb() {
  return readDbJson(dbPath);
}

function smokePhone(offset = 0) {
  const digits = String((Date.now() + offset) % 100000000).padStart(8, "0");
  return `09${digits}`;
}

function formattedSmokePhone(phone) {
  return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7, 10)}`;
}

function buildApiLeadForm({ name, phone, lineId, sessionId, website = "", note = "", purpose = "daily", sourcePage = "/consultation-form-smoke-antispam" }) {
  const form = new FormData();
  form.set("website", website);
  form.set("name", name);
  form.set("phone", phone);
  form.set("lineId", lineId);
  form.set("identityType", "employee");
  form.set("loanType", "unknown");
  form.set("appointmentTime", futureDatetimeLocal(60));
  form.set("purpose", purpose);
  form.set("consent", "on");
  form.set("sourcePage", sourcePage);
  form.set("sourceChannel", "website");
  form.set("sessionId", sessionId);
  form.set("note", note);
  return form;
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

function buildCreditApiLeadForm({ name, phone, lineId, sessionId, includeFiles = true }) {
  const form = buildApiLeadForm({
    name,
    phone,
    lineId,
    sessionId,
    purpose: "living",
    sourcePage: "/credit-loan-form-smoke",
  });
  form.set("identityType", "employee");
  form.set("loanType", "credit");
  form.set("desiredAmount", "7000000");
  form.set("requestedAmount", "7000000");
  form.set("requestedTermYears", "10");
  form.set("caseSource", "company_preferential");
  form.set("programType", "binding");
  if (includeFiles) {
    form.set("idFront", tinyPngFile("id-front-smoke.png"));
    form.set("idBack", tinyPngFile("id-back-smoke.png"));
  }
  return form;
}

async function run() {
  const backup = keepData ? null : await readDbSnapshot(dbPath);
  const originalDB = JSON.parse(backup || await readDbSnapshot(dbPath));
  const sessionId = `form-smoke-${Date.now()}`;
  const phone = `0966 ${String(Date.now()).slice(-3)} ${String(Math.floor(Math.random() * 900) + 100)}`;
  const leadName = `表單煙測使用者 ${Date.now()}`;
  const screenshotPaths = {
    warning: path.join(screenshotDir, "consultation-warning.png"),
    success: path.join(screenshotDir, "consultation-success.png"),
    houseForm: path.join(screenshotDir, "house-form.png"),
    houseSuccess: path.join(screenshotDir, "house-success.png"),
  };
  let creditUploadDirToRemove = "";
  let browser = null;

  try {
    const { cookie } = await adminLogin(originalDB);
    const sensitiveForm = buildApiLeadForm({
      name: `敏感備註煙測 ${Date.now()}`,
      phone: smokePhone(21),
      lineId: `sensitiveFormSmoke${String(Date.now()).slice(-6)}`,
      sessionId: `${sessionId}-sensitive-note`,
      note: "表單備註誤貼身分證 A123456789 與銀行帳號 123456789012，應被拒絕。",
    });
    const sensitiveFormResponse = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "x-forwarded-for": `127.0.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}` },
      body: sensitiveForm,
    });
    const sensitiveFormJson = await parseJson(sensitiveFormResponse);
    if (sensitiveFormResponse.status !== 400 || !sensitiveFormJson.message?.includes("完整敏感文件內容")) {
      fail(`sensitive form note should be rejected, got HTTP ${sensitiveFormResponse.status}: ${sensitiveFormJson.message || ""}`);
    }
    const dbAfterSensitiveForm = await readDb();
    if (
      dbAfterSensitiveForm.leads.some((lead) => lead.note.includes("A123456789") || lead.note.includes("123456789012")) ||
      dbAfterSensitiveForm.events.some((event) => event.sessionId === `${sessionId}-sensitive-note`)
    ) {
      fail("sensitive form note submission should not create a lead or form_submit event");
    }

    const rawHighRiskPurpose = "股票投資理財";
    const highRiskApiSessionId = `${sessionId}-api-high-risk-purpose`;
    const highRiskApiResponse = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", "127.0.0.129"),
        "user-agent": "FormSmokeHighRiskPurposeCheck",
      },
      body: buildApiLeadForm({
        name: `高風險用途 API 煙測 ${Date.now()}`,
        phone: smokePhone(121),
        lineId: `highRiskPurposeSmoke${String(Date.now()).slice(-6)}`,
        sessionId: highRiskApiSessionId,
        purpose: rawHighRiskPurpose,
        sourcePage: "/consultation-form-smoke-high-risk-purpose",
      }),
    });
    const highRiskApiJson = await parseJson(highRiskApiResponse);
    if (!highRiskApiResponse.ok || !highRiskApiJson.leadId) {
      fail(`high-risk purpose API lead failed HTTP ${highRiskApiResponse.status}: ${highRiskApiJson.message || "missing leadId"}`);
    }
    const highRiskApiDetail = await fetchJson(`/api/admin/leads/${highRiskApiJson.leadId}`, {
      headers: sameOriginHeaders(cookie, "127.0.0.126"),
    });
    if (!highRiskApiDetail.response.ok) fail(`high-risk purpose admin detail failed HTTP ${highRiskApiDetail.response.status}`);
    const highRiskApiLead = highRiskApiDetail.json.lead;
    if (highRiskApiLead?.purpose !== "high_risk" || highRiskApiLead?.leadPriority !== "needs_review") {
      fail(`high-risk API purpose should normalize to needs_review, got purpose=${highRiskApiLead?.purpose}, priority=${highRiskApiLead?.leadPriority}`);
    }
    const dbAfterHighRiskApi = await readDb();
    const highRiskApiEvent = dbAfterHighRiskApi.events.find(
      (event) => event.eventName === "form_submit" && event.leadId === highRiskApiJson.leadId && event.sessionId === highRiskApiSessionId,
    );
    if (
      !highRiskApiEvent ||
      highRiskApiEvent.metadata?.purpose !== "high_risk" ||
      highRiskApiEvent.metadata?.highRiskPurpose !== "true" ||
      highRiskApiEvent.metadata?.rawPurpose !== rawHighRiskPurpose
    ) {
      fail("high-risk API purpose event missing normalized/raw purpose metadata");
    }

    const missingCreditFileResponse = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", "127.0.0.130"),
        "user-agent": "FormSmokeCreditMissingFiles",
      },
      body: buildCreditApiLeadForm({
        name: `信貸缺件煙測 ${Date.now()}`,
        phone: smokePhone(221),
        lineId: `creditMissingFiles${String(Date.now()).slice(-6)}`,
        sessionId: `${sessionId}-credit-missing-files`,
        includeFiles: false,
      }),
    });
    const missingCreditFileJson = await parseJson(missingCreditFileResponse);
    if (missingCreditFileResponse.status !== 400 || !missingCreditFileJson.message?.includes("身分證正面")) {
      fail(`credit application without ID files should be rejected, got HTTP ${missingCreditFileResponse.status}: ${missingCreditFileJson.message || ""}`);
    }

    const creditApiSessionId = `${sessionId}-credit-api`;
    const creditApiResponse = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", "127.0.0.131"),
        "user-agent": "FormSmokeCreditApplication",
      },
      body: buildCreditApiLeadForm({
        name: `信貸申請煙測 ${Date.now()}`,
        phone: smokePhone(321),
        lineId: `creditApplicationSmoke${String(Date.now()).slice(-6)}`,
        sessionId: creditApiSessionId,
      }),
    });
    const creditApiJson = await parseJson(creditApiResponse);
    if (!creditApiResponse.ok || !creditApiJson.leadId) {
      fail(`credit application API lead failed HTTP ${creditApiResponse.status}: ${creditApiJson.message || "missing leadId"}`);
    }
    const creditDetail = await fetchJson(`/api/admin/leads/${creditApiJson.leadId}`, {
      headers: sameOriginHeaders(cookie, "127.0.0.126"),
    });
    if (!creditDetail.response.ok) fail(`credit application admin detail failed HTTP ${creditDetail.response.status}`);
    const creditApplication = creditDetail.json.creditApplication;
    const creditFiles = creditDetail.json.creditApplicationFiles || [];
    if (
      !creditApplication ||
      !creditApplication.applicationNo?.startsWith("CR") ||
      creditApplication.requestedAmount !== 7000000 ||
      creditApplication.requestedTermYears !== 10 ||
      creditApplication.caseSource !== "company_preferential" ||
      creditApplication.programType !== "binding" ||
      creditApplication.idUploadStatus !== "uploaded" ||
      creditApplication.financialLineStatus !== "reminded" ||
      creditFiles.length !== 2
    ) {
      fail("credit application should persist amount, term, program, upload status, LINE supplement status, and two ID files");
    }
    if (!creditFiles.every((file) => file.mimeType === "image/png" && file.checksum && file.uploadStatus === "uploaded")) {
      fail("credit ID file records should persist PNG mime type, checksum, and uploaded status");
    }
    creditUploadDirToRemove = path.join(process.cwd(), ".data", "credit-application-files", creditApplication.id);
    const frontCreditFile = creditFiles.find((file) => file.fileType === "id_front");
    const backCreditFile = creditFiles.find((file) => file.fileType === "id_back");
    if (!frontCreditFile || !backCreditFile) fail("credit application should persist both id_front and id_back file records");
    const reuploadResponse = await fetchJson(`/api/admin/credit-application-files/${frontCreditFile.id}`, {
      method: "PATCH",
      headers: {
        ...sameOriginHeaders(cookie, "127.0.0.126"),
        "content-type": "application/json",
      },
      body: JSON.stringify({ uploadStatus: "pending_reupload" }),
    });
    if (
      !reuploadResponse.response.ok ||
      reuploadResponse.json.creditApplication?.idUploadStatus !== "pending_reupload" ||
      reuploadResponse.json.lead?.documentStatus !== "incomplete" ||
      !reuploadResponse.json.creditApplicationFiles?.some((file) => file.id === frontCreditFile.id && file.uploadStatus === "pending_reupload")
    ) {
      fail(`credit ID reupload request failed HTTP ${reuploadResponse.response.status}: ${reuploadResponse.json.message || ""}`);
    }
    const confirmResponse = await fetchJson(`/api/admin/credit-application-files/${frontCreditFile.id}`, {
      method: "PATCH",
      headers: {
        ...sameOriginHeaders(cookie, "127.0.0.126"),
        "content-type": "application/json",
      },
      body: JSON.stringify({ uploadStatus: "uploaded" }),
    });
    if (
      !confirmResponse.response.ok ||
      confirmResponse.json.creditApplication?.idUploadStatus !== "uploaded" ||
      confirmResponse.json.lead?.documentStatus !== "received" ||
      !confirmResponse.json.creditApplicationFiles?.some((file) => file.id === frontCreditFile.id && file.uploadStatus === "uploaded")
    ) {
      fail(`credit ID confirmation failed HTTP ${confirmResponse.response.status}: ${confirmResponse.json.message || ""}`);
    }
    const deleteCreditFileResponse = await fetchJson(`/api/admin/credit-application-files/${backCreditFile.id}`, {
      method: "DELETE",
      headers: sameOriginHeaders(cookie, "127.0.0.126"),
    });
    if (
      !deleteCreditFileResponse.response.ok ||
      deleteCreditFileResponse.json.creditApplication?.idUploadStatus !== "pending_reupload" ||
      deleteCreditFileResponse.json.creditApplication?.status !== "pending_documents" ||
      deleteCreditFileResponse.json.lead?.documentStatus !== "incomplete" ||
      !deleteCreditFileResponse.json.creditApplicationFiles?.some((file) => file.id === backCreditFile.id && file.uploadStatus === "deleted" && file.deletedAt)
    ) {
      fail(`credit ID delete failed HTTP ${deleteCreditFileResponse.response.status}: ${deleteCreditFileResponse.json.message || ""}`);
    }
    const dbAfterCreditFileAdmin = await readDb();
    for (const action of ["credit_id_file_reupload_requested", "credit_id_file_confirmed", "credit_id_file_deleted"]) {
      if (!dbAfterCreditFileAdmin.auditLogs.some((log) => log.action === action)) {
        fail(`missing audit log for ${action}`);
      }
    }

    await mkdir(screenshotDir, { recursive: true });
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
    const browserIssues = [];
    page.on("pageerror", (error) => browserIssues.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") browserIssues.push(`console error: ${message.text()}`);
    });
    await page.route("**/api/leads", async (route) => {
      const request = route.request();
      await route.continue({
        headers: {
          ...request.headers(),
          "x-forwarded-for": `127.0.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`,
        },
      });
    });

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.evaluate((value) => {
      window.localStorage.setItem("bank_club_tracking_session_id", value);
    }, sessionId);

    const query = new URLSearchParams({
      loan_type: "business",
      source_page: "/consultation-form-smoke",
      utm_source: "facebook",
      utm_medium: "community",
      utm_campaign: "form-smoke",
      utm_content: "browser-flow",
      utm_term: "貸款表單煙測",
    });
    await page.goto(`${baseUrl}/consultation?${query.toString()}`, { waitUntil: "networkidle" });
    if (!(await page.getByRole("heading", { name: "免費諮詢預約" }).isVisible())) {
      fail("consultation page identity check failed");
    }
    if ((await page.locator(".lead-form").count()) !== 1) fail("consultation form is missing");
    if ((await page.locator('select[name="loanType"]').inputValue()) !== "business") {
      fail("business consultation query did not default loan type to business");
    }
    if ((await page.locator('select[name="identityType"]').inputValue()) !== "business_owner") {
      fail("business consultation query did not default identity type to business owner");
    }
    if (!(await page.locator('input[name="businessName"]').isVisible())) {
      fail("business consultation query did not render business context fields");
    }

    await page.locator('input[name="name"]').fill(leadName);
    await page.locator('input[name="phone"]').fill(phone);
    await page.locator('input[name="lineId"]').fill("formSmokeLine");
    await page.locator('select[name="identityType"]').selectOption("employee");
    await page.locator('select[name="loanType"]').selectOption("business");
    await page.locator('select[name="desiredAmount"]').selectOption("800000");
    await page.locator('input[name="appointmentTime"]').fill(futureDatetimeLocal());
    await page.locator('select[name="purpose"]').selectOption("high_risk");
    await page.locator('select[name="businessLoanType"]').selectOption("working_capital");
    await page.locator('input[name="businessName"]').fill("表單煙測有限公司");
    await page.locator('select[name="businessType"]').selectOption("company");
    await page.locator('select[name="operatingYears"]').selectOption("3");
    await page.locator('select[name="businessLocation"]').selectOption("新北市");
    await page.locator('select[name="monthlyRevenueRange"]').selectOption("over_1m");
    await page.locator('textarea[name="note"]').fill("Playwright 前台表單煙測：確認 UI 提交、來源追蹤、成功頁與後台線索。");
    await page.locator('input[name="consent"]').check();

    if (!(await page.getByRole("alert").getByText("資金用途需先確認是否符合銀行規範").isVisible())) {
      fail("high-risk purpose warning did not render");
    }
    if (!(await page.locator('input[name="businessName"]').isVisible())) {
      fail("business context fields did not render");
    }
    await page.screenshot({ path: screenshotPaths.warning, fullPage: true });

    await Promise.all([
      page.waitForURL(/\/success\?lead_id=/, { timeout: 10000 }),
      page.locator("button.form-submit").click(),
    ]);
    const successUrl = page.url();
    const leadId = extractLeadId(successUrl);
    if (!(await page.getByRole("heading", { name: "已收到您的諮詢需求" }).isVisible())) {
      fail("success page identity check failed");
    }
    for (const text of ["補件提醒", "透過 LINE 與專員確認補件方式", "權狀", "財力證明"]) {
      if (!(await page.getByText(text, { exact: false }).first().isVisible())) {
        fail(`success page missing sensitive-document handoff copy: ${text}`);
      }
    }
    const successLineHref = await page.getByRole("link", { name: "加入 LINE 諮詢" }).getAttribute("href");
    const successFbHref = await page.getByRole("link", { name: "加入 FB 社團" }).getAttribute("href");
    if (!successLineHref?.includes(`lead_id=${encodeURIComponent(leadId)}`)) fail(`success LINE href missing lead_id: ${successLineHref}`);
    if (!successFbHref?.includes(`lead_id=${encodeURIComponent(leadId)}`)) fail(`success FB href missing lead_id: ${successFbHref}`);
    await page.screenshot({ path: screenshotPaths.success, fullPage: true });

    const lineEventResponse = page.waitForResponse((response) =>
      response.url() === `${baseUrl}/api/events` && response.request().postData()?.includes("success_line_click"),
    );
    await Promise.all([
      page.waitForURL(/\/contact\?.*lead_id=.*#line-qr/, { timeout: 10000 }),
      page.getByRole("link", { name: "加入 LINE 諮詢" }).click(),
    ]);
    const lineEvent = await lineEventResponse;
    if (!lineEvent.ok()) fail(`success LINE event failed HTTP ${lineEvent.status()}`);
    await page.goto(successUrl, { waitUntil: "networkidle" });

    const fbEventResponse = page.waitForResponse((response) =>
      response.url() === `${baseUrl}/api/events` && response.request().postData()?.includes("success_fb_click"),
    );
    const popupPromise = page.waitForEvent("popup").catch(() => null);
    await page.getByRole("link", { name: "加入 FB 社團" }).click();
    const fbEvent = await fbEventResponse;
    if (!fbEvent.ok()) fail(`success FB event failed HTTP ${fbEvent.status()}`);
    const popup = await popupPromise;
    await popup?.close().catch(() => undefined);

    if (browserIssues.length) fail("browser reported console/page errors", browserIssues);

    const headers = { ...sameOriginHeaders(cookie), "content-type": "application/json" };
    const dbBeforeDetail = await readDb();
    const storedLeadBeforeDetail = dbBeforeDetail.leads.find((item) => item.id === leadId);
    if (!storedLeadBeforeDetail) {
      fail(
        "submitted lead disappeared from JSON database before admin detail lookup",
        [
          `leadId: ${leadId}`,
          `lead ids: ${dbBeforeDetail.leads.map((item) => item.id).slice(0, 5).join(", ") || "none"}`,
          `recent events: ${dbBeforeDetail.events.slice(0, 5).map((event) => `${event.eventName}:${event.leadId || "-"}`).join(", ") || "none"}`,
        ],
      );
    }
    const detail = await fetchJson(`/api/admin/leads/${leadId}`, { headers });
    if (!detail.response.ok) fail(`admin lead detail failed HTTP ${detail.response.status}`);
    const lead = detail.json.lead;
    if (!detail.json.businessLoanApplication?.applicationNo?.startsWith("BU")) {
      fail("business lead detail should include business loan application");
    }
    const businessLineStatusUpdate = await fetchJson(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ businessDocumentLineStatus: "line_received" }),
    });
    if (
      !businessLineStatusUpdate.response.ok ||
      businessLineStatusUpdate.json.businessLoanApplication?.documentLineStatus !== "line_received" ||
      businessLineStatusUpdate.json.lead?.documentStatus !== "received" ||
      businessLineStatusUpdate.json.lead?.status !== "documents_received"
    ) {
      fail(`business LINE document status update failed HTTP ${businessLineStatusUpdate.response.status}: ${businessLineStatusUpdate.json.message || ""}`);
    }

    const list = await fetchJson("/api/admin/leads?loanType=business&sourceChannel=facebook", { headers });
    if (!list.response.ok) fail(`admin lead list failed HTTP ${list.response.status}`);
    const listedLead = list.json.leads?.find((lead) => lead.id === leadId);
    if (!listedLead) {
      fail(
        "submitted UI lead not found in admin filtered lead list",
        [
          `detail loanType/sourceChannel: ${lead?.loanType || "missing"} / ${lead?.sourceChannel || "missing"}`,
          `available sources: ${(list.json.sourceChannels || []).join(", ") || "none"}`,
          `filtered count: ${list.json.leads?.length || 0}`,
        ],
      );
    }
    if (listedLead.phone === phone || listedLead.lineId === "formSmokeLine") {
      fail("admin lead list should mask phone and LINE ID for UI-submitted lead");
    }

    const expectedFields = {
      name: leadName,
      phone,
      lineId: "formSmokeLine",
      loanType: "business",
      identityType: "business_owner",
      purpose: "high_risk",
      companyName: "表單煙測有限公司",
      businessRegistrationType: "company",
      monthlyRevenue: null,
      sourcePage: "/consultation-form-smoke",
      sourceChannel: "facebook",
      utmSource: "facebook",
      utmMedium: "community",
      utmCampaign: "form-smoke",
      utmContent: "browser-flow",
      utmTerm: "貸款表單煙測",
      sessionId,
      leadPriority: "needs_review",
      consentVersion: "2026-06-30",
    };
    for (const [key, value] of Object.entries(expectedFields)) {
      if (lead?.[key] !== value) fail(`lead detail mismatch for ${key}: expected ${value}, got ${lead?.[key]}`);
    }
    if (!lead.consentAt || !lead.createdAt || !lead.userAgent?.includes("HeadlessChrome")) {
      fail("lead detail missing consent timestamp, createdAt, or browser user agent");
    }
    if (!lead.hasClickedLine || !lead.hasJoinedFb) {
      fail(`success CTA clicks did not update CRM flags: line=${lead.hasClickedLine}, fb=${lead.hasJoinedFb}`);
    }

    const houseSessionId = `${sessionId}-house`;
    const housePhone = smokePhone(4000);
    const houseStoredPhone = formattedSmokePhone(housePhone);
    const houseLeadName = `房貸表單煙測使用者 ${Date.now()}`;
    const houseQuery = new URLSearchParams({
      utm_source: "seo",
      utm_medium: "organic",
      utm_campaign: "house-form-smoke",
      utm_content: "property-form",
      utm_term: "房貸煙測",
    });
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.evaluate((value) => {
      window.localStorage.setItem("bank_club_tracking_session_id", value);
    }, houseSessionId);
    await page.goto(`${baseUrl}/consultation?loan_type=house&source_page=house-product-cta`, { waitUntil: "networkidle" });
    if ((await page.locator('select[name="loanType"]').inputValue()) !== "house") {
      fail("house consultation query did not default loan type to house");
    }
    if ((await page.locator('select[name="identityType"]').inputValue()) !== "home_owner") {
      fail("house consultation query did not default identity type to homeowner");
    }
    if (!(await page.locator('select[name="propertyCity"]').isVisible())) {
      fail("house consultation query did not render property context fields");
    }

    await page.goto(`${baseUrl}/house-loan?${houseQuery.toString()}`, { waitUntil: "networkidle" });
    if (!(await page.getByRole("heading", { name: "房屋貸款", exact: true }).isVisible())) {
      fail("house-loan page identity check failed");
    }
    const houseForm = page.locator("#house-application form.lead-form");
    if ((await houseForm.count()) !== 1) fail("house-loan embedded consultation form is missing");
    if ((await houseForm.locator('select[name="loanType"]').inputValue()) !== "house") {
      fail("house-loan embedded consultation form did not default to house loan type");
    }
    if ((await houseForm.locator('select[name="identityType"]').inputValue()) !== "home_owner") {
      fail("house-loan embedded consultation form did not default to homeowner identity");
    }

    await houseForm.locator('input[name="name"]').fill(houseLeadName);
    await houseForm.locator('input[name="phone"]').fill(housePhone);
    await houseForm.locator('input[name="lineId"]').fill("houseSmokeLine");
    await houseForm.locator('select[name="desiredAmount"]').selectOption("1800000");
    await houseForm.locator('input[name="appointmentTime"]').fill(futureDatetimeLocal(72));
    await houseForm.locator('select[name="purpose"]').selectOption("renovation");
    await houseForm.locator('select[name="houseLoanType"]').selectOption("home_equity");
    await houseForm.locator('select[name="propertyCity"]').selectOption("新北市");
    await houseForm.locator('input[name="propertyArea"]').fill("中和區");
    await houseForm.locator('select[name="propertyType"]').selectOption("elevator");
    await houseForm.locator('input[name="estimatedPropertyValue"]').fill("16000000");
    await houseForm.locator('select[name="existingMortgage"]').selectOption("has_mortgage");
    await houseForm.locator('input[name="currentBank"]').fill("測試銀行");
    await houseForm.locator('input[name="remainingBalance"]').fill("5200000");
    await houseForm.locator('textarea[name="note"]').fill("房貸表單煙測：確認房屋資料諮詢表提交與後台保存。");
    await houseForm.locator('input[name="consent"]').check();
    await page.screenshot({ path: screenshotPaths.houseForm, fullPage: true });

    await Promise.all([
      page.waitForURL(/\/success\?lead_id=/, { timeout: 10000 }),
      houseForm.locator("button.form-submit").click(),
    ]);
    const houseSuccessUrl = page.url();
    const houseLeadId = extractLeadId(houseSuccessUrl);
    if (!(await page.getByRole("heading", { name: "已收到您的諮詢需求" }).isVisible())) {
      fail("house-loan success page identity check failed");
    }
    await page.screenshot({ path: screenshotPaths.houseSuccess, fullPage: true });

    const houseDetail = await fetchJson(`/api/admin/leads/${houseLeadId}`, { headers });
    if (!houseDetail.response.ok) fail(`admin house lead detail failed HTTP ${houseDetail.response.status}`);
    const houseLead = houseDetail.json.lead;
    if (!houseDetail.json.houseLoanApplication?.applicationNo?.startsWith("HO")) {
      fail("house lead detail should include house loan application");
    }
    const houseLineStatusUpdate = await fetchJson(`/api/admin/leads/${houseLeadId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ houseDocumentLineStatus: "pending_documents" }),
    });
    if (
      !houseLineStatusUpdate.response.ok ||
      houseLineStatusUpdate.json.houseLoanApplication?.documentLineStatus !== "pending_documents" ||
      houseLineStatusUpdate.json.lead?.documentStatus !== "incomplete" ||
      houseLineStatusUpdate.json.lead?.status !== "pending_documents"
    ) {
      fail(`house LINE document status update failed HTTP ${houseLineStatusUpdate.response.status}: ${houseLineStatusUpdate.json.message || ""}`);
    }
    const houseExpectedFields = {
      name: houseLeadName,
      phone: houseStoredPhone,
      lineId: "houseSmokeLine",
      loanType: "house",
      identityType: "home_owner",
      purpose: "renovation",
      desiredAmount: 1800000,
      propertyRegion: "新北市 中和區",
      propertyType: "elevator",
      estimatedPropertyValue: 16000000,
      existingMortgage: "has_mortgage",
      sourcePage: "/house-loan",
      sourceChannel: "seo",
      utmSource: "seo",
      utmMedium: "organic",
      utmCampaign: "house-form-smoke",
      utmContent: "property-form",
      utmTerm: "房貸煙測",
      sessionId: houseSessionId,
      leadPriority: "normal",
      consentVersion: "2026-06-30",
    };
    for (const [key, value] of Object.entries(houseExpectedFields)) {
      if (houseLead?.[key] !== value) fail(`house lead detail mismatch for ${key}: expected ${value}, got ${houseLead?.[key]}`);
    }
    if (!houseLead.consentAt || !houseLead.createdAt || !houseLead.userAgent?.includes("HeadlessChrome")) {
      fail("house lead detail missing consent timestamp, createdAt, or browser user agent");
    }
    const houseList = await fetchJson("/api/admin/leads?loanType=house&sourceChannel=seo", { headers });
    if (!houseList.response.ok) fail(`admin house lead list failed HTTP ${houseList.response.status}`);
    const listedHouseLead = houseList.json.leads?.find((item) => item.id === houseLeadId);
    if (!listedHouseLead) {
      fail(
        "submitted house page lead not found in admin filtered lead list",
        [
          `detail loanType/sourceChannel: ${houseLead?.loanType || "missing"} / ${houseLead?.sourceChannel || "missing"}`,
          `available sources: ${(houseList.json.sourceChannels || []).join(", ") || "none"}`,
          `filtered count: ${houseList.json.leads?.length || 0}`,
        ],
      );
    }
    if (listedHouseLead.phone === houseStoredPhone || listedHouseLead.lineId === "houseSmokeLine") {
      fail("admin house lead list should mask phone and LINE ID for UI-submitted lead");
    }
    if (browserIssues.length) fail("browser reported console/page errors", browserIssues);

    const duplicateForm = new FormData();
    duplicateForm.set("name", `${leadName} 重複格式`);
    duplicateForm.set("phone", phone.replaceAll(" ", "-"));
    duplicateForm.set("lineId", "formSmokeDifferentLine");
    duplicateForm.set("identityType", "employee");
    duplicateForm.set("loanType", "unknown");
    duplicateForm.set("appointmentTime", futureDatetimeLocal(58));
    duplicateForm.set("purpose", "daily");
    duplicateForm.set("consent", "on");
    duplicateForm.set("sourcePage", "/consultation-form-smoke-duplicate");
    duplicateForm.set("sourceChannel", "website");
    duplicateForm.set("sessionId", `${sessionId}-duplicate`);
    const duplicateResponse = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", "127.0.0.128"),
        "user-agent": "FormSmokeDuplicateCheck",
      },
      body: duplicateForm,
    });
    const duplicateJson = await parseJson(duplicateResponse);
    if (!duplicateResponse.ok || !duplicateJson.leadId) {
      fail(`duplicate lead submission failed HTTP ${duplicateResponse.status}: ${duplicateJson.message || "missing lead_id"}`);
    }

    const db = await readDb();
    const duplicateLead = db.leads.find((item) => item.id === duplicateJson.leadId);
    if (!duplicateLead) fail(`duplicate lead ${duplicateJson.leadId} was not written to database`);
    if (duplicateLead.duplicateOf !== leadId) {
      fail(`duplicate lead should point to original lead ${leadId}, got ${duplicateLead.duplicateOf || "empty"}`);
    }
    if (duplicateLead.phone !== phone) {
      fail(`duplicate lead phone should be normalized to ${phone}, got ${duplicateLead.phone}`);
    }

    const honeypotResponse = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", `127.0.210.${Math.floor(Math.random() * 100) + 1}`),
        "user-agent": "FormSmokeHoneypotCheck",
      },
      body: buildApiLeadForm({
        name: `${leadName} 蜜罐`,
        phone: smokePhone(1000),
        lineId: "formSmokeHoneypot",
        sessionId: `${sessionId}-honeypot`,
        website: "https://spam.example",
      }),
    });
    const honeypotJson = await parseJson(honeypotResponse);
    if (honeypotResponse.status !== 400 || honeypotJson.leadId) {
      fail(`honeypot anti-spam check should reject bot field, got HTTP ${honeypotResponse.status}`);
    }

    const rapidIp = `127.0.211.${Math.floor(Math.random() * 100) + 1}`;
    const rapidFirstResponse = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", rapidIp),
        "user-agent": "FormSmokeRapidSubmitCheck",
      },
      body: buildApiLeadForm({
        name: `${leadName} 快速送出一`,
        phone: smokePhone(2000),
        lineId: "formSmokeRapidOne",
        sessionId: `${sessionId}-rapid-1`,
      }),
    });
    const rapidFirstJson = await parseJson(rapidFirstResponse);
    if (!rapidFirstResponse.ok || !rapidFirstJson.leadId) {
      fail(`rapid-submit baseline lead failed HTTP ${rapidFirstResponse.status}: ${rapidFirstJson.message || "missing leadId"}`);
    }
    const rapidSecondResponse = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", rapidIp),
        "user-agent": "FormSmokeRapidSubmitCheck",
      },
      body: buildApiLeadForm({
        name: `${leadName} 快速送出二`,
        phone: smokePhone(3000),
        lineId: "formSmokeRapidTwo",
        sessionId: `${sessionId}-rapid-2`,
      }),
    });
    const rapidSecondJson = await parseJson(rapidSecondResponse);
    if (rapidSecondResponse.status !== 429 || rapidSecondJson.leadId) {
      fail(`rapid-submit anti-spam check should return 429, got HTTP ${rapidSecondResponse.status}`);
    }

    const attemptFloodIp = `127.0.212.${Math.floor(Math.random() * 100) + 1}`;
    const attemptFloodStatuses = [];
    for (let index = 0; index < 21; index += 1) {
      const response = await fetch(`${baseUrl}/api/leads`, {
        method: "POST",
        headers: {
          ...sameOriginHeaders("", attemptFloodIp),
          "user-agent": "FormSmokeAttemptFloodCheck",
        },
        body: buildApiLeadForm({
          name: `${leadName} 無效嘗試 ${index}`,
          phone: smokePhone(4000 + index),
          lineId: `formSmokeAttemptFlood${index}`,
          sessionId: `${sessionId}-attempt-flood-${index}`,
          website: "https://spam.example",
        }),
      });
      attemptFloodStatuses.push(response.status);
    }
    if (!attemptFloodStatuses.slice(0, 20).every((status) => status === 400) || attemptFloodStatuses.at(-1) !== 429) {
      fail(`attempt-flood anti-spam check expected twenty 400 responses followed by 429, got ${attemptFloodStatuses.join(",")}`);
    }
    const dbAfterAntiSpam = await readDb();
    if (dbAfterAntiSpam.leads.some((lead) => lead.lineId.startsWith("formSmokeAttemptFlood"))) {
      fail("attempt-flood honeypot submissions should not create leads");
    }

    const formSubmit = db.events.find(
      (event) => event.eventName === "form_submit" && event.leadId === leadId && event.sessionId === sessionId,
    );
    if (!formSubmit || formSubmit.sourceChannel !== "facebook" || formSubmit.metadata?.highRiskPurpose !== "true") {
      fail("form_submit event missing UI session/source/high-risk metadata");
    }
    if (!db.events.some((event) => event.eventName === "success_line_click" && event.leadId === leadId && event.sessionId === sessionId)) {
      fail("missing success_line_click event for submitted lead");
    }
    if (!db.events.some((event) => event.eventName === "success_fb_click" && event.leadId === leadId && event.sessionId === sessionId)) {
      fail("missing success_fb_click event for submitted lead");
    }
    if (!db.auditLogs.some((log) => log.action === "lead_created" && log.targetId === leadId)) {
      fail("UI form submission did not write lead_created audit log");
    }
    const houseFormSubmit = db.events.find(
      (event) => event.eventName === "form_submit" && event.leadId === houseLeadId && event.sessionId === houseSessionId,
    );
    if (!houseFormSubmit || houseFormSubmit.sourceChannel !== "seo" || houseFormSubmit.metadata?.loanType !== "house") {
      fail("house form_submit event missing session/source/loan metadata");
    }
    if (!db.auditLogs.some((log) => log.action === "lead_created" && log.targetId === houseLeadId)) {
      fail("house page form submission did not write lead_created audit log");
    }
    if (!db.auditLogs.some((log) => log.action === "business_line_documents_updated" && log.targetType === "business_loan_application")) {
      fail("business LINE document status update did not write audit log");
    }
    if (!db.auditLogs.some((log) => log.action === "house_line_documents_updated" && log.targetType === "house_loan_application")) {
      fail("house LINE document status update did not write audit log");
    }

    console.log(JSON.stringify({
      browserPath: "Repository Playwright form smoke",
      leadId,
      houseLeadId,
      successUrl,
      houseSuccessUrl,
      maskedListPhone: listedLead.phone,
      detailPhone: lead.phone,
      source: {
        sourcePage: lead.sourcePage,
        sourceChannel: lead.sourceChannel,
        sessionId: lead.sessionId,
        utmCampaign: lead.utmCampaign,
        utmTerm: lead.utmTerm,
      },
      businessFields: {
        identityType: lead.identityType,
        companyName: lead.companyName,
        monthlyRevenue: lead.monthlyRevenue,
        leadPriority: lead.leadPriority,
        documentLineStatus: businessLineStatusUpdate.json.businessLoanApplication.documentLineStatus,
      },
      houseFields: {
        identityType: houseLead.identityType,
        propertyRegion: houseLead.propertyRegion,
        propertyType: houseLead.propertyType,
        estimatedPropertyValue: houseLead.estimatedPropertyValue,
        existingMortgage: houseLead.existingMortgage,
        maskedListPhone: listedHouseLead.phone,
        leadPriority: houseLead.leadPriority,
        documentLineStatus: houseLineStatusUpdate.json.houseLoanApplication.documentLineStatus,
      },
      crmCtaFlags: {
        hasClickedLine: lead.hasClickedLine,
        hasJoinedFb: lead.hasJoinedFb,
      },
      duplicateCheck: {
        duplicateLeadId: duplicateLead.id,
        duplicateOf: duplicateLead.duplicateOf,
        normalizedPhone: duplicateLead.phone,
      },
      antiSpam: {
        honeypotStatus: honeypotResponse.status,
        rapidFirstLeadId: rapidFirstJson.leadId,
        rapidSecondStatus: rapidSecondResponse.status,
        attemptFloodLastStatus: attemptFloodStatuses.at(-1),
      },
      creditApplication: {
        leadId: creditApiJson.leadId,
        applicationNo: creditApplication.applicationNo,
        idFileCount: creditFiles.length,
        missingFileStatus: missingCreditFileResponse.status,
        reuploadStatus: reuploadResponse.json.creditApplication.idUploadStatus,
        deletedFileStatus: deleteCreditFileResponse.json.creditApplication.idUploadStatus,
      },
      screenshots: screenshotPaths,
    }, null, 2));
  } finally {
    if (browser) await browser.close();
    if (creditUploadDirToRemove) {
      await rm(creditUploadDirToRemove, { recursive: true, force: true }).catch(() => undefined);
    }
    if (backup !== null) {
      await writeDbSnapshot(backup, { dbPath, label: "form-smoke" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
