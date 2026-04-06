"use client";

import { usePathname } from "next/navigation";

/**
 * Renders the site footer on public/marketing routes only (not dashboard,
 * creator, admin, or auth flows).
 */
export function PublicFooterGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const hide =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/creator") ||
    pathname.startsWith("/auth");

  if (hide) return null;
  return <>{children}</>;
}
