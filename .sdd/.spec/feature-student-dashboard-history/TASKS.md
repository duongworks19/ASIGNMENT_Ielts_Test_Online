# Danh sách Tasks: Student Dashboard & Learning History (feature-student-dashboard-history)

**Dựa trên:** `SPEC.md`, `PLAN.md`, `AGENTS.md` và `constitution.md`.
**Quy định:** Mỗi task ≤ 4 giờ, implement độc lập, format bảng Markdown chi tiết tối đa.

## Phase 1: Mock Data Setup & Integration
*Luật: Tuân thủ REST API mock qua JSON-Server. Đảm bảo khởi tạo collection trước khi code.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T001** | Cập nhật file Mock Data | `db.json` | 0.5 | None | PLAN §4 | Khởi tạo mảng rỗng `testAttempts: []` (nếu chưa có) và bổ sung 10 sample records cho testAttempts, lessonProgress, enrollments. Đảm bảo cấu trúc không phá vỡ tính năng khác. |

## Phase 2: Utilities & Core Services
*Luật: Tách logic gọi API và logic tính toán khỏi UI. Handle đủ state loading/error/success ở mức hook.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T002** | Xây dựng Dashboard API | `src/services/dashboardApi.js` | 2 | T001 | PLAN §2.1 | Viết các hàm `getTestAttempts(userId)`, `getAttemptById(attemptId)`, `getLessonProgress(userId)`, `getEnrollments(userId)` sử dụng `axiosInstance`. Handle try-catch chuẩn. |
| **T003** | Hook `useDashboardData` | `src/hooks/useDashboardData.js` | 2.5 | T002 | PLAN §2.2 | Gọi `Promise.all` 3 API. Tính toán `completedLessons`, `completedTests`, `averageBandScore`, `studyHours`. Map data cho 2 chart. Quản lý state loading/error. |
| **T004** | Hook `useHistoryFilter` | `src/hooks/useHistoryFilter.js` | 2 | None | PLAN §2.2 | Nhận mảng `attempts`, trả về state quản lý filter (keyword, skill, date) và danh sách đã lọc `filtered`. Xử lý lọc local không gọi lại API. |

## Phase 3: Middleware, Controllers & API Routes
*Luật: Đối với Frontend, phase này tập trung vào Route Guard và đăng ký AppRoutes.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T005** | Đăng ký & Bảo vệ Routes | `src/routes/AppRoutes.jsx` | 1 | None | PLAN §3 | Map `/learning/dashboard`, `/learning/history`, và `/learning/history/:attemptId`. Bọc trong `ProtectedRoute` với `allowedRoles={['student']}`. Đảm bảo Sidebar có link điều hướng. |

## Phase 4: Frontend Implementation (React + Vite)
*Luật: Components viết bằng PascalCase. Style dùng Bootstrap 5.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T006** | Component: StatCard | `src/components/feature-student-dashboard-history/StatCard.jsx` | 1 | None | PLAN §2.3 | Giao diện Card Bootstrap có viền / gradient. Nhận prop `title`, `value`, `icon`. Xử lý hiển thị "N/A" nếu value null/undef. |
| **T007** | Component: TestScoreChart | `src/components/feature-student-dashboard-history/TestScoreChart.jsx` | 2 | None | PLAN §2.3 | Bọc `LineChart` của Recharts. X/Y Axis rõ ràng. Xử lý Empty State nếu mảng data rỗng. Responsive width 100%. |
| **T008** | Component: SkillRadarChart | `src/components/feature-student-dashboard-history/SkillRadarChart.jsx` | 2 | None | PLAN §2.3 | Bọc `RadarChart` của Recharts. 4 trục: Listening, Reading, Writing, Speaking. Xử lý Empty State. |
| **T009** | Component: HistoryFilter | `src/components/feature-student-dashboard-history/HistoryFilter.jsx` | 1.5 | None | PLAN §2.3 | Form inline chứa Input Search, Select Skill, Input Date Range. Trigger callback `onFilterChange`. |
| **T010** | Component: HistoryTable | `src/components/feature-student-dashboard-history/HistoryTable.jsx` | 2 | None | PLAN §2.3 | Table hiển thị attempts: Date, Type, Score, Duration, Action. Nút View kích hoạt navigate sang `/learning/history/:attemptId`. Hiển thị "Không tìm thấy" nếu mảng rỗng. Có phân trang local. |
| **T011** | Page: Dashboard UI | `src/pages/student/DashboardPage.jsx` | 2.5 | T003, T005, T006-T008 | PLAN §3 | Dùng `useDashboardData(userId)`. Hiển thị Spinner lúc loading. Grid hệ thống Bootstrap: row 4 cột cho StatCards, row 8/4 cho Charts. |
| **T012** | Page: Learning History UI | `src/pages/student/LearningHistoryPage.jsx` | 2.5 | T004, T005, T009, T010 | PLAN §3 | Load attempts, kết hợp `useHistoryFilter`. Đặt `HistoryFilter` và `HistoryTable` đúng vị trí. Xử lý loading state. |
| **T013** | Page: Attempt Detail UI | `src/pages/student/AttemptDetailPage.jsx` | 2.5 | T002, T005 | PLAN §3 | Lấy `attemptId` từ URL. Fetch attempt data tương ứng. Hiển thị điểm số, kết quả chi tiết bài test cũ. Thêm nút CTA "Review Answers" để điều hướng sang Review Mode của bài test. |

## Phase 5: Testing & Quality Assurance
*Luật: Coverage ≥ 85%. Không gọi real API trong test. Đảm bảo render đúng các edge cases.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T014** | Unit Test: Hooks | `src/hooks/__tests__/useDashboardData.test.js`<br>`src/hooks/__tests__/useHistoryFilter.test.js` | 2 | T003, T004 | PLAN §7 | Test mảng rỗng, test math logic (average, NaN protection), test behavior lọc theo keywords, ngày tháng. |
| **T015** | Component Test: UI Charts | `src/components/feature-student-dashboard-history/__tests__/*.test.jsx` | 2 | T006-T010 | PLAN §7 | Render StatCard. Kiểm tra fallback text. Render Recharts không lỗi với React Testing Library. |
| **T016** | Integration Test & Final QA | Bất kì file lỗi nào phát sinh | 2 | T011-T013 | PLAN §7 | Khởi động `npm start`, login với Student. Truy cập dashboard và history. Thử tính năng filter lịch sử, thử click View để sang Attempt Detail. Check UI responsive. |
