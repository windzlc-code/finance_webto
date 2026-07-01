import { NextResponse } from "next/server";
import { isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { createAudit, mutateDB } from "@/lib/store";
import { createTotpUri, generateTotpSecret, verifyTotp } from "@/lib/totp";

type TwoFactorBody = {
  action?: "prepare" | "enable" | "disable";
  token?: string;
};

function publicTwoFactorState(user: {
  email: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
  twoFactorConfirmedAt: string;
}) {
  return {
    enabled: user.twoFactorEnabled,
    confirmedAt: user.twoFactorConfirmedAt,
    hasPendingSecret: Boolean(user.twoFactorSecret && !user.twoFactorEnabled),
    setupUri: user.twoFactorEnabled || !user.twoFactorSecret ? "" : createTotpUri(user.twoFactorSecret, user.email),
    secret: user.twoFactorEnabled ? "" : user.twoFactorSecret,
  };
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ twoFactor: publicTwoFactorState(user) });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as TwoFactorBody;
  const action = body.action || "prepare";

  const result = await mutateDB((db) => {
    const item = db.users.find((entry) => entry.id === user.id);
    if (!item) return null;

    if (action === "prepare") {
      if (!item.twoFactorEnabled) {
        item.twoFactorSecret = generateTotpSecret();
        item.twoFactorConfirmedAt = "";
        db.auditLogs.unshift(createAudit(user.id, "two_factor_prepare", "user", item.id));
      }
      return { state: publicTwoFactorState(item) };
    }

    if (action === "enable") {
      const secret = item.twoFactorSecret || generateTotpSecret();
      if (!verifyTotp(secret, body.token || "")) return "invalid-token";
      item.twoFactorSecret = secret;
      item.twoFactorEnabled = true;
      item.twoFactorConfirmedAt = new Date().toISOString();
      db.auditLogs.unshift(createAudit(user.id, "two_factor_enabled", "user", item.id));
      return { state: publicTwoFactorState(item) };
    }

    if (action === "disable") {
      if (item.twoFactorEnabled && !verifyTotp(item.twoFactorSecret, body.token || "")) return "invalid-token";
      item.twoFactorEnabled = false;
      item.twoFactorSecret = "";
      item.twoFactorConfirmedAt = "";
      db.auditLogs.unshift(createAudit(user.id, "two_factor_disabled", "user", item.id));
      return { state: publicTwoFactorState(item) };
    }

    return "invalid-action";
  });

  if (result === "invalid-token") return NextResponse.json({ message: "驗證碼不正確" }, { status: 400 });
  if (result === "invalid-action") return NextResponse.json({ message: "未知的 2FA 動作" }, { status: 400 });
  if (!result) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ twoFactor: result.state });
}
