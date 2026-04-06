import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type RouteContext = { params: Promise<{ id: string }> };

export default async function CreatorDesignEditPage({ params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectTo=/creator/designs/${id}/edit`);
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!creator) {
    redirect("/creator/apply");
  }

  const { data: design } = await supabase
    .from("designs")
    .select("id, title, creator_id")
    .eq("id", id)
    .maybeSingle();

  if (!design || design.creator_id !== creator.id) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Design not found.
        </p>
        <Link
          href="/creator/designs"
          className="mt-4 inline-block text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          Back to designs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/creator/designs"
            className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            ← Designs
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Edit design
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Placeholder — full editor coming soon.{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {design.title}
          </span>
        </p>
      </main>
    </div>
  );
}
