// Compatibility wrapper. The generic member-access endpoint is /api/resources/member-access.
// Pages loaded before the member-access release still POST here with the old consent version; the shared handler
// answers those with "This form is out of date. Please reload the page", so nothing is unlocked by a stale page.
export { POST } from "../member-access/route";
