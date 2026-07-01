import type { ReactNode } from "react";
import { EventLink } from "./EventLink";

export const officialApplyConfirmMessage =
  "即將前往銀行官方申請頁面。請依真實需求填寫資料，不要任意返回上一頁或重複刷新；實際審核、額度、利率與撥款結果以銀行為準。是否繼續？";

type Props = {
  href: string;
  className?: string;
  eventName?: string;
  children?: ReactNode;
  metadata?: Record<string, string>;
};

export function OfficialApplyLink({
  href,
  className = "outline-link",
  eventName = "official_apply_click",
  children = "即將前往銀行官方申請頁面",
  metadata,
}: Props) {
  return (
    <EventLink
      className={className}
      href={href}
      eventName={eventName}
      target="_blank"
      confirmMessage={officialApplyConfirmMessage}
      metadata={{ linkType: "official_apply", ...metadata }}
    >
      {children}
    </EventLink>
  );
}
