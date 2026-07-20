# CLAUDE.md - Luật làm việc dành riêng cho Claude
# Dự án: IELTS Online Learning Website | FER202 - FPT University

> File này quy định cách Claude AI làm việc với dự án **IELTS Online Learning Website**.
> Claude cần ưu tiên frontend React vì đây là đồ án môn **FER202 - Front-End with ReactJS**.

---

## TL;DR

- Trả lời bằng tiếng Việt.
- Dự án này là ReactJS + CRA, không phải full-stack production.
- Frontend chiếm trọng tâm khoảng 70%: UI, component, routing, form, state, responsive, demo flow.
- Backend chỉ là JSON Server với `db.json`; không tạo backend/database thật.
- Bám `DESIGN.md`, Bootstrap 5, React-Bootstrap và route trong `AppRoutes.jsx`.
- Code phải dễ đọc, dễ bảo vệ trước giảng viên, không over-engineering.

---

## 1. Ngôn ngữ và cách trả lời

- Claude phải trả lời bằng tiếng Việt.
- Tên file, tên component, tên biến và function vẫn dùng tiếng Anh theo convention React.
- Giải thích ngắn gọn, thẳng vào việc, phù hợp với sinh viên FER202.
- Khi đưa ra code, nếu cần thì giải thích lý do chọn cách tiếp cận, không chỉ liệt kê thao tác.
- Nếu yêu cầu mơ hồ và có rủi ro sửa sai scope, hỏi lại trước khi làm.

---

## 2. Kiến trúc hệ thống

| Phân hệ | Công nghệ | Mô tả | Thư mục |
|---|---|---|---|
| frontend-web | ReactJS CRA | Giao diện cho Guest, Student, Teacher, Admin | `src/` |
| mock-api | JSON Server | REST API giả lập bằng mock data | `db.json` |
| sdd-docs | Markdown | Tài liệu feature, plan, task và rule | `.sdd/`, `.agent/` |

Không có backend Node/Express, không có database thật, không có AI grading thật, không có payment gateway thật.

---

## 3. Quy trình bắt buộc khi được yêu cầu code

Claude cần đọc theo thứ tự:

1. `.agent/AGENTS.md` - Quy tắc chung.
2. `.sdd/shared_context.md` - Bối cảnh dự án.
3. `.sdd/constitution.md` - Ràng buộc FER202.
4. `DESIGN.md` - Design system, không tự ý sửa.
5. `.sdd/.spec/<feature>/CONTEXT.md` - Scope feature nếu có.
6. `.sdd/.spec/<feature>/SPEC.md` - Yêu cầu chi tiết nếu có.
7. `.sdd/.spec/<feature>/PLAN.md` - Kế hoạch nếu có.
8. `.sdd/.spec/<feature>/TASKS.md` - Checklist nếu có.
9. `src/routes/AppRoutes.jsx` - Kiểm tra route liên quan.
10. File component/page/service hiện có liên quan đến feature.

Nếu feature chưa có đầy đủ tài liệu SDD, Claude được tạo hoặc đề xuất bổ sung tài liệu khi việc đó cần thiết cho scope.

---

## 4. Claude phải làm

- Ưu tiên hoàn thiện giao diện và trải nghiệm demo trước.
- Giữ component nhỏ, rõ trách nhiệm, dễ tái sử dụng.
- Dùng Bootstrap class cho layout chính; CSS riêng chỉ bổ sung style theo `DESIGN.md`.
- Xử lý responsive cho mobile/tablet/desktop.
- Thêm loading, empty state, validation và feedback khi màn hình có data/form.
- Dùng Axios/service layer khi gọi JSON Server thay vì viết fetch lung tung trong nhiều component.
- Giữ route theo `AppRoutes.jsx`; nếu thêm route mới phải có lý do rõ.
- Cập nhật `.sdd/agents_changelog.md` khi sửa/tạo file có ảnh hưởng đến code, mock data, route hoặc tài liệu.
- Chạy build/test hợp lý sau khi sửa code nếu có thể.

---

## 5. Claude không được làm

- Không tạo backend Express, database, ORM, Firebase hoặc API production.
- Không đổi CRA sang Vite/Next.js.
- Không sửa `DESIGN.md` nếu người dùng không yêu cầu rõ.
- Không tự ý xóa file, reset git, hoặc đổi cấu trúc lớn của repo.
- Không hardcode secret, token, password, API key.
- Không viết logic thanh toán thật; payment chỉ là mock UI/mock data.
- Không tạo component không cần thiết hoặc pattern phức tạp khó giải thích.
- Không làm sai mục tiêu môn FER202 bằng cách đẩy quá nhiều công việc sang backend.

---

## 6. Route cần giữ ổn định

| Prefix | Actor | Route quan trọng |
|---|---|---|
| `/` | Guest/Public | `/`, `/courses`, `/courses/:id` |
| `/login`, `/register` | Auth | `/login`, `/register`, `/forgot-password` |
| `/learning/*` | Student | `/learning/dashboard`, `/learning/courses`, `/learning/lessons/:id`, `/learning/profile` |
| `/teacher/*` | Teacher | `/teacher/dashboard`, `/teacher/courses` |
| `/admin/*` | Admin | `/admin/dashboard`, `/admin/users` |
| error | System | `/403`, `/404` |

Route trong bảng là contract tham khảo từ `.sdd/constitution.md`. Khi code, ưu tiên kiểm tra `src/routes/AppRoutes.jsx` vì đó là source thực thi hiện tại.

---

## 7. Patterns nên dùng

### Component pattern

```jsx
function CourseCard({ course, onViewDetail }) {
  return (
    <article className="card h-100">
      <div className="card-body">
        <h3 className="h5">{course.title}</h3>
        <p className="text-muted">{course.description}</p>
        <button className="btn btn-primary" onClick={() => onViewDetail(course.id)}>
          View detail
        </button>
      </div>
    </article>
  );
}
```

### Service pattern

```js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export async function getCourses() {
  const response = await axios.get(`${API_URL}/courses`);
  return response.data;
}
```

### Tránh god component

```jsx
// Không nên gom cả data fetching, validation, table, modal, filter và chart
// vào một component dài hàng trăm dòng nếu có thể tách nhỏ.
function CourseManagementPage() {
  return null;
}
```

---

## 8. Khi không chắc chắn

Nếu không chắc về:
- Scope feature: đọc `.sdd/.spec/<feature>/` hoặc hỏi người dùng.
- Design: đọc `DESIGN.md`.
- Route: đọc `src/routes/AppRoutes.jsx` và `.sdd/constitution.md`.
- Data structure: đọc `db.json` và `.sdd/shared_context.md`.
- Mức độ phức tạp: chọn cách đơn giản, dễ demo và dễ giải thích.

Nguyên tắc: **Frontend rõ ràng, mock backend vừa đủ, code dễ bảo vệ.**
