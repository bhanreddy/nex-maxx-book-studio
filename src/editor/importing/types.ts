import type { FlowRun } from '../layoutPartner/textWrapLayout';

export type ImportMode = 'editable' | 'artwork';
export type ImportBlock =
  | { kind: 'text'; runs: FlowRun[]; heading?: number; sourcePage?: number }
  | { kind: 'image'; src: string; width: number; height: number; alt: string; sourcePage?: number }
  | { kind: 'table'; rows: FlowRun[][][]; sourcePage?: number }
  | { kind: 'page-break'; sourcePage?: number };
export interface ManuscriptDraft {
  name: string;
  format: 'docx' | 'pdf' | 'text';
  mode: ImportMode;
  blocks: ImportBlock[];
  warnings: string[];
  sourcePages?: number;
  textlessPages?: number[];
}
export interface ImportProgress { stage: string; completed: number; total: number }
export const IMPORT_LIMITS = { fileBytes: 40 * 1024 * 1024, expandedBytes: 80 * 1024 * 1024, entryBytes: 20 * 1024 * 1024,
  entries: 5000, pdfPages: 150, outputPages: 600, textCharacters: 1_000_000, artworkBytes: 80 * 1024 * 1024 } as const;
export function checkCancelled(signal?: AbortSignal) { signal?.throwIfAborted(); }
export const escapeText = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function runsHtml(runs: FlowRun[]): string {
  return runs.map(({ text, style }) => {
    let html = escapeText(text).replace(/\n/g, '<br>');
    if (style.bold) html = `<strong>${html}</strong>`;
    if (style.italic) html = `<em>${html}</em>`;
    if (style.underline) html = `<u>${html}</u>`;
    if (style.strike) html = `<s>${html}</s>`;
    return html;
  }).join('');
}
export function draftText(draft: ManuscriptDraft): string {
  return draft.blocks.flatMap(block => block.kind === 'text' ? [block.runs.map(run => run.text).join('')] :
    block.kind === 'table' ? block.rows.map(row => row.map(cell => cell.map(run => run.text).join('')).join(' | ')) : []).join('\n\n');
}
