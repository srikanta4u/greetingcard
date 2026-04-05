"use client";

import { useState } from "react";

export type StandardizedAddress = {
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

type Props = {
  onSave: (address: StandardizedAddress) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "IN", label: "India" },
] as const;

function formatAddressForDisplay(a: StandardizedAddress) {
  const line2 = a.address_line2 ? `, ${a.address_line2}` : "";
  return `${a.address_line1}${line2}, ${a.city}, ${a.state} ${a.postal_code}, ${a.country}`;
}

export function AddressForm({ onSave, onCancel, submitLabel }: Props) {
  const [address_line1, setAddress_line1] = useState("");
  const [address_line2, setAddress_line2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal_code, setPostal_code] = useState("");
  const [country, setCountry] = useState<string>("US");

  const [inlineError, setInlineError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingStandardized, setPendingStandardized] =
    useState<StandardizedAddress | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInlineError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/validate-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address_line1,
          address_line2: address_line2.trim() || undefined,
          city,
          state,
          postal_code,
          country,
        }),
      });
      const data = (await res.json()) as
        | { valid: true; standardized: StandardizedAddress }
        | { valid: false; error?: string };

      if (!data.valid) {
        setInlineError(data.error ?? "Invalid address");
        return;
      }
      setPendingStandardized(data.standardized);
    } catch {
      setInlineError("Could not validate address. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleConfirmSave() {
    if (pendingStandardized) {
      onSave(pendingStandardized);
      setPendingStandardized(null);
    }
  }

  function handleEditAddress() {
    setPendingStandardized(null);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {inlineError ? (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {inlineError}
          </p>
        ) : null}

        <div>
          <label
            htmlFor="addr-line1"
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Address line 1
          </label>
          <input
            id="addr-line1"
            required
            value={address_line1}
            onChange={(e) => setAddress_line1(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <div>
          <label
            htmlFor="addr-line2"
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Address line 2{" "}
            <span className="font-normal text-zinc-500">(optional)</span>
          </label>
          <input
            id="addr-line2"
            value={address_line2}
            onChange={(e) => setAddress_line2(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="addr-city"
              className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
            >
              City
            </label>
            <input
              id="addr-city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
          <div>
            <label
              htmlFor="addr-state"
              className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
            >
              State / province
            </label>
            <input
              id="addr-state"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="addr-postal"
              className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
            >
              Postal code
            </label>
            <input
              id="addr-postal"
              required
              value={postal_code}
              onChange={(e) => setPostal_code(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
          <div>
            <label
              htmlFor="addr-country"
              className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
            >
              Country
            </label>
            <select
              id="addr-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            >
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading ? "Checking…" : submitLabel ?? "Validate address"}
          </button>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {pendingStandardized ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="addr-confirm-title"
        >
          <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h2
              id="addr-confirm-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Confirm address
            </h2>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              We found this address:{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatAddressForDisplay(pendingStandardized)}
              </span>
              . Save it?
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleConfirmSave}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={handleEditAddress}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
