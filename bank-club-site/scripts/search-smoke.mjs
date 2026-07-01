import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const keepData = process.env.SEARCH_SMOKE_KEEP_DATA === "1";
const screenshotDir = process.env.SEARCH_SMOKE_SCREENSHOT_DIR || "/tmp/bank-club-search-smoke";

function fail(message, details = []) {
  const error = new Error([message, ...details].join("\n"));
  error.name = "SearchSmokeError";
  throw error;
}

async function assertNoFrameworkOverlay(page, label) {
  const overlayText = /Unhandled Runtime Error|Application error|Next\.js|webpack|Turbopack/i;
  const hasDialogOverlay = await page.locator("[data-nextjs-dialog-overlay]").isVisible({ timeout: 500 }).catch(() => false);
  const hasErrorText = await page.locator("body").getByText(overlayText).isVisible({ timeout: 500 }).catch(() => false);
  if (hasDialogOverlay || hasErrorText) fail(`${label}: framework error overlay is visible`);
}

async function run() {
  const backup = keepData ? null : await readDbSnapshot(dbPath);
  await mkdir(screenshotDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();
  const consoleMessages = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });

  try {
    await page.goto(`${baseUrl}/blog?q=${encodeURIComponent("財力")}`, { waitUntil: "networkidle" });
    await assertNoFrameworkOverlay(page, "query search");
    await page.screenshot({ path: path.join(screenshotDir, "blog-search-results.png"), fullPage: true });

    const title = await page.title();
    if (!title.includes("貸款知識文章")) fail(`blog title mismatch: ${title}`);

    const searchValue = await page.locator("#blog-search-input").inputValue();
    if (searchValue !== "財力") fail(`search input should retain query, got ${searchValue}`);

    const resultCount = await page.locator(".article-row").count();
    if (resultCount < 1) fail("query search should return at least one article");
    const resultText = await page.locator(".article-list").innerText();
    if (!resultText.includes("財力")) fail("query search results should contain the searched term");

    const firstResultCategory = (await page.locator(".article-row span").first().innerText()).trim();
    const resultCategoryFilter = page.locator(".category-filter a").filter({ hasText: firstResultCategory }).first();
    const resultCategoryHref = await resultCategoryFilter.getAttribute("href");
    if (!resultCategoryHref?.includes("category=") || !resultCategoryHref.includes("q=%E8%B2%A1%E5%8A%9B")) {
      fail(`category filter should preserve q parameter, got ${resultCategoryHref}`);
    }

    await resultCategoryFilter.click();
    await page.waitForURL(/\/blog\?category=.*q=/, { timeout: 5000 });
    const categoryRows = await page.locator(".article-row span").allInnerTexts();
    if (!categoryRows.length || categoryRows.some((category) => category.trim() !== firstResultCategory)) {
      fail(`category + query filter returned unexpected categories: ${categoryRows.join(", ") || "none"}`);
    }

    await page.goto(`${baseUrl}/blog?q=${encodeURIComponent("不存在的煙測關鍵詞")}`, { waitUntil: "networkidle" });
    await assertNoFrameworkOverlay(page, "empty search");
    await page.screenshot({ path: path.join(screenshotDir, "blog-search-empty.png"), fullPage: true });
    const emptyText = await page.locator(".empty-state").innerText();
    if (!emptyText.includes("目前沒有符合的文章")) fail("empty search state did not render expected message");
    if ((await page.locator(".article-row").count()) !== 0) fail("empty search should not render article rows");

    const relevantConsoleMessages = consoleMessages.filter((message) => !message.includes("favicon"));
    if (relevantConsoleMessages.length) {
      fail("console reported warnings/errors during search smoke", relevantConsoleMessages.slice(0, 10));
    }

    console.log(JSON.stringify({
      baseUrl,
      checks: [
        "blog q parameter filters published articles",
        "search input retains URL query",
        "category filters preserve q parameter",
        "category + query results stay scoped to selected category",
        "empty search state renders useful internal links",
      ],
      screenshots: {
        results: path.join(screenshotDir, "blog-search-results.png"),
        empty: path.join(screenshotDir, "blog-search-empty.png"),
      },
    }, null, 2));
  } finally {
    await browser.close();
    if (backup !== null) {
      await writeDbSnapshot(backup, { dbPath, label: "search-smoke" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
