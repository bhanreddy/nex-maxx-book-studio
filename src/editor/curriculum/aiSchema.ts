import { z } from "zod";
export const aiContentSchema = z.object({
  title: z.string().min(1).max(240), introText: z.string().max(12000), calloutText: z.string().max(2000),
  items: z.array(z.string().max(2000)).max(30),
  questions: z.array(z.object({ prompt: z.string().max(3000), options: z.array(z.string().max(1000)).max(8), answer: z.string().max(3000), points: z.number().min(0).max(100) })).max(30),
  steps: z.array(z.object({ stepNumber: z.number().int().min(1), title: z.string().max(200), body: z.string().max(3000) })).max(20),
});
export const aiResultSchema = z.object({ blocks: z.array(z.object({ id: z.string(), content: aiContentSchema })).min(1).max(100) });
export type AiCurriculumResult = z.infer<typeof aiResultSchema>;
export const AI_CONTENT_JSON_SCHEMA = {
  type: "object", additionalProperties: false, required: ["blocks"], properties: { blocks: { type: "array", items: {
    type: "object", additionalProperties: false, required: ["id", "content"], properties: { id: { type: "string" }, content: {
      type: "object", additionalProperties: false, required: ["title", "introText", "calloutText", "items", "questions", "steps"], properties: {
        title: { type: "string" }, introText: { type: "string" }, calloutText: { type: "string" }, items: { type: "array", items: { type: "string" } },
        questions: { type: "array", items: { type: "object", additionalProperties: false, required: ["prompt", "options", "answer", "points"], properties: { prompt: { type: "string" }, options: { type: "array", items: { type: "string" } }, answer: { type: "string" }, points: { type: "number" } } } },
        steps: { type: "array", items: { type: "object", additionalProperties: false, required: ["stepNumber", "title", "body"], properties: { stepNumber: { type: "integer" }, title: { type: "string" }, body: { type: "string" } } } },
      },
    } },
  } } },
};
