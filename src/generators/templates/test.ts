import fs from "fs-extra";
import path from "path";
import { ResolvedOptions } from "../types";

export async function generateTests(options: ResolvedOptions): Promise<void> {
  await generateJestConfig(options);
  await generateTestFiles(options);
}

async function generateJestConfig(options: ResolvedOptions): Promise<void> {
  const jestConfig = options.isTypescript
    ? `
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.(ts|js)', '**/*.(test|spec).(ts|js)'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(ts|js)',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
`
    : `
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.js', '**/*.(test|spec).js'],
  collectCoverageFrom: [
    'src/**/*.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
`;

  await fs.writeFile(
    path.join(options.projectPath, "jest.config.js"),
    jestConfig.trim()
  );
}

async function generateTestFiles(options: ResolvedOptions): Promise<void> {
  // Generate test setup file
  const setupContent = options.isTypescript
    ? `
import request from 'supertest';

// Global test setup
beforeAll(async () => {
  // Setup database connections, etc.
});

afterAll(async () => {
  // Cleanup database connections, etc.
});

// Global test utilities
global.request = request;
`
    : `
const request = require('supertest');

// Global test setup
beforeAll(async () => {
  // Setup database connections, etc.
});

afterAll(async () => {
  // Cleanup database connections, etc.
});

// Global test utilities
global.request = request;
`;

  const setupFilename = options.isTypescript ? "setup.ts" : "setup.js";
  await fs.writeFile(
    path.join(options.projectPath, "tests", setupFilename),
    setupContent.trim()
  );

  // Generate sample unit test
  const unitTestContent = options.isTypescript
    ? `
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';

describe('Express App', () => {
  it('should respond with 200 on GET /', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.status).toBe(200);
  });

  it('should handle 404 errors', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);
    
    expect(response.status).toBe(404);
  });
});
`
    : `
const request = require('supertest');
const app = require('../../src/app');

describe('Express App', () => {
  it('should respond with 200 on GET /', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.status).toBe(200);
  });

  it('should handle 404 errors', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);
    
    expect(response.status).toBe(404);
  });
});
`;

  const unitTestFilename = options.isTypescript ? "app.test.ts" : "app.test.js";
  await fs.writeFile(
    path.join(options.projectPath, "tests", "unit", unitTestFilename),
    unitTestContent.trim()
  );

  // Generate sample integration test
  const integrationTestContent = options.isTypescript
    ? `
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup test database
  });

  describe('Health Check', () => {
    it('should return server status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('API Routes', () => {
    it('should handle API requests', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });
});
`
    : `
const request = require('supertest');
const app = require('../../src/app');

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup test database
  });

  describe('Health Check', () => {
    it('should return server status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('API Routes', () => {
    it('should handle API requests', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });
});
`;

  const integrationTestFilename = options.isTypescript
    ? "integration.test.ts"
    : "integration.test.js";
  await fs.writeFile(
    path.join(
      options.projectPath,
      "tests",
      "integration",
      integrationTestFilename
    ),
    integrationTestContent.trim()
  );
}
