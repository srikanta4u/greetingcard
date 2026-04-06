import { OptimizedImage } from "@/app/components/OptimizedImage";
import Link from "next/link";

export type MarketplaceDesign = {
  id: string;
  title: string;
  front_image_url: string;
  base_price: number;
  creator_markup: number;
};

function finalPrice(d: MarketplaceDesign) {
  return Number(d.base_price) + Number(d.creator_markup);
}

function formatMoney(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function DesignCard({
  design,
  priority = false,
}: {
  design: MarketplaceDesign;
  priority?: boolean;
}) {
  const price = finalPrice(design);

  return (
    <Link
      href={`/marketplace/${design.id}`}
      className="group block min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition duration-200 ease-out hover:scale-[1.02] hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        <OptimizedImage
          src={design.front_image_url}
          alt={design.title}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          containerClassName="absolute inset-0"
          className="transition duration-200 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-3 sm:p-4">
        <h2 className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
          {design.title}
        </h2>
        <p className="mt-2 text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
          {formatMoney(price)}
        </p>
      </div>
    </Link>
  );
}
