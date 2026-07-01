import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { mutateDB } from "@/lib/store";

const recentEvents = new Map<string, number[]>();
const rateLimitWindowMs = 60 * 1000;
const rateLimitMax = 120;
const maxStoredEvents = 5000;
const maxMetadataEntries = 20;

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function trimmed(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    eventName?: string;
    pagePath?: string;
    leadId?: string;
    sessionId?: string;
    sourceChannel?: string;
    metadata?: Record<string, string>;
  };

  const eventName = trimmed(body.eventName, 100);
  if (!eventName) {
    return NextResponse.json({ message: "eventName required" }, { status: 400 });
  }
  if (!/^[a-z0-9_.:-]+$/i.test(eventName)) {
    return NextResponse.json({ message: "eventName invalid" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const now = Date.now();
  const previousEvents = (recentEvents.get(ip) || []).filter((time) => now - time < rateLimitWindowMs);
  if (previousEvents.length >= rateLimitMax) {
    return NextResponse.json({ message: "events rate limited" }, { status: 429 });
  }
  recentEvents.set(ip, [...previousEvents, now]);

  const metadata = Object.fromEntries(
    Object.entries(body.metadata || {})
      .slice(0, maxMetadataEntries)
      .filter(([, value]) => typeof value === "string")
      .map(([key, value]) => [key.slice(0, 80), value.slice(0, 500)]),
  );
  const sourceChannel = trimmed(body.sourceChannel || metadata.sourceChannel || metadata.utmSource, 80);
  const sessionId = trimmed(body.sessionId || metadata.sessionId, 120);
  const pagePath = trimmed(body.pagePath, 400) || "/";
  const leadId = trimmed(body.leadId, 120);

  await mutateDB((db) => {
    db.events.unshift({
      id: randomUUID(),
      eventName,
      pagePath,
      leadId,
      sessionId,
      sourceChannel,
      metadata,
      createdAt: new Date().toISOString(),
    });
    if (db.events.length > maxStoredEvents) {
      db.events.splice(maxStoredEvents);
    }
    if (leadId && sessionId) {
      const lead = db.leads.find((item) => item.id === leadId && item.sessionId === sessionId);
      if (lead && eventName.toLowerCase().includes("line")) {
        lead.hasClickedLine = true;
        lead.updatedAt = new Date().toISOString();
      }
      if (lead && eventName.toLowerCase().includes("fb")) {
        lead.hasJoinedFb = true;
        lead.updatedAt = new Date().toISOString();
      }
    }
  });

  return NextResponse.json({ ok: true });
}
