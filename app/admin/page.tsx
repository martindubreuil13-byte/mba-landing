import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import AdminLoginForm from "./AdminLoginForm";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminEntryPage() {
  const user = await getAdminUser();
  if (user) redirect("/admin/resources");
  return <AdminLoginForm />;
}
