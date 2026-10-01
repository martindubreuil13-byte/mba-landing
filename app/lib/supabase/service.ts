import "server-only";
import { createClient } from "@supabase/supabase-js";
import { assertDatabaseAllowed } from "@/app/lib/deployment";

/**
 * Privileged, server-only Supabase client (service_role key).
 * Bypasses Row Level Security. Never import this from a Client Component
 * or expose it to the browser — it belongs in route handlers and server
 * components only.
 */
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  // A preview / development deployment must never use the production database.
  assertDatabaseAllowed(url);

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
