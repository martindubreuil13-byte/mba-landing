import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookingExperience from "@/app/components/scheduling/BookingExperience";
import { getScheduling } from "@/app/lib/scheduling/instance";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { requireSchedulingOperations, schedulingIntakeEnabled } from "@/app/lib/scheduling/release-gates";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Book a conversation", robots: { index: false, follow: false } };

type Props = { params: Promise<{ meetingType: string }>; searchParams: Promise<{ invite?: string; source?: string }> };

export default async function BookPage({ params, searchParams }: Props) {
  // While public intake is closed, the page is a PREVIEW for the signed-in administrator only (everyone else gets "not found"). Submitting stays impossible:
  // the booking, community and status routes refuse every request while intake is closed, and the preview's button is disabled.
  requireSchedulingOperations();
  const preview = !schedulingIntakeEnabled();
  if (preview && !(await getAdminUser().catch(() => null))) notFound();
  const { meetingType } = await params;
  const { invite, source } = await searchParams;
  const found = await getScheduling().publicMeetingType(meetingType, invite);
  if (!found.ok && found.reason === "not_found") notFound();
  if (!found.ok) {
    // Invitation-only and no valid code: say nothing about what the meeting is.
    return (
      <main className="mx-auto max-w-xl px-6 pb-28 pt-20 text-center">
        <p className="text-xs uppercase tracking-[.25em] text-[#6b1f1f]">By invitation</p>
        <h1 className="mt-6 text-4xl font-light">This booking link is private.</h1>
        <p className="mt-6 text-lg leading-relaxed text-[#1a1816]/65">If you were invited, please use the exact link you were sent.</p>
      </main>
    );
  }
  return <main><BookingExperience type={found.type} invite={invite} source={typeof source === "string" ? source.slice(0, 60) : undefined} preview={preview} /></main>;
}
