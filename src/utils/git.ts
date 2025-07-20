import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import ora from "ora";
import { getLogger } from "./logger";

/**
 * Initialize a Git repository in the specified directory
 * @param projectPath - The path to the project directory
 * @returns Promise<void>
 */
export async function initializeGit(projectPath: string): Promise<void> {
  const logger = getLogger();
  const spinner = ora("Initializing Git repository...").start();

  try {
    // Check if Git is available
    if (!isGitAvailable()) {
      spinner.warn("Git is not available - skipping repository initialization");
      logger.warn("Please install Git to enable version control features");
      return;
    }

    // Check if already a Git repository
    if (await isGitRepository(projectPath)) {
      spinner.info("Directory is already a Git repository");
      return;
    }

    // Initialize Git repository
    execSync("git init", {
      cwd: projectPath,
      stdio: "pipe",
    });

    // Create .gitignore file
    await createGitignore(projectPath);

    // Create initial commit
    await createInitialCommit(projectPath);

    spinner.succeed("Git repository initialized");

    // Set up recommended Git configuration if it's a new user
    await suggestGitConfig(projectPath);
  } catch (error: any) {
    spinner.fail("Failed to initialize Git repository");

    if (error.message.includes("not found") || error.code === "ENOENT") {
      logger.warn("Git is not installed or not in PATH");
      logger.info("Please install Git: https://git-scm.com/downloads");
    } else {
      logger.error("Git initialization error: " + error.message);
    }

    // Don't throw error - Git initialization is not critical
    logger.info("Continuing without Git initialization...");
  }
}

/**
 * Check if Git is available in the system
 */
function isGitAvailable(): boolean {
  try {
    execSync("git --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if directory is already a Git repository
 */
async function isGitRepository(projectPath: string): Promise<boolean> {
  try {
    const gitPath = path.join(projectPath, ".git");
    return await fs.pathExists(gitPath);
  } catch {
    return false;
  }
}

/**
 * Create a comprehensive .gitignore file
 */
async function createGitignore(projectPath: string): Promise<void> {
  const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output/

# Logs
logs/
*.log

# Optional npm cache directory
.npm/

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
*.tsbuildinfo

# IDE and editor files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Docker
.dockerignore

# Temporary folders
tmp/
temp/

# Database files
*.sqlite
*.sqlite3
*.db

# Redis dump file
dump.rdb

# PM2 logs
pm2-logs/

# TypeScript cache
*.tsbuildinfo

# ESLint cache
.eslintcache

# Stylelint cache
.stylelintcache

# Prisma
prisma/migrations/
`;

  const gitignorePath = path.join(projectPath, ".gitignore");
  await fs.writeFile(gitignorePath, gitignoreContent);
}

/**
 * Create initial Git commit
 */
async function createInitialCommit(projectPath: string): Promise<void> {
  try {
    // Add all files
    execSync("git add .", {
      cwd: projectPath,
      stdio: "pipe",
    });

    // Check if there's anything to commit
    try {
      execSync("git diff --cached --exit-code", {
        cwd: projectPath,
        stdio: "pipe",
      });
      // If we reach here, there are no changes to commit
      return;
    } catch {
      // There are changes to commit, continue
    }

    // Create initial commit
    execSync('git commit -m "Initial commit: Created with EXGEN"', {
      cwd: projectPath,
      stdio: "pipe",
    });
  } catch (error: any) {
    // If commit fails due to user configuration, that's okay
    if (
      error.message.includes("user.email") ||
      error.message.includes("user.name")
    ) {
      getLogger().info(
        "Git user configuration needed - skipping initial commit"
      );
      getLogger().info(
        "Configure Git with: git config --global user.name 'Your Name'"
      );
      getLogger().info(
        "Configure Git with: git config --global user.email 'your.email@example.com'"
      );
    } else {
      throw error;
    }
  }
}

/**
 * Suggest Git configuration for new users
 */
async function suggestGitConfig(projectPath: string): Promise<void> {
  try {
    // Check if user has global Git configuration
    const userName = execSync("git config --global user.name", {
      cwd: projectPath,
      stdio: "pipe",
    })
      .toString()
      .trim();

    const userEmail = execSync("git config --global user.email", {
      cwd: projectPath,
      stdio: "pipe",
    })
      .toString()
      .trim();

    if (!userName || !userEmail) {
      const logger = getLogger();
      logger.info("\n📝 Git configuration recommendations:");

      if (!userName) {
        logger.info(
          "  Set your name: git config --global user.name 'Your Name'"
        );
      }

      if (!userEmail) {
        logger.info(
          "  Set your email: git config --global user.email 'your.email@example.com'"
        );
      }
    }
  } catch {
    // Configuration check failed, user might not have global config
    const logger = getLogger();
    logger.info("\n📝 Consider setting up Git configuration:");
    logger.info("  git config --global user.name 'Your Name'");
    logger.info("  git config --global user.email 'your.email@example.com'");
  }
}

/**
 * Add files to Git repository
 */
export async function addToGit(
  projectPath: string,
  files: string[]
): Promise<void> {
  if (!(await isGitRepository(projectPath))) {
    return;
  }

  try {
    const filePaths = files.join(" ");
    execSync(`git add ${filePaths}`, {
      cwd: projectPath,
      stdio: "pipe",
    });
  } catch (error: any) {
    getLogger().warn("Failed to add files to Git: " + error.message);
  }
}

/**
 * Check Git repository status
 */
export async function getGitStatus(projectPath: string): Promise<{
  isRepo: boolean;
  hasUncommittedChanges: boolean;
  currentBranch: string | null;
}> {
  try {
    const isRepo = await isGitRepository(projectPath);

    if (!isRepo) {
      return {
        isRepo: false,
        hasUncommittedChanges: false,
        currentBranch: null,
      };
    }

    // Check for uncommitted changes
    let hasUncommittedChanges = false;
    try {
      execSync("git diff --exit-code", { cwd: projectPath, stdio: "pipe" });
      execSync("git diff --cached --exit-code", {
        cwd: projectPath,
        stdio: "pipe",
      });
    } catch {
      hasUncommittedChanges = true;
    }

    // Get current branch
    let currentBranch: string | null = null;
    try {
      currentBranch = execSync("git branch --show-current", {
        cwd: projectPath,
        stdio: "pipe",
      })
        .toString()
        .trim();
    } catch {
      // Might be in detached HEAD state or no commits yet
    }

    return {
      isRepo: true,
      hasUncommittedChanges,
      currentBranch,
    };
  } catch {
    return {
      isRepo: false,
      hasUncommittedChanges: false,
      currentBranch: null,
    };
  }
}
