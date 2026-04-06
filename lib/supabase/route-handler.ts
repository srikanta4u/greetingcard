import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Route Handler Supabase client: same cookie pattern as middleware so the session
 * is read from the incoming request and refreshed cookies are captured on the response.
 */
export function createRouteHandlerClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return { supabase, response };
}

export function mergeRouteHandlerCookies(
  from: NextResponse,
  onto: NextResponse,
): NextResponse {
  from.cookies.getAll().forEach((cookie) => {
    onto.cookies.set(cookie.name, cookie.value, cookie);
  });
  return onto;
}
