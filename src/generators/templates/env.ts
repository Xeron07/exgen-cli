import fs from "fs-extra";
import path from "path";
import { ResolvedOptions } from "../types";

export async function generateEnvironmentFiles(
  options: ResolvedOptions
): Promise<void> {
  await generateEnvExample(options);
  await generateEnvLocal(options);
}

async function generateEnvExample(options: ResolvedOptions): Promise<void> {
  let envContent = `# Application Configuration
NODE_ENV=development
PORT=3000

# Server Configuration
HOST=localhost
API_PREFIX=/api

`;

  // Database configurations
  if (options.mongodb) {
    envContent += `# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/${options.projectName}
MONGODB_TEST_URI=mongodb://localhost:27017/${options.projectName}_test

`;
  }

  if (options.postgres) {
    envContent += `# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${options.projectName}
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Test Database
TEST_DB_NAME=${options.projectName}_test

`;
  }

  if (options.redis) {
    envContent += `# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_URL=redis://localhost:6379

`;
  }

  // Authentication
  if (options.auth) {
    envContent += `# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Session Configuration
SESSION_SECRET=your-session-secret-key-change-this-in-production

`;
  }

  // API and Documentation
  if (options.swagger) {
    envContent += `# API Documentation
API_URL=http://localhost:3000
SWAGGER_ENABLED=true

`;
  }

  // Logging
  if (options.elk) {
    envContent += `# ELK Stack Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log
ELASTICSEARCH_URL=http://localhost:9200
LOGSTASH_HOST=localhost
LOGSTASH_PORT=5000

`;
  } else {
    envContent += `# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=combined

`;
  }

  // CORS and Security
  envContent += `# Security Configuration
CORS_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

`;

  // Email (if commonly needed)
  envContent += `# Email Configuration (Optional)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@example.com
# SMTP_PASS=your-email-password
# FROM_EMAIL=noreply@example.com

`;

  // File Upload
  envContent += `# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=public/uploads

`;

  // External APIs (commonly used)
  envContent += `# External APIs (Optional)
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret

`;

  // Production-specific
  envContent += `# Production Configuration
# SSL_KEY=/path/to/ssl/key.pem
# SSL_CERT=/path/to/ssl/cert.pem
# CLUSTER_MODE=false

# Monitoring (Optional)
# SENTRY_DSN=your-sentry-dsn
# NEW_RELIC_LICENSE_KEY=your-new-relic-key
`;

  await fs.writeFile(
    path.join(options.projectPath, ".env.example"),
    envContent.trim()
  );
}

async function generateEnvLocal(options: ResolvedOptions): Promise<void> {
  // Generate a local .env file with development defaults
  let envContent = `# Local Development Environment
NODE_ENV=development
PORT=3000
HOST=localhost
API_PREFIX=/api

`;

  if (options.mongodb) {
    envContent += `# MongoDB
MONGODB_URI=mongodb://localhost:27017/${options.projectName}
MONGODB_TEST_URI=mongodb://localhost:27017/${options.projectName}_test

`;
  }

  if (options.postgres) {
    envContent += `# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${options.projectName}
DB_USER=postgres
DB_PASSWORD=password
DB_SSL=false
TEST_DB_NAME=${options.projectName}_test

`;
  }

  if (options.redis) {
    envContent += `# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

`;
  }

  if (options.auth) {
    envContent += `# JWT - CHANGE THESE IN PRODUCTION!
JWT_SECRET=dev-secret-key-not-for-production
JWT_EXPIRES_IN=7d
SESSION_SECRET=dev-session-secret-not-for-production

`;
  }

  if (options.swagger) {
    envContent += `# API Documentation
API_URL=http://localhost:3000
SWAGGER_ENABLED=true

`;
  }

  envContent += `# Logging
LOG_LEVEL=debug

# Security
CORS_ORIGIN=http://localhost:3000

# Development Tools
DEBUG=app:*
`;

  await fs.writeFile(
    path.join(options.projectPath, ".env.development"),
    envContent.trim()
  );

  // Generate production environment template
  const prodEnvContent = `# Production Environment Template
NODE_ENV=production
PORT=3000

# IMPORTANT: Set secure values for production!
JWT_SECRET=
SESSION_SECRET=

# Database URLs (update with production values)
${options.mongodb ? "MONGODB_URI=" : ""}
${options.postgres ? "DATABASE_URL=" : ""}
${options.redis ? "REDIS_URL=" : ""}

# Security
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=warn

# SSL (if using HTTPS)
# SSL_KEY=/path/to/ssl/private-key.pem
# SSL_CERT=/path/to/ssl/certificate.pem
`;

  await fs.writeFile(
    path.join(options.projectPath, ".env.production"),
    prodEnvContent.trim()
  );

  // Generate test environment
  const testEnvContent = `# Test Environment
NODE_ENV=test
PORT=3001

# Test Databases
${options.mongodb ? `MONGODB_URI=mongodb://localhost:27017/${options.projectName}_test` : ""}
${options.postgres ? `DB_NAME=${options.projectName}_test` : ""}
${options.redis ? "REDIS_DB=1" : ""}

# Test Configuration
JWT_SECRET=test-secret-key
SESSION_SECRET=test-session-secret

# Disable external services in tests
SWAGGER_ENABLED=false
LOG_LEVEL=error

# Test-specific settings
BCRYPT_ROUNDS=1
DISABLE_RATE_LIMITING=true
`;

  await fs.writeFile(
    path.join(options.projectPath, ".env.test"),
    testEnvContent.trim()
  );
}
