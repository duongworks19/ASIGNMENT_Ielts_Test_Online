# TASKS.md — Feature: Admin Management & Approval (feature-admin-management-approval)

**Dựa trên:** `SPEC.md`, `PLAN.md`, `AGENTS.md`, `CLAUDE.md` và `constitution.md`.
**Quy định:** Mỗi task ≤ 4 giờ, implement độc lập, format bảng Markdown chi tiết tối đa.

## Phase 1: Mock Database Setup (`db.json`)
*Luật (constitution): Sử dụng JSON-Server làm mock API. Dữ liệu là JSON thuần.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T001** | Khởi tạo cấu trúc `audit_logs` | `db.json` | 1 | None | SPEC §6.2 | Thêm collection `"audit_logs": [...]` với ≥ 3 bản ghi mẫu (CHANGE_USER_STATUS, APPROVE_CONTENT). Đúng schema: `id`, `actorId`, `action`, `targetType`, `targetId`, `oldValue`, `newValue`, `createdAt`. |
| **T002** | Mở rộng schema `users` | `db.json` | 1 | T001 | SPEC §6.3 | Thêm `lockedUntil: null` và `failedLoginAttempts: 0` cho mọi user hiện có. Đảm bảo có ít nhất 1 user có `status: "locked"` để test. |

## Phase 2: Core Services & Utilities
*Luật: Dùng Axios để tương tác với JSON-Server. Error throw rõ ràng. Tự động ghi log sau mỗi action.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T003** | Service: Audit Logs | `src/services/adminService.js` | 1.5 | T001 | PLAN §2.1 | Viết hàm `getAuditLogs(filters)` và helper `createAuditLog(actorId, action, targetType, targetId, oldValue, newValue)` gọi `POST /audit_logs`. |
| **T004** | Service: User Management | `src/services/adminService.js` | 2.5 | T002, T003 | PLAN §2.1 | Viết hàm `getUsers`, `updateUserRole`, `updateUserStatus`, `deleteUser`. Các hàm mutate phải tự động gọi `createAuditLog()` sau khi thành công. |
| **T005** | Service: Content Approval | `src/services/adminService.js` | 2.5 | T003 | PLAN §2.1 | Viết hàm `getApprovalRequests`, `approveRequest`, `rejectRequest`. Xử lý gọi tuần tự (PATCH request -> PATCH target -> POST log) kèm rollback nếu lỗi. |

## Phase 3: Route Protection & Middleware
*Luật: Bảo vệ an toàn các route `/admin/*`. Ngăn chặn truy cập trái phép bằng logic Frontend.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T006** | Middleware: Admin Auth Check | `src/services/adminService.js` | 1.5 | T004, T005 | State-driven | Tích hợp kiểm tra phiên đăng nhập: mọi hàm API phải lấy `adminId` từ localStorage trước. Throw error nếu role không phải là `admin`. |
| **T007** | Routing: Admin Protected Routes | `src/routes/AppRoutes.jsx` | 1.5 | None | Ubiquitous | Bọc route `/admin/dashboard` và `/admin/users` bằng `<ProtectedRoute allowedRoles={['admin']}>`. Redirect `/403` nếu không có quyền. |

## Phase 4: Frontend Implementation (React Pages & Components)
*Luật: Component dùng PascalCase. Sử dụng Bootstrap 5. Styling bám sát DESIGN.md.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T008** | Layout: AdminLayout | `src/layouts/AdminLayout.jsx`<br>`src/layouts/AdminLayout.css` | 2 | T007 | PLAN §2.2 | Sidebar cố định trái, nội dung phải. Link menu highlight xanh Coinbase. `<Outlet />` hoạt động đúng. |
| **T009** | Component: Shared UI | `src/components/common/ConfirmModal.jsx`<br>`src/components/common/StatusBadge.jsx` | 2 | None | PLAN §2.2 | Modal xác nhận dùng chung (hỗ trợ variant warning/danger). Badge trạng thái chuẩn màu hệ thống (pill). |
| **T010** | Component: Approval Modal | `src/components/feature/admin/ApprovalDetailModal.jsx` | 2.5 | T005 | ADM-CONTENT | Modal xem chi tiết nội dung (course/lesson). Có nút Approve/Reject. Handle state loading và báo lỗi. |
| **T011** | Page: User Management | `src/pages/admin/UserManagement.jsx`<br>`src/pages/admin/UserManagement.css` | 3.5 | T004, T008, T009 | ADM-USER | Bảng danh sách user có phân trang/lọc/tìm kiếm. Có action dropdown (Đổi role, Khóa, Xóa). Khóa account phải chặn edit dòng của chính admin đang login. |
| **T012** | Page: Admin Dashboard (Stats) | `src/pages/admin/AdminDashboard.jsx` | 2 | T004, T005, T008 | ADM-CONTENT | Tab Overview hiển thị 4 stat cards tổng quan: Tổng Users, Khóa học, Nội dung Pending, Audit logs. |
| **T013** | Page: Admin Dashboard (Queue) | `src/pages/admin/AdminDashboard.jsx` | 2.5 | T005, T010 | ADM-CONTENT | Tab Approvals hiển thị hàng đợi nội dung cần duyệt. Nhấn Review mở Approval Modal. |
| **T014** | Page: Admin Dashboard (Logs) | `src/pages/admin/AdminDashboard.jsx` | 2 | T003, T009 | ADM-AUDIT | Tab Audit Logs hiển thị danh sách nhật ký hành động phân trang, lọc theo action/targetType. |

## Phase 5: Testing & Quality Assurance
*Luật: Đảm bảo mọi tính năng frontend hoạt động mượt mà với mock data.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T015** | UI/UX Verification | Không tạo file mới | 1.5 | T011, T014 | NFR - UI | Kiểm tra độ responsive của AdminLayout trên mobile. Test empty states (danh sách rỗng) có hiển thị đẹp không. |
| **T016** | Integration Flow Test | Không tạo file mới | 2 | T006, T013 | Event-driven | Start JSON-Server. Test luồng đầy đủ từ Login(Admin) -> Đổi role User -> Check toast thông báo -> Check Audit logs xem có cập nhật real-time không. |
| **T017** | Security Edge Cases | Không tạo file mới | 1 | T011 | Unwanted | Login bằng Student, thử gõ URL `/admin/dashboard` để verify redirect chặn đúng. Admin thử tự xóa tài khoản chính mình qua UI để verify disabled button. |
| **T018** | Build & Changelog Update | `.sdd/agents_changelog.md` | 0.5 | T015-T017 | PLAN §7 | Chạy `npm run build` thành công. Cập nhật `agents_changelog.md` đánh dấu các công việc hoàn tất. |
