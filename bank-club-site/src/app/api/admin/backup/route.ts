import { NextResponse } from "next/server";
import { canExportLeads, isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { createAudit, mutateDB } from "@/lib/store";
import type { BankClubDB } from "@/lib/types";

const backupSchema = "bank-club-json-db-v1";
const restorePhrase = "RESTORE BANK CLUB DATA";

type BackupPayload = {
  schema?: string;
  exportedAt?: string;
  data?: BankClubDB;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function validateBackupPayload(value: unknown, actorId: string) {
  if (!isObject(value)) return "備份檔格式不正確";
  const payload = value as BackupPayload;
  if (payload.schema !== backupSchema) return "備份 schema 不符";
  if (!isObject(payload.data)) return "備份缺少 data";
  const data = payload.data as BankClubDB;
  if (!Array.isArray(data.users) || !Array.isArray(data.leads) || !Array.isArray(data.articles)) {
    return "備份缺少 users、leads 或 articles";
  }
  if (!Array.isArray(data.files) || !Array.isArray(data.events) || !Array.isArray(data.auditLogs)) {
    return "備份缺少 files、events 或 auditLogs";
  }
  if (!isObject(data.settings)) return "備份缺少 settings";
  if (!data.users.some((user) => user.role === "super_admin")) return "備份內沒有超級管理員";
  const actorInBackup = data.users.some((user) => user.id === actorId && user.role === "super_admin");
  if (!actorInBackup) return "備份內必須包含目前登入的超級管理員，避免還原後鎖定帳號";
  return "";
}

export async function GET(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user || !canExportLeads(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const backup = await mutateDB((db) => {
    db.auditLogs.unshift(createAudit(user.id, "database_backup_exported", "database", "bank-club-db"));
    return {
      exportedAt: new Date().toISOString(),
      exportedBy: { id: user.id, email: user.email },
      schema: backupSchema,
      data: db,
    };
  });

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="bank-club-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user || !canExportLeads(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    backup?: unknown;
    dryRun?: boolean;
    confirmText?: string;
  };
  const error = validateBackupPayload(body.backup, user.id);
  if (error) return NextResponse.json({ message: error }, { status: 400 });
  const payload = body.backup as BackupPayload;
  const data = payload.data as BankClubDB;
  const summary = {
    users: data.users.length,
    leads: data.leads.length,
    articles: data.articles.length,
    files: data.files.length,
    events: data.events.length,
    auditLogs: data.auditLogs.length,
    exportedAt: payload.exportedAt || "",
  };

  if (body.dryRun !== false) {
    await mutateDB((db) => {
      db.auditLogs.unshift(createAudit(user.id, "database_backup_restore_checked", "database", "bank-club-db"));
    });
    return NextResponse.json({ ok: true, dryRun: true, summary });
  }

  if (body.confirmText !== restorePhrase) {
    return NextResponse.json({ message: `請輸入確認短語：${restorePhrase}` }, { status: 400 });
  }

  await mutateDB((db) => {
    const restored = JSON.parse(JSON.stringify(data)) as BankClubDB;
    restored.auditLogs.unshift(createAudit(user.id, "database_backup_restored", "database", "bank-club-db"));
    Object.assign(db, restored);
  });

  return NextResponse.json({ ok: true, dryRun: false, summary });
}
