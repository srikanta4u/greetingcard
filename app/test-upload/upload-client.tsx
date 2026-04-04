"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";

export function TestUploadClient() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Test Image Upload
      </h1>
      <ImageUpload
        bucket="designs"
        folder="test"
        label="Drop a PNG or PDF here, or click to choose a file"
        onUpload={(url) => setUploadedUrl(url)}
      />
      {uploadedUrl ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Public URL
          </p>
          <p className="mt-2 break-all font-mono text-sm text-zinc-800 dark:text-zinc-200">
            {uploadedUrl}
          </p>
        </div>
      ) : null}
    </div>
  );
}
