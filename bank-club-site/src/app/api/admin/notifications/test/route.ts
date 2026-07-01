import { NextResponse } from "next/server";
import { isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { sendTestNotification } from "@/lib/lead-notifications";
import { createAudit, mutateDB, readDB } from "@/lib/store";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const db = await readDB();
  const notification = await sendTestNotification(db.settings, user);
  await mutateDB((nextDB) => {
    nextDB.auditLogs.unshift(
      createAudit(
        user.id,
        notification.status === "sent"
          ? "notification_test_sent"
          : notification.status === "not_configured"
            ? "notification_test_not_configured"
            : "notification_test_failed",
        "settings",
        "notification-webhook",
      ),
    );
  });

  return NextResponse.json(
    {
      status: notification.status,
      error: notification.error,
      notifiedAt: notification.notifiedAt,
    },
    { status: notification.status === "failed" ? 502 : 200 },
  );
}
