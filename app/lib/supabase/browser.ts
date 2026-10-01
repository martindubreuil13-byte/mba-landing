"use client";

import { createBrowserClient } from "@supabase/ssr";
import { assertDatabaseAllowedForDeployment } from "@/app/lib/deployment";

/**
 * Browser-safe Supabase client (anon key only). Used exclusively for the
 * admin login form's signInWithPassword call — no application data is ever
 * read or written through this client.
 */
export function getBrowserClient() {
  // A non-production deployment configured with the production project must fail before any request is made.
  assertDatabaseAllowedForDeployment(process.env.NEXT_PUBLIC_DEPLOYMENT_ENV, process.env.NEXT_PUBLIC_SUPABASE_URL);
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
