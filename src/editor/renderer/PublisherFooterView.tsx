'use client';
import { memo, useMemo } from 'react';
import type { Book, PageDefinition } from '../../domain/book/types';
import type { PageElement } from '../../domain/element/types';
import { buildPublisherFooterScene } from '../branding/publisherFooter';
import { PublicationSceneView } from './PublicationSceneView';

export const PublisherFooterView = memo(function PublisherFooterView({ book, page, elements }: { book: Book; page: PageDefinition; elements: Record<string, PageElement> }) {
  const scene = useMemo(() => buildPublisherFooterScene(book, page, elements), [book, page, elements]);
  return <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1000001 }} data-publisher-footer={page.id} aria-hidden="true">
    <PublicationSceneView scene={scene} label="NEX MAXX footer — Powered by NexSyrus" />
  </div>;
});
