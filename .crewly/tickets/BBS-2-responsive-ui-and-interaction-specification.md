---
id: BBS-2
title: "Responsive UI and interaction specification"
status: done
priority: P1
assignee: qlda-team-fe-developer-690d736f
team: 62132154-1530-4fc7-b0bc-54999a9c7fa8
labels: [ UI, Design, Spec ]
ownerReview: false
createdAt: 2026-11-05T05:58:12.100Z
updatedAt: 2026-11-05T06:04:12.000Z
workItemId: dd234891-ee11-49bc-9f4e-4994e86f15f4
requestId: 0dbc20b7-d7f7-4705-b183-e08069f2be8d
source: agent:qlda-team-team-leader-0f797e8a
---

## Description

### 1. Bối cảnh & Mục tiêu kinh doanh (Context & Business Goal)
Thiết kế giao diện người dùng responsive cho Barbershop Booking System, mang phong cách sang trọng, cổ điển của tiệm cắt tóc nam hiện đại (Vintage Barber Aesthetic). Tối ưu hóa trải nghiệm người dùng mobile-first giúp khách hàng hoàn tất đặt lịch chỉ trong 4 bước đơn giản.

### 2. Phạm vi kỹ thuật & Kiến trúc (Technical Scope)
- Tạo tài liệu thiết kế tại `.crewly/specs/ui-spec.md` và các wireframe tương tác.
- Xây dựng Design System: Bảng màu (Charcoal `#1e293b`, Gold Amber `#d97706`, Warm White `#f8fafc`), Typography (font Sans-serif hiện đại, dễ đọc trên di động).
- Cấu trúc Booking Wizard 4 bước: (1) Chọn dịch vụ ➔ (2) Chọn thợ ➔ (3) Chọn ngày & khung giờ trống ➔ (4) Điền thông tin & xác nhận.

### 3. Giao diện & Trải nghiệm tương tác (Interaction Design)
- Calendar Picker: Trực quan, tự động làm mờ (disable) các ngày trong quá khứ và các ngày tiệm nghỉ.
- Time Slot Grid: Hiển thị các khung giờ theo dạng pill button; đổi màu xanh lá (trống), xám (đã kín), vàng hổ phách (đang chọn).
- Bảng thông báo kết quả: Modal pop-up xác nhận thành công kèm mã đặt lịch và nút lưu vào Google Calendar / copy mã hẹn.

### 4. Trường hợp ngoại lệ & Khả năng tiếp cận (Accessibility & Edge Cases)
- Người dùng mất kết nối mạng giữa chừng: Hiển thị thông báo offline và cho phép thử lại (Retry).
- Khung giờ vừa bị người khác đặt: Hiển thị cảnh báo tức thời và đề xuất chọn slot liền kề.
- Responsive: Tương thích hoàn hảo từ màn hình điện thoại 375px đến màn hình máy tính 1920px.

## Acceptance criteria

- [x] Given mobile and desktop viewports, when rendering landing page, then layout adapts cleanly without horizontal scroll.
- [x] Given the 4-step booking flow, when interacting, then transitions are smooth and selected states are clearly distinguished.
- [x] Given slot selection, when a slot is unavailable, then it is visually disabled and cannot be clicked.

## Log

- 2026-11-05T05:58:12.100Z · qlda-team-team-leader-0f797e8a · created (backlog)
- 2026-11-05T05:58:12.200Z · qlda-team-team-leader-0f797e8a · assigned to qlda-team-fe-developer-690d736f — WorkItem dd234891-ee11-49bc-9f4e-4994e86f15f4
- 2026-11-05T06:04:12.000Z · crewly · WorkItem dd234891-ee11-49bc-9f4e-4994e86f15f4 verified → done
