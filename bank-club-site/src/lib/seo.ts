import type { Metadata } from "next";
import { baseUrl } from "./site-data";

const siteName = "銀行俱樂部";
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

export function createPageMetadata({ title, description, path, image = "/brand/bank_club_logo.png", noIndex }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
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
