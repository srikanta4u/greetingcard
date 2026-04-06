"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { deleteFile, uploadFile } from "@/lib/storage";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "application/pdf"]);

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-()]/g, "_").replace(/_+/g, "_");
}

function validateFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  const extOk = lower.endsWith(".png") || lower.endsWith(".pdf");
  if (!extOk) {
    return "Only PNG and PDF files are allowed.";
  }
  if (
    file.type &&
    !ALLOWED_TYPES.has(file.type) &&
    file.type !== "application/octet-stream"
  ) {
    return "Only PNG and PDF files are allowed.";
  }
  if (file.size > MAX_BYTES) {
    return "File must be 20MB or smaller.";
  }
  return null;
}

export type ImageUploadProps = {
  bucket: string;
  folder: string;
  onUpload: (url: string) => void;
  label: string;
};

export function ImageUpload({
  bucket,
  folder,
  onUpload,
  label,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [storedPath, setStoredPath] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<"png" | "pdf" | null>(null);

  const folderPrefix = folder.replace(/^\/+|\/+$/g, "");

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      const validation = validateFile(file);
      if (validation) {
        setError(validation);
        return;
      }

      setUploading(true);
      const safeName = sanitizeFilename(file.name);
      const base = `${Date.now()}-${safeName}`;
      const path = folderPrefix ? `${folderPrefix}/${base}` : base;
      const kind = lowerKind(file.name, file.type);

      try {
        const publicUrl = await uploadFile(bucket, path, file);
        setPreviewUrl(publicUrl);
        setStoredPath(path);
        setFileKind(kind);
        onUpload(publicUrl);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Upload failed. Try again.";
        setError(message);
        setPreviewUrl(null);
        setStoredPath(null);
        setFileKind(null);
      } finally {
        setUploading(false);
      }
    },
    [bucket, folderPrefix, onUpload],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void processFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleZoneClick = () => {
    if (!uploading && !previewUrl) {
      inputRef.current?.click();
    }
  };

  const handleRemove = async () => {
    setError(null);
    if (storedPath) {
      try {
        await deleteFile(bucket, storedPath);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Could not remove file from storage.";
        setError(message);
        return;
      }
    }
    setPreviewUrl(null);
    setStoredPath(null);
    setFileKind(null);
  };

  return (
    <div className="w-full max-w-lg">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,application/pdf,.png,.pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={onInputChange}
        disabled={uploading}
        aria-hidden
      />

      {uploading && !previewUrl ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/80 px-6 py-12 dark:border-zinc-600 dark:bg-zinc-900/40">
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800 dark:border-zinc-600 dark:border-t-zinc-200"
            role="status"
            aria-label="Uploading"
          />
          <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Uploading…
          </p>
        </div>
      ) : previewUrl && fileKind ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div className="relative flex max-h-64 items-center justify-center bg-zinc-100 dark:bg-zinc-950">
            {fileKind === "png" ? (
              <div className="relative h-64 w-full">
                <Image
                  src={previewUrl}
                  alt="Uploaded preview"
                  fill
                  unoptimized={previewUrl.startsWith("blob:")}
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-zinc-600 dark:text-zinc-400">
                <svg
                  className="h-14 w-14 text-red-600 dark:text-red-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2z" />
                </svg>
                <span className="text-sm font-medium">PDF uploaded</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-3 py-2 dark:border-zinc-700">
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleZoneClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          disabled={uploading}
          aria-label={label}
          className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/80 px-6 py-12 text-center transition hover:border-zinc-400 hover:bg-zinc-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900/40 dark:hover:border-zinc-500 dark:hover:bg-zinc-900/60 dark:focus-visible:outline-zinc-300"
        >
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {label}
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            PNG or PDF · max 20MB · drag and drop or click to browse
          </p>
        </button>
      )}

      {error ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function lowerKind(name: string, mime: string): "png" | "pdf" {
  if (mime === "image/png" || name.toLowerCase().endsWith(".png")) {
    return "png";
  }
  return "pdf";
}
