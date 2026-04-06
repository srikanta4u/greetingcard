import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Checkout and order confirmation are public so guests can buy cards. */
const protectedPrefixes = ["/dashboard", "/creator", "/admin"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

/**
 * Production: if NEXT_PUBLIC_URL is apex (no www) and the request host is www.{apex},
 * redirect to the canonical origin (308).
 */
function wwwToApexRedirect(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;
  const raw = process.env.NEXT_PUBLIC_URL?.trim();
  if (!raw) return null;
  let canonical: URL;
  try {
    canonical = new URL(raw.endsWith("/") ? raw.slice(0, -1) : raw);
  } catch {
    return null;
  }
  const canonHost = canonical.hostname.toLowerCase();
  if (canonHost.startsWith("www.")) return null;

  const reqHost = request.nextUrl.hostname.toLowerCase();
  if (reqHost !== `www.${canonHost}`) return null;

  const dest = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    `${canonical.protocol}//${canonHost}`,
  );
  return NextResponse.redirect(dest, 308);
}

function productionLoginRedirectUrl(
  request: NextRequest,
  redirectToPath: string,
): URL | null {
  if (process.env.NODE_ENV !== "production") return null;
  const base = process.env.NEXT_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (!base) return null;
  try {
    const loginUrl = new URL("/auth/login", `${base}/`);
    loginUrl.searchParams.set("redirectTo", redirectToPath || "/");
    return loginUrl;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const wwwRedirect = wwwToApexRedirect(request);
  if (wwwRedirect) {
    return applySecurityHeaders(wwwRedirect);
  }

  let supabaseResponse = NextResponse.next({ request });

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(request.nextUrl.pathname) && !user) {
    const redirectTarget = request.nextUrl.pathname;
    const absoluteLogin = productionLoginRedirectUrl(request, redirectTarget);
    if (absoluteLogin) {
      return applySecurityHeaders(NextResponse.redirect(absoluteLogin));
    }

    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", redirectTarget);
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return applySecurityHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
