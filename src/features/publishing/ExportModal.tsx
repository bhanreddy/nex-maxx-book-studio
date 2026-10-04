"use client";
import { buildPageFrameScene, pageFrameFor, isFrameBackgroundNode } from "../../editor/pageFrame/pageFrame";
import { buildPublisherFooterScene } from "../../editor/branding/publisherFooter";

import {hydrateSmartQrs} from "../../editor/media/smartQr";
import {preparePrintHtml} from "../../editor/publishing/publicationPrint";
import { prepareCompleteExportBook } from "../../editor/publishing/exportBook";
import { selectExportPages } from "../../editor/publishing/exportScope";
import { scanPreflightInBackground } from "../../editor/publishing/backgroundPreflight";
import React, { useState } from "react";
import { useUiStore } from "../../editor/stores/uiStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import { ExportPreset } from "../../domain/publishing/types";
import { toGrayHex } from "../../editor/design/contrast";
import jsPDF from "jspdf";
import { publicationSceneForElement, renderPublicationPdf } from "../../editor/educational/publicationPdf";
import { prepareTextWrapContours } from "../../editor/layoutPartner/textWrapLayout";
import { prepareResponsiveElementScenes } from "../../editor/math/mathDomScene";
import confetti from "canvas-confetti";
import {
  X,
  FileDown,
  Loader2,
} from "lucide-react";

export const ExportModal: React.FC = () => {
  const { exportModalOpen, setExportModalOpen, showToast } = useUiStore();
  const { books, activeBookId, elements } = useEditorStore();

  const [preset, setPreset] = useState<ExportPreset>("Commercial Print");
  const presetLabel = preset === "Commercial Print" ? "Print Layout Proof" : (preset as string) === "Digital PDF" ? "Digital PDF" : preset;
  const [includeBleed, setIncludeBleed] = useState(true);
  const [includeCropMarks, setIncludeCropMarks] = useState(true);
  const [grayscaleProof, setGrayscaleProof] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Export Scope Selection (Part 8)
  const [exportScope, setExportScope] = useState<"all" | "chapter" | "selected">("all");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [pageRangeString, setPageRangeString] = useState<string>("1-5");

  const book = books.find((b) => b.id === activeBookId);

  const selection = React.useMemo(() => {
    if (!book) return { pages: [], error: '' };
    try { return { pages: selectExportPages(book, exportScope, selectedChapterId || book.chapters[0]?.id, pageRangeString), error: '' }; }
    catch (error) { return { pages: [], error: error instanceof Error ? error.message : 'Invalid export scope' }; }
  }, [book, exportScope, selectedChapterId, pageRangeString]);
  const effectivePages = selection.pages;

  if (!exportModalOpen || !book) return null;

  const handleEmbeddedPdf=async()=>{
    const proof=window.open('','_blank');
    if(!proof){showToast({type:'error',title:'Allow the print window',message:'Enable popups for Book Studio, then export again.'});return;}
    proof.opener=null;setIsExporting(true);setExportProgress(5);
    try{
      if (selection.error) throw new Error(selection.error);
      const complete = exportScope === 'all' ? await prepareCompleteExportBook(book, elements) : { book, elements };
      const exportPages = selectExportPages(complete.book, exportScope, selectedChapterId || complete.book.chapters[0]?.id, pageRangeString);
      const scopedElementIds = new Set(exportPages.flatMap(p => p.elementIds));
      const scopedElements = Object.fromEntries(Object.entries(complete.elements).filter(([id]) => scopedElementIds.has(id)));
      const scopedBook = { ...complete.book, pages: exportPages };
      const report = await scanPreflightInBackground(scopedBook, scopedElements);
      const criticalErrors = report.issues.filter(i => i.severity === 'error' && (i.category === 'font' || i.category === 'structure' || i.title === 'Invalid geometry'));
      if (criticalErrors.length > 0) throw new Error(`${criticalErrors.length} critical preflight error(s): ${criticalErrors[0].message}`);
      const printable = { ...complete.book, pages: exportPages };
      const printElements = complete.elements;
      const html=await preparePrintHtml(printable,printElements,{bleed:includeBleed,cropMarks:includeCropMarks,grayscale:grayscaleProof});
      proof.document.open();proof.document.write(html);proof.document.close();
      await proof.document.fonts.ready;
      if([...proof.document.fonts].some(face=>face.status==='error'))throw new Error('A required print font failed to load');
      const overflow=[...proof.document.querySelectorAll<SVGTextElement>('text[data-print-text]')].find(text=>{
        const bbox=text.getBBox(),frame=text.ownerSVGElement?.viewBox.baseVal;
        return frame&&(bbox.x<-8||bbox.y<-8||bbox.x+bbox.width>frame.width+8||bbox.y+bbox.height>frame.height+8);
      });
      if(overflow) console.warn(`Printed text near frame edge: “${overflow.textContent?.slice(0,100)}”.`);
      setExportProgress(100);proof.focus();proof.print();setExportModalOpen(false);
      showToast({type:'success',title:'Font-embedded print proof opened',message:'Choose Save as PDF. Use 100% scale, no browser headers, and background graphics.'});
    }catch(error){proof.close();showToast({type:'error',title:'Print preflight failed',message:error instanceof Error?error.message:'PDF proof failed'});}
    finally{setIsExporting(false);setExportProgress(0);}
  };

  // Real deterministic Vector PDF generation
  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportProgress(10);

    try {
      if (selection.error) throw new Error(selection.error);
      const complete = exportScope === 'all' ? await prepareCompleteExportBook(book, elements) : { book, elements };
      const exportPages = selectExportPages(complete.book, exportScope, selectedChapterId || complete.book.chapters[0]?.id, pageRangeString);
      const scopedElementIds = new Set(exportPages.flatMap(p => p.elementIds));
      const scopedElements = Object.fromEntries(Object.entries(complete.elements).filter(([id]) => scopedElementIds.has(id)));
      const scopedBook = { ...complete.book, pages: exportPages };
      const report = await scanPreflightInBackground(scopedBook, scopedElements);
      const criticalErrors = report.issues.filter(i => i.severity === 'error' && (i.category === 'font' || i.category === 'structure' || i.title === 'Invalid geometry'));
      if (criticalErrors.length > 0) throw new Error(`${criticalErrors.length} critical preflight error(s): ${criticalErrors[0].message}`);
      if(/[\u0900-\u097f\u0c00-\u0c7f]/u.test(JSON.stringify({chapters:book.chapters,elements})))throw new Error('Use the font-embedded PDF exporter for Hindi or Telugu. The legacy exporter cannot shape these scripts.');
      const { dimensions, bleed } = book;

      // Page dimensions in points (pt)
      const pageWidthPt = includeBleed
        ? dimensions.widthPt + bleed.leftPt + bleed.rightPt
        : dimensions.widthPt;
      const pageHeightPt = includeBleed
        ? dimensions.heightPt + bleed.topPt + bleed.bottomPt
        : dimensions.heightPt;

      // Initialize jsPDF with exact point coordinates
      const doc = new jsPDF({
        orientation: dimensions.widthPt > dimensions.heightPt ? "landscape" : "portrait",
        unit: "pt",
        format: [pageWidthPt, pageHeightPt],
      });

      const printableIds = new Set(exportPages.flatMap((page) => page.elementIds));
      const exportElements = await hydrateSmartQrs(
        Object.fromEntries(Object.entries(complete.elements).filter(([id]) => printableIds.has(id))),
        dimensions.widthPt,
        dimensions.heightPt
      );
      const totalPages = exportPages.length;
      await prepareResponsiveElementScenes(Object.values(exportElements));

      for (let i = 0; i < totalPages; i++) {
        const page = exportPages[i];
        if (i > 0) {
          doc.addPage([pageWidthPt, pageHeightPt]);
        }

        setExportProgress(Math.round(((i + 1) / totalPages) * 80));

        // Offset origin if bleed is included
        const originX = includeBleed ? bleed.leftPt : 0;
        const originY = includeBleed ? bleed.topPt : 0;

        // Draw crop marks if commercial print
        if (includeCropMarks && includeBleed) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          // Top Left Crop Marks
          doc.line(originX, 0, originX, originY - 2);
          doc.line(0, originY, originX - 2, originY);
          // Top Right Crop Marks
          doc.line(originX + dimensions.widthPt, 0, originX + dimensions.widthPt, originY - 2);
          doc.line(pageWidthPt, originY, originX + dimensions.widthPt + 2, originY);
          // Bottom Left Crop Marks
          doc.line(originX, pageHeightPt, originX, originY + dimensions.heightPt + 2);
          doc.line(0, originY + dimensions.heightPt, originX - 2, originY + dimensions.heightPt);
          // Bottom Right Crop Marks
          doc.line(
            originX + dimensions.widthPt,
            pageHeightPt,
            originX + dimensions.widthPt,
            originY + dimensions.heightPt + 2
          );
          doc.line(
            pageWidthPt,
            originY + dimensions.heightPt,
            originX + dimensions.widthPt + 2,
            originY + dimensions.heightPt
          );
        }

        const frame = pageFrameFor(complete.book, page);
        if (frame) {
          const scene = buildPageFrameScene(frame, page.displayNumber, dimensions.widthPt, dimensions.heightPt);
          await renderPublicationPdf(doc, { ...scene, nodes: scene.nodes.filter(isFrameBackgroundNode) }, { id: `frame-${page.id}`, pageId: page.id, type: "shape", category: "decorative", version: 1, displayName: "Page paper", locked: false, hidden: false, transform: { x: 0, y: 0, width: scene.width, height: scene.height, rotation: 0, zIndex: -1 }, style: {}, content: {} }, originX, originY, grayscaleProof);
        }
        // Render page elements deterministically
        const wrapElements = page.elementIds.map(id => elements[id]).filter(el => Boolean(el) && !el.content.teacherOnly);
        const pageElements = page.elementIds
          .map((id) => exportElements[id])
          .filter(el => Boolean(el) && !el.hidden && !el.content.teacherOnly)
          .sort((a, b) => a.transform.zIndex - b.transform.zIndex);

        await prepareTextWrapContours(pageElements);
        for (const el of pageElements) {
          const publicationScene = publicationSceneForElement(el, wrapElements);
          if(publicationScene) {
            if(publicationScene.variant === "flow-text" && publicationScene.warnings.length) {
              console.warn(`[Export PDF] ${el.displayName}:`, publicationScene.warnings.join(" "));
            }
            if(el.smartBlockData && publicationScene.height > el.transform.height + 1) {
              console.warn(`[Export PDF] “${el.displayName}” rendered height (${publicationScene.height}pt) exceeds element height (${el.transform.height}pt). Rendering safely.`);
            }
            await renderPublicationPdf(doc,publicationScene,el,originX,originY,grayscaleProof);
            continue;
          }
          const x = originX + el.transform.x;
          const y = originY + el.transform.y;
          const w = el.transform.width;
          const h = el.transform.height;

          const paint = (hex?: string) => {
            if (!hex || !hex.startsWith("#")) return null;
            const value = grayscaleProof ? toGrayHex(hex) : hex;
            return [
              parseInt(value.slice(1, 3), 16) || 0,
              parseInt(value.slice(3, 5), 16) || 0,
              parseInt(value.slice(5, 7), 16) || 0,
            ] as const;
          };

          // Draw background cards/boxes
          if (el.style.backgroundColor && el.style.backgroundColor !== "transparent") {
            const rgb = paint(el.style.backgroundColor);
            if (rgb) {
              doc.setFillColor(rgb[0], rgb[1], rgb[2]);
              if (el.style.borderRadius) {
                doc.roundedRect(x, y, w, h, el.style.borderRadius, el.style.borderRadius, "F");
              } else {
                doc.rect(x, y, w, h, "F");
              }
            }
          }

          // Draw borders
          if (el.style.borderColor && el.style.borderWidth) {
            const rgb = paint(el.style.borderColor);
            if (rgb) {
              doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
              doc.setLineWidth(el.style.borderWidth);
              if (el.style.borderRadius) {
                doc.roundedRect(x, y, w, h, el.style.borderRadius, el.style.borderRadius, "S");
              } else {
                doc.rect(x, y, w, h, "S");
              }
            }
          }

          // Designed presets share one text payload. Ornaments are simplified to rules in PDF.
          if (el.content?.design?.composition) {
            const fontSize = el.style.fontSize || 10;
            doc.setFontSize(fontSize);
            doc.setFont("helvetica", el.style.fontWeight && el.style.fontWeight >= 600 ? "bold" : "normal");
            const textRgb = paint(el.style.color || "#1A1A1A") || [26, 26, 26];
            doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
            const parts = [
              el.content.kicker,
              el.content.number,
              el.content.text || el.content.title || el.content.term || el.content.questionText,
              el.content.subtitle,
              el.content.body && el.content.body !== el.content.text ? el.content.body : "",
              el.content.caption,
            ].filter((part) => typeof part === "string" && part.trim());
            const lines = doc.splitTextToSize(parts.join("  "), Math.max(12, w - 8));
            doc.text(lines, x + 4, y + fontSize + 2);
            if (String(el.content.design.composition).includes("rule:")) {
              const rule = paint(el.content.design.tokens?.accent || el.style.color || "#1A1A1A");
              if (rule) {
                doc.setDrawColor(rule[0], rule[1], rule[2]);
                doc.setLineWidth(0.6);
                doc.line(x + 4, y + h - 4, x + w - 4, y + h - 4);
              }
            }
          } else if (["heading", "subheading", "body", "body-text", "caption", "quote", "chapter-title", "lesson-title", "header", "footer", "pageNumber", "page-number"].includes(el.type)) {
            const fontSize = el.style.fontSize || 10.5;
            doc.setFontSize(fontSize);
            doc.setFont("helvetica", el.style.fontWeight && el.style.fontWeight >= 600 ? "bold" : "normal");

            const textColor = el.style.color || "#0f172a";
            if (textColor.startsWith("#")) {
              const r = parseInt(textColor.slice(1, 3), 16) || 15;
              const g = parseInt(textColor.slice(3, 5), 16) || 23;
              const bColor = parseInt(textColor.slice(5, 7), 16) || 42;
              doc.setTextColor(r, g, bColor);
            }

            const textLines = doc.splitTextToSize(el.content.text || "", w);
            const align = el.style.textAlign === 'right' ? 'right' : el.style.textAlign === 'center' ? 'center' : 'left';
            doc.text(textLines, align === 'right' ? x + w : align === 'center' ? x + w / 2 : x, y + fontSize, { align });
          } else if (el.type === "learningObjectives") {
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(3, 105, 161);
            doc.text(el.content.title || "LEARNING GOALS", x + 10, y + 14);

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(12, 74, 110);
            (el.content.items || []).forEach((item: string, idx: number) => {
              doc.text(`• ${item}`, x + 12, y + 28 + idx * 12);
            });
          } else if (el.type === "didYouKnow") {
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(161, 98, 7);
            doc.text(el.content.title || "DID YOU KNOW?", x + 8, y + 14);

            doc.setFontSize(7.5);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(113, 63, 18);
            const lines = doc.splitTextToSize(el.content.body || "", w - 16);
            doc.text(lines, x + 8, y + 26);
          } else if (el.type === "mcq") {
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text(`${el.content.questionNumber || "Q"}: ${el.content.questionText}`, x + 8, y + 14);

            doc.setFontSize(7.5);
            doc.setFont("helvetica", "normal");
            (el.content.options || []).forEach((opt: string, optIdx: number) => {
              doc.text(opt, x + 12, y + 30 + optIdx * 14);
            });
          }
        }

        if (frame) {
          const scene = buildPageFrameScene(frame, page.displayNumber, dimensions.widthPt, dimensions.heightPt);
          await renderPublicationPdf(doc, { ...scene, nodes: scene.nodes.filter(node => !isFrameBackgroundNode(node)) }, { id: `border-${page.id}`, pageId: page.id, type: 'shape', category: 'decorative', version: 1, displayName: 'Page border', locked: true, hidden: false, transform: { x: 0, y: 0, width: scene.width, height: scene.height, rotation: 0, zIndex: 1 }, style: {}, content: {} }, originX, originY, grayscaleProof);
        }
        const footer = buildPublisherFooterScene(complete.book, page, exportElements);
        if (footer.warnings.length) console.warn('[Publisher Footer]', footer.warnings.join(' '));
        await renderPublicationPdf(doc, footer, { id: `publisher-footer-${page.id}`, pageId: page.id, type: 'shape', category: 'decorative', version: 1, displayName: 'Publisher footer', locked: true, hidden: false, transform: { x: 0, y: 0, width: footer.width, height: footer.height, rotation: 0, zIndex: 1 }, style: {}, content: {} }, originX, originY, grayscaleProof);
      }

      setExportProgress(100);

      // Download file
      const fileName = `${book.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_${presetLabel.replace(/\s+/g, "_")}.pdf`;
      doc.save(fileName);

      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast({
        type: "success",
        title: "PDF proof exported",
        message: `Saved ${fileName} (${totalPages} pages with vector typography).`,
      });

      setExportModalOpen(false);
    } catch (err) {
      console.error("PDF export failed", err);
      showToast({
        type: "error",
        title: "Export Failed",
        message: err instanceof Error?err.message:"An error occurred while compiling the print PDF.",
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
      onClick={() => !isExporting && setExportModalOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100">Publish & Export Book</h2>
              <p className="text-xs text-slate-400">Export vector educational layouts and digital proofs</p>
            </div>
          </div>
          {!isExporting && (
            <button
              onClick={() => setExportModalOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Configuration Body */}
        <p className="mx-6 mt-4 text-xs text-amber-200/90 leading-relaxed">Educational templates and artwork use shared vector geometry. Legacy elements may be simplified. The font-embedded proof uses bundled English, Telugu and Hindi fonts. PDF/X and ICC conversion still require the printer’s prepress process.</p>
        <div className="p-6 space-y-4 text-xs text-slate-300">
          {/* Export Scope Selector (Part 8) */}
          <div className="p-3.5 rounded-xl border border-white/10 bg-black/30 space-y-2.5">
            <label className="font-semibold text-slate-200 block text-xs">Export Scope</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "all", label: "Complete Book", sub: `${book.pages.length} pages` },
                { id: "chapter", label: "Chapter PDF", sub: "Single chapter" },
                { id: "selected", label: "Selected Pages", sub: "Custom range" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setExportScope(s.id as typeof exportScope)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    exportScope === s.id
                      ? "bg-teal-600/20 border-teal-500 text-white font-semibold shadow-sm"
                      : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <span className="block text-xs">{s.label}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{s.sub}</span>
                </button>
              ))}
            </div>

            {exportScope === "chapter" && book.chapters.length > 0 && (
              <div className="pt-2">
                <label className="text-[11px] text-slate-400 block mb-1">Select Chapter</label>
                <select
                  value={selectedChapterId || book.chapters[0]?.id}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                >
                  {book.chapters.map((ch, idx) => (
                    <option key={ch.id} value={ch.id}>
                      Chapter {ch.number || idx + 1}: {ch.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {exportScope === "selected" && (
              <div className="pt-2">
                <label className="text-[11px] text-slate-400 block mb-1">
                  Enter Page Range (e.g. 1-5, 8, 12-15)
                </label>
                <input
                  type="text"
                  aria-invalid={!!selection.error}
                    value={pageRangeString}
                  onChange={(e) => setPageRangeString(e.target.value)}
                  placeholder="1-5"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none font-mono focus:border-teal-500"
                />
              </div>
            )}

            <div className="text-[10px] text-teal-400/90 font-mono">
              Ready to export: {effectivePages.length} {effectivePages.length === 1 ? "page" : "pages"}
            </div>
          </div>

          {/* Preset Selector */}
          <div>
            <label className="font-semibold text-slate-200 block mb-2">Export Preset</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: "Commercial Print",
                  name: "Print Layout Proof",
                  desc: "Configured bleed and crop marks. RGB proof; not PDF/X or colour-managed CMYK.",
                },
                {
                  id: "High Quality Digital",
                  name: "Digital PDF",
                  desc: "RGB pages with selectable text and vector diagrams.",
                },
                {
                  id: "Office Print",
                  name: "Office / Desktop Print",
                  desc: "Page margins, no crop marks, crisp vectors",
                },
                {
                  id: "Review Copy",
                  name: "Academic Review Draft",
                  desc: "Student-facing pages for editorial review.",
                },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id as ExportPreset)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    preset === p.id
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-sm"
                      : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <span className="font-semibold block text-xs">{p.name}</span>
                  <span className="text-[10px] text-slate-400 mt-1 block leading-tight">
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="pt-2 border-t border-white/10 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBleed}
                onChange={(e) => setIncludeBleed(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-black/40 border-white/20"
              />
              <div>
                <span className="font-medium text-slate-200 block">Include Configured Bleed Boundary</span>
                <span className="text-[10px] text-slate-400">
                  Extends artwork beyond trim marks for press cutting safety
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCropMarks}
                onChange={(e) => setIncludeCropMarks(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-black/40 border-white/20"
              />
              <div>
                <span className="font-medium text-slate-200 block">Include Printer Crop Marks</span>
                <span className="text-[10px] text-slate-400">
                  Standard corner alignment lines for guillotine paper trimmer
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={grayscaleProof}
                onChange={(e) => setGrayscaleProof(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-black/40 border-white/20"
              />
              <div>
                <span className="font-medium text-slate-200 block">Grayscale proof</span>
                <span className="text-[10px] text-slate-400">
                  Converts colours to luminance. Labels and rules stay in the file. This is not a colour-managed CMYK export.
                </span>
              </div>
            </label>
          </div>

          {/* Progress Bar during generation */}
          {isExporting && (
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                  Preparing bundled fonts and print geometry...
                </span>
                <span className="font-mono text-teal-400 font-bold">{exportProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-200"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <button className="curriculum-secondary mx-6 mb-3" disabled={isExporting || !!selection.error} title={selection.error || `Export ${effectivePages.length} pages`} onClick={handleExportPdf}>Legacy Latin-font vector proof</button>
        {selection.error && <p role="alert" className="px-6 py-3 text-sm text-rose-300">{selection.error}</p>}
        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/20">
          <span className="text-[11px] text-slate-400 font-mono">
            {book.pages.length} Pages • {book.dimensions.name}
          </span>
          <div className="flex items-center gap-2">
            {!isExporting && (
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
            )}
            <button
              title={selection.error || `Export ${effectivePages.length} pages with bundled fonts`} onClick={handleEmbeddedPdf}
              disabled={isExporting || !!selection.error}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-semibold shadow-lg shadow-teal-900/30 transition-all"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Export {presetLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
