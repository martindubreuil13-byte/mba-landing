import type { PublicationRetailer } from "@/app/lib/publications/types";

/**
 * Retailer links in the order the admin set them, equally weighted. The name is plain text; the link is the
 * validated https URL. Renders nothing when there are none and never guesses a link.
 */
export default function RetailerLinks({ retailers, label }: { retailers: PublicationRetailer[]; label: string }) {
  if (retailers.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-[#6b1f1f]">{label}</p>
      <ul className="mt-4 flex flex-wrap gap-3">
        {retailers.map((retailer, index) => (
          <li key={`${index}-${retailer.url}`} className="max-w-full">
            <a
              href={retailer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-2 border border-[#6b1f1f] px-5 py-3 text-sm font-medium tracking-wide text-[#6b1f1f] transition-colors hover:bg-[#6b1f1f] hover:text-[#f5f1ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]"
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">{retailer.name}</span>
              <span aria-hidden="true" className="shrink-0">↗</span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
