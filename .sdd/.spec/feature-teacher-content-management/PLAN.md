# Implementation Plan: Teacher Content Management (feat-teacher-content-management)

**Status:** DRAFT — Awaiting Review
**Linked Spec:** [.sdd/.spec/feature-teacher-content-management/SPEC.md](file:///c:/Users/Admin/OneDrive/Desktop/FER202_project/FER202_Project/.sdd/.spec/feature-teacher-content-management/SPEC.md) (APPROVED, Risk: Medium)
**Sprint:** Sprint 2 — Teacher Features
**Date:** 2026-06-11

---

## 1. ARCHITECTURAL APPROACH

- **Layered Frontend Architecture:** Tuân thủ mô hình Page / Container → UI Components → Custom Hooks → Services (Axios) → Mock DB (JSON-Server).
- **Client-Side Auth & Guards:** Bảo vệ các route bằng `ProtectedRoute.jsx` (đọc role từ `localStorage` qua `authService.js`). Chặn truy cập hoặc chỉnh sửa chéo bằng cách đối chiếu `currentUser.id` với `course.teacherId` trực tiếp ở component/page level trước khi render UI hoặc gọi API.
- **Client-Side Validation:** Dùng **React Hook Form + Zod** cho các biểu mẫu thêm mới/chỉnh sửa khóa học, bài học và câu hỏi. Đảm bảo validate đầu vào đầy đủ ở giao diện (Client-side validation) để hiển thị lỗi tức thì trước khi submit.
- **Simulated State Transactions & Audit Logging:** Vì JSON-Server là stateless, Frontend React sẽ quản lý chuyển đổi trạng thái (draft → pending → approved/rejected). Mọi hành động đột biến (create, update, delete) thành công sẽ kích hoạt thêm một request `POST /auditLogs` do Client tự gửi để ghi nhận vết hoạt động.
- **Toast & UI UX Feedback:** Tích hợp `react-hot-toast` để đưa ra các thông báo phản hồi thao tác nhanh chóng và mượt mà cho Giáo viên (thêm thành công, cập nhật trạng thái duyệt, v.v.).

---

## 2. COMPONENTS & INTERFACE

### 2.1 Services Layer (`src/services/`)

> Quản lý toàn bộ giao tiếp Axios với Mock JSON-Server (`http://localhost:9999`).

| File / Service | Method / Function | Endpoints | Ghi chú |
|---|---|---|---|
| `teacherCourseService.js` | `getCourses(teacherId)`<br>`createCourse(data)`<br>`updateCourse(id, data)`<br>`deleteCourse(id)` | `GET /courses?teacherId={id}`<br>`POST /courses`<br>`PATCH /courses/:id`<br>`DELETE /courses/:id` | `createCourse` sẽ mặc định gán `status = "draft"`, `enrolledCount = 0`. Chỉ cho xóa nếu status = `draft` hoặc `rejected`. |
| `teacherLessonService.js` | `getLessons(courseId)`<br>`createLesson(data)`<br>`updateLesson(id, data)`<br>`deleteLesson(id)` | `GET /lessons?courseId={id}`<br>`POST /lessons`<br>`PATCH /lessons/:id`<br>`DELETE /lessons/:id` | Tự động điền trường `teacherId` lấy từ course hiện tại để quản lý quyền. |
| `teacherTestService.js` | `getTests(courseId)`<br>`createTest(data)`<br>`updateTest(id, data)`<br>`deleteTest(id)` | `GET /tests?courseId={id}`<br>`POST /tests`<br>`PATCH /tests/:id`<br>`DELETE /tests/:id` | |
| `teacherQuestionService.js` | `getQuestions(testId)`<br>`createQuestion(data)`<br>`updateQuestion(id, data)`<br>`deleteQuestion(id)` | `GET /questions?testId={id}`<br>`POST /questions`<br>`PATCH /questions/:id`<br>`DELETE /questions/:id` | Đáp án đúng (`answer`) phải nằm trong danh sách các `options` truyền lên. |
| `teacherApprovalService.js` | `submitForApproval(courseId, teacherId)`<br>`getApprovalRequests(teacherId)` | `POST /approvalRequests`<br>`GET /approvalRequests?teacherId={id}` | Chuyển trạng thái course thành `pending` rồi tạo bản ghi request. |
| `auditLogService.js` | `logAction(action, details)` | `POST /auditLogs` | Ghi nhận hoạt động `{ action, userId, details, timestamp }`. |

---

### 2.2 Frontend Pages & Components

> Thiết kế giao diện bằng Bootstrap 5 & React-Bootstrap.

| Component / Page | Route / Placement | Trách nhiệm |
|---|---|---|
| `TeacherDashboard` | `/teacher/dashboard` | Thống kê nhanh: Tổng số khóa học, số học sinh đăng ký, số khóa học cần sửa. Danh sách phê duyệt gần đây. |
| `CourseManagement` | `/teacher/courses` | Màn hình chính quản lý khóa học. Hiển thị danh sách khóa học dạng Card grid kèm Badge trạng thái (Draft, Pending, Approved, Rejected). |
| `CourseFormModal` | Trong `CourseManagement` | Modal popup Thêm/Sửa khóa học sử dụng Zod schema để validate các trường: Title, Description, Skill, Level, DurationWeeks, Price. |
| `CourseDetailBuilder` | `/teacher/courses/:id` | Trang chi tiết khóa học nơi Giáo viên quản lý giáo trình. Chia làm 2 tabs: **Lessons (Bài học)** và **Tests (Bài luyện tập)**. |
| `LessonFormModal` | Trong `CourseDetailBuilder` | Modal thêm/sửa bài học thuộc khóa học (Title, Order, DurationMinutes, ContentUrl). |
| `TestQuestionBuilder` | Trong `CourseDetailBuilder` | Modal quản lý bài test và ngân hàng câu hỏi. Cho phép thêm bài test mới và thêm danh sách các câu hỏi (trắc nghiệm, điền ô trống, true-false-not-given) cho bài test đó. |
| `ApprovalRequestButton` | Trong `CourseDetailBuilder` | Nút kích hoạt gửi duyệt. Trước khi kích hoạt, kiểm tra frontend validation: khóa học có ít nhất 1 bài học hoặc test hợp lệ. |

---

## 3. DATA FLOW (Luồng dữ liệu giả lập)

### Flow 1: Khởi tạo khóa học Nháp (Draft Course)

```
Teacher  Click "Tạo khóa học" → Nhập thông tin form
  → Validation qua Zod Schema (Tránh trường trống, validate Price >= 0)
  → teacherCourseService.createCourse()
      ├─ Payload tự động sinh: status='draft', teacherId=currentUser.id, enrolledCount=0
      ├─ Axios POST /courses
      └─ auditLogService.logAction('CREATE_COURSE', { courseId }) → POST /auditLogs
  ← Response thành công: Toast thông báo "Khóa học nháp đã được tạo!"
  ← UI tự động cập nhật danh sách khóa học với Badge màu Xám (Draft)
```

---

### Flow 2: Thêm nội dung & Ràng buộc phê duyệt (Lessons/Tests Validation)

```
Teacher  Click "Submit for Approval" trong Course Detail Builder
  → Validation Client-side:
      ├─ Gọi GET /lessons?courseId={id} & GET /tests?courseId={id}
      ├─ Nếu độ dài mảng lessons === 0 VÀ tests === 0
      │   └─ Chặn submit → Hiện Alert "Khóa học của bạn phải có ít nhất 1 bài học hoặc bài kiểm tra để gửi duyệt."
      ├─ Nếu bài test có questions rỗng
      │   └─ Chặn submit → Hiện Alert "Bài test [Tên] chưa có câu hỏi."
  → Nếu hợp lệ:
      ├─ teacherCourseService.updateCourse(id, { status: "pending" }) → PATCH /courses/:id
      ├─ teacherApprovalService.submitForApproval() → POST /approvalRequests
      │   └─ Payload: { id, contentType: "course", contentId, teacherId, status: "pending", createdAt }
      └─ auditLogService.logAction('SUBMIT_APPROVAL', { courseId }) → POST /auditLogs
  ← Response thành công: Toast thông báo "Khóa học đang chờ duyệt!"
  ← UI vô hiệu hóa nút Edit/Delete (Khóa khóa học khi đang chờ duyệt)
```

---

### Flow 3: Cập nhật khóa học đã duyệt (Approved Course Modification)

```
Teacher  Click "Edit" một khóa học đang có status = "approved"
  → Nhập thông tin mới trong Modal Form → Submit
  → teacherCourseService.updateCourse()
      ├─ Client tự động chuyển status sang "pending" (yêu cầu duyệt lại)
      ├─ Axios PATCH /courses/:id (status: "pending")
      ├─ teacherApprovalService.submitForApproval() → POST /approvalRequests (tạo yêu cầu duyệt mới)
      └─ auditLogService.logAction('UPDATE_APPROVED_COURSE', { courseId }) → POST /auditLogs
  ← Response thành công: Toast "Cập nhật thành công. Khóa học đã được đưa lại danh sách chờ duyệt."
  ← Giao diện cập nhật lại Badge sang màu Vàng (Pending)
```

---

## 4. IMPLEMENTATION DEPENDENCIES

**Thứ tự triển khai thực tế:**

| Bước | Phân vùng phát triển | Phụ thuộc | Ghi chú |
|---|---|---|---|
| 1 | **Mock DB (`db.json`) Setup** | Sửa cú pháp lỗi hiện tại của `db.json` | Khai báo các mảng trống `approvalRequests` và `auditLogs`. |
| 2 | **Services Layer** | Bước 1 | Viết các Service file Axios: `teacherCourseService.js`, `teacherLessonService.js`, `teacherTestService.js`, `teacherQuestionService.js`, `teacherApprovalService.js`, `auditLogService.js`. |
| 3 | **Route Guard Protection** | Phân quyền `ProtectedRoute.jsx` | Đảm bảo role `teacher` được redirect chính xác tới `/teacher/*`. |
| 4 | **Dashboard & Course Grid** | Bước 2, 3 | Tạo `TeacherDashboard.jsx` và `CourseManagement.jsx` hiển thị danh sách khóa học thuộc về `teacherId`. |
| 5 | **Course Form (React Hook Form + Zod)**| Bước 4 | Modal tạo/sửa thông tin cơ bản khóa học nháp. |
| 6 | **Course Detail Builder & Tabs** | Bước 5 | Trang dựng chi tiết khóa học, render tab list bài học & bài test. |
| 7 | **Lessons & Tests Modals** | Bước 6 | Thêm/sửa/xóa bài học, bài test, câu hỏi. |
| 8 | **Approval & Verification Logic** | Bước 2, 7 | Tích hợp nút gửi duyệt, validate điều kiện trước khi gửi, tạo request. |
| 9 | **Audit Logging & Toast Alerts** | Bước 8 | Bắn log sau mỗi thao tác mutation, hiện Toast thông báo UI. |

---

## 5. TECHNICAL RISKS & MITIGATION

| # | Rủi ro | Khả năng | Tác động | Giải pháp khắc phục (Mitigation) |
|---|---|---|---|---|
| 1 | **Bị sửa đổi trái phép bằng REST API client** | High | Low | Vì JSON-Server không bảo mật, bất kỳ ai dùng Postman cũng ghi đè được. Tuy nhiên, đối với đồ án FER202, chỉ cần đảm bảo giao diện React **chặn chặt chẽ ở Client** (không hiển thị các nút thao tác cho khóa học không thuộc về mình, redirect `/403` nếu cố truy cập qua URL). |
| 2 | **Mất liên kết con (Orphan child nodes)** | Medium | Medium | Khi một khóa học (Course) bị xóa, ta phải thực hiện xóa cascade (gửi tiếp các request xóa `lessons` và `tests` có `courseId` tương ứng) để tránh tràn bộ nhớ rác của `db.json`. |
| 3 | **Lồng nhiều request gây giật lag UI** | Medium | Low | Hiển thị spinner loading mờ (overlay loading spinner) trên toàn bộ khung chứa khi thao tác lưu đang xử lý, chỉ tắt khi nhận được kết quả response từ JSON-Server. |

---

## 6. OPEN QUESTIONS

| # | Câu hỏi cần xác nhận | Người chịu trách nhiệm | Mức độ ưu tiên | Trạng thái |
|---|---|---|---|---|
| **Q1** | Giáo viên có được phép xóa hoàn toàn khóa học bị từ chối (`rejected`) không, hay chỉ được sửa đổi gửi lại? | Giáo viên hướng dẫn / Nhóm | Medium | **Đã xác nhận:** Cho phép xóa cứng khóa học `rejected` và `draft`. Khóa học `approved` thì không được xóa. |
| **Q2** | Định dạng hiển thị nội dung bài học (`contentUrl`): link video Youtube hay editor soạn thảo văn bản? | Front-End Dev | Low | **Tạm thời:** Dùng trường văn bản (Text/Markdown) và link mock. |
| **Q3** | Lý do từ chối khóa học (`rejection reason`) sẽ hiển thị ở đâu trên dashboard của giáo viên? | UI/UX Designer | Medium | **Thống nhất:** Hiển thị trực tiếp ở dòng khóa học bị từ chối dạng Tooltip hoặc mô tả mở rộng bên dưới Badge trạng thái. |

---

## 7. DEFINITION OF DONE

Feature `feat-teacher-content-management` được coi là **DONE** khi thỏa mãn:

- [ ] Sửa lỗi cú pháp file `db.json` thành công và chạy mượt mà không crash.
- [ ] Route `/teacher/dashboard` và `/teacher/courses` được bảo vệ hoàn chỉnh bằng Route Guard.
- [ ] CRUD Khóa học, Bài học, Bài test và Câu hỏi hoạt động đúng theo đặc tả (gửi/nhận dữ liệu qua JSON-Server).
- [ ] Quy trình gửi duyệt (Submit for approval) thực hiện đúng: chuyển trạng thái sang `pending`, ghi nhận bản ghi vào `approvalRequests`.
- [ ] Chỉ cho phép chỉnh sửa/xóa các khóa học ở trạng thái `draft` hoặc `rejected`. Vô hiệu hóa nút thao tác đối với khóa học `pending`.
- [ ] Sửa đổi khóa học `approved` sẽ tự động chuyển trạng thái về `pending` và yêu cầu duyệt lại.
- [ ] Các form nhập liệu đều được validate qua Zod, hiển thị thông báo lỗi rõ ràng bên cạnh ô input.
- [ ] Hệ thống bắn thành công nhật ký hoạt động `POST /auditLogs` sau mỗi thao tác tạo/sửa/xóa nội dung.
- [ ] Toast thông báo xuất hiện chính xác sau mỗi hành động.
- [ ] UI tương thích tốt trên giao diện máy tính và máy tính bảng (Responsive).
