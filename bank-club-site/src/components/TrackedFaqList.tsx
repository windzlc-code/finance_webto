"use client";

import Link from "next/link";
import { getTrackingSessionId } from "@/lib/tracking-session";

export type TrackedFaqItem = {
  id: string;
  question: string;
  answer: string;
  href: string;
};

type Props = {
  items: TrackedFaqItem[];
  eventName: string;
  sourcePage: string;
  defaultOpenId?: string;
};

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

export function TrackedFaqList({ items, eventName, sourcePage, defaultOpenId }: Props) {
  function trackToggle(item: TrackedFaqItem, open: boolean) {
    const sessionId = getTrackingSessionId();
    const sourceChannel = currentSourceChannel();
    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventName,
        pagePath: window.location.pathname,
        sessionId,
        sourceChannel,
        metadata: {
          faqId: item.id,
          question: item.question,
          state: open ? "open" : "closed",
          sourcePage,
          sessionId,
        },
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  return (
    <div className="faq-list">
      {items.map((item) => (
        <details
          key={item.id}
          open={item.id === defaultOpenId}
          onToggle={(event) => {
            if (!event.nativeEvent.isTrusted) return;
            trackToggle(item, event.currentTarget.open);
          }}
        >
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
          <Link className="text-link" href={item.href}>
            查看相關頁面 ›
          </Link>
        </details>
      ))}
    </div>
  );
}
