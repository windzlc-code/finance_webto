import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { canManageContent, isSameOriginRequest, requireAdmin } from "@/lib/auth";
import {
  normalizeFileResourceText,
  normalizeSourceFileMime,
  normalizeSourceFilename,
  normalizeSourceFileSize,
  validateFileResourcePayload,
  type FileResourceInput,
} from "@/lib/file-resource-policy";
import { createAudit, mutateDB, readDB } from "@/lib/store";
import type { FileResource } from "@/lib/types";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canManageContent(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const db = await readDB();
  return NextResponse.json({ files: db.files });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user || !canManageContent(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as FileResourceInput;
  if (typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ message: "請輸入文件標題" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const title = body.title.trim();
  const content = normalizeFileResourceText(body.content);
  const validationError = validateFileResourcePayload(body, content);
  if (validationError) return NextResponse.json({ message: validationError }, { status: 400 });
  const sourceFilename = normalizeSourceFilename(body.sourceFilename);
  const sourceFileMime = normalizeSourceFileMime(body.sourceFileMime);
  const sourceFileSize = normalizeSourceFileSize(body.sourceFileSize);
  const file = await mutateDB((db) => {
    const item: FileResource = {
      id: randomUUID(),
      title,
      type: body.type || "credit_docs",
      visibility: body.visibility === "admin_only" ? "admin_only" : "public",
      description: body.description?.trim() || "",
      content,
      sourceFilename,
      sourceFileMime,
      sourceFileSize,
      sourceUploadedAt: sourceFilename ? now : "",
      version: 1,
      fileVersionHistory: [],
      downloads: 0,
      createdAt: now,
      updatedAt: now,
    };
    db.files.unshift(item);
    db.auditLogs.unshift(createAudit(user.id, "file_created", "file", item.id));
    return item;
  });
  return NextResponse.json({ file });
}
