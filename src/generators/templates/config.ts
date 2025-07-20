import fs from "fs-extra";
import path from "path";
import { ResolvedOptions } from "../types";

export async function generateConfig(options: ResolvedOptions): Promise<void> {
  await generateMainConfig(options);

  if (options.postgres) {
    await generateDatabaseConfig(options);
  }

  if (options.elk) {
    await generateLoggerConfig(options);
  }
}

async function generateMainConfig(options: ResolvedOptions): Promise<void> {
  const configContent = options.isTypescript
    ? `
export interface AppConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string[];
  rateLimit: {
    windowMs: number;
    max: number;
  };
  database: {
    mongodb?: {
      uri: string;
    };
    postgres?: {
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
    };
    redis?: {
      host: string;
      port: number;
      password?: string;
    };
  };
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
  },
  database: {
    ${
      options.mongodb
        ? `
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/${options.projectName}',
    },
    `
        : ""
    }
    ${
      options.postgres
        ? `
    postgres: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || '${options.projectName}',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    },
    `
        : ""
    }
    ${
      options.redis
        ? `
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    `
        : ""
    }
  },
};

export default config;
`
    : `
const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
  },
  database: {
    ${
      options.mongodb
        ? `
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/${options.projectName}',
    },
    `
        : ""
    }
    ${
      options.postgres
        ? `
    postgres: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || '${options.projectName}',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    },
    `
        : ""
    }
    ${
      options.redis
        ? `
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    `
        : ""
    }
  },
};

module.exports = config;
`;

  const filename = options.isTypescript ? "index.ts" : "index.js";
  await fs.writeFile(
    path.join(options.projectPath, "src", "config", filename),
    configContent.trim()
  );
}

async function generateDatabaseConfig(options: ResolvedOptions): Promise<void> {
  const dbConfigContent = options.isTypescript
    ? `
import { Sequelize } from 'sequelize';
import config from './index';

const { postgres } = config.database;

if (!postgres) {
  throw new Error('PostgreSQL configuration is missing');
}

export const sequelize = new Sequelize({
  host: postgres.host,
  port: postgres.port,
  database: postgres.database,
  username: postgres.username,
  password: postgres.password,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection has been established successfully.');
    
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized');
    }
  } catch (error:any) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await sequelize.close();
}
`
    : `
const { Sequelize } = require('sequelize');
const config = require('./index');

const { postgres } = config.database;

if (!postgres) {
  throw new Error('PostgreSQL configuration is missing');
}

const sequelize = new Sequelize({
  host: postgres.host,
  port: postgres.port,
  database: postgres.database,
  username: postgres.username,
  password: postgres.password,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection has been established successfully.');
    
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized');
    }
  } catch (error:any) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

async function closeDatabaseConnection() {
  await sequelize.close();
}

module.exports = { sequelize, connectDatabase, closeDatabaseConnection };
`;

  const filename = options.isTypescript ? "database.ts" : "database.js";
  await fs.writeFile(
    path.join(options.projectPath, "src", "config", filename),
    dbConfigContent.trim()
  );
}

async function generateLoggerConfig(options: ResolvedOptions): Promise<void> {
  const loggerContent = options.isTypescript
    ? `
import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const createLogger = () => {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ];

  // Add file transports in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: logFormat
      }),
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        format: logFormat
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exceptionHandlers: [
      new winston.transports.File({ 
        filename: path.join(process.cwd(), 'logs', 'exceptions.log') 
      })
    ],
    rejectionHandlers: [
      new winston.transports.File({ 
        filename: path.join(process.cwd(), 'logs', 'rejections.log') 
      })
    ]
  });
};

export const logger = createLogger();

export default logger;
`
    : `
const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const createLogger = () => {
  const transports = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ];

  // Add file transports in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: logFormat
      }),
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        format: logFormat
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exceptionHandlers: [
      new winston.transports.File({ 
        filename: path.join(process.cwd(), 'logs', 'exceptions.log') 
      })
    ],
    rejectionHandlers: [
      new winston.transports.File({ 
        filename: path.join(process.cwd(), 'logs', 'rejections.log') 
      })
    ]
  });
};

const logger = createLogger();

module.exports = logger;
`;

  const filename = options.isTypescript ? "logger.ts" : "logger.js";
  await fs.writeFile(
    path.join(options.projectPath, "src", "utils", filename),
    loggerContent.trim()
  );
}
