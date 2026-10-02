'use client';
import React, { memo, useMemo } from 'react';
import type { Book, PageDefinition } from '../../domain/book/types';
import { buildPageFrameScene, pageFrameFor, isFrameBackgroundNode } from '../pageFrame/pageFrame';
import { PublicationSceneView } from './PublicationSceneView';
export const PageFrameView = memo(function PageFrameView({ book, page }: { book: Book; page: PageDefinition }) {
  const frame = pageFrameFor(book, page);
  const scene = useMemo(() => frame ? buildPageFrameScene(frame, page.displayNumber, book.dimensions.widthPt, book.dimensions.heightPt) : null, [frame, page.displayNumber, book.dimensions.widthPt, book.dimensions.heightPt]);
  if (!scene || !frame) return null;
  return <>
    <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: frame.colors.paper }} aria-hidden="true"><PublicationSceneView scene={{ ...scene, nodes: scene.nodes.filter(isFrameBackgroundNode) }} label="Page border background"/></div>
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1000000 }} data-page-border={page.id} aria-hidden="true">
      <PublicationSceneView scene={{ ...scene, nodes: scene.nodes.filter(node => !isFrameBackgroundNode(node)) }} label="Page border"/>
    </div>
  </>;
});
