import path from "node:path";
import { readDbJson, readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const keepData = process.env.FILES_SMOKE_KEEP_DATA === "1";
const defaultPassword = "admin123";
const legacyDefaultPassword = "BankClub2026!";

function fail(message) {
  const error = new Error(message);
  error.name = "FilesSmokeError";
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

function sameOriginHeaders(cookie = "", ip = "127.0.0.147") {
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
    process.env.FILES_SMOKE_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    defaultPassword,
    legacyDefaultPassword,
  ].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);

  let loginResult = null;
  for (const password of passwordCandidates) {
    const result = await fetchJson("/api/admin/login", {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", "127.0.0.146"),
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: admin.email, password }),
    });
    loginResult = result;
    if (result.response.ok) break;
  }
  if (!loginResult?.response.ok) {
    fail(`admin login failed HTTP ${loginResult?.response.status}: ${loginResult?.json.message || "unknown error"}. Set FILES_SMOKE_ADMIN_PASSWORD to the current local admin password.`);
  }
  const cookie = cookieFromSetCookie(loginResult.response.headers);
  if (!cookie) fail("admin login did not return bank_club_session cookie");
  if (loginResult.json.user?.role !== "super_admin") fail(`admin login returned unexpected role: ${loginResult.json.user?.role}`);
  return { cookie };
}

async function readDb() {
  return readDbJson(dbPath);
}

function visibleText(html) {
  return html
    .replace(/<!-- -->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function assertPdf(response, bytes, label) {
  const contentType = response.headers.get("content-type") || "";
  const contentDisposition = response.headers.get("content-disposition") || "";
  const header = Buffer.from(bytes.slice(0, 8)).toString("ascii");
  if (!response.ok || !contentType.includes("application/pdf") || !contentDisposition.includes(".pdf") || !header.startsWith("%PDF")) {
    fail(`${label}: expected PDF download, got HTTP ${response.status}, content-type=${contentType}, disposition=${contentDisposition}, header=${header}`);
  }
}

async function run() {
  const backup = keepData ? null : await readDbSnapshot(dbPath);
  const originalDB = JSON.parse(backup || await readDbSnapshot(dbPath));
  const originalCredit = originalDB.files.find((file) => file.id === "file-credit");
  if (!originalCredit) fail("seed file file-credit is missing");

  try {
    const { cookie } = await adminLogin(originalDB);
    const adminHeaders = { ...sameOriginHeaders(cookie), "content-type": "application/json" };
    const sessionId = `files-smoke-${Date.now()}`;

    const publicDownload = await fetch(`${baseUrl}/api/files/file-credit/download?source=/documents&source_channel=seo&session_id=${encodeURIComponent(sessionId)}`);
    const publicBytes = new Uint8Array(await publicDownload.arrayBuffer());
    assertPdf(publicDownload, publicBytes, "public file download");

    const afterPublicDownload = await readDb();
    const downloadedCredit = afterPublicDownload.files.find((file) => file.id === "file-credit");
    if (downloadedCredit.downloads !== originalCredit.downloads + 1) {
      fail(`public download count did not increment: ${downloadedCredit.downloads} !== ${originalCredit.downloads + 1}`);
    }
    const downloadEvent = afterPublicDownload.events.find(
      (event) =>
        event.eventName === "file_download" &&
        event.metadata?.fileId === "file-credit" &&
        event.sessionId === sessionId &&
        event.sourceChannel === "seo",
    );
    if (!downloadEvent) fail("public file download did not write file_download event with session/source metadata");

    const filesList = await fetchJson("/api/admin/files", { headers: sameOriginHeaders(cookie) });
    if (!filesList.response.ok || !filesList.json.files?.some((file) => file.id === "file-credit")) {
      fail(`admin file list failed HTTP ${filesList.response.status}`);
    }
    const summaryAfterPublicDownload = await fetchJson("/api/admin/summary", { headers: sameOriginHeaders(cookie) });
    if (!summaryAfterPublicDownload.response.ok) fail(`admin summary failed HTTP ${summaryAfterPublicDownload.response.status}`);
    const creditDownloadStats = summaryAfterPublicDownload.json.fileDownloads?.["file-credit"];
    if (!creditDownloadStats || creditDownloadStats.totalDownloads < 1 || creditDownloadStats.publicDownloads < 1 || !creditDownloadStats.sourceChannels?.includes("seo")) {
      fail("summary fileDownloads did not count public credit file downloads by source channel");
    }

    const documentsLandingResponse = await fetch(`${baseUrl}/documents?files_smoke_landing=${encodeURIComponent(sessionId)}`);
    const documentsLandingHtml = await documentsLandingResponse.text();
    const documentsLandingText = visibleText(documentsLandingHtml);
    for (const expectedText of [
      "信用貸款文件準備清單",
      "房屋貸款文件準備清單",
      "企業貸款文件準備清單",
      "下載 信用貸款 PDF",
      "下載 房屋貸款 PDF",
      "下載 企業貸款 PDF",
      "財力證明不在本站普通表單上傳",
      "權狀、稅單與存摺透過 LINE",
      "敏感文件後續透過 LINE",
    ]) {
      if (!documentsLandingResponse.ok || !documentsLandingText.includes(expectedText)) {
        fail(`documents landing missing checklist copy: ${expectedText}`);
      }
    }
    for (const expectedHref of [
      "/api/files/file-credit/download?source=/documents&source_detail=credit",
      "/api/files/file-house/download?source=/documents&source_detail=house",
      "/api/files/file-business/download?source=/documents&source_detail=business",
    ]) {
      if (!documentsLandingHtml.includes(expectedHref) && !documentsLandingHtml.includes(expectedHref.replaceAll("&", "&amp;"))) {
        fail(`documents landing missing typed download href: ${expectedHref}`);
      }
    }

    const created = await fetchJson("/api/admin/files", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        title: "文件煙測公開清單",
        type: "qa_card",
        visibility: "public",
        description: "文件煙測建立的公開文字資源",
        content: "文件煙測 v1\n公開 QA 清單，可供下載與版本驗證。",
        sourceFilename: "files-smoke-public.md",
        sourceFileMime: "text/markdown",
        sourceFileSize: 80,
      }),
    });
    if (!created.response.ok || !created.json.file?.id) {
      fail(`admin file create failed HTTP ${created.response.status}: ${created.json.message || ""}`);
    }
    const fileId = created.json.file.id;
    if (created.json.file.version !== 1 || created.json.file.downloads !== 0 || created.json.file.sourceFilename !== "files-smoke-public.md") {
      fail("created file did not preserve source metadata/version defaults");
    }
    const createdDocumentsPage = await fetch(`${baseUrl}/documents?files_smoke=${encodeURIComponent(sessionId)}`);
    const createdDocumentsHtml = await createdDocumentsPage.text();
    const createdDocumentsText = visibleText(createdDocumentsHtml);
    if (
      !createdDocumentsPage.ok ||
      !createdDocumentsText.includes("文件煙測公開清單") ||
      !createdDocumentsText.includes("文件煙測建立的公開文字資源") ||
      !createdDocumentsHtml.includes(`/api/files/${fileId}/download?source=/documents`) ||
      !createdDocumentsText.includes("版本 v1") ||
      !createdDocumentsText.includes("已下載 0 次")
    ) {
      fail(`created public file did not render on /documents HTTP ${createdDocumentsPage.status}`);
    }

    const sensitive = await fetchJson("/api/admin/files", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        title: "敏感檔名應拒絕",
        type: "credit_docs",
        visibility: "public",
        content: "這筆資料不應建立",
        sourceFilename: "客戶身分證.txt",
        sourceFileMime: "text/plain",
        sourceFileSize: 20,
      }),
    });
    if (sensitive.response.status !== 400 || !String(sensitive.json.message || "").includes("敏感")) {
      fail(`sensitive filename import was not rejected as expected: HTTP ${sensitive.response.status}`);
    }

    const sensitiveContent = await fetchJson("/api/admin/files", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        title: "敏感內容應拒絕",
        type: "credit_docs",
        visibility: "public",
        content: "公開清單標題\n銀行帳號：123456789012\n薪轉明細 45000 46000 47000 48000",
        sourceFilename: "public-checklist.txt",
        sourceFileMime: "text/plain",
        sourceFileSize: 96,
      }),
    });
    if (sensitiveContent.response.status !== 400 || !String(sensitiveContent.json.message || "").includes("敏感")) {
      fail(`sensitive content import was not rejected as expected: HTTP ${sensitiveContent.response.status}`);
    }

    const sensitiveReplacement = await fetchJson(`/api/admin/files/${fileId}`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({
        replaceContent: true,
        content: "替換內容不應保存\n身分證 A123456789\n銀行流水 12000 13000 14000 15000",
        sourceFilename: "public-replacement.txt",
        sourceFileMime: "text/plain",
        sourceFileSize: 92,
      }),
    });
    if (sensitiveReplacement.response.status !== 400 || !String(sensitiveReplacement.json.message || "").includes("敏感")) {
      fail(`sensitive content replacement was not rejected as expected: HTTP ${sensitiveReplacement.response.status}`);
    }
    const afterRejectedReplacement = await fetchJson(`/api/admin/files/${fileId}`, { headers: sameOriginHeaders(cookie) });
    if (!afterRejectedReplacement.response.ok || afterRejectedReplacement.json.file?.version !== 1 || !afterRejectedReplacement.json.file?.content?.includes("文件煙測 v1")) {
      fail("rejected sensitive replacement changed the existing public file");
    }

    const updated = await fetchJson(`/api/admin/files/${fileId}`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({
        title: "文件煙測公開清單",
        type: "qa_card",
        visibility: "public",
        description: "文件煙測替換後的公開文字資源",
        replaceContent: true,
        content: "文件煙測 v2\n新版公開 QA 清單，可供下載與版本驗證。",
        sourceFilename: "files-smoke-public-v2.txt",
        sourceFileMime: "text/plain",
        sourceFileSize: 90,
      }),
    });
    if (!updated.response.ok || updated.json.file?.version !== 2 || updated.json.file?.fileVersionHistory?.[0]?.version !== 1) {
      fail(`file replace did not create version history HTTP ${updated.response.status}: ${updated.json.message || ""}`);
    }

    const currentTextResponse = await fetch(`${baseUrl}/api/files/${fileId}/download?format=txt&source=/documents&source_channel=website&session_id=${encodeURIComponent(sessionId)}`);
    const currentText = await currentTextResponse.text();
    if (!currentTextResponse.ok || !currentText.includes("文件煙測 v2")) {
      fail(`current text download did not return replaced content HTTP ${currentTextResponse.status}`);
    }

    const oldTextResponse = await fetch(`${baseUrl}/api/files/${fileId}/download?format=txt&version=1&source=/documents&source_channel=website&session_id=${encodeURIComponent(sessionId)}`);
    const oldText = await oldTextResponse.text();
    if (!oldTextResponse.ok || !oldText.includes("文件煙測 v1") || oldText.includes("文件煙測 v2")) {
      fail(`versioned text download did not return v1 history HTTP ${oldTextResponse.status}`);
    }
    const updatedDocumentsPage = await fetch(`${baseUrl}/documents?files_smoke_updated=${encodeURIComponent(sessionId)}`);
    const updatedDocumentsHtml = await updatedDocumentsPage.text();
    const updatedDocumentsText = visibleText(updatedDocumentsHtml);
    if (
      !updatedDocumentsPage.ok ||
      !updatedDocumentsText.includes("文件煙測替換後的公開文字資源") ||
      !updatedDocumentsText.includes("版本 v2") ||
      !updatedDocumentsText.includes("已下載 2 次")
    ) {
      fail(`updated public file version/download count did not render on /documents HTTP ${updatedDocumentsPage.status}`);
    }

    const adminOnly = await fetchJson("/api/admin/files", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        title: "文件煙測後台限定",
        type: "flow",
        visibility: "admin_only",
        description: "僅後台可下載",
        content: "文件煙測 admin only",
      }),
    });
    if (!adminOnly.response.ok || !adminOnly.json.file?.id) {
      fail(`admin-only file create failed HTTP ${adminOnly.response.status}: ${adminOnly.json.message || ""}`);
    }
    const adminOnlyId = adminOnly.json.file.id;
    const anonymousAdminOnly = await fetch(`${baseUrl}/api/files/${adminOnlyId}/download?format=txt`);
    if (anonymousAdminOnly.status !== 404) {
      fail(`anonymous admin-only download should return 404, got HTTP ${anonymousAdminOnly.status}`);
    }
    const authorizedAdminOnly = await fetch(`${baseUrl}/api/files/${adminOnlyId}/download?format=txt`, {
      headers: sameOriginHeaders(cookie),
    });
    const authorizedAdminOnlyText = await authorizedAdminOnly.text();
    if (!authorizedAdminOnly.ok || !authorizedAdminOnlyText.includes("文件煙測 admin only")) {
      fail(`authorized admin-only download failed HTTP ${authorizedAdminOnly.status}`);
    }

    const beforeDeleteDB = await readDb();
    const smokeFileBeforeDelete = beforeDeleteDB.files.find((file) => file.id === fileId);
    if (!smokeFileBeforeDelete || smokeFileBeforeDelete.downloads !== 2 || smokeFileBeforeDelete.version !== 2) {
      fail("created smoke file did not record current and versioned downloads");
    }
    const smokeDownloadEvents = beforeDeleteDB.events.filter((event) => event.eventName === "file_download" && event.metadata?.fileId === fileId);
    if (smokeDownloadEvents.length < 2) fail("smoke file downloads did not write file_download events");

    const deletedPublic = await fetchJson(`/api/admin/files/${fileId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    if (!deletedPublic.response.ok || deletedPublic.json.ok !== true) {
      fail(`public file delete failed HTTP ${deletedPublic.response.status}: ${deletedPublic.json.message || ""}`);
    }
    const removedDocumentsPage = await fetch(`${baseUrl}/documents?files_smoke_deleted=${encodeURIComponent(sessionId)}`);
    const removedDocumentsHtml = await removedDocumentsPage.text();
    const removedDocumentsText = visibleText(removedDocumentsHtml);
    if (!removedDocumentsPage.ok || removedDocumentsText.includes("文件煙測公開清單")) {
      fail(`deleted public file still rendered on /documents HTTP ${removedDocumentsPage.status}`);
    }

    const deletedAdminOnly = await fetchJson(`/api/admin/files/${adminOnlyId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    if (!deletedAdminOnly.response.ok || deletedAdminOnly.json.ok !== true) {
      fail(`admin-only file delete failed HTTP ${deletedAdminOnly.response.status}: ${deletedAdminOnly.json.message || ""}`);
    }

    const finalDB = await readDb();
    const auditActions = finalDB.auditLogs.map((log) => log.action);
    for (const action of ["file_created", "file_replaced", "file_deleted", "file_admin_downloaded"]) {
      if (!auditActions.includes(action)) fail(`missing audit action ${action}`);
    }
    if (!finalDB.deletedFileIds.includes(fileId) || !finalDB.deletedFileIds.includes(adminOnlyId)) {
      fail("deleted file IDs were not retained in deletedFileIds");
    }

    console.log(JSON.stringify({
      publicDownload: {
        fileId: "file-credit",
        bytes: publicBytes.length,
        downloadsBefore: originalCredit.downloads,
        downloadsAfter: downloadedCredit.downloads,
        eventId: downloadEvent.id,
        summaryStats: creditDownloadStats,
      },
      createdFile: {
        fileId,
        version: smokeFileBeforeDelete.version,
        downloads: smokeFileBeforeDelete.downloads,
        historyVersions: smokeFileBeforeDelete.fileVersionHistory.map((version) => version.version),
        renderedOnDocuments: true,
        removedFromDocumentsAfterDelete: true,
      },
      adminOnly: {
        fileId: adminOnlyId,
        anonymousStatus: anonymousAdminOnly.status,
        authorizedStatus: authorizedAdminOnly.status,
        deleted: finalDB.deletedFileIds.includes(adminOnlyId),
      },
      auditActions: auditActions.filter((action) => action.startsWith("file_")),
    }, null, 2));
  } finally {
    if (backup !== null) {
      await writeDbSnapshot(backup, { dbPath, label: "files-smoke" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
