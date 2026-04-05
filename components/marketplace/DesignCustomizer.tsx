"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type CustomizableZones = {
  message_text?: boolean;
  font?: boolean;
  accent_color?: boolean;
};

export type DesignCustomizerDesign = {
  id: string;
  title: string;
  front_image_url: string;
  back_image_url: string | null;
  base_price: number;
  creator_markup: number;
  customizable_zones: CustomizableZones | null;
};

const MESSAGE_MAX = 1500;
const WARN_THRESHOLD = 1400;

const PROFANITY = ["fuck", "shit", "ass", "bastard", "bitch"] as const;

const ACCENT_COLORS = [
  "#1a1a1a",
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
] as const;

const FONTS = [
  {
    id: "classic" as const,
    label: "Classic",
    subtitle: "serif",
    previewClass: "font-serif",
    previewStyle: { fontFamily: 'Georgia, "Times New Roman", serif' },
  },
  {
    id: "modern" as const,
    label: "Modern",
    subtitle: "sans-serif",
    previewClass: "font-sans",
    previewStyle: { fontFamily: "ui-sans-serif, system-ui, sans-serif" },
  },
  {
    id: "script" as const,
    label: "Script",
    subtitle: "cursive",
    previewClass: "font-serif",
    previewStyle: {
      fontFamily: '"Apple Chancery", "Brush Script MT", cursive',
    },
  },
];

function defaultZones(z: CustomizableZones | null): CustomizableZones {
  if (z && typeof z === "object") {
    return z;
  }
  return { message_text: true, font: true, accent_color: true };
}

function totalPrice(d: DesignCustomizerDesign) {
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

function hasProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY.some((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "i");
    return re.test(lower);
  });
}

export function DesignCustomizer({ design }: { design: DesignCustomizerDesign }) {
  const router = useRouter();
  const zones = defaultZones(design.customizable_zones);
  const showMessage = zones.message_text !== false;
  const showFont = zones.font === true;
  const showColor = zones.accent_color === true;

  const [showFront, setShowFront] = useState(true);
  const [message, setMessage] = useState("");
  const [fontId, setFontId] = useState<(typeof FONTS)[number]["id"]>("modern");
  const [accentColor, setAccentColor] = useState<string>(ACCENT_COLORS[0]);
  const [orderError, setOrderError] = useState<string | null>(null);

  const price = totalPrice(design);
  const fontDef = FONTS.find((f) => f.id === fontId) ?? FONTS[1];
  const previewFontStyle = fontDef.previewStyle;

  const charCount = message.length;
  const counterWarn = charCount > WARN_THRESHOLD;

  const displaySrc =
    showFront || !design.back_image_url
      ? design.front_image_url
      : design.back_image_url;

  const canToggleBack = Boolean(design.back_image_url);

  const handleAddToOrder = () => {
    setOrderError(null);

    if (showMessage) {
      if (!message.trim()) {
        setOrderError("Please write a message for your card.");
        return;
      }
      if (hasProfanity(message)) {
        setOrderError("Your message contains inappropriate content");
        return;
      }
    }

    const payload = {
      designId: design.id,
      designTitle: design.title,
      frontImageUrl: design.front_image_url,
      message: showMessage ? message.trim() : "",
      font: fontId,
      color: accentColor,
      price,
    };

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("pendingOrder", JSON.stringify(payload));
      }
    } catch {
      setOrderError("Could not save your order. Check storage settings.");
      return;
    }

    router.push("/checkout");
  };

  const overlayText = showMessage ? message : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <Link
        href="/marketplace"
        className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← Back to marketplace
      </Link>

      <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:gap-12">
        {/* Live preview */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Preview updates as you type
          </p>
          <div className="relative mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-md dark:border-zinc-800 dark:bg-zinc-950">
            <div className="relative aspect-[4/3] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element -- WYSIWYG preview per spec */}
              <img
                src={displaySrc}
                alt=""
                className="h-full w-full object-cover"
              />
              {showFront && showMessage ? (
                <div
                  className="pointer-events-none absolute left-1/2 w-[88%] max-w-lg -translate-x-1/2 px-2"
                  style={{ bottom: "15%" }}
                >
                  <div
                    className="rounded-lg px-3 py-2 text-center shadow-sm"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.85)",
                      ...previewFontStyle,
                      color: accentColor,
                    }}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-snug sm:text-base">
                      {overlayText || (
                        <span className="text-zinc-400">
                          Your message will appear here
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {canToggleBack ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowFront((v) => !v)}
                className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {showFront ? "Show back" : "Show front"}
              </button>
            </div>
          ) : null}
        </div>

        {/* Customization */}
        <div className="w-full shrink-0 lg:max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {design.title}
          </h1>
          <p className="mt-2 text-lg font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
            {formatMoney(price)}
          </p>

          <div className="mt-8 space-y-8">
            {showMessage ? (
              <div>
                <label
                  htmlFor="card-message"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Your message
                </label>
                <textarea
                  id="card-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={MESSAGE_MAX}
                  rows={6}
                  placeholder="Write your personal message here..."
                  className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                />
                <p
                  className={`mt-2 text-xs tabular-nums ${
                    counterWarn
                      ? "font-medium text-red-600 dark:text-red-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {charCount} / {MESSAGE_MAX}
                </p>
              </div>
            ) : null}

            {showFont ? (
              <fieldset>
                <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Font
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {FONTS.map((f) => {
                    const active = fontId === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFontId(f.id)}
                        className={`flex flex-col items-center rounded-xl border px-4 py-3 text-left transition ${
                          active
                            ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:ring-zinc-100"
                            : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                        }`}
                      >
                        <span
                          className={`text-lg text-zinc-900 dark:text-zinc-50 ${f.previewClass}`}
                          style={f.previewStyle}
                        >
                          Aa
                        </span>
                        <span className="mt-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {f.label}
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          ({f.subtitle})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            {showColor ? (
              <fieldset>
                <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Accent color
                </legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((c) => {
                    const active = accentColor === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Color ${c}`}
                        onClick={() => setAccentColor(c)}
                        className={`h-10 w-10 rounded-full border-2 shadow-sm transition ${
                          active
                            ? "border-zinc-900 ring-2 ring-zinc-900 ring-offset-2 dark:border-zinc-100 dark:ring-zinc-100 dark:ring-offset-zinc-950"
                            : "border-zinc-200 dark:border-zinc-600"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Total: {formatMoney(price)}
              </p>
              {orderError ? (
                <p
                  className="mt-3 text-sm font-medium text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {orderError}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleAddToOrder}
                className="mt-4 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
