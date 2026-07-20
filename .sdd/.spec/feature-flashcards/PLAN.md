# Implementation Plan: IELTS Vocabulary Flashcards (feature-flashcards)

**Status:** DRAFT — Awaiting Tech Lead Review
**Linked Spec:** `.sdd/.spec/feature-flashcards/SPEC.md`
**Sprint:** Sprint 2 — Learning Enhancement
**Date:** 2026-06-17

---

## 1. ARCHITECTURAL APPROACH

- **Layered Architecture:** Tuân thủ luồng: UI Components → Custom Hooks (Local State) → Service Layer (Axios) → JSON-Server Mock DB.
- **State Management:** Sử dụng React `useState` và `useMemo` cho Flashcard logic (current card index, flipped state, filtering). Mọi action lật thẻ/chuyển thẻ xử lý hoàn toàn ở client side để đảm bảo độ trễ = 0.
- **Persistence Strategy:** Các cập nhật tiến độ (Mark as Known/Review) sẽ được xử lý kiểu **Optimistic UI Update**: cập nhật UI trước, gọi API lưu xuống `db.json` ngầm. Nếu API fail sẽ revert UI và hiển thị Toast lỗi.
- **Styling:** Tuân thủ `DESIGN.md`, 100% sử dụng **Bootstrap 5 & React-Bootstrap**.
- **Resilience:** Nếu JSON-Server sập, ứng dụng hiển thị lỗi thay vì crash trang.

---

## 2. COMPONENTS & INTERFACE

### 2.1 `FlashcardService` — `src/services/flashcardService.js`

> Module gọi API giao tiếp với JSON-Server.

| Function | Input | Output | Ghi chú |
|----------|-------|--------|---------|
| `getFlashcards()` | _(none)_ | `Promise<Flashcard[]>` | Gọi `GET /flashcards` |
| `getCategories()` | _(none)_ | `Promise<Category[]>` | Gọi `GET /categories` |
| `getProgress(studentId)` | `studentId: string` | `Promise<Progress[]>` | Gọi `GET /flashcardProgress?userId={id}` |
| `saveProgress(data)` | `{ userId, flashcardId, status }` | `Promise<Object>` | Gọi `POST` (tạo mới) hoặc `PATCH` (cập nhật) vào `/flashcardProgress` |

---

### 2.2 Custom Hooks — `src/hooks/`

| Hook | Input | Output | Ghi chú |
|------|-------|--------|---------|
| `useFlashcards()` | `categoryId: string` | `{ cards, loading, error, fetchFlashcards }` | Fetch data từ Service, handle loading/error states. |
| `useFlashcardProgress()`| `userId: string` | `{ progressMap, markKnown, markReview }` | Quản lý state Known/Review dạng Dictionary/Map để tra cứu O(1). Có tích hợp Optimistic Update. |

---

### 2.3 Shared UI Components — `src/components/common/`

> Tận dụng các component hiện có hoặc tạo mới nếu chưa có.

| Component | Props | Trách nhiệm |
|-----------|-------|-------------|
| `FlipCard` | `{ frontText, backText, isFlipped, onFlip }` | Wrapper dùng CSS Transform để tạo hiệu ứng lật 3D thẻ. Component câm (Dumb Component). |
| `EmptyState` | `{ message, icon, actionText, onAction }` | Hiển thị khi danh mục không có thẻ nào. |

---

### 2.4 Feature Components — `src/components/feature/flashcards/`

| Component | Props | Trách nhiệm |
|-----------|-------|-------------|
| `FlashcardViewer` | `{ cards, progressMap, onMark }` | Quản lý state Index hiện tại, chứa các nút Next/Prev/Shuffle. Gọi `FlipCard` để render thẻ hiện hành. |
| `FlashcardControls` | `{ currentIndex, total, onNext, onPrev, onShuffle }` | Thanh điều hướng bên dưới thẻ. |
| `CategoryFilter` | `{ categories, selectedId, onSelect }` | Danh sách/Dropdown chọn chủ đề từ vựng. |
| `ProgressTracker` | `{ total, knownCount, reviewCount }` | Hiển thị thanh tiến độ (Progress Bar Bootstrap 5). |

---

### 2.5 Pages — `src/pages/student/`

| Handler | Method & Path | Trách nhiệm |
|---------|--------------|-------------|
| `FlashcardPage` | `GET /learning/flashcards` | Page Container. Fetch Categories & Flashcards, render `CategoryFilter`, `ProgressTracker` và `FlashcardViewer`. |

---

## 3. DATA FLOW (Luồng dữ liệu)

### Flow 1: Khởi tạo và Lọc Flashcard

```text
Client vào `/learning/flashcards`
  → FlashcardPage mounts
  → Fetch `categories` & `flashcards` & `flashcardProgress` qua Service
      ├─ Đang fetch: Render Loading Spinner
      ├─ Lỗi: Render Error Message
      └─ Thành công: Lưu vào state
  → Áp dụng Filter theo Category được chọn (Mặc định: All)
  → Pass `filteredCards` xuống `FlashcardViewer`
  → Pass `progressMap` xuống `FlashcardViewer` để render màu (Xanh/Vàng/Đỏ)
```

---

### Flow 2: Tương tác Lật thẻ và Điều hướng (Next/Prev/Shuffle)

```text
User click vào thẻ (Flip)
  → `FlashcardViewer` đổi state `isFlipped = !isFlipped`
  → `FlipCard` áp dụng CSS Transform lật thẻ 180 độ.

User click "Next"
  → Đổi state `currentIndex = (currentIndex + 1) % total`
  → Tự động set lại `isFlipped = false` (Úp thẻ mới xuống)

User click "Shuffle"
  → Gọi hàm xáo trộn Array (Fisher-Yates) trên mảng `filteredCards`
  → Reset `currentIndex = 0` và `isFlipped = false`
```

---

### Flow 3: Cập nhật Tiến độ (Known/Review)

```text
User click nút "Đã thuộc (Known)" trên thẻ ID: `flashcard-001`
  → Hook `useFlashcardProgress.markKnown('flashcard-001')`
      ├─ Optimistic Update: Lập tức update `progressMap` ở local state → UI chuyển màu xanh lá cây lập tức.
      ├─ Async API: Gọi `FlashcardService.saveProgress({ status: 'known' })`
          ├─ [SUCCESS] Giữ nguyên UI.
          └─ [FAIL] Revert state `progressMap` về cũ, hiển thị Toast báo lỗi mạng.
  → `FlashcardViewer` tự động kích hoạt hàm "Next" để nhảy sang thẻ tiếp theo.
```

---

## 4. IMPLEMENTATION DEPENDENCIES

**Thứ tự triển khai (phụ thuộc thứ tự):**

| Bước | Nội dung | Phụ thuộc |
|------|----------|-----------|
| 1 | **Data Setup**: Thêm cấu trúc bảng `flashcards`, `categories`, `flashcardProgress` vào `db.json` | _(none)_ |
| 2 | **Services Layer**: Tạo `flashcardService.js` (getAll, getByCategory, saveProgress) | Bước 1 |
| 3 | **Custom Hooks**: Tạo `useFlashcards.js` và `useFlashcardProgress.js` | Bước 2 |
| 4 | **UI - Dumb Components**: Code `FlipCard.jsx` bằng CSS + Bootstrap 5 | _(none)_ |
| 5 | **UI - Smart Components**: Code `FlashcardViewer`, `CategoryFilter`, `FlashcardControls` | Bước 3, 4 |
| 6 | **Pages & Routing**: Đăng ký route `/learning/flashcards` trong `AppRoutes.jsx`, tích hợp các components vào `FlashcardPage.jsx` | Bước 5 |
| 7 | **Tích hợp Dashboard**: Bổ sung thống kê flashcard vào Dashboard hiện tại (Optional) | Bước 6 |
| 8 | **Unit & Integration Tests**: Viết test cho `FlipCard`, `FlashcardViewer`, `FlashcardPage` | Bước 6 |

---

## 5. TECHNICAL RISKS & MITIGATION

| # | Risk | Xác suất | Impact | Mitigation |
|---|------|----------|--------|------------|
| 1 | **JSON-Server Syntax Error** — Lỗi cú pháp trong db.json làm sập server hiện tại | High | High | Fix dứt điểm lỗi dấu phẩy/ngoặc ở dòng 250 của db.json trước khi thêm Seed Data mới. |
| 2 | **Lag khi lật thẻ** — DOM re-render quá nhiều làm animation bị giật | Medium | Medium | Sử dụng CSS Transitions thuần (`transform: rotateY()`) thay vì React Animation libraries. Quản lý `isFlipped` state cẩn thận. |
| 3 | **Race Condition khi click Known/Review nhanh** — Spam nút update gây quá tải API hoặc lỗi state | Low | High | Áp dụng Optimistic Updates kết hợp Debounce hoặc Disable nút thao tác trong vòng 300ms sau mỗi click. |
| 4 | **Data out-of-sync** — Có flashcardProgress nhưng flashcard gốc đã bị xóa | Low | Low | Backend (JSON-Server mock) bỏ qua việc check constraint. Frontend cần filter rác (Lọc bỏ tiến độ của các thẻ không tồn tại trong danh sách flashcards lấy về). |

---

## 6. OPEN QUESTIONS

| # | Câu hỏi | Owner | Priority | Status |
|---|---------|-------|----------|--------|
| **Q1** | **[Fix db.json]** Khi nào sẽ fix lỗi syntax error đang có trong `db.json`? | Team | HIGH | Open |
| **Q2** | **[Tiến độ học]** Học viên có bị ép buộc phải đánh giá tất cả flashcards trong category mới được tính là hoàn thành? | Product | Medium | Open |
| **Q3** | **[Audio Pronunciation]** Có cần thêm icon loa để phát âm thanh tiếng Anh bằng Web Speech API không? | Product | Low | Open |

---

## 7. DEFINITION OF DONE

Feature `feature-flashcards` được coi là **DONE** khi toàn bộ các điều kiện sau được thỏa mãn:

- [ ] Lỗi `db.json` (syntax error) đã được fix hoàn toàn.
- [ ] UI lật thẻ (FlipCard) hoạt động mượt mà bằng CSS 3D Transforms trên cả Desktop & Mobile.
- [ ] Route `/learning/flashcards` chạy bình thường và được bọc bởi ProtectedRoute của Student.
- [ ] Load dữ liệu qua Axios từ `JSON-Server` thành công.
- [ ] Các tính năng Next, Previous, Shuffle hoạt động không lỗi.
- [ ] Học viên mark Known/Review được lưu vào JSON Server và trạng thái phản ánh ngay trên giao diện.
- [ ] Tất cả giao diện sử dụng đúng chuẩn **Bootstrap 5** / React-Bootstrap, không bị rác class CSS tự do.
- [ ] Hoàn thành Unit tests cơ bản (Rendering & Behavior) với coverage tối thiểu đạt yêu cầu môn học.
- [ ] Ghi lại quá trình thay đổi file vào `.sdd/agents_changelog.md`.
