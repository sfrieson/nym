const server = require("./server");
const acronymController = require("./acronym");

acronymController.createAcronymController().then((controller) => {
  server.createServer(controller).then((server) => {
    server.listen(process.env.PORT ?? 3112, async (err, port) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      console.log(`Server is running on port ${port}`);
    });
  });
});
