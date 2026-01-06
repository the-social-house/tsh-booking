import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Generate a unique nonce for this request
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  // Content Security Policy with nonce support
  // Note: 'unsafe-inline' is needed for inline style attributes (not just style tags)
  // Nonces work for <style> tags but not for style="" attributes in React components
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
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static files in public folder (.svg, .webp, .png, .jpg, etc.)
     */
    {
      source: String.raw`/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|webp|png|jpg|jpeg|gif|ico|css|js|woff|woff2|ttf|eot)$).*)`,
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
