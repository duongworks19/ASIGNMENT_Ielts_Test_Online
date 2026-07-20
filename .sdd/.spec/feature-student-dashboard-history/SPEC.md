# Feature: Student Dashboard & Learning History (feature-student-dashboard-history) — FULL SPECIFICATION

Status: **APPROVED**
Author: Group 3 – SE2014js | Feature Owner: Student Dashboard Module | Date: 2026-06-11
Risk Level: **Medium** (Data Aggregation, Cross-feature Integration, UI Reporting Accuracy)
Related Specs: `.sdd/global/constitution.md`, `.sdd/shared_context.md`, `feature-auth-and-users`, `feature-course-learning`, `feature-practice-test-quiz`, `feature-shared-ui-api-infrastructure`

## 1. Business Context & Goals

This feature provides the personal progress center for Student users in the IELTS Online Learning Website.

The project problem statement identifies that learners lack a personalized learning path, cannot clearly see weak IELTS skills, and do not have a detailed progress report after learning or taking quizzes. This feature solves that gap by turning quiz attempts, course progress, and lesson completion data into a clear dashboard and learning history.

Goals:

* Provide a Student Dashboard that summarizes learning progress in one screen.
* Show Stat Cards for completed lessons, completed tests, current/average Band Score, and mock study hours.
* Visualize test score progress over time using a Line Chart.
* Visualize IELTS skill balance using a Radar Chart for Listening, Reading, Writing, and Speaking.
* Provide a Learning History page where students can search, filter, and review previous test attempts.
* Allow students to open old attempt details and navigate to Review Mode for answers and explanations.
* Reuse JSON-Server mock collections without introducing production database complexity.

## 2. Stakeholders & User Personas

* **Student:** Authenticated learner who wants to track IELTS learning progress, view score trends, identify weak skills, and review past quiz attempts.
* **Teacher:** Indirect stakeholder who may later use student progress data for tracking, but does not directly manage this feature.
* **Admin:** Indirect stakeholder who ensures system data is consistent and demo-ready.
* **Developer Team:** Needs a clear vertical-slice spec to implement dashboard UI, API services, calculations, loading/error states, and route protection consistently.

## 3. User Stories (all paths)

* **DASH-01:** As a Student, I want to view my dashboard, so that I can quickly understand my current IELTS learning progress.
* **DASH-02:** As a Student, I want to see stat cards for lessons completed, tests completed, Band Score, and study hours, so that I can evaluate my overall activity.
* **DASH-03:** As a Student, I want to view a line chart of my test scores over time, so that I can see whether my IELTS performance is improving.
* **DASH-04:** As a Student, I want to view a radar chart of Listening, Reading, Writing, and Speaking, so that I can identify weak skills.
* **DASH-05:** As a Student, I want to view my test history, so that I can review all attempts I have submitted.
* **DASH-06:** As a Student, I want to search and filter my history by skill and date, so that I can find relevant attempts quickly.
* **DASH-07:** As a Student, I want to open a previous attempt, so that I can see score, Band Score, submitted date, and answer summary.
* **DASH-08:** As a Student, I want to navigate from history to Review Mode, so that I can review correct answers and explanations.
* **DASH-09:** As a new Student, I want to see an empty state with guidance, so that I know where to start learning or taking tests.

## 4. Acceptance Criteria (EARS — exhaustive)

**Ubiquitous (Always true)**

* THE system SHALL allow only authenticated users with `role = 'student'` to access `/learning/dashboard`, `/learning/history`, and `/learning/history/:attemptId`. *(Lưu ý: Route `/learning/history` là route mới, phải được khai báo trong `AppRoutes.jsx` và ghi nhận vào `.sdd/agents_changelog.md`)*.
* THE system SHALL read `userId` from the authenticated Redux/Auth state and SHALL NOT allow the client to display another user’s dashboard data.
* THE system SHALL calculate dashboard metrics only from records where `record.userId === auth.user.id`.
* THE system SHALL use JSON-Server mock API collections: `testAttempts`, `lessonProgress`, `enrollments`, `courses`, `tests`, and `users`.
* THE system SHALL display loading, error, empty, and success states for dashboard and history screens.
* THE system SHALL display Band Score values in the range `0.0` to `9.0`.
* THE system SHALL render charts responsively for mobile, tablet, and desktop screens.
* THE system SHALL not mutate `testAttempts`, `lessonProgress`, or `enrollments` from the dashboard feature; this feature is read-only except for client-side filters.

**Event-driven (Triggered by events)**

* WHEN a Student opens `/learning/dashboard`, THE system SHALL fetch `testAttempts`, `lessonProgress`, and `enrollments` for the current `userId`.
* WHEN dashboard data is fetched successfully, THE system SHALL compute and display: `completedLessons`, `completedTests`, `currentBandScore`, `averageBandScore`, and `totalStudyHoursMock`.
* WHEN the Student has at least one test attempt, THE system SHALL render a Line Chart sorted by `submittedAt` ascending.
* WHEN the Student has test attempts grouped by IELTS skill, THE system SHALL render a Radar Chart with average Band Score per skill.
* WHEN the Student has no test attempts, THE system SHALL show an empty state for charts instead of crashing.
* WHEN the Student opens `/learning/history`, THE system SHALL fetch `testAttempts?userId={currentUserId}` and related `tests` data.
* WHEN history data is loaded, THE system SHALL display attempts sorted by `submittedAt` descending.
* WHEN the Student enters a search keyword, THE system SHALL filter history by test title or skill without reloading the page.
* WHEN the Student selects a skill filter, THE system SHALL show only attempts matching that skill.
* WHEN the Student selects a date range, THE system SHALL show only attempts whose `submittedAt` is within that range.
* WHEN the Student clicks an attempt item, THE system SHALL navigate to `/learning/history/:attemptId`.
* WHEN the Student clicks “Review Answers” from an attempt detail, THE system SHALL navigate to `/learning/tests/:testId/review?attemptId={attemptId}`.
* WHEN the Practice Test feature creates a new `testAttempts` record, THE dashboard SHALL reflect the new data after refetching or revisiting the dashboard.

**State-driven (Continuous conditions)**

* WHILE dashboard data is loading, THE system SHALL show Skeleton UI or Spinner components.
* WHILE API request fails, THE system SHALL show a friendly error message and a retry action.
* WHILE the Student has no completed lessons, THE completed lesson stat SHALL show `0` and the UI SHALL remain stable.
* WHILE the Student has no test attempts, THE Band Score stat SHALL show `N/A` or `0.0` with label “No test data yet”.
* WHILE the viewport width is below `768px`, THE dashboard SHALL stack stat cards and charts vertically.
* WHILE a filter is active on the history page, THE UI SHALL display the active filter state and allow clearing filters.

**Unwanted (Error handling)**

* WHERE a Guest accesses `/learning/dashboard` or `/learning/history`, THE system SHALL redirect to `/login`.
* WHERE a non-Student user accesses Student dashboard routes, THE system SHALL render `/403`.
* WHERE an attempt exists but `attempt.userId !== auth.user.id`, THE system SHALL deny access and show `403` or “Attempt not found”.
* WHERE a `testAttempts` record references a deleted/missing `tests` record, THE system SHALL display “Unknown Test” and SHALL NOT crash.
* WHERE `bandScore`, `correctAnswers`, or `totalQuestions` is missing, THE system SHALL fallback to safe values and mark the record as incomplete.
* WHERE `totalQuestions = 0`, THE system SHALL avoid division by zero and display score as `0%` or `N/A`.
* WHERE `submittedAt` is invalid, THE system SHALL place the record at the bottom of the list and show “Invalid date”.
* WHERE no history result matches filters, THE system SHALL show “No attempts found” with a Clear Filters button.
* WHERE JSON-Server is offline, THE system SHALL show an API error state and SHALL NOT render misleading zero metrics as real progress.

## 5. API Contracts (JSON-Server mock schema)

Base URL is configured by `VITE_API_BASE_URL` or the shared Axios instance in `src/services/apiClient.js`.

* `GET /testAttempts?userId={userId}&_sort=-submittedAt` -> 200 OK *(Cú pháp sort của json-server v1.0.0-beta là `_sort=-submittedAt` thay vì `_order=desc`)*
* `GET /testAttempts/:attemptId` -> 200 OK
* `GET /tests` -> 200 OK
* `GET /tests/:testId` -> 200 OK
* `GET /lessonProgress?userId={userId}` -> 200 OK
* `GET /enrollments?userId={userId}` -> 200 OK
* `GET /courses` -> 200 OK
* `GET /users/:userId` -> 200 OK

## 6. Data Models & DB Schema Changes

The system uses the existing `db.json` JSON-Server mock database. No production database migration is required.

**Core Collections Used by This Feature:**

* `users`: Stores student profile and role. Dashboard MUST use the authenticated `users.id` as the source of truth for filtering.
* `testAttempts`: Stores submitted quiz attempts. Used for Stat Cards, Line Chart, Radar Chart, Learning History, and Attempt Detail. **LƯU Ý:** Collection `testAttempts` hiện chưa có trong `db.json` gốc, BẮT BUỘC phải khởi tạo `testAttempts: []` vào `db.json` trước khi code để tránh lỗi 404.
* `tests`: Stores test metadata such as title, skill, type, and description. Used to display readable test names in history.
* `lessonProgress`: Stores completed lessons. Used to calculate `completedLessons` and mock study hours.
* `enrollments`: Stores course enrollment and progress percentage. Used for dashboard summary and course progress overview.
* `courses`: Stores course metadata. Used when dashboard shows enrolled course progress.

## 7. Non-Functional Requirements

* **Performance:** Dashboard initial render SHOULD complete in under 3 seconds on normal network when JSON-Server is available.
* **Responsiveness:** UI MUST support mobile `320px`, tablet, and desktop `1440px+` layouts.
* **Usability:** Student SHOULD reach dashboard and history within 3 clicks after login.
* **Maintainability:** Dashboard logic MUST be separated into reusable utilities/hooks such as `useDashboardData`, `calculateDashboardStats`, and `filterAttempts`.
* **Reliability:** Missing related data MUST not break the whole dashboard.
* **Security:** Student MUST only see records matching their own `userId`.
* **Accessibility:** Charts SHOULD include text summaries so users can still understand progress without relying only on visuals.

## 8. Error Handling Matrix

| Error Code         | HTTP Status / State | Message (Client)                                                      | Retry Behavior                      |
| ------------------ | ------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| `DASH_AUTH_001`    | 401                 | "Please login to view your dashboard."                                | Redirect to `/login`.               |
| `DASH_PERM_001`    | 403                 | "You do not have permission to view this page."                       | Do not retry; show `/403`.          |
| `DASH_API_001`     | Network/Error       | "Cannot load dashboard data. Please try again."                       | Show Retry button.                  |
| `DASH_EMPTY_001`   | 200 Empty           | "No learning data yet. Start a course or take a test."                | Navigate to courses/tests.          |
| `DASH_DATA_001`    | 200 Partial         | "Some records are incomplete, but your dashboard is still available." | Allow display with fallback values. |
| `DASH_ATTEMPT_001` | 404                 | "Attempt not found."                                                  | Back to history.                    |
| `DASH_FILTER_001`  | Client State        | "No attempts match your filters."                                     | Clear filters.                      |
| `DASH_DATE_001`    | Client State        | "Invalid date range."                                                 | Ask user to select valid range.     |

## 9. Edge Cases & Corner Cases

* **New Student:** No `testAttempts`, no `lessonProgress`, no `enrollments`. Dashboard shows empty state and CTA buttons: “Start Learning” and “Take Practice Test”.
* **Progress without Tests:** Student completed lessons but has not taken tests. Stat cards show lessons and hours, charts show empty test data.
* **Tests without Lesson Progress:** Student takes quiz directly. Dashboard still displays test trend and Radar Chart.
* **Missing Test Metadata:** A `testAttempts.testId` references a missing `tests.id`. History row displays `Unknown Test` and keeps score visible.
* **Band Score Null:** Attempt without `bandScore` uses fallback calculation if available; otherwise display `N/A`.
* **Same-day Attempts:** Line Chart groups by attempt timestamp, not only date, to avoid hiding multiple attempts.
* **Invalid Date:** Invalid `submittedAt` must not crash sorting or formatting.
* **Large History:** If attempts exceed 50 records, history page SHOULD use pagination or client-side page slicing.
* **Unauthorized Attempt Access:** Student manually changes URL to another attempt ID. System denies if `attempt.userId !== auth.user.id`.
* **Mobile Chart Overflow:** Charts must fit screen width or enable horizontal safe layout without breaking page.

## 10. Dependencies & Integration Points

* **Auth Feature:** Requires authenticated Student state from Redux Toolkit/LocalStorage and Protected Routes.
* **Practice Test & Quiz Feature:** Provides `testAttempts` records after submit and Review Mode route for old attempts.
* **Course Learning Feature:** Provides `lessonProgress` and `enrollments` data for lesson/course progress.
* **Shared UI & API Infrastructure:** Provides Axios instance, route config, layouts, reusable components, loading/error pattern, and toast notification.
* **Recharts:** Used for Line Chart and Radar Chart.
* **React Router DOM:** Used for dashboard/history/detail/review navigation.
* **JSON-Server:** Mock backend for all collections used by this feature.

## 11. Testing Requirements

* **Unit Tests:** Calculation utilities, skill averages, history filters, sorting attempts, fallback values.
* **Component Tests:** Dashboard stat cards, empty state, error state, history table, attempt detail.
* **Integration Tests:** Student login -> dashboard loads own data; quiz submit -> history updates; history detail -> review navigation works.
* **Coverage Target:** >= 80% for dashboard calculation utilities and history filter logic.

## 12. Rollout Plan

* **Step 1:** Khởi tạo collection `"testAttempts": []` trong `db.json` nếu chưa có. Confirm `db.json` contains seed data for `testAttempts`, `lessonProgress`, `enrollments`, `tests`, and `courses`.
* **Step 2:** Implement `dashboardApi.js` using shared Axios instance. Chú ý cú pháp query cho JSON-Server bản beta.
* **Step 3:** Implement calculation utilities and unit tests first.
* **Step 4:** Build `/learning/dashboard` with Stat Cards, Line Chart, Radar Chart, loading/error/empty states.
* **Step 5:** Build `/learning/history` with search/filter/sort and pagination. (Cập nhật route này vào `AppRoutes.jsx`).
* **Step 6:** Build `/learning/history/:attemptId` with attempt summary and Review Mode link.
* **Step 7:** Connect route protection using Auth feature.
* **Step 8:** Test with at least 2 students to verify data isolation by `userId`.
* **Step 9:** Polish responsive UI and prepare demo script.

## 13. Open Questions (must resolve before implementation)

* **Q1: [Band Score Display]** — Owner: Student Dashboard Owner — Due: Before UI coding. Decision: Show `currentBandScore` as latest attempt and optionally show `averageBandScore` as secondary text/tooltip.
* **Q2: [Mock Study Hours Formula]** — Owner: Student Dashboard Owner — Due: Before implementation. Decision: `completedLessons * 0.5 + test duration hours`, rounded to 1 decimal.
* **Q3: [Writing/Speaking Data]** — Owner: Quiz Owner + Dashboard Owner — Due: Before seed data. Decision: Radar Chart displays all 4 skills; skills without attempts show `0` or `No data`.
* **Q4: [History Detail vs Review Mode]** — Owner: Student Dashboard Owner — Due: Before routing. Decision: Attempt Detail shows score summary; Review Mode remains in Practice Test feature and is opened through a button.
