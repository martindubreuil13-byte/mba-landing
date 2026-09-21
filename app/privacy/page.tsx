/* eslint-disable react/no-unescaped-entities */
import Navigation from "@/app/components/Navigation";

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <div className="h-16" />
      <main className="w-full bg-white text-[#1a1816]">
        <article className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-40">
          <div className="max-w-2xl mx-auto space-y-8">
            <div>
              <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-4">
                Privacy
              </p>
              <h1 className="text-3xl md:text-4xl font-light leading-tight mb-4">
                What this site collects, and why
              </h1>
              <p className="text-[#1a1816]/60 text-sm">Last updated September 21, 2026.</p>
            </div>

            <div className="space-y-6 text-base leading-relaxed text-[#1a1816]/85">
              <p>
                This page describes, factually, what personal information this site collects when
                you request a free resource, and what happens to it. It is not a substitute for
                formal legal advice.
              </p>

              <h2 className="text-xl font-light pt-4">When you request a free resource</h2>
              <p>
                To access a guide, checklist or other free resource, this site asks for your
                first name and email address, and optionally your country. Providing this
                information unlocks the resource immediately — it does not depend on agreeing to
                receive anything further.
              </p>
              <p>
                Alongside your details, the site records which resource you requested, when, and
                basic technical context about how you arrived (such as the referring page or any
                campaign/UTM parameters in the link). This is used to understand which content is
                useful to people and where it's being shared — not to track you individually
                across the web.
              </p>

              <h2 className="text-xl font-light pt-4">The shortlist (ongoing content)</h2>
              <p>
                Below the resource request form is a separate, unchecked checkbox to stay on
                Martin's shortlist for further content — articles, guides, tools and the
                occasional relevant offer. This is optional and separate from downloading the
                resource. If you check it, the site records that consent along with a timestamp.
                If you don't, no ongoing-content consent is recorded or implied.
              </p>
              <p>
                If you've previously opted in and later download another resource without
                re-checking the box, your existing opt-in is preserved rather than treated as a
                withdrawal — unchecking a box on a download form isn't read as "unsubscribe."
                If you want to be removed from the shortlist, email{" "}
                <a href="mailto:martin@mindrasolutions.com" className="underline hover:text-[#1a1816]">
                  martin@mindrasolutions.com
                </a>{" "}
                and it will be actioned directly.
              </p>

              <h2 className="text-xl font-light pt-4">The Business Idea Reality Check</h2>
              <p>
                This free interactive assessment asks 13 questions about a business idea and
                calculates a score using a fixed, documented scoring method — not by AI judgment.
                Your written answers are sent to a third-party AI provider (OpenAI) solely to (a)
                classify your open-ended answers against that fixed scoring rubric, and (b) write
                the plain-language explanation you see in your result. That provider does not use
                this data to train its models. The result, your answers, and the underlying score
                are stored against your contact details the same way a resource request is, so you
                can return to a result and so the methodology can be reviewed and improved. You can
                retake the assessment for the same idea later or for a different one — nothing is
                deleted or overwritten.
              </p>
              <p>
                Individual assessment responses are not published or shared as individual research
                data. Anonymized, aggregated information across assessments may be used to improve
                the methodology, study patterns in how business ideas develop, and create broader
                research or educational material.
              </p>

              <h2 className="text-xl font-light pt-4">How it's stored</h2>
              <p>
                Resource requests, assessment responses and contact details are stored in a
                Postgres database (hosted via Supabase) that only this site's server can access —
                the database is never exposed publicly, and downloadable files are served through
                short-lived, controlled links rather than a public file listing. Your information
                is not sold, and is not shared with third parties except the service providers
                needed to run this site (database hosting, transactional email delivery, and — for
                the Business Idea Reality Check specifically — AI-assisted classification and
                writing, as described above).
              </p>

              <h2 className="text-xl font-light pt-4">Getting in touch</h2>
              <p>
                For any question about what's stored, or to request that your information be
                corrected or deleted, email{" "}
                <a href="mailto:martin@mindrasolutions.com" className="underline hover:text-[#1a1816]">
                  martin@mindrasolutions.com
                </a>
                .
              </p>
            </div>
          </div>
        </article>
        <div className="h-24 md:h-32" />
      </main>
    </>
  );
}
