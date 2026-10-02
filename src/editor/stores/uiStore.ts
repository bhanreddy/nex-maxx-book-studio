import { create } from "zustand";
import { PixelSelectionState } from "../../domain/creative/types";

export type StudioType =
  | "LAYOUT"
  | "VECTOR"
  | "PIXEL"
  | "AI"
  | "BOOK"
  | "CONTENT"
  | "REVIEW"
  | "PREFLIGHT"
  | "EXPORT";

export type StudioMode = StudioType;

export type ToolType =
  | "move"
  | "node"
  | "pen"
  | "pencil"
  | "vectorBrush"
  | "shape"
  | "shapeBuilder"
  | "corner"
  | "knife"
  | "contour"
  | "imageTrace"
  | "frameText"
  | "artisticText"
  | "pictureFrame"
  | "table"
  | "activity"
  | "layout"
  | "crop"
  | "eyedropper"
  | "measure"
  | "hand"
  | "zoom"
  // Pixel Tools
  | "brush"
  | "eraser"
  | "cloneStamp"
  | "healing"
  | "paintBucket"
  | "marqueeSelect"
  | "lassoSelect"
  | "wandSelect"
  | "quickMask"
  // AI Tools
  | "aiGenerateImage"
  | "aiGenerateVector"
  | "aiFill"
  | "aiExpand"
  | "aiRemoveBg"
  | "aiSubjectSelect"
  | "aiUpscale";

export type EditorTool = ToolType;

export type ShapeSubtype =
  | "rectangle"
  | "circle"
  | "ellipse"
  | "star"
  | "polygon"
  | "line"
  | "arrow";

export type LeftPanelTab =
  | "curriculum"
  | "structure"
  | "blocks"
  | "pages"
  | "elements"
  | "templates"
  | "content"
  | "layers"
  | "assets"
  | "styles"
  | "comments"
  | "ai";

export interface ToastMessage {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  message?: string;
}

export interface UserGuide {
  id: string;
  type: "horizontal" | "vertical";
  positionPt: number;
}

export interface MeasureState {
  start: { x: number; y: number } | null;
  current: { x: number; y: number } | null;
  distancePt: number;
  distanceMm: number;
  angleDeg: number;
  dxPt: number;
  dyPt: number;
}

interface UiState {
  // Studio & Active Tool
  activeStudio: StudioType;
  activeTool: ToolType;
  activeShapeType: ShapeSubtype;

  // Progressive Complexity (Directive 5)
  complexityMode: "quick" | "advanced" | "professional";
  uiDensity: "comfortable" | "compact";
  focusMode: boolean;
  performanceMode: "auto" | "high-quality" | "balanced" | "performance";
  safeEditMode: boolean;

  // Floating Context Bar & Assistants (Directive 8 & 38)
  quickActionBarVisible: boolean;
  activeLayoutGalleryOpen: boolean;
  emptyPageAssistantOpen: boolean;
  lastDuplicateOffset: { dx: number; dy: number };

  // Themes & Curated Pairings (Directive 52 & 53)
  activeThemeId: string;
  activeFontPairing: string;
  layoutHealthIssues: string[];
  presetCategoryFilter: string;

  // Workspace Layout
  themeMode: "light" | "dark";
  setThemeMode: (mode: "light" | "dark") => void;
  toggleThemeMode: () => void;
  leftPanelOpen: boolean;
  leftPanelTab: LeftPanelTab;
  rightInspectorOpen: boolean;
  bottomStripOpen: boolean;
  viewMode: "single" | "spread" | "preview";
  distractionFree: boolean;

  // Canvas Viewport
  zoom: number; // 0.25 to 4.0
  panOffset: { x: number; y: number };

  // Guides & Overlays
  showRulers: boolean;
  showGrid: boolean;
  showGuides: boolean;
  showMargins: boolean;
  showBleed: boolean;
  showSafeArea: boolean;
  snapEnabled: boolean;
  userGuides: UserGuide[];

  // Measurement Tool State
  activeMeasure: MeasureState | null;

  // Modals & Panels
  commandPaletteOpen: boolean;
  preflightModalOpen: boolean;
  exportModalOpen: boolean;
  book3dPreviewOpen: boolean;
  wizardOpen: boolean;
  devPerformanceOpen: boolean;
  glyphBrowserOpen: boolean;
  manuscriptImportOpen: boolean;
  dataMergeModalOpen: boolean;
  textStylesModalOpen: boolean;
  createLayoutModalOpen: boolean;
  masterPagesModalOpen: boolean;
  designTokensModalOpen: boolean;
  bookStructureModalOpen: boolean;
  pageBorderModalOpen: boolean;

  // Professional Grid System
  columnGrid: { enabled: boolean; columns: number; gutterPt: number };
  baselineGrid: { enabled: boolean; stepPt: number };

  cropElementId: string | null;
  setCropElementId: (id: string | null) => void;
  editingTextElementId: string | null;
  setEditingTextElementId: (id: string | null) => void;

  // Vector Node Editing
  selectedNodeIds: string[];

  // Pixel Studio State
  brushSettings: {
    size: number;
    hardness: number;
    opacity: number;
    flow: number;
    color: string;
  };
  pixelSelection: PixelSelectionState | null;

  // AI Studio State
  aiModalOpen: boolean;
  aiActiveTab: "generate" | "vector" | "fill" | "expand" | "removeBg" | "upscale" | "history";

  // Autosave & Persistence Status
  saveStatus: "Saved" | "Saving..." | "Changes pending" | "Recovered" | "Local backup only";
  lastSavedAt: string | null;

  // Notification Toasts
  toasts: ToastMessage[];

  // Native Browser Fullscreen Editing Mode (Covers tabs & browser chrome)
  isFullscreen: boolean;

  // Actions
  setActiveStudio: (studio: StudioType) => void;
  setActiveTool: (tool: ToolType) => void;
  setActiveShapeType: (shape: ShapeSubtype) => void;

  setSelectedNodeIds: (nodeIds: string[]) => void;
  setBrushSettings: (settings: Partial<UiState["brushSettings"]>) => void;
  setPixelSelection: (sel: PixelSelectionState | null) => void;
  setAiModalOpen: (open: boolean) => void;
  setAiActiveTab: (tab: UiState["aiActiveTab"]) => void;

  setLeftPanelOpen: (open: boolean) => void;
  setLeftPanelTab: (tab: LeftPanelTab) => void;
  setRightInspectorOpen: (open: boolean) => void;
  setBottomStripOpen: (open: boolean) => void;
  setViewMode: (mode: "single" | "spread" | "preview") => void;
  setDistractionFree: (val: boolean) => void;

  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setPanOffset: (offset: { x: number; y: number }) => void;

  toggleRulers: () => void;
  toggleGrid: () => void;
  toggleGuides: () => void;
  toggleMargins: () => void;
  toggleBleed: () => void;
  toggleSafeArea: () => void;
  toggleSnap: () => void;

  addUserGuide: (type: "horizontal" | "vertical", positionPt: number) => void;
  removeUserGuide: (id: string) => void;
  clearUserGuides: () => void;

  setActiveMeasure: (measure: MeasureState | null) => void;

  setCommandPaletteOpen: (open: boolean) => void;
  setPreflightModalOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setBook3dPreviewOpen: (open: boolean) => void;
  setWizardOpen: (open: boolean) => void;
  setDevPerformanceOpen: (open: boolean) => void;
  setGlyphBrowserOpen: (open: boolean) => void;
  setManuscriptImportOpen: (open: boolean) => void;
  setDataMergeModalOpen: (open: boolean) => void;
  setTextStylesModalOpen: (open: boolean) => void;
  setCreateLayoutModalOpen: (open: boolean) => void;
  setMasterPagesModalOpen: (open: boolean) => void;
  setDesignTokensModalOpen: (open: boolean) => void;
  setBookStructureModalOpen: (open: boolean) => void;
  setPageBorderModalOpen: (open: boolean) => void;
  setColumnGrid: (grid: Partial<{ enabled: boolean; columns: number; gutterPt: number }>) => void;
  setBaselineGrid: (grid: Partial<{ enabled: boolean; stepPt: number }>) => void;

  setSaveStatus: (status: "Saved" | "Saving..." | "Changes pending" | "Recovered" | "Local backup only") => void;
  setLastSavedAt: (timestamp: string) => void;

  setComplexityMode: (mode: "quick" | "advanced" | "professional") => void;
  setUiDensity: (density: "comfortable" | "compact") => void;
  setFocusMode: (val: boolean) => void;
  setPerformanceMode: (mode: "auto" | "high-quality" | "balanced" | "performance") => void;
  setSafeEditMode: (val: boolean) => void;
  setQuickActionBarVisible: (val: boolean) => void;
  setActiveLayoutGalleryOpen: (open: boolean) => void;
  setEmptyPageAssistantOpen: (open: boolean) => void;
  setLastDuplicateOffset: (offset: { dx: number; dy: number }) => void;
  setActiveThemeId: (themeId: string) => void;
  setActiveFontPairing: (pairingId: string) => void;
  setLayoutHealthIssues: (issues: string[]) => void;
  setPresetCategoryFilter: (category: string) => void;

  showToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
  setIsFullscreen: (val: boolean) => void;
  toggleFullscreen: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  activeStudio: "LAYOUT",
  activeTool: "move",
  activeShapeType: "rectangle",

  // Progressive Complexity Default (Directive 5)
  complexityMode: "quick",
  uiDensity: "comfortable",
  focusMode: false,
  performanceMode: "auto",
  safeEditMode: false,

  quickActionBarVisible: true,
  activeLayoutGalleryOpen: false,
  emptyPageAssistantOpen: true,
  lastDuplicateOffset: { dx: 16, dy: 16 },

  activeThemeId: "science-modern",
  activeFontPairing: "modern-academic",
  layoutHealthIssues: [],
  presetCategoryFilter: "all",

  themeMode: (typeof window !== "undefined" && (localStorage.getItem("nex-theme-mode") as "light" | "dark")) || "light",
  leftPanelOpen: true,
  leftPanelTab: "curriculum",
  rightInspectorOpen: true,
  bottomStripOpen: true,
  viewMode: "single",
  distractionFree: false,

  zoom: 1.0,
  panOffset: { x: 0, y: 0 },

  showRulers: true,
  showGrid: false,
  showGuides: true,
  showMargins: true,
  showBleed: true,
  showSafeArea: true,
  snapEnabled: true,
  userGuides: [],

  activeMeasure: null,

  commandPaletteOpen: false,
  preflightModalOpen: false,
  exportModalOpen: false,
  book3dPreviewOpen: false,
  wizardOpen: false,
  devPerformanceOpen: false,
  glyphBrowserOpen: false,
  manuscriptImportOpen: false,
  dataMergeModalOpen: false,
  textStylesModalOpen: false,
  createLayoutModalOpen: false,
  masterPagesModalOpen: false,
  designTokensModalOpen: false,
  bookStructureModalOpen: false,
  pageBorderModalOpen: false,

  columnGrid: { enabled: false, columns: 2, gutterPt: 16 },
  baselineGrid: { enabled: false, stepPt: 12 },

  cropElementId: null,
  setCropElementId: (id) => set({ cropElementId: id }),
  editingTextElementId: null,
  setEditingTextElementId: (id) => set({ editingTextElementId: id }),
  selectedNodeIds: [],
  brushSettings: {
    size: 24,
    hardness: 0.8,
    opacity: 1,
    flow: 1,
    color: "#800020",
  },
  pixelSelection: null,
  aiModalOpen: false,
  aiActiveTab: "generate",

  saveStatus: "Local backup only",
  lastSavedAt: null,

  toasts: [],

  setSelectedNodeIds: (nodeIds) => set({ selectedNodeIds: nodeIds }),
  setBrushSettings: (settings) =>
    set((s) => ({ brushSettings: { ...s.brushSettings, ...settings } })),
  setPixelSelection: (sel) => set({ pixelSelection: sel }),
  setAiModalOpen: (open) => set({ aiModalOpen: open }),
  setAiActiveTab: (tab) => set({ aiActiveTab: tab }),

  setActiveStudio: (studio) => {
    set((state) => {
      // Intelligently configure panel tabs and default tool according to studio
      let newTab: LeftPanelTab = state.leftPanelTab;
      let newTool: ToolType = state.activeTool;

      if (studio === "LAYOUT") {
        newTab = "elements";
        newTool = "move";
      } else if (studio === "VECTOR") {
        newTab = "elements";
        newTool = "node";
      } else if (studio === "PIXEL") {
        newTab = "assets";
        newTool = "brush";
      } else if (studio === "AI") {
        newTab = "ai";
        newTool = "aiGenerateImage";
      } else if (studio === "BOOK") {
        newTab = "pages";
        newTool = "move";
      } else if (studio === "CONTENT") {
        newTab = "content";
        newTool = "move";
      } else if (studio === "REVIEW") {
        newTab = "comments";
        newTool = "move";
      } else if (studio === "PREFLIGHT") {
        setTimeout(() => set({ preflightModalOpen: true }), 50);
      } else if (studio === "EXPORT") {
        setTimeout(() => set({ exportModalOpen: true }), 50);
      }

      return {
        activeStudio: studio,
        leftPanelTab: newTab,
        activeTool: newTool,
        leftPanelOpen: true,
        rightInspectorOpen: true,
      };
    });
  },

  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveShapeType: (shape) => set({ activeShapeType: shape, activeTool: "shape" }),

  setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
  setLeftPanelTab: (tab) => set({ leftPanelTab: tab, leftPanelOpen: true }),
  setRightInspectorOpen: (open) => set({ rightInspectorOpen: open }),
  setBottomStripOpen: (open) => set({ bottomStripOpen: open }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setDistractionFree: (val) =>
    set({
      distractionFree: val,
      leftPanelOpen: !val,
      rightInspectorOpen: !val,
      bottomStripOpen: !val,
    }),

  setZoom: (zoom) => set({ zoom: Math.min(3.0, Math.max(0.3, Math.round(zoom * 100) / 100)) }),
  zoomIn: () =>
    set((state) => ({ zoom: Math.min(3.0, Math.round((state.zoom + 0.15) * 100) / 100) })),
  zoomOut: () =>
    set((state) => ({ zoom: Math.max(0.3, Math.round((state.zoom - 0.15) * 100) / 100) })),
  resetZoom: () => set({ zoom: 1.0, panOffset: { x: 0, y: 0 } }),
  setPanOffset: (offset) => set({ panOffset: offset }),

  toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  toggleMargins: () => set((s) => ({ showMargins: !s.showMargins })),
  toggleBleed: () => set((s) => ({ showBleed: !s.showBleed })),
  toggleSafeArea: () => set((s) => ({ showSafeArea: !s.showSafeArea })),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

  addUserGuide: (type, positionPt) => {
    const guide: UserGuide = {
      id: `guide-${Math.random().toString(36).substring(2, 8)}`,
      type,
      positionPt: Math.round(positionPt * 10) / 10,
    };
    set((s) => ({ userGuides: [...s.userGuides, guide] }));
  },
  removeUserGuide: (id) => set((s) => ({ userGuides: s.userGuides.filter((g) => g.id !== id) })),
  clearUserGuides: () => set({ userGuides: [] }),

  setActiveMeasure: (measure) => set({ activeMeasure: measure }),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setPreflightModalOpen: (open) => set({ preflightModalOpen: open }),
  setExportModalOpen: (open) => set({ exportModalOpen: open }),
  setBook3dPreviewOpen: (open) => set({ book3dPreviewOpen: open }),
  setWizardOpen: (open) => set({ wizardOpen: open }),
  setDevPerformanceOpen: (open) => set({ devPerformanceOpen: open }),
  setGlyphBrowserOpen: (open) => set({ glyphBrowserOpen: open }),
  setManuscriptImportOpen: (open) => set({ manuscriptImportOpen: open }),
  setDataMergeModalOpen: (open) => set({ dataMergeModalOpen: open }),
  setTextStylesModalOpen: (open) => set({ textStylesModalOpen: open }),
  setCreateLayoutModalOpen: (open) => set({ createLayoutModalOpen: open }),
  setMasterPagesModalOpen: (open) => set({ masterPagesModalOpen: open }),
  setDesignTokensModalOpen: (open) => set({ designTokensModalOpen: open }),
  setBookStructureModalOpen: (open) => set({ bookStructureModalOpen: open }),
  setPageBorderModalOpen: (open) => set({ pageBorderModalOpen: open }),
  setColumnGrid: (grid) => set((s) => ({ columnGrid: { ...s.columnGrid, ...grid } })),
  setBaselineGrid: (grid) => set((s) => ({ baselineGrid: { ...s.baselineGrid, ...grid } })),

  setSaveStatus: (status) => set({ saveStatus: status }),
  setLastSavedAt: (timestamp) => set({ lastSavedAt: timestamp }),

  showToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setComplexityMode: (mode) => set({ complexityMode: mode }),
  setUiDensity: (density) => set({ uiDensity: density }),
  setFocusMode: (val) =>
    set({
      focusMode: val,
      leftPanelOpen: !val,
      rightInspectorOpen: !val,
      bottomStripOpen: !val,
    }),
  setPerformanceMode: (mode) => set({ performanceMode: mode }),
  setSafeEditMode: (val) => set({ safeEditMode: val }),
  setQuickActionBarVisible: (val) => set({ quickActionBarVisible: val }),
  setActiveLayoutGalleryOpen: (open) => set({ activeLayoutGalleryOpen: open }),
  setEmptyPageAssistantOpen: (open) => set({ emptyPageAssistantOpen: open }),
  setLastDuplicateOffset: (offset) => set({ lastDuplicateOffset: offset }),
  setActiveThemeId: (themeId) => set({ activeThemeId: themeId }),
  setActiveFontPairing: (pairingId) => set({ activeFontPairing: pairingId }),
  setLayoutHealthIssues: (issues) => set({ layoutHealthIssues: issues }),
  setPresetCategoryFilter: (category) => set({ presetCategoryFilter: category }),
  setThemeMode: (mode) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(mode);
      document.documentElement.setAttribute("data-theme", mode);
      try {
        localStorage.setItem("nex-theme-mode", mode);
      } catch {}
    }
    set({ themeMode: mode });
  },
  toggleThemeMode: () => {
    const current = get().themeMode;
    const next = current === "light" ? "dark" : "light";
    get().setThemeMode(next);
  },

  isFullscreen: false,
  setIsFullscreen: (val) => set({ isFullscreen: val }),
  toggleFullscreen: () => {
    if (typeof document === "undefined") return;
    interface VendorDocument extends Document {
      webkitFullscreenElement?: Element | null;
      mozFullScreenElement?: Element | null;
      msFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
      mozCancelFullScreen?: () => Promise<void> | void;
      msExitFullscreen?: () => Promise<void> | void;
    }
    interface VendorElement extends HTMLElement {
      webkitRequestFullscreen?: () => Promise<void> | void;
      mozRequestFullScreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    }

    const doc = document as VendorDocument;
    const docEl = document.documentElement as VendorElement;
    const isFull = Boolean(
      doc.fullscreenElement ||
      doc.mozFullScreenElement ||
      doc.webkitFullscreenElement ||
      doc.msFullscreenElement
    );
    if (!isFull) {
      const p =
        docEl.requestFullscreen?.() ||
        docEl.webkitRequestFullscreen?.() ||
        docEl.mozRequestFullScreen?.() ||
        docEl.msRequestFullscreen?.();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      const p =
        doc.exitFullscreen?.() ||
        doc.webkitExitFullscreen?.() ||
        doc.mozCancelFullScreen?.() ||
        doc.msExitFullscreen?.();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  },
}));
