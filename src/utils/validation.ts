import fs from "fs-extra";
import path from "path";
import validateNpmPackageName from "validate-npm-package-name";
import { ValidationResult, ProjectOptions } from "../generators/types";
import {
  MIN_NODE_VERSION,
  SUPPORTED_VIEW_ENGINES,
  SUPPORTED_CSS_ENGINES,
} from "../constants";
import { getLogger } from "./logger";

export function validateNode(): void {
  const nodeVersion = parseInt(process.version.slice(1).split(".")[0], 10);

  if (nodeVersion < MIN_NODE_VERSION) {
    console.error(
      `Error: Node.js version ${MIN_NODE_VERSION} or higher is required. You are using ${process.version}`
    );
    process.exit(1);
  }
}

export function validateProjectName(name: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!name) {
    result.valid = false;
    result.errors.push("Project name is required");
    return result;
  }

  // Check npm package name validity
  const npmValidation = validateNpmPackageName(name);
  if (!npmValidation.validForNewPackages) {
    result.valid = false;
    result.errors.push("Project name must be a valid npm package name");

    if (npmValidation.errors) {
      result.errors.push(...npmValidation.errors);
    }
  }

  if (npmValidation.warnings) {
    result.warnings.push(...npmValidation.warnings);
  }

  // Additional checks
  if (name.length > 214) {
    result.valid = false;
    result.errors.push("Project name must be less than 214 characters");
  }

  if (name !== name.toLowerCase()) {
    result.warnings.push("Project name should be lowercase");
  }

  return result;
}

export function validateProjectPath(projectPath: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Check if directory already exists
    if (fs.existsSync(projectPath)) {
      const stats = fs.statSync(projectPath);

      if (!stats.isDirectory()) {
        result.valid = false;
        result.errors.push("A file with this name already exists");
        return result;
      }

      // Check if directory is empty
      const files = fs.readdirSync(projectPath);
      if (files.length > 0) {
        result.warnings.push(
          "Directory is not empty. Files may be overwritten"
        );
      }
    }

    // Check if parent directory is writable
    const parentDir = path.dirname(projectPath);
    try {
      fs.accessSync(parentDir, fs.constants.W_OK);
    } catch {
      result.valid = false;
      result.errors.push("Parent directory is not writable");
    }
  } catch (error: any) {
    result.valid = false;
    result.errors.push(`Cannot access project path: ${error.message}`);
  }

  return result;
}

export function validateOptions(options: ProjectOptions): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const logger = getLogger();

  // Validate view engine
  if (options.view && !SUPPORTED_VIEW_ENGINES.includes(options.view)) {
    result.valid = false;
    result.errors.push(
      `Unsupported view engine: ${options.view}. Supported engines: ${SUPPORTED_VIEW_ENGINES.join(", ")}`
    );
  }

  // Validate CSS engine
  if (options.css && !SUPPORTED_CSS_ENGINES.includes(options.css)) {
    result.valid = false;
    result.errors.push(
      `Unsupported CSS engine: ${options.css}. Supported engines: ${SUPPORTED_CSS_ENGINES.join(", ")}`
    );
  }

  // Validate conflicting options
  if (options.typescript && options.javascript) {
    result.warnings.push(
      "Both TypeScript and JavaScript flags specified. TypeScript will be used"
    );
  }

  if (options.mongodb && options.postgres) {
    result.warnings.push(
      "Both MongoDB and PostgreSQL selected. Both will be included"
    );
  }

  if (options.noView && options.view) {
    result.valid = false;
    result.errors.push("Cannot specify both --no-view and --view");
  }

  // Validate preset combinations
  const presets = [
    options.light,
    options.all,
    options.prod,
    options.min,
    options.api,
    options.fullstack,
    options.microservice,
    options.startup,
  ];
  const activePresets = presets.filter(Boolean);

  if (activePresets.length > 1) {
    result.warnings.push(
      "Multiple presets specified. Last one will take precedence"
    );
  }

  return result;
}

export function validateEnvironment(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Check for required tools
  const requiredCommands = ["node", "npm"];

  for (const cmd of requiredCommands) {
    try {
      require("child_process").execSync(`${cmd} --version`, {
        stdio: "ignore",
      });
    } catch {
      result.valid = false;
      result.errors.push(`${cmd} is not installed or not in PATH`);
    }
  }

  // Check for optional tools
  const optionalCommands = ["git", "docker", "yarn", "pnpm"];

  for (const cmd of optionalCommands) {
    try {
      require("child_process").execSync(`${cmd} --version`, {
        stdio: "ignore",
      });
    } catch {
      result.warnings.push(`${cmd} is not available (optional)`);
    }
  }

  return result;
}

export function sanitizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateFileOverwrite(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return true;
  }

  // Add logic for interactive confirmation if needed
  return false;
}

export function isEmptyDirectory(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      return true;
    }

    const files = fs.readdirSync(dirPath);
    return files.length === 0 || files.every((file) => file.startsWith("."));
  } catch {
    return false;
  }
}
