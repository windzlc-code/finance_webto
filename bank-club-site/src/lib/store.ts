import "server-only";

import { mkdir, open, readFile, rename, unlink, writeFile } from "fs/promises";
import path from "path";
import { createHash, pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { localDefaultAdminPassword } from "./security-defaults";
import { defaultAnnualPercentageRateDescription, seededArticleCategories, seededArticles, seededFiles, settings } from "./site-data";
import type { ArticleComplianceFlags, ArticleRevision, AuditLog, BankClubDB } from "./types";

// Keep visitor applications outside the image filesystem so a container rebuild
// cannot silently discard submitted forms or related application files.
export const bankClubDataDir = process.env.BANKCLUB_DATA_DIR?.trim()
  ? path.resolve(process.env.BANKCLUB_DATA_DIR)
  : path.join(process.cwd(), ".data");
const dataDir = bankClubDataDir;
const dbFile = path.join(dataDir, "bank-club-db.json");
const dbLockFile = path.join(dataDir, "bank-club-db.lock");
let mutationQueue: Promise<unknown> = Promise.resolve();

const passwordIterations = 310_000;
const defaultArticleComplianceFlags: ArticleComplianceFlags = {
  mentionsAmountOrTerm: false,
  mentionsRateOrFee: false,
  mentionsBinding: false,
  mentionsBankName: false,
  containsGuaranteeLanguage: false,
  mentionsLoanPurpose: false,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireWriteLock() {
  await mkdir(dataDir, { recursive: true });
  const startedAt = Date.now();

  while (Date.now() - startedAt < 5000) {
    try {
      const handle = await open(dbLockFile, "wx");
      await handle.writeFile(`${process.pid}:${Date.now()}`);
      return async () => {
        await handle.close().catch(() => undefined);
        await unlink(dbLockFile).catch(() => undefined);
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        throw error;
      }
      await sleep(25);
    }
  }

  throw new Error("Timed out waiting for database write lock");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, passwordIterations, 32, "sha256").toString("base64url");
  return `pbkdf2$sha256$${passwordIterations}$${salt}$${hash}`;
}

function legacyHashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function initialDB(): BankClubDB {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: "user-admin",
        name: settings.brandName,
        email: settings.email,
        role: "super_admin",
        phone: settings.mobile,
        lineId: "",
        passwordHash: hashPassword(process.env.ADMIN_PASSWORD || localDefaultAdminPassword),
        twoFactorEnabled: false,
        twoFactorSecret: "",
        twoFactorConfirmedAt: "",
        createdAt: now,
      },
    ],
    leads: [],
    creditApplications: [],
    creditApplicationFiles: [],
    houseLoanApplications: [],
    businessLoanApplications: [],
    leadNotes: [],
    leadAssignments: [],
    articleCategories: seededArticleCategories,
    articles: seededArticles,
    deletedArticleIds: [],
    files: seededFiles,
    deletedFileIds: [],
    events: [],
    auditLogs: [],
    settings,
  };
}

function mergeSeedData(db: BankClubDB) {
  let changed = false;
  if (!Array.isArray(db.deletedArticleIds)) {
    db.deletedArticleIds = [];
    changed = true;
  }
  const deletedArticleIds = new Set(db.deletedArticleIds);
  if (!Array.isArray(db.creditApplications)) {
    db.creditApplications = [];
    changed = true;
  }
  if (!Array.isArray(db.creditApplicationFiles)) {
    db.creditApplicationFiles = [];
    changed = true;
  }
  if (!Array.isArray(db.houseLoanApplications)) {
    db.houseLoanApplications = [];
    changed = true;
  }
  if (!Array.isArray(db.businessLoanApplications)) {
    db.businessLoanApplications = [];
    changed = true;
  }
  if (!Array.isArray(db.leadAssignments)) {
    db.leadAssignments = [];
    changed = true;
  }
  if (!Array.isArray(db.articleCategories)) {
    db.articleCategories = [];
    changed = true;
  }
  const existingCategoryNames = new Set(db.articleCategories.map((category) => category.name));
  const existingCategorySlugs = new Set(db.articleCategories.map((category) => category.slug));
  for (const category of seededArticleCategories) {
    if (!existingCategoryNames.has(category.name) && !existingCategorySlugs.has(category.slug)) {
      db.articleCategories.push(category);
      existingCategoryNames.add(category.name);
      existingCategorySlugs.add(category.slug);
      changed = true;
    }
  }
  const existingArticleIds = new Set(db.articles.map((article) => article.id));
  for (const article of seededArticles) {
    if (!deletedArticleIds.has(article.id) && !existingArticleIds.has(article.id)) {
      db.articles.push(article);
      changed = true;
    }
  }
  for (const article of db.articles) {
    const seededArticle = seededArticles.find((seed) => seed.id === article.id);
    const legacyArticle = article as typeof article & {
      coverImageUrl?: string;
      coverImageAlt?: string;
      fbPostStatus?: string;
      fbPostUrl?: string;
      fbPostedAt?: string;
      fbPostNote?: string;
      complianceFlags?: Partial<ArticleComplianceFlags>;
      complianceNotes?: string;
      totalAnnualPercentageRate?: string;
      annualPercentageRateDescription?: string;
      feeDisclosureNote?: string;
      complianceReviewedAt?: string;
      complianceReviewedBy?: string;
      publishedAt?: string;
      publishedBy?: string;
      lastModifiedBy?: string;
      revisionHistory?: ArticleRevision[];
    };
    if (!legacyArticle.complianceFlags || typeof legacyArticle.complianceFlags !== "object") {
      legacyArticle.complianceFlags = { ...defaultArticleComplianceFlags };
      changed = true;
    } else {
      for (const key of Object.keys(defaultArticleComplianceFlags) as Array<keyof ArticleComplianceFlags>) {
        if (typeof legacyArticle.complianceFlags[key] !== "boolean") {
          legacyArticle.complianceFlags[key] = false;
          changed = true;
        }
      }
    }
    if (typeof legacyArticle.complianceNotes !== "string") {
      legacyArticle.complianceNotes = "";
      changed = true;
    }
    if (typeof legacyArticle.coverImageUrl !== "string") {
      legacyArticle.coverImageUrl = "/brand/bank_club_hero.png";
      changed = true;
    }
    if (typeof legacyArticle.coverImageAlt !== "string") {
      legacyArticle.coverImageAlt = `${article.title} 封面圖`;
      changed = true;
    }
    if (!["not_started", "copied", "posted"].includes(String(legacyArticle.fbPostStatus || ""))) {
      legacyArticle.fbPostStatus = "not_started";
      changed = true;
    }
    if (typeof legacyArticle.fbPostUrl !== "string") {
      legacyArticle.fbPostUrl = "";
      changed = true;
    }
    if (typeof legacyArticle.fbPostedAt !== "string") {
      legacyArticle.fbPostedAt = "";
      changed = true;
    }
    if (typeof legacyArticle.fbPostNote !== "string") {
      legacyArticle.fbPostNote = "";
      changed = true;
    }
    if (
      seededArticle &&
      seededArticle.coverImageUrl !== "/brand/bank_club_hero.png" &&
      legacyArticle.coverImageUrl === "/brand/bank_club_hero.png" &&
      legacyArticle.coverImageAlt === `${article.title} 封面圖`
    ) {
      legacyArticle.coverImageUrl = seededArticle.coverImageUrl;
      legacyArticle.coverImageAlt = seededArticle.coverImageAlt;
      changed = true;
    }
    if (typeof legacyArticle.totalAnnualPercentageRate !== "string") {
      legacyArticle.totalAnnualPercentageRate = "";
      changed = true;
    }
    if (typeof legacyArticle.annualPercentageRateDescription !== "string") {
      legacyArticle.annualPercentageRateDescription = defaultAnnualPercentageRateDescription;
      changed = true;
    }
    if (typeof legacyArticle.feeDisclosureNote !== "string") {
      legacyArticle.feeDisclosureNote = "";
      changed = true;
    }
    if (typeof legacyArticle.complianceReviewedAt !== "string") {
      legacyArticle.complianceReviewedAt = article.complianceChecked ? article.updatedAt : "";
      changed = true;
    }
    if (typeof legacyArticle.complianceReviewedBy !== "string") {
      legacyArticle.complianceReviewedBy = article.complianceChecked ? "system" : "";
      changed = true;
    }
    if (typeof legacyArticle.publishedAt !== "string") {
      legacyArticle.publishedAt = article.status === "published" ? article.createdAt : "";
      changed = true;
    }
    if (typeof legacyArticle.publishedBy !== "string") {
      legacyArticle.publishedBy = article.status === "published" ? "system" : "";
      changed = true;
    }
    if (typeof legacyArticle.lastModifiedBy !== "string") {
      legacyArticle.lastModifiedBy = "system";
      changed = true;
    }
    if (!Array.isArray(legacyArticle.revisionHistory)) {
      legacyArticle.revisionHistory = [
        {
          id: randomUUID(),
          actorId: "system",
          action: article.status === "published" ? "published" : "created",
          summary: "舊資料遷移時補齊文章審計紀錄。",
          createdAt: article.createdAt || article.updatedAt,
        },
      ];
      changed = true;
    }
  }
  for (const article of db.articles) {
    const name = article.category || "貸款知識";
    if (!db.articleCategories.some((category) => category.name === name)) {
      const now = article.createdAt || new Date().toISOString();
      const slug = name
        .toLowerCase()
        .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
        .replace(/^-|-$/g, "") || `category-${db.articleCategories.length + 1}`;
      db.articleCategories.push({
        id: randomUUID(),
        name,
        slug: db.articleCategories.some((category) => category.slug === slug) ? `${slug}-${db.articleCategories.length + 1}` : slug,
        description: `${name} 相關文章分類。`,
        createdAt: now,
        updatedAt: now,
      });
      changed = true;
    }
  }

  const existingFileIds = new Set(db.files.map((file) => file.id));
  if (!Array.isArray(db.deletedFileIds)) {
    db.deletedFileIds = [];
    changed = true;
  }
  const deletedFileIds = new Set(db.deletedFileIds);
  for (const file of seededFiles) {
    if (!deletedFileIds.has(file.id) && !existingFileIds.has(file.id)) {
      db.files.push(file);
      changed = true;
    }
  }
  for (const file of db.files) {
    const legacyFile = file as typeof file & {
      visibility?: string;
      fileVersionHistory?: unknown;
      sourceFilename?: string;
      sourceFileMime?: string;
      sourceFileSize?: number;
      sourceUploadedAt?: string;
    };
    if (legacyFile.visibility !== "public" && legacyFile.visibility !== "admin_only") {
      legacyFile.visibility = "public";
      changed = true;
    }
    if (typeof legacyFile.sourceFilename !== "string") {
      legacyFile.sourceFilename = "";
      changed = true;
    }
    if (typeof legacyFile.sourceFileMime !== "string") {
      legacyFile.sourceFileMime = "";
      changed = true;
    }
    if (typeof legacyFile.sourceFileSize !== "number") {
      legacyFile.sourceFileSize = 0;
      changed = true;
    }
    if (typeof legacyFile.sourceUploadedAt !== "string") {
      legacyFile.sourceUploadedAt = "";
      changed = true;
    }
    if (!Array.isArray(legacyFile.fileVersionHistory)) {
      legacyFile.fileVersionHistory = [];
      changed = true;
    }
    for (const version of legacyFile.fileVersionHistory as Array<{
      sourceFilename?: string;
      sourceFileMime?: string;
      sourceFileSize?: number;
    }>) {
      if (typeof version.sourceFilename !== "string") {
        version.sourceFilename = "";
        changed = true;
      }
      if (typeof version.sourceFileMime !== "string") {
        version.sourceFileMime = "";
        changed = true;
      }
      if (typeof version.sourceFileSize !== "number") {
        version.sourceFileSize = 0;
        changed = true;
      }
    }
  }

  const hadLineQrCodeUrl = typeof (db.settings as Partial<typeof settings>).lineQrCodeUrl === "string";
  db.settings = { ...settings, ...db.settings };
  db.settings.launchReadiness = {
    ...settings.launchReadiness,
    ...(db.settings.launchReadiness && typeof db.settings.launchReadiness === "object" ? db.settings.launchReadiness : {}),
  };
  if (db.settings.lineUrl === "https://line.me/R/ti/p/") {
    db.settings.lineUrl = settings.lineUrl;
    changed = true;
  }
  if (db.settings.address === "235 新北市中和區景安路 50 號 12 樓") {
    db.settings.address = settings.address;
    changed = true;
  }
  if (!hadLineQrCodeUrl) {
    db.settings.lineQrCodeUrl = settings.lineQrCodeUrl;
    changed = true;
  }
  for (const lead of db.leads) {
    const legacyLead = lead as typeof lead & {
      leadPriority?: string;
      nextFollowUpAt?: string;
      lastFollowUpAt?: string;
      duplicateOf?: string;
      hasJoinedFb?: boolean;
      hasClickedLine?: boolean;
      doNotContact?: boolean;
      deletionRequested?: boolean;
      privacyRequestNote?: string;
      notificationStatus?: string;
      notificationError?: string;
      notifiedAt?: string;
      notificationAttempts?: number;
      documentStatus?: string;
      consentVersion?: string;
      ip?: string;
      userAgent?: string;
      sessionId?: string;
      utmTerm?: string;
      propertyRegion?: string;
      propertyType?: string;
      estimatedPropertyValue?: number | null;
      existingMortgage?: string;
      companyName?: string;
      businessRegistrationType?: string;
      monthlyRevenue?: number | null;
    };
    if (typeof legacyLead.leadPriority !== "string") {
      legacyLead.leadPriority = "normal";
      changed = true;
    }
    if (typeof legacyLead.nextFollowUpAt !== "string") {
      legacyLead.nextFollowUpAt = "";
      changed = true;
    }
    if (typeof legacyLead.lastFollowUpAt !== "string") {
      legacyLead.lastFollowUpAt = "";
      changed = true;
    }
    if (typeof legacyLead.duplicateOf !== "string") {
      legacyLead.duplicateOf = "";
      changed = true;
    }
    if (typeof legacyLead.hasJoinedFb !== "boolean") {
      legacyLead.hasJoinedFb = false;
      changed = true;
    }
    if (typeof legacyLead.hasClickedLine !== "boolean") {
      legacyLead.hasClickedLine = false;
      changed = true;
    }
    if (typeof legacyLead.doNotContact !== "boolean") {
      legacyLead.doNotContact = false;
      changed = true;
    }
    if (typeof legacyLead.deletionRequested !== "boolean") {
      legacyLead.deletionRequested = false;
      changed = true;
    }
    if (typeof legacyLead.privacyRequestNote !== "string") {
      legacyLead.privacyRequestNote = "";
      changed = true;
    }
    if (typeof legacyLead.notificationStatus !== "string") {
      legacyLead.notificationStatus = "not_configured";
      changed = true;
    }
    if (typeof legacyLead.notificationError !== "string") {
      legacyLead.notificationError = "";
      changed = true;
    }
    if (typeof legacyLead.notifiedAt !== "string") {
      legacyLead.notifiedAt = "";
      changed = true;
    }
    if (typeof legacyLead.notificationAttempts !== "number") {
      legacyLead.notificationAttempts = legacyLead.notifiedAt ? 1 : 0;
      changed = true;
    }
    if (typeof legacyLead.documentStatus !== "string") {
      legacyLead.documentStatus = "not_requested";
      changed = true;
    }
    if (typeof legacyLead.consentVersion !== "string") {
      legacyLead.consentVersion = "2026-06-30";
      changed = true;
    }
    if (typeof legacyLead.ip !== "string") {
      legacyLead.ip = "";
      changed = true;
    }
    if (typeof legacyLead.userAgent !== "string") {
      legacyLead.userAgent = "";
      changed = true;
    }
    if (typeof legacyLead.sessionId !== "string") {
      legacyLead.sessionId = "";
      changed = true;
    }
    if (typeof legacyLead.utmTerm !== "string") {
      legacyLead.utmTerm = "";
      changed = true;
    }
    if (typeof legacyLead.propertyRegion !== "string") {
      legacyLead.propertyRegion = "";
      changed = true;
    }
    if (typeof legacyLead.propertyType !== "string") {
      legacyLead.propertyType = "";
      changed = true;
    }
    if (typeof legacyLead.estimatedPropertyValue !== "number" && legacyLead.estimatedPropertyValue !== null) {
      legacyLead.estimatedPropertyValue = null;
      changed = true;
    }
    if (typeof legacyLead.existingMortgage !== "string") {
      legacyLead.existingMortgage = "";
      changed = true;
    }
    if (typeof legacyLead.companyName !== "string") {
      legacyLead.companyName = "";
      changed = true;
    }
    if (typeof legacyLead.businessRegistrationType !== "string") {
      legacyLead.businessRegistrationType = "";
      changed = true;
    }
    if (typeof legacyLead.monthlyRevenue !== "number" && legacyLead.monthlyRevenue !== null) {
      legacyLead.monthlyRevenue = null;
      changed = true;
    }
  }
  for (const user of db.users) {
    const legacyUser = user as typeof user & {
      twoFactorEnabled?: boolean;
      twoFactorSecret?: string;
      twoFactorConfirmedAt?: string;
    };
    if (typeof legacyUser.twoFactorEnabled !== "boolean") {
      legacyUser.twoFactorEnabled = false;
      changed = true;
    }
    if (typeof legacyUser.twoFactorSecret !== "string") {
      legacyUser.twoFactorSecret = "";
      changed = true;
    }
    if (typeof legacyUser.twoFactorConfirmedAt !== "string") {
      legacyUser.twoFactorConfirmedAt = "";
      changed = true;
    }
  }
  for (const event of db.events) {
    const legacyEvent = event as typeof event & { sourceChannel?: string; sessionId?: string; metadata?: Record<string, string> };
    if (typeof legacyEvent.sourceChannel !== "string") {
      legacyEvent.sourceChannel = legacyEvent.metadata?.sourceChannel || "";
      changed = true;
    }
    if (typeof legacyEvent.sessionId !== "string") {
      legacyEvent.sessionId = legacyEvent.metadata?.sessionId || "";
      changed = true;
    }
    if (!legacyEvent.metadata || typeof legacyEvent.metadata !== "object" || Array.isArray(legacyEvent.metadata)) {
      legacyEvent.metadata = {};
      changed = true;
    }
  }
  return changed;
}

export async function readDB(): Promise<BankClubDB> {
  await mkdir(dataDir, { recursive: true });
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const raw = await readFile(dbFile, "utf8");
      const db = JSON.parse(raw) as BankClubDB;
      if (mergeSeedData(db)) {
        await writeDB(db);
      }
      return db;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        const db = initialDB();
        await writeDB(db);
        return db;
      }
      lastError = error;
      await sleep(25);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Unable to read database");
}

export async function writeDB(db: BankClubDB) {
  await mkdir(dataDir, { recursive: true });
  const tempFile = `${dbFile}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;
  await writeFile(tempFile, JSON.stringify(db, null, 2), "utf8");
  await rename(tempFile, dbFile);
}

export async function mutateDB<T>(mutator: (db: BankClubDB) => T | Promise<T>): Promise<T> {
  const run = async () => {
    const releaseLock = await acquireWriteLock();
    try {
      const db = await readDB();
      const result = await mutator(db);
      await writeDB(db);
      return result;
    } finally {
      await releaseLock();
    }
  };
  const nextMutation = mutationQueue.then(run, run);
  mutationQueue = nextMutation.catch(() => undefined);
  return nextMutation;
}

export function verifyPassword(input: string, storedHash: string) {
  if (storedHash.startsWith("pbkdf2$")) {
    const [, digest, iterations, salt, expected] = storedHash.split("$");
    if (digest !== "sha256" || !iterations || !salt || !expected) return false;
    const iterationCount = Number(iterations);
    if (!Number.isInteger(iterationCount) || iterationCount < 100_000) return false;
    const actual = pbkdf2Sync(input, salt, iterationCount, 32, "sha256").toString("base64url");
    return safeCompare(actual, expected);
  }
  return /^[a-f0-9]{64}$/i.test(storedHash) && safeCompare(legacyHashPassword(input), storedHash);
}

export function passwordHashNeedsUpgrade(storedHash: string) {
  return !storedHash.startsWith(`pbkdf2$sha256$${passwordIterations}$`);
}

export function createAudit(actorId: string, action: string, targetType: string, targetId: string): AuditLog {
  return {
    id: randomUUID(),
    actorId,
    action,
    targetType,
    targetId,
    createdAt: new Date().toISOString(),
  };
}
