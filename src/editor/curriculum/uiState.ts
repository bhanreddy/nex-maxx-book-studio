import { create } from "zustand";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import type { ChapterPreset } from "../../domain/educational/curriculum";
export const useCurriculumUi = create<{
  layoutPreferences: Record<string, Pick<SmartBlockInstance["styleOverrides"], "layoutVariant" | "blockStyle" | "paletteId" | "printMode">>;
  rememberLayout: (type: string, style: SmartBlockInstance["styleOverrides"]) => void;
  builderOpen: boolean; insertOpen: boolean; preset: ChapterPreset;
  openBuilder: (preset?: ChapterPreset) => void; closeBuilder: () => void;
  setInsertOpen: (open: boolean) => void;
}>(set => ({ layoutPreferences: {}, rememberLayout: (type, style) => set(state => ({ layoutPreferences: { ...state.layoutPreferences, [type]: { layoutVariant: style.layoutVariant, blockStyle: style.blockStyle, paletteId: style.paletteId, printMode: style.printMode } } })), builderOpen: false, insertOpen: false, preset: "premium-nex",
  openBuilder: (preset = "premium-nex") => set({ builderOpen: true, preset }), closeBuilder: () => set({ builderOpen: false }),
  setInsertOpen: insertOpen => set({ insertOpen }),
}));
