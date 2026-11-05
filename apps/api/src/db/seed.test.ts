import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { runSeeds } from './seed.js';

describe('runSeeds', () => {
  it('loads deterministic demo records idempotently', () => {
    const directory = mkdtempSync(join(tmpdir(), 'barbershop-seed-'));
    const path = join(directory, 'nested', 'database.sqlite');
    try {
      runSeeds(path);
      runSeeds(path);
      const database = new Database(path);
      const count = database.prepare('SELECT COUNT(*) AS count FROM barbers').get() as { count: number };
      database.close();
      expect(count.count).toBe(2);
    } finally {
      rmSync(directory, { recursive: true });
    }
  });
});
