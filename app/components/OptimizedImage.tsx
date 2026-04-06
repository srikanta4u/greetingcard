"use client";

import Image from "next/image";
import { useState } from "react";

export type OptimizedImageProps = {
  src: string;
  alt: string;
  className?: string;
  /** Extra classes on the outer wrapper (positioning, e.g. `absolute inset-0`) */
  containerClassName?: string;
  /** Fill parent; parent must be `relative` with defined size */
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  /** Set true for blob: URLs or local previews */
  unoptimized?: boolean;
};

function cx(...parts: (string | undefined | false)[]) {
  return parts.filter(Boolean).join(" ");
}

export function OptimizedImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  fill = true,
  width,
  height,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  unoptimized = false,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src?.trim() || error) {
    return (
      <div
        className={cx(
          "flex items-center justify-center bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600",
          fill ? "absolute inset-0 h-full w-full" : "",
          className,
          containerClassName,
        )}
        role="img"
        aria-label={alt || "Image unavailable"}
      >
        <span className="text-xs font-medium">No image</span>
      </div>
    );
  }

  if (fill) {
    return (
      <div
        className={cx(
          "relative h-full w-full min-h-0 overflow-hidden bg-zinc-100 dark:bg-zinc-950",
          containerClassName,
        )}
      >
        {!loaded ? (
          <div
            className="absolute inset-0 z-[1] animate-pulse bg-zinc-200 dark:bg-zinc-800"
            aria-hidden
          />
        ) : null}
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized}
          className={cx(
            "object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  if (width == null || height == null) {
    throw new Error("OptimizedImage: width and height are required when fill is false");
  }

  return (
    <div
      className={cx(
        "relative inline-block overflow-hidden bg-zinc-100 dark:bg-zinc-950",
        containerClassName,
      )}
      style={{ width, height }}
    >
      {!loaded ? (
        <div
          className="absolute inset-0 z-[1] animate-pulse bg-zinc-200 dark:bg-zinc-800"
          aria-hidden
        />
      ) : null}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
        className={cx(
          "object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
