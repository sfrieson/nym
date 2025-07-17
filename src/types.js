const { z } = require("zod");

// Core domain types
const meaningSchema = z.object({
  meaning: z.string(),
  explanation: z.string(),
});

const responseMultiSchema = z.object({
  meanings: z.array(meaningSchema),
});
const responseMultiSchemaWithScratchPad = z.object({
  scratchPad: z
    .string()
    .describe("A private place to write your thoughts, previous drafts, etc."),
  meanings: z.array(meaningSchema),
});

const responseSingleSchema = z.object({
  scratchPad: z
    .string()
    .describe("A private place to write your thoughts, previous drafts, etc."),
  meaning: meaningSchema,
});

// Type exports for JSDoc usage
/**
 * @typedef {z.infer<typeof meaningSchema>} Meaning
 * @typedef {z.infer<typeof responseMultiSchema>} MultiMeaningResponse
 * @typedef {z.infer<typeof responseSingleSchema>} SingleMeaningResponse
 * @typedef {{ acronym: string, meanings: Meaning[] }} AcronymMultiResponse
 * @typedef {{ acronym: string, meaning: Meaning }} AcronymSingleResponse
 */

module.exports = {
  meaningSchema,
  responseMultiSchema,
  responseSingleSchema,
  responseMultiSchemaWithScratchPad,
};
