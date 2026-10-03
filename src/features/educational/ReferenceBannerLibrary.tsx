'use client';
import React, { memo, useMemo, useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { REFERENCE_BANNERS, REFERENCE_ARTWORKS, referenceBannerId, type ReferenceBannerVersion } from '../../editor/educational/referenceBanners';
import { useEditorStore } from '../../editor/stores/editorStore';
import { useUiStore } from '../../editor/stores/uiStore';
import { createSmartBlockInstance } from '../../editor/educational/blockRegistry';
import { buildPublicationScene } from '../../editor/educational/publicationScene';
import { PublicationSceneView } from '../../editor/renderer/PublicationSceneView';
import { REFERENCE_WORKSHEETS } from '../../editor/educational/referenceWorksheets';
import { ReferenceBannerColourControls, ReferenceBannerVersionControls } from './ReferenceBannerControls';

const BannerCard = memo(function BannerCard({ banner, colour, version, onInsert }: { banner: typeof REFERENCE_ARTWORKS[number]; colour: string; version: ReferenceBannerVersion; onInsert?: () => void }) {
  const [inserted, setInserted] = useState(false);
  const kind = 'worksheet' in banner ? 'worksheet' : 'banner';
  const label = 'label' in banner ? banner.label || banner.title : banner.title;
  const id = referenceBannerId(banner.slug);
  const scene = useMemo(() => {
    const block = createSmartBlockInstance(id, 'preview')!;
    block.styleOverrides.referenceBannerColour = colour;
    block.styleOverrides.referenceBannerVersion = version;
    return buildPublicationScene(block);
  }, [id, colour, version]);
  function insert() {
    const element = useEditorStore.getState().addEducationalBlock(id, undefined, undefined, { referenceBannerColour: colour, referenceBannerVersion: version });
    if (!element) {
      useUiStore.getState().showToast({ type: 'warning', title: 'Template not added', message: 'Open a book and select a page before adding a template.' });
      return;
    }
    setInserted(true); onInsert?.();
    useUiStore.getState().showToast({ type: 'success', title: `${label} added`, message: version === 'editable' ? 'Click its heading to edit, or select Text & colours.' : 'Select Text & colours to switch versions or shuffle colours.' });
  }
  return <article className="reference-artwork-card" draggable onDragStart={event => {
    event.dataTransfer.setData('application/x-nexmaxx-block-id', id);
    event.dataTransfer.setData('application/x-nexmaxx-block-payload', JSON.stringify({ id, referenceBannerColour: colour, referenceBannerVersion: version }));
  }}>
    <button type="button" className="reference-artwork-preview" style={{ aspectRatio: `${scene.width}/${scene.height}` }} aria-label={`Insert ${label} ${kind}`} onClick={insert}>
      <PublicationSceneView scene={scene} label={`${banner.title} · ${version === 'blank' ? 'Text-free' : version === 'editable' ? 'Editable text' : 'Original text'}`} />
    </button>
    <div className="reference-artwork-caption"><div><strong>{label}</strong><small>{banner.description}</small></div>
      <button type="button" onClick={insert} aria-label={`Add ${label} ${kind}`} title={`Add ${label}`}><Plus size={16} /></button>
    </div>
    {inserted && <span className="reference-artwork-added" role="status"><Check size={11} />Added to page</span>}
  </article>;
});

export function ReferenceBannerLibrary({ search = '', onInsert }: { search?: string; onInsert?: () => void }) {
  const [collection, setCollection] = useState<'worksheets' | 'ribbons'>('worksheets');
  const [colour, setColour] = useState('original');
  const [version, setVersion] = useState<ReferenceBannerVersion>('editable');
  const artwork = search ? REFERENCE_ARTWORKS : collection === 'worksheets' ? REFERENCE_WORKSHEETS : REFERENCE_BANNERS;
  const banners = artwork.filter(banner => `${banner.title} ${'label' in banner ? banner.label : ''} ${banner.description} premium clay 3d ribbon banner worksheet`.toLowerCase().includes(search.toLowerCase()));
  return <section className="reference-artwork-library" aria-label="Original reference templates">
    <div className="reference-artwork-intro"><span className="studio-eyebrow">THE IMAGE COLLECTION · {REFERENCE_ARTWORKS.length} DESIGNS</span><h2>{collection === 'worksheets' ? 'Worksheets with character.' : 'Sculpted ribbons.'}</h2><p>Original text, editable content, or text-free artwork. Preserve the illustrations and make the words yours.</p></div>
    <div className="reference-artwork-versions" role="group" aria-label="Image template collection"><button type="button" aria-pressed={collection==='worksheets'} onClick={()=>setCollection('worksheets')}>Worksheets · {REFERENCE_WORKSHEETS.length}</button><button type="button" aria-pressed={collection==='ribbons'} onClick={()=>setCollection('ribbons')}>Ribbons · {REFERENCE_BANNERS.length}</button></div>
    <ReferenceBannerVersionControls value={version} onChange={setVersion} />
    <ReferenceBannerColourControls value={colour} onChange={setColour} />
    <div className="reference-artwork-grid">{banners.map(banner => <BannerCard key={banner.slug} banner={banner} colour={colour} version={version} onInsert={onInsert} />)}</div>
    {!banners.length && <p className="reference-artwork-empty">No templates match “{search}”. Try “Activity” or “Learning Objectives”.</p>}
    <p className="reference-artwork-note">Choose a version and palette before inserting. Switch versions, edit your heading and content, and shuffle colours from Text & colours.</p>
  </section>;
}
