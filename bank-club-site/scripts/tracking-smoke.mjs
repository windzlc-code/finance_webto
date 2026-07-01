import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { readDbJson, readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const keepData = process.env.TRACKING_SMOKE_KEEP_DATA === "1";
const screenshotDir = process.env.TRACKING_SMOKE_SCREENSHOT_DIR || "/tmp/bank-club-tracking-smoke";
const gaMeasurementId = process.env.TRACKING_SMOKE_GA_ID || "G-BCSMOKE01";
const searchConsoleVerification =
  process.env.TRACKING_SMOKE_GSC_TOKEN || "bank-club-search-console-smoke-token";
const defaultPassword = "admin123";
const legacyDefaultPassword = "BankClub2026!";

function fail(message, details = []) {
  const error = new Error([message, ...details].join("\n"));
  error.name = "TrackingSmokeError";
  throw error;
}

async function readDB() {
  let lastError;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await readDbJson(dbPath);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw lastError;
}

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

function cookieFromSetCookie(headers) {
  const setCookie = headers.get("set-cookie") || "";
  const match = setCookie.match(/bank_club_session=[^;]+/);
  return match?.[0] || "";
}

function sameOriginHeaders(cookie = "", ip = "127.0.0.158") {
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

function futureDatetimeLocal(hoursFromNow = 72) {
  const date = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function smokePhone() {
  const digits = String(Date.now() % 100000000).padStart(8, "0");
  return `09${digits}`;
}

function buildTrackingLeadForm({ sessionId, seoKeyword }) {
  const form = new FormData();
  form.set("website", "");
  form.set("name", `追蹤統計煙測 ${Date.now()}`);
  form.set("phone", smokePhone());
  form.set("lineId", `trackingSmoke${String(Date.now()).slice(-6)}`);
  form.set("identityType", "employee");
  form.set("loanType", "credit");
  form.set("desiredAmount", "680000");
  form.set("appointmentTime", futureDatetimeLocal());
  form.set("purpose", "daily");
  form.set("consent", "on");
  form.set("sourcePage", "/");
  form.set("sourceChannel", "tracking_smoke");
  form.set("sessionId", sessionId);
  form.set("utmSource", "tracking_smoke");
  form.set("utmMedium", "qa");
  form.set("utmCampaign", "ga4_gsc");
  form.set("utmContent", "summary-conversion");
  form.set("utmTerm", seoKeyword);
  form.set("seoKeyword", seoKeyword);
  form.set("note", "追蹤煙測：建立真實線索以驗證統計後台的來源、SEO 關鍵字與頁面轉化率。");
  return form;
}

async function adminLogin(db) {
  const admin = db.users.find((user) => user.role === "super_admin") || db.users[0];
  const passwordCandidates = [
    process.env.TRACKING_SMOKE_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    defaultPassword,
    legacyDefaultPassword,
  ].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);

  let loginResult = null;
  for (const password of passwordCandidates) {
    const result = await fetchJson("/api/admin/login", {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", "127.0.0.159"),
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: admin.email, password }),
    });
    loginResult = result;
    if (result.response.ok) break;
  }

  if (!loginResult?.response.ok) {
    fail(`admin login failed HTTP ${loginResult?.response.status}: ${loginResult?.json.message || "unknown error"}. Set TRACKING_SMOKE_ADMIN_PASSWORD to the current local admin password.`);
  }
  const cookie = cookieFromSetCookie(loginResult.response.headers);
  if (!cookie) fail("admin login did not return bank_club_session cookie");
  return cookie;
}

async function waitForStoredEvent({ eventName, pagePath, sessionId, sourceChannel }, timeoutMs = 5000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const db = await readDB();
    const event = db.events.find(
      (item) =>
        item.eventName === eventName &&
        item.pagePath === pagePath &&
        (!sessionId || item.sessionId === sessionId) &&
        (!sourceChannel || item.sourceChannel === sourceChannel),
    );
    if (event) return event;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  fail(`stored event not found: ${eventName} on ${pagePath} for ${sessionId || "any session"}`);
}

async function waitForGtagEvent(page, eventName, sessionId) {
  await page.waitForFunction(
    ({ name, expectedSessionId }) =>
      window.dataLayer?.some(
        (entry) =>
          entry?.[0] === "event" &&
          entry?.[1] === name &&
          (!expectedSessionId || entry?.[2]?.session_id === expectedSessionId),
      ),
    { name: eventName, expectedSessionId: sessionId },
    { timeout: 5000 },
  );
}

async function run() {
  const backup = keepData ? null : await readDbSnapshot(dbPath);
  const originalDB = JSON.parse(backup || await readDbSnapshot(dbPath));
  const sessionId = `tracking-smoke-${Date.now()}`;
  const seoKeyword = "追蹤煙測關鍵字";
  const smokeDB = structuredClone(originalDB);
  smokeDB.settings.gaMeasurementId = gaMeasurementId;
  smokeDB.settings.googleSearchConsoleVerification = searchConsoleVerification;
  smokeDB.events = smokeDB.events.filter(
    (event) => event.sessionId !== sessionId,
  );

  let browser;
  const consoleMessages = [];
  try {
    await writeDbSnapshot(JSON.stringify(smokeDB, null, 2), { dbPath, label: "tracking-smoke" });
    const adminCookie = await adminLogin(originalDB);

    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
    await context.addInitScript((value) => {
      window.localStorage.setItem("bank_club_tracking_session_id", value);
    }, sessionId);
    await context.route("https://www.googletagmanager.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
    );
    const page = await context.newPage();
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) {
        consoleMessages.push(`${message.type()}: ${message.text()}`);
      }
    });

    const trackedHomeUrl = `${baseUrl}/?utm_source=tracking_smoke&utm_medium=qa&utm_campaign=ga4_gsc&utm_content=homepage&utm_term=${encodeURIComponent(seoKeyword)}`;

    await page.goto(trackedHomeUrl, {
      waitUntil: "networkidle",
    });
    await mkdir(screenshotDir, { recursive: true });
    const homeScreenshot = path.join(screenshotDir, "home-ga4-gsc.png");
    const flowScreenshot = path.join(screenshotDir, "application-flow-after-cta.png");
    await page.screenshot({ path: homeScreenshot, fullPage: true });

    const title = await page.title();
    if (!title.includes("銀行俱樂部")) fail(`home page title mismatch: ${title}`);

    const bodyText = await page.locator("body").innerText();
    if (!bodyText.includes("銀行俱樂部") || !bodyText.includes("查看申辦流程")) {
      fail("home page rendered without expected meaningful content");
    }

    const overlayText = /Unhandled Runtime Error|Application error|Next\.js|webpack|Turbopack/i;
    const hasDialogOverlay = await page.locator("[data-nextjs-dialog-overlay]").isVisible({ timeout: 500 }).catch(() => false);
    const hasErrorText = await page.locator("body").getByText(overlayText).isVisible({ timeout: 500 }).catch(() => false);
    if (hasDialogOverlay || hasErrorText) fail("framework error overlay is visible on home page");

    const gscContent = await page.locator('meta[name="google-site-verification"]').getAttribute("content");
    if (gscContent !== searchConsoleVerification) {
      fail(`Search Console meta mismatch: ${gscContent || "missing"}`);
    }

    const gaScriptCount = await page.locator(`script[src*="googletagmanager.com/gtag/js?id=${gaMeasurementId}"]`).count();
    if (gaScriptCount !== 1) fail(`GA4 gtag script should render once, found ${gaScriptCount}`);

    await page.waitForFunction(
      (id) =>
        window.dataLayer?.some(
          (entry) => entry?.[0] === "config" && entry?.[1] === id && entry?.[2]?.send_page_view === false,
        ),
      gaMeasurementId,
      { timeout: 5000 },
    );
    await waitForGtagEvent(page, "page_view", sessionId);
    await waitForStoredEvent({ eventName: "page_view", pagePath: "/", sessionId, sourceChannel: "tracking_smoke" });

    await page.getByRole("link", { name: /立即免費諮詢/ }).click();
    await page.waitForURL(`${baseUrl}/consultation?source_page=home`, { timeout: 5000 });
    await waitForGtagEvent(page, "hero_form_click", sessionId);
    const heroFormClick = await waitForStoredEvent({ eventName: "hero_form_click", pagePath: "/", sessionId });
    if (heroFormClick.metadata?.destination !== "/consultation?source_page=home") {
      fail(`hero_form_click destination mismatch: ${heroFormClick.metadata?.destination || "missing"}`);
    }
    await waitForStoredEvent({ eventName: "page_view", pagePath: "/consultation", sessionId });

    await page.goto(trackedHomeUrl, {
      waitUntil: "networkidle",
    });

    await page.getByRole("link", { name: /查看申辦流程/ }).click();
    await page.waitForURL(`${baseUrl}/application-flow`, { timeout: 5000 });
    await page.screenshot({ path: flowScreenshot, fullPage: true });
    await waitForGtagEvent(page, "hero_flow_click", sessionId);
    const heroFlowClick = await waitForStoredEvent({ eventName: "hero_flow_click", pagePath: "/", sessionId });
    if (heroFlowClick.metadata?.destination !== "/application-flow") {
      fail(`hero_flow_click destination mismatch: ${heroFlowClick.metadata?.destination || "missing"}`);
    }
    await waitForStoredEvent({ eventName: "page_view", pagePath: "/application-flow", sessionId });

    const flowText = await page.locator("body").innerText();
    if (!flowText.includes("申辦流程")) fail("application-flow page did not render after tracked CTA navigation");

    await page.goto(trackedHomeUrl, {
      waitUntil: "networkidle",
    });
    await page.locator(".qr-mini").click();
    await page.waitForURL(`${baseUrl}/contact?source_page=home_contact_strip&utm_source=bank_club_site&utm_medium=line_cta&utm_campaign=home_contact_strip#line-qr`, { timeout: 5000 });
    await waitForGtagEvent(page, "home_line_click", sessionId);
    const homeLineClick = await waitForStoredEvent({ eventName: "home_line_click", pagePath: "/", sessionId });
    if (
      homeLineClick.metadata?.destination !== "/contact?source_page=home_contact_strip&utm_source=bank_club_site&utm_medium=line_cta&utm_campaign=home_contact_strip#line-qr" ||
      homeLineClick.metadata?.sourceSection !== "contact_strip"
    ) {
      fail(`home_line_click metadata mismatch: ${JSON.stringify(homeLineClick.metadata || {})}`);
    }
    await waitForStoredEvent({ eventName: "page_view", pagePath: "/contact", sessionId });

    await page.goto(trackedHomeUrl, {
      waitUntil: "networkidle",
    });
    await page.locator(".service-panel", { hasText: "信用貸款" }).click();
    await page.waitForURL(`${baseUrl}/credit-loan`, { timeout: 5000 });
    await waitForGtagEvent(page, "home_service_click", sessionId);
    const serviceClick = await waitForStoredEvent({ eventName: "home_service_click", pagePath: "/", sessionId });
    if (serviceClick.metadata?.loanType !== "credit" || serviceClick.metadata?.sourceSection !== "service_rail") {
      fail(`home_service_click metadata mismatch: ${JSON.stringify(serviceClick.metadata || {})}`);
    }
    await waitForStoredEvent({ eventName: "page_view", pagePath: "/credit-loan", sessionId });

    await page.goto(trackedHomeUrl, {
      waitUntil: "networkidle",
    });
    await page.locator(".entry-card", { hasText: "企業貸款" }).click();
    await page.waitForURL(`${baseUrl}/business-loan`, { timeout: 5000 });
    await waitForGtagEvent(page, "home_entry_click", sessionId);
    const entryClick = await waitForStoredEvent({ eventName: "home_entry_click", pagePath: "/", sessionId });
    if (entryClick.metadata?.loanType !== "business" || entryClick.metadata?.sourceSection !== "core_entry") {
      fail(`home_entry_click metadata mismatch: ${JSON.stringify(entryClick.metadata || {})}`);
    }
    await waitForStoredEvent({ eventName: "page_view", pagePath: "/business-loan", sessionId });

    const leadResponse = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "x-forwarded-for": "127.0.0.161" },
      body: buildTrackingLeadForm({ sessionId, seoKeyword }),
    });
    const leadJson = await parseJson(leadResponse);
    if (!leadResponse.ok || !leadJson.leadId) {
      fail(`tracking lead submit failed HTTP ${leadResponse.status}: ${leadJson.message || "missing leadId"}`);
    }
    const trackingFormSubmit = await waitForStoredEvent({
      eventName: "form_submit",
      pagePath: "/",
      sessionId,
      sourceChannel: "tracking_smoke",
    });
    if (trackingFormSubmit.leadId !== leadJson.leadId || trackingFormSubmit.metadata?.seoKeyword !== seoKeyword) {
      fail(`tracking form_submit attribution mismatch: ${JSON.stringify(trackingFormSubmit)}`);
    }

    const summary = await fetchJson("/api/admin/summary", {
      headers: sameOriginHeaders(adminCookie, "127.0.0.160"),
    });
    if (!summary.response.ok) fail(`admin summary failed HTTP ${summary.response.status}: ${summary.json.message || ""}`);
    const creditCtaStats = summary.json.ctaClicksByLoanType?.credit;
    if (!creditCtaStats || creditCtaStats.totalClicks < 1 || creditCtaStats.serviceClicks < 1) {
      fail(`summary ctaClicksByLoanType did not count credit service click: ${JSON.stringify(creditCtaStats || {})}`);
    }
    const businessCtaStats = summary.json.ctaClicksByLoanType?.business;
    if (!businessCtaStats || businessCtaStats.totalClicks < 1 || businessCtaStats.entryClicks < 1) {
      fail(`summary ctaClicksByLoanType did not count business entry click: ${JSON.stringify(businessCtaStats || {})}`);
    }
    const seoKeywordStats = summary.json.seoKeywords?.[seoKeyword];
    if (!seoKeywordStats || seoKeywordStats.views < 1 || seoKeywordStats.formSubmits < 1) {
      fail(`summary seoKeywords did not count tracked keyword views and form submits: ${JSON.stringify(seoKeywordStats || {})}`);
    }
    const trackingSourceStats = summary.json.sourceSessionConversions?.tracking_smoke;
    if (!trackingSourceStats || trackingSourceStats.sessions < 1 || trackingSourceStats.leadSessions < 1 || trackingSourceStats.conversionRate <= 0) {
      fail(`summary sourceSessionConversions did not count tracking_smoke session-to-lead conversion: ${JSON.stringify(trackingSourceStats || {})}`);
    }
    const trackingLeadsBySource = summary.json.leadsBySource?.tracking_smoke;
    if (!trackingLeadsBySource || trackingLeadsBySource.leads < 1) {
      fail(`summary leadsBySource did not count tracking_smoke lead: ${JSON.stringify(trackingLeadsBySource || {})}`);
    }
    const homePageConversion = summary.json.leadsByPage?.["/"];
    if (!homePageConversion || homePageConversion.leads < 1 || homePageConversion.pageViews < 1 || homePageConversion.conversionRate <= 0) {
      fail(`summary leadsByPage did not count home page lead conversion: ${JSON.stringify(homePageConversion || {})}`);
    }
    const campaignStats = summary.json.campaignConversions?.ga4_gsc;
    if (!campaignStats || campaignStats.leads < 1 || campaignStats.formSubmits < 1 || !campaignStats.sourceChannels?.includes("tracking_smoke")) {
      fail(`summary campaignConversions did not count ga4_gsc lead/form attribution: ${JSON.stringify(campaignStats || {})}`);
    }
    const homeCtaStats = summary.json.ctaClicksByPage?.["/"];
    if (!homeCtaStats || homeCtaStats.lineClicks < 1 || homeCtaStats.formClicks < 1) {
      fail(`summary ctaClicksByPage did not count homepage LINE and form clicks: ${JSON.stringify(homeCtaStats || {})}`);
    }
    if (!summary.json.conversionRates || summary.json.conversionRates.pageToForm <= 0) {
      fail(`summary conversionRates did not report page-to-form conversion: ${JSON.stringify(summary.json.conversionRates || {})}`);
    }

    const relevantConsoleMessages = consoleMessages.filter(
      (message) => !message.includes("favicon") && !message.includes("net::ERR_ABORTED"),
    );
    if (relevantConsoleMessages.length) {
      fail("console reported warnings/errors during tracking smoke", relevantConsoleMessages.slice(0, 10));
    }

    console.log(JSON.stringify({
      baseUrl,
      sessionId,
      gaMeasurementId,
      searchConsoleVerification,
      checks: [
        "GA4 script rendered",
        "GA4 init pushed config with send_page_view disabled",
        "Search Console verification meta rendered",
        "home page_view pushed to dataLayer and stored in /api/events with source/session",
        "hero_form_click navigated to /consultation and stored in /api/events with session",
        "hero_flow_click navigated to /application-flow and stored in /api/events with session",
        "home_line_click navigated from homepage QR card to contact LINE area and stored source metadata",
        "home_service_click navigated to /credit-loan and stored loan metadata",
        "home_entry_click navigated to /business-loan and stored loan metadata",
        "admin summary ctaClicksByLoanType counted service and core entry clicks",
        "admin summary ctaClicksByPage counted homepage LINE and form clicks",
        "admin summary counted SEO keyword views and form submits",
        "admin summary counted source session-to-lead and page-to-form conversion",
        "admin summary counted UTM campaign attribution",
        "tracked CTA navigated to /application-flow",
      ],
      screenshots: {
        home: homeScreenshot,
        applicationFlow: flowScreenshot,
      },
    }, null, 2));
  } finally {
    if (browser) await browser.close();
    if (backup !== null) {
      await writeDbSnapshot(backup, { dbPath, label: "tracking-smoke" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
