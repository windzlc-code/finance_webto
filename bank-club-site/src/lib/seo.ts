import type { Metadata } from "next";
import { allowPublicIndexing, baseUrl } from "./site-data";

const siteName = "銀行行員俱樂部";
const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
};

export function absoluteUrl(path: string) {
  return `${normalizedBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function createPageMetadata({ title, description, path, image = "/brand/bank_club_hero.png", noIndex }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const blockIndexing = noIndex || !allowPublicIndexing;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: blockIndexing
      ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true, "max-snippet": -1 } }
      : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "website",
      images: [{ url: image, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function breadcrumbItems(current: string, path: string) {
  return [
    { name: siteName, url: absoluteUrl("/") },
    { name: current, url: absoluteUrl(path) },
  ];
}
