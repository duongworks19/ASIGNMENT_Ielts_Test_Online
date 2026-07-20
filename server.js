// server.js - Custom JSON Server Wrapper with Business Logic and Trial Limits
(async () => {
  const { createApp } = await import('json-server/lib/app.js');
  const { Low } = await import('lowdb');
  const { JSONFile } = await import('lowdb/node');
  const { App } = await import('@tinyhttp/app');
  const { json } = await import('milliparsec');
  const multer = (await import('multer')).default;
  const path = await import('path');
  const fs = await import('fs');

  const PORT = process.env.PORT || 9999;

  // Initialize uploads directory
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const ext = path.extname(file.originalname);
      const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
      cb(null, safeName + '-' + uniqueSuffix + ext)
    }
  });
  const upload = multer({ storage: storage });

  // Initialize lowdb database
  const adapter = new JSONFile('db.json');
  const db = new Low(adapter, {});
  await db.read();

  // Ensure collections exist
  db.data = db.data || {};
  db.data.courses = db.data.courses || [];
  db.data.users = db.data.users || [];
  db.data.tests = db.data.tests || [];
  db.data.testAttempts = db.data.testAttempts || [];
  db.data.flashcards = db.data.flashcards || [];
  db.data.flashcardProgress = db.data.flashcardProgress || [];
  db.data.auditLogs = db.data.auditLogs || [];
  db.data.approvalRequests = db.data.approvalRequests || [];
  db.data.library_resources = db.data.library_resources || [];
  db.data.enrollments = db.data.enrollments || [];

  // Sequential ID Generator
  function generateNextId(collectionName, prefix) {
    const items = db.data[collectionName] || [];
    let maxNum = 0;
    items.forEach(item => {
      if (item.id && String(item.id).startsWith(prefix)) {
        const numPart = String(item.id).substring(prefix.length);
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    });
    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  }

  // Create wrapper app
  const server = new App();

  // Custom CORS middleware to prevent Network Error on frontend custom POST/PATCH requests
  server.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    next();
  });

  const bodyParser = json();

  // --- 0. POST /upload (Real File Upload) ---
  server.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Return relative URL to be saved in JSON DB
    res.json({ fileUrl: `/uploads/${req.file.filename}` });
  });

  // --- 1. POST /courses (Course Creation) ---
  server.post('/courses', bodyParser, async (req, res) => {
    const { title, skill, level, price, teacherId, description, durationWeeks, thumbnail } = req.body;

    // AC-06: Validate Price
    if (price !== undefined && Number(price) < 0) {
      return res.status(400).json({ message: 'Giá học phí không được nhỏ hơn 0.' });
    }

    // Server-side validation for required fields
    if (!title || title.trim().length < 5) {
      return res.status(400).json({ message: 'Tiêu đề khóa học phải có ít nhất 5 ký tự.' });
    }
    if (!skill || !['Listening', 'Reading', 'Writing', 'Speaking'].includes(skill)) {
      return res.status(400).json({ message: 'Kỹ năng chuyên môn không hợp lệ.' });
    }
    if (!level || !['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
      return res.status(400).json({ message: 'Trình độ khóa học không hợp lệ.' });
    }

    // AC-07: Validate teacherId existence and role
    let teacher = db.data.users.find(u => u.id === teacherId);
    if (!teacher) {
      await db.read();
      teacher = db.data.users.find(u => u.id === teacherId);
    }
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'Giảng viên không tồn tại hoặc không có quyền tạo khóa học.' });
    }

    // AC-02, AC-03, AC-04, AC-05, AC-08: Build new course object
    const newCourseId = generateNextId('courses', 'course-');
    const newCourse = {
      id: newCourseId,
      title,
      description: description || '',
      syllabus: req.body.syllabus || [],
      skill,
      level,
      price: Number(price) || 0,
      isPremium: Number(price) > 0,
      thumbnail: thumbnail || '',
      teacherId,
      status: 'draft', // AC-03: Default status is draft
      enrolledCount: 0, // AC-04: Default enrolledCount is 0
      durationWeeks: Number(durationWeeks) || 4,
      createdAt: new Date().toISOString() // AC-08: Standard ISO format
    };

    db.data.courses.push(newCourse);
    await db.write();

    console.log(`[Course Creation] Created Course: ${newCourseId}`);
    res.status(201).json(newCourse);
  });

  // --- 2. PATCH /courses/:id (Approval requests trigger) ---
  server.patch('/courses/:id', bodyParser, async (req, res, next) => {
    const courseId = req.params.id;
    const { status } = req.body;

    const courseIndex = db.data.courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course Not Found' });
    }

    const originalCourse = db.data.courses[courseIndex];

    // AC-10: Trigger Approval Request when course status becomes 'pending'
    if (status === 'pending' && originalCourse.status !== 'pending') {
      const existingReq = db.data.approvalRequests.find(r => 
        r.targetId === courseId && 
        r.targetType === 'course' && 
        r.status === 'pending'
      );

      if (!existingReq) {
        const nextReqId = generateNextId('approvalRequests', 'req-');
        const approvalReq = {
          id: nextReqId,
          targetType: 'course',
          targetId: courseId,
          teacherId: originalCourse.teacherId,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        db.data.approvalRequests.push(approvalReq);
        console.log(`[Approval Workflow] Generated approval request: ${nextReqId} for course: ${courseId}`);
      }
    }

    // Update the course in db
    db.data.courses[courseIndex] = { ...originalCourse, ...req.body, id: courseId };
    await db.write();

    res.json(db.data.courses[courseIndex]);
  });

  // --- 3. POST /auditLogs (Audit Logging standardization) ---
  server.post('/auditLogs', bodyParser, async (req, res) => {
    const { action, userId, details, timestamp } = req.body;

    const nextLogId = generateNextId('auditLogs', 'log-');
    const newLog = {
      id: nextLogId,
      actorId: userId || req.body.actorId || 'unknown',
      action: action || 'UNKNOWN',
      targetType: req.body.targetType || (details && details.courseId ? 'course' : 'unknown'),
      targetId: req.body.targetId || (details && details.courseId ? details.courseId : 'unknown'),
      createdAt: timestamp || req.body.createdAt || new Date().toISOString()
    };

    db.data.auditLogs.push(newLog);
    await db.write();

    console.log(`[Audit System] Recorded Action: ${action} - Log ID: ${nextLogId}`);
    res.status(201).json(newLog);
  });

  // --- 4. POST /testAttempts (Practice Test Limits check & Creation) ---
  server.post('/testAttempts', bodyParser, async (req, res) => {
    const { testId, userId, guestId, skill, status } = req.body;
    const studentId = userId || guestId;

    if (studentId && testId) {
      const test = db.data.tests.find(t => t.id === testId || String(t.id) === String(testId));
      if (test && test.courseId) {
        const course = db.data.courses.find(c => c.id === test.courseId);
        
        // AC-11: Limit Free Course to 3 testAttempts total per course
        if (course && !course.isPremium) {
          // Find all tests in this course
          const courseTests = db.data.tests.filter(t => t.courseId === course.id);
          const testIds = courseTests.map(t => t.id);

          // Count student attempts across these tests
          const count = db.data.testAttempts.filter(att => 
            (att.userId === studentId || att.guestId === studentId) && 
            testIds.includes(att.testId)
          ).length;

          if (count >= 3) {
            // Check if user has premium enrollment
            const enrollment = db.data.enrollments.find(e => e.userId === studentId && e.courseId === course.id);
            if (!enrollment || !enrollment.isPremium) {
              console.log(`[Trial Limits] Blocked Test Attempt for user: ${studentId} on course: ${course.id}`);
              return res.status(403).json({
                message: 'Bạn đã sử dụng hết 3 lượt làm bài kiểm tra miễn phí của khóa học này. Vui lòng nâng cấp lên khóa học Premium để tiếp tục.'
              });
            }
          }
        }
      }
    }

    // Auto generate sequential ID to prevent random uuid
    const nextTaId = generateNextId('testAttempts', 'ta-');
    const newAttempt = {
      id: nextTaId,
      userId: userId || null,
      guestId: guestId || null,
      testId,
      skill: skill || 'Reading',
      status: status || 'in-progress',
      startTime: req.body.startTime || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    db.data.testAttempts.push(newAttempt);
    await db.write();

    console.log(`[Test Attempt] Saved Attempt: ${nextTaId} for student: ${studentId}`);
    res.status(201).json(newAttempt);
  });

  // --- 5. POST /flashcardProgress (Flashcard Progress Limits check) ---
  server.post('/flashcardProgress', bodyParser, async (req, res, next) => {
    const { flashcardId, userId } = req.body;

    if (userId && flashcardId) {
      const flashcard = db.data.flashcards.find(fc => fc.id === flashcardId);
      if (flashcard && flashcard.courseId) {
        const course = db.data.courses.find(c => c.id === flashcard.courseId);

        // AC-12: Flashcards are unlimited for both free and premium courses
        // No limits check needed here anymore.
      }
    }

    // Auto generate sequential ID to prevent random uuid
    const nextFpId = generateNextId('flashcardProgress', 'fp-');
    const newProgress = {
      id: nextFpId,
      userId,
      flashcardId,
      status: req.body.status || 'review',
      createdAt: req.body.createdAt || new Date().toISOString()
    };

    db.data.flashcardProgress.push(newProgress);
    await db.write();

    console.log(`[Flashcard Progress] Saved Progress: ${nextFpId} for user: ${userId}`);
    res.status(201).json(newProgress);
  });

  // --- 6. GET /lessons (Filter by teacherId or courseId) ---
  server.get('/lessons', async (req, res, next) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const teacherId = url.searchParams.get('teacherId');
    const courseId = url.searchParams.get('courseId');

    await db.read();

    if (teacherId) {
      // Find all courses taught by this teacher
      const teacherCourses = db.data.courses.filter(c => c.teacherId === teacherId);
      const courseIds = teacherCourses.map(c => c.id);

      // Return lessons that belong to these courses OR directly have teacherId
      const filtered = db.data.lessons.filter(l => 
        courseIds.includes(l.courseId) || l.teacherId === teacherId
      );

      // If courseId filter is also specified, narrow it down
      if (courseId) {
        return res.json(filtered.filter(l => l.courseId === courseId));
      }
      return res.json(filtered);
    }

    next();
  });

  // --- 7. POST /lessons (Create Lesson) ---
  server.post('/lessons', bodyParser, async (req, res) => {
    const { courseId, title, order, durationMinutes, contentUrl, audioUrl, teacherId } = req.body;

    await db.read();

    // 1. Validation
    if (!courseId) {
      return res.status(400).json({ message: 'Khóa học liên kết không được để trống.' });
    }
    if (!title || title.trim().length < 5) {
      return res.status(400).json({ message: 'Tiêu đề bài học phải có ít nhất 5 ký tự.' });
    }
    if (order === undefined || isNaN(parseInt(order, 10)) || parseInt(order, 10) < 1) {
      return res.status(400).json({ message: 'Số thứ tự bài giảng phải là số nguyên dương >= 1.' });
    }
    if (durationMinutes === undefined || isNaN(parseInt(durationMinutes, 10)) || parseInt(durationMinutes, 10) < 1) {
      return res.status(400).json({ message: 'Thời lượng bài giảng phải là số nguyên dương >= 1.' });
    }
    if (!contentUrl || contentUrl.trim().length === 0) {
      return res.status(400).json({ message: 'Đường dẫn nội dung bài học không được để trống.' });
    }

    // 2. Check course existence and ownership
    const course = db.data.courses.find(c => c.id === courseId);
    if (!course) {
      return res.status(404).json({ message: 'Khóa học liên kết không tồn tại.' });
    }
    if (teacherId && course.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Bạn không có quyền thêm bài giảng vào khóa học này.' });
    }

    // 3. EARS[Unwanted]: Chặn thêm/chỉnh sửa nếu khóa học đang pending
    if (course.status === 'pending') {
      return res.status(400).json({ message: 'Khóa học đang chờ duyệt. Không thể thêm bài học mới.' });
    }

    // 4. Auto-revert to pending if approved
    if (course.status === 'approved') {
      course.status = 'pending';
      console.log(`[Revert Course Status] Reverting course ${courseId} to pending due to new lesson creation`);
      
      const existingReq = db.data.approvalRequests.find(r => 
        r.targetId === courseId && 
        r.targetType === 'course' && 
        r.status === 'pending'
      );
      if (!existingReq) {
        const nextReqId = generateNextId('approvalRequests', 'req-');
        const approvalReq = {
          id: nextReqId,
          targetType: 'course',
          targetId: courseId,
          teacherId: course.teacherId,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        db.data.approvalRequests.push(approvalReq);
      }
    }

    // 5. Generate sequential ID
    const newLessonId = generateNextId('lessons', 'lesson-');
    const newLesson = {
      id: newLessonId,
      courseId,
      title,
      order: parseInt(order, 10),
      durationMinutes: parseInt(durationMinutes, 10),
      contentUrl,
      audioUrl: audioUrl || '',
      teacherId: teacherId || course.teacherId,
      status: req.body.status || 'published',
      createdAt: new Date().toISOString()
    };

    db.data.lessons.push(newLesson);
    await db.write();

    console.log(`[Lesson Creation] Created Lesson: ${newLessonId} in course ${courseId}`);
    res.status(201).json(newLesson);
  });

  // --- 8. PATCH /lessons/:id (Update Lesson) ---
  server.patch('/lessons/:id', bodyParser, async (req, res, next) => {
    const lessonId = req.params.id;
    const { title, order, durationMinutes, contentUrl, audioUrl, teacherId } = req.body;

    await db.read();

    const lessonIndex = db.data.lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex === -1) {
      return res.status(404).json({ message: 'Bài giảng không tồn tại.' });
    }

    const originalLesson = db.data.lessons[lessonIndex];
    const course = db.data.courses.find(c => c.id === originalLesson.courseId);

    if (!course) {
      return res.status(404).json({ message: 'Khóa học liên kết không tồn tại.' });
    }

    // Check ownership
    if (teacherId && course.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa bài giảng của khóa học này.' });
    }

    // EARS[Unwanted]: Chặn sửa nếu khóa học đang pending
    if (course.status === 'pending') {
      return res.status(400).json({ message: 'Khóa học đang chờ duyệt. Không thể chỉnh sửa bài giảng.' });
    }

    // Validation
    if (title !== undefined && title.trim().length < 5) {
      return res.status(400).json({ message: 'Tiêu đề bài học phải có ít nhất 5 ký tự.' });
    }
    if (order !== undefined && (isNaN(parseInt(order, 10)) || parseInt(order, 10) < 1)) {
      return res.status(400).json({ message: 'Số thứ tự bài giảng phải là số nguyên dương >= 1.' });
    }
    if (durationMinutes !== undefined && (isNaN(parseInt(durationMinutes, 10)) || parseInt(durationMinutes, 10) < 1)) {
      return res.status(400).json({ message: 'Thời lượng bài giảng phải là số nguyên dương >= 1.' });
    }

    // Auto-revert to pending if approved
    if (course.status === 'approved') {
      course.status = 'pending';
      console.log(`[Revert Course Status] Reverting course ${course.id} to pending due to lesson modification`);
      
      const existingReq = db.data.approvalRequests.find(r => 
        r.targetId === course.id && 
        r.targetType === 'course' && 
        r.status === 'pending'
      );
      if (!existingReq) {
        const nextReqId = generateNextId('approvalRequests', 'req-');
        const approvalReq = {
          id: nextReqId,
          targetType: 'course',
          targetId: course.id,
          teacherId: course.teacherId,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        db.data.approvalRequests.push(approvalReq);
      }
    }

    // Update lesson
    const updatedLesson = {
      ...originalLesson,
      ...req.body,
      id: lessonId,
      order: order !== undefined ? parseInt(order, 10) : originalLesson.order,
      durationMinutes: durationMinutes !== undefined ? parseInt(durationMinutes, 10) : originalLesson.durationMinutes
    };

    db.data.lessons[lessonIndex] = updatedLesson;
    await db.write();

    console.log(`[Lesson Update] Updated Lesson: ${lessonId}`);
    res.json(updatedLesson);
  });

  // --- 9. DELETE /lessons/:id (Delete Lesson) ---
  server.delete('/lessons/:id', async (req, res) => {
    const lessonId = req.params.id;
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const teacherId = url.searchParams.get('teacherId');

    await db.read();

    const lessonIndex = db.data.lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex === -1) {
      return res.status(404).json({ message: 'Bài giảng không tồn tại.' });
    }

    const lesson = db.data.lessons[lessonIndex];
    const course = db.data.courses.find(c => c.id === lesson.courseId);

    if (!course) {
      return res.status(404).json({ message: 'Khóa học liên kết không tồn tại.' });
    }

    // Check ownership if teacherId is provided
    if (teacherId && course.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa bài giảng của khóa học này.' });
    }

    // EARS[Unwanted]: Chặn xóa nếu khóa học đang pending
    if (course.status === 'pending') {
      return res.status(400).json({ message: 'Khóa học đang chờ duyệt. Không thể xóa bài giảng.' });
    }

    // Auto-revert to pending if approved
    if (course.status === 'approved') {
      course.status = 'pending';
      console.log(`[Revert Course Status] Reverting course ${course.id} to pending due to lesson deletion`);
      
      const existingReq = db.data.approvalRequests.find(r => 
        r.targetId === course.id && 
        r.targetType === 'course' && 
        r.status === 'pending'
      );
      if (!existingReq) {
        const nextReqId = generateNextId('approvalRequests', 'req-');
        const approvalReq = {
          id: nextReqId,
          targetType: 'course',
          targetId: course.id,
          teacherId: course.teacherId,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        db.data.approvalRequests.push(approvalReq);
      }
    }

    // Remove lesson
    db.data.lessons.splice(lessonIndex, 1);
    await db.write();

    console.log(`[Lesson Deletion] Deleted Lesson: ${lessonId}`);
    res.json({ message: 'Xóa bài giảng thành công.' });
  });

  // Mount main json-server app
  const jsonServerApp = createApp(db);
  server.use(jsonServerApp);

  server.listen(PORT, () => {
    console.log(`Custom JSON Server is running on port ${PORT}`);
  });
})();
