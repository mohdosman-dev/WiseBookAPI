const fp = require("fastify-plugin");

module.exports = fp(async function (fastify, opts) {
  try {
    const port = process.env.PORT || 3000;
    // Register swagger with Fastify
    await fastify.register(require("@fastify/swagger"), {
      openapi: {
        info: {
          title: "API Documentation",
          description: "API documentation for the backend",
          version: "1.0.0",
        },
        servers: [{ url: `http://127.0.0.1:${port}/api/v1` }],
      },
    });

    // Register Swagger UI with Fastify
    await fastify.register(require("@fastify/swagger-ui"), {
      routePrefix: "/docs", // Swagger UI will be available at /docs
      uiConfig: {
        docExpansion: "list",
        deepLinking: false,
        logger: {
          // override all logging functions to no-op
          // log: () => {},
          // warn: () => {},
          // info: () => {},
        },
      },
      uiHooks: {
        onRequest: function (request, reply, next) {
          next();
        },
        preHandler: function (request, reply, next) {
          next();
        },
      },
      staticCSP: true,
      preHandler: fastify.authenticate,
      persistAuthorization: true,
      transformSpecification: (swaggerObject) => {
        // Ensure the server URL is correct
        swaggerObject.servers = [{ url: `http://127.0.0.1:${port}/api/v1` }];
        return swaggerObject;
      },
    });
  } catch (err) {
    fastify.log.error("Error while registering swagger:", err);
    throw err;
  }
});
