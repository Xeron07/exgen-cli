const path = require("path");
const { mkdirp, writeFile } = require("./fsHelpers");
const { createAppFile } = require("./files/appFile");
const { createServerFile } = require("./files/serverFile");
const { generateStructure } = require("./projectStructure");
const { initPackageJson } = require("./packageJson");

function runGenerator(projectName, args) {
  const projectRoot = path.resolve(process.cwd(), projectName);
  const useTS = args.ts || args.all;
  const useMongo = args.mongo;
  const usePostgres = args.pg;
  const withTests = args.test || args.all;
  const withELK = args.elk;

  mkdirp(projectRoot);
  generateStructure(projectRoot, { useTS, useMongo, usePostgres, withTests, withELK });
  initPackageJson(projectRoot, projectName, args, { useTS, useMongo, usePostgres, withTests, withELK });
  createAppFile(projectRoot, useTS);
  createServerFile(projectRoot, useTS);
  writeFile(path.join(projectRoot, ".env"), "PORT=5000\nDB_URI=your_connection_string");
}

module.exports = { runGenerator };