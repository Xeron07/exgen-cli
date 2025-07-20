import fs from "fs-extra";
import path from "path";
import { ResolvedOptions } from "../types";

export async function generateRoutes(options: ResolvedOptions): Promise<void> {
  await generateIndexRoute(options);
  await generateUsersRoute(options);
}

async function generateIndexRoute(options: ResolvedOptions): Promise<void> {
  const indexRouteContent = options.isTypescript
    ? `
import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get homepage
 *     description: Returns the application homepage
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
router.get('/', (req: Request, res: Response) => {
  ${
    options.view
      ? `
  res.render('index', { 
    title: '${options.projectName}',
    message: 'Welcome to ${options.projectName}!' 
  });
  `
      : `
  res.json({
    message: 'Welcome to ${options.projectName} API!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
  `
  }
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the application
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 uptime:
 *                   type: number
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
`
    : `
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get homepage
 *     description: Returns the application homepage
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
router.get('/', (req, res) => {
  ${
    options.view
      ? `
  res.render('index', { 
    title: '${options.projectName}',
    message: 'Welcome to ${options.projectName}!' 
  });
  `
      : `
  res.json({
    message: 'Welcome to ${options.projectName} API!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
  `
  }
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the application
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 uptime:
 *                   type: number
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
`;

  const filename = options.isTypescript ? "index.ts" : "index.js";
  await fs.writeFile(
    path.join(options.projectPath, "src", "api", "routes", filename),
    indexRouteContent.trim()
  );
}

async function generateUsersRoute(options: ResolvedOptions): Promise<void> {
  const usersRouteContent = options.isTypescript
    ? `
import { Router, Request, Response, NextFunction } from 'express';
${options.auth ? "import { authenticateToken } from '../middleware/auth';" : ""}
${options.mongodb ? "import { User } from '../../models/User';" : ""}
${options.postgres ? "import { User } from '../../models/User';" : ""}

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           description: The user ID
 *         name:
 *           type: string
 *           description: The user's name
 *         email:
 *           type: string
 *           description: The user's email
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', ${options.auth ? "authenticateToken, " : ""}async (req: Request, res: Response, next: NextFunction) => {
  try {
    ${
      options.mongodb || options.postgres
        ? `
    const users = await User.find();
    res.json(users);
    `
        : `
    // Mock users data
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: new Date().toISOString() },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date().toISOString() }
    ];
    res.json(users);
    `
    }
  } catch (error:any) {
    next(error:any);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/:id', ${options.auth ? "authenticateToken, " : ""}async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    ${
      options.mongodb || options.postgres
        ? `
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
    `
        : `
    // Mock user data
    const user = { id, name: 'John Doe', email: 'john@example.com', createdAt: new Date().toISOString() };
    res.json(user);
    `
    }
  } catch (error:any) {
    next(error:any);
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.post('/', ${options.auth ? "authenticateToken, " : ""}async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email } = req.body;
    ${
      options.mongodb || options.postgres
        ? `
    const user = await User.create({ name, email });
    res.status(201).json(user);
    `
        : `
    // Mock user creation
    const user = { id: Date.now().toString(), name, email, createdAt: new Date().toISOString() };
    res.status(201).json(user);
    `
    }
  } catch (error:any) {
    next(error:any);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.put('/:id', ${options.auth ? "authenticateToken, " : ""}async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    ${
      options.mongodb || options.postgres
        ? `
    const user = await User.findByIdAndUpdate(id, { name, email }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
    `
        : `
    // Mock user update
    const user = { id, name, email, updatedAt: new Date().toISOString() };
    res.json(user);
    `
    }
  } catch (error:any) {
    next(error:any);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/:id', ${options.auth ? "authenticateToken, " : ""}async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    ${
      options.mongodb || options.postgres
        ? `
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
    `
        : `
    // Mock user deletion
    res.json({ message: 'User deleted successfully' });
    `
    }
  } catch (error:any) {
    next(error:any);
  }
});

export default router;
`
    : `
const express = require('express');
const router = express.Router();
${options.auth ? "const { authenticateToken } = require('../middleware/auth');" : ""}
${options.mongodb ? "const User = require('../../models/User');" : ""}
${options.postgres ? "const { User } = require('../../models/User');" : ""}

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           description: The user ID
 *         name:
 *           type: string
 *           description: The user's name
 *         email:
 *           type: string
 *           description: The user's email
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', ${options.auth ? "authenticateToken, " : ""}async (req, res, next) => {
  try {
    ${
      options.mongodb || options.postgres
        ? `
    const users = await User.find();
    res.json(users);
    `
        : `
    // Mock users data
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: new Date().toISOString() },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date().toISOString() }
    ];
    res.json(users);
    `
    }
  } catch (error:any) {
    next(error:any);
  }
});

// Additional route handlers follow the same pattern...

router.get('/:id', ${options.auth ? "authenticateToken, " : ""}async (req, res, next) => {
  try {
    const { id } = req.params;
    ${
      options.mongodb || options.postgres
        ? `
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
    `
        : `
    const user = { id, name: 'John Doe', email: 'john@example.com', createdAt: new Date().toISOString() };
    res.json(user);
    `
    }
  } catch (error:any) {
    next(error:any);
  }
});

router.post('/', ${options.auth ? "authenticateToken, " : ""}async (req, res, next) => {
  try {
    const { name, email } = req.body;
    ${
      options.mongodb || options.postgres
        ? `
    const user = await User.create({ name, email });
    res.status(201).json(user);
    `
        : `
    const user = { id: Date.now().toString(), name, email, createdAt: new Date().toISOString() };
    res.status(201).json(user);
    `
    }
  } catch (error:any) {
    next(error:any);
  }
});

module.exports = router;
`;

  const filename = options.isTypescript ? "users.ts" : "users.js";
  await fs.writeFile(
    path.join(options.projectPath, "src", "api", "routes", filename),
    usersRouteContent.trim()
  );
}
