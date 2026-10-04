'use client';
import React, { useEffect, useMemo, useState } from 'react';
import type { PageElement } from '../../domain/element/types';
import type { BlockTextStyle } from '../../domain/educational/blockSchema';
import { buildPublicationScene } from '../../editor/educational/publicationScene';
import { blockTextRole, blockTextTarget, type BlockTextNode } from '../../editor/educational/textFormatting';
import { referenceBannerFor, referenceBannerVersion } from '../../editor/educational/referenceBanners';
import { useEditorStore } from '../../editor/stores/editorStore';
import { useUiStore } from '../../editor/stores/uiStore';

export function BlockTextInspector({ element }: { element: PageElement }) {
  const block = element.smartBlockData!;
  const scene = useMemo(() => buildPublicationScene({ ...block, transform: element.transform }), [block, element.transform]);
  const nodes = scene.nodes.filter((n): n is BlockTextNode => n.kind === 'text');
  const active = useUiStore(s => s.blockTextTarget);
  const options = [...new Map(nodes.map(n => [blockTextTarget(n), n])).entries()];
  const target = active?.elementId === element.id && ['all', 'heading', 'body', ...options.map(([key]) => key)].includes(active.target) ? active.target : nodes.some(n => blockTextRole(n, scene, block) === 'body') ? 'body' : 'heading';
  const chosen = nodes.filter(n => target === 'all' || target === blockTextRole(n, scene, block) || target === blockTextTarget(n));
  const sample = chosen[0];
  // A resized block can have a logical SVG frame different from its physical frame.
  const physicalScale = (block.styleOverrides.resizeFrame ? element.transform.height / block.styleOverrides.resizeFrame.height : Math.min(element.transform.width / scene.width, element.transform.height / scene.height)) || 1;
  const sizes = chosen.map(n => Math.round(n.size * physicalScale * 10) / 10);
  const mixedSize = sizes.some(size => size !== sizes[0]);
  const currentSize = sample ? Math.round(sample.size * physicalScale * 10) / 10 : 12;
  const [size, setSize] = useState(String(currentSize));
  useEffect(() => setSize(String(currentSize)), [element.id, target, currentSize]);
  const currentColor = /^#[\da-f]{6}$/i.test(sample?.fill || '') ? sample!.fill : '#193c55';
  const [color, setColor] = useState(currentColor);
  useEffect(() => setColor(currentColor), [element.id, target, currentColor]);
  const locked = element.locked || block.isLockedDesign;
  const apply = (style: BlockTextStyle | null) => useEditorStore.getState().updateSmartBlockTextStyle(element.id, target, style);
  const commitSize = () => {
    const value = Number(size);
    if (Number.isFinite(value) && value >= 1 && value <= 144 && (mixedSize || value !== currentSize)) apply({ fontSize: value / physicalScale });
    else setSize(String(currentSize));
  };
  const reference = referenceBannerFor(block.presetId);
  if (!nodes.length) return <section className="block-text-inspector" aria-label="Block text formatting"><h3>Text appearance</h3><p>{reference ? 'Choose Editable text to change the words, size and colour.' : 'Add text to this block to format it.'}</p>{reference && referenceBannerVersion(block) !== 'editable' && <button type="button" className="reference-artwork-button" disabled={locked} onClick={() => useEditorStore.getState().updateSmartBlockStyle(element.id, { referenceBannerVersion: 'editable' })}>Use editable text</button>}</section>;
  return <section className="block-text-inspector" aria-label="Block text formatting">
    <h3>Text appearance</h3>
    <fieldset disabled={locked}>
      <label>Apply to<select aria-label="Text to format" value={target} onChange={e => useUiStore.getState().setBlockTextTarget({ elementId: element.id, target: e.target.value })}>
        <option value="body">Body text</option><option value="heading">Heading</option><option value="all">All text</option>
        {options.map(([key, node], i) => <option key={key} value={key}>{node.fieldPath || `Text ${i + 1}`} · {node.text.slice(0, 32) || 'Empty text'}</option>)}
      </select></label>
      <div className="block-text-inspector-row">
        <label>Size (pt)<input aria-label="Block text size" type="number" min={1} max={144} step={.5} value={size} onChange={e => setSize(e.target.value)} onBlur={commitSize} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') { commitSize(); e.currentTarget.blur(); } }} /></label>
        <label>Text colour<input aria-label="Block text colour" type="color" value={currentColor} onInput={e => apply({ color: e.currentTarget.value })} onChange={e => apply({ color: e.target.value })} /></label>
      </div>
      <label>Colour code<input aria-label="Block text colour hex" value={color} maxLength={7} onChange={e => setColor(e.target.value)} onBlur={() => { if (/^#[\da-f]{6}$/i.test(color)) apply({ color }); else setColor(currentColor); }} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); }} /></label>
      <div className="block-text-inspector-actions">
        <button type="button" aria-label="Bold block text" aria-pressed={Boolean(sample?.bold)} onClick={() => apply({ bold: !sample?.bold })}><strong>B</strong></button>
        <button type="button" aria-label="Italic block text" aria-pressed={Boolean(sample?.italic)} onClick={() => apply({ italic: !sample?.italic })}><em>I</em></button>
        <button type="button" disabled={!block.styleOverrides.textFormatting?.[target]} onClick={() => apply(null)}>Reset text style</button>
      </div>
    </fieldset>
    <p>{mixedSize ? 'Mixed sizes. Enter a size to apply it to this selection. ' : ''}Text changes keep the block dimensions fixed.</p>
    {scene.warnings.some(w => w.startsWith('Text exceeds')) && <p role="status">Text exceeds its reading area. Reduce its size or shorten the content.</p>}
  </section>;
}
