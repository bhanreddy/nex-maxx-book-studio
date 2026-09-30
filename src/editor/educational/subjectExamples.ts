import type { SmartBlockInstance, SubjectDomain } from "../../domain/educational/blockSchema";

const examples: Record<SubjectDomain, { topic: string; question: string; items: string[]; palette: string }> = {
  mathematics: { topic:"Patterns all around us", question:"How can a pattern help us predict what comes next?", items:["Notice a repeating shape or number pattern.","Describe its rule in your own words.","Create a new pattern and explain your rule."], palette:"indigo" },
  science: { topic:"The secret life of plants", question:"What evidence tells us what a plant needs?", items:["Observe the roots, stem, and leaves.","Compare two plants and record the differences.","Explain how each part helps the plant survive."], palette:"forest" },
  english: { topic:"A story worth telling", question:"How does a writer make a character feel real?", items:["Find a detail that reveals the character's feelings.","Describe the setting using sensory words.","Write a different ending and explain your choice."], palette:"plum" },
  "social-studies": { topic:"Our place in the world", question:"How do places and people shape one another?", items:["Locate a community on a map and identify a landmark.","Compare how people lived in the past and live today.","Use a source to explain a change in the community."], palette:"marigold" },
  environmental: { topic:"Every drop matters", question:"How can we care for the water we share?", items:["Observe where water is used at school.","Record one way water is wasted and one way it is saved.","Design a small change and explain how it helps."], palette:"ocean" },
  "computer-science": { topic:"Think like a designer", question:"How can clear instructions solve a problem?", items:["Break an everyday task into smaller steps.","Put the instructions in a logical order.","Test the sequence with a partner and improve it."], palette:"cobalt" },
  "early-learning": { topic:"Look, listen, wonder", question:"What can you discover with your senses?", items:["Find something soft and something smooth.","Listen carefully and describe a sound.","Draw something that made you curious."], palette:"apricot" },
  general: { topic:"Ideas, sounds & stories", question:"How can you express the same idea in a different way?", items:["Notice a colour, sound, movement, or detail.","Explore two ways to express your idea.","Create something of your own and describe your choices."], palette:"plum" },
};

/** Only used when inserting a new starter; never replaces an author's existing text. */
export function withSubjectExample(block: SmartBlockInstance, subject: SubjectDomain): SmartBlockInstance {
  const ex=examples[subject], c=block.semanticContent;
  return {...block,subject,styleOverrides:{...block.styleOverrides,paletteId:ex.palette},semanticContent:{
    title:ex.topic,unitBadge:"NOTICE • CONNECT • CREATE",subtitle:ex.question,
    ...(c.introText?{introText:"Explore the idea, gather examples, and explain what you discover."}:{}),
    ...(c.items?{items:[...ex.items]}:{}),
    ...(c.calloutText?{calloutText:ex.question}:{}),
    ...(c.steps?{steps:ex.items.map((body,i)=>({stepNumber:i+1,title:["Explore","Connect","Create"][i],body}))}:{}),
    ...(c.questions?{questions:ex.items.map(prompt=>({prompt,answer:"Accept a response supported by relevant examples."}))}:{}),
    ...(c.materials?{materials:["Paper","Pencil","A reference or example for your topic"]}:{}),
    ...(c.passage?{passage:"A small discovery can begin with a careful look. When we notice a detail, ask a question, and compare ideas, we start to understand the world in a new way."}:{}),
    ...(c.chapterNumber?{chapterNumber:c.chapterNumber}:{}),
    footnote:"Reflect · What did you discover? Show your thinking in words, pictures, or a demonstration.",
  }};
}
