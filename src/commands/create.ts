import fs from "fs-extra";
import path from "path";
import ora from "ora";
import {
  ProjectOptions,
  ResolvedOptions,
  TemplateData,
} from "../generators/types";
import {
  validateProjectName,
  validateProjectPath,
  validateOptions,
  sanitizeProjectName,
} from "../utils/validation";
import { mergeWithConfig, detectPackageManager } from "../utils/config";
import { resolveOptions } from "../utils/options";
import { generateProject } from "../generators/project";
import { installDependencies } from "../utils/installer";
import { initializeGit } from "../utils/git";
import {
  getLogger,
  logStep,
  logHeader,
  logSuccess,
  logError,
  logTable,
} from "../utils/logger";

export async function createProject(
  projectName: string | undefined,
  options: ProjectOptions
): Promise<void> {
  const logger = getLogger(options.verbose);

  try {
    logHeader("EXGEN - Express Application Generator");

    // Step 1: Validate and resolve project name
    logStep(1, 6, "Validating project configuration...");

    if (!projectName) {
      throw new Error(
        "Project name is required. Use: exgen <project-name> [options]"
      );
    }

    // Validate project name
    const nameValidation = validateProjectName(projectName);
    if (!nameValidation.valid) {
      throw new Error(
        `Invalid project name:\n${nameValidation.errors.join("\n")}`
      );
    }

    if (nameValidation.warnings.length > 0) {
      nameValidation.warnings.forEach((warning) => logger.warn(warning));
    }

    // Sanitize project name
    const sanitizedName = sanitizeProjectName(projectName);
    const projectPath = path.resolve(process.cwd(), sanitizedName);

    // Validate project path
    const pathValidation = validateProjectPath(projectPath);
    if (!pathValidation.valid) {
      throw new Error(
        `Invalid project path:\n${pathValidation.errors.join("\n")}`
      );
    }

    if (pathValidation.warnings.length > 0) {
      pathValidation.warnings.forEach((warning) => logger.warn(warning));
    }

    // Step 2: Resolve options with config
    logStep(2, 6, "Resolving project options...");

    const mergedOptions = mergeWithConfig(options, process.cwd());
    const optionsValidation = validateOptions(mergedOptions);

    if (!optionsValidation.valid) {
      throw new Error(
        `Invalid options:\n${optionsValidation.errors.join("\n")}`
      );
    }

    if (optionsValidation.warnings.length > 0) {
      optionsValidation.warnings.forEach((warning) => logger.warn(warning));
    }

    // Resolve final options
    const resolvedOptions: ResolvedOptions = resolveOptions(
      sanitizedName,
      projectPath,
      mergedOptions
    );

    // Show what will be created
    if (options.dryRun) {
      await showDryRun(resolvedOptions);
      return;
    }

    // Display project summary
    displayProjectSummary(resolvedOptions);

    // Step 3: Create project directory structure
    logStep(3, 6, "Creating project structure...");

    const spinner = ora("Setting up project directories...").start();

    try {
      await fs.ensureDir(projectPath);
      await generateProject(resolvedOptions);
      spinner.succeed("Project structure created");
    } catch (error: any) {
      spinner.fail("Failed to create project structure");
      throw error;
    }

    // Step 4: Install dependencies
    if (!options.skipInstall) {
      logStep(4, 6, "Installing dependencies...");
      await installDependencies(resolvedOptions);
    } else {
      logger.info("Skipping dependency installation");
    }

    // Step 5: Initialize Git repository
    if (!options.skipGit && options.git !== false) {
      logStep(5, 6, "Initializing Git repository...");
      await initializeGit(projectPath);
    } else {
      logger.info("Skipping Git initialization");
    }

    // Step 6: Show completion message
    logStep(6, 6, "Finalizing project setup...");

    await showCompletionMessage(resolvedOptions);
  } catch (error: any) {
    logError(error);
    process.exit(1);
  }
}

function displayProjectSummary(options: ResolvedOptions): void {
  const tableData = [
    { label: "Project Name", value: options.projectName },
    { label: "Location", value: options.projectPath },
    {
      label: "Language",
      value: options.isTypescript ? "TypeScript" : "JavaScript",
    },
    { label: "Package Manager", value: options.packageManager },
    {
      label: "Features",
      value: options.features.join(", ") || "Basic Express setup",
    },
  ];

  if (options.view && !options.noView) {
    tableData.push({ label: "View Engine", value: options.view });
  }

  if (options.css) {
    tableData.push({ label: "CSS Engine", value: options.css });
  }

  logTable(tableData, "Project Summary");
}

async function showDryRun(options: ResolvedOptions): Promise<void> {
  const logger = getLogger();

  logger.info(
    "DRY RUN - Project would be created with the following configuration:"
  );
  displayProjectSummary(options);

  // Show file structure that would be created
  logger.info("\nFiles and directories that would be created:");

  // This is a simplified version - in a real implementation,
  // you'd want to show the actual file tree that would be generated
  const structure = [
    "src/",
    "src/api/",
    "src/config/",
    "src/utils/",
    "bin/",
    "public/",
    "package.json",
    "README.md",
  ];

  if (options.isTypescript) {
    structure.push("tsconfig.json");
  }

  if (options.docker) {
    structure.push("Dockerfile", "docker-compose.yml");
  }

  if (options.test) {
    structure.push("tests/", "jest.config.js");
  }

  structure.forEach((item) => {
    logger.info(`  ${item}`);
  });
}

async function showCompletionMessage(options: ResolvedOptions): Promise<void> {
  const logger = getLogger();
  const relativeProjectPath = path.relative(process.cwd(), options.projectPath);

  logSuccess("Project created successfully!");

  const nextSteps = [`cd ${relativeProjectPath}`];

  if (options.skipInstall) {
    nextSteps.push(`${options.packageManager} install`);
  }

  if (options.isTypescript) {
    nextSteps.push(`${options.packageManager} run build`);
    nextSteps.push(`${options.packageManager} run dev`);
  } else {
    nextSteps.push(`${options.packageManager} run dev`);
  }

  console.log("\n" + "🚀 " + "Next steps:");
  nextSteps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step}`);
  });

  // Show additional information based on features
  const additionalInfo: string[] = [];

  if (options.swagger) {
    additionalInfo.push(
      "📚 Swagger documentation will be available at http://localhost:3000/api-docs"
    );
  }

  if (options.mongodb) {
    additionalInfo.push(
      "🍃 MongoDB connection configured - update DATABASE_URL in .env"
    );
  }

  if (options.postgres) {
    additionalInfo.push(
      "🐘 PostgreSQL connection configured - update DATABASE_URL in .env"
    );
  }

  if (options.redis) {
    additionalInfo.push(
      "🔴 Redis connection configured - update REDIS_URL in .env"
    );
  }

  if (options.docker) {
    additionalInfo.push(
      "🐳 Docker setup included - run: docker-compose up --build"
    );
  }

  if (options.test) {
    additionalInfo.push("🧪 Test suite configured - run: npm test");
  }

  if (additionalInfo.length > 0) {
    console.log("\n" + "💡 " + "Additional information:");
    additionalInfo.forEach((info) => {
      console.log(`  ${info}`);
    });
  }

  console.log(
    "\n" +
      "📖 " +
      "Documentation and examples are included in the generated README.md"
  );
  console.log("🌟 " + "Happy coding with EXGEN!\n");
}
