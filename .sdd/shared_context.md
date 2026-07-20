# shared_context.md — Bối cảnh chung dự án

---

## 1. Thông tin dự án

- **Tên:** IELTS Online Learning Website
- **Môn học:** FER202 — Frontend with ReactJS
- **Stack:** ReactJS (CRA), React Router DOM, Axios, JSON-Server, Redux Toolkit, Bootstrap/React-Bootstrap, React Hook Form + Zod, Recharts

---

## 2. Mục tiêu

Xây dựng website học IELTS trực tuyến giúp:
- Giảm chi phí học IELTS.
- Cung cấp lộ trình học cá nhân hóa.
- Cung cấp quiz/test tương tác.
- Cung cấp flashcard từ vựng.
- Phản hồi tức thì sau khi làm bài.

---

## 3. Actors

| Actor | Mô tả |
|---|---|
| **Guest** | Khách chưa đăng nhập, xem public pages |
| **Student** | Học viên đã đăng ký, học course, làm test |
| **Teacher** | Giảng viên, tạo/quản lý nội dung |
| **Admin** | Quản trị viên, approve/reject, quản lý hệ thống |

---

## 4. Problem Statement

- Chi phí học IELTS tại trung tâm cao (10-30 triệu VND).
- Thiếu lộ trình học cá nhân hóa theo trình độ.
- Thiếu hệ thống quiz/test tương tác trực tuyến.
- Thiếu flashcard từ vựng theo chủ đề IELTS.
- Thiếu phản hồi tức thì sau khi làm bài kiểm tra.

---

## 5. Feature List

| # | Feature | Mô tả ngắn |
|---|---|---|
| 1 | Auth & Users | Đăng ký, đăng nhập, quản lý profile, phân quyền |
| 2 | Public Course Discovery | Homepage, course list, course detail preview |
| 3 | Course Learning | Học course, xem lesson, tracking progress |
| 4 | Practice Test / Quiz | Làm test, chấm điểm, review kết quả |
| 5 | Flashcards | Flashcard từ vựng theo chủ đề |
| 6 | Student Dashboard | Dashboard cá nhân, lịch sử học, thống kê |
| 7 | Teacher Content Management | CRUD course, lesson, test, question |
| 8 | Admin Management | Approve/reject content, quản lý users |
| 9 | Mock Payment | Thanh toán mock, lịch sử giao dịch |
| 10 | Shared UI / API | Components chung, axios instance, layout |

---

## 6. Route tổng quan

### Guest: `/`, `/courses`, `/courses/:id`
### Auth: `/login`, `/register`, `/forgot-password`
### Student: `/learning/dashboard`, `/learning/courses`, `/learning/lessons/:id`, `/learning/profile`
### Teacher: `/teacher/dashboard`, `/teacher/courses`
### Admin: `/admin/dashboard`, `/admin/users`
### Error: `/403`, `/404`

---

## 7. Mock DB Collections dự kiến (`db.json`)

| Collection | Mô tả |
|---|---|
| `users` | Thông tin user (id, name, email, role...) |
| `roles` | Danh sách role nếu cần tách riêng |
| `courses` | Khóa học (title, skill, level, description, teacherId, price...) |
| `lessons` | Bài học thuộc course (courseId, title, order, duration...) |
| `tests` | Bài test thuộc course (courseId, skill, totalQuestions...) |
| `questions` | Câu hỏi thuộc test (testId, type, questionText, options, answer...) |
| `testAttempts` | Lịch sử làm bài test (userId, testId, score, answers...) |
| `flashcards` | Flashcard từ vựng (word, meaning, example, category...) |
| `enrollments` | Đăng ký khóa học (userId, courseId, status, progress...) |
| `lessonProgress` | Tiến độ học lesson (userId, lessonId, completed...) |
| `payments` | Thanh toán (userId, courseId, amount, status...) |
| `transactions` | Chi tiết giao dịch nếu cần |
| `approvalRequests` | Yêu cầu duyệt content từ teacher |
| `blogs` | Bài viết blog nếu có |
| `skills` | Danh sách skill IELTS (Reading, Listening, Writing, Speaking) |
| `levels` | Danh sách level (Beginner, Intermediate, Advanced) |
| `categories` | Danh mục khóa học |

> **Lưu ý:** Hiện tại `db.json` chỉ có: users, courses, lessons, tests, questions, enrollments, payments. Các collection khác sẽ bổ sung khi cần.

---

## 8. Luồng chính (Main Flows)

### Guest Flow
```
Guest truy cập → Xem HomePage → Xem Courses → Xem Course Detail → Click Login/Register
```

### Student Flow
```
Student login → Dashboard → Chọn Course → Học Lesson → Làm Test → Review Result
```

### Teacher Flow
```
Teacher login → Dashboard → Tạo Course/Lesson/Test → Gửi Approval Request
```

### Admin Flow
```
Admin login → Dashboard → Approve/Reject Content → Manage Users/Courses
```

---

## 9. Trạng thái hiện tại

- ✅ Project đã được khởi tạo với CRA.
- ✅ Dependencies đã cài (React Router, Axios, Bootstrap, Redux Toolkit...).
- ✅ `db.json` có dữ liệu mock cơ bản.
- ✅ `AppRoutes.jsx` đã define routes cho Guest, Student, Teacher, Admin.
- ✅ `DESIGN.md` đã có design system hoàn chỉnh.
- ⏳ **Hiện tại chỉ triển khai tài liệu chi tiết cho feature Guest/Public Discovery.**
- ⏳ Các feature khác chỉ có placeholder, chờ thành viên phụ trách bổ sung.
