# Feature: IELTS Vocabulary Flashcards (feature-flashcards) — FULL SPECIFICATION

Status: **APPROVE** | Ready for Review
Author: Group 3 – SE2014js
Tech Lead Approval: Pending
Date: 2026-06-12
Risk Level: **Medium** (Student Learning Enhancement)
Related Specs: `.sdd/global/constitution.md`, `.sdd/shared_context.md`, `feature-auth-and-users`, `feature-course-learning`, `feature-student-dashboard-history`

## 1. Business Context & Goals

This feature provides an interactive vocabulary learning experience through IELTS Flashcards. It allows Students to learn vocabulary by category, interact with flashcards using flip-card behavior, navigate between cards, shuffle flashcards and track vocabulary learning progress.

The feature serves as a complementary learning activity alongside courses and practice tests, helping students improve IELTS vocabulary retention through repetition and active recall techniques.

Goals:

* Provide categorized IELTS vocabulary flashcard decks.
* Allow students to browse and select flashcard decks.
* Allow students to filter flashcards by category/topic.
* Provide front/back flashcard interaction.
* Allow students to flip flashcards to reveal meanings.
* Allow navigation using Next and Previous controls.
* Provide shuffle mode for randomized learning.
* Allow students to mark flashcards as Known or Review.
* Persist flashcard learning status per student.
* Integrate vocabulary learning progress with the overall learning experience.

## 2. Stakeholders & User Personas

* **Student:** Uses flashcards to learn IELTS vocabulary, review words and track learning progress.
* **Developer Team:** Implements flashcard UI, learning interactions, API integration and state persistence.
* **Instructor/Reviewer:** Reviews functionality, learning flow, component structure, API integration and user experience.

## 3. User Stories (all paths)

* **FLASH-01:** As a Student, I want to view available flashcard decks, so that I can choose a vocabulary topic to study.
* **FLASH-02:** As a Student, I want to filter flashcards by category, so that I can focus on specific vocabulary groups.
* **FLASH-03:** As a Student, I want to open a flashcard deck, so that I can begin learning vocabulary.
* **FLASH-04:** As a Student, I want to flip a flashcard, so that I can reveal its meaning.
* **FLASH-05:** As a Student, I want to move to the next flashcard, so that I can continue learning.
* **FLASH-06:** As a Student, I want to move to the previous flashcard, so that I can revisit vocabulary.
* **FLASH-07:** As a Student, I want to shuffle flashcards, so that vocabulary appears in a random order.
* **FLASH-08:** As a Student, I want to mark vocabulary as Known, so that I can track mastered words.
* **FLASH-09:** As a Student, I want to mark vocabulary as Review, so that I can revisit difficult words later.
* **FLASH-10:** As a Student, I want my flashcard progress saved, so that I do not lose learning history after leaving the page.

## 4. Acceptance Criteria (EARS — exhaustive)

**Ubiquitous (Always true)**

* THE system SHALL display flashcards using a card-based UI.
* THE system SHALL support front-side and back-side flashcard views.
* THE system SHALL display vocabulary information consistently across all flashcards.
* THE system SHALL support responsive UI from mobile width to desktop width.
* THE system SHALL store flashcard learning status separately for each student.
* THE system SHALL allow filtering by category.
* THE system SHALL provide visual indication of learning status.
* THE system SHALL prevent data loss during normal navigation.
* THE system SHALL use reusable shared UI components where applicable.

**Event-driven (Triggered by events)**

* WHEN a Student navigates to `/learning/flashcards`, THE system SHALL load available flashcard decks.
* WHEN a Student selects a category filter, THE system SHALL display flashcards matching that category.
* WHEN a Student opens a flashcard deck, THE system SHALL load deck flashcards.
* WHEN a Student clicks a flashcard, THE system SHALL flip the card and display the opposite side.
* WHEN a Student clicks Next, THE system SHALL display the next flashcard.
* WHEN a Student clicks Previous, THE system SHALL display the previous flashcard.
* WHEN a Student clicks Shuffle, THE system SHALL randomize flashcard order.
* WHEN a Student marks a flashcard as Known, THE system SHALL save status as `known`.
* WHEN a Student marks a flashcard as Review, THE system SHALL save status as `review`.
* WHEN a Student updates flashcard status, THE system SHALL persist progress through the API.
* WHEN flashcard data is loading, THE system SHALL display a loading state.
* WHEN flashcard data cannot be loaded, THE system SHALL display a readable error message.
* WHEN no flashcards match the selected filter, THE system SHALL display an EmptyState component.

**State-driven (Continuous conditions)**

* WHILE a Student is viewing a flashcard, THE system SHALL maintain the current card position.
* WHILE a Student remains in a deck, THE system SHALL preserve the selected category filter.
* WHILE a flashcard is marked Known, THE system SHALL visually indicate mastered status.
* WHILE a flashcard is marked Review, THE system SHALL visually indicate review status.
* WHILE an API request is pending, THE system SHALL prevent duplicate save actions.
* WHILE JSON-Server is unavailable, THE system SHALL display a connection error instead of crashing.

**Unwanted (Error handling)**

* WHERE a requested flashcard deck does not exist, THE system SHALL display a not-found state.
* WHERE flashcard data is incomplete, THE system SHALL display fallback values instead of undefined content.
* WHERE flashcard progress cannot be saved, THE system SHALL display an error notification.
* WHERE category filter returns no data, THE system SHALL show an EmptyState component.
* WHERE duplicate status updates are triggered, THE system SHALL avoid creating duplicate progress records.

## 5. API Contracts (JSON-Server + Service Layer)

**Module Service**

* `flashcardService`

  * `GET /flashcards`
  * `GET /flashcards?category={category}`
  * `POST /flashcardProgress`
  * `PATCH /flashcardProgress/:id`

**Example Service Functions**

* `getAllFlashcards()`
* `getFlashcardsByCategory(category)`
* `createFlashcardProgress(data)`
* `updateFlashcardProgress(id, data)`

## 6. Data Models & DB Schema Changes

This feature uses flashcard-related collections already defined in the shared database structure.

**Required Collections**

```json
{
  "flashcards": [],
  "flashcardProgress": [],
  "users": [],
  "categories": []
}
```

**Core Relationship Rules**

* `flashcardProgress.userId` SHALL reference `users.id`.
* `flashcardProgress.flashcardId` SHALL reference `flashcards.id`.
* `flashcards.categoryId` SHALL reference `categories.id`.

**ID Convention**

* Flashcard IDs: `flashcard-001`
* Flashcard Progress IDs: `fp-001`
* Category IDs: `cat-001`

**Seed Data Minimum**

* At least 3 flashcard categories.
* At least 10 flashcards per category.
* At least 1 student progress record for demo purposes.

## 7. Non-Functional Requirements

* **Maintainability:** Flashcard components must be modular and reusable. Learning logic should be separated from UI rendering.
* **Performance:** Flashcard decks should load within 2 seconds under normal demo conditions. Navigation between cards should feel instantaneous.
* **Responsive UI:** Flashcard pages and interactions must work on mobile, tablet and desktop screens.
* **Reliability:** Flashcard progress must persist after page refresh and user re-login.
* **Usability:** Flashcard controls (Flip, Next, Previous, Shuffle, Known, Review) must be intuitive and easy to access.
* **Scalability:** New flashcard categories and vocabulary sets should be added without requiring architecture changes.
* **Security:** Students may only modify their own flashcard progress records.
* **Accessibility:** Flashcards should support keyboard navigation and readable typography where possible.
* **AI Transparency:** Any AI-generated code or documentation used for this feature must be reviewed and documented before submission.

## 8. Error Handling Matrix

| Error Code           | HTTP Status / Source | Message (Client)                                   | Retry Behavior                   |
| -------------------- | -------------------- | -------------------------------------------------- | -------------------------------- |
| `FLASH_API_001`      | Network Error        | "Không thể kết nối máy chủ. Vui lòng thử lại sau." | Allow retry.                     |
| `FLASH_API_002`      | 404                  | "Không tìm thấy bộ flashcard yêu cầu."             | Retry only if route changes.     |
| `FLASH_API_003`      | 500                  | "Máy chủ đang gặp lỗi. Vui lòng thử lại sau."      | Allow retry later.               |
| `FLASH_PROGRESS_001` | Save Failure         | "Không thể lưu tiến độ học tập."                   | Allow retry.                     |
| `FLASH_EMPTY_001`    | Empty List           | "Chưa có flashcard để hiển thị."                   | No retry required.               |
| `FLASH_FILTER_001`   | Empty Filter Result  | "Không tìm thấy flashcard phù hợp."                | User may change filter.          |
| `FLASH_DATA_001`     | Invalid Data         | "Dữ liệu flashcard không hợp lệ."                  | Developer must fix seed data.    |
| `FLASH_ROUTE_001`    | Invalid Deck ID      | "Bộ flashcard không tồn tại."                      | Redirect back to flashcard list. |

## 9. Edge Cases & Corner Cases

* **Refresh During Learning:** Student refreshes browser while viewing a flashcard. Current progress should remain saved.
* **Single Flashcard Deck:** Deck contains only one flashcard. Next and Previous actions should remain safe.
* **Empty Category:** Category exists but contains no flashcards.
* **Deleted Flashcard:** Progress record references a deleted flashcard.
* **Shuffle Repeatedly:** Student repeatedly presses Shuffle. Application should remain responsive.
* **Large Deck:** Deck contains many flashcards. Navigation should remain smooth.
* **Slow API Response:** Loading state should appear until data is received.
* **Duplicate Status Update:** Student repeatedly marks the same card as Known or Review.
* **Direct URL Access:** Student manually enters an invalid deck ID in URL.
* **Lost Connection:** JSON-Server becomes unavailable while learning.

## 10. Dependencies & Integration Points

* **ReactJS:** Core frontend framework.
* **React Router DOM:** Flashcard routes and deck navigation.
* **Redux Toolkit:** Optional storage of flashcard state and user session.
* **Bootstrap 5 & React-Bootstrap:** MUST be used for layout, grid, and all Shared UI Components (Button, Spinner, EmptyState, Badge, Toast, Modal) per project rules.
* **Axios:** API communication with JSON-Server.
* **JSON-Server:** Mock backend for flashcard data and learning progress.
* **LocalStorage:** Persist login and optional learning state.
* **Student Layout:** Hosts flashcard pages inside learning area.
* **feature-auth-and-users:** Provides authentication and student identity.
* **feature-course-learning:** Integrates vocabulary learning into learning ecosystem.
* **feature-student-dashboard-history:** May display flashcard learning progress summaries.
* **GitHub:** Source control, pull requests and code review workflow.

## 11. Testing Requirements

**Unit Tests**

* FlashcardDeck component rendering.
* FlipCard component flip behavior.
* FlashcardFilter category filtering.
* FlashcardProgress status calculation.
* Shuffle algorithm behavior.
* Flashcard service functions.
* Progress update logic.

**Integration Tests**

* Student accesses `/learning/flashcards`.
* Student filters flashcards by category.
* Student opens flashcard deck.
* Student flips flashcards.
* Student navigates Next and Previous.
* Student shuffles flashcards.
* Student marks Known status.
* Student marks Review status.
* Progress data persists through API integration.
* Empty state and error state render correctly.

**Manual Demo Checklist**

* Login as Student.
* Open Flashcard page.
* View available flashcard categories.
* Filter flashcards successfully.
* Open a flashcard deck.
* Flip flashcards correctly.
* Navigate using Next and Previous buttons.
* Shuffle flashcards.
* Mark cards as Known.
* Mark cards as Review.
* Refresh page and verify progress persists.
* Confirm responsive behavior on mobile and desktop.

**Coverage Target:** >= 70% for flashcard components, service layer and progress-management logic.

## 12. Rollout Plan

* **Requirement:** Every AI agent change to code, routes, or db.json MUST be logged in `.sdd/agents_changelog.md`.
* **Phase 0 — Pre-requisite:** Fix current syntax error in `db.json` to prevent json-server crash.
* **Phase 1 — Data Setup:** Create flashcard categories, vocabulary data and progress collections in `db.json`.
* **Phase 2 — Route Setup:** Implement `/learning/flashcards` and `/learning/flashcards/:deckId`.
* **Phase 3 — Core Components:** Build FlashcardDeck, FlipCard, FlashcardFilter and FlashcardProgress.
* **Phase 4 — Learning Interactions:** Implement flip, next, previous and shuffle behaviors.
* **Phase 5 — Progress Tracking:** Implement Known and Review status persistence.
* **Phase 6 — API Integration:** Connect flashcard services to JSON-Server.
* **Phase 7 — Testing & Refinement:** Execute testing checklist, fix UI and logic issues.
* **Phase 8 — Final Integration:** Verify compatibility with Student Dashboard and Learning modules.

## 13. Open Questions (must resolve before implementation)

* **Q1: [Deck Structure]** — Owner: Developer Team — Due: Before implementation. Decision needed: Should flashcards be grouped strictly by category or support multiple deck types?
* **Q2: [Shuffle Scope]** — Owner: Developer Team — Due: Learning interaction implementation. Decision needed: Shuffle current deck only or entire filtered result set?
* **Q3: [Progress Rules]** — Owner: Developer Team — Due: Progress implementation. Decision needed: Can a flashcard switch freely between Known and Review states?
* **Q4: [Dashboard Integration]** — Owner: Developer Team — Due: Final integration phase. Decision needed: How much flashcard progress should appear in Student Dashboard?
* **Q5: [Persistence Strategy]** — Owner: Developer Team — Due: API integration. Decision needed: Save every action immediately or batch updates locally?
* **Q6: [AI Usage Transparency]** — Owner: All Members — Due: Before final submission. Decision needed: Store AI usage documentation in `AI_USAGE.md`, README or final report appendix.
