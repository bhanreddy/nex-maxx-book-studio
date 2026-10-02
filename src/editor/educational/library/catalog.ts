import type { EducationalBlockCategory, EducationalBlockDefinition, SmartBlockInstance } from '../../../domain/educational/blockSchema';

export const LESSON_STAGES = [
  ['start', 'Start a Lesson'], ['discover', 'Discover'], ['learn', 'Learn'],
  ['think', 'Think'], ['practice', 'Practice'], ['activity', 'Activities'], ['review', 'Review'],
] as const;
export type LessonStage = typeof LESSON_STAGES[number][0];
export type Composition = 'discovery' | 'burst' | 'outcomes' | 'banner' | 'reference' | 'connection' | 'opening' | 'question' | 'picture' | 'story' | 'situation' | 'observation' | 'prediction' | 'recall' | 'vocabulary' | 'formula' | 'solution' | 'activity' | 'comparison' | 'sequence' | 'review' | 'notice' | 'grid';
type Content = SmartBlockInstance['semanticContent'];
export interface LibraryEntry {
  type: string; title: string; stage: LessonStage; category: EducationalBlockCategory;
  composition: Composition; variants: string[]; aliases: string[]; content: Partial<Content>;
}
const entry = (type: string, title: string, stage: LessonStage, category: EducationalBlockCategory, composition: Composition, variants: string[], content: Partial<Content>, aliases: string[] = []): LibraryEntry => ({ type, title, stage, category, composition, variants, aliases, content });
const q = (prompt: string, answer?: string) => ({ prompt, ...(answer ? { answer } : {}) });
export const EDUCATIONAL_LIBRARY: LibraryEntry[] = [
  entry('do-you-know', 'Do You Know?', 'discover', 'facts-curiosity', 'discovery', ['editorial','visual-right','visual-left','compact','fact-spotlight'], {calloutText:'A googol is 1 followed by 100 zeros.',introText:'We use large numbers to describe distances, populations and even the stars.',footnote:'Tiny fact · Big discovery'}, ['did you know','discovery','fact']),
  entry('fun-fact', 'Fun Fact', 'discover', 'fact-burst', 'burst', ['fun-fact','wow','amazing','quick-fact','surprise'], {calloutText:'An octopus has three hearts.',introText:'Two pump blood to the gills. One pumps it to the rest of the body.'}, ['wow','amazing','surprise fact']),
  entry('learning-outcomes', 'Learning Outcomes', 'learn', 'learning-outcomes', 'outcomes', ['standard-list','progress-path','numbered','compact'], {subtitle:'By the end of this lesson, I can…',items:['Identify the place of each digit.','Explain how its position changes its value.','Write numbers in expanded form.','Apply place value to everyday prices.']}, ['objectives','targets','i can']),
  entry('topic-banner', 'Topic Banner', 'learn', 'section-heading', 'banner', ['horizontal','editorial','number-led','illustration-led','minimal'], {chapterNumber:'03',subtitle:'PLACE VALUE',introText:'Understanding how digits change value'}, ['section divider','heading']),
  entry('fact-zone', 'Fact Zone', 'discover', 'data-interpretation', 'reference', ['statistic','definition','compact'], {calloutText:'100 centimetres = 1 metre',introText:'A metre is divided into 100 equal centimetres.'}, ['data','conversion','reference']),
  entry('life-connect', 'Life Connect', 'discover', 'real-world-connect', 'connection', ['visual-right','visual-left','full-width'], {subtitle:'IN REAL LIFE',introText:'A shopkeeper uses place value every day while reading prices and counting money.',questions:[q('Where do you see numbers in your neighbourhood?')]}, ['daily life','application','shop','market']),
  entry('opening-question', 'Before We Begin…', 'start', 'essential-question', 'opening', ['editorial','visual-right','digit-led','compact'], {calloutText:'What is the largest number you can make using these digits?',items:['4','8','2','7']}, ['opening question','lesson starter']),
  entry('ask-a-question', 'Ask a Question', 'think', 'critical-thinking', 'question', ['quick-question','discuss','think','pair-discussion','teacher-prompt'], {questions:[q('Why does the same digit have a different value when it moves?')],hint:'Try moving 4 from the ones place to the tens place.'}, ['question','prompt','discussion']),
  entry('picture-question', 'Picture Question', 'think', 'visual-reasoning', 'picture', ['one-image','comparison','image-grid','overlay'], {subtitle:'LOOK CLOSELY',questions:[q('What do you notice?'),q('Which shapes can you identify?'),q('How could you sort these objects?')]}, ['image','photo','look closely','picture']),
  entry('opening-story', 'Opening Story', 'start', 'reading-response', 'story', ['illustrated','full-width','conversation','short-story'], {subtitle:'A place for every digit',passage:'Mira placed four number cards on her desk. She moved a 4 from the ones place to the thousands place. The digit looked the same, but the number changed. She paused, then smiled. Every place tells a different story.',quote:'“The position matters,” said Mira.'}, ['story','reading','narrative']),
  entry('everyday-situation', 'Everyday Situation', 'start', 'case-study', 'situation', ['shopping','travel','classroom','home'], {introText:'Riya has ₹500. She buys a notebook for ₹135 and a pencil box for ₹210.',questions:[q('How much money remains?','₹155')]}, ['scenario','shopping','cooking','weather']),
  entry('look-and-tell', 'Look & Tell', 'start', 'diagram-study', 'picture', ['panorama','comparison','image-grid'], {subtitle:'OBSERVE & DESCRIBE',questions:[q('What objects can you identify?'),q('What shapes can you see?')]}, ['look and tell','observation']),
  entry('what-do-you-notice', 'What Do You Notice?', 'discover', 'visual-reasoning', 'observation', ['pattern','visual-right','compact'], {calloutText:'12, 24, 36, 48, __',questions:[q('What pattern can you find?','Add 12 each time. The next number is 60.')]}, ['pattern','investigate','did you notice']),
  entry('make-a-guess', 'Make a Guess', 'start', 'investigation', 'prediction', ['thought-path','visual-right','reveal'], {calloutText:'Which object do you think is heavier?',hint:'Compare their size and what they are made of.',prediction:'My prediction:',reveal:'Measure both objects using the same balance. Was your prediction supported?'}, ['predict','guess','reveal']),
  entry('prior-knowledge', 'What Do You Already Know?', 'start', 'prerequisites', 'recall', ['checklist','mini-quiz','mind-map','recall-bubbles'], {subtitle:'Before learning this topic…',items:['I remember how to read a three-digit number.','I have seen numbers on price labels.','I can already compare two numbers.']}, ['what you know','recall','prior knowledge']),
  entry('new-words', 'Words to Know', 'learn', 'vocabulary', 'vocabulary', ['dictionary','strip','word-wall','picture-vocabulary'], {vocabulary:[{word:'Habitat',pronunciation:'/ha-bi-tat/',meaning:'The natural home of a plant or animal.',example:'A pond is a habitat for frogs.'},{word:'Observe',pronunciation:'/ob-zerv/',meaning:'To look carefully and notice details.',example:'Observe the shape of each leaf.'}]}, ['new words','vocabulary','dictionary','word']),
  entry('formula-focus', 'Formula Focus', 'learn', 'concept-explanation', 'formula', ['diagram-right','expression-led','compact'], {subtitle:'Area of a rectangle',formula:{expression:'A = l × b',variables:['A: area','l: length','b: breadth'],units:'Area is measured in square units.',diagram:'rectangle'},introText:'For a rectangle 6 cm long and 4 cm wide: A = 6 × 4 = 24 cm².'}, ['new formula','math','equation','notation']),
  entry('solved-example', 'Solved Example', 'practice', 'worked-examples', 'solution', ['step-by-step','method-left','visual-maths','shortcut'], {chapterNumber:'04',subtitle:'Write 4,582 in expanded form.',introText:'Method: identify each digit’s place and write its value.',steps:[{stepNumber:1,title:'Identify',body:'4 thousands, 5 hundreds, 8 tens and 2 ones.'},{stepNumber:2,title:'Expand',body:'4,000 + 500 + 80 + 2'},{stepNumber:3,title:'Verify',body:'Add the values to rebuild 4,582.'}],finalAnswer:'4,582 = 4,000 + 500 + 80 + 2'}, ['worked example','reasoning','solution','steps']),
];
const essentials: Array<[string,string,LessonStage,EducationalBlockCategory,Composition]> = [
 ['remember','Remember','learn','study-skills','notice'],['quick-check','Quick Check','practice','quick-check','question'],['try-it-yourself','Try It Yourself','practice','guided-practice','question'],['practice-time','Practice Time','practice','exercises','question'],['think-and-answer','Think & Answer','think','critical-thinking','question'],['discuss','Discuss','think','collaboration','connection'],['pair-and-share','Pair & Share','think','partner-activity','sequence'],['challenge','Challenge','think','extension','prediction'],['brain-booster','Brain Booster','think','critical-thinking','observation'],['hots','HOTS','think','critical-thinking','question'],['mental-maths','Mental Maths','practice','mental-maths','question'],['activity','Activity','activity','activity-lab','activity'],['experiment','Experiment','activity','investigation','activity'],['project','Project','activity','projects','activity'],['explore','Explore','discover','ai-explore','connection'],['observe','Observe','activity','diagram-study','picture'],['compare','Compare','activity','concept-comparison','comparison'],['analyse','Analyse','think','data-interpretation','reference'],['reflect','Reflect','review','reflection','review'],['key-idea','Key Idea','learn','concept-discovery','reference'],['important','Important','learn','study-skills','notice'],['note','Note','learn','study-skills','notice'],['warning','Warning','activity','common-mistakes','notice'],['tip','Tip','learn','study-skills','notice'],['shortcut','Shortcut','practice','study-skills','sequence'],['common-mistake','Common Mistake','learn','common-mistakes','comparison'],['did-you-notice','Did You Notice?','discover','visual-reasoning','observation'],['think-deeper','Think Deeper','think','critical-thinking','opening'],['concept-check','Concept Check','practice','quick-check','question'],['worked-example','Worked Example','practice','worked-examples','solution'],['practice-example','Practice Example','practice','guided-practice','solution'],['recap','Recap','review','revision-recap','review'],['summary','Summary','review','revision-recap','reference'],['key-takeaways','Key Takeaways','review','revision-recap','review'],['chapter-review','Chapter Review','review','assessment-mastery','question'],['self-assessment','Self Assessment','review','self-assessment','outcomes'],['checklist','Checklist','review','self-assessment','recall'],['match-the-following','Match the Following','practice','exercises','comparison'],['fill-in-the-blanks','Fill in the Blanks','practice','exercises','question'],['true-false','True / False','practice','exercises','question'],['multiple-choice','Multiple Choice','practice','quick-check','question'],['puzzle','Puzzle','practice','puzzles-fun','observation'],['riddle','Riddle','think','puzzles-fun','opening'],['word-search','Word Search','practice','puzzles-fun','grid'],['crossword','Crossword','practice','puzzles-fun','grid'],['number-puzzle','Number Puzzle','practice','puzzles-fun','grid'],['diagram-labeling','Diagram Labeling','activity','diagram-study','picture'],['timeline','Timeline','learn','section-heading','sequence'],['process','Process','learn','concept-explanation','sequence'],['sequence','Sequence','learn','concept-explanation','sequence'],['compare-contrast','Compare & Contrast','think','concept-comparison','comparison'],['before-after','Before / After','think','concept-comparison','comparison'],['then-now','Then / Now','learn','cross-subject','comparison'],['cause-effect','Cause / Effect','learn','concept-comparison','comparison'],['definition','Definition','learn','vocabulary','reference'],['rule','Rule','learn','concept-explanation','reference'],['theorem-property','Theorem / Property','learn','concept-explanation','reference'],['formula','Formula','learn','concept-explanation','formula'],['vocabulary','Vocabulary','learn','vocabulary','vocabulary'],['example','Example','learn','concept-explanation','reference'],['counterexample','Counterexample','think','concept-explanation','comparison'],['teacher-note','Teacher Note','review','home-learning','notice'],['parent-connect','Parent Connect','review','home-learning','connection'],
];
function essentialContent(type: string, composition: Composition): Partial<Content> {
 if (type==='worked-example'||type==='practice-example') return {...EDUCATIONAL_LIBRARY.find(e=>e.type==='solved-example')!.content};
 if (composition==='formula') return {...EDUCATIONAL_LIBRARY.find(e=>e.type==='formula-focus')!.content};
 if (composition==='vocabulary') return {...EDUCATIONAL_LIBRARY.find(e=>e.type==='new-words')!.content};
 const specific: Record<string,Partial<Content>> = {
  'multiple-choice':{questions:[{prompt:'What is the value of 5 in 4,582?',options:['5','50','500','5,000'],answer:'500'}]},
  'fill-in-the-blanks':{questions:[q('4,582 = 4,000 + ____ + 80 + 2','500')]},
  'true-false':{questions:[{prompt:'The 5 in 4,582 represents 50.',options:['True','False'],answer:'False'}]},
  'match-the-following':{comparison:{leftLabel:'Number',rightLabel:'Number name',left:['120','305','450'],right:['Four hundred fifty','One hundred twenty','Three hundred five']}},
  'common-mistake':{comparison:{leftLabel:'The slip',rightLabel:'The correction',left:['The 5 in 5,204 has a value of 500.'],right:['The 5 is in the thousands place. Its value is 5,000.']}},
  'warning':{introText:'Ask an adult before touching electrical equipment. Keep liquids away from sockets.'},
  'riddle':{calloutText:'I am a three-digit number. My hundreds digit is 4. My tens and ones digits are 2. Who am I?',questions:[q('Explain your answer.','422')]},
  'word-search':{grid:{rows:['PLANT','LAEOR','ENATR','AFROE','FTREE'],clues:['Find PLANT, LEAF and TREE.']}},
  'crossword':{grid:{rows:['P####','L####','A####','N####','T____'],clues:['Down 1: A living thing with roots and leaves (5).','Across 2: A large plant with a trunk (4).'],solution:['P####','L####','A####','N####','TREE#']}},
  'number-puzzle':{grid:{rows:['2_6','_5_','4_8'],clues:['Fill the blanks so each row and column totals 15.'],solution:['276','951','438']}},
  'timeline':{items:['Morning: the seed is planted.','Day 3: a root appears.','Day 7: the first leaves open.']},
  'cause-effect':{comparison:{leftLabel:'Cause',rightLabel:'Effect',left:['A plant receives no water.'],right:['Its leaves wilt.']}},
  'before-after':{comparison:{leftLabel:'Before',rightLabel:'After',left:['An ice cube is solid.'],right:['It melts into liquid water.']}},
  'then-now':{comparison:{leftLabel:'Then',rightLabel:'Now',left:['Letters travelled by post.'],right:['Messages can travel online.']}},
  'definition':{calloutText:'Place value',introText:'The value a digit represents because of its position in a number.'},
  'rule':{calloutText:'Moving one place left multiplies a digit’s value by 10.',introText:'Compare the value of 4 in 40 and 400.'},
  'theorem-property':{calloutText:'Commutative property of addition',introText:'Changing the order of two numbers does not change their sum: 3 + 5 = 5 + 3.'},
  'counterexample':{comparison:{leftLabel:'Claim',rightLabel:'Counterexample',left:['Adding always makes a number larger.'],right:['5 + 0 = 5. The number stays the same.']}},
  'mental-maths':{questions:[q('49 + 36 = ?','85'),q('25 × 16 = ?','400'),q('999 + 101 = ?','1,100')]},
  'teacher-note':{introText:'Ask students to explain their method before sharing the answer. Listen for place-value language.'},
  'parent-connect':{introText:'Read three prices together at home. Ask your child to explain the value of each digit.'},
 };
 if(specific[type]) return specific[type];
 if(composition==='activity') return {subtitle:'Measure, record and explain',materials:['Ruler','Paper','Pencil'],steps:[{stepNumber:1,title:'Predict',body:'Which classroom object is longest?'},{stepNumber:2,title:'Investigate',body:'Measure three objects using the same unit.'},{stepNumber:3,title:'Explain',body:'Compare your results with your prediction.'}],footnote:'Reflect: what would you change next time?'};
 if(composition==='comparison') return {comparison:{leftLabel:'Similarities',rightLabel:'Differences',left:['Both objects have a flat surface.'],right:['One has straight edges; the other is curved.']}};
 if(composition==='outcomes'||composition==='recall'||composition==='review') return {items:['I can explain the idea in my own words.','I can show an example.','My next step is to practise…']};
 if(composition==='sequence') return {items:['Notice the information you have.','Choose a method and explain it.','Check the result using another method.']};
 if(composition==='notice') return {introText:'Read a number from left to right. Name each digit’s place before writing its value.'};
 if(composition==='reference') return {calloutText:'Every digit has a place.',introText:'The value of a digit depends on its position in a number.'};
 return {questions:[q('How could you represent 4,582 in two different ways?')],hint:'Try a drawing and an expanded form.'};
}
EDUCATIONAL_LIBRARY.push(...essentials.map(([type,title,stage,category,composition])=>entry(type,title,stage,category,composition,['standard','compact'],essentialContent(type,composition),[type.replaceAll('-',' ')])));
const COMPOSITION_DESCRIPTIONS: Record<Composition, string> = {
 discovery: 'An illustrated fact with room for a short explanation.',
 burst: 'A surprising fact made easy to spot and remember.',
 outcomes: 'Clear learning goals students can follow and check.',
 banner: 'Give each topic a clear title, number and visual identity.',
 reference: 'Make a definition, statistic or rule stand out.',
 connection: 'Connect a lesson to familiar places and everyday choices.',
 opening: 'Start a lesson with a question that invites thinking.',
 question: 'A focused prompt with space to work or discuss.',
 picture: 'Observe an image, answer questions and explain what you see.',
 story: 'An illustrated story with a reading passage and featured quote.',
 situation: 'Turn a familiar situation into a practical problem.',
 observation: 'Notice details, find patterns and explain your observations.',
 prediction: 'Make a prediction, test it and reflect on the result.',
 recall: 'Bring prior knowledge into the next lesson.',
 vocabulary: 'Teach a word through its meaning, pronunciation and example.',
 formula: 'Present a formula with a diagram and its key variables.',
 solution: 'Guide students from the problem through each step to the answer.',
 activity: 'A practical task with materials, clear steps and reflection.',
 comparison: 'Compare two ideas with clear similarities and differences.',
 sequence: 'Show events or steps in an easy-to-follow order.',
 review: 'Help students check understanding and choose their next step.',
 notice: 'Give a useful reminder or instruction its own space.',
 grid: 'An editable puzzle grid with supporting clues.',
};
export const LIBRARY_BY_TYPE = Object.fromEntries(EDUCATIONAL_LIBRARY.map(item=>[item.type,item]));
export const EDUCATIONAL_LIBRARY_BLOCKS: Record<string,EducationalBlockDefinition> = Object.fromEntries(EDUCATIONAL_LIBRARY.flatMap(item=>item.variants.map(variant=>{
 const id=`edu-${item.type}-${variant}`;
 const content:Content={title:item.title,...item.content};
 return [id, {id,educationalType:item.type,lessonStage:item.stage,archetypeId:item.category,category:item.category,version:4,collectionVersion:4,name:`${item.title} · ${variant.replaceAll('-',' ')}`,description:COMPOSITION_DESCRIPTIONS[item.composition],family:'nex-editorial',supportedSubjects:item.composition==='formula'?['mathematics']:['general'],supportedGrades:['primary-upper','primary-lower','early-years','middle-school','secondary-plus'],tags:[item.title,item.type,item.stage,...item.aliases],minDimensions:{widthPt:180,heightPt:60},defaultDimensions:{widthPt:480,heightPt:180},reflowRules:{layoutVariant:variant,verticalGrowthStrategy:'expand-container'},defaultBackgroundStyle:{type:'none'},slots:Object.entries(content).map(([slotId,defaultContent])=>({slotId,label:slotId,type:['items','materials'].includes(slotId)?'item-list':slotId==='steps'?'steps-list':'text',required:slotId==='title',defaultContent}))} satisfies EducationalBlockDefinition];
})));
export function libraryEntry(presetId:string):LibraryEntry|undefined { const def=EDUCATIONAL_LIBRARY_BLOCKS[presetId]; return def?.educationalType ? LIBRARY_BY_TYPE[def.educationalType] : undefined; }
export const RECOMMENDED_BLOCK_IDS=['edu-do-you-know-visual-right','edu-opening-question-digit-led','edu-learning-outcomes-progress-path','edu-life-connect-visual-left','edu-topic-banner-illustration-led','edu-solved-example-step-by-step'];
