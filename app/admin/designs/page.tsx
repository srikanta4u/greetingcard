import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminDesignActions } from "./design-actions";

const BASE_PRICE = 4.0;

type DesignRow = {
  id: string;
  title: string;
  front_image_url: string;
  back_image_url: string | null;
  creator_markup: number;
  base_price: number;
  tags_occasion: string[] | null;
  tags_tone: string[] | null;
  tags_recipient: string[] | null;
  created_at: string;
  creator_id: string;
};

type CreatorRow = {
  id: string;
  user_id: string;
};

type UserRow = {
  id: string;
  email: string | null;
};

function formatMoney(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function joinTags(parts: (string[] | null | undefined)[]) {
  const flat = parts.flatMap((p) => (Array.isArray(p) ? p : []));
  return flat.length ? flat.join(", ") : "—";
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/admin/designs");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return supabase;
}

export default async function AdminDesignsPage() {
  const supabase = await requireAdmin();

  const { data: designRows, error: designsError } = await supabase
    .from("designs")
    .select(
      "id, title, front_image_url, back_image_url, creator_markup, base_price, tags_occasion, tags_tone, tags_recipient, created_at, creator_id",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (designsError) {
    console.error("[admin/designs] fetch designs", designsError);
  }

  const designs = (designRows ?? []) as DesignRow[];
  const creatorIds = [...new Set(designs.map((d) => d.creator_id))];

  let creatorIdToName = new Map<string, string>();

  if (creatorIds.length > 0) {
    const { data: creatorsData } = await supabase
      .from("creators")
      .select("id, user_id")
      .in("id", creatorIds);

    const creators = (creatorsData ?? []) as CreatorRow[];
    const userIds = [...new Set(creators.map((c) => c.user_id))];

    let users: UserRow[] = [];
    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, email")
        .in("id", userIds);
      users = (usersData ?? []) as UserRow[];
    }

    const userIdToName = new Map(
      users.map((u) => [u.id, u.email?.trim() || "Creator"]),
    );
    creatorIdToName = new Map(
      creators.map((c) => [c.id, userIdToName.get(c.user_id) ?? "Creator"]),
    );
  }

  const count = designs.length;

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/admin"
            className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Admin
          </Link>
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Design queue
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Design approval queue
        </h1>
        <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {count === 1
            ? "1 design pending review"
            : `${count} designs pending review`}
        </p>

        {count === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-zinc-300 bg-white px-8 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No designs pending review
            </p>
          </div>
        ) : (
          <ul className="mt-10 space-y-10">
            {designs.map((d) => {
              const base = Number(d.base_price) || BASE_PRICE;
              const markup = Number(d.creator_markup);
              const finalPrice = base + markup;
              const creatorName = creatorIdToName.get(d.creator_id) ?? "Creator";

              return (
                <li
                  key={d.id}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="grid gap-4 p-4 md:grid-cols-2 md:gap-6 md:p-6">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Front
                      </p>
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-950">
                        <Image
                          src={d.front_image_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Back
                      </p>
                      {d.back_image_url ? (
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-950">
                          <Image
                            src={d.back_image_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          No back image
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 px-4 py-5 dark:border-zinc-800 md:px-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {d.title}
                    </h2>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-zinc-500 dark:text-zinc-400">
                          Creator
                        </dt>
                        <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                          {creatorName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500 dark:text-zinc-400">
                          Submitted
                        </dt>
                        <dd className="text-zinc-900 dark:text-zinc-100">
                          {formatDate(d.created_at)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500 dark:text-zinc-400">
                          Creator markup
                        </dt>
                        <dd className="tabular-nums text-zinc-900 dark:text-zinc-100">
                          {formatMoney(markup)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500 dark:text-zinc-400">
                          Final price (base + markup)
                        </dt>
                        <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                          {formatMoney(finalPrice)}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-zinc-500 dark:text-zinc-400">
                          Tags
                        </dt>
                        <dd className="text-zinc-900 dark:text-zinc-100">
                          {joinTags([
                            d.tags_occasion,
                            d.tags_tone,
                            d.tags_recipient,
                          ])}
                        </dd>
                      </div>
                    </dl>

                    <AdminDesignActions designId={d.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
