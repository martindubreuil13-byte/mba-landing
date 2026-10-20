import { SITE_URL } from "@/app/lib/seo";
import { PROGRAMS, formatPrice, programPath } from "@/app/lib/service-programs/catalog";

const programLines = PROGRAMS.map(
  (p) => `- [${p.name}](${SITE_URL}${programPath(p)}): ${p.help} ${p.pricing.kind === "fixed" ? `Fixed fee ${formatPrice(p)}` : "Priced by written proposal"}; ${p.duration.toLowerCase()}.`,
).join("\n");

const content = `# The Modern Business Architect

> Martin Dubreuil helps entrepreneurs and organizations examine, structure, validate and develop business ideas.

Canonical site: ${SITE_URL}
Principal: Martin Dubreuil

## Primary pages
- [Home](${SITE_URL}/)
- [Work with Martin: eight independent programs](${SITE_URL}/work)
- [About Martin Dubreuil](${SITE_URL}/martin)
- [Anonymized business cases](${SITE_URL}/cases)
- [Thinking and perspectives](${SITE_URL}/thinking)
- [Answers to common business questions](${SITE_URL}/answers)
- [Start a conversation](${SITE_URL}/lets-talk)

## Services: eight independent programs (start anywhere; none is a prerequisite for another)
${programLines}

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
