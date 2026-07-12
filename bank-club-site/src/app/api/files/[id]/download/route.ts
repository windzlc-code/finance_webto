import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { canManageContent, requireAdmin } from "@/lib/auth";
import { createAudit, mutateDB, readDB } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

function encodeUtf16Hex(value: string) {
  return Buffer.from(value, "utf16le").swap16().toString("hex").toUpperCase();
}

function wrapLine(line: string, maxLength = 34) {
  const chars = Array.from(line);
  const lines = [];
  for (let index = 0; index < chars.length; index += maxLength) {
    lines.push(chars.slice(index, index + maxLength).join(""));
  }
  return lines.length ? lines : [""];
}

function pdfStringObject(id: number, body: string) {
  return `${id} 0 obj\n${body}\nendobj\n`;
}

function createPdf(title: string, content: string) {
  const rows = [
    title,
    "銀行行員俱樂部公開文件清單",
    `產生時間：${new Date().toLocaleDateString("zh-TW")}`,
    "",
    ...content.split("\n").flatMap((line) => wrapLine(line)),
    "",
    "提醒：高度敏感文件請先與專員確認補件方式，勿隨意上傳一般網站。",
    "本平台僅提供諮詢與文件準備提醒，最終審核以銀行為準。",
  ];
  const commands = [
    "BT",
    "/F1 16 Tf",
    "50 792 Td",
    "22 TL",
    ...rows.map((row) => `<${encodeUtf16Hex(row)}> Tj T*`),
    "ET",
  ].join("\n");
  const stream = `${commands}\n`;
  const objects = [
    pdfStringObject(1, "<< /Type /Catalog /Pages 2 0 R >>"),
    pdfStringObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    pdfStringObject(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >>"),
    pdfStringObject(4, "<< /Type /Font /Subtype /Type0 /BaseFont /MSung-Light /Encoding /UniCNS-UCS2-H /DescendantFonts [5 0 R] >>"),
    pdfStringObject(5, "<< /Type /Font /Subtype /CIDFontType0 /BaseFont /MSung-Light /CIDSystemInfo 6 0 R >>"),
    pdfStringObject(6, "<< /Registry (Adobe) /Ordering (CNS1) /Supplement 0 >>"),
    pdfStringObject(7, `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}endstream`),
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "ascii"));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "ascii");
}

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "txt" ? "txt" : "pdf";
  const requestedVersion = Number(searchParams.get("version") || 0);
  const sourceChannel = searchParams.get("source_channel") || searchParams.get("utm_source") || "website";
  const sessionId = (searchParams.get("session_id") || "").slice(0, 120);
  const currentDB = await readDB();
  const currentFile = currentDB.files.find((entry) => entry.id === id);
  if (!currentFile) return NextResponse.json({ message: "Not found" }, { status: 404 });
  let adminDownloadUserId = "";
  if (currentFile.visibility === "admin_only") {
    const user = await requireAdmin();
    if (!user || !canManageContent(user)) return NextResponse.json({ message: "Not found" }, { status: 404 });
    adminDownloadUserId = user.id;
  }
  const file = await mutateDB((db) => {
    const item = db.files.find((entry) => entry.id === id);
    if (!item) return null;
    item.downloads += 1;
    item.updatedAt = new Date().toISOString();
    db.events.unshift({
      id: randomUUID(),
      eventName: "file_download",
      pagePath: searchParams.get("source") || "/consultation",
      leadId: "",
      sessionId,
      sourceChannel,
      metadata: { fileId: id, title: item.title, format, sessionId, sourceChannel, version: String(requestedVersion || item.version) },
      createdAt: new Date().toISOString(),
    });
    if (adminDownloadUserId) {
      db.auditLogs.unshift(createAudit(adminDownloadUserId, "file_admin_downloaded", "file", id));
    }
    return item;
  });
  if (!file) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const versionedContent =
    requestedVersion && requestedVersion !== file.version
      ? file.fileVersionHistory.find((entry) => entry.version === requestedVersion)?.content
      : file.content;
  if (!versionedContent) return NextResponse.json({ message: "Version not found" }, { status: 404 });
  const title = requestedVersion && requestedVersion !== file.version ? `${file.title} v${requestedVersion}` : file.title;

  if (format === "txt") {
    return new NextResponse(versionedContent, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "content-disposition": `attachment; filename="${encodeURIComponent(title)}.txt"`,
      },
    });
  }

  return new NextResponse(createPdf(title, versionedContent), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${encodeURIComponent(title)}.pdf"`,
    },
  });
}
