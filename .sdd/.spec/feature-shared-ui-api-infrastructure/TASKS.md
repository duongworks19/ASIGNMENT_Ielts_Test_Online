# Danh sách Tasks: Shared UI Components, API Services & Project Infrastructure (feature-shared-ui-api-infrastructure)

**Dựa trên:** `SPEC.md`, `PLAN.md`, `AGENTS.md`, `CLAUDE.md` và `constitution.md`.
**Quy định:** Mỗi task ≤ 4 giờ, implement độc lập, format bảng Markdown chi tiết tối đa.

---

## Phase 1: Foundation Setup & Mock Database
*Luật (constitution): Dự án CRA đã được khởi tạo sẵn. Không tạo lại từ đầu. Bổ sung dependencies còn thiếu và chuẩn hóa cấu trúc. db.json là nguồn dữ liệu duy nhất, không dùng database thật.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | SPEC/PLAN refs | Done criteria |
|---|---|---|---|---|---|---|
| **T001** | Kiểm tra & Bổ sung Dependencies | `package.json`<br>`.env`<br>`.env.example` | 1 | None | PLAN §4 | Xác nhận đủ: `react-router-dom`, `axios`, `bootstrap`, `react-bootstrap`, `@reduxjs/toolkit`, `react-redux`, `react-toastify`, `bootstrap-icons`. Thêm `json-server` vào `devDependencies`. Tạo `.env` với `REACT_APP_API_BASE_URL=http://localhost:3001`. |
| **T002** | Chuẩn hóa Folder Structure | `src/pages/guest/`<br>`src/pages/student/`<br>`src/pages/teacher/`<br>`src/pages/admin/`<br>`src/components/common/`<br>`src/components/feature/`<br>`src/layouts/`<br>`src/services/`<br>`src/store/`<br>`src/hooks/`<br>`src/utils/` | 1 | T001 | PLAN §2, AGENTS.md §4 | Tất cả folder tồn tại đúng cấu trúc. Xóa file template thừa. Giữ lại code đã implement. Chạy `npm start` không lỗi. |
| **T003** | Chuẩn hóa `db.json` — Collections & Schema | `db.json` | 2 | T001 | SPEC §6 | `db.json` chứa đủ tất cả collections: `roles`, `users`, `courses`, `lessons`, `enrollments`, `lessonProgress`, `tests`, `questions`, `testAttempts`, `flashcards`, `flashcardProgress`, `approvalRequests`, `payments`, `transactions`, `freeResources`, `skills`, `levels`, `categories`. JSON hợp lệ, chạy được với JSON-Server. |
| **T004** | Seed dữ liệu mẫu cho `db.json` | `db.json` | 2 | T003 | SPEC §6 Seed Data Minimum | Có ít nhất: 1 student, 1 teacher, 1 admin active; 4 courses đủ 4 skill IELTS (status=approved); 1 course có 3 lessons; 1 test với ≥5 câu hỏi MCQ; 1 testAttempt; ≥5 flashcards cùng category; 1 approvalRequest pending; 1 transaction mock. ID đúng convention (`u-student-001`, `course-001`...). Relationship nhất quán (teacherId, courseId, userId đều tham chiếu đúng). |

---

## Phase 2: API Layer — HTTP Client & Service Modules
*Luật: Component không được gọi Axios trực tiếp. Phải gọi qua hàm service. Không hardcode URL hay endpoint trong component hay page.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | SPEC/PLAN refs | Done criteria |
|---|---|---|---|---|---|---|
| **T005** | Xây dựng `httpClient.js` | `src/services/httpClient.js` | 1.5 | T001 | PLAN §2.1, SPEC §5 | Tạo Axios instance với `baseURL: process.env.REACT_APP_API_BASE_URL`. Header mặc định `Content-Type: application/json`. Request interceptor đính kèm mock token từ LocalStorage nếu có. Response interceptor normalize lỗi thành message rõ nghĩa theo SPEC §8 Error Matrix. |
| **T006** | Service: `authService.js` | `src/services/authService.js` | 2 | T005 | SPEC §5, PLAN §2.2 | Export các hàm: `login(email, password)` — `GET /users?email=`, `register(data)` — `POST /users`, `updateUser(id, data)` — `PATCH /users/:id`. Không có business logic trong service, chỉ gọi API. |
| **T007** | Service: `userService.js` & `courseService.js` | `src/services/userService.js`<br>`src/services/courseService.js` | 2 | T005 | SPEC §5, PLAN §2.2 | `userService`: `getUsers()`, `getUserById(id)`, `updateUser(id, data)`, `deleteUser(id)`. `courseService`: `getCourses(params)` filter theo `skill/level/teacherId`, `getCourseById(id)`, CRUD course. |
| **T008** | Service: `lessonService.js` & `lessonProgressService.js` | `src/services/lessonService.js`<br>`src/services/lessonProgressService.js` | 1.5 | T005 | SPEC §5, PLAN §2.2 | `lessonService`: CRUD lessons, `getLessonsByCourse(courseId)`. `lessonProgressService`: `getProgress(userId)`, `markComplete(data)`, `updateProgress(id, data)` — collection `lessonProgress` trong `db.json`. |
| **T009** | Service: `enrollmentService.js`, `testService.js`, `questionService.js` | `src/services/enrollmentService.js`<br>`src/services/testService.js`<br>`src/services/questionService.js` | 2 | T005 | SPEC §5, PLAN §2.2 | `enrollmentService`: `getEnrollmentsByUser(userId)`, `enroll(data)`, `updateEnrollment(id, data)`. `testService`: CRUD tests, `getTestsByCourse(courseId)`. `questionService`: `getQuestionsByTest(testId)`, CRUD questions. |
| **T010** | Service: `flashcardService.js`, `approvalService.js`, `paymentService.js`, `testAttemptService.js` | `src/services/flashcardService.js`<br>`src/services/approvalService.js`<br>`src/services/paymentService.js`<br>`src/services/testAttemptService.js` | 2 | T005 | SPEC §5, PLAN §2.2 | Mỗi service export đầy đủ hàm theo SPEC §5 API Contracts. `paymentService`: `createPayment(data)`, `getPaymentsByUser(userId)`, `getTransactions()`. `testAttemptService`: `getAttemptsByUser(userId)`, `getAttemptById(id)`, `createAttempt(data)`. |

---

## Phase 3: State Management & Route Configuration
*Luật: Chỉ dùng Redux Toolkit cho auth/user global state. UI state dùng useState hoặc Context API. Không over-engineering. Route bám đúng constitution.md.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | SPEC/PLAN refs | Done criteria |
|---|---|---|---|---|---|---|
| **T011** | Cấu hình Redux Store | `src/store/index.js` | 1 | T001 | PLAN §2.5, SPEC §4 State-driven | Khởi tạo Redux store bằng `configureStore`. Kết nối vào `src/index.js` bằng `<Provider store={store}>`. Store export đúng cách. |
| **T012** | Implement `authSlice` | `src/store/slices/authSlice.js` | 2 | T011 | PLAN §2.5, SPEC §4 State-driven | State: `{ user: null, token: null, role: null }`. Actions: `login(payload)` — lưu vào state VÀ localStorage; `logout()` — xóa state VÀ localStorage; `setCredentials(payload)` — khôi phục từ localStorage khi app khởi động lại. |
| **T013** | Khôi phục Session khi App Start | `src/App.js` | 1 | T012 | PLAN §3 Flow 1, SPEC §9 Edge Cases | Khi `App.js` mount, đọc data từ localStorage. Nếu tìm thấy user hợp lệ, dispatch `setCredentials` vào Redux store trước khi render Router. Đảm bảo refresh trang trên protected route không bị redirect sai về `/login`. |
| **T014** | Route Guard: `ProtectedRoute` | `src/routes/ProtectedRoute.jsx` | 2 | T012 | SPEC §4 Event-driven & Unwanted | Component nhận prop `requiredRole`. Đọc `auth.role` từ Redux. Nếu chưa đăng nhập: redirect `/login`. Nếu sai role: redirect `/403`. Nếu đúng: render `<Outlet />` trong layout tương ứng. |
| **T015** | Cấu hình `AppRoutes.jsx` & Trang Error | `src/routes/AppRoutes.jsx`<br>`src/pages/guest/NotFoundPage.jsx`<br>`src/pages/guest/ForbiddenPage.jsx` | 2 | T013, T014 | SPEC §4, constitution.md §4 | Đăng ký đủ tất cả route theo `constitution.md`: Guest (`/`, `/courses`, `/courses/:id`), Auth (`/login`, `/register`, `/forgot-password`), Student (`/learning/*`), Teacher (`/teacher/*`), Admin (`/admin/*`). Route `/403` và `/404` render trang lỗi. Route không tồn tại tự redirect `/404`. |

---

## Phase 4: Frontend Implementation (React + CRA)
*Luật: Components viết bằng PascalCase. Style dùng Bootstrap 5 class trước, CSS riêng chỉ để bổ sung theo DESIGN.md. Không dùng Tailwind. Mỗi component phải xử lý: loading state, empty state, error state.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | SPEC/PLAN refs | Done criteria |
|---|---|---|---|---|---|---|
| **T016** | Component: `Button`, `Input` & `Badge` | `src/components/common/Button.jsx`<br>`src/components/common/Input.jsx`<br>`src/components/common/Badge.jsx` | 2 | T002 | PLAN §2.4, SPEC §3 INFRA-03 | `Button`: props `variant`, `size`, `isLoading`, `disabled`, `onClick`. Khi `isLoading=true` hiển thị Bootstrap Spinner và vô hiệu hóa. `Input`: props `label`, `error`, `type`, `id`, `...rest`. Khi có `error` hiển thị `<div className="invalid-feedback">`. `Badge`: props `text`, `variant` (`success`/`warning`/`danger`/`info`). Dùng Bootstrap Badge. |
| **T017** | Component: `Modal`, `Spinner` & `SkeletonUI` | `src/components/common/Modal.jsx`<br>`src/components/common/Spinner.jsx`<br>`src/components/common/SkeletonUI.jsx` | 2 | T002 | PLAN §2.4, SPEC §4 Unwanted | `Modal`: wrapper cho `react-bootstrap/Modal`, props `show`, `onHide`, `title`, `children`, `footer`. Đóng được bằng nút cancel, nút X, backdrop click. `Spinner`: props `size`, `variant`, `fullPage`. Khi `fullPage=true` render overlay che toàn màn hình. `SkeletonUI`: props `lines`, `height`. Dùng CSS animation để giả lập skeleton placeholder khi đang load dữ liệu. |
| **T018** | Component: `EmptyState` & `Pagination` | `src/components/common/EmptyState.jsx`<br>`src/components/common/Pagination.jsx` | 2 | T002 | PLAN §2.4, SPEC §4 Event-driven | `EmptyState`: props `icon`, `title`, `message`, `action` (nút CTA tùy chọn). Không crash nếu thiếu props tùy chọn. `Pagination`: props `currentPage`, `totalPages`, `onPageChange`. Dùng `react-bootstrap/Pagination`. Disable Prev/Next ở trang đầu/cuối. Không render nếu `totalPages <= 1`. |
| **T019** | Component: `StatCard` & Toast Helper | `src/components/common/StatCard.jsx`<br>`src/utils/toast.js` | 1.5 | T002 | PLAN §2.4 | `StatCard`: props `title`, `value`, `icon` (bootstrap-icon class), `color`. Dùng Bootstrap Card. `toast.js`: export `toastSuccess(msg)`, `toastError(msg)`, `toastWarning(msg)` bao bọc `react-toastify`. Thêm `<ToastContainer>` vào `App.js`. |
| **T020** | Component: Navbar | `src/components/feature/Navbar.jsx` | 2 | T016, T012 | PLAN §2.3, SPEC §3 INFRA-02 | Hiển thị logo và link điều hướng chính. Nếu chưa đăng nhập: nút Login/Register. Nếu đã đăng nhập: tên user, role badge và nút Logout (gọi Redux `logout()` action). Responsive mobile bằng Bootstrap Navbar Toggler. |
| **T021** | Component: Sidebar & Footer | `src/components/feature/Sidebar.jsx`<br>`src/components/feature/Footer.jsx` | 2 | T016, T012 | PLAN §2.3 | `Sidebar`: menu items khác nhau theo role (student/teacher/admin) lấy từ Redux. Đánh dấu active link theo route hiện tại dùng `NavLink`. Responsive (collapse trên mobile). `Footer`: hiển thị copyright và tên dự án. |
| **T022** | Layout: `PublicLayout` & `StudentLayout` | `src/layouts/PublicLayout.jsx`<br>`src/layouts/StudentLayout.jsx` | 1.5 | T020, T021 | PLAN §2.3, SPEC §4 Event-driven | `PublicLayout`: Navbar + `<main>{children}</main>` + Footer. Dùng cho Guest routes. `StudentLayout`: Navbar + Sidebar (Student menu) + `<main>{children}</main>` + Footer. |

| **T023** | Layout: `TeacherLayout` & `AdminLayout` | `src/layouts/TeacherLayout.jsx`<br>`src/layouts/AdminLayout.jsx` | 1 | T020, T021 | PLAN §2.3, SPEC §4 Event-driven | `TeacherLayout`: Navbar + Sidebar (Teacher menu) + `<main>{children}</main>` + Footer. `AdminLayout`: Navbar + Sidebar (Admin menu) + `<main>{children}</main>`. Admin không có Footer. |

---

## Phase 5: Testing & Dọn dẹp
*Luật: Test thủ công bắt buộc theo Demo Checklist trong SPEC §11. Không có console.log hay hardcode trong code final. Coverage ≥ 70% cho shared components và services.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | SPEC/PLAN refs | Done criteria |
|---|---|---|---|---|---|---|
| **T024** | Manual Test: App Start & JSON-Server | — | 1 | T001 — T023 | SPEC §11 Manual Demo Checklist | Chạy `npm start` (port 3000) và JSON-Server (port 3001) đồng thời không lỗi. App load được trang Home. API call trả dữ liệu từ `db.json`. Không có lỗi console khi mở DevTools. |
| **T025** | Manual Test: Login Flow & Layout Switch | — | 1 | T024 | SPEC §11 Manual Demo Checklist | Đăng nhập lần lượt với 3 tài khoản (student/teacher/admin). Xác nhận mỗi role render đúng layout và Sidebar. Nút Logout hoạt động, xóa session và redirect về `/login`. |
| **T026** | Manual Test: Route Guard & Error Pages | — | 1 | T024 | SPEC §9 Edge Cases | Truy cập `/learning/dashboard` khi chưa đăng nhập → redirect `/login`. Nhập URL `/admin/dashboard` bằng tài khoản student → hiển thị trang `/403`. Nhập URL không tồn tại → hiển thị `/404`. Refresh trang `/learning/dashboard` khi đang đăng nhập → ở lại trang, không bị redirect. |
| **T027** | Manual Test: Shared Components UI | — | 1 | T024 | SPEC §11 Manual Demo Checklist | Kiểm tra Navbar đúng trạng thái login/logout. Kiểm tra Sidebar active link đúng. Kiểm tra EmptyState hiện khi list rỗng. Kiểm tra Toast xuất hiện khi thực hiện action thành công/thất bại. Kiểm tra Pagination hoạt động và không render khi chỉ có 1 trang. Kiểm tra SkeletonUI xuất hiện đúng khi đang load. |
| **T028** | Manual Test: API Services & Error Handling | — | 1 | T024 | SPEC §8 Error Handling Matrix | Tắt JSON-Server, reload trang list → hiển thị EmptyState/error message, không crash app. Kiểm tra Toast error message rõ nghĩa khi API fail. Kiểm tra `httpClient` gửi đúng header và base URL từ `.env`. |
| **T029** | Setup Deploy: Frontend (Vercel/Netlify) & JSON-Server (Render) | `README.md`<br>`.env.production`<br>`package.json` (scripts) | 2 | T024 | SPEC §12 Phase 8, SPEC §13 Q5 | Deploy frontend lên Vercel hoặc Netlify. Deploy JSON-Server lên Render. Cập nhật `.env.production` với `REACT_APP_API_BASE_URL` trỏ đúng URL JSON-Server đã deploy (không phải localhost). Xác nhận frontend deployed có thể gọi API từ JSON-Server deployed. Ghi lại 2 URL deployed vào `README.md`. |
| **T030** | Viết tài liệu AI Usage Transparency | `AI_USAGE.md` hoặc phần README | 1 | T029 | SPEC §1 Goals, SPEC §13 Q6, AGENTS.md §6 | Tạo file `AI_USAGE.md` liệt kê: các file/component nào được tạo/hỗ trợ bởi AI; công cụ AI sử dụng (Antigravity, Copilot, ChatGPT...); phần nào đã được thành viên review và verify. Không commit code AI-generated chưa được review và hiểu rõ. |
| **T031** | Dọn dẹp Code & Update Changelog | `src/**`<br>`.sdd/agents_changelog.md` | 1 | T024 — T030 | AGENTS.md §6, constitution.md §5 | Xóa toàn bộ `console.log` thừa. Xóa component/file/import không dùng. Đảm bảo không hardcode URL, secret, token trong code. Update `agents_changelog.md` ghi lại danh sách file đã tạo/sửa trong feature này. |
