import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Opens a durable SQLite database with safe local concurrency settings. */
export function openDatabase(path: string): Database.Database {
  const database = new Database(path);
  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');
  database.pragma('busy_timeout = 5000');
  return database;
}

function applySqlDirectory(database: Database.Database, directory: string): void {
  for (const filename of readdirSync(directory).filter((name) => name.endsWith('.sql')).sort()) {
    database.exec(readFileSync(join(directory, filename), 'utf8'));
  }
}

/** Applies all idempotent SQL migrations in lexical order. */
export function migrateDatabase(database: Database.Database, directory: string): void {
  applySqlDirectory(database, directory);
}

/** Loads deterministic local demo data without replacing existing records. */
export function seedDatabase(database: Database.Database, directory: string): void {
  applySqlDirectory(database, directory);
}

