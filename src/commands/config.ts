import { select, input, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";

interface ExgenConfig {
  defaultLanguage: "typescript" | "javascript";
  defaultViewEngine: string;
  defaultCssEngine: string;
  defaultFeatures: string[];
  authorName: string;
  authorEmail: string;
  license: string;
  gitignore: boolean;
  skipInstall: boolean;
  customTemplates: Record<string, string>;
}

const CONFIG_DIR = path.join(os.homedir(), ".exgen");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const DEFAULT_CONFIG: ExgenConfig = {
  defaultLanguage: "typescript",
  defaultViewEngine: "none",
  defaultCssEngine: "none",
  defaultFeatures: ["cors", "helmet"],
  authorName: "",
  authorEmail: "",
  license: "MIT",
  gitignore: true,
  skipInstall: false,
  customTemplates: {},
};

export async function configCommand(): Promise<void> {
  console.log(chalk.cyan.bold("\n⚙️  EXGEN Configuration Manager\n"));

  const action = await select({
    message: "What would you like to do?",
    choices: [
      { name: "View current configuration", value: "view" },
      { name: "Edit configuration", value: "edit" },
      { name: "Reset to defaults", value: "reset" },
      { name: "Export configuration", value: "export" },
      { name: "Import configuration", value: "import" },
    ],
  });

  switch (action) {
    case "view":
      await viewConfig();
      break;
    case "edit":
      await editConfig();
      break;
    case "reset":
      await resetConfig();
      break;
    case "export":
      await exportConfig();
      break;
    case "import":
      await importConfig();
      break;
  }
}

async function viewConfig(): Promise<void> {
  const config = loadConfig();

  console.log(chalk.yellow("\n📋 Current Configuration:"));
  console.log(chalk.gray("─".repeat(50)));

  console.log(`${chalk.blue("Language:")} ${config.defaultLanguage}`);
  console.log(`${chalk.blue("View Engine:")} ${config.defaultViewEngine}`);
  console.log(`${chalk.blue("CSS Engine:")} ${config.defaultCssEngine}`);
  console.log(
    `${chalk.blue("Default Features:")} ${config.defaultFeatures.join(", ")}`
  );
  console.log(
    `${chalk.blue("Author Name:")} ${config.authorName || "Not set"}`
  );
  console.log(
    `${chalk.blue("Author Email:")} ${config.authorEmail || "Not set"}`
  );
  console.log(`${chalk.blue("License:")} ${config.license}`);
  console.log(
    `${chalk.blue("Auto Git Init:")} ${config.gitignore ? "Yes" : "No"}`
  );
  console.log(
    `${chalk.blue("Skip Install:")} ${config.skipInstall ? "Yes" : "No"}`
  );

  if (Object.keys(config.customTemplates).length > 0) {
    console.log(`${chalk.blue("Custom Templates:")}`);
    Object.entries(config.customTemplates).forEach(([name, path]) => {
      console.log(`  • ${name}: ${path}`);
    });
  }

  console.log(chalk.gray("\nConfig file location:"), CONFIG_FILE);
}

async function editConfig(): Promise<void> {
  const config = loadConfig();

  const section = await select({
    message: "Which section would you like to edit?",
    choices: [
      { name: "Project Defaults", value: "defaults" },
      { name: "Author Information", value: "author" },
      { name: "Behavior Settings", value: "behavior" },
      { name: "Custom Templates", value: "templates" },
    ],
  });

  switch (section) {
    case "defaults":
      await editDefaults(config);
      break;
    case "author":
      await editAuthor(config);
      break;
    case "behavior":
      await editBehavior(config);
      break;
    case "templates":
      await editTemplates(config);
      break;
  }

  saveConfig(config);
  console.log(chalk.green("\n✅ Configuration saved successfully!"));
}

async function editDefaults(config: ExgenConfig): Promise<void> {
  console.log(chalk.yellow("\n🎯 Project Defaults"));

  config.defaultLanguage = await select({
    message: "Default language:",
    choices: [
      { name: "TypeScript", value: "typescript" },
      { name: "JavaScript", value: "javascript" },
    ],
    default: config.defaultLanguage,
  });

  config.defaultViewEngine = await select({
    message: "Default view engine:",
    choices: [
      { name: "None", value: "none" },
      { name: "EJS", value: "ejs" },
      { name: "Pug", value: "pug" },
      { name: "Handlebars", value: "hbs" },
      { name: "Mustache", value: "mustache" },
    ],
    default: config.defaultViewEngine,
  });

  config.defaultCssEngine = await select({
    message: "Default CSS engine:",
    choices: [
      { name: "None", value: "none" },
      { name: "Sass/SCSS", value: "sass" },
      { name: "Less", value: "less" },
      { name: "Stylus", value: "stylus" },
    ],
    default: config.defaultCssEngine,
  });

  config.license = await select({
    message: "Default license:",
    choices: [
      { name: "MIT", value: "MIT" },
      { name: "Apache-2.0", value: "Apache-2.0" },
      { name: "GPL-3.0", value: "GPL-3.0" },
      { name: "BSD-3-Clause", value: "BSD-3-Clause" },
      { name: "ISC", value: "ISC" },
      { name: "Unlicense", value: "Unlicense" },
    ],
    default: config.license,
  });
}

async function editAuthor(config: ExgenConfig): Promise<void> {
  console.log(chalk.yellow("\n👤 Author Information"));

  config.authorName = await input({
    message: "Author name:",
    default: config.authorName,
  });

  config.authorEmail = await input({
    message: "Author email:",
    default: config.authorEmail,
    validate: (input) => {
      if (!input) return true; // Optional
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(input) || "Please enter a valid email address";
    },
  });
}

async function editBehavior(config: ExgenConfig): Promise<void> {
  console.log(chalk.yellow("\n🔧 Behavior Settings"));

  config.gitignore = await confirm({
    message: "Initialize Git repository by default?",
    default: config.gitignore,
  });

  config.skipInstall = await confirm({
    message: "Skip npm install by default?",
    default: config.skipInstall,
  });
}

async function editTemplates(config: ExgenConfig): Promise<void> {
  console.log(chalk.yellow("\n📄 Custom Templates"));

  const action = await select({
    message: "Template management:",
    choices: [
      { name: "Add template", value: "add" },
      { name: "Remove template", value: "remove" },
      { name: "List templates", value: "list" },
    ],
  });

  switch (action) {
    case "add":
      const name = await input({
        message: "Template name:",
        validate: (input) =>
          input.trim() ? true : "Template name is required",
      });

      const templatePath = await input({
        message: "Template path:",
        validate: (input) => {
          if (!input.trim()) return "Template path is required";
          if (!fs.existsSync(input.trim())) return "Path does not exist";
          return true;
        },
      });

      config.customTemplates[name] = templatePath;
      console.log(chalk.green(`✅ Added template: ${name}`));
      break;

    case "remove":
      if (Object.keys(config.customTemplates).length === 0) {
        console.log(chalk.yellow("No custom templates found."));
        break;
      }

      const templateToRemove = await select({
        message: "Select template to remove:",
        choices: Object.keys(config.customTemplates).map((name) => ({
          name,
          value: name,
        })),
      });

      delete config.customTemplates[templateToRemove];
      console.log(chalk.green(`✅ Removed template: ${templateToRemove}`));
      break;

    case "list":
      if (Object.keys(config.customTemplates).length === 0) {
        console.log(chalk.yellow("No custom templates found."));
      } else {
        console.log(chalk.blue("\nCustom Templates:"));
        Object.entries(config.customTemplates).forEach(([name, path]) => {
          console.log(`  • ${chalk.green(name)}: ${path}`);
        });
      }
      break;
  }
}

async function resetConfig(): Promise<void> {
  const confirm = await confirmDialog({
    message: "Are you sure you want to reset all configuration to defaults?",
    default: false,
  });

  if (confirm) {
    saveConfig(DEFAULT_CONFIG);
    console.log(chalk.green("\n✅ Configuration reset to defaults!"));
  } else {
    console.log(chalk.yellow("Reset cancelled."));
  }
}

async function exportConfig(): Promise<void> {
  const config = loadConfig();
  const exportPath = await input({
    message: "Export path:",
    default: path.join(process.cwd(), "exgen-config.json"),
  });

  try {
    fs.writeFileSync(exportPath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`\n✅ Configuration exported to: ${exportPath}`));
  } catch (error: any) {
    console.error(
      chalk.red("❌ Failed to export configuration:"),
      error.message
    );
  }
}

async function importConfig(): Promise<void> {
  const importPath = await input({
    message: "Import path:",
    validate: (input) => {
      if (!input.trim()) return "Path is required";
      if (!fs.existsSync(input.trim())) return "File does not exist";
      return true;
    },
  });

  try {
    const importedConfig = JSON.parse(fs.readFileSync(importPath, "utf8"));
    const mergedConfig = { ...DEFAULT_CONFIG, ...importedConfig };

    saveConfig(mergedConfig);
    console.log(chalk.green(`\n✅ Configuration imported from: ${importPath}`));
  } catch (error: any) {
    console.error(
      chalk.red("❌ Failed to import configuration:"),
      error.message
    );
  }
}

function loadConfig(): ExgenConfig {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG };
    }

    const configData = fs.readFileSync(CONFIG_FILE, "utf8");
    const config = JSON.parse(configData);
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error: any) {
    console.warn(
      chalk.yellow("Warning: Could not load config, using defaults")
    );
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(config: ExgenConfig): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error: any) {
    console.error(chalk.red("❌ Failed to save configuration:"), error.message);
    throw error;
  }
}

// Helper function for confirm dialog
async function confirmDialog(options: { message: string; default?: boolean }) {
  return await confirm({
    message: options.message,
    default: options.default ?? true,
  });
}
