const { v4: uuidv4 } = require("uuid");
const { saveFile } = require("../utils/utils");

/**
 * Get all authors
 * @description This function retrieves all authors from the database and sends them in the response.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object containing the authors data and a message
 * @throws {Error} - If an error occurs while retrieving authors
 */
const getAuthors = async (req, res) => {
  try {
    const { Author } = req.server.mongoose.models;
    const authors = await Author.find({});
    if (!authors) {
      return res.status(404).send({ message: "No authors found" });
    }
    return res
      .status(200)
      .send({ data: authors, message: "Authors retrieved successfully" });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

/**
 * Create a new author
 * @description This function creates a new author in the database and sends the created author in the response.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object containing the created author data and a message
 * @throws {Error} - If an error occurs while creating the author
 */
const createAuthor = async (req, res) => {
  try {
    const { Author } = req.server.mongoose.models;
    const fields = {};
    const files = {};
    const requiredFields = ["name", "sinceYear", "description"];
    let authorImge = "";

    // Split fields from files
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

    // Upload image file
    for await (const { file, filename: originalName } of Object.values(files)) {
      if (!file || typeof file.pipe !== "function") {
        req.log.error("Invalid file stream:", file);
        return res
          .status(400)
          .send({ message: "Uploaded file is invalid or missing" });
      }

      const filename = `${uuidv4()}-${originalName || "upload.png"}`;
      authorImge = await saveFile(file, "image/authors", filename);
    }

    fields.image = authorImge;
    const { facebookUrl, instagramUrl, youtubeUrl, websiteUrl } = fields;
    const author = new Author({
      ...fields,
      links: {
        facebookUrl,
        instagramUrl,
        youtubeUrl,
        websiteUrl,
      },
    });
    await author.save();

    return res
      .status(201)
      .send({ data: author, message: "Author created successfully" });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

/**
 * Get author by ID
 * @description This function retrieves an author by ID from the database and sends it in the response.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object containing the author data and a message
 * @throws {Error} - If an error occurs while retrieving the author
 */
const getAuthorById = async (req, res) => {
  try {
    const { Author } = req.server.mongoose.models;
    const { id } = req.params;
    const author = await Author.findById(id);
    if (!author) {
      return res.status(404).send({ message: "Author not found" });
    }
    return res
      .status(200)
      .send({ data: author, message: "Author retrieved successfully" });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

/**
 * Update an author
 * @description This function updates an author in the database and sends the updated author in the response.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object containing the updated author data and a message
 * @throws {Error} - If an error occurs while updating the author
 */
const updateAuthor = async (req, res) => {
  try {
    const { Author } = req.server.mongoose.models;
    const { id } = req.params;
    const fields = {};
    const files = {};
    let authorImge = "";
    let hasFile = false;

    let author = await Author.findById(id);
    if (!author) {
      return res.status(404).send({ message: "Author not found" });
    }

    // Split fields from files
    for await (const part of req.parts()) {
      if (part.file) {
        files[part.fieldname] = { file: part.file, filename: part.filename };
        hasFile = true;
      } else {
        fields[part.fieldname] = part.value;
      }
    }

    if (hasFile) {
      // Upload image file
      for await (const { file, filename: originalName } of Object.values(
        files
      )) {
        if (!file || typeof file.pipe !== "function") {
          req.log.error("Invalid file stream:", file);
          return res
            .status(400)
            .send({ message: "Uploaded file is invalid or missing" });
        }

        const filename = `${uuidv4()}-${originalName || "upload.png"}`;
        authorImge = await saveFile(file, "image/authors", filename);
        fields.image = authorImge;
      }
    }

    // Update author in the database
    author = await Author.findByIdAndUpdate(
      id,
      { $set: fields },
      { new: true }
    );

    if (!author) {
      return res.status(404).send({ message: "Cannot update the author" });
    }

    return res
      .status(200)
      .send({ data: author, message: "Author updated successfully" });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

/**
 * Delete an author
 * @description This function deletes an author from the database and sends a success message in the response.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object containing a success message
 * @throws {Error} - If an error occurs while deleting the author
 */
const deleteAuthor = async (req, res) => {
  try {
    const { Author } = req.server.mongoose.models;
    const { id } = req.params;
    const author = await Author.findByIdAndDelete(id);
    if (!author) {
      return res.status(404).send({ message: "Author not found" });
    }
    return res
      .status(200)
      .send({ data: author, message: "Author deleted successfully" });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

/**
 * Search authors by name
 * @description This function searches for authors by name and sends the matching authors in the response.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object containing the matching authors data and a message
 * @throws {Error} - If an error occurs while searching for authors
 */
const searchAuthor = async (req, res) => {
  try {
    const { Author } = req.server.mongoose.models;
    const { name } = req.query;
    const authors = await Author.find({
      name: { $regex: name, $options: "i" },
    });
    if (!authors) {
      return res.status(404).send({ message: "No authors found" });
    }
    return res
      .status(200)
      .send({ data: authors, message: "Authors retrieved successfully" });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
// Export the functions
module.exports = {
  getAuthors,
  createAuthor,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
  searchAuthor,
};
