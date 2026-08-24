import { PageStructuredData } from "@/app/components/PageStructuredData";
import { createPageMetadata } from "@/app/lib/seo";

const title = "Find It — Business Case";
const description = "A case in which research revealed a credible international expansion opportunity in an initially overlooked market.";
export const metadata = createPageMetadata({ title, description, path: "/cases/find-it" });
export default function Layout({ children }: { children: React.ReactNode }) { return <><PageStructuredData name={title} description={description} path="/cases/find-it" />{children}</>; }
