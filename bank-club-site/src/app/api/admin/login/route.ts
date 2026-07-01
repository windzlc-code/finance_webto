import { NextResponse } from "next/server";
import { createSessionValue, isSameOriginRequest, sessionCookieOptions } from "@/lib/auth";
import { hashPassword, mutateDB, passwordHashNeedsUpgrade, readDB, verifyPassword } from "@/lib/store";
import { verifyTotp } from "@/lib/totp";

const failedLogins = new Map<string, number[]>();
const loginWindowMs = 15 * 60 * 1000;
const maxFailedAttempts = 5;

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function loginKey(request: Request, email?: string) {
  return `${getClientIp(request)}:${(email || "password-only").toLowerCase()}`;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string; twoFactorToken?: string } | null;
  if (!body?.password) {
    return NextResponse.json({ message: "請輸入後台密碼" }, { status: 400 });
  }
  const key = loginKey(request, body.email);
  const now = Date.now();
  const attempts = (failedLogins.get(key) || []).filter((time) => now - time < loginWindowMs);
  if (attempts.length >= maxFailedAttempts) {
    return NextResponse.json({ message: "登入嘗試過多，請稍後再試" }, { status: 429 });
  }

  const db = await readDB();
  const user = body.email
    ? db.users.find((item) => item.email.toLowerCase() === body.email!.toLowerCase())
    : db.users.find((item) => item.role === "super_admin") || db.users[0];
  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    failedLogins.set(key, [...attempts, now]);
    return NextResponse.json({ message: "密碼不正確" }, { status: 401 });
  }
  if (body.email && user.twoFactorEnabled && !verifyTotp(user.twoFactorSecret, body.twoFactorToken || "")) {
    failedLogins.set(key, [...attempts, now]);
    return NextResponse.json(
      { message: "請輸入正確的二階段驗證碼", requiresTwoFactor: true },
      { status: 401 },
    );
  }
  failedLogins.delete(key);
  if (passwordHashNeedsUpgrade(user.passwordHash)) {
    await mutateDB((nextDB) => {
      const item = nextDB.users.find((entry) => entry.id === user.id);
      if (item) item.passwordHash = hashPassword(body.password!);
    });
  }

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, twoFactorEnabled: user.twoFactorEnabled },
  });
  response.cookies.set({ ...sessionCookieOptions(), value: createSessionValue(user.id) });
  return response;
}
