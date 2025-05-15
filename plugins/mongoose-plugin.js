const fp = require("fastify-plugin");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

async function mongoosePlugin(fastify, options) {
  try {
    await mongoose.connect(options.dbUri, {
      dbName: options.dbName,
      user: options.dpUser,
      pass: options.dbPass,
    });

    // Auto-load all models from the /models directory
    const modelsPath = path.join(__dirname, "../models");
    fs.readdirSync(modelsPath).forEach((file) => {
      require(path.join(modelsPath, file));
    });

    fastify.decorate("mongoose", mongoose);
    fastify.addHook("onClose", async (instance, done) => {
      try {
        await mongoose.connection.close();
        done();
      } catch (err) {
        fastify.log.error(err);
        done(err);
      }
    });
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
}

module.exports = fp(mongoosePlugin, {
  name: "mongoose",
});
