import { NextResponse } from "next/server";
import { canViewLead, requireAdmin } from "@/lib/auth";
import { readDB } from "@/lib/store";
import type { Lead, LeadStatus, SiteEvent } from "@/lib/types";

const contactedStatuses = new Set<LeadStatus>([
  "contacted",
  "appointment_scheduled",
  "pre_reviewed",
  "pending_documents",
  "documents_received",
  "incomplete_documents",
  "proposal_suggested",
  "submitted_to_bank",
  "bank_reviewing",
  "approved",
  "funded",
  "rejected",
  "customer_gave_up",
  "follow_up_later",
  "invalid",
  "closed",
]);
const inactiveStatuses = new Set<LeadStatus>(["funded", "rejected", "customer_gave_up", "invalid", "closed"]);

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function keywordFromEvent(event: { metadata?: Record<string, string> }) {
  return event.metadata?.seoKeyword || event.metadata?.utmTerm || event.metadata?.keyword || "";
}

function campaignFromLead(lead: { utmCampaign?: string; utmContent?: string; utmTerm?: string; sourceChannel?: string }) {
  return lead.utmCampaign || lead.utmContent || lead.utmTerm || (lead.sourceChannel === "facebook" ? "facebook-unspecified" : "");
}

function campaignFromEvent(event: { metadata?: Record<string, string>; sourceChannel?: string }) {
  return event.metadata?.utmCampaign || event.metadata?.utmContent || event.metadata?.utmTerm || (event.sourceChannel === "facebook" ? "facebook-unspecified" : "");
}

function addSetValue(map: Record<string, Set<string>>, key: string, value: string) {
  if (!value) return;
  map[key] ||= new Set<string>();
  map[key].add(value);
}

type FileDownloadStats = {
  fileId: string;
  title: string;
  type: string;
  visibility: string;
  totalDownloads: number;
  publicDownloads: number;
  adminPreviewDownloads: number;
  sourceChannels: string[];
  sourcePages: string[];
  lastDownloadedAt: string;
};

const safeEventMetadataKeys = new Set([
  "destination",
  "fileId",
  "format",
  "highRiskPurpose",
  "keyword",
  "linkType",
  "loanType",
  "materialSlug",
  "sourceChannel",
  "sourceDetail",
  "sourcePage",
  "sourceSection",
  "title",
  "utmCampaign",
  "utmContent",
  "utmMedium",
  "utmSource",
  "utmTerm",
  "version",
]);

function maskPhone(phone: string) {
  if (!phone) return "";
  if (phone.includes("*")) return phone;
  if (phone.length < 6) return "已遮罩";
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

function maskLineId(lineId: string) {
  if (!lineId) return "";
  if (lineId.includes("*")) return lineId;
  if (lineId.length < 4) return "已遮罩";
  return `${lineId.slice(0, 2)}***${lineId.slice(-1)}`;
}

function summaryLead(lead: Lead) {
  return {
    id: lead.id,
    name: lead.name,
    gender: lead.gender,
    city: lead.city,
    phone: maskPhone(lead.phone),
    lineId: maskLineId(lead.lineId),
    identityType: lead.identityType,
    loanType: lead.loanType,
    sourcePage: lead.sourcePage,
    sourceChannel: lead.sourceChannel,
    status: lead.status,
    assignedTo: lead.assignedTo,
    leadPriority: lead.leadPriority,
    nextFollowUpAt: lead.nextFollowUpAt,
    documentStatus: lead.documentStatus,
    duplicateOf: lead.duplicateOf,
    hasJoinedFb: lead.hasJoinedFb,
    hasClickedLine: lead.hasClickedLine,
    doNotContact: lead.doNotContact,
    deletionRequested: lead.deletionRequested,
    notificationStatus: lead.notificationStatus,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

function latestLeadsForSummary(user: Awaited<ReturnType<typeof requireAdmin>>, leads: Lead[]) {
  if (!user || (user.role !== "super_admin" && user.role !== "specialist")) return [];
  return leads
    .filter((lead) => canViewLead(user, lead))
    .slice(0, 6)
    .map(summaryLead);
}

function summaryEvent(event: SiteEvent) {
  return {
    id: event.id,
    eventName: event.eventName,
    pagePath: event.pagePath,
    leadId: "",
    sessionId: "",
    sourceChannel: event.sourceChannel,
    metadata: Object.fromEntries(
      Object.entries(event.metadata || {}).filter(([key]) => safeEventMetadataKeys.has(key)),
    ),
    createdAt: event.createdAt,
  };
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const db = await readDB();
  const leadsByLoan = db.leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.loanType] = (acc[lead.loanType] || 0) + 1;
    return acc;
  }, {});
  const leadsByStatus = db.leads.reduce<Record<LeadStatus, number>>((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<LeadStatus, number>);
  const eventsByName = db.events.reduce<Record<string, number>>((acc, event) => {
    acc[event.eventName] = (acc[event.eventName] || 0) + 1;
    return acc;
  }, {});
  const pageViewsByPath = db.events
    .filter((event) => event.eventName === "page_view")
    .reduce<Record<string, number>>((acc, event) => {
      acc[event.pagePath] = (acc[event.pagePath] || 0) + 1;
      return acc;
    }, {});
  const sourceChannelsByEvent = db.events.reduce<Record<string, number>>((acc, event) => {
    const source = event.sourceChannel || event.metadata?.sourceChannel || "unknown";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
  const formSubmitsBySource = db.leads.reduce<Record<string, number>>((acc, lead) => {
    const source = lead.sourceChannel || lead.sourcePage || "unknown";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
  const allSessions = new Set<string>();
  const sessionSetsBySource: Record<string, Set<string>> = {};
  const leadSessionSetsBySource: Record<string, Set<string>> = {};
  for (const event of db.events) {
    if (!event.sessionId) continue;
    allSessions.add(event.sessionId);
    const source = event.sourceChannel || event.metadata?.sourceChannel || "unknown";
    addSetValue(sessionSetsBySource, source, event.sessionId);
  }
  for (const lead of db.leads) {
    if (!lead.sessionId) continue;
    allSessions.add(lead.sessionId);
    const source = lead.sourceChannel || lead.sourcePage || "unknown";
    addSetValue(sessionSetsBySource, source, lead.sessionId);
    addSetValue(leadSessionSetsBySource, source, lead.sessionId);
  }
  const sourceSessionConversions = Object.fromEntries(
    Array.from(new Set([...Object.keys(sessionSetsBySource), ...Object.keys(leadSessionSetsBySource)])).map((source) => {
      const sessions = sessionSetsBySource[source]?.size || 0;
      const leadSessions = leadSessionSetsBySource[source]?.size || 0;
      return [source, { sessions, leadSessions, conversionRate: percent(leadSessions, sessions) }];
    }),
  );
  const seoKeywords = db.events.reduce<Record<string, { views: number; formSubmits: number; ctaClicks: number }>>((acc, event) => {
    const keyword = keywordFromEvent(event).trim();
    if (!keyword) return acc;
    acc[keyword] ||= { views: 0, formSubmits: 0, ctaClicks: 0 };
    if (event.eventName === "page_view") acc[keyword].views += 1;
    if (event.eventName === "form_submit") acc[keyword].formSubmits += 1;
    if (event.eventName.includes("click")) acc[keyword].ctaClicks += 1;
    return acc;
  }, {});
  const leadsBySource = db.leads.reduce<Record<string, { leads: number; contacted: number; conversionRate: number }>>((acc, lead) => {
    const source = lead.sourceChannel || "unknown";
    acc[source] ||= { leads: 0, contacted: 0, conversionRate: 0 };
    acc[source].leads += 1;
    if (contactedStatuses.has(lead.status)) acc[source].contacted += 1;
    return acc;
  }, {});
  for (const item of Object.values(leadsBySource)) {
    item.conversionRate = percent(item.contacted, item.leads);
  }
  const leadsByPage = db.leads.reduce<Record<string, { leads: number; pageViews: number; conversionRate: number }>>((acc, lead) => {
    const page = lead.sourcePage || "unknown";
    acc[page] ||= { leads: 0, pageViews: 0, conversionRate: 0 };
    acc[page].leads += 1;
    return acc;
  }, {});
  for (const [page, item] of Object.entries(leadsByPage)) {
    item.pageViews = pageViewsByPath[page] || 0;
    item.conversionRate = percent(item.leads, item.pageViews);
  }
  const articleContributions = db.events
    .filter((event) => event.pagePath.startsWith("/blog/") && ["blog_form_click", "blog_line_click", "blog_fb_click"].includes(event.eventName))
    .reduce<Record<string, { ctaClicks: number; formClicks: number; lineClicks: number; fbClicks: number; leads: number; contacted: number; conversionRate: number }>>((acc, event) => {
      acc[event.pagePath] ||= { ctaClicks: 0, formClicks: 0, lineClicks: 0, fbClicks: 0, leads: 0, contacted: 0, conversionRate: 0 };
      acc[event.pagePath].ctaClicks += 1;
      if (event.eventName === "blog_form_click") acc[event.pagePath].formClicks += 1;
      if (event.eventName === "blog_line_click") acc[event.pagePath].lineClicks += 1;
      if (event.eventName === "blog_fb_click") acc[event.pagePath].fbClicks += 1;
      return acc;
    }, {});
  for (const lead of db.leads.filter((item) => item.sourcePage.startsWith("/blog/"))) {
    articleContributions[lead.sourcePage] ||= { ctaClicks: 0, formClicks: 0, lineClicks: 0, fbClicks: 0, leads: 0, contacted: 0, conversionRate: 0 };
    articleContributions[lead.sourcePage].leads += 1;
    if (contactedStatuses.has(lead.status)) articleContributions[lead.sourcePage].contacted += 1;
  }
  for (const item of Object.values(articleContributions)) {
    item.conversionRate = percent(item.contacted, item.leads);
  }
  const campaignAccumulator: Record<string, { leads: number; contacted: number; formSubmits: number; ctaClicks: number; conversionRate: number; sourceChannels: Set<string>; loanTypes: Set<string> }> = {};
  for (const lead of db.leads) {
    const campaign = campaignFromLead(lead).trim();
    if (!campaign) continue;
    campaignAccumulator[campaign] ||= { leads: 0, contacted: 0, formSubmits: 0, ctaClicks: 0, conversionRate: 0, sourceChannels: new Set(), loanTypes: new Set() };
    campaignAccumulator[campaign].leads += 1;
    if (contactedStatuses.has(lead.status)) campaignAccumulator[campaign].contacted += 1;
    campaignAccumulator[campaign].sourceChannels.add(lead.sourceChannel || "unknown");
    campaignAccumulator[campaign].loanTypes.add(lead.loanType || "unknown");
  }
  for (const event of db.events) {
    const campaign = campaignFromEvent(event).trim();
    if (!campaign) continue;
    campaignAccumulator[campaign] ||= { leads: 0, contacted: 0, formSubmits: 0, ctaClicks: 0, conversionRate: 0, sourceChannels: new Set(), loanTypes: new Set() };
    if (event.eventName === "form_submit") campaignAccumulator[campaign].formSubmits += 1;
    if (event.eventName.includes("click")) campaignAccumulator[campaign].ctaClicks += 1;
    campaignAccumulator[campaign].sourceChannels.add(event.sourceChannel || event.metadata?.sourceChannel || "unknown");
    if (event.metadata?.loanType) campaignAccumulator[campaign].loanTypes.add(event.metadata.loanType);
  }
  const campaignConversions = Object.fromEntries(
    Object.entries(campaignAccumulator).map(([campaign, item]) => [
      campaign,
      {
        leads: item.leads,
        contacted: item.contacted,
        formSubmits: item.formSubmits,
        ctaClicks: item.ctaClicks,
        conversionRate: percent(item.contacted, item.leads),
        sourceChannels: Array.from(item.sourceChannels),
        loanTypes: Array.from(item.loanTypes),
      },
    ]),
  );
  const fileLookup = new Map(db.files.map((file) => [file.id, file]));
  const fileDownloadAccumulator: Record<string, Omit<FileDownloadStats, "sourceChannels" | "sourcePages"> & { sourceChannels: Set<string>; sourcePages: Set<string> }> = {};
  for (const event of db.events.filter((item) => item.eventName === "file_download")) {
    const fileId = event.metadata?.fileId || "unknown";
    const file = fileLookup.get(fileId);
    fileDownloadAccumulator[fileId] ||= {
      fileId,
      title: file?.title || event.metadata?.title || fileId,
      type: file?.type || "unknown",
      visibility: file?.visibility || "deleted_or_unknown",
      totalDownloads: 0,
      publicDownloads: 0,
      adminPreviewDownloads: 0,
      sourceChannels: new Set<string>(),
      sourcePages: new Set<string>(),
      lastDownloadedAt: "",
    };
    const item = fileDownloadAccumulator[fileId];
    item.totalDownloads += 1;
    if (event.pagePath === "/admin-preview") {
      item.adminPreviewDownloads += 1;
    } else {
      item.publicDownloads += 1;
    }
    item.sourceChannels.add(event.sourceChannel || event.metadata?.sourceChannel || "unknown");
    item.sourcePages.add(event.pagePath || "unknown");
    if (!item.lastDownloadedAt || event.createdAt > item.lastDownloadedAt) item.lastDownloadedAt = event.createdAt;
  }
  const fileDownloads = Object.fromEntries(
    Object.entries(fileDownloadAccumulator).map(([fileId, item]) => [
      fileId,
      {
        ...item,
        sourceChannels: Array.from(item.sourceChannels).sort(),
        sourcePages: Array.from(item.sourcePages).sort(),
      },
    ]),
  );
  const contentOperations = db.articles.reduce(
    (acc, article) => {
      if (article.status === "published") acc.publishedArticles += 1;
      if (article.status === "draft") acc.draftArticles += 1;
      if (!article.complianceChecked) acc.pendingCompliance += 1;
      if (article.status === "published" && article.fbPostStatus !== "posted") acc.publishedMissingFbPost += 1;
      if (article.fbPostStatus === "not_started") acc.fbNotStarted += 1;
      if (article.fbPostStatus === "copied") acc.fbCopied += 1;
      if (article.fbPostStatus === "posted") acc.fbPosted += 1;
      return acc;
    },
    {
      publishedArticles: 0,
      draftArticles: 0,
      pendingCompliance: 0,
      publishedMissingFbPost: 0,
      fbNotStarted: 0,
      fbCopied: 0,
      fbPosted: 0,
    },
  );
  const ctaClicksByPage = db.events
    .filter((event) => event.eventName.includes("click"))
    .reduce<Record<string, { totalClicks: number; lineClicks: number; fbClicks: number; formClicks: number; officialApplyClicks: number }>>((acc, event) => {
      const page = event.pagePath || "unknown";
      acc[page] ||= { totalClicks: 0, lineClicks: 0, fbClicks: 0, formClicks: 0, officialApplyClicks: 0 };
      acc[page].totalClicks += 1;
      if (event.eventName.includes("line")) {
        acc[page].lineClicks += 1;
      } else if (event.eventName.includes("fb")) {
        acc[page].fbClicks += 1;
      }
      if (event.eventName.includes("form")) acc[page].formClicks += 1;
      if (event.eventName.includes("official_apply")) acc[page].officialApplyClicks += 1;
      return acc;
    }, {});
  const ctaClicksByLoanType = db.events
    .filter((event) => event.eventName.includes("click") && event.metadata?.loanType)
    .reduce<Record<string, { totalClicks: number; serviceClicks: number; entryClicks: number; formClicks: number; lineClicks: number; fbClicks: number; leads: number; contacted: number; conversionRate: number }>>((acc, event) => {
      const loanType = event.metadata.loanType;
      acc[loanType] ||= { totalClicks: 0, serviceClicks: 0, entryClicks: 0, formClicks: 0, lineClicks: 0, fbClicks: 0, leads: 0, contacted: 0, conversionRate: 0 };
      acc[loanType].totalClicks += 1;
      if (event.eventName.includes("service")) acc[loanType].serviceClicks += 1;
      if (event.eventName.includes("entry")) acc[loanType].entryClicks += 1;
      if (event.eventName.includes("form")) acc[loanType].formClicks += 1;
      if (event.eventName.includes("line")) acc[loanType].lineClicks += 1;
      if (event.eventName.includes("fb")) acc[loanType].fbClicks += 1;
      return acc;
    }, {});
  const loanTypeConversions = db.leads.reduce<Record<string, { leads: number; contacted: number; conversionRate: number }>>((acc, lead) => {
    acc[lead.loanType] ||= { leads: 0, contacted: 0, conversionRate: 0 };
    acc[lead.loanType].leads += 1;
    if (contactedStatuses.has(lead.status)) acc[lead.loanType].contacted += 1;
    return acc;
  }, {});
  for (const item of Object.values(loanTypeConversions)) {
    item.conversionRate = percent(item.contacted, item.leads);
  }
  for (const [loanType, item] of Object.entries(loanTypeConversions)) {
    ctaClicksByLoanType[loanType] ||= { totalClicks: 0, serviceClicks: 0, entryClicks: 0, formClicks: 0, lineClicks: 0, fbClicks: 0, leads: 0, contacted: 0, conversionRate: 0 };
    ctaClicksByLoanType[loanType].leads = item.leads;
    ctaClicksByLoanType[loanType].contacted = item.contacted;
    ctaClicksByLoanType[loanType].conversionRate = item.conversionRate;
  }
  const now = Date.now();
  const operationsQueue = db.leads.reduce(
    (acc, lead) => {
      const hasPrivacyRequest = lead.doNotContact || lead.deletionRequested;
      const isActionable = !inactiveStatuses.has(lead.status) && !hasPrivacyRequest;
      const nextFollowUpTime = lead.nextFollowUpAt ? Date.parse(lead.nextFollowUpAt) : Number.NaN;
      if (isActionable && Number.isFinite(nextFollowUpTime) && nextFollowUpTime <= now) acc.dueFollowUps += 1;
      if (isActionable && Number.isFinite(nextFollowUpTime) && nextFollowUpTime > now) acc.upcomingFollowUps += 1;
      if (isActionable && !Number.isFinite(nextFollowUpTime)) acc.missingFollowUpPlan += 1;
      if (["pending", "incomplete"].includes(lead.documentStatus) || ["pending_documents", "incomplete_documents"].includes(lead.status)) {
        acc.pendingDocuments += 1;
      }
      if (["received", "confirmed"].includes(lead.documentStatus) || lead.status === "documents_received") acc.documentsReceived += 1;
      if (lead.leadPriority === "needs_review") acc.needsManualReview += 1;
      if (lead.leadPriority === "high") acc.highPriority += 1;
      if (hasPrivacyRequest) acc.privacyRequests += 1;
      if (lead.hasClickedLine) acc.lineClicked += 1;
      if (lead.hasJoinedFb) acc.fbJoined += 1;
      return acc;
    },
    {
      dueFollowUps: 0,
      upcomingFollowUps: 0,
      missingFollowUpPlan: 0,
      pendingDocuments: 0,
      documentsReceived: 0,
      needsManualReview: 0,
      highPriority: 0,
      privacyRequests: 0,
      lineClicked: 0,
      fbJoined: 0,
    },
  );
  const notificationOperations = db.leads.reduce(
    (acc, lead) => {
      if (lead.notificationStatus === "sent") acc.sent += 1;
      if (lead.notificationStatus === "failed") acc.failed += 1;
      if (lead.notificationStatus === "not_configured") acc.notConfigured += 1;
      if (lead.notificationStatus !== "sent") acc.unsent += 1;
      if (lead.notificationStatus === "failed" || lead.notificationStatus === "not_configured") acc.needsAttention += 1;
      acc.totalAttempts += lead.notificationAttempts || 0;
      return acc;
    },
    {
      sent: 0,
      failed: 0,
      notConfigured: 0,
      unsent: 0,
      needsAttention: 0,
      totalAttempts: 0,
      deliveryRate: 0,
    },
  );
  notificationOperations.deliveryRate = percent(notificationOperations.sent, db.leads.length);
  const contactedLeads = db.leads.filter((lead) => contactedStatuses.has(lead.status)).length;
  const pageViews = eventsByName.page_view || 0;
  const formSubmits = eventsByName.form_submit || db.leads.length;
  return NextResponse.json({
    totalLeads: db.leads.length,
    newLeads: db.leads.filter((lead) => lead.status === "new").length,
    articles: db.articles.length,
    files: db.files.length,
    totalSessions: allSessions.size,
    leadsByLoan,
    leadsByStatus,
    eventsByName,
    pageViewsByPath,
    sourceChannelsByEvent,
    formSubmitsBySource,
    sourceSessionConversions,
    seoKeywords,
    leadsBySource,
    leadsByPage,
    articleContributions,
    campaignConversions,
    fileDownloads,
    contentOperations,
    ctaClicksByPage,
    ctaClicksByLoanType,
    loanTypeConversions,
    operationsQueue,
    notificationOperations,
    conversionRates: {
      pageToForm: percent(formSubmits, pageViews),
      formToContacted: percent(contactedLeads, formSubmits),
      contactedLeads,
    },
    latestEvents: db.events.slice(0, 12).map(summaryEvent),
    latestLeads: latestLeadsForSummary(user, db.leads),
  });
}
