import type { Book } from "../../domain/book/types";
import type { PageElement } from "../../domain/element/types";
import type { PreflightIssue } from "../../domain/publishing/types";
import { buildPublicationScene, resolvePublicationPalette } from "./publicationScene";
import { contrastRatio } from "../design/contrast";
import { printFont } from "../publishing/fontRegistry";
import { pageMarginsFor } from "../pageFrame/pageFrame";
export function publicationPreflight(book:Book,elements:Record<string,PageElement>):PreflightIssue[] {
  const issues:PreflightIssue[]=[];
  for(const [pageIndex,page] of book.pages.entries())for(const id of page.elementIds) {
    const el=elements[id];if(!el||el.hidden)continue;
    const add=(title:string,message:string,category:PreflightIssue["category"],severity:PreflightIssue["severity"]="warning")=>issues.push({id:`publication-${id}-${issues.length}`,title,message,category,severity,pageIndex,pageId:page.id,elementId:id,elementName:el.displayName});
    if(el.smartBlockData) {
      const block={...el.smartBlockData,transform:el.transform},scene=buildPublicationScene(block),p=resolvePublicationPalette(block);
      if(scene.height>el.transform.height+1)add("Block needs more height",`${el.displayName} needs ${Math.ceil(scene.height)} pt. Resize before export; content has been preserved.`,"text","error");
      if(el.transform.y+scene.height>book.dimensions.heightPt-pageMarginsFor(book,page).bottomPt)add("Content reaches the bottom margin","Move the block to another page or edit its content. Do not shrink the reading size.","geometry","error");
      for (const node of scene.nodes) if (node.kind === 'text') {
        try { printFont(node.text, node.fontFamily, node.font === 'serif'); }
        catch (error) { add('Font unavailable for print', String(error), 'font', 'error'); break; }
      }
      if(contrastRatio(p.text,block.styleOverrides.backgroundSpec?.color||p.surface)<4.5)add("Low reading contrast","Choose a palette with stronger contrast between reading text and background.","text");
      if(scene.nodes.some(n=>n.kind==="text"&&/[^\u0000-\u00FF\u2010-\u2027\u2030\u2039\u203A\u20AC\u2122\u2212]/u.test(n.text)))add("PDF font coverage requires review","The built-in PDF fonts may not contain all these glyphs. Review the PDF before distribution.","font","info");
      for(const warning of scene.warnings)add("Layout review",warning,"text");
      const image=block.styleOverrides.backgroundImage;
      if(image?.rawWidthPx && image.rawWidthPx/(el.transform.width/72)<300)add("Background resolution below target","Use a higher-resolution image or reduce its placed size. Target 300 effective PPI for print.","resolution");
      for(const motif of block.styleOverrides.motifs||[]) {
        if(motif.role==="photo" && motif.rawWidthPx && motif.w>0 && motif.rawWidthPx/(motif.w/72)<300) add("Plate resolution below target","Use a higher-resolution plate image or reduce its placed size. Target 300 effective PPI for print.","resolution");
      }
    }
    if(el.type==="image") {
      if(!el.content.src)add("Missing image","Choose an image before export.","asset","error");
      else if(!el.content.assetRef && !String(el.content.src).startsWith("/") && !String(el.content.src).startsWith("data:"))add("External image dependency","Upload a local image to avoid cross-origin export failures or changing remote assets.","asset");
    }
  }
  return issues;
}
