const fs = require("fs");
const path = require("path");
const pump = require("util").promisify(require("stream").pipeline);

/**
 * Saves a file stream to disk in the given directory with the given filename.
 * Automatically creates directories if they don't exist.
 *
 * @param {ReadableStream} fileStream - The file stream to save
 * @param {string} dirPath - The directory path to save in (relative to project root)
 * @param {string} filename - The name to use when saving the file
 * @returns {string} The saved filename
 */
const saveFile = async (fileStream, dirPath, filename) => {
  try {
    const rootDir = "public/uploads";
    const fullPath = path.join(process.cwd(), rootDir, dirPath, filename);

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    // Pipe the file stream to disk
    await pump(fileStream, fs.createWriteStream(fullPath));

    return path.join(rootDir, dirPath, filename).replace(/\\/g, "/");
  } catch (error) {
    throw new Error(`Error saving file: ${error.message}`);
  }
};

module.exports = {
  saveFile,
};
