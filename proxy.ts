import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Skip prefetch requests
  if (
    request.headers.get("next-router-prefetch") ||
    request.headers.get("purpose") === "prefetch"
  ) {
    return NextResponse.next();
  }

  // Generate a unique nonce for this request
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  // Content Security Policy with nonce support
  // We use CSS custom properties (CSS variables) in style attributes instead of direct inline styles
  // CSS custom properties are safer as they only set variables, not direct styles
  // Note: CSS custom properties in style attributes require 'unsafe-inline', but the risk is
  // significantly reduced compared to direct inline styles since variables cannot execute code
  // We cannot use nonce in style-src alongside 'unsafe-inline' as browsers ignore 'unsafe-inline'
  // when nonce is present, which would block our CSS custom properties
  // Stripe requirements: https://stripe.com/docs/security/guide#content-security-policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""} https://connect-js.stripe.com https://*.js.stripe.com https://js.stripe.com https://maps.googleapis.com https://*.sentry.io https://*.ingest.de.sentry.io;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com sha256-0hAheEzaMe6uXIKV4EehS9pu1am1lj/KnnzrOYqckXk=;
    img-src 'self' blob: data: https://*.stripe.com https://*.supabase.co https://picsum.photos ${isDev ? "http://127.0.0.1:*" : ""};
    font-src 'self' https://fonts.gstatic.com data:;
    connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.stripe.com https://maps.googleapis.com https://*.sentry.io https://*.ingest.de.sentry.io wss://*.stripe.com;
    frame-src https://connect-js.stripe.com https://*.js.stripe.com https://js.stripe.com https://hooks.stripe.com https://vercel.live;
    worker-src 'self' blob:;
    form-action 'self';
    base-uri 'self';
    object-src 'none';
    frame-ancestors 'none';
    ${process.env.NODE_ENV === "production" ? "upgrade-insecure-requests;" : ""}
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  // Add nonce to request headers so Next.js can use it during rendering
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  // Update session first (may return a redirect)
  const sessionResponse = await updateSession(request);

  // Add nonce to request headers in the response so Next.js can use it during rendering
  // This is done by creating a new response with modified request headers
  const response =
    sessionResponse.status >= 300 && sessionResponse.status < 400
      ? sessionResponse
      : NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

  // Copy all cookies from session response (critical for Supabase session management)
  for (const cookie of sessionResponse.cookies.getAll()) {
    response.cookies.set(cookie.name, cookie.value, cookie);
  }

  // Set CSP and security headers on the response
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Note: X-Frame-Options is not set because it conflicts with Stripe Elements iframes.
  // CSP frame-ancestors directive above already handles frame restrictions.
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
