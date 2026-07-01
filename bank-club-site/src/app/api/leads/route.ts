import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { sendLeadNotification } from "@/lib/lead-notifications";
import { detectSensitiveLeadNote } from "@/lib/sensitive-content";
import { createAudit, mutateDB } from "@/lib/store";
import type { BusinessLoanApplication, CreditApplication, CreditApplicationFile, HouseLoanApplication, IdentityType, Lead, LoanType } from "@/lib/types";

const recentSubmits = new Map<string, number[]>();
const recentAttempts = new Map<string, number[]>();
const rateLimitWindowMs = 60 * 60 * 1000;
const rateLimitMax = 3;
const attemptLimitMax = 20;
const creditUploadDir = path.join(process.cwd(), ".data", "credit-application-files");
const allowedCreditFileTypes = new Set(["image/jpeg", "image/png", "image/heic", "image/heif"]);
const maxCreditFileBytes = 8 * 1024 * 1024;
const loanTypes = new Set<LoanType>(["credit", "house", "business", "unknown"]);
const identityTypes = new Set<IdentityType>(["employee", "self_employed", "business_owner", "home_owner", "other"]);

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function optionalNumber(value: string) {
  const number = Number(value.replaceAll(",", ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function optionalInteger(value: string) {
  const number = optionalNumber(value);
  return number === null ? null : Math.round(number);
}

function optionalDecimal(value: string) {
  const number = Number(value.replaceAll(",", ""));
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function optionalBoolean(value: string) {
  return value === "yes" || value === "true" || value === "on";
}

function applicationNo(prefix: "CR" | "HO" | "BU") {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(2, 14);
  return `${prefix}${stamp}${randomUUID().slice(0, 6).toUpperCase()}`;
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeTaiwanMobile(value: string) {
  const digits = phoneDigits(value);
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
}

function normalizePhoneNumber(value: string, countryCode: string) {
  const digits = phoneDigits(value);
  const normalizedCountryCode = countryCode.trim() || "+886";
  if (normalizedCountryCode === "+886") {
    if (!/^09\d{8}$/.test(digits)) {
      throw new Error("請填寫可聯繫的台灣手機號碼");
    }
    return normalizeTaiwanMobile(value);
  }
  if (!/^\+\d{1,4}$/.test(normalizedCountryCode) || digits.length < 6 || digits.length > 15) {
    throw new Error("請填寫可聯繫的手機號碼，並確認國家或地區代碼正確");
  }
  return `${normalizedCountryCode} ${digits}`;
}

function normalizePurpose(value: string) {
  const purpose = value.trim();
  const normalized = purpose.toLowerCase();
  const highRiskPurposePattern = /投資|投资|理財|理财|股票|股市|期貨|期货|crypto|bitcoin|虛擬貨幣|虚拟货币|investment|stock|trading/i;
  const purposeAliases: Record<string, string> = {
    daily: "living",
    living: "living",
    renovation: "renovation",
    business: "business",
    unsure: "unsure",
    high_risk: "high_risk",
  };

  if (!purpose) return "unsure";
  if (purposeAliases[normalized]) return purposeAliases[normalized];
  if (highRiskPurposePattern.test(purpose)) return "high_risk";
  return "unsure";
}

function rawPurposeLabel(value: string) {
  const labels: Record<string, string> = {
    daily: "生活消費",
    living: "生活消費",
    renovation: "房屋修繕",
    business: "合法營運週轉",
    unsure: "不確定，先諮詢專員",
    high_risk: "投資理財或高風險用途",
  };
  return labels[value] || value || "不確定，先諮詢專員";
}

function missingFieldsResponse(fields: string[]) {
  return NextResponse.json({ message: `請完整填寫：${fields.join("、")}` }, { status: 400 });
}

function validateCreditFile(file: FormDataEntryValue | null, label: string): file is File {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error(`請上傳${label}`);
  }
  if (file.size > maxCreditFileBytes) {
    throw new Error(`${label}檔案需小於 8MB`);
  }
  if (!allowedCreditFileTypes.has(file.type)) {
    throw new Error(`${label}僅支援 JPG、PNG、HEIC 圖片`);
  }
  return true;
}

async function storeCreditFile(file: File, applicationId: string, fileType: "id_front" | "id_back", createdAt: string): Promise<CreditApplicationFile> {
  await mkdir(creditUploadDir, { recursive: true });
  const id = randomUUID();
  const bytes = Buffer.from(await file.arrayBuffer());
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const extension = file.type === "image/png" ? "png" : file.type === "image/heic" ? "heic" : file.type === "image/heif" ? "heif" : "jpg";
  const storageKey = `${applicationId}/${fileType}-${id}.${extension}`;
  await mkdir(path.join(creditUploadDir, applicationId), { recursive: true });
  await writeFile(path.join(creditUploadDir, storageKey), bytes);
  return {
    id,
    applicationId,
    fileType,
    originalName: file.name || `${fileType}.${extension}`,
    storageKey,
    mimeType: file.type,
    sizeBytes: file.size,
    checksum,
    uploadStatus: "uploaded",
    reviewedBy: "",
    reviewedAt: "",
    deletedAt: "",
    createdAt,
  };
}

export async function POST(request: Request) {
  const form = await request.formData();
  const ip = getClientIp(request);
  const now = Date.now();
  const previousAttempts = (recentAttempts.get(ip) || []).filter((time) => now - time < rateLimitWindowMs);
  if (previousAttempts.length >= attemptLimitMax) {
    return NextResponse.json({ message: "送出嘗試次數過多，請稍後再試或改用 LINE 聯繫專員" }, { status: 429 });
  }
  recentAttempts.set(ip, [...previousAttempts, now]);

  const previousSubmits = (recentSubmits.get(ip) || []).filter((time) => now - time < rateLimitWindowMs);
  const previous = previousSubmits.at(-1);
  if (previous && now - previous < 10_000) {
    return NextResponse.json({ message: "送出太頻繁，請稍後再試" }, { status: 429 });
  }
  if (previousSubmits.length >= rateLimitMax) {
    return NextResponse.json({ message: "今日短時間送出次數過多，請稍後再試或改用 LINE 聯繫專員" }, { status: 429 });
  }
  if (text(form.get("website"))) {
    return NextResponse.json({ message: "送出失敗，請重新整理後再試" }, { status: 400 });
  }

  const name = text(form.get("name"));
  const phoneInput = text(form.get("phone"));
  const phoneCountryCode = text(form.get("phoneCountryCode")) || "+886";
  let phone = "";
  try {
    phone = normalizePhoneNumber(phoneInput, phoneCountryCode);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "請填寫可聯繫的手機號碼" }, { status: 400 });
  }
  const lineId = text(form.get("lineId"));
  const identityType = text(form.get("identityType")) as IdentityType;
  const loanType = text(form.get("loanType")) as LoanType;
  const normalizedIdentityType = loanType === "business" ? "business_owner" : identityType;
  const appointmentTime = text(form.get("appointmentTime"));
  const rawPurpose = text(form.get("purpose"));
  const purpose = normalizePurpose(rawPurpose);
  const note = text(form.get("note"));
  const consent = text(form.get("consent"));

  if (!name || !phoneInput || !identityType || !loanType || !appointmentTime || consent !== "on") {
    return NextResponse.json({ message: "請完整填寫必填欄位並勾選個資告知同意" }, { status: 400 });
  }
  if (!loanTypes.has(loanType) || !identityTypes.has(identityType)) {
    return NextResponse.json({ message: "請選擇有效的身份類型與貸款類型" }, { status: 400 });
  }
  if (loanType !== "unknown" && !lineId) {
    return missingFieldsResponse(["LINE ID"]);
  }
  const sensitiveNote = detectSensitiveLeadNote(note);
  if (sensitiveNote.blocked) {
    return NextResponse.json({
      message: `表單備註請只描述需求摘要，不要貼上身分證、銀行帳號或完整敏感文件內容。偵測到：${sensitiveNote.reasons.join("、")}。`,
    }, { status: 400 });
  }

  if (loanType === "credit") {
    const missing = [
      !optionalInteger(text(form.get("requestedAmount"))) ? "信貸申請金額" : "",
      !optionalInteger(text(form.get("requestedTermYears"))) ? "信貸申請年限" : "",
      !text(form.get("caseSource")) ? "案件來源" : "",
      !text(form.get("programType")) ? "適用方案" : "",
    ].filter(Boolean);
    if (missing.length) return missingFieldsResponse(missing);
  }
  if (loanType === "house") {
    const existingMortgage = text(form.get("existingMortgage"));
    const hasExistingMortgage = existingMortgage === "has_mortgage" || existingMortgage === "second_mortgage";
    const missing = [
      !text(form.get("houseLoanType")) ? "房貸類型" : "",
      !text(form.get("propertyCity")) ? "房屋縣市" : "",
      !text(form.get("propertyArea")) ? "房屋區域" : "",
      !text(form.get("propertyType")) ? "房屋類型" : "",
      !existingMortgage ? "是否已有貸款" : "",
      !optionalInteger(text(form.get("desiredAmount"))) && !optionalInteger(text(form.get("requestedAmount"))) ? "期望貸款金額" : "",
      hasExistingMortgage && !text(form.get("currentBank")) ? "目前貸款銀行" : "",
      hasExistingMortgage && !optionalInteger(text(form.get("remainingBalance"))) ? "剩餘貸款金額" : "",
    ].filter(Boolean);
    if (missing.length) return missingFieldsResponse(missing);
  }
  if (loanType === "business") {
    const missing = [
      !text(form.get("businessLoanType")) ? "企業貸款類型" : "",
      !text(form.get("businessName")) ? "公司 / 商號名稱" : "",
      !text(form.get("businessType")) ? "企業型態" : "",
      optionalDecimal(text(form.get("operatingYears"))) === null ? "營業年數" : "",
      !text(form.get("businessLocation")) ? "企業所在地" : "",
      !text(form.get("monthlyRevenueRange")) ? "月平均營收區間" : "",
      !optionalInteger(text(form.get("desiredAmount"))) && !optionalInteger(text(form.get("requestedAmount"))) ? "期望貸款金額" : "",
    ].filter(Boolean);
    if (missing.length) return missingFieldsResponse(missing);
  }

  let creditFiles: { front: CreditApplicationFile; back: CreditApplicationFile } | null = null;
  const creditApplicationId = randomUUID();
  if (loanType === "credit") {
    try {
      validateCreditFile(form.get("idFront"), "身分證正面");
      validateCreditFile(form.get("idBack"), "身分證反面");
      const uploadCreatedAt = new Date().toISOString();
      const front = await storeCreditFile(form.get("idFront") as File, creditApplicationId, "id_front", uploadCreatedAt);
      const back = await storeCreditFile(form.get("idBack") as File, creditApplicationId, "id_back", uploadCreatedAt);
      creditFiles = { front, back };
    } catch (error) {
      return NextResponse.json({
        message: error instanceof Error ? `${error.message}。財力證明不用上傳本站，請改透過 LINE 與專員確認。` : "身分證上傳失敗，請重試或改用 LINE 聯繫專員。",
      }, { status: 400 });
    }
  }

  recentSubmits.set(ip, [...previousSubmits, now]);
  const leadId = randomUUID();
  const createdAt = new Date().toISOString();
  const sourcePage = text(form.get("sourcePage")) || "/consultation";
  const sourceChannel = text(form.get("sourceChannel")) || "website";
  const utmSource = text(form.get("utmSource"));
  const utmMedium = text(form.get("utmMedium"));
  const utmCampaign = text(form.get("utmCampaign"));
  const utmContent = text(form.get("utmContent"));
  const utmTerm = text(form.get("utmTerm"));
  const seoKeyword = text(form.get("seoKeyword"));
  const sessionId = text(form.get("sessionId")).slice(0, 120);

  const createdLead = await mutateDB(async (db) => {
    const duplicate = db.leads.find(
      (lead) => phoneDigits(lead.phone) === phoneDigits(phone) || (!!lineId && lead.lineId.toLowerCase() === lineId.toLowerCase()),
    );
    const lead: Lead = {
      id: leadId,
      name,
      phone,
      lineId,
      identityType: normalizedIdentityType,
      loanType,
      desiredAmount: optionalNumber(text(form.get("desiredAmount"))) || optionalNumber(text(form.get("requestedAmount"))),
      appointmentTime,
      purpose,
      propertyRegion: text(form.get("propertyRegion")) || [text(form.get("propertyCity")), text(form.get("propertyArea"))].filter(Boolean).join(" "),
      propertyType: text(form.get("propertyType")),
      estimatedPropertyValue: optionalNumber(text(form.get("estimatedPropertyValue"))),
      existingMortgage: text(form.get("existingMortgage")),
      companyName: text(form.get("companyName")) || text(form.get("businessName")),
      businessRegistrationType: text(form.get("businessRegistrationType")) || text(form.get("businessType")),
      monthlyRevenue: optionalNumber(text(form.get("monthlyRevenue"))),
      note,
      sourcePage,
      sourceChannel,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      sessionId,
      status: "new",
      assignedTo: "user-liang",
      leadPriority: loanType === "business" || purpose === "high_risk" ? "needs_review" : "normal",
      nextFollowUpAt: "",
      lastFollowUpAt: "",
      documentStatus: "not_requested",
      duplicateOf: duplicate?.id || "",
      hasJoinedFb: false,
      hasClickedLine: false,
      doNotContact: false,
      deletionRequested: false,
      privacyRequestNote: "",
      notificationStatus: process.env.NOTIFY_WEBHOOK_URL ? "failed" : "not_configured",
      notificationError: process.env.NOTIFY_WEBHOOK_URL ? "通知尚未送出" : "",
      notifiedAt: "",
      notificationAttempts: 0,
      consentAt: createdAt,
      consentVersion: "2026-06-30",
      ip,
      userAgent: request.headers.get("user-agent") || "",
      createdAt,
      updatedAt: createdAt,
    };
    db.leads.unshift(lead);
    if (loanType === "credit" && creditFiles) {
      const creditApplication: CreditApplication = {
        id: creditApplicationId,
        applicationNo: applicationNo("CR"),
        leadId,
        name,
        phone,
        lineId,
        identityType: normalizedIdentityType,
        loanType: "credit",
        requestedAmount: optionalInteger(text(form.get("requestedAmount"))) || optionalInteger(text(form.get("desiredAmount"))) || 7_000_000,
        requestedTermYears: optionalInteger(text(form.get("requestedTermYears"))) || 10,
        fundPurpose: rawPurposeLabel(rawPurpose),
        caseSource: text(form.get("caseSource")) || "company_preferential",
        programType: text(form.get("programType")) || "binding",
        idFrontFileId: creditFiles.front.id,
        idBackFileId: creditFiles.back.id,
        idUploadStatus: "uploaded",
        financialLineStatus: "reminded",
        consentPersonalDataAt: createdAt,
        status: "submitted",
        assignedTo: lead.assignedTo,
        createdAt,
        updatedAt: createdAt,
      };
      lead.documentStatus = "pending";
      db.creditApplications.unshift(creditApplication);
      db.creditApplicationFiles.unshift(creditFiles.back, creditFiles.front);
      db.auditLogs.unshift(createAudit("system", "credit_application_created", "credit_application", creditApplication.id));
    }
    if (loanType === "house") {
      const houseApplication: HouseLoanApplication = {
        id: randomUUID(),
        applicationNo: applicationNo("HO"),
        leadId,
        name,
        phone,
        lineId,
        houseLoanType: text(form.get("houseLoanType")) || "unsure",
        propertyCity: text(form.get("propertyCity")) || text(form.get("propertyRegion")),
        propertyArea: text(form.get("propertyArea")),
        propertyType: text(form.get("propertyType")),
        propertyUsage: text(form.get("propertyUsage")),
        ownershipStatus: text(form.get("ownershipStatus")),
        estimatedValue: optionalInteger(text(form.get("estimatedPropertyValue"))),
        hasExistingMortgage: optionalBoolean(text(form.get("hasExistingMortgage"))) || text(form.get("existingMortgage")) === "has_mortgage" || text(form.get("existingMortgage")) === "second_mortgage",
        currentBank: text(form.get("currentBank")),
        remainingBalance: optionalInteger(text(form.get("remainingBalance"))),
        requestedAmount: optionalInteger(text(form.get("requestedAmount"))) || optionalInteger(text(form.get("desiredAmount"))),
        requestedTermYears: optionalInteger(text(form.get("requestedTermYears"))),
        gracePeriodNeeded: optionalBoolean(text(form.get("gracePeriodNeeded"))),
        fundPurpose: rawPurposeLabel(rawPurpose),
        documentLineStatus: "reminded",
        status: "submitted",
        assignedTo: lead.assignedTo,
        createdAt,
        updatedAt: createdAt,
      };
      lead.documentStatus = "pending";
      db.houseLoanApplications.unshift(houseApplication);
      db.auditLogs.unshift(createAudit("system", "house_loan_application_created", "house_loan_application", houseApplication.id));
    }
    if (loanType === "business") {
      const businessApplication: BusinessLoanApplication = {
        id: randomUUID(),
        applicationNo: applicationNo("BU"),
        leadId,
        ownerName: name,
        phone,
        lineId,
        businessLoanType: text(form.get("businessLoanType")) || "working_capital",
        businessName: text(form.get("businessName")) || text(form.get("companyName")),
        registrationNo: text(form.get("registrationNo")),
        businessType: text(form.get("businessType")) || text(form.get("businessRegistrationType")),
        industry: text(form.get("industry")),
        operatingYears: optionalDecimal(text(form.get("operatingYears"))),
        employeeCount: optionalInteger(text(form.get("employeeCount"))),
        businessLocation: text(form.get("businessLocation")),
        annualRevenueRange: text(form.get("annualRevenueRange")),
        monthlyRevenueRange: text(form.get("monthlyRevenueRange")),
        requestedAmount: optionalInteger(text(form.get("requestedAmount"))) || optionalInteger(text(form.get("desiredAmount"))),
        requestedTermYears: optionalInteger(text(form.get("requestedTermYears"))),
        fundPurpose: rawPurposeLabel(rawPurpose),
        hasCollateral: optionalBoolean(text(form.get("hasCollateral"))),
        hasExistingBusinessLoan: optionalBoolean(text(form.get("hasExistingBusinessLoan"))),
        documentLineStatus: "reminded",
        status: "submitted",
        assignedTo: lead.assignedTo,
        createdAt,
        updatedAt: createdAt,
      };
      lead.documentStatus = "pending";
      db.businessLoanApplications.unshift(businessApplication);
      db.auditLogs.unshift(createAudit("system", "business_loan_application_created", "business_loan_application", businessApplication.id));
    }
    db.leadAssignments.unshift({
      id: randomUUID(),
      leadId,
      fromUserId: "",
      toUserId: lead.assignedTo,
      actorId: "system",
      reason: "lead_created",
      createdAt,
    });
    db.events.unshift({
      id: randomUUID(),
      eventName: "form_submit",
      pagePath: sourcePage,
      leadId,
      sessionId,
      sourceChannel,
      metadata: { loanType, identityType: normalizedIdentityType, purpose, rawPurpose, highRiskPurpose: purpose === "high_risk" ? "true" : "", sessionId, utmSource, utmMedium, utmCampaign, utmContent, utmTerm, seoKeyword },
      createdAt,
    });
    db.auditLogs.unshift(createAudit("system", "lead_created", "lead", leadId));
    return { lead, settings: db.settings };
  });

  const notification = await sendLeadNotification(createdLead.lead, createdLead.settings);
  if (notification.status !== "not_configured") {
    await mutateDB((db) => {
      const lead = db.leads.find((item) => item.id === leadId);
      if (!lead) return;
      lead.notificationStatus = notification.status;
      lead.notificationError = notification.error;
      lead.notifiedAt = notification.notifiedAt;
      lead.notificationAttempts += 1;
      db.auditLogs.unshift(createAudit("system", notification.status === "sent" ? "lead_notification_sent" : "lead_notification_failed", "lead", leadId));
    });
  }

  return NextResponse.json({ leadId });
}
