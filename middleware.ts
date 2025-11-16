// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  // 1️⃣ Prevent undefined pages
  if (path.includes("undefined")) {
    return NextResponse.redirect("https://www.retreatarcade.in/");
  }

  // Break into usable segments — e.g. ["events","strip-photo","hyderabad"]
  const parts = path.split("/").filter(Boolean);

  // 2️⃣ Handle ONLY old broken structure
  // New structure is ALWAYS exactly /events/productSlug/locationSlug
  if (parts.length === 3 && parts[0] === "events") {
    const [_, productSlug, locationSlug] = parts;

    // 🛑 If already NEW format → DO NOT redirect
    // New format: locationSlug contains NO multi-dash patterns
    if (locationSlug && !locationSlug.includes("--") && !locationSlug.includes("_")) {
      return NextResponse.next();
    }

    // 3️⃣ Redirect ONLY if old format detected
    // Old style often contains extra sections (e.g. hyderabad-rental)
    const cleanedLocation = locationSlug.split("-")[0]; // keep first part

    return NextResponse.redirect(
      `https://www.retreatarcade.in/events/${productSlug}/${cleanedLocation}`
    );
  }

  return NextResponse.next();
}
