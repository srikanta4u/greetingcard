import { createClient } from "@/lib/supabase/client";

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
): Promise<string> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) {
    throw error;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(
  bucket: string,
  path: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw error;
  }
}
