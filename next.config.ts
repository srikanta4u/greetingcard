import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

/** Default Supabase storage host (override via NEXT_PUBLIC_SUPABASE_URL). */
const SUPABASE_STORAGE_PATTERN = {
  protocol: "https" as const,
  hostname: "adjoxzerqqrmehxcpkwu.supabase.co",
  port: "",
  pathname: "/storage/v1/object/public/**",
};

const PLACEHOLDER_PATTERN = {
  protocol: "https" as const,
  hostname: "via.placeholder.com",
  port: "",
  pathname: "/**",
};

const remotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [SUPABASE_STORAGE_PATTERN, PLACEHOLDER_PATTERN];

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
  async redirects() {
    return [
      { source: "/login", destination: "/auth/login", permanent: true },
      { source: "/signup", destination: "/auth/signup", permanent: true },
    ];
  },
};

export default nextConfig;
