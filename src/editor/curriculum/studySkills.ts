import type { SmartBlockInstance, StudySkillTopic } from "../../domain/educational/blockSchema";

export interface StudySkillPreset {
  id: string;
  name: string;
  header: string;
  topics: string[];
}

export interface SubjectStudySkillConfig {
  subject: string;
  header: string;
  topics: string[];
  presets: StudySkillPreset[];
}

export const SUBJECT_STUDY_SKILL_DEFAULTS: Record<string, SubjectStudySkillConfig> = {
  Maths: {
    subject: "Maths",
    header: "Face value of:",
    topics: ["7 is 7.", "9 is 9.", "2 is 2.", "7 is 7."],
    presets: [
      {
        id: "face-value",
        name: "Face Value (Default)",
        header: "Face value of:",
        topics: ["7 is 7.", "9 is 9.", "2 is 2.", "7 is 7."],
      },
      {
        id: "place-value",
        name: "Place Value Rules",
        header: "Place value in 4,528:",
        topics: [
          "4 is in Thousands place = 4,000",
          "5 is in Hundreds place = 500",
          "2 is in Tens place = 20",
          "8 is in Ones place = 8",
        ],
      },
      {
        id: "divisibility",
        name: "Divisibility Rules",
        header: "Quick Divisibility Check:",
        topics: [
          "Ends in 0, 2, 4, 6, 8 → Divisible by 2",
          "Sum of digits divisible by 3 → Divisible by 3",
          "Ends in 0 or 5 → Divisible by 5",
          "Ends in 0 → Divisible by 10",
        ],
      },
      {
        id: "bodmas",
        name: "Order of Operations",
        header: "BODMAS Priority Order:",
        topics: [
          "B: Brackets first ( )",
          "O: Orders / powers x²",
          "D / M: Division & Multiplication",
          "A / S: Addition & Subtraction",
        ],
      },
      {
        id: "properties",
        name: "Addition Properties",
        header: "Addition Properties:",
        topics: [
          "a + b = b + a (Commutative)",
          "a + 0 = a (Additive Identity)",
          "(a + b) + c = a + (b + c) (Associative)",
          "Order does not change the sum",
        ],
      },
    ],
  },
  Science: {
    subject: "Science",
    header: "Key Characteristics of Living Things:",
    topics: [
      "Living things grow and change.",
      "Living things need food, water and air.",
      "Living things respond to surroundings.",
      "Living things reproduce their kind.",
    ],
    presets: [
      {
        id: "living-things",
        name: "Living Things",
        header: "Living Things:",
        topics: [
          "Grow and develop with time.",
          "Require air, water and nutrition.",
          "Respond to stimuli in environment.",
          "Can reproduce their own kind.",
        ],
      },
      {
        id: "matter-states",
        name: "States of Matter",
        header: "Three States of Matter:",
        topics: [
          "Solids have fixed shape & volume.",
          "Liquids take shape of container.",
          "Gases spread to fill all volume.",
          "Heating causes state changes.",
        ],
      },
      {
        id: "photosynthesis",
        name: "Photosynthesis Rule",
        header: "Photosynthesis Recipe:",
        topics: [
          "Carbon dioxide from atmospheric air",
          "+ Water absorbed by root hairs",
          "+ Sunlight trapped by green chlorophyll",
          "→ Glucose food + Oxygen released",
        ],
      },
      {
        id: "plant-parts",
        name: "Plant Parts & Roles",
        header: "Plant Anatomy Roles:",
        topics: [
          "Roots: Anchor plant & take in water.",
          "Stem: Transports sap & supports leaves.",
          "Leaves: Make food by sunlight.",
          "Flowers: Form seeds & fruits.",
        ],
      },
    ],
  },
  English: {
    subject: "English",
    header: "Essential Parts of Speech:",
    topics: [
      "Noun: Naming word for people, places or things.",
      "Verb: Action word showing what happens.",
      "Adjective: Describing word modifying a noun.",
      "Adverb: Modifies a verb, adjective or adverb.",
    ],
    presets: [
      {
        id: "parts-of-speech",
        name: "Parts of Speech",
        header: "Essential Parts of Speech:",
        topics: [
          "Noun: Naming word for person, place or thing.",
          "Verb: Action word showing what happens.",
          "Adjective: Describing word modifying a noun.",
          "Adverb: Modifies a verb or adjective.",
        ],
      },
      {
        id: "sentence-rules",
        name: "Sentence Rules",
        header: "Golden Sentence Rules:",
        topics: [
          "Always start with a capital letter.",
          "Express one complete clear thought.",
          "Must have a subject and a verb.",
          "End with full stop, question mark or exclamation.",
        ],
      },
      {
        id: "punctuation",
        name: "Punctuation Guide",
        header: "Punctuation Marks Guide:",
        topics: [
          "Full stop (.) ends declarative sentences.",
          "Question mark (?) follows direct questions.",
          "Exclamation mark (!) denotes strong feeling.",
          "Comma (,) separates clauses and items.",
        ],
      },
      {
        id: "silent-letters",
        name: "Silent Letter Rules",
        header: "Silent Letter Guide:",
        topics: [
          "Silent 'k' before 'n' (knee, knock, know)",
          "Silent 'w' before 'r' (write, wrap, wrong)",
          "Silent 'b' after 'm' (climb, thumb, lamb)",
          "Silent 'l' before 'k' (walk, talk, chalk)",
        ],
      },
    ],
  },
  "Social Studies": {
    subject: "Social Studies",
    header: "Essential Map Elements:",
    topics: [
      "Title: Tells the theme and area of the map.",
      "Compass Rose: Shows North, South, East, West.",
      "Scale: Ratio of map distance to real distance.",
      "Legend / Key: Explains all symbols and colors.",
    ],
    presets: [
      {
        id: "map-elements",
        name: "Map Elements",
        header: "Essential Map Elements:",
        topics: [
          "Title: Tells the theme and area of the map.",
          "Compass Rose: Shows North, South, East, West.",
          "Scale: Ratio of map distance to real distance.",
          "Legend / Key: Explains all symbols and colors.",
        ],
      },
      {
        id: "cardinal-directions",
        name: "Cardinal Directions",
        header: "Four Cardinal Directions:",
        topics: [
          "North points toward the geographic North Pole.",
          "South points directly opposite to North.",
          "East is the direction where the Sun rises.",
          "West is the direction where the Sun sets.",
        ],
      },
      {
        id: "timeline-skills",
        name: "Timeline Reading",
        header: "Timeline Navigation:",
        topics: [
          "BCE years count backward toward 0.",
          "CE years count forward from 1.",
          "Centuries are named 1 higher than the hundreds.",
          "Primary sources are first-hand records.",
        ],
      },
    ],
  },
  History: {
    subject: "History",
    header: "Historical Inquiry Skills:",
    topics: [
      "Primary sources: Artefacts, coins, inscriptions.",
      "Secondary sources: Biographies, textbooks, articles.",
      "Chronology: Ordering events in time sequence.",
      "Cause & Effect: Why historical changes occurred.",
    ],
    presets: [
      {
        id: "sources",
        name: "Historical Sources",
        header: "Historical Inquiry Skills:",
        topics: [
          "Primary sources: Artefacts, coins, inscriptions.",
          "Secondary sources: Biographies, textbooks, articles.",
          "Chronology: Ordering events in time sequence.",
          "Cause & Effect: Why historical changes occurred.",
        ],
      },
    ],
  },
  Geography: {
    subject: "Geography",
    header: "Geographic Analysis Skills:",
    topics: [
      "Latitudes are parallel lines east to west.",
      "Longitudes run north to south between poles.",
      "Equator divides Earth into Northern & Southern hemispheres.",
      "Prime Meridian marks 0 degrees longitude.",
    ],
    presets: [
      {
        id: "grid-system",
        name: "Latitude & Longitude",
        header: "Geographic Grid System:",
        topics: [
          "Latitudes are parallel lines east to west.",
          "Longitudes run north to south between poles.",
          "Equator divides Earth into Northern & Southern hemispheres.",
          "Prime Meridian marks 0 degrees longitude.",
        ],
      },
    ],
  },
  EVS: {
    subject: "EVS",
    header: "Daily Eco Conservation Habits:",
    topics: [
      "Turn off running taps while brushing teeth.",
      "Switch off lights and fans when leaving rooms.",
      "Carry reusable cloth bags for shopping.",
      "Segregate wet biodegradable and dry recyclable waste.",
    ],
    presets: [
      {
        id: "eco-habits",
        name: "Daily Eco Habits",
        header: "Daily Eco Conservation Habits:",
        topics: [
          "Turn off running taps while brushing teeth.",
          "Switch off lights and fans when leaving rooms.",
          "Carry reusable cloth bags for shopping.",
          "Segregate wet biodegradable and dry recyclable waste.",
        ],
      },
      {
        id: "three-rs",
        name: "The 3 R's Formula",
        header: "The 3 R's Formula:",
        topics: [
          "Reduce: Minimize consumption & waste generation.",
          "Reuse: Use items multiple times before disposal.",
          "Recycle: Transform discarded materials into new goods.",
          "Refuse: Say no to single-use plastics.",
        ],
      },
    ],
  },
  Computer: {
    subject: "Computer",
    header: "Algorithm Design Rules:",
    topics: [
      "Clear starting state and ending termination.",
      "Unambiguous precise instruction steps.",
      "Executes in fixed sequential order.",
      "Produces verified correct output.",
    ],
    presets: [
      {
        id: "algorithms",
        name: "Algorithm Rules",
        header: "Algorithm Design Rules:",
        topics: [
          "Clear starting state and ending termination.",
          "Unambiguous precise instruction steps.",
          "Executes in fixed sequential order.",
          "Produces verified correct output.",
        ],
      },
      {
        id: "ipo-cycle",
        name: "IPO Cycle",
        header: "Input-Process-Output Cycle:",
        topics: [
          "Input: Keyboard, mouse, microphone data.",
          "Process: CPU executes calculations & logic.",
          "Output: Monitor, speaker, printer results.",
          "Storage: Hard drive, SSD, cloud preservation.",
        ],
      },
    ],
  },
  General: {
    subject: "General",
    header: "4 Golden Study Habits:",
    topics: [
      "Read with active focus and curiosity.",
      "Highlight key definitions and formulas.",
      "Practice solving problems independently.",
      "Summarize the lesson in your own words.",
    ],
    presets: [
      {
        id: "study-habits",
        name: "Golden Study Habits",
        header: "4 Golden Study Habits:",
        topics: [
          "Read with active focus and curiosity.",
          "Highlight key definitions and formulas.",
          "Practice solving problems independently.",
          "Summarize the lesson in your own words.",
        ],
      },
    ],
  },
  Telugu: {
    subject: "Telugu",
    header: "అధ్యయన సూత్రాలు / ముఖ్యాంశాలు:",
    topics: [
      "స్పష్టమైన ఉచ్చారణతో ఏకాగ్రతగా చదవండి.",
      "ముఖ్యమైన భావాలను గుర్తించి గమనించండి.",
      "సొంత మాటలలో వాక్యాలు నిర్మించండి.",
      "ప్రశ్నలకు సూటిగా సమాధానాలు రాయండి.",
    ],
    presets: [
      {
        id: "telugu-study",
        name: "అధ్యయన నైపుణ్యాలు",
        header: "అధ్యయన సూత్రాలు / ముఖ్యాంశాలు:",
        topics: [
          "స్పష్టమైన ఉచ్చారణతో ఏకాగ్రతగా చదవండి.",
          "ముఖ్యమైన భావాలను గుర్తించి గమనించండి.",
          "సొంత మాటలలో వాక్యాలు నిర్మించండి.",
          "ప్రశ్నలకు సూటిగా సమాధానాలు రాయండి.",
        ],
      },
    ],
  },
  Hindi: {
    subject: "Hindi",
    header: "अध्ययन कौशल / मुख्य बिंदु:",
    topics: [
      "शुद्ध उच्चारण के साथ एकाग्र होकर पढ़ें।",
      "कठिन शब्दों के अर्थ समझकर लिखें।",
      "मुख्य भाव को अपने शब्दों में व्यक्त करें।",
      "नियमित अभ्यास से अपनी वर्तनी सुधारें।",
    ],
    presets: [
      {
        id: "hindi-study",
        name: "अध्ययन कौशल",
        header: "अध्ययन कौशल / मुख्य बिंदु:",
        topics: [
          "शुद्ध उच्चारण के साथ एकाग्र होकर पढ़ें।",
          "कठिन शब्दों के अर्थ समझकर लिखें।",
          "मुख्य भाव को अपने शब्दों में व्यक्त करें।",
          "नियमित अभ्यास से अपनी वर्तनी सुधारें।",
        ],
      },
    ],
  },
};

export function getSubjectStudySkillDefault(subject = "Maths"): SubjectStudySkillConfig {
  const norm = Object.keys(SUBJECT_STUDY_SKILL_DEFAULTS).find(
    k => k.toLowerCase() === subject.toLowerCase() || subject.toLowerCase().includes(k.toLowerCase())
  );
  return SUBJECT_STUDY_SKILL_DEFAULTS[norm || "Maths"] || SUBJECT_STUDY_SKILL_DEFAULTS.Maths;
}

export function createStudySkillTopic(
  text = "",
  isEmpty = false,
  prefix?: string,
  note?: string
): StudySkillTopic {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    isEmpty,
    prefix,
    note,
  };
}

export function studySkillTopics(block: SmartBlockInstance): StudySkillTopic[] {
  const content = block.semanticContent;
  if (content.studySkillTopics && content.studySkillTopics.length > 0) {
    return content.studySkillTopics;
  }
  const subject = block.curriculum?.subjectLabel || block.subject || "Maths";
  if (content.items && content.items.length > 0) {
    return content.items.map((item, idx) => {
      const trimmed = item.trim();
      return createStudySkillTopic(trimmed, trimmed.length === 0);
    });
  }
  const defaults = getSubjectStudySkillDefault(subject);
  return defaults.topics.map(t => createStudySkillTopic(t, false));
}

export function moveStudySkillTopic(
  topics: StudySkillTopic[],
  id: string,
  direction: -1 | 1
): StudySkillTopic[] {
  const from = topics.findIndex(t => t.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= topics.length) return topics;
  const result = [...topics];
  [result[from], result[to]] = [result[to], result[from]];
  return result;
}

export function addEmptySpaces(
  topics: StudySkillTopic[],
  count: number = 2
): StudySkillTopic[] {
  const next = [...topics];
  for (let i = 0; i < count; i++) {
    next.push(createStudySkillTopic("", true));
  }
  return next;
}
