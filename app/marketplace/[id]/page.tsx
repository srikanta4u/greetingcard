import {
  DesignCustomizer,
  type DesignCustomizerDesign,
} from "@/components/marketplace/DesignCustomizer";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

function occasionPhrase(tags: unknown): string {
  if (!Array.isArray(tags)) return "";
  const labels = tags.filter(
    (t): t is string => typeof t === "string" && t.trim().length > 0,
  );
  if (labels.length === 0) return "";
  if (labels.length === 1) return ` Perfect for ${labels[0]}.`;
  return ` Great for ${labels.slice(0, 3).join(", ")}.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("designs")
    .select("title, front_image_url, tags_occasion")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  const title =
    typeof data?.title === "string" && data.title.trim()
      ? data.title.trim()
      : "Greeting card";

  const baseDescription = `Send a personalized ${title} greeting card. Choose your message, font, and color.${occasionPhrase(data?.tags_occasion)}`;

  const images =
    typeof data?.front_image_url === "string" && data.front_image_url.trim()
      ? [{ url: data.front_image_url.trim(), alt: title }]
      : undefined;

  return {
    title,
    description: baseDescription,
    openGraph: {
      title: `${title} | AutoCard`,
      description: baseDescription,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | AutoCard`,
      description: baseDescription,
      images: images?.map((i) => i.url),
    },
  };
}

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
    throw new Error(error.message || "Failed to load design");
  }
  if (!row) {
    notFound();
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
