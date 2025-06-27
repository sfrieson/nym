const openai = require("openai");
const { zodTextFormat } = require("openai/helpers/zod");
const fs = require("fs/promises");
const path = require("path");
const { meaningSchema, responseMultiSchema, responseSingleSchema } = require("../types");

const singleMeaningFormat = zodTextFormat(responseSingleSchema, "response");
const multiMeaningFormat = zodTextFormat(responseMultiSchema, "response");

/**
 * @param {string} text
 * @returns {import('../types').MultiMeaningResponse}
 */
function parseMultiResponse(text) {
  console.log(text);
  try {
    const json = JSON.parse(text);
    if (json.error) {
      throw new Error(json.error);
    }

    return responseMultiSchema.parse(json);
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      throw new Error(`Failed to parse response: ${error.message}`);
    }
    throw error;
  }
}

/**
 * @param {string} text
 * @returns {import('../types').SingleMeaningResponse}
 */
function parseSingleResponse(text) {
  console.log(text);
  try {
    const json = JSON.parse(text);
    if (json.error) {
      throw new Error(json.error);
    }

    return responseSingleSchema.parse(json);
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
    path.join(__dirname, "base-prompt-2.txt"),
    "utf-8"
  );

  return {
    /**
     * @param {string} acronym
     * @returns {Promise<import('../types').AcronymMultiResponse>}
     */
    async generateMeanings(acronym) {
      const response = await client.responses.create({
        model: "gpt-4.1-2025-04-14",
        instructions: basePrompt,
        input: `Please come up with a few possible meanings for the following letters: ${acronym}. Avoid common/overused words and aim for creative variety. Please provide 5-10 meanings.`,
        temperature: 0.9,
        top_p: 0.8,
        store: false,
        text: { format: multiMeaningFormat },
      });

      // const response = await client.responses.create({
      //   model: "gpt-4.1-nano-2025-04-14",
      //   instructions:
      //     "You are a data input specialist. You are reading the notes from a meeting about a possible meanings for an acronym. You are to accurately extract and format the list meanings from the notes.",
      //   input: thoughtfulResponse.output_text,
      //   text: { format },
      // });

      return {
        acronym,
        meanings: parseMultiResponse(response.output_text).meanings,
      };
    },

    /**
     * @param {string} acronym
     * @returns {Promise<import('../types').AcronymSingleResponse>}
     */
    async generateMeaning(acronym) {
      const response = await client.responses.create({
        model: "gpt-4.1-2025-04-14",
        instructions: basePrompt,
        input: `Please come up with a random possible meaning for the following letters: ${acronym}. Avoid common/overused words and aim for creative variety.`,
        temperature: 0.9,
        top_p: 0.8,
        store: false,
        text: { format: singleMeaningFormat },
      });

      return {
        acronym,
        meaning: parseSingleResponse(response.output_text).meaning,
      };
    },
  };
};
