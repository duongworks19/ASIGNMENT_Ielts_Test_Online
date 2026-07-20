# Implementation Plan: Student Course Learning (feature-course-learning)

Status: **DRAFT**
Author: AI Agent | Date: 2026-06-11
Risk Level: **Medium** (Core Student Flow)
Related Specs: `SPEC.md` (APPROVED), `constitution.md`, `shared_context.md`

## 1. Mục tiêu & Hướng tiếp cận (Kiến trúc chuẩn FER202)

Tính năng "Student Course Learning" là luồng chính để học viên trải nghiệm hệ thống. Tuân thủ tuyệt đối quy tắc của môn FER202:
- **Kiến trúc:** 100% Client-side Rendering bằng ReactJS (CRA).
- **Mock API:** Sử dụng `json-server` với file `db.json`. Mọi logic phức tạp (tính toán tiến độ phần trăm, chặn trùng lặp) được xử lý ở tầng Frontend Services (Axios) trước khi ghi xuống mock DB.
- **State Management:** Dùng Redux Toolkit (hoặc Context API) để quản lý state cho khóa học đang xem, tiến độ bài học, tránh việc fetch lại dữ liệu liên tục và giúp đồng bộ hóa với Dashboard mượt mà.

## 2. API Service Layer (Frontend)

Mọi thao tác gọi API phải đi qua `src/services/courseLearning.service.js`. **KHÔNG** fetch trực tiếp bằng Axios trong lòng Component để dễ tái sử dụng và testing.

- **`getCourses(params)`**: `GET /courses?status=approved` kèm các query `_page`, `_limit`, `_sort`, `q`, `skill`, `level`.
- **`getCourseById(id)`**: `GET /courses/:id`.
- **`getEnrollment(userId, courseId)`**: `GET /enrollments?userId=...&courseId=...`.
- **`createEnrollment(data)`**: `POST /enrollments` (set cứng `status = 'active'`, `progress = 0`).
- **`updateCourseEnrolledCount(courseId, newCount)`**: `PATCH /courses/:id` (để tăng `enrolledCount` lên 1).
- **`getLessons(courseId)`**: `GET /lessons?courseId=...&status=approved&_sort=order&_order=asc`.
- **`getLessonProgress(userId, courseId)`**: `GET /lessonProgress?userId=...&courseId=...`.
- **`markLessonCompleted(data)`**: `POST /lessonProgress` lưu trạng thái hoàn thành.
- **`updateEnrollmentProgress(enrollmentId, newProgress, newStatus)`**: `PATCH /enrollments/:id` (cập nhật tiến độ tổng `progress`).

## 3. UI Components & Pages

Toàn bộ UI sẽ được bọc trong `StudentLayout` (có Navbar, Sidebar cho học viên). Ưu tiên sử dụng Bootstrap 5 framework.

### 3.1. Pages (Nằm trong `src/pages/student/`)
- **`CourseListPage.jsx`**: (`/learning/courses`)
  - Chứa bộ Filter/Search/Sort bên trái hoặc phía trên.
  - Hiển thị danh sách khóa học dạng Grid (tái sử dụng `CourseCard`).
- **`CourseDetailPage.jsx`**: (`/learning/courses/:id`)
  - Hiện thông tin chi tiết (Teacher, Syllabus, Level).
  - Logic check enrollment: Chưa enroll -> Hiện nút "Join Course". Đã enroll -> Hiện nút "Continue Learning".
- **`LessonPage.jsx`**: (`/learning/courses/:courseId/lessons/:lessonId`)
  - Split layout: Bên trái là Nội dung bài học (Video Player hoặc Text Content), Bên phải là danh sách bài học (`LessonSidebar`).
  - Xử lý tiến độ (Nút "Mark as Completed", "Next Lesson", "Prev Lesson").
- **`MyCoursesPage.jsx`**: (`/learning/courses` tab My Courses)
  - Danh sách khóa học đang học (`status=active`) và đã hoàn thành (`status=completed`). 
  - Kèm `ProgressBar` thể hiện `progress`.

### 3.2. Components (Nằm trong `src/components/feature-course-learning/`)
- **`CourseCard`**: Card khóa học chuẩn UI (Có thể chuyển vào thư mục `common/` nếu Guest cũng dùng).
- **`LessonSidebar`**: Cột hiển thị danh sách bài học, có icon checkmark màu xanh nếu bài đó đã hoàn thành.
- **`LessonContentPlayer`**: Render logic tùy loại nội dung: Nếu có `contentUrl` dạng Video thì hiện thẻ `<video>` hoặc Iframe Youtube, nếu thiếu thì render thẻ `<div>` HTML hiển thị trường `content` (Fallback).
- **`EnrollmentCTA`**: Component Nút Enroll thông minh (chặn bấm đúp, hiển thị spinner lúc loading, tự đổi thành Continue Learning nếu đã ghi danh).

## 4. Luồng Nghiệp vụ Quan trọng (Flows)

### Flow 1: Enroll Khóa Học
1. Học viên click "Join Course". Frontend set state `isEnrolling = true`.
2. Kiểm tra GET API `enrollments` xem đã có data khớp `userId` + `courseId` chưa (tránh click đúp).
3. Nếu chưa, gọi `POST /enrollments` tạo record mới.
4. Gọi tiếp `PATCH /courses/:id` để tăng biến `enrolledCount` lên 1.
5. Hiển thị Toast thông báo thành công và tự động điều hướng `<Navigate>` sang bài học đầu tiên.

### Flow 2: Đánh dấu hoàn thành Bài Học (Mark as Completed)
1. Học viên đang ở `LessonPage`, click nút "Mark as Completed". Nút bị disable lập tức để tránh click liên tục.
2. Gọi `POST /lessonProgress` ghi nhận hoàn thành.
3. Frontend tự động fetch lại toàn bộ danh sách `lessonProgress` để đếm tổng số bài đã hoàn thành (`completedApprovedLessons`).
4. Logic Frontend tự tính toán: `progress = Math.round((completedApprovedLessons / totalApprovedLessons) * 100)`.
5. Gọi `PATCH /enrollments/:id` để cập nhật `progress`. Nếu `progress === 100`, cập nhật luôn `status = 'completed'`.
6. Cập nhật Redux store/State -> Giao diện hiện checkmark hoàn thành lập tức. Gợi ý điều hướng sang "Next Lesson" (nếu có).

## 5. Xử lý Ngoại lệ (Edge Cases)

- **Truy cập trực tiếp URL bài học khi chưa enroll:** Sử dụng `useEffect` kiểm tra quyền. Nếu không có record enrollment tương ứng, hiển thị Toast cảnh báo và Redirect về trang chi tiết khóa học.
- **Khóa học chưa có bài học nào:** Hiển thị `EmptyState`, khóa cứng phần trăm hoàn thành ở mức 0%, ẩn các nút Next/Prev.
- **Network chậm / lỗi JSON-Server:** Bọc mọi API calls trong `try/catch`. Khi lỗi, show `Toast` lỗi rõ ràng với Retry action.

## 6. Kế hoạch triển khai (Rollout Plan)

1. **Chuẩn bị Database:** Kiểm tra `db.json`. Đảm bảo mảng `"lessonProgress": []` tồn tại. Đã xóa field `students` thừa ở collection `courses` để tránh sai lệch dữ liệu.
2. **Setup Services Layer:** Code xong file `courseLearning.service.js`.
3. **Khai báo Routing:** Add các route `/learning/*` vào `AppRoutes.jsx`, bọc bởi component `<ProtectedRoute allowedRoles={['student']} />`.
4. **Xây dựng UI tĩnh:** Dựng layout cho `CourseListPage` và `LessonPage` (dùng mock data tĩnh trước).
5. **Tích hợp API và State:** Nối Redux / React hooks với Services. Thực hiện test flow Enroll và flow Cập nhật Progress.
6. **Kiểm tra Edge Cases:** Cố tình truy cập sai URL, cố tình click đúp nút để test độ ổn định của Frontend.

## 7. Open Questions (Quyết định thiết kế)
* **Q1 (Premium Course):** Nếu khóa học có `isPremium = true`, khi user ấn Enroll sẽ phải điều hướng qua Fake Payment UI, sau khi thanh toán thành công Fake Payment UI mới gọi hàm tạo `enrollments`? *(Cần team chốt luồng)*.
* **Q2 (Unmark Lesson):** Thống nhất theo SPEC: Việc hoàn thành bài học là thao tác một chiều (chỉ đánh dấu hoàn thành, không có nút "Hủy hoàn thành").
* **Q3 (Dashboard Sync):** Tính năng Dashboard của Student sẽ không cần lặp lại tính toán, chỉ cần lấy trực tiếp field `progress` trong collection `enrollments` để load cho nhanh. Trách nhiệm tính toán thuộc về Feature Course Learning.
