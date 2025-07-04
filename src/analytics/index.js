import { PostHog } from "posthog-node";

/**
 * @type {PostHog}
 */
let client;

export function init() {
  client = new PostHog(process.env.POSTHOG_API_KEY, {
    host: "https://us.i.posthog.com",
  });

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
