import "server-only";

import type { AdminUser, Lead, SiteSettings } from "./types";

export type LeadNotificationResult = {
  status: Lead["notificationStatus"];
  error: string;
  notifiedAt: string;
};

async function sendNotificationWebhook(payload: Record<string, unknown>): Promise<LeadNotificationResult> {
  const webhook = process.env.NOTIFY_WEBHOOK_URL;
  const notifiedAt = new Date().toISOString();
  if (!webhook) {
    return { status: "not_configured", error: "", notifiedAt: "" };
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return {
      status: response.ok ? "sent" : "failed",
      error: response.ok ? "" : `Webhook HTTP ${response.status}`,
      notifiedAt,
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Webhook failed",
      notifiedAt,
    };
  }
}

function specialistPayload(settings: SiteSettings) {
  return {
    name: settings.specialistName,
    mobile: settings.mobile,
    email: settings.email,
  };
}

function adminLeadUrl(leadId: string) {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const origin = /^https?:\/\//.test(configuredOrigin) ? configuredOrigin : `https://${configuredOrigin}`;
  return `${origin.replace(/\/$/, "")}/admin?lead_id=${encodeURIComponent(leadId)}`;
}

export async function sendLeadNotification(lead: Lead, settings: SiteSettings): Promise<LeadNotificationResult> {
  return sendNotificationWebhook({
    event: "lead_created",
    lead: {
      id: lead.id,
      adminUrl: adminLeadUrl(lead.id),
      name: lead.name,
      phone: lead.phone,
      lineId: lead.lineId,
      loanType: lead.loanType,
      identityType: lead.identityType,
      desiredAmount: lead.desiredAmount,
      appointmentTime: lead.appointmentTime,
      sourcePage: lead.sourcePage,
      sourceChannel: lead.sourceChannel,
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      utmContent: lead.utmContent,
      utmTerm: lead.utmTerm,
      priority: lead.leadPriority,
      duplicateOf: lead.duplicateOf,
      createdAt: lead.createdAt,
    },
    specialist: specialistPayload(settings),
  });
}

export async function sendTestNotification(settings: SiteSettings, actor: AdminUser): Promise<LeadNotificationResult> {
  return sendNotificationWebhook({
    event: "notification_test",
    message: "銀行俱樂部後台通知測試",
    specialist: specialistPayload(settings),
    actor: {
      id: actor.id,
      name: actor.name,
      email: actor.email,
      role: actor.role,
    },
    createdAt: new Date().toISOString(),
  });
}
