const {
  getAuthors,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  searchAuthor,
  getAuthorById,
} = require("../../controllers/authorController");
const { Author } = require("../../models/fastifySchemas");

const getAuthorsOpts = {
  schema: {
    description: "Get all authors",
    tags: ["Author"],
    response: {
      200: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: Author,
          },
          message: { type: "string" },
        },
      },
    },
  },
  handler: getAuthors,
};

const getAuthorOpts = {
  description: "Get author by ID",
  tags: ["Author"],
  schema: {
    response: {
      200: {
        type: "object",
        properties: {
          data: Author,
          message: { type: "string" },
        },
      },
    },
  },
  handler: getAuthorById,
};

const createAuthorOpts = {
  schema: {
    description: "Create a new author",
    tags: ["Author"],
    security: [
      {
        bearerAuth: [],
      },
    ],
    consumes: ["multipart/form-data"],
    body: {
      properties: {
        name: { type: "string" },
        sinceYear: { type: "number" },
        description: { type: "string" },
        image: { type: "string", format: "binary" },
        facebookUrl: { type: "string" },
        instagramUrl: { type: "string" },
        youtubeUrl: { type: "string" },
        websiteUrl: { type: "string" },
      },
    },
    response: {
      201: {
        type: "object",
        properties: {
          data: Author,
          message: { type: "string" },
        },
      },
    },
  },
  handler: createAuthor,
};

const updateAuthorOpts = {
  schema: {
    consumes: ["multipart/form-data"],
    description: "Update an author by ID",
    tags: ["Author"],
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
        sinceYear: { type: "number" },
        description: { type: "string" },
        image: { type: "string", format: "binary" },
        facebookUrl: { type: "string" },
        instagramUrl: { type: "string" },
        youtubeUrl: { type: "string" },
        websiteUrl: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          data: Author,
          message: { type: "string" },
        },
      },
    },
  },
  handler: updateAuthor,
};
const deleteAuthorOpts = {
  schema: {
    description: "Delete an author by ID",
    tags: ["Author"],
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
          data: { type: "string" },
          message: { type: "string" },
        },
      },
    },
  },
  handler: deleteAuthor,
};
const searchAuthorOpts = {
  schema: {
    description: "Search authors by name",
    tags: ["Author"],
    querystring: {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    },
    response: {
      200: {
        type: "array",
        items: Author,
      },
    },
  },
  handler: searchAuthor,
};
handler: searchAuthor,
  (module.exports = async function (fastify, options) {
    fastify.get("/", getAuthorsOpts);
    fastify.get("/:id", getAuthorOpts);
    fastify.post("/", {
      ...createAuthorOpts,
      preHandler: [fastify.authenticate],
    });
    fastify.put("/:id", {
      ...updateAuthorOpts,
      preHandler: [fastify.authenticate],
    });
    fastify.delete("/:id", {
      ...deleteAuthorOpts,
      preHandler: [fastify.authenticate],
    });
    fastify.get("/search?:name", {
      ...searchAuthorOpts,
      preHandler: [fastify.authenticate],
    });
  });
