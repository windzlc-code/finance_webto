"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getTrackingSessionId } from "@/lib/tracking-session";

function referrerChannel(referrer: string) {
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

function referrerKeyword(referrer: string) {
  if (!referrer) return "";
  try {
    const params = new URL(referrer).searchParams;
    return params.get("q") || params.get("p") || params.get("query") || params.get("keyword") || "";
  } catch {
    return "";
  }
}

export function PageViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef("");

  useEffect(() => {
    const path = pathname || window.location.pathname || "/";
    const search = window.location.search;
    const trackKey = `${path}${search}`;
    const searchParams = new URLSearchParams(search);
    const sourceChannel = searchParams.get("utm_source") || searchParams.get("source_channel") || referrerChannel(document.referrer);
    const seoKeyword =
      searchParams.get("utm_term") ||
      searchParams.get("keyword") ||
      searchParams.get("q") ||
      referrerKeyword(document.referrer);
    const sessionId = getTrackingSessionId();

    if (lastTracked.current === trackKey) return;
    lastTracked.current = trackKey;

    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    gtag?.("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
      session_id: sessionId,
    });

    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventName: "page_view",
        pagePath: path,
        sessionId,
        sourceChannel,
        metadata: {
          search,
          referrer: document.referrer,
          sessionId,
          sourceChannel,
          utmSource: searchParams.get("utm_source") || "",
          utmMedium: searchParams.get("utm_medium") || "",
          utmCampaign: searchParams.get("utm_campaign") || "",
          utmContent: searchParams.get("utm_content") || "",
          utmTerm: searchParams.get("utm_term") || "",
          seoKeyword,
        },
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
