'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useUiStore } from '../../editor/stores/uiStore';
import { PageFrameControls } from './PageFrameControls';

export function PageBorderModal() {
  const open = useUiStore(state => state.pageBorderModalOpen), setOpen = useUiStore(state => state.setPageBorderModalOpen);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => { document.body.style.overflow = overflow; trigger?.focus(); };
  }, [open]);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(<div className="fixed inset-0 z-[100] bg-black/50 flex justify-end" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="page-border-heading" className="h-full w-full max-w-lg overflow-y-auto bg-white dark:bg-slate-900 p-5 shadow-xl text-slate-900 dark:text-white" onKeyDown={event => {
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
      if (event.key !== 'Tab') return;
      const controls = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, [tabindex="0"]') || [])].filter(element => element.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}><PageFrameControls onClose={() => setOpen(false)}/></div>
  </div>, document.body);
}
