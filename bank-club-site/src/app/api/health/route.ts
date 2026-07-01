import { NextResponse } from "next/server";
import { readDB } from "@/lib/store";

export async function GET() {
  try {
    const db = await readDB();
    const criticalSettings = [
      db.settings.brandName,
      db.settings.specialistName,
      db.settings.mobile,
      db.settings.email,
      db.settings.fbGroupUrl,
      db.settings.lineUrl,
      db.settings.lineQrCodeUrl,
    ];
    const ready = criticalSettings.every(Boolean) && db.users.length > 0;
    const publicFiles = db.files.filter((file) => file.visibility === "public").length;

    return NextResponse.json(
      {
        ok: ready,
        timestamp: new Date().toISOString(),
        checks: {
          storage: "ok",
          adminUsers: db.users.length,
          publishedArticles: db.articles.filter((article) => article.status === "published").length,
          publicFiles,
          criticalSettings: ready ? "ok" : "missing",
        },
      },
      { status: ready ? 200 : 503, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "health check failed",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
