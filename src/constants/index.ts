import { PresetDefinition, DependencyMap } from "../generators/types";

export const PACKAGE_INFO = {
  name: "exgen-cli",
  version: "1.0.0",
};

export const MIN_NODE_VERSION = 16;

export const SUPPORTED_VIEW_ENGINES = [
  "ejs",
  "pug",
  "hbs",
  "hogan",
  "mustache",
  "handlebars",
];

export const SUPPORTED_CSS_ENGINES = [
  "less",
  "sass",
  "scss",
  "stylus",
  "compass",
];

export const DEFAULT_PROJECT_STRUCTURE = [
  "src",
  "src/api",
  "src/api/routes",
  "src/api/controllers",
  "src/api/services",
  "src/api/middlewares",
  "src/api/jobs",
  "src/config",
  "src/utils",
  "src/models",
  "bin",
  "public",
  "public/stylesheets",
  "public/javascripts",
  "public/images",
  "scripts",
];

export const PRESET_DEFINITIONS: PresetDefinition[] = [
  {
    name: "light",
    description:
      "Lightweight structure with essentials (TypeScript, basic structure)",
    options: { light: true, typescript: true },
    example: "exgen my-app --light",
  },
  {
    name: "api",
    description:
      "REST API preset with TypeScript, CORS, Helmet, Validation, Tests",
    options: {
      api: true,
      typescript: true,
      cors: true,
      helmet: true,
      validation: true,
      test: true,
      noView: true,
    },
    example: "exgen my-api --api",
  },
  {
    name: "fullstack",
    description:
      "Full-stack application with views, authentication, and database",
    options: {
      fullstack: true,
      view: "ejs",
      css: "sass",
      auth: true,
      mongodb: true,
      test: true,
    },
    example: "exgen my-fullstack-app --fullstack",
  },
  {
    name: "microservice",
    description: "Microservice-ready with Docker, Redis, Tests, and Logging",
    options: {
      microservice: true,
      typescript: true,
      docker: true,
      redis: true,
      test: true,
      elk: true,
      noView: true,
      cors: true,
      helmet: true,
    },
    example: "exgen my-service --microservice",
  },
  {
    name: "startup",
    description:
      "Startup-ready with everything: TypeScript, MongoDB, Auth, Swagger, Docker, Tests",
    options: {
      startup: true,
      typescript: true,
      mongodb: true,
      auth: true,
      swagger: true,
      docker: true,
      test: true,
      cors: true,
      helmet: true,
      rateLimit: true,
      validation: true,
    },
    example: "exgen my-startup --startup",
  },
  {
    name: "prod",
    description: "Full production setup with Docker, Swagger, ELK, Tests",
    options: {
      prod: true,
      typescript: true,
      swagger: true,
      docker: true,
      test: true,
      elk: true,
      cors: true,
      helmet: true,
      rateLimit: true,
    },
    example: "exgen my-prod-app --prod",
  },
  {
    name: "min",
    description: "Minimal production setup (excludes Docker and Swagger)",
    options: {
      min: true,
      typescript: true,
      test: true,
      cors: true,
      helmet: true,
    },
    example: "exgen my-min-app --min",
  },
];

export const DEPENDENCIES: Record<string, DependencyMap> = {
  base: {
    dependencies: ["express", "dotenv", "cors"],
    devDependencies: ["nodemon"],
  },
  typescript: {
    dependencies: [],
    devDependencies: [
      "typescript",
      "@types/node",
      "@types/express",
      "ts-node",
      "tsx",
    ],
  },
  view: {
    dependencies: ["cookie-parser", "morgan"],
    devDependencies: [],
  },
  ejs: {
    dependencies: ["ejs"],
    devDependencies: ["@types/ejs"],
  },
  pug: {
    dependencies: ["pug"],
    devDependencies: [],
  },
  hbs: {
    dependencies: ["hbs"],
    devDependencies: [],
  },
  less: {
    dependencies: ["less-middleware"],
    devDependencies: [],
  },
  sass: {
    dependencies: ["node-sass-middleware"],
    devDependencies: [],
  },
  stylus: {
    dependencies: ["stylus"],
    devDependencies: [],
  },
  swagger: {
    dependencies: ["swagger-jsdoc", "swagger-ui-express"],
    devDependencies: ["@types/swagger-jsdoc", "@types/swagger-ui-express"],
  },
  mongodb: {
    dependencies: ["mongoose"],
    devDependencies: ["@types/mongoose"],
  },
  postgres: {
    dependencies: ["sequelize", "pg"],
    devDependencies: ["@types/pg", "sequelize-cli"],
  },
  redis: {
    dependencies: ["redis", "ioredis"],
    devDependencies: ["@types/redis"],
  },
  test: {
    dependencies: [],
    devDependencies: [
      "jest",
      "supertest",
      "@types/jest",
      "@types/supertest",
      "ts-jest",
    ],
  },
  auth: {
    dependencies: ["jsonwebtoken", "bcryptjs"],
    devDependencies: ["@types/jsonwebtoken", "@types/bcryptjs"],
  },
  cors: {
    dependencies: ["cors"],
    devDependencies: ["@types/cors"],
  },
  helmet: {
    dependencies: ["helmet"],
    devDependencies: ["@types/helmet"],
  },
  rateLimit: {
    dependencies: ["express-rate-limit"],
    devDependencies: [],
  },
  validation: {
    dependencies: ["joi"],
    devDependencies: ["@types/joi"],
  },
  elk: {
    dependencies: ["winston", "winston-elasticsearch"],
    devDependencies: [],
  },
};

export const SCRIPTS = {
  base: {
    start: "node bin/www",
    dev: "nodemon bin/www",
  },
  typescript: {
    start: "node dist/bin/www.js",
    dev: "tsx src/bin/www.ts",
    build: "tsc",
    "build:watch": "tsc --watch",
  },
  test: {
    test: "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
  },
  docker: {
    "docker:build": "docker build -t $npm_package_name .",
    "docker:run": "docker run -p 3000:3000 $npm_package_name",
    "docker:dev": "docker-compose up --build",
  },
};

export const CONFIG_FILE_NAMES = [
  ".exgenrc",
  ".exgenrc.json",
  ".exgenrc.js",
  "exgen.config.js",
  "exgen.config.json",
];

export const IGNORE_PATTERNS = {
  git: [
    "node_modules/",
    ".env",
    ".env.local",
    ".env.development.local",
    ".env.test.local",
    ".env.production.local",
    "dist/",
    "build/",
    "coverage/",
    "*.log",
    ".DS_Store",
    "Thumbs.db",
  ],
  docker: [
    "node_modules",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    ".git",
    ".gitignore",
    "README.md",
    ".env",
    ".nyc_output",
    "coverage",
    ".DS_Store",
  ],
};
