---
id: BBS-4
title: "[Backend] Persist bookings and enforce safe availability and admin access"
status: done
priority: P1
assignee: qlda-team-be-developer-ac69e470
team: 62132154-1530-4fc7-b0bc-54999a9c7fa8
labels: [ Backend, API, Database, Security ]
ownerReview: false
createdAt: 2026-11-05T05:58:25.000Z
updatedAt: 2026-11-06T15:42:05.000Z
workItemId: ff456891-aa11-49bc-9f4e-4994e86f15h6
requestId: 0dbc20b7-d7f7-4705-b183-e08069f2be8d
source: agent:qlda-team-team-leader-0f797e8a
---

## Description

### 1. Bối cảnh & Mục tiêu kinh doanh (Context & Business Goal)
Xây dựng toàn bộ hệ thống API Backend cốt lõi, quản lý trạng thái đặt lịch, tính toán khung giờ khả dụng theo thời gian thực và ngăn chặn 100% tình trạng đặt trùng lịch (Race condition / Double-booking).

### 2. Phạm vi kỹ thuật & Kiến trúc (Technical Scope)
- Controller & Service layer được phân tách rõ ràng tại `apps/api/src/`.
- Triển khai thuật toán tính toán khung giờ trống `getAvailableSlots(date, barberId, duration)`:
  - Chia ca làm việc thành các block 30 phút.
  - Trừ đi các khoảng thời gian đã có booking được xác nhận (`confirmed` hoặc `pending`).
- Giao dịch an toàn (ACID Transaction): Sử dụng `db.transaction()` trong SQLite khi tạo booking mới để đảm bảo kiểm tra và chốt slot diễn ra nguyên tử (atomic).

### 3. Bảo mật & Xác thực Admin (Authentication & Authorization)
- Endpoint `POST /api/admin/login`: So sánh mật khẩu băm, cấp JWT token có hạn 24 giờ.
- Middleware `authMiddleware`: Xác thực Bearer JWT token trên các route quản trị (`GET /api/admin/bookings`, `PATCH /api/admin/bookings/:id/status`).

### 4. Các trường hợp biên & Xử lý lỗi (Edge Cases & Error Handling)
- Hai người cùng ấn đặt một thợ vào cùng một giây: Giao dịch atomic sẽ commit request đầu tiên và trả về 409 Conflict cho request thứ hai.
- Khách hàng nhập email hoặc số điện thoại không hợp lệ: Validate bằng Zod schema, trả về 400 Bad Request kèm chi tiết lỗi từng trường.
- Truy cập route quản trị không có token: Trả về 401 Unauthorized.

## Acceptance criteria

- [x] Given concurrent booking attempts for the same barber and slot, then exactly one succeeds and the other returns 409 Conflict.
- [x] Given availability query, when bookings exist, then conflicting slots are omitted from the returned available list.
- [x] Given admin endpoints, when called without valid JWT, then response is 401 Unauthorized.
- [x] Given server restart, when queried, then previously persisted bookings remain intact in the SQLite database.
- [x] Given invalid payload parameters, then 400 Bad Request is returned with structured validation messages.

## Log

- 2026-11-05T05:58:25.000Z · qlda-team-team-leader-0f797e8a · created (backlog)
- 2026-11-05T05:58:25.100Z · qlda-team-team-leader-0f797e8a · assigned to qlda-team-be-developer-ac69e470 — WorkItem ff456891-aa11-49bc-9f4e-4994e86f15h6
- 2026-11-06T15:42:05.000Z · crewly · WorkItem ff456891-aa11-49bc-9f4e-4994e86f15h6 verified → done
