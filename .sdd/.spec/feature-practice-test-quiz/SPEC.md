# Feature: IELTS Practice Test & Quiz System (feat-practice-test-quiz) — FULL SPECIFICATION

Status: **APPROVED** | 
Author: Tech Lead Thai Khac Huu Duc | Tech Lead Approval: Thai Khac Huu Duc | Date: 2026-06-11
Risk Level: **Medium** (Core Learning Feature)
Related Specs: `.sdd/global/constitution.md`, `.sdd/shared_context.md`, `feature-course-learning`

---

## 1. Business Context & Goals

This feature acts as the core "Assessment Engine" for the IELTS Online Learning Website.

Goals:

* Provide interactive IELTS practice tests and quizzes for students.
* Simulate real IELTS test-taking experience with timer and navigation.
* Automatically calculate scores and convert them into mock IELTS Band Scores.
* Store attempt history for learning analytics and progress tracking.
* Allow students to review mistakes and explanations after submission.

---

## 2. Stakeholders & User Personas

* **Student:** Take practice tests, submit answers, review results and history.
* **Teacher:** Create and manage test/question content (managed via Teacher Content Management feature).
* **Admin:** Audit and manage test/question data if necessary.

---

## 3. User Stories (all paths)

* **QUIZ-01:** As a Student, I want to view available IELTS practice tests.
* **QUIZ-02:** As a Student, I want to start a Mini Test or Full Test.
* **QUIZ-03:** As a Student, I want to answer various types of questions (MCQ, True/False/Not Given, Fill in the blanks) and navigate between questions.
* **QUIZ-04:** As a Student, I want to see a countdown timer while taking the test.
* **QUIZ-05:** As a Student, I want to flag questions for later review.
* **QUIZ-06:** As a Student, I want the system to automatically submit when time expires.
* **QUIZ-07:** As a Student, I want to see my score and mock Band Score after submission.
* **QUIZ-08:** As a Student, I want to review correct answers and explanations.
* **QUIZ-09:** As a Student, I want my test history to be saved for future reference.

---

## 4. Acceptance Criteria (EARS — exhaustive)

### Ubiquitous (Always true)

* THE system SHALL only allow authenticated Students to access quiz-taking routes.
* THE system SHALL save all test attempt records in the database.
* THE system SHALL calculate results based on actual answer correctness (Client-side evaluation).
* THE system SHALL display Progress Bar and Question Navigator throughout the test session.

### Event-driven (Triggered by events)

* WHEN a Student accesses the Test List page, THE system SHALL display all available tests sorted by newest first.
* WHEN a Student selects a Test, THE system SHALL load test information, duration, total questions and instructions.
* WHEN a Student starts a Test, THE system SHALL create a new `testAttempt` record with status = `in_progress`.
* WHEN a Student selects an answer, THE system SHALL save the selected option locally during the session (LocalStorage).
* WHEN a Student flags a question, THE system SHALL mark the question as "review later" in the navigator.
* WHEN a Student navigates between questions, THE system SHALL preserve all previously selected answers.
* WHEN a Student submits a Test, THE system SHALL evaluate answers, calculate score, generate mock Band Score, and update the attempt record via API.
* WHEN the Countdown Timer reaches zero, THE system SHALL automatically submit the test.
* WHEN a Student opens the Result page, THE system SHALL display total questions, correct answers, incorrect answers, score percentage, and mock Band Score.
* WHEN a Student opens Review Mode, THE system SHALL display selected answers, correct answers and explanations.

### State-driven (Continuous conditions)

* WHILE a Test session is active, THE system SHALL continuously update the countdown timer every second.
* WHILE a Test session is active, THE system SHALL display current completion percentage.
* WHILE a Test session is active, THE Question Navigator SHALL visually distinguish:

  * Unanswered Questions
  * Answered Questions
  * Flagged Questions

### Unwanted (Error handling)

* WHERE a Student attempts to access a non-existing test, THE system SHALL return HTTP 404 and redirect to Test List.
* WHERE a Student submits a test without answering all questions, THE system SHALL display a confirmation dialog before submission.
* WHERE the test data cannot be loaded, THE system SHALL display an error state and allow retry.
* WHERE a Student attempts to access another user's test attempt, THE system SHALL return HTTP 403.
* WHERE a Student attempts to review a test that has not been submitted, THE system SHALL deny access.

---

## 5. API Contracts (JSON-Server Schema)

### Test APIs

* `GET /tests` → 200 OK
* `GET /tests/:id` → 200 OK
* `GET /questions?testId=:id` → 200 OK

### Attempt APIs

* `POST /testAttempts`

  * Body:

    * userId
    * testId
    * status: "in_progress"
    * startedAt
  * → 201 Created

* `PATCH /testAttempts/:id` (For periodic progress updates if needed, though LocalStorage is preferred)

  * Body:

    * answers
    * flaggedQuestions
    * progress
  * → 200 OK

* `PATCH /testAttempts/:id` (For Submission)
  * Body:
    * status: "submitted"
    * score
    * bandScore
    * answers
    * submittedAt
  * → 200 OK

* `GET /testAttempts?userId=:id`

  * → 200 OK

* `GET /testAttempts/:id`

  * → 200 OK

---

## 6. Data Models & DB Schema Changes

The system utilizes the existing JSON-Server schema.

### Collections

#### tests

Purpose:

* Store IELTS practice test information.

Important Fields:

* id
* title
* description
* skill
* level
* durationMinutes
* totalQuestions
* status

---

#### questions

Purpose:

* Store all questions belonging to a test.

Important Fields:

* id
* testId
* type (multiple-choice, true-false-not-given, fill-in-the-blank)
* questionText
* options
* answer (instead of correctAnswer, mapped to db.json)
* explanation
* skill

---

#### testAttempts

Purpose:

* Store attempt history of students.

Important Fields:

* id
* userId
* testId
* score
* bandScore
* answers
* flaggedQuestions
* startedAt
* submittedAt
* status

---

### Relationships

* questions.testId → tests.id
* testAttempts.userId → users.id
* testAttempts.testId → tests.id

---

## 7. Non-Functional Requirements

### Performance

* Test page initial load time MUST be under 2 seconds.
* Question navigation MUST respond within 200ms.

### Reliability

* Auto-submit MUST execute successfully when timer reaches zero.
* Student answers MUST not be lost during question navigation.

### Usability

* Question Navigator MUST remain visible throughout the session.
* Progress Bar MUST update immediately after answering questions.

### Scalability

* Data model MUST support hundreds of tests and thousands of attempts in JSON-Server.

---

## 8. Error Handling Matrix

| Error Code | HTTP Status | Message (Client)       | Retry Behavior      |
| ---------- | ----------- | ---------------------- | ------------------- |
| QUIZ_001   | 404         | Test not found         | Return to test list |
| QUIZ_002   | 403         | Access denied          | Do not retry        |
| QUIZ_003   | 500         | Failed to load test    | Allow retry         |
| QUIZ_004   | 400         | Test already submitted | Refresh page        |
| QUIZ_005   | 400         | Invalid attempt data   | Resubmit request    |
| QUIZ_006   | 408         | Test session expired   | Start new attempt   |

---

## 9. Edge Cases & Corner Cases

* **Auto Submit:** Timer reaches 00:00 exactly while Student is answering a question.
* **Refresh Browser:** Student refreshes page during an active test (solved by saving state to LocalStorage).
* **Empty Submission:** Student submits without answering any question.
* **Flagged Only Questions:** Student flags questions but never answers them.
* **Large Test:** Test contains 40–60 questions and must still navigate smoothly.
* **Direct URL Access:** Student manually enters Review URL without completing the test.
* **Multiple Tabs:** Student opens the same test in multiple browser tabs.

---

## 10. Dependencies & Integration Points

### Feature Dependencies

* Authentication & User Authorization
* Student Dashboard & History
* Teacher Content Management

### Data Dependencies

* users
* tests
* questions
* testAttempts

### Frontend Routes

* `/learning/tests` - Test List
* `/learning/tests/:id` - Test Detail / Start Page
* `/learning/tests/attempt/:attemptId` - Test Session Active
* `/learning/tests/attempt/:attemptId/review` - Review Result Mode

### UI Components

* QuizPage
* QuestionDisplay
* QuestionNavigator
* CountdownTimer
* ProgressBar
* ResultSummary
* ReviewPage

---

## 11. Testing Requirements

### Unit Tests

* Score calculation utility.
* Band Score conversion utility.
* Progress calculation utility.
* Timer countdown logic.

### Integration Tests

* Student starts a test → creates attempt.
* Student submits answers → score generated correctly.
* Timer expires → auto submit executes.
* Review page displays correct answer mappings.
* Attempt history saved successfully.

### Coverage Target

* > = 80% for Quiz module.

---

## 12. Rollout Plan

### Phase 1

* Test List
* Test Detail
* Question Rendering

### Phase 2

* Timer
* Navigator
* Progress Tracking

### Phase 3

* Submission
* Score Calculation
* Review Mode

### Phase 4

* Attempt History Integration
* Dashboard Statistics Integration

---

## 13. Open Questions (Resolved)

* **Q1: [Band Conversion Formula]** — Owner: Product Team — Determine exact mapping from raw score to mock IELTS Band Score.
* **Q2: [Auto Save Strategy]** — Resolved: Answers should be saved in Local State and `localStorage` during the test to avoid JSON-Server spamming. Only sync to backend via PATCH when user submits the test.
* **Q3: [Question Types]** — Resolved: According to `db.json`, the mock DB currently supports `multiple-choice`, `true-false-not-given`, and `fill-in-the-blank`. The UI MUST support rendering and taking all 3 types, not just MCQ.
