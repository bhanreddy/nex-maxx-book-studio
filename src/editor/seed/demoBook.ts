import { Book, DEFAULT_BLEED, DEFAULT_PRINT_MARGINS, STANDARD_PAGE_SIZES } from "../../domain/book/types";
import { PageElement } from "../../domain/element/types";
import { PAGE_TEMPLATES } from "../registry/templates";
import { ELEMENT_PRESETS } from "../registry/presets";
import { integrateFirstPageLogo } from '../branding/bookBranding';
import { integrateBookPageBorder } from '../pageFrame/bookBorder';

export function createDefaultDemoBook(): { book: Book; elements: Record<string, PageElement> } {
  const bookId = "book-grade5-science";
  const elements: Record<string, PageElement> = {};

  // Pages container
  const pageDefinitions = [
    { id: "page-cover", pageIndex: 0, displayNumber: "Cover", templateId: "cover" },
    { id: "page-intro", pageIndex: 1, displayNumber: "1", templateId: "template-chapter-opener" },
    { id: "page-concept", pageIndex: 2, displayNumber: "2", templateId: "template-concept-reading" },
    { id: "page-lab", pageIndex: 3, displayNumber: "3", templateId: "template-activity-lab" },
    { id: "page-assess", pageIndex: 4, displayNumber: "4", templateId: "template-assessment-practice" },
    { id: "page-summary", pageIndex: 5, displayNumber: "5", templateId: "summary" },
  ];

  // Stable ids so the server and browser render the same demo document.
  let elementSerial = 1;
  const nextElementId = () => `el-demo-${String(elementSerial++).padStart(3, "0")}`;

  // Helper to generate element
  let zCounter = 1;
  const createElement = (
    pageId: string,
    presetKey: keyof typeof ELEMENT_PRESETS,
    x: number,
    y: number,
    overrides?: Partial<PageElement>
  ): PageElement => {
    const preset = ELEMENT_PRESETS[presetKey];
    const id = nextElementId();
    const el: PageElement = {
      id,
      pageId,
      type: preset.type,
      category: preset.category,
      version: 1,
      displayName: overrides?.displayName || preset.name,
      transform: {
        x,
        y,
        width: preset.defaultTransform.width,
        height: preset.defaultTransform.height,
        rotation: 0,
        zIndex: zCounter++,
      },
      style: { ...preset.defaultStyle, ...overrides?.style },
      content: { ...preset.defaultContent, ...overrides?.content },
      presetId: preset.id,
      locked: false,
      hidden: false,
    };
    elements[id] = el;
    return el;
  };

  // 1. Cover Page
  const coverElements = [
    createElement("page-cover", "preset-ch-title", 54, 180, {
      displayName: "Cover Title",
      style: { fontSize: 34, fontWeight: 800, color: "#065f46", textAlign: "center", lineHeight: 1.15 },
      content: { text: "DISCOVERY SCIENCE" },
    }),
    createElement("page-cover", "preset-section-heading", 54, 235, {
      displayName: "Cover Subtitle",
      style: { fontSize: 16, fontWeight: 600, color: "#0284c7", textAlign: "center" },
      content: { text: "Grade 5 • Living Systems & Cells" },
    }),
    createElement("page-cover", "preset-image-frame", 72, 280, {
      displayName: "Cover Hero Image",
      style: { borderRadius: 16, borderColor: "#059669", borderWidth: 3 },
      transform: { x: 72, y: 280, width: 450, height: 320, rotation: 0, zIndex: 3 },
      content: {
        src: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&auto=format&fit=crop&q=80",
        alt: "Vibrant botanical cell textures",
        caption: "NEX MAXX Academic Curriculum Series",
        rawWidthPx: 1600,
        rawHeightPx: 1000,
      },
    }),
    createElement("page-cover", "preset-body-paragraph", 54, 600, {
      displayName: "Publisher Imprint",
      style: { fontSize: 11, fontWeight: 600, color: "#475569", textAlign: "center" },
      content: { text: "NEX MAXX PUBLISHING HOUSE • CURRICULUM EDITION" },
    }),
  ];

  // 2. Chapter Opener Page (Page 1)
  const openerTmpl = PAGE_TEMPLATES[0];
  const p1ElementIds: string[] = [];
  openerTmpl.elements.forEach((tmplEl) => {
    const id = nextElementId();
    elements[id] = {
      ...tmplEl,
      id,
      pageId: "page-intro",
    };
    p1ElementIds.push(id);
  });

  // 3. Concept Page (Page 2)
  const conceptTmpl = PAGE_TEMPLATES[1];
  const p2ElementIds: string[] = [];
  conceptTmpl.elements.forEach((tmplEl) => {
    const id = nextElementId();
    elements[id] = {
      ...tmplEl,
      id,
      pageId: "page-concept",
    };
    p2ElementIds.push(id);
  });

  // 4. Lab Activity Page (Page 3)
  const labTmpl = PAGE_TEMPLATES[2];
  const p3ElementIds: string[] = [];
  labTmpl.elements.forEach((tmplEl) => {
    const id = nextElementId();
    elements[id] = {
      ...tmplEl,
      id,
      pageId: "page-lab",
    };
    p3ElementIds.push(id);
  });

  // 5. Assessment Practice Page (Page 4)
  const assessTmpl = PAGE_TEMPLATES[3];
  const p4ElementIds: string[] = [];
  assessTmpl.elements.forEach((tmplEl) => {
    const id = nextElementId();
    elements[id] = {
      ...tmplEl,
      id,
      pageId: "page-assess",
    };
    p4ElementIds.push(id);
  });

  // 6. Chapter Summary Page (Page 5)
  const p5Elements = [
    createElement("page-summary", "preset-section-heading", 54, 54, {
      displayName: "Summary Heading",
      style: { fontSize: 18, fontWeight: 700, color: "#0f766e" },
      content: { text: "Chapter 1: Knowledge Recap & Self-Check" },
    }),
    createElement("page-summary", "preset-summary-card", 54, 96, {
      displayName: "Summary Core Points",
    }),
    createElement("page-summary", "preset-writing-lines", 54, 226, {
      displayName: "Reflection Writing Lines",
      content: {
        lineCount: 5,
        lineType: "four-line",
        samplePrompt: "Write in your own words how chloroplasts help plants make their own food:",
      },
    }),
    createElement("page-summary", "preset-did-you-know", 54, 380, {
      displayName: "Botanical Trivia",
      content: {
        title: "DID YOU KNOW?",
        body: "Algae in oceans produce more than 50% of the Earth's total atmospheric oxygen through chloroplast photosynthesis!",
      },
    }),
  ];

  const book: Book = {
    id: bookId,
    title: "Discovery Science: Living Systems & Cells",
    subtitle: "A Complete Inquiry-Based Science Course",
    grade: "Grade 5",
    subject: "Science",
    language: "English",
    academicYear: "2026–2027",
    type: "Textbook",
    orientation: "portrait",
    pageSize: "A4",
    dimensions: STANDARD_PAGE_SIZES.A4,
    margins: DEFAULT_PRINT_MARGINS,
    bleed: DEFAULT_BLEED,
    bindingType: "Perfect Bound",
    spineWidthPt: 18,
    themeId: "science-modern",
    units: [
      {
        id: "unit-1",
        number: 1,
        title: "Living Systems & Cellular Foundations",
        description: "Exploring organelles, plant anatomy, and microscopic life",
        chapterIds: ["ch-1"],
      },
    ],
    chapters: [
      {
        id: "ch-1",
        unitId: "unit-1",
        number: 1,
        title: "The Building Blocks of Life",
        learningObjectives: [
          "Identify the structure and organelles of plant cells",
          "Differentiate between plant and animal cells",
          "Understand chlorophyll and photosynthesis",
        ],
        pageIds: pageDefinitions.map((p) => p.id),
      },
    ],
    pages: [
      {
        id: "page-cover",
        pageIndex: 0,
        displayNumber: "Cover",
        elementIds: coverElements.map((e) => e.id),
        status: "Published",
      },
      {
        id: "page-intro",
        pageIndex: 1,
        displayNumber: "1",
        chapterId: "ch-1",
        unitId: "unit-1",
        templateId: "template-chapter-opener",
        elementIds: p1ElementIds,
        status: "Approved",
      },
      {
        id: "page-concept",
        pageIndex: 2,
        displayNumber: "2",
        chapterId: "ch-1",
        unitId: "unit-1",
        templateId: "template-concept-reading",
        elementIds: p2ElementIds,
        status: "Design",
      },
      {
        id: "page-lab",
        pageIndex: 3,
        displayNumber: "3",
        chapterId: "ch-1",
        unitId: "unit-1",
        templateId: "template-activity-lab",
        elementIds: p3ElementIds,
        status: "Writing",
      },
      {
        id: "page-assess",
        pageIndex: 4,
        displayNumber: "4",
        chapterId: "ch-1",
        unitId: "unit-1",
        templateId: "template-assessment-practice",
        elementIds: p4ElementIds,
        status: "Content Review",
      },
      {
        id: "page-summary",
        pageIndex: 5,
        displayNumber: "5",
        chapterId: "ch-1",
        unitId: "unit-1",
        elementIds: p5Elements.map((e) => e.id),
        status: "Approved",
      },
      // Page 6: Unit Opener
      {
        id: "page-unit-opener",
        pageIndex: 6,
        displayNumber: "6",
        chapterId: "ch-1",
        unitId: "unit-1",
        elementIds: [
          createElement("page-unit-opener", "preset-unit-banner", 54, 54, {
            displayName: "Unit 1 Banner",
            style: { backgroundColor: "#065f46", color: "#ffffff", borderRadius: 8 },
            content: { text: "UNIT 1 • CELLULAR STRUCTURES AND LIFE PROCESSES" },
          }).id,
          createElement("page-unit-opener", "preset-ch-title", 54, 110, {
            displayName: "Unit Overview Title",
            style: { fontSize: 24, fontWeight: 800, color: "#064e3b" },
            content: { text: "The Architecture of Living Organisms" },
          }).id,
          createElement("page-unit-opener", "preset-body-paragraph", 54, 150, {
            displayName: "Unit Introduction Text",
            content: {
              text: "Every living thing on our planet, from the towering redwood trees of California to the microscopic bacteria in a drop of pond water, is built from microscopic units called cells. In this unit, we investigate how specialized structures inside cells carry out life-sustaining chemical processes.",
            },
          }).id,
          createElement("page-unit-opener", "preset-learning-objectives", 54, 250, {
            displayName: "Unit Learning Targets",
            content: {
              title: "UNIT BENCHMARK TARGETS",
              items: [
                "Map organelle structures to cellular functions",
                "Explain the biochemical pathway of photosynthesis in chloroplasts",
                "Analyze cellular respiration in mitochondria",
                "Compare prokaryotic and eukaryotic organisms",
              ],
            },
          }).id,
          createElement("page-unit-opener", "preset-image-frame", 54, 420, {
            displayName: "Unit Microscope Feature",
            transform: { x: 54, y: 420, width: 486, height: 260, rotation: 0, zIndex: 5 },
            content: {
              src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80",
              alt: "Optical microscope examining biological specimen",
              caption: "Electron microscopy allows visualization of cell organelles at 50,000× magnification.",
              rawWidthPx: 1200,
              rawHeightPx: 800,
            },
          }).id,
        ],
        status: "Approved",
      },
      // Page 7: Two-Column Scientific Comparison Table
      {
        id: "page-comparison",
        pageIndex: 7,
        displayNumber: "7",
        chapterId: "ch-1",
        unitId: "unit-1",
        elementIds: [
          createElement("page-comparison", "preset-section-heading", 54, 54, {
            displayName: "Comparison Header",
            style: { fontSize: 18, fontWeight: 700, color: "#065f46" },
            content: { text: "Comparative Anatomy: Plant vs Animal Cells" },
          }).id,
          createElement("page-comparison", "preset-body-paragraph", 54, 90, {
            displayName: "Comparison Introduction",
            content: {
              text: "While both plant and animal cells are eukaryotic, plant cells possess specialized structures—notably a rigid cellulose cell wall, large central vacuoles, and chloroplasts—that enable autotrophic nutrition and structural integrity.",
            },
          }).id,
          createElement("page-comparison", "preset-comparison-table", 54, 170, {
            displayName: "Cell Comparison Table",
            transform: { x: 54, y: 170, width: 486, height: 240, rotation: 0, zIndex: 3 },
            content: {
              headers: ["Feature / Organelle", "Plant Cell", "Animal Cell", "Primary Function"],
              rows: [
                ["Cell Wall", "Present (Rigid Cellulose)", "Absent (Flexible)", "Provides turgor pressure and shape"],
                ["Chloroplasts", "Present (Chlorophyll)", "Absent", "Converts sunlight to chemical glucose"],
                ["Vacuole", "Single Large Central Vacuole", "Small, Temporary Vacuoles", "Maintains cellular water balance"],
                ["Centrioles", "Absent in higher plants", "Present", "Organizes spindle fibers in division"],
                ["Mitochondria", "Present", "Present", "Generates cellular ATP energy"],
              ],
            },
          }).id,
          createElement("page-comparison", "preset-key-concept", 54, 440, {
            displayName: "Key Takeaway Callout",
            content: {
              title: "CELLULAR PRINCIPLE",
              body: "The presence of chloroplasts and rigid cell walls in plants is the direct evolutionary adaptation enabling plants to stand upright and produce their own nutrients without locomotion.",
            },
          }).id,
          createElement("page-comparison", "preset-did-you-know", 54, 570, {
            displayName: "Vacuole Pressure Trivia",
            content: {
              title: "TURGOR PRESSURE IN PLANTS",
              body: "When a houseplant wilts, it is because its central vacuoles have lost water pressure. Watering the plant restores turgor within minutes!",
            },
          }).id,
        ],
        status: "Approved",
      },
      // Page 8: Vector Cell Anatomy with Visual Diagram
      {
        id: "page-vector-anatomy",
        pageIndex: 8,
        displayNumber: "8",
        chapterId: "ch-1",
        unitId: "unit-1",
        elementIds: [
          createElement("page-vector-anatomy", "preset-section-heading", 54, 54, {
            displayName: "Diagram Title",
            style: { fontSize: 18, fontWeight: 700, color: "#065f46" },
            content: { text: "Visualizing Cell Organelles: Structure & Function" },
          }).id,
          createElement("page-vector-anatomy", "preset-image-frame", 54, 96, {
            displayName: "Microscopic Specimen View",
            transform: { x: 54, y: 96, width: 486, height: 280, rotation: 0, zIndex: 2 },
            content: {
              src: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&auto=format&fit=crop&q=80",
              alt: "Plant cells showing green chloroplast clusters",
              caption: "High-resolution photomicrograph of Elodea leaf cells displaying green chloroplasts.",
              rawWidthPx: 1400,
              rawHeightPx: 800,
            },
          }).id,
          createElement("page-vector-anatomy", "preset-body-paragraph", 54, 396, {
            displayName: "Organelle Descriptions",
            content: {
              text: "1. Nucleus: The control center containing genetic DNA instructions.\n2. Chloroplast: Pigment-rich plastids conducting photosynthesis.\n3. Mitochondrion: Cellular powerhouse generating ATP energy.\n4. Endoplasmic Reticulum: Interconnected network synthesizing proteins and lipids.",
            },
          }).id,
          createElement("page-vector-anatomy", "preset-qr-code", 380, 520, {
            displayName: "Interactive 3D Cell QR",
            transform: { x: 380, y: 520, width: 160, height: 160, rotation: 0, zIndex: 4 },
            content: {
              label: "SCAN FOR 3D CELL TOUR",
              url: "https://nex-maxx.edu/cells/3d",
            },
          }).id,
        ],
        status: "Design",
      },
      // Page 9: Practical Lab Experiment
      {
        id: "page-lab-exp",
        pageIndex: 9,
        displayNumber: "9",
        chapterId: "ch-1",
        unitId: "unit-1",
        elementIds: [
          createElement("page-lab-exp", "preset-lab-card", 54, 54, {
            displayName: "Lab Experiment Protocol",
            transform: { x: 54, y: 54, width: 486, height: 320, rotation: 0, zIndex: 3 },
            content: {
              title: "INVESTIGATION: Osmosis Across Semi-Permeable Membranes",
              materials: "Potato cylinders, 10% saline solution, distilled water, balance scale, petri dishes.",
              steps: [
                "1. Cut three potato cores to exactly 50 mm length using a cork borer.",
                "2. Measure and record the baseline mass of each cylinder in your workbook table.",
                "3. Place Core A in distilled water, Core B in 5% saline, and Core C in 15% saline.",
                "4. Wait 30 minutes, blot dry gently, and re-measure both length and mass.",
                "5. Calculate the percentage change in mass: [(Final - Initial) / Initial] × 100.",
              ],
            },
          }).id,
          createElement("page-lab-exp", "preset-drawing-box", 54, 400, {
            displayName: "Observation Graph Area",
            transform: { x: 54, y: 400, width: 486, height: 260, rotation: 0, zIndex: 2 },
            content: {
              title: "DATA PLOT: MASS CHANGE VS SALT CONCENTRATION",
              prompt: "Plot a line graph showing potato cylinder mass change. Label the X-axis (Saline Concentration %) and Y-axis (% Mass Change). Mark the isotonic equilibrium point.",
            },
          }).id,
        ],
        status: "Writing",
      },
      // Page 10: Teacher Edition Lesson Guide
      {
        id: "page-teacher-guide",
        pageIndex: 10,
        displayNumber: "10",
        chapterId: "ch-1",
        unitId: "unit-1",
        elementIds: [
          createElement("page-teacher-guide", "preset-section-heading", 54, 54, {
            displayName: "Teacher Lesson Header",
            style: { fontSize: 18, fontWeight: 700, color: "#4338ca" },
            content: { text: "Teacher's Guide • Lesson 1.2 Pedagogical Strategies" },
          }).id,
          createElement("page-teacher-guide", "preset-summary-card", 54, 96, {
            displayName: "Lesson Key Milestones",
            style: { backgroundColor: "#eef2ff", borderColor: "#c7d2fe" },
            content: {
              title: "LESSON TIMING & DIFFERENTIATION (45 MINS)",
              items: [
                "Hook (8 mins): Show wilted vs crisp celery stalks to demonstrate cell water pressure.",
                "Guided Inquiry (15 mins): Direct microscope slide examination of red onion epidermis.",
                "Structured Discussion (12 mins): Facilitate think-pair-share on organelle division of labor.",
                "Formative Exit Ticket (10 mins): Independent completion of cell comparison diagram.",
              ],
            },
          }).id,
          createElement("page-teacher-guide", "preset-key-concept", 54, 280, {
            displayName: "Common Misconception Alert",
            style: { backgroundColor: "#fef3c7", borderColor: "#fde68a" },
            content: {
              title: "COMMON STUDENT MISCONCEPTION",
              body: "Students frequently believe plant cells carry out photosynthesis while animal cells carry out respiration. Clarify strongly that plant cells contain BOTH mitochondria and chloroplasts and perform cellular respiration continuously day and night.",
            },
          }).id,
        ],
        status: "Academic Review",
      },
      // Page 11: Workbook Handwriting & Scientific Vocabulary
      {
        id: "page-workbook-vocab",
        pageIndex: 11,
        displayNumber: "11",
        chapterId: "ch-1",
        unitId: "unit-1",
        elementIds: [
          createElement("page-workbook-vocab", "preset-section-heading", 54, 54, {
            displayName: "Workbook Vocabulary Header",
            style: { fontSize: 18, fontWeight: 700, color: "#065f46" },
            content: { text: "Vocabulary Mastery & Handwriting Practice" },
          }).id,
          createElement("page-workbook-vocab", "preset-writing-lines", 54, 100, {
            displayName: "Vocabulary Word 1",
            transform: { x: 54, y: 100, width: 486, height: 160, rotation: 0, zIndex: 2 },
            content: {
              lineCount: 4,
              lineType: "four-line",
              samplePrompt: "1. Chloroplast: A specialized organelle containing green chlorophyll pigment that synthesizes glucose.",
            },
          }).id,
          createElement("page-workbook-vocab", "preset-writing-lines", 54, 290, {
            displayName: "Vocabulary Word 2",
            transform: { x: 54, y: 290, width: 486, height: 160, rotation: 0, zIndex: 3 },
            content: {
              lineCount: 4,
              lineType: "four-line",
              samplePrompt: "2. Mitochondria: Cellular power plants that convert glucose into usable ATP chemical energy.",
            },
          }).id,
          createElement("page-workbook-vocab", "preset-writing-lines", 54, 480, {
            displayName: "Vocabulary Word 3",
            transform: { x: 54, y: 480, width: 486, height: 160, rotation: 0, zIndex: 4 },
            content: {
              lineCount: 4,
              lineType: "four-line",
              samplePrompt: "3. Turgor Pressure: The outward force exerted by water inside the vacuole against the plant cell wall.",
            },
          }).id,
        ],
        status: "Approved",
      },
      // Page 12: Case Study & Critical Thinking
      {
        id: "page-case-study",
        pageIndex: 12,
        displayNumber: "12",
        chapterId: "ch-1",
        unitId: "unit-1",
        elementIds: [
          createElement("page-case-study", "preset-section-heading", 54, 54, {
            displayName: "Case Study Title",
            style: { fontSize: 18, fontWeight: 700, color: "#065f46" },
            content: { text: "Ecosystem Science: Oceanic Phytoplankton" },
          }).id,
          createElement("page-case-study", "preset-body-paragraph", 54, 96, {
            displayName: "Reading Passage",
            content: {
              text: "Did you know that half of the oxygen in every breath you take is produced not by terrestrial trees, but by microscopic single-celled algae floating in the surface waters of our oceans? Known as phytoplankton, these microscopic cells utilize sunlight to perform photosynthesis at a planetary scale.",
            },
          }).id,
          createElement("page-case-study", "preset-key-concept", 54, 220, {
            displayName: "Global Impact Metric",
            content: {
              title: "PLANETARY CARBON CYCLE",
              body: "Phytoplankton sequester over 10 gigatons of atmospheric carbon into the deep ocean every year through the biological carbon pump.",
            },
          }).id,
          createElement("page-case-study", "preset-writing-lines", 54, 380, {
            displayName: "Critical Analysis Prompt",
            transform: { x: 54, y: 380, width: 486, height: 260, rotation: 0, zIndex: 3 },
            content: {
              lineCount: 6,
              samplePrompt: "Hypothesize what would happen to Earth's atmospheric balance if rising ocean temperatures damaged phytoplankton chloroplasts:",
            },
          }).id,
        ],
        status: "Approved",
      },
      // Page 13: Mid-Unit Assessment
      {
        id: "page-assessment-quiz",
        pageIndex: 13,
        displayNumber: "13",
        chapterId: "ch-1",
        unitId: "unit-1",
        elementIds: [
          createElement("page-assessment-quiz", "preset-section-heading", 54, 54, {
            displayName: "Quiz Header",
            style: { fontSize: 18, fontWeight: 700, color: "#1e1b4b" },
            content: { text: "Mid-Unit Mastery Assessment • Section A" },
          }).id,
          createElement("page-assessment-quiz", "preset-mcq-question", 54, 96, {
            displayName: "Assessment Q1",
            content: {
              questionNumber: "1",
              questionText: "Which organelle is responsible for generating chemical ATP energy inside eukaryotic cells?",
              options: ["A. Chloroplast", "B. Mitochondrion", "C. Golgi Apparatus", "D. Ribosome"],
              correctAnswerIndex: 1,
            },
          }).id,
          createElement("page-assessment-quiz", "preset-mcq-question", 54, 240, {
            displayName: "Assessment Q2",
            content: {
              questionNumber: "2",
              questionText: "What distinguishes plant cells from animal cells under an optical light microscope?",
              options: [
                "A. Animal cells have larger nuclei",
                "B. Plant cells have visible green chloroplasts & rigid cell walls",
                "C. Animal cells lack cytoplasm",
                "D. Plant cells do not possess cell membranes",
              ],
              correctAnswerIndex: 1,
            },
          }).id,
          createElement("page-assessment-quiz", "preset-fill-blank", 54, 400, {
            displayName: "Assessment Q3 Fill Blank",
            content: {
              questionNumber: "3",
              sentence: "The semi-permeable boundary that controls what enters and exits the cell is the ______________.",
              correctAnswer: "cell membrane",
            },
          }).id,
          createElement("page-assessment-quiz", "preset-fill-blank", 54, 460, {
            displayName: "Assessment Q4 Fill Blank",
            content: {
              questionNumber: "4",
              sentence: "Plants produce glucose through photosynthesis using sunlight, water, and ______________.",
              correctAnswer: "carbon dioxide",
            },
          }).id,
        ],
        status: "Approved",
      },
      // Page 14: Assessment Rubric & Performance Scale
      {
        id: "page-rubric",
        pageIndex: 14,
        displayNumber: "14",
        chapterId: "ch-1",
        unitId: "unit-1",
        elementIds: [
          createElement("page-rubric", "preset-section-heading", 54, 54, {
            displayName: "Rubric Title",
            style: { fontSize: 18, fontWeight: 700, color: "#1e1b4b" },
            content: { text: "Scientific Inquiry Assessment Rubric" },
          }).id,
          createElement("page-rubric", "preset-comparison-table", 54, 96, {
            displayName: "Standardized Rubric Table",
            transform: { x: 54, y: 96, width: 486, height: 320, rotation: 0, zIndex: 3 },
            content: {
              headers: ["Competency Area", "Emerging (1)", "Developing (2)", "Proficient (3)", "Exemplary (4)"],
              rows: [
                ["Microscope Operation", "Requires full assistance", "Focuses coarse knob only", "Focuses high-power lens cleanly", "Prepares pristine wet mount slides"],
                ["Organelle Identification", "Identifies < 2 organelles", "Identifies nucleus only", "Correctly identifies 4+ organelles", "Explains biochemical organelle interlinks"],
                ["Experimental Recording", "Incomplete observations", "Records raw data without units", "Organized data tables with units", "Calculates rates & produces labeled plots"],
                ["Scientific Communication", "Informal terminology", "Basic vocabulary with errors", "Accurate use of curriculum terms", "Synthesizes complex biological arguments"],
              ],
            },
          }).id,
          createElement("page-rubric", "preset-summary-card", 54, 450, {
            displayName: "Assessment Feedback Notes",
            content: {
              title: "TEACHER GRADING & MASTERY CRITERIA",
              items: [
                "Students achieving Level 3 or 4 progress to Chapter 2: Plant Vascular Systems.",
                "Students scoring Level 1 or 2 complete Remedial Practical Lab 1.1 with peer mentors.",
              ],
            },
          }).id,
        ],
        status: "Approved",
      },
      // Page 15: Answer Key & Glossary
      {
        id: "page-glossary",
        pageIndex: 15,
        displayNumber: "15",
        chapterId: "ch-1",
        unitId: "unit-1",
        elementIds: [
          createElement("page-glossary", "preset-section-heading", 54, 54, {
            displayName: "Glossary Header",
            style: { fontSize: 18, fontWeight: 700, color: "#065f46" },
            content: { text: "Chapter 1 Reference Index & Quick Answer Key" },
          }).id,
          createElement("page-glossary", "preset-body-paragraph", 54, 96, {
            displayName: "Self-Check Answer Key",
            content: {
              text: "ANSWER KEY FOR PAGE 13 SELF-CHECK:\nQ1: B (Mitochondrion generates ATP through aerobic respiration)\nQ2: B (Plant cells possess rigid cellulose cell walls and green chloroplasts)\nQ3: Cell Membrane (Lipid bilayer regulating selective permeability)\nQ4: Carbon Dioxide (CO2 combined with H2O produces C6H12O6 glucose)",
            },
          }).id,
          createElement("page-glossary", "preset-did-you-know", 54, 260, {
            displayName: "Next Chapter Teaser",
            content: {
              title: "NEXT CHAPTER SNEAK PEEK",
              body: "In Chapter 2, we zoom out from single cells to explore Xylem and Phloem: the vascular superhighways that transport water 300 feet up to the tops of giant redwood trees!",
            },
          }).id,
          createElement("page-glossary", "preset-qr-code", 54, 420, {
            displayName: "Publisher Resources QR",
            transform: { x: 54, y: 420, width: 140, height: 140, rotation: 0, zIndex: 4 },
            content: {
              label: "CURRICULUM PORTAL",
              url: "https://nex-maxx.edu/grade5/science",
            },
          }).id,
        ],
        status: "Approved",
      },
    ],
    textStyles: [
      { id: "ts-ch-title", name: "Chapter Title", category: "heading", fontFamily: "Outfit, Inter, sans-serif", fontSize: 26, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.5, color: "#065f46" },
      { id: "ts-h1", name: "Section Heading 1", category: "heading", fontFamily: "Outfit, Inter, sans-serif", fontSize: 18, fontWeight: 700, lineHeight: 1.25, letterSpacing: -0.3, color: "#0f766e" },
      { id: "ts-h2", name: "Sub-Heading 2", category: "heading", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, lineHeight: 1.35, letterSpacing: -0.2, color: "#1e293b" },
      { id: "ts-body", name: "Curriculum Body", category: "body", fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 400, lineHeight: 1.55, letterSpacing: 0, color: "#334155" },
      { id: "ts-caption", name: "Figure Caption", category: "caption", fontFamily: "Inter, sans-serif", fontSize: 8, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0.1, color: "#64748b" },
      { id: "ts-question", name: "Assessment Question", category: "question", fontFamily: "Inter, sans-serif", fontSize: 9.5, fontWeight: 600, lineHeight: 1.4, letterSpacing: 0, color: "#1e1b4b" },
    ],
    comments: [
      {
        id: "comm-1",
        pageId: "page-intro",
        author: "Dr. Ananya Sharma",
        role: "Reviewer",
        text: "Ensure the learning objectives align precisely with NCERT Grade 5 standard 5.2.1.",
        timestamp: "Yesterday at 14:30",
        resolved: true,
      },
      {
        id: "comm-2",
        pageId: "page-lab-exp",
        author: "Marcus Chen",
        role: "Editor",
        text: "Please verify that the 15% saline concentration is safe for elementary school students.",
        timestamp: "Today at 09:15",
        resolved: false,
      },
    ],
    masterPages: [
      {
        id: "master-standard",
        name: "Standard Academic Header/Footer",
        type: "Normal",
        headerText: "DISCOVERY SCIENCE • GRADE 5",
        footerText: "NEX MAXX CURRICULUM SERIES",
        showPageNumber: true,
        pageNumberPosition: "outside",
        margins: DEFAULT_PRINT_MARGINS,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    status: "Design",
    coverImage: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80",
  };

  return integrateFirstPageLogo(integrateBookPageBorder(book), elements);
}
