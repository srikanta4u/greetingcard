import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/creator/dashboard"],
    },
    sitemap: "https://autocard.com/sitemap.xml",
  };
}
