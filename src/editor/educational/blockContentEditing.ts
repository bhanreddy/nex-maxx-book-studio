import { useEditorStore } from "../stores/editorStore";
import { isElementLocked } from "../core/elementGroups";
import { referenceBannerFor } from "./referenceBanners";
import { useUiStore } from "../stores/uiStore";
import { setFrameworkMode } from "../curriculum/actions";

export function beginBlockContentEditing(elementId: string) {
  let store = useEditorStore.getState();
  let element = store.elements[elementId];
  if (!element?.smartBlockData || isElementLocked(elementId, store.elements) || element.smartBlockData.styleOverrides.contentLayout?.enabled) return;
  if (referenceBannerFor(element.smartBlockData.presetId)) {
    store.updateSmartBlockStyle(elementId, { referenceBannerVersion: 'editable' });
    useUiStore.getState().setRightInspectorOpen(true);
    return;
  }
  const chapterId = element.smartBlockData.curriculum?.chapterId;
  if (chapterId && store.getActiveBook()?.chapters.find(chapter => chapter.id === chapterId)?.framework?.mode === "easy") {
    setFrameworkMode(chapterId, "design");
    store = useEditorStore.getState();
    element = store.elements[elementId];
  }
  if (!element?.smartBlockData) return;
  if (element.smartBlockData.isLockedDesign) store.updateElement(elementId, { smartBlockData: { ...element.smartBlockData, isLockedDesign: false } });
  store.updateBlockContentLayout(elementId, { enabled: true, items: element.smartBlockData.styleOverrides.contentLayout?.items || {} });
}
