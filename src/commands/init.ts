import { input, select, confirm, checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import { createProject } from "./create";

interface InitOptions {
  view?: string;
  css?: string;
  git?: boolean | undefined;
  typescript?: boolean | undefined;
  swagger?: boolean | undefined;
  docker?: boolean | undefined;
  mongodb?: boolean | undefined;
  postgres?: boolean | undefined;
  redis?: boolean | undefined;
  test?: boolean | undefined;
  elk?: boolean | undefined;
  auth?: boolean | undefined;
  cors?: boolean | undefined;
  helmet?: boolean | undefined;
  rateLimit?: boolean | undefined;
  validation?: boolean | undefined;
  skipInstall?: boolean | undefined;
  skipGit?: boolean | undefined;
  verbose?: boolean | undefined;
}

export async function initProject(): Promise<void> {
  console.log(chalk.cyan.bold("\n🚀 EXGEN - Interactive Project Setup\n"));

  try {
    // Project name
    const projectName = await input({
      message: "What is your project name?",
      default: "my-express-app",
      validate: (input) => {
        if (!input.trim()) return "Project name is required";
        if (!/^[a-z0-9-_]+$/.test(input.trim())) {
          return "Project name should only contain lowercase letters, numbers, hyphens, and underscores";
        }
        return true;
      },
    });

    // Language choice
    const language = await select({
      message: "Which language would you like to use?",
      choices: [
        { name: "TypeScript", value: "typescript" },
        { name: "JavaScript", value: "javascript" },
      ],
      default: "typescript",
    });

    // Project type/preset
    const projectType = await select({
      message: "What type of project are you building?",
      choices: [
        { name: "Custom (choose features manually)", value: "custom" },
        {
          name: "API Server",
          value: "api",
          description: "TypeScript + CORS + Helmet + Validation + Tests",
        },
        {
          name: "Full-Stack App",
          value: "fullstack",
          description: "View Engine + CSS + Auth + MongoDB + Tests",
        },
        {
          name: "Microservice",
          value: "microservice",
          description: "TypeScript + Docker + Redis + Tests + ELK",
        },
        {
          name: "Startup MVP",
          value: "startup",
          description: "TypeScript + MongoDB + Auth + Swagger + Docker + Tests",
        },
        {
          name: "Lightweight",
          value: "light",
          description: "Minimal setup with essentials",
        },
        {
          name: "Production Ready",
          value: "prod",
          description: "Full production setup with monitoring",
        },
      ],
      default: "custom",
    });

    let options: InitOptions = {
      typescript: language === "typescript",
    };

    // Apply preset configurations
    if (projectType !== "custom") {
      options = applyPreset(projectType, options);
    } else {
      // Custom configuration
      options = await customConfiguration(options);
    }

    // Additional options
    const additionalOptions = await checkbox({
      message: "Additional setup options:",
      choices: [
        { name: "Initialize Git repository", value: "git", checked: true },
        { name: "Skip npm install", value: "skipInstall" },
        { name: "Verbose output", value: "verbose" },
      ],
    });

    // Apply additional options
    options.git = additionalOptions.includes("git");
    options.skipInstall = additionalOptions.includes("skipInstall");
    options.skipGit = !additionalOptions.includes("git");
    options.verbose = additionalOptions.includes("verbose");

    // Summary
    console.log(chalk.yellow("\n📋 Project Configuration Summary:"));
    console.log(`Project Name: ${chalk.green(projectName)}`);
    console.log(
      `Language: ${chalk.green(language === "typescript" ? "TypeScript" : "JavaScript")}`
    );
    console.log(`Type: ${chalk.green(getProjectTypeDescription(projectType))}`);

    if (options.verbose) {
      displayDetailedOptions(options);
    }

    const proceed = await confirm({
      message: "Create project with these settings?",
      default: true,
    });

    if (proceed) {
      console.log(chalk.green("\n✨ Creating your project...\n"));
      await createProject(projectName, options);
    } else {
      console.log(chalk.yellow("Project creation cancelled."));
    }
  } catch (error: any) {
    if (error.name === "ExitPromptError") {
      console.log(chalk.yellow("\nProject creation cancelled."));
      process.exit(0);
    }
    throw error;
  }
}

function applyPreset(preset: string, baseOptions: InitOptions): InitOptions {
  const presets = {
    api: {
      ...baseOptions,
      typescript: true,
      cors: true,
      helmet: true,
      validation: true,
      test: true,
    },
    fullstack: {
      ...baseOptions,
      view: "ejs",
      css: "sass",
      auth: true,
      mongodb: true,
      test: true,
    },
    microservice: {
      ...baseOptions,
      typescript: true,
      docker: true,
      redis: true,
      test: true,
      elk: true,
    },
    startup: {
      ...baseOptions,
      typescript: true,
      mongodb: true,
      auth: true,
      swagger: true,
      docker: true,
      test: true,
    },
    light: {
      ...baseOptions,
      cors: true,
      helmet: true,
    },
    prod: {
      ...baseOptions,
      typescript: true,
      docker: true,
      swagger: true,
      test: true,
      elk: true,
      cors: true,
      helmet: true,
      rateLimit: true,
      validation: true,
    },
  };

  return presets[preset as keyof typeof presets] || baseOptions;
}

async function customConfiguration(options: InitOptions): Promise<InitOptions> {
  // View engine
  const viewEngine = await select({
    message: "Select view engine (or skip):",
    choices: [
      { name: "None", value: "none" },
      { name: "EJS", value: "ejs" },
      { name: "Pug", value: "pug" },
      { name: "Handlebars", value: "hbs" },
      { name: "Mustache", value: "mustache" },
    ],
    default: "none",
  });

  if (viewEngine !== "none") {
    options.view = viewEngine;

    const cssEngine = await select({
      message: "Select CSS preprocessor:",
      choices: [
        { name: "None", value: "none" },
        { name: "Sass/SCSS", value: "sass" },
        { name: "Less", value: "less" },
        { name: "Stylus", value: "stylus" },
      ],
      default: "none",
    });

    if (cssEngine !== "none") {
      options.css = cssEngine;
    }
  }

  // Database
  const database = await select({
    message: "Select database:",
    choices: [
      { name: "None", value: "none" },
      { name: "MongoDB (Mongoose)", value: "mongodb" },
      { name: "PostgreSQL (Sequelize)", value: "postgres" },
    ],
    default: "none",
  });

  if (database === "mongodb") options.mongodb = true;
  if (database === "postgres") options.postgres = true;

  // Features
  const features = await checkbox({
    message: "Select additional features:",
    choices: [
      { name: "Swagger/OpenAPI Documentation", value: "swagger" },
      { name: "Docker Support", value: "docker" },
      { name: "Redis Support", value: "redis" },
      { name: "Testing Setup (Jest + Supertest)", value: "test" },
      { name: "Logging (Winston + ELK)", value: "elk" },
      { name: "JWT Authentication", value: "auth" },
      { name: "CORS Middleware", value: "cors" },
      { name: "Helmet Security", value: "helmet" },
      { name: "Rate Limiting", value: "rateLimit" },
      { name: "Joi Validation", value: "validation" },
    ],
  });

  // Apply selected features
  features.forEach((feature) => {
    //@ts-ignore
    options[feature as keyof InitOptions] = true as boolean;
  });

  return options;
}

function getProjectTypeDescription(type: string): string {
  const descriptions = {
    api: "API Server",
    fullstack: "Full-Stack Application",
    microservice: "Microservice",
    startup: "Startup MVP",
    light: "Lightweight Setup",
    prod: "Production Ready",
    custom: "Custom Configuration",
  };

  return descriptions[type as keyof typeof descriptions] || "Custom";
}

function displayDetailedOptions(options: InitOptions): void {
  console.log(chalk.gray("Enabled features:"));

  const features = [
    { key: "typescript", label: "TypeScript" },
    { key: "view", label: `View Engine (${options.view})` },
    { key: "css", label: `CSS Preprocessor (${options.css})` },
    { key: "swagger", label: "Swagger Documentation" },
    { key: "docker", label: "Docker Support" },
    { key: "mongodb", label: "MongoDB" },
    { key: "postgres", label: "PostgreSQL" },
    { key: "redis", label: "Redis" },
    { key: "test", label: "Testing Setup" },
    { key: "elk", label: "ELK Logging" },
    { key: "auth", label: "JWT Authentication" },
    { key: "cors", label: "CORS" },
    { key: "helmet", label: "Helmet Security" },
    { key: "rateLimit", label: "Rate Limiting" },
    { key: "validation", label: "Validation" },
  ];

  features.forEach(({ key, label }) => {
    if (options[key as keyof InitOptions]) {
      console.log(`  ${chalk.green("✓")} ${label}`);
    }
  });
}
