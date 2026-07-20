# Danh sách Tasks: Student Course Learning (feature-course-learning)

**Dựa trên:** `SPEC.md`, `PLAN.md`, `AGENTS.md`, `CLAUDE.md`, và `constitution.md`.
**Quy định:** Mỗi task ≤ 4 giờ, implement độc lập, format bảng Markdown chi tiết tối đa. Tuyệt đối tuân thủ kiến trúc Frontend ReactJS + JSON-Server của dự án FER202.

## Phase 1: Database Setup & Mock Data (JSON-Server)
*Luật (constitution): Sử dụng file `db.json` làm Mock API.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T001** | Chuẩn hóa Mock Database | `db.json` | 0.5 | None | NFR - Database | Đảm bảo collection `courses` bỏ field `students` thừa. Khởi tạo mảng rỗng `lessonProgress: []`. |

## Phase 2: Utilities & Core Services
*Luật: Các hàm gọi API dùng Axios. Không gọi API trực tiếp trong Component.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T002** | Khởi tạo Course Services | `src/services/courseLearning.service.js` | 1.5 | T001 | API Contracts | Viết các hàm `getCourses`, `getCourseById`. Cấu hình truyền query params để lọc, phân trang. |
| **T003** | Khởi tạo Enrollment Services | `src/services/courseLearning.service.js` | 2.5 | T001 | API Contracts | Viết các hàm `getEnrollment`, `createEnrollment`, `updateEnrollmentProgress`. |
| **T004** | Khởi tạo Lesson Services | `src/services/courseLearning.service.js` | 2 | T001 | API Contracts | Viết các hàm `getLessons`, `getLessonProgress`, `markLessonCompleted`. |
| **T005** | Implement Progress Calculation Util | `src/utils/progress.util.js` | 1 | None | Ubiquitous | Hàm `calculateProgress(completed, total)` xử lý tính % tiến độ an toàn, tránh lỗi chia 0. |

## Phase 3: State Management & Routing
*Luật: Quản lý trạng thái bằng Redux/Context. Bảo vệ route.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T006** | Cấu hình Route Learning | `src/routes/AppRoutes.jsx` | 1.5 | None | State-driven | Đăng ký `/learning/courses`, `/learning/courses/:id`, `/learning/courses/:courseId/lessons/:lessonId`. Bọc `<ProtectedRoute role="student">`. |
| **T007** | Learning Store/Context | `src/store/courseLearningSlice.js` | 2.5 | T002-T004 | Event-driven | Lưu trữ `enrollment`, `lessons`, `progress`. Các reducer update tiến độ local không cần fetch lại toàn bộ. |

## Phase 4: Frontend Implementation (React + Vite)
*Luật: Components viết bằng PascalCase. Style dùng Bootstrap 5.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T008** | Component: CourseCard | `src/components/feature-course-learning/CourseCard.jsx` | 1.5 | None | CL-01 | Card hiển thị Thumbnail, Title, Teacher, Skill, Level, Badge giá tiền, enrolled count. |
| **T009** | Component: EnrollmentCTA | `src/components/feature-course-learning/EnrollmentCTA.jsx` | 2 | T007 | CL-04 | Logic disable/spinner khi submit. Hiện "Join Course" hoặc "Continue Learning" dựa trên enrollment prop. |
| **T010** | Component: LessonSidebar | `src/components/feature-course-learning/LessonSidebar.jsx` | 2 | None | CL-06 | Sidebar danh sách bài học, có biểu tượng checkmark cho bài `completed`. |
| **T011** | Component: LessonContentPlayer| `src/components/feature-course-learning/LessonContentPlayer.jsx`| 2 | None | CL-07 | Render Video Player (iframe/video tag). Fallback hiển thị text nếu ko có video. |
| **T012** | Page: CourseListPage | `src/pages/student/CourseListPage.jsx` | 3 | T002, T008 | CL-01, CL-02 | Fetch và render list `CourseCard`. Thêm UI bộ lọc, ô tìm kiếm và pagination. Xử lý Empty State. |
| **T013** | Page: CourseDetailPage | `src/pages/student/CourseDetailPage.jsx` | 2.5 | T002, T009 | CL-03 | Hiển thị chi tiết (Syllabus, Teacher). Nhúng `EnrollmentCTA`. Xử lý flow sau khi Enroll xong. |
| **T014** | Page: LessonPage (UI Layout) | `src/pages/student/LessonPage.jsx` | 2.5 | T004, T010, T011| CL-06, CL-07 | Fetch bài học và progress. Dựng layout: Trái content (T011), phải sidebar (T010). |
| **T015** | Page: LessonPage (Mark Logic) | `src/pages/student/LessonPage.jsx` | 3 | T007, T014 | CL-08, CL-09 | Tích hợp nút "Mark as Completed". Tính lại `progress %`, PATCH `enrollments`. Auto-next lesson. |
| **T016** | Page: MyCoursesPage | `src/pages/student/MyCoursesPage.jsx` | 2.5 | T003, T008 | CL-05 | Lấy `enrollments` -> map với `courses`. Hiện list khóa học đang học + ProgressBar cho từng khóa. |

## Phase 5: Testing & Quality Assurance
*Luật: Bắt buộc test edge cases theo SPEC.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T017** | Test Edge Case: Auth Guard | `src/pages/student/LessonPage.jsx` | 1.5 | T014 | Unwanted | Direct URL test: User chưa enroll vào bài học sẽ bị redirect về CourseDetail + Toast cảnh báo. |
| **T018** | Test Edge Case: No Lessons | `src/pages/student/CourseDetailPage.jsx`| 1.5 | T013 | Edge Cases | Course có `totalApprovedLessons = 0` -> Không hiện nút học, progress = 0. |
| **T019** | Test Empty/Error States | Tương ứng các Pages | 2.5 | T012-T016 | State-driven | Đảm bảo mọi trang gọi API có UI loading spinner, UI empty khi mảng rỗng, Toast khi network lỗi. |
