import fs from "fs-extra";
import path from "path";
import { ResolvedOptions } from "../types";

export async function generateServerFile(
  options: ResolvedOptions
): Promise<void> {
  const serverContent = options.isTypescript
    ? generateTypeScriptServer(options)
    : generateJavaScriptServer(options);

  const filename = options.isTypescript ? "app.ts" : "app.js";
  await fs.writeFile(
    path.join(options.projectPath, "src", filename),
    serverContent
  );
}

function generateTypeScriptServer(options: ResolvedOptions): string {
  return `
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
${options.mongodb ? "import mongoose from 'mongoose';" : ""}
${options.postgres ? "import { sequelize } from './config/database';" : ""}
${options.redis ? "import redis from './config/redis';" : ""}
${options.swagger ? "import { setupSwagger } from './config/swagger';" : ""}
${options.view ? `import { engine } from 'express-handlebars';` : ""}
${options.elk ? "import { logger } from './utils/logger';" : ""}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

${options.view ? generateViewEngineSetup(options) : ""}

${
  options.swagger
    ? `
// Setup Swagger documentation
setupSwagger(app);
`
    : ""
}

// Import routes
import indexRouter from './api/routes/index';
import usersRouter from './api/routes/users';

// Use routes
app.use('/', indexRouter);
app.use('/api/users', usersRouter);

${
  options.mongodb
    ? `
// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/${options.projectName}')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));
`
    : ""
}

${
  options.postgres
    ? `
// PostgreSQL connection
sequelize.authenticate()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('PostgreSQL connection error:', err));
`
    : ""
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  ${options.elk ? "logger.error('Error:', err);" : "console.error('Error:', err);"}
  res.status(err.status || 500).json({
    message: err.message,
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
  ${options.swagger ? `console.log(\`Swagger docs available at http://localhost:\${PORT}/api-docs\`);` : ""}
});

export default app;
`.trim();
}

function generateJavaScriptServer(options: ResolvedOptions): string {
  return `
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
${options.mongodb ? "const mongoose = require('mongoose');" : ""}
${options.postgres ? "const { sequelize } = require('./config/database');" : ""}
${options.redis ? "const redis = require('./config/redis');" : ""}
${options.swagger ? "const { setupSwagger } = require('./config/swagger');" : ""}
${options.elk ? "const { logger } = require('./utils/logger');" : ""}

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

${options.view ? generateViewEngineSetup(options) : ""}

${
  options.swagger
    ? `
// Setup Swagger documentation
setupSwagger(app);
`
    : ""
}

// Import routes
const indexRouter = require('./api/routes/index');
const usersRouter = require('./api/routes/users');

// Use routes
app.use('/', indexRouter);
app.use('/api/users', usersRouter);

${
  options.mongodb
    ? `
// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/${options.projectName}')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));
`
    : ""
}

${
  options.postgres
    ? `
// PostgreSQL connection
sequelize.authenticate()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('PostgreSQL connection error:', err));
`
    : ""
}

// Error handling middleware
app.use((err, req, res, next) => {
  ${options.elk ? "logger.error('Error:', err);" : "console.error('Error:', err);"}
  res.status(err.status || 500).json({
    message: err.message,
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
  ${options.swagger ? `console.log(\`Swagger docs available at http://localhost:\${PORT}/api-docs\`);` : ""}
});

module.exports = app;
`.trim();
}

function generateViewEngineSetup(options: ResolvedOptions): string {
  switch (options.view) {
    case "ejs":
      return `
// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
`;
    case "pug":
      return `
// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../views'));
`;
    case "hbs":
      return `
// View engine setup
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, '../views/layouts'),
  partialsDir: path.join(__dirname, '../views/partials')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../views'));
`;
    default:
      return "";
  }
}
