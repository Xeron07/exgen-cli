import chalk from "chalk";
import { Command } from "commander";

// Define available presets with their configurations
const PRESETS = {
  api: {
    name: "API",
    description:
      "RESTful API with TypeScript, CORS, security, validation, and testing",
    flags: ["--ts", "--cors", "--helmet", "--validation", "--test"],
    features: [
      "TypeScript",
      "CORS middleware",
      "Helmet security",
      "Joi validation",
      "Jest testing",
    ],
  },
  fullstack: {
    name: "Fullstack",
    description:
      "Full-stack web application with views, CSS, auth, database, and testing",
    flags: ["--view", "ejs", "--css", "sass", "--auth", "--mongo", "--test"],
    features: [
      "EJS views",
      "Sass CSS",
      "JWT authentication",
      "MongoDB",
      "Jest testing",
    ],
  },
  microservice: {
    name: "Microservice",
    description:
      "Containerized microservice with TypeScript, Docker, Redis, and logging",
    flags: ["--ts", "--docker", "--redis", "--test", "--elk"],
    features: [
      "TypeScript",
      "Docker containers",
      "Redis caching",
      "ELK logging",
      "Jest testing",
    ],
  },
  startup: {
    name: "Startup",
    description:
      "Production-ready startup stack with full documentation and containerization",
    flags: ["--ts", "--mongo", "--auth", "--swagger", "--docker", "--test"],
    features: [
      "TypeScript",
      "MongoDB",
      "JWT auth",
      "Swagger docs",
      "Docker",
      "Testing",
    ],
  },
  light: {
    name: "Light",
    description: "Lightweight structure with only essential features",
    flags: ["--light"],
    features: [
      "Minimal Express setup",
      "Basic routing",
      "Essential middleware",
    ],
  },
  prod: {
    name: "Production",
    description:
      "Full production setup with monitoring, documentation, and containerization",
    flags: ["--prod"],
    features: [
      "Docker containers",
      "Swagger documentation",
      "ELK logging",
      "Comprehensive testing",
    ],
  },
  min: {
    name: "Minimal Production",
    description: "Production setup without Docker and Swagger",
    flags: ["--min"],
    features: ["Production optimized", "Security hardened", "Monitoring ready"],
  },
};

export async function presetsCommand(): Promise<void> {
  const program = new Command();

  program
    .name("presets")
    .description("manage and list available presets")
    .option("-l, --list", "list all available presets")
    .option(
      "-d, --details <preset>",
      "show detailed information about a specific preset"
    )
    .option("--flags <preset>", "show command flags for a specific preset")
    .helpOption("-h, --help", "display help for presets command");

  // If no arguments, show list by default
  const args = process.argv.slice(3); // Remove 'node', 'script', 'presets'

  if (args.length === 0 || args.includes("-l") || args.includes("--list")) {
    listPresets();
    return;
  }

  // Parse the remaining arguments
  program.parse(["node", "presets", ...args]);
  const options = program.opts();

  if (options.details) {
    showPresetDetails(options.details);
  } else if (options.flags) {
    showPresetFlags(options.flags);
  } else {
    listPresets();
  }
}

function listPresets(): void {
  console.log(chalk.cyan.bold("\n📦 Available Presets\n"));

  Object.entries(PRESETS).forEach(([key, preset]) => {
    console.log(
      chalk.green(`${preset.name.padEnd(20)} ${chalk.gray("--" + key)}`)
    );
    console.log(chalk.dim(`   ${preset.description}\n`));
  });

  console.log(chalk.yellow("💡 Usage examples:"));
  console.log(chalk.dim("  exgen my-project --api"));
  console.log(chalk.dim("  exgen my-app --fullstack"));
  console.log(chalk.dim("  exgen service --microservice"));
  console.log(
    chalk.dim("\n  Use 'exgen presets --details <preset>' for more information")
  );
}

function showPresetDetails(presetName: string): void {
  const preset = PRESETS[presetName as keyof typeof PRESETS];

  if (!preset) {
    console.error(chalk.red(`✖ Preset '${presetName}' not found`));
    console.log(
      chalk.dim("Available presets:"),
      Object.keys(PRESETS).join(", ")
    );
    return;
  }

  console.log(chalk.cyan.bold(`\n📦 ${preset.name} Preset\n`));
  console.log(chalk.white(preset.description));

  console.log(chalk.yellow.bold("\n🚀 Features included:"));
  preset.features.forEach((feature) => {
    console.log(chalk.green(`  ✓ ${feature}`));
  });

  console.log(chalk.yellow.bold("\n⚙️  Command flags:"));
  console.log(chalk.dim(`  ${preset.flags.join(" ")}`));

  console.log(chalk.yellow.bold("\n📝 Usage:"));
  console.log(chalk.white(`  exgen my-project --${presetName}`));

  console.log(chalk.dim("\n" + "─".repeat(50)));
}

function showPresetFlags(presetName: string): void {
  const preset = PRESETS[presetName as keyof typeof PRESETS];

  if (!preset) {
    console.error(chalk.red(`✖ Preset '${presetName}' not found`));
    console.log(
      chalk.dim("Available presets:"),
      Object.keys(PRESETS).join(", ")
    );
    return;
  }

  console.log(chalk.cyan(`Flags for ${preset.name} preset:`));
  console.log(preset.flags.join(" "));
}

// Export preset definitions for use in other modules
export { PRESETS };
