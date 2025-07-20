const path = require("path");
const { mkdirp } = require("./fsHelpers");

function generateStructure(root, flags) {
  const dirs = [
    "src/api/routes",
    "src/api/controllers",
    "src/api/services",
    "src/api/jobs",
    "src/api/middlewares",
    "src/config",
    "src/utils",
    "src/models",
    "src/database",
    "scripts"
  ];
  if (flags.withTests) dirs.push("tests");
  if (flags.withELK) dirs.push("src/elk", "src/elk/ui");
  if (flags.useMongo) dirs.push("src/models/mongo");
  if (flags.usePostgres) dirs.push("src/models/postgres");

  dirs.forEach(dir => mkdirp(path.join(root, dir)));
}
module.exports = { generateStructure };