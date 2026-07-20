# Implementation Plan: IELTS Practice Test & Quiz System (feat-practice-test-quiz)

**Status:** DRAFT — Awaiting Tech Lead Review
**Linked Spec:** `.sdd/.spec/feature-practice-test-quiz/SPEC.md` (APPROVED, Risk: Medium)
**Sprint:** Sprint 2 — Core Learning Features
**Date:** 2026-06-11

---

## 1. ARCHITECTURAL APPROACH

- **Frontend-Driven Assessment:** Theo đúng yêu cầu môn học FER202, mọi logic phức tạp như đếm ngược thời gian, điều hướng câu hỏi, chấm điểm (evaluation) đều được thực hiện trên Frontend (Client-side).
- **Mock API Limit Avoidance:** JSON-Server chỉ đóng vai trò lưu trữ (`tests`, `questions`, `testAttempts`). Để tránh việc call API liên tục (có thể gây lỗi db.json), trạng thái làm bài (answers, flagged) sẽ được lưu trong **Local Component State** và **LocalStorage**. Chỉ gửi `PATCH /testAttempts/:id` một lần duy nhất khi nộp bài.
- **Resilient Session Strategy:** Sử dụng `localStorage` kết hợp `Date.now()` để lưu trạng thái bài thi. Nếu user vô tình F5/reload trình duyệt, hệ thống sẽ khôi phục lại câu trả lời và tính toán lại thời gian còn lại chính xác mà không bị reset timer.
- **Dynamic Rendering Pattern:** Sử dụng pattern **Strategy / Component Map** để render linh hoạt các loại câu hỏi khác nhau (MCQ, True/False, Fill-in-the-blank) thay vì viết `if-else` lồng nhau phức tạp.
- **Route Protection:** Cấu hình React Router Guard (`ProtectedRoute`) đảm bảo chỉ user có role `student` mới được truy cập các trang `/learning/tests/*`.

---

## 2. COMPONENTS & INTERFACE

### 2.1 `TestService` — `src/services/testService.js`

> Wrapper gọi axios instance kết nối tới JSON-Server `db.json`. Bắt buộc `try-catch` và handle error qua toast.

| Function | Input | Output | Ghi chú |
|----------|-------|--------|---------|
| `getTests(filters)` | `{ skill?: string, level?: string }` | `Promise<Test[]>` | `GET /tests` |
| `getTestById(testId)` | `testId: string\|number` | `Promise<Test>` | `GET /tests/:id` |
| `getQuestionsByTest(testId)` | `testId: string\|number` | `Promise<Question[]>` | `GET /questions?testId=:id` |
| `createAttempt(data)` | `{ userId, testId, status: "in_progress", startedAt }` | `Promise<TestAttempt>` | `POST /testAttempts` |
| `submitAttempt(attemptId, data)` | `attemptId`, `{ status: "submitted", answers, score, bandScore, submittedAt }` | `Promise<TestAttempt>` | `PATCH /testAttempts/:id` |
| `getAttemptById(attemptId)` | `attemptId: string\|number` | `Promise<TestAttempt>` | `GET /testAttempts/:id` |

---

### 2.2 `QuizUtils` — `src/utils/quizUtils.js`

> Utility thuần — tính toán điểm và thời gian, không có side effects.

| Function | Input | Output | Ghi chú |
|----------|-------|--------|---------|
| `calculateScore(answers, questions)`| `answers: Object`, `questions: Array` | `{ correct: number, wrong: number, percentage: number }` | So sánh `answer` của user với `question.answer`. |
| `convertBandScore(rawScore, total, skill)` | `rawScore: number, total: number, skill: string` | `number` (e.g. 6.5) | Công thức mock map điểm sang IELTS Band (0.0 - 9.0) tùy theo skill. |
| `getRemainingTime(startedAt, duration)`| `startedAt: string`, `durationMinutes: number` | `number` (seconds) | Tính số giây còn lại so với thời điểm hiện tại (`Date.now()`). |

---

### 2.3 UI Feature Components — `src/components/feature/quiz/`

> Các component dùng riêng cho tính năng Test/Quiz. Sử dụng Bootstrap 5 class.

| Component | Interface (Props) | Trách nhiệm |
|-----------|------------------|-------------|
| `CountdownTimer` | `{ durationSeconds, onExpire, onTick }` | Đếm ngược thời gian. Trigger `onExpire` khi thời gian = 0. Đổi màu đỏ khi còn < 5 phút. |
| `QuestionNavigator` | `{ total, answers, flagged, currentIndex, onNavigate }` | Hiển thị dạng grid các câu hỏi. Phân biệt màu sắc: chưa làm, đã làm, flagged. Cập nhật `currentIndex`. |
| `ProgressBar` | `{ completed, total }` | Thanh tiến độ Bootstrap `<div class="progress-bar">`. |
| `QuestionRenderer` | `{ question, currentAnswer, onChange }` | Dựa vào `question.type` để return `MCQRenderer`, `TFNotGivenRenderer` hoặc `FillBlankRenderer`. |

---

### 2.4 Page Components — `src/pages/student/`

| Page | Route | Trách nhiệm |
|------|-------|-------------|
| `TestListPage` | `/learning/tests` | Hiển thị danh sách các bài test dạng thẻ (card). Gọi `getTests()`. |
| `TestDetailPage` | `/learning/tests/:id` | Hiển thị hướng dẫn làm bài, số câu, thời gian. Nút "Start Test". Gọi `createAttempt()`. |
| `TestSessionPage`| `/learning/tests/attempt/:attemptId` | Giao diện làm bài chính. Mount `Timer`, `Navigator`, `QuestionRenderer`. Xử lý lưu `localStorage`. Gọi `submitAttempt()` khi nộp. |
| `TestReviewPage` | `/learning/tests/attempt/:attemptId/review`| Hiển thị chi tiết kết quả. Render lại câu hỏi dạng readonly kèm theo `correctAnswer` và `explanation`. |

---

## 3. DATA FLOW (Luồng dữ liệu)

### Flow 1: Start Test & Auto-Save Setup

```text
Client click "Start Test" tại /learning/tests/1
  → TestDetailPage gọi TestService.createAttempt({ userId, testId: 1, status: "in_progress", startedAt: Date.now() })
  → Nhận về attemptId = 123
  → Xóa cache localStorage cũ (nếu có) cho bài test này
  → Navigate sang /learning/tests/attempt/123

Tại TestSessionPage (Mount):
  → TestService.getAttemptById(123) & TestService.getQuestionsByTest(1)
  → Khởi tạo local state: `answers = {}`, `flagged = []`
  → Lưu ngay thông tin vào localStorage: `quiz_attempt_123 = { answers, flagged, expireAt }`
  → Mount CountdownTimer với thời gian còn lại = expireAt - Date.now()
```

---

### Flow 2: Answer & Navigation

```text
Client click chọn đáp án cho câu hỏi #1
  → QuestionRenderer trigger onChange(questionId, answerValue)
  → Cập nhật local state `answers[questionId] = answerValue`
  → Cập nhật lại localStorage `quiz_attempt_123`
  → ProgressBar tự động tăng lên dựa trên Object.keys(answers).length
  → QuestionNavigator chuyển màu ô #1 thành "đã trả lời"
```

---

### Flow 3: Auto-Submit (Timer Expired)

```text
CountdownTimer chạy đến 0
  → Timer component trigger prop `onExpire()`
  → TestSessionPage chặn mọi thao tác UI (show LoadingOverlay)
  → Lấy `answers` hiện tại từ local state
  → Gọi QuizUtils.calculateScore() → { correct, percentage }
  → Gọi QuizUtils.convertBandScore() → bandScore
  → Gọi TestService.submitAttempt(123, { status: "submitted", answers, score: correct, bandScore })
  → Xóa localStorage `quiz_attempt_123`
  → Navigate sang /learning/tests/attempt/123/review kèm toast "Hết giờ, bài đã tự động nộp!"
```

---

### Flow 4: Review Result

```text
Client vào /learning/tests/attempt/123/review
  → TestReviewPage gọi API lấy attempt details & questions
  → Duyệt qua từng question để render:
      ├─ Nếu question.answer === attempt.answers[question.id] → Show màu xanh (Đúng)
      ├─ Ngược lại → Show màu đỏ (Sai) + Show màu xanh ở đáp án đúng
      └─ Show Alert box cho `question.explanation`
```

---

## 4. IMPLEMENTATION DEPENDENCIES

**Thứ tự triển khai:**

| Bước | Nội dung | Phụ thuộc |
|------|----------|-----------|
| 1 | Cập nhật `db.json` (thêm mảng `testAttempts: []` và chuẩn hóa `answer` cho `questions`) | _(none)_ |
| 2 | `QuizUtils` (score, timer, band conversion) | _(none)_ |
| 3 | `TestService` (axios calls) | Cấu hình axios hiện tại |
| 4 | UI Components (`CountdownTimer`, `ProgressBar`, `QuestionNavigator`) | Bước 2 |
| 5 | Component `QuestionRenderer` và các sub-components (MCQ, True/False, FillBlank) | Bước 4 |
| 6 | Page: `TestListPage` và `TestDetailPage` + Add Routes | Bước 3 |
| 7 | Page: `TestSessionPage` (Tích hợp luồng thi, timer, localStorage) | Bước 2, 4, 5, 6 |
| 8 | Page: `TestReviewPage` (Tích hợp luồng xem lại kết quả) | Bước 7 |

---

## 5. TECHNICAL RISKS & MITIGATION

| # | Risk | Xác suất | Impact | Mitigation |
|---|------|----------|--------|------------|
| 1 | **Mất dữ liệu khi F5/Tắt tab** — User F5 giữa chừng làm mất hết bài đang làm. | High | High | Lưu state `answers` và thời điểm hết hạn `expireAt` vào `localStorage`. Khi mount lại, lấy dữ liệu từ storage tiếp tục. |
| 2 | **Timer không chính xác** — `setInterval` của JS có thể bị throttle khi tab ẩn. | High | Medium | Không đếm lùi biến số. Tính thời gian hiển thị bằng `expireAt - Date.now()`. Kiểm tra liên tục. |
| 3 | **Gửi nộp bài 2 lần** — User double click nút Submit hoặc Timer chạy song song user tự nộp. | Medium | Medium | Disable nút nộp bài ngay lập tức, dùng state `isSubmitting = true`. Cài đặt lock trên handleSubmit. |
| 4 | **Sai khác định dạng câu hỏi** — `db.json` có nhiều loại type. | Medium | High | Dùng Pattern Strategy cho `QuestionRenderer`, fallback về "Type không hỗ trợ" nếu schema data thay đổi lạ. |

---

## 6. OPEN QUESTIONS

| # | Câu hỏi | Owner | Priority | Status |
|---|---------|-------|----------|--------|
| **Q1** | **[Band Conversion Formula]** Cụ thể công thức map Band từ 0-40 câu sang 0.0-9.0 là gì? (Tạm thời mock theo bảng chuẩn IELTS Reading) | Product / Team | Medium | Resolved |
| **Q2** | **[Auto Save Strategy]** Sẽ không gọi PATCH liên tục để tránh spam JSON Server. Mọi thao tác lưu ở localStorage, chỉ PATCH khi submit. Nhất trí? | Tech Lead | High | Resolved |
| **Q3** | **[Question Types]** UI sẽ support render đủ 3 types: MCQ, True/False/NG, Fill-in-the-blank như trong db.json hiện có. | Tech Lead | High | Resolved |

---

## 7. DEFINITION OF DONE

Feature `feat-practice-test-quiz` được coi là **DONE** khi:

- [ ] 4 Pages (`TestList`, `TestDetail`, `TestSession`, `TestReview`) được thiết kế hoàn thiện với Bootstrap 5 và mount vào `AppRoutes.jsx`.
- [ ] Dữ liệu bài thi load thành công từ mock JSON-Server.
- [ ] Render đúng UI cho ít nhất 3 loại câu hỏi: Multiple Choice, True/False/Not Given, và Fill-in-the-blank.
- [ ] Thanh Progress Bar và Question Navigator update thời gian thực (real-time).
- [ ] `CountdownTimer` đếm chính xác, tự động trigger Submit khi về 0.
- [ ] Dữ liệu bài đang làm không bị mất khi F5 trình duyệt.
- [ ] Form Submission chỉ gọi `PATCH /testAttempts/:id` một lần duy nhất.
- [ ] Giao diện Review Mode hiển thị rõ đáp án đúng/sai và phần giải thích (explanation).
- [ ] Code không vi phạm các ràng buộc trong `constitution.md` (giữ code ở mức Frontend focus, dễ demo bảo vệ đồ án).
