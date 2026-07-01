"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { getTrackingSessionId } from "@/lib/tracking-session";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

function withSessionId(href: string) {
  if (typeof window === "undefined") return href;
  const sessionId = getTrackingSessionId();
  if (!sessionId) return href;
  const url = new URL(href, window.location.origin);
  url.searchParams.set("session_id", sessionId);
  return `${url.pathname}${url.search}`;
}

export function SessionDownloadLink({ href, className, children }: Props) {
  const initialHref = useMemo(() => href, [href]);

  return (
    <a className={className} href={initialHref} onClick={(event) => {
      event.currentTarget.href = withSessionId(href);
    }}>
      {children}
    </a>
  );
}
