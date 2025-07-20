import fs from "fs-extra";
import path from "path";
import { ResolvedOptions } from "../types";

export async function generateTSConfig(
  options: ResolvedOptions
): Promise<void> {
  await generateTsConfigJson(options);
  await generateTsConfigBuild(options);
  await generateTsConfigTest(options);
  await generateTypeDefinitions(options);
}

async function generateTsConfigJson(options: ResolvedOptions): Promise<void> {
  const tsConfig = {
    compilerOptions: {
      // Target and module
      target: "ES2020",
      module: "commonjs",
      lib: ["ES2020"],

      // Output
      outDir: "./dist",
      rootDir: "./src",
      removeComments: true,

      // Module resolution
      moduleResolution: "node",
      baseUrl: "./",
      paths: {
        "@/*": ["src/*"],
        "@/config/*": ["src/config/*"],
        "@/api/*": ["src/api/*"],
        "@/models/*": ["src/models/*"],
        "@/services/*": ["src/services/*"],
        "@/utils/*": ["src/utils/*"],
        "@/middleware/*": ["src/api/middleware/*"],
        "@/routes/*": ["src/api/routes/*"],
      },
      resolveJsonModule: true,

      // Type checking
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      strictBindCallApply: true,
      strictPropertyInitialization: true,
      noImplicitReturns: true,
      noImplicitThis: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      exactOptionalPropertyTypes: true,

      // Emit
      declaration: true,
      declarationMap: true,
      sourceMap: true,

      // Interop
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      forceConsistentCasingInFileNames: true,

      // Advanced
      skipLibCheck: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    },
    include: ["src/**/*", "types/**/*"],
    exclude: ["node_modules", "dist", "tests", "**/*.test.ts", "**/*.spec.ts"],
    "ts-node": {
      require: ["tsconfig-paths/register"],
      files: true,
    },
  };

  await fs.writeFile(
    path.join(options.projectPath, "tsconfig.json"),
    JSON.stringify(tsConfig, null, 2)
  );
}

async function generateTsConfigBuild(options: ResolvedOptions): Promise<void> {
  const buildConfig = {
    extends: "./tsconfig.json",
    compilerOptions: {
      noUnusedLocals: false,
      noUnusedParameters: false,
      sourceMap: false,
      declaration: false,
      declarationMap: false,
      removeComments: true,
    },
    exclude: [
      "node_modules",
      "tests",
      "**/*.test.ts",
      "**/*.spec.ts",
      "coverage",
      "dist",
    ],
  };

  await fs.writeFile(
    path.join(options.projectPath, "tsconfig.build.json"),
    JSON.stringify(buildConfig, null, 2)
  );
}

async function generateTsConfigTest(options: ResolvedOptions): Promise<void> {
  if (!options.test) return;

  const testConfig = {
    extends: "./tsconfig.json",
    compilerOptions: {
      noUnusedLocals: false,
      noUnusedParameters: false,
      types: ["jest", "node", "supertest"],
    },
    include: ["src/**/*", "tests/**/*", "types/**/*"],
    exclude: ["node_modules", "dist"],
  };

  await fs.writeFile(
    path.join(options.projectPath, "tsconfig.test.json"),
    JSON.stringify(testConfig, null, 2)
  );
}

async function generateTypeDefinitions(
  options: ResolvedOptions
): Promise<void> {
  // Create types directory
  await fs.ensureDir(path.join(options.projectPath, "types"));

  // Generate express.d.ts for custom Express types
  const expressTypes = `
import { JWTPayload } from '../src/utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      requestId?: string;
      startTime?: number;
    }
    
    interface Response {
      success: (data?: any, message?: string, statusCode?: number) => Response;
      error: (message: string, statusCode?: number, errors?: any) => Response;
    }
  }
}

export {};
`;

  await fs.writeFile(
    path.join(options.projectPath, "types", "express.d.ts"),
    expressTypes.trim()
  );

  // Generate environment types
  const envTypes = `
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      HOST?: string;
      API_PREFIX?: string;
      
      // Database
      ${
        options.mongodb
          ? `
      MONGODB_URI: string;
      MONGODB_TEST_URI?: string;
      `
          : ""
      }
      ${
        options.postgres
          ? `
      DB_HOST: string;
      DB_PORT?: string;
      DB_NAME: string;
      DB_USER: string;
      DB_PASSWORD: string;
      DB_SSL?: string;
      DATABASE_URL?: string;
      `
          : ""
      }
      ${
        options.redis
          ? `
      REDIS_HOST?: string;
      REDIS_PORT?: string;
      REDIS_PASSWORD?: string;
      REDIS_DB?: string;
      REDIS_URL?: string;
      `
          : ""
      }
      
      // Authentication
      ${
        options.auth
          ? `
      JWT_SECRET: string;
      JWT_EXPIRES_IN?: string;
      JWT_REFRESH_EXPIRES_IN?: string;
      SESSION_SECRET: string;
      `
          : ""
      }
      
      // API
      ${
        options.swagger
          ? `
      API_URL?: string;
      SWAGGER_ENABLED?: string;
      `
          : ""
      }
      
      // Logging
      LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug';
      LOG_FILE?: string;
      ${
        options.elk
          ? `
      ELASTICSEARCH_URL?: string;
      LOGSTASH_HOST?: string;
      LOGSTASH_PORT?: string;
      `
          : ""
      }
      
      // Security
      CORS_ORIGIN?: string;
      ALLOWED_ORIGINS?: string;
      RATE_LIMIT_WINDOW_MS?: string;
      RATE_LIMIT_MAX_REQUESTS?: string;
      
      // File Upload
      MAX_FILE_SIZE?: string;
      UPLOAD_DIR?: string;
      
      // SSL
      SSL_KEY?: string;
      SSL_CERT?: string;
      
      // External Services
      SENTRY_DSN?: string;
      NEW_RELIC_LICENSE_KEY?: string;
    }
  }
}

export {};
`;

  await fs.writeFile(
    path.join(options.projectPath, "types", "environment.d.ts"),
    envTypes.trim()
  );

  // Generate common API types
  const apiTypes = `
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  timestamp: string;
  path: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ErrorResponse extends ApiResponse {
  success: false;
  error: {
    code: string;
    details?: any;
    stack?: string;
  };
}

// Common request types
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchQuery extends PaginationQuery {
  search?: string;
  filter?: Record<string, any>;
}

// Database common types
export interface BaseModel {
  id: string | number;
  createdAt: Date;
  updatedAt: Date;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
`;

  await fs.writeFile(
    path.join(options.projectPath, "types", "api.d.ts"),
    apiTypes.trim()
  );

  // Generate database-specific types
  if (options.mongodb) {
    const mongoTypes = `
import { Document, Types } from 'mongoose';

export interface MongoBaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type MongoDocument<T> = T & MongoBaseDocument;

export interface MongoQuery<T> {
  filter?: Partial<T>;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  populate?: string | string[];
}
`;

    await fs.writeFile(
      path.join(options.projectPath, "types", "mongodb.d.ts"),
      mongoTypes.trim()
    );
  }

  if (options.postgres) {
    const postgresTypes = `
import { Model, ModelStatic, Optional } from 'sequelize';

export interface SequelizeBaseAttributes {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SequelizeBaseModel<T extends SequelizeBaseAttributes> 
  extends Model<T, Optional<T, 'id' | 'createdAt' | 'updatedAt'>> {}

export type SequelizeModel<T extends SequelizeBaseAttributes> = 
  ModelStatic<SequelizeBaseModel<T>>;

export interface QueryOptions {
  where?: any;
  include?: any[];
  order?: [string, 'ASC' | 'DESC'][];
  limit?: number;
  offset?: number;
  attributes?: string[];
}
`;

    await fs.writeFile(
      path.join(options.projectPath, "types", "sequelize.d.ts"),
      postgresTypes.trim()
    );
  }

  if (options.auth) {
    const authTypes = `
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  confirmPassword: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: TokenPair;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
`;

    await fs.writeFile(
      path.join(options.projectPath, "types", "auth.d.ts"),
      authTypes.trim()
    );
  }

  // Generate index file to export all types
  const indexTypes = `
export * from './api';
export * from './express';
export * from './environment';
${options.mongodb ? "export * from './mongodb';" : ""}
${options.postgres ? "export * from './sequelize';" : ""}
${options.auth ? "export * from './auth';" : ""}
`;

  await fs.writeFile(
    path.join(options.projectPath, "types", "index.ts"),
    indexTypes.trim()
  );
}
