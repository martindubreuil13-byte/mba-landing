export function isAllowedAdminEmail(userEmail: string | null | undefined, configuredAdminEmail: string | null | undefined) {
  return Boolean(userEmail && configuredAdminEmail && userEmail.toLowerCase() === configuredAdminEmail.toLowerCase());
}
