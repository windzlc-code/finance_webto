import { NextResponse } from "next/server";
import { canUpdateLead, isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { sendLeadNotification } from "@/lib/lead-notifications";
import { createAudit, mutateDB, readDB } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const db = await readDB();
  const lead = db.leads.find((item) => item.id === id);
  if (!lead) return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (!canUpdateLead(user, lead)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  if (lead.doNotContact || lead.deletionRequested) {
    const updated = await mutateDB((nextDB) => {
      const item = nextDB.leads.find((entry) => entry.id === id);
      if (!item) return null;
      item.notificationError = "使用者已要求停止聯繫或提出刪除/停止利用請求，已停止通知重送";
      item.updatedAt = new Date().toISOString();
      nextDB.auditLogs.unshift(createAudit(user.id, "lead_notification_blocked_privacy", "lead", id));
      return item;
    });
    if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(
      { message: "使用者已要求停止聯繫或提出刪除/停止利用請求，請勿重送通知", lead: updated },
      { status: 409 },
    );
  }

  const notification = await sendLeadNotification(lead, db.settings);
  const updated = await mutateDB((nextDB) => {
    const item = nextDB.leads.find((entry) => entry.id === id);
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
          ? "lead_notification_resent"
          : notification.status === "not_configured"
            ? "lead_notification_retry_not_configured"
            : "lead_notification_retry_failed",
        "lead",
        id,
      ),
    );
    return item;
  });

  if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ lead: updated });
}
