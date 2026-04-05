"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";

  const [value, setValue] = useState(qParam);

  useEffect(() => {
    setValue(qParam);
  }, [qParam]);

  useEffect(() => {
    if (value.trim() === qParam.trim()) {
      return;
    }
    const id = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, 300);
    return () => clearTimeout(id);
  }, [value, qParam, pathname, router, searchParams]);

  return (
    <div className="w-full">
      <label htmlFor="marketplace-search" className="sr-only">
        Search cards
      </label>
      <input
        id="marketplace-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by title…"
        autoComplete="off"
        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/20"
      />
    </div>
  );
}
