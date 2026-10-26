/** Pure helpers shared by the browser and the server. No I/O, so they are unit-tested. */

type NavLike = { globalPrivacyControl?: boolean; doNotTrack?: string | null; msDoNotTrack?: string | null };

/** Global Privacy Control or Do Not Track, in any of the forms browsers send them. */
export function hasPrivacySignal(nav: NavLike | undefined | null, windowDnt?: string | null): boolean {
  if (!nav) return false;
  const on = (v: string | null | undefined) => v === "1" || v === "yes";
  return nav.globalPrivacyControl === true || on(nav.doNotTrack) || on(nav.msDoNotTrack) || on(windowDnt);
}

/**
 * A signed-in admin carries a Supabase auth cookie (`sb-<project>-auth-token`, possibly chunked `.0`/`.1`); visitors never do.
 * Used on the server (to skip first-party analytics) and in the browser (so Google Analytics never loads for the admin).
 */
export function hasAdminSessionCookie(cookies: string | null | undefined): boolean {
  return Boolean(cookies && /(^|;\s*)sb-[^=]*-auth-token/.test(cookies));
}

export const isAdminPath = (pathname: string) => pathname === "/admin" || pathname.startsWith("/admin/");
