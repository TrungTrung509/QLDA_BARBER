---
id: BBS-5
title: "[Frontend] Complete responsive booking and protected management flows"
status: in_progress
priority: P1
assignee: qlda-team-fe-developer-690d736f
team: 62132154-1530-4fc7-b0bc-54999a9c7fa8
labels: [ Frontend, UI, React, BookingFlow ]
ownerReview: false
createdAt: 2026-11-05T05:58:30.000Z
updatedAt: 2026-11-06T17:13:02.362Z
workItemId: 6553a3b8-fbca-48be-94bd-8e7371cae0d7
requestId: 0dbc20b7-d7f7-4705-b183-e08069f2be8d
source: agent:qlda-team-team-leader-0f797e8a
---

## Description

### 1. Bối cảnh & Mục tiêu kinh doanh (Context & Business Goal)
Hiện thực hóa toàn bộ giao diện đặt lịch cho khách hàng và bảng điều khiển quản trị cho chủ tiệm, kết nối trực tiếp với REST API backend. Đem lại trải nghiệm trực quan, tức thì, giảm tối đa tỷ lệ hủy đơn của khách hàng.

### 2. Phạm vi kỹ thuật & Kiến trúc (Technical Scope)
- Xây dựng component React sạch sẽ, phân tách module tại `apps/web/src/`:
  - `BookingWizard`: Quản lý state 4 bước, lưu dữ liệu khách chọn trong session/state.
  - `ServiceList`: Lựa chọn dịch vụ kèm hình ảnh, thời gian làm và giá tiền minh bạch.
  - `BarberSelect`: Chọn thợ ưa thích hoặc chọn "Bất kỳ thợ nào đang rảnh".
  - `TimeSlotPicker`: Hiển thị lưới khung giờ tự động fetch theo ngày từ API.
  - `BookingConfirmation`: Form điền tên, SĐT, ghi chú và hiển thị hóa đơn tóm tắt.
  - `AdminDashboard`: Bảng danh sách lịch hẹn hôm nay, lọc theo thợ/trạng thái và nút đổi trạng thái (Complete, Cancel).

### 3. Quản lý trạng thái & Tương tác API (Data Fetching & State)
- Tích hợp Fetch API với cơ chế xử lý lỗi toàn cục: Tự động hiển thị Toast thông báo khi mạng lỗi hoặc khi slot bị trùng.
- Quản lý JWT Token của Admin an toàn trong `localStorage` hoặc HttpOnly cookie.

### 4. Tối ưu hóa trải nghiệm & Giao diện (UX & Responsiveness)
- Tối ưu loading state: Skeleton placeholders khi đang tải danh sách khung giờ từ máy chủ.
- Tương thích 100% trên các thiết bị màn hình cảm ứng: Nút bấm lớn tối thiểu 44px theo tiêu chuẩn Apple Human Interface Guidelines.

## Acceptance criteria

- [x] Given user completes step 1 to 4, when clicking Confirm, then booking request is dispatched and success screen appears.
- [x] Given slot conflict returned by API (409), then user-friendly error message is displayed prompting to pick another time.
- [x] Given admin logs in, when credentials are valid, then redirected to Admin Dashboard with active bookings list.
- [x] Given viewport resized to mobile dimensions (375px), then all booking steps fit cleanly without horizontal scrolling.
- [x] Given keyboard navigation, when pressing tab through booking wizard, all controls are focusable and accessible.

## Log

- 2026-11-05T05:58:30.000Z · qlda-team-team-leader-0f797e8a · created (backlog)
- 2026-11-05T05:58:30.100Z · qlda-team-team-leader-0f797e8a · assigned to qlda-team-fe-developer-690d736f — WorkItem 00566891-bb11-49bc-9f4e-4994e86f15i7
- 2026-11-06T15:42:10.000Z · crewly · WorkItem 00566891-bb11-49bc-9f4e-4994e86f15i7 verified → done
- 2026-11-06T17:12:50.604Z · qlda-team-team-leader-0f797e8a · done → ready — Reopen stale done state during current TL review 6553a3b8-fbca-48be-94bd-8e7371cae0d7:verify:6553a3b8-fbca-48be-94bd-8e7371cae0d7. Source checks pass so far; responsive/keyboard browser evidence pending QA. Do not create duplicate work.
- 2026-11-06T17:13:02.362Z · qlda-team-team-leader-0f797e8a · linked to WorkItem 6553a3b8-fbca-48be-94bd-8e7371cae0d7 (done_by_worker, qlda-team-fe-developer-690d736f) by qlda-team-team-leader-0f797e8a
