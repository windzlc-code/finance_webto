import { createHmac, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { readDbJson, readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const keepData = process.env.TWOFACTOR_SMOKE_KEEP_DATA === "1";
const defaultPassword = "admin123";
const legacyDefaultPassword = "BankClub2026!";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const stepMs = 30_000;

function fail(message) {
  const error = new Error(message);
  error.name = "TwoFactorSmokeError";
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

function sameOriginHeaders(cookie = "", ip = "127.0.0.188") {
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

function decodeBase32(secret) {
  const normalized = secret.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  let bits = "";
  for (const char of normalized) {
    const value = alphabet.indexOf(char);
    if (value === -1) fail(`invalid TOTP secret character: ${char}`);
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

function counterBuffer(counter) {
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter >>> 0, 4);
  return buffer;
}

function generateTotp(secret, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / stepMs);
  const hmac = createHmac("sha1", decodeBase32(secret)).update(counterBuffer(counter)).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 10 ** 6).padStart(6, "0");
}

function assertLocalTotp(secret, token) {
  const expected = generateTotp(secret);
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(token))) {
    fail("local TOTP generator produced inconsistent token");
  }
}

async function adminLogin(admin, options = {}) {
  const passwordCandidates = [
    process.env.TWOFACTOR_SMOKE_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    defaultPassword,
    legacyDefaultPassword,
  ].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);

  let lastResult = null;
  for (const password of passwordCandidates) {
    const result = await fetchJson("/api/admin/login", {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", options.ip || "127.0.0.187"),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: admin.email,
        password,
        ...(options.token ? { twoFactorToken: options.token } : {}),
      }),
    });
    lastResult = result;
    if (result.response.ok) return { ...result, password };
    if (result.json?.requiresTwoFactor) return { ...result, password };
  }

  return { ...lastResult, password: "" };
}

async function run() {
  const backup = keepData ? null : await readDbSnapshot(dbPath);
  const originalDB = JSON.parse(backup || await readDbSnapshot(dbPath));
  const admin = originalDB.users.find((user) => user.role === "super_admin") || originalDB.users[0];
  if (!admin) fail("database has no admin user");

  const smokeDB = structuredClone(originalDB);
  const smokeAdmin = smokeDB.users.find((user) => user.id === admin.id);
  if (!smokeAdmin) fail("selected admin missing from smoke database");
  smokeAdmin.twoFactorEnabled = false;
  smokeAdmin.twoFactorSecret = "";
  smokeAdmin.twoFactorConfirmedAt = "";

  try {
    await writeDbSnapshot(JSON.stringify(smokeDB, null, 2), { dbPath, label: "twofactor-smoke" });

    const login = await adminLogin(admin);
    if (!login.response?.ok) {
      fail(`admin login failed HTTP ${login.response?.status}: ${login.json?.message || "unknown error"}. Set TWOFACTOR_SMOKE_ADMIN_PASSWORD to the current local admin password.`);
    }
    const cookie = cookieFromSetCookie(login.response.headers);
    if (!cookie) fail("admin login did not return bank_club_session cookie");
    const headers = { ...sameOriginHeaders(cookie), "content-type": "application/json" };

    const initial = await fetchJson("/api/admin/two-factor", { headers });
    if (!initial.response.ok || initial.json.twoFactor?.enabled) {
      fail("initial 2FA state should be disabled for smoke");
    }

    const prepared = await fetchJson("/api/admin/two-factor", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "prepare" }),
    });
    const secret = prepared.json.twoFactor?.secret || "";
    if (!prepared.response.ok || !/^[A-Z2-7]+$/.test(secret) || !prepared.json.twoFactor?.setupUri?.startsWith("otpauth://totp/")) {
      fail(`2FA prepare failed HTTP ${prepared.response.status}: ${prepared.json.message || "missing secret/setupUri"}`);
    }

    const invalidEnable = await fetchJson("/api/admin/two-factor", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "enable", token: "000000" }),
    });
    if (invalidEnable.response.status !== 400) {
      fail(`2FA enable should reject invalid token, got HTTP ${invalidEnable.response.status}`);
    }

    const token = generateTotp(secret);
    assertLocalTotp(secret, token);
    const enabled = await fetchJson("/api/admin/two-factor", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "enable", token }),
    });
    if (!enabled.response.ok || enabled.json.twoFactor?.enabled !== true || enabled.json.twoFactor?.secret) {
      fail(`2FA enable failed HTTP ${enabled.response.status}: ${enabled.json.message || "missing enabled state"}`);
    }

    const loginWithoutToken = await adminLogin(admin, { ip: "127.0.0.186" });
    if (loginWithoutToken.response?.status !== 401 || !String(loginWithoutToken.json?.message || "").includes("二階段")) {
      fail(`2FA login without token should fail with 401, got HTTP ${loginWithoutToken.response?.status}`);
    }

    const loginWithToken = await adminLogin(admin, { token: generateTotp(secret), ip: "127.0.0.185" });
    if (!loginWithToken.response?.ok || loginWithToken.json.user?.twoFactorEnabled !== true) {
      fail(`2FA login with token failed HTTP ${loginWithToken.response?.status}: ${loginWithToken.json?.message || ""}`);
    }

    const disable = await fetchJson("/api/admin/two-factor", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "disable", token: generateTotp(secret) }),
    });
    if (!disable.response.ok || disable.json.twoFactor?.enabled !== false || disable.json.twoFactor?.secret) {
      fail(`2FA disable failed HTTP ${disable.response.status}: ${disable.json.message || "missing disabled state"}`);
    }

    const db = await readDbJson(dbPath);
    const auditActions = db.auditLogs.map((log) => log.action);
    for (const action of ["two_factor_prepare", "two_factor_enabled", "two_factor_disabled"]) {
      if (!auditActions.includes(action)) fail(`missing audit action ${action}`);
    }

    console.log(JSON.stringify({
      adminEmail: admin.email,
      preparedSecretLength: secret.length,
      setupUriPrefix: prepared.json.twoFactor.setupUri.slice(0, 18),
      loginWithoutTokenStatus: loginWithoutToken.response.status,
      loginWithTokenUser: loginWithToken.json.user.email,
      auditedActions: auditActions.filter((action) => action.startsWith("two_factor")),
    }, null, 2));
  } finally {
    if (backup !== null) {
      await writeDbSnapshot(backup, { dbPath, label: "twofactor-smoke" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
