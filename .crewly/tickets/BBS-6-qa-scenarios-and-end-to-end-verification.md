---
id: BBS-6
title: "[QA] Verify booking, persistence, security and responsive acceptance"
status: in_progress
priority: P1
assignee: qlda-team-tester-3e1b565d
team: 62132154-1530-4fc7-b0bc-54999a9c7fa8
labels: [ QA, E2E, Testing, Verification, Chore ]
ownerReview: false
createdAt: 2026-11-05T05:58:35.003Z
updatedAt: 2026-11-06T15:42:13.605Z
workItemId: 1afcb093-77a4-4267-af5e-cfd1f73f2079
requestId: 0dbc20b7-d7f7-4705-b183-e08069f2be8d
source: agent:qlda-team-team-leader-0f797e8a
---

## Description

### 1. Bối cảnh & Mục tiêu kinh doanh (Context & Business Goal)
Thực hiện kiểm thử toàn diện toàn bộ hệ thống Barbershop Booking System trước khi nghiệm thu phát hành (Release Gate). Kiểm tra độ chính xác của logic nghiệp vụ, tính an toàn của giao dịch đặt lịch và trải nghiệm người dùng thực tế trên mọi thiết bị.

### 2. Phạm vi kiểm thử & Ma trận Test (QA Scope & Test Matrix)
- Kiểm thử luồng E2E người dùng: Từ chọn dịch vụ, chọn thợ, chọn giờ đến nhận mã xác nhận thành công.
- Kiểm thử chịu tải đồng thời (Concurrency Test): Mô phỏng 2 hoặc nhiều request gửi đồng thời đặt cùng 1 thợ vào cùng 1 khung giờ.
- Kiểm thử tính bền vững dữ liệu (Persistence Test): Đặt hẹn thành công, khởi động lại server Node.js, kiểm tra dữ liệu vẫn tồn tại vẹn nguyên trong database.
- Kiểm thử bảo mật (Security Test): Truy cập các API quản trị `/api/admin/*` khi không có token, token giả mạo, hoặc token hết hạn.
- Kiểm thử tương thích giao diện (Responsive & Cross-Device): Kiểm tra hiển thị trên mobile (iOS Safari, Android Chrome) và desktop.

### 3. Kế hoạch dữ liệu kiểm thử (Test Data & Fixtures)
- Dữ liệu thợ mẫu: Barber John Doe, Barber Alex Smith.
- Dịch vụ mẫu: Cắt tóc cổ điển (30p), Cắt + Gội massage (45p), Cạo râu hoàng gia (20p).
- Tạo các kịch bản test tự động tại `e2e/` hoặc script kiểm thử hồi quy.

### 4. Báo cáo lỗi & Tiêu chuẩn nghiệm thu (Defect Reporting & Acceptance)
- Mọi lỗi nghiêm trọng (Blocker/Critical/High) phải được ghi nhận rõ ràng vào báo cáo lỗi kèm điều kiện tái hiện và báo ngay vào group chat `#general`.
- Không được phép bypass hoặc che giấu lỗi trước khi chuyển trạng thái nghiệm thu.

## Acceptance criteria

- [ ] Given chk-1..7, when QA matrix is reviewed, then each maps to runnable cases, expected outcome and recorded evidence or explicit blocker.
- [ ] Given running seeded apps, when booking/dashboard/security tests execute, then real success/error/conflict and authorization outcomes are asserted.
- [ ] Given a saved customer/appointment, when application restarts cleanly using same database, then persisted data and authorized dashboard visibility remain.
- [ ] Given simultaneous independent contenders, when booking overlaps, then exactly one commits; adjacent/different-barber bookings succeed and cancelled capacity reopens.
- [ ] Given mobile/desktop keyboard checks and final suite results, when reporting to_review, then no critical/high defect is concealed and commands/exit codes/screenshots support verdict.

## Log

- 2026-11-05T05:58:35.003Z · qlda-team-team-leader-0f797e8a · created (backlog)
- 2026-11-05T05:58:35.250Z · qlda-team-team-leader-0f797e8a · assigned to qlda-team-tester-3e1b565d — WorkItem 22125ecd-22df-414b-97f1-cb3758745ae0
- 2026-11-06T15:33:20.307Z · crewly · WorkItem 22125ecd-22df-414b-97f1-cb3758745ae0 cancelled: WorkItem exceeded TTL of 24h — back to ready
- 2026-11-06T15:41:37.898Z · qlda-team-team-leader-0f797e8a · updated title, priority P1, labels, description, acceptance criteria
- 2026-11-06T15:42:05.835Z · qlda-team-team-leader-0f797e8a · assigned to qlda-team-tester-3e1b565d — WorkItem 1afcb093-77a4-4267-af5e-cfd1f73f2079
- 2026-11-06T15:42:13.605Z · qlda-team-team-leader-0f797e8a · qlda-team-tester-3e1b565d started work
