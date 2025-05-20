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
    subcategories: {
      type: "array",
      items: { $ref: "SubCategory" },
    },
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
    category: { $ref: "Category" },
    isActive: { type: "number" },
  },
};

const Author = {
  type: "object",
  $id: "Author",
  properties: {
    _id: { type: "string" },
    name: { type: "string" },
    sinceYear: { type: "number" },
    description: { type: "string" },
    image: { type: "string" },
    links: {
      type: "object",
      properties: {
        facebookUrl: { type: "string" },
        instagramUrl: { type: "string" },
        youtubeUrl: { type: "string" },
        websiteUrl: { type: "string" },
      },
    },
  },
};

module.exports = {
  User,
  Currency,
  Category,
  SubCategory,
  Author,
};
