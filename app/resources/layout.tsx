import type { Metadata } from "next";
import { createPageMetadata } from "@/app/lib/seo";
import { PageStructuredData } from "@/app/components/PageStructuredData";

const title = "Free Resources | The Modern Business Architect";
const description =
  "Practical guides, tools and field notes for people building businesses — free to take away and use.";
const path = "/resources";

export const metadata: Metadata = createPageMetadata({ title, description, path });

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageStructuredData name={title} description={description} path={path} />
      {children}
    </>
  );
}
