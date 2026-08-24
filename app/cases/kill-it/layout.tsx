import { PageStructuredData } from "@/app/components/PageStructuredData";
import { createPageMetadata } from "@/app/lib/seo";

const title = "Kill It — Business Case";
const description = "A case in which investigation showed that a proven business model should not be replicated in a different market.";
export const metadata = createPageMetadata({ title, description, path: "/cases/kill-it" });
export default function Layout({ children }: { children: React.ReactNode }) { return <><PageStructuredData name={title} description={description} path="/cases/kill-it" />{children}</>; }
