const server = require("./server");
const acronymController = require("./acronym");
const status = require("./status");
const analytics = require("./analytics");

acronymController.createAcronymController().then((controller) => {
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

      console.log(`Server is running on port ${port}`);
    });
    process.on("SIGINT", async () => {
      await analyticsClient.shutdown();
      server.close(() => {
        process.exit(0);
      });
    });

    process.on("SIGTERM", async () => {
      await analyticsClient.shutdown();
      server.close(() => {
        process.exit(0);
      });
    });
  });
});
