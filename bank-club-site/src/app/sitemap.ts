import type { MetadataRoute } from "next";
import { allowPublicIndexing, baseUrl } from "@/lib/site-data";
import { readDB } from "@/lib/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!allowPublicIndexing) {
    return [];
  }
  const pages = [
    "",
    "/credit-loan",
    "/house-loan",
    "/business-loan",
    "/loan-comparison",
    "/application-flow",
    "/qa",
    "/consultation",
    "/facebook",
    "/contact",
    "/blog",
    "/privacy",
    "/risk",
    "/terms",
    "/site-map",
  ];
  const db = await readDB();
  return [
    ...pages.map((path) => ({ url: `${baseUrl}${path}`, lastModified: new Date() })),
    ...db.articles
      .filter((article) => article.status === "published")
      .map((article) => ({ url: `${baseUrl}/blog/${article.slug}`, lastModified: new Date(article.updatedAt) })),
  ];
}
