const {
  getSubCategories,
  getSubCategoryById,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} = require("../../controllers/subCategoryController");
const { SubCategory, Category } = require("../../models/fastifySchemas");

const getSubCategoriesOpts = {
  schema: {
    description: "Get all subcategories",
    tags: ["SubCategory"],
    response: {
      200: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: SubCategory,
          },
          message: { type: "string" },
        },
      },
    },
  },
  handler: getSubCategories,
};
const getSubCategoryByIdOpts = {
  schema: {
    description: "Get subcategory by ID",
    tags: ["SubCategory"],
    response: {
      200: {
        type: "object",
        properties: {
          data: SubCategory,
          message: { type: "string" },
        },
      },
    },
  },
  handler: getSubCategoryById,
};
const createSubCategoryOpts = {
  schema: {
    description: "Create a new subcategory",
    tags: ["SubCategory"],
    security: [
      {
        bearerAuth: [],
      },
    ],
    consumes: ["multipart/form-data"],
    body: {
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        image: { type: "string" },
        category: { type: "string" },
      },
    },
    response: {
      201: {
        properties: {
          data: SubCategory,
          message: { type: "string" },
        },
      },
    },
  },
  handler: createSubCategory,
};
const updateSubCategoryOpts = {
  schema: {
    description: "Update a subcategory",
    tags: ["SubCategory"],
    security: [
      {
        bearerAuth: [],
      },
    ],
    consumes: ["multipart/form-data"],
    body: {
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        image: { type: "string" },
        category: { type: "string" },
      },
    },
    response: {
      200: {
        properties: {
          data: SubCategory,
          message: { type: "string" },
        },
      },
    },
  },
  handler: updateSubCategory,
};

const deleteSubCategoryOpts = {
  schema: {
    description: "Delete a subcategory",
    tags: ["SubCategory"],
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
        properties: {
          data: { type: "string" },
          message: { type: "string" },
        },
      },
    },
  },
  handler: deleteSubCategory,
};

module.exports = async (fastify, options) => {
  fastify.addSchema(Category);
  fastify.get("/subcategory/", getSubCategoriesOpts);
  fastify.get("/subcategory/:id", getSubCategoryByIdOpts);
  fastify.post("/subcategory/", {
    ...createSubCategoryOpts,
    preHanlder: [fastify.authenticate, fastify.authorizeAdmin],
  });
  fastify.put("/subcategory/:id", {
    ...updateSubCategoryOpts,
    preHanlder: [fastify.authenticate, fastify.authorizeAdmin],
  });
  fastify.delete("/subcategory/:id", {
    ...deleteSubCategoryOpts,
    preHanlder: [fastify.authenticate, fastify.authorizeAdmin],
  });
};
