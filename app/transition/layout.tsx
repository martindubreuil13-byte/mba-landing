import type { Metadata } from "next";
export const metadata: Metadata = { title: "Corporate to Entrepreneur Transition", description: "A private conversation for established professionals considering entrepreneurship.", robots: { index: false, follow: false }, alternates: { canonical: "/transition" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
