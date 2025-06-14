const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

/**
 * @param {{ generateMeaning: (acronym: string) => Promise<{} | any[]> }} controller
 */
exports.createServer = async (controller) => {
  const server = http.createServer(async (req, res) => {
    try {
      if (!req.url) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Bad request");
        return;
      }

      console.log(req.method, req.url);
      switch (true) {
        case route(req, "GET", "/"):
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
          if (req.url.length > "/acronym".length + 20) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Acronym too long");
            break;
          }

          const { query } = url.parse(req.url, true);
          const { q } = query;

          const acronym = Array.isArray(q) ? q.at(0) : q;
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

          const meaningsResponse = await controller.generateMeaning(acronym);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(meaningsResponse));
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
