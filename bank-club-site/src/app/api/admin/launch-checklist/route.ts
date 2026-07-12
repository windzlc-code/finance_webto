import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { canRunLaunchChecklist, requireAdmin } from "@/lib/auth";
import { createFbPostText } from "@/lib/fb-posts";
import { detectSensitiveFileResourceContent } from "@/lib/file-resource-policy";
import { materialAssets, materialAssetPath } from "@/lib/material-assets";
import { knownDefaultAdminPasswords } from "@/lib/security-defaults";
import { readDB } from "@/lib/store";
import type { FileResource } from "@/lib/types";

type CheckStatus = "pass" | "warn" | "fail";
type LaunchCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
};

const publicPaths = [
  "/",
  "/credit-loan",
  "/house-loan",
  "/business-loan",
  "/application-flow",
  "/qa",
  "/consultation",
  "/facebook",
  "/contact",
  "/blog",
  "/privacy",
  "/risk",
  "/terms",
  "/site-map",
  "/sitemap.xml",
  "/robots.txt",
  "/api/health",
];
const requiredFileTypes: Array<FileResource["type"]> = ["credit_docs", "house_docs", "business_docs", "flow", "qa_card", "fb_material"];
const launchReadinessRequirements = [
  ["domainHttpsConfirmed", "正式域名 / HTTPS"],
  ["lineEntryConfirmed", "LINE 入口"],
  ["fbGroupConfirmed", "FB 社團"],
  ["officialApplyConfirmed", "官方申請連結"],
  ["brandAuthorizationConfirmed", "品牌授權"],
  ["ga4Confirmed", "GA4 收數"],
  ["searchConsoleConfirmed", "Search Console"],
  ["notificationWebhookConfirmed", "通知 Webhook"],
  ["backupDrillConfirmed", "備份演練"],
  ["pageSpeedConfirmed", "PageSpeed"],
  ["legalReviewConfirmed", "法務 / 合規確認"],
] as const;
const backupDrillArtifact = path.join(process.cwd(), "artifacts", "backup-drill", "latest.json");
const backupDrillSchema = "bank-club-backup-drill-v1";
const backupDrillMaxAgeMs = 30 * 24 * 60 * 60 * 1000;
const requiredArticleSlugs = [
  "credit-application-fields",
  "online-application-back-button-crash",
  "employee-self-employed-income-documents",
  "loan-purpose-risk",
];
const requiredQaQuestionPhrases = [
  "網路申貸點上一頁當機",
  "信貸財力證明需要哪些資料",
  "上班族和自營業主文件差異",
  "資金用途填投資理財",
  "申請金額、申請年限、案件來源和適用方案",
  "年齡加貸款年限超過 65 歲",
  "自營業主沒有薪資單",
  "財力證明一定要紙本",
  "平台是否銀行官方",
  "是否保證核貸",
];
const copyScanPaths = publicPaths.filter((path) => !path.startsWith("/api") && !path.endsWith(".xml") && !path.endsWith(".txt"));
const performancePaths = copyScanPaths.filter((path) => path !== "/admin");
const fullFooterPaths = copyScanPaths;
const maxHtmlBytes = 260 * 1024;
const maxResponseMs = 1500;
const maxStaticScriptBytes = 760 * 1024;
const maxStaticStyleBytes = 90 * 1024;
const maxStaticScriptCount = 12;
const maxStaticStyleCount = 4;
const cleanArticleSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const minPasswordHashIterations = 310_000;
const testResiduePattern = /\b(?:smoke|test|dummy|sample|example|demo)\b|測試|测试|煙測|role-smoke|form-smoke|crm-smoke|social-smoke|notification-smoke|tracking-smoke|search-smoke|visual-smoke|admin-ui-smoke|articles-smoke|files-smoke|backup-smoke|launch-smoke/i;
const sensitiveFormControlPattern = /id.?card|identity.?photo|income.?proof|salary.?slip|bank.?book|pass.?book|tax.?doc|financial.?proof|upload|身分證|身份证|財力|财力|存摺|存折|報稅|报税/i;
const prohibitedCopyPatterns = [
  { label: "保證過件", terms: ["保證過件", "保证过件"] },
  { label: "百分百核准", terms: ["百分百核准", "100%核准", "百分之百核准"] },
  { label: "絕對最低利率", terms: ["絕對最低利率", "绝对最低利率"] },
  { label: "不看信用", terms: ["不看信用"] },
  { label: "資金用途可亂填", terms: ["資金用途可亂填", "资金用途可乱填"] },
  { label: "教你規避銀行審核", terms: ["教你規避銀行審核", "教你规避银行审核"] },
  {
    label: "包裝財力",
    terms: ["包裝財力", "包装财力"],
    allowedContext: /(不協助|不协助|不得要求|禁止|不得|不可|不要|不建議|不建议).{0,40}(包裝財力|包装财力)/,
  },
  {
    label: "規避銀行審核",
    terms: ["規避銀行審核", "规避银行审核"],
    allowedContext: /(不協助|不协助|不得要求|禁止|不得|不可|不要|不建議|不建议).{0,40}(規避銀行審核|规避银行审核)/,
  },
  {
    label: "偽造文件協助",
    terms: ["偽造文件協助", "伪造文件协助", "協助偽造文件", "协助伪造文件", "偽造文件", "伪造文件"],
    allowedContext: /(不協助|不协助|不得要求|禁止|不得|不可|不要|不建議|不建议).{0,40}(偽造文件|伪造文件)|(偽造文件|伪造文件).{0,24}(可能|觸犯|触犯|法律|不得|禁止)/,
  },
];

function check(id: string, label: string, ok: boolean, detail: string, warning = false): LaunchCheck {
  return { id, label, status: ok ? "pass" : warning ? "warn" : "fail", detail };
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function duplicateValues(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value);
}

function checkUniqueRecordIds(
  id: string,
  label: string,
  records: Array<{ id?: string }>,
  entityLabel: string,
): LaunchCheck {
  const ids = records.map((record) => record.id || "");
  const missingCount = ids.filter((value) => !hasText(value)).length;
  const duplicates = duplicateValues(ids.filter(hasText));
  const ok = missingCount === 0 && duplicates.length === 0;
  return check(
    id,
    label,
    ok,
    ok
      ? `${records.length} 筆${entityLabel} ID 均唯一`
      : `缺少 ID ${missingCount} 筆；重複 ${duplicates.slice(0, 5).join(", ") || "無"}`,
  );
}

function checkUniqueTextField<T>(
  id: string,
  label: string,
  records: T[],
  fieldLabel: string,
  readValue: (record: T) => string,
): LaunchCheck {
  const values = records.map(readValue);
  const missingCount = values.filter((value) => !hasText(value)).length;
  const duplicates = duplicateValues(values.filter(hasText));
  const ok = missingCount === 0 && duplicates.length === 0;
  return check(
    id,
    label,
    ok,
    ok
      ? `${records.length} 筆${fieldLabel} 均已填寫且唯一`
      : `缺少 ${fieldLabel} ${missingCount} 筆；重複 ${duplicates.slice(0, 5).join(", ") || "無"}`,
  );
}

function checkLeadTrackingIntegrity(db: Awaited<ReturnType<typeof readDB>>): LaunchCheck {
  const requiredFields = ["id", "sourcePage", "sourceChannel", "sessionId", "consentAt", "consentVersion", "createdAt", "updatedAt"] as const;
  const utmFields = ["utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm"] as const;
  const failures = db.leads.flatMap((lead, index) => {
    const missing = requiredFields.filter((field) => !hasText(lead[field]));
    const malformedUtm = utmFields.filter((field) => typeof lead[field] !== "string");
    return missing.length || malformedUtm.length
      ? [`${lead.id || `#${index + 1}`}:缺少 ${missing.join(",") || "無"}；UTM 型別錯誤 ${malformedUtm.join(",") || "無"}`]
      : [];
  });

  return check(
    "data:lead-tracking",
    "線索來源與同意資料",
    failures.length === 0,
    failures.length
      ? failures.slice(0, 8).join("；")
      : `${db.leads.length} 筆線索均保存來源頁、來源渠道、UTM 欄位、session 與個資同意時間`,
  );
}

function checkLeadTimelineIntegrity(db: Awaited<ReturnType<typeof readDB>>): LaunchCheck {
  const optionalDateFields = ["appointmentTime", "nextFollowUpAt", "lastFollowUpAt"] as const;
  const requiredDateFields = ["consentAt", "createdAt", "updatedAt"] as const;
  const failures = db.leads.flatMap((lead, index) => {
    const label = lead.id || `#${index + 1}`;
    const missingRequired = requiredDateFields.filter((field) => !hasText(lead[field]));
    const invalidRequired = requiredDateFields.filter((field) => hasText(lead[field]) && !Number.isFinite(Date.parse(lead[field])));
    const invalidOptional = optionalDateFields.filter((field) => hasText(lead[field]) && !Number.isFinite(Date.parse(lead[field])));
    return missingRequired.length || invalidRequired.length || invalidOptional.length
      ? [`${label}:缺少 ${missingRequired.join(",") || "無"}；必填時間錯誤 ${invalidRequired.join(",") || "無"}；選填時間錯誤 ${invalidOptional.join(",") || "無"}`]
      : [];
  });

  return check(
    "data:lead-timeline",
    "線索時間與跟進排程",
    failures.length === 0,
    failures.length
      ? failures.slice(0, 8).join("；")
      : `${db.leads.length} 筆線索的同意、建立、更新、預約、下次跟進與最近跟進時間均為可解析格式`,
  );
}

function checkEventTrackingIntegrity(db: Awaited<ReturnType<typeof readDB>>): LaunchCheck {
  const failures = db.events.flatMap((event, index) => {
    const missing = ["id", "eventName", "pagePath", "sourceChannel", "createdAt"].filter((field) => !hasText(event[field as keyof typeof event]));
    const metadataOk = typeof event.metadata === "object" && event.metadata !== null && !Array.isArray(event.metadata);
    return missing.length || !metadataOk
      ? [`${event.id || `#${index + 1}`}:缺少 ${missing.join(",") || "無"}；metadata ${metadataOk ? "正常" : "錯誤"}`]
      : [];
  });

  return check(
    "data:event-tracking",
    "事件追蹤資料",
    failures.length === 0,
    failures.length ? failures.slice(0, 8).join("；") : `${db.events.length} 筆事件均保留事件名、頁面、來源渠道與 metadata`,
  );
}

function checkFileResourceIntegrity(db: Awaited<ReturnType<typeof readDB>>): LaunchCheck {
  const failures = db.files.flatMap((file, index) => {
    const missing = ["id", "title", "type", "visibility", "content", "createdAt", "updatedAt"].filter((field) => !hasText(file[field as keyof typeof file]));
    const invalidVersion = !Number.isInteger(file.version) || file.version < 1;
    const invalidDownloads = !Number.isInteger(file.downloads) || file.downloads < 0;
    const invalidSourceFields =
      typeof file.sourceFilename !== "string" ||
      typeof file.sourceFileMime !== "string" ||
      typeof file.sourceFileSize !== "number" ||
      typeof file.sourceUploadedAt !== "string";
    const invalidHistory = !Array.isArray(file.fileVersionHistory) || file.fileVersionHistory.some(
      (version) =>
        !hasText(version.id) ||
        !Number.isInteger(version.version) ||
        !hasText(version.content) ||
        typeof version.sourceFilename !== "string" ||
        typeof version.sourceFileMime !== "string" ||
        typeof version.sourceFileSize !== "number" ||
        !hasText(version.createdAt) ||
        !hasText(version.createdBy),
    );
    return missing.length || invalidVersion || invalidDownloads || invalidSourceFields || invalidHistory
      ? [
          `${file.id || `#${index + 1}`}:缺少 ${missing.join(",") || "無"}；版本 ${invalidVersion ? "錯誤" : "正常"}；下載數 ${invalidDownloads ? "錯誤" : "正常"}；來源欄位 ${invalidSourceFields ? "錯誤" : "正常"}；歷史 ${invalidHistory ? "錯誤" : "正常"}`,
        ]
      : [];
  });

  return check(
    "data:file-resource-shape",
    "文件資源資料",
    failures.length === 0,
    failures.length ? failures.slice(0, 8).join("；") : `${db.files.length} 份文件均保留內容、版本、來源檔欄位與下載統計`,
  );
}

function checkFileResourceSensitiveContent(db: Awaited<ReturnType<typeof readDB>>): LaunchCheck {
  const failures = db.files.flatMap((file) => {
    const findings = detectSensitiveFileResourceContent(file.content).map((reason) => `v${file.version}:${reason}`);
    for (const version of file.fileVersionHistory || []) {
      for (const reason of detectSensitiveFileResourceContent(version.content)) {
        findings.push(`v${version.version}:${reason}`);
      }
    }
    return findings.length ? [`${file.id}:${findings.slice(0, 4).join(",")}`] : [];
  });

  return check(
    "data:file-sensitive-content",
    "文件敏感內容掃描",
    failures.length === 0,
    failures.length ? `疑似敏感文件內容：${failures.slice(0, 8).join("；")}` : `${db.files.length} 份文件與歷史版本未發現身分證、帳戶或完整財力明細`,
  );
}

function checkAuditLogIntegrity(db: Awaited<ReturnType<typeof readDB>>): LaunchCheck {
  const failures = db.auditLogs.flatMap((log, index) => {
    const missing = ["id", "actorId", "action", "targetType", "targetId", "createdAt"].filter((field) => !hasText(log[field as keyof typeof log]));
    return missing.length ? [`${log.id || `#${index + 1}`}:缺少 ${missing.join(",")}`] : [];
  });

  return check(
    "data:audit-log-shape",
    "後台操作日誌資料",
    failures.length === 0,
    failures.length ? failures.slice(0, 8).join("；") : `${db.auditLogs.length} 筆日誌均保留操作者、動作、目標與時間`,
  );
}

function checkLeadRelationIntegrity(db: Awaited<ReturnType<typeof readDB>>): LaunchCheck {
  const leadIds = new Set(db.leads.map((lead) => lead.id));
  const userIds = new Set(db.users.map((user) => user.id));
  const noteFailures = db.leadNotes.filter((note) => !leadIds.has(note.leadId) || !userIds.has(note.authorId));
  const assignmentFailures = db.leadAssignments.filter(
    (assignment) =>
      !leadIds.has(assignment.leadId) ||
      !userIds.has(assignment.actorId) ||
      (hasText(assignment.toUserId) && !userIds.has(assignment.toUserId)) ||
      (hasText(assignment.fromUserId) && !userIds.has(assignment.fromUserId)),
  );
  const ok = noteFailures.length === 0 && assignmentFailures.length === 0;

  return check(
    "data:lead-relations",
    "線索備註與指派關聯",
    ok,
    ok
      ? `${db.leadNotes.length} 筆備註、${db.leadAssignments.length} 筆指派均可對應線索與使用者`
      : `孤立備註 ${noteFailures.length} 筆；孤立指派 ${assignmentFailures.length} 筆`,
  );
}

function checkNoTestResidue(db: Awaited<ReturnType<typeof readDB>>): LaunchCheck {
  const findings: string[] = [];
  const inspect = (label: string, values: unknown[]) => {
    const text = values
      .filter((value) => value !== undefined && value !== null)
      .map((value) => typeof value === "string" ? value : JSON.stringify(value))
      .join(" ");
    if (testResiduePattern.test(text)) findings.push(label);
  };

  db.users.forEach((user) => inspect(`user:${user.id}`, [user.id, user.name, user.email, user.phone, user.lineId]));
  db.leads.forEach((lead) => inspect(`lead:${lead.id}`, [lead.id, lead.name, lead.phone, lead.lineId, lead.note, lead.sourcePage, lead.sourceChannel, lead.utmSource, lead.utmMedium, lead.utmCampaign, lead.utmContent, lead.utmTerm, lead.sessionId, lead.userAgent, lead.privacyRequestNote]));
  db.leadNotes.forEach((note) => inspect(`lead_note:${note.id}`, [note.id, note.leadId, note.body]));
  db.leadAssignments.forEach((assignment) => inspect(`lead_assignment:${assignment.id}`, [assignment.id, assignment.leadId, assignment.fromUserId, assignment.toUserId, assignment.actorId]));
  db.articles.forEach((article) => inspect(`article:${article.id}`, [article.id, article.title, article.slug, article.excerpt, article.body, article.seoTitle, article.seoDescription, article.fbSummary, article.complianceNotes]));
  db.articleCategories.forEach((category) => inspect(`article_category:${category.id}`, [category.id, category.name, category.slug, category.description]));
  db.files.forEach((file) => inspect(`file:${file.id}`, [file.id, file.title, file.description, file.content, file.sourceFilename, file.fileVersionHistory]));
  db.events.forEach((event) => inspect(`event:${event.id}`, [event.id, event.eventName, event.pagePath, event.leadId, event.sessionId, event.sourceChannel, event.metadata]));
  db.auditLogs.forEach((log) => inspect(`audit:${log.id}`, [log.id, log.actorId, log.action, log.targetType, log.targetId]));
  inspect("settings", [db.settings]);

  return check(
    "data:no-test-residue",
    "無測試資料外露",
    findings.length === 0,
    findings.length ? `疑似測試資料殘留：${findings.slice(0, 10).join("、")}` : "使用者、線索、事件、日誌、文章與文件未發現 smoke/test/demo 殘留標記",
  );
}

function checkPasswordHashStrength(db: Awaited<ReturnType<typeof readDB>>): LaunchCheck {
  const failures = db.users.flatMap((user) => {
    const hash = user.passwordHash || "";
    const parts = hash.split("$");
    const [scheme, algorithm, iterations, salt, digest] = parts;
    const iterationCount = Number(iterations);
    const knownPlaintext = knownDefaultAdminPasswords.has(hash);
    const valid =
      parts.length === 5 &&
      scheme === "pbkdf2" &&
      algorithm === "sha256" &&
      Number.isInteger(iterationCount) &&
      iterationCount >= minPasswordHashIterations &&
      /^[A-Za-z0-9_-]{16,}$/.test(salt || "") &&
      /^[A-Za-z0-9_-]{32,}$/.test(digest || "") &&
      !knownPlaintext;
    return valid ? [] : [`${user.id}: passwordHash 格式或強度不合格`];
  });

  return check(
    "security:password-hashes",
    "後台密碼雜湊",
    failures.length === 0,
    failures.length ? failures.slice(0, 8).join("；") : `${db.users.length} 位後台使用者均使用 PBKDF2-SHA256 ${minPasswordHashIterations}+ 次雜湊`,
  );
}

async function checkBackupDrillReadiness(db: Awaited<ReturnType<typeof readDB>>): Promise<LaunchCheck> {
  const hasAuditEvidence = db.auditLogs.some((log) => ["database_backup_exported", "database_backup_restored"].includes(log.action));
  if (hasAuditEvidence) {
    return check("security:backup-log", "備份演練紀錄", true, "操作日誌保留備份匯出或還原紀錄");
  }

  try {
    const raw = await readFile(backupDrillArtifact, "utf8");
    const artifact = JSON.parse(raw) as {
      schema?: string;
      status?: string;
      verifiedAt?: string;
      verifiedActions?: string[];
      restoredCounts?: { users?: number; articles?: number; files?: number };
    };
    const verifiedAt = Date.parse(artifact.verifiedAt || "");
    const fresh = Number.isFinite(verifiedAt) && Date.now() - verifiedAt <= backupDrillMaxAgeMs;
    const hasActions = ["database_backup_exported", "database_backup_restore_checked", "database_backup_restored"].every((action) => artifact.verifiedActions?.includes(action));
    const hasCounts = Boolean(artifact.restoredCounts?.users && artifact.restoredCounts?.articles && artifact.restoredCounts?.files);
    const ok = artifact.schema === backupDrillSchema && artifact.status === "passed" && fresh && hasActions && hasCounts;
    return check(
      "security:backup-log",
      "備份演練紀錄",
      ok,
      ok
        ? `最近備份演練通過：${artifact.verifiedAt}`
        : "備份演練紀錄格式、時間、動作或還原摘要不完整",
      true,
    );
  } catch {
    return check(
      "security:backup-log",
      "備份演練紀錄",
      false,
      "目前操作日誌未保留備份匯出或還原紀錄，且 artifacts/backup-drill/latest.json 不存在",
      true,
    );
  }
}

function checkPublishedArticleGovernance(db: Awaited<ReturnType<typeof readDB>>): LaunchCheck {
  const publishedArticles = db.articles.filter((article) => article.status === "published");
  const failures = publishedArticles.flatMap((article) => {
    const missing = [
      !article.complianceChecked ? "complianceChecked" : "",
      !hasText(article.complianceReviewedAt) ? "complianceReviewedAt" : "",
      !hasText(article.complianceReviewedBy) ? "complianceReviewedBy" : "",
      !hasText(article.publishedAt) ? "publishedAt" : "",
      !hasText(article.publishedBy) ? "publishedBy" : "",
      !hasText(article.lastModifiedBy) ? "lastModifiedBy" : "",
      !Array.isArray(article.revisionHistory) || !article.revisionHistory.some((entry) => entry.action === "published") ? "revisionHistory:published" : "",
    ].filter(Boolean);
    return missing.length ? [`${article.slug}:缺少 ${missing.join(",")}`] : [];
  });

  return check(
    "content:article-governance",
    "已發布文章合規發布記錄",
    publishedArticles.length > 0 && failures.length === 0,
    failures.length
      ? failures.slice(0, 10).join("；")
      : `${publishedArticles.length} 篇已發布文章均保留合規復核、發布人/時間、最後修改人與發布修訂記錄`,
  );
}

function checkArticleFbPostReadiness(db: Awaited<ReturnType<typeof readDB>>): LaunchCheck {
  const publishedArticles = db.articles.filter((article) => article.status === "published");
  const invalidTracking = publishedArticles.flatMap((article) => {
    const missing = [
      !["not_started", "copied", "posted"].includes(article.fbPostStatus) ? "fbPostStatus" : "",
      typeof article.fbPostUrl !== "string" ? "fbPostUrl" : "",
      typeof article.fbPostedAt !== "string" ? "fbPostedAt" : "",
      typeof article.fbPostNote !== "string" ? "fbPostNote" : "",
      article.fbPostStatus === "posted" && !/^https?:\/\/(?:www\.|m\.)?facebook\.com\/.+/i.test(article.fbPostUrl) ? "有效 FB 貼文網址" : "",
      article.fbPostStatus === "posted" && !article.fbPostedAt ? "fbPostedAt" : "",
    ].filter(Boolean);
    return missing.length ? [`${article.slug}:缺少 ${missing.join(",")}`] : [];
  });
  if (invalidTracking.length) {
    return check(
      "content:fb-post-readiness",
      "FB 社團導流發文狀態",
      false,
      invalidTracking.slice(0, 10).join("；"),
    );
  }

  const missingFbPosts = publishedArticles.filter((article) => article.fbPostStatus !== "posted");
  return check(
    "content:fb-post-readiness",
    "FB 社團導流發文狀態",
    missingFbPosts.length === 0,
    missingFbPosts.length
      ? `${missingFbPosts.length} 篇已發布文章尚未標記已發布到 FB：${missingFbPosts.slice(0, 5).map((article) => article.slug).join(", ")}`
      : `${publishedArticles.length} 篇已發布文章均已標記 FB 社團導流狀態`,
    missingFbPosts.length > 0,
  );
}

function checkArticleFbDraftReadiness(db: Awaited<ReturnType<typeof readDB>>, origin: string): LaunchCheck {
  const publishedArticles = db.articles.filter((article) => article.status === "published");
  const failures = publishedArticles.flatMap((article) => {
    const text = createFbPostText(article, origin);
    const missing = [
      !text.includes(article.title.trim()) ? "標題" : "",
      !text.includes((article.fbSummary || article.excerpt).trim()) ? "摘要" : "",
      !text.includes("非銀行或金融機構") || !text.includes("不保證核貸") ? "合規提醒" : "",
      !text.includes(`/blog/${article.slug}`) ? "文章連結" : "",
      !text.includes("utm_source=facebook") ? "utm_source" : "",
      !text.includes("utm_medium=group_post") ? "utm_medium" : "",
      !text.includes(`utm_campaign=${article.slug}`) ? "utm_campaign" : "",
    ].filter(Boolean);
    return missing.length ? [`${article.slug}:缺少 ${missing.join(",")}`] : [];
  });

  return check(
    "content:fb-draft-readiness",
    "FB 社團貼文草稿",
    publishedArticles.length > 0 && failures.length === 0,
    failures.length ? failures.slice(0, 10).join("；") : `${publishedArticles.length} 篇已發布文章均可產生含 UTM 回鏈與合規提醒的 FB 草稿`,
  );
}

function currentOrigin(request: Request) {
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "127.0.0.1:3000";
  return `${proto}://${host}`;
}

async function checkPublicPath(origin: string, path: string): Promise<LaunchCheck> {
  try {
    const response = await fetch(`${origin}${path}`, { cache: "no-store" });
    return check(
      `public:${path}`,
      `公開路徑 ${path}`,
      response.status >= 200 && response.status < 400,
      `HTTP ${response.status}`,
    );
  } catch (error) {
    return {
      id: `public:${path}`,
      label: `公開路徑 ${path}`,
      status: "fail",
      detail: error instanceof Error ? error.message : "request failed",
    };
  }
}

async function checkSecurityHeaders(origin: string): Promise<LaunchCheck[]> {
  try {
    const response = await fetch(`${origin}/`, { cache: "no-store" });
    const csp = response.headers.get("content-security-policy") || "";
    const isHttps = origin.startsWith("https://");
    const hsts = response.headers.get("strict-transport-security") || "";
    return [
      check(
        "headers:csp",
        "Content-Security-Policy",
        csp.includes("default-src 'self'") && csp.includes("frame-ancestors 'none'") && csp.includes("object-src 'none'"),
        csp ? "已設定 CSP" : "未設定 CSP",
      ),
      check(
        "headers:hsts",
        "Strict-Transport-Security",
        isHttps ? Boolean(hsts) : !hsts,
        isHttps ? hsts || "HTTPS 正式域名未設定 HSTS" : hsts ? `HTTP 環境不應送出 HSTS：${hsts}` : "HTTP 環境略過 HSTS",
        true,
      ),
      check(
        "headers:nosniff",
        "X-Content-Type-Options",
        response.headers.get("x-content-type-options") === "nosniff",
        response.headers.get("x-content-type-options") || "未設定 nosniff",
      ),
      check(
        "headers:frame-options",
        "X-Frame-Options",
        response.headers.get("x-frame-options") === "DENY",
        response.headers.get("x-frame-options") || "未設定 X-Frame-Options",
      ),
      check(
        "headers:referrer-policy",
        "Referrer-Policy",
        response.headers.get("referrer-policy") === "strict-origin-when-cross-origin",
        response.headers.get("referrer-policy") || "未設定 Referrer-Policy",
      ),
      check(
        "headers:permissions-policy",
        "Permissions-Policy",
        Boolean(response.headers.get("permissions-policy")?.includes("camera=()")),
        response.headers.get("permissions-policy") || "未設定 Permissions-Policy",
      ),
    ];
  } catch (error) {
    return [
      {
        id: "headers:security",
        label: "安全響應頭",
        status: "fail",
        detail: error instanceof Error ? error.message : "request failed",
      },
    ];
  }
}

function containsMarkup(html: string, pattern: string | RegExp) {
  return typeof pattern === "string" ? html.includes(pattern) : pattern.test(html);
}

async function checkHtmlMarkup(
  origin: string,
  path: string,
  id: string,
  label: string,
  required: Array<{ name: string; pattern: string | RegExp }>,
): Promise<LaunchCheck> {
  try {
    const response = await fetch(`${origin}${path}`, { cache: "no-store" });
    const html = await response.text();
    const missing = required.filter((item) => !containsMarkup(html, item.pattern)).map((item) => item.name);
    return check(
      id,
      label,
      response.ok && missing.length === 0,
      missing.length ? `缺少 ${missing.join("、")}` : `${path} SEO 標記完整`,
    );
  } catch (error) {
    return {
      id,
      label,
      status: "fail",
      detail: error instanceof Error ? error.message : "request failed",
    };
  }
}

async function checkSeoMarkup(origin: string, articleSlug: string | undefined): Promise<LaunchCheck[]> {
  const checks = [
    checkHtmlMarkup(origin, "/", "seo:home-meta", "首頁 SEO Meta", [
      { name: "canonical", pattern: 'rel="canonical"' },
      { name: "Open Graph", pattern: 'property="og:title"' },
      { name: "Twitter Card", pattern: 'name="twitter:card"' },
      { name: "Organization JSON-LD", pattern: '"@type":"Organization"' },
      { name: "Breadcrumb JSON-LD", pattern: '"@type":"BreadcrumbList"' },
    ]),
    checkHtmlMarkup(origin, "/qa", "seo:faq-jsonld", "FAQ 結構化資料", [
      { name: "FAQPage", pattern: '"@type":"FAQPage"' },
      { name: "Question", pattern: '"@type":"Question"' },
      { name: "Breadcrumb JSON-LD", pattern: '"@type":"BreadcrumbList"' },
    ]),
  ];

  if (articleSlug) {
    checks.push(
      checkHtmlMarkup(origin, `/blog/${articleSlug}`, "seo:article-jsonld", "文章 SEO 與結構化資料", [
        { name: "canonical", pattern: 'rel="canonical"' },
        { name: "Article JSON-LD", pattern: '"@type":"Article"' },
        { name: "Open Graph article", pattern: 'property="og:type" content="article"' },
        { name: "Twitter Card", pattern: 'name="twitter:card"' },
        { name: "Breadcrumb JSON-LD", pattern: '"@type":"BreadcrumbList"' },
      ]),
    );
  } else {
    checks.push(Promise.resolve(check("seo:article-jsonld", "文章 SEO 與結構化資料", false, "尚無已發布文章可檢查")));
  }

  return Promise.all(checks);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractTitle(html: string) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlAttribute(stripHtml(match[1]).trim()) : "";
}

function extractMetaContent(html: string, attribute: "name" | "property", value: string) {
  const pattern = new RegExp(
    `<meta(?=[^>]+${attribute}=["']${escapeRegExp(value)}["'])(?=[^>]+content=["']([^"']+)["'])[^>]*>`,
    "i",
  );
  return decodeHtmlAttribute(html.match(pattern)?.[1] || "");
}

function extractCanonicalPath(html: string) {
  const match = html.match(/<link(?=[^>]+rel=["']canonical["'])(?=[^>]+href=["']([^"']+)["'])[^>]*>/i);
  const href = decodeHtmlAttribute(match?.[1] || "");
  if (!href) return "";
  try {
    return new URL(href).pathname;
  } catch {
    return "";
  }
}

function duplicateMetadataValues(entries: Array<{ path: string; value: string }>) {
  const pathsByValue = new Map<string, string[]>();
  for (const entry of entries) {
    const key = entry.value.trim();
    if (!key) continue;
    pathsByValue.set(key, [...(pathsByValue.get(key) || []), entry.path]);
  }
  return [...pathsByValue.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([value, paths]) => `${paths.join(", ")} 共用「${value.slice(0, 60)}」`);
}

function extractImgTags(html: string) {
  return [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
}

function extractAnchorTags(html: string) {
  return [...html.matchAll(/<a\b[^>]*>/gi)].map((match) => match[0]);
}

function extractScriptTags(html: string) {
  return [...html.matchAll(/<script\b[^>]*>/gi)].map((match) => match[0]);
}

function extractLinkTags(html: string) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
}

function extractFormControlTags(html: string) {
  return [...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/gi)].map((match) => match[0]);
}

function extractDetailsBlocks(html: string) {
  return [...html.matchAll(/<details\b[\s\S]*?<\/details>/gi)].map((match) => match[0]);
}

function extractAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\s${name}=(["'])([\\s\\S]*?)\\1`, "i"));
  return decodeHtmlAttribute(match?.[2] || "");
}

async function checkPublicPageSeoMetadata(origin: string): Promise<LaunchCheck> {
  const failures: string[] = [];
  const titles: Array<{ path: string; value: string }> = [];
  const descriptions: Array<{ path: string; value: string }> = [];

  for (const path of copyScanPaths) {
    try {
      const response = await fetch(`${origin}${path}`, { cache: "no-store" });
      const html = await response.text();
      if (!response.ok) {
        failures.push(`${path}:HTTP ${response.status}`);
        continue;
      }

      const title = extractTitle(html);
      const description = extractMetaContent(html, "name", "description");
      const ogTitle = extractMetaContent(html, "property", "og:title");
      const twitterCard = extractMetaContent(html, "name", "twitter:card");
      const canonicalPath = extractCanonicalPath(html);
      titles.push({ path, value: title });
      descriptions.push({ path, value: description });

      const missing = [
        !title ? "title" : "",
        !description ? "description" : "",
        canonicalPath !== path ? `canonical(${canonicalPath || "missing"})` : "",
        !ogTitle ? "og:title" : "",
        !twitterCard ? "twitter:card" : "",
      ].filter(Boolean);
      if (missing.length) failures.push(`${path}:缺少 ${missing.join(",")}`);
    } catch (error) {
      failures.push(`${path}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  const duplicateTitles = duplicateMetadataValues(titles);
  const duplicateDescriptions = duplicateMetadataValues(descriptions);
  failures.push(...duplicateTitles.map((item) => `title重複:${item}`));
  failures.push(...duplicateDescriptions.map((item) => `description重複:${item}`));

  return check(
    "seo:public-page-meta",
    "公開頁 SEO Meta 完整性",
    failures.length === 0,
    failures.length
      ? failures.slice(0, 10).join("；")
      : `${copyScanPaths.length} 個公開頁均有唯一 title、description、canonical、Open Graph 與 Twitter Card`,
  );
}

async function checkImageAltText(origin: string, db: Awaited<ReturnType<typeof readDB>>): Promise<LaunchCheck> {
  const paths = [
    ...copyScanPaths,
    ...db.articles
      .filter((article) => article.status === "published")
      .map((article) => `/blog/${article.slug}`),
  ];
  const failures: string[] = [];
  let imageCount = 0;

  for (const path of [...new Set(paths)]) {
    try {
      const response = await fetch(`${origin}${path}`, { cache: "no-store" });
      if (!response.ok) {
        failures.push(`${path}:HTTP ${response.status}`);
        continue;
      }
      const html = await response.text();
      const missing = extractImgTags(html)
        .map((tag, index) => {
          imageCount += 1;
          const alt = extractAttribute(tag, "alt").trim();
          return alt ? "" : `img#${index + 1}`;
        })
        .filter(Boolean);
      if (missing.length) failures.push(`${path}:${missing.slice(0, 5).join(",")} 缺少 alt`);
    } catch (error) {
      failures.push(`${path}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return check(
    "seo:image-alt",
    "圖片 Alt 文案",
    failures.length === 0,
    failures.length ? failures.slice(0, 10).join("；") : `${paths.length} 個公開/文章頁共 ${imageCount} 張圖片均有 alt`,
  );
}

async function checkArticleUrlSeoMetadata(origin: string, db: Awaited<ReturnType<typeof readDB>>): Promise<LaunchCheck> {
  const articles = db.articles.filter((article) => article.status === "published");
  const failures: string[] = [];

  if (!articles.length) {
    return check("seo:article-url-meta", "文章 URL 與 SEO Meta", false, "尚無已發布文章可檢查");
  }

  for (const article of articles) {
    const path = `/blog/${article.slug}`;
    const dataMissing = [
      !cleanArticleSlugPattern.test(article.slug) ? "slug不清晰" : "",
      article.slug.length > 96 ? "slug過長" : "",
      !hasText(article.seoTitle) ? "seoTitle" : "",
      !hasText(article.seoDescription) ? "seoDescription" : "",
    ].filter(Boolean);
    if (dataMissing.length) {
      failures.push(`${path}:資料缺少 ${dataMissing.join(",")}`);
      continue;
    }

    try {
      const response = await fetch(`${origin}${path}`, { cache: "no-store" });
      const html = await response.text();
      if (!response.ok) {
        failures.push(`${path}:HTTP ${response.status}`);
        continue;
      }

      const title = extractTitle(html);
      const description = extractMetaContent(html, "name", "description");
      const ogTitle = extractMetaContent(html, "property", "og:title");
      const ogType = extractMetaContent(html, "property", "og:type");
      const twitterCard = extractMetaContent(html, "name", "twitter:card");
      const canonicalPath = extractCanonicalPath(html);
      const missing = [
        !title.includes(article.seoTitle) ? "title" : "",
        description !== article.seoDescription ? "description" : "",
        canonicalPath !== path ? `canonical(${canonicalPath || "missing"})` : "",
        ogTitle !== article.seoTitle ? "og:title" : "",
        ogType !== "article" ? "og:type" : "",
        !twitterCard ? "twitter:card" : "",
      ].filter(Boolean);
      if (missing.length) failures.push(`${path}:缺少 ${missing.join(",")}`);
    } catch (error) {
      failures.push(`${path}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return check(
    "seo:article-url-meta",
    "文章 URL 與 SEO Meta",
    failures.length === 0,
    failures.length ? failures.slice(0, 10).join("；") : `${articles.length} 篇已發布文章均有清晰 URL、SEO title/description、canonical、OG 與 Twitter Card`,
  );
}

async function checkArticleBottomCtas(origin: string, db: Awaited<ReturnType<typeof readDB>>): Promise<LaunchCheck> {
  const articles = db.articles.filter((article) => article.status === "published");
  const failures: string[] = [];

  for (const article of articles) {
    const path = `/blog/${article.slug}`;
    try {
      const response = await fetch(`${origin}${path}`, { cache: "no-store" });
      const html = await response.text();
      if (!response.ok) {
        failures.push(`${path}:HTTP ${response.status}`);
        continue;
      }

      const articleCtaHtml = html.match(/<div\b(?=[^>]+class=["'][^"']*\barticle-cta\b[^"']*["'])[\s\S]*?<\/div>\s*<\/div>/i)?.[0] || "";
      if (!articleCtaHtml) {
        failures.push(`${path}:缺少文章底部 CTA 區塊`);
        continue;
      }

      const ctaTags = extractAnchorTags(articleCtaHtml);
      const ctaByEvent = new Map(ctaTags.map((tag) => [extractAttribute(tag, "data-event-name"), tag]));
      const formUrl = parseHref(origin, path, extractAttribute(ctaByEvent.get("blog_form_click") || "", "href"));
      const lineUrl = parseHref(origin, path, extractAttribute(ctaByEvent.get("blog_line_click") || "", "href"));
      const fbUrl = parseHref(origin, path, extractAttribute(ctaByEvent.get("blog_fb_click") || "", "href"));
      if (!formUrl || formUrl.origin !== origin || formUrl.pathname !== "/consultation" || formUrl.searchParams.get("source_page") !== "blog") {
        failures.push(`${path}:表單 CTA 缺少 blog_form_click 或 source_page=blog`);
      }
      if (!lineUrl || !isLineUrl(lineUrl, origin) || lineUrl.searchParams.get("source_page") !== "blog" || lineUrl.searchParams.get("source_detail") !== article.slug) {
        failures.push(`${path}:LINE CTA 缺少 blog_line_click、source_page=blog 或 source_detail=${article.slug}`);
      }
      if (!fbUrl || !isFacebookUrl(fbUrl) || fbUrl.searchParams.get("source_page") !== "blog" || fbUrl.searchParams.get("source_detail") !== article.slug) {
        failures.push(`${path}:FB CTA 缺少 blog_fb_click、source_page=blog 或 source_detail=${article.slug}`);
      }
    } catch (error) {
      failures.push(`${path}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return check(
    "cta:article-bottom",
    "文章底部 LINE / FB / 表單 CTA",
    failures.length === 0,
    failures.length ? failures.slice(0, 10).join("；") : `${articles.length} 篇已發布文章均輸出可追蹤的表單、LINE 與 FB 轉化入口`,
  );
}

async function checkSuccessPageContact(origin: string, db: Awaited<ReturnType<typeof readDB>>): Promise<LaunchCheck> {
  const leadId = "launch-check-success";
  try {
    const response = await fetch(`${origin}/success?lead_id=${leadId}`, { cache: "no-store" });
    const html = await response.text();
    if (!response.ok) {
      return check("flow:success-contact", "成功頁下一步聯繫資訊", false, `HTTP ${response.status}`);
    }

    const text = stripHtml(html);
    const lineHref = findHref(
      html,
      origin,
      "/success",
      (url) => isLineUrl(url, origin) && hasSearchParam(url, "source_page", "success") && hasSearchParam(url, "lead_id", leadId),
    );
    const fbHref = findHref(
      html,
      origin,
      "/success",
      (url) => isFacebookUrl(url) && hasSearchParam(url, "source_page", "success") && hasSearchParam(url, "lead_id", leadId),
    );
    const qrAltOk = extractImgTags(html).some((tag) => extractAttribute(tag, "alt").includes("LINE 一對一諮詢 QR Code"));
    const issues = [
      text.includes("已收到您的諮詢需求") ? "" : "缺少成功頁標題",
      text.includes(leadId) ? "" : "缺少線索編號",
      text.includes(db.settings.mobile) ? "" : "缺少行動電話",
      text.includes(db.settings.email) ? "" : "缺少 Email",
      text.includes("補件提醒") ? "" : "缺少補件提醒",
      text.includes("透過 LINE 與專員確認補件方式") ? "" : "缺少 LINE 補件確認提醒",
      text.includes("信用貸款只在專用模組收身分證正反面") || text.includes("身分證上傳狀態") ? "" : "缺少信貸身分證專用模組提示",
      text.includes("透過 LINE 與專員確認") && text.includes("財力證明") ? "" : "缺少財力與敏感文件 LINE 補件提示",
      qrAltOk ? "" : "缺少 LINE QR Code 圖片 alt",
      lineHref ? "" : "LINE CTA 缺少 success 來源或 lead_id",
      fbHref ? "" : "FB CTA 缺少 success 來源或 lead_id",
    ].filter(Boolean);

    return check(
      "flow:success-contact",
      "成功頁下一步聯繫資訊",
      issues.length === 0,
      issues.length
        ? issues.join("；")
        : "成功頁顯示線索編號、行動電話、Email、LINE QR Code、信貸專用身分證上傳邊界與 LINE 補件提醒，且 LINE/FB CTA 均保留 success 來源與 lead_id",
    );
  } catch (error) {
    return {
      id: "flow:success-contact",
      label: "成功頁下一步聯繫資訊",
      status: "fail",
      detail: error instanceof Error ? error.message : "request failed",
    };
  }
}

async function checkBrandAndLineQrAssets(origin: string, db: Awaited<ReturnType<typeof readDB>>): Promise<LaunchCheck> {
  const qrHref = db.settings.lineQrCodeUrl;
  const failures = [
    await validateImageAsset(origin, "LINE QR Code", qrHref),
  ].filter(Boolean);
  const expectedQrUrl = parseHref(origin, "/", qrHref);
  const pageRequirements = [
    { path: "/", label: "首頁", qr: true },
    { path: "/contact", label: "聯絡頁", qr: true },
    { path: "/success?lead_id=launch-check-assets", label: "成功頁", qr: true },
  ];

  for (const requirement of pageRequirements) {
    try {
      const response = await fetch(`${origin}${requirement.path}`, { cache: "no-store" });
      const html = await response.text();
      if (!response.ok) {
        failures.push(`${requirement.label}:HTTP ${response.status}`);
        continue;
      }
      const sourcePath = requirement.path.split("?")[0] || "/";
      const imageTags = extractImgTags(html);
      const hasQr = imageTags.some((tag) => {
        const src = parseHref(origin, sourcePath, extractAttribute(tag, "src"));
        return sameImageUrl(src, expectedQrUrl) && extractAttribute(tag, "alt").includes("LINE 一對一諮詢 QR Code");
      });
      if (requirement.qr && !hasQr) failures.push(`${requirement.label}:缺少可辨識 LINE QR Code 圖片`);
    } catch (error) {
      failures.push(`${requirement.label}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return check(
    "assets:brand-line-qr",
    "LINE QR 圖片",
    failures.length === 0,
    failures.length
      ? failures.slice(0, 8).join("；")
      : "LINE QR Code 圖片可讀取，且首頁、聯絡頁、成功頁均引用正確圖片與可辨識 alt",
  );
}

async function checkAdminLoginBranding(origin: string): Promise<LaunchCheck> {
  try {
    const response = await fetch(`${origin}/admin`, { cache: "no-store" });
    const html = await response.text();
    if (!response.ok) {
      return check("admin:login-branding", "後台登入頁品牌與索引設定", false, `HTTP ${response.status}`);
    }

    const text = stripHtml(html);
    const robots = extractMetaContent(html, "name", "robots").toLowerCase();
    const issues = [
      text.includes("銀行行員俱樂部後台") ? "" : "缺少後台登入標題",
      text.includes("線索、內容、文件與上線檢查管理入口") ? "" : "缺少獨立後台管理說明",
      robots.includes("noindex") ? "" : `robots meta 未設定 noindex(${robots || "missing"})`,
    ].filter(Boolean);

    return check(
      "admin:login-branding",
      "後台登入頁品牌與索引設定",
      issues.length === 0,
      issues.length ? issues.join("；") : "後台登入頁顯示後台管理說明，且設定 noindex 避免被搜尋引擎收錄",
    );
  } catch (error) {
    return check("admin:login-branding", "後台登入頁品牌與索引設定", false, error instanceof Error ? error.message : "request failed");
  }
}

async function checkSitemapCoverage(origin: string, db: Awaited<ReturnType<typeof readDB>>): Promise<LaunchCheck> {
  try {
    const response = await fetch(`${origin}/sitemap.xml`, { cache: "no-store" });
    const xml = await response.text();
    const staticPaths = ["/", "/credit-loan", "/house-loan", "/business-loan", "/application-flow", "/qa", "/blog"];
    const publishedArticlePaths = db.articles
      .filter((article) => article.status === "published")
      .map((article) => `/blog/${article.slug}`);
    const sitemapPaths = new Set(
      [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
        .map((match) => {
          try {
            return new URL(match[1]).pathname;
          } catch {
            return "";
          }
        })
        .filter(Boolean),
    );
    const requiredPaths = [...staticPaths, ...publishedArticlePaths];
    const missing = requiredPaths.filter((path) => !sitemapPaths.has(path));
    const draftLeaks = db.articles
      .filter((article) => article.status !== "published")
      .map((article) => `/blog/${article.slug}`)
      .filter((path) => sitemapPaths.has(path));
    const ok = response.ok && missing.length === 0 && draftLeaks.length === 0;

    return check(
      "seo:sitemap-coverage",
      "Sitemap 收錄範圍",
      ok,
      ok
        ? `${staticPaths.length} 個核心頁與 ${publishedArticlePaths.length} 篇已發布文章均在 sitemap，草稿未外洩`
        : `缺少 ${missing.slice(0, 8).join("、") || "無"}；草稿外洩 ${draftLeaks.slice(0, 8).join("、") || "無"}`,
    );
  } catch (error) {
    return {
      id: "seo:sitemap-coverage",
      label: "Sitemap 收錄範圍",
      status: "fail",
      detail: error instanceof Error ? error.message : "request failed",
    };
  }
}

async function checkSiteMapInformationArchitecture(origin: string): Promise<LaunchCheck> {
  const requiredCopy = [
    "首頁",
    "信用貸款",
    "房屋貸款",
    "企業貸款",
    "申請流程教學",
    "常見 QA",
    "免費諮詢預約",
    "FB 銀行行員俱樂部社團",
    "聯絡我們 / LINE 諮詢",
    "部落格文章列表",
    "隱私權政策與個資告知",
    "金融風險聲明",
    "服務條款",
    "後台登入頁",
    "後台儀表板",
    "後台線索管理頁",
    "後台文章管理頁",
    "後台文件資源管理頁",
    "後台統計頁",
  ];
  const requiredLinks = ["/", "/credit-loan", "/house-loan", "/business-loan", "/application-flow", "/qa", "/consultation", "/facebook", "/contact", "/blog", "/privacy", "/risk", "/terms", "/admin"];

  try {
    const response = await fetch(`${origin}/site-map`, { cache: "no-store" });
    const html = await response.text();
    if (!response.ok) return check("ia:site-map", "網站地圖信息架構", false, `HTTP ${response.status}`);

    const missingCopy = requiredCopy.filter((label) => !html.includes(label));
    const missingLinks = requiredLinks.filter((path) => !findHref(html, origin, "/site-map", (url) => url.origin === origin && url.pathname === path));
    const failures = [
      ...missingCopy.map((label) => `文案 ${label}`),
      ...missingLinks.map((path) => `連結 ${path}`),
    ];

    return check(
      "ia:site-map",
      "網站地圖信息架構",
      failures.length === 0,
      failures.length ? `缺少 ${failures.slice(0, 12).join("、")}` : "網站地圖已覆蓋前台完整頁面清單與後台登入、儀表板、線索、文章、文件、統計模組",
    );
  } catch (error) {
    return check("ia:site-map", "網站地圖信息架構", false, error instanceof Error ? error.message : "request failed");
  }
}

async function checkMaterialAsset(origin: string, slug: string): Promise<LaunchCheck> {
  const path = materialAssetPath(slug);
  try {
    const response = await fetch(`${origin}${path}`, { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";
    return check(
      `material:${slug}`,
      `圖文素材 ${slug}`,
      response.ok && contentType.includes("image/svg+xml"),
      response.ok ? contentType || "未回傳 content-type" : `HTTP ${response.status}`,
    );
  } catch (error) {
    return {
      id: `material:${slug}`,
      label: `圖文素材 ${slug}`,
      status: "fail",
      detail: error instanceof Error ? error.message : "request failed",
    };
  }
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

function scanCopySource(label: string, text: string) {
  return prohibitedCopyPatterns.flatMap((rule) =>
    rule.terms
      .filter((term) => text.includes(term) && !rule.allowedContext?.test(text))
      .map((term) => `${label}:${term}`),
  );
}

function decodeHtmlAttribute(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .trim();
}

function extractHrefValues(html: string) {
  return Array.from(html.matchAll(/\shref="([^"]+)"/g), (match) => decodeHtmlAttribute(match[1] || ""));
}

function internalLinkTarget(origin: string, sourcePath: string, href: string) {
  if (!href || href.startsWith("#")) return null;
  if (/^(mailto:|tel:|sms:|javascript:)/i.test(href)) return null;

  let url: URL;
  try {
    url = new URL(href, `${origin}${sourcePath}`);
  } catch {
    return href;
  }

  if (url.origin !== origin) return null;
  if (url.pathname.startsWith("/api/")) return null;
  return `${url.pathname}${url.search}`;
}

function parseHref(origin: string, sourcePath: string, href: string) {
  try {
    return new URL(href, `${origin}${sourcePath}`);
  } catch {
    return null;
  }
}

function isFacebookUrl(url: URL) {
  return url.protocol === "https:" && url.hostname.toLowerCase().endsWith("facebook.com");
}

function isLineUrl(url: URL, origin: string) {
  const host = url.hostname.toLowerCase();
  return (
    (url.protocol === "https:" && (host === "line.me" || host.endsWith(".line.me") || host === "lin.ee" || host.endsWith(".lin.ee"))) ||
    (url.origin === origin && url.pathname === "/contact" && url.hash === "#line-qr")
  );
}

function hasSearchParam(url: URL, key: string, value: string) {
  return url.searchParams.get(key) === value;
}

function findHref(
  html: string,
  origin: string,
  sourcePath: string,
  predicate: (url: URL) => boolean,
) {
  return extractHrefValues(html)
    .map((href) => parseHref(origin, sourcePath, href))
    .find((url): url is URL => Boolean(url && predicate(url)));
}

function sameImageUrl(left: URL | null, right: URL | null) {
  if (!left || !right) return false;
  return left.href === right.href;
}

async function validateImageAsset(origin: string, label: string, href: string) {
  const url = parseHref(origin, "/", href);
  if (!url) return `${label}:URL 無效`;
  if (url.origin !== origin && url.protocol !== "https:") return `${label}:外部圖片必須使用 HTTPS`;

  try {
    const response = await fetch(url.href, { cache: "no-store" });
    const bytes = response.ok ? (await response.arrayBuffer()).byteLength : 0;
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) return `${label}:HTTP ${response.status}`;
    if (!contentType.toLowerCase().startsWith("image/")) return `${label}:content-type 不是圖片：${contentType || "空值"}`;
    if (bytes < 256) return `${label}:圖片大小異常 ${bytes} bytes`;
    return "";
  } catch (error) {
    return `${label}:${error instanceof Error ? error.message : "request failed"}`;
  }
}

async function checkInternalLinks(origin: string): Promise<LaunchCheck> {
  const targets = new Map<string, string>();
  const failures: string[] = [];

  for (const path of copyScanPaths) {
    try {
      const response = await fetch(`${origin}${path}`, { cache: "no-store" });
      if (!response.ok) {
        failures.push(`${path}:HTTP ${response.status}`);
        continue;
      }
      const html = await response.text();
      for (const href of extractHrefValues(html)) {
        const target = internalLinkTarget(origin, path, href);
        if (target) targets.set(target, path);
      }
    } catch (error) {
      failures.push(`${path}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  for (const [target, source] of targets) {
    try {
      const response = await fetch(`${origin}${target}`, { cache: "no-store", redirect: "manual" });
      if (response.status < 200 || response.status >= 400) {
        failures.push(`${source} -> ${target}:HTTP ${response.status}`);
      }
    } catch (error) {
      failures.push(`${source} -> ${target}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return check(
    "links:internal",
    "公開頁面內鏈與 CTA",
    failures.length === 0,
    failures.length ? failures.slice(0, 10).join("；") : `${targets.size} 個同站連結均可訪問`,
  );
}

async function checkQaAnswerLinks(origin: string): Promise<LaunchCheck> {
  try {
    const response = await fetch(`${origin}/qa`, { cache: "no-store" });
    const html = await response.text();
    if (!response.ok) {
      return check("links:qa-answer-links", "QA 回答關聯內鏈", false, `HTTP ${response.status}`);
    }

    const text = stripHtml(html);
    const missingQuestions = requiredQaQuestionPhrases.filter((question) => !text.includes(question));
    const detailsBlocks = extractDetailsBlocks(html);
    const failures: string[] = [];
    if (detailsBlocks.length < requiredQaQuestionPhrases.length) {
      failures.push(`FAQ 數量不足：${detailsBlocks.length}/${requiredQaQuestionPhrases.length}`);
    }

    for (const [index, block] of detailsBlocks.entries()) {
      const question = stripHtml(block.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i)?.[1] || `FAQ #${index + 1}`).slice(0, 80);
      const hrefs = extractAnchorTags(block).map((tag) => extractAttribute(tag, "href")).filter(Boolean);
      if (!hrefs.length) {
        failures.push(`${question}:缺少關聯頁連結`);
        continue;
      }

      const targets = hrefs.map((href) => internalLinkTarget(origin, "/qa", href)).filter((target): target is string => Boolean(target));
      if (!targets.length) {
        failures.push(`${question}:連結不是站內頁`);
        continue;
      }

      for (const target of targets) {
        const targetResponse = await fetch(`${origin}${target}`, { cache: "no-store", redirect: "manual" });
        if (targetResponse.status < 200 || targetResponse.status >= 400) {
          failures.push(`${question} -> ${target}:HTTP ${targetResponse.status}`);
        }
      }
    }

    const issues = [
      ...missingQuestions.map((question) => `缺少問題「${question}」`),
      ...failures,
    ];

    return check(
      "links:qa-answer-links",
      "QA 回答關聯內鏈",
      issues.length === 0,
      issues.length
        ? issues.slice(0, 10).join("；")
        : `${detailsBlocks.length} 個 QA 均覆蓋計畫指定問題，且每個回答都有可訪問的站內關聯頁或表單連結`,
    );
  } catch (error) {
    return {
      id: "links:qa-answer-links",
      label: "QA 回答關聯內鏈",
      status: "fail",
      detail: error instanceof Error ? error.message : "request failed",
    };
  }
}

async function checkFooterRiskLinks(origin: string): Promise<LaunchCheck> {
  const failures: string[] = [];

  for (const path of copyScanPaths) {
    try {
      const response = await fetch(`${origin}${path}`, { cache: "no-store" });
      if (!response.ok) {
        failures.push(`${path}:HTTP ${response.status}`);
        continue;
      }
      const html = await response.text();
      const footerHtml = html.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] || "";
      if (!footerHtml) {
        failures.push(`${path}:缺少 footer`);
        continue;
      }
      const hasRiskLink = Boolean(findHref(footerHtml, origin, path, (url) => url.origin === origin && url.pathname === "/risk"));
      if (!hasRiskLink) failures.push(`${path}:footer 缺少風險聲明入口`);
    } catch (error) {
      failures.push(`${path}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return check(
    "compliance:footer-risk-link",
    "每頁底部風險聲明入口",
    failures.length === 0,
    failures.length ? failures.slice(0, 10).join("；") : `${copyScanPaths.length} 個公開頁 footer 均可進入風險聲明`,
  );
}

async function checkHeaderInformationArchitecture(origin: string): Promise<LaunchCheck> {
  const failures: string[] = [];
  const topLevelRequirements = [
    { label: "首頁", pathname: "/" },
    { label: "申請流程教學", pathname: "/application-flow" },
    { label: "常見 QA", pathname: "/qa" },
    { label: "FB 銀行行員俱樂部社團", pathname: "/facebook" },
  ];
  const loanDropdownRequirements = [
    { label: "信用貸款", pathname: "/credit-loan" },
    { label: "房屋貸款", pathname: "/house-loan" },
    { label: "企業貸款", pathname: "/business-loan" },
  ];

  try {
    const response = await fetch(`${origin}/`, { cache: "no-store" });
    const html = await response.text();
    if (!response.ok) {
      return check("nav:information-architecture", "頂部導航信息架構", false, `HTTP ${response.status}`);
    }
    const headerHtml = html.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
    if (!headerHtml) {
      return check("nav:information-architecture", "頂部導航信息架構", false, "首頁缺少 header");
    }
    if (!headerHtml.includes("貸款服務")) failures.push("缺少貸款服務分組");
    for (const requirement of topLevelRequirements) {
      const matched = findHref(headerHtml, origin, "/", (url) => url.origin === origin && url.pathname === requirement.pathname);
      if (!matched) failures.push(requirement.label);
    }
    for (const requirement of loanDropdownRequirements) {
      const matched = findHref(headerHtml, origin, "/", (url) => url.origin === origin && url.pathname === requirement.pathname);
      if (!matched) failures.push(`貸款服務下拉:${requirement.label}`);
    }
    const headerLine = extractAnchorTags(headerHtml).find((tag) => extractAttribute(tag, "data-event-name") === "header_line_click");
    const lineUrl = parseHref(origin, "/", extractAttribute(headerLine || "", "href"));
    const lineLabel = extractAttribute(headerLine || "", "aria-label");
    if (!lineUrl || !isLineUrl(lineUrl, origin) || !hasSearchParam(lineUrl, "source_page", "header") || lineLabel !== "聯絡我們 / LINE 諮詢") failures.push("金色 LINE 聯絡按鈕");
    return check(
      "nav:information-architecture",
      "頂部導航信息架構",
      failures.length === 0,
      failures.length ? `缺少 ${failures.join(", ")}` : "頂部導航以貸款服務為主軸：三大貸款收納於貸款服務下拉，聯絡 / LINE 諮詢使用金色按鈕並保留 header 來源參數",
    );
  } catch (error) {
    return check("nav:information-architecture", "頂部導航信息架構", false, error instanceof Error ? error.message : "request failed");
  }
}

async function checkFullFooterEntrypoints(origin: string): Promise<LaunchCheck> {
  const failures: string[] = [];
  const internalRequirements = [
    { label: "信用貸款", pathname: "/credit-loan" },
    { label: "房屋貸款", pathname: "/house-loan" },
    { label: "企業貸款", pathname: "/business-loan" },
    { label: "FB 社團頁", pathname: "/facebook" },
    { label: "LINE / 聯絡我們", pathname: "/contact" },
    { label: "個資保護", pathname: "/privacy" },
    { label: "風險聲明", pathname: "/risk" },
    { label: "服務條款", pathname: "/terms" },
    { label: "網站地圖", pathname: "/site-map" },
  ];

  for (const path of fullFooterPaths) {
    try {
      const response = await fetch(`${origin}${path}`, { cache: "no-store" });
      if (!response.ok) {
        failures.push(`${path}:HTTP ${response.status}`);
        continue;
      }
      const html = await response.text();
      const footerHtml = html.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] || "";
      if (!footerHtml) {
        failures.push(`${path}:缺少 footer`);
        continue;
      }

      const anchorTags = extractAnchorTags(footerHtml);
      const ctaByEvent = new Map(anchorTags.map((tag) => [extractAttribute(tag, "data-event-name"), tag]));
      const lineUrl = parseHref(origin, path, extractAttribute(ctaByEvent.get("footer_line_click") || "", "href"));
      const fbUrl = parseHref(origin, path, extractAttribute(ctaByEvent.get("footer_fb_click") || "", "href"));
      const formUrl = parseHref(origin, path, extractAttribute(ctaByEvent.get("footer_form_click") || "", "href"));

      const missing = [
        !lineUrl || !isLineUrl(lineUrl, origin) || !hasSearchParam(lineUrl, "source_page", "footer") ? "LINE 一對一諮詢" : "",
        !fbUrl || !isFacebookUrl(fbUrl) || !hasSearchParam(fbUrl, "source_page", "footer") ? "FB 社團入口" : "",
        !formUrl || formUrl.origin !== origin || formUrl.pathname !== "/consultation" || formUrl.searchParams.get("source_page") !== "footer" ? "免費諮詢預約" : "",
        !footerHtml.includes("熱門文章") ? "熱門文章標題" : "",
        !footerHtml.includes("個資保護聲明") ? "個資保護聲明" : "",
        !footerHtml.includes("免責 / 服務條款") ? "免責 / 服務條款" : "",
      ].filter(Boolean);

      for (const requirement of internalRequirements) {
        const matched = findHref(footerHtml, origin, path, (url) => url.origin === origin && url.pathname === requirement.pathname);
        if (!matched) missing.push(requirement.label);
      }

      const articleLinks = anchorTags.filter((tag) => {
        const href = extractAttribute(tag, "href");
        const url = parseHref(origin, path, href);
        return Boolean(url && url.origin === origin && url.pathname.startsWith("/blog/"));
      });
      if (articleLinks.length < 3) missing.push(`熱門文章連結 ${articleLinks.length}/3`);

      if (missing.length) failures.push(`${path}:缺少 ${missing.join(", ")}`);
    } catch (error) {
      failures.push(`${path}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return check(
    "footer:fixed-entrypoints",
    "全站頁尾固定入口",
    failures.length === 0,
    failures.length
      ? failures.slice(0, 10).join("；")
      : `${fullFooterPaths.length} 個公開頁均有三大貸款、LINE、FB、表單、熱門文章、法務與網站地圖入口`,
  );
}

async function checkConsentNotice(origin: string): Promise<LaunchCheck> {
  try {
    const response = await fetch(`${origin}/consultation`, { cache: "no-store" });
    const html = await response.text();
    if (!response.ok) {
      return check("compliance:consent-notice", "表單個資告知與同意", false, `HTTP ${response.status}`);
    }

    const consentInput = html.match(/<input\b(?=[^>]+name=["']consent["'])[^>]*>/i)?.[0] || "";
    const requiredTexts = [
      "貸款諮詢",
      "資格初步評估",
      "電話/LINE",
      "利用地區為台灣",
      "利用對象為本平台與受指派專員",
      "利用方式包含電話、LINE、Email、後台案件管理與來源追蹤",
      "保存期間",
      "同意時間",
      "IP",
      "瀏覽器",
      "查詢",
      "更正",
      "停止利用",
      "刪除",
      "不提供必要資料將無法完成諮詢媒合",
      "平台非銀行或金融機構",
      "不保證核貸",
    ];
    const missing = requiredTexts.filter((text) => !html.includes(text));
    const inputIssues = [
      consentInput ? "" : "缺少 consent checkbox",
      consentInput && !/\srequired(?:\s|>|=)/i.test(consentInput) ? "consent 未設 required" : "",
      consentInput && /\schecked(?:\s|>|=)/i.test(consentInput) ? "consent 不可預設勾選" : "",
    ].filter(Boolean);

    return check(
      "compliance:consent-notice",
      "表單個資告知與同意",
      missing.length === 0 && inputIssues.length === 0,
      missing.length || inputIssues.length
        ? [...inputIssues, ...missing.map((text) => `缺少「${text}」`)].slice(0, 10).join("；")
        : "諮詢表單同意框必填且未預設勾選，並揭露目的、利用地區/對象/方式、保存期間、稽核紀錄、權利與非銀行身份",
    );
  } catch (error) {
    return {
      id: "compliance:consent-notice",
      label: "表單個資告知與同意",
      status: "fail",
      detail: error instanceof Error ? error.message : "request failed",
    };
  }
}

async function checkPrivacyRightsContact(origin: string): Promise<LaunchCheck> {
  try {
    const response = await fetch(`${origin}/contact`, { cache: "no-store" });
    const html = await response.text();
    if (!response.ok) {
      return check("compliance:privacy-rights-contact", "個資權利聯繫入口", false, `HTTP ${response.status}`);
    }
    const requiredTexts = ["個資權利與資料請求", "查詢", "更正", "停止利用", "刪除", "Email"];
    const missing = requiredTexts.filter((text) => !html.includes(text));
    const hasPrivacyLink = /href=["']\/privacy["'][^>]*>\s*查看個資告知\s*</i.test(html);
    return check(
      "compliance:privacy-rights-contact",
      "個資權利聯繫入口",
      missing.length === 0 && hasPrivacyLink,
      missing.length || !hasPrivacyLink
        ? [...missing.map((text) => `缺少「${text}」`), hasPrivacyLink ? "" : "缺少 /privacy 個資告知連結"].filter(Boolean).join("；")
        : "聯絡頁提供查詢、更正、停止利用、刪除資料的 Email 入口，並連到完整個資告知頁",
    );
  } catch (error) {
    return check("compliance:privacy-rights-contact", "個資權利聯繫入口", false, error instanceof Error ? error.message : "request failed");
  }
}

async function checkFormDataMinimization(origin: string): Promise<LaunchCheck> {
  try {
    const response = await fetch(`${origin}/consultation`, { cache: "no-store" });
    const html = await response.text();
    if (!response.ok) {
      return check("compliance:form-data-minimization", "諮詢表單個資最小化", false, `HTTP ${response.status}`);
    }

    const controls = extractFormControlTags(html);
    const visibleControls = controls.filter((tag) => {
      const type = extractAttribute(tag, "type").toLowerCase();
      const name = extractAttribute(tag, "name");
      return type !== "hidden" && name !== "website";
    });
    const requiredFieldNames = ["name", "gender", "phone", "lineId", "identityType", "loanType", "desiredAmount", "appointmentTime", "purpose", "note", "consent"];
    const fieldNames = new Set(controls.map((tag) => extractAttribute(tag, "name")).filter(Boolean));
    const missingFields = requiredFieldNames.filter((field) => !fieldNames.has(field));
    const fileInputs = controls.filter((tag) => extractAttribute(tag, "type").toLowerCase() === "file");
    const sensitiveControls = visibleControls.filter((tag) => {
      const descriptor = [
        extractAttribute(tag, "name"),
        extractAttribute(tag, "id"),
        extractAttribute(tag, "placeholder"),
        extractAttribute(tag, "aria-label"),
        extractAttribute(tag, "accept"),
      ].join(" ");
      return sensitiveFormControlPattern.test(descriptor);
    });
    const requiredCopy = ["信用貸款只在專用模組收身分證正反面", "財力", "LINE"];
    const missingCopy = requiredCopy.filter((text) => !html.includes(text));
    const issues = [
      ...missingFields.map((field) => `缺少必要欄位 ${field}`),
      ...(fileInputs.length ? [`存在 ${fileInputs.length} 個檔案上傳欄位`] : []),
      ...sensitiveControls.map((tag) => `欄位疑似收集敏感資料：${extractAttribute(tag, "name") || extractAttribute(tag, "id") || tag.slice(0, 60)}`),
      ...missingCopy.map((text) => `缺少信貸專用上傳 / LINE 補件提示「${text}」`),
    ];

    return check(
      "compliance:form-data-minimization",
      "諮詢表單個資最小化",
      issues.length === 0,
      issues.length
        ? issues.slice(0, 10).join("；")
        : "統一諮詢頁預設不展開檔案上傳；頁面明確提示信用貸款只在專用模組收身分證正反面，財力、房產與企業補件透過 LINE 與專員確認",
    );
  } catch (error) {
    return {
      id: "compliance:form-data-minimization",
      label: "諮詢表單個資最小化",
      status: "fail",
      detail: error instanceof Error ? error.message : "request failed",
    };
  }
}

async function checkLoanApplicationTabReadiness(origin: string): Promise<LaunchCheck> {
  const pageRequirements = [
    {
      path: "/credit-loan",
      appId: "credit-application",
      selectedTab: "",
      requiredSelects: ["loanType", "desiredAmount", "purpose", "requestedAmount", "requestedTermYears", "caseSource", "programType"],
      requiredInputs: ["name", "phone", "lineId", "idFront", "idBack", "consent"],
      requiredFileInputs: ["idFront", "idBack"],
      forbiddenFileInputs: [],
    },
    {
      path: "/house-loan",
      appId: "house-application",
      selectedTab: "house-apply",
      requiredSelects: ["loanType", "desiredAmount", "purpose", "houseLoanType", "propertyCity", "propertyType", "existingMortgage", "requestedTermYears"],
      requiredInputs: ["name", "phone", "lineId", "consent"],
      requiredFileInputs: [],
      forbiddenFileInputs: ["idFront", "idBack"],
    },
    {
      path: "/business-loan",
      appId: "business-application",
      selectedTab: "business-apply",
      requiredSelects: ["loanType", "desiredAmount", "purpose", "businessLoanType", "businessType", "industry", "operatingYears", "businessLocation", "monthlyRevenueRange", "requestedTermYears"],
      requiredInputs: ["name", "phone", "lineId", "businessName", "consent"],
      requiredFileInputs: [],
      forbiddenFileInputs: ["idFront", "idBack"],
    },
  ];
  const failures: string[] = [];

  for (const requirement of pageRequirements) {
    try {
      const response = await fetch(`${origin}${requirement.path}`, { cache: "no-store" });
      const html = await response.text();
      if (!response.ok) {
        failures.push(`${requirement.path}:HTTP ${response.status}`);
        continue;
      }

      const appMatch = html.match(new RegExp(`<(?:div|section)[^>]+id=["']${requirement.appId}["'][\\s\\S]*?<\\/form>\\s*<\\/(?:div|section)>`, "i"));
      const appHtml = appMatch?.[0] || "";
      if (!appHtml) {
        failures.push(`${requirement.path}:缺少 ${requirement.appId} 表單區`);
        continue;
      }
      if (!/class=["'][^"']*\bloan-application-card\b/i.test(appHtml)) failures.push(`${requirement.path}:表單未使用居中穩定容器`);
      if (requirement.selectedTab && (!html.includes(`aria-controls="${requirement.selectedTab}-panel"`) || !html.includes(`data-active-tab="${requirement.selectedTab}"`))) {
        failures.push(`${requirement.path}:預設未停在站內申請 tab`);
      }

      const controls = extractFormControlTags(appHtml);
      const selectNames = new Set(controls.filter((tag) => tag.toLowerCase().startsWith("<select")).map((tag) => extractAttribute(tag, "name")));
      const inputTags = controls.filter((tag) => tag.toLowerCase().startsWith("<input"));
      const inputNames = new Set(inputTags.map((tag) => extractAttribute(tag, "name")));
      const fileInputNames = new Set(inputTags.filter((tag) => extractAttribute(tag, "type").toLowerCase() === "file").map((tag) => extractAttribute(tag, "name")));

      for (const name of requirement.requiredSelects) {
        if (!selectNames.has(name)) failures.push(`${requirement.path}:欄位 ${name} 需為下拉選單`);
      }
      for (const name of requirement.requiredInputs) {
        if (!inputNames.has(name)) failures.push(`${requirement.path}:缺少欄位 ${name}`);
      }
      for (const name of requirement.requiredFileInputs) {
        if (!fileInputNames.has(name)) failures.push(`${requirement.path}:缺少必要上傳 ${name}`);
      }
      for (const name of requirement.forbiddenFileInputs) {
        if (fileInputNames.has(name)) failures.push(`${requirement.path}:不應出現敏感上傳 ${name}`);
      }
    } catch (error) {
      failures.push(`${requirement.path}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return check(
    "flow:loan-application-tabs",
    "三類貸款站內申請表單入口",
    failures.length === 0,
    failures.length
      ? failures.slice(0, 12).join("；")
      : "信貸、房貸、企業貸均預設顯示居中站內申請表；三類表單優先使用下拉欄位，且只有信貸收身分證正反面上傳",
  );
}

async function checkOfficialApplyWarning(origin: string, db: Awaited<ReturnType<typeof readDB>>): Promise<LaunchCheck> {
  try {
    const response = await fetch(`${origin}/credit-loan`, { cache: "no-store" });
    const html = await response.text();
    if (!response.ok) {
      return check("compliance:official-apply-warning", "信貸站內申請入口", false, `HTTP ${response.status}`);
    }

    const officialHref = db.settings.officialApplyUrl;
    const officialLinks = extractAnchorTags(html).filter((tag) => extractAttribute(tag, "href") === officialHref);
    const failures: string[] = [];
    const creditApplyLink = extractAnchorTags(html).find((tag) => extractAttribute(tag, "href") === "#credit-application" && extractAttribute(tag, "data-event-name") === "credit_form_click");
    if (!creditApplyLink) failures.push("缺少信貸站內申請 CTA");
    if (!html.includes("站內信貸網路申請")) failures.push("缺少站內信貸申請區塊");
    if (!html.includes("本站信貸申請只收身分證正反面")) failures.push("缺少信貸敏感資料最小化提醒");
    if (officialLinks.length) failures.push("信貸頁仍含銀行外站官方申請主 CTA");

    return check(
      "compliance:official-apply-warning",
      "信貸站內申請入口",
      failures.length === 0,
      failures.length ? failures.join("；") : "信貸主流程已回到站內申請，外站官方申請 CTA 未出現在前台主流程，且保留身分證 / LINE 補件邊界",
    );
  } catch (error) {
    return {
      id: "compliance:official-apply-warning",
      label: "信貸站內申請入口",
      status: "fail",
      detail: error instanceof Error ? error.message : "request failed",
    };
  }
}

async function checkExternalCtaReadiness(origin: string, db: Awaited<ReturnType<typeof readDB>>): Promise<LaunchCheck> {
  const failures: string[] = [];
  const samples: string[] = [];
  const settings = db.settings;
  const fbUrl = parseHref(origin, "/", settings.fbGroupUrl);
  const lineUrl = parseHref(origin, "/", settings.lineUrl);

  if (!fbUrl || !isFacebookUrl(fbUrl)) failures.push(`settings.fbGroupUrl 不是 HTTPS Facebook 連結：${settings.fbGroupUrl || "空值"}`);
  if (!lineUrl || !isLineUrl(lineUrl, origin)) failures.push(`settings.lineUrl 需為 LINE HTTPS 連結或 /contact#line-qr fallback：${settings.lineUrl || "空值"}`);
  if (lineUrl?.origin === origin && !settings.lineQrCodeUrl) failures.push("LINE fallback 使用聯絡頁時必須設定 lineQrCodeUrl");

  const ctaRequirements = [
    {
      path: "/credit-loan",
      label: "內頁 Footer FB 社團 CTA",
      predicate: (url: URL) => isFacebookUrl(url) && hasSearchParam(url, "source_page", "footer"),
    },
    {
      path: "/credit-loan",
      label: "信貸 LINE CTA",
      predicate: (url: URL) => isLineUrl(url, origin) && hasSearchParam(url, "source_page", "credit"),
    },
    {
      path: "/credit-loan",
      label: "信貸 FB CTA",
      predicate: (url: URL) => isFacebookUrl(url) && hasSearchParam(url, "source_page", "credit"),
    },
    {
      path: "/house-loan",
      label: "房貸 LINE CTA",
      predicate: (url: URL) => isLineUrl(url, origin) && hasSearchParam(url, "source_page", "house"),
    },
    {
      path: "/house-loan",
      label: "房貸 FB CTA",
      predicate: (url: URL) => isFacebookUrl(url) && hasSearchParam(url, "source_page", "house"),
    },
    {
      path: "/business-loan",
      label: "企業貸 LINE CTA",
      predicate: (url: URL) => isLineUrl(url, origin) && hasSearchParam(url, "source_page", "business"),
    },
    {
      path: "/business-loan",
      label: "企業貸 FB CTA",
      predicate: (url: URL) => isFacebookUrl(url) && hasSearchParam(url, "source_page", "business"),
    },
    {
      path: "/contact",
      label: "聯絡頁 LINE CTA",
      predicate: (url: URL) => isLineUrl(url, origin) && hasSearchParam(url, "source_page", "contact"),
    },
    {
      path: "/contact",
      label: "聯絡頁 FB CTA",
      predicate: (url: URL) => isFacebookUrl(url) && hasSearchParam(url, "source_page", "contact"),
    },
    {
      path: "/facebook",
      label: "FB 社團頁加入 CTA",
      predicate: (url: URL) => isFacebookUrl(url) && hasSearchParam(url, "source_page", "facebook"),
    },
  ];

  for (const requirement of ctaRequirements) {
    try {
      const response = await fetch(`${origin}${requirement.path}`, { cache: "no-store" });
      const html = await response.text();
      const matched = response.ok ? findHref(html, origin, requirement.path, requirement.predicate) : null;
      if (!response.ok) {
        failures.push(`${requirement.label}:HTTP ${response.status}`);
      } else if (!matched) {
        failures.push(`${requirement.label}:未輸出可追蹤 href`);
      } else {
        samples.push(`${requirement.label}:${matched.pathname}${matched.search}${matched.hash}`);
      }
    } catch (error) {
      failures.push(`${requirement.label}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return check(
    "cta:external-readiness",
    "外部 CTA 與來源參數",
    failures.length === 0,
    failures.length
      ? failures.slice(0, 10).join("；")
      : `LINE、FB 與前台諮詢入口均已設定並輸出來源參數；${samples.slice(0, 5).join("；")}`,
  );
}

async function checkPublicPagePerformance(origin: string): Promise<LaunchCheck> {
  const failures: string[] = [];
  const samples: string[] = [];

  for (const path of performancePaths) {
    const startedAt = performance.now();
    try {
      const response = await fetch(`${origin}${path}`, { cache: "no-store" });
      const html = await response.text();
      const durationMs = Math.round(performance.now() - startedAt);
      const htmlBytes = new TextEncoder().encode(html).length;
      samples.push(`${path}:${durationMs}ms/${Math.round(htmlBytes / 1024)}KB`);
      if (!response.ok) {
        failures.push(`${path}:HTTP ${response.status}`);
      } else if (durationMs > maxResponseMs || htmlBytes > maxHtmlBytes) {
        failures.push(`${path}:${durationMs}ms/${Math.round(htmlBytes / 1024)}KB`);
      }
    } catch (error) {
      failures.push(`${path}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return check(
    "performance:public-pages",
    "公開頁面性能預算",
    failures.length === 0,
    failures.length
      ? `超出 ${maxResponseMs}ms 或 ${Math.round(maxHtmlBytes / 1024)}KB：${failures.slice(0, 8).join("；")}`
      : `通過 ${performancePaths.length} 頁 HTML 預算；${samples.slice(0, 5).join("；")}`,
  );
}

async function checkPublicPageAssetBudget(origin: string): Promise<LaunchCheck> {
  const failures: string[] = [];
  const samples: string[] = [];
  const assetMetrics = new Map<string, Promise<{ ok: boolean; status: number; bytes: number }>>();

  const fetchAssetMetric = (url: string) => {
    if (!assetMetrics.has(url)) {
      assetMetrics.set(url, (async () => {
        try {
          const response = await fetch(url, { cache: "no-store" });
          const bytes = response.ok ? (await response.arrayBuffer()).byteLength : 0;
          return { ok: response.ok, status: response.status, bytes };
        } catch {
          return { ok: false, status: 0, bytes: 0 };
        }
      })());
    }
    return assetMetrics.get(url)!;
  };

  const staticAssetUrl = (sourcePath: string, href: string) => {
    const url = parseHref(origin, sourcePath, href);
    if (!url || url.origin !== origin || !url.pathname.startsWith("/_next/static/")) return null;
    return url.href;
  };

  for (const path of performancePaths) {
    try {
      const response = await fetch(`${origin}${path}`, { cache: "no-store" });
      const html = await response.text();
      if (!response.ok) {
        failures.push(`${path}:HTML HTTP ${response.status}`);
        continue;
      }

      const scriptUrls = [
        ...new Set(
          extractScriptTags(html)
            .map((tag) => staticAssetUrl(path, extractAttribute(tag, "src")))
            .filter((url): url is string => Boolean(url)),
        ),
      ];
      const styleUrls = [
        ...new Set(
          extractLinkTags(html)
            .filter((tag) => extractAttribute(tag, "rel").toLowerCase().includes("stylesheet"))
            .map((tag) => staticAssetUrl(path, extractAttribute(tag, "href")))
            .filter((url): url is string => Boolean(url)),
        ),
      ];

      const scriptMetrics = await Promise.all(scriptUrls.map(fetchAssetMetric));
      const styleMetrics = await Promise.all(styleUrls.map(fetchAssetMetric));
      const scriptBytes = scriptMetrics.reduce((sum, item) => sum + item.bytes, 0);
      const styleBytes = styleMetrics.reduce((sum, item) => sum + item.bytes, 0);
      samples.push(`${path}:JS ${Math.round(scriptBytes / 1024)}KB/${scriptUrls.length} 個，CSS ${Math.round(styleBytes / 1024)}KB/${styleUrls.length} 個`);

      const missingAssets = [
        ...scriptMetrics.map((metric, index) => ({ metric, url: scriptUrls[index] })),
        ...styleMetrics.map((metric, index) => ({ metric, url: styleUrls[index] })),
      ].filter(({ metric }) => !metric.ok);
      if (missingAssets.length) {
        failures.push(`${path}:靜態資產讀取失敗 ${missingAssets.slice(0, 3).map(({ metric, url }) => `${new URL(url).pathname}:HTTP ${metric.status || "ERR"}`).join(", ")}`);
      }
      if (scriptUrls.length > maxStaticScriptCount || styleUrls.length > maxStaticStyleCount || scriptBytes > maxStaticScriptBytes || styleBytes > maxStaticStyleBytes) {
        failures.push(`${path}:JS ${Math.round(scriptBytes / 1024)}KB/${scriptUrls.length} 個，CSS ${Math.round(styleBytes / 1024)}KB/${styleUrls.length} 個`);
      }
    } catch (error) {
      failures.push(`${path}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return check(
    "performance:asset-budget",
    "前端靜態資產預算",
    failures.length === 0,
    failures.length
      ? `超出 JS ${Math.round(maxStaticScriptBytes / 1024)}KB/${maxStaticScriptCount} 個或 CSS ${Math.round(maxStaticStyleBytes / 1024)}KB/${maxStaticStyleCount} 個：${failures.slice(0, 8).join("；")}`
      : `通過 ${performancePaths.length} 頁靜態資產預算；${samples.slice(0, 5).join("；")}`,
  );
}

async function checkCopyRedFlags(origin: string, db: Awaited<ReturnType<typeof readDB>>): Promise<LaunchCheck> {
  const findings: string[] = [];

  for (const path of copyScanPaths) {
    try {
      const response = await fetch(`${origin}${path}`, { cache: "no-store" });
      if (!response.ok) {
        findings.push(`${path}:HTTP ${response.status}`);
        continue;
      }
      findings.push(...scanCopySource(path, stripHtml(await response.text())));
    } catch (error) {
      findings.push(`${path}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  for (const article of db.articles.filter((item) => item.status === "published")) {
    findings.push(
      ...scanCopySource(
        `article:${article.slug}`,
        [
          article.title,
          article.excerpt,
          article.body,
          article.seoTitle,
          article.seoDescription,
          article.fbSummary,
          article.complianceNotes,
        ].join(" "),
      ),
    );
  }

  for (const asset of materialAssets) {
    findings.push(...scanCopySource(`material:${asset.slug}`, [asset.title, asset.subtitle, asset.eyebrow, ...asset.points].join(" ")));
  }

  return check(
    "compliance:red-flag-copy",
    "廣告文案紅線掃描",
    findings.length === 0,
    findings.length ? findings.slice(0, 8).join("；") : "未發現保證過件、百分百核准、不看信用、包裝財力等紅線文案",
  );
}

async function checkFinancialDisclosures(origin: string): Promise<LaunchCheck> {
  const paths = ["/credit-loan", "/house-loan", "/business-loan"];
  const requiredTexts = [
    "非銀行或金融機構",
    "不保證核貸",
    "實際額度、利率、年限、費用與核准結果以銀行最終審核及契約揭露為準",
    "總費用年百分率不等於貸款利率",
    "以銀行官方揭露為準",
  ];
  const failures: string[] = [];

  for (const path of paths) {
    try {
      const response = await fetch(`${origin}${path}`, { cache: "no-store" });
      const html = await response.text();
      if (!response.ok) {
        failures.push(`${path}:HTTP ${response.status}`);
        continue;
      }
      const disclosureHtml = html.match(/<aside\b(?=[^>]+data-compliance=["']financial-disclosure["'])[\s\S]*?<\/aside>/i)?.[0] || "";
      if (!disclosureHtml) {
        failures.push(`${path}:缺少方案、利率與費用揭露區塊`);
        continue;
      }
      const disclosureText = stripHtml(disclosureHtml);
      const missing = requiredTexts.filter((text) => !disclosureText.includes(text));
      if (missing.length) failures.push(`${path}:揭露缺少 ${missing.map((text) => `「${text}」`).join("、")}`);
    } catch (error) {
      failures.push(`${path}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return check(
    "compliance:financial-disclosures",
    "方案利率費用揭露",
    failures.length === 0,
    failures.length
      ? failures.slice(0, 8).join("；")
      : "信貸、房貸與企業貸頁均在產品內容旁揭露非銀行身份、不得保證核貸、銀行最終審核與總費用年百分率限制",
  );
}

async function checkCsrfProtection(origin: string, cookieHeader: string): Promise<LaunchCheck> {
  if (!cookieHeader) {
    return check("security:csrf", "CSRF 同源防護", false, "缺少後台 session cookie，無法執行同源探針", true);
  }

  const probes = [
    { method: "POST", path: "/api/admin/logout" },
    { method: "POST", path: "/api/admin/notes", body: "{}" },
    { method: "POST", path: "/api/admin/articles", body: "{}" },
    { method: "PATCH", path: "/api/admin/leads/__csrf_probe__", body: "{}" },
    { method: "DELETE", path: "/api/admin/files/__csrf_probe__" },
    { method: "GET", path: "/api/admin/leads/export" },
    { method: "GET", path: "/api/admin/backup" },
  ];

  const failures: string[] = [];
  for (const probe of probes) {
    try {
      const response = await fetch(`${origin}${probe.path}`, {
        method: probe.method,
        cache: "no-store",
        headers: {
          cookie: cookieHeader,
          ...(probe.body ? { "content-type": "application/json" } : {}),
        },
        body: probe.body,
      });
      if (response.status !== 403) failures.push(`${probe.method} ${probe.path}:HTTP ${response.status}`);
    } catch (error) {
      failures.push(`${probe.method} ${probe.path}:${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return check(
    "security:csrf",
    "CSRF 同源防護",
    failures.length === 0,
    failures.length ? failures.join("；") : "跨站缺少 Origin/Referer 的後台變更與匯出請求均被 403 擋下",
  );
}

function antiSpamProbeForm(index: number) {
  const form = new FormData();
  form.set("website", "https://spam.example");
  form.set("name", `上線檢查反垃圾探針 ${index}`);
  form.set("gender", "other");
  form.set("phone", `0988${String(index).padStart(6, "0")}`);
  form.set("lineId", `launchAntispamProbe${index}`);
  form.set("identityType", "employee");
  form.set("loanType", "credit");
  form.set("appointmentTime", new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 16));
  form.set("purpose", "daily");
  form.set("consent", "on");
  form.set("sourcePage", "/launch-checklist-antispam");
  form.set("sourceChannel", "launch-checklist");
  form.set("sessionId", `launch-antispam-${Date.now()}-${index}`);
  return form;
}

async function checkLeadAntiSpam(origin: string): Promise<LaunchCheck> {
  const probeIp = `127.0.213.${Math.floor(Math.random() * 200) + 1}`;
  const statuses: number[] = [];

  try {
    for (let index = 0; index < 21; index += 1) {
      const response = await fetch(`${origin}/api/leads`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "x-forwarded-for": probeIp,
          "user-agent": "BankClubLaunchAntispamProbe/1.0",
        },
        body: antiSpamProbeForm(index),
      });
      statuses.push(response.status);
    }
  } catch (error) {
    return check("security:lead-antispam", "表單防刷與蜜罐", false, error instanceof Error ? error.message : "request failed");
  }

  const honeypotRejected = statuses.slice(0, 20).every((status) => status === 400);
  const attemptLimited = statuses.at(-1) === 429;
  return check(
    "security:lead-antispam",
    "表單防刷與蜜罐",
    honeypotRejected && attemptLimited,
    honeypotRejected && attemptLimited
      ? "蜜罐欄位會拒絕機器人提交，且同 IP 大量無效嘗試會被 429 限流"
      : `探針狀態碼：${statuses.join(",")}`,
  );
}

export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canRunLaunchChecklist(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const db = await readDB();
  const origin = currentOrigin(request);
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");

  const envChecks: LaunchCheck[] = [
    check(
      "env:site-url",
      "正式站點 URL",
      url.protocol === "https:" && !url.hostname.includes("localhost"),
      `NEXT_PUBLIC_SITE_URL=${url.toString()}`,
      true,
    ),
    check(
      "env:auth-secret",
      "AUTH_SECRET 強度",
      Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32 && process.env.AUTH_SECRET !== "bank-club-local-dev-secret"),
      process.env.AUTH_SECRET ? "已設定" : "未設定，仍使用本地預設",
    ),
    check(
      "env:admin-password",
      "ADMIN_PASSWORD 覆蓋",
      Boolean(process.env.ADMIN_PASSWORD && !knownDefaultAdminPasswords.has(process.env.ADMIN_PASSWORD)),
      process.env.ADMIN_PASSWORD
        ? knownDefaultAdminPasswords.has(process.env.ADMIN_PASSWORD)
          ? "仍使用已知預設密碼"
          : "已設定"
        : "未設定，仍可能使用預設密碼",
    ),
    check(
      "env:notify-webhook",
      "通知 Webhook",
      Boolean(process.env.NOTIFY_WEBHOOK_URL),
      process.env.NOTIFY_WEBHOOK_URL ? "已設定" : "未設定，線索通知需人工查看後台",
      true,
    ),
  ];

  const settingChecks: LaunchCheck[] = [
    check(
      "settings:contact",
      "聯絡資料",
      [
        db.settings.companyName,
        db.settings.officeName,
        db.settings.address,
        db.settings.phone,
        db.settings.fax,
        db.settings.mobile,
        db.settings.email,
      ].every(Boolean),
      "公司、通訊處、專員、職稱、地址、電話、傳真、手機、Email",
    ),
    check("settings:fb", "FB 社團連結", db.settings.fbGroupUrl.startsWith("https://www.facebook.com/"), db.settings.fbGroupUrl),
    check("settings:line", "LINE 入口", Boolean(db.settings.lineUrl), db.settings.lineUrl),
    check("settings:line-qr", "LINE QR Code", Boolean(db.settings.lineQrCodeUrl), db.settings.lineQrCodeUrl || "尚未設定"),
    check("settings:official-apply", "銀行官方申請連結", db.settings.officialApplyUrl.startsWith("https://"), db.settings.officialApplyUrl),
    check("settings:ga4", "GA4 Measurement ID", /^G-[A-Z0-9]+$/i.test(db.settings.gaMeasurementId), db.settings.gaMeasurementId || "尚未設定", true),
    check(
      "settings:gsc",
      "Search Console 驗證碼",
      Boolean(db.settings.googleSearchConsoleVerification),
      db.settings.googleSearchConsoleVerification ? "已設定" : "尚未設定",
      true,
    ),
    check(
      "settings:launch-readiness",
      "人工上線確認紀錄",
      launchReadinessRequirements.every(([key]) => db.settings.launchReadiness[key]) && Boolean(db.settings.launchReadiness.notes),
      (() => {
        const missing = launchReadinessRequirements
          .filter(([key]) => !db.settings.launchReadiness[key])
          .map(([, label]) => label);
        if (missing.length) return `尚未確認：${missing.join("、")}`;
        return db.settings.launchReadiness.notes
          ? `已確認 ${launchReadinessRequirements.length} 項；${db.settings.launchReadiness.notes.slice(0, 120)}`
          : "已勾選但尚未填寫證據摘要";
      })(),
      true,
    ),
  ];

  const publicFileTypes = new Set(db.files.filter((file) => file.visibility === "public").map((file) => file.type));
  const missingFileTypes = requiredFileTypes.filter((type) => !publicFileTypes.has(type));
  const publishedArticleSlugs = new Set(db.articles.filter((article) => article.status === "published").map((article) => article.slug));
  const missingArticleSlugs = requiredArticleSlugs.filter((slug) => !publishedArticleSlugs.has(slug));
  const contentChecks: LaunchCheck[] = [
    check("content:articles", "首批 SEO 文章", db.articles.filter((article) => article.status === "published").length >= 10, `${db.articles.filter((article) => article.status === "published").length} 篇已發布`),
    check(
      "content:required-articles",
      "指定首批 SEO 主題",
      missingArticleSlugs.length === 0,
      missingArticleSlugs.length ? `缺少 ${missingArticleSlugs.join(", ")}` : "欄位教學、上一頁當機、財力證明、資金用途風險均已發布",
    ),
    check("content:article-categories", "文章分類", db.articleCategories.length >= 5, `${db.articleCategories.length} 個分類`),
    check("content:files", "公開文件資源", db.files.filter((file) => file.visibility === "public").length >= 6, `${db.files.filter((file) => file.visibility === "public").length} 份公開文件`),
    check(
      "content:material-assets",
      "首批圖文素材",
      materialAssets.length >= 8,
      `${materialAssets.length} 張圖卡素材已登錄`,
    ),
    check(
      "content:file-types",
      "文件資源類型",
      missingFileTypes.length === 0,
      missingFileTypes.length ? `缺少 ${missingFileTypes.join(", ")}` : "信貸、房貸、企業貸、流程、QA、FB 素材均已建立",
    ),
    checkPublishedArticleGovernance(db),
    checkArticleFbDraftReadiness(db, origin),
    checkArticleFbPostReadiness(db),
    check("content:legal", "法務頁面", true, "privacy / risk / terms 已列入公開路徑檢查"),
  ];

  const dataChecks: LaunchCheck[] = [
    checkUniqueRecordIds("data:lead-ids", "lead_id 唯一", db.leads, "線索"),
    checkUniqueRecordIds("data:file-ids", "文件 ID 唯一", db.files, "文件"),
    checkUniqueRecordIds("data:event-ids", "事件 ID 唯一", db.events, "事件"),
    checkUniqueRecordIds("data:audit-log-ids", "日誌 ID 唯一", db.auditLogs, "日誌"),
    checkUniqueTextField("data:article-slugs", "文章 slug 唯一", db.articles, "文章 slug", (article) => article.slug),
    checkUniqueTextField("data:category-slugs", "文章分類 slug 唯一", db.articleCategories, "分類 slug", (category) => category.slug),
    checkLeadTrackingIntegrity(db),
    checkLeadTimelineIntegrity(db),
    checkEventTrackingIntegrity(db),
    checkFileResourceIntegrity(db),
    checkFileResourceSensitiveContent(db),
    checkAuditLogIntegrity(db),
    checkLeadRelationIntegrity(db),
    checkNoTestResidue(db),
  ];

  const backupDrillCheck = await checkBackupDrillReadiness(db);
  const securityChecks: LaunchCheck[] = [
    check("security:super-admin", "超級管理員", db.users.some((admin) => admin.role === "super_admin"), `${db.users.length} 位後台使用者`),
    checkPasswordHashStrength(db),
    check("security:2fa", "後台 2FA", db.users.some((admin) => admin.role === "super_admin" && admin.twoFactorEnabled), "建議至少一位超級管理員啟用 2FA", true),
    backupDrillCheck,
  ];

  const publicChecks = await Promise.all(publicPaths.map((path) => checkPublicPath(origin, path)));
  const securityHeaderChecks = await checkSecurityHeaders(origin);
  const seoChecks = await checkSeoMarkup(origin, db.articles.find((article) => article.status === "published")?.slug);
  const publicPageSeoMetaCheck = await checkPublicPageSeoMetadata(origin);
  const imageAltCheck = await checkImageAltText(origin, db);
  const articleUrlSeoMetaCheck = await checkArticleUrlSeoMetadata(origin, db);
  const articleBottomCtaCheck = await checkArticleBottomCtas(origin, db);
  const sitemapCoverageCheck = await checkSitemapCoverage(origin, db);
  const siteMapInformationArchitectureCheck = await checkSiteMapInformationArchitecture(origin);
  const materialChecks = await Promise.all(materialAssets.map((asset) => checkMaterialAsset(origin, asset.slug)));
  const internalLinkCheck = await checkInternalLinks(origin);
  const qaAnswerLinkCheck = await checkQaAnswerLinks(origin);
  const footerRiskLinkCheck = await checkFooterRiskLinks(origin);
  const headerInformationArchitectureCheck = await checkHeaderInformationArchitecture(origin);
  const fullFooterEntrypointsCheck = await checkFullFooterEntrypoints(origin);
  const consentNoticeCheck = await checkConsentNotice(origin);
  const privacyRightsContactCheck = await checkPrivacyRightsContact(origin);
  const formDataMinimizationCheck = await checkFormDataMinimization(origin);
  const loanApplicationTabReadinessCheck = await checkLoanApplicationTabReadiness(origin);
  const successPageContactCheck = await checkSuccessPageContact(origin, db);
  const brandAssetCheck = await checkBrandAndLineQrAssets(origin, db);
  const adminLoginBrandingCheck = await checkAdminLoginBranding(origin);
  const officialApplyWarningCheck = await checkOfficialApplyWarning(origin, db);
  const externalCtaCheck = await checkExternalCtaReadiness(origin, db);
  const performanceCheck = await checkPublicPagePerformance(origin);
  const assetBudgetCheck = await checkPublicPageAssetBudget(origin);
  const copyComplianceCheck = await checkCopyRedFlags(origin, db);
  const financialDisclosureCheck = await checkFinancialDisclosures(origin);
  const csrfCheck = await checkCsrfProtection(origin, request.headers.get("cookie") || "");
  const leadAntiSpamCheck = await checkLeadAntiSpam(origin);
  const checks = [...publicChecks, ...securityHeaderChecks, ...seoChecks, publicPageSeoMetaCheck, imageAltCheck, articleUrlSeoMetaCheck, articleBottomCtaCheck, sitemapCoverageCheck, siteMapInformationArchitectureCheck, ...materialChecks, internalLinkCheck, qaAnswerLinkCheck, footerRiskLinkCheck, headerInformationArchitectureCheck, fullFooterEntrypointsCheck, consentNoticeCheck, privacyRightsContactCheck, formDataMinimizationCheck, loanApplicationTabReadinessCheck, successPageContactCheck, brandAssetCheck, adminLoginBrandingCheck, officialApplyWarningCheck, externalCtaCheck, performanceCheck, assetBudgetCheck, copyComplianceCheck, financialDisclosureCheck, csrfCheck, leadAntiSpamCheck, ...envChecks, ...settingChecks, ...contentChecks, ...dataChecks, ...securityChecks];
  const totals = checks.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0 } as Record<CheckStatus, number>,
  );

  return NextResponse.json(
    {
      ok: totals.fail === 0,
      origin,
      generatedAt: new Date().toISOString(),
      totals,
      checks,
    },
    { status: totals.fail === 0 ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
