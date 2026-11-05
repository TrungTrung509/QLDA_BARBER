import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { createApp } from './apps/api/dist/server.js';
import { openDatabase, migrateDatabase, seedDatabase } from './apps/api/dist/db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

const databasePath = resolve(__dirname, 'apps/api/data/barbershop.sqlite');
console.log(`Connecting to database at: ${databasePath}`);
const database = openDatabase(databasePath);

// Ensure migrations & seeds
const migrationsDir = join(__dirname, 'apps/api/migrations');
const seedsDir = join(__dirname, 'apps/api/seeds');
migrateDatabase(database, migrationsDir);
seedDatabase(database, seedsDir);

const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'password123';

const app = createApp({
  database,
  config: {
    adminUsername,
    adminPassword,
    allowedOrigin: `http://localhost:${PORT}`,
    secureCookies: false,
  },
});

// Serve web frontend static assets
const webDist = join(__dirname, 'apps/web/dist');
app.use(express.static(webDist));

// SPA fallback for all HTML navigation
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(join(webDist, 'index.html'));
  }
  next();
});

const server = app.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`💈  Barbershop Booking System is ONLINE!`);
  console.log(`======================================================`);
  console.log(`👉  Giao diện đặt lịch (Khách hàng):  http://localhost:${PORT}`);
  console.log(`👉  Giao diện quản lý (Admin):         http://localhost:${PORT}/admin`);
  console.log(`    Tài khoản Admin:  ${adminUsername}`);
  console.log(`    Mật khẩu Admin:   ${adminPassword}`);
  console.log(`======================================================\n`);
});

server.on('close', () => {
  database.close();
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server.close();
  });
}
