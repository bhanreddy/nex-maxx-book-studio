# Curriculum Block Engine

Open the existing Book Studio, then choose **New Chapter**. Select Class 1–5, a subject, chapter details, page style and chapter type. Review the live pages and create the chapter. Existing book pages are preserved, and generation is one undo action.

Generated chapters contain instructional placeholders. They are editable frameworks, not factual, curriculum-approved textbooks. Replace the prompts with authored teaching content or use the optional AI assistant and review its draft.

## Authoring

- **Learning Elements** contains 219 types: the original 147 stable IDs with simpler display names plus 72 new elements. Search by a common term or filter by six sections, Reading & Writing, Maths, Science, Pictures & Tables, Projects, Extra Learning, Online Resources or new elements. Every type has a real preview and compatible layouts.
- The chapter plan is **Start → Learn → Practice → Activities → Review → Test**. Start includes prior knowledge and goals; Practice includes reasoning; Review comes before Test. New chapters include subject-matched additions, such as Number Line and Word Problem for Maths or Observation Sheet and Experiment Plan for Science.
- **Chapter Plan** edits the actual chapter. Drag sections or elements, use keyboard-accessible reorder buttons, add/remove sections, change the page target or ask for more variation. Older eight-stage chapters display the simpler plan and can save it as one undoable change. Original element IDs and authored content remain intact.
- **Easy mode** protects free movement and resizing. Content, compatible layouts, palettes and conversion remain available.
- **Design mode** enables free placement, resizing, rotation and decoration gestures. Content/style edits preserve an individual block's pose when it still fits. Structural changes and overflow recompose the chapter.
- **Unlock into independent layers** converts the rendered scene to native text, images and shapes. Custom layers remain editable and retain their page order during reflow. Undo restores the original semantic block. Detached artwork is deliberately excluded from subsequent semantic layout switching.
- **Save as reusable template** stores a complete, isolated source. **My templates** in the Curriculum library inserts a new editable instance.
- **Remove chapter** deletes only that framework chapter and its pages in one undo action. Undo restores its semantic blocks and detached layers.

For example, switch Learning Goals from a simple list to Learning Steps: the outcomes and author title stay intact. Convert Quick Check into Chapter Test: question options, expected answers, marks, images and learning metadata survive.

## Canonical document and rendering

`Chapter.framework` stores a versioned `ChapterFramework`: the builder configuration, mode, ordered sections and canonical `SmartBlockInstance` records. Semantic content, curriculum metadata and presentation overrides are separate. Existing non-framework chapters remain valid.

`src/editor/curriculum/catalog.ts` supplies the named definitions and chapter presets. `additionalElements.ts` supplies the 72 new types and editable starter content. `frameworkPlan.ts` migrates older eight-stage plans to the six-section plan without changing element IDs. The existing educational registry includes all definitions, so native canvas insertion and export continue to use the established document model.

`chapterEngine.ts` measures blocks using the shared publication scene pipeline. It composes native `PageElement` projections, keeps stable source IDs and records `curriculum.sourceBlockId`. Continuations contain a presentation-only `sceneSlice`; the source retains the complete text, questions and answers.

`render.ts` provides 22 existing editorial and worksheet compositions, supplemented by 10 reusable teaching layouts in `teachingRenderer.ts`, including a two-column table, timeline, writing sheet, reading page, experiment sheet and sorting spaces. Canvas, miniature previews, native layer detachment and PDF export consume the same measured vector scenes. Grade tokens retain a minimum body size: 17, 15.5, 14, 13 and 12 points for Classes 1–5. Longer content expands and continues between text baselines instead of shrinking reading type. Teacher answers are omitted from student scenes.

`actions.ts` updates canonical records and their page projections together, with undo/redo snapshots. Mixed native/curriculum selections delete and duplicate canonical blocks correctly. Chapter composition preserves unrelated book pages, free objects and detached artwork.

UI chrome tokens and curriculum typography/colour tokens are separate. Layouts use subject palettes, geometry, activity composition and heading treatment. Paper patterns, soft gradients, editable vector decorations and image masks share native rendering infrastructure.

## Page intelligence and performance

Page targets are a minimum design target, not a hard content cap. The composer adds pages when content needs more room and fills requested additional pages with editable practice prompts. Generated pages are populated.

For example, a Class 1 chapter may require 13 pages against a 12-page target because of its larger reading type. A long explanation can continue over several pages while keeping its source text intact.

The workspace reports Light/Balanced/Dense/Overloaded from reading footprint, word count and overflow. The Structure panel warns about repeated adjacent compositions and offers a variation action. This is a practical heuristic, not an assessment of pedagogical quality.

The editor renders the active canvas. Library previews are memoized and progressively revealed. Page-strip previews use IntersectionObserver and per-element subscriptions; off-screen pages mount no scenes. Autosave coalesces updates for 250 ms and flushes on pagehide or hidden-tab transitions. Browser storage quota failures are reported without discarding in-memory work.

## Optional AI authoring

Copy `.env.example` to `.env.local`, set `OPENAI_API_KEY` and `OPENAI_CURRICULUM_MODEL`, and restart the server. Choose a model accessible to your account that supports [Responses structured output](https://developers.openai.com/api/docs/guides/structured-outputs). No default model is silently assumed, and no credential is exposed to the client.

**AI content** drafts the chapter; **AI Assist** drafts the selected block. The UI explains that selected text is sent to OpenAI. It displays returned explanations, key ideas, learning points, steps, question options, teacher answers and marks before **Apply reviewed draft**. Existing content is unchanged on request failure or dismissal.

`POST /api/curriculum-assist` requires a matching browser Origin. It validates requests and structured responses with Zod, requires exact block identities, limits input size, uses a 60-second timeout and permits six requests per minute per process/IP. Requests use `store: false`. Server credentials are required; missing configuration returns 503. Provider failures and incomplete output return actionable errors.

The endpoint follows the existing local application's trust model. A public multi-user deployment needs authentication, access controls and a shared rate limiter before exposing paid AI drafting. These protections are not supplied by a matching Origin header.

For example, request a simpler Class 1 explanation for one block and inspect its questions before applying. Or request a chapter draft using the saved outcomes and review every returned block.

## Validation

Run `npm run typecheck`, `npm test`, and `npm run build`. Use `NEX_BUILD_DIR=.next-curriculum-check npm run build` when a separate production build directory is needed while the development server runs.

The curriculum suite covers all 219 types and their compatible scenes; six-section chapter creation across the configured grade/subject combinations; migration of older eight-section chapters; the six worksheet layouts; populated page packing; long-text conservation; content-preserving switching/conversion; real tree updates; undo/redo; Easy/Design protections; detached layers and page order; image mask/crop preservation; isolated templates; mixed selections; autosave coalescing; 100-page generation; and mocked AI provider validation. A live AI draft still needs configured account credentials.

Browser checks cover custom subject input, Class 1 chapter generation, original-page preservation, editable outcomes, mission-path layout switching, and independent native layers. Rendered typography and editorial content still require author review before publication, especially for language scripts and authored illustrations.

The current PDF exporter uses built-in Times/Helvetica fonts. Custom font choices render in the editor, but exact custom typography and reliable Hindi/Telugu PDF text require embedded fonts and script shaping. The 100-page check verifies composition and populated pages; it does not establish 60 fps on a low-end device.

## Reusable teaching layouts

The catalog still contains 219 block types. Visual variations are layouts within those types, not additional types. The 10 new compositions are Picture Beside Text, Picture Above Text, Big Idea, Example Cards, Step by Step, Compare Two Things, Question Cards, Read and Answer, Activity Instructions, and Remember This.

Choose **Blocks & Elements → Choose a layout** to preview alternatives before inserting. Existing blocks have separate **Content**, **Layout**, and **Style** inspector tabs. The layout dialog stages changes locally; Apply commits the layout, palette, print mode, and appearance in one undoable change. Cancel does not change the book. The library remembers the last applied look for each type during the current session.

Appearance is stored in `styleOverrides.blockStyle`: Colourful, Calm, Storybook, or Classic. Colourful and Storybook use ribbon headings and softer panels; Calm and Classic reduce decoration. Grade typography continues to set minimum reading sizes. Reduced-ink mode removes decorative fills; grayscale transforms scene colours. Original uploaded illustrations remain independent image assets, and generated subject illustrations remain vector motif layers.

For example, an Explanation can use Picture Beside Text for Science or Example Cards for English. A Practice block can use Question Cards for History or Step by Step for Maths. Questions, teacher answers, steps, passages, and other canonical content remain intact when switching layouts. Content that does not belong in the primary arrangement flows below it.

`libraryExamples.ts` provides sample lessons for Maths, Science, English, History, Geography, Computer, Art, and Music; Social Studies and EVS share appropriate History and Science samples. Other subjects retain authoring prompts. The samples are starter content for the library. Chapter generation continues using the author's own configuration. The subject selector includes History, Geography, Art, and Music; the Custom option remains available in the chapter builder.

The teaching renderer consumes the same scene primitives as the existing SVG canvas, layer detachment, and export pipeline. It handles variable content lengths by growing the block rather than reducing the body font. The chapter composer continues long blocks using its existing pagination behavior; a card or illustration may span a page boundary and needs author review. Custom font shaping and complex-script PDF export retain the limitations described above.

Verification of this latest layout update was stopped at the user's request. No final test suite, production build, or final browser review was run after that instruction.
