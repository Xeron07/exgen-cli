import { cosmiconfigSync } from "cosmiconfig";
import fs from "fs-extra";
import path from "path";
import { ExgenConfig, ProjectOptions } from "../generators/types";
import { CONFIG_FILE_NAMES } from "../constants";
import { getLogger } from "./logger";

const explorer = cosmiconfigSync("exgen", {
  searchPlaces: CONFIG_FILE_NAMES,
});

export function loadConfig(searchFrom?: string): ExgenConfig | null {
  const logger = getLogger();

  try {
    const result = explorer.search(searchFrom);

    if (result) {
      logger.debug(`Found config file: ${result.filepath}`);
      return result.config as ExgenConfig;
    }

    logger.debug("No config file found");
    return null;
  } catch (error: any) {
    logger.warn(`Error loading config file: ${error.message}`);
    return null;
  }
}

export function mergeWithConfig(
  options: ProjectOptions,
  projectPath?: string
): ProjectOptions {
  const config = loadConfig(projectPath);

  if (!config || !config.defaults) {
    return options;
  }

  // Merge config defaults with CLI options (CLI options take precedence)
  return {
    ...config.defaults,
    ...options,
  };
}

export function getPresetFromConfig(
  presetName: string,
  projectPath?: string
): ProjectOptions | null {
  const config = loadConfig(projectPath);

  if (!config || !config.presets) {
    return null;
  }

  return config.presets[presetName] || null;
}

export function createConfigFile(
  configPath: string,
  config: ExgenConfig
): void {
  const logger = getLogger();

  try {
    fs.ensureDirSync(path.dirname(configPath));
    fs.writeJsonSync(configPath, config, { spaces: 2 });
    logger.success(`Config file created: ${configPath}`);
  } catch (error: any) {
    logger.error(`Failed to create config file: ${error.message}`);
    throw error;
  }
}

export function getDefaultConfig(): ExgenConfig {
  return {
    defaults: {
      typescript: true,
      git: true,
      cors: true,
      helmet: true,
    },
    presets: {
      "quick-api": {
        typescript: true,
        noView: true,
        cors: true,
        helmet: true,
        validation: true,
        test: true,
      },
      "full-app": {
        typescript: true,
        view: "ejs",
        css: "sass",
        mongodb: true,
        auth: true,
        test: true,
        swagger: true,
      },
    },
    packageManager: "npm",
  };
}

export function detectPackageManager(
  projectPath: string
): "npm" | "yarn" | "pnpm" {
  // Check for lock files
  if (fs.existsSync(path.join(projectPath, "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  if (fs.existsSync(path.join(projectPath, "yarn.lock"))) {
    return "yarn";
  }

  // Check for package manager in config
  const config = loadConfig(projectPath);
  if (config?.packageManager) {
    return config.packageManager;
  }

  // Check global installation
  try {
    require("child_process").execSync("yarn --version", { stdio: "ignore" });
    return "yarn";
  } catch {
    // Fall back to npm
  }

  try {
    require("child_process").execSync("pnpm --version", { stdio: "ignore" });
    return "pnpm";
  } catch {
    // Fall back to npm
  }

  return "npm";
}

export function getConfigFilePath(projectPath: string = process.cwd()): string {
  return path.join(projectPath, ".exgenrc.json");
}

export function hasConfigFile(projectPath: string = process.cwd()): boolean {
  return CONFIG_FILE_NAMES.some((fileName) =>
    fs.existsSync(path.join(projectPath, fileName))
  );
}

export function validateConfig(config: ExgenConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate package manager
  if (
    config.packageManager &&
    !["npm", "yarn", "pnpm"].includes(config.packageManager)
  ) {
    errors.push(`Invalid package manager: ${config.packageManager}`);
  }

  // Validate presets structure
  if (config.presets) {
    for (const [name, preset] of Object.entries(config.presets)) {
      if (typeof preset !== "object") {
        errors.push(`Invalid preset "${name}": must be an object`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function listAvailablePresets(
  projectPath?: string
): Array<{ name: string; description?: string }> {
  const config = loadConfig(projectPath);
  const presets: Array<{ name: string; description?: string }> = [];

  if (config?.presets) {
    for (const [name, preset] of Object.entries(config.presets)) {
      presets.push({
        name,
        description: `Custom preset with: ${Object.keys(preset).join(", ")}`,
      });
    }
  }

  return presets;
}
