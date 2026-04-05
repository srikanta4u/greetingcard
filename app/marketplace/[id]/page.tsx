import {
  DesignCustomizer,
  type DesignCustomizerDesign,
} from "@/components/marketplace/DesignCustomizer";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function MarketplaceDesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("designs")
    .select(
      "id, title, front_image_url, back_image_url, base_price, creator_markup, customizable_zones",
    )
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("[marketplace/[id]] fetch design", error);
  }
  if (!row) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Design not found
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This design may have been removed or is no longer available.
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

  const design: DesignCustomizerDesign = {
    id: row.id as string,
    title: row.title as string,
    front_image_url: row.front_image_url as string,
    back_image_url: (row.back_image_url as string | null) ?? null,
    base_price: Number(row.base_price),
    creator_markup: Number(row.creator_markup),
    customizable_zones:
      row.customizable_zones &&
      typeof row.customizable_zones === "object" &&
      !Array.isArray(row.customizable_zones)
        ? (row.customizable_zones as DesignCustomizerDesign["customizable_zones"])
        : null,
  };

  return <DesignCustomizer design={design} />;
}
