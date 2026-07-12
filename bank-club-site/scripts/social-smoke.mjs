import path from "node:path";
import { chromium } from "@playwright/test";
import { readDbJson, readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const keepData = process.env.SOCIAL_SMOKE_KEEP_DATA === "1";
const defaultPassword = "admin123";
const legacyDefaultPassword = "BankClub2026!";
const smokeLineUrl = process.env.SOCIAL_SMOKE_LINE_URL || "https://line.me/R/ti/p/@bankclubsmoke";
const smokeOfficialApplyUrl = process.env.SOCIAL_SMOKE_OFFICIAL_APPLY_URL || "https://www.cathaybk.com.tw/cathaybk/personal/loan/credit-loan/";

function fail(message) {
  const error = new Error(message);
  error.name = "SocialSmokeError";
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

function sameOriginHeaders(cookie = "", ip = "127.0.0.177") {
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
    process.env.SOCIAL_SMOKE_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    defaultPassword,
    legacyDefaultPassword,
  ].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);

  let loginResult = null;
  for (const password of passwordCandidates) {
    const result = await fetchJson("/api/admin/login", {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", "127.0.0.176"),
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: admin.email, password }),
    });
    loginResult = result;
    if (result.response.ok) break;
  }

  if (!loginResult?.response.ok) {
    fail(`admin login failed HTTP ${loginResult?.response.status}: ${loginResult?.json.message || "unknown error"}. Set SOCIAL_SMOKE_ADMIN_PASSWORD to the current local admin password.`);
  }
  const cookie = cookieFromSetCookie(loginResult.response.headers);
  if (!cookie) fail("admin login did not return bank_club_session cookie");
  if (loginResult.json.user?.role !== "super_admin") fail(`admin login returned unexpected role: ${loginResult.json.user?.role}`);
  return { cookie };
}

async function submitLead(sessionId) {
  const form = new FormData();
  const appointment = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16);
  form.set("website", "");
  form.set("name", "社群閉環煙測使用者");
  form.set("gender", "other");
  form.set("phone", "0933 456 789");
  form.set("lineId", "socialSmokeLine");
  form.set("identityType", "employee");
  form.set("loanType", "credit");
  form.set("desiredAmount", "600000");
  form.set("appointmentTime", appointment);
  form.set("purpose", "daily");
  form.set("note", "社群煙測：成功頁 LINE/FB 點擊回寫 lead 狀態。");
  form.set("consent", "on");
  form.set("sourcePage", "/success");
  form.set("sourceChannel", "facebook");
  form.set("utmSource", "facebook");
  form.set("utmMedium", "community");
  form.set("utmCampaign", "social-smoke");
  form.set("utmContent", "success-cta");
  form.set("utmTerm", "社群煙測");
  form.set("seoKeyword", "社群煙測");
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
  return json.leadId;
}

function assertUrl(url, label, expectedHost, expectedParams = {}) {
  const parsed = new URL(url);
  if (!parsed.hostname.includes(expectedHost)) fail(`${label}: expected host containing ${expectedHost}, got ${parsed.hostname}`);
  for (const [key, value] of Object.entries(expectedParams)) {
    if (!urlHasParam(parsed, key, value)) {
      fail(`${label}: expected ${key}=${value}, got ${parsed.searchParams.get(key) || "missing"} in ${url}`);
    }
  }
}

function urlHasParam(input, key, value, depth = 0) {
  const parsed = input instanceof URL ? input : new URL(input);
  if (parsed.searchParams.get(key) === value) return true;
  if (depth >= 3) return false;

  for (const candidate of parsed.searchParams.values()) {
    const decoded = decodeURIComponent(candidate);
    if (decoded.includes(`${key}=${value}`)) return true;
    if (/^https?:\/\//i.test(decoded)) {
      try {
        if (urlHasParam(decoded, key, value, depth + 1)) return true;
      } catch {
        // Ignore non-URL tracking blobs.
      }
    }
  }

  return false;
}

async function clickPopup(page, locator, label) {
  const popupPromise = page.waitForEvent("popup", { timeout: 8000 });
  await locator.click();
  const popup = await popupPromise;
  await popup.waitForURL((url) => String(url) !== "about:blank", { timeout: 8000 }).catch(() => undefined);
  const popupUrl = popup.url();
  await popup.close();
  if (!popupUrl || popupUrl === "about:blank") fail(`${label}: click did not open a destination URL`);
  return popupUrl;
}

async function assertLinkHref(page, locator, label, expectedHost, expectedParams = {}) {
  const href = await locator.getAttribute("href");
  if (!href) fail(`${label}: href is missing`);
  assertUrl(href, label, expectedHost, expectedParams);
  return href;
}

async function readDb() {
  return readDbJson(dbPath);
}

async function waitForDb(predicate, description) {
  const deadline = Date.now() + 8000;
  let lastDb = null;
  while (Date.now() < deadline) {
    lastDb = await readDb();
    if (predicate(lastDb)) return lastDb;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail(`timed out waiting for ${description}`);
}

async function run() {
  const dbBackup = keepData ? null : await readDbSnapshot(dbPath);
  const originalDB = JSON.parse(dbBackup || await readDbSnapshot(dbPath));
  const sessionId = `social-smoke-${Date.now()}`;
  let browser = null;

  try {
    const { cookie } = await adminLogin(originalDB);
    const settingsPatch = await fetchJson("/api/admin/settings", {
      method: "PATCH",
      headers: {
        ...sameOriginHeaders(cookie),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        lineUrl: smokeLineUrl,
        fbGroupUrl: originalDB.settings.fbGroupUrl,
        officialApplyUrl: smokeOfficialApplyUrl,
      }),
    });
    if (!settingsPatch.response.ok) {
      fail(`settings patch failed HTTP ${settingsPatch.response.status}: ${settingsPatch.json.message || ""}`);
    }
    if (settingsPatch.json.settings?.lineUrl !== smokeLineUrl) fail("settings patch did not persist smoke LINE URL");
    if (settingsPatch.json.settings?.officialApplyUrl !== smokeOfficialApplyUrl) fail("settings patch did not persist smoke official apply URL");

    const leadId = await submitLead(sessionId);
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.evaluate((value) => {
      window.localStorage.setItem("bank_club_tracking_session_id", value);
    }, sessionId);

    await page.goto(`${baseUrl}/?utm_source=facebook&utm_medium=group_post`, { waitUntil: "networkidle" });
    const homeHeaderLineHref = await assertLinkHref(page, page.getByRole("link", { name: "LINE諮詢" }).first(), "home header LINE href", "line.me", { source_page: "header", utm_medium: "line_cta" });
    const homeFooterFbCount = await page.getByRole("link", { name: "FB 社團入口" }).count();
    if (homeFooterFbCount !== 0) fail(`home reference footer should omit full FB footer CTA, found ${homeFooterFbCount}`);
    const homeFooterFbHref = "homepage-reference-footer-omits-full-fb-cta";

    await page.goto(`${baseUrl}/credit-loan`, { waitUntil: "networkidle" });
    const creditLine = page.getByRole("link", { name: "LINE 詢問專員" }).first();
    const creditLineHref = await assertLinkHref(page, creditLine, "credit LINE href", "line.me", { source_page: "credit", utm_medium: "line_cta" });
    assertUrl(await clickPopup(page, creditLine, "credit LINE click"), "credit LINE popup", "line.me", { source_page: "credit" });
    const creditOfficialLinks = await page.getByRole("link", { name: /銀行官方申請頁面|官方申請頁面|我要申請/ }).count();
    if (creditOfficialLinks !== 0) fail(`credit page should keep the main application flow in-site, found ${creditOfficialLinks} official apply links`);
    const creditApplicationFormCount = await page.locator("#credit-application form.lead-form").count();
    if (creditApplicationFormCount !== 1) fail(`credit page should render one in-site application form, found ${creditApplicationFormCount}`);
    const creditOfficialHref = "in-site-credit-application";

    await page.goto(`${baseUrl}/house-loan`, { waitUntil: "networkidle" });
    const houseLine = page.getByRole("link", { name: "LINE 詢問專員" }).first();
    const houseLineHref = await assertLinkHref(page, houseLine, "house LINE href", "line.me", { source_page: "house", utm_medium: "line_cta" });
    assertUrl(await clickPopup(page, houseLine, "house LINE click"), "house LINE popup", "line.me", { source_page: "house" });

    await page.goto(`${baseUrl}/business-loan`, { waitUntil: "networkidle" });
    const businessLine = page.getByRole("link", { name: "LINE 詢問專員" }).first();
    const businessLineHref = await assertLinkHref(page, businessLine, "business LINE href", "line.me", { source_page: "business", utm_medium: "line_cta" });
    assertUrl(await clickPopup(page, businessLine, "business LINE click"), "business LINE popup", "line.me", { source_page: "business" });

    await page.goto(`${baseUrl}/blog/loan-purpose-risk`, { waitUntil: "networkidle" });
    const blogLineHref = await assertLinkHref(page, page.getByRole("link", { name: "加入 LINE 諮詢" }).first(), "blog detail LINE href", "line.me", { source_page: "blog", source_detail: "loan-purpose-risk" });

    await page.goto(`${baseUrl}/facebook?utm_source=facebook&utm_medium=group_post`, { waitUntil: "networkidle" });
    if (!(await page.getByRole("heading", { name: "FB 銀行行員俱樂部社團" }).isVisible())) {
      fail("facebook page identity check failed");
    }
    if ((await page.getByText("熱門文章入口").count()) < 1) fail("facebook page missing popular article section");
    if ((await page.getByText("常見社團問題").count()) < 1) fail("facebook page missing group questions section");
    if ((await page.locator(".article-card-link").count()) < 4) fail("facebook page should render at least 4 popular article links");
    const facebookJoin = page.getByRole("link", { name: "加入社團" }).first();
    const facebookLine = page.getByRole("link", { name: "LINE 諮詢" }).first();
    const facebookJoinHref = await facebookJoin.getAttribute("href");
    const facebookLineHref = await facebookLine.getAttribute("href");
    if (!facebookJoinHref || !facebookLineHref) fail("facebook page social CTA hrefs are missing");
    assertUrl(facebookJoinHref, "facebook page FB href", "facebook.com", { source_page: "facebook", utm_medium: "fb_cta" });
    assertUrl(facebookLineHref, "facebook page LINE href", "line.me", { source_page: "facebook", utm_medium: "line_cta" });
    assertUrl(await clickPopup(page, facebookJoin, "facebook page FB click"), "facebook page FB popup", "facebook.com", { source_page: "facebook" });
    assertUrl(await clickPopup(page, facebookLine, "facebook page LINE click"), "facebook page LINE popup", "line.me", { source_page: "facebook" });

    await page.goto(`${baseUrl}/contact?utm_source=google&utm_medium=organic`, { waitUntil: "networkidle" });
    for (const text of ["國泰金控 / 國泰人壽", "人身 / 財產保險業務員", "09-8584-7613", "xmu6611@gmail.com", "g0985847613@gmail.com", "個資權利與資料請求", "停止利用", "刪除"]) {
      if ((await page.getByText(text, { exact: false }).count()) < 1) fail(`contact page missing business card text: ${text}`);
    }
    const contactLine = page.getByRole("link", { name: "開啟 LINE 諮詢" });
    const contactFb = page.getByRole("link", { name: "加入 FB 社團" });
    const contactPrivacy = page.getByRole("link", { name: "查看個資告知" });
    const contactLineHref = await contactLine.getAttribute("href");
    const contactFbHref = await contactFb.getAttribute("href");
    const contactPrivacyHref = await contactPrivacy.getAttribute("href");
    if (!contactLineHref || !contactFbHref || contactPrivacyHref !== "/privacy") fail("contact social/privacy CTA hrefs are missing");
    assertUrl(contactLineHref, "contact LINE href", "line.me", { source_page: "contact", utm_medium: "line_cta" });
    assertUrl(contactFbHref, "contact FB href", "facebook.com", { source_page: "contact", utm_medium: "fb_cta" });
    assertUrl(await clickPopup(page, contactLine, "contact LINE click"), "contact LINE popup", "line.me", { source_page: "contact" });
    assertUrl(await clickPopup(page, contactFb, "contact FB click"), "contact FB popup", "facebook.com", { source_page: "contact" });
    await Promise.all([
      page.waitForURL(`${baseUrl}/privacy`, { timeout: 8000 }),
      contactPrivacy.click(),
    ]);
    await waitForDb(
      (candidate) =>
        candidate.events.some(
          (event) =>
            event.sessionId === sessionId &&
            event.eventName === "contact_privacy_click" &&
            event.sourceChannel === "google" &&
            event.metadata?.sourcePage === "contact",
        ),
      "contact privacy rights click event",
    );

    await page.goto(`${baseUrl}/success?lead_id=${encodeURIComponent(leadId)}&utm_source=facebook&utm_medium=community`, { waitUntil: "networkidle" });
    const successLine = page.getByRole("link", { name: "加入 LINE 諮詢" });
    const successFb = page.getByRole("link", { name: "加入 FB 社團" });
    const successLineHref = await successLine.getAttribute("href");
    const successFbHref = await successFb.getAttribute("href");
    if (!successLineHref || !successFbHref) fail("success social CTA hrefs are missing");
    assertUrl(successLineHref, "success LINE href", "line.me", { source_page: "success", lead_id: leadId });
    assertUrl(successFbHref, "success FB href", "facebook.com", { source_page: "success", lead_id: leadId });
    assertUrl(await clickPopup(page, successLine, "success LINE click"), "success LINE popup", "line.me", { source_page: "success", lead_id: leadId });
    assertUrl(await clickPopup(page, successFb, "success FB click"), "success FB popup", "facebook.com", { source_page: "success", lead_id: leadId });

    const db = await waitForDb((candidate) => {
      const lead = candidate.leads.find((item) => item.id === leadId);
      return lead?.hasClickedLine && lead?.hasJoinedFb;
    }, "success social clicks to update lead flags");
    const lead = db.leads.find((item) => item.id === leadId);
    const sessionEvents = db.events.filter((event) => event.sessionId === sessionId);
    const eventNames = sessionEvents.map((event) => event.eventName);
    for (const eventName of ["credit_line_click", "house_line_click", "business_line_click", "fb_join_click", "fb_line_click", "contact_line_click", "contact_fb_click", "contact_privacy_click", "success_line_click", "success_fb_click", "form_submit"]) {
      if (!eventNames.includes(eventName)) fail(`missing ${eventName} event for smoke session ${sessionId}`);
    }
    for (const [eventName, loanType] of [
      ["credit_line_click", "credit"],
      ["house_line_click", "house"],
      ["business_line_click", "business"],
    ]) {
      const productLineEvent = sessionEvents.find((event) => event.eventName === eventName);
      if (productLineEvent?.metadata?.loanType !== loanType || productLineEvent?.metadata?.sourcePage !== loanType) {
        fail(`${eventName} did not preserve loanType/sourcePage metadata`);
      }
    }
    const facebookLineEvent = sessionEvents.find((event) => event.eventName === "fb_line_click");
    if (facebookLineEvent?.sourceChannel !== "facebook") {
      fail("facebook page LINE event did not preserve current page UTM source channel");
    }
    const contactLineEvent = sessionEvents.find((event) => event.eventName === "contact_line_click");
    if (contactLineEvent?.sourceChannel !== "google") {
      fail("contact LINE event did not preserve current page UTM source channel");
    }
    const contactPrivacyEvent = sessionEvents.find((event) => event.eventName === "contact_privacy_click");
    if (contactPrivacyEvent?.sourceChannel !== "google" || contactPrivacyEvent?.metadata?.sourcePage !== "contact") {
      fail("contact privacy event did not preserve source page/source channel");
    }
    const lineEvent = db.events.find((event) => event.leadId === leadId && event.eventName === "success_line_click");
    if (lineEvent?.sourceChannel !== "facebook" || lineEvent?.sessionId !== sessionId) {
      fail("success LINE event did not preserve source channel/session");
    }
    const summaryResult = await fetchJson("/api/admin/summary", {
      headers: sameOriginHeaders(cookie),
    });
    if (!summaryResult.response.ok) fail(`summary API failed HTTP ${summaryResult.response.status}: ${summaryResult.json.message || ""}`);
    const socialCampaign = summaryResult.json.campaignConversions?.["social-smoke"];
    if (!socialCampaign || socialCampaign.leads < 1 || socialCampaign.formSubmits < 1 || !socialCampaign.sourceChannels?.includes("facebook")) {
      fail("summary campaignConversions did not attribute the social-smoke FB lead");
    }
    const facebookCtaStats = summaryResult.json.ctaClicksByPage?.["/facebook"];
    if (!facebookCtaStats || facebookCtaStats.lineClicks < 1 || facebookCtaStats.fbClicks < 1) {
      fail("summary ctaClicksByPage did not count facebook page LINE/FB clicks");
    }
    const creditLoanStats = summaryResult.json.loanTypeConversions?.credit;
    if (!creditLoanStats || creditLoanStats.leads < 1) {
      fail("summary loanTypeConversions did not count credit leads");
    }
    for (const loanType of ["credit", "house", "business"]) {
      const loanCtaStats = summaryResult.json.ctaClicksByLoanType?.[loanType];
      if (!loanCtaStats || loanCtaStats.lineClicks < 1) {
        fail(`summary ctaClicksByLoanType did not count ${loanType} product LINE clicks`);
      }
    }

    console.log(JSON.stringify({
      leadId,
      sessionId,
      lineUrl: settingsPatch.json.settings.lineUrl,
      officialApplyUrl: settingsPatch.json.settings.officialApplyUrl,
      settingsSyncHrefs: {
        homeHeaderLineHref,
        homeFooterFbHref,
        creditLineHref,
        creditOfficialHref,
        houseLineHref,
        businessLineHref,
        blogLineHref,
      },
      contactLineHref,
      contactFbHref,
      contactPrivacyHref,
      facebookJoinHref,
      facebookLineHref,
      successLineHref,
      successFbHref,
      leadFlags: {
        hasClickedLine: lead.hasClickedLine,
        hasJoinedFb: lead.hasJoinedFb,
      },
      summaryStats: {
        socialCampaign,
        facebookCtaStats,
        creditLoanStats,
        ctaClicksByLoanType: summaryResult.json.ctaClicksByLoanType,
      },
      trackedEvents: eventNames.filter(
        (eventName) =>
          eventName.includes("line") ||
          eventName.includes("fb") ||
          eventName === "form_submit" ||
          eventName === "material_asset_open",
      ),
    }, null, 2));
  } finally {
    if (browser) await browser.close();
    if (dbBackup !== null) {
      await writeDbSnapshot(dbBackup, { dbPath, label: "social-smoke" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
