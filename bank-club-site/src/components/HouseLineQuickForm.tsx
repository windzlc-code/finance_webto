"use client";

import { useState } from "react";
import { getTrackingSessionId } from "@/lib/tracking-session";

type Props = {
  lineHref: string;
};

function sourceFromReferrer(referrer: string) {
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

export function HouseLineQuickForm({ lineHref }: Props) {
  const [opening, setOpening] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpening(true);
    const data = new FormData(event.currentTarget);
    const sessionId = getTrackingSessionId();
    const metadata = {
      sourcePage: "house",
      sourceDetail: "property_quick_line",
      propertyRegion: String(data.get("propertyRegion") || "").trim(),
      propertyType: String(data.get("propertyType") || ""),
      estimatedPropertyValue: String(data.get("estimatedPropertyValue") || "").trim(),
      existingMortgage: String(data.get("existingMortgage") || ""),
      sessionId,
    };
    const referrer = document.referrer;
    await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventName: "house_line_property_click",
        pagePath: window.location.pathname,
        sessionId,
        sourceChannel: new URLSearchParams(window.location.search).get("utm_source") || sourceFromReferrer(referrer),
        metadata: {
          ...metadata,
          destination: lineHref,
        },
      }),
      keepalive: true,
    }).catch(() => undefined);

    if (lineHref.startsWith("http")) {
      window.open(lineHref, "_blank", "noopener,noreferrer");
      setOpening(false);
      return;
    }
    window.location.assign(lineHref);
  }

  return (
    <form className="form-section line-property-form" onSubmit={submit}>
      <div className="section-heading compact-heading">
        <h2>LINE 房產資料快速詢問</h2>
        <p>先留下房屋概況，再開啟 LINE 與專員討論；這裡不收權狀、身分證或財力文件。</p>
      </div>
      <div className="field-grid">
        <label>
          房屋地區
          <input name="propertyRegion" placeholder="例如：新北市中和區" />
        </label>
        <label>
          房屋類型
          <select name="propertyType" defaultValue="">
            <option value="">尚不確定</option>
            <option value="apartment">公寓</option>
            <option value="elevator">電梯大樓</option>
            <option value="townhouse">透天 / 別墅</option>
            <option value="factory">廠房 / 商辦</option>
          </select>
        </label>
        <label>
          預估市值
          <input name="estimatedPropertyValue" inputMode="numeric" placeholder="可留空，或填概估金額" />
        </label>
        <label>
          既有貸款
          <select name="existingMortgage" defaultValue="">
            <option value="">尚不確定</option>
            <option value="none">無既有房貸</option>
            <option value="has_mortgage">已有房貸</option>
            <option value="second_mortgage">已有二胎或其他設定</option>
          </select>
        </label>
      </div>
      <button className="primary-btn" type="submit" disabled={opening}>
        {opening ? "開啟中..." : "帶房產資料詢問 LINE"}
      </button>
    </form>
  );
}
