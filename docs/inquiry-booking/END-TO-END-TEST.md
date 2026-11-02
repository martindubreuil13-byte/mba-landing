# One end-to-end test, after deployment

About 30 minutes, done once by Martin. Everything below is real: real emails, a real Zoom meeting and Google event. Use a Gmail plus-address so the test person is separate from your own record: `martindubreuil13+mba-test@gmail.com` (it reaches your inbox). Leave every "keep me updated" box unticked and choose "Not now" on the community pop-up.

Two mailboxes receive mail: the inquiry notice goes to **martin@mindrasolutions.com**; the guest emails and your own booking notices go to **martindubreuil13@gmail.com**. Expect about 8 to 10 emails in total.

## Part 1: an inquiry becomes a booking

1. **Send an inquiry.** Open `/lets-talk?program=pre-architecture` on your phone. Write name `MBA Test`, the plus-address above, message `[TEST - ignore]`. Send.
   - The success screen shows the "Book Your Complimentary Session" button.
   - Two emails arrive: the notice at mindrasolutions, and the reply at the plus-address with the same button.
2. **Check the admin list.** Open `/admin/inquiries`. The new row shows `MBA Test`, interest `Pre-Architecture`, "You were notified", "Not booked", and the message under "Read message".
3. **Book from the success screen button** (not the email). The booking page opens with name and email already filled in, and the address bar shows no reference. Pick a time at least two days ahead, confirm. The confirmation page appears; the Zoom link appears within a minute or two.
4. **Check it was linked.** Reload `/admin/inquiries`: the row now reads "Booked: <date and time>". Your calendar shows the event (the guest is not invited to it) and the Zoom meeting exists.
5. **Open the link in the email** (the reply from step 1) in a private window. The form is filled in again, the address bar is clean. Do not book; close it.
6. **Reschedule it.** In `/admin/scheduling/bookings`, move the booking to another time. The list shows the new time with "(rescheduled)". A reschedule email reaches the plus-address.
7. **Cancel it** there. The list shows "Canceled (was ...)". The Zoom meeting and calendar event are gone and a cancellation email arrives.

## Part 2: a Transition application becomes a booking

8. Open `/transition`, apply with the same plus-address and name `MBA Test Two`. The confirmation screen shows the booking button; an invitation email arrives with "BOOK YOUR COMPLIMENTARY SESSION".
9. Click the button in the **email**. The form is filled in. Book a time (at least two days ahead).
10. Open `/admin/programs/corporate-transition`: the application's **Booking** column reads "Booked: ...". `/admin/inquiries` shows the same application row with the same status.
11. Cancel the booking in `/admin/scheduling/bookings`; both screens read "Canceled".

## Part 3: quick looks (2 minutes)

12. On `/book/complementary-session`, press "Next month" repeatedly: it stops about thirteen months ahead and never shows the "Choose dates in the coming months" error.
13. `/privacy` has the new "Booking a conversation" and "Sending a message" sections and no mention of Calendly.
14. In `/admin/inquiries`, press **Delete** on the `MBA Test` inquiry and confirm: the row disappears (the application row has no delete; it stays). Reopen `/admin/scheduling/bookings`: the canceled test bookings remain as history.

## Pass / stop

Pass when every line above matches. Stop and tell me if any of these happen: an email goes to an address you did not expect; two Zoom meetings or calendar events for one booking; the form is not filled in from your own link; a reference appears in the address bar after the page loads; the admin list shows a booking you did not make.

If something fails, the site can go back to its previous behaviour in minutes (see the rollback section of `RELEASE-REPORT.md`). Nothing from the test needs removing for that, and the leftover test rows are harmless: the Transition application and the lead stay as records unless you ask me to delete them.
