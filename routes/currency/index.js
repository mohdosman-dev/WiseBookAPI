const {
  getCurrencies,
  createCurrency,
} = require("../../controllers/currencyController");
const { Currency } = require("../../models/fastifySchemas");

const currencyOpts = {
  schema: {
    description: "Get all currencies",
    tags: ["Currency"],
    response: {
      200: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: Currency,
          },
          message: { type: "string" },
        },
      },
    },
  },
  handler: getCurrencies,
};

const createCurrencyOpts = {
  schema: {
    description: "Create a new currency",
    tags: ["Currency"],
    security: [
      {
        bearerAuth: [],
      },
    ],
    body: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
      },
    },
    response: {
      201: {
        properties: {
          data: Currency,
          message: { type: "string" },
        },
      },
    },
  },
  handler: createCurrency,
};

module.exports = async function (fastify, opts) {
  fastify.get("/", currencyOpts).post("/", {
    ...createCurrencyOpts,
    preHandler: [fastify.authenticate, fastify.authorizeAdmin],
  });
};
