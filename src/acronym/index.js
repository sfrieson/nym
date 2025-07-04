const openai = require("openai");
const { zodTextFormat } = require("openai/helpers/zod");
const fs = require("fs/promises");
const path = require("path");
const {
  meaningSchema,
  responseMultiSchema,
  responseSingleSchema,
  responseMultiSchemaWithScratchPad,
} = require("../types");

const singleMeaningFormat = zodTextFormat(responseSingleSchema, "response");
const multiMeaningFormat = zodTextFormat(responseMultiSchema, "response");
const multiMeaningFormatWithScratchPad = zodTextFormat(
  responseMultiSchemaWithScratchPad,
  "response"
);

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
  const llm = await createLLMClient();

  return {
    /**
     * @param {string} acronym
     * @returns {Promise<import('../types').AcronymMultiResponse>}
     */
    async generateMeanings(acronym) {
      const meanings = await llm.generateSeveralMeaningsScrachPadPreThought(
        acronym
      );

      return {
        acronym,
        meanings,
      };
    },

    /**
     * @param {string} acronym
     * @returns {Promise<import('../types').AcronymSingleResponse>}
     */
    async generateMeaning(acronym) {
      const meaning = await llm.generateOneMeaning(acronym);

      return {
        acronym,
        meaning,
      };
    },
  };
};

const createLLMClient = async () => {
  const client = new openai.OpenAI();
  const basePrompt = await fs.readFile(
    path.join(__dirname, "base-prompt-2.txt"),
    "utf-8"
  );
  return {
    /**
     *
     * @param {string} acronym
     * @returns {Promise<{ meaning: string, explanation: string }[]>}
     */
    generateSeveralMeanings: async (acronym) => {
      const input = `Please come up with a few possible meanings for the following letters: ${acronym}. Avoid common/overused words and aim for creative variety. Please provide 5-10 meanings.`;
      const response = await client.responses.create({
        model: "gpt-4.1-2025-04-14",
        instructions: basePrompt,
        input,
        temperature: 0.9,
        top_p: 0.8,
        store: false,
        text: { format: multiMeaningFormat },
      });

      return parseMultiResponse(response.output_text).meanings;
    },
    /**
     *
     * @param {string} acronym
     * @returns {Promise<{ meaning: string, explanation: string }[]>}
     */
    generateSeveralMeaningsScrachPad: async (acronym) => {
      const input = `Please come up with a few possible meanings for the following letters: ${acronym}. Avoid common/overused words and aim for creative variety. Please provide 5-10 meanings.`;
      const response = await client.responses.create({
        model: "gpt-4.1-2025-04-14",
        instructions: basePrompt,
        input,
        temperature: 0.9,
        top_p: 0.8,
        store: false,
        text: { format: multiMeaningFormatWithScratchPad },
      });
      console.log({ response });

      return parseMultiResponse(response.output_text).meanings;
    },
    /**
     *
     * @param {string} acronym
     * @returns {Promise<{ meaning: string, explanation: string }[]>}
     */
    generateSeveralMeaningsScrachPadPreThought: async (acronym) => {
      const input = `I would like you to come up with a 5-10 possible meanings for the following letters: ${acronym}.

Take your time in coming up with truly great, funny acronym. Feel free to brainstorm sets of words for each letter to help you find truly great ones and see how they will play with eachother.
Also think about different industries/intrests groups words like: sales, tech, gamers, parents, sports, shopping, and more. Anything to make a funny, relateable acronym.
As you draft self-critique your choices and iterate. You don't have to use your first draft choices in your final results.
Have fun and make some great zingers!`;
      const response = await client.responses.create({
        model: "gpt-4.1-2025-04-14",
        instructions: basePrompt,
        input,
        temperature: 0.9,
        top_p: 0.8,
        store: false,
        text: { format: multiMeaningFormatWithScratchPad },
      });
      console.log({ response });

      return parseMultiResponse(response.output_text).meanings;
    },
    /**
     *
     * @param {string} acronym
     * @returns {Promise<{ meaning: string, explanation: string }>}
     */
    async generateOneMeaning(acronym) {
      const response = await client.responses.create({
        model: "gpt-4.1-2025-04-14",
        instructions: basePrompt,
        input: `Please come up with a random possible meaning for the following letters: ${acronym}. Avoid common/overused words and aim for creative variety.`,
        temperature: 0.9,
        top_p: 0.8,
        store: false,
        text: { format: singleMeaningFormat },
      });

      return parseSingleResponse(response.output_text).meaning;
    },
  };
};
