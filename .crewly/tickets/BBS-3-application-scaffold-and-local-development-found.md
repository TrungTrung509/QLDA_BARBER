---
id: BBS-3
title: "[Scaffold] Restore local tooling and verify application entry wiring"
status: in_progress
priority: P1
assignee: qlda-team-fullstack-developer-b16830a5
team: 62132154-1530-4fc7-b0bc-54999a9c7fa8
labels: [ Chore ]
ownerReview: false
createdAt: 2026-11-05T05:58:20.000Z
updatedAt: 2026-11-06T17:05:41.208Z
workItemId: 18b90530-a5d4-4c6a-9338-72760baf4715
requestId: 0dbc20b7-d7f7-4705-b183-e08069f2be8d
source: agent:qlda-team-team-leader-0f797e8a
---

## Description

Khôi phục và hoàn thiện nền tảng phát triển cục bộ (Local Development Foundation) cho Barbershop Booking System, bao gồm cấu hình toàn dự án, server API Node/TypeScript, frontend React Vite và cơ sở dữ liệu SQLite cục bộ. Đảm bảo tích hợp hoàn chỉnh giữa frontend, backend và bộ công cụ kiểm thử.

### 1. Bối cảnh & Mục tiêu (Context & Business Goal)
- Nhiệm vụ trọng tâm: Thiết lập cấu trúc monorepo/multi-package chuẩn mực với cấu hình TypeScript nghiêm ngặt (strict mode), ESLint, Vitest và Playwright.
- Đảm bảo môi trường phát triển đồng nhất cho toàn bộ đội ngũ (Frontend, Backend, Tester), hỗ trợ hot-reloading và luồng khởi chạy đồng thời cả API (port 3001) và Web client (port 5173).
- Chuẩn hóa quản lý biến môi trường qua `.env` và `.env.example`, không commit credentials nhạy cảm vào git repository.

### 2. Phạm vi kỹ thuật & Kiến trúc (Technical Scope & Architecture)
- Quản lý cấu hình root: `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.js`.
- Cấu trúc thư mục:
  - `apps/api`: Node.js Express/TypeScript API service kết nối SQLite (`better-sqlite3`).
  - `apps/web`: React 18, Vite, TypeScript, TailwindCSS / CSS Modules.
- Hệ thống lệnh tiêu chuẩn: `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:integration`, `npm run test:e2e`.
- Khởi tạo script seed dữ liệu và migration chuẩn cho SQLite.

### 3. Hợp đồng dữ liệu & Giao thức (Data Contracts & I/O)
- Biến môi trường hệ thống:
  - `PORT=3001` (Backend API).
  - `DATABASE_PATH=apps/api/data/barbershop.sqlite`.
  - `ADMIN_USER`, `ADMIN_PASSWORD_HASH` (chuẩn hóa auth qua env).
  - `VITE_API_URL=http://localhost:3001` (Frontend client trỏ về API gateway).
- API Server entry (`apps/api/src/server.ts`): Cung cấp endpoint `/api/health` trả về `{ status: "ok", timestamp: string, version: string }`.

### 4. Xử lý ngoại lệ & Trường hợp biên (Edge Cases & Error Handling)
- Module native SQLite (`better-sqlite3`) tương thích chéo giữa Windows và Linux container.
- Thiếu biến môi trường hoặc file `.env` phải báo lỗi rõ ràng, có thông điệp hướng dẫn thay vì fail im lặng.
- Graceful shutdown khi nhận tín hiệu `SIGTERM` / `SIGINT`: đóng kết nối database sạch sẽ trước khi thoát process.

### 5. Tiêu chuẩn bàn giao & Nghiệm thu (Deliverables & Test Evidence)
- Toàn bộ lệnh `npm run build` và `npm run typecheck` chạy pass 100% không warning.
- Smoke test cho cả API server và Web app mount thành công trong môi trường kiểm thử tự động.
- Cung cấp tài liệu hướng dẫn cài đặt chi tiết trong `README.md`.

## Acceptance criteria

- [ ] Given a clean documented environment, when dependencies install and migrations/seed run, then both local applications start and health and web routes respond.
- [ ] Given current application sources, when lint/typecheck/build and meaningful scaffold smoke tests run, then all pass without suppressions or placeholder success.
- [ ] Given backend tests and frontend component tests, when test commands run, then each uses its appropriate environment and results are honestly reported.
- [ ] Given README and .env.example, when a new developer follows setup, then credentials, migrations, timezone/hours and validation commands are documented without real secrets.

## Log

- 2026-11-05T05:58:20.000Z · qlda-team-team-leader-0f797e8a · created (backlog)
- 2026-11-05T05:58:20.100Z · qlda-team-team-leader-0f797e8a · assigned to qlda-team-fullstack-developer-b16830a5 — WorkItem ee345891-ff11-49bc-9f4e-4994e86f15g5
- 2026-11-06T15:42:00.000Z · crewly · WorkItem ee345891-ff11-49bc-9f4e-4994e86f15g5 verified → done
- 2026-11-06T17:03:51.272Z · qlda-team-fullstack-developer-b16830a5 · Implemented isolated tooling fixes in Barbershop-Booking-System-bbs3 and applied only Fullstack-owned config/entry/test/docs paths to shared workspace per TL request. Node/jsdom test separation, React act mount regression, environment API origin and root .env loading repaired. Baseline typecheck/build/integration exit 0 and TCP/API+web smoke 200. Full lint now exposes peer source violations; shared verification pending. No Done claim.
- 2026-11-06T17:05:02.295Z · qlda-team-fullstack-developer-b16830a5 · updated labels, description, acceptance criteria
- 2026-11-06T17:05:24.041Z · qlda-team-fullstack-developer-b16830a5 · updated labels, description, acceptance criteria — Recovered scope and unchecked AC per TL; status in_progress update rejected by API (use claim or assign). TL must relink existing running work item; historical log retained.
- 2026-11-06T17:05:41.010Z · qlda-team-team-leader-0f797e8a · done → ready — TL reconciliation: stale done state conflicts with running scaffold repair 18b90530-a5d4-4c6a-9338-72760baf4715 and pending shared validation; reopen to link existing work, no duplicate task.
- 2026-11-06T17:05:41.208Z · qlda-team-team-leader-0f797e8a · linked to WorkItem 18b90530-a5d4-4c6a-9338-72760baf4715 (running, qlda-team-fullstack-developer-b16830a5) by qlda-team-team-leader-0f797e8a
