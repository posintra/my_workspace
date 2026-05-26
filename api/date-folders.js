const fs = require("fs");
const path = require("path");

function listDateFolders(baseDir) {
  try {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && /^\d{6}$/.test(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    return [];
  }
}

module.exports = (req, res) => {
  const candidates = [
    process.cwd(),
    path.resolve(__dirname, ".."),
    "/var/task",
  ];

  let dates = [];
  for (const dir of candidates) {
    dates = listDateFolders(dir);
    if (dates.length > 0) break;
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).send({ dates });
};
