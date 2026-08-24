import { SITE_URL } from "@/app/lib/seo";

const content = `# The Modern Business Architect

> Martin Dubreuil helps entrepreneurs and organizations examine, structure, validate and develop business ideas.

Canonical site: ${SITE_URL}
Principal: Martin Dubreuil

## Primary pages
- [Home](${SITE_URL}/)
- [How the work is approached](${SITE_URL}/work)
- [About Martin Dubreuil](${SITE_URL}/martin)
- [Anonymized business cases](${SITE_URL}/cases)
- [Thinking and perspectives](${SITE_URL}/thinking)
- [Start a conversation](${SITE_URL}/lets-talk)

## Discovery
- [Sitemap](${SITE_URL}/sitemap.xml)
- [Robots policy](${SITE_URL}/robots.txt)

Case details are anonymized or simplified where the site says this is necessary to protect confidentiality.
`;

export function GET() {
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
