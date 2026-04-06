import type { MetadataRoute } from "next";

const BASE = "https://autocard.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date() },
    { url: `${BASE}/marketplace` },
    { url: `${BASE}/pricing` },
    { url: `${BASE}/auth/login` },
    { url: `${BASE}/auth/signup` },
    { url: `${BASE}/creator/apply` },
  ];
}
