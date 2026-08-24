import { PageStructuredData } from "@/app/components/PageStructuredData";
import { createPageMetadata } from "@/app/lib/seo";

const title = "Validate It — Business Case";
const description = "A case testing whether a specialized import product could support a viable business before building the operation.";
export const metadata = createPageMetadata({ title, description, path: "/cases/validate-it" });
export default function Layout({ children }: { children: React.ReactNode }) { return <><PageStructuredData name={title} description={description} path="/cases/validate-it" />{children}</>; }
