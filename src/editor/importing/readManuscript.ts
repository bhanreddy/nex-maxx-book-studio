import { IMPORT_LIMITS, checkCancelled, type ImportMode, type ImportProgress, type ManuscriptDraft } from './types';

export function readTextManuscript(text: string, name = 'Pasted manuscript'): ManuscriptDraft {
  if (text.length > IMPORT_LIMITS.textCharacters) throw new Error('Import one million characters or fewer at a time.');
  if (!text.trim()) throw new Error('Add manuscript text before continuing.');
  const blocks: ManuscriptDraft['blocks'] = [];
  let paragraph: string[] = [];
  const flush = () => { if (paragraph.length) blocks.push({ kind: 'text', runs: [{ text: paragraph.join('\n'), style: {} }] }); paragraph = []; };
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) { flush(); if (/^Page\s+\d/i.test(heading[2])) blocks.push({ kind: 'page-break' }); blocks.push({ kind: 'text', heading: heading[1].length, runs: [{ text: heading[2], style: {} }] }); }
    else if (!line.trim()) flush();
    else paragraph.push(line);
  }
  flush();
  return { name, format: 'text', mode: 'editable', blocks, warnings: [] };
}
export async function readManuscript(file: File, options: { mode: ImportMode; range: string; signal?: AbortSignal; onProgress?: (progress: ImportProgress) => void }): Promise<ManuscriptDraft> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'doc') throw new Error('Legacy .doc files are not supported. Open the file in Word or LibreOffice and save as .docx, or export it as PDF.');
  if (!['docx','pdf','txt','md'].includes(extension || '')) throw new Error('Choose a .docx, .pdf, .txt or .md file. For Google Docs, download a Word or PDF copy first.');
  if (!file.size) throw new Error('This file is empty. Choose a document with content.');
  if (file.size > IMPORT_LIMITS.fileBytes) throw new Error('Choose a file smaller than 40 MB. Split larger manuscripts into chapters.');
  checkCancelled(options.signal);
  options.onProgress?.({ stage: 'Reading your manuscript', completed: 0, total: 1 });
  if (extension === 'docx') return (await import('./readDocx')).readDocx(file, options.signal);
  if (extension === 'pdf') return (await import('./readPdf')).readPdf(file, options.mode, options.range, options.signal, options.onProgress);
  const text = await file.text(); checkCancelled(options.signal);
  if (text.includes('\u0000')) throw new Error('This text file is not UTF-8. Save a UTF-8 copy and retry.');
  return readTextManuscript(text, file.name);
}
