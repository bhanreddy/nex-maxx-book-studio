/**
 * NEX MAXX Book Studio — Signature Educational Elements
 * 
 * SSoT specifications, subject presets, and vector motifs for:
 * 1. FACT ZONE (3D Pill container with Lightbulb tab and Stacked Books badge)
 * 2. TOPIC BANNER (3D Wavy organic ribbon banner: e.g. "SUCCESSOR AND PREDECESSOR")
 * 3. LIFE CONNECT (3D Folded ribbon banner with Teardrop Planting-Boy illustration badge)
 */

export interface FactZoneConfig {
  badgeTitle: string; // e.g. "FACT ZONE", "DID YOU KNOW?", "QUICK FACT"
  factText: string;
  bullets?: string[];
  leftIcon: "bulb" | "star" | "sparkles" | "check" | "pencil" | "flask" | "calculator";
  rightIllustration: "books" | "flask" | "plant" | "globe" | "abacus" | "laptop" | "atom" | "puzzle";
  paletteTheme?: "navy-teal" | "coral-amber" | "forest-emerald" | "plum-rose" | "ocean-cyan";
}

export interface TopicBannerConfig {
  word1: string; // e.g. "SUCCESSOR"
  connector: string; // e.g. "AND", "&", "VS", "TO", "IN"
  word2: string; // e.g. "PREDECESSOR"
  subtitle?: string; // Optional explanatory subtitle
  paletteTheme?: "clay-sunset" | "clay-nature" | "clay-ocean" | "clay-berry" | "clay-cyber";
  showConfetti?: boolean;
  showDroplets?: boolean;
}

export interface LifeConnectConfig {
  word1: string; // e.g. "LIFE"
  word2: string; // e.g. "CONNECT"
  subtitle?: string; // e.g. "Real-world connection & practical application"
  prompt?: string;
  illustration: "planting-boy" | "measuring-girl" | "market-shopping" | "nature-explorer" | "science-lab" | "digital-coder";
  paletteTheme?: "navy-coral" | "teal-amber" | "purple-pink" | "forest-gold";
}

export interface SubjectSignaturePreset {
  factZone: {
    badgeTitle: string;
    factText: string;
    bullets: string[];
    rightIllustration: FactZoneConfig["rightIllustration"];
  };
  topicBanner: {
    word1: string;
    connector: string;
    word2: string;
    subtitle: string;
  };
  lifeConnect: {
    word1: string;
    word2: string;
    subtitle: string;
    prompt: string;
    illustration: LifeConnectConfig["illustration"];
  };
}

export const SIGNATURE_SUBJECT_PRESETS: Record<string, SubjectSignaturePreset> = {
  Maths: {
    factZone: {
      badgeTitle: "FACT ZONE",
      factText: "0 is neither positive nor negative. It is the only number that cannot be represented in Roman numerals!",
      bullets: [
        "Every natural number has a successor (n + 1).",
        "The number 1 has no predecessor in the set of natural numbers.",
        "Zero added to any number does not change its value.",
      ],
      rightIllustration: "books",
    },
    topicBanner: {
      word1: "SUCCESSOR",
      connector: "AND",
      word2: "PREDECESSOR",
      subtitle: "Every number has a neighbour before and a neighbour after.",
    },
    lifeConnect: {
      word1: "LIFE",
      word2: "CONNECT",
      subtitle: "Maths Around Us",
      prompt: "When you stand in a queue at the ticket counter, the person right ahead of you is your predecessor, and the person behind you is your successor!",
      illustration: "planting-boy",
    },
  },

  Mathematics: {
    factZone: {
      badgeTitle: "FACT ZONE",
      factText: "A googol is 1 followed by 100 zeros! The search engine Google was named after a misspelling of this massive number.",
      bullets: [
        "Place value determines how much each digit represents in a number.",
        "Face value remains identical regardless of position.",
        "Rounding off helps us estimate budgets and distances quickly.",
      ],
      rightIllustration: "abacus",
    },
    topicBanner: {
      word1: "PLACE VALUE",
      connector: "AND",
      word2: "FACE VALUE",
      subtitle: "Discover how a single digit's power changes with its seat.",
    },
    lifeConnect: {
      word1: "MATHS",
      word2: "IN ACTION",
      subtitle: "Daily Budgeting & Estimation",
      prompt: "Supermarket cashiers round off small change, and bus ticket machines compute distances using rounded milestone numbers.",
      illustration: "market-shopping",
    },
  },

  Science: {
    factZone: {
      badgeTitle: "FACT ZONE",
      factText: "A single mature oak tree absorbs over 48 pounds of carbon dioxide each year while producing enough fresh oxygen for two people.",
      bullets: [
        "Plants prepare food using chlorophyll, sunlight, water, and CO₂.",
        "Roots not only absorb water but anchor the soil to stop erosion.",
        "Stomata under leaves act like tiny lungs that breathe gas in and out.",
      ],
      rightIllustration: "flask",
    },
    topicBanner: {
      word1: "LIVING",
      connector: "AND",
      word2: "NON-LIVING",
      subtitle: "Observing the wonders that grow, breathe, and reproduce around us.",
    },
    lifeConnect: {
      word1: "LIFE",
      word2: "CONNECT",
      subtitle: "Eco Care & Growing Things",
      prompt: "Planting a single sapling in your school or home garden helps cool the air, invites songbirds, and creates clean oxygen for your family!",
      illustration: "planting-boy",
    },
  },

  "Environmental Studies": {
    factZone: {
      badgeTitle: "FACT ZONE",
      factText: "Earth is the only known planet where water exists in all three states: liquid oceans, solid ice caps, and gaseous vapor clouds!",
      bullets: [
        "Biodiversity keeps ecosystems balanced and healthy.",
        "Composting food scraps turns waste into nutrient-rich soil.",
        "Turning off running taps saves up to 6 litres of drinking water every minute.",
      ],
      rightIllustration: "plant",
    },
    topicBanner: {
      word1: "REDUCE",
      connector: "AND",
      word2: "RECYCLE",
      subtitle: "Small daily habits that safeguard our oceans, forests, and skies.",
    },
    lifeConnect: {
      word1: "GREEN",
      word2: "CONNECT",
      subtitle: "Our Neighborhood Ecosystem",
      prompt: "Track how much single-use plastic your family avoids using this week by carrying a reusable cloth bag.",
      illustration: "planting-boy",
    },
  },

  "Social Studies": {
    factZone: {
      badgeTitle: "FACT ZONE",
      factText: "The ancient Indus Valley civilization built the world's first planned cities with covered brick drainage systems over 4,500 years ago!",
      bullets: [
        "A globe is the truest 3D model of our spherical planet.",
        "The Equator divides Earth into Northern and Southern Hemispheres.",
        "Maps use symbols, cardinal directions, and scales to show large terrains.",
      ],
      rightIllustration: "globe",
    },
    topicBanner: {
      word1: "GLOBE",
      connector: "AND",
      word2: "MAPS",
      subtitle: "Navigating continents, oceans, and civilizations across time.",
    },
    lifeConnect: {
      word1: "COMMUNITY",
      word2: "CONNECT",
      subtitle: "Heritage & Local Stories",
      prompt: "Interview an elder in your neighborhood to learn what your town or street looked like 40 years ago!",
      illustration: "nature-explorer",
    },
  },

  History: {
    factZone: {
      badgeTitle: "FACT ZONE",
      factText: "Emperor Ashoka's Lion Capital at Sarnath features four Asiatic lions standing back to back, symbolizing courage, pride, truth, and justice.",
      bullets: [
        "Primary sources include coins, inscriptions, pillars, and rock edicts.",
        "Archaeologists use carbon dating to pinpoint the age of buried artifacts.",
        "Trade routes like the Silk Route connected civilizations across continents.",
      ],
      rightIllustration: "globe",
    },
    topicBanner: {
      word1: "ANCIENT",
      connector: "AND",
      word2: "MODERN",
      subtitle: "Tracing how tools, writing, and settlements evolved across eras.",
    },
    lifeConnect: {
      word1: "HERITAGE",
      word2: "CONNECT",
      subtitle: "Preserving Ancient Monuments",
      prompt: "Visit a historical monument or old temple near your city. Notice the stone carvings and help keep the premises clean and litter-free.",
      illustration: "nature-explorer",
    },
  },

  Geography: {
    factZone: {
      badgeTitle: "FACT ZONE",
      factText: "Mount Everest grows by about 4 millimeters every year due to the tectonic collision of the Indian and Eurasian continental plates!",
      bullets: [
        "Landforms include mountains, plateaus, valleys, and coastal plains.",
        "Weather changes daily, while climate describes long-term seasonal patterns.",
        "Forests act as carbon sinks and prevent desertification.",
      ],
      rightIllustration: "globe",
    },
    topicBanner: {
      word1: "WEATHER",
      connector: "AND",
      word2: "CLIMATE",
      subtitle: "Understanding temperature, rainfall, winds, and atmospheric layers.",
    },
    lifeConnect: {
      word1: "NATURE",
      word2: "CONNECT",
      subtitle: "Weather Station Journal",
      prompt: "Record the morning temperature and sky conditions for 7 consecutive days to see how micro-climates shift in your area.",
      illustration: "nature-explorer",
    },
  },

  English: {
    factZone: {
      badgeTitle: "FACT ZONE",
      factText: "The sentence 'The quick brown fox jumps over the lazy dog' is a pangram: it uses every single letter in the English alphabet!",
      bullets: [
        "A metaphor states that something is something else, creating rich mental imagery.",
        "Prefixes and suffixes alter the grammatical role and meaning of root words.",
        "Active voice makes your storytelling punchier and more direct.",
      ],
      rightIllustration: "books",
    },
    topicBanner: {
      word1: "NOUNS",
      connector: "AND",
      word2: "PRONOUNS",
      subtitle: "Naming the world and swapping names smoothly in storytelling.",
    },
    lifeConnect: {
      word1: "READ",
      word2: "CONNECT",
      subtitle: "Words in the Wild",
      prompt: "Find 3 interesting descriptive adjectives in today's newspaper or storybook and use them in a 2-line journal entry.",
      illustration: "measuring-girl",
    },
  },

  "Computer Science": {
    factZone: {
      badgeTitle: "FACT ZONE",
      factText: "The term 'computer bug' originated in 1947 when Grace Hopper's team found an actual moth trapped between relays in the Mark II computer!",
      bullets: [
        "Algorithms are step-by-step recipes computers execute to solve problems.",
        "Binary code translates all software into simple 0s (off) and 1s (on).",
        "Cyber hygiene includes keeping strong passphrases and avoiding unknown links.",
      ],
      rightIllustration: "laptop",
    },
    topicBanner: {
      word1: "HARDWARE",
      connector: "AND",
      word2: "SOFTWARE",
      subtitle: "The physical silicon parts and the creative code that breathes life into them.",
    },
    lifeConnect: {
      word1: "TECH",
      word2: "CONNECT",
      subtitle: "Smart Digital Habits",
      prompt: "Explain to your parents how two-factor authentication protects accounts from unauthorized access.",
      illustration: "digital-coder",
    },
  },

  "General Knowledge": {
    factZone: {
      badgeTitle: "FACT ZONE",
      factText: "Honey never spoils! Archaeologists have discovered pots of 3,000-year-old honey in Egyptian tombs that are still perfectly edible.",
      bullets: [
        "The blue whale's heart is the size of a small car.",
        "Lightning strikes Earth over 8 million times every single day.",
        "The human brain generates about 20 watts of electrical power when awake.",
      ],
      rightIllustration: "books",
    },
    topicBanner: {
      word1: "WONDERS",
      connector: "OF",
      word2: "THE WORLD",
      subtitle: "Unlocking extraordinary discoveries across nature, science, and history.",
    },
    lifeConnect: {
      word1: "LIFE",
      word2: "CONNECT",
      subtitle: "Curiosity Notebook",
      prompt: "Write down one surprising question every morning that you don't know the answer to, and look it up before sunset!",
      illustration: "planting-boy",
    },
  },

  Telugu: {
    factZone: {
      badgeTitle: "తెలుసా మీకు?",
      factText: "తెలుగు భాషను 'ఇటాలియన్ ఆఫ్ ది ఈస్ట్' అని పిలుస్తారు, ఎందుకంటే ఇందులోని పదాలు అచ్చులతో ముగుస్తాయి.",
      bullets: [
        "తెలుగు వర్ణమాలలో అచ్చులు, హల్లులు మరియు ఉభయాక్షరాలు ఉంటాయి.",
        "గుణింతాలు మరియు ఒత్తులతో పదాల ఉచ్ఛారణ మరియు అర్థం మారుతాయి.",
        "పద్యాలు మరియు సామెతలు మన సంస్కృతికి జీవనాడి.",
      ],
      rightIllustration: "books",
    },
    topicBanner: {
      word1: "అచ్చులు",
      connector: "మరియు",
      word2: "హల్లులు",
      subtitle: "తెలుగు అక్షరమాల సౌందర్యం మరియు సరైన ఉచ్ఛారణ.",
    },
    lifeConnect: {
      word1: "జీవిత",
      word2: "బంధం",
      subtitle: "నిత్యజీవితంలో తెలుగు",
      prompt: "ఈ రోజు మీ ఇంట్లో పెద్దవారితో మాట్లాడి ఒక కొత్త తెలుగు సామెత లేదా పొడుపుకథ నేర్చుకోండి.",
      illustration: "planting-boy",
    },
  },

  Hindi: {
    factZone: {
      badgeTitle: "रोचक तथ्य",
      factText: "हिंदी भाषा विश्व में तीसरी सबसे अधिक बोली जाने वाली भाषा है। इसकी लिपि देवनागरी है जो वैज्ञानिक और ध्वनि-आधारित है।",
      bullets: [
        "स्वर और व्यंजन मिलकर शब्दों का निर्माण करते हैं।",
        "संज्ञा किसी व्यक्ति, वस्तु, स्थान या भाव के नाम को कहते हैं।",
        "मुहावरे हमारी भाषा को सुंदर और प्रभावशाली बनाते हैं।",
      ],
      rightIllustration: "books",
    },
    topicBanner: {
      word1: "संज्ञा",
      connector: "और",
      word2: "सर्वनाम",
      subtitle: "व्याकरण के मूल स्तंभ और उनका सही दैनिक प्रयोग।",
    },
    lifeConnect: {
      word1: "दैनिक",
      word2: "जीवन",
      subtitle: "भाषा और संस्कार",
      prompt: "आज अपने दैनिक जीवन में प्रयोग होने वाले पाँच नए हिंदी शब्दों की सूची बनाइए।",
      illustration: "planting-boy",
    },
  },
};

export function getSignaturePreset(subject: string): SubjectSignaturePreset {
  if (SIGNATURE_SUBJECT_PRESETS[subject]) return SIGNATURE_SUBJECT_PRESETS[subject];
  const lower = subject.toLowerCase();
  if (/math/i.test(lower)) return SIGNATURE_SUBJECT_PRESETS.Maths;
  if (/science/i.test(lower)) return SIGNATURE_SUBJECT_PRESETS.Science;
  if (/evs|environment|nature/i.test(lower)) return SIGNATURE_SUBJECT_PRESETS["Environmental Studies"];
  if (/social|civics/i.test(lower)) return SIGNATURE_SUBJECT_PRESETS["Social Studies"];
  if (/history/i.test(lower)) return SIGNATURE_SUBJECT_PRESETS.History;
  if (/geo/i.test(lower)) return SIGNATURE_SUBJECT_PRESETS.Geography;
  if (/english|lang|literat/i.test(lower)) return SIGNATURE_SUBJECT_PRESETS.English;
  if (/computer|coding|tech/i.test(lower)) return SIGNATURE_SUBJECT_PRESETS["Computer Science"];
  if (/telugu/i.test(lower)) return SIGNATURE_SUBJECT_PRESETS.Telugu;
  if (/hindi/i.test(lower)) return SIGNATURE_SUBJECT_PRESETS.Hindi;
  return SIGNATURE_SUBJECT_PRESETS["General Knowledge"];
}

export { applySignatureElementsToChapter, makeSignatureBlock } from "./applySignatureElements";

