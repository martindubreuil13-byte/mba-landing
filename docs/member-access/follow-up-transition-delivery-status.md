# Separate follow-up (NOT part of this branch): Transition delivery status stays "queued"

**Gap.** Transition emails (acknowledgement, internal notification, confirmation, manual response) are delivered at Resend, but `program_applications.applicant_email_status`, `admin_notification_status`, `consent_email_status` and `response_email_status` never move past `queued`, because the Resend webhook (`/api/webhooks/resend`) only matches `resource_requests`. Admin therefore cannot show final provider delivery status for Transition.

**Proposed minimal patch (after the member-access report):**
1. Tag each Transition email with `application_id` and `kind` (`applicant`, `admin`, `consent`, `response`) in `sendProgramEmail`, and store the provider message id per kind (one nullable text column each, or one `jsonb` column on `program_applications`).
2. In the webhook, when no `resource_requests` row matches, look the id/tag up on `program_applications` and advance the matching `*_email_status` using the same `canAdvanceDelivery` rules (`queued → sent → delivered | bounced | failed`).
3. Extend the check constraints/labels to allow `sent`, `delivered`, `bounced`; show the final state on the Admin application page.
4. Tests: signed webhook updates only the matching field; out-of-order events don't regress; unrelated provider ids are ignored.

Needs one additive migration; do not combine it with this branch.
