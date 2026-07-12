import { pbkdf2Sync, randomBytes } from "node:crypto";
import path from "node:path";
import { readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const keepData = process.env.ROLES_SMOKE_KEEP_DATA === "1";
const password = process.env.ROLES_SMOKE_PASSWORD || "RoleSmoke2026!";
const passwordIterations = 310_000;

function fail(message) {
  const error = new Error(message);
  error.name = "RolesSmokeError";
  throw error;
}

function hashPassword(value) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(value, salt, passwordIterations, 32, "sha256").toString("base64url");
  return `pbkdf2$sha256$${passwordIterations}$${salt}$${hash}`;
}

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

function cookieFromSetCookie(headers) {
  const setCookie = headers.get("set-cookie") || "";
  const match = setCookie.match(/bank_club_session=[^;]+/);
  return match?.[0] || "";
}

function sameOriginHeaders(cookie = "", ip = "127.0.0.201") {
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

async function login(email, role) {
  const result = await fetchJson("/api/admin/login", {
    method: "POST",
    headers: {
      ...sameOriginHeaders("", `127.0.0.${210 + Math.floor(Math.random() * 30)}`),
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!result.response.ok) {
    fail(`${role} login failed HTTP ${result.response.status}: ${result.json.message || "unknown error"}`);
  }
  if (result.json.user?.role !== role) {
    fail(`${role} login returned unexpected role: ${result.json.user?.role}`);
  }
  const cookie = cookieFromSetCookie(result.response.headers);
  if (!cookie) fail(`${role} login did not return bank_club_session cookie`);
  return cookie;
}

async function expectStatus(label, pathname, cookie, expected, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      ...sameOriginHeaders(cookie),
      ...(options.headers || {}),
    },
  });
  const expectedStatuses = Array.isArray(expected) ? expected : [expected];
  if (!expectedStatuses.includes(response.status)) {
    const body = await response.text().catch(() => "");
    fail(`${label}: expected HTTP ${expectedStatuses.join("/")}, got ${response.status}${body ? `: ${body.slice(0, 180)}` : ""}`);
  }
  return { response, json: await parseJson(response.clone()) };
}

function assertSummaryDoesNotExposeSensitiveFields(label, summary, sensitiveValues) {
  const payload = JSON.stringify({
    latestEvents: summary.latestEvents,
    latestLeads: summary.latestLeads,
    settings: summary.settings,
  });
  const leaked = sensitiveValues.filter((value) => value && payload.includes(value));
  if (leaked.length) {
    fail(`${label} summary leaked sensitive fields: ${leaked.join(", ")}`);
  }
}

function makeUser(id, role) {
  return {
    id,
    name: `角色煙測 ${role}`,
    email: `${id}@bank-club-smoke.local`,
    role,
    phone: "",
    lineId: "",
    passwordHash: hashPassword(password),
    twoFactorEnabled: false,
    twoFactorSecret: "",
    twoFactorConfirmedAt: "",
    createdAt: new Date().toISOString(),
  };
}

function makeLead(id, assignedTo, name, phone) {
  const now = new Date().toISOString();
  return {
    id,
    name,
    phone,
    lineId: `${id}Line`,
    identityType: "employee",
    loanType: "credit",
    desiredAmount: 500000,
    appointmentTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16),
    purpose: "unsure",
    propertyRegion: "",
    propertyType: "",
    estimatedPropertyValue: null,
    existingMortgage: "",
    companyName: "",
    businessRegistrationType: "",
    monthlyRevenue: null,
    note: "角色權限煙測線索。",
    sourcePage: "/consultation",
    sourceChannel: "role-smoke",
    utmSource: "role-smoke",
    utmMedium: "smoke",
    utmCampaign: "roles",
    utmContent: "",
    utmTerm: "",
    sessionId: id,
    status: "new",
    assignedTo,
    leadPriority: "normal",
    nextFollowUpAt: "",
    lastFollowUpAt: "",
    documentStatus: "not_requested",
    duplicateOf: "",
    hasJoinedFb: false,
    hasClickedLine: false,
    doNotContact: false,
    deletionRequested: false,
    privacyRequestNote: "",
    notificationStatus: "not_configured",
    notificationError: "",
    notifiedAt: "",
    notificationAttempts: 0,
    consentAt: now,
    consentVersion: "2026-06-30",
    ip: "127.0.0.203",
    userAgent: "roles-smoke",
    createdAt: now,
    updatedAt: now,
  };
}

async function seedRoleData(originalDB) {
  const db = JSON.parse(JSON.stringify(originalDB));
  const admin = db.users.find((user) => user.role === "super_admin") || db.users[0];
  const specialist = makeUser("role-smoke-specialist", "specialist");
  const content = makeUser("role-smoke-content", "content");
  const readonly = makeUser("role-smoke-readonly", "readonly");
  db.users = db.users.filter((user) => !user.id.startsWith("role-smoke-"));
  db.users.push(specialist, content, readonly);
  db.leads = db.leads.filter((lead) => !lead.id.startsWith("role-smoke-"));
  db.leads.unshift(
    makeLead("role-smoke-owned-lead", specialist.id, "專員可看線索", "0911 111 111"),
    makeLead("role-smoke-other-lead", admin.id, "專員不可看線索", "0922 222 222"),
  );
  db.events = db.events.filter((event) => event.id !== "role-smoke-sensitive-event");
  db.events.unshift({
    id: "role-smoke-sensitive-event",
    eventName: "role_smoke_sensitive_event",
    pagePath: "/roles-smoke-sensitive",
    leadId: "role-smoke-owned-lead",
    sessionId: "role-smoke-sensitive-session",
    sourceChannel: "role-smoke",
    metadata: {
      phone: "0911 111 111",
      lineId: "role-smoke-owned-leadLine",
      note: "角色煙測敏感備註不應出現在統計最新事件",
      referrer: "https://example.com/?phone=0911111111",
      sessionId: "role-smoke-sensitive-session",
      sourceChannel: "role-smoke",
      loanType: "credit",
    },
    createdAt: new Date().toISOString(),
  });
  db.files = db.files.filter((file) => file.id !== "role-smoke-admin-file");
  db.files.unshift({
    id: "role-smoke-admin-file",
    title: "角色煙測後台文件",
    type: "qa_card",
    visibility: "admin_only",
    description: "只允許內容營運或超級管理員下載。",
    content: "角色煙測後台文件內容。",
    sourceFilename: "",
    sourceFileMime: "",
    sourceFileSize: 0,
    sourceUploadedAt: "",
    version: 1,
    fileVersionHistory: [],
    downloads: 0,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
  await writeDbSnapshot(JSON.stringify(db, null, 2), { dbPath, label: "roles-smoke" });
  return { specialist, content, readonly };
}

async function run() {
  const backup = keepData ? null : await readDbSnapshot(dbPath);
  const originalDB = JSON.parse(backup || await readDbSnapshot(dbPath));

  try {
    const { specialist, content, readonly } = await seedRoleData(originalDB);
    const specialistCookie = await login(specialist.email, "specialist");
    const contentCookie = await login(content.email, "content");
    const readonlyCookie = await login(readonly.email, "readonly");

    const specialistList = await expectStatus("specialist lead list", "/api/admin/leads", specialistCookie, 200);
    const specialistLeadIds = new Set((specialistList.json.leads || []).map((lead) => lead.id));
    if (!specialistLeadIds.has("role-smoke-owned-lead") || specialistLeadIds.has("role-smoke-other-lead")) {
      fail(`specialist lead list did not isolate assigned leads: ${[...specialistLeadIds].join(", ")}`);
    }
    const listedOwnedLead = (specialistList.json.leads || []).find((lead) => lead.id === "role-smoke-owned-lead");
    if (listedOwnedLead?.phone === "0911 111 111" || listedOwnedLead?.lineId === "role-smoke-owned-leadLine") {
      fail("specialist list should keep contact fields masked until detail view");
    }
    const specialistSummary = await expectStatus("specialist summary", "/api/admin/summary", specialistCookie, 200);
    const specialistSummaryLeadIds = new Set((specialistSummary.json.latestLeads || []).map((lead) => lead.id));
    if (!specialistSummaryLeadIds.has("role-smoke-owned-lead") || specialistSummaryLeadIds.has("role-smoke-other-lead")) {
      fail(`specialist summary lead previews did not isolate assigned leads: ${[...specialistSummaryLeadIds].join(", ")}`);
    }
    assertSummaryDoesNotExposeSensitiveFields("specialist", specialistSummary.json, [
      "0911 111 111",
      "0922 222 222",
      "role-smoke-owned-leadLine",
      "role-smoke-other-leadLine",
      "角色煙測敏感備註",
      "role-smoke-sensitive-session",
      "127.0.0.203",
      "contact@example.invalid",
    ]);
    const specialistDetail = await expectStatus("specialist own detail", "/api/admin/leads/role-smoke-owned-lead", specialistCookie, 200);
    if (specialistDetail.json.lead?.phone !== "0911 111 111") fail("specialist own detail should expose assigned lead contact");
    await expectStatus("specialist other detail", "/api/admin/leads/role-smoke-other-lead", specialistCookie, 403);
    await expectStatus("specialist update own lead", "/api/admin/leads/role-smoke-owned-lead", specialistCookie, 200, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "contacted", documentStatus: "pending" }),
    });
    await expectStatus("specialist update other lead", "/api/admin/leads/role-smoke-other-lead", specialistCookie, 403, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "contacted" }),
    });
    await expectStatus("specialist add note own lead", "/api/admin/notes", specialistCookie, 200, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leadId: "role-smoke-owned-lead", body: "專員可新增自己線索備註。" }),
    });
    await expectStatus("specialist cannot export leads", "/api/admin/leads/export", specialistCookie, 403);
    await expectStatus("specialist cannot read articles", "/api/admin/articles", specialistCookie, 403);
    await expectStatus("specialist cannot read settings", "/api/admin/settings", specialistCookie, 403);
    await expectStatus("specialist cannot download admin file", "/api/files/role-smoke-admin-file/download?source=/roles-smoke", specialistCookie, 404);

    const contentSummary = await expectStatus("content summary", "/api/admin/summary", contentCookie, 200);
    assertSummaryDoesNotExposeSensitiveFields("content", contentSummary.json, [
      "0911 111 111",
      "0922 222 222",
      "role-smoke-owned-leadLine",
      "role-smoke-other-leadLine",
      "角色煙測敏感備註",
      "role-smoke-sensitive-session",
      "127.0.0.203",
      "user-admin",
      "contact@example.invalid",
    ]);
    if ((contentSummary.json.latestLeads || []).length) {
      fail("content summary should not include lead preview rows");
    }
    await expectStatus("content articles", "/api/admin/articles", contentCookie, 200);
    await expectStatus("content files", "/api/admin/files", contentCookie, 200);
    await expectStatus("content categories", "/api/admin/article-categories", contentCookie, 200);
    await expectStatus("content cannot read leads", "/api/admin/leads", contentCookie, 403);
    await expectStatus("content cannot export leads", "/api/admin/leads/export", contentCookie, 403);
    await expectStatus("content cannot read settings", "/api/admin/settings", contentCookie, 403);
    await expectStatus("content can download admin file", "/api/files/role-smoke-admin-file/download?source=/roles-smoke", contentCookie, 200);
    await expectStatus("content can create draft article", "/api/admin/articles", contentCookie, 200, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "角色權限煙測草稿",
        slug: `role-smoke-${Date.now()}`,
        category: originalDB.articleCategories[0]?.name || "貸款知識",
        body: "內容營運可建立文章草稿。",
        status: "draft",
      }),
    });

    const readonlySummary = await expectStatus("readonly summary", "/api/admin/summary", readonlyCookie, 200);
    assertSummaryDoesNotExposeSensitiveFields("readonly", readonlySummary.json, [
      "0911 111 111",
      "0922 222 222",
      "role-smoke-owned-leadLine",
      "role-smoke-other-leadLine",
      "角色煙測敏感備註",
      "role-smoke-sensitive-session",
      "127.0.0.203",
      "user-admin",
      "contact@example.invalid",
    ]);
    if ((readonlySummary.json.latestLeads || []).length) {
      fail("readonly summary should not include lead preview rows");
    }
    await expectStatus("readonly cannot read leads", "/api/admin/leads", readonlyCookie, 403);
    await expectStatus("readonly cannot export leads", "/api/admin/leads/export", readonlyCookie, 403);
    await expectStatus("readonly cannot read articles", "/api/admin/articles", readonlyCookie, 403);
    await expectStatus("readonly cannot read files", "/api/admin/files", readonlyCookie, 403);
    await expectStatus("readonly cannot read settings", "/api/admin/settings", readonlyCookie, 403);
    await expectStatus("readonly cannot read audit logs", "/api/admin/audit-logs", readonlyCookie, 403);
    await expectStatus("readonly cannot read users", "/api/admin/users", readonlyCookie, 403);
    await expectStatus("readonly cannot run launch checklist", "/api/admin/launch-checklist", readonlyCookie, 403);
    await expectStatus("readonly cannot download admin file", "/api/files/role-smoke-admin-file/download?source=/roles-smoke", readonlyCookie, 404);

    console.log("roles smoke passed");
  } finally {
    if (backup !== null) {
      await writeDbSnapshot(backup, { dbPath, label: "roles-smoke" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
