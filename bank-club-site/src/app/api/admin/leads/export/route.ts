import { NextResponse } from "next/server";
import { canExportLeads, isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { createAudit, mutateDB } from "@/lib/store";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safeText = /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function exportAuditTargetId(count: number, filters: Record<string, string>) {
  const filterSummary = Object.entries(filters)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${value.slice(0, 48)}`)
    .join(";");
  return filterSummary ? `count=${count};${filterSummary}` : `count=${count};filters=all`;
}

export async function GET(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user || !canExportLeads(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const loanType = searchParams.get("loanType") || "";
  const status = searchParams.get("status") || "";
  const sourceChannel = searchParams.get("sourceChannel") || "";
  const assignedTo = searchParams.get("assignedTo") || "";

  const rows = await mutateDB((db) => {
    const filtered = db.leads.filter((lead) => {
      const matchesQ =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        lead.lineId.toLowerCase().includes(q);
      return (
        matchesQ &&
        (!loanType || lead.loanType === loanType) &&
        (!status || lead.status === status) &&
        (!sourceChannel || lead.sourceChannel === sourceChannel) &&
        (!assignedTo || lead.assignedTo === assignedTo)
      );
    });
    db.auditLogs.unshift(createAudit(
      user.id,
      "leads_exported",
      "lead",
      exportAuditTargetId(filtered.length, { q, loanType, status, sourceChannel, assignedTo }),
    ));
    return filtered;
  });

  const header = [
    "lead_id",
    "name",
    "phone",
    "line_id",
    "identity_type",
    "loan_type",
    "desired_amount",
    "appointment_time",
    "purpose",
    "note",
    "property_region",
    "property_type",
    "estimated_property_value",
    "existing_mortgage",
    "company_name",
    "business_registration_type",
    "monthly_revenue",
    "source_channel",
    "source_page",
    "session_id",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "status",
    "assigned_to",
    "lead_priority",
    "next_follow_up_at",
    "last_follow_up_at",
    "document_status",
    "duplicate_of",
    "has_joined_fb",
    "has_clicked_line",
    "do_not_contact",
    "deletion_requested",
    "privacy_request_note",
    "notification_status",
    "notification_error",
    "notified_at",
    "notification_attempts",
    "consent_at",
    "consent_version",
    "ip",
    "user_agent",
    "created_at",
    "updated_at",
  ];
  const csv = [
    header.join(","),
    ...rows.map((lead) =>
      [
        lead.id,
        lead.name,
        lead.phone,
        lead.lineId,
        lead.identityType,
        lead.loanType,
        lead.desiredAmount,
        lead.appointmentTime,
        lead.purpose,
        lead.note,
        lead.propertyRegion,
        lead.propertyType,
        lead.estimatedPropertyValue,
        lead.existingMortgage,
        lead.companyName,
        lead.businessRegistrationType,
        lead.monthlyRevenue,
        lead.sourceChannel,
        lead.sourcePage,
        lead.sessionId,
        lead.utmSource,
        lead.utmMedium,
        lead.utmCampaign,
        lead.utmContent,
        lead.utmTerm,
        lead.status,
        lead.assignedTo,
        lead.leadPriority,
        lead.nextFollowUpAt,
        lead.lastFollowUpAt,
        lead.documentStatus,
        lead.duplicateOf,
        lead.hasJoinedFb ? "yes" : "no",
        lead.hasClickedLine ? "yes" : "no",
        lead.doNotContact ? "yes" : "no",
        lead.deletionRequested ? "yes" : "no",
        lead.privacyRequestNote,
        lead.notificationStatus,
        lead.notificationError,
        lead.notifiedAt,
        lead.notificationAttempts,
        lead.consentAt,
        lead.consentVersion,
        lead.ip,
        lead.userAgent,
        lead.createdAt,
        lead.updatedAt,
      ].map(csvCell).join(","),
    ),
  ].join("\n");

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="bank-club-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
