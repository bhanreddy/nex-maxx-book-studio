import type { Book } from '../../domain/book/types';
import { createPageFrame } from './pageFrame';

/** Upgrade older books once, including old disabled covers and chapter-only frames. */
export function integrateBookPageBorder(book: Book): Book {
  if (book.premiumPageBorderVersion === 1 && (!book.pageFrame || book.pageFrame.style === 'scholar-wave')) return book;
  const oldFrame = book.pageFrame || book.chapters.find(chapter => chapter.pageFrame)?.pageFrame;
  const frame = createPageFrame();
  if (oldFrame) frame.colors = { ...oldFrame.colors };
  return { ...book, premiumPageBorderVersion: 1, pageFramePolicy: 'book', pageFrame: frame,
    chapters: book.chapters.map(chapter => ({ ...chapter, pageFrame: undefined })),
    pages: book.pages.map(page => ({ ...page, pageFrame: undefined })) };
}
