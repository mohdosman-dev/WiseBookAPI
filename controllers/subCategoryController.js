const { saveFile } = require("../utils/utils");
const { v4: uuidv4 } = require("uuid");

/**
 * Get all subcategories
 * @description Get all subcategories
 * @route GET /api/subcategories
 * @group SubCategory - Operations about subcategories
 * @returns {object} 200 - An array of subcategories
 * @throws {Error} 500 - Internal server error
 */
const getSubCategories = async (req, res) => {
  try {
    const { SubCategory } = req.server.mongoose.models;
    const subCategories = await SubCategory.find().populate("category");

    req.log.info(JSON.stringify(subCategories));
    return res.send({
      data: subCategories,
      message: "Subcategories fetched successfully",
    });
  } catch (error) {
    req.log.error(error);
    return res.status(500).send({
      message: "Error fetching subcategories",
    });
    throw new Error(error);
  }
};

/**
 * Create a new subcategory
 * @description Create a new subcategory
 * @route POST /api/subcategories
 * @group SubCategory - Operations about subcategories
 * @param {string} name.body.required - Subcategory name
 * @param {string} category.body.required - Category ID
 * @returns {object} 201 - Created subcategory
 * @throws {Error} 500 - Internal server error
 */
const createSubCategory = async (req, res) => {
  try {
    const { SubCategory } = await req.server.mongoose.models;
    const fields = {};
    const files = {};
    const requiredFields = ["name", "category"];
    let imageFilename = null;
    for await (const part of req.parts()) {
      if (part.file) {
        files[part.fieldname] = { file: part.file, filename: part.filename };
      } else {
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
      imageFilename = await saveFile(file, "image/subcategories", filename);
    }

    const newSubCategory = {
      ...fields,
      image: imageFilename,
    };

    req.log.info(JSON.stringify(newSubCategory));

    const subCategory = new SubCategory(newSubCategory);

    await subCategory.save();
    return res.status(201).send({
      data: subCategory,
      message: "Sub category created successfully",
    });
  } catch (error) {
    req.log.error(error);
    return res.status(500).send({
      message: "Error creating sub category",
    });
    throw new Error(error);
  }
};

/**
 * Get subcategory by ID
 * @description Get subcategory by ID
 * @route GET /api/subcategories/{id}
 * @group SubCategory - Operations about subcategories
 * @param {string} id.path.required - Subcategory ID
 * @returns {object} 200 - Subcategory object
 * @throws {Error} 500 - Internal server error
 */
const getSubCategoryById = async (req, res) => {
  try {
    req.log.info(req.params.id);
    const { SubCategory } = req.server.mongoose.models;
    const subCategory = await SubCategory.findById(req.params.id).populate(
      "category"
    );
    req.log.info(JSON.stringify(subCategory));
    if (!subCategory) {
      return res.status(404).send({
        message: "Subcategory not found",
      });
    }
    res.send({
      data: subCategory,
      message: "Subcategory fetched successfully",
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({
      message: "Error fetching subcategory",
    });
    throw new Error(error);
  }
};

/**
 * Update subcategory by ID
 * @description Update subcategory by ID
 * @route PUT /api/subcategories/{id}
 * @group SubCategory - Operations about subcategories
 * @param {string} id.path.required - Subcategory ID
 * @param {string} name.body - Subcategory name
 * @param {string} category.body - Category ID
 * @returns {object} 200 - Updated subcategory object
 * @throws {Error} 500 - Internal server error
 */
const updateSubCategory = async (req, res) => {
  try {
    const { SubCategory } = await req.server.mongoose.models;
    const { id } = req.params;
    let fields = {};
    const files = {};
    let hasFile = false;

    const category = await SubCategory.findById(id);
    if (!category) {
      req.log.error("Sub category not found");
      return res.status(404).send({
        message: "Sub category not found",
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
        imageFilename = await saveFile(file, "image/subcategories", filename);
      }

      fields = {
        ...fields,
        image: imageFilename,
      };
    }

    const newCategory = await SubCategory.findByIdAndUpdate(
      id,
      { $set: fields },
      { new: true }
    );

    res.send({
      data: newCategory,
      message: "Sub category updated successfully",
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({
      message: "Error updating subcategory",
    });
    throw new Error(error);
  }
};

/**
 * Delete subcategory by ID
 * @description Delete subcategory by ID
 * @route DELETE /api/subcategories/{id}
 * @group SubCategory - Operations about subcategories
 * @param {string} id.path.required - Subcategory ID
 * @returns {object} 200 - Deleted subcategory object
 * @throws {Error} 500 - Internal server error
 */
const deleteSubCategory = async (req, res) => {
  try {
    const { SubCategory } = req.server.mongoose.models;
    const subCategory = await SubCategory.findByIdAndDelete(req.params.id);
    if (!subCategory) {
      return res.status(404).send({
        message: "Subcategory not found",
      });
    }
    res.send({
      data: req.params.id,
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({
      message: "Error deleting subcategory",
    });
    throw new Error(error);
  }
};

// Export the functions to be used in routes
module.exports = {
  getSubCategories,
  createSubCategory,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
};
