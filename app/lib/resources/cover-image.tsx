/**
 * Shared design for the auto-generated resource cover, used both as the
 * visible thumbnail (portrait) and the OG/social share image (landscape)
 * when a resource has no uploaded cover.
 *
 * True PDF-first-page rendering was deliberately not implemented: it needs
 * a native rendering dependency (pdfjs + canvas, or a headless-browser
 * screenshot) that is fragile on serverless/edge deployments and would add
 * real ongoing maintenance risk for a small V1 feature. This typographic
 * cover, built with next/og (Satori, no external font files, no native
 * deps), is the robust fallback: it always renders, matches the site's
 * design language, and needs zero extra infrastructure.
 */
export function buildCoverElement({
  title,
  resourceType,
  orientation,
}: {
  title: string;
  resourceType: string;
  orientation: "portrait" | "landscape";
}) {
  const isPortrait = orientation === "portrait";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#1a1816",
        color: "#f5f1ed",
        padding: isPortrait ? "56px 48px" : "64px 72px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 15,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#f5f1ed",
            opacity: 0.6,
          }}
        >
          The Modern Business Architect
        </div>
        <div
          style={{
            display: "flex",
            width: 14,
            height: 14,
            backgroundColor: "#6b1f1f",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 14,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#6b1f1f",
            fontWeight: 700,
          }}
        >
          {resourceType}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: isPortrait ? 46 : 54,
            lineHeight: 1.15,
            fontWeight: 500,
            color: "#f5f1ed",
            maxWidth: isPortrait ? "100%" : "70%",
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
