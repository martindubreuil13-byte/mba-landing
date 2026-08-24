import { PageStructuredData } from "@/app/components/PageStructuredData";
import { createPageMetadata } from "@/app/lib/seo";

const title = "Martin Dubreuil";
const description = "Meet Martin Dubreuil, a business architect, serial entrepreneur and international business development practitioner.";
export const metadata = createPageMetadata({ title, description, path: "/martin" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <><PageStructuredData name={title} description={description} path="/martin" />{children}</>;
}
