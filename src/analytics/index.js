const { expect } = require("../util.js");

/**
 * @type {import("posthog-node").PostHog | undefined}
 */
let client;

function init() {
  const disabled = process.env.POSTHOG_DISABLED === "true";
  const apiKey = expect(
    process.env.POSTHOG_API_KEY,
    "POSTHOG_API_KEY is not set"
  );

  // Lazily load posthog-node so it stays off the cold-start path.
  const getClient = () => {
    if (!client) {
      const { PostHog } = require("posthog-node");
      client = new PostHog(apiKey, {
        host: "https://us.i.posthog.com",
        disabled,
      });
    }
    return client;
  };

  return {
    shutdown: async () => {
      if (client) await client.shutdown();
    },
    /**
     *
     * @param {Record<string, any>} properties
     * @returns
     */
    createRequestClient: (properties = {}) => {
      let ctx = { ...properties };
      return {
        /**
         * @param {string} event
         * @param {Record<string, any>} properties
         */
        track: (
          event,
          {
            userId = ctx.userId ?? "anonymous",
            distinctId = ctx.distinctId ?? userId,
            ...properties
          } = ctx
        ) => {
          if (distinctId === "opt-out") return;
          if (disabled) {
            console.log("🐽", event, { distinctId }, properties);
          }

          getClient().capture({
            event,
            distinctId,
            properties: { ...ctx, ...properties },
          });
        },
        /**
         * @param {Record<string, any>} properties
         * @param {boolean} overwrite
         */
        update: (properties, overwrite = false) => {
          if (overwrite) {
            ctx = { properties };
          } else {
            ctx = Object.assign(ctx, properties);
          }
        },
      };
    },
  };
}

/**
 * @param {string} event
 * @param {Record<string, any>} properties
 */

module.exports = {
  init,
};
