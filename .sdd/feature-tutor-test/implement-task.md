# Implement Task: Tutor IELTS Test Builder

## 1. Muc Tieu Chuc Nang

Xay dung chuc nang tao va quan ly de thi IELTS cho Tutor/Teacher mot cach chinh chu, dung nghiep vu 4 ky nang IELTS, dong thoi hien thi lai cho Student o 2 ngu canh:

- Free test trong khu tai nguyen mien phi.
- Course test ben trong khoa hoc sau khi tutor gan test vao course.

Chuc nang khong chi la CRUD test don gian, ma huong toi mot IELTS Test Builder co template theo tung ky nang, co gioi han luot lam, co preview/publish, va giao dien lam bai gan voi format thi that.

## 2. Tong Hop Y Kien San Pham

### Tu user

- Tutor can tao de thi IELTS cho ca 4 ky nang: Reading, Listening, Writing, Speaking.
- Free test duoc hien thi trong phan tai nguyen mien phi cho student/guest lam thu.
- Free test gioi han 3 lan lam.
- Neu muon lam tiep sau 3 lan thi nguoi hoc phai dang ky/dang nhap va mua khoa hoc.
- Tutor co the tao test truoc, sau do gan test vao tung khoa hoc.
- Test duoc gan vao khoa hoc phai hien thi ben trong course detail/course learning cua student.
- Khi tao test can co nghiep vu IELTS that, khong nen chi tao form chung chung.
- Writing can co layout chia man hinh de nhin de bai/anh va viet bai de hon, co the keo rong/thu hep.
- Speaking can hien thi theo tung cau, tung part, co gioi han part/time.
- Reading, Listening, Writing, Speaking deu can hien thi dung dang bai thi.

### De xuat bo sung

- Tao test theo IELTS template thay vi form trong.
- Tutor chon skill truoc, UI tao test doi theo dung format cua skill do.
- Co che do `practice` va `exam`.
- Free test nen dong vai tro hoc thu/marketing de dieu huong mua khoa hoc.
- Sau khi het 3 luot free, hien CTA dang ky/dang nhap/mua khoa hoc.
- Co `Preview as Student` de tutor kiem tra test truoc khi publish.
- Co checklist validate truoc khi publish de tranh test thieu passage/audio/task/part.
- Tach student test session thanh component rieng theo tung ky nang de code de bao tri.

## 3. Pham Vi Version Dau

Version dau nen uu tien lam chinh chu nhung van vua suc voi project React + json-server hien tai.

### In scope

- Tao/sua/xoa test tu phia Tutor.
- Test co the la free test hoac course test.
- Tutor co the tao test chua gan course, sau do gan vao course sau.
- Free test hien thi o trang tai nguyen mien phi.
- Free test gioi han 3 lan lam.
- Course test hien thi trong khoa hoc.
- Template IELTS cho 4 ky nang.
- Giao dien lam bai student rieng cho Reading, Listening, Writing, Speaking.
- Reading/Listening co the tu cham diem.
- Writing/Speaking de trang thai cho cham diem.

### Out of scope tam thoi

- Cham Writing/Speaking bang AI.
- Upload file audio/image that len server.
- Payment unlock phuc tap ngoai flow hien co.
- Mot test gan nhieu course cung luc.
- Bao cao phan tich nang cao theo tung dang cau hoi.

## 4. Data Model De Xuat

### tests

```js
{
  id: "test-001",
  title: "IELTS Reading Foundation Mock Test",
  description: "Short description for student card/detail.",
  skill: "Reading", // Reading | Listening | Writing | Speaking

  testMode: "free", // free | course
  courseId: null, // null khi free hoac chua gan course
  isFreePreview: false,

  status: "draft", // draft | published
  practiceMode: "exam", // practice | exam
  attemptLimit: 3, // free test default = 3
  requireLoginAfterLimit: true,

  durationMinutes: 60,
  totalQuestions: 40,
  bandScale: "IELTS 0-9",

  teacherId: "u-teacher-001",
  createdAt: "2026-06-23T00:00:00.000Z",
  updatedAt: "2026-06-23T00:00:00.000Z",

  ieltsFormat: {
    type: "reading",
    instructions: "",
    sections: [],
    tasks: [],
    parts: [],
    audioUrl: ""
  }
}
```

### questions

```js
{
  id: "question-001",
  testId: "test-001",
  skill: "Reading",

  sectionId: "reading-passage-1",
  passageId: "reading-passage-1",
  taskNumber: null,
  partNumber: null,

  type: "multiple-choice",
  order: 1,

  questionText: "Question text",
  prompt: "Prompt shown to student",
  passage: "",
  options: ["A", "B", "C", "D"],
  answer: "A",
  explanation: "",
  score: 1,

  imageUrl: "",
  audioUrl: ""
}
```

### testAttempts

```js
{
  id: "attempt-001",
  userId: "u-001",
  guestId: "guest-browser-id",
  testId: "test-001",
  skill: "Reading",
  status: "in-progress", // in-progress | completed
  startTime: "2026-06-23T00:00:00.000Z",
  completedAt: null,
  answers: {},
  score: null,
  overallBandScore: null
}
```

## 5. Nghiep Vu Theo Tung Ky Nang

### 5.1 Reading

#### Tutor Builder

- Default duration: 60 minutes.
- Default total questions: 40.
- Tao 3 passage:
  - Passage 1: title, content, optional image.
  - Passage 2: title, content, optional image.
  - Passage 3: title, content, optional image.
- Cau hoi gan voi passage.
- Ho tro cac dang cau hoi:
  - multiple-choice
  - true-false-not-given
  - yes-no-not-given
  - fill-in-the-blank
  - short-answer
  - matching-headings

#### Student Session

- Layout split 2 cot:
  - left: passage.
  - right: questions.
- Cho phep resize width giua passage va questions.
- Passage scroll rieng.
- Questions scroll rieng.
- Co question navigator.
- Timer sticky tren dau.
- Tu cham diem sau khi submit.

### 5.2 Listening

#### Tutor Builder

- Default duration: 40 minutes.
- Default total questions: 40.
- Tao 4 sections:
  - Section 1, 2, 3, 4.
  - Moi section co instruction.
  - Test hoac section co `audioUrl`.
- Co setting audio:
  - `allow-replay` cho demo/practice.
  - `play-once` cho exam mode sau nay.
- Cau hoi gan voi section.
- Ho tro:
  - multiple-choice
  - fill-in-the-blank
  - form-completion
  - table-completion
  - matching

#### Student Session

- Audio player sticky tren dau.
- Hien thi section theo thu tu.
- Neu co form/table completion thi render theo template.
- Co timer.
- Co submit.
- Tu cham voi cau hoi objective.

### 5.3 Writing

#### Tutor Builder

- Default duration: 60 minutes.
- Bat buoc co 2 tasks:
  - Task 1:
    - prompt
    - optional image/chart/process/map URL
    - minimumWords = 150
  - Task 2:
    - prompt
    - minimumWords = 250
- Co the nhap band criteria/instructions.

#### Student Session

- Hien thi tab Task 1 / Task 2.
- Moi task co split layout:
  - left: de bai + image/chart.
  - right: text editor.
- Cho phep resize giua de bai va editor.
- Co word count realtime.
- Canh bao khi duoi minimum words.
- Timer sticky.
- Submit ca 2 task.
- Sau submit: trang thai `pending grading`.

### 5.4 Speaking

#### Tutor Builder

- Tao theo 3 parts:
  - Part 1: Introduction & Interview.
  - Part 2: Cue Card / Long Turn.
  - Part 3: Discussion.
- Part 1:
  - nhieu cau hoi ngan.
  - answerSeconds moi cau, vi du 30-45s.
- Part 2:
  - cue card.
  - bullet prompts.
  - prepSeconds = 60.
  - answerSeconds = 120.
- Part 3:
  - cau hoi thao luan.
  - answerSeconds moi cau, vi du 45-60s.

#### Student Session

- Hien thi tung part.
- Hien thi tung cau mot, khong show het tat ca cung luc.
- Part 2 co man hinh chuan bi 60s.
- Co timer theo cau/part.
- Neu browser cho phep, co the record audio.
- Version dau co the fallback bang text answer/audio placeholder.
- Sau submit: trang thai `pending grading`.

## 6. Free Test va Gioi Han 3 Lan

### Rule

- Test free co `testMode = "free"` hoac `isFreePreview = true`.
- Default `attemptLimit = 3`.
- Guest/student duoc lam toi da 3 lan.
- Sau 3 lan:
  - Neu chua dang nhap: hien CTA dang ky/dang nhap.
  - Neu da dang nhap nhung chua mua/enroll course lien quan: hien CTA mua khoa hoc.
  - Neu da mua/enroll course lien quan: cho lam course test theo rule cua course.

### Cach dem luot lam

De nghi version dau dem moi attempt duoc tao la 1 luot, bao gom `in-progress`, de tranh spam Start.

Neu muon nhe hon, co the chi dem attempt `completed`, nhung cach nay de bi tao nhieu attempt rac.

### Guest tracking

- Neu user chua login, tao/luu `guestId` trong `localStorage`.
- Khi tao attempt free, luu `guestId`.
- Query attempt theo `guestId + testId`.

## 7. Course Test va Gan Vao Khoa Hoc

### Tutor Flow

```text
Create test
-> Select skill/template
-> Add test content/questions
-> Preview as Student
-> Publish
-> Assign to Course
```

### Course assignment

- Test co the duoc tao voi `courseId = null`.
- Trong Teacher Test List co action `Assign to course`.
- Khi gan course:
  - set `testMode = "course"`.
  - set `courseId = selectedCourseId`.
  - neu course da approved thi co the chuyen course ve pending tuy theo nghiep vu approval hien tai.

### Student display

- Course detail/course learning hien thi tests co:
  - `courseId === currentCourseId`
  - `status === "published"`
- Student chi lam duoc course test neu:
  - course free va da enroll, hoac
  - course premium va da mua/enroll, hoac
  - test la free preview.

## 8. Publish Checklist

Truoc khi publish test, he thong can validate:

### Common

- Co title.
- Co skill.
- Co duration.
- Co status.
- Free test co attemptLimit.
- Test co it nhat 1 cau hoi/task/part hop le.

### Reading

- Co it nhat 1 passage.
- Moi passage publish phai co content.
- Co cau hoi gan passage.

### Listening

- Co audioUrl o test hoac section.
- Co it nhat 1 section.
- Co cau hoi gan section.

### Writing

- Co Task 1.
- Co Task 2.
- Task 1 co prompt.
- Task 2 co prompt.
- Minimum words hop le.

### Speaking

- Co Part 1, Part 2, Part 3.
- Part 2 co cue card.
- Moi part co it nhat 1 cau hoi hoac prompt.
- Time config hop le.

## 9. UI/UX De Xuat

### Teacher

- Test Create/Edit:
  - Section common config.
  - Skill selector.
  - Dynamic IELTS template panel.
  - Access config: free/course/draft/published/attemptLimit.
- Test List:
  - show skill.
  - show mode: Free/Course/Preview.
  - show status.
  - show course assigned.
  - show question count.
  - actions: Edit, Questions/Builder, Assign Course, Preview, Publish/Unpublish, Delete.
- Question Builder:
  - left: current test structure.
  - right: question form or question bank.
  - support add direct question and select from bank.

### Student

- Free resources page:
  - them section/tab `Free IELTS Tests`.
  - show card theo skill.
  - show remaining attempts.
  - CTA start test.
- Course detail:
  - show tests assigned to course.
  - status completed/in-progress/not-started.
- Test detail:
  - show instruction.
  - show attempt limit.
  - show remaining attempts.
  - CTA blocked when limit reached.

## 10. Kien Truc Component

Nen tach `TestSessionPage` thanh cac session component rieng.

```text
src/pages/student/test-sessions/
  ReadingSession.jsx
  ListeningSession.jsx
  WritingSession.jsx
  SpeakingSession.jsx
  shared/
    SessionHeader.jsx
    QuestionNavigator.jsx
    ResizablePanels.jsx
    AttemptLimitNotice.jsx
```

Teacher builder cung nen tach:

```text
src/pages/teacher/test-builder/
  TestBasicInfoForm.jsx
  ReadingBuilder.jsx
  ListeningBuilder.jsx
  WritingBuilder.jsx
  SpeakingBuilder.jsx
  PublishChecklist.jsx
  AssignCourseModal.jsx
```

Service nen bo sung:

```text
src/services/testService.js
src/services/testAttemptService.js
```

## 11. Implementation Phases

### Phase 1: Foundation

- [ ] Fix route `/teacher/tests/:id/questions`.
- [ ] Chuan hoa field moi cho tests.
- [ ] Update teacher create/edit test form voi:
  - [ ] testMode.
  - [ ] status.
  - [ ] attemptLimit.
  - [ ] courseId optional.
  - [ ] description.
- [ ] Update teacher test list de hien thi mode/status/course/attemptLimit.
- [ ] Build pass.

### Phase 2: Free Test + Attempt Limit

- [ ] Hien free tests trong trang tai nguyen mien phi.
- [ ] Tao guestId trong localStorage cho user chua login.
- [ ] Check remaining attempts trong test detail.
- [ ] Block start khi het 3 luot.
- [ ] CTA login/register/mua khoa hoc.
- [ ] Build pass.

### Phase 3: Course Assignment

- [ ] Them action Assign Course o teacher test list.
- [ ] Cho tao test chua gan course.
- [ ] Gan test vao course sau.
- [ ] Hien course tests trong student course detail/course learning.
- [ ] Kiem tra permission enroll/payment truoc khi lam course test.
- [ ] Build pass.

### Phase 4: IELTS Builder Templates

- [ ] ReadingBuilder: passage sections.
- [ ] ListeningBuilder: audio + sections.
- [ ] WritingBuilder: Task 1 + Task 2 + imageUrl.
- [ ] SpeakingBuilder: Part 1/2/3 + timers.
- [ ] PublishChecklist.
- [ ] Preview as Student.
- [ ] Build pass.

### Phase 5: Student Sessions Chuan 4 Ky Nang

- [ ] Tach TestSessionPage thanh session theo skill.
- [ ] ReadingSession split resizable passage/questions.
- [ ] ListeningSession sticky audio + sections.
- [ ] WritingSession split resizable prompt/editor + word count.
- [ ] SpeakingSession theo tung part/cau + timers.
- [ ] Build pass.

### Phase 6: Review/Ket Qua

- [ ] Reading/Listening auto scoring.
- [ ] Writing/Speaking pending grading.
- [ ] Review answers theo dung format tung skill.
- [ ] Recommendation CTA sau free test.
- [ ] Build pass.

## 12. Uu Tien De Demo Tot

Neu thoi gian han che, nen lam theo thu tu:

1. Free test + limit 3 lan.
2. Gan test vao course.
3. Reading session chuan split panel.
4. Writing session split panel + word count.
5. Listening audio sections.
6. Speaking part-by-part.
7. Preview/publish checklist.

## 13. Rủi Ro Va Luu Y

- `TestSessionPage.jsx` hien tai da dai, neu nhan them logic 4 skill se kho bao tri. Nen tach component som.
- `db.json` dang co data id khong dong nhat giua number/string o mot so noi. Khi query nen so sanh bang `String(id)`.
- Guest attempt limit can localStorage; neu clear browser se reset. Chap nhan duoc voi json-server/demo.
- Writing/Speaking khong nen co diem auto trong version dau, de `pending grading` hop ly hon.
- Neu test gan vao course da approved, can can nhac workflow approval hien tai: co the day course ve `pending`.
- Can giu UI dong bo React Bootstrap voi style hien tai.

## 14. Definition Of Done

- Tutor tao duoc free test va course test.
- Tutor publish/unpublish duoc test.
- Tutor gan test vao course sau khi tao.
- Student thay free test trong tai nguyen mien phi.
- Free test bi gioi han 3 lan.
- Student thay course test trong khoa hoc.
- Reading/Listening lam va review duoc.
- Writing/Speaking lam duoc va hien pending grading.
- Build khong co compile error.
- Khong pha cac flow course/lesson/test hien co.
