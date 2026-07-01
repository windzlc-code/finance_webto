import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { createAudit, hashPassword, mutateDB, readDB } from "@/lib/store";
import type { AdminUser, UserRole } from "@/lib/types";

const roles: UserRole[] = ["super_admin", "specialist", "content", "readonly"];

function publicUser(user: AdminUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    lineId: user.lineId,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt,
  };
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const user = await requireAdmin();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const db = await readDB();
  return NextResponse.json({ users: db.users.map(publicUser) });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as Partial<AdminUser> & { password?: string };
  const name = text(body.name);
  const email = text(body.email).toLowerCase();
  const role = body.role && roles.includes(body.role) ? body.role : "readonly";
  const password = text(body.password);
  if (!name || !email || !password) {
    return NextResponse.json({ message: "請輸入姓名、Email 與初始密碼" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Email 格式不正確" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ message: "密碼至少需要 8 碼" }, { status: 400 });
  }

  const created = await mutateDB((db) => {
    if (db.users.some((item) => item.email.toLowerCase() === email)) return "duplicate";
    const now = new Date().toISOString();
    const item: AdminUser = {
      id: randomUUID(),
      name,
      email,
      role,
      phone: text(body.phone),
      lineId: text(body.lineId),
      passwordHash: hashPassword(password),
      twoFactorEnabled: false,
      twoFactorSecret: "",
      twoFactorConfirmedAt: "",
      createdAt: now,
    };
    db.users.push(item);
    db.auditLogs.unshift(createAudit(user.id, "user_created", "user", item.id));
    return item;
  });

  if (created === "duplicate") {
    return NextResponse.json({ message: "此 Email 已存在" }, { status: 409 });
  }
  return NextResponse.json({ user: publicUser(created) });
}
