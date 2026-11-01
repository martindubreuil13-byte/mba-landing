import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ConfirmationView from "@/app/components/scheduling/ConfirmationView";
import { getScheduling } from "@/app/lib/scheduling/instance";
import { requireSchedulingOperations } from "@/app/lib/scheduling/release-gates";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Booking confirmed", robots: { index: false, follow: false } };

export default async function ConfirmedPage({ params }: { params: Promise<{ reference: string }> }) {
  requireSchedulingOperations();
  const booking = await getScheduling().publicBooking((await params).reference);
  if (!booking) notFound();
  return <main><ConfirmationView booking={booking} /></main>;
}
