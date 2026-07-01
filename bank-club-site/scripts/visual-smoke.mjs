import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const artifactDir = path.join(process.cwd(), "artifacts", "visual-smoke");
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const keepData = process.env.VISUAL_SMOKE_KEEP_DATA === "1";
const viewports = [
  { name: "desktop", width: 1440, height: 1800 },
  { name: "mobile", width: 390, height: 1600 },
];

const requiredTexts = [
  "銀行俱樂部",
  "一對一銀行專員",
  "信貸 / 房貸 / 企業貸款",
  "立即免費諮詢",
  "查看申辦流程",
  "信用貸款",
  "房屋貸款",
  "企業貸款",
  "滿足生活大小需求",
  "打造理想生活",
  "助您企業成長",
  "LINE 一對一諮詢",
  "文件準備提醒",
];

const homepageSelectors = [
  ".site-header",
  ".brand img",
  ".hero",
  ".hero-content",
  ".hero-actions",
  ".service-rail",
  ".contact-strip",
  ".qr-mini img",
  ".entry-grid",
  ".flow-box",
  ".reminder-grid",
  ".site-footer",
];

const subpageSelectors = [
  ".site-header",
  ".brand img",
  ".page-hero",
  ".site-footer",
  ".footer-cta",
];

const layoutSelectors = [...new Set([
  ...homepageSelectors,
  ...subpageSelectors,
  ".content-section",
  ".card-grid",
  ".contact-page",
  ".article-list",
  ".article-row",
  ".blog-search-panel",
  ".category-filter",
  ".flow-guide-grid",
  ".flow-guide-card",
  ".tool-panel",
  ".two-col",
  ".compare-table",
  ".form-section",
  ".calculator",
  ".financial-disclosure",
  ".lead-form",
  ".material-grid",
  ".warning-block",
])];

const subpageSmokeCases = [
  {
    name: "credit-loan",
    path: "/credit-loan",
    navLabel: "信用貸款",
    requiredTexts: ["信用貸款", "方案、利率與費用揭露", "總費用年百分率不等於貸款利率", "站內信貸網路申請", "身分證正面", "身分證反面", "財力證明請傳 LINE", "信貸常見問題"],
    selectors: [".page-hero", ".financial-disclosure", ".loan-tabs", "#credit-application", ".lead-form", ".faq-list"],
  },
  {
    name: "house-loan",
    path: "/house-loan",
    navLabel: "房屋貸款",
    requiredTexts: ["房屋貸款", "方案、利率與費用揭露", "總費用年百分率不等於貸款利率", "房屋貸款申請表", "房貸類型", "房屋縣市", "房貸月付試算", "總還款約"],
    selectors: [".page-hero", ".financial-disclosure", ".loan-tabs", "#house-application", ".calculator", ".lead-form"],
    calculator: true,
  },
  {
    name: "business-loan",
    path: "/business-loan",
    navLabel: "企業貸款",
    requiredTexts: ["企業貸款", "方案、利率與費用揭露", "總費用年百分率不等於貸款利率", "企業貸款申請表", "企業貸款類型", "公司 / 商號名稱", "報稅資料、存摺、執照"],
    selectors: [".page-hero", ".financial-disclosure", ".loan-tabs", "#business-application", ".lead-form"],
  },
  {
    name: "application-flow",
    path: "/application-flow",
    navLabel: "申請流程教學",
    requiredTexts: ["申辦流程教學", "線上或表單填寫需求", "填寫需求", "預約初評", "跟進案件", "申請前檢查清單"],
    selectors: [".page-hero", ".timeline", ".timeline .step-cta", ".flow-guide-grid", ".flow-guide-card"],
    stepCtaCount: 6,
  },
  {
    name: "documents",
    path: "/documents",
    requiredTexts: ["銀行資格與文件總整理", "常見資格", "常見文件", "首批圖文素材"],
    selectors: [".page-hero", ".compare-table", ".card-grid", ".material-grid"],
  },
  {
    name: "qa",
    path: "/qa",
    navLabel: "常見 QA",
    requiredTexts: ["常見 QA", "信貸財力證明需要哪些資料？", "問題還不確定？"],
    selectors: [".page-hero", ".faq-list", ".warning-block"],
  },
  {
    name: "blog-search",
    path: "/blog?q=財力",
    requiredTexts: ["貸款知識文章", "搜尋文章", "財力", "找到"],
    selectors: [".page-hero", ".blog-search-panel", ".article-list"],
  },
  {
    name: "contact",
    path: "/contact",
    requiredTexts: ["聯絡我們", "國泰金控 / 國泰人壽", "人身 / 財產保險業務員", "02 2243 7127", "0972 727 690", "yuanchin.liang@gmail.com", "LINE 一對一諮詢", "FB 銀行俱樂部社團"],
    selectors: [".page-hero", ".contact-page"],
  },
  {
    name: "facebook",
    path: "/facebook",
    requiredTexts: ["FB 銀行俱樂部社團", "熱門文章入口", "常見社團問題", "從社團討論進入一對一諮詢"],
    selectors: [".page-hero", ".card-grid", ".article-card-link", ".warning-block"],
  },
];

function fail(message, details = []) {
  const error = new Error([message, ...details].join("\n"));
  error.name = "VisualSmokeError";
  throw error;
}

function calculateMonthlyPayment(amount, annualRate, years) {
  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;
  if (!Number.isFinite(amount) || !Number.isFinite(annualRate) || !Number.isFinite(years)) return 0;
  if (amount <= 0 || years <= 0 || annualRate < 0 || months <= 0) return 0;
  if (annualRate === 0) return amount / months;
  return (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

function currencyNumber(text) {
  return Number(String(text || "").replace(/[^\d]/g, ""));
}

async function assertCalculatorSnapshot(calculator, label, values) {
  const months = values.years * 12;
  const expectedMonthly = Math.round(calculateMonthlyPayment(values.amount, values.rate, values.years));
  const expectedTotal = Math.round(calculateMonthlyPayment(values.amount, values.rate, values.years) * months);
  const expectedInterest = Math.max(expectedTotal - values.amount, 0);

  const monthlyText = await calculator.getByTestId("calculator-monthly-payment").textContent();
  const totalText = await calculator.getByTestId("calculator-total-payment").textContent();
  const interestText = await calculator.getByTestId("calculator-total-interest").textContent();
  const monthly = currencyNumber(monthlyText);
  const total = currencyNumber(totalText);
  const interest = currencyNumber(interestText);

  if (monthly !== expectedMonthly) {
    fail(`${label}: calculator monthly payment mismatch`, [`expected ${expectedMonthly}`, `got ${monthlyText}`]);
  }
  if (total !== expectedTotal) {
    fail(`${label}: calculator total payment mismatch`, [`expected ${expectedTotal}`, `got ${totalText}`]);
  }
  if (interest !== expectedInterest) {
    fail(`${label}: calculator total interest mismatch`, [`expected ${expectedInterest}`, `got ${interestText}`]);
  }
}

async function setCalculatorValues(calculator, values) {
  await calculator.getByLabel("貸款金額").fill(String(values.amount));
  await calculator.getByLabel(/年利率/).fill(String(values.rate));
  await calculator.getByLabel("年限").fill(String(values.years));
}

async function assertLoanCalculatorInteraction(page, label) {
  const calculator = page.locator(".calculator").first();
  if ((await calculator.count()) !== 1) fail(`${label}: expected one calculator`);

  const zeroRateCase = { amount: 1200000, rate: 0, years: 10 };
  await setCalculatorValues(calculator, zeroRateCase);
  await assertCalculatorSnapshot(calculator, `${label} zero-rate`, zeroRateCase);

  const interestCase = { amount: 1500000, rate: 3.6, years: 8 };
  await setCalculatorValues(calculator, interestCase);
  await assertCalculatorSnapshot(calculator, `${label} amortized`, interestCase);
}

async function collectLayoutIssues(page) {
  return page.evaluate(({ layoutSelectors }) => {
    const viewportWidth = document.documentElement.clientWidth;
    const docOverflow = document.documentElement.scrollWidth - viewportWidth;
    const issues = [];

    if (docOverflow > 1) {
      issues.push(`document horizontal overflow: ${document.documentElement.scrollWidth}px > ${viewportWidth}px`);
    }

    const isVisible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    };

    for (const selector of layoutSelectors) {
      for (const element of document.querySelectorAll(selector)) {
        if (!isVisible(element)) continue;
        const rect = element.getBoundingClientRect();
        if (rect.left < -1 || rect.right > viewportWidth + 1) {
          issues.push(`${selector} overflows viewport: left=${Math.round(rect.left)}, right=${Math.round(rect.right)}, viewport=${viewportWidth}`);
        }
      }
    }

    for (const element of document.querySelectorAll("a, button, input, select, textarea, [style*='overflow'], .line-btn, .primary-btn, .secondary-btn, .footer-action")) {
      if (!isVisible(element)) continue;
      const style = window.getComputedStyle(element);
      const clipsOverflow = ["hidden", "clip", "auto", "scroll"].includes(style.overflowX) || ["hidden", "clip", "auto", "scroll"].includes(style.overflowY);
      const isControl = ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(element.tagName);
      if (!isControl && !clipsOverflow) continue;
      const text = (element.textContent || "").trim();
      if (!text) continue;
      if (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1) {
        const selector = element.className ? `${element.tagName.toLowerCase()}.${String(element.className).split(" ").join(".")}` : element.tagName.toLowerCase();
        issues.push(`${selector} text may be clipped: "${text.slice(0, 40)}"`);
      }
    }

    const heroButtons = [...document.querySelectorAll(".hero-actions a")].map((element) => element.getBoundingClientRect());
    for (let index = 0; index < heroButtons.length - 1; index += 1) {
      const first = heroButtons[index];
      const second = heroButtons[index + 1];
      const overlapX = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
      const overlapY = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
      if (overlapX * overlapY > 2) {
        issues.push(`hero CTA buttons overlap: ${Math.round(overlapX)}x${Math.round(overlapY)}`);
      }
    }

    return issues;
  }, { layoutSelectors });
}

async function assertHomeReferenceComposition(page, name) {
  const metrics = await page.evaluate(() => {
    const rectFor = (selector) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return rect ? {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      } : null;
    };
    const servicePanels = [...document.querySelectorAll(".service-panel")].map((element) => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height };
    });
    const navLinks = [...document.querySelectorAll(".main-nav > a, .main-nav > details > summary")].map((element) => {
      const rect = element.getBoundingClientRect();
      return { text: element.textContent?.trim() || "", top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height };
    });
    return {
      viewportWidth: document.documentElement.clientWidth,
      header: rectFor(".site-header"),
      brand: rectFor(".brand"),
      brandImage: rectFor(".brand img"),
      mainNav: rectFor(".main-nav"),
      headerActions: rectFor(".header-actions"),
      languageButton: rectFor(".header-actions .language-toggle"),
      lineButton: rectFor(".header-actions .line-btn"),
      hero: rectFor(".hero"),
      heroContent: rectFor(".hero-content"),
      sliderDots: rectFor(".slider-dots"),
      serviceRail: rectFor(".service-rail"),
      contactStrip: rectFor(".contact-strip"),
      advisor: rectFor(".advisor"),
      qrMini: rectFor(".qr-mini"),
      navLinks,
      servicePanels,
    };
  });

  const missing = Object.entries(metrics)
    .filter(([key, value]) => !["viewportWidth", "navLinks", "servicePanels"].includes(key) && !value)
    .map(([key]) => key);
  if (missing.length) fail(`${name}: missing homepage composition metrics: ${missing.join(", ")}`);
  if (metrics.servicePanels.length !== 3) fail(`${name}: reference composition expected 3 service panels, found ${metrics.servicePanels.length}`);

  const { viewportWidth, header, brand, brandImage, mainNav, headerActions, languageButton, lineButton, hero, heroContent, sliderDots, serviceRail, contactStrip, advisor, qrMini, navLinks, servicePanels } = metrics;
  const isDesktop = viewportWidth >= 900;
  if (isDesktop) {
    if (header.height < 70 || header.height > 92) {
      fail(`${name}: header height should stay close to the reference image`, [`height=${Math.round(header.height)}px`]);
    }
    if (brand.left < 36 || brand.left > 72) {
      fail(`${name}: brand should remain left aligned like the reference header`, [`left=${Math.round(brand.left)}px`]);
    }
    if (brandImage.width < 56 || brandImage.width > 86 || brandImage.height < 38 || brandImage.height > 58) {
      fail(`${name}: brand logo should keep the reference header scale`, [`size=${Math.round(brandImage.width)}x${Math.round(brandImage.height)}px`]);
    }
    if (navLinks.length !== 7) fail(`${name}: plan section 4.1 header expected 7 nav groups plus the gold LINE action, found ${navLinks.length}`);
    const navTopSpread = Math.max(...navLinks.map((link) => link.top)) - Math.min(...navLinks.map((link) => link.top));
    if (navTopSpread > 3) fail(`${name}: desktop nav links should align in one row`, [`spread=${Math.round(navTopSpread)}px`]);
    if (mainNav.left <= brand.right || headerActions.left <= mainNav.right) {
      fail(`${name}: header should keep brand, nav, and actions in left-to-right reference order`, [
        `brandRight=${Math.round(brand.right)}`,
        `navLeft=${Math.round(mainNav.left)}`,
        `navRight=${Math.round(mainNav.right)}`,
        `actionsLeft=${Math.round(headerActions.left)}`,
      ]);
    }
    if (languageButton.width < 44 || languageButton.width > 76 || Math.abs(lineButton.top - languageButton.top) > 8) {
      fail(`${name}: language globe and LINE consultation button should stay aligned in the header actions`, [
        `languageWidth=${Math.round(languageButton.width)}px`,
        `lineWidth=${Math.round(lineButton.width)}px`,
        `topDelta=${Math.round(Math.abs(lineButton.top - languageButton.top))}px`,
      ]);
    }
    if (lineButton.width < 126 || lineButton.width > 180) {
      fail(`${name}: LINE consultation button should keep the reference header CTA size`, [`lineWidth=${Math.round(lineButton.width)}px`]);
    }
    if (Math.abs((header.bottom - hero.top)) > 1) {
      fail(`${name}: hero should start directly below the sticky header`, [
        `headerBottom=${Math.round(header.bottom)}px`,
        `heroTop=${Math.round(hero.top)}px`,
      ]);
    }
    const serviceOverlap = hero.bottom - serviceRail.top;
    if (serviceOverlap < 36 || serviceOverlap > 120) {
      fail(`${name}: service rail should float over the lower hero like the reference image`, [`overlap=${Math.round(serviceOverlap)}px`]);
    }
    const serviceWidthRatio = serviceRail.width / viewportWidth;
    if (serviceWidthRatio < 0.68 || serviceWidthRatio > 0.82) {
      fail(`${name}: service rail width should match reference centered card`, [`ratio=${serviceWidthRatio.toFixed(2)}`]);
    }
    const heroCenterOffset = Math.abs((heroContent.left + heroContent.width / 2) - viewportWidth / 2);
    if (heroCenterOffset > 24) {
      fail(`${name}: hero copy should remain centered over the office background`, [`offset=${Math.round(heroCenterOffset)}px`]);
    }
    const contactGap = contactStrip.top - serviceRail.bottom;
    if (contactGap < 14 || contactGap > 54) {
      fail(`${name}: contact strip should sit just below the floating service rail`, [`gap=${Math.round(contactGap)}px`]);
    }
    if (qrMini.left <= advisor.right || Math.abs(qrMini.top - advisor.top) > 18) {
      fail(`${name}: LINE QR block should align to the right of advisor contact strip`, [
        `advisorRight=${Math.round(advisor.right)}`,
        `qrLeft=${Math.round(qrMini.left)}`,
        `topDelta=${Math.round(Math.abs(qrMini.top - advisor.top))}`,
      ]);
    }
    const panelTopSpread = Math.max(...servicePanels.map((panel) => panel.top)) - Math.min(...servicePanels.map((panel) => panel.top));
    if (panelTopSpread > 4) fail(`${name}: service panels should align in a single desktop row`, [`spread=${Math.round(panelTopSpread)}px`]);
  } else {
    const expectedMobileNavLabels = ["首頁", "貸款服務", "申請流程教學", "銀行資格與文件總整理", "常見 QA", "免費諮詢預約", "FB 銀行俱樂部社團"];
    if (navLinks.map((link) => link.text).join("|") !== expectedMobileNavLabels.join("|")) {
      fail(`${name}: mobile header nav should keep the plan section 4.1 labels`, [`got=${navLinks.map((link) => link.text).join(", ")}`]);
    }
    if (brand.width < viewportWidth * 0.75 || brandImage.width < 64) {
      fail(`${name}: mobile brand row should remain prominent like the reference image`, [
        `brandWidth=${Math.round(brand.width)}px`,
        `logoWidth=${Math.round(brandImage.width)}px`,
      ]);
    }
    if (lineButton.left <= languageButton.right || lineButton.top < languageButton.top - 4) {
      fail(`${name}: mobile language globe should sit before the LINE CTA in the header actions row`, [
        `languageRight=${Math.round(languageButton.right)}px`,
        `lineLeft=${Math.round(lineButton.left)}px`,
      ]);
    }
    if (serviceRail.top <= sliderDots.bottom + 8) {
      fail(`${name}: mobile service rail should float below hero CTAs and slider dots, not overlap readable hero content`, [
        `serviceTop=${Math.round(serviceRail.top)}px`,
        `dotsBottom=${Math.round(sliderDots.bottom)}px`,
      ]);
    }
    const panelWidths = servicePanels.map((panel) => panel.width);
    if (panelWidths.some((width) => width < viewportWidth * 0.82 || width > viewportWidth)) {
      fail(`${name}: mobile service panels should use the reference single-column card width`, panelWidths.map((width) => `width=${Math.round(width)}px`));
    }
    const panelTopSpread = servicePanels.map((panel) => panel.top).sort((a, b) => a - b);
    if (!(panelTopSpread[0] < panelTopSpread[1] && panelTopSpread[1] < panelTopSpread[2])) {
      fail(`${name}: mobile service panels should stack vertically`);
    }
    if (qrMini.top <= advisor.bottom) {
      fail(`${name}: mobile QR block should stack below advisor contact details`);
    }
  }
}

async function assertHomepage(page, name) {
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(artifactDir, `home-${name}.png`), fullPage: true });

  for (const text of requiredTexts) {
    const count = await page.getByText(text, { exact: false }).count();
    if (count === 0) fail(`${name}: missing required text "${text}"`);
  }

  for (const selector of homepageSelectors) {
    const count = await page.locator(selector).count();
    if (count === 0) fail(`${name}: missing selector ${selector}`);
  }

  const heroFormHref = await page.locator(".hero-actions a").first().getAttribute("href");
  const heroFlowHref = await page.locator(".hero-actions a").nth(1).getAttribute("href");
  const heroCtaCount = await page.locator(".hero-actions a").count();
  if (heroCtaCount !== 2) fail(`${name}: expected reference-style 2 hero CTAs, found ${heroCtaCount}`);
  if (!heroFormHref?.includes("/consultation?source_page=home")) fail(`${name}: hero consultation CTA href mismatch: ${heroFormHref}`);
  if (heroFlowHref !== "/application-flow") fail(`${name}: hero flow CTA href mismatch: ${heroFlowHref}`);

  const heroBackground = await page.locator(".hero").evaluate((element) => window.getComputedStyle(element).backgroundImage);
  if (!heroBackground.includes("/brand/home_hero_office.jpg")) {
    fail(`${name}: hero should use the local reference-style office background, got ${heroBackground}`);
  }

  const serviceCount = await page.locator(".service-panel").count();
  if (serviceCount !== 3) fail(`${name}: expected 3 service panels, found ${serviceCount}`);

  const homeFooterPlanSections = await page.locator(".site-footer .footer-cta, .site-footer .footer-popular, .site-footer .footer-links").count();
  if (homeFooterPlanSections !== 3) {
    fail(`${name}: homepage footer should include the plan-required CTA, popular articles, and full link sections, found ${homeFooterPlanSections}`);
  }

  const homeFooterRiskLinks = await page.locator('.site-footer a[href="/risk"]').count();
  if (homeFooterRiskLinks < 1) {
    fail(`${name}: homepage footer should keep a risk disclosure link`);
  }

  const highlightedText = page.locator(".hero-lead .gold-text");
  const highlightedCopy = await highlightedText.textContent();
  if ((await highlightedText.count()) !== 1 || !highlightedCopy?.includes("免費評估")) {
    fail(`${name}: hero should highlight 免費評估 in gold like the reference image`);
  }

  const desktopNavLabels = await page.locator(".main-nav > a, .main-nav > details > summary").evaluateAll((items) => items.map((item) => item.textContent?.trim() || ""));
  const expectedDesktopNavLabels = ["首頁", "貸款服務", "申請流程教學", "銀行資格與文件總整理", "常見 QA", "免費諮詢預約", "FB 銀行俱樂部社團"];
  if (name === "desktop" && desktopNavLabels.join("|") !== expectedDesktopNavLabels.join("|")) {
    fail(`${name}: header nav should match plan section 4.1 labels, got ${desktopNavLabels.join(", ")}`);
  }
  if (name === "desktop" && (await page.locator(".header-actions .line-btn[aria-label='聯絡我們 / LINE 諮詢']").count()) !== 1) {
    fail(`${name}: header should expose 聯絡我們 / LINE 諮詢 as the gold action button`);
  }

  const issues = await collectLayoutIssues(page);
  if (issues.length) fail(`${name}: layout smoke failed`, issues.slice(0, 20));
  await assertHomeReferenceComposition(page, name);
}

async function assertSubpage(page, viewportName, smokeCase) {
  await page.goto(`${baseUrl}${smokeCase.path}`, { waitUntil: "networkidle" });
  const screenshotName = `${smokeCase.name}-${viewportName}.png`;
  await page.screenshot({ path: path.join(artifactDir, screenshotName), fullPage: true });

  for (const text of smokeCase.requiredTexts) {
    const count = await page.getByText(text, { exact: false }).count();
    if (count === 0) fail(`${smokeCase.name} ${viewportName}: missing required text "${text}"`);
  }

  for (const selector of subpageSelectors) {
    const count = await page.locator(selector).count();
    if (count === 0) fail(`${smokeCase.name} ${viewportName}: missing shared selector ${selector}`);
  }

  for (const selector of smokeCase.selectors) {
    const count = await page.locator(selector).count();
    if (count === 0) fail(`${smokeCase.name} ${viewportName}: missing page selector ${selector}`);
  }

  const footerRiskLinks = await page.locator('.site-footer a[href="/risk"]').count();
  if (footerRiskLinks < 1) {
    fail(`${smokeCase.name} ${viewportName}: footer should keep a risk disclosure link`);
  }

  if (smokeCase.stepCtaCount) {
    const count = await page.locator(".timeline .step-cta").count();
    if (count !== smokeCase.stepCtaCount) {
      fail(`${smokeCase.name} ${viewportName}: expected ${smokeCase.stepCtaCount} timeline step CTAs, found ${count}`);
    }
  }

  if (smokeCase.navLabel) {
    const activeNav = page.locator(".main-nav a[aria-current='page']");
    const activeText = (await activeNav.textContent())?.trim();
    if (activeText !== smokeCase.navLabel) {
      fail(`${smokeCase.name} ${viewportName}: active nav mismatch, expected "${smokeCase.navLabel}", got "${activeText || ""}"`);
    }
  }

  const overlayText = /Unhandled Runtime Error|Application error|Next\.js|webpack|Turbopack/i;
  const hasDialogOverlay = await page.locator("[data-nextjs-dialog-overlay]").isVisible({ timeout: 500 }).catch(() => false);
  const hasErrorText = await page.locator("body").getByText(overlayText).isVisible({ timeout: 500 }).catch(() => false);
  if (hasDialogOverlay || hasErrorText) fail(`${smokeCase.name} ${viewportName}: Next.js error overlay is visible`);

  if (smokeCase.calculator) {
    await assertLoanCalculatorInteraction(page, `${smokeCase.name} ${viewportName}`);
  }

  const issues = await collectLayoutIssues(page);
  if (issues.length) fail(`${smokeCase.name} ${viewportName}: layout smoke failed`, issues.slice(0, 20));
}

async function assertCreditApplicationMainFlow(page) {
  await page.goto(`${baseUrl}/credit-loan`, { waitUntil: "networkidle" });
  const officialApplyLink = page.getByRole("link", { name: /銀行官方申請頁面|官方申請頁面|我要申請/ });
  if ((await officialApplyLink.count()) !== 0) fail("credit: official bank apply link should not appear in the main public flow");
  const activeTab = await page.locator(".loan-tabs").getAttribute("data-active-tab");
  if (activeTab !== "credit-apply") fail(`credit: expected default active tab credit-apply, got ${activeTab || "missing"}`);
  if ((await page.locator("#credit-application form.lead-form").count()) !== 1) fail("credit: missing centered in-site application form");
  if ((await page.locator('#credit-application input[type="file"][name="idFront"]').count()) !== 1) fail("credit: missing ID front upload");
  if ((await page.locator('#credit-application input[type="file"][name="idBack"]').count()) !== 1) fail("credit: missing ID back upload");
  if ((await page.locator("#credit-application", { hasText: "財力證明請傳 LINE" }).count()) !== 1) fail("credit: missing LINE supplement reminder");
}

await mkdir(artifactDir, { recursive: true });
const dbBackup = keepData ? null : await readDbSnapshot(dbPath).catch(() => null);
const browser = await chromium.launch();
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await assertHomepage(page, viewport.name);
    for (const smokeCase of subpageSmokeCases) {
      await assertSubpage(page, viewport.name, smokeCase);
    }
    await page.close();
  }
  const page = await browser.newPage({ viewport: viewports[0] });
  await assertCreditApplicationMainFlow(page);
  await page.close();
  console.log(`visual smoke passed for ${baseUrl}`);
  console.log(`screenshots: ${artifactDir}`);
} finally {
  await browser.close();
  if (dbBackup !== null) {
    await writeDbSnapshot(dbBackup, { dbPath, label: "visual-smoke" });
  }
}
