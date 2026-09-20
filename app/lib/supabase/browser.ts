"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-safe Supabase client (anon key only). Used exclusively for the
 * admin login form's signInWithPassword call — no application data is ever
 * read or written through this client.
 */
export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
