import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateDatabase, openDatabase } from './database.js';

/** Migrates the database configured by DATABASE_PATH. */
export function runMigrations(databasePath = process.env.DATABASE_PATH ?? 'data/barbershop.sqlite'): void {
  const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
  const resolvedPath = resolve(databasePath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  const database = openDatabase(resolvedPath);
  try {
    migrateDatabase(database, join(apiRoot, 'migrations'));
  } finally {
    database.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runMigrations();

