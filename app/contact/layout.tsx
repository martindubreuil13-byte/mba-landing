import { createPageMetadata } from "@/app/lib/seo";

export const metadata = createPageMetadata({
  title: "Contact Martin Dubreuil",
  description: "Contact Martin Dubreuil by WhatsApp, email or scheduled call.",
  path: "/contact",
  index: false,
});
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
