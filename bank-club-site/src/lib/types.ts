export type LoanType = "credit" | "house" | "business" | "unknown";

export type IdentityType =
  | "employee"
  | "self_employed"
  | "business_owner"
  | "home_owner"
  | "other";

export type LeadStatus =
  | "new"
  | "assigned"
  | "contacted"
  | "appointment_scheduled"
  | "pre_reviewed"
  | "pending_documents"
  | "documents_received"
  | "incomplete_documents"
  | "proposal_suggested"
  | "submitted_to_bank"
  | "bank_reviewing"
  | "approved"
  | "funded"
  | "rejected"
  | "customer_gave_up"
  | "follow_up_later"
  | "invalid"
  | "closed";

export type UserRole = "super_admin" | "specialist" | "content" | "readonly";
export type LeadPriority = "normal" | "needs_review" | "high";
export type LeadNotificationStatus = "not_configured" | "sent" | "failed";
export type ApplicationStatus = "draft" | "submitted" | "pre_review" | "pending_documents" | "submitted_to_bank" | "approved" | "rejected" | "closed";
export type LineDocumentStatus = "not_reminded" | "reminded" | "line_received" | "pending_documents" | "confirmed";
export type CreditIdUploadStatus = "not_uploaded" | "uploaded" | "missing_front" | "missing_back" | "pending_reupload" | "confirmed";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  lineId: string;
  identityType: IdentityType;
  loanType: LoanType;
  desiredAmount: number | null;
  appointmentTime: string;
  purpose: string;
  propertyRegion: string;
  propertyType: string;
  estimatedPropertyValue: number | null;
  existingMortgage: string;
  companyName: string;
  businessRegistrationType: string;
  monthlyRevenue: number | null;
  note: string;
  sourcePage: string;
  sourceChannel: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  sessionId: string;
  status: LeadStatus;
  assignedTo: string;
  leadPriority: LeadPriority;
  nextFollowUpAt: string;
  lastFollowUpAt: string;
  documentStatus: "not_requested" | "pending" | "received" | "incomplete" | "confirmed";
  duplicateOf: string;
  hasJoinedFb: boolean;
  hasClickedLine: boolean;
  doNotContact: boolean;
  deletionRequested: boolean;
  privacyRequestNote: string;
  notificationStatus: LeadNotificationStatus;
  notificationError: string;
  notifiedAt: string;
  notificationAttempts: number;
  consentAt: string;
  consentVersion: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadNote = {
  id: string;
  leadId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type LeadAssignment = {
  id: string;
  leadId: string;
  fromUserId: string;
  toUserId: string;
  actorId: string;
  reason: "lead_created" | "manual_assignment" | "assignee_deleted";
  createdAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  lineId: string;
  passwordHash: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
  twoFactorConfirmedAt: string;
  createdAt: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  coverImageAlt: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  fbSummary: string;
  fbPostStatus: "not_started" | "copied" | "posted";
  fbPostUrl: string;
  fbPostedAt: string;
  fbPostNote: string;
  ctaType: "line" | "form" | "fb";
  status: "draft" | "published";
  complianceChecked: boolean;
  complianceFlags: ArticleComplianceFlags;
  complianceNotes: string;
  totalAnnualPercentageRate: string;
  annualPercentageRateDescription: string;
  feeDisclosureNote: string;
  complianceReviewedAt: string;
  complianceReviewedBy: string;
  publishedAt: string;
  publishedBy: string;
  lastModifiedBy: string;
  revisionHistory: ArticleRevision[];
  updatedAt: string;
  createdAt: string;
};

export type ArticleCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type ArticleComplianceFlags = {
  mentionsAmountOrTerm: boolean;
  mentionsRateOrFee: boolean;
  mentionsBinding: boolean;
  mentionsBankName: boolean;
  containsGuaranteeLanguage: boolean;
  mentionsLoanPurpose: boolean;
};

export type ArticleRevision = {
  id: string;
  actorId: string;
  action: "created" | "updated" | "published" | "unpublished" | "compliance_reviewed" | "fb_post_updated";
  summary: string;
  createdAt: string;
};

export type FileResource = {
  id: string;
  title: string;
  type: "credit_docs" | "house_docs" | "business_docs" | "flow" | "qa_card" | "fb_material";
  visibility: "public" | "admin_only";
  description: string;
  content: string;
  sourceFilename: string;
  sourceFileMime: string;
  sourceFileSize: number;
  sourceUploadedAt: string;
  version: number;
  fileVersionHistory: FileVersion[];
  downloads: number;
  updatedAt: string;
  createdAt: string;
};

export type FileVersion = {
  id: string;
  version: number;
  content: string;
  sourceFilename: string;
  sourceFileMime: string;
  sourceFileSize: number;
  createdAt: string;
  createdBy: string;
};

export type SiteEvent = {
  id: string;
  eventName: string;
  pagePath: string;
  leadId: string;
  sessionId: string;
  sourceChannel: string;
  metadata: Record<string, string>;
  createdAt: string;
};

export type CreditApplication = {
  id: string;
  applicationNo: string;
  leadId: string;
  name: string;
  phone: string;
  lineId: string;
  identityType: IdentityType;
  loanType: "credit";
  requestedAmount: number | null;
  requestedTermYears: number | null;
  fundPurpose: string;
  caseSource: string;
  programType: string;
  idFrontFileId: string;
  idBackFileId: string;
  idUploadStatus: CreditIdUploadStatus;
  financialLineStatus: LineDocumentStatus;
  consentPersonalDataAt: string;
  status: ApplicationStatus;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
};

export type CreditApplicationFile = {
  id: string;
  applicationId: string;
  fileType: "id_front" | "id_back";
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  uploadStatus: "uploaded" | "validation_failed" | "pending_reupload" | "deleted";
  reviewedBy: string;
  reviewedAt: string;
  deletedAt: string;
  createdAt: string;
};

export type HouseLoanApplication = {
  id: string;
  applicationNo: string;
  leadId: string;
  name: string;
  phone: string;
  lineId: string;
  houseLoanType: string;
  propertyCity: string;
  propertyArea: string;
  propertyType: string;
  propertyUsage: string;
  ownershipStatus: string;
  estimatedValue: number | null;
  hasExistingMortgage: boolean;
  currentBank: string;
  remainingBalance: number | null;
  requestedAmount: number | null;
  requestedTermYears: number | null;
  gracePeriodNeeded: boolean;
  fundPurpose: string;
  documentLineStatus: LineDocumentStatus;
  status: ApplicationStatus;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessLoanApplication = {
  id: string;
  applicationNo: string;
  leadId: string;
  ownerName: string;
  phone: string;
  lineId: string;
  businessLoanType: string;
  businessName: string;
  registrationNo: string;
  businessType: string;
  industry: string;
  operatingYears: number | null;
  employeeCount: number | null;
  businessLocation: string;
  annualRevenueRange: string;
  monthlyRevenueRange: string;
  requestedAmount: number | null;
  requestedTermYears: number | null;
  fundPurpose: string;
  hasCollateral: boolean;
  hasExistingBusinessLoan: boolean;
  documentLineStatus: LineDocumentStatus;
  status: ApplicationStatus;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
};

export type SiteSettings = {
  brandName: string;
  companyName: string;
  officeName: string;
  specialistName: string;
  specialistTitle: string;
  address: string;
  phone: string;
  fax: string;
  mobile: string;
  email: string;
  fbGroupUrl: string;
  lineUrl: string;
  lineQrCodeUrl: string;
  officialApplyUrl: string;
  gaMeasurementId: string;
  googleSearchConsoleVerification: string;
  launchReadiness: LaunchReadiness;
};

export type LaunchReadiness = {
  domainHttpsConfirmed: boolean;
  lineEntryConfirmed: boolean;
  fbGroupConfirmed: boolean;
  officialApplyConfirmed: boolean;
  brandAuthorizationConfirmed: boolean;
  ga4Confirmed: boolean;
  searchConsoleConfirmed: boolean;
  notificationWebhookConfirmed: boolean;
  backupDrillConfirmed: boolean;
  pageSpeedConfirmed: boolean;
  legalReviewConfirmed: boolean;
  notes: string;
  updatedAt: string;
  updatedBy: string;
};

export type BankClubDB = {
  users: AdminUser[];
  leads: Lead[];
  creditApplications: CreditApplication[];
  creditApplicationFiles: CreditApplicationFile[];
  houseLoanApplications: HouseLoanApplication[];
  businessLoanApplications: BusinessLoanApplication[];
  leadNotes: LeadNote[];
  leadAssignments: LeadAssignment[];
  articleCategories: ArticleCategory[];
  articles: Article[];
  deletedArticleIds: string[];
  files: FileResource[];
  deletedFileIds: string[];
  events: SiteEvent[];
  auditLogs: AuditLog[];
  settings: SiteSettings;
};
