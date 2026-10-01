# Content comparison: PDF → online guide

Source of truth: `Lead Magnets/Build-the-Bridge-First-FINAL-corrected.pdf` (9 pages, A4). It is the accepted FINAL PDF with two doubled words and a stray footer image removed (see below); pages 2–8 are pixel-identical to the accepted file.
Method (repeatable: `e2e/blocks.mjs` + `e2e/compare.py`): every leaf text block of the rendered HTML (`h2/h3/p/li/th/td/dt/caption`) is whitespace/punctuation-normalised and searched in that page's PDF text (`pdftotext -raw`). Leftover PDF text not claimed by any HTML block is reported as "residue". All nine pages were also compared visually, page image against rendered section.

**Result: 243 of 246 HTML text blocks match the corrected PDF text verbatim. The 3 that do not are hidden screen-reader table captions (D2). No PDF text is missing from the HTML except the duplicated URL on page 9.**

| PDF page | Online section | Sequence, headings, copy, example, exercise, output | Notes |
|---|---|---|---|
| 1 Cover | `#page-1` | Exact (31/31) | Stage columns rendered as an ordered list. |
| 2 Clarify what you want… | `#page-2` | Exact (27/27) | Outcome tiles, Yes/Partly/No and writing lines shown as non-interactive marks. |
| 3 Design the role… | `#page-3` | Exact | Table caption added (D2); row-header label "Activity" added (D3). |
| 4 Separate your experience… | `#page-4` | Exact | Item names moved from the middle column to row headers (D1); caption + "Item" label added. |
| 5 Choose a business shape… | `#page-5` | Exact (38/38) | Shape cards rendered as a list of cards. |
| 6 Find where… unusual advantage | `#page-6` | Exact (20/20) | Four overlap boxes become a numbered list. |
| 7 Separate the opportunity… | `#page-7` | Exact | Caption + "Condition" label added. |
| 8 Choose what to test next | `#page-8` | Exact (27/27) | Direction Brief and Next Move lines as label/blank-line pairs. |
| 9 The invitation | `#page-9` | Exact | The PDF prints the URL twice (link overlay); shown once as a link plus the "Continue the conversation →" label. |

## PDF correction (done)
The accepted FINAL PDF printed "…direction before *before* you commit" and "…a credible *credible* direction" (the PPTX source was correct; it is an export artefact at line wraps), and drew a tiny stray image after "ARCHITECT" in the page 1 and page 9 footers. `Build-the-Bridge-First-FINAL-corrected.pdf` (saved beside the original, which is untouched) removes the first copy of each doubled word, which sat at a line end so nothing reflows, and the two stray images. Verified: text diff = exactly those two words; pixel diff = pages 2–8 identical, page 1 changed only in those two line ends and the footer, page 9 only in the footer glyph. **Upload it as the new file in Admin → Resources before launch; the production stored PDF has not been replaced.**

## Deliberate differences from the PDF (for your review)

- **D1 Page 4 table order.** The PDF puts item names in the middle column; online they are the first column (row headers) so the table reads on a phone and to screen readers. Same words.
- **D2 Screen-reader table captions** (visually hidden): "Activities in an ordinary week, and how each would feel", "What you can carry, and what the company provided", "Conditions graded K (known), I (inferred) or M (imagined)".
- **D3 Three visible column-header labels** on the tables: "Activity", "Item", "Condition".
- **D4 "page N" references** (e.g. "You will return to it on page 8") are links to that section. Text unchanged.
- **D5 Added page chrome around the guide** (not guide content): top CTA copy "Read it here, or download, print and keep the PDF to complete every exercise." The mid-guide and end CTAs use your suggested copy.
- **Cannot be reproduced exactly:** the PDF's page typography, fillable layout and page breaks. Online the exercises are read-only marks and lines by design; the printable PDF is the working edition.
