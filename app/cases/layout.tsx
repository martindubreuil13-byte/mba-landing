import { PageStructuredData } from "@/app/components/PageStructuredData";
import { createPageMetadata, SITE_NAME } from "@/app/lib/seo";

const title = "Business Architecture Cases";
const description = "Anonymized cases showing how evidence and business architecture can kill, find, validate, evolve or create an opportunity.";
export const metadata = {
  ...createPageMetadata({ title, description, path: "/cases" }),
  title: { default: title, template: `%s | ${SITE_NAME}` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
