# SPEC.md — Feature: Teacher Content Management (feat-teacher-content-management) — FULL SPECIFICATION

Status: APPROVED | Updated
Author: Trieu Tai Dũng | Date: 2026-06-11
Risk Level: Medium (Content Management & Mock Flows)
Related Specs: [.sdd/constitution.md](file:///c:/Users/Admin/OneDrive/Desktop/FER202_project/FER202_Project/.sdd/constitution.md), [.sdd/shared_context.md](file:///c:/Users/Admin/OneDrive/Desktop/FER202_project/FER202_Project/.sdd/shared_context.md)

---

## 1. Business Context & Goals

Feature này là “Content Creation & Management Hub” dành cho **Teacher** trong hệ thống IELTS Online Learning Website.

Mục tiêu chính:
- Cho phép Teacher tạo và quản lý nội dung giảng dạy của riêng mình (Courses, Lessons, Tests, Questions).
- Thực hiện quy trình duyệt nội dung giả lập (Draft → Pending → Approved/Rejected) để demo phân quyền người dùng.
- Sử dụng mô hình lưu trữ qua **JSON-Server (`db.json`)** và xử lý logic nghiệp vụ hoàn toàn ở **Frontend (ReactJS)**.
- Giữ giao diện rõ ràng, responsive bằng **Bootstrap 5 & React-Bootstrap**, bám sát thiết kế trong `DESIGN.md`.

---

## 2. Stakeholders & User Personas

- **Teacher**: Người tạo và quản lý nội dung (Course, Lesson, Test, Question).
- **Admin**: Người duyệt yêu cầu phê duyệt nội dung và xem danh sách người dùng.
- **Student**: Người học (chỉ nhìn thấy và truy cập các nội dung đã được phê duyệt - `status === "approved"`).

---

## 3. User Stories

### US-TCH-01: Tạo khóa học mới (Create Course)
> Là Teacher, tôi muốn tạo một khóa học mới dưới dạng bản nháp để có thể bổ sung bài học và bài kiểm tra sau.
* **Acceptance Criteria:**
  - Form tạo khóa học sử dụng `react-hook-form` + `zod` để validate (Tiêu đề, Skill, Level, mô tả ngắn, giá học phí).
  - Khóa học mới tạo mặc định có `status = "draft"` và tự động gán `teacherId` của Teacher đang đăng nhập.
  - Hiển thị toast thông báo tạo thành công và chuyển hướng về trang chi tiết khóa học.

### US-TCH-02: Chỉnh sửa khóa học (Edit Course)
> Là Teacher, tôi muốn cập nhật thông tin khóa học hiện tại để sửa các lỗi nội dung.
* **Acceptance Criteria:**
  - Chỉ cho phép sửa khóa học do chính mình sở hữu (`course.teacherId === currentUser.id`).
  - Nếu khóa học đang ở trạng thái `approved` (đã duyệt), khi bấm cập nhật thành công, trạng thái sẽ tự động chuyển về `pending` để yêu cầu Admin duyệt lại (hoặc giữ `draft` tùy chọn).
  - Không cho phép chỉnh sửa nếu khóa học đang ở trạng thái `pending` (đang chờ duyệt).

### US-TCH-03: Quản lý bài học thuộc khóa học (Lesson CRUD)
> Là Teacher, tôi muốn thêm, sửa, xóa các bài học trong một khóa học để học viên có thể học theo lộ trình.
* **Acceptance Criteria:**
  - Cho phép thêm nhiều bài học vào khóa học. Mỗi bài học có tiêu đề, số thứ tự (order), thời lượng học, link nội dung mock.
  - Sắp xếp danh sách bài học theo thứ tự tăng dần của `order`.
  - Có modal xác nhận trước khi xóa bài học.

### US-TCH-04: Quản lý bài kiểm tra và câu hỏi (Test & Question CRUD)
> Là Teacher, tôi muốn tạo các bài luyện tập (practice tests) và ngân hàng câu hỏi để học sinh ôn luyện.
* **Acceptance Criteria:**
  - Mỗi bài test thuộc về một course cụ thể, có tiêu đề, skill (Listening, Reading, Writing, Speaking), thời gian làm bài, thang điểm.
  - Giáo viên có thể thêm câu hỏi vào test: trắc nghiệm (multiple-choice), đúng/sai/không đề cập (true-false-not-given), điền vào chỗ trống (fill-in-the-blank).
  - Mỗi câu hỏi phải có đáp án đúng để hệ thống chấm điểm tự động.

### US-TCH-05: Gửi yêu cầu phê duyệt (Submit for Approval)
> Là Teacher, tôi muốn gửi khóa học của mình đi duyệt để nó được hiển thị cho học viên.
* **Acceptance Criteria:**
  - Có nút "Submit for Approval" trên giao diện quản lý khóa học.
  - Hệ thống kiểm tra điều kiện: Khóa học phải có ít nhất 1 bài học (Lesson) hoặc 1 bài test có câu hỏi mới được phép gửi duyệt.
  - Khi gửi duyệt: Thay đổi trạng thái khóa học thành `pending`, đồng thời ghi một bản ghi mới vào mảng `approvalRequests` trong `db.json`.

### US-TCH-06: Theo dõi trạng thái phê duyệt
> Là Teacher, tôi muốn xem trạng thái của các khóa học (draft / pending / approved / rejected) kèm lý do từ chối nếu có.
* **Acceptance Criteria:**
  - Danh sách khóa học tại Dashboard hiển thị badge màu sắc tương ứng với trạng thái (Draft: Gray, Pending: Yellow, Approved: Green, Rejected: Red).
  - Nếu trạng thái là `rejected`, hiển thị kèm theo tooltip hoặc đoạn text lý do phản hồi từ Admin.

---

## 4. Acceptance Criteria (Theo chuẩn EARS)

* **Ubiquitous (Mọi lúc):**
  - **Ứng dụng React** PHẢI ngăn chặn người dùng không có role `teacher` truy cập các giao diện `/teacher/*` bằng Route Guard.
  - **Giao diện quản lý** PHẢI chỉ hiển thị và cho phép chỉnh sửa nội dung do chính Teacher đó tạo ra (`content.teacherId === loggedInUser.id`).
  - **Mọi thao tác thay đổi dữ liệu** (Create, Update, Delete) PHẢI gửi kèm request ghi nhận lịch sử hoạt động vào mảng `auditLogs` của `db.json` nhằm phục vụ demo.

* **Event-driven (Theo sự kiện):**
  - KHI Teacher tạo một khóa học mới, hệ thống PHẢI thiết lập `status = "draft"`.
  - KHI Teacher gửi yêu cầu duyệt, hệ thống PHẢI đổi `status = "pending"` và ghi nhận yêu cầu vào `approvalRequests`.
  - KHI Teacher thực hiện chỉnh sửa một khóa học đã được duyệt (`approved`), hệ thống PHẢI chuyển trạng thái khóa học về lại `"pending"` (hoặc `"draft"`) để đảm bảo quy trình kiểm duyệt chất lượng.

* **State-driven (Theo trạng thái):**
  - TRONG KHI khóa học có trạng thái là `draft` hoặc `pending`, trang tìm kiếm khóa học của Student (`/courses` và `/online-courses`) PHẢI ẩn khóa học này đi (sử dụng client-side filter `status === 'approved'`).
  - TRONG KHI khóa học bị từ chối (`rejected`), hệ thống PHẢI cho phép Teacher chỉnh sửa nội dung và gửi lại yêu cầu duyệt mới.

* **Unwanted / Error handling (Xử lý lỗi):**
  - NẾU Teacher nhập thiếu hoặc sai dữ liệu trong form, giao diện PHẢI hiển thị thông báo lỗi chi tiết bằng thư viện Validation (Zod) và ngăn không cho submit.
  - NẾU bài kiểm tra chưa có câu hỏi nào, hệ thống PHẢI vô hiệu hóa nút gửi yêu cầu duyệt khóa học đó và hiển thị cảnh báo "Khóa học cần có bài học hoặc bài kiểm tra hợp lệ trước khi gửi duyệt".
  - NẾU Giáo viên cố tình truy cập chỉnh sửa ID khóa học của người khác qua URL, trang PHẢI chuyển hướng về `/403` (Forbidden) hoặc hiển thị Alert báo lỗi.

---

## 5. API Contracts (Ánh xạ với JSON-Server)

Vì dự án sử dụng **JSON-Server làm Mock API**, các request từ Frontend Axios sẽ gọi đến các đường dẫn phẳng. Logic phân quyền và lọc theo Teacher sẽ được xử lý ở phía Client.

### Courses
- **Lấy danh sách khóa học của Teacher:** `GET /courses?teacherId={teacherId}`
- **Tạo khóa học:** `POST /courses`
  - Payload: `{ title, description, skill, level, price, isPremium, thumbnail, teacherId, status: "draft", enrolledCount: 0, durationWeeks, createdAt }`
- **Cập nhật khóa học:** `PATCH /courses/:id`
- **Xóa khóa học (chỉ cho phép khi ở dạng draft):** `DELETE /courses/:id`

### Lessons
- **Lấy bài học theo khóa học:** `GET /lessons?courseId={courseId}`
- **Tạo bài học:** `POST /lessons`
  - Payload: `{ courseId, title, order, durationMinutes, contentUrl, teacherId }`
- **Cập nhật bài học:** `PATCH /lessons/:id`
- **Xóa bài học:** `DELETE /lessons/:id`

### Tests & Questions
- **Lấy bài test theo khóa học:** `GET /tests?courseId={courseId}`
- **Tạo bài test:** `POST /tests`
  - Payload: `{ courseId, title, skill, durationMinutes, totalQuestions, bandScale, teacherId }`
- **Cập nhật bài test:** `PATCH /tests/:id`
- **Xóa bài test:** `DELETE /tests/:id`
- **Lấy danh sách câu hỏi của test:** `GET /questions?testId={testId}`
- **Tạo/Cập nhật/Xóa câu hỏi:** `POST /questions`, `PATCH /questions/:id`, `DELETE /questions/:id`

### Approval Workflow & Audit Logs
- **Tạo yêu cầu duyệt:** `POST /approvalRequests`
  - Payload: `{ id, contentType, contentId, teacherId, status: "pending", reason: "", createdAt }`
- **Lấy lịch sử duyệt:** `GET /approvalRequests?teacherId={teacherId}`
- **Ghi nhận lịch sử hoạt động:** `POST /auditLogs`
  - Payload: `{ id, action, userId, details, timestamp }`

---

## 6. Data Models & DB Schema (Cấu trúc trong `db.json`)

### Bổ dung các mảng sau vào `db.json`:
- `approvalRequests`: Quản lý yêu cầu duyệt khóa học giữa Giáo viên và Admin.
- `auditLogs`: Ghi nhận nhật ký thao tác trên hệ thống.

### Quy tắc quan hệ (Client-side Relationships):
- Để thuận tiện cho việc kiểm tra quyền và hiển thị trên giao diện của Teacher, các tài nguyên cấp dưới (`lessons`, `tests`, `questions`) nên được lưu kèm trường `teacherId` khi tạo mới để tránh các bước join phức tạp trên Client.

---

## 7. Non-Functional Requirements (Thiết kế phù hợp đồ án)

- **UX/UI mượt mà:** Sử dụng Bootstrap 5 cho bố cục lưới và các component như Card, Badge, Modal, Form Controls.
- **Phản hồi tức thì:** Có loading state (spinner) khi gửi yêu cầu lên Mock Server và Toast thông báo trạng thái thành công/thất bại trực quan.
- **Client-side Routing:** Định tuyến bằng React Router DOM, bảo vệ các URL với Route Guard.
- **Form Validation:** Sử dụng React Hook Form kết hợp schema Zod để kiểm tra tính hợp lệ của dữ liệu trước khi gửi đi.

---

## 8. Error Handling Matrix (Xử lý phía Client)

| Lỗi / Ngữ cảnh | Cách xử lý trên giao diện | Thông báo phía người dùng |
|---|---|---|
| Form nhập liệu sai định dạng | Đỏ viền input, hiển thị text lỗi phía dưới | "Tiêu đề không được để trống", "Giá phải là số dương"... |
| Gửi duyệt bài test rỗng | Vô hiệu hóa nút Submit, hiển thị cảnh báo dạng Alert | "Bài kiểm tra phải chứa ít nhất 1 câu hỏi có đáp án trước khi gửi duyệt." |
| Sai quyền sở hữu khóa học | Chuyển hướng người dùng về trang lỗi | Hiển thị trang lỗi `/403` - Bạn không có quyền chỉnh sửa. |
| Mất kết nối tới mock server | Hiển thị Toast thông báo lỗi hệ thống | "Không thể kết nối đến máy chủ. Vui lòng thử lại sau." |

---

## 9. Edge Cases (Các trường hợp đặc biệt)

- **Ngăn chặn sửa chéo:** Nếu Giáo viên thay đổi ID trên URL thành ID khóa học của giáo viên khác, trang chi tiết sẽ kiểm tra `course.teacherId` với `currentUser.id`. Nếu không trùng khớp, chặn render và chuyển hướng về `/403`.
- **Khóa chỉnh sửa khi đang chờ duyệt:** Khi khóa học có `status: 'pending'`, các nút Edit/Delete sẽ bị vô hiệu hóa (disabled) để tránh thay đổi dữ liệu trong quá trình Admin đang xem xét.
- **Xóa Cascade:** Khi xóa một khóa học dạng draft, ứng dụng React sẽ thực hiện xóa tuần tự (hoặc song song) các `lessons` và `tests` liên kết với khóa học đó trong cơ sở dữ liệu giả lập để dọn sạch rác.

---

## 10. Quyết định thiết kế đã thống nhất (Resolved Questions)

* **Q1: Giáo viên có thể tự xuất bản khóa học mà không cần Admin duyệt không?**
  - *Trả lời:* Không. Để demo đúng luồng nghiệp vụ phân vai (Multi-actor Flow) trước hội đồng bảo vệ, mọi khóa học đều bắt buộc đi qua luồng duyệt. Giáo viên tạo xong -> gửi duyệt -> đăng nhập tài khoản Admin duyệt -> học sinh mới nhìn thấy.
* **Q2: Cơ chế xóa khóa học đã được duyệt (Approved Course)?**
  - *Trả lời:* Để bảo đảm tính nhất quán dữ liệu của học viên đã đăng ký học, Giáo viên không được tự ý xóa các khóa học đã được Approved. Chỉ cho phép Giáo viên thực hiện thao tác xóa cứng đối với khóa học ở trạng thái `Draft` hoặc `Rejected`.
* **Q3: Có hỗ trợ đồng biên tập giữa nhiều Giáo viên trên một khóa học không?**
  - *Trả lời:* Không. Mỗi khóa học chỉ thuộc sở hữu duy nhất của Giáo viên tạo ra nó (`teacherId`). Việc đồng sở hữu nằm ngoài phạm vi môn học FER202.
* **Q4: Đơn vị gửi duyệt là gì?**
  - *Trả lời:* Gửi duyệt theo từng khóa học lớn (Course-level submission). Khi khóa học được gửi duyệt, Admin sẽ xem xét tổng thể toàn bộ các bài học (Lessons) và bài kiểm tra (Tests) bên trong khóa học đó.
