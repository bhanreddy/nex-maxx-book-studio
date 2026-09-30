import {
  DesignBinding,
  DesignRole,
  ElementCategory,
  ElementContent,
  ElementPreset,
  ElementType,
} from "../../domain/element/types";
import { SPEC_GROUPS, DesignSpec } from "./catalog";
import { FAMILY_LIST } from "./families";
import { frameFromLayout, parseLayout } from "./layoutParse";
import { tokensFromPalette } from "./tokens";

const USE: Record<DesignRole, string> = {
  chapter: "Chapter opening",
  heading: "Section heading",
  running: "Running header",
  body: "Body text",
  quote: "Quotation",
  learning: "Learning block",
  practice: "Practice and assessment",
  table: "Table",
  figure: "Figure",
  furniture: "Page furniture",
};

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function categoryFor(role: DesignRole, spec: DesignSpec): ElementCategory {
  if (role === "learning") return "educational";
  if (role === "practice") {
    if (spec.callout === "activity") return "workbook";
    if (spec.layout.includes("options") || spec.layout.includes("lines") || spec.layout.includes("question")) return "assessment";
    return "educational";
  }
  if (role === "table") return "data";
  if (role === "figure") return "media";
  if (role === "furniture") return "decorative";
  return "text";
}

function typeFor(role: DesignRole, spec: DesignSpec): ElementType {
  if (role === "chapter") return "chapter-title";
  if (role === "heading") return "subheading";
  if (role === "running") return spec.name.includes("Footer") ? "footer" : "header";
  if (role === "body") return spec.layout.includes("caption") && !spec.layout.includes("body") ? "caption" : "body";
  if (role === "quote") return "quote";
  if (role === "learning") {
    if (spec.name.includes("Objective")) return "learningObjectives";
    if (spec.callout === "definition") return "definition";
    if (spec.callout === "warning") return "warning";
    if (spec.callout === "summary") return "summary";
    if (spec.callout === "note") return "note";
    return "keyConcept";
  }
  if (role === "practice") {
    if (spec.layout.includes("options")) return "mcq";
    if (spec.layout.includes("lines")) return "answer-area";
    if (spec.callout === "activity") return "activity";
    if (spec.layout.includes("question")) return "question";
    return "worked-example";
  }
  if (role === "table") return "table";
  if (role === "figure") return "picture-frame";
  if (spec.layout.includes("label") || spec.layout.includes("number")) return "badge";
  return "divider";
}

function iconFor(role: DesignRole): string {
  const icons: Record<DesignRole, string> = {
    chapter: "Heading1",
    heading: "Heading2",
    running: "Bookmark",
    body: "AlignLeft",
    quote: "Quote",
    learning: "Target",
    practice: "CheckCircle2",
    table: "Table",
    figure: "Image",
    furniture: "Minus",
  };
  return icons[role];
}

function measure(role: DesignRole, layout: string): { width: number; height: number } {
  const base: Record<DesignRole, number> = {
    chapter: 132,
    heading: 48,
    running: 28,
    body: 92,
    quote: 100,
    learning: 124,
    practice: 140,
    table: 136,
    figure: 168,
    furniture: 28,
  };
  let height = base[role];
  let width = 468;
  if (role === "chapter" && !layout.includes("subtitle")) height = 96;
  if (role === "heading" && layout.includes("subtitle")) height = 64;
  if (role === "heading" && !layout.includes("subtitle") && !layout.includes("stack{")) height = 36;
  if (role === "running" && layout.startsWith("stack")) height = 42;
  if (role === "running" && layout.startsWith("row")) height = 26;
  if (role === "furniture" && layout.startsWith("rule:")) height = 14;
  if (layout === "label:chip" || layout === "number:chip") {
    width = 132;
    height = 22;
  }
  if (role === "figure" && layout.includes("circle")) {
    width = 250;
    height = 190;
  }
  if (layout.includes("lines:5")) height += 28;
  if (layout.includes("lines:4")) height += 18;
  if (layout.includes("lines:3")) height += 10;
  if (role === "body" && layout.includes("caption") && !layout.includes("body")) height = 80;
  return { width, height };
}

function sampleContent(role: DesignRole, index: number, spec: DesignSpec): ElementContent {
  const long = index % 3 === 2;
  const chapterTitle = long
    ? "The Quiet Architecture of Living Systems and the Cells That Sustain Them"
    : index % 3 === 1
      ? "The Architecture of Cells"
      : "Cells";
  const headingTitle = long
    ? "How Water, Salts, and Sugars Cross a Living Membrane"
    : "Membrane Transport";
  const paragraph =
    "Every living organism is built from cells. A plant cell holds its shape with a cellulose wall, stores water in a central vacuole, and captures light in chloroplasts.";
  const shared = {
    kicker: role === "heading" ? "Section" : "Chapter",
    label: spec.callout === "warning"
      ? "Warning"
      : spec.callout === "note"
        ? spec.name.includes("Tip") ? "Tip" : spec.name.includes("Fact") ? "Fact" : "Note"
        : spec.callout === "summary"
          ? spec.name.includes("Remember") ? "Remember" : "Summary"
          : spec.callout === "definition"
            ? "Definition"
            : spec.callout === "activity"
              ? "Activity"
              : spec.callout === "assessment"
                ? "Question"
                : spec.name.includes("Objective")
                  ? "Objectives"
                  : spec.name.includes("Concept")
                    ? "Key concept"
                    : "Label",
    number: String((index % 12) + 1).padStart(2, "0"),
    subtitle: "How structure becomes function",
    text: role === "heading" ? headingTitle : role === "quote" ? "Look deep into nature, and then you will understand everything better." : role === "chapter" ? chapterTitle : paragraph,
    body: paragraph,
    title: role === "heading" ? headingTitle : chapterTitle,
    caption: "Figure 2.4  A typical plant cell, with the wall, vacuole, and chloroplasts labelled.",
    credit: "Diagram",
    attribution: "Albert Einstein",
    chapterTitle: "Cellular Life",
    section: "Membrane Transport",
    pageNumber: String(12 + (index % 18)),
    term: "Osmosis",
    definition: "Net movement of water through a membrane toward a higher solute concentration.",
    partOfSpeech: "noun",
    exampleSentence: "Root hairs take up water by osmosis.",
    items: [
      "Name the structures that only a plant cell has.",
      "Explain how a membrane chooses what can pass.",
      "Compare diffusion with osmosis in one sentence.",
    ],
    pairs: [
      ["Cell wall", "Support"],
      ["Chloroplast", "Light"],
      ["Vacuole", "Storage"],
    ],
    steps: [
      "Identify the known values and their units.",
      "Substitute the values into the relation.",
      "State the result with the correct unit.",
    ],
    formula: "KE = 1/2 · m · v²",
    solution: "240 kJ",
    hint: "Check which organelle captures light.",
    marks: 3,
    questionText: "Explain why a plant cell keeps its shape in pure water.",
    options: ["The wall resists swelling.", "The nucleus shrinks.", "The membrane disappears.", "The vacuole leaves the cell."],
    materials: "Potato, salt solution, balance, paper towel.",
    duration: "25 min",
    difficulty: "Intermediate",
    groupType: "Pairs",
    headers: role === "table" && spec.layout.includes("stats")
      ? ["Mass", "Time", "Change"]
      : role === "practice"
        ? ["Level", "What to look for", "Marks"]
        : ["Feature", "Plant cell", "Animal cell"],
    rows: role === "table" && spec.layout.includes("stats")
      ? [["120 g", "20 min", "+8%"]]
      : role === "practice"
        ? [["Clear", "Names both cells", "1"], ["Precise", "Uses the three structures", "2"]]
        : [
            ["Cell wall", "Present", "Absent"],
            ["Chloroplast", "Present", "Absent"],
            ["Vacuole", "Large", "Small"],
          ],
  };
  if (!spec.layout.includes("subtitle") && (role === "chapter" || role === "heading")) {
    return { ...shared, subtitle: "" };
  }
  return shared;
}

let cached: Record<string, ElementPreset> | null = null;

export function buildDesignPresets(): Record<string, ElementPreset> {
  if (cached) return cached;
  const presets: Record<string, ElementPreset> = {};
  const layouts = new Set<string>();
  const ids = new Set<string>();

  for (const group of SPEC_GROUPS) {
    const names = new Set<string>();
    group.specs.forEach((spec, index) => {
      parseLayout(spec.layout);
      if (layouts.has(spec.layout)) {
        throw new Error(`Duplicate layout: ${spec.layout}`);
      }
      layouts.add(spec.layout);
      if (names.has(spec.name)) throw new Error(`Duplicate name in ${group.role}: ${spec.name}`);
      names.add(spec.name);

      const family = FAMILY_LIST[index % FAMILY_LIST.length];
      const paletteId = family.palettes[index % family.palettes.length];
      const tokens = tokensFromPalette(paletteId, family.id, spec.callout || "info");
      const frame = frameFromLayout(spec.layout, tokens, group.role, "hairline");
      const id = `ds-${group.role}-${slug(spec.name)}`;
      if (ids.has(id)) throw new Error(`Duplicate preset id ${id}`);
      ids.add(id);

      const editableFields = ["text", "subtitle", "number", "caption", "body", "title", "term", "definition", "questionText"];
      const binding: DesignBinding = {
        composition: spec.layout,
        familyId: family.id,
        paletteId,
        role: group.role,
        calloutKey: spec.callout,
        tokens,
        showNumber: true,
        decoration: family.decoration,
        spacing: group.role === "chapter" ? "generous" : "normal",
        border: "hairline",
        editableFields,
      };
      const { width, height } = measure(group.role, spec.layout);

      presets[id] = {
        id,
        type: typeFor(group.role, spec),
        name: spec.name,
        category: categoryFor(group.role, spec),
        variant: group.role,
        description: spec.description,
        icon: iconFor(group.role),
        defaultTransform: { width, height, rotation: 0 },
        defaultStyle: {
          fontFamily: frame.fontFamily,
          fontSize: group.role === "chapter" ? 18 : group.role === "heading" ? 13 : group.role === "body" ? 10.5 : 9,
          fontWeight: group.role === "body" || group.role === "quote" ? 400 : 700,
          color: frame.color,
          backgroundColor: frame.background,
          borderColor: frame.borderColor,
          borderWidth: frame.borderWidth,
          borderStyle: frame.borderWidth ? "solid" : "none",
          textAlign: frame.textAlign,
          lineHeight: group.role === "body" ? 1.45 : 1.15,
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
        },
        defaultContent: {
          ...sampleContent(group.role, index, spec),
          design: binding,
        },
        design: {
          familyId: family.id,
          paletteId,
          role: group.role,
          use: USE[group.role],
          tags: [group.role, family.id, family.name, paletteId, spec.callout || "publication", USE[group.role]],
          structure: spec.layout,
          editableFields,
        },
      };
    });
  }

  cached = presets;
  return presets;
}

export function libraryStats(): { total: number; byRole: Record<string, number> } {
  const byRole: Record<string, number> = {};
  const presets = Object.values(buildDesignPresets());
  for (const preset of presets) {
    const role = preset.design?.role || "classic";
    byRole[role] = (byRole[role] || 0) + 1;
  }
  return { total: presets.length, byRole };
}
