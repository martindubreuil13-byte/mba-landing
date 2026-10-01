/**
 * Structured, reusable model for an online guide / workbook. The content lives
 * in data (one file per guide); `ResourceViewer` renders it as semantic HTML on
 * the server so every word is indexable and readable without JavaScript.
 */
export type HeadingPart = string | { em: string };

export type FieldItem = { label: string; strong?: boolean; italic?: boolean; tall?: boolean };

export type ExerciseBlock =
  /** A grid of selectable outcomes, shown as empty circles. */
  | { type: "choice-grid"; items: string[] }
  /** Label with a blank line to write on. */
  | { type: "fields"; items: FieldItem[] }
  /** A question with a few circle options on the same row. */
  | { type: "choice-row"; label: string; options: string[] }
  /** Table with a header row and one row per item; cells are empty marks or blank lines. */
  | {
      type: "matrix";
      caption: string;
      rowHeader: string;
      columns: { label: string; mark: "circle" | "square" | "line" }[];
      rows: { label: string; strong?: boolean; lineOnly?: boolean }[];
    }
  /** Cards to circle one of. */
  | { type: "cards"; items: { title: string; details: string[] }[] }
  /** Numbered boxes to write in. */
  | { type: "quadrants"; items: { n: number; label: string }[] }
  /** Small italic aside inside an exercise. */
  | { type: "note"; text: string };

export type OutputBlock =
  | { type: "fields"; items: FieldItem[] }
  | { type: "sentence"; text: string; lines?: number }
  | { type: "numbered-lines"; count: number };

export type Aside = {
  label: string;
  paragraphs?: string[];
  schedule?: { time: string; text: string }[];
  grades?: { grade: "K" | "I" | "M"; text: string }[];
  closing?: string;
};

export type GuideStage = "you" | "direction" | "evidence";

export type StandardSection = {
  kind: "standard";
  id: string;
  page: number;
  kicker: string;
  stage: GuideStage;
  heading: HeadingPart[];
  body: string[];
  aside: Aside;
  exercise: { instruction: string; blocks: ExerciseBlock[] };
  outputs: { label: string; blocks: OutputBlock[] }[];
  footnote?: string;
};

export type CoverSection = {
  kind: "cover";
  id: string;
  page: number;
  kicker: string;
  heading: HeadingPart[];
  subtitle: string;
  byline: string;
  meta: string;
  lead: string;
  intro: string;
  stages: { label: string; title: string; subtitle: string; questions: string[]; output: string }[];
  closing: string;
  beforeYouBegin: { label: string; text: string };
};

export type BriefSection = {
  kind: "brief";
  id: string;
  page: number;
  kicker: string;
  stage: GuideStage;
  heading: HeadingPart[];
  body: string[];
  aside: Aside;
  direction: { label: string; hint: string; items: FieldItem[] };
  nextMove: { label: string; items: FieldItem[] };
  footnote: string;
};

export type InvitationSection = {
  kind: "invitation";
  id: string;
  page: number;
  kicker: string;
  heading: string;
  paragraphs: { text: string; strong?: boolean }[];
  closing: string;
  link: { label: string; display: string; href: string };
  signature: string;
};

export type GuideSection = CoverSection | StandardSection | BriefSection | InvitationSection;

export type GuideContent = {
  slug: string;
  /** Short plain-language summary of the guide's structure, for structured data. */
  sections: GuideSection[];
  stageLabels: Record<GuideStage, string>;
};
