const start = performance.now();
const server = require("./server");
const acronymController = require("./acronym");
const status = require("./status");
const analytics = require("./analytics");

const controller = acronymController.createAcronymController();
const analyticsClient = analytics.init();
const controllerWithStatus = {
  ...controller,
  randomStatus: status.randomStatus,
  analytics: analyticsClient,
};

server.createServer(controllerWithStatus).then((server) => {
  server.listen(process.env.PORT ?? 3112, async (err, port) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(
      `Server is running on port ${port} in ${performance.now() - start}ms`
    );
  });
  async function shutdown() {
    console.log("Shutting down...");
    try {
      await Promise.race([
        Promise.all([analyticsClient.shutdown(), server.close()]),
        new Promise((resolve) => setTimeout(resolve, 30000)),
      ]);
    } catch (err) {
      console.error("Error shutting down server");
      console.error(err);
    } finally {
      process.exit(0);
    }
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
});
