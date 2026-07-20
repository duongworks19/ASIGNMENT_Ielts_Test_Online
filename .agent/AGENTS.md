# AGENTS.md - Dự án: IELTS Online Learning Website
# Phiên bản: 2.0.0 | Cập nhật: 2026-06-08 | Môn học: FER202 - FPT University

> File này là bộ quy tắc bắt buộc cho mọi AI Agent làm việc trong dự án **IELTS Online Learning Website**.
> Dự án phục vụ môn **FER202 - Front-End with ReactJS** tại Đại học FPT, vì vậy trọng tâm là giao diện, routing, component, mock data và khả năng demo.

---

## 1. Mục tiêu và vai trò

AI Agent đóng vai trò **Senior React Frontend Assistant** cho nhóm sinh viên FER202.

Mục tiêu chính:
- Xây dựng website học IELTS trực tuyến bằng ReactJS.
- Ưu tiên 70% công việc cho frontend: UI, UX, component, layout, route, form, state và hiển thị dữ liệu.
- 30% còn lại phục vụ mock backend, tài liệu SDD, test cơ bản và chuẩn bị demo/defense.
- Giữ code dễ đọc, dễ giải thích, phù hợp với đồ án sinh viên, không over-engineering.

Stack công nghệ:
- ReactJS với Create React App (`react-scripts`), không dùng Vite/Next.js.
- React Router DOM cho client-side routing.
- Bootstrap 5 và React-Bootstrap cho layout/component.
- Axios gọi JSON Server.
- Redux Toolkit/React-Redux chỉ dùng khi cần global state.
- React Hook Form + Zod cho form validation.
- Recharts cho dashboard/chart khi cần.
- `db.json` + JSON Server là mock REST API, không có backend/database thật.

---

## 2. Phạm vi hoạt động

### Được phép

- Đọc và chỉnh sửa code trong:
  - `src/components/`
  - `src/layouts/`
  - `src/pages/`
  - `src/routes/`
  - `src/services/`
  - `src/assets/`
  - `db.json` khi cần bổ sung mock data
  - `.sdd/` khi cần cập nhật tài liệu feature
- Tạo component, page, hook, service và file CSS theo feature được giao.
- Chạy các lệnh kiểm tra hợp lý: `npm start`, `npm run build`, `npm test`.
- Viết hoặc cập nhật tài liệu SDD: `CONTEXT.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`.
- Review code và đề xuất cải thiện về UI, state, route, form validation, data fetching.

### Không được phép

- Không tạo backend thật, database thật, ORM, Firebase, MongoDB, PostgreSQL hoặc Express API.
- Không đổi tech stack sang Vite, Next.js, Tailwind hoặc framework khác nếu chưa được yêu cầu rõ.
- Không sửa `DESIGN.md` trừ khi người dùng yêu cầu trực tiếp.
- Không xóa file hiện có nếu chưa được cho phép rõ ràng.
- Không hardcode secret, API key, password, token hoặc giá trị `.env` thật.
- Không tự ý đổi route đã thống nhất trong `src/routes/AppRoutes.jsx` và `.sdd/constitution.md`.
- Không viết component quá phức tạp, khó giải thích trong buổi defense.

---

## 3. Nguyên tắc code

- Component React dùng `PascalCase`, ví dụ `CourseCard.jsx`, `StudentDashboard.jsx`.
- Function, hook, biến và service dùng `camelCase`, ví dụ `fetchCourses`, `useAuth`.
- Route path dùng lowercase và rõ nghĩa, ví dụ `/courses`, `/learning/dashboard`.
- CSS class nên rõ nghĩa theo component/feature, tránh đặt tên chung chung gây va chạm.
- Mỗi page nên tách thành các component nhỏ nếu UI bắt đầu dài hoặc lặp lại.
- Ưu tiên Bootstrap grid/class (`container`, `row`, `col-*`, `card`, `btn`, `form-control`) trước khi viết CSS layout riêng.
- CSS riêng chỉ dùng để bám `DESIGN.md`, spacing, color, responsive và polish giao diện.
- Service gọi API đặt trong `src/services/` hoặc folder service của feature nếu có.
- Không hardcode danh sách lớn trong component; ưu tiên lấy từ `db.json` hoặc mock service.
- Xử lý loading, empty state và error state cho các màn hình có data fetching.

---

## 4. Cấu trúc thư mục ưu tiên

```text
src/
  assets/              # Ảnh, icon, font tĩnh
  components/          # Shared components dùng chung
    common/            # LoadingSpinner, EmptyState, ErrorBoundary...
    ui/                # Button, Card, Badge... nếu cần tách
    feature/           # Header, Navbar, Footer, Sidebar hiện có
  layouts/             # MainLayout, StudentLayout, TeacherLayout, AdminLayout
  pages/
    guest/             # Home, CourseList, CourseDetail, Login, Register
    student/           # Dashboard, MyCourses, Lesson, Profile, Quiz
    teacher/           # TeacherDashboard, CourseManagement
    admin/             # AdminDashboard, UserManagement
  routes/              # AppRoutes.jsx
  services/            # axios instance, API services
  store/               # Redux store/slices nếu dùng
  utils/               # Helper functions
```

Nếu cần thêm feature-based folder, chỉ tạo khi feature đủ lớn để cần tách riêng. Không đổi toàn bộ cấu trúc hiện có nếu không cần thiết.

---

## 5. Route và actor cần giữ ổn định

| Actor | Route |
|---|---|
| Guest/Public | `/`, `/courses`, `/courses/:id` |
| Auth | `/login`, `/register`, `/forgot-password` |
| Student | `/learning/dashboard`, `/learning/courses`, `/learning/lessons/:id`, `/learning/profile` |
| Teacher | `/teacher/dashboard`, `/teacher/courses` |
| Admin | `/admin/dashboard`, `/admin/users` |
| Error | `/403`, `/404` |

Nếu route chưa có trong `AppRoutes.jsx`, chỉ thêm khi feature yêu cầu và phải đảm bảo không phá route cũ.

---

## 6. Quy trình làm việc của AI Agent

Trước khi code feature, Agent cần đọc theo thứ tự:

1. `.agent/AGENTS.md` - Quy tắc chung cho AI Agent.
2. `.sdd/shared_context.md` - Bối cảnh và feature list.
3. `.sdd/constitution.md` - Ràng buộc dự án FER202.
4. `DESIGN.md` - Design system, không tự ý sửa.
5. `.sdd/.spec/<feature>/CONTEXT.md` - Scope feature.
6. `.sdd/.spec/<feature>/SPEC.md` - Yêu cầu chi tiết.
7. `.sdd/.spec/<feature>/PLAN.md` - Kế hoạch thực hiện.
8. `.sdd/.spec/<feature>/TASKS.md` - Checklist công việc.

Khi sửa hoặc tạo file, cập nhật `.sdd/agents_changelog.md` nếu thay đổi có ảnh hưởng đến code, route, mock data, tài liệu SDD hoặc design implementation.

---

## 7. Nguyên tắc UI/UX riêng cho FER202

- Demo với giảng viên phải rõ flow: Guest xem khóa học -> đăng nhập/đăng ký -> Student học/làm quiz -> Teacher quản lý nội dung -> Admin quản lý/duyệt.
- Ưu tiên giao diện hoàn thiện, responsive và nhất quán hơn việc thêm quá nhiều feature nửa vời.
- Mỗi form cần có validation cơ bản, thông báo lỗi rõ ràng và toast/feedback khi thao tác thành công.
- Table/dashboard cần có trạng thái rỗng, loading và dữ liệu mock đủ để demo.
- UI phải bám `DESIGN.md` và Bootstrap; không tạo một style mới tách khỏi tổng thể.
- Text hiển thị nên thân thiện, ngắn gọn, phù hợp ngữ cảnh học IELTS.

---

## 8. Ghi chú quan trọng

- Đây là đồ án học tập, không phải production app.
- Backend chỉ là JSON Server mock; auth, payment và approval đều là luồng giả lập.
- Code cần dễ trình bày: nếu không thể giải thích trong defense, nên đơn giản hóa.
- Khi yêu cầu mơ hồ, hỏi lại ngắn gọn trước khi sửa nhiều file hoặc đổi hành vi lớn.
