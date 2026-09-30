import type { CurriculumGrade } from "../../domain/educational/curriculum";
import { DEFAULT_CHAPTER_CONFIG, makeCurriculumBlock } from "./chapterEngine";

type Example = { title: string; intro: string; items: string[]; takeaway: string; passage: string; questions: { prompt: string; answer?: string }[] };
/** Library-only starter examples. Chapter generation always uses the author's own topic/configuration. */
export const SUBJECT_EXAMPLES: Record<string, Example> = {
  Maths: {
    title: "Understanding place value", intro: "A digit's position tells us its value in a number.",
    items: ["In 472, the 4 represents 4 hundreds: 400.", "The 7 represents 7 tens: 70.", "The 2 represents 2 ones: 2."],
    takeaway: "472 = 400 + 70 + 2",
    passage: "Leela has 4 bundles of one hundred sticks, 7 bundles of ten sticks, and 2 loose sticks. Altogether, she has 472 sticks.",
    questions: [{ prompt: "What is the value of 7 in 472?", answer: "70" }, { prompt: "Write 583 as hundreds, tens, and ones.", answer: "500 + 80 + 3" }],
  },
  Science: {
    title: "What plants need", intro: "Most plants need light, water, air, and nutrients to grow.",
    items: ["Roots absorb water and nutrients.", "Leaves use light to help the plant make food.", "The stem supports the plant and carries water."],
    takeaway: "Different plant parts work together.",
    passage: "A seedling grows beside a sunny window. Its roots reach into the soil, its stem holds it upright, and its leaves spread out towards the light.",
    questions: [{ prompt: "Which part absorbs water?", answer: "The roots." }, { prompt: "What changes could you record as a seedling grows?", answer: "For example, its height and the number of leaves." }],
  },
  English: {
    title: "Nouns name our world", intro: "A noun names a person, place, animal, or thing.",
    items: ["Person: teacher, friend", "Place: library, garden", "Animal or thing: tiger, pencil"],
    takeaway: "Look for naming words when you read.",
    passage: "Mira visits the library with her friend. A cat sleeps near the window. On the table, Mira finds a book about birds.",
    questions: [{ prompt: "Write two nouns from the passage.", answer: "For example: library and cat." }, { prompt: "Write a sentence that includes a place and an animal.", answer: "Accept an appropriate sentence containing both nouns." }],
  },
  History: {
    title: "Clues from the past", intro: "Historians use evidence to learn about people and events in the past.",
    items: ["Objects: tools, pottery, and coins", "Written sources: letters, diaries, and records", "Visual sources: photographs, paintings, and maps"],
    takeaway: "Compare sources and ask who made them, when, and why.",
    passage: "A class finds an old photograph of its school. The building looks different. The pupils compare the photograph with a dated school record to learn what changed.",
    questions: [{ prompt: "Name two sources the pupils used.", answer: "A photograph and a school record." }, { prompt: "What question would you ask about the photograph?", answer: "For example: When was it taken?" }],
  },
  Geography: {
    title: "Reading a map", intro: "A map uses symbols to show places and features.",
    items: ["A key explains what the symbols mean.", "A compass arrow helps you find directions.", "A scale helps you understand distances."],
    takeaway: "Read the map key before interpreting its symbols.",
    passage: "A park map shows a pond, a playground, and a walking path. The key explains each symbol. A north arrow helps visitors describe where places are.",
    questions: [{ prompt: "What does a map key explain?", answer: "The meaning of the symbols." }, { prompt: "Why is a north arrow useful?", answer: "It helps readers work out directions." }],
  },
  Computer: {
    title: "Clear instructions", intro: "An algorithm is a sequence of instructions for completing a task.",
    items: ["Put the instructions in a useful order.", "Make each instruction clear.", "Try the steps and improve anything that does not work."],
    takeaway: "A useful algorithm can be followed and checked.",
    passage: "To draw a square, move forward and turn a right angle. Repeat these two steps four times. If a turn is missed, the shape will change.",
    questions: [{ prompt: "Why does the order of instructions matter?", answer: "Changing the order can change the result." }, { prompt: "Write instructions for packing a school bag." }],
  },
  Art: {
    title: "Patterns with shapes", intro: "Repeating shapes, lines, or colours can create a pattern.",
    items: ["Repeat a circle and a triangle.", "Alternate thick and thin lines.", "Use a repeating group of three colours."],
    takeaway: "Find the repeating part before extending a pattern.",
    passage: "A border repeats a leaf, a dot, and a flower. The artist repeats this group along the edge, keeping the spaces between the shapes even.",
    questions: [{ prompt: "What is the repeating group in the border?", answer: "A leaf, a dot, and a flower." }, { prompt: "Design a repeating pattern using two shapes." }],
  },
  Music: {
    title: "Finding the beat", intro: "The beat is the steady pulse you can feel in music.",
    items: ["Tap a steady pulse while listening.", "Clap a short rhythm over the pulse.", "Listen for how the rhythm fits the beat."],
    takeaway: "A rhythm can change while the beat stays steady.",
    passage: "One group taps a steady pulse. Another group claps a short pattern. They listen to each other and begin the pattern together.",
    questions: [{ prompt: "Which group is keeping the beat?", answer: "The group tapping a steady pulse." }, { prompt: "Describe how the groups can stay together." }],
  },
};

export function makeLibraryBlock(type: string, grade: CurriculumGrade = 3, subject = "Science") {
  const key = /evs|environment/i.test(subject) ? "Science" : subject === "Social Studies" ? "History" : subject;
  const sample = SUBJECT_EXAMPLES[key];
  const config = { ...DEFAULT_CHAPTER_CONFIG, grade, subject, title: sample?.title || "Explore a new idea", concepts: [sample?.title || "Explore a new idea"], learningOutcomes: sample ? [sample.takeaway] : ["Explain the idea in your own words."], theme: "" };
  const block = makeCurriculumBlock(type, config);
  // Sample lessons belong only to general-purpose blocks; specialised worksheets keep their own content.
  if (sample && ["concept-introduction", "concept-explorer", "big-idea", "explanation-block", "visual-explanation", "see-it", "example-non-example", "remember", "teacher-note", "worked-example", "quick-check", "guided-practice", "reading-passage", "reading-questions"].includes(type)) {
    block.semanticContent = { title: sample.title, unitBadge: block.semanticContent.unitBadge,
      ...(/quick-check|guided-practice/.test(type) ? { introText: "Use what you have learned.", questions: structuredClone(sample.questions) }
        : /reading/.test(type) ? { passage: sample.passage, questions: structuredClone(sample.questions) }
        : type === "worked-example" ? { introText: sample.intro, steps: sample.items.map((body, i) => ({ stepNumber: i + 1, title: "Example " + (i + 1), body })), calloutText: sample.takeaway }
        : { introText: sample.intro, items: [...sample.items], calloutText: sample.takeaway }) };
    block.semanticContent.metadata = { librarySample: true };
  }
  return block;
}
