import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/*
 * ── Development auth bypass ───────────────────────────────────────────────
 *
 * When NEXT_PUBLIC_DEV_AUTH_BYPASS=true (and NODE_ENV is NOT production),
 * this middleware:
 *   1. Intercepts GET /api/auth/session and returns a fake authenticated
 *      session so next-auth's useSession() resolves to { status: "authenticated" }
 *      without any real OAuth credentials.
 *   2. Lets every other route through without any auth check.
 *
 * The DOUBLE guard (env flag AND NODE_ENV check) means this can NEVER activate
 * in a production build even if the variable is accidentally set.
 *
 * ── Production path (below) is entirely unchanged ─────────────────────────
 */
const DEV_BYPASS =
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true" &&
  process.env.NODE_ENV !== "production";

/** Shape must match what next-auth returns from /api/auth/session */
const DEV_SESSION = {
  user: {
    name: "Local Dev",
    email: "dev@local.test",
    image: null,
  },
  expires: "2099-01-01T00:00:00.000Z",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Dev bypass (development only) ────────────────────────────────────────
  if (DEV_BYPASS) {
    // Return a fake session so useSession() stays authenticated
    if (pathname === "/api/auth/session") {
      return NextResponse.json(DEV_SESSION, {
        headers: { "X-Dev-Auth-Bypass": "1" },
      });
    }
    // All other routes pass through — no extension key check needed locally
    return NextResponse.next();
  }

  // ── Production auth logic (unchanged) ────────────────────────────────────
  // Only check authentication for /api/extension routes
  if (pathname.startsWith("/api/extension/") && request.method !== "OPTIONS") {
    const extensionKey = request.headers.get("x-gitlore-extension-key");
    const expectedKey = process.env.EXTENSION_SECRET;

    if (!extensionKey || extensionKey !== expectedKey) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/extension/:path*",
    // Also run in dev so we can intercept /api/auth/session for the mock
    "/api/auth/session",
  ],
};
