import type { CurriculumBlockDefinition, CurriculumCategory, CurriculumLayout, FrameworkStage } from "../../domain/educational/curriculum";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";

type Content = Partial<SmartBlockInstance["semanticContent"]>;
type Entry = [name: string, purpose: string, layout: CurriculumLayout, content: Content];
const questions = (...prompts: string[]): Content => ({ questions: prompts.map(prompt => ({ prompt, points: 1 })) });
const rows = (first: string, second: string, ...items: string[]): Content => ({ metadata: { columnHeadings: [first, second] }, items });
const steps = (...instructions: string[]): Content => ({ steps: instructions.map((body, i) => ({ stepNumber: i + 1, title: `Step ${i + 1}`, body })) });
const groups: [CurriculumCategory, FrameworkStage, SmartBlockInstance["archetypeId"], Entry[]][] = [
  ["discover", "discover", "warm-up", [
    ["Opening Picture", "Start a discussion using a picture and a simple question.", "visual-first", questions("What can you see?", "What would you like to find out?")],
    ["Chapter Overview", "Introduce the topics, tasks, and final learning check.", "editorial", { items: ["What we will learn", "What we will practise", "What we will make or do", "How we will check our learning"] }],
    ["Warm-Up Game", "Prepare the class with a short learning game.", "sorting-board", { ...steps("Choose three familiar words or objects.", "Ask learners to find what they have in common.", "Invite a partner to suggest another example."), materials: ["Word cards or classroom objects"] }],
    ["Question of the Day", "Begin with one question pupils can return to later.", "question", questions("What question should we explore today?")],
    ["Learning Checklist", "Make the chapter goals easy to follow.", "confidence", { items: ["I can name the main idea.", "I can explain an example.", "I can complete a task on my own."] }],
    ["What We Need", "Prepare the materials for the chapter.", "editorial", { materials: ["Notebook", "Pencil", "Add any topic-specific materials"], calloutText: "Check your materials before starting." }],
    ["Quick Poll", "Let pupils share their starting ideas.", "question", { questions: [{ prompt: "How familiar is this topic?", options: ["New to me", "I know a little", "I can explain it"] }] }],
    ["Topic Preview", "Preview the chapter through short, ordered topics.", "timeline", { items: ["Meet the new idea", "See an example", "Try a task", "Check what you learned"] }],
    ["Class Discussion", "Collect different views before teaching the topic.", "conversation", { items: ["What do we already know?", "What questions do we have?", "Which ideas should we check?"] }],
  ]],
  ["reading-writing", "learn", "concept-explanation", [
    ["Reading Passage", "Provide a readable passage with space for a response.", "reading-page", { passage: "Add a short passage suited to the class. Introduce one clear idea, use familiar words, and end with a detail pupils can discuss.", ...questions("What is the passage about?") }],
    ["Reading Questions", "Check the main idea, details, and clues in a text.", "writing-sheet", questions("What is the main idea?", "Which detail supports your answer?", "What can you learn from the clues?")],
    ["Word List", "Organise new words for reading and spelling.", "comparison-table", rows("Word", "Use it", "Word 1 | Write a sentence", "Word 2 | Write a sentence", "Word 3 | Write a sentence")],
    ["Word Meanings", "Explain new words with simple meanings and examples.", "comparison-table", rows("Word", "Meaning", "New word | Add a simple meaning", "Another word | Add a simple meaning")],
    ["Spelling Practice", "Practise looking, covering, writing, and checking words.", "writing-sheet", { ...steps("Read each word aloud.", "Cover the word and write it from memory.", "Compare your spelling with the original."), ...questions("Write the words you are practising.") }],
    ["Handwriting Practice", "Provide generous writing lines for letters and words.", "writing-sheet", { introText: "Add the letters or words to practise. Copy carefully, then write them on your own.", ...questions("Copy the word or sentence.", "Write it again without looking.") }],
    ["Sentence Builder", "Help pupils turn words into clear sentences.", "writing-sheet", { items: ["Who or what?", "What happens?", "Add one useful detail."], ...questions("Write your complete sentence.") }],
    ["Story Planner", "Plan the beginning, middle, and end of a story.", "comparison-table", rows("Story part", "Your ideas", "Beginning | Who is there? Where are they?", "Middle | What happens?", "Ending | How does the story finish?")],
    ["Poem", "Set a poem in a clear reading layout with a response.", "reading-page", { passage: "Add the poem here.\nKeep the author's line breaks.\nLeave room to read it aloud.", ...questions("Which words or sounds do you notice?") }],
  ]],
  ["maths", "build", "guided-practice", [
    ["Number Line", "Show numbers in order and practise counting forwards.", "timeline", { items: ["0", "1", "2", "3", "4", "5"], ...questions("Start at 2. Move two steps forward. Where do you land?") }],
    ["Place Value Table", "Separate tens and ones using a clear table.", "comparison-table", rows("Tens", "Ones", "3 | 4", "5 | 2", "1 | 8")],
    ["Addition Practice", "Add using objects, pictures, or written methods.", "writing-sheet", { questions: [{ prompt: "3 + 2 =", answer: "5", points: 1 }, { prompt: "4 + 1 =", answer: "5", points: 1 }] }],
    ["Subtraction Practice", "Find how many remain after taking some away.", "writing-sheet", { questions: [{ prompt: "5 − 2 =", answer: "3", points: 1 }, { prompt: "7 − 3 =", answer: "4", points: 1 }] }],
    ["Multiplication Practice", "Connect equal groups with multiplication.", "workmat", { questions: [{ prompt: "Draw 3 groups of 2. How many altogether?", answer: "6", points: 1 }, { prompt: "Write a multiplication sentence for your drawing.", answer: "3 × 2 = 6", points: 1 }] }],
    ["Division Practice", "Share objects equally and explain the groups.", "workmat", { questions: [{ prompt: "Share 8 counters equally between 2 groups. How many are in each group?", answer: "4", points: 1 }] }],
    ["Fraction Practice", "Represent equal parts using drawings.", "writing-sheet", questions("Draw a shape. Divide it into 2 equal parts and shade one part.", "What fraction did you shade?")],
    ["Shape Sort", "Sort shapes by a property pupils can explain.", "sorting-board", { metadata: { columnHeadings: ["Has corners", "Has no corners"] }, items: ["Circle", "Triangle", "Square", "Rectangle"], ...questions("Explain how you sorted the shapes.") }],
    ["Word Problem", "Separate what is known from what must be found.", "writing-sheet", { introText: "Maya has 4 pencils. Her friend gives her 2 more.", questions: [{ prompt: "How many pencils does Maya have now? Show your method.", answer: "6 pencils; 4 + 2 = 6.", points: 2 }] }],
  ]],
  ["science", "apply", "activity-lab", [
    ["Observation Sheet", "Record what pupils see, hear, or measure.", "experiment-sheet", { ...steps("Look closely at the chosen object.", "Record three details without guessing.", "Compare your notes with a partner."), ...questions("What did you observe?") }],
    ["Experiment Plan", "Plan a question, prediction, and fair comparison.", "experiment-sheet", { materials: ["Add teacher-approved materials"], ...steps("Write the question you want to investigate.", "Choose what to change and what to keep the same.", "Decide what you will observe or measure."), ...questions("What do you predict?") }],
    ["Experiment Results", "Organise observations and explain the result.", "comparison-table", { ...rows("What we changed", "What we observed", "First trial | Record the observation", "Second trial | Record the observation"), ...questions("What does the result show?") }],
    ["Prediction and Result", "Compare a prediction with the evidence collected.", "comparison-table", rows("My prediction", "What happened", "Before the activity | After the activity")],
    ["Materials List", "List equipment and quantities before an activity.", "comparison-table", rows("Material", "How many?", "Add a material | Add the quantity", "Add another material | Add the quantity")],
    ["Safety Rules", "Give short safety instructions before practical work.", "editorial", { items: ["Follow your teacher's instructions.", "Ask before using unfamiliar materials.", "Keep your work area clear.", "Wash your hands after the activity."], calloutText: "Stop and ask for help if you are unsure." }],
    ["Measurement Table", "Record repeated measurements with units.", "comparison-table", rows("Object or trial", "Measurement and unit", "Trial 1 | Record your measurement", "Trial 2 | Record your measurement", "Trial 3 | Record your measurement")],
    ["Nature Diary", "Observe a natural object and record changes over time.", "experiment-sheet", { items: ["Date and place", "Weather or surroundings", "What I noticed"], ...questions("Draw or describe one change since your last visit.") }],
    ["Science Drawing", "Draw an observation and add useful labels.", "experiment-sheet", { introText: "Draw what you can actually see. Add labels to the important parts.", ...questions("What does your drawing show?") }],
  ]],
  ["visuals", "learn", "concept-explanation", [
    ["Compare Two Ideas", "Compare two ideas using the same features.", "comparison-table", rows("First idea", "Second idea", "Feature 1 | Feature 1", "Feature 2 | Feature 2")],
    ["Before and After", "Show what changed and explain why.", "comparison-table", { ...rows("Before", "After", "Describe the starting state | Describe the change"), ...questions("What caused the change?") }],
    ["Sequence Pictures", "Organise pictures or descriptions in order.", "timeline", { items: ["First: add a picture or description", "Next: add a picture or description", "Last: add a picture or description"] }],
    ["Labeled Picture", "Pair a clear picture with its important labels.", "split", { items: ["Part 1: add its name", "Part 2: add its name", "Part 3: add its name"], footnote: "Replace the illustration with the picture you are teaching." }],
    ["Parts and Functions", "Link each part to what it does.", "comparison-table", rows("Part", "What it does", "Name a part | Explain its function", "Name another part | Explain its function")],
    ["Fact Table", "Arrange short facts for quick reference.", "comparison-table", rows("Topic", "Fact", "Topic 1 | Add a checked fact", "Topic 2 | Add a checked fact")],
    ["Step Chart", "Show a process in a clear sequence.", "timeline", { items: ["Step 1: what starts the process?", "Step 2: what happens next?", "Step 3: how does it finish?"] }],
    ["Blank Diagram", "Leave a drawing area for a pupil-made diagram.", "experiment-sheet", { introText: "Use the drawing space to show the main idea. Add arrows or labels where they help.", ...questions("Explain your diagram in one sentence.") }],
    ["Draw and Label", "Create a picture and label the important features.", "experiment-sheet", { ...steps("Draw the object or idea.", "Add clear labels.", "Check that each label points to the correct part.") }],
  ]],
  ["projects", "apply", "activity-lab", [
    ["Discussion Questions", "Give a group clear questions to discuss.", "conversation", { items: ["What do you think?", "What example supports your idea?", "Does everyone agree? Why?"] }],
    ["Interview Questions", "Prepare questions and record someone's answers.", "writing-sheet", questions("What would you like to ask?", "What did the person say?", "What did you learn?")],
    ["Survey Results", "Record responses and identify a pattern.", "comparison-table", { ...rows("Response", "Number of people", "Choice A | Record the count", "Choice B | Record the count", "Choice C | Record the count"), ...questions("Which response was most common?") }],
    ["Map Activity", "Use a map to find and explain locations.", "experiment-sheet", { introText: "Add a map or draw a simple map in the space provided.", ...questions("Mark two important places.", "Describe a route between them.") }],
    ["Role Play", "Explore an everyday situation by acting it out.", "conversation", { items: ["Person A: explain your situation.", "Person B: ask a helpful question.", "Together: suggest a solution."], ...questions("What did the conversation help you understand?") }],
    ["Research Task", "Find reliable information and explain its source.", "writing-sheet", questions("What do you want to find out?", "Which source did you use?", "What did you find? How did you check it?")],
    ["Group Roles", "Give every group member a clear responsibility.", "comparison-table", rows("Role", "Responsibility", "Organiser | Keep the task moving", "Recorder | Write down the group's ideas", "Presenter | Share the result", "Checker | Check the group's work")],
    ["Project Plan", "Plan a small project with materials, steps, and a result.", "experiment-sheet", { materials: ["List the materials for your project"], ...steps("Decide what you will make or investigate.", "Plan the steps and share the work.", "Complete the project and check the result."), ...questions("How will you know your project worked?") }],
    ["Presentation Plan", "Organise a short presentation that others can follow.", "timeline", { items: ["Beginning: introduce your topic", "Middle: explain two useful ideas", "Ending: share your conclusion"], ...questions("Which picture or example will help your audience?") }],
  ]],
  ["reflect", "reflect", "reflection", [
    ["Chapter Summary", "Summarise the main idea, example, and useful skill.", "editorial", { items: ["Main idea: add a short explanation", "Useful example: add one example", "Key skill: describe what pupils can now do"] }],
    ["Things to Remember", "Collect the most useful reminders from the chapter.", "editorial", { items: ["Remember the main idea.", "Check the steps in your method.", "Use an example to explain your answer."] }],
    ["Review Checklist", "Check readiness before the chapter test.", "confidence", { items: ["I have reviewed the new words.", "I can explain a solved example.", "I have corrected my mistakes.", "I know what I still need to practise."] }],
    ["Word Review", "Recall new words and use them in context.", "writing-sheet", questions("Write three new words from the chapter.", "Use one of them in a sentence.")],
    ["Skill Review", "Check which skills pupils can use independently.", "confidence", { items: ["I can begin a task without help.", "I can explain my method.", "I can check my own answer."] }],
    ["Mistake Review", "Correct a mistake and explain the better method.", "comparison-table", { ...rows("My first answer", "My corrected answer", "Write the original answer | Write the corrected answer"), ...questions("What will you do differently next time?") }],
    ["My Best Work", "Choose a piece of work and explain the progress it shows.", "writing-sheet", questions("Which piece of work are you proud of?", "What does it show you can do?", "What would you improve next?")],
    ["Teacher Feedback", "Give one strength and one clear next step.", "writing-sheet", questions("What is working well?", "What should the learner practise next?")],
    ["Parent Feedback", "Invite a short response to learning at home.", "writing-sheet", questions("What did your child explain or show you?", "What would help them practise at home?")],
  ]],
  ["master", "master", "assessment-mastery", [
    ["Multiple Choice Questions", "Check understanding using clearly separated options.", "editorial", { questions: [{ prompt: "Add a question with one correct answer.", options: ["Option A", "Option B", "Option C"], answer: "Add the correct option and a reason.", points: 1 }] }],
    ["True or False", "Check a statement and ask pupils to correct false statements.", "writing-sheet", { questions: [{ prompt: "Add a statement about the chapter.", options: ["True", "False"], answer: "Add the correct answer and correction if needed.", points: 1 }] }],
    ["Short Answer Questions", "Assess ideas using brief written answers.", "writing-sheet", questions("Explain the main idea in one or two sentences.", "Give an example from the chapter.")],
    ["Long Answer Questions", "Leave room for a detailed explanation and evidence.", "writing-sheet", { questions: [{ prompt: "Explain the idea, give an example, and show how you reached your answer.", points: 4 }], metadata: { answerLines: 6 } }],
    ["Matching Questions", "Match related terms and meanings in two columns.", "comparison-table", rows("Terms", "Meanings to match", "Term A | Meaning 1", "Term B | Meaning 2", "Term C | Meaning 3")],
    ["Fill in the Blanks", "Check a key word or number in a sentence.", "writing-sheet", questions("Complete the sentence: ________.", "Complete the number sentence: ________.")],
    ["Picture Questions", "Assess observation and explanation using a picture.", "visual-first", questions("Name one thing you see in the picture.", "Explain how the picture connects to the chapter.")],
    ["Oral Questions", "Check understanding through spoken responses.", "conversation", { items: ["Explain the main idea aloud.", "Give a familiar example.", "Answer one follow-up question."], footnote: "Teacher: record one strength and one next step." }],
    ["Exit Question", "Use one final question to check the lesson's main idea.", "question", questions("What is the most useful thing you learned today? Explain it with an example.")],
  ]],
];

export const ADDITIONAL_ELEMENTS: CurriculumBlockDefinition[] = groups.flatMap(([category, stage, archetype, entries]) => entries.map(([name, purpose, layout, content]) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name, category, stage, archetype, purpose,
  layouts: [...new Set<CurriculumLayout>([layout, "editorial", "steps", "notebook"])],
  tags: [category, stage, name.toLowerCase(), ...(category === "visuals" ? ["table", "chart", "diagram"] : [])], isNew: true,
  starterContent: { introText: undefined, items: undefined, steps: undefined, questions: undefined, calloutText: undefined, materials: undefined, ...content },
})));
