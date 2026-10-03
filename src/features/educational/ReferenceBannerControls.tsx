'use client';
import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Shuffle, RotateCcw, Copy, ArrowUpRight } from 'lucide-react';
import type { PageElement } from '../../domain/element/types';
import { REFERENCE_BANNER_COLOURS } from '../../domain/educational/designTokens';
import { referenceBannerColour, referenceBannerFor, referenceBannerVersion, REFERENCE_BANNER_VERSIONS, type ReferenceBannerVersion, shuffledReferenceBannerColour } from '../../editor/educational/referenceBanners';
import { useEditorStore } from '../../editor/stores/editorStore';
import { useUiStore } from '../../editor/stores/uiStore';
import { readEducationalField, editEducationalField } from '../../editor/educational/library/editing';
import { duplicateEducationalBlock } from '../../editor/educational/library/actions';

export function ReferenceBannerVersionControls({ value, onChange, disabled = false }: { value: ReferenceBannerVersion; onChange: (value: ReferenceBannerVersion) => void; disabled?: boolean }) {
  return <div className="reference-artwork-versions" role="group" aria-label="Banner version">
    {REFERENCE_BANNER_VERSIONS.map(version => <button type="button" key={version.id} disabled={disabled} aria-pressed={value === version.id} onClick={() => onChange(version.id)}>{version.label}</button>)}
  </div>;
}

export function ReferenceBannerColourControls({ value, onChange, disabled = false }: { value?: string; onChange: (id: string) => void; disabled?: boolean }) {
  const colour = referenceBannerColour(value);
  return <div className="reference-artwork-colours">
    <div className="reference-artwork-colour-actions">
      <button type="button" className="reference-artwork-shuffle" disabled={disabled} onClick={() => onChange(shuffledReferenceBannerColour(value))}><Shuffle size={14} />Shuffle colours</button>
      <button type="button" aria-label="Restore original colours" title="Restore original colours" disabled={disabled || colour.id === 'original'} onClick={() => onChange('original')}><RotateCcw size={14} /></button>
    </div>
    <div className="reference-artwork-swatches" role="group" aria-label="Banner colours">
      {REFERENCE_BANNER_COLOURS.map(option => <button type="button" key={option.id} disabled={disabled} aria-label={option.name} title={option.name} aria-pressed={colour.id === option.id} onClick={() => onChange(option.id)}>
        <span style={{ background: `linear-gradient(135deg, ${option.ink} 50%, ${option.accent} 50%)` }} />
      </button>)}
    </div>
    <span className="reference-artwork-colour-name" role="status">{colour.name}</span>
  </div>;
}

function ReferenceArtworkTextField({ element, path, label, hint }: { element: PageElement; path: string; label: string; hint?: string }) {
  const content = element.smartBlockData!.semanticContent, saved = readEducationalField(content, path);
  const [value, setValue] = useState(saved);
  React.useEffect(() => setValue(saved), [element.id, saved]);
  const commit = () => {
    const store = useEditorStore.getState(), latest = store.elements[element.id]?.smartBlockData?.semanticContent;
    if (latest && value !== readEducationalField(latest, path)) store.updateSmartBlockContent(element.id, editEducationalField(latest, path, value));
  };
  return <label className="reference-artwork-heading">{label}<textarea aria-label={label} value={value} disabled={element.locked || element.smartBlockData!.isLockedContent} onChange={event => setValue(event.target.value)} onBlur={commit} onKeyDown={event => { event.stopPropagation(); if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); commit(); event.currentTarget.blur(); } }} />{hint && <small>{hint}</small>}</label>;
}

export function ReferenceBannerInspector({ element }: { element: PageElement }) {
  const block = element.smartBlockData!, banner = referenceBannerFor(block.presetId)!;
  const worksheet = 'worksheet' in banner ? banner.worksheet : undefined;
  const [presetName, setPresetName] = useState('');
  const version = referenceBannerVersion(block), kind = worksheet ? 'worksheet' : 'banner';
  const change = (id: string) => useEditorStore.getState().updateSmartBlockStyle(element.id, { referenceBannerColour: id });
  return <section className="reference-artwork-inspector">
    <span className="studio-eyebrow">THE IMAGE COLLECTION</span>
    <h3>{banner.title}</h3>
    <p>Reference artwork · {worksheet ? `${worksheet.width} × ${worksheet.height}` : '2172 × 724'}</p>
    <ReferenceBannerVersionControls value={version} onChange={referenceBannerVersion => useEditorStore.getState().updateSmartBlockStyle(element.id, { referenceBannerVersion })} disabled={element.locked || block.isLockedDesign} />
    {version === 'editable' && <>
      <ReferenceArtworkTextField element={element} path="title" label={worksheet ? 'Worksheet heading' : 'Banner heading'} hint="Click the heading on the page to edit. Shift + Enter adds a line." />
      {worksheet && (worksheet.rows ? worksheet.rows.map((_, index) => <ReferenceArtworkTextField key={index} element={element} path={`items.${index}`} label={`${banner.slug === 'learning-objectives' ? 'Objective' : 'Writing line'} ${index + 1}`} />) : <ReferenceArtworkTextField element={element} path="calloutText" label="Worksheet content" hint="Click the writing area to edit. Text wraps inside the illustrated frame." />)}
    </>}
    <ReferenceBannerColourControls value={block.styleOverrides.referenceBannerColour} onChange={change} disabled={element.locked || block.isLockedDesign} />
    <p>{version === 'original' ? 'Exact original image with its printed heading. Choose Editable text to change the heading and content.' : version === 'blank' ? 'Text-free artwork. Your custom text is kept for when you switch to Editable text.' : 'Your text stays editable when you save, duplicate or export.'}</p>
    <button type="button" className="reference-artwork-button" onClick={() => duplicateEducationalBlock(element)}><Copy size={14} />Duplicate {kind}</button>
    <details className="reference-artwork-save"><summary>Save to My Blocks</summary><label>Preset name<input value={presetName} placeholder={`${banner.title} · ${referenceBannerColour(block.styleOverrides.referenceBannerColour).name}`} onChange={event => setPresetName(event.target.value)} /></label><button type="button" className="reference-artwork-button" onClick={() => useEditorStore.getState().savePublicationPreset(presetName || `${banner.title} · ${referenceBannerColour(block.styleOverrides.referenceBannerColour).name}`, element.id, 'banners')}>Save {kind} preset</button></details>
  </section>;
}

export function ReferenceBannerQuickTools({ element, zoom }: { element: PageElement; zoom: number }) {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const block = element.smartBlockData!;
  useLayoutEffect(() => {
    let frame = 0;
    const place = () => {
      const node = document.getElementById(`element-${element.id}`);
      if (!node) return;
      const bounds = node.getBoundingClientRect();
      setPosition({ left: Math.max(12, Math.min(window.innerWidth - 300, bounds.x + bounds.width / 2 - 144)), top: Math.max(140, Math.min(window.innerHeight - 80, bounds.bottom + 12)) });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(place); };
    place(); window.addEventListener('resize', schedule); window.addEventListener('scroll', schedule, true);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', schedule); window.removeEventListener('scroll', schedule, true); };
  }, [element.id, element.transform, zoom]);
  if (!position) return null;
  return createPortal(<div data-canvas-controls className="reference-artwork-quick-tools" style={{ position: 'fixed', ...position }} onPointerDown={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
    <button type="button" disabled={element.locked || block.isLockedDesign} onClick={() => useEditorStore.getState().shuffleEducationalBlockStyle(element.id)}><Shuffle size={14} />Shuffle colours</button>
    <button type="button" aria-label="Restore original colours" title="Restore original colours" disabled={element.locked || block.isLockedDesign || referenceBannerColour(block.styleOverrides.referenceBannerColour).id === 'original'} onClick={() => useEditorStore.getState().updateSmartBlockStyle(element.id, { referenceBannerColour: 'original' })}><RotateCcw size={14} /></button>
    <button type="button" onClick={() => useUiStore.getState().setRightInspectorOpen(true)}><ArrowUpRight size={14} />Text & colours</button>
  </div>, document.body);
}
