import { NextResponse } from "next/server";
import { materialAssets } from "@/lib/material-assets";

type Params = { params: Promise<{ asset: string }> };

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function assetSlug(value: string) {
  return value.endsWith(".svg") ? value.slice(0, -4) : value;
}

function renderSvg(asset: (typeof materialAssets)[number]) {
  const points = asset.points
    .slice(0, 5)
    .map((point, index) => {
      const y = 362 + index * 64;
      return `
        <g>
          <circle cx="108" cy="${y - 10}" r="19" fill="${asset.accent}" opacity="0.14"/>
          <text x="108" y="${y - 3}" text-anchor="middle" class="num">${index + 1}</text>
          <text x="148" y="${y}" class="point">${escapeXml(point)}</text>
        </g>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(asset.title)}</title>
  <desc id="desc">${escapeXml(asset.subtitle)}</desc>
  <style>
    .eyebrow { font: 700 30px Arial, "Noto Sans TC", sans-serif; letter-spacing: 2px; fill: ${asset.accent}; }
    .title { font: 800 66px Arial, "Noto Sans TC", sans-serif; fill: #10251d; }
    .subtitle { font: 500 34px Arial, "Noto Sans TC", sans-serif; fill: #42544e; }
    .point { font: 650 36px Arial, "Noto Sans TC", sans-serif; fill: #142a22; }
    .num { font: 800 22px Arial, "Noto Sans TC", sans-serif; fill: ${asset.accent}; }
    .fine { font: 500 23px Arial, "Noto Sans TC", sans-serif; fill: #68766f; }
  </style>
  <rect width="1080" height="1080" rx="0" fill="${asset.bg}"/>
  <rect x="58" y="58" width="964" height="964" rx="42" fill="#ffffff" stroke="${asset.accent}" stroke-opacity="0.16" stroke-width="2"/>
  <circle cx="894" cy="174" r="88" fill="${asset.accent}" opacity="0.11"/>
  <path d="M776 188 C832 112 918 108 974 158" fill="none" stroke="${asset.accent}" stroke-opacity="0.22" stroke-width="24" stroke-linecap="round"/>
  <text x="96" y="151" class="eyebrow">${escapeXml(asset.eyebrow)}</text>
  <text x="96" y="253" class="title">${escapeXml(asset.title)}</text>
  <text x="96" y="311" class="subtitle">${escapeXml(asset.subtitle)}</text>
  <line x1="96" y1="344" x2="984" y2="344" stroke="${asset.accent}" stroke-opacity="0.18" stroke-width="2"/>
  ${points}
  <rect x="96" y="890" width="888" height="92" rx="28" fill="${asset.accent}" opacity="0.09"/>
  <text x="126" y="932" class="fine">銀行俱樂部提供貸款諮詢與文件整理，非銀行或金融機構。</text>
  <text x="126" y="965" class="fine">實際核准、額度、利率、年限與撥款結果以銀行最終審核為準。</text>
</svg>`;
}

export async function GET(_: Request, { params }: Params) {
  const { asset } = await params;
  const item = materialAssets.find((entry) => entry.slug === assetSlug(asset));
  if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return new NextResponse(renderSvg(item), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
