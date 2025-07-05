const { PostHog } = require("posthog-node");

const { expect } = require("../util.js");

/**
 * @type {PostHog}
 */
let client;

function init() {
  const disabled = process.env.POSTHOG_DISABLED === "true";
  client = new PostHog(
    expect(process.env.POSTHOG_API_KEY, "POSTHOG_API_KEY is not set"),
    {
      host: "https://us.i.posthog.com",
      disabled,
    }
  );

  return {
    shutdown: () => client.shutdown(),
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
          { distinctId = ctx.distinctId ?? "anonymous", ...properties } = ctx
        ) => {
          if (disabled) {
            console.log("🐽", event, properties);
          }
          client.capture({
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
