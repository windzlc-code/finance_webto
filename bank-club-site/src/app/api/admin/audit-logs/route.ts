import { NextResponse } from "next/server";
import { canViewAuditLogs, requireAdmin } from "@/lib/auth";
import { readDB } from "@/lib/store";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canViewAuditLogs(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const db = await readDB();
  const usersById = new Map(db.users.map((item) => [item.id, item]));
  return NextResponse.json({
    auditLogs: db.auditLogs.slice(0, 100).map((log) => ({
      ...log,
      actorName: usersById.get(log.actorId)?.name || (log.actorId === "system" ? "系統" : log.actorId),
    })),
  });
}
