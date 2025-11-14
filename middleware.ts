// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // 1️⃣ Prevent /undefined/undefined errors
  if (url.pathname.includes("undefined")) {
    return NextResponse.redirect("https://www.retreatarcade.in/");
  }

  // 2️⃣ Fix old broken structure:
  // /events/slug/location-page-slug
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts.length === 3 && parts[0] === "events") {
    const [_, productSlug, locationSlug] = parts;

    // redirect to new format
    return NextResponse.redirect(
      `https://www.retreatarcade.in/events/${productSlug}/${locationSlug}`
    );
  }

  return NextResponse.next();
}
