import { NextResponse } from "next/server";
import { canUpdateLead, isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { sendLeadNotification } from "@/lib/lead-notifications";
import { createAudit, mutateDB, readDB } from "@/lib/store";

const retryableStatuses = new Set(["failed", "not_configured"]);

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const db = await readDB();
  const candidates = db.leads
    .filter((lead) => retryableStatuses.has(lead.notificationStatus))
    .filter((lead) => !lead.doNotContact && !lead.deletionRequested)
    .filter((lead) => canUpdateLead(user, lead))
    .slice(0, 25);

  const results = [];
  for (const lead of candidates) {
    const notification = await sendLeadNotification(lead, db.settings);
    const updated = await mutateDB((nextDB) => {
      const item = nextDB.leads.find((entry) => entry.id === lead.id);
      if (!item) return null;
      item.notificationStatus = notification.status;
      item.notificationError = notification.error;
      item.notifiedAt = notification.notifiedAt;
      if (notification.status !== "not_configured") item.notificationAttempts += 1;
      item.updatedAt = new Date().toISOString();
      nextDB.auditLogs.unshift(
        createAudit(
          user.id,
          notification.status === "sent"
            ? "lead_notification_batch_sent"
            : notification.status === "not_configured"
              ? "lead_notification_batch_not_configured"
              : "lead_notification_batch_failed",
          "lead",
          lead.id,
        ),
      );
      return item;
    });
    if (updated) {
      results.push({
        leadId: lead.id,
        status: updated.notificationStatus,
        error: updated.notificationError,
      });
    }
  }

  const sent = results.filter((item) => item.status === "sent").length;
  const failed = results.filter((item) => item.status === "failed").length;
  const notConfigured = results.filter((item) => item.status === "not_configured").length;
  return NextResponse.json({
    processed: results.length,
    sent,
    failed,
    notConfigured,
    skipped: Math.max(0, db.leads.filter((lead) => retryableStatuses.has(lead.notificationStatus)).length - candidates.length),
    results,
  });
}
