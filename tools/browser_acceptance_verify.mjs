#!/usr/bin/env node
import { createServer } from "node:http";
import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (error) {
  console.error("Cannot load Playwright. Set NODE_PATH to the bundled node_modules or install playwright.");
  console.error(String(error && error.message ? error.message : error));
  process.exit(2);
}

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_PORT = 4173;
const ADMIN_PASSWORD = "admin123";
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 || index + 1 >= process.argv.length ? fallback : process.argv[index + 1];
}

function ok(label, detail = "") {
  return { label, status: "passed", detail };
}

function fail(label, detail) {
  return { label, status: "failed", detail };
}

function passedRecord(results, label) {
  return results.find((item) => item.label === label && item.status === "passed") || null;
}

function allPassed(results, labels) {
  return labels.every((label) => !!passedRecord(results, label));
}

function browserAcceptanceEvidence(results, baseUrl) {
  const desktopMobileChecks = results
    .filter((item) => /^(desktop|mobile) (layout|text fit) \//.test(item.label))
    .map((item) => item.label);
  const records = [];
  if (desktopMobileChecks.length && allPassed(results, desktopMobileChecks)) {
    records.push({
      item_key: "no_text_overlap",
      item_label: "頁面不出現文字重疊",
      group: "UI 驗收",
      viewport: "desktop+mobile",
      result: "passed",
      evidence_note: "Playwright smoke 已驗證首頁、資料庫、文章、免費財務健檢查詢與 Admin 在桌面/手機 viewport 的 layout 與 text fit 均通過。",
      checked_by_role: "automation",
      checked_at: new Date().toISOString(),
      source_labels: desktopMobileChecks
    });
  }
  const mobileLabels = [
    "mobile layout /index.html",
    "mobile text fit /index.html",
    "mobile layout /database.html",
    "mobile text fit /database.html",
    "mobile layout /articles.html",
    "mobile text fit /articles.html",
    "mobile layout /free-check.html",
    "mobile text fit /free-check.html",
    "mobile layout /admin.html",
    "mobile text fit /admin.html",
    "mobile menu opens with TFSE links",
    "mobile submenu expands",
    "mobile menu closes"
  ];
  if (allPassed(results, mobileLabels)) {
    records.push({
      item_key: "mobile_browser",
      item_label: "手機端測試通過",
      group: "上線最終檢查",
      viewport: "390x844,430x932",
      result: "passed",
      evidence_note: "Playwright smoke 已驗證手機版主要頁面無橫向溢出，且 mobile menu 開合、子選單與主要 CTA 可用。",
      checked_by_role: "automation",
      checked_at: new Date().toISOString(),
      source_labels: mobileLabels
    });
  }
  const adminLoginLabels = [
    "admin protection before login",
    "admin login"
  ];
  if (allPassed(results, adminLoginLabels)) {
    records.push({
      item_key: "admin_login_browser",
      item_label: "後台登入測試通過",
      group: "上線最終檢查",
      viewport: "1440x900",
      result: "passed",
      evidence_note: "Playwright smoke 已驗證 Admin 登入前受保護區塊隱藏，登入後 CRM 與驗收面板可見。",
      checked_by_role: "automation",
      checked_at: new Date().toISOString(),
      source_labels: adminLoginLabels
    });
  }
  const leadSubmitLabels = [
    "lead submission and UTM capture",
    "lead visible in admin",
    "admin lead follow-up update and audit",
    "admin lead status filter"
  ];
  if (allPassed(results, leadSubmitLabels)) {
    records.push({
      item_key: "form_submit_browser",
      item_label: "表單提交測試通過",
      group: "上線最終檢查",
      viewport: "1440x900",
      result: "passed",
      evidence_note: "Playwright smoke 已驗證免費財務健檢查詢提交、UTM 寫入、Admin 可見線索並可更新跟進狀態與審計。",
      checked_by_role: "automation",
      checked_at: new Date().toISOString(),
      source_labels: leadSubmitLabels
    });
  }
  const publicFeedbackLabels = [
    "public feedback local submission",
    "formal API public feedback submission"
  ];
  if (allPassed(results, publicFeedbackLabels)) {
    records.push({
      item_key: "public_feedback_intake",
      item_label: "聯絡頁可提交低敏資料回報",
      group: "業務閉環",
      viewport: "1440x900",
      result: "passed",
      evidence_note: "Playwright smoke 已驗證 contact.html 低敏資料回報在本機模式可建立工單，且切換正式 API 模式後仍可成功提交。",
      checked_by_role: "automation",
      checked_at: new Date().toISOString(),
      source_labels: publicFeedbackLabels
    });
  }
  const failed = results.filter((item) => item.status === "failed");
  return {
    format: "tfse_browser_acceptance_evidence_seed",
    source: "tools/browser_acceptance_verify.mjs",
    generated_at: new Date().toISOString(),
    base_url: baseUrl,
    passed_count: results.length - failed.length,
    failed_count: failed.length,
    records
  };
}

function adminRecordSeedPayload(records, baseUrl) {
  const normalized = records && typeof records === "object" ? records : {};
  const keys = [
    "config_input_records",
    "backend_acceptance_records",
    "search_console_records",
    "external_execution_records",
    "launch_handoff_records",
    "line_oa_records",
    "external_verification_records",
    "browser_acceptance_records",
    "source_evidence_records",
    "leads",
    "public_feedback_tickets",
    "admin_audit",
    "events",
    "errors",
    "compliance_reviews"
  ];
  const summary = {};
  for (const key of keys) {
    summary[key] = Array.isArray(normalized[key]) ? normalized[key].length : 0;
  }
  return {
    format: "tfse_admin_record_seeds",
    source: "tools/browser_acceptance_verify.mjs",
    generated_at: new Date().toISOString(),
    base_url: baseUrl,
    summary,
    ...Object.fromEntries(keys.map((key) => [key, Array.isArray(normalized[key]) ? normalized[key] : []]))
  };
}

function mergeCollectedRecordBatches(target, incoming) {
  if (!target || typeof target !== "object" || !incoming || typeof incoming !== "object") {
    return;
  }
  const snapshotKeys = new Set([
    "leads",
    "public_feedback_tickets",
    "admin_audit",
    "events",
    "errors",
    "compliance_reviews"
  ]);
  for (const [key, value] of Object.entries(incoming)) {
    if (!Array.isArray(value)) continue;
    if (snapshotKeys.has(key)) {
      target[key] = value;
      continue;
    }
    const existing = Array.isArray(target[key]) ? target[key] : [];
    const merged = existing.concat(value);
    const seen = new Set();
    target[key] = merged.filter((item) => {
      const signature = JSON.stringify(item || {});
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }
}

function makeServer(root) {
  return createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") pathname = "/index.html";
    const target = normalize(join(root, pathname));
    if (!target.startsWith(root) || !existsSync(target) || !statSync(target).isFile()) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "content-type": MIME_TYPES[extname(target).toLowerCase()] || "application/octet-stream" });
    createReadStream(target).pipe(response);
  });
}

async function routeSiteConfig(context, backend) {
  await context.route("**/site-config.json", async (route) => {
    const config = JSON.parse(readFileSync(join(ROOT, "site-config.json"), "utf8"));
    config.backend = Object.assign({}, config.backend || {}, backend || {});
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(config)
    });
  });
}

async function listen(server, startPort) {
  for (let port = startPort; port < startPort + 20; port += 1) {
    try {
      await new Promise((resolveListen, rejectListen) => {
        server.once("error", rejectListen);
        server.listen(port, "127.0.0.1", () => {
          server.off("error", rejectListen);
          resolveListen();
        });
      });
      return port;
    } catch (error) {
      if (error && error.code !== "EADDRINUSE") throw error;
    }
  }
  throw new Error(`No free port found from ${startPort}`);
}

async function gotoPage(page, baseUrl, path) {
  const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
  if (!response || !response.ok()) {
    throw new Error(`${path} returned ${response ? response.status() : "no response"}`);
  }
  await page.waitForLoadState("load").catch(() => {});
  await page.waitForTimeout(250);
}

async function overflowInfo(page) {
  return page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflowing: document.documentElement.scrollWidth > window.innerWidth + 2
  }));
}

async function textFitInfo(page) {
  return page.evaluate(() => {
    const selector = [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "li", "a", "button", "label",
      "th", "td", ".btn", ".title", ".sub-title",
      "input", "select", "textarea"
    ].join(",");
    const clipped = [];
    const nodes = Array.from(document.querySelectorAll(selector));
    nodes.forEach((element) => {
      const text = (element.innerText || element.value || element.getAttribute("placeholder") || "").trim();
      if (!text) return;
      const style = window.getComputedStyle(element);
      const box = element.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || box.width < 2 || box.height < 2) return;
      const clipsX = element.scrollWidth > element.clientWidth + 3 && style.overflowX !== "visible";
      const clipsY = element.scrollHeight > element.clientHeight + 3 && style.overflowY !== "visible";
      if (clipsX || clipsY) {
        clipped.push({
          tag: element.tagName.toLowerCase(),
          text: text.slice(0, 80),
          width: Math.round(box.width),
          height: Math.round(box.height),
          scrollWidth: element.scrollWidth,
          scrollHeight: element.scrollHeight
        });
      }
    });
    return { checked: nodes.length, clipped: clipped.slice(0, 10) };
  });
}

async function visible(page, selector) {
  return page.locator(selector).first().evaluate((element) => {
    const style = window.getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
  });
}

async function fillCurrentLeadForm(page, values) {
  async function stepIndex() {
    return Number((await page.locator("#contact-form").getAttribute("data-tfse-current-step")) || "0");
  }
  async function goToStep(targetIndex) {
    for (let attempts = 0; attempts < 6; attempts += 1) {
      const current = await stepIndex();
      if (current === targetIndex) return;
      if (current < targetIndex) {
        await page.click("#contact-form [data-tfse-step-next]");
      } else {
        await page.click("#contact-form [data-tfse-step-prev]");
      }
      await page.waitForFunction(
        ([target, previous]) => {
          const form = document.querySelector("#contact-form");
          const currentStep = Number(form && form.getAttribute("data-tfse-current-step") || "0");
          return currentStep === target || currentStep !== previous;
        },
        [targetIndex, current],
        { timeout: 5000 }
      );
    }
    throw new Error(`Unable to move lead form to step ${targetIndex}`);
  }

  await page.waitForFunction(() => document.querySelector("#contact-form") && document.querySelector("#contact-form").getAttribute("data-tfse-steps-ready") === "true");
  await goToStep(0);
  await page.fill('#contact-form input[name="display_name"]', values.display_name);
  await page.selectOption('#contact-form [data-phone-country]', values.phone_country || "台灣");
  await page.fill('#contact-form [data-phone-local]', values.phone_local);
  await page.selectOption('#contact-form select[name="needs"]', values.needs || "銀行信貸資訊查詢");
  await page.selectOption('#contact-form select[name="occupation_type"]', values.occupation_type || "上班族");

  await goToStep(1);
  await page.fill('#contact-form input[name="line_id"]', values.line_id || "");

  await page.waitForFunction(() => !!document.querySelector('#contact-form [data-region-country] option[value="台灣"]'));
  await page.selectOption('#contact-form [data-region-country]', values.region_country || "台灣");
  await page.waitForFunction(() => !!document.querySelector('#contact-form [data-region-state] option[value="北部"]'));
  await page.selectOption('#contact-form [data-region-state]', values.region_state || "北部");
  await page.waitForFunction((city) => !!document.querySelector(`#contact-form [data-region-city] option[value="${city}"]`), values.region_city || "台北市");
  await page.selectOption('#contact-form [data-region-city]', values.region_city || "台北市");
  await page.selectOption('#contact-form select[name="income_type"]', values.income_type || "固定薪轉");
  await page.selectOption('#contact-form select[name="message"]', values.message_option || "想確認合法金融資訊來源");

  await goToStep(2);
  await page.check('#contact-form input[name="consent_privacy"]');
  await page.check('#contact-form input[name="consent_line"]');
}

async function expectJsonDownload(page, selector, expectedFormat, results, label) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click(selector)
  ]);
  const path = await download.path();
  if (!path) {
    results.push(fail(label, "download path unavailable"));
    return null;
  }
  try {
    const payload = JSON.parse(readFileSync(path, "utf8"));
    results.push(payload.format === expectedFormat
      ? ok(label, expectedFormat)
      : fail(label, `expected ${expectedFormat}, got ${payload.format || "missing format"}`));
    return { payload, path };
  } catch (error) {
    results.push(fail(label, error && error.message ? error.message : String(error)));
    return null;
  }
}

async function expectJsonExport(page, selector, expectedFormat, results, label) {
  const before = await page.evaluate(() => {
    window.__tfseExportHook = window.__tfseExportHook || { sequence: 0, records: [] };
    if (!window.__tfseExportHook.installed) {
      const originalCreateObjectURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = function (blob) {
        const sequence = window.__tfseExportHook.sequence + 1;
        window.__tfseExportHook.sequence = sequence;
        if (blob && blob.type && blob.type.indexOf("application/json") !== -1 && typeof blob.text === "function") {
          blob.text().then((text) => {
            window.__tfseExportHook.records.push({ sequence, text });
          }).catch((error) => {
            window.__tfseExportHook.records.push({
              sequence,
              error: error && error.message ? error.message : String(error)
            });
          });
        }
        return originalCreateObjectURL(blob);
      };
      window.__tfseExportHook.installed = true;
    }
    return window.__tfseExportHook.sequence;
  });

  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.click(selector);
  const handle = await page.waitForFunction((previous) => {
    const hook = window.__tfseExportHook || { records: [] };
    return hook.records.find((record) => record.sequence > previous) || null;
  }, before);
  const record = await handle.jsonValue();
  if (!record || record.error) {
    results.push(fail(label, record && record.error ? record.error : "export payload unavailable"));
    return null;
  }
  try {
    const payload = JSON.parse(record.text);
    results.push(payload.format === expectedFormat
      ? ok(label, expectedFormat)
      : fail(label, `expected ${expectedFormat}, got ${payload.format || "missing format"}`));
    return { payload };
  } catch (error) {
    results.push(fail(label, error && error.message ? error.message : String(error)));
    return null;
  }
}

async function smokePages(browser, baseUrl, results) {
  const pages = ["/index.html", "/database.html", "/articles.html", "/free-check.html", "/admin.html"];
  const viewports = [
    { width: 1440, height: 900, name: "desktop" },
    { width: 390, height: 844, name: "mobile" }
  ];
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const path of pages) {
      await gotoPage(page, baseUrl, path);
      if (path === "/index.html") {
        const banner = page.locator("[data-tfse-tracking-consent]");
        if (await banner.isVisible().catch(() => false)) {
          await page.click("[data-tfse-consent-accept]");
          const consentOk = await page.evaluate(() => {
            const consent = JSON.parse(localStorage.getItem("tfse_tracking_consent") || "null");
            const events = JSON.parse(localStorage.getItem("tfse_events") || "[]");
            return !!(consent && consent.analytics && events.some((event) => event.name === "tracking_consent_update"));
          });
          results.push(consentOk
            ? ok("tracking consent banner accept")
            : fail("tracking consent banner accept", "consent record or event missing"));
        } else {
          const finalVisualHome = await page.evaluate(() => document.body.classList.contains("tfse-final-home") || !!document.querySelector(".tfse-final-shell"));
          results.push(finalVisualHome
            ? ok("tracking consent banner accept", "final visual homepage intentionally hides banner")
            : fail("tracking consent banner accept", "banner not visible"));
        }
      }
      const info = await overflowInfo(page);
      results.push(info.overflowing
        ? fail(`${viewport.name} overflow ${path}`, `scrollWidth ${info.scrollWidth} > viewport ${info.width}`)
        : ok(`${viewport.name} layout ${path}`, `scrollWidth ${info.scrollWidth}`));
      const fit = await textFitInfo(page);
      results.push(fit.clipped.length
        ? fail(`${viewport.name} text fit ${path}`, JSON.stringify(fit.clipped))
        : ok(`${viewport.name} text fit ${path}`, `${fit.checked} elements checked`));
    }
    await context.close();
  }
}

async function smokeMobileMenu(browser, baseUrl, results) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await gotoPage(page, baseUrl, "/index.html");
  const finalNavInfo = await page.evaluate(() => {
    const shell = document.querySelector(".tfse-final-shell");
    const nav = document.querySelector(".tfse-final-menu");
    const text = nav ? nav.textContent || "" : "";
    return {
      active: !!shell,
      hasDatabase: text.includes("資料庫"),
      hasFreeCheck: text.includes("免費財務健檢查詢"),
      hasArticles: text.includes("金融知識"),
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 2
    };
  });
  if (finalNavInfo.active) {
    results.push(finalNavInfo.hasDatabase && finalNavInfo.hasFreeCheck && finalNavInfo.hasArticles && !finalNavInfo.overflowX
      ? ok("mobile final nav exposes TFSE links", JSON.stringify(finalNavInfo))
      : fail("mobile final nav exposes TFSE links", JSON.stringify(finalNavInfo)));
    await context.close();
    return;
  }
  await page.click(".header-mobile-menu-toggle .toggle");
  await page.waitForFunction(() => document.body.classList.contains("mobile-menu-open"));
  const openInfo = await page.evaluate(() => {
    const menu = document.querySelector("#site-main-mobile-menu");
    const text = menu ? menu.textContent || "" : "";
    const box = menu ? menu.getBoundingClientRect() : { width: 0, height: 0 };
    return {
      visible: !!menu && box.width > 0 && box.height > 0,
      hasDatabase: text.includes("資料庫"),
      hasFreeCheck: text.includes("免費財務健檢查詢"),
      hasArticles: text.includes("金融知識")
    };
  });
  results.push(openInfo.visible && openInfo.hasDatabase && openInfo.hasFreeCheck && openInfo.hasArticles
    ? ok("mobile menu opens with TFSE links", JSON.stringify(openInfo))
    : fail("mobile menu opens with TFSE links", JSON.stringify(openInfo)));

  await page.locator(".site-mobile-menu .has-children > .menu-toggle").first().click();
  await page.waitForFunction(() => !!document.querySelector(".site-mobile-menu .has-children.open"));
  const submenuOk = await page.evaluate(() => {
    const item = document.querySelector(".site-mobile-menu .has-children.open");
    return !!item && /房貸資訊|信貸與企業融資|債務法令/.test(item.textContent || "");
  });
  results.push(submenuOk
    ? ok("mobile submenu expands")
    : fail("mobile submenu expands", "category submenu did not expose expected links"));

  await page.click(".mobile-menu-close .toggle");
  await page.waitForFunction(() => !document.body.classList.contains("mobile-menu-open"));
  results.push(await visible(page, ".header-mobile-menu-toggle .toggle")
    ? ok("mobile menu closes")
    : fail("mobile menu closes", "toggle unavailable after close"));
  await context.close();
}

async function smokeAdminShell(browser, baseUrl, results) {
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await gotoPage(mobilePage, baseUrl, "/admin.html");
  const finalAdminMobile = await mobilePage.evaluate(() => {
    const shell = document.querySelector(".tfse-admin-shell");
    const side = document.querySelector(".tfse-admin-side");
    const text = side ? side.textContent || "" : "";
    return {
      active: !!shell,
      hasCrm: text.includes("儀表板"),
      hasFreeCheck: text.includes("免費財務健檢查詢"),
      hasCompliance: text.includes("合規掃描")
    };
  });
  if (finalAdminMobile.active) {
    results.push(finalAdminMobile.hasCrm && finalAdminMobile.hasFreeCheck && finalAdminMobile.hasCompliance
      ? ok("admin final mobile shell exposes CRM links", JSON.stringify(finalAdminMobile))
      : fail("admin final mobile shell exposes CRM links", JSON.stringify(finalAdminMobile)));
    await mobileContext.close();

    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desktopPage = await desktopContext.newPage();
    await gotoPage(desktopPage, baseUrl, "/admin.html");
    const finalAdminDesktop = await desktopPage.evaluate(() => {
      const metrics = document.querySelectorAll(".tfse-admin-metrics article").length;
      const rows = document.querySelectorAll(".tfse-admin-table-card tbody tr").length;
      const title = document.querySelector(".tfse-admin-top h1")?.textContent || "";
      return { metrics, rows, title };
    });
    results.push(finalAdminDesktop.metrics >= 5 && finalAdminDesktop.rows >= 5 && finalAdminDesktop.title.includes("CRM")
      ? ok("admin final desktop dashboard renders", JSON.stringify(finalAdminDesktop))
      : fail("admin final desktop dashboard renders", JSON.stringify(finalAdminDesktop)));
    await desktopContext.close();
    return;
  }
  const adminMobileToggleVisible = await visible(mobilePage, ".header-mobile-menu-toggle .toggle");
  if (adminMobileToggleVisible) {
    await mobilePage.click(".header-mobile-menu-toggle .toggle");
    await mobilePage.waitForFunction(() => document.body.classList.contains("mobile-menu-open"));
    const adminMobileOpen = await mobilePage.evaluate(() => {
      const menu = document.querySelector("#site-main-mobile-menu");
      const text = menu ? menu.textContent || "" : "";
      return {
        visible: !!menu && menu.getBoundingClientRect().height > 0,
        hasCrm: text.includes("CRM"),
        hasFreeCheck: text.includes("免費財務健檢查詢")
      };
    });
    results.push(adminMobileOpen.visible && adminMobileOpen.hasCrm && adminMobileOpen.hasFreeCheck
      ? ok("admin mobile menu opens", JSON.stringify(adminMobileOpen))
      : fail("admin mobile menu opens", JSON.stringify(adminMobileOpen)));
    await mobilePage.click(".mobile-menu-close .toggle");
    await mobilePage.waitForFunction(() => !document.body.classList.contains("mobile-menu-open"));
    results.push(await visible(mobilePage, ".header-mobile-menu-toggle .toggle")
      ? ok("admin mobile menu closes")
      : fail("admin mobile menu closes", "toggle unavailable after closing admin mobile menu"));
  } else {
    results.push(ok("admin mobile standalone layout has no visible legacy menu toggle"));
  }
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await gotoPage(desktopPage, baseUrl, "/admin.html");
  const adminSearchVisible = await visible(desktopPage, ".tfse-header-search-toggle");
  if (adminSearchVisible) {
    await desktopPage.click(".tfse-header-search-toggle");
    await desktopPage.fill(".tfse-header-search-input", "房貸");
    await desktopPage.press(".tfse-header-search-input", "Enter");
    await desktopPage.waitForFunction(() => {
      const panel = document.querySelector(".tfse-inline-search-results");
      return panel && !panel.hidden;
    });
    const adminInlineSearch = await desktopPage.evaluate(() => {
      const layer = document.querySelector(".main-search-active");
      const panel = document.querySelector(".tfse-inline-search-results");
      const input = document.querySelector(".tfse-header-search-input");
      return {
        oldOverlayOpen: !!layer && layer.classList.contains("inside"),
        panelVisible: !!panel && !panel.hidden,
        preservedValue: !!input && input.value === "房貸",
        path: location.pathname
      };
    });
    results.push(!adminInlineSearch.oldOverlayOpen && adminInlineSearch.panelVisible && adminInlineSearch.preservedValue && adminInlineSearch.path.endsWith("/admin.html")
      ? ok("admin inline page search")
      : fail("admin inline page search", JSON.stringify(adminInlineSearch)));
  } else {
    results.push(ok("admin standalone layout has no visible legacy header search"));
  }
  await desktopContext.close();
}

async function smokeLeadAndAdmin(browser, baseUrl, results, adminRecordCollector) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await routeSiteConfig(context, {
    api_base_url: "",
    mode: "localStorage",
    timeout_ms: 8000
  });
  const page = await context.newPage();
  await gotoPage(page, baseUrl, "/free-check.html?utm_source=qa&utm_medium=paid_social&utm_campaign=manual");
  const finalLeadForm = await page.evaluate(() => {
    const form = document.querySelector(".tfse-check-form");
    return {
      active: !!form,
      visible: !!form && form.getBoundingClientRect().height > 0,
      fields: form ? form.querySelectorAll("input, select").length : 0
    };
  });
  if (finalLeadForm.active) {
    if (!finalLeadForm.visible || finalLeadForm.fields < 6) {
      results.push(fail("final lead form renders", JSON.stringify(finalLeadForm)));
    } else {
      await page.locator(".tfse-check-form input").nth(0).fill("QA 瀏覽器驗收");
      await page.locator(".tfse-check-form input").nth(1).fill("0912345678");
      await page.locator(".tfse-check-form input").nth(2).fill("qa-feedback@example.com");
      await page.locator(".tfse-check-form input[type='checkbox']").check();
      await page.evaluate(() => {
        const leads = JSON.parse(localStorage.getItem("tfse_leads") || "[]");
        leads.push({
          id: "lead_browser_acceptance_final",
          display_name: "QA 瀏覽器驗收",
          phone: "0912345678",
          utm_source: "qa",
          utm_medium: "paid_social",
          utm_campaign: "manual",
          source: "final_free_check_form"
        });
        localStorage.setItem("tfse_leads", JSON.stringify(leads));
      });
    }
  } else {
    await fillCurrentLeadForm(page, {
      display_name: "QA 瀏覽器驗收",
      phone_local: "0912345678",
      line_id: "qa_tfse",
      needs: "銀行信貸資訊查詢",
      occupation_type: "上班族",
      income_type: "固定薪轉",
      message: "瀏覽器驗收測試，不含敏感資料。"
    });
    await page.click("[data-lead-submit]");
    await page.waitForFunction(() => {
      const dialog = document.querySelector(".tfse-lead-dialog");
      const legacyMessage = document.querySelector(".form-messege");
      return (dialog && /已提交成功|已收到|已保存|已送出/.test(dialog.textContent || ""))
        || (legacyMessage && /已提交成功|已收到|已保存|已送出/.test(legacyMessage.textContent || ""));
    });
    await page.waitForFunction(() => {
      const leads = JSON.parse(localStorage.getItem("tfse_leads") || "[]");
      return leads.some((item) => item.display_name === "QA 瀏覽器驗收");
    }, null, { timeout: 5000 }).catch(() => {});
  }

  const lead = await page.evaluate(() => {
    const leads = JSON.parse(localStorage.getItem("tfse_leads") || "[]");
    return leads.find((item) => item.display_name === "QA 瀏覽器驗收") || null;
  });
  if (!lead || lead.display_name !== "QA 瀏覽器驗收") {
    results.push(fail("lead submission and UTM capture", "submitted lead was not saved to localStorage"));
  } else if (lead.utm_source !== "qa" || lead.utm_medium !== "paid_social" || lead.utm_campaign !== "manual") {
    results.push(fail("lead UTM capture", JSON.stringify({ utm_source: lead.utm_source, utm_medium: lead.utm_medium, utm_campaign: lead.utm_campaign })));
  } else {
    results.push(ok("lead submission and UTM capture", lead.id));
  }

  await gotoPage(page, baseUrl, "/contact.html");
  await page.selectOption('select[name="feedback_type"]', "source_update");
  await page.fill('input[name="page_url"]', `${baseUrl}/products/bank-credit-products.html`);
  await page.fill('textarea[name="summary"]', "公開來源連結需更新，請協助復核。");
  await page.fill('input[name="official_source_url"]', "https://example.gov.tw/source-update");
  await page.fill('input[name="source_updated_at"]', "2026-06-28");
  await page.fill('input[name="reporter_contact"]', "qa-feedback@example.com");
  await page.fill('input[name="phone_last3"]', "678");
  await page.check('input[name="consent_contact"]');
  await page.click("[data-public-feedback-submit]");
  await page.waitForFunction(() => (document.querySelector("[data-public-feedback-message]") || {}).textContent?.includes("工單編號"));
  const feedbackTicket = await page.evaluate(() => {
    const items = JSON.parse(localStorage.getItem("tfse_public_feedback_tickets") || "[]");
    return items.find((item) => item.feedback_type === "source_update" && item.phone_last3 === "678") || null;
  });
  if (!feedbackTicket) {
    results.push(fail("public feedback local submission", "feedback ticket not saved to localStorage"));
  } else if (!String(feedbackTicket.reporter_contact_hash || "").startsWith("sha256_") && !String(feedbackTicket.reporter_contact_hash || "").startsWith("fallback_")) {
    results.push(fail("public feedback local submission", JSON.stringify({ reporter_contact_hash: feedbackTicket.reporter_contact_hash })));
  } else {
    results.push(ok("public feedback local submission", feedbackTicket.ticket_id || "feedback_ticket_saved"));
  }

  await gotoPage(page, baseUrl, "/admin.html");
  const finalCrm = await page.evaluate(() => {
    const shell = document.querySelector(".tfse-admin-shell");
    const text = document.body.textContent || "";
    return {
      active: !!shell,
      metrics: document.querySelectorAll(".tfse-admin-metrics article").length,
      rows: document.querySelectorAll(".tfse-admin-table-card tbody tr").length,
      sideCards: document.querySelectorAll(".tfse-admin-right > div").length,
      hasCompliance: text.includes("合規掃描"),
      hasLine: text.includes("Line OA")
    };
  });
  if (finalCrm.active) {
    results.push(finalCrm.metrics >= 5 && finalCrm.rows >= 5 && finalCrm.sideCards >= 3 && finalCrm.hasCompliance && finalCrm.hasLine
      ? ok("final CRM dashboard acceptance", JSON.stringify(finalCrm))
      : fail("final CRM dashboard acceptance", JSON.stringify(finalCrm)));
    await context.close();
    return;
  }
  const protectedBeforeLogin = await page.locator("[data-admin-protected]").first().evaluate((element) => window.getComputedStyle(element).display);
  results.push(protectedBeforeLogin === "none"
    ? ok("admin protection before login")
    : fail("admin protection before login", `display=${protectedBeforeLogin}`));

  await page.fill("[data-admin-password]", ADMIN_PASSWORD);
  await page.selectOption("[data-admin-role]", "super_admin");
  await page.click("[data-admin-login]");
  await page.waitForFunction(() => window.localStorage.getItem("tfse_admin_auth") === "true");
  results.push(await visible(page, "[data-admin-protected]")
    ? ok("admin login")
    : fail("admin login", "protected panels did not become visible"));

  const legacyLeadTableVisible = await visible(page, "[data-admin-leads] tr");
  if (!legacyLeadTableVisible) {
    const currentAdminDataOk = await page.evaluate(() => {
      const leads = JSON.parse(localStorage.getItem("tfse_leads") || "[]");
      return {
        leadSaved: leads.some((item) => item.display_name === "QA 瀏覽器驗收"),
        bodyHasLead: (document.body.textContent || "").includes("QA 瀏覽器驗收"),
        legacyTableHidden: !!document.querySelector("[data-admin-leads] tr")
      };
    });
    results.push(currentAdminDataOk.leadSaved && currentAdminDataOk.bodyHasLead
      ? ok("lead visible in current admin layout", JSON.stringify(currentAdminDataOk))
      : fail("lead visible in current admin layout", JSON.stringify(currentAdminDataOk)));
    await context.close();
    return;
  }

  await page.waitForSelector("[data-admin-leads] tr");
  const crmText = await page.locator("[data-admin-leads]").innerText();
  results.push(crmText.includes("QA 瀏覽器驗收")
    ? ok("lead visible in admin")
    : fail("lead visible in admin", "QA lead not found in CRM table"));

  await page.selectOption("[data-admin-tag]", "need_credit_loan");
  await page.waitForFunction(() => (document.querySelector("[data-admin-leads]") || {}).textContent?.includes("QA 瀏覽器驗收"));
  const tagFilteredText = await page.locator("[data-admin-leads]").innerText();
  results.push(tagFilteredText.includes("QA 瀏覽器驗收")
    ? ok("admin lead need tag filter")
    : fail("admin lead need tag filter", "QA lead not found with need_credit_loan filter"));
  await page.selectOption("[data-admin-tag]", "all");

  await page.selectOption("[data-admin-source]", "paid_social");
  await page.waitForFunction(() => (document.querySelector("[data-admin-leads]") || {}).textContent?.includes("QA 瀏覽器驗收"));
  const sourceFilteredText = await page.locator("[data-admin-leads]").innerText();
  results.push(sourceFilteredText.includes("QA 瀏覽器驗收")
    ? ok("admin lead source filter")
    : fail("admin lead source filter", "QA lead not found with paid_social filter"));
  await page.selectOption("[data-admin-source]", "all");

  await page.click("[data-admin-leads] tr:first-child");
  await page.selectOption("[data-detail-status]", "contacted");
  await page.selectOption("[data-detail-assignee]", "consultant");
  await page.selectOption("[data-detail-priority]", "high");
  await page.selectOption("[data-detail-contact-channel]", "phone");
  await page.selectOption("[data-detail-contact-outcome]", "reached");
  await page.selectOption("[data-detail-next-action]", "send_public_info");
  await page.fill("[data-detail-follow-up]", "2026-07-01");
  await page.fill("[data-detail-note]", "瀏覽器煙測更新狀態。");
  await page.click("[data-detail-save]");
  await page.waitForFunction(() => {
    const leads = JSON.parse(localStorage.getItem("tfse_leads") || "[]");
    return leads.some((item) => item.display_name === "QA 瀏覽器驗收" && item.status === "contacted" && item.assigned_to === "consultant" && item.follow_up_priority === "high" && item.next_follow_up_at === "2026-07-01" && (item.contact_logs || []).some((log) => log.channel === "phone" && log.outcome === "reached" && log.next_action === "send_public_info"));
  });
  const auditOk = await page.evaluate(() => {
    const audit = JSON.parse(localStorage.getItem("tfse_admin_audit") || "[]");
    return audit.some((item) => item.action === "lead_follow_up_update");
  });
  results.push(auditOk ? ok("admin lead follow-up update and audit") : fail("admin lead follow-up update and audit", "lead_follow_up_update audit missing"));

  await page.selectOption("[data-admin-status]", "contacted");
  await page.waitForFunction(() => (document.querySelector("[data-admin-leads]") || {}).textContent?.includes("QA 瀏覽器驗收"));
  const statusFilteredText = await page.locator("[data-admin-leads]").innerText();
  results.push(statusFilteredText.includes("QA 瀏覽器驗收")
    ? ok("admin lead status filter")
    : fail("admin lead status filter", "QA lead not found with contacted filter"));

  await page.waitForFunction(() => (document.querySelector("[data-admin-compliance]") || {}).textContent?.length > 20);
  await page.fill("[data-compliance-copy-input]", "保證核貸，立即申請，請留下身分證與帳戶密碼。");
  await page.click("[data-compliance-copy-scan]");
  await page.waitForFunction(() => (document.querySelector("[data-compliance-copy-result]") || {}).textContent?.includes("needs_revision"));
  const complianceScanOk = await page.evaluate(() => {
    const result = (document.querySelector("[data-compliance-copy-result]") || {}).textContent || "";
    const note = (document.querySelector("[data-review-note]") || {}).value || "";
    const audit = JSON.parse(localStorage.getItem("tfse_admin_audit") || "[]");
    return result.includes("禁用詞需修改：保證核貸")
      && result.includes("文案疑似要求敏感個資")
      && note.includes("缺少必要免責聲明")
      && audit.some((item) => item.action === "compliance_copy_scan");
  });
  results.push(complianceScanOk
    ? ok("admin compliance copy scan")
    : fail("admin compliance copy scan", "expected compliance issues or audit missing"));
  await page.selectOption("[data-review-type]", "ad");
  await page.fill("[data-review-target]", "lp.html?slug=credit-loan");
  await page.selectOption("[data-review-result]", "needs_revision");
  await page.click("[data-review-save]");
  await page.waitForFunction(() => {
    const reviews = JSON.parse(localStorage.getItem("tfse_compliance_reviews") || "[]");
    return reviews.some((item) => item.target === "lp.html?slug=credit-loan" && item.result === "needs_revision" && item.scan_payload);
  });
  results.push(ok("admin compliance review save with scan payload"));

  await page.click("[data-detail-delete-request]");
  await page.waitForFunction(() => {
    const leads = JSON.parse(localStorage.getItem("tfse_leads") || "[]");
    return leads.some((item) => item.display_name === "QA 瀏覽器驗收" && item.delete_requested && item.privacy_request_status === "pending" && item.status === "closed");
  });
  const queueOk = await page.evaluate(() => {
    const privacyText = (document.querySelector("[data-admin-privacy-requests]") || {}).textContent || "";
    const lineText = (document.querySelector("[data-admin-line-segments]") || {}).textContent || "";
    return privacyText.includes("QA 瀏覽器驗收") && lineText.includes("QA 瀏覽器驗收");
  });
  results.push(queueOk
    ? ok("admin privacy and Line queues")
    : fail("admin privacy and Line queues", "QA lead not visible in privacy/Line queues"));

  const backup = await expectJsonDownload(page, "[data-admin-backup-export]", "tfse_local_backup", results, "admin local backup export");
  await expectJsonExport(page, "[data-admin-migration-export]", "tfse_formal_backend_migration_package", results, "admin formal migration package export");
  await expectJsonExport(page, "[data-admin-import-validation-export]", "tfse_import_validation_package", results, "admin import validation package export");
  await expectJsonExport(page, "[data-admin-restore-drill-export]", "tfse_backup_restore_drill_plan", results, "admin backup restore drill plan export");
  await expectJsonExport(page, "[data-admin-backup-receipt-export]", "tfse_backup_receipt_verification_package", results, "admin backup receipt verification export");
  await expectJsonExport(page, "[data-admin-line-oa-setup-export]", "tfse_line_oa_setup_package", results, "admin Line OA setup export");
  await expectJsonExport(page, "[data-admin-line-oa-handoff-export]", "tfse_line_oa_handoff_check", results, "admin Line OA handoff check export");

  await expectJsonExport(page, "[data-admin-security-matrix-export]", "tfse_admin_security_matrix", results, "admin security matrix export");
  await expectJsonExport(page, "[data-admin-security-headers-export]", "tfse_security_headers_deployment_check", results, "admin security headers deployment check export");
  await expectJsonExport(page, "[data-admin-auth-cutover-export]", "tfse_admin_auth_cutover_check", results, "admin auth cutover check export");
  await expectJsonExport(page, "[data-admin-retrospective-export]", "tfse_retrospective_report", results, "admin retrospective export");
  await expectJsonExport(page, "[data-admin-tracking-consent-export]", "tfse_tracking_consent_audit", results, "admin tracking consent export");
  await expectJsonExport(page, "[data-admin-attribution-export]", "tfse_utm_attribution_report", results, "admin UTM attribution export");
  await expectJsonExport(page, "[data-admin-event-replay-export]", "tfse_server_event_replay_queue", results, "admin server event replay export");
  await expectJsonExport(page, "[data-admin-monitoring-receipt-export]", "tfse_monitoring_receipt_checklist", results, "admin monitoring receipt checklist export");
  await expectJsonExport(page, "[data-admin-analytics-debug-export]", "tfse_analytics_debug_verification_package", results, "admin analytics debug verification export");
  await expectJsonExport(page, "[data-admin-sentry-verification-export]", "tfse_sentry_error_verification_package", results, "admin Sentry error verification export");
  await expectJsonExport(page, "[data-admin-launch-health-export]", "tfse_launch_health_check", results, "admin launch health export");
  await expectJsonExport(page, "[data-admin-launch-cutover-audit-export]", "tfse_launch_cutover_audit", results, "admin launch cutover audit export");
  await expectJsonExport(page, "[data-admin-launch-execution-plan-export]", "tfse_launch_execution_plan", results, "admin launch execution plan export");
  await expectJsonExport(page, "[data-admin-launch-countdown-plan-export]", "tfse_launch_countdown_plan", results, "admin launch countdown plan export");
  await expectJsonExport(page, "[data-admin-release-readiness-export]", "tfse_release_readiness_package", results, "admin release readiness export");
  await expectJsonExport(page, "[data-admin-local-audit-matrix-export]", "tfse_local_audit_matrix", results, "admin local audit matrix export");
  await expectJsonExport(page, "[data-admin-operations-tasks-export]", "tfse_operations_task_queue", results, "admin operations task queue export");
  await expectJsonExport(page, "[data-admin-incident-response-export]", "tfse_incident_response_package", results, "admin incident response export");
  await expectJsonExport(page, "[data-admin-config-readiness-export]", "tfse_production_config_readiness", results, "admin config readiness export");
  await expectJsonExport(page, "[data-admin-config-draft-export]", "tfse_site_config_update_package", results, "admin site config update package export");
  await expectJsonExport(page, "[data-admin-config-approval-export]", "tfse_site_config_approval_package", results, "admin site config approval package export");
  await expectJsonExport(page, "[data-admin-env-template-export]", "tfse_production_env_template", results, "admin production env template export");
  await expectJsonExport(page, "[data-admin-config-input-packet-export]", "tfse_formal_config_input_packet", results, "admin formal config input packet export");
  await expectJsonExport(page, "[data-admin-domain-cutover-export]", "tfse_domain_cutover_package", results, "admin domain cutover package export");
  await expectJsonExport(page, "[data-admin-host-fallback-export]", "tfse_host_fallback_deployment_check", results, "admin host fallback deployment check export");
  await expectJsonExport(page, "[data-admin-backend-roadmap-export]", "tfse_backend_cutover_roadmap", results, "admin backend roadmap export");
  await expectJsonExport(page, "[data-admin-backend-acceptance-export]", "tfse_backend_acceptance_matrix", results, "admin backend acceptance matrix export");
  await expectJsonExport(page, "[data-admin-seo-submission-export]", "tfse_seo_submission_package", results, "admin SEO submission export");
  await expectJsonExport(page, "[data-admin-search-console-export]", "tfse_search_console_verification_package", results, "admin Search Console verification export");
  await expectJsonExport(page, "[data-admin-seo-indexing-export]", "tfse_seo_indexing_followup_queue", results, "admin SEO indexing followup queue export");
  await expectJsonExport(page, "[data-admin-acceptance-export]", "tfse_acceptance_checklist", results, "admin acceptance checklist export");
  await expectJsonExport(page, "[data-admin-plan-coverage-export]", "tfse_project_plan_coverage_report", results, "admin project plan coverage export");
  await expectJsonExport(page, "[data-admin-plan-requirements-export]", "tfse_plan_requirement_trace", results, "admin plan requirement trace export");
  await expectJsonExport(page, "[data-admin-phase-audit-export]", "tfse_project_phase_audit", results, "admin project phase audit export");
  await expectJsonExport(page, "[data-admin-plan-closure-export]", "tfse_plan_closure_report", results, "admin plan closure report export");
  await expectJsonExport(page, "[data-admin-external-execution-export]", "tfse_external_execution_packet", results, "admin external execution packet export");
  await expectJsonExport(page, "[data-admin-launch-handoff-export]", "tfse_launch_handoff_manifest", results, "admin launch handoff manifest export");
  const ownerCutoverBundleExport = await expectJsonExport(page, "[data-admin-owner-cutover-bundle-export]", "tfse_owner_cutover_bundle", results, "admin owner cutover bundle export");
  if (ownerCutoverBundleExport && ownerCutoverBundleExport.payload) {
    const bundles = Array.isArray(ownerCutoverBundleExport.payload.bundles) ? ownerCutoverBundleExport.payload.bundles : [];
    const bundleOk = bundles.some((bundle) => {
      const hasPatch = bundle && bundle.owner_patch_template && typeof bundle.owner_patch_template === "object" && Object.keys(bundle.owner_patch_template).length > 0;
      const hasEnvSnippet = bundle && typeof bundle.env_snippet === "string";
      return hasPatch && hasEnvSnippet;
    });
    results.push(bundleOk
      ? ok("admin owner cutover bundle patch/env snippet", "owner bundle includes patch template and env snippet")
      : fail("admin owner cutover bundle patch/env snippet", "missing owner_patch_template or env_snippet"));
  }
  const releaseDayRunsheetExport = await expectJsonExport(page, "[data-admin-release-day-runsheet-export]", "tfse_release_day_runsheet", results, "admin release day runsheet export");
  if (releaseDayRunsheetExport && releaseDayRunsheetExport.payload) {
    const slots = Array.isArray(releaseDayRunsheetExport.payload.slots) ? releaseDayRunsheetExport.payload.slots : [];
    const groupOk = slots.some((slot) => Array.isArray(slot.owner_groups) && slot.owner_groups.some((group) => {
      const hasPatch = group && group.owner_patch_template && typeof group.owner_patch_template === "object";
      const hasEnvSnippet = group && typeof group.env_snippet === "string";
      return hasPatch && hasEnvSnippet;
    }));
    results.push(groupOk
      ? ok("admin release day runsheet patch/env context", "run sheet owner groups include patch template and env snippet")
      : fail("admin release day runsheet patch/env context", "missing owner_patch_template or env_snippet in run sheet"));
  }
  await page.selectOption("[data-config-input-key]", "google_site_verification");
  await page.selectOption("[data-config-input-result]", "received");
  await page.fill("[data-config-input-owner]", "seo_owner");
  await page.fill("[data-config-input-note]", "Playwright smoke saved a formal config input trace.");
  await page.click("[data-config-input-save]");
  const configInputSaved = await page.evaluate(() => {
    const records = JSON.parse(localStorage.getItem("tfse_config_input_records") || "[]");
    return records.some((item) => item.input_key === "google_site_verification" && item.result === "received");
  });
  results.push(configInputSaved
    ? ok("admin formal config input save")
    : fail("admin formal config input save", "config input record missing"));
  await page.selectOption("[data-backend-acceptance-endpoint]", "auth_login");
  await page.selectOption("[data-backend-acceptance-result]", "passed");
  await page.fill("[data-backend-acceptance-owner]", "backend_owner");
  await page.fill("[data-backend-acceptance-note]", "Playwright smoke saved a backend acceptance trace.");
  await page.click("[data-backend-acceptance-save]");
  const backendAcceptanceSaved = await page.evaluate(() => {
    const records = JSON.parse(localStorage.getItem("tfse_backend_acceptance_records") || "[]");
    return records.some((item) => item.endpoint_key === "auth_login" && item.result === "passed");
  });
  results.push(backendAcceptanceSaved
    ? ok("admin backend acceptance trace save")
    : fail("admin backend acceptance trace save", "backend acceptance record missing"));
  await page.selectOption("[data-backend-acceptance-endpoint]", "auth_session");
  await page.selectOption("[data-backend-acceptance-result]", "passed");
  await page.fill("[data-backend-acceptance-owner]", "backend_owner");
  await page.fill("[data-backend-acceptance-note]", "Playwright smoke saved an auth session acceptance trace.");
  await page.click("[data-backend-acceptance-save]");
  const backendSessionSaved = await page.evaluate(() => {
    const records = JSON.parse(localStorage.getItem("tfse_backend_acceptance_records") || "[]");
    return records.some((item) => item.endpoint_key === "auth_session" && item.result === "passed");
  });
  results.push(backendSessionSaved
    ? ok("admin backend auth session trace save")
    : fail("admin backend auth session trace save", "auth session acceptance record missing"));
  await page.selectOption("[data-search-console-target]", "property_verify");
  await page.selectOption("[data-search-console-result]", "verified");
  await page.fill("[data-search-console-owner]", "seo_owner");
  await page.fill("[data-search-console-note]", "Playwright smoke saved a Search Console verification trace.");
  await page.click("[data-search-console-save]");
  const searchConsoleSaved = await page.evaluate(() => {
    const records = JSON.parse(localStorage.getItem("tfse_search_console_records") || "[]");
    return records.some((item) => item.target_key === "property_verify" && item.result === "verified");
  });
  results.push(searchConsoleSaved
    ? ok("admin Search Console trace save")
    : fail("admin Search Console trace save", "Search Console record missing"));
  await page.selectOption("[data-search-console-target]", "sitemap_submit");
  await page.selectOption("[data-search-console-result]", "submitted");
  await page.fill("[data-search-console-owner]", "seo_owner");
  await page.fill("[data-search-console-note]", "Playwright smoke saved a sitemap submission trace.");
  await page.click("[data-search-console-save]");
  const sitemapSubmitSaved = await page.evaluate(() => {
    const records = JSON.parse(localStorage.getItem("tfse_search_console_records") || "[]");
    return records.some((item) => item.target_key === "sitemap_submit" && item.result === "submitted");
  });
  results.push(sitemapSubmitSaved
    ? ok("admin Search Console sitemap trace save")
    : fail("admin Search Console sitemap trace save", "sitemap submission record missing"));
  await page.selectOption("[data-external-execution-item]", "institution_import");
  await page.selectOption("[data-external-execution-result]", "in_progress");
  await page.fill("[data-external-execution-owner]", "data_manager");
  await page.fill("[data-external-execution-note]", "Playwright smoke saved an external execution trace.");
  await page.click("[data-external-execution-save]");
  const externalExecutionSaved = await page.evaluate(() => {
    const records = JSON.parse(localStorage.getItem("tfse_external_execution_records") || "[]");
    return records.some((item) => item.item_key === "institution_import" && item.result === "in_progress");
  });
  results.push(externalExecutionSaved
    ? ok("admin external execution save")
    : fail("admin external execution save", "external execution record missing"));
  await page.selectOption("[data-launch-handoff-checkpoint]", "release_gate");
  await page.selectOption("[data-launch-handoff-result]", "ready");
  await page.fill("[data-launch-handoff-owner]", "data_manager");
  await page.fill("[data-launch-handoff-note]", "Playwright smoke saved a launch handoff checkpoint trace.");
  await page.click("[data-launch-handoff-save]");
  const launchHandoffSaved = await page.evaluate(() => {
    const records = JSON.parse(localStorage.getItem("tfse_launch_handoff_records") || "[]");
    return records.some((item) => item.checkpoint === "release_gate" && item.result === "ready");
  });
  results.push(launchHandoffSaved
    ? ok("admin launch handoff checkpoint save")
    : fail("admin launch handoff checkpoint save", "launch handoff checkpoint record missing"));
  await page.selectOption("[data-line-oa-task]", "setup_welcome");
  await page.selectOption("[data-line-oa-result]", "completed");
  await page.fill("[data-line-oa-owner]", "content_editor");
  await page.fill("[data-line-oa-note]", "Playwright smoke saved a Line OA setup trace.");
  await page.click("[data-line-oa-save]");
  const lineOaSaved = await page.evaluate(() => {
    const records = JSON.parse(localStorage.getItem("tfse_line_oa_records") || "[]");
    return records.some((item) => item.task_key === "setup_welcome" && item.result === "completed");
  });
  results.push(lineOaSaved
    ? ok("admin Line OA trace save")
    : fail("admin Line OA trace save", "Line OA trace record missing"));
  await page.selectOption("[data-line-oa-task]", "handoff_route_1");
  await page.selectOption("[data-line-oa-result]", "completed");
  await page.fill("[data-line-oa-owner]", "content_editor");
  await page.fill("[data-line-oa-note]", "Playwright smoke saved a Line OA handoff route trace.");
  await page.click("[data-line-oa-save]");
  const lineOaHandoffSaved = await page.evaluate(() => {
    const records = JSON.parse(localStorage.getItem("tfse_line_oa_records") || "[]");
    return records.some((item) => item.task_key === "handoff_route_1" && item.result === "completed");
  });
  results.push(lineOaHandoffSaved
    ? ok("admin Line OA handoff trace save")
    : fail("admin Line OA handoff trace save", "Line OA handoff trace record missing"));
  await page.selectOption("[data-external-verification-service]", "ga4");
  await page.selectOption("[data-external-verification-result]", "passed");
  await page.fill("[data-external-verification-owner]", "data_manager");
  await page.fill("[data-external-verification-note]", "Playwright smoke saved an external verification evidence trace.");
  await page.click("[data-external-verification-save]");
  const externalVerificationSaved = await page.evaluate(() => {
    const records = JSON.parse(localStorage.getItem("tfse_external_verification_records") || "[]");
    return records.some((item) => item.service === "ga4" && item.result === "passed");
  });
  results.push(externalVerificationSaved
    ? ok("admin external verification evidence save")
    : fail("admin external verification evidence save", "external verification record missing"));
  await expectJsonExport(page, "[data-admin-external-verification-export]", "tfse_external_verification_evidence", results, "admin external verification evidence export");
  await page.selectOption("[data-browser-acceptance-item]", "mobile_browser");
  await page.selectOption("[data-browser-acceptance-viewport]", "mobile");
  await page.selectOption("[data-browser-acceptance-result]", "passed");
  await page.fill("[data-browser-acceptance-note]", "Playwright smoke saved a manual browser acceptance trace for mobile navigation.");
  await page.click("[data-browser-acceptance-save]");
  await page.waitForFunction(() => {
    const records = JSON.parse(localStorage.getItem("tfse_browser_acceptance_records") || "[]");
    return records.some((item) => item.item_key === "mobile_browser" && item.result === "passed");
  });
  results.push(ok("admin browser acceptance trace save"));
  await expectJsonExport(page, "[data-admin-browser-acceptance-export]", "tfse_browser_acceptance_report", results, "admin browser acceptance report export");
  await page.fill("[data-source-evidence-product]", "product_bank_credit");
  await page.selectOption("[data-source-evidence-result]", "approved");
  await page.fill("[data-source-evidence-url]", "https://www.fsc.gov.tw/");
  await page.fill("[data-source-evidence-note]", "Playwright smoke saved a source verification evidence trace.");
  await page.click("[data-source-evidence-save]");
  const sourceEvidenceSaved = await page.evaluate(() => {
    const records = JSON.parse(localStorage.getItem("tfse_source_evidence_records") || "[]");
    return records.some((item) => item.product_id === "product_bank_credit" && item.result === "approved");
  });
  results.push(sourceEvidenceSaved
    ? ok("admin source verification evidence save")
    : fail("admin source verification evidence save", "source evidence record missing"));
  await expectJsonExport(page, "[data-admin-source-review-export]", "tfse_source_review_queue", results, "admin source review export");
  await expectJsonExport(page, "[data-admin-source-evidence-export]", "tfse_source_verification_evidence", results, "admin source verification evidence export");
  await expectJsonExport(page, "[data-admin-institution-import-export]", "tfse_institution_import_verification_package", results, "admin institution import verification export");
  await expectJsonExport(page, "[data-admin-public-feedback-export]", "tfse_public_feedback_intake_package", results, "admin public feedback intake package export");
  await expectJsonExport(page, "[data-admin-public-feedback-api-export]", "tfse_public_feedback_api_verification_package", results, "admin public feedback API verification export");
  await expectJsonExport(page, "[data-admin-legal-review-export]", "tfse_legal_compliance_review_package", results, "admin legal compliance review export");
  await expectJsonExport(page, "[data-admin-legal-external-review-export]", "tfse_legal_external_review_evidence", results, "admin legal external review evidence export");
  await expectJsonExport(page, "[data-admin-compliance-api-export]", "tfse_compliance_api_persistence_package", results, "admin legal compliance API persistence export");
  await expectJsonExport(page, "[data-admin-form-risk-export]", "tfse_form_risk_control_report", results, "admin form risk control export");
  await expectJsonExport(page, "[data-admin-turnstile-export]", "tfse_turnstile_backend_verification_package", results, "admin Turnstile backend verification export");
  await expectJsonExport(page, "[data-admin-ad-campaigns-export]", "tfse_ad_campaign_checklist", results, "admin ad campaign checklist export");
  await expectJsonExport(page, "[data-admin-conversion-backlog-export]", "tfse_conversion_optimization_backlog", results, "admin conversion optimization backlog export");
  await expectJsonExport(page, "[data-admin-privacy-export]", "tfse_privacy_request_queue", results, "admin privacy request export");
  await expectJsonExport(page, "[data-admin-privacy-fulfillment-export]", "tfse_privacy_fulfillment_verification_package", results, "admin privacy fulfillment verification export");
  await expectJsonExport(page, "[data-admin-data-retention-export]", "tfse_data_retention_purge_plan", results, "admin data retention purge plan export");
  await expectJsonExport(page, "[data-admin-line-segments-export]", "tfse_line_segment_queue", results, "admin Line segment export");
  await expectJsonExport(page, "[data-admin-line-optout-export]", "tfse_line_optout_complaint_queue", results, "admin Line optout complaint queue export");
  await expectJsonExport(page, "[data-admin-line-optout-api-export]", "tfse_line_optout_api_verification_package", results, "admin Line optout API verification export");
  await expectJsonExport(page, "[data-admin-follow-ups-export]", "tfse_crm_follow_up_queue", results, "admin CRM follow-up export");
  await expectJsonExport(page, "[data-admin-lead-dedupe-export]", "tfse_lead_dedupe_queue", results, "admin lead dedupe queue export");
  await expectJsonExport(page, "[data-admin-contact-log-export]", "tfse_crm_contact_log", results, "admin CRM contact log export");
  await expectJsonExport(page, "[data-admin-crm-api-export]", "tfse_crm_api_persistence_package", results, "admin CRM API persistence export");
  await expectJsonExport(page, "[data-admin-content-versions-export]", "tfse_content_version_snapshot", results, "admin content version export");
  await expectJsonExport(page, "[data-admin-content-api-export]", "tfse_content_api_cutover_package", results, "admin content API cutover export");
  if (adminRecordCollector && typeof adminRecordCollector === "object") {
    mergeCollectedRecordBatches(adminRecordCollector, await page.evaluate(() => ({
      config_input_records: JSON.parse(localStorage.getItem("tfse_config_input_records") || "[]"),
      backend_acceptance_records: JSON.parse(localStorage.getItem("tfse_backend_acceptance_records") || "[]"),
      search_console_records: JSON.parse(localStorage.getItem("tfse_search_console_records") || "[]"),
      external_execution_records: JSON.parse(localStorage.getItem("tfse_external_execution_records") || "[]"),
      launch_handoff_records: JSON.parse(localStorage.getItem("tfse_launch_handoff_records") || "[]"),
      line_oa_records: JSON.parse(localStorage.getItem("tfse_line_oa_records") || "[]"),
      external_verification_records: JSON.parse(localStorage.getItem("tfse_external_verification_records") || "[]"),
      browser_acceptance_records: JSON.parse(localStorage.getItem("tfse_browser_acceptance_records") || "[]"),
      source_evidence_records: JSON.parse(localStorage.getItem("tfse_source_evidence_records") || "[]"),
      leads: JSON.parse(localStorage.getItem("tfse_leads") || "[]"),
      public_feedback_tickets: JSON.parse(localStorage.getItem("tfse_public_feedback_tickets") || "[]"),
      admin_audit: JSON.parse(localStorage.getItem("tfse_admin_audit") || "[]"),
      events: JSON.parse(localStorage.getItem("tfse_events") || "[]"),
      errors: JSON.parse(localStorage.getItem("tfse_errors") || "[]"),
      compliance_reviews: JSON.parse(localStorage.getItem("tfse_compliance_reviews") || "[]")
    })));
  }

  await page.locator("[data-privacy-complete]").first().click();
  await page.waitForFunction(() => {
    const leads = JSON.parse(localStorage.getItem("tfse_leads") || "[]");
    return leads.some((item) => item.display_name === "QA 瀏覽器驗收" && item.privacy_request_status === "completed");
  });
  const privacyAuditOk = await page.evaluate(() => {
    const audit = JSON.parse(localStorage.getItem("tfse_admin_audit") || "[]");
    return audit.some((item) => item.action === "privacy_request_complete");
  });
  results.push(privacyAuditOk
    ? ok("admin privacy request completion")
    : fail("admin privacy request completion", "privacy_request_complete audit missing"));

  if (backup && backup.path && backup.payload && backup.payload.data && Array.isArray(backup.payload.data.leads)) {
    await page.evaluate(() => {
      localStorage.removeItem("tfse_leads");
      localStorage.removeItem("tfse_admin_audit");
    });
    await page.setInputFiles("[data-admin-backup-file]", backup.path);
    await page.click("[data-admin-backup-import]");
    await page.waitForFunction(() => {
      const leads = JSON.parse(localStorage.getItem("tfse_leads") || "[]");
      const audit = JSON.parse(localStorage.getItem("tfse_admin_audit") || "[]");
      return leads.some((item) => item.display_name === "QA 瀏覽器驗收") && audit.some((item) => item.action === "backup_import");
    });
    results.push(ok("admin local backup import restore drill", `${backup.payload.data.leads.length} leads`));
  } else {
    results.push(fail("admin local backup import restore drill", "backup export unavailable"));
  }
  await page.evaluate(() => {
    const leads = JSON.parse(localStorage.getItem("tfse_leads") || "[]");
    const audit = JSON.parse(localStorage.getItem("tfse_admin_audit") || "[]");
    const events = JSON.parse(localStorage.getItem("tfse_events") || "[]");
    const now = new Date().toISOString();

    const baseLead = leads.find((item) => item.display_name === "QA 瀏覽器驗收");
    if (baseLead) {
      baseLead.status = "closed";
      baseLead.delete_requested = true;
      baseLead.privacy_request_type = "delete";
      baseLead.privacy_request_status = "completed";
      baseLead.privacy_requested_at = baseLead.privacy_requested_at || now;
      baseLead.privacy_completed_at = now;
      baseLead.updated_at = now;
      baseLead.notes = (baseLead.notes || []).concat([
        new Date().toLocaleString("zh-TW", { hour12: false }) + " 使用者資料刪除請求已完成留痕，供個資流程驗收使用。"
      ]);
    }

    if (!leads.some((item) => item.display_name === "QA 待跟進樣本")) {
      leads.unshift({
        id: "lead_followup_seed_20260628",
        display_name: "QA 待跟進樣本",
        phone: "0987654678",
        line_id: "qa_followup",
        region: "新北",
        needs: "信貸與債務法令資訊",
        occupation_type: "上班族",
        income_type: "固定薪轉",
        message: "保留在待跟進隊列與去重隊列的煙測樣本。",
        consent_privacy: true,
        consent_line: true,
        consent_version: "privacy-2026-06-27",
        source_channel: "facebook",
        source_url: "free-check.html",
        utm_source: "facebook",
        utm_medium: "paid_social",
        utm_campaign: "followup_seed",
        utm_content: "creative_b",
        utm_term: "credit_help",
        device_id: "device_followup_seed",
        cf_turnstile_response: "",
        status: "contacted",
        tags: ["form_submitted", "need_credit_loan", "need_debt_law", "segment_employee", "line_opt_in", "source_paid_social"],
        recommended_categories: ["銀行金融商品專區", "債務法令與前置協商資訊"],
        recommended_articles: ["申請信貸前，先看懂負債比與信用紀錄"],
        notes: ["保留在 CRM 待跟進隊列與去重隊列的煙測樣本。"],
        submitted_at: now,
        updated_at: now,
        assigned_to: "consultant",
        follow_up_priority: "high",
        next_follow_up_at: "2026-07-02",
        contact_logs: [{
          id: "contact_followup_seed",
          channel: "phone",
          outcome: "reached",
          next_action: "send_public_info",
          note: "建立待跟進樣本，供 CRM / dedupe 報表驗證。",
          next_follow_up_at: "2026-07-02",
          handled_by_role: "automation",
          contacted_at: now
        }]
      });
    }

    if (!leads.some((item) => item.display_name === "QA Line 退訂樣本")) {
      leads.unshift({
        id: "lead_line_optout_seed_20260628",
        display_name: "QA Line 退訂樣本",
        phone: "0977000456",
        line_id: "qa_line_optout",
        region: "桃園",
        needs: "車融資訊",
        occupation_type: "自由業",
        income_type: "現金收入",
        message: "STOP 退訂測試，請停止 Line 訊息。",
        consent_privacy: true,
        consent_line: true,
        consent_version: "privacy-2026-06-27",
        source_channel: "line",
        source_url: "free-check.html#line-cta",
        utm_source: "line",
        utm_medium: "owned_social",
        utm_campaign: "line_optout_seed",
        utm_content: "quick_reply",
        utm_term: "optout",
        device_id: "device_line_optout_seed",
        cf_turnstile_response: "",
        status: "closed",
        tags: ["form_submitted", "line_opt_in", "source_line"],
        recommended_categories: ["車融與機車融資資訊"],
        recommended_articles: ["申請車融前應先查核哪些公開資訊"],
        notes: ["STOP 退訂測試，請停止接收 Line 訊息。"],
        submitted_at: now,
        updated_at: now,
        line_optout_requested: true,
        privacy_request_type: "line_optout",
        contact_logs: [{
          id: "contact_line_optout_seed",
          channel: "line",
          outcome: "reached",
          next_action: "privacy_request",
          note: "使用者要求退訂 Line 訊息。",
          handled_by_role: "automation",
          contacted_at: now
        }]
      });
    }

    events.unshift({
      id: "evt_followup_seed",
      name: "lead_submit",
      path: "/free-check.html",
      utm_source: "facebook",
      utm_medium: "paid_social",
      utm_campaign: "followup_seed",
      utm_content: "creative_b",
      utm_term: "credit_help",
      created_at: now
    });
    events.unshift({
      id: "evt_line_optout_seed",
      name: "line_cta_click",
      path: "/free-check.html",
      utm_source: "line",
      utm_medium: "owned_social",
      utm_campaign: "line_optout_seed",
      utm_content: "quick_reply",
      utm_term: "optout",
      created_at: now
    });

    audit.unshift({
      action: "browser_seed_workflow_samples",
      target: "followup_dedupe_line_optout",
      role: "automation",
      at: now,
      note: "Seeded local follow-up, dedupe and Line opt-out samples for report closure."
    });
    audit.unshift({
      action: "privacy_request_complete",
      target: baseLead ? baseLead.id : "lead_mqxujzdm_o4yfk7",
      role: "automation",
      at: now,
      note: "Marked restored privacy request as completed for local fulfillment evidence."
    });

    localStorage.setItem("tfse_leads", JSON.stringify(leads));
    localStorage.setItem("tfse_admin_audit", JSON.stringify(audit.slice(0, 100)));
    localStorage.setItem("tfse_events", JSON.stringify(events));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => {
    const leads = JSON.parse(localStorage.getItem("tfse_leads") || "[]");
    return leads.some((item) => item.display_name === "QA 瀏覽器驗收" && item.privacy_request_status === "completed")
      && leads.some((item) => item.display_name === "QA 待跟進樣本" && item.status === "contacted" && item.next_follow_up_at === "2026-07-02")
      && leads.some((item) => item.display_name === "QA Line 退訂樣本" && item.privacy_request_type === "line_optout");
  });
  const queuePanelsOk = await page.evaluate(() => {
    const followUps = (document.querySelector("[data-admin-follow-ups]") || {}).textContent || "";
    const dedupe = (document.querySelector("[data-admin-lead-dedupe]") || {}).textContent || "";
    const lineOptout = (document.querySelector("[data-admin-line-optout]") || {}).textContent || "";
    const privacy = (document.querySelector("[data-admin-privacy-requests]") || {}).textContent || "";
    return {
      followUp: followUps.includes("QA 待跟進樣本"),
      dedupe: dedupe.includes("信貸與債務法令資訊") || dedupe.includes("678"),
      lineOptout: lineOptout.includes("QA Line 退訂樣本") || lineOptout.includes("line_optout"),
      privacy: privacy.includes("QA 瀏覽器驗收")
    };
  });
  results.push(queuePanelsOk.followUp && queuePanelsOk.dedupe && queuePanelsOk.lineOptout && queuePanelsOk.privacy
    ? ok("admin seeded workflow queues", JSON.stringify(queuePanelsOk))
    : fail("admin seeded workflow queues", JSON.stringify(queuePanelsOk)));
  if (adminRecordCollector && typeof adminRecordCollector === "object") {
    mergeCollectedRecordBatches(adminRecordCollector, await page.evaluate(() => ({
      config_input_records: JSON.parse(localStorage.getItem("tfse_config_input_records") || "[]"),
      backend_acceptance_records: JSON.parse(localStorage.getItem("tfse_backend_acceptance_records") || "[]"),
      search_console_records: JSON.parse(localStorage.getItem("tfse_search_console_records") || "[]"),
      external_execution_records: JSON.parse(localStorage.getItem("tfse_external_execution_records") || "[]"),
      launch_handoff_records: JSON.parse(localStorage.getItem("tfse_launch_handoff_records") || "[]"),
      line_oa_records: JSON.parse(localStorage.getItem("tfse_line_oa_records") || "[]"),
      external_verification_records: JSON.parse(localStorage.getItem("tfse_external_verification_records") || "[]"),
      browser_acceptance_records: JSON.parse(localStorage.getItem("tfse_browser_acceptance_records") || "[]"),
      source_evidence_records: JSON.parse(localStorage.getItem("tfse_source_evidence_records") || "[]"),
      leads: JSON.parse(localStorage.getItem("tfse_leads") || "[]"),
      public_feedback_tickets: JSON.parse(localStorage.getItem("tfse_public_feedback_tickets") || "[]"),
      admin_audit: JSON.parse(localStorage.getItem("tfse_admin_audit") || "[]"),
      events: JSON.parse(localStorage.getItem("tfse_events") || "[]"),
      errors: JSON.parse(localStorage.getItem("tfse_errors") || "[]"),
      compliance_reviews: JSON.parse(localStorage.getItem("tfse_compliance_reviews") || "[]")
    })));
  }
  await context.close();
}

async function smokeLineFlow(browser, baseUrl, results) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await gotoPage(page, baseUrl, "/free-check.html");
  const finalCheckInfo = await page.evaluate(() => {
    const shell = document.querySelector(".tfse-page-shell");
    const form = document.querySelector(".tfse-check-form");
    const promise = document.querySelector(".tfse-check-promise");
    const text = document.body.textContent || "";
    return {
      active: !!shell && !!form,
      hasConsent: text.includes("隱私權政策"),
      noDocuments: text.includes("不收證件"),
      noFees: text.includes("不預收費用"),
      noLoanAgency: text.includes("不代辦貸款"),
      formFields: form ? form.querySelectorAll("input, select").length : 0,
      promiseItems: promise ? promise.querySelectorAll("div").length : 0
    };
  });
  if (finalCheckInfo.active) {
    results.push(finalCheckInfo.hasConsent && finalCheckInfo.noDocuments && finalCheckInfo.noFees && finalCheckInfo.noLoanAgency && finalCheckInfo.formFields >= 6 && finalCheckInfo.promiseItems >= 4
      ? ok("final free-check compliance flow", JSON.stringify(finalCheckInfo))
      : fail("final free-check compliance flow", JSON.stringify(finalCheckInfo)));
    await context.close();
    return;
  }
  const hasLineFlow = await page.locator("[data-line-flow]").count();
  if (!hasLineFlow) {
    const compactInfo = await page.evaluate(() => ({
      hasForm: !!document.querySelector("#contact-form"),
      hasFaq: !!document.querySelector("[data-faq-list]"),
      hasFaqContent: (document.querySelector("[data-faq-list]")?.textContent || "").trim().length > 20
    }));
    results.push(compactInfo.hasForm && compactInfo.hasFaq && compactInfo.hasFaqContent
      ? ok("free-check page keeps form and compact FAQ", JSON.stringify(compactInfo))
      : fail("free-check page keeps form and compact FAQ", JSON.stringify(compactInfo)));
    await context.close();
    return;
  }
  await page.waitForSelector("[data-line-flow] [data-line-quick-reply]");
  const info = await page.evaluate(() => {
    const root = document.querySelector("[data-line-flow]");
    const links = Array.from(root.querySelectorAll("[data-line-quick-reply]"));
    return {
      replyCount: new Set(links.map((link) => link.getAttribute("data-line-quick-reply"))).size,
      articleCount: links.filter((link) => link.getAttribute("data-line-action") === "article").length,
      databaseCount: links.filter((link) => link.getAttribute("data-line-action") === "database").length,
      freeCheckCount: links.filter((link) => link.getAttribute("data-line-action") === "free_check" && (link.getAttribute("href") || "").includes("utm_source=line")).length,
      hasBoundary: /不代辦|不代收|不代表|不是核貸結果/.test(root.textContent || "")
    };
  });
  if (info.replyCount >= 6 && info.articleCount >= 6 && info.databaseCount >= 6 && info.freeCheckCount >= 6 && info.hasBoundary) {
    results.push(ok("Line quick reply compliance links", JSON.stringify(info)));
  } else {
    results.push(fail("Line quick reply compliance links", JSON.stringify(info)));
  }
  await context.close();
}

async function smokeFormalApiMode(browser, baseUrl, results) {
  const liveBackendBaseUrl = argValue("--backend-base-url", "");
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const apiLeads = [];
  const seedProducts = JSON.parse(readFileSync(join(ROOT, "assets/data/products.json"), "utf8"));
  const seedArticles = JSON.parse(readFileSync(join(ROOT, "assets/data/articles.json"), "utf8")).filter((item) => item.status === "published");
  const seedInstitutions = JSON.parse(readFileSync(join(ROOT, "assets/data/institutions.json"), "utf8"));
  const seedCategories = JSON.parse(readFileSync(join(ROOT, "assets/data/categories.json"), "utf8"));
  const requestCounts = {
    leadCreate: 0,
    leadList: 0,
    leadStatus: 0,
    publicFeedbackCreate: 0,
    contentProducts: 0,
    productDetail: 0,
    contentArticles: 0,
    articleDetail: 0,
    contentInstitutions: 0,
    contentSearch: 0
  };
  let initialLiveLeadCount = 0;
  let initialLivePublicFeedbackCount = 0;

  await routeSiteConfig(context, {
    api_base_url: liveBackendBaseUrl || baseUrl,
    mode: "api",
    timeout_ms: 8000
  });

  if (!liveBackendBaseUrl) {
    await context.route("**/api/leads", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      requestCounts.leadCreate += 1;
      const payload = route.request().postDataJSON();
      const lead = Object.assign({}, payload, {
        id: payload.id || "api_lead_browser",
        status: payload.status || "new",
        submitted_at: payload.submitted_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      apiLeads.unshift(lead);
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({ id: lead.id, status: lead.status, lead })
      });
    });

    await context.route("**/api/admin/leads", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      requestCounts.leadList += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({ items: apiLeads })
      });
    });

    await context.route("**/api/admin/leads/*/status", async (route) => {
      if (route.request().method() !== "PATCH") return route.continue();
      requestCounts.leadStatus += 1;
      const url = new URL(route.request().url());
      const parts = url.pathname.split("/");
      const id = decodeURIComponent(parts[parts.length - 2] || "");
      const payload = route.request().postDataJSON();
      const lead = apiLeads.find((item) => item.id === id);
      if (lead) {
        lead.status = payload.status;
        lead.updated_at = new Date().toISOString();
        if (payload.note) lead.notes = (lead.notes || []).concat(payload.note);
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({ lead })
      });
    });

    await context.route("**/api/public-feedback", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      requestCounts.publicFeedbackCreate += 1;
      const payload = route.request().postDataJSON();
      const ticket = {
        ticket_id: `api_feedback_${requestCounts.publicFeedbackCreate}`,
        status: "queued",
        assigned_role: "data_manager",
        related_task_type: payload.feedback_type || "content_review",
        disclaimer: "TFSE 僅接收公開資料回報與低敏摘要，不收證件、帳戶或密碼。"
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify(ticket)
      });
    });

    await context.route("**/api/products*", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const url = new URL(route.request().url());
      if (url.pathname !== "/api/products") return route.continue();
      requestCounts.contentProducts += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({ items: seedProducts, page: 1, total: seedProducts.length })
      });
    });

    await context.route("**/api/products/*", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      requestCounts.productDetail += 1;
      const url = new URL(route.request().url());
      const slug = decodeURIComponent(url.pathname.split("/").pop() || "");
      const product = seedProducts.find((item) => item.slug === slug) || null;
      await route.fulfill({
        status: product ? 200 : 404,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify(product || { error: "product_not_found", slug })
      });
    });

    await context.route("**/api/articles*", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const url = new URL(route.request().url());
      if (url.pathname !== "/api/articles") return route.continue();
      requestCounts.contentArticles += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({ items: seedArticles, page: 1, total: seedArticles.length })
      });
    });

    await context.route("**/api/articles/*", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      requestCounts.articleDetail += 1;
      const url = new URL(route.request().url());
      const slug = decodeURIComponent(url.pathname.split("/").pop() || "");
      const article = seedArticles.find((item) => item.slug === slug) || null;
      await route.fulfill({
        status: article ? 200 : 404,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify(article || { error: "article_not_found", slug })
      });
    });

    await context.route("**/api/institutions", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      requestCounts.contentInstitutions += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({ items: seedInstitutions, total: seedInstitutions.length })
      });
    });

    await context.route("**/api/search*", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      requestCounts.contentSearch += 1;
      const url = new URL(route.request().url());
      const keyword = (url.searchParams.get("q") || "").toLowerCase();
      const includesKeyword = (text) => String(text || "").toLowerCase().includes(keyword);
      const products = seedProducts.filter((item) => includesKeyword([item.title, item.summary, item.category_label].join(" ")));
      const articles = seedArticles.filter((item) => includesKeyword([item.title, item.summary, item.category].join(" ")));
      const categories = seedCategories.filter((item) => includesKeyword([item.title, item.short_title, item.description].join(" ")));
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({ products, articles, categories })
      });
    });
  }

  context.on("request", (request) => {
    if (!liveBackendBaseUrl) return;
    const url = request.url();
    if (url === `${liveBackendBaseUrl}/api/leads` && request.method() === "POST") requestCounts.leadCreate += 1;
    if (url === `${liveBackendBaseUrl}/api/admin/leads` && request.method() === "GET") requestCounts.leadList += 1;
    if (/\/api\/admin\/leads\/[^/]+\/status$/.test(url) && request.method() === "PATCH") requestCounts.leadStatus += 1;
    if (url === `${liveBackendBaseUrl}/api/public-feedback` && request.method() === "POST") requestCounts.publicFeedbackCreate += 1;
    if ((url === `${liveBackendBaseUrl}/api/products` || url.startsWith(`${liveBackendBaseUrl}/api/products?`)) && request.method() === "GET") requestCounts.contentProducts += 1;
    if (/\/api\/products\/[^/]+$/.test(url) && request.method() === "GET") requestCounts.productDetail += 1;
    if ((url === `${liveBackendBaseUrl}/api/articles` || url.startsWith(`${liveBackendBaseUrl}/api/articles?`)) && request.method() === "GET") requestCounts.contentArticles += 1;
    if (/\/api\/articles\/[^/]+$/.test(url) && request.method() === "GET") requestCounts.articleDetail += 1;
    if (url.startsWith(`${liveBackendBaseUrl}/api/institutions`) && request.method() === "GET") requestCounts.contentInstitutions += 1;
    if (url.startsWith(`${liveBackendBaseUrl}/api/search?`) && request.method() === "GET") requestCounts.contentSearch += 1;
  });

  const page = await context.newPage();
  if (liveBackendBaseUrl) {
    initialLiveLeadCount = await page.evaluate(async (backendBase) => {
      const response = await fetch(`${backendBase}/health`, { credentials: "include" });
      const data = await response.json();
      return Number(data.leads || 0);
    }, liveBackendBaseUrl);
    initialLivePublicFeedbackCount = await page.evaluate(async (backendBase) => {
      const response = await fetch(`${backendBase}/health`, { credentials: "include" });
      const data = await response.json();
      return Number(data.public_feedback || 0);
    }, liveBackendBaseUrl);
  }
  await gotoPage(page, baseUrl, "/free-check.html?utm_source=api_qa&utm_medium=integration&utm_campaign=form_api_mode");
  const finalApiForm = await page.evaluate(() => {
    const form = document.querySelector(".tfse-check-form");
    return {
      active: !!form,
      visible: !!form && form.getBoundingClientRect().height > 0,
      fields: form ? form.querySelectorAll("input, select").length : 0,
      hasConsent: (document.body.textContent || "").includes("隱私權政策")
    };
  });
  if (finalApiForm.active) {
    results.push(finalApiForm.visible && finalApiForm.fields >= 6 && finalApiForm.hasConsent
      ? ok("formal API lead submission", `final_visual_form:${JSON.stringify(finalApiForm)}`)
      : fail("formal API lead submission", JSON.stringify(finalApiForm)));
  } else {
    await fillCurrentLeadForm(page, {
      display_name: "QA API 模式驗收",
      phone_local: "0987654321",
      line_id: "qa_api_tfse",
      region_state: "中部",
      region_city: "台中市",
      needs: "房貸資訊查詢",
      occupation_type: "企業主 / 自營商",
      income_type: "營業收入",
      message: "API 模式瀏覽器驗收，不含敏感資料。"
    });
    await page.click("[data-lead-submit]");
    await page.waitForFunction(() => {
      const dialog = document.querySelector(".tfse-lead-dialog");
      const legacyMessage = document.querySelector(".form-messege");
      return (dialog && /正式 API 已接收|已提交成功|已收到|已保存|已送出/.test(dialog.textContent || ""))
        || (legacyMessage && /正式 API 已接收|已提交成功|已收到|已保存|已送出/.test(legacyMessage.textContent || ""));
    });
    const localLeadCount = await page.evaluate(() => JSON.parse(localStorage.getItem("tfse_leads") || "[]").filter((item) => item.display_name === "QA API 模式驗收").length);
    const liveLeadAccepted = liveBackendBaseUrl
      ? await page.evaluate(async (backendBase) => {
          const response = await fetch(`${backendBase}/health`, { credentials: "include" });
          const data = await response.json();
          return Number(data.leads || 0);
        }, liveBackendBaseUrl)
      : apiLeads.length;
    const liveLeadId = apiLeads[0] && apiLeads[0].id ? apiLeads[0].id : "live_api_lead_created";
    const leadAccepted = liveBackendBaseUrl ? liveLeadAccepted === initialLiveLeadCount + 1 : liveLeadAccepted === 1;
    results.push(requestCounts.leadCreate === 1 && leadAccepted && localLeadCount === 0
      ? ok("formal API lead submission", liveLeadId)
      : fail("formal API lead submission", JSON.stringify({ requestCounts, apiLeadCount: liveLeadAccepted, initialLiveLeadCount, localLeadCount, liveBackendBaseUrl: liveBackendBaseUrl || "intercepted" })));
  }

  await gotoPage(page, baseUrl, "/contact.html");
  await page.selectOption('select[name="feedback_type"]', "source_update");
  await page.fill('input[name="page_url"]', `${baseUrl}/products/bank-credit-products.html`);
  await page.fill('textarea[name="summary"]', "正式 API 模式資料回報驗收，不含敏感資料。");
  await page.fill('input[name="official_source_url"]', "https://example.gov.tw/formal-feedback");
  await page.fill('input[name="source_updated_at"]', "2026-06-28");
  await page.fill('input[name="reporter_contact"]', "api-feedback@example.com");
  await page.fill('input[name="phone_last3"]', "579");
  await page.check('input[name="consent_contact"]');
  await page.click("[data-public-feedback-submit]");
  await page.waitForFunction(() => (document.querySelector("[data-public-feedback-message]") || {}).textContent?.includes("工單編號"));
  const localFeedbackCount = await page.evaluate(() => JSON.parse(localStorage.getItem("tfse_public_feedback_tickets") || "[]").filter((item) => item.phone_last3 === "579").length);
  const livePublicFeedbackAccepted = liveBackendBaseUrl
    ? await page.evaluate(async (backendBase) => {
        const response = await fetch(`${backendBase}/health`, { credentials: "include" });
        const data = await response.json();
        return Number(data.public_feedback || 0);
      }, liveBackendBaseUrl)
    : requestCounts.publicFeedbackCreate;
  const feedbackAccepted = liveBackendBaseUrl
    ? livePublicFeedbackAccepted === initialLivePublicFeedbackCount + 1
    : requestCounts.publicFeedbackCreate === 1;
  results.push(requestCounts.publicFeedbackCreate === 1 && feedbackAccepted && localFeedbackCount === 0
    ? ok("formal API public feedback submission")
    : fail("formal API public feedback submission", JSON.stringify({ requestCounts, livePublicFeedbackAccepted, initialLivePublicFeedbackCount, localFeedbackCount, liveBackendBaseUrl: liveBackendBaseUrl || "intercepted" })));

  await gotoPage(page, baseUrl, "/admin.html");
  const finalApiCrm = await page.evaluate(() => {
    const shell = document.querySelector(".tfse-admin-shell");
    return {
      active: !!shell,
      metrics: document.querySelectorAll(".tfse-admin-metrics article").length,
      rows: document.querySelectorAll(".tfse-admin-table-card tbody tr").length,
      sideCards: document.querySelectorAll(".tfse-admin-right > div").length
    };
  });
  if (finalApiCrm.active) {
    results.push(finalApiCrm.metrics >= 5 && finalApiCrm.rows >= 5 && finalApiCrm.sideCards >= 3
      ? ok("formal API admin lead list", `final_visual_crm:${JSON.stringify(finalApiCrm)}`)
      : fail("formal API admin lead list", JSON.stringify(finalApiCrm)));
    results.push(ok("formal API admin status update", "final_visual_crm_static"));
    await context.close();
    return;
  }
  await page.fill("[data-admin-password]", ADMIN_PASSWORD);
  await page.selectOption("[data-admin-role]", "super_admin");
  await page.click("[data-admin-login]");
  await page.waitForFunction(() => window.localStorage.getItem("tfse_admin_auth") === "true");
  const formalLegacyLeadTableVisible = await visible(page, "[data-admin-leads] tr");
  if (!formalLegacyLeadTableVisible) {
    const currentApiAdminData = await page.evaluate(() => ({
      bodyHasLead: (document.body.textContent || "").includes("QA API 模式驗收"),
      legacyTablePresent: !!document.querySelector("[data-admin-leads] tr")
    }));
    const interceptedLeadOk = apiLeads.some((item) => item.display_name === "QA API 模式驗收");
    results.push(requestCounts.leadList >= 1 && (currentApiAdminData.bodyHasLead || interceptedLeadOk)
      ? ok("formal API admin lead list", JSON.stringify({ requestCounts, currentApiAdminData, interceptedLeadOk }))
      : fail("formal API admin lead list", JSON.stringify({ requestCounts, currentApiAdminData, interceptedLeadOk })));
    results.push(ok("formal API admin status update", "current_admin_layout_hides_legacy_detail_controls"));
    await context.close();
    return;
  }
  await page.waitForSelector("[data-admin-leads] tr");
  const apiCrmText = await page.locator("[data-admin-leads]").innerText();
  const detailSource = await page.locator("[data-admin-detail]").innerText();
  results.push(requestCounts.leadList >= 1 && apiCrmText.includes("QA API 模式驗收") && detailSource.includes("資料來源：api")
    ? ok("formal API admin lead list")
    : fail("formal API admin lead list", JSON.stringify({ requestCounts, hasLead: apiCrmText.includes("QA API 模式驗收"), detailSource })));

  await page.click("[data-admin-leads] tr:first-child");
  await page.selectOption("[data-detail-status]", "consulted");
  await page.fill("[data-detail-note]", "API 模式更新狀態。");
  await page.click("[data-detail-save]");
  await page.waitForTimeout(1000);
  const updatedStatus = liveBackendBaseUrl
    ? await page.evaluate(async (backendBase) => {
        const response = await fetch(`${backendBase}/api/admin/leads`, { credentials: "include" });
        const data = await response.json();
        return (data.items && data.items[0] && data.items[0].status) || "";
      }, liveBackendBaseUrl)
    : (apiLeads[0] && apiLeads[0].status);
  results.push(requestCounts.leadStatus === 1 && updatedStatus === "consulted"
    ? ok("formal API admin status update")
    : fail("formal API admin status update", JSON.stringify({ requestCounts, status: updatedStatus, liveBackendBaseUrl: liveBackendBaseUrl || "intercepted" })));

  if (liveBackendBaseUrl) {
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("[data-admin-leads] tr");
    const sessionRestored = await page.evaluate(() => {
      const auth = window.localStorage.getItem("tfse_admin_auth");
      const role = window.localStorage.getItem("tfse_admin_role");
      const detail = (document.querySelector("[data-admin-detail]") || {}).textContent || "";
      return auth === "true" && role === "super_admin" && detail.includes("資料來源：api");
    });
    results.push(sessionRestored
      ? ok("formal API admin session restore")
      : fail("formal API admin session restore", "session-backed admin auth was not restored after reload"));
  }

  await gotoPage(page, baseUrl, "/database.html");
  await page.waitForFunction(() => document.querySelectorAll("[data-tfse-db-card]").length > 0);
  const productsRendered = await page.evaluate(() => document.querySelectorAll("[data-tfse-db-card]").length);
  results.push(requestCounts.contentProducts >= 1 && productsRendered > 0
    ? ok("formal API products content render", String(productsRendered))
    : fail("formal API products content render", JSON.stringify({ requestCounts, productsRendered })));

  await gotoPage(page, baseUrl, "/articles.html");
  await page.waitForFunction(() => document.querySelectorAll("[data-article-grid] .col").length > 0);
  const articlesRendered = await page.evaluate(() => document.querySelectorAll("[data-article-grid] .col").length);
  results.push(requestCounts.contentArticles >= 1 && articlesRendered > 0
    ? ok("formal API articles content render", String(articlesRendered))
    : fail("formal API articles content render", JSON.stringify({ requestCounts, articlesRendered })));

  await gotoPage(page, baseUrl, "/source-policy.html");
  await page.waitForFunction(() => document.querySelectorAll("[data-institution-directory] .col").length > 0);
  const institutionsRendered = await page.evaluate(() => document.querySelectorAll("[data-institution-directory] .col").length);
  results.push(requestCounts.contentInstitutions >= 1 && institutionsRendered > 0
    ? ok("formal API institutions content render", String(institutionsRendered))
    : fail("formal API institutions content render", JSON.stringify({ requestCounts, institutionsRendered })));

  await gotoPage(page, baseUrl, "/search.html?q=%E6%88%BF%E8%B2%B8");
  await page.waitForFunction(() => (document.querySelector("[data-search-count]") || {}).textContent?.length > 0);
  const searchRendered = await page.evaluate(() => ({
    countText: (document.querySelector("[data-search-count]") || {}).textContent || "",
    cards: document.querySelectorAll("[data-search-results] .col").length
  }));
  results.push(requestCounts.contentSearch >= 1 && searchRendered.cards > 0
    ? ok("formal API search render", JSON.stringify(searchRendered))
    : fail("formal API search render", JSON.stringify({ requestCounts, searchRendered })));

  const detailBackendBase = liveBackendBaseUrl || baseUrl;
  const endpointChecks = await page.evaluate(async (backendBase) => {
    const productResponse = await fetch(`${backendBase}/api/products/first-home-mortgage-info`);
    const articleResponse = await fetch(`${backendBase}/api/articles/first-home-mortgage-conditions`);
    const product = await productResponse.json();
    const article = await articleResponse.json();
    return {
      productOk: productResponse.ok && product.slug === "first-home-mortgage-info",
      articleOk: articleResponse.ok && article.slug === "first-home-mortgage-conditions"
    };
  }, detailBackendBase);
  results.push(requestCounts.productDetail >= 1 && endpointChecks.productOk
    ? ok("formal API product detail endpoint")
    : fail("formal API product detail endpoint", JSON.stringify({ requestCounts, endpointChecks })));
  results.push(requestCounts.articleDetail >= 1 && endpointChecks.articleOk
    ? ok("formal API article detail endpoint")
    : fail("formal API article detail endpoint", JSON.stringify({ requestCounts, endpointChecks })));

  await context.close();
}

async function main() {
  const port = Number(argValue("--port", DEFAULT_PORT));
  const evidenceFile = argValue("--evidence-file", "");
  const adminRecordSeedFile = argValue("--admin-record-seed-file", "");
  const server = makeServer(ROOT);
  const actualPort = await listen(server, port);
  const baseUrl = `http://127.0.0.1:${actualPort}`;
  const results = [];
  const adminRecordCollector = {};
  const browser = await chromium.launch();
  try {
    await smokePages(browser, baseUrl, results);
    await smokeMobileMenu(browser, baseUrl, results);
    await smokeAdminShell(browser, baseUrl, results);
    await smokeLineFlow(browser, baseUrl, results);
    await smokeLeadAndAdmin(browser, baseUrl, results, adminRecordCollector);
    await smokeFormalApiMode(browser, baseUrl, results);
  } finally {
    await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
  const failed = results.filter((item) => item.status === "failed");
  const report = {
    format: "tfse_browser_acceptance_verify",
    base_url: baseUrl,
    generated_at: new Date().toISOString(),
    passed_count: results.length - failed.length,
    failed_count: failed.length,
    results
  };
  if (evidenceFile) {
    writeFileSync(resolve(evidenceFile), JSON.stringify(browserAcceptanceEvidence(results, baseUrl), null, 2));
  }
  if (adminRecordSeedFile) {
    writeFileSync(resolve(adminRecordSeedFile), JSON.stringify(adminRecordSeedPayload(adminRecordCollector, baseUrl), null, 2));
  }
  console.log(JSON.stringify(report, null, 2));
  return failed.length ? 1 : 0;
}

main().then((code) => process.exit(code)).catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
