import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Table, Button, Modal, Spinner, Alert, ProgressBar, Tabs, Tab } from 'react-bootstrap';
import { getCurrentUser } from '../../services/authService';
import { teacherCourseService } from '../../services/teacherCourseService';
import { teacherStudentService } from '../../services/teacherStudentService';
import { teacherTestService } from '../../services/teacherTestService';

// EARS[Ubiquitous]: The StudentTrackingPage component shall list and filter student progress and attempts for courses owned by the teacher
export default function StudentTrackingPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tests, setTests] = useState([]);
  const [testAttempts, setTestAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Modal Details
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Grading Modal States
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingAttempt, setGradingAttempt] = useState(null);
  const [gradingTest, setGradingTest] = useState(null);
  const [gradingBand, setGradingBand] = useState('6.0');
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradingError, setGradingError] = useState(null);

  const currentUser = getCurrentUser();
  const teacherId = currentUser?.id || 'u-teacher-001';

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [coursesData, enrollmentsData, studentsData, testsData, attemptsData] = await Promise.all([
          teacherCourseService.getCourses(teacherId),
          teacherStudentService.getEnrollments(),
          teacherStudentService.getStudents(),
          teacherTestService.getTests(teacherId),
          teacherStudentService.getTestAttempts()
        ]);

        setCourses(coursesData);
        setEnrollments(enrollmentsData);
        setStudents(studentsData);
        setTests(testsData);
        setTestAttempts(attemptsData);
      } catch (err) {
        // EARS[Unwanted]: WHERE server connections fail, THE system SHALL display an error message
        setError('Không thể tải dữ liệu tiến trình học viên. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [teacherId]);

  // Joins client-side: Filter enrollments belonging to this teacher's courses
  const teacherCourseIds = courses.map(c => c.id);
  
  const studentProgressList = enrollments
    .filter(enroll => teacherCourseIds.includes(enroll.courseId))
    .map(enroll => {
      const student = students.find(s => s.id === enroll.userId);
      const course = courses.find(c => c.id === enroll.courseId);
      return {
        id: enroll.id,
        enrollment: enroll,
        student: student || { fullName: 'Học viên ẩn danh', email: 'N/A' },
        course: course || { title: 'Khóa học ẩn' }
      };
    });

  // Filter based on query and course select
  const filteredList = studentProgressList.filter(item => {
    const matchSearch = item.student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCourse = selectedCourseId ? item.enrollment.courseId === selectedCourseId : true;
    return matchSearch && matchCourse;
  });

  const handleOpenDetail = (item) => {
    setSelectedEnrollment(item.enrollment);
    setSelectedStudent(item.student);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedEnrollment(null);
    setSelectedStudent(null);
  };

  const handleOpenGrading = (attempt, test, e) => {
    e.stopPropagation();
    setGradingAttempt(attempt);
    setGradingTest(test);
    setGradingBand(attempt.bandScore ? String(attempt.bandScore) : '6.0');
    setGradingFeedback(attempt.feedback || '');
    setGradingError(null);
    setShowGradingModal(true);
  };

  const handleCloseGrading = () => {
    setShowGradingModal(false);
    setGradingAttempt(null);
    setGradingTest(null);
    setGradingBand('6.0');
    setGradingFeedback('');
  };

  const handleSaveGrade = async () => {
    if (!gradingAttempt) return;
    setSavingGrade(true);
    setGradingError(null);
    try {
      await teacherStudentService.gradeAttempt(gradingAttempt.id, {
        bandScore: Number(gradingBand),
        feedback: gradingFeedback,
        teacherId: teacherId
      });

      // Refresh attempts lists
      const attemptsData = await teacherStudentService.getTestAttempts();
      setTestAttempts(attemptsData);
      
      handleCloseGrading();
    } catch (err) {
      setGradingError('Không thể lưu điểm chấm. Vui lòng thử lại.');
    } finally {
      setSavingGrade(false);
    }
  };

  // Get test attempts belonging to the selected student and course
  const getSelectedStudentTestAttempts = () => {
    if (!selectedStudent || !selectedEnrollment) return [];
    
    // Get tests inside this course
    const courseTests = tests.filter(t => t.courseId === selectedEnrollment.courseId);
    
    return courseTests.map(test => {
      // Find attempts by this student for this test
      const attempts = testAttempts.filter(
        att => att.testId === test.id && att.userId === selectedStudent.id
      );
      return {
        test,
        attempts: attempts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort newest first
      };
    });
  };

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-people-fill"></i> Quản lý</div>
            <h1 className="tp-page-title">Theo dõi Tiến trình Học viên</h1>
            <p className="tp-page-sub">Giám sát mức độ hoàn thành bài giảng và kết quả làm đề thi thử của học viên.</p>
          </div>
        </div>
      </div>

      <div className="tp-main-content">
      <Container fluid="xxl" className="px-4">
      {error && <div className="tp-error mb-4"><i className="bi bi-exclamation-triangle-fill text-danger fs-4"></i><div className="text-secondary">{error}</div></div>}

      <div className="tp-filter-bar">
        <Form className="row g-3">
          <Col md={8}>
            <Form.Group controlId="studentSearch">
              <Form.Label className="fw-semibold text-secondary">Tìm học viên</Form.Label>
              <Form.Control type="text" placeholder="Tìm theo tên học viên hoặc email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="shadow-none" />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="courseFilter">
              <Form.Label className="fw-semibold text-secondary">Lọc theo khóa học</Form.Label>
              <Form.Select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="shadow-none">
                <option value="">Tất cả khóa học</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Form>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="tp-loading">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} />
          <p className="mt-3 fw-semibold text-secondary">Đang tải tiến trình học viên...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="tp-card-static">
          <div className="tp-empty">
            <div className="tp-empty-icon"><i className="bi bi-people"></i></div>
            <div className="tp-empty-title">Không tìm thấy học viên nào</div>
            <p className="tp-empty-sub">Thay đổi bộ lọc tìm kiếm hoặc kiểm tra lại danh sách đăng ký học viên.</p>
          </div>
        </div>
      ) : (
        <Card className="border-0 shadow-none border border-dark rounded-0 overflow-hidden bg-white">
          <Table responsive hover className="align-middle mb-0 text-secondary table-nowrap">
            <thead className="bg-light text-dark fw-bold">
              <tr>
                <th className="px-4 py-3">Tên học viên</th>
                <th className="py-3">Email</th>
                <th className="py-3">Khóa học đăng ký</th>
                <th className="py-3" style={{ width: '250px' }}>Tiến độ bài học</th>
                <th className="py-3">Trạng thái</th>
                <th className="px-4 py-3 text-end" style={{ width: '150px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(item => (
                <tr key={item.id} className="border-top border-light">
                  <td className="px-4 py-3 fw-bold text-dark">
                    {item.student.fullName}
                  </td>
                  <td className="py-3 small">
                    {item.student.email}
                  </td>
                  <td className="py-3 fw-medium text-secondary small">
                    {item.course.title}
                  </td>
                  <td className="py-3">
                    <div className="d-flex align-items-center gap-2">
                      <ProgressBar 
                        now={item.enrollment.progress} 
                        variant={item.enrollment.progress === 100 ? 'success' : 'primary'}
                        className="flex-grow-1" 
                        style={{ height: '8px' }}
                      />
                      <span className="small fw-bold text-dark">{item.enrollment.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`badge rounded-0 ${
                      item.enrollment.status === 'active' ? 'bg-success text-success-50 bg-opacity-10 border border-success border-opacity-25' :
                      'bg-secondary text-secondary-50 bg-opacity-10 border border-secondary border-opacity-25'
                    }`}>
                      {item.enrollment.status === 'active' ? 'Đang học' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button 
                      variant="outline-primary"
                      onClick={() => handleOpenDetail(item)}
                      className="px-3 py-1.5 rounded-0 fw-semibold small shadow-none"
                    >
                      <i className="bi bi-eye"></i> Chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Details modal */}
      <Modal show={showDetailModal} onHide={handleCloseDetail} size="lg" centered>
        <Modal.Header closeButton className="border-0 bg-light">
          <Modal.Title className="fw-bold text-dark">Chi tiết học tập học viên</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-secondary-subtle bg-opacity-10 rounded-0 border border-light-subtle">
            <div className="bg-primary text-white rounded-0 d-flex align-items-center justify-content-center fw-bold text-uppercase fs-4" style={{ width: '50px', height: '50px' }}>
              {selectedStudent?.fullName?.charAt(0)}
            </div>
            <div>
              <h5 className="fw-bold text-dark mb-0">{selectedStudent?.fullName}</h5>
              <span className="text-secondary small">{selectedStudent?.email}</span>
            </div>
          </div>

          <Tabs defaultActiveKey="lessons" className="mb-4 border-bottom">
            {/* Lesson Completion Progress Tab */}
            <Tab eventKey="lessons" title="Tiến độ bài học">
              <div className="py-2">
                <h6 className="fw-bold text-secondary mb-3">Mức độ hoàn thành bài giảng</h6>
                <div className="d-flex align-items-center gap-3 mb-4">
                  <ProgressBar 
                    now={selectedEnrollment?.progress || 0} 
                    variant={selectedEnrollment?.progress === 100 ? 'success' : 'primary'}
                    className="flex-grow-1"
                    style={{ height: '15px' }}
                  />
                  <span className="fs-5 fw-bold text-dark">{selectedEnrollment?.progress || 0}%</span>
                </div>
                <div className="row g-3">
                  <Col sm={6}>
                    <Card className="border border-light-subtle rounded-0 p-3 shadow-xs bg-light">
                      <div className="text-muted small mb-1">Ngày đăng ký học</div>
                      <div className="fw-bold text-dark">{selectedEnrollment?.enrolledAt || 'N/A'}</div>
                    </Card>
                  </Col>
                  <Col sm={6}>
                    <Card className="border border-light-subtle rounded-0 p-3 shadow-xs bg-light">
                      <div className="text-muted small mb-1">Trạng thái tài khoản khóa học</div>
                      <div className="fw-bold text-success text-capitalize">{selectedEnrollment?.status || 'N/A'}</div>
                    </Card>
                  </Col>
                </div>
              </div>
            </Tab>

            {/* Test Results Attempts History Tab */}
            <Tab eventKey="tests" title="Kết quả thi thử">
              <div className="py-2">
                <h6 className="fw-bold text-secondary mb-3">Điểm số bài kiểm tra luyện tập</h6>
                
                {getSelectedStudentTestAttempts().length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-file-earmark-bar-graph text-muted fs-3 mb-2 d-block"></i>
                    <span className="text-muted small">Khóa học này chưa được phân bổ bài kiểm tra nào.</span>
                  </div>
                ) : (
                  <Table responsive hover className="align-middle mb-0 text-secondary table-nowrap small border">
                    <thead className="bg-light text-dark fw-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Tên bài kiểm tra</th>
                        <th className="py-2.5 px-3">Kỹ năng</th>
                        <th className="py-2.5 px-3">Thời điểm làm bài</th>
                        <th className="py-2.5 px-3 text-center">Tỷ lệ đúng</th>
                        <th className="py-2.5 px-3 text-center">Điểm số (Band)</th>
                        <th className="py-2.5 px-3 text-end">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSelectedStudentTestAttempts().map(({ test, attempts }) => {
                        if (attempts.length === 0) {
                          return (
                            <tr key={test.id} className="border-top border-light">
                              <td className="py-2.5 px-3 fw-bold text-dark">{test.title}</td>
                              <td className="py-2.5 px-3">{test.skill}</td>
                              <td className="py-2.5 px-3 text-muted italic" colSpan="4">
                                Chưa làm bài
                              </td>
                            </tr>
                          );
                        }

                        // Display the most recent attempt
                        const latestAttempt = attempts[0];
                        const isSubjective = test.skill === 'Writing' || test.skill === 'Speaking';
                        return (
                          <tr key={test.id} className="border-top border-light">
                            <td className="py-2.5 px-3 fw-bold text-dark">{test.title}</td>
                            <td className="py-2.5 px-3">
                              <span className="badge bg-secondary-subtle text-secondary px-2 py-0.5 rounded-0">
                                {test.skill}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 small">
                              {new Date(latestAttempt.createdAt).toLocaleDateString('vi-VN')} {new Date(latestAttempt.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-3 text-center fw-semibold">
                              {isSubjective ? '-' : `${latestAttempt.score || 0} / ${latestAttempt.totalQuestions || 40}`}
                            </td>
                            <td className="py-2.5 px-3 text-center fw-bold text-primary">
                              {isSubjective && latestAttempt.gradingStatus === 'pending' ? (
                                <span className="text-warning fw-semibold small">Chờ chấm</span>
                              ) : (
                                `Band ${latestAttempt.bandScore || 'N/A'}`
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-end">
                              {isSubjective ? (
                                <Button 
                                  size="sm" 
                                  variant={latestAttempt.gradingStatus === 'pending' ? "warning" : "outline-secondary"} 
                                  className="rounded-0 px-3 py-0.5 text-xs fw-semibold border-0"
                                  onClick={(e) => handleOpenGrading(latestAttempt, test, e)}
                                  data-testid={`btn-grade-${latestAttempt.id}`}
                                >
                                  {latestAttempt.gradingStatus === 'pending' ? 'Chấm bài' : 'Sửa điểm'}
                                </Button>
                              ) : (
                                <span className="text-muted small">Tự động</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={handleCloseDetail} className="rounded-0 px-4 fw-semibold">
            Đóng lại
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Grading Modal */}
      <Modal show={showGradingModal} onHide={handleCloseGrading} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            Chấm điểm đề thi: {gradingTest?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {gradingError && <Alert variant="danger">{gradingError}</Alert>}
          
          <div className="mb-4">
            <h6 className="fw-bold text-secondary mb-2">Thông tin bài làm của học viên</h6>
            <div className="bg-light p-3 rounded-0 border">
              <strong>Kỹ năng:</strong> {gradingTest?.skill} <br />
              <strong>Ngày làm bài:</strong> {gradingAttempt && new Date(gradingAttempt.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>

          <div className="mb-4">
            <h6 className="fw-bold text-secondary mb-2">Nội dung bài viết / câu trả lời</h6>
            <div className="p-3 border rounded-0 bg-white" style={{ maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
              {gradingAttempt?.answers && Object.keys(gradingAttempt.answers).length > 0 ? (
                Object.entries(gradingAttempt.answers).map(([key, val]) => (
                  <div key={key} className="mb-3">
                    <strong className="text-primary text-uppercase">{key}:</strong>
                    <div className="mt-1 p-2 bg-light rounded border-start border-primary border-3">{val}</div>
                  </div>
                ))
              ) : (
                <em className="text-muted">Không tìm thấy nội dung bài làm tự luận.</em>
              )}
            </div>
          </div>

          <Form>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group controlId="gradeBandSelect">
                  <Form.Label className="fw-bold text-secondary">IELTS Band Score</Form.Label>
                  <Form.Select 
                    value={gradingBand} 
                    onChange={(e) => setGradingBand(e.target.value)}
                    className="border-gray shadow-none"
                    data-testid="grade-band-select"
                  >
                    {[0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map(val => (
                      <option key={val} value={val.toFixed(1)}>{val.toFixed(1)}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group controlId="gradeFeedback">
                  <Form.Label className="fw-bold text-secondary">Lời khuyên & Nhận xét chi tiết</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={4}
                    value={gradingFeedback}
                    onChange={(e) => setGradingFeedback(e.target.value)}
                    placeholder="Nhập lời phê, nhận xét cho từng tiêu chí (Task Achievement, Coherence, Lexical Resource, Grammar)..."
                    className="border-gray shadow-none"
                    data-testid="grade-feedback-input"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={handleCloseGrading} className="rounded-0 px-4 fw-semibold" disabled={savingGrade}>
            Đóng
          </Button>
          <Button variant="primary" onClick={handleSaveGrade} className="rounded-0 px-4 fw-semibold" disabled={savingGrade} data-testid="grade-submit-btn">
            {savingGrade ? 'Đang lưu...' : 'Lưu kết quả chấm'}
          </Button>
        </Modal.Footer>
      </Modal>
      </Container></div></div>
  );
}
