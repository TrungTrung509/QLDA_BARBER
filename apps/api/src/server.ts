import 'dotenv/config';

import cors from 'cors';
import express, { type Express } from 'express';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { migrateDatabase, openDatabase } from './db/database.js';
import { type ApiDependencies, registerApiRoutes } from './modules/api.js';

const DEFAULT_API_HOST = '127.0.0.1';
const DEFAULT_API_PORT = 3001;
const DEFAULT_ALLOWED_ORIGIN = 'http://127.0.0.1:5173';

/** Creates the HTTP application so tests can exercise it without opening a port. */
export function createApp(dependencies?: ApiDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: dependencies?.config.allowedOrigin ?? DEFAULT_ALLOWED_ORIGIN, credentials: true }));
  app.use(express.json());
  app.get('/api/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });
  if (dependencies !== undefined) registerApiRoutes(app, dependencies);
  return app;
}

/** Starts the local API server with environment-configurable host and port. */
export function startServer(): ReturnType<Express['listen']> {
  const host = process.env.API_HOST ?? DEFAULT_API_HOST;
  const port = Number.parseInt(process.env.API_PORT ?? String(DEFAULT_API_PORT), 10);
  const databasePath = resolve(process.env.DATABASE_PATH ?? 'data/barbershop.sqlite');
  const adminUsername = requiredEnvironment('ADMIN_USERNAME');
  const adminPassword = requiredEnvironment('ADMIN_PASSWORD');
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? DEFAULT_ALLOWED_ORIGIN;
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = openDatabase(databasePath);
  const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
  migrateDatabase(database, join(apiRoot, 'migrations'));
  const server = createApp({
    database,
    config: { adminUsername, adminPassword, allowedOrigin, secureCookies: process.env.NODE_ENV === 'production' },
  }).listen(port, host, () => {
    console.log(`API listening at http://${host}:${port}`);
  });
  server.on('close', () => database.close());
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => server.close());
  }
  return server;
}

function requiredEnvironment(name: 'ADMIN_USERNAME' | 'ADMIN_PASSWORD'): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  startServer();
}
