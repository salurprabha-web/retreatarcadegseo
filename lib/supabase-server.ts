import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export function createServerClient() {
  const cookieStore = cookies();

  return createRouteHandlerClient({
    cookies: () => cookieStore,
  });
}
