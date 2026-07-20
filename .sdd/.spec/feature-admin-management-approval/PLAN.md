# PLAN.md — Feature: Admin Management & Approval (feature-admin-management-approval)

**Status:** DRAFT — Awaiting Tech Lead Review
**Linked Spec:** `.sdd/.spec/feature-admin-management-approval/SPEC.md` (APPROVED, Risk: High)
**Sprint:** Sprint 2 — System Governance & Content Control
**Date:** 2026-06-09

---

## 1. ARCHITECTURAL APPROACH

- **Layered Frontend Architecture:** Tuân thủ luồng phân tầng rõ ràng: Router (`AppRoutes.jsx`) → Pages (`AdminDashboard.jsx`, `UserManagement.jsx`) → Components (`ApprovalDetailModal.jsx`, `ConfirmModal.jsx`) → Service Layer (`adminService.js`) → Mock DB (`db.json` qua JSON-Server).
- **Security & Authorization (Mock RBAC):** Sử dụng `ProtectedRoute.jsx` để bảo vệ các tuyến đường `/admin/*`. Quyền hạn được kiểm tra dựa trên trạng thái `role` lưu trong `localStorage` (`ielts_auth_user`). Ngăn chặn người dùng không phải admin truy cập và tự động chuyển hướng về `/403`.
- **State Management & Data Fetching:** Sử dụng Local State kết hợp với `Axios` để tương tác trực tiếp với mock server. Do JSON-Server không hỗ trợ transactions, các logic ghi đè đa bước (ví dụ: cập nhật trạng thái course + cập nhật trạng thái approval request) sẽ được điều phối tuần tự ở Service Layer.
- **Client-Driven Audit Logging:** Mọi hành động nhạy cảm của Admin sẽ được ghi nhận tự động bằng cách gửi yêu cầu `POST /audit_logs` từ Frontend ngay sau khi thao tác chính (như đổi role, khóa user, approve content) hoàn tất thành công.
- **Styling & Design System:** Tuân thủ tuyệt đối `DESIGN.md` (Coinbase theme):
  - Canvas nền trắng tinh khiết (`#ffffff`), sử dụng màu xanh Coinbase Blue (`#0052ff`) cho các CTA chính.
  - Bo góc pill (`{rounded.pill}` - 100px) cho nút bấm và tag trạng thái.
  - Card hiển thị dùng bo góc `{rounded.xl}` (24px) với viền mờ `1px {colors.hairline}`.

---

## 2. COMPONENTS & INTERFACE

### 2.1 `AdminService` — `src/services/adminService.js`

> Service Layer chịu trách nhiệm tương tác trực tiếp với JSON-Server.

| Function | Input | Output | Ghi chú |
|----------|-------|--------|---------|
| `getUsers(filters)` | `{ role, status, q }` | `Promise<User[]>` | Sử dụng các API của JSON-Server như `_like` hoặc `q` để tìm kiếm và lọc |
| `updateUserRole(userId, newRole)` | `userId: string`, `newRole: string` | `Promise<User>` | Gọi `PATCH /users/:id`. Đồng thời tự động tạo audit log `CHANGE_USER_ROLE` |
| `updateUserStatus(userId, status, lockedUntil)` | `userId: string`, `status: string`, `lockedUntil: string\|null` | `Promise<User>` | Gọi `PATCH /users/:id`. Đồng thời tự động tạo audit log `CHANGE_USER_STATUS` |
| `deleteUser(userId)` | `userId: string` | `Promise<void>` | Gọi `DELETE /users/:id`. Đồng thời tự động tạo audit log `DELETE_USER` |
| `getApprovalRequests(status)` | `status?: string` | `Promise<ApprovalRequest[]>` | Gọi `GET /approvalRequests`. Lọc theo trạng thái phê duyệt |
| `approveRequest(reqId, targetType, targetId, adminId)` | `reqId: string`, `targetType: string`, `targetId: string`, `adminId: string` | `Promise<void>` | Gọi tuần tự:<br>1. `PATCH /approvalRequests/:reqId` trạng thái `approved`<br>2. `PATCH /:targetType/:targetId` trạng thái `approved`<br>3. `POST /audit_logs` |
| `rejectRequest(reqId, targetType, targetId, adminId, reason)` | `reqId: string`, `targetType: string`, `targetId: string`, `adminId: string`, `reason: string` | `Promise<void>` | Gọi tuần tự:<br>1. `PATCH /approvalRequests/:reqId` trạng thái `rejected`, kèm `adminNote`<br>2. `PATCH /:targetType/:targetId` trạng thái `rejected`<br>3. `POST /audit_logs` |
| `getAuditLogs(filters)` | `{ actorId, action, targetType }` | `Promise<AuditLog[]>` | Gọi `GET /audit_logs?_sort=createdAt&_order=desc` kèm theo các filter tương ứng |
| `createAuditLog(actorId, action, targetType, targetId, oldValue, newValue)` | `{ actorId, action, targetType, targetId, oldValue, newValue }` | `Promise<AuditLog>` | Helper nội bộ để ghi nhận log hành động của Admin |

---

### 2.2 Frontend Pages & Components

| Component / File | Props / State | Trách nhiệm |
|------------------|---------------|-------------|
| `UserManagement` (`src/pages/admin/UserManagement.jsx`) | **State:** `users`, `filters`, `loading`, `error`, `selectedUser` (modal) | Trang quản lý danh sách user. Hiển thị dạng bảng, hỗ trợ tìm kiếm, lọc theo role/status, nút Action để mở Modal đổi role, khóa hoặc xóa user. |
| `AdminDashboard` (`src/pages/admin/AdminDashboard.jsx`) | **State:** `approvals`, `auditLogs`, `stats`, `activeTab` | Dashboard chính của Admin. Chứa 3 Tabs:<br>1. **Pending Queue**: Duyệt danh sách bài gửi.<br>2. **Audit Logs**: Xem lịch sử hoạt động.<br>3. **System Overview**: Thống kê số lượng user, course, test. |
| `ApprovalDetailModal` (`src/components/feature/admin/ApprovalDetailModal.jsx`) | `{ request, isOpen, onClose, onActionSuccess }` | Popup xem trước chi tiết nội dung cần kiểm duyệt (hiển thị syllabus khóa học, nội dung bài học, hoặc danh sách câu hỏi test). Cung cấp nút Approve và Reject (mở input lý do). |
| `ConfirmModal` (`src/components/common/ConfirmModal.jsx`) | `{ isOpen, title, message, onConfirm, onClose, variant }` | Modal xác nhận dùng chung cho các hành động nguy hiểm như xóa tài khoản, khóa tài khoản hoặc thay đổi vai trò Admin. |
| `AdminLayout` (`src/layouts/AdminLayout.jsx`) | _(none)_ | Layout quản trị bao gồm Sidebar bên trái (Dashboard, Users, Logout) và khu vực nội dung bên phải, đồng bộ thiết kế với `DESIGN.md`. |

---

## 3. DATA FLOW (Luồng dữ liệu)

### Flow 1: Tìm kiếm & Lọc danh sách Users

```
Admin  Truy cập /admin/users
  → Render UserManagement component
  → Gọi useEffect() kích hoạt adminService.getUsers(filters)
      ├─ Axios GET /users?role={role}&status={status}&q={search}
      └─ Mock Server (JSON-Server) lọc dữ liệu trong db.json
  ← Trả về User[]
  → Hiển thị Spinner → Cập nhật state `users` → Render bảng người dùng
```

---

### Flow 2: Đổi Trạng thái / Vai trò người dùng & Ghi Audit Log

```
Admin click "Tạm khóa" user-002  →  Mở ConfirmModal  →  Admin Click Xác Nhận
  → Gọi adminService.updateUserStatus("u-student-003", "locked", "2026-06-16T15:00:00Z")
      ├─ 1. Lưu lại thông tin cũ: oldValue = { status: "active" }
      ├─ 2. Axios PATCH /users/u-student-003  { status: "locked", lockedUntil: "..." }
      ├─ 3. Tạo record log mới:
      │      Axios POST /audit_logs  { actorId: "u-admin-001", action: "CHANGE_USER_STATUS", targetType: "user", targetId: "u-student-003", oldValue, newValue: { status: "locked" } }
      └─ Nhận phản hồi thành công từ JSON-Server
  ← Trigger onActionSuccess() → Hiển thị Toast thông báo thành công
  → Tải lại danh sách Users và hiển thị trạng thái mới
```

---

### Flow 3: Quy trình Phê duyệt nội dung (Content Approval)

```
Admin click "Review" course-006  →  Mở ApprovalDetailModal (hiển thị thông tin Course)
Admin click "Approve"
  → Gọi adminService.approveRequest("approval-001", "courses", "course-006", "u-admin-001")
      ├─ 1. Cập nhật trạng thái Request:
      │      Axios PATCH /approvalRequests/approval-001  { status: "approved", reviewedAt, reviewedBy }
      ├─ 2. Kích hoạt trạng thái công khai của Khóa học:
      │      Axios PATCH /courses/course-006  { status: "approved" }
      ├─ 3. Ghi audit log:
      │      Axios POST /audit_logs  { actorId: "u-admin-001", action: "APPROVE_CONTENT", targetType: "course", targetId: "course-006" }
      └─ Đợi tất cả Axios requests hoàn thành thành công
  ← Trả về kết quả thành công cho UI
  → Đóng Modal → Hiển thị Toast thành công → Tải lại hàng đợi (Pending Queue)
```

---

### Flow 4: Bảo vệ Route & RBAC (Route Protection)

```
User truy cập /admin/dashboard
  → Router kiểm tra ProtectedRoute (allowedRoles: ['admin'])
  → Đọc thông tin phiên đăng nhập hiện tại từ localStorage.getItem('ielts_auth_user')
      ├─ [Không có user]         → Chuyển hướng sang /login
      ├─ [Role !== 'admin']       → Chuyển hướng sang /403 (ForbiddenPage)
      └─ [Role === 'admin']       → Cho phép render <AdminLayout />
```

---

## 4. IMPLEMENTATION DEPENDENCIES

**Thứ tự các bước thực hiện:**

| Bước | Nội dung công việc | File ảnh hưởng |
|------|--------------------|----------------|
| 1 | Bổ sung các trường mở rộng và mock data kiểm duyệt vào `db.json` nếu cần | [db.json](file:///e:/Fer202_projects/FER202_Project/db.json) |
| 2 | Tạo và định nghĩa các API trong service `adminService.js` | [adminService.js](file:///e:/Fer202_projects/FER202_Project/src/services/adminService.js) |
| 3 | Tạo Layout Admin với Sidebar theo chuẩn UI Coinbase | [AdminLayout.jsx](file:///e:/Fer202_projects/FER202_Project/src/layouts/AdminLayout.jsx) |
| 4 | Xây dựng các components dùng chung: `ConfirmModal`, `ApprovalDetailModal` | `src/components/common/ConfirmModal.jsx`, `src/components/feature/admin/ApprovalDetailModal.jsx` |
| 5 | Phát triển trang Quản lý người dùng `UserManagement` (Bảng, Lọc, Tìm kiếm, Đổi role, Khóa/Mở khóa) | [UserManagement.jsx](file:///e:/Fer202_projects/FER202_Project/src/pages/admin/UserManagement.jsx) |
| 6 | Phát triển trang `AdminDashboard` (Pending queue duyệt Course/Lesson/Test, Audit Logs viewer) | [AdminDashboard.jsx](file:///e:/Fer202_projects/FER202_Project/src/pages/admin/AdminDashboard.jsx) |
| 7 | Cấu hình bảo vệ routing và tích hợp vào App chính | [AppRoutes.jsx](file:///e:/Fer202_projects/FER202_Project/src/routes/AppRoutes.jsx) |
| 8 | Kiểm thử tích hợp toàn bộ luồng điều phối dữ liệu và viết tài liệu Walkthrough | `walkthrough.md` |

---

## 5. TECHNICAL RISKS & MITIGATION

| # | Risk (Rủi ro) | Xác suất | Impact | Mitigation (Giải pháp giảm thiểu) |
|---|----------------|----------|--------|-----------------------------------|
| 1 | **Không có transaction thật trên JSON-Server**: Một trong các bước của luồng Approve/Reject bị lỗi dẫn đến dữ liệu không nhất quán (ví dụ: cập nhật request thành công nhưng không cập nhật được trạng thái Course). | Medium | High | Bọc các lệnh gọi Axios bằng `try-catch` chặt chẽ trong service layer. Nếu bước 2 thất bại, tự động thực hiện rollback ở bước 1 hoặc hiển thị thông báo lỗi chi tiết cho Admin biết để thử lại. |
| 2 | **Admin tự khóa tài khoản**: Admin tự thay đổi vai trò hoặc khóa tài khoản của chính mình gây mất quyền truy cập hệ thống. | Low | High | Thêm điều kiện kiểm tra ở frontend: vô hiệu hóa nút sửa role, khóa, hoặc xóa đối với dòng thông tin ứng với tài khoản đang đăng nhập. |
| 3 | **Styling bị lệch so với DESIGN.md**: Sử dụng các style tùy biến gây mất tính đồng bộ của Coinbase theme. | Medium | Medium | Chỉ sử dụng các class tiện ích của Bootstrap 5 và định dạng CSS kế thừa từ `DESIGN.md`. Review kỹ phần UI/UX trước khi hoàn thành. |

---

## 6. OPEN QUESTIONS

| # | Câu hỏi | Người phụ trách | Ưu tiên | Trạng thái |
|---|---------|-----------------|---------|------------|
| **Q1** | **[Soft Delete]** Thao tác xóa user nên thực hiện hard-delete (xóa hẳn khỏi `users` collection) hay soft-delete (đổi status sang `deleted`)? | Nhóm dự án | Cao | Đã chọn: **Hard-delete** phục vụ tính gọn nhẹ của đồ án demo frontend, nhưng vẫn bảo lưu log hoạt động liên quan đến user đó trong `audit_logs`. |
| **Q2** | **[Phân trang Audit Logs]** Audit Logs có cần phân trang thật ở backend JSON-Server không hay chỉ cần phân trang ở client side? | Backend Lead | Trung bình | Chọn phân trang client side cho tập dữ liệu demo dưới 100 bản ghi để giảm thiểu độ phức tạp code. |

---

## 7. DEFINITION OF DONE

Tính năng `feature-admin-management-approval` được coi là **DONE** khi:

- [ ] Phân quyền bảo vệ route hoạt động chính xác: chỉ vai trò `admin` mới vào được `/admin/dashboard` và `/admin/users`.
- [ ] Thực hiện đầy đủ tính năng CRUD và tìm kiếm/lọc trên trang `UserManagement`.
- [ ] Hàng đợi phê duyệt hiển thị chính xác các nội dung `pending`.
- [ ] Logic phê duyệt hoạt động đồng bộ: trạng thái cập nhật chính xác cho cả `approvalRequests` và target resource (`courses`, `lessons`, `tests`).
- [ ] Mọi hành động nhạy cảm của Admin đều tạo ra bản ghi log tương ứng trong `audit_logs` collection.
- [ ] Đạt chuẩn giao diện và tính responsive trên thiết bị Mobile và Desktop theo `DESIGN.md`.
- [ ] Không có lỗi runtime hoặc lỗi cú pháp Javascript, chạy `npm run build` thành công.
- [ ] Bản ghi agents_changelog được cập nhật đầy đủ.
