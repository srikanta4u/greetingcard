import { DesignCard, type MarketplaceDesign } from "@/components/marketplace/DesignCard";
import { FilterSidebar } from "@/components/marketplace/FilterSidebar";
import { SearchBar } from "@/components/marketplace/SearchBar";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Browse Greeting Cards | AutoCard Marketplace",
  description:
    "Discover unique greeting cards from independent creators. Filter by occasion, tone, and recipient.",
  openGraph: {
    title: "Browse Greeting Cards | AutoCard Marketplace",
    description:
      "Discover unique greeting cards from independent creators. Filter by occasion, tone, and recipient.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Greeting Cards | AutoCard Marketplace",
    description:
      "Unique cards for birthdays, anniversaries, thank-yous, and more.",
  },
};

const PAGE_SIZE = 24;

const OCCASIONS = new Set([
  "Birthday",
  "Anniversary",
  "Thank You",
  "Sympathy",
  "Holiday",
  "Congratulations",
  "Other",
]);
const TONES = new Set([
  "Funny",
  "Heartfelt",
  "Formal",
  "Playful",
  "Romantic",
]);
const RECIPIENTS = new Set([
  "Partner",
  "Friend",
  "Parent",
  "Child",
  "Colleague",
  "Anyone",
]);
const SORTS = new Set(["trending", "newest", "price_low", "price_high"]);

function normalizeSearchParams(
  raw: Record<string, string | string[] | undefined>,
) {
  const pick = (key: string) => {
    const v = raw[key];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    q: pick("q"),
    occasion: pick("occasion"),
    tone: pick("tone"),
    recipient: pick("recipient"),
    sort: pick("sort"),
    page: pick("page"),
  };
}

function sanitizeIlike(q: string) {
  return q.replace(/[%_\\]/g, "").trim();
}

type FetchResult = {
  designs: MarketplaceDesign[];
  count: number;
};

async function fetchMarketplaceDesigns(sp: {
  q?: string;
  occasion?: string;
  tone?: string;
  recipient?: string;
  sort?: string;
  page?: string;
}): Promise<FetchResult> {
  const supabase = await createClient();

  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const from = (pageNum - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("designs")
    .select(
      "id, title, front_image_url, base_price, creator_markup, total_sold, created_at",
      { count: "exact" },
    )
    .eq("status", "active");

  const qClean = sp.q ? sanitizeIlike(sp.q) : "";
  if (qClean) {
    query = query.ilike("title", `%${qClean}%`);
  }

  if (sp.occasion && OCCASIONS.has(sp.occasion)) {
    query = query.contains("tags_occasion", [sp.occasion]);
  }
  if (sp.tone && TONES.has(sp.tone)) {
    query = query.contains("tags_tone", [sp.tone]);
  }
  if (sp.recipient && RECIPIENTS.has(sp.recipient)) {
    query = query.contains("tags_recipient", [sp.recipient]);
  }

  const sort = sp.sort && SORTS.has(sp.sort) ? sp.sort : "newest";
  switch (sort) {
    case "trending":
      query = query.order("total_sold", {
        ascending: false,
        nullsFirst: false,
      });
      break;
    case "price_low":
      query = query
        .order("base_price", { ascending: true })
        .order("creator_markup", { ascending: true });
      break;
    case "price_high":
      query = query
        .order("base_price", { ascending: false })
        .order("creator_markup", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("[marketplace] fetch designs", error);
    return { designs: [], count: 0 };
  }

  const designs: MarketplaceDesign[] = (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    front_image_url: row.front_image_url as string,
    base_price: Number(row.base_price),
    creator_markup: Number(row.creator_markup),
  }));
  return { designs, count: count ?? 0 };
}

function buildPageHref(
  pageNum: number,
  current: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  if (current.q) params.set("q", current.q);
  if (current.occasion) params.set("occasion", current.occasion);
  if (current.tone) params.set("tone", current.tone);
  if (current.recipient) params.set("recipient", current.recipient);
  if (current.sort) params.set("sort", current.sort);
  if (pageNum > 1) params.set("page", String(pageNum));
  const qs = params.toString();
  return qs ? `/marketplace?${qs}` : "/marketplace";
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const sp = normalizeSearchParams(raw);
  const { designs, count } = await fetchMarketplaceDesigns(sp);

  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const sortForPagination =
    sp.sort && SORTS.has(sp.sort) && sp.sort !== "newest" ? sp.sort : undefined;
  const paginationBase = {
    q: sp.q,
    occasion: sp.occasion,
    tone: sp.tone,
    recipient: sp.recipient,
    sort: sortForPagination,
  };

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Marketplace
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Browse greeting cards from independent creators.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-12 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          }
        >
          <SearchBar />
        </Suspense>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="w-full shrink-0 lg:sticky lg:top-8 lg:w-64">
            <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />}>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <FilterSidebar />
              </div>
            </Suspense>
          </aside>

          <main className="min-w-0 flex-1">
            {designs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-8 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No cards found. Try different filters.
                </p>
              </div>
            ) : (
              <>
                {/* Each card links to /marketplace/[id] (see DesignCard href) */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {designs.map((d) => (
                    <DesignCard key={d.id} design={d} />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <nav
                    className="mt-10 flex items-center justify-center gap-4"
                    aria-label="Pagination"
                  >
                    {pageNum > 1 ? (
                      <Link
                        href={buildPageHref(pageNum - 1, paginationBase)}
                        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        Previous
                      </Link>
                    ) : (
                      <span className="rounded-lg border border-transparent px-4 py-2 text-sm text-zinc-400">
                        Previous
                      </span>
                    )}
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Page {pageNum} of {totalPages}
                    </span>
                    {pageNum < totalPages ? (
                      <Link
                        href={buildPageHref(pageNum + 1, paginationBase)}
                        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        Next
                      </Link>
                    ) : (
                      <span className="rounded-lg border border-transparent px-4 py-2 text-sm text-zinc-400">
                        Next
                      </span>
                    )}
                  </nav>
                ) : null}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
