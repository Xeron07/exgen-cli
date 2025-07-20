import fs from "fs-extra";
import path from "path";
import { ResolvedOptions } from "../types";

export async function generateDockerFiles(
  options: ResolvedOptions
): Promise<void> {
  await generateDockerfile(options);
  await generateDockerIgnore(options);
  await generateDockerCompose(options);
}

async function generateDockerfile(options: ResolvedOptions): Promise<void> {
  const nodeVersion = process.env.NODE_VERSION || "18";

  const dockerfileContent = `
# Use official Node.js runtime as the base image
FROM node:${nodeVersion}-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nextjs -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Define environment variable
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]
`;

  await fs.writeFile(
    path.join(options.projectPath, "Dockerfile"),
    dockerfileContent.trim()
  );
}

async function generateDockerIgnore(options: ResolvedOptions): Promise<void> {
  const dockerIgnoreContent = `
node_modules
npm-debug.log
Dockerfile*
docker-compose*
.dockerignore
.git
.gitignore
README.md
.env
.env.local
.env.production
.env.test
.nyc_output
coverage
.istanbul.yml
.mocha.opts
tests
*.test.js
*.spec.js
.eslintrc*
.prettierrc*
jest.config.js
*.log
logs
.DS_Store
.vscode
.idea
*.swp
*.swo
*~
`;

  await fs.writeFile(
    path.join(options.projectPath, ".dockerignore"),
    dockerIgnoreContent.trim()
  );
}

async function generateDockerCompose(options: ResolvedOptions): Promise<void> {
  let services = `
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:`;

  const dependsOn: string[] = [];

  if (options.mongodb) {
    dependsOn.push("mongodb");
    services += `
  
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongodb_data:/data/db`;
  }

  if (options.postgres) {
    dependsOn.push("postgres");
    services += `
  
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=${options.projectName}
    volumes:
      - postgres_data:/var/lib/postgresql/data`;
  }

  if (options.redis) {
    dependsOn.push("redis");
    services += `
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data`;
  }

  // Update depends_on section
  if (dependsOn.length > 0) {
    services = services.replace(
      "depends_on:",
      `depends_on:\n${dependsOn.map((dep) => `      - ${dep}`).join("\n")}`
    );
  } else {
    services = services.replace(/\s+depends_on:/, "");
  }

  // Add volumes section
  const volumes: string[] = [];
  if (options.mongodb) volumes.push("mongodb_data:");
  if (options.postgres) volumes.push("postgres_data:");
  if (options.redis) volumes.push("redis_data:");

  if (volumes.length > 0) {
    services += `\n\nvolumes:\n${volumes.map((vol) => `  ${vol}`).join("\n")}`;
  }

  await fs.writeFile(
    path.join(options.projectPath, "docker-compose.yml"),
    services.trim()
  );

  // Generate development docker-compose
  const devComposeContent = `
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
`;

  await fs.writeFile(
    path.join(options.projectPath, "docker-compose.dev.yml"),
    devComposeContent.trim()
  );

  // Generate development Dockerfile
  const devDockerfileContent = `
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
`;

  await fs.writeFile(
    path.join(options.projectPath, "Dockerfile.dev"),
    devDockerfileContent.trim()
  );

  // Generate health check script
  const healthCheckContent = options.isTypescript
    ? `
import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
`
    : `
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
`;

  const healthCheckFilename = options.isTypescript
    ? "healthcheck.ts"
    : "healthcheck.js";
  await fs.writeFile(
    path.join(options.projectPath, healthCheckFilename),
    healthCheckContent.trim()
  );
}
