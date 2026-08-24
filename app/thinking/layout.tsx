import { PageStructuredData } from "@/app/components/PageStructuredData";
import { createPageMetadata } from "@/app/lib/seo";

const title = "Thinking";
const description = "The future home of Martin Dubreuil's writing, business observations, principles and intellectual work.";
export const metadata = createPageMetadata({ title, description, path: "/thinking" });
export default function Layout({ children }: { children: React.ReactNode }) { return <><PageStructuredData name={title} description={description} path="/thinking" />{children}</>; }
