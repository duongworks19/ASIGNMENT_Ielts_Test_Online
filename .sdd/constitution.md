# constitution.md — Ràng buộc chung của dự án

> Mọi thành viên và AI Agent đều phải tuân thủ file này.

---

## 1. Bản chất dự án

- Đây là **đồ án môn FER (Frontend with ReactJS)**, không phải production app.
- Ưu tiên: **Chất lượng demo > Số lượng feature**.

---

## 2. Ràng buộc kỹ thuật

- **KHÔNG dùng backend thật.** Dùng JSON-Server làm mock API (`db.json`).
- **KHÔNG dùng database thật.** Không MongoDB, PostgreSQL, Firebase.
- **Dùng ReactJS** với Create React App. **KHÔNG dùng Next.js, KHÔNG dùng Vite.**
- **KHÔNG tự đổi design** trong `DESIGN.md`. Mọi UI bám theo DESIGN.md.
- **Auth chỉ là mock** — localStorage hoặc Redux Toolkit.
- **Payment chỉ là mock UI** — không tích hợp cổng thanh toán thật.

---

## 3. Actors

| Actor | Route prefix |
|---|---|
| Guest | `/` |
| Student | `/learning/*` |
| Teacher | `/teacher/*` |
| Admin | `/admin/*` |

---

## 4. Route

### Guest/Public
- `/` — HomePage
- `/courses` — CourseListPage
- `/courses/:id` — CourseDetailPreviewPage

### Auth
- `/login`, `/register`, `/forgot-password`

### Student
- `/learning/dashboard`, `/learning/courses`, `/learning/lessons/:id`, `/learning/profile`

### Teacher
- `/teacher/dashboard`, `/teacher/courses`

### Admin
- `/admin/dashboard`, `/admin/users`

### Error
- `/403` — ForbiddenPage
- `/404` — NotFoundPage

---

## 5. Quy tắc phân chia

- Mỗi feature phải có: `CONTEXT.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`.
- **Không sửa lung tung feature của người khác.**
- Mọi thay đổi lớn ghi vào `agents_changelog.md`.

---

## 6. Quy tắc code

- Component nhỏ, dễ tái sử dụng.
- Không hardcode dữ liệu lớn, secret, API key.
- Code phải dễ giải thích trong buổi defense.
- Không over-engineering.

---

## 7. Feature list

| # | Feature | Folder |
|---|---|---|
| 1 | Auth & Users | `feature-auth-and-users` |
| 2 | Public Discovery | `feature-public-discovery` |
| 3 | Course Learning | `feature-course-learning` |
| 4 | Practice Test / Quiz | `feature-practice-test-quiz` |
| 5 | Flashcards | `feature-flashcards` |
| 6 | Student Dashboard | `feature-student-dashboard-history` |
| 7 | Teacher Management | `feature-teacher-content-management` |
| 8 | Admin Management | `feature-admin-management-approval` |
| 9 | Mock Payment | `feature-mock-payment-transactions` |
| 10 | Shared UI / API | `feature-shared-ui-api-infrastructure` |
