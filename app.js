"use strict";

const path = require("node:path");
const AutoLoad = require("@fastify/autoload");
const errorHanlder = require("./plugins/error-plugin");

// Pass --options via CLI arguments in command to enable these options.
const options = {
  dbUri: process.env.DB_CONNECTION,
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USERNAME,
  dbPass: process.env.DB_PASSWORD,
};

module.exports = async function (fastify, opts) {
  // Place here your custom code!

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "plugins"),
    options: Object.assign({}, opts, options),
  });

  // Register error handler
  fastify.register(errorHanlder);

  fastify.register(require("@fastify/multipart"), {
    limits: {
      fileSize: (process.env.UPLOAD_SIZE || 5) * 1024 * 1024, // limit to 5MB
    },
    // attachFieldsToBody: "keyValues", // parses fields to body
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "routes"),
    options: { prefix: "/api/v1" },
  });

  fastify.register(require("@fastify/cors"), {
    origin: true, // or specify your allowed origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    credentials: true,
  });
};

module.exports.options = options;
