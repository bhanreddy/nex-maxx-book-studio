# NEX MAXX local-first publishing engine audit

Audit conducted 2026-10-01–2026-10-02. The working tree already contained extensive uncommitted publishing work. That implementation was inspected before editing and preserved. No new application libraries, replacement document model, parallel editor, or cloud requirement was introduced.

## 1. Existing features discovered

| Capability | Initial status | Existing implementation and gaps |
| --- | --- | --- |
| Auto-pagination | BROKEN | Curriculum composition already measures and continues semantic blocks. Generic pagination could allocate indefinitely for oversized objects, lose objects with page creation disabled, move locked artwork and report success unconditionally. |
| Masters and presets | PARTIAL | All eight requested presets and a configuration studio existed. Propagation mutated page IDs, omitted footers, retained obsolete running elements and bypassed history. |
| Smart components | PARTIAL | Canonical educational blocks, measured publication scenes, variants, inspectors and a decoder-verified Smart QR system existed. The extra convenience factory used invented presets and incorrect archetypes. |
| Global styles | PARTIAL | Subject palettes, grade scales, paragraph styles and a tokens studio existed. Cascade ignored sizes, affected other books and did not persist tokens. |
| Grids and constraints | PARTIAL | Rulers, guides, margins, columns, baselines, snapping, equal spacing, alignment and a constraint solver existed. Guide/grid options were not wired into drag snapping; resize affected foreign book elements. |
| Local-first persistence | BROKEN | IndexedDB, localStorage migration, local chapter repositories, debounced autosave and bounded undo existed. Save status could report success after failed writes; stale data could win recovery. Offline shell caching was missing. |
| Structure | BROKEN | Units, chapters, lesson frameworks, TOC and numbering existed. Replaced references lost their source templates, so reordering could not update them again. The complete hierarchy was not exposed. |
| Preflight and export | PARTIAL | Publication checks, vector PDF, embedded-font browser proofs, bleed/crop marks and scope controls existed. Closed preflight scanned every edit; the embedded proof ignored scope and required cloud access for linked books. Invalid ranges silently selected everything. |
| Large-book performance | PARTIAL | Active-page canvas, memoized layers, lazy thumbnails, a 24-page strip, bounded history and cache helpers existed. Sidebar mounted every tile; scene caching and dirty helpers were incompletely integrated; heavy preflight ran on the main thread. |

Baseline: 201 automated tests, 197 passing and four failing. Some failures were invalid audit fixtures/API calls; missing token persistence was a real defect. Initial TypeScript checks also exposed incompatible structure fields. Helper tests alone did not establish browser recovery, offline loading, frame rate or exported PDF correctness.

## 2. Features enhanced

| Capability | Result | Two concrete examples |
| --- | --- | --- |
| Auto-pagination | Deterministic, word-boundary continuation; widow/orphan and keep rules; stable-prefix preservation; safe handling of manual art and exhausted destinations. New books enable edited-text flow; legacy books opt in through Layout. One edit plus flow is one undo action. | Editing overflowing text on page 180 preserves page 179's object identity. A 1,500 pt indivisible table reports unresolved overflow without generating endless pages. |
| Masters | Existing eight presets propagate immutable running elements, footers, margins and columns. Obsolete furniture is removed; explicit overrides survive. Updates participate in undo/redo. | Changing Exercise footer updates linked pages. A manually edited footer survives the next master update. |
| Smart components | Factory resolves real registry definitions, canonical semantic slots, real layout variants and measured height. QR/Video resolves the existing Smart QR component, with an explicit unlinked state that preflight blocks. | Vocabulary items determine the card's height. An unlinked QR cannot be exported as a supposedly valid scannable code. |
| Global styles | Persisted book tokens; book-scoped cascade; typography, linked paragraph styles, colours, radii, borders and smart-component inset/gap bindings. Cards remeasure after changes. Shadow control affects editor decoration. | Changing body size updates linked text in this book. A page-specific style override and an element owned by another book remain unchanged. |
| Grids and constraints | Existing snap engine now receives user guides, master columns and baseline settings. Explicit edge/centre/stretch constraints participate in book-scoped page-size changes. Saved user guides restore per book. | A right-pinned object moves by the page width delta. Dragging near a user guide or baseline uses that guide's snap target. |
| Local projects | Durable-write status, newest-snapshot precedence, asynchronous recovery gate, prior/current recovery snapshots, production shell/fonts/media caching and existing cloud retry integration. | An IndexedDB title edit wins over stale localStorage after reload. Cached editor, local project and bundled fonts remain available after network loss. |
| Structure | Derived Book→Unit→Chapter→Lesson→Section→Exercise→Question tree, deduplicated canonical continuation fragments, front-matter numbering, live TOC targets, preserved reference templates and native figure/question labels. | Moving a referenced page updates its displayed reference repeatedly. Deleting a reference target leaves a detectable unresolved token. |
| Preflight/export | Cancellable worker scans with error/loading states; all requested severity levels; font, geometry, asset, DPI, bleed, reference, numbering, QR and empty-frame checks. Strict selected/chapter/full scopes for both existing export paths. Linked chapters use local receipts first. | Range 180–182 exports three physical pages. Invalid range 8–2 reports an error instead of exporting the whole book. |
| Performance | Bounded sidebar/strip windows, lazy previews, 96-entry scene LRU, stable pagination boundaries, elapsed-time idle yielding and worker termination after scans. | Page 180 shows 24 strip previews. A 400-page document is scanned without mounting 400 editor canvases. |

## 3. New capabilities added

The missing production offline service worker and cache warm-up, dedicated preflight worker, shared atomic document/history transaction helper, live reference-template metadata, derived hierarchy presentation, and executable browser/PDF audits. Existing controls and registries were extended rather than replaced.

## 4. Architecture changes

The existing pipeline remains: Book/PageElement document model → educational semantic blocks → tokens → master layouts → existing constraints → generic reading flow or canonical chapter compositor → numbering/reference synchronizer → publication scenes/editor renderer → worker preflight → existing vector/browser export.

Zustand remains the state layer. Shared document transactions add one history action for masters, tokens, structure and manual pagination. Canonical chapter content still uses its existing compositor and transaction path. Arbitrary artwork is not forced into reading flow. The worker imports render/validation code without importing cloud requests during startup; media hydration loads the repository only when needed.

## 5. Database/storage changes

IndexedDB stays at schema version 1 with its existing workspace/books/elements/assets/snapshots/syncQueue stores. Workspace writes retain the last successful snapshot and a current recovery copy. Transaction aborts are failures. localStorage remains the fallback and migration source, with timestamp precedence on recovery. Optional book fields store tokens, numbering mode, auto-pagination preference and guides; optional element metadata retains live reference sources and explicit overrides.

No OPFS migration or new database is needed. Real cloud synchronisation continues through existing chapter controllers and recovery receipts; the dormant generic syncQueue is not presented as a second sync system. Local durability is explicitly different from completed cloud sync.

## 6. Performance optimizations

Only the active editable page canvas mounts. Strip/sidebar page windows are bounded to 24 entries with page-number navigation. Existing lazy thumbnails remain; publication scenes have a bounded 96-entry identity cache. Preflight scans own workers, cancelled scans terminate, and closing the panel stops work. Pagination starts at the affected page and stops at a stable boundary. Structural synchronization is keyed to page/chapter changes rather than every drag.

These are concrete workload bounds, not a measured 60fps guarantee. Device-specific memory pressure, complex illustrations and touch interaction need representative hardware testing.

## 7. Offline behaviour

After one successful production visit and cache warm-up, the app shell, editor chunks, preflight worker, font manifest and bundled fonts support offline reload/edit/preflight/proof export. Requested artwork is cached separately; embedded/local assets remain local. API/auth responses are excluded from the cache. Existing pending cloud changes retry on reconnection and retain their local recovery receipts.

An offline first-ever visit cannot download the application. Unvisited remote artwork and uncached cloud chapters remain unavailable. A previously decoder-verified QR artifact can print offline; its remote resource's current status cannot be reverified until online. Autosave recovers the last durable snapshot; the final debounce interval cannot be guaranteed after an abrupt process kill. Browser quota, cache eviction and clearing site data still matter. Development builds intentionally do not install this service worker.

## 8. Backward compatibility

Existing IDs, preset definitions, chapter framework documents and local storage keys remain unchanged. New fields are optional. Old books keep their existing manual pagination behavior until auto-flow is enabled. Missing numbering mode retains continuous numbering; front-matter Roman/Arabic numbering is explicit. Unknown document fields survive spread-based updates. Existing English/Telugu/Hindi rendering and cloud chapter editing remain on their established paths; original regression suites pass.

## 9. Remaining limitations

- The high-quality export is an RGB, vector/font-embedded print proof with configured bleed and crop marks. It is not PDF/X, an ICC-managed CMYK separation, or printer certification. Chromium may embed SVG text as Type 3 glyph programs; text extractors can insert spaces within words. These proofs are not tagged accessible PDFs. Legacy Latin-font export simplifies some legacy graphics. The embedded-font exporter blocks elements without a verified print renderer rather than omitting them.
- Generic plain-text flow uses conservative measurement. Rich text, linked frames and canonical curriculum chapters retain their specialized flow engines; arbitrarily placed art is preserved. Oversized keep-together groups require an explicit layout decision.
- Semantic structure is derived from actual chapter frameworks, native heading/exercise types and question slots. Untyped decorative text is not automatically interpreted as curricular semantics. Chapters without explicit lessons receive a derived chapter-level lesson group.
- Card shadows are editor decoration; print proofs use vector fills and borders. Existing bespoke curriculum skins keep their own semantic spacing rules unless explicitly linked to global tokens.
- No 60fps assertion, low-end Android certification, printer prepress certification or deployed Cloudflare/offline-origin test has been made. Validation uses a local production Next server and Chromium. Safari/Firefox, actual printer workflows, cloud conflict resolution and very large image-heavy books require separate environment-specific validation.

## Production validation and reproduction

Automated suite: **215/215 passing**, including 220-page incremental flow, exact continuation text, master immutability, scoped styles, repeated references, 400-page preflight, invalid ranges, atomic undo/redo, locked curriculum preservation and original editor regressions. Production Next build and TypeScript checks pass. Existing non-fatal lint warnings remain.

Final production-browser results:

| Check | Verified result |
| --- | --- |
| Real book loaded | 220 physical pages / 444 elements, including a measured smart component and linked master furniture |
| Page 180 | Actual heading edit and undo; 24 strip previews remain mounted |
| Recovery | Newer durable IndexedDB edit wins over stale localStorage; startup recovery gate prevents demo editing |
| Offline | Production reload, local project restoration and worker preflight succeed with the network disabled |
| Selected-page proof | Actual PDF contains exactly 3 pages (180–182) |
| Chapter proof | Actual PDF contains exactly 20 pages (161–180) |
| Complete-book proof | Actual PDF contains exactly 220 pages |
| PDF contents | Expected heading and body passage checked on every page; embedded glyph programs/fonts and Unicode maps inspected |
| Browser runtime errors | Zero |

Browser audit fixtures and results live under `artifacts/production-*`. The browser script uses an isolated profile and a real 220-page book with 444 elements. PDF validation reads the exported bytes, checks every page's lesson text and embedded font descriptors/glyph programs; counting HTML sections alone is insufficient.

Run a production server (default audit URL is `http://localhost:3107`), then:

```sh
npm test
npm run typecheck
npm run build
npm run start -- --port 3107
# In another terminal, using an installed QA runtime with Playwright and pypdf:
NODE_PATH=/path/to/qa/node_modules \
NEX_CHROMIUM_PATH=/path/to/chromium \
NEX_AUDIT_PYTHON=/path/to/qa/python3 \
node scripts/auditProductionBrowser.mjs
```

The application itself does not depend on Playwright or pypdf. The audit does not install packages, send cloud edits or alter a user's stored workspace.

Critical defects discovered during browser/PDF validation and fixed: worker circular import causing stuck preflight; editor rendering the demo before local recovery; missing offline font manifest; and an extra blank PDF page from inline SVG baseline spacing; and missing native master-folio rendering/duplicate default folios. Export also clones cached image scenes before embedding crops, preventing exports from mutating the reusable renderer cache.
