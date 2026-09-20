import type { Metadata } from "next";
import { createPageMetadata } from "@/app/lib/seo";
import { PageStructuredData } from "@/app/components/PageStructuredData";

const title = "Privacy | The Modern Business Architect";
const description = "What information is collected on this site, why, and how it's used.";
const path = "/privacy";

export const metadata: Metadata = createPageMetadata({ title, description, path });

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageStructuredData name={title} description={description} path={path} />
      {children}
    </>
  );
}
