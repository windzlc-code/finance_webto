import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { canUpdateLead, isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { detectSensitiveLeadNote } from "@/lib/sensitive-content";
import { createAudit, mutateDB } from "@/lib/store";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { leadId?: string; body?: string };
  if (!body.leadId || !body.body?.trim()) {
    return NextResponse.json({ message: "請輸入跟進備註" }, { status: 400 });
  }
  const noteBody = body.body.trim();
  if (noteBody.length > 1000) {
    return NextResponse.json({ message: "跟進備註請控制在 1000 字內，完整文件內容請勿貼入後台。" }, { status: 400 });
  }
  const sensitive = detectSensitiveLeadNote(noteBody);
  if (sensitive.blocked) {
    return NextResponse.json({
      message: `跟進備註請只記錄摘要，不要貼上完整敏感文件內容。偵測到：${sensitive.reasons.join("、")}。`,
    }, { status: 400 });
  }
  const note = await mutateDB((db) => {
    const lead = db.leads.find((entry) => entry.id === body.leadId);
    if (!lead) return null;
    if (!canUpdateLead(user, lead)) return "forbidden";
    const now = new Date().toISOString();
    const item = {
      id: randomUUID(),
      leadId: body.leadId!,
      authorId: user.id,
      body: noteBody,
      createdAt: now,
    };
    db.leadNotes.unshift(item);
    lead.lastFollowUpAt = now;
    lead.updatedAt = now;
    db.auditLogs.unshift(createAudit(user.id, "note_created", "lead", body.leadId!));
    return item;
  });
  if (note === "forbidden") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  if (!note) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ note });
}
