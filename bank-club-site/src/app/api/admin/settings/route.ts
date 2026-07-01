import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { canManageAdminSettings, isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { createAudit, mutateDB, readDB } from "@/lib/store";
import type { SiteSettings } from "@/lib/types";

type StringSettingKey = Exclude<keyof SiteSettings, "launchReadiness">;
type LaunchReadinessBooleanKey = Exclude<keyof SiteSettings["launchReadiness"], "notes" | "updatedAt" | "updatedBy">;

const editableKeys: StringSettingKey[] = [
  "brandName",
  "companyName",
  "officeName",
  "specialistName",
  "specialistTitle",
  "address",
  "phone",
  "fax",
  "mobile",
  "email",
  "fbGroupUrl",
  "lineUrl",
  "lineQrCodeUrl",
  "officialApplyUrl",
  "gaMeasurementId",
  "googleSearchConsoleVerification",
];

const launchReadinessKeys: LaunchReadinessBooleanKey[] = [
  "domainHttpsConfirmed",
  "lineEntryConfirmed",
  "fbGroupConfirmed",
  "officialApplyConfirmed",
  "brandAuthorizationConfirmed",
  "ga4Confirmed",
  "searchConsoleConfirmed",
  "notificationWebhookConfirmed",
  "backupDrillConfirmed",
  "pageSpeedConfirmed",
  "legalReviewConfirmed",
];

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canManageAdminSettings(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const db = await readDB();
  return NextResponse.json({ settings: db.settings });
}

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user || !canManageAdminSettings(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as Partial<SiteSettings>;
  const settings = await mutateDB((db) => {
    for (const key of editableKeys) {
      if (typeof body[key] === "string") {
        db.settings[key] = body[key]!.trim();
      }
    }
    if (body.launchReadiness && typeof body.launchReadiness === "object") {
      for (const key of launchReadinessKeys) {
        db.settings.launchReadiness[key] = Boolean(body.launchReadiness[key]);
      }
      db.settings.launchReadiness.notes =
        typeof body.launchReadiness.notes === "string" ? body.launchReadiness.notes.trim() : "";
      db.settings.launchReadiness.updatedAt = new Date().toISOString();
      db.settings.launchReadiness.updatedBy = user.id;
    }
    db.auditLogs.unshift(createAudit(user.id, "settings_updated", "settings", "site"));
    return db.settings;
  });
  for (const path of ["/", "/contact", "/success"]) {
    revalidatePath(path);
  }

  return NextResponse.json({ settings });
}
