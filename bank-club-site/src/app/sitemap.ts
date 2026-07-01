import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/site-data";
import { readDB } from "@/lib/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [
    "",
    "/credit-loan",
    "/house-loan",
    "/business-loan",
    "/application-flow",
    "/documents",
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
