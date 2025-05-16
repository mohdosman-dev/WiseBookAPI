const fp = require("fastify-plugin");

module.exports = fp(async function (fastify) {
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    const statusCode = reply.statusCode || 500;
    const message =
      process.env.NODE_ENV === "production" && statusCode === 500
        ? "Internal Server Error"
        : error.message;

    reply.status(statusCode).send({
      statusCode,
      error: error.name || "Error",
      message,
    });
  });
});
