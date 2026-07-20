# Danh sách Tasks: Teacher Content Management (feat-teacher-content-management)

**Dựa trên:** `SPEC.md`, `PLAN.md`, `AGENTS.md` và `constitution.md`.
**Quy định:** Mỗi task ≤ 4 giờ, implement độc lập, format bảng Markdown chi tiết tối đa.

---

## Phase 1: Database Setup & Migration (JSON-Server `db.json`)
*Luật: Sử dụng JSON-Server làm mock REST API. Không có DB SQL thật.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T001** | Sửa lỗi cú pháp `db.json` & Bổ sung collection | `db.json` | 1.5 | None | PLAN §4 | Sửa toàn bộ lỗi cú pháp JSON trong `db.json`. Thêm các mảng rỗng: `"approvalRequests": []`, `"auditLogs": []`. Khởi động được JSON-Server. |
| **T002** | Thiết lập Mock Schema & Sample Data | `db.json` | 2 | T001 | SPEC §6 | Bổ sung dữ liệu mẫu cho các mảng bài học, bài test, câu hỏi và enrollments mẫu để phục vụ việc demo. |

---

## Phase 2: Utilities & Core Services
*Luật: Viết các service Axios phẳng kết nối tới Mock JSON-Server. Không xử lý HTTP Request ở tầng này.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T003** | Viết Service: Quản lý Khóa học | `src/services/teacherCourseService.js` | 2 | T002 | PLAN §2.1 | Tạo service Axios thực hiện các hàm: `getCourses(teacherId)`, `createCourse`, `updateCourse`, `deleteCourse`. |
| **T004** | Viết Service: Quản lý Bài học | `src/services/teacherLessonService.js` | 2 | T002 | PLAN §2.1 | Tạo service Axios thực hiện: `getLessons(teacherId)`, `getLessonById(id)`, `createLesson`, `updateLesson`, `deleteLesson`. |
| **T005** | Viết Service: Quản lý Test & Câu hỏi | `src/services/teacherTestService.js`<br>`src/services/teacherQuestionService.js` | 2.5 | T002 | PLAN §2.1 | Tạo các service Axios thực hiện CRUD Test theo `teacherId`/`courseId`, CRUD Question theo `testId`. |
| **T006** | Viết Service: Duyệt bài, Logs & Tracking | `src/services/teacherApprovalService.js`<br>`src/services/teacherStudentService.js`<br>`src/services/auditLogService.js` | 2.5 | T002 | PLAN §2.1 | Tạo service gửi duyệt, lấy lịch sử duyệt, lấy danh sách học viên enroll khóa học, tiến độ bài học, kết quả test và ghi log hoạt động. |

---

## Phase 3: Middleware, Controllers & API Routes
*Luật: Xử lý bảo vệ định tuyến bằng Route Guard và ánh xạ 10 route nghiệp vụ của Teacher ở client-side.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T007** | Cấu hình Route Guard & Side Navigation | `src/layouts/TeacherLayout.jsx`<br>`src/routes/ProtectedRoute.jsx` | 3 | T003 | PLAN §2.2 | Cấu hình Route Guard bảo vệ các route `/teacher/*`. Bố trí menu Sidebar điều hướng Bootstrap 5. |
| **T008** | Khởi tạo & Đăng ký API Routes | `src/routes/AppRoutes.jsx` | 2.5 | T007 | PLAN §2.2 | Đăng ký đủ 10 route giáo viên (dashboard, courses, lessons, tests, students, v.v.) dưới Teacher Layout. |

---

## Phase 4: Frontend Implementation (React + Vite)
*Luật: Dựng giao diện bằng React và Bootstrap 5. Sử dụng React Hook Form + Zod cho form validation.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T009** | Component: Teacher Dashboard UI | `src/pages/teacher/TeacherDashboard.jsx` | 3 | T006, T008 | PLAN §2.2 | Hiển thị 4 khối thống kê: Số khóa học đã tạo, Số bài học đã tạo, Số đề thi đã tạo, Số học viên đang tham gia. Hiển thị danh sách 5 yêu cầu duyệt gần nhất. |
| **T010** | Component: Course List Grid | `src/pages/teacher/CourseManagement.jsx` | 2 | T003, T008 | PLAN §2.2 | Gọi `getCourses` để render danh sách dạng Card Grid. Hiển thị Badge trạng thái tương ứng (Draft, Pending, Approved, Rejected). |
| **T011** | Component: Course Create & Edit Form | `src/pages/teacher/CourseCreatePage.jsx`<br>`src/pages/teacher/CourseEditPage.jsx` | 3.5 | T010 | US-TCH-01/02 | Trang tạo/sửa khóa học sử dụng react-hook-form + zod. Chặn sửa/xóa nếu status là `pending`. Nếu sửa khóa học đang ở dạng `approved`, tự động chuyển status về `pending`. |
| **T012** | Component: Lesson Management Pages | `src/pages/teacher/LessonListPage.jsx`<br>`src/pages/teacher/LessonCreatePage.jsx` | 4 | T004, T008 | US-TCH-03 | Trang danh sách toàn bộ bài học. Trang thêm bài học: Có dropdown chọn Khóa học của giáo viên, trường nhập order, thời lượng, contentUrl và mock audio Listening. |
| **T013** | Component: Test & Question Builder Pages | `src/pages/teacher/TestListPage.jsx`<br>`src/pages/teacher/TestCreatePage.jsx`<br>`src/pages/teacher/QuestionBankPage.jsx` | 4 | T005, T008 | US-TCH-04 | Trang danh sách đề thi, tạo đề thi và tạo câu hỏi đa dạng loại (trắc nghiệm, đúng/sai, điền từ) kèm đáp án đúng & giải thích chi tiết. |
| **T014** | Page: Student Progress Tracking | `src/pages/teacher/StudentTrackingPage.jsx` | 4 | T006, T008 | PLAN §2.2 | Trang hiển thị danh sách học viên đăng ký các khóa học của giáo viên. Cho phép xem tiến độ học lesson (%) và điểm số làm bài test. |

---

## Phase 5: Testing & Quality Assurance
*Luật: Viết unit test cho happy path và từng error case. Thêm Traceability Matrix vào đầu file test.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T015** | Unit Test: Lesson Management | `src/pages/teacher/__tests__/LessonListPage.test.jsx`<br>`src/pages/teacher/__tests__/LessonCreatePage.test.jsx` | 3 | T012 | US-TCH-03 | Viết unit test cho LessonListPage và LessonCreatePage kiểm tra happy path, empty state, các error cases validation. |
| **T016** | Integration Test: Approval Flow Simulation | `src/pages/teacher/__tests__/ApprovalFlow.test.jsx` | 3 | T011, T015 | US-TCH-05 | Kiểm thử tích hợp luồng duyệt từ client-side: gửi duyệt thành công, chuyển status thành pending, khóa chỉnh sửa, ghi audit logs. |
