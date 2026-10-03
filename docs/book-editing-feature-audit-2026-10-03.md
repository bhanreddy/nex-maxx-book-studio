# NEX MAXX Book Studio editing and book-creation audit

Audit date: **3 October 2026 (Asia/Kolkata)**. Current Git base: `f2f88f114774fe46b1a57e3b0dab3b5aaf507f19` plus the current uncommitted working tree.

**Conclusion:** NEX MAXX has a substantial design and educational page-composition foundation. It is not yet a complete Canva-style design suite, Docs-style editorial workflow, or PowerPoint editor. Existing AI media/quick-text labels include procedural stand-ins and no-op methods that need immediate correction.

**152 checklist items:** 64 implemented; 30 partial; 9 unverified; 41 missing; 8 stub.

This is a comprehensive book-creation checklist with explicit design/document/presentation expansion scope. It is not a promise of every feature in every edition of Canva, Google Docs, Word or PowerPoint. Priorities reflect static book production first.

## Evidence and status rules

Read current working tree including uncommitted changes; trace model, UI, store, renderer and export boundaries; read official benchmark sources; inspect existing localhost:3000 UI without editing book content; rerun current tests and typecheck; directly invoke fill/upscale provider methods.

- **Implemented:** real usable code path found. Browser checks and tests are described separately; this is not universal certification.
- **Partial:** some requested behavior exists, with a stated functional or fidelity gap.
- **Missing:** no usable implementation found within the inspected repository snapshot. Linked files show the inspected boundary, not proof that the missing feature exists.
- **Stub:** a label/path exists but the substantive advertised operation does not.
- **Unverified:** implementation exists, but live backend/API or environment success was not checked.

**Validation this run:** 420/420 automated tests passed; TypeScript checking passed. Existing browser interface was inspected without changing book content. Generative fill/upscale methods were invoked directly and returned their input image. No new build, printer certification or full UI regression pass was performed.

**Browser observations:**

- Existing selected block has text-wrap modes and gap controls, content editing/detach, transforms, alignment and local editorial comments.
- Edit menu exposes undo/redo/page operations and command palette; no manuscript-wide find/replace tool.
- Layout menu exposes masters, global styles, structure/TOC, pagination and preflight.
- Export modal exposes PDF proofs with complete-book/chapter/range scopes; explicitly states RGB, not PDF/X or colour-managed CMYK.

## Critical findings

1. **Upscaling misreports image quality.** The provider returns the original image and reports 300/600 DPI; the store multiplies rawWidthPx. It does not create additional pixels. This can make downstream resolution reporting unreliable. [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:1734>)
2. **Outpainting can replace the source with a gradient.** The method creates a gradient canvas and never draws the input image; its caller installs that output as the image source. [src/editor/ai/aiProvider.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/ai/aiProvider.ts:343>)
3. **Generative fill is a no-op.** The returned URL is the input URL. A ready state does not establish any edited pixels.
4. **Quick rewriting/simplification does not understand text.** One action appends a fixed parenthetical; another replaces every long word with simple. Neither is a factuality-preserving rewrite.
5. **PDF proof is not complete print production.** The UI correctly states RGB and no PDF/X/ICC CMYK; full-wrap cover tooling, printer profiles and tagged accessibility remain gaps.
6. **Comments, saved revisions and presence are distinct from tracked changes or simultaneous editing.** Local comments exist. Central review/history/presence endpoints exist. No individual-edit acceptance engine or live co-edit replication was found.

## Recommended implementation sequence

### P0 — Correct misleading actions

Prevent false success and harmful replacements in existing tools.

- Disable or implement generative fill, expand, upscale and quick rewrite/simplify with truthful status.
- Derive resolution and DPI from decoded output pixels; do not inflate dimensions in metadata.
- Preserve source images and provide undo for image edits.

Two concrete outcomes: Expanding a photo preserves its original subject rather than replacing it with a gradient. An 800-pixel image stays 800 pixels until real resampling/generation produces more pixels.

### P1 — Finish the book and document workflow

Make authoring, editorial review and delivery complete for a static book.

- Add book-wide find/replace and tracked changes on stable semantic text ranges.
- Build real native table structure, merge/split, selected insertion and continuation.
- Add note anchors/pagination, link/bookmark authoring and editable DOCX export.
- Build full-wrap cover/spine/barcode and rights/credits workflows.
- Provide accessible PDF and printer profiles where the target deliverable requires them.
- Validate central review/save/restore and real offline recovery in the intended account/deployment.

Two concrete outcomes: A copyeditor accepts individual corrections and returns an editable Word manuscript. A complete paperback produces separate verified interior and correctly sized cover files.

### P2 — Expand design, research and teaching reuse

Extend existing engines before adding a second editor.

- Complete font/character styles, citations/index/glossary, true boolean geometry and subject-removal quality.
- Add asset exports, OCR and EPUB when required by the publishing workflow.
- Use the current scene and semantic models for a dedicated slide mode with PPTX import/export and chapter-to-deck conversion.
- Validate simultaneous editing infrastructure before promising real-time collaboration.

Two concrete outcomes: One reviewed lesson becomes a book chapter and an editable classroom deck. A publisher can export a licensed illustration as SVG and its worksheet as PNG.

### P3 — Optional presentation/media features

Add only after classroom presentation delivery is a product requirement.

- Presenter notes, audience slideshow, handouts and navigation.
- Animations, transitions, embedded media, narration and slide recording.
- Improve 3D mockup accuracy if marketing previews are required.

Two concrete outcomes: A teacher reads private notes while pupils see only the slides. An answer appears on click and the narrated lesson can be recorded.

## Complete feature checklist

Each feature includes two practical acceptance examples. These describe required behavior, including behavior still missing; they are not claims that both examples pass today. P0 = correct an existing misleading/harmful operation; P1 = complete core book workflow; P2 = expansion; P3 = optional presentation/media.

### Workspace and everyday editing

**F001 — Book creation and metadata · Implemented · P1**

Wizard creates titled subject/grade books with language and binding fields in the model.

Acceptance example 1: Create a Grade 3 science workbook. Acceptance example 2: Create an English story book.

Evidence / inspected boundary: [src/features/wizard/BookWizardModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/wizard/BookWizardModal.tsx:18>), [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>).

**F002 — Page size and orientation · Partial · P1**

A4/A5/Letter and orientation are available; Custom is modeled but the creation wizard does not provide arbitrary dimension entry.

Acceptance example 1: Create an A5 portrait book. Acceptance example 2: Enter a 6-by-9-inch custom trim size.

Evidence / inspected boundary: [src/features/wizard/BookWizardModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/wizard/BookWizardModal.tsx:18>), [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>).

**F003 — Page add, duplicate, delete and reorder · Implemented · P1**

Page operations and thumbnail navigation use the existing book store.

Acceptance example 1: Duplicate an exercise page. Acceptance example 2: Move a chapter opener before its exercises.

Evidence / inspected boundary: [src/features/panels/LeftSidebar.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/LeftSidebar.tsx:45>), [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:284>).

**F004 — Page and element navigation · Implemented · P1**

Page strip/sidebar and active canvas are wired; large books use bounded windows.

Acceptance example 1: Jump to physical page 180. Acceptance example 2: Select a specific page object.

Evidence / inspected boundary: [src/features/panels/LeftSidebar.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/LeftSidebar.tsx:45>), [src/features/canvas/PageCanvas.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/PageCanvas.tsx:37>).

**F005 — Undo and redo · Implemented · P1**

History store and atomic transactions support undo/redo; not a substitute for permanent revision history.

Acceptance example 1: Undo a block movement. Acceptance example 2: Undo a manuscript import as one action.

Evidence / inspected boundary: [src/editor/stores/historyStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/historyStore.ts:23>), [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:284>).

**F006 — Copy, cut, paste and duplicate objects · Implemented · P1**

Universal clipboard and keyboard commands handle supported editor objects.

Acceptance example 1: Copy a title and illustration together. Acceptance example 2: Duplicate an activity card onto another page.

Evidence / inspected boundary: [src/editor/clipboard/universalClipboard.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/clipboard/universalClipboard.ts:7>), [src/features/editor/BookEditorWorkspace.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/editor/BookEditorWorkspace.tsx:152>).

**F007 — Multi-select and marquee selection · Implemented · P1**

Canvas selection and modifier-key interactions exist with regression coverage.

Acceptance example 1: Select three objects with Shift. Acceptance example 2: Drag a marquee around a worksheet section.

Evidence / inspected boundary: [src/features/canvas/PageCanvas.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/PageCanvas.tsx:37>), [src/features/editor/BookEditorWorkspace.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/editor/BookEditorWorkspace.tsx:152>).

**F008 — Drag, resize, rotate and keyboard nudge · Implemented · P1**

Transform overlays and keyboard handlers are connected to the store.

Acceptance example 1: Rotate an arrow 45 degrees. Acceptance example 2: Move a selected picture by one point.

Evidence / inspected boundary: [src/features/canvas/TransformOverlay.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/TransformOverlay.tsx:42>), [src/features/editor/BookEditorWorkspace.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/editor/BookEditorWorkspace.tsx:152>).

**F009 — Group, ungroup and nested group transforms · Implemented · P1**

Explicit group membership and transform propagation exist.

Acceptance example 1: Group a picture and its caption. Acceptance example 2: Ungroup a reusable banner.

Evidence / inspected boundary: [src/editor/core/elementGroups.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/core/elementGroups.ts:5>), [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:284>).

**F010 — Lock, unlock, hide and show · Implemented · P1**

Lock-aware editing and visibility controls are implemented.

Acceptance example 1: Lock a background. Acceptance example 2: Hide a teacher-only draft annotation.

Evidence / inspected boundary: [src/editor/core/elementGroups.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/core/elementGroups.ts:5>), [src/features/panels/LeftSidebar.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/LeftSidebar.tsx:45>).

**F011 — Layers and stacking order · Implemented · P1**

Layer controls support bring/send and ordering operations.

Acceptance example 1: Send a background behind text. Acceptance example 2: Bring a callout above an image.

Evidence / inspected boundary: [src/features/panels/LeftSidebar.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/LeftSidebar.tsx:45>), [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:284>).

**F012 — Align and distribute objects · Implemented · P1**

Selection/page-margin alignment and equal spacing exist.

Acceptance example 1: Align three boxes to their left edge. Acceptance example 2: Give four images equal horizontal gaps.

Evidence / inspected boundary: [src/editor/core/arrangement.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/core/arrangement.ts:2>).

**F013 — Rulers, guides, grids and snapping · Implemented · P1**

User guides, column/baseline grids and snapping are wired into canvas placement.

Acceptance example 1: Snap a caption to a column edge. Acceptance example 2: Align headings to a baseline grid.

Evidence / inspected boundary: [src/editor/core/snapping.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/core/snapping.ts:16>), [src/features/canvas/PageCanvas.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/PageCanvas.tsx:37>).

**F014 — Zoom, pan, fit and fullscreen · Implemented · P1**

Navigation and fullscreen handlers exist and are visible in the browser.

Acceptance example 1: Fit an A4 page in the editor. Acceptance example 2: Pan at 200 percent zoom.

Evidence / inspected boundary: [src/features/canvas/PageCanvas.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/PageCanvas.tsx:37>), [src/features/editor/BookEditorWorkspace.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/editor/BookEditorWorkspace.tsx:152>).

**F015 — Keyboard shortcuts and command palette · Implemented · P2**

Editor commands and a searchable command palette exist; command search is not manuscript search.

Acceptance example 1: Open export using the palette. Acceptance example 2: Switch to the text tool using T.

Evidence / inspected boundary: [src/features/editor/BookEditorWorkspace.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/editor/BookEditorWorkspace.tsx:152>), [src/features/panels/TopHeader.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/TopHeader.tsx:49>).

**F016 — Touch/mobile and cross-browser editing certification · Unverified · P2**

Responsive behaviors exist; current evidence does not establish reliable full editing on low-end Android, Safari or Firefox.

Acceptance example 1: Resize a grouped block using touch. Acceptance example 2: Edit Telugu text in Safari.

Evidence / inspected boundary: [docs/production-engine-audit.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/production-engine-audit.md:67>).

### Document writing and typography

**F017 — Inline rich-text formatting · Implemented · P1**

Selection-level bold, italic, underline, strike, colour and size tools exist.

Acceptance example 1: Bold one word in a paragraph. Acceptance example 2: Highlight a key definition.

Evidence / inspected boundary: [src/editor/renderer/RichTextInlineEditor.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/RichTextInlineEditor.tsx:128>).

**F018 — Fonts, text sizes and colour · Implemented · P1**

Font selection and typography controls exist; print export restricts fonts to its bundled registry.

Acceptance example 1: Set body copy to 12 points. Acceptance example 2: Use a supported display font for chapter titles.

Evidence / inspected boundary: [src/features/inspector/TypographyInspector.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/inspector/TypographyInspector.tsx:67>), [src/editor/publishing/fontRegistry.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/publishing/fontRegistry.ts:1>).

**F019 — Superscript and subscript · Implemented · P1**

Selection-level superscript/subscript commands are exposed.

Acceptance example 1: Write x squared with a superscript. Acceptance example 2: Write H2O using a subscript.

Evidence / inspected boundary: [src/editor/renderer/RichTextInlineEditor.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/RichTextInlineEditor.tsx:128>).

**F020 — Paragraph alignment and indentation · Implemented · P1**

Alignment, paragraph spacing and left/right/first-line indentation controls have rendering paths.

Acceptance example 1: Justify a body paragraph. Acceptance example 2: Apply a first-line paragraph indent.

Evidence / inspected boundary: [src/editor/renderer/RichTextInlineEditor.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/RichTextInlineEditor.tsx:128>), [src/features/inspector/TypographyInspector.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/inspector/TypographyInspector.tsx:67>), [src/editor/renderer/ElementRenderer.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/ElementRenderer.tsx:226>).

**F021 — Line, letter and word spacing · Implemented · P1**

Typography inspector and renderer apply these spacing properties.

Acceptance example 1: Increase line spacing for early readers. Acceptance example 2: Adjust tracking on a heading.

Evidence / inspected boundary: [src/features/inspector/TypographyInspector.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/inspector/TypographyInspector.tsx:67>), [src/editor/renderer/ElementRenderer.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/ElementRenderer.tsx:226>).

**F022 — Bullet and numbered lists · Partial · P1**

Inline editor offers basic lists and Word imports retain lists; no full multilevel numbering/restart manager was found.

Acceptance example 1: Create a five-item bullet list. Acceptance example 2: Restart nested exercise numbering after a section break.

Evidence / inspected boundary: [src/editor/renderer/RichTextInlineEditor.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/RichTextInlineEditor.tsx:128>), [docs/manuscript-import.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/manuscript-import.md:13>).

**F023 — Paragraph and character style systems · Partial · P1**

Reusable text styles and global cascade exist; no full named character-style inheritance system was found.

Acceptance example 1: Change every linked body paragraph style. Acceptance example 2: Apply an independently named emphasis character style.

Evidence / inspected boundary: [src/features/palette/TextStylesModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/palette/TextStylesModal.tsx:9>), [src/features/inspector/TypographyInspector.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/inspector/TypographyInspector.tsx:67>).

**F024 — Format painter and clear formatting · Implemented · P2**

Style capture/apply and reset actions are implemented.

Acceptance example 1: Copy heading formatting to a caption. Acceptance example 2: Remove pasted inline formatting.

Evidence / inspected boundary: [src/features/inspector/TypographyInspector.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/inspector/TypographyInspector.tsx:67>), [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:284>).

**F025 — Text frames and linked continuation · Implemented · P1**

Linked frames and measured continuation exist; arbitrary page artwork remains outside automatic reading flow.

Acceptance example 1: Flow a long story into the next frame. Acceptance example 2: Continue a paragraph on the following page.

Evidence / inspected boundary: [src/editor/layoutPartner/linkedTextEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/layoutPartner/linkedTextEngine.ts:8>), [src/features/canvas/PageCanvas.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/PageCanvas.tsx:37>).

**F026 — Auto-pagination, widow/orphan and keep rules · Implemented · P1**

Generic flow uses stable boundaries and keep rules; canonical curriculum content has its own compositor.

Acceptance example 1: Keep a heading with its next paragraph. Acceptance example 2: Prevent a single final line on the next page.

Evidence / inspected boundary: [src/editor/core/paginationEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/core/paginationEngine.ts:7>).

**F027 — Object text wrap and contour wrap · Implemented · P1**

Both-side, tight, contour, largest-side, above/below and no-wrap layouts exist.

Acceptance example 1: Wrap text around a transparent animal image. Acceptance example 2: Place a paragraph above and below a table.

Evidence / inspected boundary: [src/editor/layoutPartner/textWrapLayout.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/layoutPartner/textWrapLayout.ts:6>).

**F028 — Book-wide find and replace · Missing · P1**

No manuscript-wide find/replace UI or engine was found; asset/command search does not cover book text.

Acceptance example 1: Replace a term across all chapters. Acceptance example 2: Find a misspelled name with whole-word matching.

Evidence / inspected boundary: [src/features/panels/TopHeader.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/TopHeader.tsx:49>), [src/editor/renderer/RichTextInlineEditor.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/RichTextInlineEditor.tsx:128>).

**F029 — Word count and reading statistics · Missing · P2**

No author-facing word-count, reading-time or chapter statistics tool was found.

Acceptance example 1: Count words in chapter 4. Acceptance example 2: Check a 500-word story target.

Evidence / inspected boundary: [src/editor/renderer/RichTextInlineEditor.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/RichTextInlineEditor.tsx:128>), [src/features/palette/BookStructureModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/palette/BookStructureModal.tsx:48>).

**F030 — Spell checking and grammar review · Partial · P1**

Native contenteditable spellCheck is enabled; no dedicated book-wide grammar or multilingual proofreading workflow was found.

Acceptance example 1: Underline a spelling error while typing. Acceptance example 2: Review grammar across the full book.

Evidence / inspected boundary: [src/editor/renderer/RichTextInlineEditor.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/RichTextInlineEditor.tsx:128>).

**F031 — Automatic footnotes and endnotes · Missing · P1**

Footnote-looking styles and block text exist; no numbered note anchors, renumbering or note pagination engine was found.

Acceptance example 1: Insert a source note after a sentence. Acceptance example 2: Renumber notes after deleting the first note.

Evidence / inspected boundary: [src/editor/structure/bookStructureEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/structure/bookStructureEngine.ts:123>), [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>).

**F032 — Citations and bibliography manager · Missing · P2**

No structured citation records or generated bibliography workflow was found.

Acceptance example 1: Insert an APA citation. Acceptance example 2: Generate a bibliography from cited sources.

Evidence / inspected boundary: [src/editor/structure/bookStructureEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/structure/bookStructureEngine.ts:123>), [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>).

**F033 — Index and glossary generation · Missing · P2**

No term marking, alphabetical index or generated glossary engine was found.

Acceptance example 1: Index every occurrence of photosynthesis. Acceptance example 2: Generate an alphabetized vocabulary glossary.

Evidence / inspected boundary: [src/editor/structure/bookStructureEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/structure/bookStructureEngine.ts:123>).

**F034 — Tracked changes with accept/reject · Missing · P1**

Comments and revision snapshots exist; they do not record individual insertions/deletions for acceptance.

Acceptance example 1: Review a deleted sentence. Acceptance example 2: Accept one correction and reject another.

Evidence / inspected boundary: [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:2019>), [src/editor/renderer/RichTextInlineEditor.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/RichTextInlineEditor.tsx:128>).

**F035 — Clickable hyperlinks and document bookmarks · Missing · P1**

No supported native link/bookmark authoring and PDF link-annotation workflow was found; QR resources are separate.

Acceptance example 1: Link a citation to its website. Acceptance example 2: Jump from a digital TOC item to a chapter.

Evidence / inspected boundary: [src/editor/renderer/RichTextInlineEditor.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/RichTextInlineEditor.tsx:128>), [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

**F036 — English, Hindi and Telugu text handling · Implemented · P1**

Bundled scripts, Unicode input and composition-aware inline editing exist; use the font-embedded proof for Indic text.

Acceptance example 1: Write a Telugu explanation. Acceptance example 2: Export a Hindi worksheet using bundled fonts.

Evidence / inspected boundary: [src/editor/publishing/fontRegistry.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/publishing/fontRegistry.ts:1>), [src/editor/renderer/RichTextInlineEditor.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/RichTextInlineEditor.tsx:128>).

**F037 — RTL and vertical writing · Missing · P2**

No exposed text direction or vertical-writing layout workflow was found; layout-group direction is unrelated.

Acceptance example 1: Compose an Arabic paragraph right to left. Acceptance example 2: Set a vertical bilingual title.

Evidence / inspected boundary: [src/editor/renderer/RichTextInlineEditor.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/RichTextInlineEditor.tsx:128>), [src/editor/renderer/ElementRenderer.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/ElementRenderer.tsx:226>).

**F038 — Automatic hyphenation and advanced line breaking · Missing · P2**

Measured wrapping exists; no language hyphenation dictionary or production hyphenation controls were found.

Acceptance example 1: Hyphenate a long word in a narrow column. Acceptance example 2: Disable hyphenation in a heading.

Evidence / inspected boundary: [src/editor/layoutPartner/linkedTextEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/layoutPartner/linkedTextEngine.ts:8>), [src/editor/core/paginationEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/core/paginationEngine.ts:7>).

**F039 — Custom font upload and licensing metadata · Missing · P2**

Print registry requires bundled fonts; no font upload/embedding/license-management workflow was found.

Acceptance example 1: Upload a licensed publisher font. Acceptance example 2: Block export when its font file is unavailable.

Evidence / inspected boundary: [src/editor/publishing/fontRegistry.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/publishing/fontRegistry.ts:1>).

### Canva-style design and reusable layouts

**F040 — Shapes and editable geometric objects · Implemented · P1**

Parametric shapes, shape drawing and inspectors exist.

Acceptance example 1: Draw and edit a rounded rectangle. Acceptance example 2: Add a star badge for an exercise.

Evidence / inspected boundary: [src/features/inspector/ShapeInspector.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/inspector/ShapeInspector.tsx:39>), [src/features/canvas/ShapeDrawOverlay.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/ShapeDrawOverlay.tsx:16>).

**F041 — Fills, gradients, strokes and dash styles · Implemented · P1**

Shape inspector and SVG renderer support the corresponding style families.

Acceptance example 1: Apply a gradient to a banner. Acceptance example 2: Give an answer box a dashed border.

Evidence / inspected boundary: [src/features/inspector/ShapeInspector.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/inspector/ShapeInspector.tsx:39>), [src/editor/renderer/ElementRenderer.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/ElementRenderer.tsx:226>).

**F042 — Opacity and visual effects · Partial · P2**

Editor opacity/shadow/effect controls exist; print does not preserve every editor decoration.

Acceptance example 1: Make a highlight translucent. Acceptance example 2: Check that a decorative shadow survives PDF export.

Evidence / inspected boundary: [src/features/inspector/ShapeInspector.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/inspector/ShapeInspector.tsx:39>), [src/features/inspector/TypographyInspector.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/inspector/TypographyInspector.tsx:67>), [docs/production-engine-audit.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/production-engine-audit.md:67>).

**F043 — Pen tool and freeform paths · Implemented · P2**

Vector pen creation is wired to editable curve elements.

Acceptance example 1: Draw a curved connector. Acceptance example 2: Close a custom outline around an illustration.

Evidence / inspected boundary: [src/features/canvas/VectorPenOverlay.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/VectorPenOverlay.tsx:13>).

**F044 — Bézier node and handle editing · Implemented · P2**

Node overlays and curve-handle operations exist.

Acceptance example 1: Smooth an angular curve. Acceptance example 2: Move one handle without moving the endpoint.

Evidence / inspected boundary: [src/features/canvas/NodeToolOverlay.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/NodeToolOverlay.tsx:14>).

**F045 — Shape boolean union, subtract, intersect and exclude · Partial · P2**

Implementation combines subpaths and fill rules; intersect/exclude are not true geometric clipping operations.

Acceptance example 1: Subtract a circle from a rectangle. Acceptance example 2: Keep only the overlap of two circles.

Evidence / inspected boundary: [src/editor/vector/bezier.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/vector/bezier.ts:187>).

**F046 — Image tracing to vector · Partial · P2**

A local image-to-path tracer exists; fidelity and complex artwork conversion remain limited.

Acceptance example 1: Trace a simple black icon. Acceptance example 2: Preserve a detailed multicolour illustration as editable paths.

Evidence / inspected boundary: [src/editor/vector/imageTrace.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/vector/imageTrace.ts:3>).

**F047 — Text inside shapes · Implemented · P1**

Shapes can hold editable inline labels.

Acceptance example 1: Label a flowchart box. Acceptance example 2: Put a number inside a circle.

Evidence / inspected boundary: [src/features/inspector/ShapeInspector.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/inspector/ShapeInspector.tsx:39>), [src/editor/renderer/ElementRenderer.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/ElementRenderer.tsx:226>).

**F048 — Curved text and text on path · Missing · P2**

No textPath or curved-text authoring/rendering pipeline was found.

Acceptance example 1: Set a title on a circular badge. Acceptance example 2: Place a label along a curved arrow.

Evidence / inspected boundary: [src/features/inspector/TypographyInspector.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/inspector/TypographyInspector.tsx:67>), [src/editor/renderer/ElementRenderer.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/ElementRenderer.tsx:226>).

**F049 — Page templates and layout galleries · Implemented · P1**

Reusable page/layout registries and insertion controls exist.

Acceptance example 1: Insert a chapter opener. Acceptance example 2: Apply a two-column exercise layout.

Evidence / inspected boundary: [src/editor/registry/templates.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/registry/templates.ts:4>), [src/features/panels/LeftSidebar.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/LeftSidebar.tsx:45>).

**F050 — Save custom layouts and reusable blocks · Implemented · P1**

Selection-to-layout and My Blocks/preset saving workflows exist.

Acceptance example 1: Save a custom activity card. Acceptance example 2: Reuse a locally saved worksheet layout.

Evidence / inspected boundary: [src/features/panels/CreateLayoutModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/CreateLayoutModal.tsx:17>), [src/features/educational/EducationalBlocksPanel.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/educational/EducationalBlocksPanel.tsx:65>).

**F051 — Global theme and style tokens · Implemented · P1**

Book-scoped global colours, typography and linked block styles exist.

Acceptance example 1: Change the book accent colour. Acceptance example 2: Increase all linked body-text sizes.

Evidence / inspected boundary: [src/editor/theme/designTokens.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/theme/designTokens.ts:8>), [src/editor/design/applyDesign.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/design/applyDesign.ts:13>).

**F052 — Publisher logos and branding · Implemented · P1**

Publisher image/footer integration and page furniture exist.

Acceptance example 1: Place the publisher logo on the cover. Acceptance example 2: Apply a branded footer across book pages.

Evidence / inspected boundary: [src/editor/branding/bookBranding.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/branding/bookBranding.ts:8>), [src/features/panels/PageFrameControls.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/PageFrameControls.tsx:15>).

**F053 — Organization-wide brand kit and locked brand policy · Partial · P2**

Book branding exists; no complete shared organization brand-kit library or policy enforcement was found.

Acceptance example 1: Share approved fonts across five books. Acceptance example 2: Prevent use of an unapproved logo.

Evidence / inspected boundary: [src/editor/branding/bookBranding.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/branding/bookBranding.ts:8>), [src/editor/theme/designTokens.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/theme/designTokens.ts:8>).

**F054 — Smart layout suggestions and auto-arrangement · Implemented · P2**

Local layout analysis and deterministic arrangement engines exist; these are not proof of generative design.

Acceptance example 1: Balance pictures and captions on a page. Acceptance example 2: Detect an overlapping activity card.

Evidence / inspected boundary: [src/editor/layoutPartner/partnerEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/layoutPartner/partnerEngine.ts:14>), [src/editor/core/arrangement.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/core/arrangement.ts:2>).

**F055 — Resize designs across multiple output formats · Partial · P2**

Page-size constraints exist; no Canva-like multi-format duplication and automatic content adaptation workflow was found.

Acceptance example 1: Adapt an A4 worksheet to A5. Acceptance example 2: Create a landscape lesson slide from a book page.

Evidence / inspected boundary: [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>), [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:284>).

**F056 — Template search, favorites and recents · Implemented · P2**

Library search, filters and favorites/recent collections are exposed.

Acceptance example 1: Find mathematics practice blocks. Acceptance example 2: Reinsert a recently used banner.

Evidence / inspected boundary: [src/features/educational/EducationalBlocksPanel.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/educational/EducationalBlocksPanel.tsx:65>), [src/features/panels/LeftSidebar.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/LeftSidebar.tsx:45>).

**F057 — Professional facing-page/spread editing · Partial · P1**

Binding and inside/outside margin data exist; only the active page is edited, with no complete two-page spread authoring workspace.

Acceptance example 1: Check a left/right gutter pair. Acceptance example 2: Edit an illustration spanning both pages.

Evidence / inspected boundary: [src/features/canvas/PageCanvas.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/PageCanvas.tsx:37>), [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>).

### Images, assets and pixel editing

**F058 — Upload, paste and replace images · Implemented · P1**

Image input, direct paste and replacement paths exist.

Acceptance example 1: Paste a diagram from the clipboard. Acceptance example 2: Replace a picture without rebuilding its frame.

Evidence / inspected boundary: [src/features/ui/DirectPasteImageModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/ui/DirectPasteImageModal.tsx:15>), [src/features/educational/ImageControls.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/educational/ImageControls.tsx:10>).

**F059 — Crop, focal position, scale and flip · Implemented · P1**

Image treatments and frame transformations provide these controls.

Acceptance example 1: Crop a landscape photo to a square. Acceptance example 2: Flip a character to face the text.

Evidence / inspected boundary: [src/features/educational/ImageControls.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/educational/ImageControls.tsx:10>), [src/features/canvas/TransformOverlay.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/TransformOverlay.tsx:42>).

**F060 — Picture frames and image masks · Implemented · P1**

Built-in masks and custom path masks exist.

Acceptance example 1: Put a portrait inside a circle. Acceptance example 2: Use a custom SVG silhouette mask.

Evidence / inspected boundary: [src/features/educational/ImageControls.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/educational/ImageControls.tsx:10>).

**F061 — Image colour adjustments and filters · Implemented · P2**

Non-destructive colour/filter treatment is implemented.

Acceptance example 1: Reduce saturation on a photo. Acceptance example 2: Increase brightness on a dark illustration.

Evidence / inspected boundary: [src/features/educational/ImageControls.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/educational/ImageControls.tsx:10>), [src/editor/renderer/ElementRenderer.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/ElementRenderer.tsx:226>).

**F062 — Local background removal · Partial · P1**

Real edge-aware local segmentation and matte refinement exist; quality is not equivalent to a semantic AI subject remover for all photographs.

Acceptance example 1: Remove a white background from a diagram. Acceptance example 2: Cut out hair against a complex background.

Evidence / inspected boundary: [src/editor/pixel/backgroundRemoval.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/pixel/backgroundRemoval.ts:32>).

**F063 — Brush and eraser · Implemented · P2**

Raster strokes and eraser compositing are implemented.

Acceptance example 1: Paint a coloured annotation. Acceptance example 2: Erase part of a bitmap layer.

Evidence / inspected boundary: [src/features/canvas/PixelBrushOverlay.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/PixelBrushOverlay.tsx:186>).

**F064 — Raster selection and masks · Partial · P2**

Selection algorithms exist; a complete integrated production selection/refinement workflow is not established by this audit.

Acceptance example 1: Select a flat background by colour. Acceptance example 2: Refine a complex lasso selection.

Evidence / inspected boundary: [src/editor/pixel/selectionEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/pixel/selectionEngine.ts:7>).

**F065 — Clone stamp · Stub · P2**

cloneStamp activates the pixel overlay, but the stroke commit branch has no cloneStamp drawing implementation.

Acceptance example 1: Sample a source region with Alt. Acceptance example 2: Paint a copied texture onto another region.

Evidence / inspected boundary: [src/features/canvas/PixelBrushOverlay.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/PixelBrushOverlay.tsx:186>).

**F066 — Healing and object removal · Partial · P2**

Healing uses a fixed-offset patch at dx 30 with feathering; no semantic object removal or source-aware healing was found.

Acceptance example 1: Remove a small blemish. Acceptance example 2: Remove an object without duplicating nearby content.

Evidence / inspected boundary: [src/features/canvas/PixelBrushOverlay.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/PixelBrushOverlay.tsx:186>).

**F067 — Local picture and illustration presets · Implemented · P1**

Bundled educational artwork and starter/preset browsing exist, including the current clay additions.

Acceptance example 1: Insert a clay calculator illustration. Acceptance example 2: Find an existing mathematics diagram.

Evidence / inspected boundary: [src/editor/media/picturePresetCatalog.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/media/picturePresetCatalog.ts:3>), [src/features/panels/PicturePresetLibrary.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/PicturePresetLibrary.tsx:34>).

**F068 — Cloud picture repository and verified asset revisions · Unverified · P2**

Authenticated upload/confirm and revision-pinned delivery paths exist; live backend success was not exercised in this audit.

Acceptance example 1: Upload an illustration and confirm its checksum. Acceptance example 2: Reuse its pinned cloud revision in another book.

Evidence / inspected boundary: [src/features/panels/PicturePresetLibrary.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/PicturePresetLibrary.tsx:34>).

**F069 — Asset rights and attribution tracking · Missing · P1**

No complete per-asset rights/license/attribution review and generated credits workflow was found.

Acceptance example 1: Record an illustrator permission. Acceptance example 2: Generate a picture-credit page.

Evidence / inspected boundary: [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>), [src/features/panels/PicturePresetLibrary.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/PicturePresetLibrary.tsx:34>).

**F070 — AI image generation from arbitrary prompts · Stub · P2**

The current provider draws a few procedural canvas scenes from keyword/style branches; no real image model call is made.

Acceptance example 1: Generate a specific jungle scene. Acceptance example 2: Produce a custom illustration matching a detailed brief.

Evidence / inspected boundary: [src/editor/ai/aiProvider.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/ai/aiProvider.ts:64>).

**F071 — AI vector generation from arbitrary prompts · Stub · P2**

Provider returns preset SVG content under invented model metadata; no generative vector service is called.

Acceptance example 1: Generate a custom plant diagram. Acceptance example 2: Create a matching original mascot pose.

Evidence / inspected boundary: [src/editor/ai/aiProvider.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/ai/aiProvider.ts:231>).

**F072 — Generative fill/inpainting · Stub · P0**

Direct invocation confirmed the method returns the original image URL and reports ready without editing pixels.

Acceptance example 1: Replace only a masked sky region. Acceptance example 2: Remove an object while preserving the surrounding image.

Evidence / inspected boundary: [src/editor/ai/aiProvider.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/ai/aiProvider.ts:324>).

**F073 — Generative expand/outpainting · Stub · P0**

Method creates a gradient canvas without drawing the input image; the store replaces the source with that result.

Acceptance example 1: Extend a photo beyond its edges. Acceptance example 2: Keep the original subject intact after expansion.

Evidence / inspected boundary: [src/editor/ai/aiProvider.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/ai/aiProvider.ts:343>).

**F074 — Real image upscaling and truthful DPI · Stub · P0**

Direct invocation returned the original image with reported 600 DPI; store multiplies rawWidthPx and claims a completed upscale.

Acceptance example 1: Increase actual pixels from 800 to 3200. Acceptance example 2: Keep preflight DPI tied to decoded image dimensions.

Evidence / inspected boundary: [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:1734>).

### Tables, charts and scientific content

**F075 — Editable table headers and cell text · Implemented · P1**

Native table renderer exposes editable headers/cells with store updates.

Acceptance example 1: Edit a rubric cell. Acceptance example 2: Rename a data-table column.

Evidence / inspected boundary: [src/editor/renderer/ElementRenderer.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/ElementRenderer.tsx:226>), [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:995>).

**F076 — Table row and column insertion/deletion · Partial · P1**

Actions append/pop rows and columns; insertion at a chosen cell and general reorder operations were not found.

Acceptance example 1: Add one row at the end. Acceptance example 2: Insert a row above the selected middle row.

Evidence / inspected boundary: [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:995>).

**F077 — Merge/split cells and advanced table sizing · Missing · P1**

Native model uses headers and string-array rows without merged-cell spans or a full cell sizing engine.

Acceptance example 1: Merge a heading across three columns. Acceptance example 2: Resize a single column independently.

Evidence / inspected boundary: [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:995>).

**F078 — Table continuation with repeated headers · Partial · P1**

Manuscript conversion can paginate table content as text frames; native tables are indivisible in generic flow and lack true repeated-header continuation.

Acceptance example 1: Flow a 60-row table over three pages. Acceptance example 2: Repeat headers on every continuation page.

Evidence / inspected boundary: [src/editor/core/paginationEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/core/paginationEngine.ts:7>), [docs/manuscript-import.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/manuscript-import.md:13>).

**F079 — Spreadsheet-linked charts and generic chart editor · Missing · P2**

Educational data visuals exist; no general chart editor with CSV/XLSX/live spreadsheet data binding was found.

Acceptance example 1: Import sales data into a chart. Acceptance example 2: Change source values and update the plot.

Evidence / inspected boundary: [src/editor/math/mathRegistry.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/math/mathRegistry.ts:111>), [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:995>).

**F080 — Educational charts and pictographs · Implemented · P1**

Math templates include editable data/chart/pictograph families.

Acceptance example 1: Build a fruit-vote pictograph. Acceptance example 2: Show classroom counts in a bar chart.

Evidence / inspected boundary: [src/editor/math/mathRegistry.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/math/mathRegistry.ts:111>), [src/editor/math/MathTemplateInspector.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/math/MathTemplateInspector.tsx:28>).

**F081 — Mathematics symbols and Unicode glyphs · Implemented · P1**

Glyph and mathematics symbol insertion tools exist.

Acceptance example 1: Insert a multiplication sign. Acceptance example 2: Insert a Greek alpha symbol.

Evidence / inspected boundary: [src/features/palette/GlyphBrowserModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/palette/GlyphBrowserModal.tsx:35>), [src/editor/renderer/RichTextInlineEditor.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/RichTextInlineEditor.tsx:128>).

**F082 — Structured equation editing and LaTeX/MathML · Missing · P1**

Math templates and superscripts exist; no general equation tree or LaTeX/MathML import/edit/export pipeline was found.

Acceptance example 1: Edit a nested algebraic fraction. Acceptance example 2: Insert an integral from LaTeX.

Evidence / inspected boundary: [src/editor/math/mathRegistry.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/math/mathRegistry.ts:111>), [src/editor/renderer/RichTextInlineEditor.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/RichTextInlineEditor.tsx:128>).

**F083 — Editable primary mathematics diagrams · Implemented · P1**

Number lines, fractions, place value, geometry, time and measurement templates have editable data/design controls.

Acceptance example 1: Create a fraction strip. Acceptance example 2: Edit a clock to show half past three.

Evidence / inspected boundary: [src/editor/math/mathRegistry.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/math/mathRegistry.ts:111>), [src/editor/math/MathTemplateInspector.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/math/MathTemplateInspector.tsx:28>).

**F084 — Diagram connectors that stay attached · Missing · P2**

Arrows and lines exist; no endpoint attachment/rerouting graph model was found.

Acceptance example 1: Move a flowchart box and keep its arrows attached. Acceptance example 2: Automatically route a connector around another box.

Evidence / inspected boundary: [src/features/inspector/ShapeInspector.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/inspector/ShapeInspector.tsx:39>), [src/editor/renderer/ElementRenderer.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/ElementRenderer.tsx:226>).

### Book structure and print production

**F085 — Units, chapters and semantic hierarchy · Implemented · P1**

Book-to-question hierarchy is derived from chapter frameworks and typed content.

Acceptance example 1: Add a unit with three chapters. Acceptance example 2: Inspect questions within an exercise.

Evidence / inspected boundary: [src/editor/structure/bookStructureEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/structure/bookStructureEngine.ts:123>), [src/editor/curriculum/chapterEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/curriculum/chapterEngine.ts:21>).

**F086 — Chapter/lesson outline and structure navigation · Implemented · P1**

Structure tree and chapter panels expose derived content navigation.

Acceptance example 1: Jump to a lesson from the outline. Acceptance example 2: Inspect chapter page ownership.

Evidence / inspected boundary: [src/features/palette/BookStructureModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/palette/BookStructureModal.tsx:48>), [src/features/panels/LeftSidebar.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/LeftSidebar.tsx:45>).

**F087 — Automatic table of contents · Implemented · P1**

Live TOC generation and page targets are implemented; clickable PDF navigation is a separate gap.

Acceptance example 1: Generate TOC entries from chapters. Acceptance example 2: Update page references after moving pages.

Evidence / inspected boundary: [src/editor/structure/bookStructureEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/structure/bookStructureEngine.ts:123>), [src/features/palette/BookStructureModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/palette/BookStructureModal.tsx:48>).

**F088 — Roman/Arabic and chapter/page numbering · Implemented · P1**

Continuous and front-matter numbering modes plus structural numbering exist.

Acceptance example 1: Use Roman numbers for front matter. Acceptance example 2: Restart visible Arabic numbering at chapter 1.

Evidence / inspected boundary: [src/editor/structure/bookStructureEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/structure/bookStructureEngine.ts:123>), [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>).

**F089 — Figure/question numbering and cross-references · Implemented · P1**

Native figure/question labels and stored reference templates synchronize with structure.

Acceptance example 1: Update a figure reference after reorder. Acceptance example 2: Flag a deleted question reference.

Evidence / inspected boundary: [src/editor/structure/bookStructureEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/structure/bookStructureEngine.ts:123>).

**F090 — Running headers, footers and master pages · Implemented · P1**

Preset masters propagate page furniture with explicit override preservation.

Acceptance example 1: Change every linked exercise footer. Acceptance example 2: Preserve a manually overridden page header.

Evidence / inspected boundary: [src/editor/layout/masterPageEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/layout/masterPageEngine.ts:20>).

**F091 — Margins, bleed and binding settings · Implemented · P1**

Inside/outside margins, bleed and binding fields feed layout and proofs; settings alone do not certify a printer profile.

Acceptance example 1: Set extra inside gutter space. Acceptance example 2: Add configured bleed around artwork.

Evidence / inspected boundary: [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>), [src/editor/layout/masterPageEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/layout/masterPageEngine.ts:20>).

**F092 — Page borders and imported border artwork · Implemented · P2**

Editable page furniture plus Word/PDF border import workflows exist.

Acceptance example 1: Apply a border across the book. Acceptance example 2: Import a border from a Word template.

Evidence / inspected boundary: [src/features/panels/PageFrameControls.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/PageFrameControls.tsx:15>).

**F093 — Front and back matter templates · Partial · P1**

Title/copyright/preface and cover-like templates exist; no comprehensive structured publication-metadata workflow was found.

Acceptance example 1: Add a title and copyright page. Acceptance example 2: Generate edition/imprint/ISBN details consistently.

Evidence / inspected boundary: [src/editor/registry/templates.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/registry/templates.ts:4>), [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>).

**F094 — Full wrap cover and spine calculator · Missing · P1**

spineWidthPt and cover preview fields exist; no production front-plus-spine-plus-back cover editor/calculator was found.

Acceptance example 1: Calculate a 200-page paperback spine. Acceptance example 2: Export a continuous full-wrap cover PDF.

Evidence / inspected boundary: [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>), [src/features/three/Book3dPreviewModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/three/Book3dPreviewModal.tsx:80>).

**F095 — ISBN/EAN barcode generation and validation · Missing · P1**

Smart QR is implemented; no publishing ISBN/EAN-13 barcode workflow was found.

Acceptance example 1: Generate a valid ISBN barcode. Acceptance example 2: Reserve its safe area on the back cover.

Evidence / inspected boundary: [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>), [src/features/media/SmartQrPanel.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/media/SmartQrPanel.tsx:18>).

**F096 — 3D book mockup preview · Partial · P3**

A generic Three.js book preview exists; printer-accurate binding dimensions and page/cover proof fidelity are not established.

Acceptance example 1: Rotate a book mockup. Acceptance example 2: Preview the actual exported full-wrap cover.

Evidence / inspected boundary: [src/features/three/Book3dPreviewModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/three/Book3dPreviewModal.tsx:80>).

**F097 — Preflight for overflow, assets, fonts and references · Implemented · P1**

Worker checks cover key content/layout/font/asset/QR/reference issues and can block export.

Acceptance example 1: Block export of overset text. Acceptance example 2: Report a missing image or broken reference.

Evidence / inspected boundary: [src/editor/publishing/preflightEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/publishing/preflightEngine.ts:4>).

**F098 — Printer profiles, colour separations and ink checks · Missing · P1**

No ICC CMYK/PDF-X/spot-colour/overprint/ink-limit production pipeline exists.

Acceptance example 1: Use a printer supplied ICC profile. Acceptance example 2: Inspect excessive total ink coverage.

Evidence / inspected boundary: [docs/production-engine-audit.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/production-engine-audit.md:67>), [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

**F099 — Imposition and signatures · Missing · P2**

No booklet signature imposition or binding-specific sheet output workflow was found.

Acceptance example 1: Arrange a 16-page saddle-stitch signature. Acceptance example 2: Export duplex printer sheets.

Evidence / inspected boundary: [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

### Educational authoring and assistance

**F100 — Structured curriculum/chapter builder · Implemented · P1**

Six-stage chapter planning and measured composition exist; generated frameworks require authored/reviewed teaching content.

Acceptance example 1: Compose a Learn-to-Practice chapter. Acceptance example 2: Reflow an edited review section.

Evidence / inspected boundary: [src/features/curriculum/SmartChapterBuilder.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/curriculum/SmartChapterBuilder.tsx:14>), [src/editor/curriculum/chapterEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/curriculum/chapterEngine.ts:21>).

**F101 — Educational block library · Implemented · P1**

Categorized learning blocks, variants, searchable templates and insertion exist.

Acceptance example 1: Add a worked example. Acceptance example 2: Add a matching activity.

Evidence / inspected boundary: [src/features/educational/EducationalBlocksPanel.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/educational/EducationalBlocksPanel.tsx:65>).

**F102 — Edit block text, images and semantic slots · Implemented · P1**

Block-content editing preserves semantic slots and supports subobject changes.

Acceptance example 1: Edit a learning objective inside a card. Acceptance example 2: Replace the image in an activity block.

Evidence / inspected boundary: [src/editor/educational/blockContentEditing.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/educational/blockContentEditing.ts:7>).

**F103 — Detach blocks into independently editable objects · Implemented · P2**

Scene detach produces native movable text/image/vector objects.

Acceptance example 1: Detach a ribbon into layers. Acceptance example 2: Move one extracted illustration independently.

Evidence / inspected boundary: [src/editor/educational/detachScene.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/educational/detachScene.ts:11>).

**F104 — Block resizing and content fit · Implemented · P1**

Corner scaling and side trimming distinguish content scale from frame whitespace changes.

Acceptance example 1: Scale a complete activity card. Acceptance example 2: Trim empty space without shrinking text.

Evidence / inspected boundary: [src/features/canvas/TransformOverlay.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/TransformOverlay.tsx:42>), [src/editor/educational/blockContentEditing.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/educational/blockContentEditing.ts:7>).

**F105 — Learning outcomes and study-skill structures · Implemented · P1**

Semantic learning outcomes and study-skill components have dedicated editing controls.

Acceptance example 1: Add an observable learning outcome. Acceptance example 2: Build a study-skills recap card.

Evidence / inspected boundary: [src/features/curriculum/LearningOutcomesTopicEditor.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/curriculum/LearningOutcomesTopicEditor.tsx:88>), [src/features/educational/EducationalBlocksPanel.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/educational/EducationalBlocksPanel.tsx:65>).

**F106 — Teacher answers and student-facing export · Partial · P1**

Student print paths suppress answer keys; a complete distinct teacher-edition export workflow was not found.

Acceptance example 1: Export exercises without answers. Acceptance example 2: Produce a teacher edition containing all answer guidance.

Evidence / inspected boundary: [src/editor/publishing/publicationPrint.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/publishing/publicationPrint.ts:15>), [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

**F107 — Question-bank links and reuse · Unverified · P2**

Semantic snapshots model question references and central workflows; authenticated cross-book bank behavior was not exercised.

Acceptance example 1: Reuse an approved question. Acceptance example 2: Pin an exercise to an exact reviewed revision.

Evidence / inspected boundary: [src/editor/persistence/bookSnapshots.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/persistence/bookSnapshots.ts:6>), [src/features/curriculum/CentralReviewPanel.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/curriculum/CentralReviewPanel.tsx:9>).

**F108 — Smart QR linked learning resources · Unverified · P1**

Resource selection and decoder-verified artifacts are implemented; current authenticated service/resource availability is unverified.

Acceptance example 1: Print a valid audio-resource QR. Acceptance example 2: Block an unlinked QR before export.

Evidence / inspected boundary: [src/features/media/SmartQrPanel.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/media/SmartQrPanel.tsx:18>).

**F109 — AI curriculum drafting · Unverified · P2**

A real server-side OpenAI call and structured schema exist; successful configured API execution was not checked.

Acceptance example 1: Draft age-appropriate practice questions. Acceptance example 2: Review an AI draft before applying it.

Evidence / inspected boundary: [src/app/api/curriculum-assist/route.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/app/api/curriculum-assist/route.ts:11>).

**F110 — Quick AI rewriting · Stub · P0**

Rewrite for Grade 5 appends a fixed parenthetical rather than rewriting content.

Acceptance example 1: Simplify a complex science paragraph. Acceptance example 2: Preserve facts while adapting reading level.

Evidence / inspected boundary: [src/features/canvas/SmartQuickActionBar.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/SmartQuickActionBar.tsx:730>).

**F111 — Quick AI vocabulary simplification · Stub · P0**

Action replaces every word of eight or more ASCII word characters with simple, regardless of meaning.

Acceptance example 1: Simplify difficult vocabulary in context. Acceptance example 2: Preserve names and scientific terms.

Evidence / inspected boundary: [src/features/canvas/SmartQuickActionBar.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/canvas/SmartQuickActionBar.tsx:730>).

**F112 — Automated academic fact/curriculum validation · Missing · P2**

Structured templates and AI drafts do not provide fact-checking or standards-compliance certification.

Acceptance example 1: Check a science claim against a source. Acceptance example 2: Verify chapter coverage against a syllabus.

Evidence / inspected boundary: [src/app/api/curriculum-assist/route.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/app/api/curriculum-assist/route.ts:11>), [src/editor/curriculum/chapterEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/curriculum/chapterEngine.ts:21>).

**F113 — Batch personalization and data merge · Partial · P2**

Current-page text replacement from manually entered fixed-field records exists; no CSV/XLSX mapping or rich semantic slot merge was found.

Acceptance example 1: Create a named certificate per student. Acceptance example 2: Import 500 rows and map columns to worksheet fields.

Evidence / inspected boundary: [src/features/publishing/DataMergeModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/DataMergeModal.tsx:8>), [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:284>).

### Review, collaboration and persistence

**F114 — Local editorial comments and resolve/delete · Implemented · P1**

Page/element comments are stored locally and exposed in Review/Inspector; they are not tracked changes.

Acceptance example 1: Comment on a figure. Acceptance example 2: Resolve an editorial correction.

Evidence / inspected boundary: [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:2019>), [src/features/panels/LeftSidebar.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/LeftSidebar.tsx:45>).

**F115 — Comment threads, mentions and notifications · Missing · P2**

Flat comments lack a complete reply-thread, mention and notification workflow.

Acceptance example 1: Reply within a specific review thread. Acceptance example 2: Notify an assigned author using a mention.

Evidence / inspected boundary: [src/editor/stores/editorStore.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/stores/editorStore.ts:2019>).

**F116 — Central review, assignments and release approvals · Unverified · P1**

Central submit/reviewer/comment/approve/publish calls exist; server enforcement and live workflow completion were not exercised.

Acceptance example 1: Assign an academic reviewer. Acceptance example 2: Require approval before releasing a central version.

Evidence / inspected boundary: [src/features/curriculum/CentralReviewPanel.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/curriculum/CentralReviewPanel.tsx:9>).

**F117 — Revision history and restore · Unverified · P1**

Central saved revision/history/restore calls exist; successful authenticated restore remains unverified.

Acceptance example 1: Restore a prior saved chapter. Acceptance example 2: Inspect who authored a central revision.

Evidence / inspected boundary: [src/features/curriculum/CentralReviewPanel.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/curriculum/CentralReviewPanel.tsx:9>), [src/editor/persistence/bookSnapshots.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/persistence/bookSnapshots.ts:6>).

**F118 — Real-time simultaneous co-editing · Missing · P2**

Presence heartbeats and optimistic save conflicts exist; no live text/object operation replication or CRDT/OT editing was found.

Acceptance example 1: Let two authors edit the same paragraph. Acceptance example 2: Show another designer moving an object in real time.

Evidence / inspected boundary: [src/features/curriculum/ChapterPresence.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/curriculum/ChapterPresence.tsx:4>), [src/editor/persistence/cloudSaveController.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/persistence/cloudSaveController.ts:4>).

**F119 — Presence indicators · Unverified · P2**

Heartbeat editor lists and presence release calls exist; live backend behavior was not exercised and these calls do not establish exclusive chapter locking.

Acceptance example 1: See another chapter editor online. Acceptance example 2: See who last edited the chapter.

Evidence / inspected boundary: [src/features/curriculum/ChapterPresence.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/curriculum/ChapterPresence.tsx:4>).

**F120 — Local autosave and crash recovery · Implemented · P1**

IndexedDB persistence, durable status and recovery snapshots exist with regression tests.

Acceptance example 1: Recover a durably saved edit after reload. Acceptance example 2: Report an IndexedDB transaction failure.

Evidence / inspected boundary: [src/editor/persistence/indexedDbStorage.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/persistence/indexedDbStorage.ts:16>), [src/editor/persistence/offlineShell.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/persistence/offlineShell.ts:6>).

**F121 — Offline editing after initial cache warm-up · Partial · P1**

Production shell/font/media caching exists; first-ever offline load and uncached remote resources cannot work.

Acceptance example 1: Reload a previously cached book offline. Acceptance example 2: Continue editing an uncached central chapter offline.

Evidence / inspected boundary: [src/editor/persistence/offlineShell.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/persistence/offlineShell.ts:6>), [docs/production-engine-audit.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/production-engine-audit.md:67>).

**F122 — Cloud save, retries and conflict handling · Unverified · P1**

Retry/receipt/base-token/conflict paths exist and local tests pass; live account/backend end-to-end behavior was not checked.

Acceptance example 1: Retry a pending save after reconnection. Acceptance example 2: Protect a local edit when the server revision changed.

Evidence / inspected boundary: [src/editor/persistence/cloudSaveController.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/persistence/cloudSaveController.ts:4>).

**F123 — Portable complete-book project backup · Partial · P1**

Local recovery and chapter recovery JSON paths exist; no clear complete standalone book-project file round-trip UI was found.

Acceptance example 1: Download a full book with assets as one project. Acceptance example 2: Restore that project on another machine.

Evidence / inspected boundary: [src/editor/persistence/bookSnapshots.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/persistence/bookSnapshots.ts:6>), [src/features/curriculum/CentralReviewPanel.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/curriculum/CentralReviewPanel.tsx:9>).

**F124 — Large-book responsiveness and stability · Partial · P1**

Bounded page previews, incremental flow and worker preflight exist; current 420-test pass does not certify very large image-heavy books or 60 FPS.

Acceptance example 1: Edit page 180 of a 220-page book. Acceptance example 2: Sustain smooth editing in a 1000-page image-heavy book.

Evidence / inspected boundary: [src/editor/performance/largeBookEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/performance/largeBookEngine.ts:12>), [docs/production-engine-audit.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/production-engine-audit.md:67>).

### Import, export and interoperability

**F125 — DOCX manuscript import and continuation · Partial · P1**

Local Word conversion retains editable content but reflows it and simplifies layout, merged tables, comments and revisions.

Acceptance example 1: Continue an unfinished Word chapter. Acceptance example 2: Import a heavily formatted Word file with layout fidelity.

Evidence / inspected boundary: [src/editor/importing/readManuscript.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/importing/readManuscript.ts:3>), [docs/manuscript-import.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/manuscript-import.md:13>).

**F126 — PDF artwork preservation import · Partial · P1**

PDF pages become locked raster artwork with documented resolution caps; native vector objects stay unavailable.

Acceptance example 1: Preserve ten completed PDF pages. Acceptance example 2: Independently edit their text and illustration paths.

Evidence / inspected boundary: [src/editor/importing/readPdf.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/importing/readPdf.ts:3>), [docs/manuscript-import.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/manuscript-import.md:13>).

**F127 — PDF editable text extraction · Partial · P1**

Extractable text is imported; reading order and rich layout are not reconstructed, and OCR is absent.

Acceptance example 1: Extract searchable PDF text. Acceptance example 2: Reconstruct a three-column scanned textbook page.

Evidence / inspected boundary: [src/editor/importing/readPdf.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/importing/readPdf.ts:3>), [docs/manuscript-import.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/manuscript-import.md:13>).

**F128 — Text and Markdown import · Partial · P1**

Body paragraphs and hash headings work; Markdown inline markup stays literal.

Acceptance example 1: Import a plain-text manuscript. Acceptance example 2: Convert bold Markdown and a Markdown table into rich objects.

Evidence / inspected boundary: [src/editor/importing/readManuscript.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/importing/readManuscript.ts:3>), [docs/manuscript-import.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/manuscript-import.md:13>).

**F129 — Google Docs integration · Partial · P2**

Document must be downloaded as Word/PDF first; no live Google Docs connector exists in the application.

Acceptance example 1: Import a downloaded Google Doc. Acceptance example 2: Sync manuscript edits directly from Google Docs.

Evidence / inspected boundary: [docs/manuscript-import.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/manuscript-import.md:13>).

**F130 — OCR for scanned pages · Missing · P2**

No OCR engine or scanned-text reconstruction path was found.

Acceptance example 1: Recognize a photographed printed page. Acceptance example 2: Extract Hindi text from a scanned PDF.

Evidence / inspected boundary: [src/editor/importing/readPdf.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/importing/readPdf.ts:3>).

**F131 — Editable DOCX export and round trip · Missing · P1**

Export UI/handlers generate PDF proofs; no DOCX writer exists.

Acceptance example 1: Send an editable manuscript to a copyeditor. Acceptance example 2: Round-trip tables and styles through Word.

Evidence / inspected boundary: [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

**F132 — Editable PDF object reconstruction · Missing · P2**

Artwork/text import modes do not reconstruct an editable PDF design scene.

Acceptance example 1: Change one word in an imported PDF layout. Acceptance example 2: Edit its original vector diagram independently.

Evidence / inspected boundary: [src/editor/importing/readPdf.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/importing/readPdf.ts:3>), [docs/manuscript-import.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/manuscript-import.md:13>).

**F133 — Font-embedded print PDF proof · Implemented · P1**

Bundled-font browser print proof supports scope and preflight; output is RGB and printer certification is separate.

Acceptance example 1: Export a Telugu worksheet. Acceptance example 2: Export exactly physical pages 180 through 182.

Evidence / inspected boundary: [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>), [src/editor/publishing/publicationPrint.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/publishing/publicationPrint.ts:15>).

**F134 — Legacy Latin vector PDF · Partial · P2**

jsPDF path exists; Indic scripts are blocked and some legacy graphics are simplified.

Acceptance example 1: Export supported Latin text as vectors. Acceptance example 2: Preserve every legacy filter and graphic effect.

Evidence / inspected boundary: [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

**F135 — Student digital PDF export · Partial · P1**

RGB PDF and student answer suppression exist; clickable navigation and tagged accessibility are missing.

Acceptance example 1: Export a student workbook. Acceptance example 2: Provide accessible clickable digital-book navigation.

Evidence / inspected boundary: [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>), [src/editor/publishing/publicationPrint.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/publishing/publicationPrint.ts:15>).

**F136 — Chapter, selected-pages and whole-book scope · Implemented · P1**

Strict scopes and range validation exist; full linked books load local receipts first.

Acceptance example 1: Export a single chapter. Acceptance example 2: Reject an inverted page range instead of exporting everything.

Evidence / inspected boundary: [src/editor/publishing/exportScope.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/publishing/exportScope.ts:4>), [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

**F137 — PNG/JPEG/SVG page and selection export · Missing · P2**

Types mention image outputs, but no user-facing page/selection image or SVG export path was found.

Acceptance example 1: Export a worksheet as PNG. Acceptance example 2: Export a selected vector illustration as SVG.

Evidence / inspected boundary: [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

**F138 — EPUB/reflowable and fixed-layout ebook export · Missing · P2**

No EPUB package/navigation/export implementation was found.

Acceptance example 1: Export a reflowable story ebook. Acceptance example 2: Export an illustrated fixed-layout ebook.

Evidence / inspected boundary: [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

**F139 — Accessible tagged PDF and reading order · Missing · P1**

Existing proofs are explicitly untagged; no PDF structure tree/reading-order/alt-text certification exists.

Acceptance example 1: Read a multi-column PDF with a screen reader. Acceptance example 2: Expose meaningful image descriptions in tagged PDF.

Evidence / inspected boundary: [docs/production-engine-audit.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/production-engine-audit.md:67>), [src/editor/publishing/publicationPrint.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/publishing/publicationPrint.ts:15>).

**F140 — Printer-specific PDF/X and ICC CMYK export · Missing · P1**

RGB print proof is explicitly not PDF/X or colour-managed CMYK.

Acceptance example 1: Deliver a printer-required PDF/X file. Acceptance example 2: Convert colour using a supplied output profile.

Evidence / inspected boundary: [docs/production-engine-audit.md](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /docs/production-engine-audit.md:67>), [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

### PowerPoint and classroom presentations

**F141 — Dedicated slide document and aspect ratios · Missing · P2**

Book pages can be landscape, but no slide document/mode with 16:9/4:3 semantics was found.

Acceptance example 1: Create a 16:9 classroom deck. Acceptance example 2: Maintain a separate 4:3 deck.

Evidence / inspected boundary: [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>), [src/features/editor/BookEditorWorkspace.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/editor/BookEditorWorkspace.tsx:152>).

**F142 — Slide sorter, sections and hide-slide controls · Missing · P2**

Book page thumbnails exist; presentation-specific sections, hidden slides and deck navigation are absent.

Acceptance example 1: Reorder slides in a deck sorter. Acceptance example 2: Hide the answer slide during a lesson.

Evidence / inspected boundary: [src/features/panels/LeftSidebar.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/LeftSidebar.tsx:45>).

**F143 — Slide masters and slide layout placeholders · Partial · P2**

Book masters/custom layouts provide reusable foundations; actual slide masters/title/body/media placeholders are absent.

Acceptance example 1: Change the title position on all slides. Acceptance example 2: Reuse a title-and-content slide layout.

Evidence / inspected boundary: [src/editor/layout/masterPageEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/layout/masterPageEngine.ts:20>), [src/features/panels/CreateLayoutModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/panels/CreateLayoutModal.tsx:17>).

**F144 — PPTX import as editable slides · Missing · P2**

Manuscript reader dispatch supports Word/PDF/text/Markdown, not PPTX.

Acceptance example 1: Import a teacher PowerPoint. Acceptance example 2: Keep slide shapes and text editable.

Evidence / inspected boundary: [src/editor/importing/readManuscript.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/importing/readManuscript.ts:3>).

**F145 — PPTX export with editable objects · Missing · P2**

No PPTX writer or PowerPoint export handler was found.

Acceptance example 1: Export a book lesson as editable slides. Acceptance example 2: Edit exported diagrams inside PowerPoint.

Evidence / inspected boundary: [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

**F146 — Book chapter to slide-deck conversion · Missing · P2**

No conversion pipeline selects lesson summaries and builds slide-sized layouts.

Acceptance example 1: Create a deck from a 12-page chapter. Acceptance example 2: Split a long lesson into readable slides.

Evidence / inspected boundary: [src/editor/curriculum/chapterEngine.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/curriculum/chapterEngine.ts:21>), [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

**F147 — Speaker notes and presenter view · Missing · P3**

No slide note records or audience/presenter display workflow was found.

Acceptance example 1: Show teaching notes privately. Acceptance example 2: Show the next slide and lesson timer to the teacher.

Evidence / inspected boundary: [src/features/editor/BookEditorWorkspace.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/editor/BookEditorWorkspace.tsx:152>), [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>).

**F148 — Fullscreen slideshow and navigation · Missing · P2**

Browser fullscreen expands the editor; it is not an audience-only slideshow.

Acceptance example 1: Present from the current slide. Acceptance example 2: Advance slides without showing editor controls.

Evidence / inspected boundary: [src/features/editor/BookEditorWorkspace.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/editor/BookEditorWorkspace.tsx:152>).

**F149 — Animations, transitions and object timing · Missing · P3**

No presentation timeline/transition/object-animation model was found.

Acceptance example 1: Reveal answers one at a time. Acceptance example 2: Animate a diagram explanation in order.

Evidence / inspected boundary: [src/domain/book/types.ts](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/domain/book/types.ts:195>), [src/editor/renderer/ElementRenderer.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/ElementRenderer.tsx:226>).

**F150 — Audio/video embedding, narration and slide recording · Missing · P3**

QR-linked media is separate from embedded presentation playback and recording.

Acceptance example 1: Play an embedded pronunciation clip. Acceptance example 2: Record a narrated lesson deck.

Evidence / inspected boundary: [src/features/media/SmartQrPanel.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/media/SmartQrPanel.tsx:18>), [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

**F151 — Handouts and notes-page export · Missing · P3**

No two/six-slides-per-page handout or slide-notes export exists.

Acceptance example 1: Print six slides per page. Acceptance example 2: Print one slide with its speaker notes.

Evidence / inspected boundary: [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

**F152 — Interactive slide links and lesson navigation · Missing · P3**

No slide-to-slide interaction graph or presentation hyperlink controls were found.

Acceptance example 1: Jump from a quiz answer to feedback. Acceptance example 2: Return to the lesson menu using a button.

Evidence / inspected boundary: [src/editor/renderer/ElementRenderer.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/editor/renderer/ElementRenderer.tsx:226>), [src/features/publishing/ExportModal.tsx](</Users/bhanureddy/Desktop/Single Source of truth/NEX MAXX Book Studio /src/features/publishing/ExportModal.tsx:25>).

## Official benchmark sources

The checklist combines these documented product/format capabilities with book-specific requirements inferred from the current studio workflow. A cited benchmark does not prove NEX MAXX implements it.

- [Canva feature catalog](https://www.canva.com/features/) — Benchmark for design, asset, image, AI and format adaptation capabilities; this checklist does not claim every Canva capability is essential for books.
- [Canva background remover](https://www.canva.com/features/background-remover/) — Reference for image subject removal; local segmentation quality must be evaluated separately.
- [Google Docs suggestions](https://support.google.com/docs/answer/6033474?hl=en) — Benchmark for reviewable insertions/deletions and accept/reject, distinct from comments.
- [Google Docs citations](https://support.google.com/docs/answer/10090962?hl=en) — Reference for source records and automatic citations/bibliographies.
- [PowerPoint slide masters](https://support.microsoft.com/en-us/PowerPoint/training/customize-a-slide-master) — Benchmark for slide layout inheritance and master editing.
- [PowerPoint presenter view](https://support.microsoft.com/en-us/powerpoint/training/start-the-presentation-and-see-your-notes-in-presenter-view) — Benchmark for separate presenter notes and audience display.
- [KDP paperback formatting](https://kdp.amazon.com/en_US/help/topic/G201834190) — Book-specific benchmark: separate interior and front/spine/back cover, trim, margins and front/back matter. Printer profiles vary; generic crop-mark settings are not universal compliance.
- [EPUB 3.3 specification](https://www.w3.org/TR/epub-33/) — Reference for an ebook packaging/navigation deliverable; generating a PDF does not produce EPUB.

## Audit limits

- Implemented means a real code path was found; not every feature received a browser interaction test.
- Missing means no usable implementation was found in inspected src paths. Negative findings are bounded by this repository snapshot.
- Unverified means an implementation exists but depends on authenticated backend, configured API, or target environment that this audit did not exercise.
- Existing production-browser audit reports are historical evidence, not a freshly rerun production release or printer/device certification.
- Counts are checklist items, not a percentage of Canva/Docs/PowerPoint parity; items differ in scope.
- Full PowerPoint, advanced graphics and ebook features are expansion scope; P3 items are optional for static book creation.
