#!/usr/bin/env node

const args = require("minimist")(process.argv.slice(2));
const { runGenerator } = require("../lib/generator");
const { printBanner } = require("../lib/utils/banner");

printBanner();

const projectName = args._[0];
if (!projectName) {
  console.error("❌ Project name is required. Usage: exgen <project-name> [options]");
  process.exit(1);
}
runGenerator(projectName, args);