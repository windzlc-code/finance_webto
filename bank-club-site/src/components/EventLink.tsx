"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { getTrackingSessionId } from "@/lib/tracking-session";

type Props = {
  href: string;
  eventName: string;
  className?: string;
  children: ReactNode;
  target?: string;
  metadata?: Record<string, string>;
  leadId?: string;
  confirmMessage?: string;
  ariaLabel?: string;
  prefetch?: boolean;
};

function isNativeNavigation(href: string) {
  return href.startsWith("http")
    || href.startsWith("tel:")
    || href.startsWith("mailto:")
    || href.startsWith("/tfse/")
    || href.startsWith("/admin/");
}

function currentSourceChannel() {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  if (utmSource) return utmSource;
  const referrer = document.referrer;
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("facebook") || host.includes("fb.")) return "facebook";
    if (host.includes("line.me") || host.includes("lin.ee")) return "line";
    if (["google.", "bing.", "yahoo.", "duckduckgo.", "baidu."].some((name) => host.includes(name))) return "seo";
    return "referral";
  } catch {
    return "referral";
  }
}

export function EventLink({ href, eventName, className, children, target, metadata, leadId, confirmMessage, ariaLabel, prefetch }: Props) {
  const nativeNavigation = isNativeNavigation(href);

  function track(event?: MouseEvent<HTMLAnchorElement>) {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      event?.preventDefault();
      return;
    }
    const sourceChannel = metadata?.sourceChannel || currentSourceChannel();
    const sessionId = getTrackingSessionId();
    const eventMetadata = {
      destination: href,
      sourceChannel,
      sessionId,
      ...metadata,
    };
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    gtag?.("event", eventName, {
      page_path: window.location.pathname,
      lead_id: leadId || undefined,
      session_id: sessionId,
      ...eventMetadata,
    });
    // Do not contend with the destination page for the file-backed event store
    // during an immediate cross-application navigation. Form and in-app events
    // continue to be recorded through the API below.
    if (nativeNavigation) return;
    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventName,
        pagePath: window.location.pathname,
        leadId: leadId || "",
        sessionId,
        sourceChannel,
        metadata: eventMetadata,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  if (nativeNavigation) {
    return (
      <a
        className={className}
        href={href}
        target={target}
        rel={target ? "noreferrer" : undefined}
        aria-label={ariaLabel}
        data-event-name={eventName}
        data-confirm-message={confirmMessage}
        onClick={track}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      className={className}
      href={href}
      target={target}
      rel={target ? "noreferrer" : undefined}
      aria-label={ariaLabel}
      data-event-name={eventName}
      data-confirm-message={confirmMessage}
      prefetch={prefetch}
      onClick={track}
    >
      {children}
    </Link>
  );
}
