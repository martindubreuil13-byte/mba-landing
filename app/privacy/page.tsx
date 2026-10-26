/* eslint-disable react/no-unescaped-entities */
import ConsentPreferencesLink from "@/app/components/ConsentPreferencesLink";
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
              <p className="text-[#1a1816]/60 text-sm">Last updated October 4, 2026.</p>
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

              <h2 id="analytics" className="text-xl font-light pt-4 scroll-mt-24">Website analytics</h2>
              <p>
                The site uses two separate analytics tools to understand which pages are found and used, where
                visitors come from and whether the site leads to enquiries: the site&apos;s own first-party
                analytics, and Google Analytics. They run side by side and are independent of each other. Neither
                is used to identify you, and neither receives anything you type into a form.
              </p>

              <p>
                <strong className="font-medium text-[#1a1816]">The site&apos;s own analytics.</strong> It does not
                use cookies or browser local storage. For each visit it records the pages viewed and when, how
                long each page was in view, the referring website and any campaign tags in the link, your device
                type, browser family and country (taken from the network edge, never a precise location), and
                interactions such as button clicks or completed form steps. A random identifier held in your
                browser tab&apos;s session storage ties one visit together and is discarded when the tab closes or
                after 30 minutes of inactivity. Your IP address is not stored by this analytics, and no identifier
                is created that could recognise you when you return, so it counts visits, not people. Detailed page
                views and interactions are kept for 13 months and visit summaries for 25 months, then deleted.
                Visits from automated programs, including AI crawlers, and from the site&apos;s administrator are
                not counted. If your browser sends a Global Privacy Control or Do Not Track signal, this analytics
                does not run. When you submit an inquiry, request a resource or apply to a program, the site records
                that a submission happened (a count with the page and source it came from, linked to your visit only
                if this analytics was running), but that record contains none of what you wrote. Separately, to
                credit an inquiry to the page or campaign you arrived from, the site remembers that for the
                current browser tab only.
              </p>

              <p>
                <strong className="font-medium text-[#1a1816]">Google Analytics.</strong> The site also uses
                Google Analytics 4, a service provided by Google, to measure site use. It sets two cookies in
                your browser, <code>_ga</code> and a second one beginning <code>_ga_</code>, which last up to
                about 13 months and give your browser a random identifier so Google can recognise a returning
                browser and group page views into visits. It receives the address and title of each page you
                view, the page that referred you, your browser and device type, screen size, language, an
                approximate location that Google derives from your network address, and the same kinds of
                interaction as above, with a few non-identifying details such as which program was selected or
                an assessment&apos;s overall score. Google states that Google Analytics 4 does not log or store
                individual IP addresses. The data is sent to and processed by Google, and is kept for the period
                set in the site&apos;s Google Analytics account. Advertising features are switched off: the site
                does not use Google Analytics for advertising or share this data for advertising.
              </p>
              <p>
                <strong className="font-medium text-[#1a1816]">Your choice about Google Analytics.</strong>{" "}
                Google Analytics does not start, and sets no cookies, until it is allowed:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  If your browser sends a Global Privacy Control or Do Not Track signal, Google Analytics never
                  runs, and you are not asked.
                </li>
                <li>
                  If you are visiting from the European Economic Area, the United Kingdom, Switzerland, Brazil or
                  Quebec, or the site cannot tell where you are, it asks first and stays off unless you choose
                  Allow.
                </li>
                <li>
                  From anywhere else it runs unless you decline. Wherever you are, you can change your choice at
                  any time.
                </li>
              </ul>
              <p>
                The site remembers your choice in your browser&apos;s local storage (an entry named{" "}
                <code>mba_analytics_consent</code>, for up to 12 months) so it does not ask again; this is the only
                thing stored for it. Declining, or withdrawing, switches Google Analytics off and removes the
                Google Analytics cookies the site can reach. Pages in the site&apos;s administration area, and
                visits by its administrator, are never sent to Google Analytics. You can also block Google
                Analytics with your browser&apos;s tracking protection or an ad or tracker blocker, or with
                Google&apos;s opt-out add-on at{" "}
                <a href="https://tools.google.com/dlpage/gaoptout" className="underline hover:text-[#1a1816]" rel="noopener noreferrer">
                  tools.google.com/dlpage/gaoptout
                </a>
                . The site&apos;s own cookieless analytics described above is separate: it does not depend on this
                choice. Google&apos;s explanation of how it uses data from sites like this one is in its{" "}
                <a href="https://policies.google.com/technologies/partner-sites" className="underline hover:text-[#1a1816]" rel="noopener noreferrer">
                  description of how Google uses data from sites that use its services
                </a>
                .
              </p>
              <p>
                <ConsentPreferencesLink className="text-[#6b1f1f]" />
              </p>

              <h2 className="text-xl font-light pt-4">The shortlist (ongoing content)</h2>
              <p>
                The resource request form asks for your first name and email address and gives you
                two clearly labelled choices: one gets you the resource and keeps you on Martin's
                shortlist for further content (articles, guides, tools and the occasional relevant
                offer); the other just sends you the resource. Nothing is pre-selected, and you receive
                the resource either way. If you choose the first, the site records that consent along
                with a timestamp, the resource you were requesting and the version of the wording you
                saw. If you choose the second, no ongoing-content consent is recorded or implied.
              </p>
              <p>
                If you've previously opted in and later download another resource with the
                "just send me" choice, your existing opt-in is preserved rather than treated as a
                withdrawal — choosing to just receive a resource isn't read as "unsubscribe."
                If you have unsubscribed before, this form will not subscribe you again; you still receive the resource. Every marketing email includes an unsubscribe link, and you can also email{" "}
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
                (email delivery, including delivery status such as delivered or bounced), Google (Google
                Analytics, which receives only the website-usage data described under Website analytics, not
                your contact details or anything you write) and — for
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
