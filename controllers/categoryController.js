const { saveFile } = require("../utils/utils");
const { v4: uuidv4 } = require("uuid");

/**
 * Get all categories
 * @description This function retrieves all categories from the database and sends them in the response.
 * @route GET /categories
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object containing the categories and a success message
 * @throws {Error} - Throws an error if there is an issue retrieving the categories
 */
const getCategories = async (req, res) => {
  try {
    const { Category } = await req.server.mongoose.models;
    const categories = await Category.find({});
    return res.send({
      data: categories,
      message: "Categories retrieved successfully",
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({
      message: "Error retrieving categories",
    });
    throw new Error(error);
  }
};

/**
 * Get category by ID
 * @description This function retrieves a category by its ID from the database and sends it in the response.
 * @route GET /categories/:id
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object containing the category and a success message
 * @throws {Error} - Throws an error if there is an issue retrieving the category
 */
const getCategoryById = async (req, res) => {
  try {
    const { Category } = await req.server.mongoose.models;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).send({
        message: "Category not found",
      });
    }
    res.send({
      data: category,
      message: "Category retrieved successfully",
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({
      message: "Error retrieving category",
    });
    throw new Error(error);
  }
};

/**
 * Create a new category
 * @description This function creates a new category in the database and sends it in the response.
 * @route POST /categories
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object containing the created category and a success message
 * @throws {Error} - Throws an error if there is an issue creating the category
 */
const createCategory = async (req, res) => {
  try {
    const { Category } = await req.server.mongoose.models;
    const fields = {};
    const files = {};
    const requiredFields = ["name"];
    let imageFilename = null;
    for await (const part of req.parts()) {
      if (part.file) {
        req.log.info("filename", part.filename);
        files[part.fieldname] = { file: part.file, filename: part.filename };
      } else {
        req.log.info("field", part.fieldname);
        fields[part.fieldname] = part.value;
      }
    }

    // Validate required fields
    const missing = requiredFields.filter((field) => !fields[field]);
    if (missing.length) {
      res.status(400).send({
        message: `Missing required field(s): ${missing.join(", ")}`,
      });
      throw new Error(`Missing required field(s): ${missing.join(", ")}`);
    }

    for (const { file, filename: originalName } of Object.values(files)) {
      if (!file || typeof file.pipe !== "function") {
        req.log.error("Invalid file stream:", file);
        return res
          .status(400)
          .send({ message: "Uploaded file is invalid or missing" });
      }

      const filename = `${uuidv4()}-${originalName || "upload.png"}`;
      imageFilename = await saveFile(file, "image/categories", filename);
    }

    const newCategory = {
      ...fields,
      image: imageFilename,
    };

    const category = new Category(newCategory);

    await category.save();
    return res.status(201).send({
      data: category,
      message: "Category created successfully",
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({
      message: "Error creating category",
    });
    throw new Error(error);
  }
};

/**
 * Update a category
 * @description This function updates a category in the database and sends it in the response.
 * @route PUT /categories/:id
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object containing the updated category and a success message
 * @throws {Error} - Throws an error if there is an issue updating the category
 */
const updateCategory = async (req, res) => {
  try {
    const { Category } = await req.server.mongoose.models;
    const { id } = req.params;
    let fields = {};
    const files = {};
    let hasFile = false;

    const category = await Category.findById(id);
    if (!category) {
      req.log.error("Category not found");
      return res.status(404).send({
        message: "Category not found",
      });
    }

    for await (const part of req.parts()) {
      if (part.file) {
        req.log.info("filename", part.filename);
        files[part.fieldname] = { file: part.file, filename: part.filename };
        hasFile = true;
      } else {
        req.log.info("field", part.fieldname);
        fields[part.fieldname] = part.value;
      }
    }

    if (hasFile) {
      let imageFilename = null;
      for (const { file, filename: originalName } of Object.values(files)) {
        if (!file || typeof file.pipe !== "function") {
          req.log.error("Invalid file stream:", file);
          return res
            .status(400)
            .send({ message: "Uploaded file is invalid or missing" });
        }

        const filename = `${uuidv4()}-${originalName || "upload.png"}`;
        imageFilename = await saveFile(file, "image/categories", filename);
      }

      fields = {
        ...fields,
        image: imageFilename,
      };
    }

    const newCategory = await Category.findByIdAndUpdate(
      id,
      { $set: fields },
      { new: true }
    );

    res.send({
      data: newCategory,
      message: "Category updated successfully",
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({
      message: "Error updating category",
    });
    throw new Error(error);
  }
};

/**
 * Delete a category
 * @description This function deletes a category from the database and sends a success message in the response.
 * @route DELETE /categories/:id
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object containing the deleted category ID and a success message
 * @throws {Error} - Throws an error if there is an issue deleting the category
 */
const deleteCategory = async (req, res) => {
  try {
    const { Category } = await req.server.mongoose.models;
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).send({
        message: "Category not found",
      });
    }
    res.send({
      data: category._id,
      message: "Category deleted successfully",
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({
      message: "Error deleting category",
    });
    throw new Error(error);
  }
};

// Export the functions
// to be used in the routes
module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
