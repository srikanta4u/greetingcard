import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function MarketplaceDesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: design } = await supabase
    .from("designs")
    .select("id, title, status")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (!design) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {design.title}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Design detail and checkout will appear here soon.
      </p>
      <Link
        href="/marketplace"
        className="mt-8 inline-block text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
      >
        ← Back to marketplace
      </Link>
    </div>
  );
}
