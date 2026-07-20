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
- Doi `ieltsFormat` thanh `testConfig` theo tung skill de tranh nhieu field thua/null.
- Chuan hoa question linkage bang `referenceId` va `referenceType`.
- Tach Tutor Builder thanh 3 buoc ro rang: Basic Info, Content Builder, Questions/Tasks/Parts.
- Them live checklist sidebar thay vi chi validate luc bam Publish.
- Them `expiredAt` cho attempt de tranh viec user dong tab lam mat luot oan.
- Co che do `practice` va `exam`.
- Free test nen dong vai tro hoc thu/marketing de dieu huong mua khoa hoc.
- Sau khi het 3 luot free, hien CTA dang ky/dang nhap/mua khoa hoc.
- Co `Preview as Student` de tutor kiem tra test truoc khi publish.
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
- Live checklist giup tutor biet test con thieu gi truoc khi publish.

### Out of scope tam thoi

- Cham Writing/Speaking bang AI.
- Upload file audio/image that len server.
- Payment unlock phuc tap ngoai flow hien co.
- Mot test gan nhieu course cung luc.
- Bao cao phan tich nang cao theo tung dang cau hoi.

## 4. Kien Truc Data Model

### 4.1 Nguyen tac

- Khong nhat tat ca format IELTS vao mot object chung kieu `ieltsFormat` co `sections`, `tasks`, `parts` cung luc.
- Dung `testConfig` voi shape khac nhau theo `skill`.
- Giu `questions` tach rieng, nhung khong dung nhieu field nullable nhu `passageId`, `sectionId`, `taskNumber`, `partNumber`.
- Dung `referenceId` va `referenceType` de gan question vao passage/section/part/task.

Ly do:

- 4 skill IELTS co structure khac nhau, nen model tach shape se de validate va de builder component doc hon.
- Publish checklist de check hon.
- Code query/question mapping bot confuse.
- Sau nay neu them JSDoc/TypeScript se co type ro rang hon.

### 4.2 tests common fields

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
  attemptLimit: 3,
  requireLoginAfterLimit: true,

  durationMinutes: 60,
  totalQuestions: 40,
  bandScale: "IELTS 0-9",

  teacherId: "u-teacher-001",
  createdAt: "2026-06-23T00:00:00.000Z",
  updatedAt: "2026-06-23T00:00:00.000Z",

  testConfig: {}
}
```

### 4.3 Reading testConfig

```js
{
  testConfig: {
    passages: [
      {
        id: "passage-1",
        title: "The Industrial Revolution",
        content: "Passage content...",
        imageUrl: "",
        order: 1
      }
    ]
  }
}
```

### 4.4 Listening testConfig

```js
{
  testConfig: {
    audioUrl: "",
    audioPolicy: "allow-replay", // allow-replay | play-once
    sections: [
      {
        id: "section-1",
        title: "Section 1",
        instruction: "Listen and answer questions 1-10.",
        audioUrl: "",
        order: 1
      }
    ]
  }
}
```

### 4.5 Writing testConfig

```js
{
  testConfig: {
    task1: {
      id: "task-1",
      prompt: "Summarise the information by selecting and reporting the main features.",
      imageUrl: "",
      minimumWords: 150
    },
    task2: {
      id: "task-2",
      prompt: "To what extent do you agree or disagree?",
      minimumWords: 250
    },
    bandCriteria: ""
  }
}
```

### 4.6 Speaking testConfig

```js
{
  testConfig: {
    parts: [
      {
        id: "speaking-part-1",
        partNumber: 1,
        title: "Introduction & Interview",
        questions: [
          {
            id: "sp-q-1",
            text: "Do you work or study?",
            answerSeconds: 45
          }
        ]
      },
      {
        id: "speaking-part-2",
        partNumber: 2,
        title: "Cue Card",
        cueCard: "Describe a person who has influenced you.",
        bulletPrompts: [
          "who this person is",
          "how you know this person",
          "why this person influenced you"
        ],
        prepSeconds: 60,
        answerSeconds: 120
      },
      {
        id: "speaking-part-3",
        partNumber: 3,
        title: "Discussion",
        questions: [
          {
            id: "sp-q-2",
            text: "How do role models affect young people?",
            answerSeconds: 60
          }
        ]
      }
    ]
  }
}
```

### 4.7 questions collection

Giu `questions` rieng de de CRUD, reuse, filter, count, va auto-score. Tuy nhien thay cac field nullable bang `referenceId/referenceType`.

```js
{
  id: "q-001",
  testId: "test-001",
  skill: "Reading",

  referenceId: "passage-1",
  referenceType: "passage", // passage | section | part | task

  type: "multiple-choice",
  order: 1,

  questionText: "According to the passage, what was the primary effect?",
  prompt: "",
  options: ["A", "B", "C", "D"],
  answer: "B",
  explanation: "",
  score: 1,

  imageUrl: "",
  audioUrl: ""
}
```

Mapping theo skill:

- Reading question: `referenceType = "passage"`, `referenceId = passage.id`.
- Listening question: `referenceType = "section"`, `referenceId = section.id`.
- Writing task answer: uu tien luu task trong `testConfig`, answer cua student nam trong `testAttempts.answers.task1/task2`; khong bat buoc tao question record.
- Speaking part/cue answer: uu tien luu structure trong `testConfig`, answer cua student nam trong `testAttempts.answers.part1/part2/part3`; chi tao question record neu can tracking tung cau nhu Reading/Listening.
- Neu tao question record rieng cho Speaking de track per-question score: dung `referenceType = "part"` va `referenceId = speakingPart.id`, vi du `referenceId = "speaking-part-1"`.

### 4.8 testAttempts

```js
{
  id: "attempt-001",
  userId: "u-001",
  guestId: "guest-browser-id",
  testId: "test-001",
  skill: "Reading",
  status: "in-progress", // in-progress | completed | expired
  startTime: "2026-06-23T00:00:00.000Z",
  expiredAt: "2026-06-23T01:00:00.000Z",
  completedAt: null,
  answers: {},
  score: null,
  overallBandScore: null
}
```

`expiredAt = startTime + durationMinutes`. Khi check remaining attempts, bo qua cac attempt `in-progress` da qua `expiredAt`. Neu can, co the patch attempt cu thanh `expired`.

### 4.9 testAttempts.answers shape theo skill

Can chuan hoa shape cua `answers` ngay tu dau de Student Session va Review component khong phai doan format.

#### Reading / Listening

Dung question id lam key, value la cau tra loi cua student.

```js
answers: {
  "q-001": "B",
  "q-002": "True",
  "q-003": "industrialisation"
}
```

#### Writing

Dung `task1` va `task2` lam key co dinh.

```js
answers: {
  task1: "Student's essay text for Task 1...",
  task2: "Student's essay text for Task 2..."
}
```

#### Speaking

Dung part key de gom cau tra loi theo tung part. Moi answer nen co `type` de sau nay co the ho tro text/audio.

```js
answers: {
  part1: {
    "sp-q-1": {
      type: "text",
      value: "I work as a teacher."
    }
  },
  part2: {
    type: "audio",
    audioUrl: ""
  },
  part3: {
    "sp-q-2": {
      type: "text",
      value: "Role models can strongly influence young people."
    }
  }
}
```

Review component Phase 6 phai doc theo cac shape nay, khong nen map answers bang index cau hoi vi de vo khi reorder questions.

## 5. Tutor Builder UX Flow

Thay vi mot trang edit rat dai, dung wizard 3 buoc:

```text
Step 1: Basic Info + Skill + Mode
  -> Step 2: Content Builder theo skill
    -> Step 3: Questions / Tasks / Parts
```

### Step 1: Basic Info + Skill + Mode

- Title.
- Description.
- Skill.
- Test mode: free/course.
- Course assignment optional.
- Status: draft/published.
- Practice mode: practice/exam.
- Attempt limit.
- Duration.
- Band scale.

### Step 2: Content Builder theo skill

- Reading: tao Passage 1/2/3.
- Listening: upload/nhap audioUrl, tao Section 1/2/3/4.
- Writing: tao Task 1 prompt + image, Task 2 prompt.
- Speaking: tao Part 1/2/3 + time config.

### Step 3: Questions / Tasks / Parts

- Reading: add questions per passage.
- Listening: add questions per section.
- Writing: khong can Question Builder rieng; Task 1/Task 2 duoc tao o Step 2.
- Speaking: add questions per part, cue card o Step 2/3 tuy UI.

Ly do:

- Writing/Speaking khong phai "question bank" truyen thong.
- Tutor moi dung se de hieu minh dang o buoc nao.
- Live checklist co the bam vao tung issue va dua tutor ve dung step.

## 6. Nghiep Vu Theo Tung Ky Nang

### 6.1 Reading

#### Tutor Builder

- Default duration: 60 minutes.
- Default total questions: 40.
- Tao 3 passage:
  - Passage 1: title, content, optional image.
  - Passage 2: title, content, optional image.
  - Passage 3: title, content, optional image.
- Cau hoi gan voi passage qua `referenceType = "passage"`.
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

### 6.2 Listening

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
- Cau hoi gan voi section qua `referenceType = "section"`.
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

### 6.3 Writing

#### Tutor Builder

- Default duration: 60 minutes.
- Bat buoc co 2 tasks:
  - Task 1:
    - prompt.
    - optional image/chart/process/map URL.
    - minimumWords = 150.
  - Task 2:
    - prompt.
    - minimumWords = 250.
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

### 6.4 Speaking

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

## 7. Free Test va Gioi Han 3 Lan

### Rule

- Test free co `testMode = "free"` hoac `isFreePreview = true`.
- Default `attemptLimit = 3`.
- Guest/student duoc lam toi da 3 lan.
- Sau 3 lan:
  - Neu chua dang nhap: hien CTA dang ky/dang nhap.
  - Neu da dang nhap nhung chua mua/enroll course lien quan: hien CTA mua khoa hoc.
  - Neu da mua/enroll course lien quan: cho lam course test theo rule cua course.

### Cach dem luot lam

De nghi dem:

- Attempt `completed`: tinh vao limit.
- Attempt `in-progress` chua qua `expiredAt`: tinh vao limit.
- Attempt `in-progress` da qua `expiredAt`: khong tinh vao limit.
- Attempt `expired`: khong tinh vao limit.

Ly do:

- Tranh spam Start de tao attempt vo han.
- Van tranh bug UX: user bat dau lam, dong tab, mo lai sau khi het gio thi khong bi mat luot oan mai mai.

### Guest tracking

- Neu user chua login, tao/luu `guestId` trong `localStorage`.
- Khi tao attempt free, luu `guestId`.
- Query attempt theo `guestId + testId`.
- Chap nhan rui ro clear browser reset luot trong demo/json-server.

### Guest banner

Khi guest chua login, hien banner gan nut Start Test:

```text
Luot lam bai cua ban duoc luu tren trinh duyet nay. Dang ky tai khoan de luu tien trinh vinh vien.
```

Banner nay vua minh bach ve tracking, vua la CTA dang ky tu nhien.

## 8. Course Test va Gan Vao Khoa Hoc

### Tutor Flow

```text
Create test
-> Select skill/template
-> Build content
-> Add questions/tasks/parts
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

## 9. Live Publish Checklist

Thay vi chi validate luc bam Publish, hien checklist live trong sidebar cua builder.

Vi du:

```text
[x] Co title
[x] Da chon skill
[!] Chua co passage nao
[ ] Chua co cau hoi
```

Checklist item nen co link/action dua tutor ve dung step can sua.

### Common

- Co title.
- Co skill.
- Co duration.
- Co status.
- Free test co attemptLimit.
- Test co content hop le theo skill.

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

## 10. UI/UX De Xuat

### Teacher

- Test Builder wizard 3 buoc:
  - Basic Info + Skill + Mode.
  - Content Builder theo skill.
  - Questions / Tasks / Parts.
- Co StepIndicator.
- Co SkillTemplateSelector voi preview layout tung skill.
- Co LiveChecklist sidebar.
- Co Preview as Student.
- Test List:
  - show skill.
  - show mode: Free/Course/Preview.
  - show status.
  - show course assigned.
  - show question count.
  - actions: Edit, Builder, Assign Course, Preview, Publish/Unpublish, Delete.

### Student

- Free resources page:
  - them section/tab `Free IELTS Tests`.
  - show card theo skill.
  - show remaining attempts.
  - show GuestBanner neu chua login.
  - CTA start test.
- Course detail:
  - show tests assigned to course.
  - status completed/in-progress/not-started.
- Test detail:
  - show instruction.
  - show attempt limit.
  - show remaining attempts.
  - CTA blocked when limit reached.

## 11. Kien Truc Component

### Student sessions

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
    AttemptGate.jsx
    GuestBanner.jsx
    ExpiryTimer.jsx
```

### Teacher builder

```text
src/pages/teacher/test-builder/
  TestBasicInfoForm.jsx
  SkillTemplateSelector.jsx
  StepIndicator.jsx
  LiveChecklist.jsx
  ReadingBuilder.jsx
  ListeningBuilder.jsx
  WritingBuilder.jsx
  SpeakingBuilder.jsx
  AssignCourseModal.jsx
```

### Services

```text
src/services/testService.js
src/services/testAttemptService.js
```

## 12. Implementation Phases

### Phase 1: Foundation

- [ ] Fix route `/teacher/tests/:id/questions`.
- [ ] Chuan hoa field moi cho tests.
- [ ] Doi spec/data tu `ieltsFormat` sang `testConfig`.
- [ ] Chuan hoa questions voi `referenceId/referenceType`.
- [ ] Them `expiredAt` cho attempt khi start test.
- [ ] Update teacher create/edit test form voi:
  - [ ] testMode.
  - [ ] status.
  - [ ] attemptLimit.
  - [ ] courseId optional.
  - [ ] description.
  - [ ] practiceMode.
- [ ] Update teacher test list de hien thi mode/status/course/attemptLimit.
- [ ] Build pass.

### Phase 2: IELTS Builder Templates

- [ ] Tao wizard 3 buoc.
- [ ] Them StepIndicator.
- [ ] Them SkillTemplateSelector.
- [ ] Them LiveChecklist sidebar.
- [ ] ReadingBuilder: passage sections.
- [ ] ListeningBuilder: audio + sections.
- [ ] WritingBuilder: Task 1 + Task 2 + imageUrl.
- [ ] SpeakingBuilder: Part 1/2/3 + timers.
- [ ] Preview as Student.
- [ ] Build pass.

### Phase 3: Free Test + Attempt Limit

- [ ] Hien free tests trong trang tai nguyen mien phi.
- [ ] Tao guestId trong localStorage cho user chua login.
- [ ] Them GuestBanner cho guest.
- [ ] Check remaining attempts trong test detail.
- [ ] Bo qua in-progress attempt da qua `expiredAt`.
- [ ] Block start khi het 3 luot.
- [ ] CTA login/register/mua khoa hoc.
- [ ] Build pass.

### Phase 4: Course Assignment

- [ ] Them action Assign Course o teacher test list.
- [ ] Cho tao test chua gan course.
- [ ] Gan test vao course sau.
- [ ] Hien course tests trong student course detail/course learning.
- [ ] Kiem tra permission enroll/payment truoc khi lam course test.
- [ ] Build pass.

### Phase 5: Student Sessions Chuan 4 Ky Nang

- [ ] Tach TestSessionPage thanh session theo skill.
- [ ] Them AttemptGate de check limit/permission truoc khi vao session.
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

## 13. Uu Tien De Demo Tot

Neu thoi gian han che, nen lam theo thu tu:

1. Foundation data model: `testConfig`, `referenceId/referenceType`, `expiredAt`.
2. IELTS Builder Templates + LiveChecklist.
3. Free test + limit 3 lan.
4. Gan test vao course.
5. Reading session chuan split panel.
6. Writing session split panel + word count.
7. Listening audio sections.
8. Speaking part-by-part.
9. Preview/publish checklist hoan thien.

## 14. Rui Ro Va Luu Y

- `TestSessionPage.jsx` hien tai da dai, neu nhan them logic 4 skill se kho bao tri. Nen tach component som.
- `db.json` dang co data id khong dong nhat giua number/string o mot so noi. Khi query nen so sanh bang `String(id)`.
- Guest attempt limit can localStorage; neu clear browser se reset. Chap nhan duoc voi json-server/demo.
- Can co `expiredAt` de user khong bi mat luot oan khi dong tab.
- Writing/Speaking khong nen co diem auto trong version dau, de `pending grading` hop ly hon.
- Neu test gan vao course da approved, can can nhac workflow approval hien tai: co the day course ve `pending`.
- Can giu UI dong bo React Bootstrap voi style hien tai.
- `referenceId/referenceType` can duoc dung nhat quan trong query va render, tranh quay lai nhieu field nullable.

## 15. Definition Of Done

- Tutor tao duoc free test va course test.
- Tutor tao test theo wizard 3 buoc.
- Test dung `testConfig` theo skill, khong dung `ieltsFormat` chung.
- Questions dung `referenceId/referenceType`.
- Tutor thay live checklist trong luc build test.
- Tutor publish/unpublish duoc test.
- Tutor gan test vao course sau khi tao.
- Student thay free test trong tai nguyen mien phi.
- Free test bi gioi han 3 lan, co xu ly `expiredAt`.
- Guest thay banner khuyen khich dang ky.
- Student thay course test trong khoa hoc.
- Reading/Listening lam va review duoc.
- Writing/Speaking lam duoc va hien pending grading.
- Build khong co compile error.
- Khong pha cac flow course/lesson/test hien co.
