# Feature: Student Course Learning (feature-course-learning) — FULL SPECIFICATION

Status: **DRAFT** | Review Required
Author: Member 2 — Student Learning | Tech Lead Approval: TBD | Date: 2026-06-11
Risk Level: **Medium** (Core Student Flow)
Related Specs: `.sdd/global/constitution.md`, `.sdd/shared_context.md`, `feature-auth-and-users`, `feature-public-discovery`, `feature-student-dashboard-history`, `feature-mock-payment-transactions`, `feature-shared-ui-api-infrastructure`

## 1. Business Context & Goals

This feature is the main learning flow for authenticated Students in the IELTS Online Learning Website. After a Guest discovers a course and logs in, this feature allows the Student to enroll, access lessons, complete learning activities, and track course progress.

Goals:

* Allow Students to browse approved IELTS courses and enroll in suitable courses.
* Provide a structured lesson learning flow with video and text content.
* Track lesson completion and calculate course progress accurately.
* Support “My Courses” and “Continue Learning” so Students can resume learning easily.
* Provide clean progress data for the Student Dashboard & Learning History feature.

## 2. Stakeholders & User Personas

* **Student:** Authenticated learner who enrolls in courses, studies lessons, marks lessons as completed, and tracks progress.
* **Guest:** Unauthenticated visitor who must log in before enrolling or accessing protected learning routes.
* **Teacher:** Content creator whose approved courses and lessons are consumed by Students.
* **Admin:** System operator who approves courses/lessons and ensures only valid content appears to Students.
* **Developer Team:** Implements React components, JSON-Server API services, protected routes, and progress calculation.

## 3. User Stories (all paths)

* **CL-01:** As a Student, I want to view the list of approved IELTS courses, so that I can choose a course that matches my target skill and level.
* **CL-02:** As a Student, I want to search, filter, sort, and paginate courses, so that I can find relevant courses quickly.
* **CL-03:** As a Student, I want to view course details, syllabus, teacher, level, skill, price, rating, and enrolled count, so that I can decide whether to join.
* **CL-04:** As a Student, I want to enroll in a free approved course, so that I can start learning immediately.
* **CL-05:** As a Student, I want to view my enrolled courses, so that I can manage my learning list.
* **CL-06:** As a Student, I want to view the lesson list of an enrolled course, so that I can follow the learning path in order.
* **CL-07:** As a Student, I want to open a lesson and view its video, transcript, and text content, so that I can study the lesson fully.
* **CL-08:** As a Student, I want to mark a lesson as completed, so that my course progress is updated.
* **CL-09:** As a Student, I want to navigate to the previous or next lesson, so that I can learn continuously without returning to the course page.
* **CL-10:** As a Student, I want to continue from my latest incomplete lesson, so that I can resume learning quickly.
* **CL-11:** As a Student, I want completed lessons and progress percentage to appear in my dashboard, so that I can understand my learning status.
* **CL-12:** As a Student, when I access a course or lesson that does not exist or is not approved, I want to see a clear error state instead of a broken page.

## 4. Acceptance Criteria (EARS — exhaustive)

**Ubiquitous (Always true)**

* THE system SHALL protect all `/learning/*` course-learning routes and allow access only to authenticated users with `role = 'student'`.
* THE system SHALL display only courses with `status = 'approved'` to Students.
* THE system SHALL display only lessons with `status = 'approved'` inside Student learning pages.
* THE system SHALL use the shared Axios/API service layer for all JSON-Server calls; React components MUST NOT call raw endpoints directly.
* THE system SHALL show loading, error, empty, and success states for all course, enrollment, lesson, and progress API operations.
* THE system SHALL calculate `progress` from approved lessons only: `(completedApprovedLessons / totalApprovedLessons) * 100`, rounded to the nearest integer.
* THE system SHALL keep `progress` between `0` and `100`.
* THE system SHALL keep the course-learning UI responsive from mobile width `320px` to desktop width `1440px+`.
* THE system SHALL avoid storing sensitive learning data outside JSON-Server except the mock auth state required by the Auth feature.

**Event-driven (Triggered by events)**

* WHEN a Student opens `/learning/courses`, THE system SHALL fetch approved courses and the Student’s enrollments, then render course cards/table with enrollment status.
* WHEN a Student searches by course title, THE system SHALL filter the displayed course list by keyword without breaking pagination.
* WHEN a Student filters by IELTS skill or level, THE system SHALL request or derive matching approved courses and reset pagination to page 1.
* WHEN a Student sorts courses by newest, popularity, rating, or price, THE system SHALL update the displayed order consistently.
* WHEN a Student opens `/learning/courses/:courseId`, THE system SHALL fetch course detail, enrollment status, and the approved lesson count for that course.
* WHEN a Student clicks **Enroll / Join Course** for a free approved course and has no existing enrollment, THE system SHALL create a new record in `enrollments` with `status = 'active'`, `progress = 0`, and `enrolledAt = current ISO date`.
* WHEN a new enrollment is created, THE system SHOULD increment `courses.enrolledCount` by `1` in JSON-Server if the mock API allows course patching.
* WHEN a Student clicks **Enroll / Join Course** for a course that already has an enrollment for the same `userId` and `courseId`, THE system SHALL NOT create a duplicate enrollment and SHALL show a “You are already enrolled” toast.
* WHEN a Student opens `/learning/courses/:courseId/lessons`, THE system SHALL verify that the Student is enrolled before showing the lesson list.
* WHEN a Student opens an enrolled course’s lesson list, THE system SHALL fetch lessons by `courseId`, sort them by `order ASC`, and show completion status from `lessonProgress`.
* WHEN a Student opens `/learning/courses/:courseId/lessons/:lessonId`, THE system SHALL verify that the lesson belongs to the course and that the Student is enrolled in the course.
* WHEN a Student opens a valid lesson, THE system SHALL render `contentUrl` if available, and `content` as the required fallback.
* WHEN a Student clicks **Mark as Completed** on an incomplete lesson, THE system SHALL create a `lessonProgress` record with `completed = true` and `completedAt = current ISO date`.
* WHEN a Student clicks **Mark as Completed** on a lesson that already has a `lessonProgress` record, THE system SHALL PATCH that record instead of creating a duplicate.
* WHEN lesson completion changes, THE system SHALL recalculate the parent enrollment’s `progress` and PATCH `enrollments/:id` (Note: Frontend service sequentially calls POST/PATCH `lessonProgress` then PATCH `enrollments`).
* WHEN all approved lessons in a course are completed, THE system SHALL set the enrollment `status = 'completed'` and `progress = 100`.
* WHEN a Student clicks **Next Lesson**, THE system SHALL navigate to the next lesson by `order` within the same course.
* WHEN a Student clicks **Previous Lesson**, THE system SHALL navigate to the previous lesson by `order` within the same course.
* WHEN a Student clicks **Continue Learning** from My Courses, THE system SHALL navigate to the first incomplete lesson; if all lessons are completed, navigate to the last lesson or course summary.
* WHEN the Student Dashboard requests course progress, THE system SHALL provide consistent data from `enrollments` and `lessonProgress`.

**State-driven (Continuous conditions)**

* WHILE the Student is not enrolled in a course, THE system SHALL show course preview information and the Enroll CTA, but SHALL NOT allow access to protected lesson content.
* WHILE the Student is enrolled in a course, THE system SHALL show Continue Learning, lesson list, progress bar, and lesson completion status.
* WHILE course data is loading, THE system SHALL show Skeleton UI or Spinner from shared components.
* WHILE the course list has no matching results, THE system SHALL show an empty state with a clear message and a reset-filter action.
* WHILE a lesson has no `contentUrl`, THE system SHALL still show text content if available.
* WHILE JSON-Server is unavailable, THE system SHALL show a recoverable error state and a Retry action.

**Unwanted (Error handling)**

* WHERE an unauthenticated Guest accesses `/learning/*`, THE system SHALL redirect to `/login` and preserve the intended URL if possible.
* WHERE an authenticated user with role other than `student` accesses `/learning/*`, THE system SHALL redirect to `/403`.
* WHERE the current user has `status = 'inactive'` or `status = 'locked'`, THE system SHALL block course-learning actions and return to Auth handling.
* WHERE `courseId` does not exist, THE system SHALL show a 404 Not Found state.
* WHERE `courseId` exists but `status != 'approved'`, THE system SHALL hide the course from Student lists and show a 403/404 style error when accessed directly.
* WHERE `lessonId` does not exist, THE system SHALL show a 404 Not Found state.
* WHERE `lessonId` exists but does not belong to the requested `courseId`, THE system SHALL show a 400/404 error state and prevent progress update.
* WHERE a Student tries to access a lesson without enrollment, THE system SHALL redirect to the course detail page and show an enrollment-required message.
* WHERE a Student double-clicks Enroll or Mark as Completed, THE system SHALL prevent duplicate API writes by disabling the action button during submission.
* WHERE the course has zero approved lessons, THE system SHALL show progress `0%`, hide lesson navigation, and display “No approved lessons available yet.”
* WHERE progress calculation receives invalid or missing records, THE system SHALL recover by treating missing progress as incomplete and SHALL NOT crash the UI.

## 5. API Contracts (JSON-Server mock schema)

Base URL is provided by the shared API infrastructure, for example `http://localhost:5000` in local development. In code, all calls MUST go through course-learning service functions.

### Course APIs

* `GET /courses?status=approved&_page={page}&_limit={limit}` -> 200 OK
  * Query optional: `q`, `skill`, `level`, `isPremium`, `_sort`, `_order`.
  * Response: `Course[]`.
* `GET /courses/:id` -> 200 OK
  * Response: `Course`.
* `PATCH /courses/:id` (Body: `{ enrolledCount }`) -> 200 OK
  * Used only to update mock `enrolledCount` after successful enrollment.

### Lesson APIs

* `GET /lessons?courseId={courseId}&status=approved&_sort=order&_order=asc` -> 200 OK
  * Response: `Lesson[]`.
* `GET /lessons/:id` -> 200 OK
  * Response: `Lesson`.

### Enrollment APIs

* `GET /enrollments?userId={userId}` -> 200 OK
  * Response: `Enrollment[]` for My Courses.
* `GET /enrollments?userId={userId}&courseId={courseId}` -> 200 OK
  * Response: `Enrollment[]`, expected length `0` or `1`.
* `POST /enrollments` -> 201 Created
  * Request:
    ```json
    {
      "id": "enroll-{timestamp}",
      "userId": "u-student-001",
      "courseId": "course-001",
      "status": "active",
      "progress": 0,
      "enrolledAt": "2026-06-11T00:00:00Z"
    }
    ```
  * Response: created `Enrollment`.
* `PATCH /enrollments/:id` -> 200 OK
  * Request: `{ "progress": 60, "status": "active" }` or `{ "progress": 100, "status": "completed" }`.
  * Response: updated `Enrollment`.

### Lesson Progress APIs

* `GET /lessonProgress?userId={userId}&courseId={courseId}` -> 200 OK
  * Response: `LessonProgress[]`.
* `GET /lessonProgress?userId={userId}&lessonId={lessonId}` -> 200 OK
  * Response: `LessonProgress[]`, expected length `0` or `1`.
* `POST /lessonProgress` -> 201 Created
  * Request:
    ```json
    {
      "id": "lp-{timestamp}",
      "userId": "u-student-001",
      "courseId": "course-001",
      "lessonId": "lesson-001",
      "completed": true,
      "completedAt": "2026-06-11T00:00:00Z"
    }
    ```
  * Response: created `LessonProgress`.
* `PATCH /lessonProgress/:id` -> 200 OK
  * Request: `{ "completed": true, "completedAt": "2026-06-11T00:00:00Z" }`.
  * Response: updated `LessonProgress`.

## 6. Data Models & DB Schema Changes

This project uses `db.json` with JSON-Server. No real production database migration is required. AI Agents MUST strictly follow the existing mock data model.

**Enum Types (Mandatory):**

* `user.role`: `guest`, `student`, `teacher`, `admin`
* `user.status`: `active`, `inactive`, `locked`
* `course.skill`: `Listening`, `Reading`, `Writing`, `Speaking`, `Vocabulary`, `Grammar`
* `course.level`: `Beginner`, `Intermediate`, `Advanced`, `Band 5.0+`, `Band 6.5+`, `Band 7.0+`
* `content.status`: `draft`, `pending`, `approved`, `rejected`
* `enrollment.status`: `active`, `completed`

**Core Collections:**

### `courses`

Purpose: stores IELTS courses for public discovery, Student enrollment, Teacher management, and Admin approval.

Required fields:

* `id: string`
* `title: string`
* `description: string`
* `syllabus: string[]`
* `skill: string`
* `level: string`
* `price: number`
* `isPremium: boolean`
* `thumbnail?: string`
* `teacherId: string`
* `status: 'draft' | 'pending' | 'approved' | 'rejected'`
* `enrolledCount: number`
* `rating?: number`
* `createdAt: string`

### `lessons`

Purpose: stores lessons inside a course.

Required fields:

* `id: string`
* `courseId: string`
* `title: string`
* `contentUrl?: string`
* `content: string`
* `order: number`
* `durationMinutes: number`
* `teacherId: string`
* `status: 'draft' | 'pending' | 'approved' | 'rejected'`
* `createdAt: string`

### `enrollments`

Purpose: stores which Student joined which course and the course-level progress.

Required fields:

* `id: string`
* `userId: string`
* `courseId: string`
* `status: 'active' | 'completed'`
* `progress: number`
* `enrolledAt: string`

Constraint: `userId + courseId` MUST be treated as unique by the frontend service.

### `lessonProgress`

Purpose: stores lesson-level completion per Student.

Required fields:

* `id: string`
* `userId: string`
* `courseId: string`
* `lessonId: string`
* `completed: boolean`
* `completedAt: string | null`

Constraint: `userId + lessonId` MUST be treated as unique by the frontend service.

**Relationships:**

* `courses.teacherId -> users.id`
* `lessons.courseId -> courses.id`
* `lessons.teacherId -> users.id`
* `enrollments.userId -> users.id`
* `enrollments.courseId -> courses.id`
* `lessonProgress.userId -> users.id`
* `lessonProgress.courseId -> courses.id`
* `lessonProgress.lessonId -> lessons.id`

**Derived Data Rules:**

* `totalApprovedLessons = lessons.filter(courseId, status='approved').length`
* `completedApprovedLessons = lessonProgress records where userId matches, courseId matches, completed = true, and lessonId belongs to an approved lesson`
* `progress = totalApprovedLessons === 0 ? 0 : Math.round((completedApprovedLessons / totalApprovedLessons) * 100)`
* `enrollment.status = 'completed'` only when `progress = 100` and `totalApprovedLessons > 0`

## 7. Non-Functional Requirements

* **Performance:** Course list page SHOULD load within 3 seconds on local JSON-Server with seeded demo data.
* **Performance:** Mark-as-completed interaction SHOULD finish within 500ms under normal local JSON-Server conditions.
* **Responsive UI:** All pages MUST support mobile `320px`, tablet, and desktop layouts.
* **Usability:** A Student SHOULD reach the current lesson from `/learning/courses` within 3 clicks.
* **Maintainability:** Code MUST follow feature-based structure under `src/features/course-learning/`.
* **Maintainability:** Business logic such as progress calculation MUST be placed in utilities/hooks, not duplicated across components.
* **State Management:** Enrollment and progress state SHOULD be managed through Redux Toolkit, RTK Query, Context API, or a consistent shared project approach.
* **Security:** Course-learning routes MUST depend on Auth ProtectedRoute and role checks.
* **Data Safety:** The feature MUST NOT expose or log mock passwords from the `users` collection.
* **UX Quality:** Toast notifications SHOULD be shown for successful enroll, completed lesson, duplicate enrollment, and API failure.
* **Accessibility:** Main actions MUST be keyboard accessible and images/videos SHOULD include meaningful labels or fallback text.

## 8. Error Handling Matrix

| Error Code | HTTP Status / UI State | Message (Client) | Retry Behavior |
| --- | --- | --- | --- |
| `CL_AUTH_001` | 401 / Redirect | "Please log in to continue learning." | Redirect to `/login`. |
| `CL_AUTH_002` | 403 | "You do not have permission to access Student Learning." | Do not retry; go to `/403`. |
| `CL_COURSE_001` | 404 | "Course not found." | Allow back to course list. |
| `CL_COURSE_002` | 403/404 | "This course is not available for learning." | Do not retry; course may be pending/rejected. |
| `CL_ENROLL_001` | 409 / Toast | "You are already enrolled in this course." | Do not create duplicate; show Continue Learning. |
| `CL_ENROLL_002` | 400 | "Cannot enroll in this course." | Retry only after course status/payment issue is resolved. |
| `CL_LESSON_001` | 404 | "Lesson not found." | Allow back to lesson list. |
| `CL_LESSON_002` | 403 | "Please enroll before accessing lessons." | Redirect to course detail. |
| `CL_PROGRESS_001` | 400 | "Cannot update lesson progress." | Allow retry. |
| `CL_PROGRESS_002` | 409 / Safe State | "Progress is already updated." | Do not retry; refresh progress data. |
| `CL_API_001` | 500 / Network Error | "Unable to connect to learning server." | Show Retry button. |
| `CL_EMPTY_001` | 200 Empty State | "No courses or lessons found." | Allow reset filter/back navigation. |
| `CL_PAYMENT_001` | 402 / Redirect | "This premium course requires checkout before enrollment." | Redirect to checkout if mock payment is enabled. |

## 9. Edge Cases & Corner Cases

* **Duplicate Enrollment:** Student clicks Enroll multiple times or refreshes during enrollment. Frontend MUST check existing enrollment before POST and disable the button while submitting.
* **Direct URL Access:** Student opens `/learning/courses/:courseId/lessons/:lessonId` directly. System MUST verify authentication, role, enrollment, course status, lesson status, and relationship between course and lesson.
* **Course Has No Lessons:** System MUST show an empty lesson state and keep progress at `0%`.
* **All Lessons Completed:** Continue Learning SHOULD route to the last lesson or course summary instead of crashing.
* **First Lesson Previous:** Previous button MUST be disabled on the first ordered lesson.
* **Last Lesson Next:** Next button MUST be disabled on the last ordered lesson or replaced with “Finish Course”.
* **Lesson Added After Completion:** If Teacher/Admin later adds a new approved lesson, progress MUST be recalculated on page load so a previously completed course may return below `100%`.
* **Lesson Removed/Rejected:** Progress calculation MUST ignore rejected/non-approved lessons.
* **Missing Content URL:** Lesson page MUST fall back to text content.
* **Slow JSON-Server:** UI MUST remain usable and show loading indicators.
* **Stale LocalStorage User:** If current user no longer exists or is not active, Auth handling MUST block course-learning actions.
* **Premium Course:** If `isPremium = true` and no successful payment exists, enrollment MUST be blocked or redirected to the Mock Payment feature.

## 10. Dependencies & Integration Points

* **feature-auth-and-users:** Provides current user, mock JWT/localStorage auth state, ProtectedRoute, and role-based access.
* **feature-public-discovery:** Shares course list/detail data and may share CourseCard/CourseDetail UI for Guest preview and Student learning.
* **feature-student-dashboard-history:** Consumes `enrollments` and `lessonProgress` to show learning stats and progress.
* **feature-mock-payment-transactions:** Handles premium checkout before enrollment if premium courses are enabled.
* **feature-teacher-content-management:** Creates courses and lessons that become available to Students only after approval.
* **feature-admin-management-approval:** Approves/rejects courses and lessons; Student Learning only consumes approved content.
* **feature-shared-ui-api-infrastructure:** Provides layouts, Navbar/Sidebar, Button, Modal, Spinner, Pagination, Toast, Skeleton UI, Axios instance, API services, Redux store, and route config.
* **JSON-Server:** Mock backend for `courses`, `lessons`, `enrollments`, and `lessonProgress` collections.

## 11. Testing Requirements

* **Unit Tests:** `calculateProgress(totalLessons, completedLessons)` returns correct values for 0%, partial, 100%, and zero-lesson cases.
* **Unit Tests:** `getNextLesson()` and `getPreviousLesson()` return correct lesson by `order` and handle first/last lesson.
* **Unit Tests:** `canAccessLesson(user, enrollment, course, lesson)` blocks invalid role, missing enrollment, rejected content, and mismatched course/lesson.
* **Unit Tests:** Filter/sort/pagination utilities return predictable course lists.
* **Integration Tests:** Enroll flow checks existing enrollment, creates `enrollments`, updates UI state, and prevents duplicate POST.
* **Integration Tests:** Lesson completion flow creates or patches `lessonProgress`, recalculates `progress`, and patches `enrollments`.
* **Integration Tests:** Direct lesson URL without enrollment redirects to course detail with proper message.
* **E2E Tests:** Student logs in, opens course list, enrolls in a free course, opens lesson list, completes a lesson, and sees updated progress.
* **E2E Tests:** Student completes all lessons and sees course progress reach `100%` with status `completed`.
* **UI Tests:** Loading, error, empty, and success states are visible for course list, course detail, lesson list, and lesson detail.

**Coverage Target:** >= 80% for course-learning utilities, hooks, and service logic.

## 12. Rollout Plan

* **Step 1:** Confirm `db.json` seed data for `courses`, `lessons`, `enrollments`, and `lessonProgress` (ensure `lessonProgress` array exists and `students` field is removed from courses to avoid redundancy).
* **Step 2:** Implement course-learning API service functions using the shared Axios instance.
* **Step 3:** Implement protected Student routes under `/learning/courses`.
* **Step 4:** Build Course List, Course Detail, My Courses, Lesson List, and Lesson Detail pages.
* **Step 5:** Implement enroll flow and duplicate-enrollment protection.
* **Step 6:** Implement lesson completion and progress recalculation.
* **Step 7:** Integrate progress data with Student Dashboard & Learning History.
* **Step 8:** Add tests, responsive checks, loading/error/empty states, and final demo data.

## 13. Open Questions (must resolve before implementation)

* **Q1: [Premium Course Enrollment]** — Owner: Member 5 / Mock Payment — Due: Before payment integration. Should premium courses redirect to checkout before creating enrollment, or can demo mode enroll directly?
* **Q2: [Unmark Lesson]** — Owner: Member 2 — Due: Before UI implementation. Should Students be allowed to unmark a completed lesson, or is completion one-way only? Current decision: one-way completion.
* **Q3: [Progress Storage Strategy]** — Owner: Member 2 + Dashboard Owner — Due: Before Dashboard integration. Should Dashboard trust `enrollments.progress`, or recalculate from `lessonProgress` on each load? Current decision: store in `enrollments` for fast dashboard display, but recalculate on course-learning page load.
* **Q4: [Learning Time Calculation]** — Owner: Dashboard Owner — Due: Before dashboard stats. Should total study time use `durationMinutes` of completed lessons, or a separate time-tracking mock field? Current recommendation: use sum of `durationMinutes` for completed lessons.
* **Q5: [Shared Components]** — Owner: Infrastructure Owner — Due: Before page implementation. Which shared components are final: CourseCard, ProgressBar, EmptyState, Skeleton, Toast, Pagination?
