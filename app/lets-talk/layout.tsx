import { PageStructuredData } from "@/app/components/PageStructuredData";
import { createPageMetadata } from "@/app/lib/seo";

const title = "Let's Talk";
const description = "Start a conversation with Martin Dubreuil about your idea, business or current situation.";
export const metadata = createPageMetadata({ title, description, path: "/lets-talk" });
export default function Layout({ children }: { children: React.ReactNode }) { return <><PageStructuredData name={title} description={description} path="/lets-talk" />{children}</>; }
