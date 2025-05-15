const getCurrencies = async (req, reply) => {
  try {
    const { Currency } = req.server.mongoose.models;
    // fastify.log.error(`Fetching all currencies: ${Currency}`);
    const currencies = await Currency.find({});
    reply.send({
      message: "Currency created successfully",
      data: currencies,
    });
  } catch (err) {
    // fastify.log.error(err);
    throw new Error(err.message);
  }
};

const createCurrency = async (req, reply) => {
  try {
    const { Currency } = req.server.mongoose.models;
    const { name } = req.body;
    const curr = await Currency.findOne({ name });
    if (curr) {
      reply.status(400);
      throw new Error("Currency already exists");
    }
    const currency = new Currency({ name });
    await currency.save();

    reply.send({
      message: "Currency created successfully",
      data: currency,
    });
  } catch (err) {
    // fastify.log.error(err);
    throw new Error(err.message);
  }
};

module.exports = { getCurrencies, createCurrency };
