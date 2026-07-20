# CONTEXT.md — Feature: Public Discovery / Guest Homepage

---

## 1. Mục tiêu feature

Guest (khách chưa đăng nhập) có thể truy cập website mà **chưa cần đăng nhập**, thực hiện:
- Xem trang chủ (HomePage) để hiểu website IELTS Online Learning cung cấp những gì.
- Xem danh sách khóa học IELTS (CourseListPage) để chọn khóa phù hợp.
- Xem preview chi tiết một khóa học (CourseDetailPreviewPage) để quyết định đăng ký.
- Được điều hướng đến trang Login/Register thông qua các CTA (Call To Action).

Feature này là **điểm tiếp xúc đầu tiên** giữa Guest và website, quyết định ấn tượng ban đầu.

---

## 2. Actor chính

**Guest** — Người dùng chưa có tài khoản hoặc chưa đăng nhập.

---

## 3. Vấn đề giải quyết

| Vấn đề | Cách feature giải quyết |
|---|---|
| Guest cần hiểu website cung cấp gì | HomePage có hero section, giới thiệu lợi ích, featured courses |
| Guest cần xem khóa học trước khi đăng ký | CourseListPage hiển thị danh sách, hỗ trợ search/filter |
| Guest cần tìm khóa học theo skill/level | FilterBar cho phép lọc theo Reading, Listening, Writing, Speaking và Beginner/Intermediate/Advanced |
| Guest cần CTA rõ ràng | Mỗi page có nút Register/Login nổi bật |

---

## 4. Route thuộc feature

| Route | Page | Ưu tiên |
|---|---|---|
| `/` | HomePage | ⭐ Bắt buộc |
| `/courses` | CourseListPage | ⭐ Bắt buộc |
| `/courses/:id` | CourseDetailPreviewPage | ⭐ Bắt buộc |
| `/tests` | PublicTestListPage | Nếu còn thời gian |
| `/blog` | BlogListPage | Nếu còn thời gian |
| `/blog/:id` | BlogDetailPage | Nếu còn thời gian |

---

## 5. Page cần có

### 5.1 HomePage (`/`)
Trang chủ giới thiệu tổng quan website. Là trang quan trọng nhất của feature này.

### 5.2 CourseListPage (`/courses`)
Hiển thị tất cả khóa học IELTS public. Có search, filter, pagination.

### 5.3 CourseDetailPreviewPage (`/courses/:id`)
Hiển thị thông tin chi tiết một khóa học: mô tả, syllabus preview, instructor, level, skill, giá/miễn phí.

### 5.4 PublicTestListPage (`/tests`) — Tùy chọn
Preview danh sách bài test public nếu còn thời gian.

### 5.5 BlogListPage (`/blog`) — Tùy chọn
Danh sách bài viết IELTS tips nếu còn thời gian.

---

## 6. Thành phần UI chính trên HomePage

| Section | Mô tả | Vị trí |
|---|---|---|
| **Header/Navbar** | Logo, menu (Home, Courses, Tests), Login/Register buttons | Top, sticky |
| **Hero Section** | Headline lớn, sub-headline, CTA "Get Started" / "Sign Up Free" | Đầu trang |
| **Course Categories / IELTS Skills** | 4 card cho Reading, Listening, Writing, Speaking | Sau hero |
| **Featured Courses** | 3-4 khóa học nổi bật dạng CourseCard | Giữa trang |
| **Why Choose Us** | 3-4 lợi ích chính (giá rẻ, cá nhân hóa, quiz tương tác...) | Giữa trang |
| **Practice Test Preview** | Giới thiệu mock test với CTA | Giữa trang |
| **Flashcard/Vocabulary Intro** | Giới thiệu tính năng flashcard | Giữa trang |
| **Statistics Section** | Số liệu mock (students, courses, tests...) | Gần cuối |
| **Testimonials** | Review mock từ "học viên" nếu cần | Tùy chọn |
| **CTA Section** | CTA lớn: "Bắt đầu học ngay" → Register/Login | Trước footer |
| **Footer** | Links, copyright, contact info | Cuối trang |

---

## 7. Data cần dùng

Từ `db.json` (JSON-Server):

| Collection | Mục đích | API Endpoint |
|---|---|---|
| `courses` | Danh sách khóa học, featured courses | `GET /courses` |
| `lessons` | Syllabus preview trong course detail | `GET /lessons?courseId={id}` |
| `tests` | Preview bài test public nếu có | `GET /tests` |
| `skills` | Danh sách skill IELTS để filter | Có thể hardcode 4 skill |
| `levels` | Danh sách level để filter | Có thể hardcode 3 level |
| `categories` | Phân loại nếu cần | Tùy chọn |

> **Lưu ý:** `skills` và `levels` có thể hardcode vì chỉ có 4 skill IELTS và 3 level cố định.

---

## 8. Design constraint

- **PHẢI giữ nguyên** định hướng giao diện từ `DESIGN.md` (phong cách Coinbase/Coiner).
- **KHÔNG tự thay** design sang style khác.
- Khi tạo component, component phải bám theo:
  - Color tokens: `#0052ff` (primary), `#0a0b0d` (ink), `#f7f7f7` (surface-soft)...
  - Typography: Inter font, display weight 400, body weight 400/600.
  - Spacing: 96px section padding, 32px card padding.
  - Rounded: pill (100px) cho CTA, xl (24px) cho card.
- Font thay thế: **Inter** (thay CoinbaseDisplay/CoinbaseSans), **JetBrains Mono** (thay CoinbaseMono).

---

## 9. Out of scope

Feature này **KHÔNG** bao gồm:
- ❌ Student Dashboard — phạm vi thành viên khác.
- ❌ Teacher CRUD (tạo/sửa/xóa course) — phạm vi thành viên khác.
- ❌ Admin panel — phạm vi thành viên khác.
- ❌ Quiz/Test logic thật (chấm điểm, submit answer) — chỉ preview.
- ❌ Payment thật — chỉ CTA dẫn đến login/register.
- ❌ Auth logic chi tiết — chỉ navigation đến `/login` và `/register`.
- ❌ Enrollment logic — Guest chưa login không enroll được, chỉ redirect.
