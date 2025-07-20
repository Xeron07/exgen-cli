import { spawn } from "child_process";
import ora from "ora";
import { ResolvedOptions } from "../generators/types";
import { getRequiredDependencies, getRequiredDevDependencies } from "./options";
import { getLogger } from "./logger";

export interface InstallResult {
  success: boolean;
  error?: string;
  output?: string;
}

export async function installDependencies(
  options: ResolvedOptions
): Promise<void> {
  const logger = getLogger();

  try {
    // Get dependencies to install
    const dependencies = getRequiredDependencies(options);
    const devDependencies = getRequiredDevDependencies(options);

    // Install production dependencies
    if (dependencies.length > 0) {
      await installPackages(dependencies, false, options);
    }

    // Install development dependencies
    if (devDependencies.length > 0) {
      await installPackages(devDependencies, true, options);
    }

    logger.info("All dependencies installed successfully");
  } catch (error) {
    logger.error("Failed to install dependencies: " + error);
    throw error;
  }
}

async function installPackages(
  packages: string[],
  isDev: boolean = false,
  options: ResolvedOptions
): Promise<InstallResult> {
  const { packageManager, projectPath } = options;
  const logger = getLogger();

  const installCommand = getInstallCommand(packageManager, isDev);
  const args = [...installCommand.args, ...packages];

  const spinner = ora(
    `Installing ${isDev ? "development" : "production"} dependencies (${packages.length} packages)...`
  ).start();

  try {
    const result = await executeCommand(
      installCommand.command,
      args,
      projectPath
    );

    if (result.success) {
      spinner.succeed(
        `${isDev ? "Development" : "Production"} dependencies installed (${packages.length} packages)`
      );

      // Log installed packages in verbose mode
      if (process.env.VERBOSE) {
        logger.info(`Installed packages: ${packages.join(", ")}`);
      }
    } else {
      spinner.fail(
        `Failed to install ${isDev ? "development" : "production"} dependencies`
      );
      throw new Error(result.error || "Installation failed");
    }

    return result;
  } catch (error) {
    spinner.fail(
      `Failed to install ${isDev ? "development" : "production"} dependencies`
    );
    throw error;
  }
}

function getInstallCommand(
  packageManager: string,
  isDev: boolean = false
): { command: string; args: string[] } {
  switch (packageManager) {
    case "yarn":
      return {
        command: "yarn",
        args: isDev ? ["add", "--dev"] : ["add"],
      };

    case "pnpm":
      return {
        command: "pnpm",
        args: isDev ? ["add", "--save-dev"] : ["add"],
      };

    case "bun":
      return {
        command: "bun",
        args: isDev ? ["add", "--dev"] : ["add"],
      };

    case "npm":
    default:
      return {
        command: "npm",
        args: isDev ? ["install", "--save-dev"] : ["install", "--save"],
      };
  }
}

function executeCommand(
  command: string,
  args: string[],
  cwd: string,
  timeout: number = 300000 // 5 minutes
): Promise<InstallResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["inherit", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    let output = "";
    let error = "";

    // Set up timeout
    const timeoutId = setTimeout(() => {
      child.kill("SIGTERM");
      resolve({
        success: false,
        error: `Installation timed out after ${timeout / 1000} seconds`,
      });
    }, timeout);

    // Collect stdout
    child.stdout?.on("data", (data) => {
      output += data.toString();
    });

    // Collect stderr
    child.stderr?.on("data", (data) => {
      error += data.toString();
    });

    // Handle process completion
    child.on("close", (code) => {
      clearTimeout(timeoutId);

      if (code === 0) {
        resolve({
          success: true,
          output,
        });
      } else {
        resolve({
          success: false,
          error: error || `Process exited with code ${code}`,
          output,
        });
      }
    });

    // Handle process error
    child.on("error", (err) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        error: `Failed to start process: ${err.message}`,
      });
    });
  });
}

export async function checkPackageManagerAvailability(
  packageManager: string
): Promise<boolean> {
  try {
    const result = await executeCommand(
      packageManager,
      ["--version"],
      process.cwd(),
      5000
    );
    return result.success;
  } catch {
    return false;
  }
}

export async function getAvailablePackageManagers(): Promise<string[]> {
  const managers = ["npm", "yarn", "pnpm", "bun"];
  const available: string[] = [];

  for (const manager of managers) {
    if (await checkPackageManagerAvailability(manager)) {
      available.push(manager);
    }
  }

  return available;
}

export function getPackageManagerVersion(
  packageManager: string
): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn(packageManager, ["--version"], {
      stdio: ["inherit", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    let output = "";

    child.stdout?.on("data", (data) => {
      output += data.toString().trim();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        resolve(null);
      }
    });

    child.on("error", () => {
      resolve(null);
    });
  });
}

export async function validatePackageManager(
  packageManager: string
): Promise<{ valid: boolean; error?: string }> {
  const available = await getAvailablePackageManagers();

  if (!available.includes(packageManager)) {
    return {
      valid: false,
      error: `Package manager "${packageManager}" is not available. Available options: ${available.join(", ")}`,
    };
  }

  return { valid: true };
}

export function getInstallScript(packageManager: string): string {
  switch (packageManager) {
    case "yarn":
      return "yarn install";
    case "pnpm":
      return "pnpm install";
    case "bun":
      return "bun install";
    case "npm":
    default:
      return "npm install";
  }
}

export function getRunScript(packageManager: string, script: string): string {
  switch (packageManager) {
    case "yarn":
      return `yarn ${script}`;
    case "pnpm":
      return `pnpm run ${script}`;
    case "bun":
      return `bun run ${script}`;
    case "npm":
    default:
      return `npm run ${script}`;
  }
}
