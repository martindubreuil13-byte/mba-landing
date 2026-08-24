import { PageStructuredData } from "@/app/components/PageStructuredData";
import { createPageMetadata } from "@/app/lib/seo";

const title = "Business Architecture";
const description = "Explore how business architecture moves ideas from uncertainty through validation, structure and execution.";
export const metadata = createPageMetadata({ title, description, path: "/work" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <><PageStructuredData name={title} description={description} path="/work" />{children}</>;
}
