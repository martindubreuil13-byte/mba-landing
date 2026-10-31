/**
 * Publications: the pages a publication may link to ("Related reading").
 *
 * Thinking articles and Answers are not database records: they are source arrays inside app/thinking/page.tsx and
 * app/answers/page.tsx. This index is the one place that lists them for the publications feature, and
 * related-index.test.ts keeps it honest: every entry must be a real route, and every article/answer on those two
 * index pages must appear here (so adding an article without listing it here fails a test, not a reader).
 *
 * Service pages come straight from the program catalogue, so they cannot drift.
 *
 * A stored related link that is not in this index is dropped when read, so a removed page never becomes a dead link.
 */

import { PROGRAMS, programPath } from "@/app/lib/service-programs/catalog";

export type RelatedKind = "thinking" | "answers" | "service";

export type RelatedEntry = { path: string; title: string; kind: RelatedKind };

export const RELATED_KIND_LABEL: Record<RelatedKind, string> = {
  thinking: "Thinking",
  answers: "Answer",
  service: "Work with Martin",
};

const THINKING: ReadonlyArray<readonly [string, string]> = [
  ["/thinking/anticipatory-business-architecture", "Will Your Business Still Be Relevant Tomorrow?"],
  ["/thinking/architecting-intelligence", "Architecting Intelligence"],
  ["/thinking/your-next-customer-might-not-visit-your-website", "Your Next Customer Might Not Visit Your Website"],
  ["/thinking/how-to-define-your-ideal-customer", "How to Define Your Ideal Customer"],
  ["/thinking/the-business-architects-frame", "The Business Architect's FRAME™"],
  ["/thinking/the-being-economy", "The Being Economy"],
  ["/thinking/the-brutal-truth-about-startup-fundraising", "The Brutal Truth About Startup Fundraising"],
  ["/thinking/your-life-is-perfectly-designed-to-kill-your-business-before-it-starts", "Your Life Is Perfectly Designed to Kill Your Business Before It Starts"],
  ["/thinking/the-fastest-way-to-build-the-wrong-business", "The Fastest Way to Build the Wrong Business"],
  ["/thinking/your-corporate-experience-may-be-working-against-you", "Your Corporate Experience May Be Working Against You"],
  ["/thinking/an-app-is-not-a-business", "An App Is Not a Business"],
  ["/thinking/your-business-idea-is-worth-nothing", "Your Business Idea Is Worth Nothing"],
];

const ANSWERS: ReadonlyArray<readonly [string, string]> = [
  ["/answers/can-i-start-a-business-without-risking-my-financial-future", "Can I Start a Business Without Risking My Financial Future?"],
  ["/answers/how-to-start-a-restaurant-consulting-business", "I Want to Start a Restaurant Consulting Business. Where Do I Begin?"],
  ["/answers/full-time-or-flexible-job-starting-business", "Should I Take a Full-Time Job or a Flexible Job While Starting My Own Business?"],
  ["/answers/am-i-too-old-to-start-a-business", "Am I Too Old to Start a Business?"],
  ["/answers/what-kind-of-business-can-i-start-with-the-skills-i-already-have", "What Kind of Business Can I Start With the Skills I Already Have?"],
  ["/answers/how-do-i-turn-my-years-of-experience-into-a-business", "How Do I Turn My Years of Experience Into a Business?"],
  ["/answers/how-should-i-use-ai-in-my-business", "How Should I Use AI in My Business?"],
  ["/answers/how-do-you-build-a-product-if-you-cannot-get-funding", "How Do You Build a Product If You Cannot Get Funding?"],
  ["/answers/how-do-i-find-a-business-idea", "How Do I Find a Business Idea?"],
  ["/answers/how-do-i-define-my-ideal-customer-profile", "How Do I Define My Ideal Customer Profile?"],
  ["/answers/the-10-signs-youre-serious-about-starting-a-business", "The 10 Signs You're Serious About Starting a Business"],
  ["/answers/i-built-an-app-how-do-i-turn-it-into-a-business", "I Built an App. How Do I Turn It Into a Business?"],
  ["/answers/how-do-i-get-investors-for-my-business-idea", "How Do I Get Investors for My Business Idea?"],
  ["/answers/i-have-a-business-idea-but-no-money-what-should-i-do", "I Have a Business Idea but No Money. What Should I Do?"],
  ["/answers/how-do-i-know-if-my-business-idea-is-actually-viable", "How Do I Know If My Business Idea Is Actually Viable?"],
  ["/answers/what-does-a-business-architect-do", "What Does a Business Architect Do?"],
  ["/answers/what-is-business-architecture", "What Is Business Architecture?"],
];

export const RELATED_INDEX: readonly RelatedEntry[] = [
  ...THINKING.map(([path, title]) => ({ path, title, kind: "thinking" as const })),
  ...ANSWERS.map(([path, title]) => ({ path, title, kind: "answers" as const })),
  ...PROGRAMS.map((program) => ({ path: programPath(program), title: program.name, kind: "service" as const })),
];

const BY_PATH = new Map(RELATED_INDEX.map((entry) => [entry.path, entry]));

export function isValidRelatedPath(path: string): boolean {
  return BY_PATH.has(path);
}

export function relatedEntry(path: string): RelatedEntry | undefined {
  return BY_PATH.get(path);
}
