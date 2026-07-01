import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { readDB } from "./store";
import type { AdminUser, Lead, UserRole } from "./types";

const COOKIE = "bank_club_session";

function secret() {
  return process.env.AUTH_SECRET || "bank-club-local-dev-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function createSessionValue(userId: string) {
  const payload = JSON.stringify({ userId, exp: Date.now() + 1000 * 60 * 60 * 10 });
  const body = Buffer.from(payload).toString("base64url");
  return `${body}.${sign(body)}`;
}

export async function getSessionUser(): Promise<AdminUser | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      userId: string;
      exp: number;
    };
    if (payload.exp < Date.now()) return null;
    const db = await readDB();
    return db.users.find((user) => user.id === payload.userId) || null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    name: COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 10,
  };
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }
  return user;
}

export function hasRole(user: AdminUser, roles: UserRole[]) {
  return roles.includes(user.role);
}

export function canManageContent(user: AdminUser) {
  return hasRole(user, ["super_admin", "content"]);
}

export function canManageAdminSettings(user: AdminUser) {
  return user.role === "super_admin";
}

export function canViewAuditLogs(user: AdminUser) {
  return user.role === "super_admin";
}

export function canRunLaunchChecklist(user: AdminUser) {
  return user.role === "super_admin";
}

export function canViewLead(user: AdminUser, lead: Lead) {
  return user.role === "super_admin" || (user.role === "specialist" && lead.assignedTo === user.id);
}

export function canUpdateLead(user: AdminUser, lead: Lead) {
  return canViewLead(user, lead);
}

export function canExportLeads(user: AdminUser) {
  return user.role === "super_admin";
}

export function isSameOriginRequest(request: Request) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return false;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  return false;
}
