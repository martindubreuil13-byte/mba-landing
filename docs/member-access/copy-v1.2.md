# Copy for approval: member-access v1.2

**Status: DRAFT. Not legally approved.** It states what the product does; it is not a legal opinion. Wording lives in code (`app/lib/resources/consent-copy.ts`, `app/lib/resources/config.ts`, `app/privacy/page.tsx`); the consent wording is stored verbatim with every consent record, by version id. Changing any consent wording means a **new version id**, never an edit of a published one.

## 1. Public layer and member benefit (CTA blocks on the guide page)

- **Top:** "Read the complete guide here, free. Free members of the community also get the printable PDF to download, print and keep." — button **Unlock the printable guide**
- **Mid-guide:** "Prefer to work directly on the exercises? Free members get the printable PDF to download, print and complete." — **Unlock the printable guide →**
- **End:** heading "Keep the work you have started." — "The printable edition gives you space to complete every exercise and assemble your Entrepreneurial Direction Brief. It is free for members of the Modern Business Architect community." — **Unlock the printable guide →**

## 2. Form (`resource-guide-consent-v1.2`, stored as the consent evidence)

- **Heading:** Unlock the printable guide
- **Public vs member:** The guide is free to read online, and it stays that way. Free members of the Modern Business Architect community also get the printable PDF to download, print, complete and keep.
- **Note:** Enter your email and we’ll send you a link to confirm. When you confirm, you become a free member: the PDF unlocks, and you may receive occasional ideas, resources and invitations from Martin.
- **Button:** Email me a confirmation link
- **Disclosure:** Membership is free and starts only when you confirm from the email. You can unsubscribe at any time and keep anything you have already unlocked. Read the Privacy Policy.
- Superseded (kept, unchanged, for existing records): v1.0 "Send me the guide + join the community"; v1.1 "Email me the printable guide".

## 3. After the form: "check your inbox" (identical for every address and state)

- **Heading:** Check your inbox
- **Body:** If this address can receive the guide, an email is on its way with a link to confirm. Open it and press the confirmation button to unlock the printable PDF.
- **Hint:** Nothing after a few minutes? Check your spam folder. You can keep reading the guide online in the meantime. *Unsubscribed in the past? Rejoin here.* (links to `/rejoin`)
- Other CTAs on the page then say: Check your inbox for your confirmation email. The guide is free to read right here in the meantime.

## 4. Confirmation email (new or pending address)

- **Subject:** Confirm your email to unlock Build the Bridge First
- **Preview:** One click to confirm and unlock your printable guide.
- **Heading:** One step to unlock your printable guide
- **Body:** Hello, / You asked for the printable edition of Build the Bridge First. It is available to free members of The Modern Business Architect community. / Confirm your email below to become a member. Your PDF unlocks the moment you confirm, and I will also email you a download link that stays valid, so you can come back to it. / As a member you may receive occasional ideas, resources, tools and invitations from me. You can unsubscribe at any time, and anything you have unlocked stays yours.
- **Button:** Confirm and unlock the guide (opens the signed `/confirm` page; the email contains no download link)
- **Small print:** If you did not ask for this, ignore this email. Nothing will be unlocked and nothing further will be sent.
- **Footer:** Privacy · Unsubscribe or cancel request · sender line · postal address (from `MAILING_ADDRESS`) · "You are receiving this one-off email because someone entered this address to unlock Build The Bridge First. Nothing is unlocked and nothing further is sent unless you confirm."

## 5. Confirmation page (`/confirm`, opened from that email)

- **Heading:** Unlock the printable guide
- **Intro:** Press the button to confirm your email address. You become a free member of the Modern Business Architect community, and the printable PDF of Build the Bridge First unlocks straight away.
- **Details:** As a member you may receive occasional emails from Martin Dubreuil: practical ideas, new resources, updates and relevant offers. You can unsubscribe at any time, and anything you have unlocked stays yours.
- **Button:** Confirm and unlock the guide →
- **After pressing (download starts):** heading **You are in.** — "Your download is starting. I have also emailed you a link that stays valid, so you can come back to the guide whenever you like. You will now receive occasional emails from Martin; you can unsubscribe at any time." — button **Download the PDF →**
- **Errors:** expired — "This confirmation link has expired. Reply to the email you received and Martin will send a new one, or ask for the guide again on its page." · invalid — "This confirmation link is invalid. Reply to the email and Martin will help." · withdrawn — "This confirmation is no longer needed or was withdrawn. If you would still like to hear from Martin, you can sign up again." · other — "This confirmation link can no longer be used."

## 6. Confirmed-member delivery email (also sent right after confirmation)

- **Subject:** Your guide is ready: Build the Bridge First · **Preview:** A practical guide for deciding what to build before leaving what you know.
- Body as already live (Hello, Here it is. … **Download the guide** …), with one member line: "As a member you may receive occasional practical notes from The Modern Business Architect. The unsubscribe link below ends that at any time, and the guide stays yours."
- The link is signed, scoped to the request and the resource, and valid for a year.

## 7. Rejoin (`/rejoin`, wording `membership-rejoin-v1.0`)

- **Heading:** Rejoin the community
- **Intro:** If you unsubscribed in the past and would like to hear from Martin again, you can rejoin here. It is your choice, and it is free.
- **Note:** We’ll send one email with a link to confirm. Nothing changes until you confirm.
- **Button:** Email me a confirmation link · **Disclosure:** Rejoining is free and starts only when you confirm from the email. You can unsubscribe at any time and keep anything you have already unlocked. Read the Privacy Policy.
- **Result (same for every address):** Check your inbox — If this address can rejoin, a confirmation email is on its way. Nothing changes until you confirm.
- **Email:** subject "Confirm to rejoin the community"; heading "Would you like to rejoin?"; "You asked to rejoin The Modern Business Architect community after unsubscribing. / Nothing changes until you confirm. If you do, you may receive occasional ideas, resources and invitations from me again, and you can unsubscribe at any time."; button **Yes, rejoin the community**; "If you did not ask for this, ignore this email. You will not be added back and nothing further will be sent."

## 8. Errors and recovery (form)

- Invalid address: the existing inline messages ("…is missing an “@”", "…does not look right").
- Out-of-date page: "This form is out of date. Please reload the page and try again."
- Too many attempts: "Too many attempts from this connection. Please wait a little while and try again." / "That address has already been used a few times. Check your inbox, or try again in an hour."
- Email provider failure (the only state that is not neutral): "We could not send the email just now. Please try again in a moment."
- Server error: "Something went wrong on our side. Please try again in a moment."

## 9. Privacy policy (section "Online guides and printable editions", `/privacy`)

Rewritten to match: the printable edition is a free-member benefit; the form only asks to become a member; nothing is unlocked and no marketing starts until the confirmation button is pressed (opening the link or a scanner fetching it changes nothing); a durable download link is then emailed; members may receive occasional emails; unconfirmed addresses receive no marketing; the exact wording, time, page and button are stored; asking again after confirming emails the link instead of showing it; unsubscribing stops marketing and does not take back what was unlocked; a guide form never re-signs an unsubscribed address, and they can rejoin deliberately on `/rejoin` with the same confirmation; the anonymous analytics paragraph is unchanged. Transition and OpenAI sections are unchanged.
