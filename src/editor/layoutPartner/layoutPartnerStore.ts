import { create } from "zustand";
import { ElementTransform } from "../../domain/element/types";
import { TextWrapMode } from "../../domain/creative/types";
import {
  MagneticDropZone,
  LayoutVariation,
  generateLayoutVariations,
  interpretNaturalLayoutCommand,
} from "./partnerEngine";
import {
  LayoutHealthReport,
  evaluateLayoutHealth,
  autoFixLayoutHealthIssues,
} from "./layoutHealthEngine";
import { useEditorStore } from "../stores/editorStore";
import { useHistoryStore } from "../stores/historyStore";
import { useUiStore } from "../stores/uiStore";

export type LayoutPartnerMode = "auto" | "assisted" | "manual";
export type LayoutPartnerTab = "suggestions" | "layouts" | "rules" | "flow";

interface LayoutPartnerState {
  partnerMode: LayoutPartnerMode;
  partnerPanelOpen: boolean;
  activeTab: LayoutPartnerTab;
  hoveredDropZone: MagneticDropZone | null;
  activePreviewVariationId: string | null;
  previewTransforms: Record<string, Partial<ElementTransform>> | null;
  healthReport: LayoutHealthReport | null;
  naturalCommandQuery: string;
  isAnalyzing: boolean;

  // Actions
  setPartnerMode: (mode: LayoutPartnerMode) => void;
  setPartnerPanelOpen: (open: boolean) => void;
  setActiveTab: (tab: LayoutPartnerTab) => void;
  setHoveredDropZone: (zone: MagneticDropZone | null) => void;
  setPreviewTransforms: (
    transforms: Record<string, Partial<ElementTransform>> | null,
    variationId?: string | null
  ) => void;
  applyPreviewTransforms: () => void;
  cancelPreviewTransforms: () => void;
  refreshHealthReport: () => void;
  autoFixHealthIssues: () => void;
  applyNaturalLayoutCommand: (prompt: string) => void;
  applyLayoutVariation: (variationId: string) => void;
  applyTextWrapToSelection: (mode: TextWrapMode, offsetPt?: number) => void;
}

export const useLayoutPartnerStore = create<LayoutPartnerState>((set, get) => ({
  partnerMode: "assisted",
  partnerPanelOpen: false,
  activeTab: "suggestions",
  hoveredDropZone: null,
  activePreviewVariationId: null,
  previewTransforms: null,
  healthReport: null,
  naturalCommandQuery: "",
  isAnalyzing: false,

  setPartnerMode: (mode) => {
    set({ partnerMode: mode });
    useUiStore.getState().showToast({
      type: "info",
      title: `NEX Layout Partner: ${mode.toUpperCase()} Mode`,
      message:
        mode === "auto"
          ? "Layout Partner automatically balances spacing, wrapping, and flow."
          : mode === "assisted"
          ? "Intelligent guides, magnetic drop zones, and live reflow active."
          : "Professional manual control. All automatic corrections paused.",
    });
  },

  setPartnerPanelOpen: (open) => set({ partnerPanelOpen: open }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setHoveredDropZone: (zone) => set({ hoveredDropZone: zone }),

  setPreviewTransforms: (transforms, variationId = null) => {
    set({
      previewTransforms: transforms,
      activePreviewVariationId: variationId,
    });
  },

  applyPreviewTransforms: () => {
    const { previewTransforms } = get();
    if (!previewTransforms) return;

    const editor = useEditorStore.getState();
    const history = useHistoryStore.getState();

    // Snapshot before update
    const previousTransforms: Record<string, Partial<ElementTransform>> = {};
    Object.keys(previewTransforms).forEach((id) => {
      const el = editor.elements[id];
      if (el) {
        previousTransforms[id] = { ...el.transform };
      }
    });

    // Apply updates
    Object.entries(previewTransforms).forEach(([id, tr]) => {
      editor.updateElementTransform(id, tr, false);
    });

    // Record single undo action
    history.pushAction({
      description: "Applied NEX Layout Variation",
      undo: () => {
        Object.entries(previousTransforms).forEach(([id, tr]) => {
          useEditorStore.getState().updateElementTransform(id, tr, false);
        });
      },
      redo: () => {
        Object.entries(previewTransforms).forEach(([id, tr]) => {
          useEditorStore.getState().updateElementTransform(id, tr, false);
        });
      },
    });

    set({ previewTransforms: null, activePreviewVariationId: null });
    get().refreshHealthReport();

    useUiStore.getState().showToast({
      type: "success",
      title: "Layout Applied",
      message: "Elements reflowed with content preserved.",
    });
  },

  cancelPreviewTransforms: () => {
    set({ previewTransforms: null, activePreviewVariationId: null });
  },

  refreshHealthReport: () => {
    const editor = useEditorStore.getState();
    const page = editor.getActivePage();
    const book = editor.getActiveBook();
    if (!page || !book) return;

    const elements = page.elementIds.map((id) => editor.elements[id]).filter(Boolean);
    const report = evaluateLayoutHealth(elements, book.dimensions, book.margins);
    set({ healthReport: report });
  },

  autoFixHealthIssues: () => {
    const editor = useEditorStore.getState();
    const page = editor.getActivePage();
    const book = editor.getActiveBook();
    if (!page || !book) return;

    const elements = page.elementIds.map((id) => editor.elements[id]).filter(Boolean);
    const { updatedTransforms, fixedCount } = autoFixLayoutHealthIssues(
      elements,
      book.dimensions,
      book.margins
    );

    if (fixedCount === 0) {
      useUiStore.getState().showToast({
        type: "info",
        title: "Layout Health",
        message: "No automatic fixes required. Layout is optimal.",
      });
      return;
    }

    const history = useHistoryStore.getState();
    const prevTransforms: Record<string, Partial<ElementTransform>> = {};
    Object.keys(updatedTransforms).forEach((id) => {
      prevTransforms[id] = { ...editor.elements[id].transform };
    });

    Object.entries(updatedTransforms).forEach(([id, tr]) => {
      editor.updateElementTransform(id, tr, false);
    });

    history.pushAction({
      description: `Auto-fixed ${fixedCount} layout health issues`,
      undo: () => {
        Object.entries(prevTransforms).forEach(([id, tr]) => {
          useEditorStore.getState().updateElementTransform(id, tr, false);
        });
      },
      redo: () => {
        Object.entries(updatedTransforms).forEach(([id, tr]) => {
          useEditorStore.getState().updateElementTransform(id, tr, false);
        });
      },
    });

    get().refreshHealthReport();
    useUiStore.getState().showToast({
      type: "success",
      title: "Layout Health Optimized",
      message: `Automatically resolved ${fixedCount} alignment and spacing issues.`,
    });
  },

  applyNaturalLayoutCommand: (prompt: string) => {
    set({ isAnalyzing: true });
    try {
      const editor = useEditorStore.getState();
      const page = editor.getActivePage();
      const book = editor.getActiveBook();
      if (!page || !book) return;

      const directive = interpretNaturalLayoutCommand(prompt, book.grade);
      const elements = page.elementIds.map((id) => editor.elements[id]).filter(Boolean);
      const variations = generateLayoutVariations(elements, book.dimensions, book.margins);

      // Choose most appropriate variation based on intent
      let targetVariation: LayoutVariation = variations[0];
      if (directive.themeId === "playful-primary" || directive.density === "low") {
        targetVariation = variations.find((v) => v.id === "var-playful-primary") || variations[0];
      } else if (directive.illustrationPriority === "hero" || directive.heroImage) {
        targetVariation = variations.find((v) => v.id === "var-hero-visual") || variations[1];
      } else if (directive.typographyScale === "academic" || directive.themeId === "academic-blue") {
        targetVariation = variations.find((v) => v.id === "var-balanced") || variations[0];
      } else if (directive.typographyScale === "editorial") {
        targetVariation = variations.find((v) => v.id === "var-split-screen") || variations[2];
      }

      // Show preview
      get().setPreviewTransforms(targetVariation.elementTransforms, targetVariation.id);

      useUiStore.getState().showToast({
        type: "info",
        title: `Interpreted: "${prompt}"`,
        message: `Generated "${targetVariation.name}". Previewing on canvas. Click Apply or Cancel.`,
      });
    } finally {
      set({ isAnalyzing: false });
    }
  },

  applyLayoutVariation: (variationId: string) => {
    const editor = useEditorStore.getState();
    const page = editor.getActivePage();
    const book = editor.getActiveBook();
    if (!page || !book) return;

    const elements = page.elementIds.map((id) => editor.elements[id]).filter(Boolean);
    const variations = generateLayoutVariations(elements, book.dimensions, book.margins);
    const selected = variations.find((v) => v.id === variationId);

    if (selected) {
      get().setPreviewTransforms(selected.elementTransforms, selected.id);
    }
  },

  applyTextWrapToSelection: (mode: TextWrapMode, offsetPt = 14) => {
    const editor = useEditorStore.getState();
    const selectedIds = editor.selectedElementIds;
    if (selectedIds.length === 0) return;

    selectedIds.forEach((id) => {
      editor.updateElement(id, {
        textWrap: {
          mode,
          offsetPt,
          topOffsetPt: offsetPt,
          bottomOffsetPt: offsetPt,
          leftOffsetPt: offsetPt,
          rightOffsetPt: offsetPt,
        },
      });
    });

    useUiStore.getState().showToast({
      type: "success",
      title: `Text Wrap: ${mode.toUpperCase()}`,
      message: `Applied ${mode} wrapping with ${offsetPt}pt offset.`,
    });
  },
}));
