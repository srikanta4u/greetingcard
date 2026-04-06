"use client";

import { useState } from "react";
import { FilterSidebar } from "./FilterSidebar";

export function MarketplaceFiltersCollapsible() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="marketplace-filters-panel"
        id="marketplace-filters-toggle"
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        Filters
        <span className="text-zinc-500" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>
      <div
        id="marketplace-filters-panel"
        role="region"
        aria-labelledby="marketplace-filters-toggle"
        className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
          open ? "max-h-[2000px]" : "max-h-0"
        }`}
      >
        {open ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <FilterSidebar />
          </div>
        ) : null}
      </div>
    </div>
  );
}
