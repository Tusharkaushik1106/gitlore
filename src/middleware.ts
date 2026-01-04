import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only check authentication for /api/extension routes
  if (pathname.startsWith("/api/extension/")) {
    const extensionKey = request.headers.get("x-gitlore-extension-key");
    const expectedKey = process.env.EXTENSION_SECRET;

    if (!extensionKey || extensionKey !== expectedKey) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/extension/:path*"],
};

