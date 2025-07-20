import { ProjectOptions, ResolvedOptions } from "../generators/types";
import { detectPackageManager } from "./config";
import { PRESET_DEFINITIONS } from "../constants";

export function resolveOptions(
  projectName: string,
  projectPath: string,
  options: ProjectOptions
): ResolvedOptions {
  // Start with base options
  let resolved = { ...options };

  // Apply presets first (they can be overridden by specific flags)
  resolved = applyPresets(resolved);

  // Resolve TypeScript preference
  const isTypescript = resolveTypeScript(resolved);

  // Determine features
  const features = determineFeatures(resolved);

  // Detect package manager
  const packageManager = detectPackageManager(projectPath);

  return {
    ...resolved,
    projectName,
    projectPath,
    packageManager,
    isTypescript,
    features,
  };
}

function applyPresets(options: ProjectOptions): ProjectOptions {
  let resolved = { ...options };

  // Apply built-in presets in order of priority
  if (options.light) {
    resolved = { ...resolved, ...getPresetOptions("light") };
  }

  if (options.api) {
    resolved = { ...resolved, ...getPresetOptions("api") };
  }

  if (options.fullstack) {
    resolved = { ...resolved, ...getPresetOptions("fullstack") };
  }

  if (options.microservice) {
    resolved = { ...resolved, ...getPresetOptions("microservice") };
  }

  if (options.startup) {
    resolved = { ...resolved, ...getPresetOptions("startup") };
  }

  if (options.min) {
    resolved = { ...resolved, ...getPresetOptions("min") };
  }

  if (options.prod) {
    resolved = { ...resolved, ...getPresetOptions("prod") };
  }

  if (options.all) {
    resolved = { ...resolved, ...getAllPresetOptions() };
  }

  // Re-apply original options to ensure CLI flags take precedence
  return { ...resolved, ...options };
}

function getPresetOptions(presetName: string): Partial<ProjectOptions> {
  const preset = PRESET_DEFINITIONS.find((p) => p.name === presetName);
  return preset?.options || {};
}

function getAllPresetOptions(): Partial<ProjectOptions> {
  return {
    typescript: true,
    cors: true,
    helmet: true,
    rateLimit: true,
    validation: true,
    test: true,
    elk: true,
  };
}

function resolveTypeScript(options: ProjectOptions): boolean {
  // If explicitly set to JavaScript, use JavaScript
  if (options.javascript && !options.typescript) {
    return false;
  }

  // Default to TypeScript for most presets
  if (
    options.typescript ||
    options.api ||
    options.microservice ||
    options.startup ||
    options.prod ||
    options.min ||
    options.light
  ) {
    return true;
  }

  // Default to JavaScript for fullstack (to be more beginner-friendly)
  return false;
}

function determineFeatures(options: ProjectOptions): string[] {
  const features: string[] = [];

  // Language
  if (resolveTypeScript(options)) {
    features.push("TypeScript");
  } else {
    features.push("JavaScript");
  }

  // View and CSS
  if (!options.noView) {
    if (options.view) {
      features.push(`View: ${options.view}`);
    } else if (options.fullstack) {
      features.push("View: EJS");
    }
  }

  if (options.css) {
    features.push(`CSS: ${options.css}`);
  }

  // Databases
  if (options.mongodb) {
    features.push("MongoDB");
  }

  if (options.postgres) {
    features.push("PostgreSQL");
  }

  if (options.redis) {
    features.push("Redis");
  }

  // Authentication and Security
  if (options.auth) {
    features.push("JWT Auth");
  }

  if (options.cors) {
    features.push("CORS");
  }

  if (options.helmet) {
    features.push("Helmet");
  }

  if (options.rateLimit) {
    features.push("Rate Limiting");
  }

  // Validation and Documentation
  if (options.validation) {
    features.push("Joi Validation");
  }

  if (options.swagger) {
    features.push("Swagger/OpenAPI");
  }

  // Development and Operations
  if (options.test) {
    features.push("Jest Testing");
  }

  if (options.docker) {
    features.push("Docker");
  }

  if (options.elk) {
    features.push("ELK Logging");
  }

  // Git
  if (options.git !== false) {
    features.push("Git");
  }

  return features;
}

export function getFinalViewEngine(
  options: ProjectOptions
): string | undefined {
  if (options.noView) {
    return undefined;
  }

  if (options.view) {
    return options.view;
  }

  // Default view engines for presets
  if (options.fullstack) {
    return "ejs";
  }

  return undefined;
}

export function getFinalCSSEngine(options: ProjectOptions): string | undefined {
  if (options.css) {
    return options.css;
  }

  // Default CSS engines for presets
  if (options.fullstack) {
    return "sass";
  }

  return undefined;
}

export function shouldIncludeFeature(
  feature: string,
  options: ResolvedOptions
): boolean {
  switch (feature) {
    case "view":
      return !options.noView && !!getFinalViewEngine(options);

    case "css":
      return !!getFinalCSSEngine(options);

    case "typescript":
      return options.isTypescript;

    case "mongodb":
      return !!options.mongodb;

    case "postgres":
      return !!options.postgres;

    case "redis":
      return !!options.redis;

    case "swagger":
      return !!options.swagger;

    case "docker":
      return !!options.docker;

    case "test":
      return !!options.test;

    case "auth":
      return !!options.auth;

    case "cors":
      return !!options.cors;

    case "helmet":
      return !!options.helmet;

    case "rateLimit":
      return !!options.rateLimit;

    case "validation":
      return !!options.validation;

    case "elk":
      return !!options.elk;

    default:
      return false;
  }
}

export function getRequiredDependencies(options: ResolvedOptions): string[] {
  const deps: string[] = ["express", "dotenv"];

  if (shouldIncludeFeature("cors", options)) {
    deps.push("cors");
  }

  if (shouldIncludeFeature("view", options)) {
    deps.push("cookie-parser", "morgan");

    const viewEngine = getFinalViewEngine(options);
    if (viewEngine) {
      deps.push(viewEngine);
    }
  }

  if (shouldIncludeFeature("css", options)) {
    const cssEngine = getFinalCSSEngine(options);
    if (cssEngine === "sass" || cssEngine === "scss") {
      deps.push("node-sass-middleware");
    } else if (cssEngine === "less") {
      deps.push("less-middleware");
    } else if (cssEngine === "stylus") {
      deps.push("stylus");
    }
  }

  if (shouldIncludeFeature("mongodb", options)) {
    deps.push("mongoose");
  }

  if (shouldIncludeFeature("postgres", options)) {
    deps.push("sequelize", "pg");
  }

  if (shouldIncludeFeature("redis", options)) {
    deps.push("ioredis");
  }

  if (shouldIncludeFeature("swagger", options)) {
    deps.push("swagger-jsdoc", "swagger-ui-express");
  }

  if (shouldIncludeFeature("auth", options)) {
    deps.push("jsonwebtoken", "bcryptjs");
  }

  if (shouldIncludeFeature("helmet", options)) {
    deps.push("helmet");
  }

  if (shouldIncludeFeature("rateLimit", options)) {
    deps.push("express-rate-limit");
  }

  if (shouldIncludeFeature("validation", options)) {
    deps.push("joi");
  }

  if (shouldIncludeFeature("elk", options)) {
    deps.push("winston", "winston-elasticsearch");
  }

  return deps;
}

export function getRequiredDevDependencies(options: ResolvedOptions): string[] {
  const devDeps: string[] = ["nodemon"];

  if (shouldIncludeFeature("typescript", options)) {
    devDeps.push(
      "typescript",
      "@types/node",
      "@types/express",
      "ts-node",
      "tsx"
    );

    if (shouldIncludeFeature("cors", options)) {
      devDeps.push("@types/cors");
    }

    if (shouldIncludeFeature("view", options)) {
      const viewEngine = getFinalViewEngine(options);
      if (viewEngine === "ejs") {
        devDeps.push("@types/ejs");
      }
    }

    if (shouldIncludeFeature("mongodb", options)) {
      devDeps.push("@types/mongoose");
    }

    if (shouldIncludeFeature("postgres", options)) {
      devDeps.push("@types/pg");
    }

    if (shouldIncludeFeature("redis", options)) {
      devDeps.push("@types/redis");
    }

    if (shouldIncludeFeature("swagger", options)) {
      devDeps.push("@types/swagger-jsdoc", "@types/swagger-ui-express");
    }

    if (shouldIncludeFeature("auth", options)) {
      devDeps.push("@types/jsonwebtoken", "@types/bcryptjs");
    }

    if (shouldIncludeFeature("helmet", options)) {
      devDeps.push("@types/helmet");
    }

    if (shouldIncludeFeature("validation", options)) {
      devDeps.push("@types/joi");
    }
  }

  if (shouldIncludeFeature("test", options)) {
    devDeps.push("jest");

    if (options.isTypescript) {
      devDeps.push("@types/jest", "ts-jest");
    }
  }

  return devDeps;
}
