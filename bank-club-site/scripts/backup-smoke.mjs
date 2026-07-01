import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readDbJson, readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const artifactPath = path.join(process.cwd(), "artifacts", "backup-drill", "latest.json");
const keepData = process.env.BACKUP_SMOKE_KEEP_DATA === "1";
const defaultPassword = "admin123";
const legacyDefaultPassword = "BankClub2026!";
const restorePhrase = "RESTORE BANK CLUB DATA";

function fail(message) {
  const error = new Error(message);
  error.name = "BackupSmokeError";
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

function sameOriginHeaders(cookie = "", ip = "127.0.0.199") {
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
    process.env.BACKUP_SMOKE_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    defaultPassword,
    legacyDefaultPassword,
  ].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);
  let loginResult = null;
  for (const password of passwordCandidates) {
    const result = await fetchJson("/api/admin/login", {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", "127.0.0.198"),
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: admin.email, password }),
    });
    loginResult = result;
    if (result.response.ok) break;
  }
  if (!loginResult?.response.ok) {
    fail(`admin login failed HTTP ${loginResult?.response.status}: ${loginResult?.json.message || "unknown error"}. Set BACKUP_SMOKE_ADMIN_PASSWORD to the current local admin password.`);
  }
  const cookie = cookieFromSetCookie(loginResult.response.headers);
  if (!cookie) fail("admin login did not return bank_club_session cookie");
  if (loginResult.json.user?.role !== "super_admin") fail(`admin login returned unexpected role: ${loginResult.json.user?.role}`);
  return { cookie, admin };
}

function countArrays(db) {
  return Object.fromEntries(
    Object.entries(db).map(([key, value]) => [key, Array.isArray(value) ? value.length : typeof value]),
  );
}

function validateBackup(backup, adminId) {
  if (backup.schema !== "bank-club-json-db-v1") fail(`unexpected backup schema: ${backup.schema}`);
  if (!backup.exportedAt || !backup.exportedBy?.id) fail("backup missing exportedAt/exportedBy");
  const data = backup.data;
  if (!data || !Array.isArray(data.users) || !Array.isArray(data.leads) || !Array.isArray(data.files)) {
    fail("backup data missing users/leads/files arrays");
  }
  if (!data.users.some((user) => user.id === adminId && user.role === "super_admin")) {
    fail("backup does not include current super admin");
  }
  if (!data.auditLogs.some((log) => log.action === "database_backup_exported")) {
    fail("backup export did not write database_backup_exported audit log");
  }
}

function auditActions(db) {
  return (db.auditLogs || []).map((log) => log.action);
}

async function writeBackupDrillArtifact(artifact) {
  await mkdir(path.dirname(artifactPath), { recursive: true });
  await writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
}

async function run() {
  const backupBefore = keepData ? null : await readDbSnapshot(dbPath);
  const originalDB = JSON.parse(backupBefore || await readDbSnapshot(dbPath));
  try {
    const { cookie, admin } = await adminLogin(originalDB);
    const headers = { ...sameOriginHeaders(cookie), "content-type": "application/json" };

    const exportResponse = await fetch(`${baseUrl}/api/admin/backup`, {
      headers: sameOriginHeaders(cookie),
    });
    const downloadedBackup = await parseJson(exportResponse);
    if (!exportResponse.ok) fail(`backup export failed HTTP ${exportResponse.status}: ${downloadedBackup.message || ""}`);
    validateBackup(downloadedBackup, admin.id);

    const dryRun = await fetchJson("/api/admin/backup", {
      method: "POST",
      headers,
      body: JSON.stringify({ backup: downloadedBackup, dryRun: true }),
    });
    if (!dryRun.response.ok || dryRun.json.dryRun !== true) {
      fail(`backup dry run failed HTTP ${dryRun.response.status}: ${dryRun.json.message || ""}`);
    }
    if (dryRun.json.summary?.users !== downloadedBackup.data.users.length) {
      fail("backup dry run summary does not match exported backup");
    }
    const dryRunDB = await readDbJson(dbPath);
    if (!auditActions(dryRunDB).includes("database_backup_restore_checked")) {
      fail("backup dry run did not write database_backup_restore_checked audit log");
    }

    const wrongConfirm = await fetchJson("/api/admin/backup", {
      method: "POST",
      headers,
      body: JSON.stringify({ backup: downloadedBackup, dryRun: false, confirmText: "WRONG PHRASE" }),
    });
    if (wrongConfirm.response.status !== 400 || !String(wrongConfirm.json.message || "").includes(restorePhrase)) {
      fail(`backup restore accepted wrong confirm phrase or returned unexpected response: HTTP ${wrongConfirm.response.status}`);
    }

    const restore = await fetchJson("/api/admin/backup", {
      method: "POST",
      headers,
      body: JSON.stringify({ backup: downloadedBackup, dryRun: false, confirmText: restorePhrase }),
    });
    if (!restore.response.ok || restore.json.dryRun !== false) {
      fail(`backup restore failed HTTP ${restore.response.status}: ${restore.json.message || ""}`);
    }

    const restoredDB = await readDbJson(dbPath);
    const restoredAuditActions = auditActions(restoredDB);
    if (!restoredAuditActions.includes("database_backup_restored")) {
      fail("backup restore did not write database_backup_restored audit log");
    }
    if (!restoredDB.users.some((user) => user.id === admin.id && user.role === "super_admin")) {
      fail("restored database does not include current super admin");
    }

    const summary = await fetchJson("/api/admin/summary", { headers });
    if (!summary.response.ok) fail(`post-restore admin summary failed HTTP ${summary.response.status}`);
    const verifiedActions = [
      "database_backup_exported",
      "database_backup_restore_checked",
      "database_backup_restored",
    ];
    await writeBackupDrillArtifact({
      schema: "bank-club-backup-drill-v1",
      status: "passed",
      verifiedAt: new Date().toISOString(),
      baseUrl,
      exportedAt: downloadedBackup.exportedAt,
      verifiedActions,
      dryRunSummary: dryRun.json.summary,
      restoredSummary: restore.json.summary,
      beforeCounts: countArrays(originalDB),
      restoredCounts: countArrays(restoredDB),
    });

    console.log(JSON.stringify({
      exportedAt: downloadedBackup.exportedAt,
      dryRunSummary: dryRun.json.summary,
      restoredSummary: restore.json.summary,
      verifiedAuditActions: verifiedActions,
      artifactPath,
      dryRunAuditActions: auditActions(dryRunDB).slice(0, 5),
      restoredAuditActions: restoredAuditActions.slice(0, 5),
      beforeCounts: countArrays(originalDB),
      restoredCounts: countArrays(restoredDB),
    }, null, 2));
  } finally {
    if (backupBefore !== null) {
      await writeDbSnapshot(backupBefore, { dbPath, label: "backup-smoke" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
