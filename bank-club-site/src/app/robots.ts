import type { MetadataRoute } from "next";
import { allowPublicIndexing, baseUrl } from "@/lib/site-data";

export default function robots(): MetadataRoute.Robots {
  if (!allowPublicIndexing) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
