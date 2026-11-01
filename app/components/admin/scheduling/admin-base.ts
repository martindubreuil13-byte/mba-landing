/**
 * Where the scheduling admin screens live and which API they call. The real admin (/admin/scheduling, signed-in admin only)
 * and the development-only preview (/scheduling-preview, no sign-in, simulated data) render the SAME components; only these
 * two base paths and the `preview` flag differ. Plain module (no "use client") so server components can read it.
 */
export type AdminBase = { routes: string; api: string; preview: boolean };
export const REAL_ADMIN: AdminBase = { routes: "/admin/scheduling", api: "/api/admin/scheduling", preview: false };
export const PREVIEW_ADMIN: AdminBase = { routes: "/scheduling-preview", api: "/api/scheduling-preview", preview: true };
