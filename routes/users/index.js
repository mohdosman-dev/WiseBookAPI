const {
  getUsers,
  login,
  register,
  getUserById,
  updateUser,
  deleteUser,
} = require("../../controllers/userController");
const { User } = require("../../models/fastifySchemas");

const usersOpts = {
  schema: {
    description: "Get all users (for admin only)",
    tags: ["User"],
    security: [
      {
        bearerAuth: [],
      },
    ],
    response: {
      200: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: User,
          },
          message: { type: "string" },
        },
      },
    },
  },
  handler: getUsers,
};

const loginOpts = {
  schema: {
    description: "User login whether is the user admin or not",
    tags: ["User"],
    body: {
      type: "object",
      properties: {
        email: { type: "string" },
        password: { type: "string" },
      },
      required: ["email", "password"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          data: User,
          message: { type: "string" },
          token: { type: "string" },
        },
      },
    },
  },
  handler: login,
};

const registerOpts = {
  schema: {
    description: "Register a new user (later can be admin from the dashbaord)",
    tags: ["User"],
    consumes: ["multipart/form-data"],
    body: {
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
        username: { type: "string" },
        countryCode: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        password: { type: "string" },
        image: { format: "binary" }, // For file upload
      },
    },
    response: {
      201: {
        type: "object",
        properties: {
          data: User,
          message: { type: "string" },
          token: { type: "string" },
        },
      },
    },
  },
  handler: register,
};

const getUserByIdOpts = {
  schema: {
    description: "Get user by ID (or get current user data)",
    tags: ["User"],
    security: [
      {
        bearerAuth: [],
      },
    ],
    response: {
      200: {
        type: "object",
        properties: {
          data: User,
          message: { type: "string" },
        },
      },
    },
  },
  handler: getUserById,
};

const updateUserOpts = {
  schema: {
    description: "Update user by ID or update current user data",
    tags: ["User"],
    security: [
      {
        bearerAuth: [],
      },
    ],
    response: {
      200: {
        type: "object",
        properties: {
          data: {
            type: "object",
            items: User,
          },
          message: { type: "string" },
        },
      },
    },
  },
  handler: updateUser,
};

const deleteUserOpts = {
  schema: {
    description:
      "Delete user by ID (for admin only , delete account will be implemented later)",
    tags: ["User"],
    security: [
      {
        bearerAuth: [],
      },
    ],
    response: {
      200: {
        type: "object",
        properties: {
          data: {
            type: "object",
            id: "string",
          },
          message: { type: "string" },
        },
      },
    },
  },
  handler: deleteUser,
};
module.exports = async function (fastify, opts) {
  fastify.get("/", {
    ...usersOpts,
    preHandler: [fastify.authenticate, fastify.authorizeAdmin],
  });
  fastify.post("/login", loginOpts);
  fastify.post("/register", registerOpts);
  fastify.get("/:id", {
    ...getUserByIdOpts,
    preHandler: [fastify.authenticate],
  });
  fastify.put("/:id", {
    ...updateUserOpts,
    preHandler: [fastify.authenticate],
  });
  fastify.delete("/:id", {
    ...deleteUserOpts,
    preHandler: [fastify.authenticate, fastify.authorizeAdmin],
  });
  fastify.get("/me", {
    ...getUserByIdOpts,
    preHandler: [fastify.authenticate],
  });
};
