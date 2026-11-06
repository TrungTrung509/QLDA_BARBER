// Isolated application process driven by api.integration.test.ts over IPC.
import { createApp } from '../../server.ts';
import { openDatabase } from '../../db/database.ts';
const database = openDatabase(process.argv[2]);
const app = createApp({ database,
  config: { adminUsername: 'admin', adminPassword: 'password', allowedOrigin: 'http://localhost:5173', secureCookies: false },
  now: () => new Date('2030-01-01T00:00:00Z'),
});
const server = app.listen(0, '127.0.0.1', () => {
  process.send({ type: 'ready', port: server.address().port });
});
process.on('message', async (message) => {
  if (message.type === 'stop') {
    server.close(() => { database.close(); process.exit(0); });
  } else if (message.type === 'book') {
    // Both processes acknowledge the barrier before either request is released.
    process.send({ type: 'armed' });
  } else if (message.type === 'go') {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/appointments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message.payload),
    });
    process.send({ type: 'result', status: response.status, body: await response.json() });
  }
});
