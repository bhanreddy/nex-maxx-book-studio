import type { SmartBlockInstance } from "../../domain/educational/blockSchema";

export interface LearningOutcomeTopic {
  id: string;
  verb: string;
  text: string;
  icon: string;
  color: string;
  isEmpty?: boolean;
}

export const LEARNING_OUTCOMES_ICONS = [
  "pencil",
  "book",
  "code",
  "chart",
  "calculator",
  "temple",
  "leaf",
  "flask",
  "globe",
  "computer",
  "lightbulb",
  "star",
  "speech",
  "palette",
  "music",
] as const;

export type LearningOutcomeIcon = typeof LEARNING_OUTCOMES_ICONS[number];

export const LEARNING_OUTCOMES_PALETTE = [
  "#B93B58", // crimson / ruby
  "#417D59", // forest green
  "#345980", // deep teal navy
  "#6A4879", // plum / purple
  "#B34351", // brick red / terracotta
  "#5B7A69", // sage green
  "#D97706", // amber
  "#2563EB", // royal blue
  "#7C3AED", // violet
  "#059669", // emerald
];

export const SUBJECT_OUTCOME_DEFAULTS: Record<string, { intro: string; outcomes: Array<{ verb: string; text: string; icon: LearningOutcomeIcon }> }> = {
  Maths: {
    intro: "After studying this chapter, the students will be able to:",
    outcomes: [
      { verb: "write", text: "5-digit and 6-digit numbers", icon: "pencil" },
      { verb: "determine", text: "the place value and the face value of digits in a number", icon: "book" },
      { verb: "compare", text: "numbers up to 9,99,999", icon: "code" },
      { verb: "form", text: "the largest and the smallest numbers using 5 or 6 digits", icon: "chart" },
      { verb: "estimate", text: "the rounded-off numbers to the nearest tens, hundreds and thousands", icon: "calculator" },
      { verb: "define", text: "Roman numerals", icon: "temple" },
    ],
  },
  Science: {
    intro: "After studying this chapter, the students will be able to:",
    outcomes: [
      { verb: "identify", text: "the key structures and life processes of living organisms", icon: "leaf" },
      { verb: "observe", text: "physical and chemical changes through guided investigations", icon: "flask" },
      { verb: "classify", text: "materials based on state, conductivity and composition", icon: "chart" },
      { verb: "explain", text: "how natural forces and energy transfer across ecosystems", icon: "lightbulb" },
      { verb: "investigate", text: "causes and effects using controlled scientific methods", icon: "code" },
      { verb: "record", text: "experimental findings with accurate units and diagrams", icon: "pencil" },
    ],
  },
  English: {
    intro: "By the end of this chapter, the students will be able to:",
    outcomes: [
      { verb: "read", text: "and comprehend literary passages with fluent expression", icon: "book" },
      { verb: "identify", text: "central themes, character motives and figurative devices", icon: "lightbulb" },
      { verb: "compose", text: "structured paragraphs using rich descriptive vocabulary", icon: "pencil" },
      { verb: "apply", text: "accurate grammatical rules, tenses and punctuation", icon: "code" },
      { verb: "analyze", text: "rhyme scheme, tone and mood in literary verses", icon: "star" },
      { verb: "express", text: "critical personal opinions in discussions and writing", icon: "speech" },
    ],
  },
  "Social Studies": {
    intro: "After studying this chapter, the students will be able to:",
    outcomes: [
      { verb: "locate", text: "key geographic terrain, continents and landmarks on maps", icon: "globe" },
      { verb: "trace", text: "historical timelines and major civilizational turning points", icon: "temple" },
      { verb: "explain", text: "the constitutional rights and duties of democratic citizens", icon: "book" },
      { verb: "compare", text: "past and modern lifestyles across diverse world cultures", icon: "chart" },
      { verb: "analyze", text: "how natural resources influence trade and development", icon: "leaf" },
      { verb: "evaluate", text: "sustainable community solutions for environmental conservation", icon: "star" },
    ],
  },
  History: {
    intro: "After studying this chapter, the students will be able to:",
    outcomes: [
      { verb: "trace", text: "major historical events, dynasties and timeline milestones", icon: "temple" },
      { verb: "analyze", text: "primary archaeological sources, coins and inscriptions", icon: "book" },
      { verb: "examine", text: "socio-economic transformations and cultural movements", icon: "chart" },
      { verb: "compare", text: "administrative systems across ancient and modern eras", icon: "code" },
      { verb: "evaluate", text: "the lasting heritage and legacy of historical movements", icon: "star" },
    ],
  },
  Geography: {
    intro: "After studying this chapter, the students will be able to:",
    outcomes: [
      { verb: "identify", text: "major physical features, landforms and water bodies", icon: "globe" },
      { verb: "read", text: "and interpret topographic symbols, legends and grid scales", icon: "book" },
      { verb: "explain", text: "climatic zones, weather systems and seasonal variations", icon: "leaf" },
      { verb: "map", text: "natural resource distribution and agricultural patterns", icon: "chart" },
      { verb: "advocate", text: "sustainable practices to prevent soil and water degradation", icon: "star" },
    ],
  },
  Computer: {
    intro: "By the end of this module, the students will be able to:",
    outcomes: [
      { verb: "design", text: "computational algorithms using flowcharts and pseudocode", icon: "code" },
      { verb: "write", text: "structured code utilizing loops, conditions and variables", icon: "pencil" },
      { verb: "debug", text: "syntax and logical errors through systematic testing", icon: "calculator" },
      { verb: "create", text: "interactive multimedia projects and digital presentations", icon: "computer" },
      { verb: "practice", text: "safe digital citizenship, password security and etiquette", icon: "star" },
    ],
  },
  EVS: {
    intro: "After studying this chapter, the students will be able to:",
    outcomes: [
      { verb: "observe", text: "living and non-living elements in our immediate environment", icon: "leaf" },
      { verb: "describe", text: "the importance of clean air, water and healthy nutrition", icon: "book" },
      { verb: "classify", text: "waste materials into biodegradable and recyclable items", icon: "chart" },
      { verb: "identify", text: "community helpers and public services around us", icon: "temple" },
      { verb: "practice", text: "conservation habits to save water and energy daily", icon: "star" },
    ],
  },
  Art: {
    intro: "By the end of this unit, the students will be able to:",
    outcomes: [
      { verb: "explore", text: "primary, secondary and complementary color harmonies", icon: "palette" },
      { verb: "sketch", text: "proportional shapes, natural curves and geometric outlines", icon: "pencil" },
      { verb: "create", text: "textured compositions using mixed media and patterns", icon: "star" },
      { verb: "appreciate", text: "traditional folk motifs and world artistic styles", icon: "temple" },
    ],
  },
  Music: {
    intro: "By the end of this unit, the students will be able to:",
    outcomes: [
      { verb: "listen", text: "and recognize rhythm patterns, tempos and pitch variations", icon: "music" },
      { verb: "sing", text: "choral and folk melodies with proper posture and diction", icon: "speech" },
      { verb: "identify", text: "string, wind and percussion instruments by tone", icon: "star" },
    ],
  },
  GK: {
    intro: "After studying this chapter, the students will be able to:",
    outcomes: [
      { verb: "discover", text: "fascinating records and natural wonders of the world", icon: "globe" },
      { verb: "identify", text: "national symbols, leaders and international emblems", icon: "temple" },
      { verb: "recall", text: "vital scientific discoveries and everyday inventions", icon: "lightbulb" },
      { verb: "connect", text: "current sports milestones and world cultural festivals", icon: "star" },
    ],
  },
  Telugu: {
    intro: "ఈ పాఠం చదివిన తర్వాత విద్యార్థులు చేయగలరు:",
    outcomes: [
      { verb: "చదవండి", text: "పాఠ్యాంశాన్ని స్పష్టమైన ఉచ్చారణతో ధారాళంగా చదవడం", icon: "book" },
      { verb: "గ్రహించండి", text: "ముఖ్య భావాలను, పద్య తాత్పర్యాలను అర్థం చేసుకోవడం", icon: "lightbulb" },
      { verb: "రాయండి", text: "సరళమైన వాక్యాలలో సొంత మాటల్లో రాయడం", icon: "pencil" },
      { verb: "ప్రయోగించండి", text: "వ్యాకరణ అంశాలను, సంధులు సమాసాలను సరిగ్గా గుర్తించడం", icon: "code" },
      { verb: "వివరించండి", text: "కథలోని నైతిక విలువలను నిత్యజీవితంలో ఆచరించడం", icon: "star" },
    ],
  },
  Hindi: {
    intro: "इस अध्याय के अध्ययन के बाद विद्यार्थी सक्षम होंगे:",
    outcomes: [
      { verb: "पढ़ना", text: "शुद्ध उच्चारण और आरोह-अवरोह के साथ पाठ का वाचन करना", icon: "book" },
      { verb: "समझना", text: "पाठ के मुख्य भाव, संदेश और शब्दार्थ को ग्रहण करना", icon: "lightbulb" },
      { verb: "लिखना", text: "सटीक वर्तनी और व्याकरण के साथ अपने विचार लिखना", icon: "pencil" },
      { verb: "प्रयोग", text: "नए मुहावरों और शब्दावली का वाक्य में सही प्रयोग करना", icon: "code" },
      { verb: "व्यक्त", text: "रचनात्मक अभिव्यक्ति और नैतिक मूल्यों पर चर्चा करना", icon: "star" },
    ],
  },
};

export function getSubjectOutcomeDefault(subject = "Maths") {
  const norm = Object.keys(SUBJECT_OUTCOME_DEFAULTS).find(
    (k) => k.toLowerCase() === subject.toLowerCase() || subject.toLowerCase().includes(k.toLowerCase())
  );
  return SUBJECT_OUTCOME_DEFAULTS[norm || "Maths"] || SUBJECT_OUTCOME_DEFAULTS.Maths;
}

export function createLearningOutcomeTopic(
  verb = "",
  text = "",
  index = 0,
  subject = "Maths",
  isEmpty = false,
  icon?: string,
  color?: string
): LearningOutcomeTopic {
  const paletteColor = color || LEARNING_OUTCOMES_PALETTE[index % LEARNING_OUTCOMES_PALETTE.length];
  const defaultIcon = icon || (index % 6 === 0 ? "pencil" : index % 6 === 1 ? "book" : index % 6 === 2 ? "code" : index % 6 === 3 ? "chart" : index % 6 === 4 ? "calculator" : "temple");
  return {
    id: crypto.randomUUID(),
    verb: verb.trim(),
    text: text.trim(),
    icon: defaultIcon,
    color: paletteColor,
    isEmpty,
  };
}

export function parseLearningOutcomeText(raw: string, index: number, subject = "Maths"): LearningOutcomeTopic {
  const trimmed = raw.trim();
  if (!trimmed) {
    return createLearningOutcomeTopic("", "", index, subject, true);
  }
  // If text starts with a single action verb (e.g. "write 5-digit..."), extract it
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx > 0 && spaceIdx <= 15 && !trimmed.slice(0, spaceIdx).includes(".")) {
    const verb = trimmed.slice(0, spaceIdx);
    const text = trimmed.slice(spaceIdx + 1);
    return createLearningOutcomeTopic(verb, text, index, subject, false);
  }
  return createLearningOutcomeTopic("", trimmed, index, subject, false);
}

export function learningOutcomeTopics(block: SmartBlockInstance): LearningOutcomeTopic[] {
  const content = block.semanticContent;
  if (content.learningOutcomeTopics && content.learningOutcomeTopics.length > 0) {
    return content.learningOutcomeTopics;
  }
  const subject = block.curriculum?.subjectLabel || block.subject || "Maths";
  if (content.items && content.items.length > 0) {
    return content.items.map((item, idx) => parseLearningOutcomeText(item, idx, subject));
  }
  const defaults = getSubjectOutcomeDefault(subject);
  return defaults.outcomes.map((item, idx) =>
    createLearningOutcomeTopic(item.verb, item.text, idx, subject, false, item.icon)
  );
}

export function moveLearningOutcomeTopic(
  topics: LearningOutcomeTopic[],
  id: string,
  direction: -1 | 1
): LearningOutcomeTopic[] {
  const from = topics.findIndex((t) => t.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= topics.length) return topics;
  const result = [...topics];
  [result[from], result[to]] = [result[to], result[from]];
  return result;
}

export function addEmptySpaces(
  topics: LearningOutcomeTopic[],
  count: number = 3,
  subject = "Maths"
): LearningOutcomeTopic[] {
  const next = [...topics];
  for (let i = 0; i < count; i++) {
    next.push(createLearningOutcomeTopic("", "", next.length, subject, true));
  }
  return next;
}
