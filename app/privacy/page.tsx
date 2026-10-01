/* eslint-disable react/no-unescaped-entities */
// LEGAL REVIEW REQUIRED before production: the "Online guides and printable editions" section
// describes the confirmed opt-in model for printable guides (consent-copy v1.1).
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
              <p className="text-[#1a1816]/60 text-sm">Last updated October 1, 2026.</p>
            </div>

            <div className="space-y-6 text-base leading-relaxed text-[#1a1816]/85">
              <p>
                This page describes, factually, what personal information this site collects when
                you request a free resource, and what happens to it. It is not a substitute for
                formal legal advice.
              </p>

              <h2 className="text-xl font-light pt-4">When you request other free resources</h2>
              <p>
                To access a checklist, worksheet or other free resource that is not one of the printable guides described below, this site asks for your
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

              <h2 className="text-xl font-light pt-4">Online guides and printable editions</h2>
              <p>
                Some guides, such as Build the Bridge First, can be read in full on this site without
                providing any personal information: no email, no account and no password.
              </p>
              <p>
                The printable edition (a PDF to download, print, complete and keep) is available when
                you enter your email address and use the button that says it will send you the guide
                and invite you to join the community. Submitting the form does two things. First, it
                delivers the guide: the PDF downloads immediately and a copy is emailed to you, and
                neither depends on anything else. Second, it records your request to receive marketing
                emails from Martin Dubreuil and The Modern Business Architect, together with the exact
                wording you saw, the time, the page and the button you used.
              </p>
              <p>
                That request does not start marketing emails. The email containing your guide includes
                a link to confirm your address; community emails begin only if you confirm, and
                addresses that are not confirmed are not added to the mailing list. Community emails may
                include educational material, new resources, updates and occasional relevant offers.
              </p>
              <p>
                You can withdraw at any time using the unsubscribe link in any email, or by emailing
                Martin. Unsubscribing stops all marketing emails, keeps a record that you did, and does
                not take the guide away from you. If you later ask for a resource and agree again, that
                is recorded as a new request.
              </p>
              <p>
                To understand which guides are useful, the site counts anonymous activity on the guide
                page: page views, whether the guide was started or reached the end, and which
                printable-guide button was used. These counts use a random identifier that lasts only for
                that browser tab session and contains no personal information; no email is attached to
                them. If you then request the printable guide, that session's activity on the same guide
                page is linked to your contact record. The site does not record these counts if your
                browser sends a Global Privacy Control or Do Not Track signal. When you request the
                printable guide, the site also stores a one-way scrambled form of your IP address and
                browser details as evidence that the request was made, not the raw values.
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

              <h2 className="text-xl font-light pt-4">The Napkin Principle</h2>
              <p>
                This free interactive exercise asks about the price, direct costs and monthly operating costs of a
                business idea, and calculates a required transaction volume using a fixed, documented arithmetic
                method — no AI is used to calculate or interpret any part of it. You can complete the exercise and
                see your full on-screen result without providing an email address. Your answers and the calculated
                result are stored so the exercise can be revisited and improved, whether or not you go on to join
                the community.
              </p>
              <p>
                After your result is shown, you can optionally provide your name and email to join The Modern
                Business Architecture Community and receive a fuller emailed breakdown. That's a separate, explicit
                choice recorded with a timestamp and the exact wording you agreed to — declining it means nothing is
                emailed and no marketing consent is recorded, but your on-screen result is unaffected either way.
              </p>

              <h2 className="text-xl font-light pt-4">Pick My Brain</h2>
              <p>
                When you search the site with Pick My Brain, the site records what you typed, which
                pages it suggested, which one you opened (if any) and the page you searched from.
                It does not record your name, email or IP address with a search. Searches are
                used to understand what visitors are looking for and what's worth writing next.
              </p>
              <p>
                If you choose to send a question through Ask Martin, the site stores the question
                with the name and email you provide, and emails it to Martin. Those details are
                used only in connection with that question — they are not added to the shortlist.
              </p>

              <h2 className="text-xl font-light pt-4">How it's stored</h2>
              <p>
                Resource requests, assessment responses, Napkin Principle results, searches, questions and contact details are stored in a
                Postgres database (hosted via Supabase) that only this site's server can access —
                the database is never exposed publicly, and downloadable files are served through
                short-lived, controlled links rather than a public file listing. Your information
                is not sold, and is not shared with third parties except the service providers
                needed to run this site: Supabase (database hosting and file storage), Resend
                (email delivery, including delivery status such as delivered or bounced) and — for
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
