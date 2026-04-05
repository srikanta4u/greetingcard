import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let remotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [];

if (supabaseUrl) {
  try {
    const { protocol, hostname } = new URL(supabaseUrl);
    const proto =
      protocol === "https:" ? "https" : protocol === "http:" ? "http" : "https";
    remotePatterns = [
      {
        protocol: proto,
        hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    /* invalid URL */
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
