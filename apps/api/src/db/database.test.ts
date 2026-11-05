import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { migrateDatabase, openDatabase, seedDatabase } from './database.js';

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true });
});

describe('database lifecycle', () => {
  it('migrates, seeds, and persists records after reopening', () => {
    const directory = mkdtempSync(join(tmpdir(), 'barbershop-db-'));
    temporaryDirectories.push(directory);
    const path = join(directory, 'booking.sqlite');
    const first = openDatabase(path);
    migrateDatabase(first, join(apiRoot, 'migrations'));
    seedDatabase(first, join(apiRoot, 'seeds'));
    first.close();

    const reopened = openDatabase(path);
    const count = reopened.prepare('SELECT COUNT(*) AS count FROM services').get() as { count: number };
    reopened.close();
    expect(count.count).toBe(2);
  });
});

