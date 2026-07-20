# Danh sách Tasks: IELTS Vocabulary Flashcards (feature-flashcards)

**Dựa trên:** Yêu cầu chức năng cốt lõi của feature-flashcards, `SPEC.md`, `PLAN.md`, `AGENTS.md`.
**Quy định:** Mỗi task ≤ 4 giờ, implement độc lập, format bảng Markdown chi tiết tối đa.

## Phase 1: Data Setup & Configuration (JSON Server)
*Luật: Tuyệt đối phải fix syntax error trong db.json trước khi làm gì khác.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | Done criteria |
|---|---|---|---|---|---|
| **T001** | Fix Syntax Error `db.json` | `db.json` | 0.5 | None | Sửa dấu phẩy/ngoặc lỗi ở dòng 250 để `json-server` chạy không bị crash. |
| **T002** | Seed Data: Categories | `db.json` | 1 | T001 | Tạo mảng `categories` (óng vai trò là Deck/Topic) với ít nhất 3 chủ đề IELTS. |
| **T003** | Seed Data: Flashcards | `db.json` | 1.5 | T002 | Tạo mảng `flashcards` với ít nhất 10 từ vựng cho mỗi deck (categoryId). |
| **T004** | Seed Data: Progress | `db.json` | 0.5 | T003 | Tạo mảng `flashcardProgress` lưu state (known/review) cho user giả lập. |

## Phase 2: Utilities & Core Services
*Luật: Gọi API qua Axios, handle lỗi, phân tách logic state khỏi UI.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | Done criteria |
|---|---|---|---|---|---|
| **T005** | Service: FlashcardService | `src/services/flashcardService.js` | 2 | T004 | Viết các hàm `GET /categories` (lấy danh sách deck), `GET /flashcards?category={id}`, `POST/PATCH /flashcardProgress`. |
| **T006** | Hook: `useFlashcards` | `src/hooks/useFlashcards.js` | 2.5 | T005 | Fetch data. Handle state `loading`, `error`. Hỗ trợ fetch flashcards theo `deckId`. |
| **T007** | Hook: `useFlashcardProgress`| `src/hooks/useFlashcardProgress.js` | 3 | T005 | Lưu trữ state Known/Review của 1 deck. Cung cấp hàm `markKnown()`, `markReview()` kèm Optimistic Update. |

## Phase 3: Middleware, Controllers & API Routes

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | Done criteria |
|---|---|---|---|---|---|
| **T008** | Cấu hình Routes Flashcard | `src/routes/AppRoutes.jsx` | 1 | None | Thêm 2 routes: `/learning/flashcards` (Danh sách Deck) và `/learning/flashcards/:deckId` (Học Deck chi tiết). |

## Phase 4: Frontend Implementation (React + CRA)
*Luật: Bám sát các component yêu cầu: FlashcardDeck, FlipCard, FlashcardFilter, FlashcardProgress.*

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | Done criteria |
|---|---|---|---|---|---|
| **T009** | Component: `FlipCard` | `src/components/feature/flashcards/FlipCard.jsx`<br>`FlipCard.css` | 3 | None | Layout Front/Back bằng CSS 3D Transforms (`rotateY`). Chỉ hiển thị UI lật thẻ dựa trên props. |
| **T010** | Component: `FlashcardFilter` | `src/components/feature/flashcards/FlashcardFilter.jsx` | 1.5 | None | Dropdown/Toolbar cho phép người dùng filter các Deck theo Topic/Category ở trang chủ Flashcard. |
| **T011** | Component: `FlashcardProgress`| `src/components/feature/flashcards/FlashcardProgress.jsx` | 1.5 | None | Thanh Progress Bar (Bootstrap) xanh/vàng/xám hiển thị số Known/Review so với Total. |
| **T012** | Component: `FlashcardControls`| `src/components/feature/flashcards/FlashcardControls.jsx` | 1 | None | Chứa 3 nút: Previous, Shuffle, Next. Style theo Bootstrap. |
| **T013** | Component: `FlashcardDeck` | `src/components/feature/flashcards/FlashcardDeck.jsx` | 3.5 | T009, T012 | Thành phần chính chứa logic: `currentIndex`, `isFlipped`. Nhận danh sách thẻ, map ra `FlipCard`, xử lý Next/Prev/Shuffle. |
| **T014** | Page: `FlashcardListPage` | `src/pages/student/FlashcardListPage.jsx` | 2.5 | T006, T010 | Map tại route `/learning/flashcards`. Render danh sách các thẻ Deck. Bấm vào chuyển hướng sang route `/:deckId`. |
| **T015** | Page: `FlashcardStudyPage` | `src/pages/student/FlashcardStudyPage.jsx` | 3 | T007, T011, T013 | Map tại route `/:deckId`. Fetch thẻ theo deckId. Lắp ráp `FlashcardDeck`, `FlashcardProgress` và gọi API đánh dấu từ vựng. |

## Phase 5: Testing & Quality Assurance

| ID | Tên Task | File(s) cần tạo/sửa | Est (h) | Dependencies | Done criteria |
|---|---|---|---|---|---|
| **T016** | Unit Test: Hooks | `src/hooks/useFlashcards.test.js`<br>`src/hooks/useFlashcardProgress.test.js` | 2 | T006, T007 | Mock Axios. Đảm bảo logic Optimistic Update. |
| **T017** | Unit Test: Components | `src/components/feature/flashcards/FlashcardDeck.test.jsx` | 2 | T013 | Đảm bảo logic lật thẻ, Next/Prev/Shuffle hoạt động đúng. |
| **T018** | Manual QA & Fixes | N/A | 2 | T015 | Lật thẻ không giật lag. Progress lưu đúng xuống json-server. Back/Forward không mất data. |
| **T019** | Cập nhật Changelog | `.sdd/agents_changelog.md` | 0.5 | T018 | Ghi log đầy đủ. |
