# NEX MAXX educational publishing library

## Audit and scope

The existing editor already had structured SmartBlockInstance data, a registry, shared SVG publication scenes, subject/grade tokens, image treatment, snapping, history, reusable presets, and print export. These remain the foundation.

The gaps were a collection-version filter that hid many purposes, generic archetype-driven choices, per-line SVG edits without semantic reflow, no recent list, and inconsistent print handling of wrapped text. The upgrade adds 81 purposes and 196 variants through 23 reusable measured compositions. The 18 main purposes have 3–5 variants. The 63 essential purposes have standard and compact treatments. Essential purposes reuse appropriate compositions; they do not each have a unique illustration or independent renderer.

Existing books and legacy registries retain their rendering. Simple compatible legacy blocks expose **Duplicate in the publishing design** in the inspector. This creates an undoable copy; it never rewrites the original. Complex curriculum schemas, reference layouts, and manually authored layers retain their existing renderer and tools.

## Publishing design refresh

The 196 publishing variants now use a shared editorial design language across the 23 measured compositions: stronger heading hierarchy, subject-derived tints, notched ribbons, numbered steps, distinct answer panels, vocabulary cards, observation plates and illustrated stories. Six richer layouts appear first in the main Blocks panel. Catalog descriptions explain the teaching use rather than repeating implementation names.

The 16 vector illustrations have additional detail and scale uniformly inside their frames. Their paper plates, inset masks and subtle vector depth render through the same canvas and print scene. Native PDF clipping now honours rounded corners. The artwork remains editable and replaceable, with no remote image dependency, backdrop blur or animated shadows.

Existing publishing blocks that need more space are measured on recovery. The refresh preserves their semantic content and appearance choices, grows their height when required, and moves them below occupied content before existing pagination handles continuations. Locked, hidden, grouped, manually layered and intentionally scaled frames retain their authored geometry. Legacy blocks keep their current renderer.

## Author workflow

Open **Blocks → Educational Blocks · publishing library**, or **More → Educational Blocks**. Recommended shows six starting choices. The seven lesson stages, search, favourites, recent, and My Blocks expose the rest without mounting the entire catalog.

Insert a preview or drag it to the page. Click a selected heading/body to edit its source field; Enter commits, Shift+Enter adds a line, and Escape cancels. Click an illustration to replace it. Click an accent to change its colour. Inactive blocks mount no textareas, colour inputs, or file inputs.

The quick toolbar offers Variant, Theme, Image, Layout, Accent, Duplicate, Save Preset, and More. Variant changes preserve content. More exposes compatible purpose duplication and advanced layer editing. Save Preset stores a name and lesson category under My Blocks. A publishing preset inserted on a continuation page undoes together with that page.

## Architecture and data

- `src/editor/educational/library/catalog.ts`: purposes, aliases, stages, variant definitions, and structured defaults. Definitions merge into the existing registry as additive version 4 IDs (`edu-*`).
- `library/render.ts`: measured scene primitives and purpose compositions; canvas, thumbnail, HTML print, and vector PDF consume the same positioned nodes.
- `library/illustrations.ts`: 16 original vector presets, themed through the existing subject tokens. No image fetch is needed for placeholder artwork.
- `library/editing.ts`: whitelisted nested source-field edits; no generated HTML/JSX is persisted.
- `library/actions.ts`: safe copy insertion, compatible purpose conversion, and opt-in legacy copy migration through existing history transactions.
- `library/preferences.ts`: bounded recent list and book-context resolution.
- `library/notation.ts`: vector fractions, superscripts, subscripts, and Unicode expressions. Examples: `\frac{1}{2} × b × h` and `x^{2} + x_{1}`. This is a primary-school grammar, not a full TeX engine; unsupported commands produce a layout warning.
- `src/editor/renderer/EducationalBlock.tsx`: memoized scene view; source editing and image paste/drop remain local to the selected block.

Vocabulary, formulas, images, annotations, comparisons, puzzle grids, predictions, and worked answers are additive optional semantic fields. Uploaded image treatment reuses existing fit/fill, focus, zoom, masks, flips, opacity, and background removal; rotation is now shared between SVG and PDF cropping. Comparison/grid image slots each expose treatment controls. Removing an uploaded image restores vector artwork.

Subject-automatic palettes and default artwork follow the existing eight subject domains. Grade profiles use the existing grade scales for readable type and spacing. Explicit palette, artwork, and typography choices remain authored overrides.

## Layout and print safeguards

Insertions respect the active page's safe margins, avoid content collisions, measure before placement, and create a continuation page when needed. A block too tall for an empty safe page, or a page with less than 180 pt of usable width, is rejected with actionable feedback. Publishing-block width changes rewrap content and preserve reading sizes instead of distorting a source frame. Existing pagination handles content growth; oversized material remains stored and is flagged for a wider variant or continuation.

Print now expands every wrapped scene text line. Transparent edit hitboxes do not paint solid rectangles in the native PDF. Polygon strokes survive native PDF export. New canvas text uses bundled print font families. Missing/low-resolution images, unsupported fonts, overset content, and bottom-margin violations enter preflight. Teacher answers, puzzle solutions, and teacher-note blocks are excluded from student output.

This remains an **RGB proof workflow**. ICC-managed CMYK conversion, PDF/X certification, and press-specific ink limits require the printer's prepress workflow. Source resolution is checked against a 300 effective PPI target; creating a 300 PPI crop does not improve a low-resolution original.

## Verification

- An isolated production build completed successfully. Existing repository lint warnings remain.
- Full suite: 344 passing tests at the final complete run, including 19 library tests and the concurrently added shape tests.
- All 196 variants checked at widths 180, 320, and 480 pt for finite geometry and bounded readable text.
- Source-field reflow, context adaptation, image treatment data and rotated fit/fill geometry, insertion/collision/history, narrow custom-page rejection, saved-template continuation undo, purpose conversion, legacy copy migration, notation, and student print expansion are covered.
- Actual React static rendering of 500 inactive blocks took about 148 ms while running the full suite in the isolated test and mounted no input/editor controls. This is not a low-end-device drag/frame-rate benchmark. Existing page-window rendering remains in place.
- Browser testing confirmed the refreshed Blocks panel, safe continuation insertion, semantic editing and visual-left layout switching with content retained. Earlier checks confirmed custom-preset save. The native chooser uploaded a local PNG into the selected slot; rotation and fit changed the actual canvas image transform, and restoring the artwork returned to vectors. Favourites and Recent displayed the expected entries; My Blocks displayed the named saved template, its category, and the correct count. The selected toolbar remained accessible in the narrow native browser window.
- `output/pdf/educational-library-proof.pdf`: seven pages generated through the shared native vector renderer with embedded regular/bold proof fonts, rendered with Poppler, visually inspected, and checked for extractable text. This diagnostic proof covers twelve representative purposes; it is not a certification of every possible user-authored book or a browser Save-as-PDF round trip.

- `output/pdf/premium-educational-blocks.pdf`: 24 representative designs generated through the native vector renderer with embedded regular/bold fonts, rendered with Poppler and visually inspected across all pages. The browser gallery covers all 18 major purposes.

The workspace contained unrelated in-progress math, border-import, and publishing changes before this task. They were preserved. No Git remote, commit, cloud publication, or deployment was changed.
