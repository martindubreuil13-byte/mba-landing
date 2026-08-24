import { PageStructuredData } from "@/app/components/PageStructuredData";
import { createPageMetadata } from "@/app/lib/seo";

const title = "Create It — Business Case";
const description = "A case in which research transformed an asset and entrepreneurial ambition into a business concept, then separated it from the wrong property.";
export const metadata = createPageMetadata({ title, description, path: "/cases/create-it" });
export default function Layout({ children }: { children: React.ReactNode }) { return <><PageStructuredData name={title} description={description} path="/cases/create-it" />{children}</>; }
