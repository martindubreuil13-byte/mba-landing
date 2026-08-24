import { PageStructuredData } from "@/app/components/PageStructuredData";
import { createPageMetadata } from "@/app/lib/seo";

const title = "Evolve It — Business Case";
const description = "A case in which an ambitious vision survived while its first move evolved into a narrower, testable business.";
export const metadata = createPageMetadata({ title, description, path: "/cases/evolve-it" });
export default function Layout({ children }: { children: React.ReactNode }) { return <><PageStructuredData name={title} description={description} path="/cases/evolve-it" />{children}</>; }
