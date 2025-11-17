// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Fix accidental undefined slugs
  if (url.pathname.includes("undefined")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Allow everything by default
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/events/:path*",
    "/services/:path*",
    "/admin/:path*",
  ],
};
