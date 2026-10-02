"use client";

import { PageElement } from "../../domain/element/types";
import { useEditorStore } from "../stores/editorStore";
import { useUiStore } from "../stores/uiStore";

export interface UniversalPasteOptions {
  pasteX?: number;
  pasteY?: number;
}

/**
 * Universal Clipboard & Image Handling Engine
 * Handles OS images, screenshots, rich text, plain text, and Studio elements.
 */
export async function handleUniversalPaste(
  event: ClipboardEvent,
  options: UniversalPasteOptions = {}
): Promise<boolean> {
  const activeEl = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
  const targetEl = (event.target instanceof HTMLElement
    ? event.target
    : event.target instanceof Node
    ? event.target.parentElement
    : null) as HTMLElement | null;

  // 1. If user is currently typing in an editable field or rich text editor
  const isEditingText =
    activeEl?.tagName === "INPUT" ||
    activeEl?.tagName === "TEXTAREA" ||
    activeEl?.isContentEditable ||
    Boolean(activeEl?.closest?.('[contenteditable="true"]')) ||
    targetEl?.tagName === "INPUT" ||
    targetEl?.tagName === "TEXTAREA" ||
    targetEl?.isContentEditable ||
    Boolean(targetEl?.closest?.('[contenteditable="true"]'));

  const clipboardData = event.clipboardData;
  if (!clipboardData) return false;

  // Check if clipboard contains an image file/screenshot
  let imageFile: File | null = null;
  for (let i = 0; i < clipboardData.items.length; i++) {
    const item = clipboardData.items[i];
    if (item.type.startsWith("image/")) {
      imageFile = item.getAsFile();
      break;
    }
  }

  // If user is editing text and it's pure text/html without image, let native text paste work naturally!
  if (isEditingText && !imageFile) {
    return false; // Let browser paste text into active caret position
  }

  const store = useEditorStore.getState();
  const page = store.getActivePage();
  const book = store.getActiveBook();
  if (!page || !book) return false;

  // 2. Handle Image Paste (from Screenshot, Finder/Explorer, or browser copy)
  if (imageFile) {
    event.preventDefault();
    event.stopPropagation();

    useUiStore.getState().showToast({
      type: "info",
      title: "Processing Image...",
      message: "Creating instant local preview",
    });

    const dataUrl = await readFileAsDataUrl(imageFile);
    const dimensions = await getImageDimensions(dataUrl);

    // Calculate proportional fit on the page (max 420pt wide, 350pt high)
    const maxWidth = Math.min(420, book.dimensions.widthPt - 100);
    const maxHeight = Math.min(350, book.dimensions.heightPt - 160);

    let finalW = dimensions.width;
    let finalH = dimensions.height;
    const aspect = dimensions.width / Math.max(1, dimensions.height);

    if (finalW > maxWidth) {
      finalW = maxWidth;
      finalH = finalW / aspect;
    }
    if (finalH > maxHeight) {
      finalH = maxHeight;
      finalW = finalH * aspect;
    }

    const posX = options.pasteX ?? Math.round((book.dimensions.widthPt - finalW) / 2);
    const posY = options.pasteY ?? Math.round((book.dimensions.heightPt - finalH) / 2);

    const activeElements = store.getActivePageElements();
    const highestZ = activeElements.reduce((max, el) => Math.max(max, el.transform.zIndex), 0);

    const newElement: PageElement = {
      id: `el-img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      pageId: page.id,
      type: "image",
      category: "media",
      version: 1,
      displayName: `Image ${imageFile.name || "Upload"}`,
      locked: false,
      hidden: false,
      transform: {
        x: posX,
        y: posY,
        width: Math.round(finalW),
        height: Math.round(finalH),
        rotation: 0,
        zIndex: highestZ + 1,
      },
      style: {
        borderRadius: 8,
        borderWidth: 0,
        borderStyle: "none",
        objectFit: "cover",
      },
      content: {
        src: dataUrl,
        url: dataUrl,
        caption: imageFile.name ? imageFile.name.replace(/\.[^/.]+$/, "") : "Pasted Image",
        aspectRatio: aspect,
        rawWidthPx: dimensions.width,
        rawHeightPx: dimensions.height,
        mimeType: imageFile.type,
      },
    };

    store.insertPublicationElement(newElement);

    useUiStore.getState().showToast({
      type: "success",
      title: "Image Inserted",
      message: `${Math.round(finalW)} × ${Math.round(finalH)} pt image placed on page`,
    });

    return true;
  }

  // 3. Handle Internal Studio Elements or Custom JSON
  const studioJson = clipboardData.getData("application/x-nex-maxx-elements");
  if (studioJson) {
    try {
      const parsed = JSON.parse(studioJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        store.pasteSelection();
        return true;
      }
    } catch {
      // Not valid JSON
    }
  }

  // 4. Handle External Plain Text or Rich Text pasted directly onto canvas
  if (!isEditingText) {
    const plainText = clipboardData.getData("text/plain")?.trim();
    const htmlText = clipboardData.getData("text/html");

    if (plainText) {
      event.preventDefault();
      event.stopPropagation();

      const activeElements = store.getActivePageElements();
      const highestZ = activeElements.reduce((max, el) => Math.max(max, el.transform.zIndex), 0);

      const isHeading = plainText.length < 60 && !plainText.includes("\n");
      const defaultW = Math.min(460, book.dimensions.widthPt - 100);
      const defaultH = isHeading ? 42 : Math.min(220, Math.max(70, Math.ceil(plainText.length / 50) * 20));

      const posX = options.pasteX ?? Math.round((book.dimensions.widthPt - defaultW) / 2);
      const posY = options.pasteY ?? Math.round((book.dimensions.heightPt - defaultH) / 2);

      const newElement: PageElement = {
        id: `el-text-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        pageId: page.id,
        type: isHeading ? "heading" : "body",
        category: "text",
        version: 1,
        displayName: isHeading ? "Pasted Heading" : "Pasted Paragraph",
        locked: false,
        hidden: false,
        transform: {
          x: posX,
          y: posY,
          width: defaultW,
          height: defaultH,
          rotation: 0,
          zIndex: highestZ + 1,
        },
        style: {
          fontSize: isHeading ? 18 : 11,
          fontWeight: isHeading ? 700 : 400,
          color: "#0f172a",
          lineHeight: isHeading ? 1.2 : 1.5,
          textAlign: "left",
        },
        content: {
          text: htmlText || plainText,
        },
      };

      store.insertPublicationElement(newElement);

      useUiStore.getState().showToast({
        type: "success",
        title: "Text Pasted",
        message: `Created new ${isHeading ? "heading" : "body text"} element`,
      });

      return true;
    }
  }

  return false;
}

/**
 * Handle Drag-and-Drop Image Files onto Canvas
 */
export async function handleFileDropOnCanvas(
  files: FileList | File[],
  dropPt: { x: number; y: number }
): Promise<number> {
  const store = useEditorStore.getState();
  const page = store.getActivePage();
  const book = store.getActiveBook();
  if (!page || !book || files.length === 0) return 0;

  let insertedCount = 0;
  const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const dataUrl = await readFileAsDataUrl(file);
    const dimensions = await getImageDimensions(dataUrl);

    const maxWidth = Math.min(380, book.dimensions.widthPt - 80);
    const maxHeight = Math.min(300, book.dimensions.heightPt - 120);
    const aspect = dimensions.width / Math.max(1, dimensions.height);

    let finalW = dimensions.width;
    let finalH = dimensions.height;
    if (finalW > maxWidth) {
      finalW = maxWidth;
      finalH = finalW / aspect;
    }
    if (finalH > maxHeight) {
      finalH = maxHeight;
      finalW = finalH * aspect;
    }

    const activeElements = store.getActivePageElements();
    const highestZ = activeElements.reduce((max, el) => Math.max(max, el.transform.zIndex), 0);

    const newElement: PageElement = {
      id: `el-img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
      pageId: page.id,
      type: "image",
      category: "media",
      version: 1,
      displayName: `Image ${file.name || "Dropped"}`,
      locked: false,
      hidden: false,
      transform: {
        x: Math.round(dropPt.x + i * 20),
        y: Math.round(dropPt.y + i * 20),
        width: Math.round(finalW),
        height: Math.round(finalH),
        rotation: 0,
        zIndex: highestZ + 1 + i,
      },
      style: {
        borderRadius: 8,
        borderWidth: 0,
        borderStyle: "none",
        objectFit: "cover",
      },
      content: {
        src: dataUrl,
        url: dataUrl,
        caption: file.name.replace(/\.[^/.]+$/, ""),
        aspectRatio: aspect,
        rawWidthPx: dimensions.width,
        rawHeightPx: dimensions.height,
        mimeType: file.type,
      },
    };

    store.insertPublicationElement(newElement);
    insertedCount++;
  }

  if (insertedCount > 0) {
    useUiStore.getState().showToast({
      type: "success",
      title: "Images Added",
      message: `Dropped ${insertedCount} image(s) onto canvas`,
    });
  }

  return insertedCount;
}

// ==========================================
// HELPERS
// ==========================================

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ width: 300, height: 200 });
      return;
    }
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || 300,
        height: img.naturalHeight || 200,
      });
    };
    img.onerror = () => resolve({ width: 300, height: 200 });
    img.src = dataUrl;
  });
}
