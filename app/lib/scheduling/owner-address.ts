/**
 * Where the host's own notifications (new booking, reschedule, cancellation) go: ONE approved address, written here and nowhere else.
 *
 * It cannot be redirected. There is no environment override, no request input, and no setting: the service, the sync engine and the email provider
 * each refuse any other destination for an owner message. A deployment that sets SCHEDULING_OWNER_EMAIL to a DIFFERENT address does not get silently
 * redirected or silently ignored: it fails to start, naming the variable. Changing the approved address is a reviewed code change to this file, with
 * the tests that pin it (remediation / owner-recipient tests), not a configuration change.
 */
export const OWNER_NOTIFICATION_EMAIL = "martindubreuil13@gmail.com";

const norm = (v: string) => v.trim().toLowerCase();
export const isApprovedOwnerAddress = (v: unknown): v is string => typeof v === "string" && norm(v) === OWNER_NOTIFICATION_EMAIL;

/** The approved owner address. Throws if the environment tries to point owner notifications anywhere else. */
export function ownerNotificationAddress(env: Record<string, string | undefined> = process.env): string {
  const configured = env.SCHEDULING_OWNER_EMAIL;
  if (configured !== undefined && configured.trim() !== "" && !isApprovedOwnerAddress(configured)) {
    throw new Error("SCHEDULING_OWNER_EMAIL is set to an address that is not the approved owner address. Owner notifications cannot be redirected by configuration; remove the variable (the approved address is built in).");
  }
  return OWNER_NOTIFICATION_EMAIL;
}
