import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Become a Creator",
  description:
    "Sell your greeting card designs on AutoCard. Earn 60% on every card sold.",
};

export default function CreatorApplyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
