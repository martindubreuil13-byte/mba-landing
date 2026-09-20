import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/**
 * Server Component / Route Handler Supabase client, bound to the request's
 * cookies. Uses the anon key + the visitor's own session (not privileged) —
 * this only ever tells us who, if anyone, is signed in.
 */
async function getSessionClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't set cookies — safe to
            // ignore as long as middleware is also refreshing the session.
          }
        },
      },
    }
  );
}

/**
 * Returns the signed-in admin user, or null. "Admin" is deliberately a
 * single allow-listed email (ADMIN_EMAIL) rather than a role system — this
 * is a one-person tool, not a multi-user CMS.
 */
export async function getAdminUser() {
  if (!ADMIN_EMAIL) return null;

  const supabase = await getSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return null;
  }

  return user;
}

/** Server Component guard: redirects to the login page if not signed in. */
export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
  return user;
}

export async function signOutAdmin() {
  const supabase = await getSessionClient();
  await supabase.auth.signOut();
}
