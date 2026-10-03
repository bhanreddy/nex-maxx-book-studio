# Import & Continue

Open **File → Import & Continue**, **More → Import & Continue**, the command palette, or the dashboard's **Import & Continue** button.

1. Choose one `.docx`, `.pdf`, `.txt`, or `.md` file, or paste manuscript text.
2. Create a separate book or append to the current book. Existing pages are retained.
3. Optionally add a continuation page and name its next chapter. Leaving the title empty continues the final imported chapter.
4. Preview the actual paginated content and read conversion notes. Confirm the notes before importing Word or PDF content.
5. Continue with ordinary text, image, and curriculum editing tools. Undo reverses the whole import, including a newly created book.

For example, import an unfinished Word chapter as editable paragraphs and add its missing exercises. Or preserve ten completed PDF pages as locked artwork and write page eleven in the studio.

## Format behavior

| Input | Retained | Important limits |
| --- | --- | --- |
| Word `.docx` | Headings, paragraph content, bold/italic/underline/strike, lists, supported embedded raster images, table cell content | Reflowed layout. Original fonts, page breaks, headers/footers, floating layout, comments, and revision history are not reproduced. Table cells become separate editable text frames; merged/nested cells are simplified with a warning. |
| PDF: preserve pages | Visible page appearance, source-page attribution, original aspect ratio | Locked PNG artwork, up to 180 dpi with a 2,000-pixel longest-side cap. Text and artwork cannot be edited independently. This is not a vector or press-master importer. |
| PDF: editable text | Extractable text and source-page attribution | Extraction order may differ from reading order. No reconstruction of columns, tables, illustrations, fonts or equations. No OCR. Textless pages are identified before commit; artwork mode retains them. |
| Text/Markdown | All body paragraphs, Unicode, `#` headings | Markdown inline syntax is literal text. HTML is escaped. |

Google Docs must be downloaded as Word or PDF. Legacy binary `.doc` files must be resaved as `.docx` or PDF. Encrypted PDFs must be unlocked outside the studio.

## Persistence and continuation

Conversion is local to the browser. Original source files are not uploaded by the importer or kept as downloadable backups; retain the original separately. Imported elements, page provenance and chapter structure use the existing IndexedDB workspace autosave. The existing save-status UI reports storage failures.

Imported chapters contain a minimal curriculum framework with a detached chapter-heading record plus native page content, allowing regular chapter tools and the central snapshot contract to recognize them without inventing curriculum material. For central saving, link each imported chapter using the existing Central Book flow; importing does not create remote curriculum records or imply that new chapters have synced. Large embedded artwork remains subject to storage quotas and server payload limits.

PDF artwork pages suppress generated studio borders and publisher footers across canvas and export. Continuation pages resume ordinary studio page furniture. Curriculum recomposition retains imported native content and the blank continuation page.

## Implementation boundaries

- `src/editor/importing/readManuscript.ts`: input validation and lazy reader dispatch.
- `docx.worker.ts`: isolated Mammoth conversion with a 60-second timeout and immediate worker termination on cancellation. External file access and embedded style maps are disabled.
- `validateDocx.ts`: bounded ZIP central-directory inspection before conversion.
- `readDocx.ts`: inert HTML parsing; only text and a small inline-style vocabulary are transferred. External URLs, executable markup and unsupported image types do not enter the editor.
- `readPdf.ts`: existing self-hosted PDF.js worker/assets, sequential page processing, range validation, cancellation and cleanup.
- `composeManuscript.ts`: isolated document planning using the shared text measurement engine; source-aware line splitting, table pagination, and a bounded continuation page.
- `commitImport.ts`: one store transaction and one history entry; stale append previews are rejected to avoid overwriting intervening edits.

Limits: 40 MB source file, 150 selected PDF pages, 600 generated studio pages, 1 million text characters, 80 MB encoded artwork; DOCX archives are limited to 5,000 entries, 20 MB per expanded entry and 80 MB total declared expanded content.

## Verification

```sh
npm run typecheck
npm test
# Requires Playwright on NODE_PATH and an available Chromium installation.
NEX_AUDIT_URL=http://localhost:3123 node scripts/verifyManuscriptImport.mjs
```

The browser check uses an isolated browser context, synthetic Word/PDF files, and no authenticated cloud mutations. It checks conversion, malformed input, body/bold/table retention, unsafe-link stripping, continuation, undo/redo, IndexedDB reload, locked PDF artwork, textless pages, page ranges, responsive layout and keyboard dismissal. Screenshots and generated fixtures are written to `artifacts/manuscript-import/`.
