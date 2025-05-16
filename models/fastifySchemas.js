const User = {
  type: "object",
  $id: "User",
  properties: {
    _id: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    username: { type: "string" },
    email: { type: "string" },
    countryCode: { type: "string" },
    phone: { type: "string" },
    image: { type: "string" },
    isVerified: { type: "integer" },
    isActive: { type: "boolean" },
    isAdmin: { type: "boolean", default: false },
  },
};

const Currency = {
  type: "object",
  $id: "Currency",
  properties: {
    _id: { type: "string" },
    name: { type: "string" },
  },
};

const Category = {
  $id: "Category",
  type: "object",
  properties: {
    _id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    image: { type: "string" },
  },
};

const SubCategory = {
  type: "object",
  $id: "SubCategory",
  properties: {
    _id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    image: { type: "string" },
    category: { $ref: "Category#" },
    isActive: { type: "number" },
  },
};

module.exports = {
  User,
  Currency,
  Category,
  SubCategory,
};
