/**
 * Content categories, derived from the site's real route structure (app/answers, app/thinking, app/resources,
 * app/cases, app/work, app/transition). Pure; used to label paths in the admin and to scope "content" queries.
 */
export const CONTENT_PATH_REGEX = "^/(answers|thinking|cases|resources)/.+";

export function contentCategory(path: string): string {
  if (path === "/") return "Home";
  if (path.startsWith("/resources/business-idea-reality-check") || path.startsWith("/resources/napkin-principle")) return "Assessment";
  if (path === "/answers" || path.startsWith("/answers/")) return "Answers";
  if (path === "/thinking" || path.startsWith("/thinking/")) return "Thinking";
  if (path === "/resources" || path.startsWith("/resources/")) return "Resources";
  if (path === "/cases" || path.startsWith("/cases/")) return "Cases";
  if (path === "/work" || path.startsWith("/work/") || path.startsWith("/transition") || path.startsWith("/lets-talk")) return "Services";
  return "Other";
}
