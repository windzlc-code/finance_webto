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

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = await readDB();
  const file = db.files.find((item) => item.id === id);
  if (!file) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ file });
}

export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user || !canManageContent(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as FileResourceInput & { replaceContent?: boolean };
  if (body.title !== undefined && !body.title.trim()) {
    return NextResponse.json({ message: "請輸入文件標題" }, { status: 400 });
  }
  const nextContent = normalizeFileResourceText(body.content);
  if (body.replaceContent) {
    const validationError = validateFileResourcePayload(body, nextContent);
    if (validationError) return NextResponse.json({ message: validationError }, { status: 400 });
  }
  const sourceFilename = normalizeSourceFilename(body.sourceFilename);
  const sourceFileMime = normalizeSourceFileMime(body.sourceFileMime);
  const sourceFileSize = normalizeSourceFileSize(body.sourceFileSize);

  const file = await mutateDB((db) => {
    const item = db.files.find((entry) => entry.id === id);
    if (!item) return null;
    const contentChanged = Boolean(body.replaceContent && nextContent !== item.content);
    if (typeof body.title === "string") item.title = body.title.trim();
    if (body.type) item.type = body.type;
    if (body.visibility === "public" || body.visibility === "admin_only") item.visibility = body.visibility;
    if (typeof body.description === "string") item.description = body.description.trim();
    if (body.replaceContent) {
      if (contentChanged) {
        item.fileVersionHistory = Array.isArray(item.fileVersionHistory) ? item.fileVersionHistory : [];
        if (!item.fileVersionHistory.some((version) => version.version === item.version)) {
          item.fileVersionHistory.unshift({
            id: randomUUID(),
            version: item.version,
            content: item.content,
            sourceFilename: item.sourceFilename || "",
            sourceFileMime: item.sourceFileMime || "",
            sourceFileSize: item.sourceFileSize || 0,
            createdAt: item.updatedAt || new Date().toISOString(),
            createdBy: user.id,
          });
        }
        item.version += 1;
      }
      item.content = nextContent;
      item.sourceFilename = sourceFilename;
      item.sourceFileMime = sourceFileMime;
      item.sourceFileSize = sourceFileSize;
      item.sourceUploadedAt = sourceFilename ? new Date().toISOString() : "";
    }
    item.updatedAt = new Date().toISOString();
    db.auditLogs.unshift(createAudit(user.id, contentChanged ? "file_replaced" : "file_updated", "file", id));
    return item;
  });

  if (!file) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ file });
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user || !canManageContent(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const deleted = await mutateDB((db) => {
    const exists = db.files.some((file) => file.id === id);
    if (!exists) return false;
    db.files = db.files.filter((file) => file.id !== id);
    if (!db.deletedFileIds.includes(id)) db.deletedFileIds.push(id);
    db.auditLogs.unshift(createAudit(user.id, "file_deleted", "file", id));
    return true;
  });
  if (!deleted) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
