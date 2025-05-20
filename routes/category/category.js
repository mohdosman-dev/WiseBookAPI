const {
  getCategoryById,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../../controllers/categoryController");
const { Category, SubCategory } = require("../../models/fastifySchemas");

const getCategoriesOpts = {
  schema: {
    description: "Get all categories",
    tags: ["Category"],
    response: {
      200: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: Category,
          },
          message: { type: "string" },
        },
      },
    },
  },
  handler: getCategories,
};

const getCategoryByIdOpts = {
  schema: {
    description: "Get category by ID",
    tags: ["Category"],
    response: {
      200: {
        type: "object",
        properties: {
          data: Category,
          message: { type: "string" },
        },
      },
    },
  },
  handler: getCategoryById,
};

const createCategoryOpts = {
  schema: {
    description: "Create a new category",
    tags: ["Category"],
    security: [
      {
        bearerAuth: [],
      },
    ],
    consumes: ["multipart/form-data"],
    body: {
      properties: {
        name: { type: "string" },
        image: { type: "string", format: "binary" },
      },
    },
    response: {
      201: {
        type: "object",
        properties: {
          data: Category,
          message: { type: "string" },
        },
      },
    },
  },
  handler: createCategory,
};

const updateCategoryOpts = {
  schema: {
    consumes: ["multipart/form-data"],
    description: "Update a category by ID",
    tags: ["Category"],
    security: [
      {
        bearerAuth: [],
      },
    ],
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
    },
    body: {
      properties: {
        name: { type: "string" },
        image: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          data: Category,
          message: { type: "string" },
        },
      },
    },
  },
  handler: updateCategory,
};

const deleteCategoryOpts = {
  schema: {
    description: "Delete a category by ID",
    tags: ["Category"],
    security: [
      {
        bearerAuth: [],
      },
    ],
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  handler: deleteCategory,
};

module.exports = async function (fastify, opts) {
  fastify.addSchema(SubCategory);
  fastify.get("/", getCategoriesOpts);
  fastify.get("/:id", getCategoryByIdOpts);
  fastify.post("/", {
    ...createCategoryOpts,
    preHandler: [fastify.authenticate, fastify.authorizeAdmin],
  });
  fastify.put("/:id", {
    ...updateCategoryOpts,
    preHandler: [fastify.authenticate, fastify.authorizeAdmin],
  });
  fastify.delete("/:id", {
    ...deleteCategoryOpts,
    preHandler: [fastify.authenticate, fastify.authorizeAdmin],
  });
};
