import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

/** Default Supabase storage host (override via NEXT_PUBLIC_SUPABASE_URL). */
const SUPABASE_STORAGE_PATTERN = {
  protocol: "https" as const,
  hostname: "adjoxzerqqrmehxcpkwu.supabase.co",
  port: "",
  pathname: "/storage/v1/object/public/**",
};

const remotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [SUPABASE_STORAGE_PATTERN];

if (supabaseUrl) {
  try {
    const { protocol, hostname } = new URL(supabaseUrl);
    const proto =
      protocol === "https:"
        ? "https"
        : protocol === "http:"
          ? "http"
          : "https";
    if (!remotePatterns.some((p) => p.hostname === hostname)) {
      remotePatterns.push({
        protocol: proto,
        hostname,
        pathname: "/storage/v1/object/public/**",
      });
    }
  } catch {
    /* invalid URL */
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns,
  },
};

export default nextConfig;
