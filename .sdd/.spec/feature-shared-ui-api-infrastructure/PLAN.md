# Implementation Plan: Shared UI Components, API Services & Project Infrastructure (feature-shared-ui-api-infrastructure)

**Status:** DRAFT — Awaiting Tech Lead Review
**Linked Spec:** `.sdd/.spec/feature-shared-ui-api-infrastructure/SPEC.md` (APPROVED, Risk: Medium-High)
**Sprint:** Sprint 1 — Foundation
**Date:** 2026-06-12

---

## 1. ARCHITECTURAL APPROACH

- **Frontend First:** Dự án môn FER202 ưu tiên 70% effort cho Frontend (ReactJS/CRA) và 30% cho Mock Backend (JSON-Server).
- **UI Framework:** Bắt buộc sử dụng Bootstrap 5 & React-Bootstrap. Design bám sát `DESIGN.md`. Tuyệt đối không dùng Tailwind.
- **Routing Strategy:** Client-side routing bằng React Router DOM. Chia layout theo 4 actor chính: Guest (Public), Student, Teacher, Admin.
- **State Management:** Sử dụng Redux Toolkit chỉ cho Global State (chủ yếu là `auth`, `user`). Các UI state (sidebar, modal, toast) sử dụng Local State (useState) hoặc Context API để tránh over-engineering.
- **API Abstraction:** Tách biệt logic gọi API khỏi Component. Component gọi các hàm từ `src/services/*` (Axios wrapper), giúp dễ dàng thay đổi endpoint hoặc handle error chung.
- **Mock Database:** Toàn bộ data nằm trong `db.json`. JSON-Server đóng vai trò REST API. Không có Database thật.

---

## 2. COMPONENTS & INTERFACE

### 2.1 `HttpClient` — `src/services/httpClient.js`

> Wrapper cho Axios. Xử lý Interceptors và Base URL.

| Function | Input | Output | Ghi chú |
|----------|-------|--------|---------|
| `axiosInstance` | Config | `AxiosInstance` | Cài đặt `baseURL: process.env.REACT_APP_API_BASE_URL` |
| `requestInterceptor` | `config` | `config` | Tự động đính kèm mock token (nếu có) từ LocalStorage |
| `responseInterceptor` | `response` \| `error` | `response.data` \| `Promise.reject(normalizedError)` | Chuẩn hóa lỗi API để các service không phải lặp lại try-catch |

### 2.2 `API Services` — `src/services/*.service.js`

> Module base API calls.

| Module | Chức năng chính | Ghi chú |
|--------|-----------------|---------|
| `authService.js` | Login, Register, Verify, Forgot/Reset Password | Trả về data / token mock |
| `userService.js` | Quản lý profile, CRUD users (Admin) | |
| `courseService.js` | Get courses, Filter by skill/level, CRUD course | |
| `lessonService.js` | Quản lý lessons theo course | |
| `lessonProgressService.js` | Tracking tiến độ học lesson của Student | Collection `lessonProgress` trong `db.json` |
| `testService.js` | Quản lý tests | |
| `enrollmentService.js` | Đăng ký khóa học, tracking enrollments | |
| `paymentService.js` | Mock payment & transactions | |

### 2.3 `Layout Components` — `src/layouts/`

| Component | Props | Trách nhiệm |
|-----------|-------|-------------|
| `PublicLayout` | `children` | Bao gồm Navbar, Footer. Dùng cho Guest routes |
| `StudentLayout` | `children` | Bao gồm Sidebar (Student), Navbar, Footer. |
| `TeacherLayout` | `children` | Bao gồm Sidebar (Teacher), Navbar, Footer. |
| `AdminLayout` | `children` | Bao gồm Sidebar (Admin), Navbar. |

### 2.4 `Shared UI Components` — `src/components/common/`

> Tái sử dụng ở nhiều nơi, bám sát Bootstrap 5.

| Component | Props chính | Trách nhiệm |
|-----------|-------------|-------------|
| `Button` | `variant`, `size`, `isLoading`, `onClick` | Nút bấm chuẩn hóa, hỗ trợ loading spinner |
| `Input` | `label`, `error`, `type`, `...rest` | Input form hỗ trợ validation error text |
| `Modal` | `show`, `onHide`, `title`, `children` | Wrapper cho Bootstrap Modal |
| `Pagination`| `currentPage`, `totalPages`, `onPageChange`| Component phân trang |
| `StatCard` | `title`, `value`, `icon`, `color` | Card thống kê cho Dashboard (Student/Teacher/Admin) |
| `Spinner` | `size`, `variant` | Loading indicator (thường bọc màn hình hoặc nút) |
| `Toast` | `message`, `type` (success/error) | Thông báo feedback cho user (có thể dùng lib ngoài như react-toastify) |
| `EmptyState`| `icon`, `title`, `message`, `action` | Hiển thị khi danh sách rỗng (No data) |

### 2.5 `Redux Store` — `src/store/`

| Slice | State | Reducers | Ghi chú |
|-------|-------|----------|---------|
| `authSlice` | `{ user: null, token: null, role: null }` | `login`, `logout`, `setCredentials` | Sync với LocalStorage để giữ session |

---

## 3. DATA FLOW (Luồng dữ liệu)

### Flow 1: Khởi tạo App & Phục hồi Session
```
App Start
  → Redux store init
  → Kiểm tra LocalStorage (tìm mock token/user)
  → Nếu có: Dispatch action khôi phục state vào Redux `authSlice`
  → React Router render Layout tương ứng với Role
```

### Flow 2: Gọi API & Xử lý Lỗi (Ví dụ: Get Courses)
```
Component (CourseListPage) gọi fetch()
  → gọi `courseService.getCourses()`
      → gọi `httpClient.get('/courses')`
          ├─ [Interceptor] Gắn headers
          ├─ Gửi request tới JSON-Server (http://localhost:3001)
          ├─ [Success 200] Interceptor trả về `response.data`
          └─ [Error 500] Interceptor ném lỗi chuẩn hóa ({ message: "Máy chủ..." })
  → Component nhận data: Cập nhật state `courses` / Tắt `isLoading`
  → (Hoặc) Nhận lỗi: Hiển thị error message bằng Toast
```

---

## 4. IMPLEMENTATION DEPENDENCIES

**Thứ tự triển khai (phụ thuộc thứ tự):**

| Bước | Nội dung | Phụ thuộc |
|------|----------|-----------|
| 1 | Kiểm tra dependencies đã cài, bổ sung nếu thiếu (React Router, Axios, Bootstrap, Redux Toolkit...) | _(Dự án CRA đã được khởi tạo sẵn)_ |
| 2 | Kiểm tra và chuẩn hóa folder structure, dọn dẹp file/code không cần thiết | Bước 1 |
| 3 | Chuẩn hóa `db.json`: Thêm bảng còn thiếu, đảm bảo seed data đủ theo SPEC §6 | Bước 1 |
| 4 | Xây dựng `httpClient.js` (Axios Interceptors) | Bước 2 |
| 5 | Tạo bộ `API Services` (authService, courseService...) | Bước 4 |
| 6 | Cấu hình Redux Store (`authSlice`) | Bước 2 |
| 7 | Xây dựng các UI Components cơ bản (Button, Input, Spinner, Toast) | Bước 2 |
| 8 | Xây dựng Layouts (Navbar, Sidebar, Footer, PublicLayout, StudentLayout...) | Bước 7 |
| 9 | Thiết lập AppRoutes.jsx với các luồng định tuyến (Guest, Student, Admin) và Route Guard | Bước 6, 8 |
| 10 | Kiểm tra tổng thể luồng (Mock Login -> Chuyển Layout) | Bước 9 |

**External Dependencies:**

| Package | Mục đích |
|---------|----------|
| `react-router-dom` | Client-side routing |
| `axios` | HTTP Client gọi API |
| `bootstrap` & `react-bootstrap` | UI Framework bắt buộc |
| `@reduxjs/toolkit` & `react-redux` | Global state management |
| `json-server` | Mock REST API Backend |
| `react-hook-form` | (Tùy chọn) Validation form |
| `react-toastify` hoặc `react-hot-toast` | (Tùy chọn) Hiển thị thông báo Toast |

---

## 5. TECHNICAL RISKS & MITIGATION

| # | Risk | Xác suất | Impact | Mitigation |
|---|------|----------|--------|------------|
| 1 | **Xung đột UI Framework** (Ví dụ ai đó tự cài Tailwind) | High | Medium | Quán triệt tuân thủ `AGENTS.md`. Linter/Reviewer reject PR nếu có Tailwind class. |
| 2 | **JSON-Server chậm/crash** | Low | High | Bổ sung EmptyState/Error Boundary phía frontend. Code ko được crash app nếu API sập. |
| 3 | **Code lặp lại khi gọi API** | Medium | Medium | Force dùng Axios instance (`httpClient.js`). Cấm dùng `fetch()` lẻ tẻ trong component. |
| 4 | **Sai lệch db.json config** khi dev đồng thời | High | High | Thống nhất 1 người update schema gốc hoặc phân luồng update rõ ràng qua commit. |

---

## 6. OPEN QUESTIONS

| # | Câu hỏi | Owner | Priority | Status |
|---|---------|-------|----------|--------|
| **Q1** | **[UI Framework]** Dùng Bootstrap 5/React-Bootstrap (đã chốt). Các library phụ (Toast, Icons) dùng loại nào? (Ví dụ: react-toastify, bootstrap-icons) | Team | HIGH | **RESOLVED** (Dùng react-toastify và bootstrap-icons) |
| **Q2** | **[Form Validation]** Dùng React Hook Form hay controlled component thường? | Team | Medium | Open |
| **Q3** | **[Deploy Environment]** Deploy frontend lên Vercel và JSON-Server lên Render có cần custom script build không? | Tech Lead | Medium | Open |

---

## 7. DEFINITION OF DONE

Feature `feature-shared-ui-api-infrastructure` được coi là **DONE** khi toàn bộ các điều kiện sau được thỏa mãn:

- [ ] Folder structure được tạo chuẩn xác (`src/pages`, `src/components`, `src/services`, `src/layouts`...).
- [ ] React Router setup xong, 4 luồng layout (Public, Student, Teacher, Admin) chuyển hướng đúng.
- [ ] Redux store khởi tạo thành công với `authSlice`.
- [ ] `httpClient.js` hoạt động, gửi kèm mock token và hứng được lỗi.
- [ ] Các module services (`authService`, `courseService`...) đã define function khung.
- [ ] Shared Components cơ bản (Button, Input, Modal, Spinner...) được tạo và hiển thị đúng Bootstrap style.
- [ ] `db.json` chứa đủ bảng (collections) yêu cầu và có ít nhất 1 seed data cho mỗi bảng.
- [ ] Lệnh `npm start` (React) và lệnh chạy JSON-Server hoạt động ổn định trên local.
- [ ] File `agents_changelog.md` được update sau khi merge code.
