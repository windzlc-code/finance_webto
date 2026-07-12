import path from "node:path";
import { readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const keepData = process.env.LAUNCH_SMOKE_KEEP_DATA === "1";
const defaultPassword = "admin123";
const legacyDefaultPassword = "BankClub2026!";
const isLocalBaseUrl = (() => {
  try {
    const hostname = new URL(baseUrl).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return true;
  }
})();
const defaultExpectedFailures = isLocalBaseUrl ? ["env:auth-secret", "env:admin-password"] : [];

function parseExpectedFailures() {
  if (!Object.prototype.hasOwnProperty.call(process.env, "LAUNCH_SMOKE_EXPECTED_FAILS")) {
    return defaultExpectedFailures;
  }
  const rawValue = String(process.env.LAUNCH_SMOKE_EXPECTED_FAILS || "").trim();
  if (!rawValue || rawValue.toLowerCase() === "none") return [];
  return rawValue.split(",").map((value) => value.trim()).filter(Boolean);
}

const expectedFailureIds = new Set(parseExpectedFailures());

function fail(message, details = []) {
  const error = new Error([message, ...details].join("\n"));
  error.name = "LaunchSmokeError";
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

function sameOriginHeaders(cookie = "", ip = "127.0.0.157") {
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
    process.env.LAUNCH_SMOKE_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    defaultPassword,
    legacyDefaultPassword,
  ].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);

  let loginResult = null;
  for (const password of passwordCandidates) {
    const result = await fetchJson("/api/admin/login", {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", "127.0.0.156"),
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: admin.email, password }),
    });
    loginResult = result;
    if (result.response.ok) break;
  }

  if (!loginResult?.response.ok) {
    fail(`admin login failed HTTP ${loginResult?.response.status}: ${loginResult?.json.message || "unknown error"}. Set LAUNCH_SMOKE_ADMIN_PASSWORD to the current local admin password.`);
  }
  const cookie = cookieFromSetCookie(loginResult.response.headers);
  if (!cookie) fail("admin login did not return bank_club_session cookie");
  if (loginResult.json.user?.role !== "super_admin") fail(`admin login returned unexpected role: ${loginResult.json.user?.role}`);
  return { cookie, admin };
}

function formatCheck(check) {
  return `${check.id} [${check.status}] ${check.label}: ${check.detail}`;
}

function requireChecks(checks, requiredIds) {
  const ids = new Set(checks.map((check) => check.id));
  const missing = requiredIds.filter((id) => !ids.has(id));
  if (missing.length) fail(`launch checklist missing required check IDs: ${missing.join(", ")}`);
}

async function run() {
  const backup = keepData ? null : await readDbSnapshot(dbPath);
  const originalDB = JSON.parse(backup || await readDbSnapshot(dbPath));

  try {
    const { cookie } = await adminLogin(originalDB);

    const anonymous = await fetchJson("/api/admin/launch-checklist");
    if (anonymous.response.status !== 401) {
      fail(`launch checklist should require admin session, got HTTP ${anonymous.response.status}`);
    }

    const checklist = await fetchJson("/api/admin/launch-checklist", {
      headers: sameOriginHeaders(cookie),
    });
    if (![200, 503].includes(checklist.response.status)) {
      fail(`launch checklist returned unexpected HTTP ${checklist.response.status}: ${checklist.json.message || "missing json"}`);
    }
    if (!Array.isArray(checklist.json.checks) || !checklist.json.totals) {
      fail("launch checklist response missing checks/totals");
    }

    const checks = checklist.json.checks;
    requireChecks(checks, [
      "public:/",
      "public:/credit-loan",
      "public:/house-loan",
      "public:/business-loan",
      "public:/application-flow",
      "public:/qa",
      "public:/consultation",
      "public:/facebook",
      "public:/contact",
      "public:/blog",
      "public:/privacy",
      "public:/risk",
      "public:/terms",
      "public:/site-map",
      "public:/sitemap.xml",
      "public:/robots.txt",
      "public:/api/health",
      "headers:csp",
      "headers:hsts",
      "headers:nosniff",
      "headers:frame-options",
      "headers:referrer-policy",
      "headers:permissions-policy",
      "seo:home-meta",
      "seo:faq-jsonld",
      "seo:article-jsonld",
      "seo:public-page-meta",
      "seo:image-alt",
      "seo:article-url-meta",
      "cta:article-bottom",
      "seo:sitemap-coverage",
      "ia:site-map",
      "material:credit-application-flow",
      "material:id-card-photo-tips",
      "material:income-document-checklist",
      "material:loan-purpose-risk",
      "material:house-loan-flow",
      "material:business-loan-documents",
      "material:fb-group-benefits",
      "material:line-consultation-flow",
      "links:internal",
      "links:qa-answer-links",
      "compliance:footer-risk-link",
      "nav:information-architecture",
      "footer:fixed-entrypoints",
      "compliance:consent-notice",
      "compliance:privacy-rights-contact",
      "compliance:form-data-minimization",
      "flow:loan-application-tabs",
      "flow:success-contact",
      "assets:brand-line-qr",
      "admin:login-branding",
      "compliance:official-apply-warning",
      "cta:external-readiness",
      "performance:public-pages",
      "performance:asset-budget",
      "compliance:red-flag-copy",
      "compliance:financial-disclosures",
      "security:csrf",
      "security:lead-antispam",
      "env:site-url",
      "env:auth-secret",
      "env:admin-password",
      "env:notify-webhook",
      "settings:contact",
      "settings:fb",
      "settings:line",
      "settings:line-qr",
      "settings:official-apply",
      "settings:ga4",
      "settings:gsc",
      "content:articles",
      "content:required-articles",
      "content:article-categories",
      "content:files",
      "content:material-assets",
      "content:file-types",
      "content:article-governance",
      "content:fb-draft-readiness",
      "content:fb-post-readiness",
      "content:legal",
      "data:lead-ids",
      "data:file-ids",
      "data:event-ids",
      "data:audit-log-ids",
      "data:article-slugs",
      "data:category-slugs",
      "data:lead-tracking",
      "data:lead-timeline",
      "data:event-tracking",
      "data:file-resource-shape",
      "data:file-sensitive-content",
      "data:audit-log-shape",
      "data:lead-relations",
      "data:no-test-residue",
      "security:super-admin",
      "security:password-hashes",
      "security:2fa",
      "security:backup-log",
    ]);

    const failedChecks = checks.filter((check) => check.status === "fail");
    const unexpectedFailures = failedChecks.filter((check) => !expectedFailureIds.has(check.id));
    const missingExpectedFailures = [...expectedFailureIds].filter((id) => !failedChecks.some((check) => check.id === id));
    if (unexpectedFailures.length || missingExpectedFailures.length) {
      fail("launch checklist failures did not match expected failures", [
        unexpectedFailures.length ? `Unexpected:\n${unexpectedFailures.map(formatCheck).join("\n")}` : "Unexpected: none",
        missingExpectedFailures.length ? `Expected but not failing: ${missingExpectedFailures.join(", ")}` : "Expected failures all present",
      ]);
    }

    const warningChecks = checks.filter((check) => check.status === "warn");
    const passCount = checks.filter((check) => check.status === "pass").length;
    if (
      checklist.json.totals.fail !== failedChecks.length ||
      checklist.json.totals.warn !== warningChecks.length ||
      checklist.json.totals.pass !== passCount
    ) {
      fail(`launch checklist totals mismatch: ${JSON.stringify(checklist.json.totals)}`);
    }
    if (checklist.json.ok !== (failedChecks.length === 0)) {
      fail(`launch checklist ok flag mismatch: ok=${checklist.json.ok}, failures=${failedChecks.length}`);
    }
    if (failedChecks.length > 0 && checklist.response.status !== 503) {
      fail(`launch checklist should return 503 when failures remain, got HTTP ${checklist.response.status}`);
    }

    console.log(JSON.stringify({
      origin: checklist.json.origin,
      generatedAt: checklist.json.generatedAt,
      totals: checklist.json.totals,
      expectedFailures: failedChecks.map(formatCheck),
      warnings: warningChecks.map(formatCheck),
      sampledPasses: checks.filter((check) => check.status === "pass").slice(0, 8).map(formatCheck),
    }, null, 2));
  } finally {
    if (backup !== null) {
      await writeDbSnapshot(backup, { dbPath, label: "launch-smoke" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
