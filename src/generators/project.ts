import fs from "fs-extra";
import path from "path";
import { ResolvedOptions } from "./types";
import { generatePackageJson } from "./templates/package-json";
import { generateServerFile } from "./templates/server";
import { generateRoutes } from "./templates/routes";
import { generateMiddleware } from "./templates/middleware";
import { generateConfig } from "./templates/config";
import { generateTests } from "./templates/test";
import { generateDockerFiles } from "./templates/docker";
import { generateReadme } from "./templates/readme";
import { generateEnvironmentFiles } from "./templates/env";
import { generateTSConfig } from "./templates/typescript";
import { getLogger } from "../utils/logger";

export async function generateProject(options: ResolvedOptions): Promise<void> {
  const logger = getLogger();

  try {
    // Create base directory structure
    await createDirectoryStructure(options);

    // Generate core files
    await generatePackageJson(options);
    await generateServerFile(options);
    await generateEnvironmentFiles(options);
    await generateReadme(options);

    // Generate configuration files
    await generateConfig(options);

    // Generate TypeScript config if needed
    if (options.isTypescript) {
      await generateTSConfig(options);
    }

    // Generate routes
    await generateRoutes(options);

    // Generate middleware
    await generateMiddleware(options);

    // Generate tests if enabled
    if (options.test) {
      await generateTests(options);
    }

    // Generate Docker files if enabled
    if (options.docker) {
      await generateDockerFiles(options);
    }

    // Create additional directories and files based on features
    await generateFeatureFiles(options);

    logger.info("Project files generated successfully");
  } catch (error: any) {
    logger.error("Failed to generate project files: " + error);
    throw error;
  }
}

async function createDirectoryStructure(
  options: ResolvedOptions
): Promise<void> {
  const { projectPath } = options;

  // Core directories
  const directories = [
    "src",
    "src/api",
    "src/api/routes",
    "src/api/middleware",
    "src/config",
    "src/utils",
    "src/models",
    "src/services",
    "bin",
    "public",
    "public/stylesheets",
    "public/javascripts",
    "public/images",
  ];

  // Add view directories if views are enabled
  if (!options.noView) {
    directories.push("views");
  }

  // Add test directories if testing is enabled
  if (options.test) {
    directories.push("tests", "tests/unit", "tests/integration");
  }

  // Add logs directory if ELK is enabled
  if (options.elk) {
    directories.push("logs");
  }

  // Create all directories
  for (const dir of directories) {
    await fs.ensureDir(path.join(projectPath, dir));
  }
}

async function generateFeatureFiles(options: ResolvedOptions): Promise<void> {
  const { projectPath } = options;

  // Generate database models if databases are enabled
  if (options.mongodb) {
    await generateMongoModels(options);
  }

  if (options.postgres) {
    await generateSequelizeModels(options);
  }

  if (options.redis) {
    await generateRedisConfig(options);
  }

  // Generate Swagger config if enabled
  if (options.swagger) {
    await generateSwaggerConfig(options);
  }

  // Generate authentication files if enabled
  if (options.auth) {
    await generateAuthFiles(options);
  }

  // Generate view templates if enabled
  if (!options.noView && options.view) {
    await generateViewTemplates(options);
  }

  // Generate CSS files if enabled
  if (options.css) {
    await generateCSSFiles(options);
  }

  // Create .gitignore
  await generateGitignore(options);
}

async function generateMongoModels(options: ResolvedOptions): Promise<void> {
  const modelContent = options.isTypescript
    ? `
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', userSchema);
`
    : `
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
`;

  const filename = options.isTypescript ? "User.ts" : "User.js";
  await fs.writeFile(
    path.join(options.projectPath, "src", "models", filename),
    modelContent.trim()
  );
}

async function generateSequelizeModels(
  options: ResolvedOptions
): Promise<void> {
  const modelContent = options.isTypescript
    ? `
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

export class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  sequelize,
  modelName: 'User',
});
`
    : `
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class User extends Model {}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  sequelize,
  modelName: 'User',
});

module.exports = User;
`;

  const filename = options.isTypescript ? "User.ts" : "User.js";
  await fs.writeFile(
    path.join(options.projectPath, "src", "models", filename),
    modelContent.trim()
  );
}

async function generateRedisConfig(options: ResolvedOptions): Promise<void> {
  const redisContent = options.isTypescript
    ? `
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (error:any) => {
  console.error('Redis connection error:', error);
});

export default redis;
`
    : `
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (error:any) => {
  console.error('Redis connection error:', error);
});

module.exports = redis;
`;

  const filename = options.isTypescript ? "redis.ts" : "redis.js";
  await fs.writeFile(
    path.join(options.projectPath, "src", "config", filename),
    redisContent.trim()
  );
}

async function generateSwaggerConfig(options: ResolvedOptions): Promise<void> {
  const swaggerContent = options.isTypescript
    ? `
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '${options.projectName} API',
      version: '1.0.0',
      description: 'API documentation for ${options.projectName}',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/api/routes/*.${options.isTypescript ? "ts" : "js"}'],
};

const specs = swaggerJSDoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}
`
    : `
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '${options.projectName} API',
      version: '1.0.0',
      description: 'API documentation for ${options.projectName}',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/api/routes/*.js'],
};

const specs = swaggerJSDoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

module.exports = { setupSwagger };
`;

  const filename = options.isTypescript ? "swagger.ts" : "swagger.js";
  await fs.writeFile(
    path.join(options.projectPath, "src", "config", filename),
    swaggerContent.trim()
  );
}

async function generateAuthFiles(options: ResolvedOptions): Promise<void> {
  // Generate JWT utility
  const jwtContent = options.isTypescript
    ? `
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
`
    : `
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
`;

  const filename = options.isTypescript ? "jwt.ts" : "jwt.js";
  await fs.writeFile(
    path.join(options.projectPath, "src", "utils", filename),
    jwtContent.trim()
  );
}

async function generateViewTemplates(options: ResolvedOptions): Promise<void> {
  if (options.view === "ejs") {
    // Generate basic EJS templates
    const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %></title>
    <link rel="stylesheet" href="/stylesheets/style.css">
</head>
<body>
    <header>
        <h1><%= title %></h1>
    </header>
    <main>
        <%- body %>
    </main>
</body>
</html>
`;

    const indexContent = `
<div class="welcome">
    <h2>Welcome to <%= title %></h2>
    <p>Your Express application is running successfully!</p>
</div>
`;

    await fs.writeFile(
      path.join(options.projectPath, "views", "layout.ejs"),
      layoutContent.trim()
    );
    await fs.writeFile(
      path.join(options.projectPath, "views", "index.ejs"),
      indexContent.trim()
    );
  }
}

async function generateCSSFiles(options: ResolvedOptions): Promise<void> {
  const cssContent = `
body {
  margin: 0;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background-color: #f5f5f5;
}

header {
  background-color: #333;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

header h1 {
  margin: 0;
}

.welcome {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.welcome h2 {
  color: #333;
  margin-top: 0;
}
`;

  const extension =
    options.css === "sass" || options.css === "scss"
      ? "scss"
      : options.css || "css";
  await fs.writeFile(
    path.join(
      options.projectPath,
      "public",
      "stylesheets",
      `style.${extension}`
    ),
    cssContent.trim()
  );
}

async function generateGitignore(options: ResolvedOptions): Promise<void> {
  const gitignoreContent = `
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Environment variables
.env
.env.local
.env.production
.env.test

# Build output
dist/
build/

# IDE files
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

# Logs
logs
*.log

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# TypeScript cache
*.tsbuildinfo

# Docker
.dockerignore
`;

  await fs.writeFile(
    path.join(options.projectPath, ".gitignore"),
    gitignoreContent.trim()
  );
}
