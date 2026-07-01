import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { createAudit, hashPassword, mutateDB } from "@/lib/store";
import type { AdminUser, UserRole } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const actor = await requireAdmin();
  if (!actor || actor.role !== "super_admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Partial<AdminUser> & { password?: string };
  const password = text(body.password);
  if (password && password.length < 8) {
    return NextResponse.json({ message: "密碼至少需要 8 碼" }, { status: 400 });
  }
  if (body.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(body.email))) {
    return NextResponse.json({ message: "Email 格式不正確" }, { status: 400 });
  }

  const updated = await mutateDB((db) => {
    const item = db.users.find((entry) => entry.id === id);
    if (!item) return null;
    const nextRole = body.role && roles.includes(body.role) ? body.role : item.role;
    const nextEmail = body.email !== undefined ? text(body.email).toLowerCase() : item.email;
    if (db.users.some((entry) => entry.id !== id && entry.email.toLowerCase() === nextEmail)) {
      return "duplicate";
    }
    if (item.role === "super_admin" && nextRole !== "super_admin") {
      const superAdminCount = db.users.filter((entry) => entry.role === "super_admin").length;
      if (superAdminCount <= 1) return "last_super_admin";
    }
    if (body.name !== undefined) item.name = text(body.name) || item.name;
    item.email = nextEmail;
    item.role = nextRole;
    if (body.phone !== undefined) item.phone = text(body.phone);
    if (body.lineId !== undefined) item.lineId = text(body.lineId);
    if (password) item.passwordHash = hashPassword(password);
    db.auditLogs.unshift(createAudit(actor.id, password ? "user_password_reset" : "user_updated", "user", id));
    return item;
  });

  if (updated === "duplicate") return NextResponse.json({ message: "此 Email 已存在" }, { status: 409 });
  if (updated === "last_super_admin") return NextResponse.json({ message: "不能移除最後一位超級管理員" }, { status: 400 });
  if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ user: publicUser(updated) });
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const actor = await requireAdmin();
  if (!actor || actor.role !== "super_admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (id === actor.id) {
    return NextResponse.json({ message: "不能刪除目前登入的帳號" }, { status: 400 });
  }

  const deleted = await mutateDB((db) => {
    const item = db.users.find((entry) => entry.id === id);
    if (!item) return null;
    if (item.role === "super_admin" && db.users.filter((entry) => entry.role === "super_admin").length <= 1) {
      return "last_super_admin";
    }
    db.users = db.users.filter((entry) => entry.id !== id);
    const reassignedAt = new Date().toISOString();
    for (const lead of db.leads) {
      if (lead.assignedTo === id) {
        db.leadAssignments.unshift({
          id: randomUUID(),
          leadId: lead.id,
          fromUserId: id,
          toUserId: actor.id,
          actorId: actor.id,
          reason: "assignee_deleted",
          createdAt: reassignedAt,
        });
        lead.assignedTo = actor.id;
        lead.updatedAt = reassignedAt;
      }
    }
    db.auditLogs.unshift(createAudit(actor.id, "user_deleted", "user", id));
    return true;
  });

  if (deleted === "last_super_admin") return NextResponse.json({ message: "不能刪除最後一位超級管理員" }, { status: 400 });
  if (!deleted) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
