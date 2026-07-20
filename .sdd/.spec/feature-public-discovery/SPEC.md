# SPEC.md — Feature: Public Discovery / Guest Homepage

---

## 1. Feature Summary

Feature **Public Discovery** cung cấp trải nghiệm duyệt web cho Guest (khách chưa đăng nhập). Guest có thể xem trang chủ, duyệt danh sách khóa học IELTS, tìm kiếm/lọc khóa học, xem chi tiết preview khóa học, và được điều hướng đến đăng ký/đăng nhập thông qua các CTA.

---

## 2. Actor

**Guest** — Người dùng chưa có tài khoản hoặc chưa đăng nhập.

---

## 3. User Stories

### US-GUEST-01: Xem trang chủ
> Là Guest, tôi muốn xem trang chủ để hiểu website IELTS Online Learning cung cấp những gì.

**Acceptance Criteria:**
- Guest truy cập `/` thấy hero section với headline và CTA.
- Có section giới thiệu 4 kỹ năng IELTS.
- Có section featured courses.
- Có section lợi ích (Why Choose Us).
- Có footer.

### US-GUEST-02: Xem danh sách khóa học
> Là Guest, tôi muốn xem danh sách khóa học IELTS để chọn khóa học phù hợp.

**Acceptance Criteria:**
- Guest truy cập `/courses` thấy danh sách khóa học dạng card grid.
- Mỗi card hiển thị: title, skill, level, description ngắn, giá.
- Có pagination nếu nhiều courses.

### US-GUEST-03: Search khóa học
> Là Guest, tôi muốn search khóa học theo tên để tìm nhanh nội dung mình cần.

**Acceptance Criteria:**
- Có ô search trên trang `/courses`.
- Gõ từ khóa → danh sách filter theo title.
- Xóa từ khóa → hiển thị lại toàn bộ.

### US-GUEST-04: Filter khóa học
> Là Guest, tôi muốn filter khóa học theo skill (Reading, Listening, Writing, Speaking) và level (Beginner, Intermediate, Advanced) để chọn đúng trình độ.

**Acceptance Criteria:**
- Có dropdown/button group filter theo skill.
- Có dropdown/button group filter theo level.
- Kết hợp search + filter hoạt động đúng.
- Reset filter trở về danh sách đầy đủ.

### US-GUEST-05: Xem preview chi tiết khóa học
> Là Guest, tôi muốn xem preview chi tiết khóa học để biết mô tả, syllabus, instructor, số bài học và level.

**Acceptance Criteria:**
- Guest click vào CourseCard → chuyển đến `/courses/:id`.
- Hiển thị: title, description đầy đủ, skill, level, duration, price.
- Hiển thị danh sách lessons (syllabus preview).
- Hiển thị thông tin instructor.
- Có CTA Enroll/Login/Register.

### US-GUEST-06: Điều hướng Register/Login
> Là Guest, tôi muốn bấm Register/Login từ các CTA để bắt đầu học.

**Acceptance Criteria:**
- CTA "Đăng ký" dẫn đến `/register`.
- CTA "Đăng nhập" dẫn đến `/login`.
- Nút "Enroll" trên course detail → redirect `/login` (vì chưa đăng nhập).

---

## 4. Functional Requirements

### FR-PUBLIC-01: Home Page
- Hiển thị hero section với headline, sub-headline, CTA "Get Started".
- Hiển thị section 4 kỹ năng IELTS (Reading, Listening, Writing, Speaking).
- Hiển thị featured courses (3-4 courses nổi bật từ API).
- Hiển thị "Why Choose Us" section (3-4 lợi ích).
- Hiển thị practice test preview section (giới thiệu, CTA).
- Hiển thị flashcard/vocabulary intro section.
- Hiển thị statistics section (số liệu mock: students, courses, tests).
- Hiển thị CTA section cuối ("Bắt đầu học ngay").
- Hiển thị footer với links và copyright.

### FR-PUBLIC-02: Course List
- Hiển thị danh sách khóa học public dạng grid.
- Mỗi course hiển thị bằng **CourseCard** (title, skill badge, level badge, description, price).
- Có **SearchBar** — search theo title (client-side filter hoặc query param).
- Có **FilterBar** — filter theo skill (Reading/Listening/Writing/Speaking).
- Có **FilterBar** — filter theo level (Beginner/Intermediate/Advanced).
- Có **Pagination** — phân trang nếu courses > 1 page (6-9 courses/page).
- Có **EmptyState** — hiển thị khi không có kết quả phù hợp.
- Có **LoadingSpinner** — hiển thị khi đang fetch data.
- Có **ErrorState** — hiển thị khi API lỗi.

### FR-PUBLIC-03: Course Detail Preview
- Hiển thị đầy đủ thông tin course: title, description, skill, level, duration, price/free.
- Hiển thị **syllabus/lessons preview** — danh sách lesson theo order (title, duration).
- Hiển thị **instructor info** — tên teacher từ `users` collection.
- Có CTA **"Enroll Now"** / **"Login to Enroll"** / **"Register"**.
- Nếu Guest chưa login mà bấm Enroll → điều hướng `/login` hoặc `/register`.
- Hiển thị **breadcrumb**: Home > Courses > [Course Title].

### FR-PUBLIC-04: Navigation
- **Navbar** chứa: Logo (click → `/`), Home, Courses, Tests (nếu có), Login, Register.
- **Logo** click → về trang chủ `/`.
- **Route không tồn tại** → hiển thị trang 404.
- Navbar responsive: hamburger menu trên mobile.

### FR-PUBLIC-05: API Mock (JSON-Server)
- `GET /courses` — Lấy tất cả khóa học.
- `GET /courses/:id` — Lấy chi tiết một khóa học.
- `GET /lessons?courseId={courseId}` — Lấy danh sách lesson theo course.
- `GET /tests` — Lấy danh sách test public (nếu có preview).
- `GET /users/:id` — Lấy thông tin instructor (teacher).

---

## 5. Non-functional Requirements

| Yêu cầu | Mô tả |
|---|---|
| **Responsive** | Hoạt động tốt trên mobile (< 640px), tablet (640-1024px), desktop (> 1024px) |
| **Performance** | Page load nhanh, không fetch dữ liệu thừa |
| **UX** | UI dễ hiểu, navigation rõ ràng, CTA nổi bật |
| **No Auth Required** | Tất cả public pages không yêu cầu login |
| **Reusable** | Components tái sử dụng (CourseCard, Pagination, EmptyState...) |
| **No Hardcode** | Không hardcode dữ liệu lớn, lấy từ mock service/db.json |
| **Design Compliance** | UI bám theo DESIGN.md (colors, typography, spacing, rounded) |

---

## 6. Acceptance Criteria (Tổng hợp)

- [ ] Guest mở `/` thấy homepage đầy đủ sections.
- [ ] Guest click "Courses" trên navbar → chuyển đến `/courses`.
- [ ] Guest search course theo tên → danh sách thay đổi.
- [ ] Guest filter theo skill → danh sách thay đổi.
- [ ] Guest filter theo level → danh sách thay đổi.
- [ ] Guest kết hợp search + filter → hoạt động đúng.
- [ ] Guest click CourseCard → chuyển đến `/courses/:id`.
- [ ] Guest thấy preview khóa học (title, description, syllabus, instructor).
- [ ] Guest click "Register" → chuyển đến `/register`.
- [ ] Guest click "Login" → chuyển đến `/login`.
- [ ] Guest click "Enroll" khi chưa login → redirect `/login`.
- [ ] Khi không có course phù hợp → hiển thị empty state.
- [ ] Khi API loading → hiển thị loading spinner.
- [ ] Khi API lỗi → hiển thị error message.
- [ ] Giao diện không vỡ trên mobile.
- [ ] UI tuân theo DESIGN.md.

---

## 7. Edge Cases

| Case | Xử lý |
|---|---|
| Không có courses trong db.json | Hiển thị EmptyState "Chưa có khóa học nào" |
| Course ID không tồn tại | Hiển thị 404 hoặc "Khóa học không tồn tại" |
| API lỗi (JSON-Server down) | Hiển thị ErrorState "Không thể tải dữ liệu" + nút Retry |
| Search không có kết quả | Hiển thị EmptyState "Không tìm thấy khóa học phù hợp" |
| Filter không có kết quả | Hiển thị EmptyState + gợi ý xóa filter |
| Guest cố enroll khi chưa login | Redirect đến `/login` với message |
| Ảnh course bị thiếu/lỗi | Hiển thị placeholder image |
| Description quá dài | Truncate với "..." trên CourseCard, hiển thị đầy đủ trên Detail |
| Title quá dài | Truncate trên card, hiển thị đầy đủ trên Detail |

---

## 8. Suggested Components

> Chỉ liệt kê tên — không tạo code ở bước này.

### Shared (src/components/common/)
- `LoadingSpinner` — Spinner hiển thị khi loading
- `EmptyState` — Hiển thị khi không có data
- `ErrorState` — Hiển thị khi API lỗi
- `Pagination` — Phân trang chung

### Feature-specific (src/features/public-discovery/components/)
- `PublicNavbar` — Navbar cho public pages
- `HeroSection` — Hero banner trang chủ
- `SkillsSection` — 4 kỹ năng IELTS
- `FeaturedCourseSection` — Courses nổi bật
- `WhyChooseUsSection` — Lợi ích
- `PracticeTestPreview` — Preview test
- `FlashcardIntroSection` — Giới thiệu flashcard
- `StatisticsSection` — Số liệu mock
- `CTASection` — Call to action cuối trang
- `CourseCard` — Card hiển thị 1 course
- `CourseList` — Grid danh sách CourseCard
- `CourseFilterBar` — Filter theo skill/level
- `CourseSearchBar` — Ô search
- `CoursePreviewHeader` — Header trang course detail
- `CourseSyllabusPreview` — Danh sách lessons
- `Footer` — Footer chung

---

## 9. Suggested Folder Placement

```
src/
├── features/
│   └── public-discovery/
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── CourseListPage.jsx
│       │   └── CourseDetailPreviewPage.jsx
│       ├── components/
│       │   ├── HeroSection.jsx
│       │   ├── SkillsSection.jsx
│       │   ├── FeaturedCourseSection.jsx
│       │   ├── WhyChooseUsSection.jsx
│       │   ├── CTASection.jsx
│       │   ├── CourseCard.jsx
│       │   ├── CourseList.jsx
│       │   ├── CourseFilterBar.jsx
│       │   ├── CourseSearchBar.jsx
│       │   ├── CoursePreviewHeader.jsx
│       │   └── CourseSyllabusPreview.jsx
│       ├── hooks/
│       │   ├── useCourses.js
│       │   └── useCourseDetail.js
│       └── services/
│           └── publicCourseService.js
├── components/
│   └── common/
│       ├── LoadingSpinner.jsx
│       ├── EmptyState.jsx
│       ├── ErrorState.jsx
│       └── Pagination.jsx
└── layouts/
    └── PublicLayout.jsx
```
