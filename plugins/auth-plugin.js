const fp = require("fastify-plugin");
const fastifyJwt = require("@fastify/jwt");

module.exports = fp(async function (fastify, opts) {
  // Register JWT plugin
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "supersecret",
  });

  // Decorate Fastify with an `authenticate` method for protecting routes
  fastify.decorate("authenticate", async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ message: "Unauthorized" });
    }
  });

  // Decorate Fastify with an `authenticate` method for protecting routes
  fastify.decorate("authorizeAdmin", async function (request, reply) {
    if (!request.user?.isAdmin) {
      reply
        .status(403)
        .send({ message: "Your not authorized to this endpoint" });
    }
  });
});
