import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Public values (safe in the browser). Vercel env vars override them if set.
export const SUPABASE_URL: string =
  import.meta.env["VITE_SUPABASE_URL"] || "https://bxymiyeifkfdumkzhuzc.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY: string =
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "sb_publishable_N8eTl9r-8-cdsuPy8uUu1Q_WFqyu9OQ";

// New-style keys (sb_publishable_…) are not JWTs: send them only as `apikey`, never as a Bearer token.
export function supabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined);
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: { fetch: supabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
  },
});
