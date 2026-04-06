"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the root marketing/app bar on routes that provide their own full navigation.
 */
export function RootNavGate({
  hasUser,
  children,
}: {
  hasUser: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const hide =
    hasUser &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/creator"));

  if (hide) return null;
  return <>{children}</>;
}
