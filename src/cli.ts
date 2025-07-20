import { Command } from "commander";
import chalk from "chalk";
import { createProject } from "./commands/create";
import { initProject } from "./commands/init";
import { configCommand } from "./commands/config";
import { presetsCommand } from "./commands/preset";
import { validateNode } from "./utils/validation";
import { PACKAGE_INFO } from "./constants";

const program = new Command();

// Validate Node.js version
validateNode();

program
  .name("exgen")
  .description("Next-Level Express Application Generator")
  .version(PACKAGE_INFO.version, "-v, --version", "output the current version")
  .helpOption("-h, --help", "display help for command");

// Main create command
program
  .argument("[project-name]", "name of the project to create")
  .option("--init", "interactive project initialization")

  // Express-generator compatible flags
  .option(
    "--view <engine>",
    "add view engine support (ejs|pug|hbs|hogan|mustache)"
  )
  .option("--css <style>", "add css engine support (less|sass|stylus|compass)")
  .option("--git", "add .gitignore")
  .option("--no-view", "generate without view engine")

  // EXGEN specific flags
  .option("--light", "lightweight structure with essentials", false)
  .option("--all", "enable all features except database/docker/swagger", false)
  .option("--prod", "production setup with docker, swagger, elk, tests", false)
  .option("--min", "minimal production setup (excludes docker/swagger)", false)

  // Individual feature flags
  .option("--ts, --typescript", "initialize TypeScript project", false)
  .option("--js, --javascript", "force JavaScript (default)", false)
  .option("--swagger", "add swagger/openapi documentation", false)
  .option("--docker", "add docker support with compose", false)
  .option("--mongo, --mongodb", "add mongodb support with mongoose", false)
  .option("--pg, --postgres", "add postgresql support with sequelize", false)
  .option("--redis", "add redis support", false)
  .option("--test", "add jest and supertest testing setup", false)
  .option("--elk", "add winston + elasticsearch logging", false)
  .option("--auth", "add jwt authentication setup", false)
  .option("--cors", "add cors middleware", false)
  .option("--helmet", "add helmet security middleware", false)
  .option("--rate-limit", "add express rate limiting", false)
  .option("--validation", "add joi validation middleware", false)

  // Popular preset combinations
  .option("--api", "API preset: ts + cors + helmet + validation + test", false)
  .option(
    "--fullstack",
    "Fullstack preset: view + css + auth + mongo + test",
    false
  )
  .option(
    "--microservice",
    "Microservice preset: ts + docker + redis + test + elk",
    false
  )
  .option(
    "--startup",
    "Startup preset: ts + mongo + auth + swagger + docker + test",
    false
  )

  // Development flags
  .option("--skip-install", "skip npm install", false)
  .option("--skip-git", "skip git initialization", false)
  .option("--verbose", "verbose output", false)
  .option("--dry-run", "show what would be created without creating", false)

  .action(async (projectName, options) => {
    try {
      if (options.init) {
        await initProject();
      } else {
        await createProject(projectName, options);
      }
    } catch (error: any) {
      console.error(chalk.red("✖"), "An error occurred:", error.message);
      process.exit(1);
    }
  });

// Config management command
program
  .command("config")
  .description("manage exgen configuration")
  .action(configCommand);

// Presets management command
program
  .command("presets")
  .description("manage and list available presets")
  .action(presetsCommand);

// Info command
program
  .command("info")
  .description("display environment debug info")
  .action(() => {
    console.log(chalk.cyan("System Information:"));
    console.log(`Node.js: ${process.version}`);
    console.log(`Platform: ${process.platform} ${process.arch}`);
    console.log(`EXGEN: ${PACKAGE_INFO.version}`);
    console.log(`Working Directory: ${process.cwd()}`);
  });

// Better error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
  writeOut: (str) => process.stdout.write(str),
});

// Handle unknown commands
program.on("command:*", () => {
  console.error(chalk.red("Invalid command: %s"), program.args.join(" "));
  console.log("See --help for a list of available commands.");
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
