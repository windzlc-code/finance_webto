"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFbPostText } from "@/lib/fb-posts";
import { allowedPublicResourceExtensions, maxPublicResourceUploadBytes } from "@/lib/file-resource-policy";
import { identityLabels, loanLabels, statusLabels } from "@/lib/site-data";
import type { Article, ArticleCategory, ArticleComplianceFlags, AuditLog, BusinessLoanApplication, CreditApplication, CreditApplicationFile, FileResource, HouseLoanApplication, Lead, LeadAssignment, LeadNote, LeadPriority, LeadStatus, LineDocumentStatus, SiteEvent, SiteSettings, UserRole } from "@/lib/types";

type User = { id: string; name: string; email: string; role: UserRole; twoFactorEnabled: boolean };
type Specialist = { id: string; name: string; email: string; role: string };
type ManagedUser = { id: string; name: string; email: string; role: UserRole; phone: string; lineId: string; twoFactorEnabled: boolean; createdAt: string };
type ManagedArticleCategory = ArticleCategory & { articleCount: number };
type TwoFactorState = {
  enabled: boolean;
  confirmedAt: string;
  hasPendingSecret: boolean;
  setupUri: string;
  secret: string;
};
type LaunchChecklist = {
  ok: boolean;
  origin: string;
  generatedAt: string;
  totals: { pass: number; warn: number; fail: number };
  checks: Array<{ id: string; label: string; status: "pass" | "warn" | "fail"; detail: string }>;
};
type Summary = {
  totalLeads: number;
  newLeads: number;
  articles: number;
  files: number;
  totalSessions: number;
  leadsByLoan: Record<string, number>;
  leadsByStatus: Record<LeadStatus, number>;
  eventsByName: Record<string, number>;
  pageViewsByPath: Record<string, number>;
  sourceChannelsByEvent: Record<string, number>;
  formSubmitsBySource: Record<string, number>;
  sourceSessionConversions: Record<string, { sessions: number; leadSessions: number; conversionRate: number }>;
  seoKeywords: Record<string, { views: number; formSubmits: number; ctaClicks: number }>;
  leadsBySource: Record<string, { leads: number; contacted: number; conversionRate: number }>;
  leadsByPage: Record<string, { leads: number; pageViews: number; conversionRate: number }>;
  articleContributions: Record<string, { ctaClicks: number; formClicks: number; lineClicks: number; fbClicks: number; leads: number; contacted: number; conversionRate: number }>;
  campaignConversions: Record<string, { leads: number; contacted: number; formSubmits: number; ctaClicks: number; conversionRate: number; sourceChannels: string[]; loanTypes: string[] }>;
  fileDownloads: Record<string, { fileId: string; title: string; type: string; visibility: string; totalDownloads: number; publicDownloads: number; adminPreviewDownloads: number; sourceChannels: string[]; sourcePages: string[]; lastDownloadedAt: string }>;
  contentOperations: {
    publishedArticles: number;
    draftArticles: number;
    pendingCompliance: number;
    publishedMissingFbPost: number;
    fbNotStarted: number;
    fbCopied: number;
    fbPosted: number;
  };
  ctaClicksByPage: Record<string, { totalClicks: number; lineClicks: number; fbClicks: number; formClicks: number; officialApplyClicks: number }>;
  ctaClicksByLoanType: Record<string, { totalClicks: number; serviceClicks: number; entryClicks: number; formClicks: number; lineClicks: number; fbClicks: number; leads: number; contacted: number; conversionRate: number }>;
  loanTypeConversions: Record<string, { leads: number; contacted: number; conversionRate: number }>;
  operationsQueue: {
    dueFollowUps: number;
    upcomingFollowUps: number;
    missingFollowUpPlan: number;
    pendingDocuments: number;
    documentsReceived: number;
    needsManualReview: number;
    highPriority: number;
    privacyRequests: number;
    lineClicked: number;
    fbJoined: number;
  };
  notificationOperations: {
    sent: number;
    failed: number;
    notConfigured: number;
    unsent: number;
    needsAttention: number;
    totalAttempts: number;
    deliveryRate: number;
  };
  conversionRates: { pageToForm: number; formToContacted: number; contactedLeads: number };
  latestEvents: SiteEvent[];
  latestLeads: Lead[];
};

type LeadFilters = { q: string; loanType: string; status: string; sourceChannel: string; assignedTo: string };
type DocumentStatus = Lead["documentStatus"];
type LeadDetailPayload = {
  lead?: Lead;
  notes?: LeadNote[];
  assignments?: LeadAssignment[];
  creditApplication?: CreditApplication | null;
  creditApplicationFiles?: CreditApplicationFile[];
  houseLoanApplication?: HouseLoanApplication | null;
  businessLoanApplication?: BusinessLoanApplication | null;
};
type FbPostStatus = Article["fbPostStatus"];
type AdminAuditLog = AuditLog & { actorName: string };
type SourceConversionEntry = [string, { leads: number; contacted: number; conversionRate: number }];
type SourceSessionConversionEntry = [string, { sessions: number; leadSessions: number; conversionRate: number }];
type PageConversionEntry = [string, { leads: number; pageViews: number; conversionRate: number }];
type ArticleContributionEntry = [string, { ctaClicks: number; formClicks: number; lineClicks: number; fbClicks: number; leads: number; contacted: number; conversionRate: number }];
type SeoKeywordEntry = [string, { views: number; formSubmits: number; ctaClicks: number }];
type CampaignConversionEntry = [string, { leads: number; contacted: number; formSubmits: number; ctaClicks: number; conversionRate: number; sourceChannels: string[]; loanTypes: string[] }];
type FileDownloadEntry = [string, { fileId: string; title: string; type: string; visibility: string; totalDownloads: number; publicDownloads: number; adminPreviewDownloads: number; sourceChannels: string[]; sourcePages: string[]; lastDownloadedAt: string }];
type CtaPageEntry = [string, { totalClicks: number; lineClicks: number; fbClicks: number; formClicks: number; officialApplyClicks: number }];
type CtaLoanTypeEntry = [string, { totalClicks: number; serviceClicks: number; entryClicks: number; formClicks: number; lineClicks: number; fbClicks: number; leads: number; contacted: number; conversionRate: number }];
type LoanTypeConversionEntry = [string, { leads: number; contacted: number; conversionRate: number }];
type FbPostImportEntry = { article: Article; fbPostUrl: string };
type LaunchReadinessBooleanKey = Exclude<keyof SiteSettings["launchReadiness"], "notes" | "updatedAt" | "updatedBy">;

const defaultLeadFilters: LeadFilters = { q: "", loanType: "", status: "", sourceChannel: "", assignedTo: "" };
const emptySourceConversions: SourceConversionEntry[] = [["尚無來源", { leads: 0, contacted: 0, conversionRate: 0 }]];
const emptySourceSessionConversions: SourceSessionConversionEntry[] = [["尚無會話", { sessions: 0, leadSessions: 0, conversionRate: 0 }]];
const emptyPageConversions: PageConversionEntry[] = [["尚無頁面", { leads: 0, pageViews: 0, conversionRate: 0 }]];
const emptyArticleContributions: ArticleContributionEntry[] = [["尚無文章貢獻", { ctaClicks: 0, formClicks: 0, lineClicks: 0, fbClicks: 0, leads: 0, contacted: 0, conversionRate: 0 }]];
const emptySeoKeywords: SeoKeywordEntry[] = [["尚無 SEO 關鍵字", { views: 0, formSubmits: 0, ctaClicks: 0 }]];
const emptyCampaignConversions: CampaignConversionEntry[] = [["尚無 UTM 活動", { leads: 0, contacted: 0, formSubmits: 0, ctaClicks: 0, conversionRate: 0, sourceChannels: [], loanTypes: [] }]];
const emptyFileDownloads: FileDownloadEntry[] = [["尚無文件下載", { fileId: "", title: "尚無文件下載", type: "", visibility: "", totalDownloads: 0, publicDownloads: 0, adminPreviewDownloads: 0, sourceChannels: [], sourcePages: [], lastDownloadedAt: "" }]];
const emptyCtaPages: CtaPageEntry[] = [["尚無 CTA 點擊", { totalClicks: 0, lineClicks: 0, fbClicks: 0, formClicks: 0, officialApplyClicks: 0 }]];
const emptyCtaLoanTypes: CtaLoanTypeEntry[] = [["尚無貸款類型點擊", { totalClicks: 0, serviceClicks: 0, entryClicks: 0, formClicks: 0, lineClicks: 0, fbClicks: 0, leads: 0, contacted: 0, conversionRate: 0 }]];
const emptyLoanTypeConversions: LoanTypeConversionEntry[] = [["尚無貸款類型", { leads: 0, contacted: 0, conversionRate: 0 }]];
const contentOperationsLabels: Array<[keyof Summary["contentOperations"], string]> = [
  ["publishedArticles", "已發布文章"],
  ["draftArticles", "草稿文章"],
  ["pendingCompliance", "待合規檢查"],
  ["publishedMissingFbPost", "已發布但未完成 FB 導流"],
  ["fbNotStarted", "FB 尚未發文"],
  ["fbCopied", "FB 已複製待發布"],
  ["fbPosted", "FB 已發布"],
];
const operationsQueueLabels: Array<[keyof Summary["operationsQueue"], string]> = [
  ["dueFollowUps", "今日前待跟進"],
  ["upcomingFollowUps", "已排程跟進"],
  ["missingFollowUpPlan", "缺少跟進計畫"],
  ["pendingDocuments", "待補件 / 資料不完整"],
  ["documentsReceived", "已收到 / 已確認補件"],
  ["needsManualReview", "需人工判斷"],
  ["highPriority", "高優先"],
  ["privacyRequests", "個資停止 / 刪除請求"],
  ["lineClicked", "已點擊 LINE"],
  ["fbJoined", "已加入 FB"],
];
const notificationOperationsLabels: Array<[keyof Summary["notificationOperations"], string]> = [
  ["sent", "已通知專員"],
  ["notConfigured", "未設定通知"],
  ["failed", "通知失敗"],
  ["unsent", "尚未成功通知"],
  ["needsAttention", "需處理通知"],
  ["totalAttempts", "通知嘗試"],
  ["deliveryRate", "通知送達率"],
];
const launchReadinessLabels: Array<[LaunchReadinessBooleanKey, string]> = [
  ["domainHttpsConfirmed", "正式域名與 HTTPS 已確認"],
  ["lineEntryConfirmed", "LINE 深連結 / QR Code 已掃描確認"],
  ["fbGroupConfirmed", "FB 社團連結已確認"],
  ["officialApplyConfirmed", "銀行官方申請連結已確認可公開使用"],
  ["brandAuthorizationConfirmed", "國泰品牌文字使用規範已確認"],
  ["ga4Confirmed", "GA4 已收到 page_view 與 CTA event"],
  ["searchConsoleConfirmed", "Search Console 已驗證並提交 sitemap"],
  ["notificationWebhookConfirmed", "通知 Webhook 已收測試通知"],
  ["backupDrillConfirmed", "備份下載 / 預檢 / 還原演練已完成"],
  ["pageSpeedConfirmed", "PageSpeed / Lighthouse 手機分數已達標或已記錄例外"],
  ["legalReviewConfirmed", "個資、風險聲明與金融廣告文案已完成負責人確認"],
];
const statusFunnelOrder = Object.keys(statusLabels) as LeadStatus[];
const documentStatusLabels: Record<DocumentStatus, string> = {
  not_requested: "未請求",
  pending: "待補件",
  received: "已收到",
  incomplete: "資料不完整",
  confirmed: "已確認",
};
const creditFileStatusLabels: Record<CreditApplicationFile["uploadStatus"], string> = {
  uploaded: "已上傳",
  validation_failed: "格式驗證失敗",
  pending_reupload: "待重傳",
  deleted: "已刪除",
};
const lineDocumentStatusLabels: Record<LineDocumentStatus, string> = {
  not_reminded: "尚未提醒",
  reminded: "已提醒補件",
  line_received: "LINE 已收到",
  pending_documents: "待補文件",
  confirmed: "已確認完整",
};
const priorityLabels: Record<LeadPriority, string> = {
  normal: "一般",
  needs_review: "需人工判斷",
  high: "高優先",
};
const genderLabels: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "其他 / 不便透露",
};
const purposeLabels: Record<string, string> = {
  daily: "生活消費",
  living: "生活消費",
  renovation: "房屋修繕",
  business: "合法營運週轉",
  unsure: "不確定，先諮詢專員",
  high_risk: "投資理財或高風險用途",
};
const creditCaseSourceLabels: Record<string, string> = {
  company_preferential: "公司優惠貸款",
  specialist_referral: "專員協助確認",
  online_application: "站內網路申請",
  unsure: "不確定，先諮詢",
};
const creditProgramLabels: Record<string, string> = {
  binding: "綁約方案",
  non_binding: "不綁約方案",
  flexible: "彈性方案",
  unsure: "不確定，先諮詢",
};
const fbPostStatusLabels: Record<FbPostStatus, string> = {
  not_started: "尚未發文",
  copied: "已複製待發布",
  posted: "已發布到 FB",
};
const fbPostImportHelp =
  "每行一篇：文章 slug 或站內 /blog/連結 + FB 貼文網址，例如 credit-application-fields https://www.facebook.com/groups/.../posts/...";
const notificationLabels: Record<Lead["notificationStatus"], string> = {
  not_configured: "未設定通知",
  sent: "已通知專員",
  failed: "通知失敗",
};
const assignmentReasonLabels: Record<LeadAssignment["reason"], string> = {
  lead_created: "新線索預設指派",
  manual_assignment: "後台手動改派",
  assignee_deleted: "專員刪除後自動改派",
};
const roleLabels: Record<UserRole, string> = {
  super_admin: "超級管理員",
  specialist: "專員",
  content: "內容營運",
  readonly: "只讀管理",
};
const tabLabels = {
  leads: "線索管理",
  articles: "文章管理",
  files: "文件資源",
  users: "帳號權限",
  settings: "站點設定",
  audit: "操作日誌",
  stats: "統計儀表板",
  launch: "上線檢查",
} as const;

function roleCanManageLeads(role: UserRole) {
  return role === "super_admin" || role === "specialist";
}

function roleCanManageContent(role: UserRole) {
  return role === "super_admin" || role === "content";
}

function roleCanManageAdmin(role: UserRole) {
  return role === "super_admin";
}

async function writeClipboardText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) throw new Error("copy command failed");
}

function tabsForRole(role: UserRole) {
  const tabs: Array<keyof typeof tabLabels> = [];
  if (roleCanManageLeads(role)) tabs.push("leads");
  if (roleCanManageContent(role)) tabs.push("articles", "files");
  if (roleCanManageAdmin(role)) tabs.push("users", "settings", "audit", "launch");
  tabs.push("stats");
  return tabs;
}
const acceptedPublicResourceFiles = allowedPublicResourceExtensions.join(",");

async function fileResourceContentPayload(data: FormData, uploadFieldName: string) {
  const uploadedFile = data.get(uploadFieldName);
  if (uploadedFile instanceof File && uploadedFile.name) {
    if (uploadedFile.size > maxPublicResourceUploadBytes) {
      throw new Error(`匯入文件需小於 ${Math.round(maxPublicResourceUploadBytes / 1024)}KB。`);
    }
    const content = (await uploadedFile.text()).trim();
    if (!content) throw new Error("匯入文件沒有可用文字內容。");
    return {
      content,
      sourceFilename: uploadedFile.name,
      sourceFileMime: uploadedFile.type,
      sourceFileSize: uploadedFile.size,
    };
  }

  return {
    content: String(data.get("content") || ""),
    sourceFilename: "",
    sourceFileMime: "",
    sourceFileSize: 0,
  };
}
const complianceFlagLabels: Array<{ key: keyof ArticleComplianceFlags; label: string }> = [
  { key: "mentionsAmountOrTerm", label: "涉及額度、申請金額或年限" },
  { key: "mentionsRateOrFee", label: "涉及利率、費用或總費用年百分率" },
  { key: "mentionsBinding", label: "涉及綁約、優惠或提前清償條件" },
  { key: "mentionsBankName", label: "涉及銀行名稱或特定銀行方案" },
  { key: "containsGuaranteeLanguage", label: "涉及保證、最低利率、核准等高風險用語" },
  { key: "mentionsLoanPurpose", label: "涉及資金用途或禁止用途提醒" },
];

function leadQuery(filters: LeadFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.loanType) params.set("loanType", filters.loanType);
  if (filters.status) params.set("status", filters.status);
  if (filters.sourceChannel) params.set("sourceChannel", filters.sourceChannel);
  if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
  return params.toString();
}

function maskPhone(phone: string) {
  if (phone.includes("*")) return phone;
  if (phone.length < 6) return "已遮罩";
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

function maskLineId(lineId: string) {
  if (!lineId) return "未填";
  if (lineId.includes("*")) return lineId;
  if (lineId.length < 4) return "已遮罩";
  return `${lineId.slice(0, 2)}***${lineId.slice(-1)}`;
}

function labelValue(label: string, value: string | number | null | undefined) {
  const normalized = value === null || value === undefined || value === "" ? "未填" : value;
  return (
    <span className="detail-field">
      <small>{label}</small>
      <b>{normalized}</b>
    </span>
  );
}

function articleComplianceFlags(data: FormData): ArticleComplianceFlags {
  return complianceFlagLabels.reduce((flags, item) => {
    flags[item.key] = data.get(item.key) === "on";
    return flags;
  }, {} as ArticleComplianceFlags);
}

function userName(users: ManagedUser[], id: string) {
  if (!id) return "尚未記錄";
  if (id === "system") return "系統";
  const user = users.find((item) => item.id === id);
  return user ? `${user.name}（${roleLabels[user.role]}）` : id;
}

function assignmentUserName(users: ManagedUser[], id: string) {
  return id ? userName(users, id) : "未指派";
}

function isFacebookPostUrl(value: string) {
  try {
    const url = new URL(value);
    return /(^|\.)facebook\.com$/i.test(url.hostname) && url.pathname.length > 1;
  } catch {
    return false;
  }
}

function extractArticleSlugFromLine(line: string) {
  const articleUrlMatch = line.match(/https?:\/\/\S+?\/blog\/([^/?#\s]+)/i);
  if (articleUrlMatch?.[1]) return decodeURIComponent(articleUrlMatch[1]);
  const slugMatch = line.match(/(?:^|[\s,;])([a-z0-9][a-z0-9-]{2,})(?=[\s,;]|$)/i);
  return slugMatch?.[1] || "";
}

function parseFbPostImport(input: string, articles: Article[]) {
  const articleBySlug = new Map(articles.map((article) => [article.slug, article]));
  const entries: FbPostImportEntry[] = [];
  const errors: string[] = [];
  const seenArticleIds = new Set<string>();
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const fbPostUrl = line.match(/https?:\/\/(?:www\.|m\.)?facebook\.com\/\S+/i)?.[0]?.replace(/[),。；;]+$/g, "") || "";
    const slug = extractArticleSlugFromLine(line);
    const article = articleBySlug.get(slug);
    if (!article) {
      errors.push(`第 ${lineNumber} 行找不到文章 slug：${slug || "未提供"}`);
      return;
    }
    if (article.status !== "published") {
      errors.push(`第 ${lineNumber} 行文章尚未發布：${article.slug}`);
      return;
    }
    if (!isFacebookPostUrl(fbPostUrl)) {
      errors.push(`第 ${lineNumber} 行缺少有效 FB 貼文網址。`);
      return;
    }
    if (seenArticleIds.has(article.id)) {
      errors.push(`第 ${lineNumber} 行重複匯入文章：${article.slug}`);
      return;
    }
    seenArticleIds.add(article.id);
    entries.push({ article, fbPostUrl });
  });

  return { entries, errors };
}

export function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [creditApplication, setCreditApplication] = useState<CreditApplication | null>(null);
  const [creditApplicationFiles, setCreditApplicationFiles] = useState<CreditApplicationFile[]>([]);
  const [houseLoanApplication, setHouseLoanApplication] = useState<HouseLoanApplication | null>(null);
  const [businessLoanApplication, setBusinessLoanApplication] = useState<BusinessLoanApplication | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [assignments, setAssignments] = useState<LeadAssignment[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleCategories, setArticleCategories] = useState<ManagedArticleCategory[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [files, setFiles] = useState<FileResource[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileResource | null>(null);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [sourceChannels, setSourceChannels] = useState<string[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<ManagedUser[]>([]);
  const [twoFactor, setTwoFactor] = useState<TwoFactorState | null>(null);
  const [launchChecklist, setLaunchChecklist] = useState<LaunchChecklist | null>(null);
  const [tab, setTab] = useState("leads");
  const [message, setMessage] = useState("");
  const [leadFilters, setLeadFilters] = useState<LeadFilters>(defaultLeadFilters);
  const [fbPostImportText, setFbPostImportText] = useState("");
  const openedDeepLinkLeadId = useRef("");

  const hydrate = useCallback(async (filters: LeadFilters = defaultLeadFilters) => {
    const me = await fetch("/api/admin/me");
    if (!me.ok) return;
    const meJson = (await me.json()) as { user: User };
    setUser(meJson.user);
    const role = meJson.user.role;
    const canLoadLeads = roleCanManageLeads(role);
    const canLoadContent = roleCanManageContent(role);
    const canLoadAdmin = roleCanManageAdmin(role);
    const [summaryJson, leadsJson, articlesJson, filesJson, settingsJson, auditJson, usersJson, twoFactorJson, launchJson] = await Promise.all([
      fetch("/api/admin/summary").then((r) => r.json()),
      canLoadLeads ? fetch(`/api/admin/leads?${leadQuery(filters)}`).then((r) => r.json()) : Promise.resolve({}),
      canLoadContent ? fetch("/api/admin/articles").then((r) => r.json()) : Promise.resolve({}),
      canLoadContent ? fetch("/api/admin/files").then((r) => r.json()) : Promise.resolve({}),
      canLoadAdmin ? fetch("/api/admin/settings").then((r) => r.json()) : Promise.resolve({}),
      canLoadAdmin ? fetch("/api/admin/audit-logs").then((r) => r.json()) : Promise.resolve({}),
      canLoadAdmin ? fetch("/api/admin/users").then((r) => r.json()) : Promise.resolve({}),
      canLoadAdmin ? fetch("/api/admin/two-factor").then((r) => r.json()) : Promise.resolve({}),
      canLoadAdmin ? fetch("/api/admin/launch-checklist").then((r) => r.json().catch(() => null)) : Promise.resolve(null),
    ]);
    setSummary(summaryJson);
    setLeads(leadsJson.leads || []);
    setSpecialists(leadsJson.specialists || []);
    setSourceChannels(leadsJson.sourceChannels || []);
    setArticles(articlesJson.articles || []);
    setArticleCategories(articlesJson.categories || []);
    setFiles(filesJson.files || []);
    setSiteSettings(settingsJson.settings || null);
    setAuditLogs(auditJson.auditLogs || []);
    setAdminUsers(usersJson.users || []);
    setTwoFactor(twoFactorJson.twoFactor || null);
    setLaunchChecklist(launchJson?.checks ? launchJson : null);
  }, []);

  const refreshAuditLogs = useCallback(async () => {
    if (!user || !roleCanManageAdmin(user.role)) return;
    const response = await fetch("/api/admin/audit-logs");
    if (!response.ok) return;
    const json = (await response.json().catch(() => ({}))) as { auditLogs?: AdminAuditLog[] };
    setAuditLogs(json.auditLogs || []);
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void hydrate();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hydrate]);

  useEffect(() => {
    if (!user || tab !== "audit" || !roleCanManageAdmin(user.role)) return;
    const timer = window.setTimeout(() => {
      void refreshAuditLogs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshAuditLogs, tab, user]);

  useEffect(() => {
    if (!user || !roleCanManageLeads(user.role)) return;
    const leadId = new URLSearchParams(window.location.search).get("lead_id")?.trim() || "";
    if (!leadId || openedDeepLinkLeadId.current === leadId) return;
    openedDeepLinkLeadId.current = leadId;
    setTab("leads");
    void fetch(`/api/admin/leads/${encodeURIComponent(leadId)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then((json: LeadDetailPayload) => {
        if (!json.lead) throw new Error("missing lead");
        setSelected(json.lead);
        setNotes(json.notes || []);
        setAssignments(json.assignments || []);
        setCreditApplication(json.creditApplication || null);
        setCreditApplicationFiles(json.creditApplicationFiles || []);
        setHouseLoanApplication(json.houseLoanApplication || null);
        setBusinessLoanApplication(json.businessLoanApplication || null);
      })
      .catch(() => {
        setMessage("通知連結中的線索不存在，或目前帳號沒有權限查看。");
      });
  }, [user]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        password: data.get("password"),
      }),
    });
    if (!response.ok) {
      const json = (await response.json().catch(() => ({}))) as { message?: string };
      setMessage(json.message || "登入失敗，請確認密碼。");
      return;
    }
    setMessage("");
    await hydrate(leadFilters);
  }

  async function prepareTwoFactor() {
    const response = await fetch("/api/admin/two-factor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "prepare" }),
    });
    const json = (await response.json().catch(() => ({}))) as { twoFactor?: TwoFactorState; message?: string };
    if (!response.ok || !json.twoFactor) {
      setMessage(json.message || "二階段驗證設定失敗。");
      return;
    }
    setTwoFactor(json.twoFactor);
    setMessage("已產生二階段驗證密鑰，請加入驗證器後輸入 6 位碼啟用。");
  }

  async function updateTwoFactor(event: React.FormEvent<HTMLFormElement>, action: "enable" | "disable") {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/admin/two-factor", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, token: data.get("token") }),
    });
    const json = (await response.json().catch(() => ({}))) as { twoFactor?: TwoFactorState; message?: string };
    if (!response.ok || !json.twoFactor) {
      setMessage(json.message || "二階段驗證更新失敗。");
      return;
    }
    form.reset();
    setTwoFactor(json.twoFactor);
    setMessage(action === "enable" ? "二階段驗證已啟用。" : "二階段驗證已停用。");
    await hydrate(leadFilters);
  }

  async function openLead(id: string) {
    const json = await fetch(`/api/admin/leads/${id}`).then((r) => r.json()) as LeadDetailPayload;
    if (!json.lead) {
      setMessage("線索不存在，或目前帳號沒有權限查看。");
      return;
    }
    setSelected(json.lead);
    setNotes(json.notes || []);
    setAssignments(json.assignments || []);
    setCreditApplication(json.creditApplication || null);
    setCreditApplicationFiles(json.creditApplicationFiles || []);
    setHouseLoanApplication(json.houseLoanApplication || null);
    setBusinessLoanApplication(json.businessLoanApplication || null);
  }

  async function applyLeadFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = {
      q: String(data.get("q") || ""),
      loanType: String(data.get("loanType") || ""),
      status: String(data.get("status") || ""),
      sourceChannel: String(data.get("sourceChannel") || ""),
      assignedTo: String(data.get("assignedTo") || ""),
    };
    setLeadFilters(next);
    await hydrate(next);
  }

  function exportLeads() {
    window.location.href = `/api/admin/leads/export?${leadQuery(leadFilters)}`;
  }

  function downloadBackup() {
    window.location.href = "/api/admin/backup";
  }

  async function parseBackupForm(form: HTMLFormElement) {
    const data = new FormData(form);
    const file = data.get("backupFile");
    if (!(file instanceof File) || !file.name) throw new Error("請先選擇 JSON 備份檔");
    const text = await file.text();
    return {
      backup: JSON.parse(text) as unknown,
      confirmText: String(data.get("confirmText") || ""),
    };
  }

  async function restoreBackupFromForm(form: HTMLFormElement, dryRun: boolean) {
    try {
      const payload = await parseBackupForm(form);
      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, dryRun }),
      });
      const json = (await response.json().catch(() => ({}))) as {
        message?: string;
        summary?: { users: number; leads: number; articles: number; files: number; events: number; auditLogs: number };
      };
      if (!response.ok) {
        setMessage(json.message || "備份還原檢查失敗。");
        return;
      }
      const summary = json.summary
        ? `使用者 ${json.summary.users}、線索 ${json.summary.leads}、文章 ${json.summary.articles}、文件 ${json.summary.files}。`
        : "";
      setMessage(dryRun ? `備份預檢通過。${summary}` : `備份已還原。${summary}`);
      await hydrate(leadFilters);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "備份檔解析失敗。");
    }
  }

  async function previewBackupRestore(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await restoreBackupFromForm(event.currentTarget, true);
  }

  async function confirmBackupRestore(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    if (!window.confirm("確定要用此 JSON 備份覆蓋目前資料庫？此操作會替換線索、文章、設定、事件與帳號資料。")) return;
    await restoreBackupFromForm(form, false);
  }

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        role: data.get("role"),
        phone: data.get("phone"),
        lineId: data.get("lineId"),
        password: data.get("password"),
      }),
    });
    const json = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setMessage(json.message || "使用者建立失敗。");
      return;
    }
    form.reset();
    setMessage("使用者已建立。");
    await hydrate(leadFilters);
  }

  async function updateUser(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        role: data.get("role"),
        phone: data.get("phone"),
        lineId: data.get("lineId"),
        password: data.get("password"),
      }),
    });
    const json = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setMessage(json.message || "使用者更新失敗。");
      return;
    }
    setMessage("使用者已更新。");
    await hydrate(leadFilters);
  }

  async function deleteUser(id: string) {
    if (!window.confirm("確定刪除此後台使用者？若該使用者負責線索，會改派給目前帳號。")) return;
    const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const json = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setMessage(json.message || "使用者刪除失敗。");
      return;
    }
    setMessage("使用者已刪除。");
    await hydrate(leadFilters);
  }

  async function updateLead(update: {
    status?: LeadStatus;
    assignedTo?: string;
    leadPriority?: LeadPriority;
    nextFollowUpAt?: string;
    documentStatus?: DocumentStatus;
    hasJoinedFb?: boolean;
    hasClickedLine?: boolean;
    doNotContact?: boolean;
    deletionRequested?: boolean;
    privacyRequestNote?: string;
    houseDocumentLineStatus?: LineDocumentStatus;
    businessDocumentLineStatus?: LineDocumentStatus;
  }) {
    if (!selected) return;
    const response = await fetch(`/api/admin/leads/${selected.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(update),
    });
    const json = (await response.json().catch(() => ({}))) as LeadDetailPayload & { message?: string };
    if (!response.ok || !json.lead) {
      setMessage(json.message || "線索更新失敗。");
      return;
    }
    setSelected(json.lead);
    setAssignments(json.assignments || []);
    setCreditApplication(json.creditApplication || null);
    setCreditApplicationFiles(json.creditApplicationFiles || []);
    setHouseLoanApplication(json.houseLoanApplication || null);
    setBusinessLoanApplication(json.businessLoanApplication || null);
    await hydrate(leadFilters);
  }

  async function updateCreditFileStatus(fileId: string, uploadStatus: CreditApplicationFile["uploadStatus"]) {
    if (!selected) return;
    const response = await fetch(`/api/admin/credit-application-files/${fileId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ uploadStatus }),
    });
    const json = (await response.json().catch(() => ({}))) as LeadDetailPayload & { message?: string };
    if (!response.ok || !json.lead) {
      setMessage(json.message || "信貸文件狀態更新失敗。");
      return;
    }
    setSelected(json.lead);
    setCreditApplication(json.creditApplication || null);
    setCreditApplicationFiles(json.creditApplicationFiles || []);
    setMessage(uploadStatus === "uploaded" ? "身分證文件已確認清楚。" : "已標記身分證文件待重傳。");
    await hydrate(leadFilters);
  }

  async function deleteCreditFile(fileId: string) {
    if (!selected) return;
    if (!window.confirm("確定刪除此身分證檔案？刪除後會標記待重傳，且此操作會寫入稽核紀錄。")) return;
    const response = await fetch(`/api/admin/credit-application-files/${fileId}`, { method: "DELETE" });
    const json = (await response.json().catch(() => ({}))) as LeadDetailPayload & { message?: string };
    if (!response.ok || !json.lead) {
      setMessage(json.message || "信貸文件刪除失敗。");
      return;
    }
    setSelected(json.lead);
    setCreditApplication(json.creditApplication || null);
    setCreditApplicationFiles(json.creditApplicationFiles || []);
    setMessage("身分證文件已刪除，請透過 LINE 或電話提醒客戶重傳。");
    await hydrate(leadFilters);
  }

  async function retryLeadNotification() {
    if (!selected) return;
    const response = await fetch(`/api/admin/leads/${selected.id}/notify`, { method: "POST" });
    const json = (await response.json().catch(() => ({}))) as { lead?: Lead; message?: string };
    if (!response.ok || !json.lead) {
      setMessage(json.message || "通知重送失敗。");
      return;
    }
    setSelected(json.lead);
    setMessage(json.lead.notificationStatus === "sent" ? "通知已重送。" : "通知尚未送出，請檢查通知設定。");
    await hydrate(leadFilters);
  }

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/admin/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leadId: selected.id, body: data.get("body") }),
    });
    const json = (await response.json().catch(() => ({}))) as { note?: LeadNote; message?: string };
    if (!response.ok || !json.note) {
      setMessage(json.message || "跟進備註新增失敗。");
      return;
    }
    form.reset();
    setMessage("跟進備註已新增。");
    await openLead(selected.id);
    await hydrate(leadFilters);
  }

  async function updatePrivacyRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const data = new FormData(event.currentTarget);
    await updateLead({
      doNotContact: data.get("doNotContact") === "on",
      deletionRequested: data.get("deletionRequested") === "on",
      privacyRequestNote: String(data.get("privacyRequestNote") || ""),
    });
  }

  async function createArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/admin/articles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        slug: data.get("slug"),
        category: data.get("category"),
        excerpt: data.get("excerpt"),
        body: data.get("body"),
        coverImageUrl: data.get("coverImageUrl"),
        coverImageAlt: data.get("coverImageAlt"),
        seoTitle: data.get("seoTitle"),
        seoDescription: data.get("seoDescription"),
        keywords: data.get("keywords"),
        fbSummary: data.get("fbSummary"),
        fbPostStatus: data.get("fbPostStatus"),
        fbPostUrl: data.get("fbPostUrl"),
        fbPostNote: data.get("fbPostNote"),
        ctaType: data.get("ctaType"),
        status: data.get("status"),
        complianceChecked: data.get("complianceChecked") === "on",
        complianceFlags: articleComplianceFlags(data),
        complianceNotes: data.get("complianceNotes"),
        totalAnnualPercentageRate: data.get("totalAnnualPercentageRate"),
        annualPercentageRateDescription: data.get("annualPercentageRateDescription"),
        feeDisclosureNote: data.get("feeDisclosureNote"),
      }),
    });
    if (!response.ok) {
      const json = (await response.json().catch(() => ({}))) as { message?: string };
      setMessage(json.message || "文章建立失敗。");
      return;
    }
    form.reset();
    setMessage("文章已建立。");
    await hydrate(leadFilters);
  }

  async function updateArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedArticle) return;
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/articles/${selectedArticle.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        slug: data.get("slug"),
        category: data.get("category"),
        excerpt: data.get("excerpt"),
        body: data.get("body"),
        coverImageUrl: data.get("coverImageUrl"),
        coverImageAlt: data.get("coverImageAlt"),
        seoTitle: data.get("seoTitle"),
        seoDescription: data.get("seoDescription"),
        keywords: data.get("keywords"),
        fbSummary: data.get("fbSummary"),
        ctaType: data.get("ctaType"),
        status: data.get("status"),
        complianceChecked: data.get("complianceChecked") === "on",
        complianceFlags: articleComplianceFlags(data),
        complianceNotes: data.get("complianceNotes"),
        totalAnnualPercentageRate: data.get("totalAnnualPercentageRate"),
        annualPercentageRateDescription: data.get("annualPercentageRateDescription"),
        feeDisclosureNote: data.get("feeDisclosureNote"),
      }),
    });
    const json = (await response.json().catch(() => ({}))) as { article?: Article; message?: string };
    if (!response.ok || !json.article) {
      setMessage(json.message || "文章更新失敗。");
      return;
    }
    setSelectedArticle(json.article);
    setMessage("文章已更新。");
    await hydrate(leadFilters);
  }

  async function patchArticle(id: string, update: Partial<Article>) {
    const response = await fetch(`/api/admin/articles/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(update),
    });
    if (!response.ok) {
      const json = (await response.json().catch(() => ({}))) as { message?: string };
      setMessage(json.message || "文章更新失敗。");
      return;
    }
    setMessage("文章狀態已更新。");
    await hydrate(leadFilters);
  }

  async function updateArticleFbPost(article: Article, update: Partial<Pick<Article, "fbPostStatus" | "fbPostUrl" | "fbPostNote">>, successMessage: string) {
    const response = await fetch(`/api/admin/articles/${article.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(update),
    });
    const json = (await response.json().catch(() => ({}))) as { article?: Article; message?: string };
    if (!response.ok || !json.article) {
      setMessage(json.message || "FB 發文狀態更新失敗。");
      return;
    }
    if (selectedArticle?.id === article.id) setSelectedArticle(json.article);
    setMessage(successMessage);
    await hydrate(leadFilters);
  }

  async function deleteArticle(id: string) {
    if (!window.confirm("確定刪除此文章？刪除後前台將不再顯示。")) return;
    const response = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const json = (await response.json().catch(() => ({}))) as { message?: string };
      setMessage(json.message || "文章刪除失敗。");
      return;
    }
    if (selectedArticle?.id === id) setSelectedArticle(null);
    setMessage("文章已刪除。");
    await hydrate(leadFilters);
  }

  async function copyFbSummary(article: Article) {
    const origin = window.location.origin;
    const text = createFbPostText(article, origin);
    try {
      await writeClipboardText(text);
      await updateArticleFbPost(
        article,
        {
          fbPostStatus: article.fbPostStatus === "posted" ? "posted" : "copied",
          fbPostNote: article.fbPostNote || "已複製含 UTM 追蹤與合規提醒的 FB 貼文草稿。",
        },
        "FB 貼文已複製，包含 UTM 追蹤與合規提醒。",
      );
    } catch {
      setMessage("FB 貼文複製失敗，請確認瀏覽器剪貼簿權限後重試。");
    }
  }

  async function copyPendingFbPostQueue() {
    const pendingArticles = articles.filter((article) => article.status === "published" && article.fbPostStatus !== "posted");
    if (!pendingArticles.length) {
      setMessage("目前沒有待發布的 FB 社團貼文。");
      return;
    }
    const origin = window.location.origin;
    const queueText = pendingArticles
      .map((article, index) => [`【${index + 1}/${pendingArticles.length}】`, createFbPostText(article, origin)].join("\n"))
      .join("\n\n---\n\n");

    try {
      await writeClipboardText(queueText);
      let refreshedSelectedArticle: Article | null = null;
      for (const article of pendingArticles) {
        const response = await fetch(`/api/admin/articles/${article.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fbPostStatus: "copied",
            fbPostNote: article.fbPostNote || "已加入 FB 社團待發布隊列，草稿含 UTM 回鏈與合規提醒。",
          }),
        });
        const json = (await response.json().catch(() => ({}))) as { article?: Article; message?: string };
        if (!response.ok || !json.article) {
          setMessage(json.message || "FB 待發布隊列狀態更新失敗。");
          return;
        }
        if (selectedArticle?.id === article.id) refreshedSelectedArticle = json.article;
      }
      if (refreshedSelectedArticle) setSelectedArticle(refreshedSelectedArticle);
      setMessage(`已複製 ${pendingArticles.length} 篇 FB 待發布草稿，並標記為已複製待發布。`);
      await hydrate(leadFilters);
    } catch {
      setMessage("FB 待發布隊列複製失敗，請確認瀏覽器剪貼簿權限後重試。");
    }
  }

  async function markArticleFbPosted(article: Article) {
    const fbPostUrl = window.prompt("貼上已發布的 FB 社團貼文網址，方便後續追蹤。", article.fbPostUrl || "");
    if (fbPostUrl === null) return;
    if (!isFacebookPostUrl(fbPostUrl.trim())) {
      setMessage("請貼上有效的 FB 貼文網址後再標記已發布。");
      return;
    }
    await updateArticleFbPost(
      article,
      {
        fbPostStatus: "posted",
        fbPostUrl: fbPostUrl.trim(),
        fbPostNote: article.fbPostNote || "已在 FB 社團發布並導回站內文章。",
      },
      "文章已標記為已發布到 FB。",
    );
  }

  async function importFbPostedUrls(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { entries, errors } = parseFbPostImport(fbPostImportText, articles);
    if (errors.length) {
      setMessage(errors.slice(0, 3).join("；"));
      return;
    }
    if (!entries.length) {
      setMessage("請貼上至少一行文章 slug 與 FB 貼文網址。");
      return;
    }

    let refreshedSelectedArticle: Article | null = null;
    for (const entry of entries) {
      const response = await fetch(`/api/admin/articles/${entry.article.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fbPostStatus: "posted",
          fbPostUrl: entry.fbPostUrl,
          fbPostNote: entry.article.fbPostNote || "已批量匯入 FB 社團貼文網址並導回站內文章。",
        }),
      });
      const json = (await response.json().catch(() => ({}))) as { article?: Article; message?: string };
      if (!response.ok || !json.article) {
        setMessage(json.message || `FB 發文網址匯入失敗：${entry.article.slug}`);
        return;
      }
      if (selectedArticle?.id === entry.article.id) refreshedSelectedArticle = json.article;
    }
    if (refreshedSelectedArticle) setSelectedArticle(refreshedSelectedArticle);
    setFbPostImportText("");
    setMessage(`已回填 ${entries.length} 篇 FB 貼文網址，並標記為已發布到 FB。`);
    await hydrate(leadFilters);
  }

  async function createArticleCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/admin/article-categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        slug: data.get("slug"),
        description: data.get("description"),
      }),
    });
    const json = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setMessage(json.message || "分類建立失敗。");
      return;
    }
    form.reset();
    setMessage("文章分類已建立。");
    await hydrate(leadFilters);
  }

  async function updateArticleCategory(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/article-categories/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        slug: data.get("slug"),
        description: data.get("description"),
      }),
    });
    const json = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setMessage(json.message || "分類更新失敗。");
      return;
    }
    setMessage("文章分類已更新。");
    await hydrate(leadFilters);
  }

  async function deleteArticleCategory(id: string) {
    if (!window.confirm("確定刪除此文章分類？仍有文章使用時系統會拒絕刪除。")) return;
    const response = await fetch(`/api/admin/article-categories/${id}`, { method: "DELETE" });
    const json = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setMessage(json.message || "分類刪除失敗。");
      return;
    }
    setMessage("文章分類已刪除。");
    await hydrate(leadFilters);
  }

  async function createFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    let importedContent: Awaited<ReturnType<typeof fileResourceContentPayload>>;
    try {
      importedContent = await fileResourceContentPayload(data, "sourceFile");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "文件匯入失敗。");
      return;
    }
    const response = await fetch("/api/admin/files", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        description: data.get("description"),
        ...importedContent,
        type: data.get("type"),
        visibility: data.get("visibility"),
      }),
    });
    if (!response.ok) {
      const json = (await response.json().catch(() => ({}))) as { message?: string };
      setMessage(json.message || "文件建立失敗。");
      return;
    }
    form.reset();
    setMessage("文件已建立。");
    await hydrate(leadFilters);
  }

  async function updateFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) return;
    const data = new FormData(event.currentTarget);
    let importedContent: Awaited<ReturnType<typeof fileResourceContentPayload>>;
    try {
      importedContent = await fileResourceContentPayload(data, "replacementFile");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "文件匯入失敗。");
      return;
    }
    const hasReplacementFile = Boolean(importedContent.sourceFilename);
    const response = await fetch(`/api/admin/files/${selectedFile.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        description: data.get("description"),
        ...importedContent,
        type: data.get("type"),
        visibility: data.get("visibility"),
        replaceContent: hasReplacementFile || data.get("replaceContent") === "on",
      }),
    });
    const json = (await response.json().catch(() => ({}))) as { file?: FileResource; message?: string };
    if (!response.ok || !json.file) {
      setMessage(json.message || "文件更新失敗。");
      return;
    }
    setSelectedFile(json.file);
    setMessage(json.file.version > selectedFile.version ? `文件已替換為 v${json.file.version}。` : "文件資訊已更新。");
    await hydrate(leadFilters);
  }

  async function deleteFile(id: string) {
    if (!window.confirm("確定刪除此公開文件資源？前台下載入口會同步移除。")) return;
    const response = await fetch(`/api/admin/files/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const json = (await response.json().catch(() => ({}))) as { message?: string };
      setMessage(json.message || "文件刪除失敗。");
      return;
    }
    if (selectedFile?.id === id) setSelectedFile(null);
    setMessage("文件已刪除。");
    await hydrate(leadFilters);
  }

  async function updateSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data.entries());
    const launchReadiness: Partial<SiteSettings["launchReadiness"]> = Object.fromEntries(
      launchReadinessLabels.map(([key]) => [key, data.get(`launchReadiness.${key}`) === "on"]),
    );
    launchReadiness.notes = String(data.get("launchReadiness.notes") || "");
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, launchReadiness }),
    });
    if (!response.ok) {
      setMessage("設定更新失敗，請確認權限。");
      return;
    }
    const json = (await response.json()) as { settings: SiteSettings };
    setSiteSettings(json.settings);
    setMessage("站點設定已更新。");
  }

  async function testNotification() {
    const response = await fetch("/api/admin/notifications/test", { method: "POST" });
    const json = (await response.json().catch(() => ({}))) as {
      status?: Lead["notificationStatus"];
      error?: string;
      message?: string;
    };
    if (!response.ok) {
      setMessage(json.message || json.error || "通知測試失敗，請檢查 Webhook 設定。");
      return;
    }
    if (json.status === "sent") {
      setMessage("測試通知已送出。");
      return;
    }
    if (json.status === "not_configured") {
      setMessage("尚未設定通知 Webhook，上線前請設定 NOTIFY_WEBHOOK_URL。");
      return;
    }
    setMessage(json.error || "通知測試失敗，請檢查 Webhook 設定。");
  }

  async function retryPendingNotifications() {
    const response = await fetch("/api/admin/notifications/retry", { method: "POST" });
    const json = (await response.json().catch(() => ({}))) as {
      processed?: number;
      sent?: number;
      failed?: number;
      notConfigured?: number;
      message?: string;
    };
    if (!response.ok) {
      setMessage(json.message || "批量通知重送失敗。");
      return;
    }
    setMessage(`批量通知已處理 ${json.processed || 0} 筆，成功 ${json.sent || 0}、失敗 ${json.failed || 0}、未設定 ${json.notConfigured || 0}。`);
    await hydrate(leadFilters);
  }

  const funnel = useMemo(() => summary?.eventsByName || {}, [summary]);
  const sortedEvents = useMemo(
    () => Object.entries(summary?.eventsByName || {}).sort((a, b) => b[1] - a[1]),
    [summary],
  );
  const sortedPageViews = useMemo(
    () => Object.entries(summary?.pageViewsByPath || {}).sort((a, b) => b[1] - a[1]),
    [summary],
  );
  const sortedSources = useMemo(
    () => Object.entries(summary?.formSubmitsBySource || {}).sort((a, b) => b[1] - a[1]),
    [summary],
  );
  const sortedEventSources = useMemo(
    () => Object.entries(summary?.sourceChannelsByEvent || {}).sort((a, b) => b[1] - a[1]),
    [summary],
  );
  const seoKeywords = useMemo(
    () => Object.entries(summary?.seoKeywords || {}).sort((a, b) => b[1].views + b[1].formSubmits - (a[1].views + a[1].formSubmits)),
    [summary],
  );
  const loanLeadCounts = useMemo(
    () => Object.entries(loanLabels).map(([key, label]) => [label, summary?.leadsByLoan[key] || 0] as [string, number]),
    [summary],
  );
  const statusFunnel = useMemo(
    () => statusFunnelOrder.map((status) => [statusLabels[status], summary?.leadsByStatus?.[status] || 0] as [string, number]),
    [summary],
  );
  const sourceConversions = useMemo(
    () => Object.entries(summary?.leadsBySource || {}).sort((a, b) => b[1].leads - a[1].leads),
    [summary],
  );
  const sourceSessionConversions = useMemo(
    () => Object.entries(summary?.sourceSessionConversions || {}).sort((a, b) => b[1].sessions - a[1].sessions),
    [summary],
  );
  const pageConversions = useMemo(
    () => Object.entries(summary?.leadsByPage || {}).sort((a, b) => b[1].leads - a[1].leads),
    [summary],
  );
  const articleContributions = useMemo(
    () => Object.entries(summary?.articleContributions || {}).sort((a, b) => (b[1].leads - a[1].leads) || (b[1].ctaClicks - a[1].ctaClicks)),
    [summary],
  );
  const campaignConversions = useMemo(
    () => Object.entries(summary?.campaignConversions || {}).sort((a, b) => (b[1].leads - a[1].leads) || (b[1].ctaClicks - a[1].ctaClicks)),
    [summary],
  );
  const fileDownloads = useMemo(
    () => Object.entries(summary?.fileDownloads || {}).sort((a, b) => (b[1].totalDownloads - a[1].totalDownloads) || b[1].lastDownloadedAt.localeCompare(a[1].lastDownloadedAt)),
    [summary],
  );
  const ctaPages = useMemo(
    () => Object.entries(summary?.ctaClicksByPage || {}).sort((a, b) => (b[1].totalClicks - a[1].totalClicks) || (b[1].lineClicks - a[1].lineClicks)),
    [summary],
  );
  const ctaLoanTypes = useMemo(
    () => Object.entries(summary?.ctaClicksByLoanType || {}).sort((a, b) => (b[1].totalClicks - a[1].totalClicks) || (b[1].leads - a[1].leads)),
    [summary],
  );
  const loanTypeConversions = useMemo(
    () => Object.entries(summary?.loanTypeConversions || {}).sort((a, b) => b[1].leads - a[1].leads),
    [summary],
  );
  const canManageContent = user?.role === "super_admin" || user?.role === "content";
  const canExportLeads = user?.role === "super_admin";
  const canViewLeadContacts = user?.role === "super_admin" || user?.role === "specialist";
  const availableTabs = useMemo(() => (user ? tabsForRole(user.role) : []), [user]);
  const currentTab = availableTabs.includes(tab as keyof typeof tabLabels) ? tab : availableTabs[0];

  if (!user) {
    return (
      <main className="admin-login">
        <form onSubmit={login}>
          <div className="admin-login-brand">
            <div>
              <h1>銀行行員俱樂部後台</h1>
              <p>線索、內容、文件與上線檢查管理入口</p>
            </div>
          </div>
          <input name="password" type="password" placeholder="後台密碼" autoFocus required />
          <button className="primary-btn">登入</button>
          {message ? <p className="form-error">{message}</p> : null}
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside>
        <h1>銀行行員俱樂部</h1>
        <p>{user.name}｜{user.role}</p>
        {availableTabs.map((item) => (
          <button className={currentTab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>
            {tabLabels[item]}
          </button>
        ))}
      </aside>
      <section className="admin-main">
        <div className="admin-top">
          <strong>後台管理系統</strong>
          <button onClick={() => fetch("/api/admin/logout", { method: "POST" }).then(() => setUser(null))}>登出</button>
        </div>
        {currentTab === "stats" && message ? <p className="form-error admin-message">{message}</p> : null}
        <div className="metric-grid">
          <div><span>總線索</span><strong>{summary?.totalLeads || 0}</strong></div>
          <div><span>新線索</span><strong>{summary?.newLeads || 0}</strong></div>
          <div><span>文章</span><strong>{summary?.articles || 0}</strong></div>
          <div><span>文件</span><strong>{summary?.files || 0}</strong></div>
        </div>

        {currentTab === "leads" ? (
          <div className="admin-grid">
            <div className="admin-panel">
              <h2>線索列表</h2>
              <form className="filter-form" onSubmit={applyLeadFilters}>
                <input name="q" placeholder="搜尋姓名、手機、LINE ID" defaultValue={leadFilters.q} />
                <select name="loanType" defaultValue={leadFilters.loanType}>
                  <option value="">全部貸款</option>
                  {Object.entries(loanLabels).map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
                <select name="status" defaultValue={leadFilters.status}>
                  <option value="">全部狀態</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
                <select name="sourceChannel" defaultValue={leadFilters.sourceChannel}>
                  <option value="">全部來源</option>
                  {sourceChannels.map((source) => (
                    <option value={source} key={source}>{source}</option>
                  ))}
                </select>
                <select name="assignedTo" defaultValue={leadFilters.assignedTo}>
                  <option value="">全部專員</option>
                  {specialists.map((specialist) => (
                    <option value={specialist.id} key={specialist.id}>{specialist.name}</option>
                  ))}
                </select>
                <button>套用篩選</button>
                {canExportLeads ? <button type="button" onClick={exportLeads}>匯出 CSV</button> : null}
              </form>
              {leads.map((lead) => (
                <button className="lead-row" key={lead.id} onClick={() => openLead(lead.id)}>
                  <strong>{lead.name}</strong>
                  <span>{loanLabels[lead.loanType]}｜{statusLabels[lead.status]}</span>
                  <small>
                    {maskPhone(lead.phone)}
                    {lead.duplicateOf ? "｜可能重複" : ""}
                    {lead.leadPriority === "high" ? "｜高優先" : ""}
                    {lead.doNotContact ? "｜停止聯繫" : ""}
                    {lead.deletionRequested ? "｜刪除請求" : ""}
                  </small>
                </button>
              ))}
            </div>
            <div className="admin-panel">
              <h2>線索詳情</h2>
              {selected ? (
                <>
                  <div className="lead-detail-card">
                    <strong>基本聯絡與跟進</strong>
                    <div className="lead-detail-grid">
                      {labelValue("姓名", selected.name)}
                      {labelValue("性別", genderLabels[selected.gender || ""] || "歷史資料未填")}
                      {labelValue("所在城市", selected.city || "未填（選填）")}
                      {labelValue("身份類型", identityLabels[selected.identityType])}
                      {labelValue("貸款類型", loanLabels[selected.loanType])}
                      {labelValue("手機", canViewLeadContacts ? selected.phone : maskPhone(selected.phone))}
                      {labelValue("LINE ID", canViewLeadContacts ? selected.lineId || "未填" : maskLineId(selected.lineId))}
                      {labelValue("案件狀態", statusLabels[selected.status])}
                      {labelValue("負責專員", specialists.find((item) => item.id === selected.assignedTo)?.name || "未指派")}
                      {labelValue("下次跟進", selected.nextFollowUpAt ? new Date(selected.nextFollowUpAt).toLocaleString("zh-TW") : "未設定")}
                    </div>
                  </div>
                  <div className="lead-detail-card">
                    <strong>來源與通知</strong>
                    <div className="lead-detail-grid">
                      {labelValue("來源", selected.sourceChannel || selected.sourcePage)}
                      {labelValue("來源頁", selected.sourcePage || "未記錄")}
                      {labelValue("Session", selected.sessionId || "未記錄")}
                      {labelValue("UTM", [selected.utmSource || "-", selected.utmMedium || "-", selected.utmCampaign || "-", selected.utmContent || "-", selected.utmTerm || "-"].join(" / "))}
                      {labelValue("通知狀態", `${notificationLabels[selected.notificationStatus] || selected.notificationStatus}${selected.notifiedAt ? ` / ${new Date(selected.notifiedAt).toLocaleString("zh-TW")}` : ""} / 嘗試 ${selected.notificationAttempts || 0} 次`)}
                      {labelValue("通知錯誤", selected.notificationError || "無")}
                      {labelValue("個資同意", selected.consentAt ? new Date(selected.consentAt).toLocaleString("zh-TW") : "未記錄")}
                      {labelValue("同意版本", selected.consentVersion || "未記錄")}
                      {labelValue("IP", selected.ip || "未記錄")}
                      {labelValue("裝置", selected.userAgent ? selected.userAgent.slice(0, 96) : "未記錄")}
                    </div>
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      disabled={selected.doNotContact || selected.deletionRequested}
                      title={selected.doNotContact || selected.deletionRequested ? "使用者已要求停止聯繫或刪除/停止利用，請勿重送通知" : undefined}
                      onClick={retryLeadNotification}
                    >
                      重送通知
                    </button>
                  </div>
                  <div className="lead-extra">
                    <strong>需求摘要</strong>
                    {labelValue("期望金額", selected.desiredAmount ? selected.desiredAmount.toLocaleString("zh-TW") : "未填")}
                    {labelValue("預約時段", selected.appointmentTime ? new Date(selected.appointmentTime).toLocaleString("zh-TW") : "未填")}
                    {labelValue("資金用途", purposeLabels[selected.purpose] || selected.purpose || "未填")}
                    {labelValue("建立時間", selected.createdAt ? new Date(selected.createdAt).toLocaleString("zh-TW") : "未記錄")}
                    {labelValue("更新時間", selected.updatedAt ? new Date(selected.updatedAt).toLocaleString("zh-TW") : "未記錄")}
                    <span className="detail-field full-field"><small>表單備註</small><b>{selected.note || "未填"}</b></span>
                  </div>
                  {selected.loanType === "house" ? (
                    <div className="lead-extra">
                      <strong>房屋資料</strong>
                      {labelValue("地區", selected.propertyRegion || "未填")}
                      {labelValue("類型", selected.propertyType || "未填")}
                      {labelValue("預估市值", selected.estimatedPropertyValue ? selected.estimatedPropertyValue.toLocaleString("zh-TW") : "未填")}
                      {labelValue("既有貸款", selected.existingMortgage || "未填")}
                    </div>
                  ) : null}
                  {creditApplication ? (
                    <div className="lead-extra">
                      <strong>信貸網路申請</strong>
                      {labelValue("申請編號", creditApplication.applicationNo)}
                      {labelValue("申請金額", creditApplication.requestedAmount ? creditApplication.requestedAmount.toLocaleString("zh-TW") : "未填")}
                      {labelValue("申請年限", creditApplication.requestedTermYears ? `${creditApplication.requestedTermYears} 年` : "未填")}
                      {labelValue("案件來源", creditCaseSourceLabels[creditApplication.caseSource] || creditApplication.caseSource || "未填")}
                      {labelValue("適用方案", creditProgramLabels[creditApplication.programType] || creditApplication.programType || "未填")}
                      {labelValue("身分證上傳", creditApplication.idUploadStatus)}
                      {labelValue("財力 LINE 補件", creditApplication.financialLineStatus)}
                      <div className="full-field admin-file-list">
                        <strong>身分證安全文件</strong>
                        {creditApplicationFiles.length ? creditApplicationFiles.map((file) => (
                          <div className="admin-file-item" key={file.id}>
                            <span>
                              {file.fileType === "id_front" ? "正面" : "反面"}｜
                              {creditFileStatusLabels[file.uploadStatus]}｜
                              {file.mimeType}｜
                              {(file.sizeBytes / 1024).toFixed(1)} KB｜
                              SHA-256 {file.checksum.slice(0, 12)}
                            </span>
                            <small>
                              建立：{file.createdAt ? new Date(file.createdAt).toLocaleString("zh-TW") : "未記錄"}
                              {file.reviewedAt ? `｜最後處理：${new Date(file.reviewedAt).toLocaleString("zh-TW")}` : ""}
                              {file.deletedAt ? `｜刪除：${new Date(file.deletedAt).toLocaleString("zh-TW")}` : ""}
                            </small>
                            <div className="row-actions">
                              <a
                                aria-disabled={file.uploadStatus === "deleted"}
                                href={file.uploadStatus === "deleted" ? undefined : `/api/admin/credit-application-files/${file.id}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                查看圖片
                              </a>
                              <a
                                aria-disabled={file.uploadStatus === "deleted"}
                                href={file.uploadStatus === "deleted" ? undefined : `/api/admin/credit-application-files/${file.id}?download=1`}
                              >
                                下載文件
                              </a>
                              <button
                                type="button"
                                disabled={file.uploadStatus === "pending_reupload" || file.uploadStatus === "deleted"}
                                onClick={() => updateCreditFileStatus(file.id, "pending_reupload")}
                              >
                                要求重傳
                              </button>
                              <button
                                type="button"
                                disabled={file.uploadStatus === "uploaded"}
                                onClick={() => updateCreditFileStatus(file.id, "uploaded")}
                              >
                                確認清楚
                              </button>
                              <button type="button" disabled={file.uploadStatus === "deleted"} onClick={() => deleteCreditFile(file.id)}>
                                刪除文件
                              </button>
                            </div>
                          </div>
                        )) : <span>未記錄</span>}
                        <small>本站後台只顯示必要 metadata 與處理狀態；財力證明仍透過 LINE 與專員確認，不在此處上傳。</small>
                      </div>
                    </div>
                  ) : null}
                  {houseLoanApplication ? (
                    <div className="lead-extra">
                      <strong>房貸申請詳情</strong>
                      {labelValue("申請編號", houseLoanApplication.applicationNo)}
                      {labelValue("房貸類型", houseLoanApplication.houseLoanType || "未填")}
                      {labelValue("所在地", [houseLoanApplication.propertyCity, houseLoanApplication.propertyArea].filter(Boolean).join(" ") || "未填")}
                      {labelValue("房屋用途", houseLoanApplication.propertyUsage || "未填")}
                      {labelValue("持有狀態", houseLoanApplication.ownershipStatus || "未填")}
                      {labelValue("期望金額", houseLoanApplication.requestedAmount ? houseLoanApplication.requestedAmount.toLocaleString("zh-TW") : "未填")}
                      {labelValue("期望年限", houseLoanApplication.requestedTermYears ? `${houseLoanApplication.requestedTermYears} 年` : "未填")}
                      <label className="full-field">
                        LINE 補件狀態
                        <select
                          value={houseLoanApplication.documentLineStatus}
                          onChange={(event) => updateLead({ houseDocumentLineStatus: event.target.value as LineDocumentStatus })}
                        >
                          {Object.entries(lineDocumentStatusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </label>
                      <small>權狀、收入證明、稅單與存摺不在本站普通表單上傳；此處只記錄 LINE 補件進度。</small>
                    </div>
                  ) : null}
                  {selected.loanType === "business" ? (
                    <div className="lead-extra">
                      <strong>企業資料</strong>
                      {labelValue("公司 / 商號", selected.companyName || "未填")}
                      {labelValue("登記型態", selected.businessRegistrationType || "未填")}
                      {labelValue("月營收概估", selected.monthlyRevenue ? selected.monthlyRevenue.toLocaleString("zh-TW") : "未填")}
                    </div>
                  ) : null}
                  {businessLoanApplication ? (
                    <div className="lead-extra">
                      <strong>企業貸申請詳情</strong>
                      {labelValue("申請編號", businessLoanApplication.applicationNo)}
                      {labelValue("貸款類型", businessLoanApplication.businessLoanType || "未填")}
                      {labelValue("公司 / 商號", businessLoanApplication.businessName || "未填")}
                      {labelValue("企業型態", businessLoanApplication.businessType || "未填")}
                      {labelValue("所在地", businessLoanApplication.businessLocation || "未填")}
                      {labelValue("營業年數", businessLoanApplication.operatingYears ?? "未填")}
                      {labelValue("月營收區間", businessLoanApplication.monthlyRevenueRange || "未填")}
                      {labelValue("期望金額", businessLoanApplication.requestedAmount ? businessLoanApplication.requestedAmount.toLocaleString("zh-TW") : "未填")}
                      <label className="full-field">
                        LINE 補件狀態
                        <select
                          value={businessLoanApplication.documentLineStatus}
                          onChange={(event) => updateLead({ businessDocumentLineStatus: event.target.value as LineDocumentStatus })}
                        >
                          {Object.entries(lineDocumentStatusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </label>
                      <small>報稅資料、流水、執照與負責人財力證明不在本站普通表單上傳；此處只記錄 LINE 補件進度。</small>
                    </div>
                  ) : null}
                  {selected.duplicateOf ? <p className="privacy-alert">此線索可能與 {selected.duplicateOf} 重複，請先比對手機或 LINE ID。</p> : null}
                  {(selected.doNotContact || selected.deletionRequested) ? (
                    <p className="privacy-alert">
                      {selected.doNotContact ? "使用者已要求停止聯繫。 " : ""}
                      {selected.deletionRequested ? "使用者已提出刪除/停止利用請求。" : ""}
                    </p>
                  ) : null}
                  <div className="detail-controls">
                    <label>
                      案件狀態
                      <select value={selected.status} onChange={(event) => updateLead({ status: event.target.value as LeadStatus })}>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      負責專員
                      <select value={selected.assignedTo} disabled={user.role !== "super_admin"} onChange={(event) => updateLead({ assignedTo: event.target.value })}>
                        {specialists.map((specialist) => (
                          <option key={specialist.id} value={specialist.id}>{specialist.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      優先級
                      <select value={selected.leadPriority} onChange={(event) => updateLead({ leadPriority: event.target.value as LeadPriority })}>
                        {Object.entries(priorityLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      下次跟進
                      <input type="datetime-local" value={selected.nextFollowUpAt} onChange={(event) => updateLead({ nextFollowUpAt: event.target.value })} />
                    </label>
                    <label>
                      補件狀態
                      <select value={selected.documentStatus} onChange={(event) => updateLead({ documentStatus: event.target.value as DocumentStatus })}>
                        {Object.entries(documentStatusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="detail-flags">
                    <label className="inline-check">
                      <input type="checkbox" checked={selected.hasClickedLine} onChange={(event) => updateLead({ hasClickedLine: event.target.checked })} />
                      已點擊 / 已加入 LINE
                    </label>
                    <label className="inline-check">
                      <input type="checkbox" checked={selected.hasJoinedFb} onChange={(event) => updateLead({ hasJoinedFb: event.target.checked })} />
                      已加入 FB 社團
                    </label>
                    <span>最近跟進：{selected.lastFollowUpAt ? new Date(selected.lastFollowUpAt).toLocaleString("zh-TW") : "尚無"}</span>
                  </div>
                  <form onSubmit={addNote} className="note-form">
                    <textarea name="body" placeholder="新增跟進備註，請勿貼上完整敏感文件內容。" required />
                    <button>新增備註</button>
                  </form>
                  <form onSubmit={updatePrivacyRequest} className="privacy-form">
                    <label className="inline-check">
                      <input name="doNotContact" type="checkbox" defaultChecked={selected.doNotContact} />
                      停止聯繫
                    </label>
                    <label className="inline-check">
                      <input name="deletionRequested" type="checkbox" defaultChecked={selected.deletionRequested} />
                      刪除 / 停止利用請求
                    </label>
                    <label className="full-field">
                      個資請求備註
                      <textarea name="privacyRequestNote" defaultValue={selected.privacyRequestNote} placeholder="例如：使用者來信要求停止電話聯繫，已回覆處理。" />
                    </label>
                    <button>儲存個資請求狀態</button>
                  </form>
                  <div className="assignment-history">
                    <h3>指派歷史</h3>
                    {assignments.length ? assignments.map((assignment) => (
                      <div className="assignment-row" key={assignment.id}>
                        <strong>{assignmentReasonLabels[assignment.reason]}</strong>
                        <span>
                          {assignmentUserName(adminUsers, assignment.fromUserId)}
                          {" → "}
                          {assignmentUserName(adminUsers, assignment.toUserId)}
                        </span>
                        <small>
                          {userName(adminUsers, assignment.actorId)}
                          {"｜"}
                          {new Date(assignment.createdAt).toLocaleString("zh-TW")}
                        </small>
                      </div>
                    )) : <p>尚無指派紀錄。</p>}
                  </div>
                  {notes.map((note) => <p className="note" key={note.id}>{note.body}</p>)}
                </>
              ) : <p>選擇左側線索查看詳情。</p>}
            </div>
          </div>
        ) : null}

        {currentTab === "articles" ? (
          <div className="admin-grid">
            <div className="admin-panel">
              <h2>文章管理</h2>
              {canManageContent ? <form className="admin-form article-form" onSubmit={createArticle}>
                <input name="title" placeholder="標題" required />
                <input name="slug" placeholder="slug" required />
                <select name="category" defaultValue={articleCategories[0]?.name || "貸款知識"}>
                  {articleCategories.map((category) => (
                    <option value={category.name} key={category.id}>{category.name}</option>
                  ))}
                </select>
                <textarea name="excerpt" placeholder="摘要" />
                <textarea name="body" placeholder="正文" required />
                <input name="coverImageUrl" placeholder="封面圖 URL，例如 /brand/bank_club_hero.png 或 https://..." />
                <input name="coverImageAlt" placeholder="封面圖 alt，描述圖片內容" />
                <input name="seoTitle" placeholder="SEO title，未填則使用標題" />
                <textarea name="seoDescription" placeholder="SEO description，建議 80 到 160 字" />
                <input name="keywords" placeholder="SEO 關鍵詞，以逗號分隔" />
                <textarea name="fbSummary" placeholder="FB 貼文摘要，可複製到社團貼文" />
                <select name="ctaType" defaultValue="form">
                  <option value="form">文末 CTA：預約表單</option>
                  <option value="line">文末 CTA：LINE 諮詢</option>
                  <option value="fb">文末 CTA：FB 社團</option>
                </select>
                <select name="status" defaultValue="draft">
                  <option value="draft">保存草稿</option>
                  <option value="published">發布</option>
                </select>
                <fieldset className="compliance-fieldset">
                  <legend>金融廣告合規檢查項</legend>
                  {complianceFlagLabels.map((item) => (
                    <label className="inline-check" key={item.key}>
                      <input name={item.key} type="checkbox" /> {item.label}
                    </label>
                  ))}
                </fieldset>
                <input name="totalAnnualPercentageRate" placeholder="總費用年百分率，例如：以銀行揭露為準" />
                <textarea name="annualPercentageRateDescription" placeholder="年百分率說明，例如總費用年百分率不等於貸款利率，實際以銀行契約揭露為準" />
                <textarea name="feeDisclosureNote" placeholder="費用揭露備註，例如開辦費、帳管費、綁約與提前清償限制" />
                <textarea name="complianceNotes" placeholder="合規備註，例如已補充銀行最終審核揭露、已移除保證性用語" />
                <label className="inline-check"><input name="complianceChecked" type="checkbox" /> 已完成合規檢查</label>
                <button>新增文章</button>
              </form> : <p>目前角色可查看文章清單，無文章新增或編輯權限。</p>}
              <div className="article-admin-list">
                {canManageContent ? (
                  <div className="content-ops-bar">
                    <div>
                      <strong>FB 待發布隊列</strong>
                      <span>{articles.filter((article) => article.status === "published" && article.fbPostStatus !== "posted").length} 篇已發布文章尚未標記已發 FB</span>
                    </div>
                    <button type="button" onClick={copyPendingFbPostQueue}>
                      複製待發布 FB 隊列
                    </button>
                    <form className="fb-post-import-form" onSubmit={importFbPostedUrls}>
                      <label>
                        批量回填 FB 貼文網址
                        <textarea
                          name="fbPostImport"
                          value={fbPostImportText}
                          onChange={(event) => setFbPostImportText(event.currentTarget.value)}
                          placeholder={fbPostImportHelp}
                          rows={3}
                        />
                      </label>
                      <button type="submit">匯入已發 FB</button>
                    </form>
                  </div>
                ) : null}
                {articles.map((article) => (
                  <div className="article-admin-row" key={article.id}>
                    <button type="button" onClick={() => setSelectedArticle(article)}>
                      <strong>{article.title}</strong>
                      <span>{article.category}｜{article.status === "published" ? "已發布" : "草稿"}｜{article.complianceChecked ? "已合規檢查" : "未合規檢查"}｜FB：{fbPostStatusLabels[article.fbPostStatus]}</span>
                    </button>
                    {canManageContent ? <div className="row-actions">
                      <button type="button" onClick={() => patchArticle(article.id, { status: article.status === "published" ? "draft" : "published" })}>
                        {article.status === "published" ? "下架" : "發布"}
                      </button>
                      <button type="button" onClick={() => copyFbSummary(article)}>複製 FB</button>
                      <button type="button" onClick={() => markArticleFbPosted(article)}>標記已發 FB</button>
                      <button type="button" onClick={() => deleteArticle(article.id)}>刪除</button>
                    </div> : null}
                  </div>
                ))}
              </div>
              {message ? <p className="form-error">{message}</p> : null}
              {canManageContent ? (
                <div className="category-admin">
                  <h3>文章分類</h3>
                  <form className="category-create-form" onSubmit={createArticleCategory}>
                    <input name="name" placeholder="分類名稱" required />
                    <input name="slug" placeholder="slug" required />
                    <input name="description" placeholder="分類描述" />
                    <button>新增分類</button>
                  </form>
                  <div className="category-admin-list">
                    {articleCategories.map((category) => (
                      <form className="category-admin-row" key={category.id} onSubmit={(event) => updateArticleCategory(event, category.id)}>
                        <input name="name" defaultValue={category.name} required />
                        <input name="slug" defaultValue={category.slug} required />
                        <input name="description" defaultValue={category.description} />
                        <small>{category.articleCount} 篇文章</small>
                        <button>儲存</button>
                        <button type="button" onClick={() => deleteArticleCategory(category.id)}>刪除</button>
                      </form>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="admin-panel">
              <h2>編輯文章</h2>
              {selectedArticle && canManageContent ? (
                <form className="admin-form article-form" key={selectedArticle.id} onSubmit={updateArticle}>
                  <label>標題<input name="title" defaultValue={selectedArticle.title} required /></label>
                  <label>slug<input name="slug" defaultValue={selectedArticle.slug} required /></label>
                  <label>
                    分類
                    <select name="category" defaultValue={selectedArticle.category}>
                      {articleCategories.map((category) => (
                        <option value={category.name} key={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="full-field">摘要<textarea name="excerpt" defaultValue={selectedArticle.excerpt} /></label>
                  <label className="full-field">正文<textarea name="body" defaultValue={selectedArticle.body} rows={8} required /></label>
                  <label className="full-field">封面圖 URL<input name="coverImageUrl" defaultValue={selectedArticle.coverImageUrl} /></label>
                  <label className="full-field">封面圖 alt<input name="coverImageAlt" defaultValue={selectedArticle.coverImageAlt} /></label>
                  <label>SEO title<input name="seoTitle" defaultValue={selectedArticle.seoTitle} /></label>
                  <label className="full-field">SEO description<textarea name="seoDescription" defaultValue={selectedArticle.seoDescription} /></label>
                  <label>SEO 關鍵詞<input name="keywords" defaultValue={selectedArticle.keywords.join(", ")} /></label>
                  <label className="full-field">FB 貼文摘要<textarea name="fbSummary" defaultValue={selectedArticle.fbSummary} /></label>
                  <label>
                    FB 發文狀態
                    <select name="fbPostStatus" defaultValue={selectedArticle.fbPostStatus}>
                      {Object.entries(fbPostStatusLabels).map(([value, label]) => (
                        <option value={value} key={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="full-field">FB 貼文網址<input name="fbPostUrl" defaultValue={selectedArticle.fbPostUrl} placeholder="貼上社團貼文網址，方便追蹤 FB 導流回站內文章" /></label>
                  <label className="full-field">FB 發文備註<textarea name="fbPostNote" defaultValue={selectedArticle.fbPostNote} placeholder="例如：已發布到信貸教學貼，留言補上站內連結。" /></label>
                  <label>
                    文末 CTA
                    <select name="ctaType" defaultValue={selectedArticle.ctaType}>
                      <option value="form">預約表單</option>
                      <option value="line">LINE 諮詢</option>
                      <option value="fb">FB 社團</option>
                    </select>
                  </label>
                  <label>
                    狀態
                    <select name="status" defaultValue={selectedArticle.status}>
                      <option value="draft">草稿</option>
                      <option value="published">已發布</option>
                    </select>
                  </label>
                  <label className="inline-check"><input name="complianceChecked" type="checkbox" defaultChecked={selectedArticle.complianceChecked} /> 已完成合規檢查</label>
                  <fieldset className="compliance-fieldset full-field">
                    <legend>金融廣告合規檢查項</legend>
                    {complianceFlagLabels.map((item) => (
                      <label className="inline-check" key={item.key}>
                        <input
                          name={item.key}
                          type="checkbox"
                          defaultChecked={Boolean(selectedArticle.complianceFlags?.[item.key])}
                        /> {item.label}
                      </label>
                    ))}
                  </fieldset>
                  <label>總費用年百分率<input name="totalAnnualPercentageRate" defaultValue={selectedArticle.totalAnnualPercentageRate} /></label>
                  <label className="full-field">年百分率說明<textarea name="annualPercentageRateDescription" defaultValue={selectedArticle.annualPercentageRateDescription} /></label>
                  <label className="full-field">費用揭露備註<textarea name="feeDisclosureNote" defaultValue={selectedArticle.feeDisclosureNote} /></label>
                  <label className="full-field">合規備註<textarea name="complianceNotes" defaultValue={selectedArticle.complianceNotes} /></label>
                  <div className="article-audit-box full-field">
                    <p><strong>合規復核：</strong>{selectedArticle.complianceReviewedAt ? `${new Date(selectedArticle.complianceReviewedAt).toLocaleString()}｜${userName(adminUsers, selectedArticle.complianceReviewedBy)}` : "尚未完成"}</p>
                    <p><strong>發布紀錄：</strong>{selectedArticle.publishedAt ? `${new Date(selectedArticle.publishedAt).toLocaleString()}｜${userName(adminUsers, selectedArticle.publishedBy)}` : "尚未發布"}</p>
                    <p><strong>FB 社團發文：</strong>{fbPostStatusLabels[selectedArticle.fbPostStatus]}{selectedArticle.fbPostedAt ? `｜${new Date(selectedArticle.fbPostedAt).toLocaleString()}` : ""}{selectedArticle.fbPostUrl ? `｜${selectedArticle.fbPostUrl}` : ""}</p>
                    <p><strong>最後修改：</strong>{selectedArticle.updatedAt ? `${new Date(selectedArticle.updatedAt).toLocaleString()}｜${userName(adminUsers, selectedArticle.lastModifiedBy)}` : "尚未記錄"}</p>
                    <div>
                      <strong>最近修改記錄</strong>
                      {(selectedArticle.revisionHistory || []).slice(0, 5).map((entry) => (
                        <p className="audit-line" key={entry.id}>{new Date(entry.createdAt).toLocaleString()}｜{userName(adminUsers, entry.actorId)}｜{entry.summary}</p>
                      ))}
                    </div>
                  </div>
                  <button>儲存文章</button>
                </form>
              ) : <p>{canManageContent ? "選擇左側文章即可編輯 SEO、FB 摘要、狀態與正文。" : "目前角色沒有文章編輯權限。"}</p>}
            </div>
          </div>
        ) : null}

        {currentTab === "files" ? (
          <div className="admin-grid">
            <div className="admin-panel">
              <h2>文件資源管理</h2>
              {canManageContent ? <form className="admin-form file-form" onSubmit={createFile}>
                <input name="title" placeholder="文件標題" required />
                <select name="type" defaultValue="credit_docs">
                  <option value="credit_docs">信貸文件清單</option>
                  <option value="house_docs">房貸文件清單</option>
                  <option value="business_docs">企業貸文件清單</option>
                  <option value="flow">申請流程圖文</option>
                  <option value="qa_card">QA 圖卡</option>
                  <option value="fb_material">社團貼文素材</option>
                </select>
                <select name="visibility" defaultValue="public">
                  <option value="public">公開下載</option>
                  <option value="admin_only">後台內部</option>
                </select>
                <textarea name="description" placeholder="描述" />
                <label className="full-field">
                  匯入公開文字檔
                  <input name="sourceFile" type="file" accept={acceptedPublicResourceFiles} />
                </label>
                <textarea name="content" placeholder="下載內容，也可改用上方 .txt/.md/.csv/.tsv 公開素材檔匯入" />
                <p className="audit-line full-field">僅匯入公開清單、流程、QA 或社團素材文字；客戶身分證、薪轉、財力與銀行流水等敏感文件請走授權補件通道。</p>
                <button>新增文件</button>
              </form> : <p>目前角色可查看文件清單，無文件新增或替換權限。</p>}
              <div className="article-admin-list">
                {files.map((file) => (
                  <div className="article-admin-row" key={file.id}>
                    <button type="button" onClick={() => setSelectedFile(file)}>
                      <strong>{file.title}</strong>
                  <span>{file.type}｜{file.visibility === "admin_only" ? "後台內部" : "公開下載"}｜v{file.version}｜下載 {file.downloads} 次</span>
                      {file.sourceFilename ? <span>來源檔：{file.sourceFilename}｜{Math.round(file.sourceFileSize / 1024)}KB</span> : null}
                    </button>
                    <div className="row-actions">
                      <a href={`/api/files/${file.id}/download?source=/admin-preview`}>下載 PDF</a>
                      <a href={`/api/files/${file.id}/download?source=/admin-preview&format=txt`}>下載文字</a>
                      {canManageContent ? <button type="button" onClick={() => deleteFile(file.id)}>刪除</button> : null}
                    </div>
                  </div>
                ))}
              </div>
              {message ? <p className="form-error">{message}</p> : null}
            </div>
            <div className="admin-panel">
              <h2>編輯 / 替換文件</h2>
              {selectedFile && canManageContent ? (
                <form className="admin-form file-form" key={selectedFile.id} onSubmit={updateFile}>
                  <label>文件標題<input name="title" defaultValue={selectedFile.title} required /></label>
                  <label>
                    資源類型
                    <select name="type" defaultValue={selectedFile.type}>
                      <option value="credit_docs">信貸文件清單</option>
                      <option value="house_docs">房貸文件清單</option>
                      <option value="business_docs">企業貸文件清單</option>
                      <option value="flow">申請流程圖文</option>
                      <option value="qa_card">QA 圖卡</option>
                      <option value="fb_material">社團貼文素材</option>
                    </select>
                  </label>
                  <label>
                    下載權限
                    <select name="visibility" defaultValue={selectedFile.visibility || "public"}>
                      <option value="public">公開下載</option>
                      <option value="admin_only">後台內部</option>
                    </select>
                  </label>
                  <label className="full-field">描述<textarea name="description" defaultValue={selectedFile.description} /></label>
                  <label className="full-field">
                    匯入新版公開文字檔
                    <input name="replacementFile" type="file" accept={acceptedPublicResourceFiles} />
                  </label>
                  <label className="full-field">文件內容<textarea name="content" defaultValue={selectedFile.content} rows={8} required /></label>
                  <label className="inline-check">
                    <input name="replaceContent" type="checkbox" />
                    以此內容替換舊版本，並將版本號從 v{selectedFile.version} 遞增
                  </label>
                  <p className="audit-line full-field">選擇新版公開文字檔會自動替換內容並建立新版本；敏感個資與財力文件不得匯入網站。</p>
                  {selectedFile.sourceFilename ? (
                    <p className="audit-line full-field">目前來源檔：{selectedFile.sourceFilename}｜{Math.round(selectedFile.sourceFileSize / 1024)}KB｜{selectedFile.sourceUploadedAt ? new Date(selectedFile.sourceUploadedAt).toLocaleString("zh-TW") : "未記錄時間"}</p>
                  ) : null}
                  <p>目前版本 v{selectedFile.version}｜下載 {selectedFile.downloads} 次｜更新 {new Date(selectedFile.updatedAt).toLocaleString("zh-TW")}</p>
                  <div className="article-audit-box full-field">
                    <strong>文件版本紀錄</strong>
                    <p className="audit-line">目前版本 v{selectedFile.version}｜{new Date(selectedFile.updatedAt).toLocaleString("zh-TW")}</p>
                    {(selectedFile.fileVersionHistory || []).length ? (
                      (selectedFile.fileVersionHistory || []).map((entry) => (
                        <p className="audit-line" key={entry.id}>
                          舊版本 v{entry.version}｜{new Date(entry.createdAt).toLocaleString("zh-TW")}｜{userName(adminUsers, entry.createdBy)}
                          {entry.sourceFilename ? `｜來源檔 ${entry.sourceFilename}` : ""}
                          {"｜"}
                          <a href={`/api/files/${selectedFile.id}/download?source=/admin-preview&version=${entry.version}`}>PDF</a>
                          {" / "}
                          <a href={`/api/files/${selectedFile.id}/download?source=/admin-preview&format=txt&version=${entry.version}`}>文字</a>
                        </p>
                      ))
                    ) : (
                      <p className="audit-line">尚無舊版本，首次替換內容後會保留原版本。</p>
                    )}
                  </div>
                  <button>儲存文件</button>
                </form>
              ) : <p>{canManageContent ? "選擇左側文件即可修改標題、描述，或替換公開下載內容。" : "目前角色沒有文件編輯權限。"}</p>}
            </div>
          </div>
        ) : null}

        {currentTab === "users" ? (
          <div className="admin-grid">
            <div className="admin-panel">
              <h2>帳號權限與密碼重設</h2>
              {user.role === "super_admin" ? (
                <>
                  <form className="admin-form user-form" onSubmit={createUser}>
                    <input name="name" placeholder="姓名" required />
                    <input name="email" type="email" placeholder="Email" required />
                    <select name="role" defaultValue="specialist">
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <input name="phone" placeholder="電話 / 行動電話" />
                    <input name="lineId" placeholder="LINE ID" />
                    <input name="password" type="password" placeholder="初始密碼，至少 8 碼" required />
                    <button>新增使用者</button>
                  </form>
                  <div className="user-list">
                    {adminUsers.map((item) => (
                      <form className="user-row" key={item.id} onSubmit={(event) => updateUser(event, item.id)}>
                        <input name="name" defaultValue={item.name} required />
                        <input name="email" type="email" defaultValue={item.email} required />
                        <select name="role" defaultValue={item.role}>
                          {Object.entries(roleLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <input name="phone" defaultValue={item.phone} placeholder="電話" />
                        <input name="lineId" defaultValue={item.lineId} placeholder="LINE ID" />
                        <input name="password" type="password" placeholder="輸入新密碼即可重設" />
                        <div className="row-actions">
                          <button>儲存</button>
                          <button type="button" disabled={item.id === user.id} onClick={() => deleteUser(item.id)}>刪除</button>
                        </div>
                        <small>建立時間：{new Date(item.createdAt).toLocaleString("zh-TW")}｜2FA：{item.twoFactorEnabled ? "已啟用" : "未啟用"}</small>
                      </form>
                    ))}
                  </div>
                </>
              ) : (
                <p>只有超級管理員可以建立、修改或刪除後台帳號。</p>
              )}
              {message ? <p className="form-error">{message}</p> : null}
            </div>
            <div className="admin-panel">
              <h2>角色說明</h2>
              <p><strong>超級管理員：</strong>管理全部線索、內容、文件、設定、備份、匯出與帳號。</p>
              <p><strong>專員：</strong>查看與更新分配給自己的線索。</p>
              <p><strong>內容營運：</strong>管理文章、SEO 內容與公開文件資源。</p>
              <p><strong>只讀管理：</strong>保留登入與查看統計的最低權限，不能編輯資料。</p>
            </div>
          </div>
        ) : null}

        {currentTab === "settings" && siteSettings ? (
          <div className="admin-panel">
            <h2>站點設定</h2>
            <p>這裡的聯絡資料會影響前台 Header、Footer、聯絡我們與主要 CTA。</p>
            <form className="settings-form" onSubmit={updateSettings}>
              <label>品牌名稱<input name="brandName" defaultValue={siteSettings.brandName} /></label>
              <label>公司名稱<input name="companyName" defaultValue={siteSettings.companyName} /></label>
              <label>通訊處<input name="officeName" defaultValue={siteSettings.officeName} /></label>
              <label className="full-field">地址<input name="address" defaultValue={siteSettings.address} /></label>
              <label>電話<input name="phone" defaultValue={siteSettings.phone} /></label>
              <label>傳真<input name="fax" defaultValue={siteSettings.fax} /></label>
              <label>行動電話<input name="mobile" defaultValue={siteSettings.mobile} /></label>
              <label>Email<input name="email" defaultValue={siteSettings.email} /></label>
              <label className="full-field">LINE 連結<input name="lineUrl" defaultValue={siteSettings.lineUrl} /></label>
              <label className="full-field">LINE QR Code 圖片<input name="lineQrCodeUrl" defaultValue={siteSettings.lineQrCodeUrl} placeholder="/brand/bank_club_line_qr.png 或 https://..." /></label>
              <label className="full-field">FB 社團連結<input name="fbGroupUrl" defaultValue={siteSettings.fbGroupUrl} /></label>
              <label className="full-field">銀行官方申請連結<input name="officialApplyUrl" defaultValue={siteSettings.officialApplyUrl} /></label>
              <label>GA4 Measurement ID<input name="gaMeasurementId" defaultValue={siteSettings.gaMeasurementId} placeholder="G-XXXXXXXXXX" /></label>
              <label className="full-field">Google Search Console 驗證碼<input name="googleSearchConsoleVerification" defaultValue={siteSettings.googleSearchConsoleVerification} placeholder="貼上 google-site-verification content" /></label>
              <fieldset className="full-field readiness-checks">
                <legend>正式上線人工確認</legend>
                <p>這些項目對應實施計劃中需外部帳號、品牌授權或人工驗收的閉環。勾選後會寫入操作日誌，並出現在上線檢查。</p>
                <div className="readiness-grid">
                  {launchReadinessLabels.map(([key, label]) => (
                    <label className="inline-check" key={key}>
                      <input name={`launchReadiness.${key}`} type="checkbox" defaultChecked={Boolean(siteSettings.launchReadiness[key])} />
                      {label}
                    </label>
                  ))}
                </div>
                <label className="full-field">確認備註<textarea name="launchReadiness.notes" defaultValue={siteSettings.launchReadiness.notes} rows={4} placeholder="記錄正式域名、GA4 / GSC 驗證、LINE / FB / 官方申請連結、品牌授權、PageSpeed 或法務確認的證據摘要。" /></label>
                <small>
                  最後更新：{siteSettings.launchReadiness.updatedAt ? new Date(siteSettings.launchReadiness.updatedAt).toLocaleString("zh-TW") : "尚未記錄"}
                  {siteSettings.launchReadiness.updatedBy ? `｜${userName(adminUsers, siteSettings.launchReadiness.updatedBy)}` : ""}
                </small>
              </fieldset>
              <button>儲存設定</button>
            </form>
            <div className="backup-actions">
              <h3>通知測試</h3>
              <p>送出一筆測試 payload 到 NOTIFY_WEBHOOK_URL，用於確認新線索通知可正常抵達。</p>
              <button type="button" onClick={testNotification}>發送測試通知</button>
            </div>
            {canExportLeads ? (
              <div className="backup-actions">
                <h3>資料備份</h3>
                <p>下載完整 JSON 備份，包含線索、文章、文件、設定、事件與操作日誌。此檔含個資，請存放於受控位置。</p>
                <button type="button" onClick={downloadBackup}>下載資料備份</button>
                <form className="restore-form" onSubmit={previewBackupRestore}>
                  <label className="full-field">備份 JSON 檔<input name="backupFile" type="file" accept="application/json,.json" required /></label>
                  <label className="full-field">確認短語<input name="confirmText" placeholder="RESTORE BANK CLUB DATA" /></label>
                  <div className="row-actions">
                    <button type="submit">預檢備份</button>
                    <button type="button" onClick={confirmBackupRestore}>確認還原</button>
                  </div>
                  <small>真正還原前必須輸入確認短語，且備份內需包含目前登入的超級管理員，避免還原後鎖定帳號。</small>
                </form>
              </div>
            ) : null}
            <div className="backup-actions">
              <h3>帳號安全</h3>
              <p>二階段驗證使用 6 位 TOTP 動態碼，可加入 Google Authenticator、1Password、Authenticator 等驗證器。</p>
              <p>目前狀態：{twoFactor?.enabled ? `已啟用${twoFactor.confirmedAt ? `，${new Date(twoFactor.confirmedAt).toLocaleString("zh-TW")} 完成確認` : ""}` : "未啟用"}</p>
              {!twoFactor?.enabled ? (
                <>
                  <button type="button" onClick={prepareTwoFactor}>產生 2FA 密鑰</button>
                  {twoFactor?.secret ? (
                    <div className="two-factor-setup">
                      <label>手動輸入密鑰<input readOnly value={twoFactor.secret} /></label>
                      <label className="full-field">otpauth URI<input readOnly value={twoFactor.setupUri} /></label>
                      <form className="inline-security-form" onSubmit={(event) => updateTwoFactor(event, "enable")}>
                        <input name="token" inputMode="numeric" pattern="[0-9]{6}" placeholder="輸入驗證器 6 位碼" required />
                        <button>啟用 2FA</button>
                      </form>
                    </div>
                  ) : null}
                </>
              ) : (
                <form className="inline-security-form" onSubmit={(event) => updateTwoFactor(event, "disable")}>
                  <input name="token" inputMode="numeric" pattern="[0-9]{6}" placeholder="輸入 6 位碼後停用" required />
                  <button>停用 2FA</button>
                </form>
              )}
            </div>
            {message ? <p className="form-error">{message}</p> : null}
          </div>
        ) : null}

        {currentTab === "audit" ? (
          <div className="admin-panel">
            <h2>操作日誌</h2>
            <p>記錄線索、文章、文件、設定與匯出等後台操作，方便後續稽核。</p>
            <div className="audit-list">
              {auditLogs.map((log) => (
                <div className="audit-row" key={log.id}>
                  <strong>{log.action}</strong>
                  <span>{log.targetType}：{log.targetId}</span>
                  <small>{log.actorName}｜{new Date(log.createdAt).toLocaleString("zh-TW")}</small>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {currentTab === "stats" ? (
          <div className="admin-panel">
            <h2>轉化追蹤</h2>
            {siteSettings ? (
              <div className="integration-status">
                <span>GA4：{siteSettings.gaMeasurementId ? `已配置 ${siteSettings.gaMeasurementId}` : "尚未配置"}</span>
                <span>Search Console：{siteSettings.googleSearchConsoleVerification ? "已配置驗證碼" : "尚未配置"}</span>
              </div>
            ) : null}
            <div className="stats-grid">
              <div>
                <span>頁面瀏覽</span>
                <strong>{funnel.page_view || 0}</strong>
              </div>
              <div>
                <span>表單提交</span>
                <strong>{funnel.form_submit || 0}</strong>
              </div>
              <div>
                <span>LINE 點擊</span>
                <strong>{Object.entries(funnel).filter(([key]) => key.includes("line")).reduce((sum, [, value]) => sum + value, 0)}</strong>
              </div>
              <div>
                <span>FB 點擊</span>
                <strong>{Object.entries(funnel).filter(([key]) => key.includes("fb")).reduce((sum, [, value]) => sum + value, 0)}</strong>
              </div>
              <div>
                <span>文件下載</span>
                <strong>{funnel.file_download || 0}</strong>
              </div>
              <div>
                <span>訪客會話</span>
                <strong>{summary?.totalSessions || 0}</strong>
              </div>
              <div>
                <span>頁面到表單</span>
                <strong>{summary?.conversionRates.pageToForm || 0}%</strong>
              </div>
              <div>
                <span>表單到已聯繫</span>
                <strong>{summary?.conversionRates.formToContacted || 0}%</strong>
              </div>
              <div>
                <span>已聯繫線索</span>
                <strong>{summary?.conversionRates.contactedLeads || 0}</strong>
              </div>
            </div>
            <div className="stats-columns">
              <div>
                <h3>事件分布</h3>
                {(sortedEvents.length ? sortedEvents : [["尚無事件", 0]]).map(([name, count]) => (
                  <div className="stat-row" key={name}>
                    <span>{name}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>熱門頁面</h3>
                {(sortedPageViews.length ? sortedPageViews : [["尚無瀏覽", 0]]).map(([path, count]) => (
                  <div className="stat-row" key={path}>
                    <span>{path}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>表單來源</h3>
                {(sortedSources.length ? sortedSources : [["尚無來源", 0]]).map(([source, count]) => (
                  <div className="stat-row" key={source}>
                    <span>{source}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>事件來源渠道</h3>
                {(sortedEventSources.length ? sortedEventSources : [["尚無來源", 0]]).map(([source, count]) => (
                  <div className="stat-row" key={source}>
                    <span>{source}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="stats-columns">
              <div>
                <h3>貸款類型線索量</h3>
                {loanLeadCounts.map(([label, count]) => (
                  <div className="stat-row" key={label}>
                    <span>{label}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>案件狀態漏斗</h3>
                {statusFunnel.map(([label, count]) => (
                  <div className="stat-row" key={label}>
                    <span>{label}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>營運待辦隊列</h3>
                {operationsQueueLabels.map(([key, label]) => (
                  <div className="stat-row" key={key}>
                    <span>{label}</span>
                    <strong>{summary?.operationsQueue?.[key] || 0}</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>通知派送狀態</h3>
                {notificationOperationsLabels.map(([key, label]) => {
                  const value = summary?.notificationOperations?.[key] || 0;
                  return (
                    <div className="stat-row" key={key}>
                      <span>{label}</span>
                      <strong>{key === "deliveryRate" ? `${value}%` : value}</strong>
                    </div>
                  );
                })}
                {user && roleCanManageLeads(user.role) ? (
                  <button className="stat-action-button" type="button" onClick={retryPendingNotifications}>
                    批量重送未成功通知
                  </button>
                ) : null}
              </div>
              <div>
                <h3>來源轉化</h3>
                {(sourceConversions.length ? sourceConversions : emptySourceConversions).map(([source, item]) => (
                  <div className="stat-row" key={source}>
                    <span>{source}</span>
                    <strong>{item.leads} / {item.contacted}｜{item.conversionRate}%</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>來源會話轉表單</h3>
                {(sourceSessionConversions.length ? sourceSessionConversions : emptySourceSessionConversions).map(([source, item]) => (
                  <div className="stat-row" key={source}>
                    <span>{source}</span>
                    <strong>{item.leadSessions} / {item.sessions}｜{item.conversionRate}%</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>頁面到表單</h3>
                {(pageConversions.length ? pageConversions : emptyPageConversions).map(([page, item]) => (
                  <div className="stat-row" key={page}>
                    <span>{page}</span>
                    <strong>{item.leads} / {item.pageViews}｜{item.conversionRate}%</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>文章諮詢貢獻</h3>
                {(articleContributions.length ? articleContributions : emptyArticleContributions).map(([path, item]) => (
                  <div className="stat-row" key={path}>
                    <span>{path}</span>
                    <strong>{item.leads} 線索 / {item.contacted} 已聯繫｜CTA {item.ctaClicks}｜表單 {item.formClicks} LINE {item.lineClicks} FB {item.fbClicks}｜{item.conversionRate}%</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>內容營運隊列</h3>
                {contentOperationsLabels.map(([key, label]) => (
                  <div className="stat-row" key={key}>
                    <span>{label}</span>
                    <strong>{summary?.contentOperations?.[key] || 0}</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>SEO 關鍵字來源</h3>
                {(seoKeywords.length ? seoKeywords : emptySeoKeywords).map(([keyword, item]) => (
                  <div className="stat-row" key={keyword}>
                    <span>{keyword}</span>
                    <strong>瀏覽 {item.views}｜表單 {item.formSubmits}｜CTA {item.ctaClicks}</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>FB / UTM 活動成效</h3>
                {(campaignConversions.length ? campaignConversions : emptyCampaignConversions).map(([campaign, item]) => (
                  <div className="stat-row" key={campaign}>
                    <span>{campaign}</span>
                    <strong>
                      {item.leads} 線索 / {item.contacted} 已聯繫｜表單 {item.formSubmits}｜CTA {item.ctaClicks}｜{item.conversionRate}%
                      {item.sourceChannels.length ? `｜${item.sourceChannels.join(", ")}` : ""}
                      {item.loanTypes.length ? `｜${item.loanTypes.map((loanType) => loanLabels[loanType as keyof typeof loanLabels] || loanType).join(", ")}` : ""}
                    </strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>文件下載排行</h3>
                {(fileDownloads.length ? fileDownloads : emptyFileDownloads).map(([fileId, item]) => (
                  <div className="stat-row" key={fileId}>
                    <span>{item.title}</span>
                    <strong>
                      總 {item.totalDownloads}｜公開 {item.publicDownloads}｜後台 {item.adminPreviewDownloads}
                      {item.sourceChannels.length ? `｜${item.sourceChannels.join(", ")}` : ""}
                    </strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>頁面 CTA 點擊排行</h3>
                {(ctaPages.length ? ctaPages : emptyCtaPages).map(([page, item]) => (
                  <div className="stat-row" key={page}>
                    <span>{page}</span>
                    <strong>總 {item.totalClicks}｜LINE {item.lineClicks}｜FB {item.fbClicks}｜表單 {item.formClicks}｜官方 {item.officialApplyClicks}</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>貸款類型 CTA 興趣</h3>
                {(ctaLoanTypes.length ? ctaLoanTypes : emptyCtaLoanTypes).map(([loanType, item]) => (
                  <div className="stat-row" key={loanType}>
                    <span>{loanLabels[loanType as keyof typeof loanLabels] || loanType}</span>
                    <strong>總 {item.totalClicks}｜首頁 {item.serviceClicks + item.entryClicks}｜表單 {item.formClicks}｜LINE {item.lineClicks}｜FB {item.fbClicks}｜線索 {item.leads} / {item.contacted}｜{item.conversionRate}%</strong>
                  </div>
                ))}
              </div>
              <div>
                <h3>貸款類型轉化率</h3>
                {(loanTypeConversions.length ? loanTypeConversions : emptyLoanTypeConversions).map(([loanType, item]) => (
                  <div className="stat-row" key={loanType}>
                    <span>{loanLabels[loanType as keyof typeof loanLabels] || loanType}</span>
                    <strong>{item.leads} 線索 / {item.contacted} 已聯繫｜{item.conversionRate}%</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="event-list">
              <h3>最新事件</h3>
              {(summary?.latestEvents || []).map((event) => (
                <div className="event-row" key={event.id}>
                  <strong>{event.eventName}</strong>
                  <span>{event.pagePath}｜{event.sourceChannel || event.metadata.sourceChannel || "unknown"}</span>
                  <small>{new Date(event.createdAt).toLocaleString("zh-TW")}</small>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {currentTab === "launch" ? (
          <div className="admin-panel">
            <h2>上線檢查</h2>
            {launchChecklist ? (
              <>
                <div className="integration-status">
                  <span>來源：{launchChecklist.origin}</span>
                  <span>產生時間：{new Date(launchChecklist.generatedAt).toLocaleString("zh-TW")}</span>
                </div>
                <div className="stats-grid">
                  <div><span>通過</span><strong>{launchChecklist.totals.pass}</strong></div>
                  <div><span>警告</span><strong>{launchChecklist.totals.warn}</strong></div>
                  <div><span>失敗</span><strong>{launchChecklist.totals.fail}</strong></div>
                </div>
                <div className="launch-check-list">
                  {launchChecklist.checks.map((item) => (
                    <div className={`launch-check ${item.status}`} key={item.id}>
                      <strong>{item.label}</strong>
                      <span>{item.status === "pass" ? "通過" : item.status === "warn" ? "提醒" : "失敗"}</span>
                      <small>{item.detail}</small>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p>尚未取得上線檢查結果，請重新整理後台。</p>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
