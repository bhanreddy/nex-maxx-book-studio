import { importDocxBorder } from './docxBorderImport';
import { importPdfBorder } from './pdfBorderImport';
import type { PageFrame } from './types';

export async function importBorderTemplate(file: File): Promise<PageFrame> {
  if (/\.pdf$/i.test(file.name)) return importPdfBorder(file);
  if (/\.docx$/i.test(file.name)) return importDocxBorder(file);
  throw new Error('Choose a single-page .docx or .pdf border template. Save older .doc files as .docx first.');
}
