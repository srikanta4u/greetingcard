"use client";

import dynamic from "next/dynamic";

const CreatorApplyForm = dynamic(() => import("./apply-form"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
    </div>
  ),
});

export default function CreatorApplyPage() {
  return <CreatorApplyForm />;
}
