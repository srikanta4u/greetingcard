"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the root app bar on routes that provide their own full navigation
 * (dashboard, creator, admin) to avoid duplicate headers.
 */
export function RootNavGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const hide =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/creator");

  if (hide) return null;
  return <>{children}</>;
}
