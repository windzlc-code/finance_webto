import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:8080";
const screenshotDir = path.join(process.cwd(), "artifacts", "loan-comparison-smoke");

function fail(message, details = []) {
  throw new Error([message, ...details].join("\n"));
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) fail(`${label}: horizontal overflow ${overflow}px`);
}

async function run() {
  await mkdir(screenshotDir, { recursive: true });
  const browser = await chromium.launch();
  const consoleMessages = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) consoleMessages.push(`${message.type()}: ${message.text()}`);
    });

    await page.goto(`${baseUrl}/loan-comparison`, { waitUntil: "domcontentloaded" });
    await page.locator(".loan-product-card").first().waitFor({ state: "visible" });
    await assertNoHorizontalOverflow(page, "desktop");

    const activeNav = await page.locator('.main-nav > a[aria-current="page"]').allInnerTexts();
    if (activeNav.map((item) => item.trim()).join("|") !== "貸款方案比較") {
      fail(`desktop: comparison nav should be active, got ${activeNav.join(", ") || "none"}`);
    }
    if ((await page.locator(".loan-product-card").count()) !== 24) fail("desktop: expected 24 loan cards");
    if ((await page.locator(".loan-product-accordion").count()) !== 48) fail("desktop: expected two detail panels per loan card");
    if ((await page.locator('.loan-product-card a[target="_blank"]').count()) !== 24) fail("desktop: every offer needs an official verification link");
    if ((await page.getByRole("link", { name: "查看參考頁", exact: true }).count()) !== 0) fail("desktop: reference-page button should be removed");
    if ((await page.locator(".loan-comparison-disclosure").count()) !== 0) fail("desktop: data snapshot block should be removed");
    if ((await page.locator(".loan-bank-visual").count()) !== 24) fail("desktop: every offer needs a bank brand visual");
    if ((await page.locator(".loan-bank-visual img").count()) !== 24) fail("desktop: every offer needs a real bank logo image");
    const firstCardMeasurements = await page.locator(".loan-product-card").first().evaluate((card) => ({
      width: Math.round(card.getBoundingClientRect().width),
      height: Math.round(card.getBoundingClientRect().height),
      logoWidth: Math.round(card.querySelector(".loan-bank-visual")?.getBoundingClientRect().width || 0),
    }));
    if (firstCardMeasurements.width < 1120 || firstCardMeasurements.width > 1140) {
      fail(`desktop: card width should track the 1130px reference, got ${firstCardMeasurements.width}px`);
    }
    if (firstCardMeasurements.height > 450) fail(`desktop: compact card is too tall at ${firstCardMeasurements.height}px`);
    if (firstCardMeasurements.logoWidth < 168 || firstCardMeasurements.logoWidth > 176) {
      fail(`desktop: bank logo container should remain clearly readable, got ${firstCardMeasurements.logoWidth}px`);
    }
    for (let index = 0; index < 24; index += 1) {
      const logo = page.locator(".loan-bank-visual img").nth(index);
      await logo.scrollIntoViewIfNeeded();
      await logo.evaluate((image) => {
        if (image.complete && image.naturalWidth > 0) return;
        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      });
    }
    const brokenBankLogos = await page.locator(".loan-bank-visual img").evaluateAll((images) =>
      images.filter((image) => !image.complete || image.naturalWidth < 1).map((image) => image.getAttribute("alt")),
    );
    if (brokenBankLogos.length) fail(`desktop: bank logo images failed to load ${brokenBankLogos.join(", ")}`);
    const initialCardHeights = await page.locator(".loan-product-card").evaluateAll((cards) =>
      cards.map((card) => Math.round(card.getBoundingClientRect().height)),
    );
    if (Math.max(...initialCardHeights) - Math.min(...initialCardHeights) > 1) {
      fail(`desktop: initial loan card sizes differ ${Math.min(...initialCardHeights)}-${Math.max(...initialCardHeights)}px`);
    }
    const fixedRegionSpreads = await page.locator(".loan-product-card").evaluateAll((cards) => {
      const heights = (selector) => cards.map((card) => Math.round(card.querySelector(selector)?.getBoundingClientRect().height || 0));
      return [".loan-product-card-head", ".loan-product-metrics", ".loan-product-glance"].map((selector) => {
        const values = heights(selector);
        return { selector, min: Math.min(...values), max: Math.max(...values) };
      });
    });
    const unevenRegion = fixedRegionSpreads.find((region) => region.max - region.min > 1);
    if (unevenRegion) fail(`desktop: fixed card region sizes differ ${JSON.stringify(unevenRegion)}`);

    await page.screenshot({ path: path.join(screenshotDir, "desktop-overview.png"), fullPage: false });

    for (let index = 0; index < 24; index += 1) {
      const card = page.locator(".loan-product-card").nth(index);
      const analysisButton = card.locator(".loan-product-accordion").first().locator("button");
      const infoButton = card.locator(".loan-product-accordion").nth(1).locator("button");
      if ((await analysisButton.getAttribute("aria-expanded")) !== "true") {
        await analysisButton.evaluate((button) => button.click());
        await page.waitForFunction((offerIndex) => (
          document.querySelectorAll(".loan-product-card")[offerIndex]
            ?.querySelector(".loan-product-accordion:first-of-type button")
            ?.getAttribute("aria-expanded") === "true"
        ), index);
      }
      await infoButton.evaluate((button) => button.click());
      await page.waitForFunction((offerIndex) => (
        document.querySelectorAll(".loan-product-card")[offerIndex]
          ?.querySelectorAll(".loan-product-accordion")[1]
          ?.querySelector("button")
          ?.getAttribute("aria-expanded") === "true"
      ), index);
      if ((await analysisButton.getAttribute("aria-expanded")) !== "false") fail(`desktop: offer ${index + 1} kept both detail panels open`);
      if (!(await card.getByText("申請資格", { exact: true }).isVisible())) fail(`desktop: offer ${index + 1} product info did not open`);
    }

    await page.getByRole("button", { name: "專業族群", exact: true }).click();
    if ((await page.locator(".loan-product-card").count()) !== 3) fail("desktop: professional filter should show three offers");
    await page.getByRole("button", { name: "全部方案", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll(".loan-product-card").length === 24);
    const resultCountText = (await page.locator(".loan-filter-title > p").innerText()).replace(/\s+/g, " ").trim();
    if (!resultCountText.includes("24 / 24") || resultCountText.includes("2424")) fail(`desktop: result count is stale or duplicated: ${resultCountText}`);

    for (let index = 0; index < 3; index += 1) {
      await page.locator(".loan-product-card").nth(index).locator(".loan-compare-toggle").evaluate((button) => button.click());
      await page.waitForFunction((count) => document.querySelectorAll(".loan-compare-toggle.selected").length >= count, index + 1);
    }
    const workspace = page.locator(".loan-compare-workspace");
    if (!(await workspace.isVisible())) fail("desktop: comparison workspace should appear");
    if ((await workspace.locator("thead th").count()) !== 4) fail("desktop: comparison table should contain label plus three offers");
    if (!(await workspace.locator(".loan-compare-workspace-head").innerText()).includes("已選 3 / 3 款")) fail("desktop: selected offer count should update to 3 / 3");
    const firstValueColors = await workspace.locator("tbody td").first().evaluate((cell) => ({
      color: getComputedStyle(cell).color,
      background: getComputedStyle(cell).backgroundColor,
    }));
    if (firstValueColors.color === firstValueColors.background || firstValueColors.background === "rgb(255, 255, 255)") {
      fail(`desktop: comparison value has unreadable colors ${JSON.stringify(firstValueColors)}`);
    }

    await page.locator(".loan-product-card").nth(3).locator(".loan-compare-toggle").evaluate((button) => button.click());
    if (!(await workspace.getByText("最多可以選 3 款，先移除一款再加新的。").isVisible())) {
      fail("desktop: fourth selection should show the three-offer limit");
    }
    await workspace.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(screenshotDir, "desktop-three-way-compare.png"), fullPage: false });

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    mobile.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) consoleMessages.push(`${message.type()}: ${message.text()}`);
    });
    await mobile.goto(`${baseUrl}/loan-comparison`, { waitUntil: "domcontentloaded" });
    await mobile.locator(".loan-product-card").first().waitFor({ state: "visible" });
    await assertNoHorizontalOverflow(mobile, "mobile");
    if ((await mobile.locator(".loan-product-card").count()) !== 24) fail("mobile: expected 24 loan cards");
    const mobileWidths = await mobile.locator(".loan-comparison-explorer").evaluate((explorer) => ({
      client: explorer.clientWidth,
      scroll: explorer.scrollWidth,
      card: Math.round(explorer.querySelector(".loan-product-card")?.getBoundingClientRect().width || 0),
    }));
    if (mobileWidths.scroll - mobileWidths.client > 1 || mobileWidths.card > mobileWidths.client + 1) {
      fail(`mobile: comparison content is clipped ${JSON.stringify(mobileWidths)}`);
    }
    await mobile.locator(".loan-filter-console").scrollIntoViewIfNeeded();
    await mobile.screenshot({ path: path.join(screenshotDir, "mobile-filters.png"), fullPage: false });
    await mobile.locator(".loan-product-card").first().scrollIntoViewIfNeeded();
    await mobile.screenshot({ path: path.join(screenshotDir, "mobile-card.png"), fullPage: false });
    await assertNoHorizontalOverflow(mobile, "mobile card");

    const relevantConsoleMessages = consoleMessages.filter((message) => !message.includes("favicon"));
    if (relevantConsoleMessages.length) fail("browser console reported warnings/errors", relevantConsoleMessages.slice(0, 10));

    console.log(JSON.stringify({
      baseUrl,
      checks: [
        "24 schemes rendered",
        "two exclusive-gift-free detail panels per scheme",
        "professional filter and all-offer reset",
        "three-way comparison and fourth-item guard",
        "active top navigation",
        "desktop and mobile horizontal overflow",
        "official verification link on every scheme",
        "browser console errors",
      ],
      screenshots: [
        path.join(screenshotDir, "desktop-overview.png"),
        path.join(screenshotDir, "desktop-three-way-compare.png"),
        path.join(screenshotDir, "mobile-filters.png"),
        path.join(screenshotDir, "mobile-card.png"),
      ],
    }, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
