import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const keepData = process.env.NAV_SMOKE_KEEP_DATA === "1";
const screenshotDir = process.env.NAV_SMOKE_SCREENSHOT_DIR || "/tmp/bank-club-nav-smoke";

const navCases = [
  { path: "/", activeLabel: "首頁" },
  { path: "/credit-loan", activeLabel: "貸款服務" },
  { path: "/house-loan", activeLabel: "貸款服務" },
  { path: "/business-loan", activeLabel: "貸款服務" },
  { path: "/application-flow", activeLabel: "申請流程教學" },
  { path: "/qa", activeLabel: "常見 QA" },
  { path: "/consultation", activeLabel: "免費諮詢預約" },
  { path: "/facebook", activeLabel: "FB 銀行行員俱樂部社團" },
];

const expectedDesktopNavLabels = [
  "首頁",
  "貸款服務",
  "申請流程教學",
  "常見 QA",
  "免費諮詢預約",
  "FB 銀行行員俱樂部社團",
];

const expectedLoanDropdownLabels = [
  "信用貸款",
  "房屋貸款",
  "企業貸款",
];

function fail(message, details = []) {
  const error = new Error([message, ...details].join("\n"));
  error.name = "NavSmokeError";
  throw error;
}

async function assertNoFrameworkOverlay(page, label) {
  const overlayText = /Unhandled Runtime Error|Application error|Next\.js|webpack|Turbopack/i;
  const hasDialogOverlay = await page.locator("[data-nextjs-dialog-overlay]").isVisible({ timeout: 500 }).catch(() => false);
  const hasErrorText = await page.locator("body").getByText(overlayText).isVisible({ timeout: 500 }).catch(() => false);
  if (hasDialogOverlay || hasErrorText) fail(`${label}: framework error overlay is visible`);
}

async function activeNavLabels(page) {
  return page.locator(".main-nav > a.active, .main-nav > details > summary.active").allInnerTexts();
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) fail(`${label}: horizontal overflow ${overflow}px`);
}

async function run() {
  const backup = keepData ? null : await readDbSnapshot(dbPath);
  await mkdir(screenshotDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleMessages = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: "load" });
    await page.evaluate(() => {
      window.localStorage.setItem("bank_club_language", "zh-TW");
    });
    for (const item of navCases) {
      await page.goto(`${baseUrl}${item.path}`, { waitUntil: "load" });
      await assertNoFrameworkOverlay(page, item.path);
      await assertNoHorizontalOverflow(page, item.path);
      const labels = (await activeNavLabels(page)).map((label) => label.trim());
      if (labels.length !== 1 || labels[0] !== item.activeLabel) {
        fail(`${item.path}: expected active nav "${item.activeLabel}", got ${labels.join(", ") || "none"}`);
      }
      if ((await page.locator(".main-nav > a.active, .main-nav > details > summary.active").count()) !== 1) {
        fail(`${item.path}: expected exactly one active nav class`);
      }
    }

    const desktopNavLabels = (await page.locator(".main-nav > a, .main-nav > details > summary").allInnerTexts()).map((label) => label.trim());
    if (desktopNavLabels.join("|") !== expectedDesktopNavLabels.join("|")) {
      fail(`desktop header should show 7 text entries plus loan dropdown, got ${desktopNavLabels.join(", ")}`);
    }
    if ((await page.locator(".main-nav details").count()) !== 1) {
      fail("desktop header should render exactly one loan service dropdown");
    }
    const loanDropdownLabels = await page.locator(".main-nav .nav-menu a").evaluateAll((items) => items.map((item) => item.textContent?.trim() || ""));
    if (loanDropdownLabels.join("|") !== expectedLoanDropdownLabels.join("|")) {
      fail(`loan service dropdown should contain the three loan pages, got ${loanDropdownLabels.join(", ")}`);
    }
    if ((await page.locator(".site-header .icon-btn").count()) !== 0) {
      fail("document 4.1 header should not render extra search button");
    }

    await page.goto(`${baseUrl}/blog?q=${encodeURIComponent("財力")}`, { waitUntil: "networkidle" });
    await assertNoFrameworkOverlay(page, "/blog search");
    const blogActiveLabels = (await activeNavLabels(page)).map((label) => label.trim());
    if (blogActiveLabels.length !== 0) {
      fail(`/blog should not highlight a top-level reference nav label, got ${blogActiveLabels.join(", ")}`);
    }

    const headerLineHref = await page.getByRole("link", { name: "聯絡我們 / LINE 諮詢" }).first().getAttribute("href");
    if (!headerLineHref?.includes("source_page=header") || !headerLineHref?.includes("utm_medium=line_cta")) {
      fail(`gold contact/LINE button should keep header LINE tracking params, got ${headerLineHref || "missing"}`);
    }

    await page.goto(`${baseUrl}/`, { waitUntil: "load" });
    await page.evaluate(() => {
      window.localStorage.setItem("bank_club_language", "zh-TW");
    });
    await page.goto(`${baseUrl}/application-flow`, { waitUntil: "load" });
    await page.getByRole("button", { name: "切換簡體中文" }).click();
    await page.waitForFunction(() => document.documentElement.lang === "zh-Hans");
    const simplifiedUrl = new URL(page.url());
    if (simplifiedUrl.searchParams.get("lang") !== "zh-CN") {
      fail(`language toggle should set lang=zh-CN in URL, got ${page.url()}`);
    }
    const simplifiedBrand = (await page.locator(".brand span").textContent())?.trim();
    const simplifiedNav = (await page.locator(".main-nav > a").nth(1).textContent())?.trim();
    if (simplifiedBrand !== "银行行员俱乐部" || simplifiedNav !== "申请流程教学") {
      fail(`language toggle should simplify visible header text, got brand=${simplifiedBrand}, nav=${simplifiedNav}`);
    }
    await page.getByRole("button", { name: "切換繁體中文" }).click();
    await page.waitForFunction(() => document.documentElement.lang === "zh-Hant");
    const traditionalBrand = (await page.locator(".brand span").textContent())?.trim();
    if (traditionalBrand !== "銀行行員俱樂部") {
      fail(`language toggle should restore traditional header text, got ${traditionalBrand}`);
    }

    await page.goto(`${baseUrl}/blog?q=${encodeURIComponent("財力")}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(screenshotDir, "blog-no-home-active.png"), fullPage: false });

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`${baseUrl}/contact`, { waitUntil: "networkidle" });
    await assertNoFrameworkOverlay(page, "/contact mobile");
    await assertNoHorizontalOverflow(page, "/contact mobile");
    const mobileNavLinks = (await page.locator(".main-nav > a, .main-nav > details > summary").allInnerTexts()).map((label) => label.trim());
    if (mobileNavLinks.join("|") !== expectedDesktopNavLabels.join("|")) {
      fail(`/contact mobile: header nav should match reference labels, got ${mobileNavLinks.join(", ")}`);
    }
    if ((await page.locator(".site-header .line-btn").count()) !== 1) {
      fail("/contact mobile: gold contact/LINE button should remain in header");
    }
    await page.screenshot({ path: path.join(screenshotDir, "contact-mobile-header.png"), fullPage: false });

    const relevantConsoleMessages = consoleMessages.filter((message) => (
      !message.includes("favicon") &&
      !message.includes("was detected as the Largest Contentful Paint")
    ));
    if (relevantConsoleMessages.length) {
      fail("console reported warnings/errors during nav smoke", relevantConsoleMessages.slice(0, 10));
    }

    console.log(JSON.stringify({
      baseUrl,
      checks: [
        "home highlights only 首頁",
        "credit page highlights 貸款服務 parent",
        "house page highlights 貸款服務 parent",
        "business page highlights 貸款服務 parent",
        "application flow highlights only 申請流程教學",
        "QA page highlights only 常見 QA",
        "consultation and FB entries follow document 4.1",
        "desktop header shows 7 text entries, one loan dropdown, and one gold contact/LINE button",
        "loan dropdown contains 信用貸款 / 房屋貸款 / 企業貸款",
        "language globe toggles simplified/traditional text and URL state",
        "mobile header has no horizontal overflow",
        "blog does not highlight an unrelated top-level nav item",
      ],
      screenshots: {
        blogNoHomeActive: path.join(screenshotDir, "blog-no-home-active.png"),
        contactMobileHeader: path.join(screenshotDir, "contact-mobile-header.png"),
      },
    }, null, 2));
  } finally {
    await browser.close();
    if (backup !== null) {
      await writeDbSnapshot(backup, { dbPath, label: "nav-smoke" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
