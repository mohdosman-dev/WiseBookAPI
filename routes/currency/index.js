const {
  getCurrencies,
  createCurrency,
} = require("../../controllers/currencyController");

const Currency = {
  type: "object",
  properties: {
    _id: { type: "string" },
    name: { type: "string" },
  },
};

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
  fastify.get("/", currencyOpts).post("/", createCurrencyOpts);
};
