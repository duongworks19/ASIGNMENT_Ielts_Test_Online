# TASKS.md — Feature: Public Discovery / Guest Homepage

> Checklist chi tiết để implement feature Guest/Public Homepage.
> Đánh dấu `[x]` khi hoàn thành. Ghi ngày hoàn thành nếu cần.

---

## Milestone 1: Setup & Structure

- [ ] Kiểm tra DESIGN.md — hiểu color tokens, typography, spacing, rounded, components.
- [ ] Kiểm tra route public trong `AppRoutes.jsx` — đảm bảo `/`, `/courses`, `/courses/:id` đã có.
- [ ] Tạo folder `src/features/public-discovery/` nếu chưa có.
- [ ] Tạo folder `src/features/public-discovery/pages/`.
- [ ] Tạo folder `src/features/public-discovery/components/`.
- [ ] Tạo folder `src/features/public-discovery/services/`.
- [ ] Tạo folder `src/features/public-discovery/hooks/`.
- [ ] Tạo folder `src/components/common/` nếu chưa có.
- [ ] Kiểm tra `db.json` có đủ data courses, lessons.

---

## Milestone 2: HomePage (`/`)

- [ ] Tạo file `HomePage.jsx` trong `pages/`.
- [ ] Tạo `HeroSection.jsx` — headline lớn, sub-headline, CTA "Get Started" / "Sign Up Free".
  - Bám theo `hero-band-dark` hoặc `hero-band-light` trong DESIGN.md.
  - Font display-mega (80px) cho headline.
  - CTA dùng `button-pill-cta` (56px height, pill rounded).
- [ ] Tạo `SkillsSection.jsx` — 4 card cho Reading, Listening, Writing, Speaking.
  - Dùng `feature-card` component style.
- [ ] Tạo `FeaturedCourseSection.jsx` — hiển thị 3-4 CourseCard nổi bật.
  - Fetch từ API hoặc hardcode ban đầu.
- [ ] Tạo `WhyChooseUsSection.jsx` — 3-4 lợi ích chính.
  - Giá rẻ, cá nhân hóa, quiz tương tác, phản hồi tức thì.
- [ ] Tạo `PracticeTestPreview.jsx` — giới thiệu mock test + CTA (nếu cần).
- [ ] Tạo `FlashcardIntroSection.jsx` — giới thiệu tính năng flashcard (nếu cần).
- [ ] Tạo `StatisticsSection.jsx` — số liệu mock (VD: 500+ students, 20+ courses...).
- [ ] Tạo `CTASection.jsx` — CTA lớn cuối trang: "Bắt đầu học IELTS ngay".
  - Dùng `cta-band-dark` style.
- [ ] Tạo `Footer.jsx` nếu chưa có — links, copyright, contact.
  - Dùng `footer-light` style.
- [ ] Đảm bảo HomePage dùng `PublicLayout` (hoặc `MainLayout` hiện có).
- [ ] Kiểm tra responsive HomePage trên mobile/tablet/desktop.

---

## Milestone 3: Course List (`/courses`)

- [ ] Tạo file `CourseListPage.jsx` trong `pages/`.
- [ ] Tạo `CourseCard.jsx` — hiển thị 1 course.
  - Title, skill badge, level badge, description (truncated), price.
  - Dùng `feature-card` hoặc `product-ui-card-light` style.
  - Click → navigate `/courses/:id`.
- [ ] Tạo `CourseList.jsx` — grid chứa nhiều CourseCard.
  - Responsive grid: 3-up desktop, 2-up tablet, 1-up mobile.
- [ ] Tạo `CourseSearchBar.jsx` — ô search theo title.
  - Dùng `search-input-pill` style.
  - onChange filter danh sách (client-side).
- [ ] Tạo `CourseFilterBar.jsx` — filter theo skill và level.
  - Skill buttons/dropdown: All, Reading, Listening, Writing, Speaking.
  - Level buttons/dropdown: All, Beginner, Intermediate, Advanced.
  - Dùng `badge-pill` hoặc `button-secondary-light` style.
- [ ] Tạo `Pagination.jsx` (shared component) — phân trang.
  - 6-9 courses/page.
  - Prev/Next buttons + page numbers.
- [ ] Tạo `EmptyState.jsx` (shared) — khi không có courses hoặc không có kết quả.
  - Icon + message + gợi ý action.
- [ ] Tạo `LoadingSpinner.jsx` (shared) — khi đang fetch data.
- [ ] Tạo `ErrorState.jsx` (shared) — khi API lỗi + nút Retry.
- [ ] Kiểm tra kết hợp search + filter hoạt động đúng.
- [ ] Kiểm tra responsive CourseListPage.

---

## Milestone 4: Course Detail Preview (`/courses/:id`)

- [ ] Tạo file `CourseDetailPreviewPage.jsx` trong `pages/`.
- [ ] Hiển thị breadcrumb: Home > Courses > [Course Title].
- [ ] Hiển thị course title (display-lg hoặc display-md style).
- [ ] Hiển thị course description đầy đủ.
- [ ] Hiển thị skill badge + level badge.
- [ ] Hiển thị duration (weeks).
- [ ] Hiển thị price hoặc "Free".
- [ ] Tạo `CourseSyllabusPreview.jsx` — danh sách lessons theo order.
  - Hiển thị: lesson title, duration (minutes).
  - Dùng numbered list hoặc accordion.
- [ ] Hiển thị instructor info (tên teacher).
  - Fetch từ `GET /users/:teacherId`.
- [ ] Thêm CTA "Enroll Now" / "Login to Enroll" / "Register".
  - Guest chưa login → click Enroll → redirect `/login`.
  - CTA dùng `button-primary` hoặc `button-pill-cta` style.
- [ ] Xử lý course ID không tồn tại → hiển thị 404 hoặc error message.
- [ ] Kiểm tra responsive CourseDetailPreviewPage.

---

## Milestone 5: Mock API & Services

- [ ] Kiểm tra `db.json` có đủ courses (ít nhất 6-8 courses để test pagination).
- [ ] Kiểm tra `db.json` có đủ lessons cho mỗi course.
- [ ] Tạo axios instance (`src/services/axiosInstance.js` hoặc tương tự).
  - Base URL từ `process.env.REACT_APP_API_BASE_URL`.
- [ ] Tạo `publicCourseService.js`:
  - `getCourses()` → `GET /courses`.
  - `getCourseById(id)` → `GET /courses/:id`.
  - `getLessonsByCourseId(courseId)` → `GET /lessons?courseId={courseId}`.
  - `getTeacherById(teacherId)` → `GET /users/:id`.
- [ ] Tạo custom hook `useCourses()`:
  - State: courses, loading, error.
  - Fetch courses on mount.
  - Expose: courses, loading, error, refetch.
- [ ] Tạo custom hook `useCourseDetail(id)`:
  - State: course, lessons, teacher, loading, error.
  - Fetch course + lessons + teacher on mount.
  - Expose: course, lessons, teacher, loading, error.
- [ ] Xử lý loading state → hiển thị LoadingSpinner.
- [ ] Xử lý error state → hiển thị ErrorState + Retry.
- [ ] Xử lý empty state → hiển thị EmptyState.

---

## Milestone 6: Demo & Polish

- [ ] Mở `/` — homepage hiển thị đầy đủ.
- [ ] Click "Courses" trên navbar → chuyển đến `/courses`.
- [ ] Search course theo tên → danh sách filter đúng.
- [ ] Filter course theo skill → danh sách filter đúng.
- [ ] Filter course theo level → danh sách filter đúng.
- [ ] Click CourseCard → chuyển đến `/courses/:id`.
- [ ] Xem course detail preview đầy đủ thông tin.
- [ ] Click "Login" CTA → chuyển đến `/login`.
- [ ] Click "Register" CTA → chuyển đến `/register`.
- [ ] Click "Enroll" khi chưa login → redirect `/login`.
- [ ] Test mobile responsive — không vỡ layout.
- [ ] Test tablet responsive.
- [ ] Kiểm tra UI bám theo DESIGN.md (colors, fonts, spacing).
- [ ] Chuẩn bị lời giải thích với thầy:
  - Giới thiệu tổng quan feature.
  - Demo flow Guest: Home → Courses → Detail → Login.
  - Giải thích search/filter/pagination.
  - Giải thích cấu trúc folder feature-based.
  - Giải thích mock API với JSON-Server.

---

## Definition of Done

Tất cả các criteria sau phải được đáp ứng:

- [ ] Guest xem được homepage đầy đủ sections.
- [ ] Guest xem được course list với search/filter/pagination.
- [ ] Guest xem được course detail preview.
- [ ] Guest có thể search/filter courses.
- [ ] Guest có thể navigate đến login/register qua CTA.
- [ ] UI bám theo DESIGN.md (color, typography, spacing, rounded).
- [ ] Responsive trên mobile/tablet/desktop.
- [ ] Loading/Error/Empty states hoạt động đúng.
- [ ] Không code lan sang scope Student/Teacher/Admin.
- [ ] Code sạch, component nhỏ, dễ tái sử dụng.
- [ ] Có thể demo mượt cho giảng viên.
