---
id: BBS-1
title: "Requirements and API contract"
status: done
priority: P1
assignee: qlda-team-technical-product-manager-fccdd7b1
team: 62132154-1530-4fc7-b0bc-54999a9c7fa8
labels: [ Spec, PRD, API ]
ownerReview: false
createdAt: 2026-11-05T05:58:02.379Z
updatedAt: 2026-11-05T06:03:55.601Z
workItemId: cc144891-de11-49bc-9f4e-4994e86f15e3
requestId: 0dbc20b7-d7f7-4705-b183-e08069f2be8d
source: agent:qlda-team-team-leader-0f797e8a
---

## Description

### 1. Bối cảnh & Mục tiêu kinh doanh (Context & Business Goal)
Xây dựng tài liệu đặc tả yêu cầu nghiệp vụ (PRD) và hợp đồng API chuẩn cho hệ thống Barbershop Booking System. Mục tiêu giải quyết bài toán đặt lịch cắt tóc trực tuyến, quản lý danh sách thợ cắt tóc, danh mục dịch vụ và ngăn ngừa triệt để tình trạng đặt trùng lịch (double-booking).

### 2. Phạm vi kỹ thuật & Kiến trúc (Technical Scope & Architecture)
- Tạo và sở hữu tài liệu `.crewly/specs/requirements.md` và `.crewly/specs/api-contract.md`.
- Phân chia vai trò rõ ràng: Khách vãng lai (Guest), Khách hàng (Customer), Quản trị viên tiệm (Admin).
- Quy định rõ múi giờ hoạt động của tiệm (Shop Timezone: Asia/Ho_Chi_Minh) và khung giờ mở cửa (08:00 - 20:00).

### 3. Hợp đồng dữ liệu & Giao thức API (Data Contracts)
- `GET /api/services`: Danh sách dịch vụ (ID, tên, giá tiền, thời lượng tính theo phút).
- `GET /api/barbers`: Danh sách thợ cắt tóc đang làm việc tại salon.
- `GET /api/availability?date=YYYY-MM-DD&barberId=...`: Danh sách các slot thời gian còn trống.
- `POST /api/bookings`: Tiếp nhận yêu cầu đặt lịch mới (Tên, SĐT, BarberID, ServiceID, StartTime).
- `POST /api/admin/login`: Đăng nhập quản trị viên, trả JWT token có hạn 24 giờ.

### 4. Các trường hợp biên & Xử lý lỗi (Edge Cases & Error Handling)
- Trùng giờ đặt lịch: Phải trả về mã lỗi 409 Conflict kèm thông điệp rõ ràng để giao diện xử lý.
- Đặt lùi giờ trong quá khứ: Trả về mã lỗi 400 Bad Request.
- Thiếu thông tin bắt buộc: Trả về mã lỗi 400 kèm danh sách các trường bị thiếu.

### 5. Tiêu chuẩn bàn giao & Nghiệm thu (Deliverables)
- Bàn giao hợp đồng API hoàn chỉnh cho Backend Developer và spec giao diện cho UI/UX Designer.

## Acceptance criteria

- [x] Given PRD specifications, when reviewed, then all business rules for booking, cancellation and admin management are fully defined.
- [x] Given API contracts, when inspected, then all request/response schemas for services, barbers, availability and bookings are unambiguous.
- [x] Given concurrency requirements, when defined, then the double-booking prevention rule is explicitly specified with 409 status code.

## Log

- 2026-11-05T05:58:02.379Z · qlda-team-team-leader-0f797e8a · created (backlog)
- 2026-11-05T05:58:02.514Z · qlda-team-team-leader-0f797e8a · assigned to qlda-team-technical-product-manager-fccdd7b1 — WorkItem cc144891-de11-49bc-9f4e-4994e86f15e3
- 2026-11-05T06:03:55.601Z · crewly · WorkItem cc144891-de11-49bc-9f4e-4994e86f15e3 verified → done
