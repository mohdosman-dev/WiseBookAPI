const fs = require("fs");
const path = require("path");
const pump = require("util").promisify(require("stream").pipeline);
const { v4: uuidv4 } = require("uuid");

/**  Get all users for admin
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Array} - List of users
 */
const getUsers = async (req, res) => {
  const { User } = req.server.mongoose.models;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  try {
    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);
    res.status(200).send({
      message: "Users fetched successfully",
      data: users,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).send({ message: "Internal server error" });
    throw new Error(error);
  }
};

/**  Login user
 * @description This function handles user login by verifying the email and password.
 * If the credentials are valid, it generates a JWT token and returns it along with user details.
 * If the credentials are invalid, it sends a 401 status with an error message.
 * @async
 * @function login
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Array} - List of users
 */
const login = async (req, res) => {
  const { User } = req.server.mongoose.models;
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).send({ message: "Invalid email or password" });
      throw new Error("Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).send({ message: "Invalid email or password" });
      throw new Error("Invalid email or password");
    }

    const token = req.server.jwt.sign({
      userId: user._id,
      isAdmin: user.isAdmin,
    });

    req.log.info(`User ${user} logged in successfully`);

    res.status(200).send({
      message: "Login successful",
      token: token,
      data: user,
    });
  } catch (err) {
    req.log.error(err);
    throw new Error(err);
  }
};
/**
 * Register user
 * @description This function handles user registration by creating a new user in the database.
 * It validates the input data and checks if the email already exists.
 * If the registration is successful, it sends a success message along with the user details and JWT token.
 * If the email already exists, it sends a 409 status with an error message.
 * @async
 * @function register
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The registered user object
 * @throws {Error} - If there is an error during registration
 * @throws {Error} - If the email already exists
 * @throws {Error} - If there is an error saving the user to the database
 */
const register = async (req, res) => {
  try {
    const parts = req.parts();
    const { User } = req.server.mongoose.models;
    const fields = {};
    const files = {};
    let imageFilename = null;

    const requiredFields = [
      "firstName",
      "lastName",
      "username",
      "countryCode",
      "phone",
      "email",
      "password",
    ];
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

    // return await res.status(201).send({ message: "created", body: req.parts });

    const existingUser = await User.findOne({
      $or: [{ email: fields.email }, { username: fields.username }],
    });
    if (existingUser) {
      res.status(409).send({ message: "User already exists" });
      throw new Error("User already exists");
    }

    for (const file of Object.values(files)) {
      const originalName = file.filename || `upload.png`;
      const filename = `${uuidv4()}-${originalName}`;
      const uploadPath = path.join(process.cwd(), "uploads", "image", filename);
      await pump(file.file, fs.createWriteStream(uploadPath));
      imageFilename = filename;
    }

    const newUser = new User({
      ...fields,
      image: imageFilename,
    });

    await newUser.save();

    const token = req.server.jwt.sign({ userId: newUser._id });

    res.status(201).send({
      message: "User registered successfully",
      token,
      data: newUser,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500);
    throw new Error(err);
  }
};

/**
 * Get user by ID
 * @description This function retrieves a user by their ID from the database.
 * If the user is found, it sends the user details in the response.
 * If the user is not found, it sends a 404 status with an error message.
 * @async
 * @function getUserById
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The user object
 * @throws {Error} - If there is an error fetching the user from the database
 */
const getUserById = async (req, res) => {
  const { User } = req.server.mongoose.models;
  const { id } = req.params;
  User.findById(id, (err, user) => {
    if (err) {
      res.status(500).send({ error: "Error fetching user" });
    } else if (!user) {
      res.status(404).send({ error: "User not found" });
    } else {
      res.send({
        message: "User fetched successfully",
        data: user,
      });
    }
  });
};

/**
 * Update user
 * @description This function updates a user's details in the database.
 * It validates the input data and checks if the email already exists.
 * If the update is successful, it sends a success message along with the updated user details.
 * If the email already exists, it sends a 409 status with an error message.
 * @async
 * @function updateUser
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The updated user object
 * @throws {Error} - If there is an error during update
 */
const updateUser = async (req, res) => {
  const { User } = req.server.mongoose.models;
  const { id } = req.params;
  const { name, email } = req.body;
  
};

/**
 * Delete user
 * @description This function deletes a user from the database.
 * It checks if the user exists and deletes them.
 * If the deletion is successful, it sends a success message.
 * If the user is not found, it sends a 404 status with an error message.
 * @async
 * @function deleteUser
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The deleted user object
 * @throws {Error} - If there is an error during deletion
 * @throws {Error} - If the user is not found
 * @throws {Error} - If there is an error deleting the user from the database
 */
const deleteUser = async (req, res) => {
  const { User } = req.server.mongoose.models;
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      res.status(404).send({ message: "User not found" });
      throw new Error("User not found");
    }
    res.status(200).send({
      message: "User deleted successfully",
      data: user._id,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).send({ message: "Internal server error" });
    throw new Error(err);
  }
};

// Export the functions to be used in routes
module.exports = {
  getUsers,
  register,
  getUserById,
  updateUser,
  deleteUser,
  login,
};
