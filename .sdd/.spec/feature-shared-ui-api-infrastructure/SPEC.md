# Feature: Shared UI Components, API Services & Project Infrastructure (feature-shared-ui-api-infrastructure) — FULL SPECIFICATION

Status: **APPROVED** | Ready for Implementation
Author: Group 3 – SE2014js
Tech Lead Approval: Approved
Date: 2026-06-12
Risk Level: **Medium-High** (Foundation/Core Integration)
Related Specs: `.sdd/global/constitution.md`, `.sdd/shared_context.md`, `feature-auth-and-users`, `feature-public-discovery`, `feature-course-learning`, `feature-practice-test-quiz`, `feature-student-dashboard-history`, `feature-teacher-content-management`, `feature-admin-management-approval`

## 1. Business Context & Goals

This feature provides the technical foundation for the entire IELTS Online Learning Website. It does not represent one business flow only; instead, it defines the shared frontend architecture, reusable UI components, routing structure, API abstraction layer, Redux store, JSON-Server structure, loading/error patterns, toast notifications and deployment conventions.

Goals:

* Provide one consistent project structure so all members can develop features without duplicating code.
* Provide reusable layouts for Guest, Student, Teacher and Admin areas.
* Provide shared navigation components including Navbar, Sidebar, and Footer.
* Provide reusable UI components such as Button, Input, Modal, Badge, Spinner, Pagination, StatCard, Toast and Skeleton UI.
* Provide centralized API services using Axios so pages/components do not call JSON-Server directly.
* Provide global state management for authentication, user state and UI state.
* Provide a consistent loading, error and empty-state pattern for all features.
* Provide a valid `db.json` structure and seed data for JSON-Server.
* Prepare frontend and JSON-Server deployment so the project can be demoed reliably.
* Document AI usage transparency for code or documentation generated with AI support.

## 2. Stakeholders & User Personas

* **Guest:** Uses Public Layout to view landing page, public course list, course preview, test preview and free resources.
* **Student:** Uses Student Layout to access learning dashboard, enrolled courses, lessons, tests, history and flashcards.
* **Teacher:** Uses Teacher Layout to manage courses, lessons, tests, questions and student progress.
* **Admin:** Uses Admin Layout to manage users, courses, lessons, tests, approvals and transactions.
* **Developer Team:** Uses shared components, route configuration, API services, hooks, Redux slices and JSON-Server seed data.
* **Instructor/Reviewer:** Reviews project structure, component reuse, API integration, Git workflow, deployment and AI usage transparency.

## 3. User Stories (all paths)

* **INFRA-01:** As a Developer, I want a standard React project structure, so that all team members can place code in the correct folders.
* **INFRA-02:** As a Developer, I want shared layouts for Public, Student, Teacher and Admin, so that pages have consistent navigation and visual structure.
* **INFRA-03:** As a Developer, I want reusable UI components, so that each feature does not recreate Button, Input, Modal, Pagination or loading UI.
* **INFRA-04:** As a Developer, I want centralized route configuration, so that protected routes and role-based routes are consistent across the app.
* **INFRA-05:** As a Developer, I want an Axios instance with a shared base URL and error handling, so that API calls are consistent and easy to maintain.
* **INFRA-06:** As a Developer, I want module-based API services, so that feature pages only call service functions instead of hardcoding endpoints.
* **INFRA-07:** As a Developer, I want Redux Toolkit store setup, so that auth state and user state are managed globally.
* **INFRA-08:** As a Student/Teacher/Admin, I want loading, error, empty and success feedback, so that I understand the current state of each action.
* **INFRA-09:** As a Developer, I want a consistent `db.json` seed database, so that all features can integrate with JSON-Server using the same data model.
* **INFRA-10:** As an Instructor, I want deployed frontend and JSON-Server URLs, so that I can evaluate the project without local setup.
* **INFRA-11:** As a Developer Team, I want AI usage documentation, so that AI-assisted code is transparent and verified by humans.

## 4. Acceptance Criteria (EARS — exhaustive)

**Ubiquitous (Always true)**

* THE system SHALL use a consistent folder structure under `src/pages`, `src/routes`, `src/layouts`, `src/components`, `src/services`, `src/store`, `src/hooks` and `src/utils`.
* THE system SHALL keep shared UI components inside `src/components` and page-specific components inside `src/pages/{actor}/components`.
* THE system SHALL prevent direct Axios calls from page components; pages SHALL call module services from `src/services` or page-specific services.
* THE system SHALL read API base URL from `process.env.REACT_APP_API_BASE_URL`, not from hardcoded strings inside pages.
* THE system SHALL use React Router DOM for all navigation flows.
* THE system SHALL provide Public Layout, Student Layout, Teacher Layout and Admin Layout.
* THE system SHALL provide shared navigation components including Navbar, Sidebar, and Footer.
* THE system SHALL provide a shared 404 page and a shared 403 page.
* THE system SHALL support responsive UI from mobile width to desktop width using Bootstrap 5.
* THE system SHALL provide reusable loading, error, empty and success feedback components.
* THE system SHALL keep `db.json` valid JSON at all times.
* THE system SHALL use meaningful naming conventions for routes, services, slices, components and hooks.

**Event-driven (Triggered by events)**

* WHEN the React app starts, THE system SHALL initialize the router, Redux store, persisted auth state and global UI providers.
* WHEN a user navigates to a public route, THE system SHALL render the route inside Public Layout.
* WHEN a Student navigates to `/learning/*`, THE system SHALL render the route inside Student Layout if the user is authenticated and has role `student`.
* WHEN a Teacher navigates to `/teacher/*`, THE system SHALL render the route inside Teacher Layout if the user is authenticated and has role `teacher`.
* WHEN an Admin navigates to `/admin/*`, THE system SHALL render the route inside Admin Layout if the user is authenticated and has role `admin`.
* WHEN an unauthenticated user accesses a protected route, THE system SHALL redirect the user to `/login`.
* WHEN an authenticated user accesses a route that does not match their role, THE system SHALL show `/403`.
* WHEN a route does not exist, THE system SHALL show `/404`.
* WHEN a page starts fetching data, THE system SHALL show Spinner, Skeleton UI or a page-level loading state.
* WHEN an API request succeeds, THE system SHALL update local/page state or Redux state and show a success toast for create/update/delete actions.
* WHEN an API request fails, THE system SHALL show a readable error message and avoid breaking the whole page.
* WHEN a list has no data, THE system SHALL show an EmptyState component instead of a blank page.
* WHEN a list supports search/filter/pagination, THE system SHALL preserve current filter state in component state or query parameters where appropriate.
* WHEN `db.json` is updated, THE system SHALL keep required collections and relationships compatible with the Data Model Draft.
* WHEN the project is deployed, THE system SHALL use deployed environment variables for frontend and JSON-Server base URLs.

**State-driven (Continuous conditions)**

* WHILE a user is logged in, THE system SHALL keep `auth.user`, `auth.token` and `auth.role` available through Redux state and persist required login state in LocalStorage.
* WHILE an API request is pending, THE system SHALL prevent duplicate destructive actions where needed, such as double delete or double submit.
* WHILE JSON-Server is unavailable, THE system SHALL display an API connection error instead of crashing the app.
* WHILE a modal is open, THE system SHALL allow the user to close it by cancel button, close icon or safe outside-click behavior if implemented.
* WHILE a feature uses shared Pagination, THE system SHALL keep page number, page size and total count consistent with JSON-Server response headers or computed data length.
* WHILE AI-generated code is used, THE Developer Team SHALL review, test and document the assisted parts before committing.

**Unwanted (Error handling)**

* WHERE API base URL is missing, THE system SHALL fail gracefully with a configuration error message for developers.
* WHERE JSON-Server returns 404 for a requested resource, THE system SHALL show a not-found or empty state depending on context.
* WHERE JSON-Server returns invalid or incomplete data, THE system SHALL avoid rendering undefined values directly in UI.
* WHERE a user performs create/update with invalid form input, THE system SHALL show validation messages before calling the API.
* WHERE a destructive action is triggered, THE system SHALL require confirmation through Modal or confirm pattern.
* WHERE a shared component receives optional props, THE component SHALL use safe default values.
* WHERE multiple features need similar UI, THE system SHALL reuse shared components instead of duplicating new versions.
* WHERE deployment build fails, THE team SHALL fix lint/build errors before demo and document the final deployed URLs.

## 5. API Contracts (JSON-Server + Service Layer)

This feature does not own one business API only. It defines the shared API contract style used by all features.

**HTTP Client**

* `src/services/httpClient.js`

  * Base URL: `process.env.REACT_APP_API_BASE_URL`
  * Default headers: `Content-Type: application/json`.
  * Request interceptor: attach mock token if available.
  * Response interceptor: normalize error messages.

**Module Services**

* `authService`

  * `GET /users?email={email}`
  * `POST /users`
  * `PATCH /users/:id`
* `userService`

  * `GET /users`
  * `GET /users/:id`
  * `POST /users`
  * `PATCH /users/:id`
  * `DELETE /users/:id`
* `courseService`

  * `GET /courses`
  * `GET /courses/:id`
  * `GET /courses?skill={skill}`
  * `GET /courses?level={level}`
  * `GET /courses?teacherId={teacherId}`
  * `POST /courses`
  * `PATCH /courses/:id`
  * `DELETE /courses/:id`
* `lessonService`

  * `GET /lessons`
  * `GET /lessons?courseId={courseId}`
  * `GET /lessons?teacherId={teacherId}`
  * `POST /lessons`
  * `PATCH /lessons/:id`
  * `DELETE /lessons/:id`
* `enrollmentService`

  * `GET /enrollments?userId={userId}`
  * `GET /enrollments?courseId={courseId}`
  * `POST /enrollments`
  * `PATCH /enrollments/:id`
* `testService`

  * `GET /tests`
  * `GET /tests/:id`
  * `POST /tests`
  * `PATCH /tests/:id`
  * `DELETE /tests/:id`
* `questionService`

  * `GET /questions?testId={testId}`
  * `POST /questions`
  * `PATCH /questions/:id`
  * `DELETE /questions/:id`
* `testAttemptService`

  * `GET /testAttempts?userId={userId}`
  * `GET /testAttempts/:id`
  * `POST /testAttempts`
* `flashcardService`

  * `GET /flashcards`
  * `GET /flashcards?category={category}`
  * `POST /flashcardProgress`
  * `PATCH /flashcardProgress/:id`
* `approvalService`

  * `GET /approvalRequests`
  * `GET /approvalRequests?teacherId={teacherId}`
  * `POST /approvalRequests`
  * `PATCH /approvalRequests/:id`
* `paymentService`

  * `POST /payments`
  * `GET /payments?userId={userId}`
  * `GET /transactions`

## 6. Data Models & DB Schema Changes

The system uses `db.json` as a mock database for JSON-Server. This feature owns the structure and initial seed quality of `db.json`, but each business feature owns the detailed behavior of its own collections.

**Required Collections**

```json
{
  "roles": [],
  "users": [],
  "courses": [],
  "lessons": [],
  "enrollments": [],
  "lessonProgress": [],
  "tests": [],
  "questions": [],
  "testAttempts": [],
  "flashcards": [],
  "flashcardProgress": [],
  "approvalRequests": [],
  "payments": [],
  "transactions": [],
  "freeResources": [],
  "skills": [],
  "levels": [],
  "categories": []
}
```

**Core Relationship Rules**

* `users.role` SHALL match `roles.name`.
* `courses.teacherId` SHALL reference `users.id` where role is `teacher`.
* `lessons.courseId` SHALL reference `courses.id`.
* `lessons.teacherId` SHALL reference `users.id` where role is `teacher`.
* `enrollments.userId` SHALL reference `users.id` where role is `student`.
* `enrollments.courseId` SHALL reference `courses.id`.
* `lessonProgress.userId`, `lessonProgress.courseId`, `lessonProgress.lessonId` SHALL match existing records.
* `questions.testId` SHALL reference `tests.id`.
* `testAttempts.userId` SHALL reference `users.id` where role is `student`.
* `testAttempts.testId` SHALL reference `tests.id`.
* `payments.userId` and `transactions.userId` SHALL reference `users.id`.

**ID Convention**

* User IDs: `u-student-001`, `u-teacher-001`, `u-admin-001`
* Course IDs: `course-001`
* Lesson IDs: `lesson-001`
* Test IDs: `test-001`
* Question IDs: `q-001`
* Attempt IDs: `attempt-001`
* Payment IDs: `payment-001`
* Transaction IDs: `tx-001`

**Seed Data Minimum**

* At least 1 active Student, 1 active Teacher and 1 active Admin.
* At least 4 approved courses covering different IELTS skills.
* At least 1 course with 3 lessons.
* At least 1 test with enough MCQ questions for demo.
* At least 1 test attempt for dashboard/history demo.
* At least 1 flashcard category with multiple flashcards.
* At least 1 pending approval request for Admin demo.
* At least 1 mock transaction for payment/admin statistics demo.

## 7. Non-Functional Requirements

* **Maintainability:** Shared components and services must reduce duplication across features. Similar UI patterns should be implemented once and reused.
* **Performance:** Initial page load should be under 3 seconds on normal network during demo. Large routes should use lazy loading where appropriate.
* **Responsive UI:** Layouts and shared components must work from mobile width to desktop width.
* **Reliability:** JSON-Server failures must not crash the React app.
* **Usability:** User feedback must be visible for loading, success, error and empty states.
* **Scalability:** Folder structure must allow new routes to be added under `src/pages` without modifying unrelated modules.
* **Security:** Mock token and mock user state are for FER demo only. No real secrets, passwords, API keys or private data may be committed.
* **Accessibility:** Shared Button, Input, Modal and navigation components should use readable labels, keyboard-friendly behavior and semantic HTML where possible.
* **AI Transparency:** Any code, component or document generated with AI support must be reviewed and mentioned in AI usage notes.

## 8. Error Handling Matrix

| Error Code       | HTTP Status / Source | Message (Client)                                        | Retry Behavior                        |
| ---------------- | -------------------- | ------------------------------------------------------- | ------------------------------------- |
| `INF_API_001`    | Network Error        | "Không thể kết nối máy chủ. Vui lòng thử lại sau."      | Allow retry.                          |
| `INF_API_002`    | 404                  | "Không tìm thấy dữ liệu yêu cầu."                       | Do not retry unless route/id changes. |
| `INF_API_003`    | 500                  | "Máy chủ đang gặp lỗi. Vui lòng thử lại sau."           | Allow retry later.                    |
| `INF_AUTH_001`   | 401                  | "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." | Redirect to login.                    |
| `INF_AUTH_002`   | 403                  | "Bạn không có quyền truy cập trang này."                | Do not retry.                         |
| `INF_FORM_001`   | Client validation    | "Vui lòng kiểm tra lại thông tin đã nhập."              | Allow retry after fixing input.       |
| `INF_EMPTY_001`  | 200 Empty List       | "Chưa có dữ liệu để hiển thị."                          | No retry required.                    |
| `INF_CONFIG_001` | Missing env          | "Thiếu cấu hình API base URL."                          | Developer must fix `.env`.            |
| `INF_JSON_001`   | Invalid seed data    | "Dữ liệu mẫu không đúng cấu trúc."                      | Developer must fix `db.json`.         |
| `INF_DEPLOY_001` | Build/Deploy Error   | "Ứng dụng chưa deploy thành công."                      | Developer must fix build logs.        |

## 9. Edge Cases & Corner Cases

* **Refresh page on protected route:** If user refreshes `/learning/dashboard`, auth state must be restored from LocalStorage before route guard decides access.
* **Role mismatch after login:** If a Student manually enters `/admin/dashboard`, route guard must show 403 instead of rendering Admin Layout.
* **JSON-Server not running:** Pages must show connection error instead of infinite loading.
* **Empty database collection:** List pages must render EmptyState and not crash.
* **Deleted related data:** If a lesson references a deleted course, UI must not render undefined course title; show fallback text.
* **Duplicate shared components:** If a feature needs a new shared-like component, the team must check `src/components` first before creating another one.
* **Modal destructive action:** Delete confirmation must clearly show what is being deleted.
* **Pagination after delete:** If deleting the last item on a page, list should move to a valid page or refetch safely.
* **Search with no result:** Show EmptyState with current search keyword/filter context.
* **Deployment environment mismatch:** Frontend deployed URL must point to the deployed JSON-Server URL, not localhost.
* **AI-generated code not understood:** Code must not be committed until a team member can explain and verify it.

## 10. Dependencies & Integration Points

* **ReactJS:** Core SPA framework.
* **React Router DOM:** Route configuration, nested routes, dynamic routes, protected routes and role-based routes.
* **Redux Toolkit:** Global auth state, user state.
* **Axios:** HTTP client for JSON-Server API calls.
* **JSON-Server:** Mock backend and REST API for all collections.
* **LocalStorage:** Persist mock token and user session for demo.
* **React Hook Form + Zod:** Recommended for form validation in Auth, Course, Lesson, Test and Admin forms.
* **Toast Library:** Used for success/error feedback after create, update, delete and submit actions.
* **Recharts:** Used by Dashboard features, but shared chart wrapper patterns may live in shared components if reused.
* **Vercel/Netlify:** Frontend deployment.
* **Render:** JSON-Server deployment.
* **GitHub:** Source repository, branching strategy, pull requests and meaningful commits.

## 11. Testing Requirements

**Unit Tests**

* Shared UI components: Button, Input, Modal, Badge, Spinner, Pagination, StatCard and EmptyState.
* Utility functions: format date, format currency, calculate pagination metadata, normalize API errors.
* Redux slices: auth slice login/logout/persist behavior.
* Custom hooks: `useDebounce`, `usePagination`, `useAsync` if implemented.

**Integration Tests**

* Public route renders Public Layout.
* Student route renders Student Layout only for role `student`.
* Teacher route renders Teacher Layout only for role `teacher`.
* Admin route renders Admin Layout only for role `admin`.
* Unauthenticated user is redirected to `/login` when accessing protected route.
* Wrong role shows `/403`.
* API service fetches data from JSON-Server and handles error state.
* CRUD flow shows loading, success toast and refreshed data.

**Manual Demo Checklist**

* Run React app locally.
* Run JSON-Server locally.
* Login with Student/Teacher/Admin seed accounts.
* Navigate through Public, Student, Teacher and Admin layouts.
* Confirm shared Navbar, Sidebar and Footer display correctly.
* Confirm 404 and 403 pages work.
* Confirm at least one list page shows search/filter/pagination.
* Confirm deployed frontend can call deployed JSON-Server.

**Coverage Target:** >= 70% for shared components, services, route guards and store logic.

## 12. Rollout Plan

* **Phase 1 — Foundation Setup:** Create React project, install dependencies, configure folder structure, router, layouts and base styling.
* **Phase 2 — Shared UI Components:** Build Button, Input, Modal, Badge, Spinner, Pagination, StatCard, Toast wrapper, EmptyState and Skeleton UI.
* **Phase 3 — API Layer:** Create Axios instance, service modules and normalized error handling.
* **Phase 4 — State Management:** Configure Redux store, auth slice, persisted mock login and role-based route guard.
* **Phase 5 — JSON-Server:** Build `db.json` with required collections, seed data and relationship consistency.
* **Phase 6 — Feature Integration:** Connect Auth, Public, Student, Teacher and Admin features to shared layout/services/components.
* **Phase 7 — Testing & Cleanup:** Run manual demo checklist, fix duplicate components, fix broken routes and clean unused code.
* **Phase 8 — Deployment:** Deploy frontend to Vercel/Netlify and JSON-Server to Render. Update environment variables and final README.

## 13. Resolved Questions (Decisions Made)

* **Q1: [UI Framework]** — **Decision:** Use **Bootstrap 5 & React-Bootstrap**. Tailwind CSS is strictly prohibited as per `AGENTS.md`. All designs must adhere strictly to `DESIGN.md`.
* **Q2: [React Setup]** — **Decision:** Use **Create React App (CRA)**. Vite and Next.js are prohibited as per `constitution.md`.
* **Q3: [State Scope]** — **Decision:** Redux Toolkit will **only be used for global state** (e.g., auth session data). UI states (e.g., modals, sidebar, toasts) should be handled via React local state (`useState`) or Context to avoid over-engineering.
* **Q4: [API Pattern]** — **Decision:** Use **Axios service functions only**. Avoid RTK Query to keep data fetching patterns simple, readable, and easy to present in the defense session.
* **Q5: [Deployment]** — **Decision:** To be decided later by DevOps/Team Lead, but must ensure deployed frontend points to deployed JSON-Server via `process.env`.
* **Q6: [AI Usage Transparency]** — **Decision:** Document AI usage in `AI_USAGE.md` or a dedicated section in the README.
