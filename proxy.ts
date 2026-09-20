import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/**
 * Protects the admin area. `/admin` itself is left alone (it renders its
 * own login form when signed out and redirects when signed in) — everything
 * under `/admin/*` and `/api/admin/*` requires a session whose email matches
 * ADMIN_EMAIL. This is real authentication (Supabase Auth), not an unlinked
 * "secret" route — the route being absent from navigation is a courtesy,
 * not the security boundary.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = Boolean(
    user && ADMIN_EMAIL && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  const { pathname } = request.nextUrl;
  const isApiAdminRoute = pathname.startsWith("/api/admin/");
  const isProtectedAdminPage = pathname.startsWith("/admin/");

  if (!isAdmin && isApiAdminRoute) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin && isProtectedAdminPage) {
    const loginUrl = new URL("/admin", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
