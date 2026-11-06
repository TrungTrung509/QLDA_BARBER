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


it('upgrades the legacy weekday constraint without shifting existing ISO schedules or losing data', async () => {
  const { readFileSync } = await import('node:fs');
  const database = openDatabase(':memory:');
  try {
    database.exec(readFileSync(join(apiRoot, 'migrations/001_initial.sql'), 'utf8'));
    seedDatabase(database, join(apiRoot, 'seeds'));
    database.prepare('INSERT INTO barber_hours VALUES (?,?,?,?)').run('barber-alex', 0, 600, 900);
    const before = database.prepare('SELECT * FROM barber_hours ORDER BY barber_id,weekday,start_minute').all() as { weekday: number }[];
    migrateDatabase(database, join(apiRoot, 'migrations'));
    migrateDatabase(database, join(apiRoot, 'migrations'));
    const after = database.prepare('SELECT * FROM barber_hours ORDER BY barber_id,weekday,start_minute').all();
    expect(after).toEqual(expect.arrayContaining(before.map((row) => ({ ...row, weekday: row.weekday === 0 ? 7 : row.weekday }))));
    expect(after).toHaveLength(before.length);
    expect(() => database.prepare('INSERT INTO barber_hours VALUES (?,?,?,?)').run('barber-sam', 0, 600, 900)).toThrow();
    expect(() => database.prepare('INSERT INTO barber_hours VALUES (?,?,?,?)').run('barber-sam', 7, 600, 900)).not.toThrow();
    expect(database.pragma('foreign_key_check')).toEqual([]);
  } finally { database.close(); }
});
