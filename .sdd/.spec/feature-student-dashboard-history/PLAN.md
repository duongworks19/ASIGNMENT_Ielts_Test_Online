# Implementation Plan: Student Dashboard & Learning History (feature-student-dashboard-history)

**Status:** DRAFT — Awaiting Tech Lead Review
**Linked Spec:** `.sdd/.spec/feature-student-dashboard-history/SPEC.md` (APPROVED, Risk: Medium)
**Sprint:** Sprint 2 — Dashboard & History
**Date:** 2026-06-11

---

## 1. ARCHITECTURAL APPROACH

- **Component-Based Architecture:** Phát triển các UI components độc lập (Stat Cards, Charts, History Table) dựa trên React và React-Bootstrap, gom nhóm trong `src/components/feature-student-dashboard-history/`.
- **State & Data Management:** Sử dụng custom hooks (ví dụ: `useDashboardData`) kết hợp với Axios để gọi mock API (JSON-Server). Không dùng Redux trừ khi cần chia sẻ global state (để giữ code đơn giản theo yêu cầu FER202).
- **Mock Data Handling:** Dữ liệu hoàn toàn phụ thuộc vào `db.json` (json-server). Các calculations (như average band score, hours) được thực hiện ở client-side (trong utilities/hooks) để giảm tải cho mock API.
- **Routing:** Client-side routing với React Router DOM. Các route được bảo vệ bởi `ProtectedRoute` (chỉ cho phép role `student`).

---

## 2. COMPONENTS & INTERFACE

### 2.1 `DashboardAPI` — `src/services/dashboardApi.js`

| Function | Input | Output | Ghi chú |
|----------|-------|--------|---------|
| `getTestAttempts(userId)` | `userId: string` | `Promise<Attempt[]>` | Gọi `GET /testAttempts?userId={userId}&_sort=-submittedAt` |
| `getLessonProgress(userId)` | `userId: string` | `Promise<Progress[]>` | Gọi `GET /lessonProgress?userId={userId}` |
| `getEnrollments(userId)` | `userId: string` | `Promise<Enrollment[]>` | Gọi `GET /enrollments?userId={userId}` |

### 2.2 Custom Hooks

| Hook | Input | Output | Ghi chú |
|----------|-------|--------|---------|
| `useDashboardData(userId)` | `userId: string` | `{ stats, attempts, loading, error }` | Tổng hợp dữ liệu từ API và tính toán các metrics (completed lessons, average band score, etc.) |
| `useHistoryFilter(attempts)` | `attempts: array` | `{ filtered, filters, setFilters }` | Xử lý filter by skill, date, search keyword local trên client |

### 2.3 Frontend Components (UI)

| Component | Interface (Props) | Trách nhiệm |
|-----------|------------------|-------------|
| `StatCard` | `title: string, value: string/number, icon?: element` | Hiển thị thông số rút gọn (Completed lessons, Band score...) |
| `TestScoreChart` | `data: array` | Hiển thị biểu đồ dạng Line Chart xu hướng điểm số bằng Recharts |
| `SkillRadarChart`| `data: array` | Hiển thị biểu đồ Radar điểm các kỹ năng IELTS bằng Recharts |
| `HistoryTable` | `attempts: array, onRowClick: function` | Bảng danh sách attempt, có phân trang cơ bản |
| `HistoryFilter` | `onFilterChange: function` | Form chọn filter: keyword, skill, date range |
| `DashboardPage` | none (container) | Page chính hiển thị layout Dashboard (`/learning/dashboard`) |
| `LearningHistoryPage` | none (container) | Page chính hiển thị History (`/learning/history`) |

---

## 3. DATA FLOW (Luồng dữ liệu)

### Flow 1: Load Dashboard Data

```text
Client  GET /learning/dashboard
  → Route Middleware: Check role === 'student'
  → DashboardPage component mount
  → Hook useDashboardData(userId) triggered
      ├─ Promise.all()
      │   ├─ dashboardApi.getTestAttempts(userId)
      │   ├─ dashboardApi.getLessonProgress(userId)
      │   └─ dashboardApi.getEnrollments(userId)
      ├─ Calculate: completedLessons, completedTests, averageBandScore, totalStudyHours
      ├─ Format data for TestScoreChart (Line chart)
      └─ Format data for SkillRadarChart (Radar chart)
  ← Update UI: Hide Spinner, render StatCards and Charts
```

### Flow 2: View & Filter Learning History

```text
Client  GET /learning/history
  → Route Middleware: Check role === 'student'
  → LearningHistoryPage component mount
  → dashboardApi.getTestAttempts(userId)
  ← Render HistoryTable with initial data
  
Client nhập keyword "Reading"
  → Hook useHistoryFilter triggered
  → Lọc attempts local trên client (vì JSON-Server hạn chế filter phức tạp)
  ← Update UI: Re-render HistoryTable với danh sách đã lọc
```

---

## 4. IMPLEMENTATION DEPENDENCIES

**Thứ tự triển khai (phụ thuộc thứ tự):**

| Bước | Nội dung | Phụ thuộc |
|------|----------|-----------|
| 1 | Cập nhật `db.json` (thêm collection `testAttempts`, mock data) | _(none)_ |
| 2 | Khởi tạo service `dashboardApi.js` & Axios calls | Bước 1 |
| 3 | Tạo các logic tính toán utils/hooks (`useDashboardData.js`) | Bước 2 |
| 4 | Xây dựng UI components tĩnh (`StatCard`, `TestScoreChart`, `SkillRadarChart`) | _(none)_ |
| 5 | Lắp ráp `DashboardPage` và tích hợp hook dữ liệu | Bước 3, 4 |
| 6 | Xây dựng `HistoryFilter` và `HistoryTable` | _(none)_ |
| 7 | Lắp ráp `LearningHistoryPage` và tích hợp hook | Bước 2, 6 |
| 8 | Cập nhật `src/routes/AppRoutes.jsx` để đăng ký các routes mới | Bước 5, 7 |
| 9 | Viết Unit/Component Tests và hoàn thiện Responsive | Bước 8 |

**External Dependencies:**

| Package | Mục đích |
|---------|----------|
| `recharts` | Vẽ biểu đồ (Line, Radar) |
| `axios` | Gọi HTTP mock API |
| `react-bootstrap` | Xây dựng layout, Grid, form |

---

## 5. TECHNICAL RISKS & MITIGATION

| # | Risk | Xác suất | Impact | Mitigation |
|---|------|----------|--------|------------|
| 1 | **JSON-Server Limits** — Không hỗ trợ filter/sort phức tạp nhiều trường cùng lúc | High | Medium | Kéo toàn bộ data của User về (thường không quá lớn cho mock) và dùng JavaScript client-side để sort/filter. |
| 2 | **Lỗi khi thiếu Data (Empty State)** — Các biểu đồ bị crash khi collection rỗng | Medium | High | Bắt buộc check array length `> 0`. Hiển thị Empty State component thay vì render Recharts rỗng. |
| 3 | **Division by Zero** — Khi tính Average Band Score nhưng test hoàn thành = 0 | Medium | Medium | Thêm safe-check `completedTests === 0 ? 'N/A' : (total/count).toFixed(1)`. |
| 4 | **Responsive trên Mobile** — Biểu đồ quá nhỏ hoặc bị tràn ngang | Medium | Medium | Set min-width cho biểu đồ, sử dụng CSS overflow-x hoặc Bootstrap grid stack (col-12) trên mobile. |

---

## 6. OPEN QUESTIONS

| # | Câu hỏi | Owner | Priority | Status |
|---|---------|-------|----------|--------|
| **Q1** | **[Band Score Display]** — Hiển thị Band Score trung bình hay Band Score gần nhất ở StatCard? (Spec ghi average hoặc current) | Frontend Team | High | Resolved (Current theo Spec) |
| **Q2** | **[Mock Study Hours]** — Công thức `lessons * 0.5 + test hours` áp dụng ở Client hay Server? | Frontend Team | High | Resolved (Tính ở Client) |
| **Q3** | **[Pagination]** — History Table phân trang client-side hay server-side qua json-server? | Frontend Team | Medium | Open |

---

## 7. DEFINITION OF DONE

Feature `feature-student-dashboard-history` được coi là **DONE** khi toàn bộ các điều kiện sau được thỏa mãn:

- [ ] `db.json` được bổ sung `testAttempts` collection mà không gây lỗi dự án.
- [ ] Truy cập `/learning/dashboard` load thành công data của `student` đang đăng nhập (không rò rỉ data của user khác).
- [ ] 4 Stat Cards hiển thị đúng giá trị thực tế từ DB, tính toán đúng logic.
- [ ] Line Chart và Radar Chart (Recharts) render thành công, không crash khi không có data.
- [ ] Route `/learning/history` hiển thị bảng history, search và filter hoạt động mượt mà.
- [ ] Các route được bảo vệ kĩ càng (chỉ Student mới xem được).
- [ ] Test coverage đạt >= 80% cho các custom hooks và utility functions tính toán.
- [ ] UI responsive hiển thị tốt trên Desktop và Mobile (không bị tràn biểu đồ trên mobile).
- [ ] Code review bởi ít nhất 1 member khác trước khi merge vào nhánh chính.
