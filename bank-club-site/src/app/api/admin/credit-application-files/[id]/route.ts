import { readFile, rm } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { canViewLead, isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { createAudit, mutateDB } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

const creditUploadDir = path.join(process.cwd(), ".data", "credit-application-files");

function safeStoragePath(storageKey: string) {
  const resolved = path.resolve(creditUploadDir, storageKey);
  const root = path.resolve(creditUploadDir);
  if (!resolved.startsWith(`${root}${path.sep}`)) return null;
  return resolved;
}

function recalculateIdUploadStatus(files: Array<{ uploadStatus: string }>) {
  if (!files.length) return "pending_reupload";
  if (files.some((file) => file.uploadStatus === "pending_reupload" || file.uploadStatus === "deleted")) {
    return "pending_reupload";
  }
  return "uploaded";
}

export async function GET(request: Request, { params }: Params) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await mutateDB((db) => {
    const file = db.creditApplicationFiles.find((item) => item.id === id);
    if (!file) return null;
    const application = db.creditApplications.find((item) => item.id === file.applicationId);
    if (!application) return null;
    const lead = db.leads.find((item) => item.id === application.leadId);
    if (!lead) return null;
    if (!canViewLead(user, lead)) return "forbidden";
    if (file.uploadStatus === "deleted" || file.deletedAt) return "deleted";
    const storagePath = safeStoragePath(file.storageKey);
    if (!storagePath) return "invalid_path";
    db.auditLogs.unshift(createAudit(user.id, "credit_id_file_viewed", "credit_application_file", id));
    return { file, storagePath };
  });

  if (result === "forbidden") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  if (result === "deleted") return NextResponse.json({ message: "文件已刪除" }, { status: 410 });
  if (result === "invalid_path") return NextResponse.json({ message: "文件路徑不合法" }, { status: 400 });
  if (!result) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const bytes = await readFile(result.storagePath).catch(() => null);
  if (!bytes) return NextResponse.json({ message: "文件不存在，請要求使用者重新上傳" }, { status: 404 });
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new NextResponse(bytes, {
    headers: {
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${encodeURIComponent(result.file.originalName)}"`,
      "Content-Length": String(bytes.byteLength),
      "Content-Type": result.file.mimeType || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { uploadStatus?: string };
  if (body.uploadStatus !== "uploaded" && body.uploadStatus !== "pending_reupload") {
    return NextResponse.json({ message: "未知的文件狀態" }, { status: 400 });
  }

  const result = await mutateDB((db) => {
    const file = db.creditApplicationFiles.find((item) => item.id === id);
    if (!file) return null;
    const application = db.creditApplications.find((item) => item.id === file.applicationId);
    if (!application) return null;
    const lead = db.leads.find((item) => item.id === application.leadId);
    if (!lead) return null;
    if (!canViewLead(user, lead)) return "forbidden";

    const updatedAt = new Date().toISOString();
    file.uploadStatus = body.uploadStatus as "uploaded" | "pending_reupload";
    file.reviewedBy = user.id;
    file.reviewedAt = updatedAt;
    file.deletedAt = "";
    const applicationFiles = db.creditApplicationFiles.filter((item) => item.applicationId === application.id);
    application.idUploadStatus = recalculateIdUploadStatus(applicationFiles);
    application.updatedAt = updatedAt;
    lead.documentStatus = application.idUploadStatus === "uploaded" ? "received" : "incomplete";
    lead.updatedAt = updatedAt;
    db.auditLogs.unshift(createAudit(user.id, body.uploadStatus === "uploaded" ? "credit_id_file_confirmed" : "credit_id_file_reupload_requested", "credit_application_file", id));
    return { lead, creditApplication: application, creditApplicationFiles: applicationFiles };
  });

  if (result === "forbidden") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  if (!result) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  let storagePath = "";

  const result = await mutateDB((db) => {
    const file = db.creditApplicationFiles.find((item) => item.id === id);
    if (!file) return null;
    const application = db.creditApplications.find((item) => item.id === file.applicationId);
    if (!application) return null;
    const lead = db.leads.find((item) => item.id === application.leadId);
    if (!lead) return null;
    if (!canViewLead(user, lead)) return "forbidden";

    const updatedAt = new Date().toISOString();
    file.uploadStatus = "deleted";
    file.reviewedBy = user.id;
    file.reviewedAt = updatedAt;
    file.deletedAt = updatedAt;
    const resolved = safeStoragePath(file.storageKey);
    storagePath = resolved || "";
    const applicationFiles = db.creditApplicationFiles.filter((item) => item.applicationId === application.id);
    application.idUploadStatus = recalculateIdUploadStatus(applicationFiles);
    application.status = "pending_documents";
    application.updatedAt = updatedAt;
    lead.documentStatus = "incomplete";
    lead.updatedAt = updatedAt;
    db.auditLogs.unshift(createAudit(user.id, "credit_id_file_deleted", "credit_application_file", id));
    return { lead, creditApplication: application, creditApplicationFiles: applicationFiles };
  });

  if (result === "forbidden") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  if (!result) return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (storagePath) {
    await rm(storagePath, { force: true }).catch(() => undefined);
  }
  return NextResponse.json(result);
}
