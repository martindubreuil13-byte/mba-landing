import { PageStructuredData } from "@/app/components/PageStructuredData";
import { createPageMetadata } from "@/app/lib/seo";

const title = "Business Architecture Services & Engagements";
const description = "Explore ways to work with Martin Dubreuil, from entrepreneurial exploration and business idea validation to business architecture, execution support and focused advisory.";
export const metadata = createPageMetadata({ title, description, path: "/work-with-me" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <><PageStructuredData name={title} description={description} path="/work-with-me" />{children}</>;
}
