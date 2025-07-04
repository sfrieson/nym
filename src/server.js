const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const url = require("url");
const { createHmac } = require("crypto");

const MIN_ACRONYM_LENGTH = 2;
const MAX_ACRONYM_LENGTH = 20;

/**
 * @param {{
 * generateMeanings: (acronym: string) => Promise<import('./types').AcronymMultiResponse>,
 * generateMeaning: (acronym: string) => Promise<import('./types').AcronymSingleResponse>,
 * randomStatus: (acronym: string) => string,
 * analytics: {
 *  createRequestClient: (properties: Record<string, any>) => {
 *    track: (event: string, properties?: Record<string, any>) => void,
 *    update: (properties: Record<string, any>, overwrite?: boolean) => void,
 *  },
 * },
 * }} controller
 */
exports.createServer = async (controller) => {
  const server = http.createServer(async (req, res) => {
    const analytics = controller.analytics.createRequestClient({});
    try {
      if (!req.url) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Bad request");
        return;
      }

      console.log(req.method, req.url);
      switch (true) {
        case route(req, "GET", "/healthcheck"):
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("OK");
          break;
        case route(req, "GET", "/"):
          analytics.track("page_view", {
            client: "web",
          });
          fs.readFile(
            path.join(__dirname, "view", "index.html"),
            (err, data) => {
              if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Internal server error");
                return;
              }

              res.writeHead(200, { "Content-Type": "text/html" });
              res.end(data);
            }
          );
          break;
        case route(req, "GET", /.*\.(js|css|html|svg|ico|png|jpg|webp)$/):
          fs.readFile(
            path.join(__dirname, "../public", req.url),
            (err, data) => {
              if (err) {
                console.error(err);
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Not found");
                return;
              }

              const contentType = {
                js: "application/javascript",
                css: "text/css",
                html: "text/html",
                svg: "image/svg+xml",
                ico: "image/x-icon",
                png: "image/png",
                jpg: "image/jpeg",
                webp: "image/webp",
              }[req.url?.split(".").at(-1) ?? ""];

              res.writeHead(200, {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=300",
              });
              res.end(data);
            }
          );
          break;

        case route(req, "GET", /^\/acronym/): {
          analytics.update({
            client: "web",
            distinctId: req.headers["x-user-id"] ?? "anonymous",
            sessionId: req.headers["x-session-id"] ?? "anonymous",
            requestId: req.headers["x-request-id"] ?? "anonymous",
          });
          if (req.url.length > "/acronym?q=".length + MAX_ACRONYM_LENGTH) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Acronym too long");
            break;
          }
          if (req.url.length < "/acronym?q=".length + MIN_ACRONYM_LENGTH) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Acronym too short");
            break;
          }

          const { query } = url.parse(req.url, true);
          const { q } = query;

          const acronym = Array.isArray(q) ? q.at(0) : q;
          analytics.update({
            acronym,
          });
          if (!acronym) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Acronym is required");
            break;
          }

          if (acronym.length < 2) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Acronym too short");
            break;
          }

          const getLatency = createLatency();
          const meaningsResponse = await controller.generateMeanings(acronym);

          analytics.track("acronyms_generated", {
            latency: getLatency(),
            meaningsCount: meaningsResponse.meanings.length,
          });

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(meaningsResponse));
          break;
        }
        // slack bot endpoint
        case route(req, "POST", /^\/slackronym/): {
          // Parse form-encoded body
          const analytics = controller.analytics.createRequestClient({
            client: "slack",
          });
          const body = await new Promise((resolve, reject) => {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", () => {
              resolve(body);
            });
          });

          // Parse form-encoded data
          const formData = new URLSearchParams(body);
          const text = formData.get("text");

          // Acknowledge the request
          res.writeHead(200, { "Content-Type": "text/plain" });
          if (!text) {
            res.end("Well... what do you want me to define?");
            break;
          }

          const words = text.split(" ");
          if (words.length > 2) {
            res.end("Whoa whoa whoa... multiples? What do I look like? AI?");
            break;
          }

          const acronym = words[0];
          if (acronym.length > MAX_ACRONYM_LENGTH) {
            res.end("That's a long freakin acronym... Are you sure bout that?");
            break;
          }

          if (acronym.length < MIN_ACRONYM_LENGTH) {
            res.end("That's just a letter...");
            break;
          }

          res.end(controller.randomStatus(acronym));
          const responseUrl = formData.get("response_url");
          if (!responseUrl) {
            res.end("No response URL found");
            break;
          }
          analytics.update({
            acronym,
            distinctId: getAnonSlackId(
              formData.get("user_id") ?? "anonymous-user"
            ),
            slackInstallId: getAnonSlackId(
              formData.get("api_app_id") ?? "anonymous-install"
            ),
          });

          const getLatency = createLatency();
          const meaningResponse = await controller.generateMeaning(acronym);

          analytics.track("acronym_generated", {
            latency: getLatency(),
          });
          const message = `*${acronym}*: ${meaningResponse.meaning.meaning}\n_${meaningResponse.meaning.explanation}_`;

          const request = https.request(responseUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
          request.write(
            JSON.stringify({
              text: message,
              response_type: "in_channel",
            })
          );
          request.end();

          break;
        }
        default:
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
          break;
      }
    } catch (error) {
      console.error(error);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal server error");
    }
  });

  return {
    /**
     * @param {number | string} port
     * @param {(err: Error | null, port: number | string) => void} cb
     */
    listen: (port, cb) => {
      server.listen(port, () => {
        cb?.(null, port);
      });
    },
    /**
     *
     * @param {(err?: Error) => void} cb
     */
    close: (cb) => {
      server.close(cb);
    },
  };
};

/**
 * @param {http.IncomingMessage} req
 * @param {string} method
 * @param {string | RegExp} path
 * @returns {boolean}
 */
function route(req, method, path) {
  if (req.method !== method) return false;
  if (!req.url) return false;
  if (typeof path === "string") {
    if (req.url !== path) return false;
  } else {
    if (!path.test(req.url)) return false;
  }

  return true;
}

const SECRET_SALT =
  process.env.SLACK_HASH_SALT ?? "why in the world is this not set????!‽‽‽@??!";

/**
 * @param {string} slackId
 * @returns {string}
 */
function getAnonSlackId(slackId) {
  return createHmac("sha256", SECRET_SALT).update(slackId).digest("hex");
}

function createLatency() {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}
