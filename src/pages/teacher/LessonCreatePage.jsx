import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Container, Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../services/authService';
import { teacherCourseService } from '../../services/teacherCourseService';
import { teacherLessonService } from '../../services/teacherLessonService';
import { auditLogService } from '../../services/auditLogService';

const lessonSchema = z.object({
  courseId: z.string().min(1, 'Vui lòng chọn khóa học'),
  title: z.string().min(5, 'Tiêu đề bài học phải có ít nhất 5 ký tự'),
  order: z.coerce.number().int('Số thứ tự phải là số nguyên').min(1, 'Số thứ tự phải ít nhất là 1'),
  durationMinutes: z.coerce.number().int('Thời lượng phải là số nguyên').min(1, 'Thời lượng phải ít nhất 1 phút'),
  contentUrl: z.string().min(1, 'Vui lòng nhập link nội dung bài học hoặc mô tả'),
  audioUrl: z.string().optional().refine(val => !val || val.startsWith('http'), {
    message: 'Link audio phải là URL hợp lệ (bắt đầu bằng http)'
  })
});

const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function LessonCreatePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryCourseId = searchParams.get('courseId') || '';

  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [targetCourseStatus, setTargetCourseStatus] = useState('');

  const currentUser = getCurrentUser();
  const teacherId = currentUser?.id || 'u-teacher-001';

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      courseId: '',
      title: '',
      order: 1,
      durationMinutes: 30,
      contentUrl: '',
      audioUrl: ''
    }
  });

  const selectedCourseId = watch('courseId');
  const contentUrlValue = watch('contentUrl') || '';
  const audioUrlValue = watch('audioUrl') || '';

  // Load courses and/or existing lesson details
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const coursesData = await teacherCourseService.getCourses(teacherId);
        setCourses(coursesData);

        if (id) {
          // Edit mode: fetch lesson
          const lessonData = await teacherLessonService.getLessonById(id);
          
          // EARS[Ubiquitous]: Giao diện quản lý PHẢI chỉ hiển thị và cho phép chỉnh sửa nội dung do chính Teacher đó tạo ra
          if (lessonData.teacherId !== teacherId) {
            setIsUnauthorized(true);
            setLoading(false);
            return;
          }

          reset({
            courseId: lessonData.courseId,
            title: lessonData.title,
            order: lessonData.order,
            durationMinutes: lessonData.durationMinutes,
            contentUrl: lessonData.contentUrl || '',
            audioUrl: lessonData.audioUrl || ''
          });

          // Fetch the status of the course this lesson belongs to
          const parentCourse = coursesData.find(c => c.id === lessonData.courseId);
          if (parentCourse) {
            setTargetCourseStatus(parentCourse.status);
          }
        } else if (queryCourseId) {
          // Create mode: preselect courseId from query parameter
          reset({
            courseId: queryCourseId,
            title: '',
            order: 1,
            durationMinutes: 30,
            contentUrl: '',
            audioUrl: ''
          });
        }
      } catch (error) {
        toast.error('Không thể tải dữ liệu giáo trình.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, teacherId, reset]);

  // Track parent course status changes dynamically in create mode or when switching courses
  useEffect(() => {
    if (selectedCourseId && courses.length > 0) {
      const match = courses.find(c => c.id === selectedCourseId);
      if (match) {
        setTargetCourseStatus(match.status);
      }
    } else {
      setTargetCourseStatus('');
    }
  }, [selectedCourseId, courses]);

  const onSubmit = async (data) => {
    // EARS[Unwanted]: Chặn chỉnh sửa nếu khóa học đang pending
    if (targetCourseStatus === 'pending') {
      toast.error('Khóa học đang chờ duyệt. Không thể thêm/sửa bài học.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...data,
        teacherId
      };

      const matchedCourse = courses.find(c => c.id === data.courseId);

      if (id) {
        // Edit mode
        await teacherLessonService.updateLesson(id, payload);

        // EARS[Event-driven]: KHI Teacher chỉnh sửa bài học của khóa học đã duyệt (approved), hệ thống tự động đổi status khóa học thành "pending"
        if (matchedCourse && matchedCourse.status === 'approved') {
          await teacherCourseService.updateCourse(matchedCourse.id, { status: 'pending' });
          await auditLogService.logAction(
            'REVERT_COURSE_STATUS',
            { courseId: matchedCourse.id, reason: `Lesson ${id} edited in approved course` },
            teacherId
          );
        }

        // Log audit action
        await auditLogService.logAction(
          'UPDATE_LESSON',
          { lessonId: id, title: data.title, courseId: data.courseId },
          teacherId
        );

        if (matchedCourse && matchedCourse.status === 'approved') {
          toast.success('Cập nhật thành công. Khóa học được chuyển sang chờ duyệt lại!');
        } else {
          toast.success('Cập nhật bài học thành công!');
        }
      } else {
        // Create mode
        const newLesson = await teacherLessonService.createLesson(payload);

        // EARS[Event-driven]: KHI Teacher thêm bài học vào khóa học đã duyệt (approved), hệ thống tự động đổi status khóa học thành "pending"
        if (matchedCourse && matchedCourse.status === 'approved') {
          await teacherCourseService.updateCourse(matchedCourse.id, { status: 'pending' });
          await auditLogService.logAction(
            'REVERT_COURSE_STATUS',
            { courseId: matchedCourse.id, reason: 'New lesson added to approved course' },
            teacherId
          );
        }

        // Log audit action
        await auditLogService.logAction(
          'CREATE_LESSON',
          { lessonId: newLesson.id, title: data.title, courseId: data.courseId },
          teacherId
        );

        if (matchedCourse && matchedCourse.status === 'approved') {
          toast.success('Thêm thành công. Khóa học được chuyển sang chờ duyệt lại!');
        } else {
          toast.success('Thêm bài học mới thành công!');
        }
      }

      navigate('/teacher/lessons');
    } catch (error) {
      toast.error('Lưu bài học thất bại. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="tp-loading">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} />
        <p className="mt-3 fw-semibold text-secondary">Đang tải giáo trình bài học...</p>
      </div>
    );
  }

  // EARS[Unwanted]: NẾU Giáo viên cố tình truy cập chỉnh sửa ID bài học của người khác, chuyển hướng hoặc hiển thị Alert
  if (isUnauthorized) {
    return (
      <div className="tp-main-content">
        <div className="tp-error">
          <i className="bi bi-shield-slash fs-2 mb-2 d-block text-danger"></i>
          <div>Bạn không có quyền chỉnh sửa bài học này.</div>
          <Link to="/teacher/lessons" className="btn btn-danger mt-3 rounded-pill px-4">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const isPending = targetCourseStatus === 'pending';

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-play-btn-fill"></i> {id ? 'Cập nhật' : 'Bài học mới'}</div>
            <h1 className="tp-page-title">{id ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}</h1>
            <p className="tp-page-sub">Nhập tiêu đề, số thứ tự phân chia giáo trình bài học.</p>
          </div>
          <Link to="/teacher/lessons" className="tp-btn-secondary" style={{ alignSelf: 'flex-end' }}>
            <i className="bi bi-arrow-left"></i> Quay lại
          </Link>
        </div>
      </div>

      <div className="tp-main-content">
        <Container className="py-2" style={{ maxWidth: '800px' }}>
          {isPending && (
            <div className="tp-error mb-4 border border-warning bg-warning bg-opacity-10 text-dark">
              <i className="bi bi-exclamation-triangle-fill text-warning fs-4"></i>
              <div>
                <h5 className="fw-bold mb-1">Khóa học này đang chờ phê duyệt</h5>
                <p className="mb-0 small">Khóa học của bài giảng đang trong trạng thái xem xét duyệt. Không được phép thêm mới hoặc chỉnh sửa bài học.</p>
              </div>
            </div>
          )}

          {targetCourseStatus === 'approved' && (
            <div className="tp-error mb-4 border border-info bg-info bg-opacity-10 text-dark">
              <i className="bi bi-info-circle-fill text-info fs-4"></i>
              <div>
                <h5 className="fw-bold mb-1">Khóa học liên kết đã được xuất bản</h5>
                <p className="mb-0 small">Mọi chỉnh sửa hoặc bổ sung bài học mới sẽ tự động đưa khóa học liên kết trở lại trạng thái <strong>Chờ duyệt (Pending)</strong>.</p>
              </div>
            </div>
          )}

          <div className="tp-card-static">
            <div className="p-4 p-md-5">

        <Form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Row className="g-3">
            {/* Course Selector */}
            <Col xs={12}>
              <Form.Group controlId="courseId">
                <Form.Label className="fw-semibold text-secondary">Lựa chọn khóa học <span className="text-danger">*</span></Form.Label>
                <Form.Select 
                  isInvalid={!!errors.courseId}
                  {...register('courseId')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting || isPending || !!id} // Disable selection in edit mode to prevent changing parent course
                >
                  <option value="">-- Chọn khóa học giảng dạy --</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title} ({course.status})</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.courseId?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Title */}
            <Col xs={12}>
              <Form.Group controlId="title">
                <Form.Label className="fw-semibold text-secondary">Tiêu đề bài giảng <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Ví dụ: Reading Lesson 1: Skimming for Main Ideas" 
                  isInvalid={!!errors.title}
                  {...register('title')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting || isPending}
                />
                <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Order & Duration */}
            <Col md={6}>
              <Form.Group controlId="order">
                <Form.Label className="fw-semibold text-secondary">Số thứ tự bài giảng <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="number" 
                  isInvalid={!!errors.order}
                  {...register('order')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting || isPending}
                />
                <Form.Control.Feedback type="invalid">{errors.order?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="durationMinutes">
                <Form.Label className="fw-semibold text-secondary">Thời lượng học (Phút) <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="number" 
                  isInvalid={!!errors.durationMinutes}
                  {...register('durationMinutes')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting || isPending}
                />
                <Form.Control.Feedback type="invalid">{errors.durationMinutes?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Content URL */}
            <Col xs={12}>
              <Form.Group controlId="contentUrl">
                <Form.Label className="fw-semibold text-secondary">Đường dẫn nội dung bài học <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Ví dụ: https://docs.google.com/document/d/... hoặc link video" 
                  isInvalid={!!errors.contentUrl}
                  {...register('contentUrl')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting || isPending}
                />
                <Form.Control.Feedback type="invalid">{errors.contentUrl?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Mock Audio (Listening) */}
            <Col xs={12}>
              <Form.Group controlId="audioUrl">
                <Form.Label className="fw-semibold text-secondary">Đường dẫn tệp âm thanh (Dành cho bài nghe IELTS Listening)</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="https://example.com/audio.mp3" 
                  isInvalid={!!errors.audioUrl}
                  {...register('audioUrl')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting || isPending}
                />
                <Form.Control.Feedback type="invalid">{errors.audioUrl?.message}</Form.Control.Feedback>
                <Form.Text className="text-muted small">Cung cấp đường dẫn tệp âm thanh định dạng .mp3 cho các bài tập hoặc bài học Listening.</Form.Text>
              </Form.Group>
            </Col>

            {/* Live Preview Section */}
            {(contentUrlValue || audioUrlValue) && (
              <Col xs={12} className="mt-4">
                <Card className="border border-light-subtle rounded-3 bg-light p-3">
                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-play-btn-fill text-primary"></i> Xem trước bài giảng (Live Preview)
                  </h6>
                  
                  {contentUrlValue && (
                    <div className="mb-3">
                      <span className="d-block text-secondary small fw-semibold mb-2">Nội dung bài học:</span>
                      {getYouTubeId(contentUrlValue) ? (
                        <div className="ratio ratio-16x9 rounded overflow-hidden shadow-sm">
                          <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeId(contentUrlValue)}`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : (
                        <div className="p-3 bg-white border rounded text-secondary d-flex align-items-center gap-2">
                          <i className="bi bi-link-45deg fs-4 text-primary"></i>
                          <div className="overflow-hidden">
                            <div className="small fw-semibold text-truncate" style={{ maxWidth: '100%' }}>{contentUrlValue}</div>
                            <a href={contentUrlValue} target="_blank" rel="noopener noreferrer" className="small text-decoration-none d-inline-flex align-items-center gap-1 mt-1">
                              Mở liên kết mới <i className="bi bi-box-arrow-up-right"></i>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {audioUrlValue && (
                    <div>
                      <span className="d-block text-secondary small fw-semibold mb-2">Tệp âm thanh listening:</span>
                      <div className="p-3 bg-white border rounded d-flex flex-column gap-2 shadow-sm">
                        <div className="d-flex align-items-center gap-2 text-success">
                          <i className="bi bi-music-note-beamed fs-4"></i>
                          <span className="small fw-semibold text-truncate" style={{ maxWidth: '100%' }}>{audioUrlValue}</span>
                        </div>
                        <audio src={audioUrlValue} controls className="w-100 mt-2" />
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
            )}
          </Row>

          {/* Form Actions */}
          <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top border-light">
            <Button 
              as={Link} 
              to="/teacher/lessons" 
              variant="outline-secondary" 
              className="px-4 py-2 rounded-pill fw-semibold shadow-none border-gray text-secondary"
              disabled={submitting}
            >
              Hủy bỏ
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              className="px-4 py-2 rounded-pill fw-semibold d-flex align-items-center gap-2"
              disabled={submitting || isPending}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" animation="border" /> Đang lưu...
                </>
              ) : (
                <>Lưu bài học</>
              )}
            </Button>
          </div>
        </Form>
          </div>
        </div>
      </Container></div></div>
  );
}
