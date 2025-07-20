export interface ProjectOptions {
  // Express-generator compatible
  view?: string;
  css?: string;
  git?: boolean;
  noView?: boolean;

  // EXGEN presets
  light?: boolean;
  all?: boolean;
  prod?: boolean;
  min?: boolean;

  // Language
  typescript?: boolean;
  javascript?: boolean;

  // Features
  swagger?: boolean;
  docker?: boolean;
  mongodb?: boolean;
  postgres?: boolean;
  redis?: boolean;
  test?: boolean;
  elk?: boolean;
  auth?: boolean;
  cors?: boolean;
  helmet?: boolean;
  rateLimit?: boolean;
  validation?: boolean;

  // Popular presets
  api?: boolean;
  fullstack?: boolean;
  microservice?: boolean;
  startup?: boolean;

  // Development
  skipInstall?: boolean;
  skipGit?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
}

export interface ResolvedOptions extends ProjectOptions {
  projectName: string;
  projectPath: string;
  packageManager: "npm" | "yarn" | "pnpm";
  isTypescript: boolean;
  features: string[];
}

export interface ExgenConfig {
  defaults?: Partial<ProjectOptions>;
  presets?: Record<string, Partial<ProjectOptions>>;
  templates?: {
    path?: string;
    exclude?: string[];
  };
  packageManager?: "npm" | "yarn" | "pnpm";
}

export interface PackageJson {
  name: string;
  version: string;
  description?: string;
  main?: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  keywords?: string[];
  author?: string | { name: string; email?: string; url?: string };
  license?: string;
  repository?: string | { type: string; url: string };
  bugs?: string | { url: string };
  homepage?: string;
  engines?: Record<string, string>;
}

export interface TemplateData {
  projectName: string;
  projectDescription?: string;
  author?: string;
  email?: string;
  license?: string;
  isTypescript: boolean;
  features: {
    view: boolean;
    css: boolean;
    swagger: boolean;
    docker: boolean;
    mongodb: boolean;
    postgres: boolean;
    redis: boolean;
    test: boolean;
    elk: boolean;
    auth: boolean;
    cors: boolean;
    helmet: boolean;
    rateLimit: boolean;
    validation: boolean;
  };
  viewEngine?: string;
  cssEngine?: string;
}

export interface DependencyMap {
  dependencies: string[];
  devDependencies: string[];
}

export interface FileTemplate {
  path: string;
  content: string;
  condition?: (options: ResolvedOptions) => boolean;
}

export interface PresetDefinition {
  name: string;
  description: string;
  options: Partial<ProjectOptions>;
  example?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export type LogLevel = "info" | "warn" | "error" | "success" | "debug";

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  success(message: string): void;
  debug(message: string): void;
}
