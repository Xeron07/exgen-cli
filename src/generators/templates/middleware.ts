import fs from "fs-extra";
import path from "path";
import { ResolvedOptions } from "../types";

export async function generateMiddleware(
  options: ResolvedOptions
): Promise<void> {
  if (options.auth) {
    await generateAuthMiddleware(options);
  }
  await generateValidationMiddleware(options);
  await generateErrorHandlingMiddleware(options);
}

async function generateAuthMiddleware(options: ResolvedOptions): Promise<void> {
  const authContent = options.isTypescript
    ? `
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.user = decoded;
    next();
  } catch (error:any) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // This would typically check user roles from database
    // For now, we'll assume all authenticated users have basic role
    const userRole = 'user'; // This should come from the user object
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
}
`
    : `
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error:any) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // This would typically check user roles from database
    const userRole = 'user'; // This should come from the user object
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
}

module.exports = { authenticateToken, requireRole };
`;

  const filename = options.isTypescript ? "auth.ts" : "auth.js";
  await fs.writeFile(
    path.join(options.projectPath, "src", "api", "middleware", filename),
    authContent.trim()
  );
}

async function generateValidationMiddleware(
  options: ResolvedOptions
): Promise<void> {
  const validationContent = options.isTypescript
    ? `
import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  
  next();
}

export function validateRequest(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    handleValidationErrors(req, res, next);
  };
}

// Common validation chains
export const validateUser = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];
`
    : `
const { validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  next();
}

function validateRequest(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    handleValidationErrors(req, res, next);
  };
}

module.exports = { handleValidationErrors, validateRequest };
`;

  const filename = options.isTypescript ? "validation.ts" : "validation.js";
  await fs.writeFile(
    path.join(options.projectPath, "src", "api", "middleware", filename),
    validationContent.trim()
  );
}

async function generateErrorHandlingMiddleware(
  options: ResolvedOptions
): Promise<void> {
  const errorContent = options.isTypescript
    ? `
import { Request, Response, NextFunction } from 'express';
${options.elk ? "import { logger } from '../../utils/logger';" : ""}

export interface CustomError extends Error {
  statusCode?: number;
  status?: number;
}

export function notFound(req: Request, res: Response, next: NextFunction): void {
  const error = new Error(\`Not Found - \${req.originalUrl}\`) as CustomError;
  error.statusCode = 404;
  next(error:any);
}

export function errorHandler(
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Internal Server Error';

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors || {}).map((val: any) => val.message).join(', ');
  }

  // Mongoose duplicate key error
  if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  ${options.elk ? "logger.error('Error:', { message, statusCode, stack: error.stack });" : "console.error('Error:', error);"}

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
`
    : `
${options.elk ? "const { logger } = require('../../utils/logger');" : ""}

function notFound(req, res, next) {
  const error = new Error(\`Not Found - \${req.originalUrl}\`);
  error.statusCode = 404;
  next(error:any);
}

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Internal Server Error';

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map(val => val.message).join(', ');
  }

  // Mongoose duplicate key error
  if (error.name === 'MongoError' && error.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  ${options.elk ? "logger.error('Error:', { message, statusCode, stack: error.stack });" : "console.error('Error:', error);"}

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { notFound, errorHandler, asyncHandler };
`;

  const filename = options.isTypescript ? "errorHandler.ts" : "errorHandler.js";
  await fs.writeFile(
    path.join(options.projectPath, "src", "api", "middleware", filename),
    errorContent.trim()
  );
}
