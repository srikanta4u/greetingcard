import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

/**
 * Browser-only Supabase client. Do not call from Server Components, route
 * handlers, or during SSR — use `lib/supabase/server` instead.
 */
export function createClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error(
      "createClient() from lib/supabase/client must only run in the browser. Use lib/supabase/server on the server.",
    );
  }
  browserClient ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return browserClient;
}
