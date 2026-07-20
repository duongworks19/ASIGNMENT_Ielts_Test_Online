# SPEC.md — Feature: Admin Management & Approval (feature-admin-management-approval)

Feature này đóng vai trò trung tâm quản trị hệ thống (System Control Center) cho nền tảng IELTS Online Learning, đảm bảo kiểm soát người dùng, phân quyền RBAC và kiểm duyệt chất lượng nội dung học tập.

---

## 1. Business Context & Goals

Mục tiêu chính:
- **Quản lý toàn bộ người dùng**: Admin có thể xem, tìm kiếm, lọc và cập nhật thông tin người dùng (Student, Teacher, Admin).
- **Phân quyền (RBAC)**: Đảm bảo kiểm soát truy cập và thực thi quyền hạn dựa trên vai trò (`role`).
- **Kiểm duyệt nội dung**: Hỗ trợ luồng kiểm duyệt khóa học (`course`), bài học (`lesson`), và bài test (`test`) do Teacher tạo trước khi public cho Student.
- **Quản lý trạng thái tài khoản**: Cho phép Admin kích hoạt (`active`), tạm khóa (`locked`), hoặc cấm (`banned`) tài khoản người dùng.
- **Audit Logs**: Lưu trữ lịch sử các thao tác của Admin để phục vụ việc giám sát hệ thống.

---

## 2. Stakeholders & User Personas

- **Admin (Primary Actor)**: Có toàn quyền quản trị hệ thống, duyệt nội dung và quản lý user.
- **Teacher**: Người tạo nội dung và gửi yêu cầu phê duyệt.
- **Student**: Người học, chỉ xem được các nội dung đã được Admin phê duyệt (`status = "approved"`).
- **System**: Tự động ghi nhận log hành vi và kiểm tra quyền hạn (middleware/guard).

---

## 3. User Stories

### User Management
- **ADM-USER-01**: Admin muốn xem danh sách toàn bộ người dùng trong hệ thống để quản lý.
- **ADM-USER-02**: Admin muốn tìm kiếm và lọc danh sách người dùng theo vai trò (`role`) và trạng thái (`status`).
- **ADM-USER-03**: Admin muốn thay đổi vai trò của người dùng (ví dụ nâng cấp student lên teacher).
- **ADM-USER-04**: Admin muốn khóa / mở khóa hoặc cấm tài khoản của người dùng.
- **ADM-USER-05**: Admin muốn xóa tài khoản người dùng khỏi hệ thống (hard/soft delete).

### Content Approval
- **ADM-CONTENT-01**: Admin muốn duyệt danh sách các nội dung (`course`, `lesson`, `test`) đang ở trạng thái chờ duyệt (`pending`).
- **ADM-CONTENT-02**: Admin muốn từ chối (`reject`) nội dung kèm lý do phản hồi cho Teacher sửa đổi.
- **ADM-CONTENT-03**: Admin muốn xem chi tiết thông tin và lịch sử yêu cầu phê duyệt nội dung.

### System Monitoring
- **ADM-AUDIT-01**: Admin muốn xem nhật ký hoạt động (`audit_logs`) trên toàn hệ thống để giám sát các hành vi nhạy cảm.

---

## 4. Acceptance Criteria (EARS)

### Ubiquitous
- **THE system SHALL** only allow users with `admin` role to access paths matching `/admin/*`.
- **THE system SHALL** log all administrative actions into `audit_logs` (thao tác đổi trạng thái user, đổi role, duyệt/từ chối nội dung, xóa user).
- **THE system SHALL** enforce RBAC based on the user's role and associated permissions.

### Event-driven
- **WHEN** Admin fetches the user list, **THE system SHALL** support filtering by role, status, and search by name/email.
- **WHEN** Admin changes a user's role, **THE system SHALL** update `users.role` and create a corresponding entry in `audit_logs`.
- **WHEN** Admin changes a user's status, **THE system SHALL** update `users.status` (và `lockedUntil` nếu khóa tạm thời), đồng thời ghi lại giá trị cũ/mới trong `audit_logs`.
- **WHEN** Teacher submits a course/lesson/test, **THE system SHALL** create an approval request with `status = "pending"` and update the content status to `pending`.
- **WHEN** Admin approves content, **THE system SHALL** set the approval request and the content status to `approved`.
- **WHEN** Admin rejects content, **THE system SHALL** set the approval request and the content status to `rejected`, lưu kèm `adminNote` của Admin.
- **WHEN** content status changes, **THE system SHALL** notify the content creator (mocked notification system / state).

### State-driven
- **WHILE** a user status is `banned` or `locked` (và thời gian khóa chưa hết hạn), **THE system SHALL** block all authentication/login attempts.
- **WHILE** content status is `pending` or `rejected`, **THE system SHALL** hide it from public courses list and Student dashboards.
- **WHILE** Admin session is active, **THE system SHALL** validate permissions on each API call / route transition.

### Unwanted (Error Handling)
- **WHERE** Admin attempts to change their own role or status, **THE system SHALL** block the action and return HTTP 403 Forbidden.
- **WHERE** Admin deletes a non-existing user, **THE system SHALL** return HTTP 404 Not Found.
- **WHERE** an invalid status transition is attempted (ví dụ: duyệt nội dung đã được approved), **THE system SHALL** return HTTP 400 Bad Request.
- **WHERE** a non-admin user attempts to access Admin APIs or routes, **THE system SHALL** return HTTP 403 Forbidden.

---

## 5. API Contracts & Mock Mappings (JSON-Server)

Vì dự án chạy frontend React và sử dụng `json-server` làm mock API, các request từ frontend service sẽ tương tác trực tiếp với các collection tương ứng trong `db.json`.

| Logical API Contract | JSON-Server Mapping | Method | Description |
|---|---|---|---|
| `GET /api/v1/admin/users` | `GET /users` | GET | Lấy danh sách users kèm query params (e.g. `role=...`, `status=...`, `q=...` để search) |
| `PATCH /api/v1/admin/users/:id/role` | `PATCH /users/:id` | PATCH | Cập nhật thuộc tính `{ "role": newRole }` |
| `PATCH /api/v1/admin/users/:id/status` | `PATCH /users/:id` | PATCH | Cập nhật thuộc tính `{ "status": newStatus, "lockedUntil": ... }` |
| `DELETE /api/v1/admin/users/:id` | `DELETE /users/:id` | DELETE | Xóa tài khoản người dùng khỏi mock database |
| `GET /api/v1/admin/approvals?status=pending` | `GET /approvalRequests?status=pending` | GET | Lấy danh sách yêu cầu phê duyệt theo trạng thái |
| `PATCH /api/v1/admin/approvals/:type/:id/approve` | **Multi-step client call**:<br>1. `PATCH /approvalRequests/:reqId` `{ "status": "approved", "reviewedAt": "...", "reviewedBy": "..." }`<br>2. `PATCH /courses/:id` (hoặc `/lessons/:id`, `/tests/:id`) `{ "status": "approved" }` | PATCH | Phê duyệt nội dung và kích hoạt trạng thái công khai của nội dung |
| `PATCH /api/v1/admin/approvals/:type/:id/reject` | **Multi-step client call**:<br>1. `PATCH /approvalRequests/:reqId` `{ "status": "rejected", "adminNote": "...", "reviewedAt": "...", "reviewedBy": "..." }`<br>2. `PATCH /courses/:id` (hoặc `/lessons/:id`, `/tests/:id`) `{ "status": "rejected" }` | PATCH | Từ chối phê duyệt nội dung và lưu lý do từ chối |
| `GET /api/v1/admin/audit-logs` | `GET /audit_logs` | GET | Lấy danh sách audit logs |

---

## 6. Data Models (Đồng bộ với `db.json`)

### 6.1 `approvalRequests`

Dùng để quản lý vòng đời kiểm duyệt nội dung của Teacher. Model này đồng bộ trực tiếp với dữ liệu thực tế đang có trong `db.json`:

```json
{
  "id": "approval-001",
  "targetType": "course",         // "course" | "lesson" | "test"
  "targetId": "course-006",
  "teacherId": "u-teacher-001",    // Teacher yêu cầu
  "status": "pending",            // "pending" | "approved" | "rejected"
  "message": "Please review this grammar course.",  // Lời nhắn từ Teacher
  "adminNote": "",                // Phản hồi từ Admin khi reject
  "createdAt": "2026-06-06T09:00:00Z",
  "reviewedAt": null,             // ISO Datetime hoặc null
  "reviewedBy": null              // ID của Admin duyệt hoặc null
}
```

### 6.2 `audit_logs`

Nhật ký ghi nhận mọi hành vi quản trị hệ thống:

```json
{
  "id": "log-001",
  "actorId": "u-admin-001",
  "action": "CHANGE_USER_STATUS", // "CHANGE_USER_ROLE" | "CHANGE_USER_STATUS" | "DELETE_USER" | "APPROVE_CONTENT" | "REJECT_CONTENT"
  "targetType": "user",           // "user" | "course" | "lesson" | "test"
  "targetId": "u-student-003",
  "oldValue": { "status": "active" },
  "newValue": { "status": "locked" },
  "createdAt": "2026-06-09T08:00:00Z"
}
```

### 6.3 `users` (Phần mở rộng quản trị)

Thông tin mở rộng phục vụ cho tính năng khóa/bảo mật tài khoản:

```json
{
  "id": "u-student-001",
  "fullName": "Nguyen Tien Dat",
  "name": "Nguyen Tien Dat",
  "email": "ntiendat2108@gmail.com",
  "role": "student",
  "status": "active",             // "active" | "locked" | "banned"
  "lockedUntil": null,            // ISO Datetime hoặc null
  "failedLoginAttempts": 0,       // Số lần đăng nhập sai
  "createdAt": "2026-06-01T08:00:00Z"
}
```

---

## 7. Functional Scope

### 7.1 User Management Page (`/admin/users`)
- **Giao diện**: Responsive dạng bảng, hiển thị chi tiết tên, email, role, status và ngày tạo.
- **Bộ lọc & Tìm kiếm**: Lọc nhanh theo Role, Status và ô tìm kiếm real-time theo tên/email.
- **Thao tác nhanh**:
  - Đổi vai trò (`role`) qua dropdown với xác nhận.
  - Khóa tài khoản tạm thời (chọn thời gian khóa: 1 ngày, 7 ngày, v.v.) hoặc cấm vĩnh viễn (`banned`).
  - Xóa tài khoản (hiển thị popup xác nhận an toàn trước khi xóa).

### 7.2 Content Approval Page (`/admin/dashboard`)
- **Hàng đợi kiểm duyệt (Pending Queue)**: Tab hiển thị riêng các nội dung Course, Lesson, Test đang chờ duyệt.
- **Thao tác**:
  - Click xem chi tiết nội dung (dưới dạng popup preview đầy đủ bài học/khóa học/test).
  - Nút **Approve** (phê duyệt nhanh).
  - Nút **Reject** (yêu cầu nhập lý do từ chối trước khi lưu).
- **Lịch sử phê duyệt**: Tab xem lại các nội dung đã duyệt/từ chối trước đó.

### 7.3 Audit Logs Viewer (Tích hợp trong Admin Dashboard)
- Hiển thị danh sách log có phân trang.
- Hỗ trợ bộ lọc theo Admin tác động (`actorId`), hành động (`action`) hoặc đối tượng (`targetType`).

---

## 8. Non-Functional Requirements & Design system

- **Giao diện và Styling**: Tuân thủ tuyệt đối `DESIGN.md` (Coinbase theme):
  - Canvas màu trắng, spacing 24px/32px, khoảng cách section 96px.
  - Các nút/tag dùng border-radius pill (`{rounded.pill}` - 100px).
  - Card hiển thị dùng `{rounded.xl}` (24px).
  - Không viết CSS màu sắc tùy tiện, dùng đúng bảng màu hệ thống (Coinbase Blue `#0052ff` cho CTA chính).
- **Bảo mật**: Enforce chặt chẽ điều kiện bảo vệ route trong `ProtectedRoute.jsx`. Mọi request gọi dữ liệu cần kiểm tra local storage session.
- **Hiệu năng & UX**: Thêm trạng thái loading skeleton và thông báo trống (Empty State) trực quan khi không có dữ liệu.

---

## 9. Error Handling Matrix

| Mã lỗi | HTTP | Thông điệp hiển thị | Mô tả |
|---|---|---|---|
| `ADM_001` | 403 | Unauthorized admin access | Người dùng không có vai trò Admin cố gắng truy cập trang quản trị |
| `ADM_002` | 404 | User not found | Thao tác trên đối tượng user không tồn tại hoặc đã bị xóa |
| `ADM_003` | 400 | Invalid role transition | Admin tự thay đổi role của chính mình |
| `ADM_004` | 423 | Account locked | Đăng nhập thất bại do tài khoản bị locked/banned |
| `ADM_005` | 400 | Invalid approval action | Duyệt hoặc từ chối yêu cầu kiểm duyệt không hợp lệ |

---

## 10. Edge Cases

- **Tự tác động lên bản thân**: Ngăn chặn Admin tự khóa, hạ cấp vai trò hoặc xóa tài khoản của chính mình thông qua validation ở client.
- **Tranh chấp duyệt đồng thời**: Nếu có nhiều Admin cùng mở duyệt một nội dung, trạng thái được cập nhật theo Admin thao tác trước, Admin sau sẽ nhận thông báo nội dung đã được xử lý (idempotent).
- **Giữ nhật ký hệ thống**: Khi xóa một user, các bản ghi `audit_logs` liên quan đến user đó vẫn phải được giữ nguyên để lưu vết.
