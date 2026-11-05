import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateDatabase, openDatabase, seedDatabase } from './database.js';

/** Migrates and seeds the database configured by DATABASE_PATH. */
export function runSeeds(databasePath = process.env.DATABASE_PATH ?? 'data/barbershop.sqlite'): void {
  const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
  const resolvedPath = resolve(databasePath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  const database = openDatabase(resolvedPath);
  try {
    migrateDatabase(database, join(apiRoot, 'migrations'));
    seedDatabase(database, join(apiRoot, 'seeds'));
  } finally {
    database.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runSeeds();

