import chalk from "chalk";
import { Logger, LogLevel } from "../generators/types";

class ConsoleLogger implements Logger {
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message: string): void {
    console.log(chalk.blue("ℹ"), message);
  }

  warn(message: string): void {
    console.log(chalk.yellow("⚠"), message);
  }

  error(message: string): void {
    console.error(chalk.red("✖"), message);
  }

  success(message: string): void {
    console.log(chalk.green("✓"), message);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(chalk.gray("🔍"), chalk.gray(message));
    }
  }

  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }
}

// Singleton logger instance
let loggerInstance: ConsoleLogger | null = null;

export function getLogger(verbose = false): Logger {
  if (!loggerInstance) {
    loggerInstance = new ConsoleLogger(verbose);
  } else if (verbose) {
    loggerInstance.setVerbose(verbose);
  }
  return loggerInstance;
}

export function logStep(step: number, total: number, message: string): void {
  const logger = getLogger();
  logger.info(`[${step}/${total}] ${message}`);
}

export function logHeader(title: string): void {
  console.log("\n" + chalk.cyan.bold("═".repeat(50)));
  console.log(chalk.cyan.bold(`  ${title.toUpperCase()}`));
  console.log(chalk.cyan.bold("═".repeat(50)) + "\n");
}

export function logSeparator(): void {
  console.log(chalk.gray("─".repeat(50)));
}

export function logSuccess(message: string): void {
  console.log("\n" + chalk.green.bold("🎉 " + message));
}

export function logError(error: Error | string): void {
  const message = error instanceof Error ? error.message : error;
  console.error("\n" + chalk.red.bold("💥 Error: " + message));

  if (error instanceof Error && error.stack) {
    console.error(chalk.red(error.stack));
  }
}

export function logBox(
  messages: string[],
  color: keyof typeof chalk = "cyan"
): void {
  const maxLength = Math.max(...messages.map((msg) => msg.length));
  const border = "═".repeat(maxLength + 4);

  //@ts-ignore
  console.log(chalk[color](border));
  messages.forEach((msg) => {
    const padding = " ".repeat(maxLength - msg.length);
    //@ts-ignore
    console.log(chalk[color](`║ ${msg}${padding} ║`));
  });
  //@ts-ignore
  console.log(chalk[color](border));
}

export function logTable(
  data: Array<{ label: string; value: string }>,
  title?: string
): void {
  if (title) {
    console.log("\n" + chalk.cyan.bold(title));
    logSeparator();
  }

  const maxLabelLength = Math.max(...data.map((item) => item.label.length));

  data.forEach(({ label, value }) => {
    const padding = " ".repeat(maxLabelLength - label.length);
    console.log(`${chalk.gray(label)}:${padding} ${chalk.white(value)}`);
  });

  console.log();
}
