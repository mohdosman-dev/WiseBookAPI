const mongoose = require("mongoose");

const linksSchema = new mongoose.Schema({
  facebookUrl: {
    type: String,
    required: false,
  },
  instagramUrl: {
    type: String,
    required: false,
  },
  youtubeUrl: {
    type: String,
    required: false,
  },
  websiteUrl: {
    type: String,
    required: false,
  },
});

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    sinceYear: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    links: {
      type: linksSchema,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Author", authorSchema);
