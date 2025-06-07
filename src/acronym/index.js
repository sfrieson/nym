const openai = require("openai");
const { z } = require("zod");
const { zodTextFormat } = require("openai/helpers/zod");
const fs = require("fs/promises");
const path = require("path");

const meaningSchema = z.object({
  meaning: z.string(),
  explanation: z.string(),
});

const responseSchema = z.object({
  meanings: z.array(meaningSchema),
});

const format = zodTextFormat(responseSchema, "response");

/**
 * @param {string} text
 * @returns {z.infer<typeof responseSchema>}
 */
function parseResponse(text) {
  console.log(text);
  try {
    const json = JSON.parse(text);
    if (json.error) {
      throw new Error(json.error);
    }

    return responseSchema.parse(json);
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      throw new Error(`Failed to parse response: ${error.message}`);
    }
    throw error;
  }
}

exports.createAcronymController = async function () {
  const client = new openai.OpenAI();
  const basePrompt = await fs.readFile(
    path.join(__dirname, "base-prompt.txt"),
    "utf-8"
  );

  return {
    /**
     * @param {string} acronym
     * @returns {Promise<{} | any[]>}
     */
    async generateMeaning(acronym) {
      const response = await client.responses.create({
        model: "gpt-4.1-2025-04-14",
        instructions: basePrompt,
        input: `Please,create meanings for the following letters: ${acronym}`,
        text: { format },
      });
      return parseResponse(response.output_text);
    },
  };
};
