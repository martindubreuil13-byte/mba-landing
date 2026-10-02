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
              <p className="text-[#1a1816]/60 text-sm">Last updated October 2, 2026.</p>
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
                The printable edition (a PDF to download, print, complete and keep) is a benefit for free
                members of the Modern Business Architect community. To get it, you enter your email address
                and press the button that says it will email you a confirmation link. The form only asks to
                become a member: nothing is unlocked and no marketing starts until you confirm. We send you
                one email with a link to a confirmation page; membership begins, and the PDF unlocks and
                starts downloading, only when you press the confirmation button on that page. Opening the
                link or a security scanner fetching it changes nothing. We then also email you a download
                link that stays valid so you can come back to it.
              </p>
              <p>
                As a member you may receive occasional emails from Martin Dubreuil and The Modern Business
                Architect: educational material, new resources, updates and occasional relevant offers. If
                you do not confirm, you are not added to the mailing list and receive no marketing emails.
                To keep a record of what you were shown and chose, the site stores that you asked to become
                a member and, if you confirm, that you did, each with the exact wording you saw, the time,
                the page and the button you used. If you ask for the guide again after confirming, the
                download link is sent to your email address rather than shown on the page.
              </p>
              <p>
                You can withdraw at any time using the unsubscribe link in any email, or by emailing
                Martin. Unsubscribing stops all marketing emails, keeps a record that you did, and does not
                take back anything you have already unlocked. A guide request form never signs an
                unsubscribed address up again; if you change your mind you can rejoin deliberately on the{" "}
                <a href="/rejoin" className="underline hover:text-[#1a1816]">
                  rejoin page
                </a>
                , which asks for the same email confirmation.
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

              <h2 className="text-xl font-light pt-4">The Transition application</h2>
              <p>
                The Corporate to Entrepreneur Transition application asks for your first and last name, email
                address, country, employment situation, years of experience, stage and timing, and your written
                answers about what you want and where you need help. Your answers are stored against your contact
                details, together with the route suggested by the review described below and a summary of it, and
                they are never published.
              </p>
              <p>
                To help Martin decide how to respond, your answers are sent to a third-party AI provider (OpenAI)
                solely to suggest one of three routes (invite to talk, review personally, or not the right fit) and
                to write a short summary for Martin. That provider does not use this data to train its models. The
                suggestion does not decide anything on its own: Martin reads every application and replies to you
                personally.
              </p>
              <p>
                Submitting the application sends you an acknowledgement by email, notifies Martin internally, and
                allows Martin to reply to you about your application. These are transactional messages about your
                application and do not subscribe you to marketing. The application form also has an optional,
                unchecked checkbox to stay on Martin's shortlist. If you tick it, the site records that you asked
                and sends you one email asking you to confirm. You are subscribed only once you open the link in
                that email and press the confirmation button; not confirming does not affect how your application
                is handled. Marketing emails include an unsubscribe link, and the same unsubscribe works for all
                of Martin's emails.
              </p>
              <p>
                Application details are kept until you ask for them to be corrected or deleted (see "Getting in
                touch" below). As evidence of what you were shown and chose, the site also stores a one-way
                scrambled form of your IP address and browser details, not the raw values.
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
                Resource requests, Transition applications, assessment responses, Napkin Principle results, searches, questions and contact details are stored in a
                Postgres database (hosted via Supabase) that only this site's server can access —
                the database is never exposed publicly, and downloadable files are served through
                short-lived, controlled links rather than a public file listing. Your information
                is not sold, and is not shared with third parties except the service providers
                needed to run this site: Supabase (database hosting and file storage), Resend
                (email delivery, including delivery status such as delivered or bounced) and — for
                the Business Idea Reality Check and the Transition application specifically —
                OpenAI, for AI-assisted classification and writing, as described above.
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
