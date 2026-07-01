import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { canUpdateLead, canViewLead, isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { detectSensitiveLeadNote } from "@/lib/sensitive-content";
import { statusLabels } from "@/lib/site-data";
import { createAudit, mutateDB, readDB } from "@/lib/store";
import type { LeadPriority, LeadStatus, LineDocumentStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

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
const lineDocumentStatuses = new Set<LineDocumentStatus>(["not_reminded", "reminded", "line_received", "pending_documents", "confirmed"]);

function isValidOptionalDateTime(value: string) {
  return value.trim() === "" || Number.isFinite(Date.parse(value));
}

function leadDocumentStatusFromLineStatus(status: LineDocumentStatus) {
  if (status === "line_received") return "received";
  if (status === "pending_documents") return "incomplete";
  if (status === "confirmed") return "confirmed";
  if (status === "reminded") return "pending";
  return "not_requested";
}

export async function GET(_: Request, { params }: Params) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await mutateDB((db) => {
    const lead = db.leads.find((item) => item.id === id);
    if (!lead) return null;
    if (!canViewLead(user, lead)) return "forbidden";
    db.auditLogs.unshift(createAudit(user.id, "lead_contact_viewed", "lead", id));
    return {
      lead,
      notes: db.leadNotes.filter((note) => note.leadId === id),
      assignments: db.leadAssignments.filter((assignment) => assignment.leadId === id),
      creditApplication: db.creditApplications.find((application) => application.leadId === id) || null,
      creditApplicationFiles: db.creditApplicationFiles.filter((file) => file.applicationId === db.creditApplications.find((application) => application.leadId === id)?.id),
      houseLoanApplication: db.houseLoanApplications.find((application) => application.leadId === id) || null,
      businessLoanApplication: db.businessLoanApplications.find((application) => application.leadId === id) || null,
    };
  });
  if (result === "forbidden") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  if (!result) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({
    lead: result.lead,
    notes: result.notes,
    assignments: result.assignments,
    creditApplication: result.creditApplication,
    creditApplicationFiles: result.creditApplicationFiles,
    houseLoanApplication: result.houseLoanApplication,
    businessLoanApplication: result.businessLoanApplication,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: LeadStatus;
    assignedTo?: string;
    leadPriority?: LeadPriority;
    nextFollowUpAt?: string;
    documentStatus?: "not_requested" | "pending" | "received" | "incomplete" | "confirmed";
    hasJoinedFb?: boolean;
    hasClickedLine?: boolean;
    doNotContact?: boolean;
    deletionRequested?: boolean;
    privacyRequestNote?: string;
    houseDocumentLineStatus?: LineDocumentStatus;
    businessDocumentLineStatus?: LineDocumentStatus;
  };
  if (body.status && !(body.status in statusLabels)) {
    return NextResponse.json({ message: "未知的案件狀態" }, { status: 400 });
  }
  if (body.houseDocumentLineStatus && !lineDocumentStatuses.has(body.houseDocumentLineStatus)) {
    return NextResponse.json({ message: "未知的房貸補件狀態" }, { status: 400 });
  }
  if (body.businessDocumentLineStatus && !lineDocumentStatuses.has(body.businessDocumentLineStatus)) {
    return NextResponse.json({ message: "未知的企業貸補件狀態" }, { status: 400 });
  }
  const nextFollowUpAt = typeof body.nextFollowUpAt === "string" ? body.nextFollowUpAt.trim() : undefined;
  if (nextFollowUpAt !== undefined && !isValidOptionalDateTime(nextFollowUpAt)) {
    return NextResponse.json({ message: "下次跟進時間格式不正確" }, { status: 400 });
  }
  const privacyRequestNote = typeof body.privacyRequestNote === "string" ? body.privacyRequestNote.trim() : undefined;
  if (privacyRequestNote !== undefined) {
    if (privacyRequestNote.length > 1000) {
      return NextResponse.json({ message: "個資請求備註請控制在 1000 字內，完整文件內容請勿貼入後台。" }, { status: 400 });
    }
    const sensitive = detectSensitiveLeadNote(privacyRequestNote);
    if (sensitive.blocked) {
      return NextResponse.json({
        message: `個資請求備註請只記錄處理摘要，不要貼上完整敏感文件內容。偵測到：${sensitive.reasons.join("、")}。`,
      }, { status: 400 });
    }
  }

  const lead = await mutateDB((db) => {
    const item = db.leads.find((entry) => entry.id === id);
    if (!item) return null;
    if (!canUpdateLead(user, item)) return "forbidden";
    const previousStatus = item.status;
    const updatedAt = new Date().toISOString();
    const previousPrivacyState = {
      doNotContact: item.doNotContact,
      deletionRequested: item.deletionRequested,
      privacyRequestNote: item.privacyRequestNote,
    };
    if (body.status) item.status = body.status;
    if (body.status && body.status !== previousStatus && contactedStatuses.has(body.status)) {
      item.lastFollowUpAt = updatedAt;
    }
    if (body.assignedTo && user.role === "super_admin" && body.assignedTo !== item.assignedTo) {
      const nextOwner = db.users.find(
        (entry) => entry.id === body.assignedTo && (entry.role === "super_admin" || entry.role === "specialist"),
      );
      if (!nextOwner) return "invalid_assignee";
      db.leadAssignments.unshift({
        id: randomUUID(),
        leadId: id,
        fromUserId: item.assignedTo,
        toUserId: body.assignedTo,
        actorId: user.id,
        reason: "manual_assignment",
        createdAt: new Date().toISOString(),
      });
      item.assignedTo = body.assignedTo;
    }
    if (body.leadPriority) item.leadPriority = body.leadPriority;
    if (nextFollowUpAt !== undefined) item.nextFollowUpAt = nextFollowUpAt;
    if (body.documentStatus) item.documentStatus = body.documentStatus;
    if (typeof body.hasJoinedFb === "boolean") item.hasJoinedFb = body.hasJoinedFb;
    if (typeof body.hasClickedLine === "boolean") item.hasClickedLine = body.hasClickedLine;
    if (typeof body.doNotContact === "boolean") item.doNotContact = body.doNotContact;
    if (typeof body.deletionRequested === "boolean") item.deletionRequested = body.deletionRequested;
    if (privacyRequestNote !== undefined) item.privacyRequestNote = privacyRequestNote;
    if (body.houseDocumentLineStatus) {
      const application = db.houseLoanApplications.find((entry) => entry.leadId === id);
      if (!application) return "invalid_application";
      application.documentLineStatus = body.houseDocumentLineStatus;
      application.updatedAt = updatedAt;
      item.documentStatus = leadDocumentStatusFromLineStatus(body.houseDocumentLineStatus);
      if (body.houseDocumentLineStatus === "pending_documents") item.status = "pending_documents";
      if (body.houseDocumentLineStatus === "line_received") item.status = "documents_received";
      db.auditLogs.unshift(createAudit(user.id, "house_line_documents_updated", "house_loan_application", application.id));
    }
    if (body.businessDocumentLineStatus) {
      const application = db.businessLoanApplications.find((entry) => entry.leadId === id);
      if (!application) return "invalid_application";
      application.documentLineStatus = body.businessDocumentLineStatus;
      application.updatedAt = updatedAt;
      item.documentStatus = leadDocumentStatusFromLineStatus(body.businessDocumentLineStatus);
      if (body.businessDocumentLineStatus === "pending_documents") item.status = "pending_documents";
      if (body.businessDocumentLineStatus === "line_received") item.status = "documents_received";
      db.auditLogs.unshift(createAudit(user.id, "business_line_documents_updated", "business_loan_application", application.id));
    }
    item.updatedAt = updatedAt;
    if (
      previousPrivacyState.doNotContact !== item.doNotContact ||
      previousPrivacyState.deletionRequested !== item.deletionRequested ||
      previousPrivacyState.privacyRequestNote !== item.privacyRequestNote
    ) {
      db.auditLogs.unshift(createAudit(user.id, "lead_privacy_request_updated", "lead", id));
    }
    db.auditLogs.unshift(createAudit(user.id, "lead_updated", "lead", id));
    return item;
  });

  if (lead === "forbidden") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  if (lead === "invalid_assignee") return NextResponse.json({ message: "請選擇有效專員" }, { status: 400 });
  if (lead === "invalid_application") return NextResponse.json({ message: "找不到對應的貸款申請資料" }, { status: 400 });
  if (!lead) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const db = await readDB();
  return NextResponse.json({
    lead,
    assignments: db.leadAssignments.filter((assignment) => assignment.leadId === id),
    creditApplication: db.creditApplications.find((application) => application.leadId === id) || null,
    creditApplicationFiles: db.creditApplicationFiles.filter((file) => file.applicationId === db.creditApplications.find((application) => application.leadId === id)?.id),
    houseLoanApplication: db.houseLoanApplications.find((application) => application.leadId === id) || null,
    businessLoanApplication: db.businessLoanApplications.find((application) => application.leadId === id) || null,
  });
}
