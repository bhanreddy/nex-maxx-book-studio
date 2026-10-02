/**
 * NEX MAXX Book Studio — Apply Signature Elements to Chapter Pages
 * 
 * Equips every page of a chapter with:
 * 1. FACT ZONE (3D Pill container with Lightbulb tab & 3D Stacked Books medallion)
 * 2. TOPIC BANNER (3D Wavy organic ribbon banner: "SUCCESSOR AND PREDECESSOR")
 * 3. LIFE CONNECT (3D Folded ribbon banner with Teardrop Planting-Boy illustration)
 * 
 * Provides 100% editability and versatile subject adaptation.
 */

import { useEditorStore } from "../stores/editorStore";
import { getSignaturePreset, SIGNATURE_SUBJECT_PRESETS } from "./signatureElements";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import type { PageElement } from "../../domain/element/types";
import { frameMargins, pageFrameFor } from "../pageFrame/pageFrame";

export function makeSignatureBlock(
  type: "fact-zone" | "topic-banner" | "life-connect",
  subject = "Maths",
  overrides?: Partial<SmartBlockInstance["semanticContent"]>
): SmartBlockInstance {
  const preset = getSignaturePreset(subject);
  const id = crypto.randomUUID();

  let semanticContent: SmartBlockInstance["semanticContent"] = {
    title: "FACT ZONE",
  };

  let height = 110;

  if (type === "fact-zone") {
    semanticContent = {
      title: preset.factZone.badgeTitle,
      badgeLabel: preset.factZone.badgeTitle,
      calloutText: preset.factZone.factText,
      introText: preset.factZone.factText,
      items: preset.factZone.bullets,
      iconName: preset.factZone.rightIllustration,
      ...overrides,
    };
    height = 120;
  } else if (type === "topic-banner") {
    semanticContent = {
      title: preset.topicBanner.word1,
      badgeLabel: preset.topicBanner.connector,
      subtitle: preset.topicBanner.word2,
      introText: preset.topicBanner.subtitle,
      ...overrides,
    };
    height = 125;
  } else if (type === "life-connect") {
    semanticContent = {
      badgeLabel: preset.lifeConnect.word1,
      title: preset.lifeConnect.word2,
      subtitle: preset.lifeConnect.subtitle,
      calloutText: preset.lifeConnect.prompt,
      introText: preset.lifeConnect.prompt,
      iconName: preset.lifeConnect.illustration,
      ...overrides,
    };
    height = 150;
  }

  return {
    id,
    pageId: "",
    archetypeId: type === "fact-zone" ? "facts-curiosity" : type === "topic-banner" ? "section-heading" : "real-world-connect",
    presetId: `signature-${type}-v1`,
    family: "nex-play",
    subject: "mathematics",
    gradeBand: "primary-upper",
    isDetached: false,
    isLockedContent: false,
    isLockedDesign: false,
    transform: {
      x: 36,
      y: 36,
      width: 528,
      height,
      rotation: 0,
      zIndex: 0,
    },
    curriculum: {
      frameworkStage: type === "topic-banner" ? "learn" : type === "life-connect" ? "apply" : "discover",
      type,
      subjectLabel: subject,
      grade: 4,
      learningOutcomeIds: [],
      difficulty: "build",
      hierarchy: "secondary",
      pageRules: {
        keepTogether: true,
      },
    },
    semanticContent,
    styleOverrides: {},
  };
}

export function applySignatureElementsToChapter(
  chapterId: string,
  subject = "Maths"
): void {
  const store = useEditorStore.getState();
  const book = store.getActiveBook();
  if (!book) return;

  const chapter = book.chapters.find((c) => c.id === chapterId);
  if (!chapter) return;

  const pages = book.pages.filter((p) => chapter.pageIds.includes(p.id) || p.chapterId === chapter.id);
  if (pages.length === 0) return;

  const preset = getSignaturePreset(subject || book.subject);

  // We will collect new elements and update pages
  const newElements: Record<string, PageElement> = { ...store.elements };
  const updatedPages = [...book.pages];

  pages.forEach((page, pageIdx) => {
    const pageIndexInBook = updatedPages.findIndex((p) => p.id === page.id);
    if (pageIndexInBook < 0) return;

    const margins = frameMargins(book, pageFrameFor(book, page));
    const contentWidth = book.dimensions.widthPt - margins.insidePt - margins.outsidePt;

    // Check which signature elements already exist on this page
    const existingElements = page.elementIds.map((id) => newElements[id]).filter(Boolean);
    const hasTopicBanner = existingElements.some(
      (el) => el?.smartBlockData?.curriculum?.type === "topic-banner"
    );
    const hasFactZone = existingElements.some(
      (el) => el?.smartBlockData?.curriculum?.type === "fact-zone"
    );
    const hasLifeConnect = existingElements.some(
      (el) => el?.smartBlockData?.curriculum?.type === "life-connect"
    );

    const newElementIdsOnPage = [...page.elementIds];

    // Page 0: Chapter Opener (Cover). If not having a Fact Zone, we can add one at the bottom.
    if (pageIdx === 0) {
      if (!hasFactZone) {
        const factBlock = makeSignatureBlock("fact-zone", subject, {
          title: preset.factZone.badgeTitle,
          calloutText: preset.factZone.factText,
        });
        factBlock.pageId = page.id;
        factBlock.transform.x = margins.insidePt;
        factBlock.transform.width = contentWidth;
        factBlock.transform.y = Math.min(
          book.dimensions.heightPt - margins.bottomPt - factBlock.transform.height,
          580
        );

        const pageElement: PageElement = {
          id: factBlock.id,
          pageId: page.id,
          type: "smart-block",
          category: "educational",
          version: 4,
          displayName: "Fact Zone",
          transform: factBlock.transform,
          content: {},
          style: {},
          smartBlockData: factBlock,
          presetId: factBlock.presetId,
          locked: false,
          hidden: false,
        };

        newElements[factBlock.id] = pageElement;
        newElementIdsOnPage.push(factBlock.id);
      }
    }

    // Page 1: Concept Exploration. Add TOPIC BANNER + FACT ZONE
    else if (pageIdx === 1) {
      if (!hasTopicBanner) {
        const bannerBlock = makeSignatureBlock("topic-banner", subject, {
          title: preset.topicBanner.word1,
          badgeLabel: preset.topicBanner.connector,
          subtitle: preset.topicBanner.word2,
          introText: preset.topicBanner.subtitle,
        });
        bannerBlock.pageId = page.id;
        bannerBlock.transform.x = margins.insidePt;
        bannerBlock.transform.y = margins.topPt;
        bannerBlock.transform.width = contentWidth;

        const bannerElement: PageElement = {
          id: bannerBlock.id,
          pageId: page.id,
          type: "smart-block",
          category: "educational",
          version: 4,
          displayName: "Topic Banner",
          transform: bannerBlock.transform,
          content: {},
          style: {},
          smartBlockData: bannerBlock,
          presetId: bannerBlock.presetId,
          locked: false,
          hidden: false,
        };

        newElements[bannerBlock.id] = bannerElement;
        newElementIdsOnPage.unshift(bannerBlock.id);
      }

      if (!hasFactZone) {
        const factBlock = makeSignatureBlock("fact-zone", subject, {
          title: preset.factZone.badgeTitle,
          calloutText: preset.factZone.factText,
        });
        factBlock.pageId = page.id;
        factBlock.transform.x = margins.insidePt;
        factBlock.transform.width = contentWidth;
        factBlock.transform.y = margins.topPt + 140;

        const factElement: PageElement = {
          id: factBlock.id,
          pageId: page.id,
          type: "smart-block",
          category: "educational",
          version: 4,
          displayName: "Fact Zone",
          transform: factBlock.transform,
          content: {},
          style: {},
          smartBlockData: factBlock,
          presetId: factBlock.presetId,
          locked: false,
          hidden: false,
        };

        newElements[factBlock.id] = factElement;
        newElementIdsOnPage.push(factBlock.id);
      }
    }

    // Page 2: Guided Practice / Fluency. Add Practice Topic Banner + Fact Zone
    else if (pageIdx === 2) {
      if (!hasTopicBanner) {
        const bannerBlock = makeSignatureBlock("topic-banner", subject, {
          title: "GUIDED",
          badgeLabel: "AND",
          subtitle: "PRACTICE",
          introText: "Apply the concept through scaffolded exercises.",
        });
        bannerBlock.pageId = page.id;
        bannerBlock.transform.x = margins.insidePt;
        bannerBlock.transform.y = margins.topPt;
        bannerBlock.transform.width = contentWidth;

        const bannerElement: PageElement = {
          id: bannerBlock.id,
          pageId: page.id,
          type: "smart-block",
          category: "educational",
          version: 4,
          displayName: "Practice Banner",
          transform: bannerBlock.transform,
          content: {},
          style: {},
          smartBlockData: bannerBlock,
          presetId: bannerBlock.presetId,
          locked: false,
          hidden: false,
        };

        newElements[bannerBlock.id] = bannerElement;
        newElementIdsOnPage.unshift(bannerBlock.id);
      }

      if (!hasFactZone) {
        const factBlock = makeSignatureBlock("fact-zone", subject, {
          title: "PRO TIP",
          calloutText: "Always check the position of digits before comparing large numbers.",
        });
        factBlock.pageId = page.id;
        factBlock.transform.x = margins.insidePt;
        factBlock.transform.width = contentWidth;
        factBlock.transform.y = Math.min(
          book.dimensions.heightPt - margins.bottomPt - factBlock.transform.height,
          620
        );

        const factElement: PageElement = {
          id: factBlock.id,
          pageId: page.id,
          type: "smart-block",
          category: "educational",
          version: 4,
          displayName: "Pro Tip Callout",
          transform: factBlock.transform,
          content: {},
          style: {},
          smartBlockData: factBlock,
          presetId: factBlock.presetId,
          locked: false,
          hidden: false,
        };

        newElements[factBlock.id] = factElement;
        newElementIdsOnPage.push(factBlock.id);
      }
    }

    // Page 3: Explore & Real-World Connection. Add LIFE CONNECT banner
    else if (pageIdx === 3) {
      if (!hasLifeConnect) {
        const lifeBlock = makeSignatureBlock("life-connect", subject, {
          badgeLabel: preset.lifeConnect.word1,
          title: preset.lifeConnect.word2,
          subtitle: preset.lifeConnect.subtitle,
          calloutText: preset.lifeConnect.prompt,
        });
        lifeBlock.pageId = page.id;
        lifeBlock.transform.x = margins.insidePt;
        lifeBlock.transform.y = margins.topPt;
        lifeBlock.transform.width = contentWidth;

        const lifeElement: PageElement = {
          id: lifeBlock.id,
          pageId: page.id,
          type: "smart-block",
          category: "educational",
          version: 4,
          displayName: "Life Connect",
          transform: lifeBlock.transform,
          content: {},
          style: {},
          smartBlockData: lifeBlock,
          presetId: lifeBlock.presetId,
          locked: false,
          hidden: false,
        };

        newElements[lifeBlock.id] = lifeElement;
        newElementIdsOnPage.unshift(lifeBlock.id);
      }
    }

    // Page 4+: Review & Mastery or general extra pages. Add Topic Banner or Fact Zone
    else {
      if (!hasTopicBanner) {
        const bannerBlock = makeSignatureBlock("topic-banner", subject, {
          title: "CHECK",
          badgeLabel: "AND",
          subtitle: "MASTER",
          introText: "Review key competencies and solve challenge questions.",
        });
        bannerBlock.pageId = page.id;
        bannerBlock.transform.x = margins.insidePt;
        bannerBlock.transform.y = margins.topPt;
        bannerBlock.transform.width = contentWidth;

        const bannerElement: PageElement = {
          id: bannerBlock.id,
          pageId: page.id,
          type: "smart-block",
          category: "educational",
          version: 4,
          displayName: "Mastery Banner",
          transform: bannerBlock.transform,
          content: {},
          style: {},
          smartBlockData: bannerBlock,
          presetId: bannerBlock.presetId,
          locked: false,
          hidden: false,
        };

        newElements[bannerBlock.id] = bannerElement;
        newElementIdsOnPage.unshift(bannerBlock.id);
      }

      if (!hasFactZone) {
        const factBlock = makeSignatureBlock("fact-zone", subject, {
          title: "RECAP ZONE",
          calloutText: "Review your findings and discuss your answers with a partner.",
        });
        factBlock.pageId = page.id;
        factBlock.transform.x = margins.insidePt;
        factBlock.transform.width = contentWidth;
        factBlock.transform.y = Math.min(
          book.dimensions.heightPt - margins.bottomPt - factBlock.transform.height,
          620
        );

        const factElement: PageElement = {
          id: factBlock.id,
          pageId: page.id,
          type: "smart-block",
          category: "educational",
          version: 4,
          displayName: "Recap Zone",
          transform: factBlock.transform,
          content: {},
          style: {},
          smartBlockData: factBlock,
          presetId: factBlock.presetId,
          locked: false,
          hidden: false,
        };

        newElements[factBlock.id] = factElement;
        newElementIdsOnPage.push(factBlock.id);
      }
    }

    updatedPages[pageIndexInBook] = {
      ...page,
      elementIds: newElementIdsOnPage,
    };
  });

  // Apply to store
  useEditorStore.setState((state) => {
    const activeBookIndex = state.books.findIndex((b) => b.id === book.id);
    if (activeBookIndex < 0) return state;

    const nextBooks = [...state.books];
    nextBooks[activeBookIndex] = {
      ...book,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    };

    return {
      ...state,
      books: nextBooks,
      elements: newElements,
    };
  });
}
