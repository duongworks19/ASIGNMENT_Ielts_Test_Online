# PLAN.md — Feature: Public Discovery / Guest Homepage

---

## Phase 1: Documentation & Structure ✅
- [x] Tạo CONTEXT.md — mục tiêu, actor, scope.
- [x] Tạo SPEC.md — user stories, functional requirements, acceptance criteria.
- [x] Xác định routes: `/`, `/courses`, `/courses/:id`.
- [x] Xác định pages/components cần có.
- [x] Tạo PLAN.md (file này).
- [x] Tạo TASKS.md — checklist chi tiết.

---

## Phase 2: Static UI
Dựng giao diện tĩnh (hardcode data) theo DESIGN.md trước, chưa gọi API.

1. **Tạo PublicLayout** — layout wrapper cho public pages (Navbar + Outlet + Footer).
2. **Dựng HomePage tĩnh** — theo DESIGN.md:
   - HeroSection (headline, sub-headline, CTA).
   - SkillsSection (4 card IELTS skills).
   - FeaturedCourseSection (3-4 CourseCard mock).
   - WhyChooseUsSection (3-4 lợi ích).
   - PracticeTestPreview.
   - StatisticsSection.
   - CTASection.
3. **Dựng CourseListPage tĩnh** — grid CourseCard, SearchBar, FilterBar.
4. **Dựng CourseDetailPreviewPage tĩnh** — course info, syllabus, instructor, CTA.
5. **Dựng Navbar** — Logo, menu items, Login/Register buttons.
6. **Dựng Footer** — links, copyright.

---

## Phase 3: Mock Data Integration
Kết nối với JSON-Server để lấy dữ liệu thật từ db.json.

1. **Chuẩn bị db.json** — kiểm tra courses, lessons có đủ field không.
2. **Tạo axios instance** — base URL từ `.env` (`REACT_APP_API_BASE_URL`).
3. **Tạo `publicCourseService.js`**:
   - `getCourses()` → `GET /courses`
   - `getCourseById(id)` → `GET /courses/:id`
   - `getLessonsByCourseId(courseId)` → `GET /lessons?courseId={courseId}`
   - `getTeacherById(teacherId)` → `GET /users/:id`
4. **Tạo custom hooks**:
   - `useCourses()` — fetch + state management cho course list.
   - `useCourseDetail(id)` — fetch + state management cho course detail.
5. **Thay data mock bằng data từ API** trong các page.

---

## Phase 4: Interactions
Thêm tính năng tương tác.

1. **Search course** — filter theo title (client-side hoặc query param).
2. **Filter theo skill** — Reading / Listening / Writing / Speaking.
3. **Filter theo level** — Beginner / Intermediate / Advanced.
4. **Kết hợp search + filter** — hoạt động đồng thời.
5. **Pagination** — phân trang (6-9 courses/page).
6. **Loading state** — LoadingSpinner khi fetch.
7. **Error state** — ErrorState khi API lỗi + nút Retry.
8. **Empty state** — EmptyState khi không có kết quả.

---

## Phase 5: Navigation & Demo
Hoàn thiện điều hướng và chuẩn bị demo.

1. **Điều hướng** Home → Courses → Course Detail hoạt động mượt.
2. **CTA Login/Register** — dẫn đúng route.
3. **CTA Enroll** — redirect `/login` khi chưa đăng nhập.
4. **404 page** — route không tồn tại.
5. **Kiểm tra responsive** — mobile, tablet, desktop.
6. **Chuẩn bị script demo cho thầy**:
   - Mở `/` → Scroll qua các sections.
   - Click "Courses" → Xem danh sách.
   - Search "Reading" → Kết quả filter.
   - Click một course → Xem detail.
   - Click "Enroll" → Redirect login.
   - Resize → Responsive OK.

---

## Dependencies

| Dependency | Lý do | Trạng thái |
|---|---|---|
| PublicLayout | Layout wrapper cho tất cả public pages | Cần tạo |
| React Router DOM | Client-side routing | ✅ Đã cài |
| Axios | Gọi JSON-Server API | ✅ Đã cài |
| Bootstrap / React-Bootstrap | Grid, responsive utilities | ✅ Đã cài |
| Course mock data (db.json) | Data hiển thị | ✅ Có cơ bản |
| DESIGN.md | Design system reference | ✅ Có sẵn |
| Shared components | LoadingSpinner, EmptyState, Pagination | Cần tạo |

---

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Design không đồng nhất nếu không bám DESIGN.md | UI lộn xộn | Luôn tham khảo DESIGN.md khi code |
| Course data thiếu field (ảnh, rating...) | UI trống | Thêm field vào db.json hoặc dùng placeholder |
| Làm quá nhiều ngoài scope Guest | Hết thời gian | Chỉ làm 3 pages chính: Home, CourseList, CourseDetail |
| JSON-Server chậm | Demo lag | Test trước buổi demo, data nhỏ gọn |
| Responsive vỡ layout | Mất điểm UX | Test responsive từ Phase 2 |
