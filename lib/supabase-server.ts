import { cookies } from "next/headers";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

export function createServerClient() {
  const cookieStore = cookies();

  return createPagesServerClient({
    cookies: {
      get: (key: string) => cookieStore.get(key)?.value,
      set: () => {},
      remove: () => {},
    },
  });
}
