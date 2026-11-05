import { test } from '@playwright/test';

test.describe('database persistence across process restart', () => {
  test('retains seeded domain records and a created appointment after restart', async () => {
    test.fail(true, 'Awaiting scaffold-owned restart harness and backend seed/reset contract');
    throw new Error('Persistence test requires a real stop/start boundary against the same database file');
  });
});

