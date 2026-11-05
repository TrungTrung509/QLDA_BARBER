import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runMigrations } from './migrate.js';

describe('runMigrations', () => {
  it('creates a database at the requested path', () => {
    const directory = mkdtempSync(join(tmpdir(), 'barbershop-migrate-'));
    const path = join(directory, 'nested', 'database.sqlite');
    try {
      runMigrations(path);
      expect(existsSync(path)).toBe(true);
    } finally {
      rmSync(directory, { recursive: true });
    }
  });
});

