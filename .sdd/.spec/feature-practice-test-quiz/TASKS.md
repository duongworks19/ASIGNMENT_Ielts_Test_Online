# Danh sách Tasks: IELTS Practice Test & Quiz System (feat-practice-test-quiz)

**Dựa trên:** `SPEC.md`, `PLAN.md`, `AGENTS.md`, `CLAUDE.md` và `constitution.md`.
**Quy định:** Mỗi task ≤ 4 giờ, implement độc lập, format bảng Markdown chi tiết tối đa. Tái sử dụng Bootstrap 5.

## Phase 1: Database Setup & Mock Data (JSON-Server)
*Luật: Không có DB thật, sử dụng file `db.json` làm Mock Database theo chuẩn JSON-Server REST API.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T001** | Khởi tạo Collection `testAttempts` | `db.json` | 1 | None | SPEC §6 | Tạo mảng rỗng `"testAttempts": []` vào schema. Sửa các lỗi lặp dòng/syntax cũ trong file. |
| **T002** | Chuẩn hóa bảng `questions` | `db.json` | 1 | T001 | SPEC §6 | Sửa cấu trúc field `correctAnswer` thành `answer` để thống nhất. Phân biệt rõ các types (`multiple-choice`, vv). |

## Phase 2: Utilities & Core Services
*Luật: Các utility tính toán phải là pure functions. Service layer chuyên fetch data qua Axios.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T003** | Implement QuizUtils (Score) | `src/utils/quizUtils.js` | 1.5 | None | Ubiquitous | Viết hàm `calculateScore(answers, questions)` so sánh đúng sai. Trả về format `{ correct, wrong, percentage }`. |
| **T004** | Implement QuizUtils (Band & Time) | `src/utils/quizUtils.js` | 1 | None | Ubiquitous | Viết hàm `convertBandScore` (mock IELTS Band) và `getRemainingTime(startedAt, durationMinutes)` dựa trên `Date.now()`. |
| **T005** | Service Auth: API Tests | `src/services/testService.js` | 1.5 | None | API Contracts | Viết hàm gọi API Axios: `getTests(filters)`, `getTestById(testId)`, `getQuestionsByTest(testId)`. |
| **T006** | Service Auth: API Attempts | `src/services/testService.js` | 1.5 | T005 | API Contracts | Viết hàm gọi API `createAttempt(data)`, `submitAttempt(id, data)` (sử dụng PATCH), và `getAttemptById(id)`. |

## Phase 3: Middleware, Controllers & API Routes
*Luật: Với ứng dụng Frontend, Phase này tương ứng với cấu hình Route Guards, Custom Hooks và Đăng ký Route.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T007** | Middleware: Auth Guard | `src/routes/ProtectedRoute.jsx` | 1 | None | Ubiquitous | Xác nhận module ProtectRoute đã hoạt động, chặn guest vào làm test. Trả về trang login nếu chưa đăng nhập. |
| **T008** | Khởi tạo & Đăng ký API Routes | `src/routes/AppRoutes.jsx` | 1.5 | None | Ubiquitous | Thêm các routes: `/learning/tests`, `/learning/tests/:id`, `/learning/tests/attempt/:attemptId` và `/review`. |
| **T009** | Hook: `useQuizSession` | `src/hooks/useQuizSession.js` | 2.5 | None | State-driven | Custom hook quản lý state của bài làm (answers, flagged, expireAt), tự động sync với `localStorage` để chống F5. |

## Phase 4: Frontend Implementation (React + Vite)
*Luật: Components viết bằng PascalCase. Style dùng Bootstrap 5. Tái sử dụng linh hoạt.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T010** | Component: ProgressBar | `src/components/feature/quiz/ProgressBar.jsx` | 1 | None | State-driven | Render Bootstrap `<div class="progress-bar">` thay đổi độ dài theo phần trăm. |
| **T011** | Component: CountdownTimer | `src/components/feature/quiz/CountdownTimer.jsx` | 2.5 | T004 | State-driven | Đếm ngược theo `expireAt`. Đổi màu đỏ khi `< 5 phút`. Bắn sự kiện `onExpire` khi thời gian về 0. |
| **T012** | Component: QuestionNavigator| `src/components/feature/quiz/QuestionNavigator.jsx` | 2.5 | None | State-driven | Grid các nút số câu. Phân biệt: Xám (chưa làm), Xanh (đã làm), Cam (Flagged). Hỗ trợ `onNavigate`. |
| **T013** | Renderer: Component Map | `src/components/feature/quiz/QuestionRenderer.jsx` | 2 | None | Unwanted | Switch/case dựa trên `question.type`. Hiển thị thông báo "Dạng câu hỏi chưa được hỗ trợ" nếu type lạ. |
| **T014** | Renderer: Multiple Choice | `src/components/feature/quiz/renderers/MCQRenderer.jsx` | 1.5 | T013 | Event-driven | Render list các radio button. Truyền ngược `onChange(questionId, answer)` lên cha. |
| **T015** | Renderer: True/False/Not Given| `src/components/feature/quiz/renderers/TFNotGivenRenderer.jsx` | 1.5 | T013 | Event-driven | Giống MCQ nhưng cố định 3 options. Radio button layout dọc/ngang. |
| **T016** | Renderer: Fill in the Blank | `src/components/feature/quiz/renderers/FillBlankRenderer.jsx` | 2 | T013 | Event-driven | Text input field(s). Bắt sự kiện `onBlur` để không update state liên tục quá nhanh. |
| **T017** | Page: Test List Page | `src/pages/student/TestListPage.jsx` | 2 | T005 | Event-driven | Fetch `getTests()`. Hiển thị danh sách test dạng thẻ (card) Bootstrap. Có nút "Xem chi tiết". |
| **T018** | Page: Test Detail Page | `src/pages/student/TestDetailPage.jsx` | 2.5 | T005, T006 | Event-driven | Lấy chi tiết. Nút "Start Test" -> Gọi `createAttempt()`, chuyển hướng sang màn Session kèm ID attempt. |
| **T019** | Page: Test Session Page | `src/pages/student/TestSessionPage.jsx` | 3.5 | T009, T010-T016| Event-driven | Ghép UI Layout, mount Timer, Navigator, Renderer. Gọi `submitAttempt` tự động khi hết giờ (onExpire). |
| **T020** | Page: Test Review Page | `src/pages/student/TestReviewPage.jsx` | 3 | T006, T013 | Event-driven | Load attempt. Chuyển Renderer sang chế độ Readonly (isReviewMode=true). Hiển thị chi tiết đúng/sai & giải thích. |

## Phase 5: Testing & Quality Assurance
*Luật: Đảm bảo mọi tính năng cốt lõi không có bug logic. (Mức coverage ưu tiên Utils)*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | EARS spec refs | Done criteria |
|---|---|---|---|---|---|---|
| **T021** | Unit Test: Utilities | `src/utils/__tests__/quizUtils.test.js` | 2 | T003, T004 | Testing | Test logic tính điểm `calculateScore` cho các trường hợp biên (edge cases). |
| **T022** | E2E Manual Test | UI/Browser | 2 | T017-T020 | Testing | Test thử luồng tạo attempt -> F5 trang đang làm -> Đợi hết giờ -> Check trang Review. Verify JSON-Server lưu đúng data. |
