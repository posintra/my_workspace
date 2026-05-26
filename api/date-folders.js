const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
  try {
    const baseDir = process.cwd();
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    const dates = entries
      .filter((entry) => entry.isDirectory() && /^\d{6}$/.test(entry.name))
      .map((entry) => entry.name)
      .sort();

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).send({ dates });
  } catch (error) {
    res.status(500).send({ dates: [], error: "failed_to_list_date_folders" });
  }
};
