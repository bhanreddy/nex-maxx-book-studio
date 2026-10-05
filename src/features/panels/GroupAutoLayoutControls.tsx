"use client";

import React from "react";
import type { AdaptiveGroupConfig, PageElement } from "../../domain/element/types";
import { useEditorStore } from "../../editor/stores/editorStore";
import { defaultAutoLayout, hasGroupAutoLayout } from "../../editor/core/groupAutoLayout";
import { isElementLocked } from "../../editor/core/elementGroups";

/** Ordinary grouping stays freeform. A direction choice is the explicit opt-in. */
export function GroupAutoLayoutControls({ group }: { group: PageElement }) {
  const enabled = hasGroupAutoLayout(group);
  const config = group.adaptiveGroup || defaultAutoLayout("vertical");
  const update = useEditorStore(s => s.setGroupAutoLayout);
  const locked = isElementLocked(group.id, useEditorStore.getState().elements);
  const change = (patch: Partial<AdaptiveGroupConfig>) => update(group.id, patch);
  return <div className="flex items-center gap-2 border-r border-slate-200 dark:border-white/10 pr-3" aria-label="Group auto layout">
    <label className="flex items-center gap-1.5 text-xs font-medium">Auto layout
      <select aria-label="Group auto layout direction" disabled={locked} value={enabled ? config.direction : "off"}
        className="publication-input h-9 rounded-lg px-2 disabled:opacity-40"
        onChange={e => e.target.value === "off" ? update(group.id, null) : change({ direction: e.target.value as "horizontal" | "vertical" })}>
        <option value="off">Off · freeform</option><option value="horizontal">Horizontal →</option><option value="vertical">Vertical ↓</option>
      </select>
    </label>
    {enabled && <>
      <label className="flex items-center gap-1 text-xs">Gap
        <input aria-label="Auto layout gap (pt)" className="publication-input w-14 h-9 rounded-lg px-1" type="number" min={0} max={500} disabled={locked}
          value={config.spacingPt} onChange={e => { const value = Number(e.target.value); if (Number.isFinite(value) && value >= 0 && value <= 500) change({ spacingPt: value }); }} />
      </label>
      <label className="flex items-center gap-1 text-xs">Padding
        <input aria-label="Auto layout padding (pt)" className="publication-input w-14 h-9 rounded-lg px-1" type="number" min={0} max={500} disabled={locked}
          value={config.padding.top} onChange={e => { const value = Number(e.target.value); if (Number.isFinite(value) && value >= 0 && value <= 500) change({ padding: { top: value, right: value, bottom: value, left: value } }); }} />
      </label>
      <select aria-label="Auto layout alignment" disabled={locked} value={config.alignment} className="publication-input h-9 rounded-lg px-2"
        onChange={e => change({ alignment: e.target.value as AdaptiveGroupConfig["alignment"] })}>
        <option value="start">Align start</option><option value="center">Align center</option><option value="end">Align end</option><option value="stretch">Stretch</option>
      </select>
      <select aria-label="Auto layout width sizing" disabled={locked} value={config.widthMode} className="publication-input h-9 rounded-lg px-2"
        onChange={e => change({ widthMode: e.target.value as AdaptiveGroupConfig["widthMode"] })}>
        <option value="fit-content">Hug width</option><option value="fixed">Fixed width</option>
      </select>
      <select aria-label="Auto layout height sizing" disabled={locked} value={config.heightMode} className="publication-input h-9 rounded-lg px-2"
        onChange={e => change({ heightMode: e.target.value as AdaptiveGroupConfig["heightMode"] })}>
        <option value="fit-content">Hug height</option><option value="fixed">Fixed height</option>
      </select>
    </>}
  </div>;
}
