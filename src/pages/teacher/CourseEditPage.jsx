import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Container, Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../services/authService';
import { teacherCourseService } from '../../services/teacherCourseService';
import { auditLogService } from '../../services/auditLogService';

const courseSchema = z.object({
  title: z.string().min(5, 'Tiêu đề phải có ít nhất 5 ký tự'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  skill: z.enum(['Listening', 'Reading', 'Writing', 'Speaking'], {
    errorMap: () => ({ message: 'Vui lòng chọn kỹ năng' }),
  }),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced'], {
    errorMap: () => ({ message: 'Vui lòng chọn trình độ' }),
  }),
  price: z.coerce.number().min(0, 'Giá không được nhỏ hơn 0'),
  durationWeeks: z.coerce.number().int('Thời lượng phải là số nguyên').min(1, 'Thời lượng phải ít nhất 1 tuần'),
  thumbnail: z.string().optional().refine(val => !val || val.startsWith('http'), {
    message: 'Ảnh thumbnail phải là link URL hợp lệ (bắt đầu bằng http)'
  })
});

export default function CourseEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [course, setCourse] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const currentUser = getCurrentUser();
  const teacherId = currentUser?.id;

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      skill: 'Reading',
      level: 'Beginner',
      price: 0,
      durationWeeks: 4,
      thumbnail: ''
    }
  });

  const priceValue = watch('price');

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      try {
        const data = await teacherCourseService.getCourseById(id);
        
        // EARS[Ubiquitous]: Giao diện quản lý PHẢI chỉ hiển thị và cho phép chỉnh sửa nội dung do chính Teacher đó tạo ra
        if (data.teacherId !== teacherId) {
          setIsUnauthorized(true);
          setLoading(false);
          return;
        }

        setCourse(data);
        reset({
          title: data.title,
          description: data.description,
          skill: data.skill,
          level: data.level,
          price: data.price,
          durationWeeks: data.durationWeeks,
          thumbnail: data.thumbnail || ''
        });
      } catch (error) {
        toast.error('Không thể lấy thông tin khóa học.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadCourse();
    }
  }, [id, teacherId, reset]);

  const onSubmit = async (data) => {
    if (!course) return;
    
    // EARS[Unwanted]: Chặn chỉnh sửa nếu khóa học đang ở trạng thái pending
    if (course.status === 'pending') {
      toast.error('Không thể sửa khóa học đang chờ phê duyệt.');
      return;
    }

    setSubmitting(true);
    try {
      // EARS[Event-driven]: KHI Teacher thực hiện chỉnh sửa một khóa học đã được duyệt (approved), hệ thống PHẢI chuyển trạng thái khóa học về lại "pending"
      let newStatus = course.status;
      if (course.status === 'approved') {
        newStatus = 'pending';
      }

      const payload = {
        ...data,
        status: newStatus,
        isPremium: data.price > 0
      };

      await teacherCourseService.updateCourse(id, payload);

      // Log audit action
      await auditLogService.logAction(
        'UPDATE_COURSE',
        { courseId: id, changes: payload },
        teacherId
      );

      if (course.status === 'approved') {
        toast.success('Cập nhật thành công. Khóa học được chuyển sang chờ duyệt lại!');
      } else {
        toast.success('Cập nhật khóa học thành công!');
      }
      navigate('/teacher/courses');
    } catch (error) {
      toast.error('Cập nhật khóa học thất bại. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="tp-loading">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} />
        <p className="mt-3 fw-semibold text-secondary">Đang tải thông tin khóa học...</p>
      </div>
    );
  }

  // EARS[Unwanted]: NẾU Giáo viên cố tình truy cập chỉnh sửa ID khóa học của người khác, chuyển hướng hoặc hiển thị Alert
  if (isUnauthorized) {
    return (
      <div className="tp-main-content">
        <div className="tp-error">
          <i className="bi bi-shield-slash fs-2 mb-2 d-block text-danger"></i>
          <div>Bạn không có quyền chỉnh sửa khóa học này.</div>
          <Link to="/teacher/courses" className="btn btn-danger mt-3 rounded-pill px-4">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const isPending = course?.status === 'pending';

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-pencil-square"></i> Cập nhật</div>
            <h1 className="tp-page-title">Chỉnh sửa khóa học</h1>
            <p className="tp-page-sub">Cập nhật và hoàn thiện nội dung cho khóa học IELTS của bạn.</p>
          </div>
          <Link to="/teacher/courses" className="tp-btn-secondary" style={{ alignSelf: 'flex-end' }}>
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
                <h5 className="fw-bold mb-1">Khóa học đang chờ phê duyệt</h5>
                <p className="mb-0 small">Nội dung khóa học đang được quản trị viên xem xét. Tất cả các thao tác chỉnh sửa hiện bị tạm khóa.</p>
              </div>
            </div>
          )}

          {course?.status === 'approved' && (
            <div className="tp-error mb-4 border border-info bg-info bg-opacity-10 text-dark">
              <i className="bi bi-info-circle-fill text-info fs-4"></i>
              <div>
                <h5 className="fw-bold mb-1">Khóa học đã xuất bản</h5>
                <p className="mb-0 small">Mọi thay đổi trên khóa học này sẽ tự động thu hồi và đưa về trạng thái <strong>Chờ duyệt (Pending)</strong> để phê duyệt lại.</p>
              </div>
            </div>
          )}

          <div className="tp-card-static">
            <div className="p-4 p-md-5">
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <h2 className="fw-bold text-dark mb-0">Cập nhật thông tin</h2>
            <span className={`badge rounded-pill text-uppercase px-3 py-1.5 ${
              course?.status === 'approved' ? 'bg-success-subtle text-success' :
              course?.status === 'pending' ? 'bg-warning-subtle text-warning' :
              course?.status === 'rejected' ? 'bg-danger-subtle text-danger' :
              'bg-secondary-subtle text-secondary'
            }`}>
              {course?.status}
            </span>
          </div>
        </div>

        <Form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Row className="g-3">
            {/* Title */}
            <Col xs={12}>
              <Form.Group controlId="title">
                <Form.Label className="fw-semibold text-secondary">Tiêu đề khóa học <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Ví dụ: IELTS Reading Complete Guide..." 
                  isInvalid={!!errors.title}
                  {...register('title')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting || isPending}
                />
                <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Description */}
            <Col xs={12}>
              <Form.Group controlId="description">
                <Form.Label className="fw-semibold text-secondary">Mô tả khóa học <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={4}
                  placeholder="Mô tả tóm tắt nội dung..." 
                  isInvalid={!!errors.description}
                  {...register('description')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting || isPending}
                />
                <Form.Control.Feedback type="invalid">{errors.description?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Skill & Level */}
            <Col md={6}>
              <Form.Group controlId="skill">
                <Form.Label className="fw-semibold text-secondary">Kỹ năng chuyên môn <span className="text-danger">*</span></Form.Label>
                <Form.Select 
                  isInvalid={!!errors.skill}
                  {...register('skill')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting || isPending}
                >
                  <option value="Listening">Listening</option>
                  <option value="Reading">Reading</option>
                  <option value="Writing">Writing</option>
                  <option value="Speaking">Speaking</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.skill?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="level">
                <Form.Label className="fw-semibold text-secondary">Trình độ khóa học <span className="text-danger">*</span></Form.Label>
                <Form.Select 
                  isInvalid={!!errors.level}
                  {...register('level')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting || isPending}
                >
                  <option value="Beginner">Beginner (3.0 - 4.5)</option>
                  <option value="Intermediate">Intermediate (5.0 - 6.5)</option>
                  <option value="Advanced">Advanced (7.0+)</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.level?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Duration & Price */}
            <Col md={6}>
              <Form.Group controlId="durationWeeks">
                <Form.Label className="fw-semibold text-secondary">Thời lượng (Tuần) <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="number" 
                  isInvalid={!!errors.durationWeeks}
                  {...register('durationWeeks')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting || isPending}
                />
                <Form.Control.Feedback type="invalid">{errors.durationWeeks?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="price">
                <Form.Label className="fw-semibold text-secondary">Giá học phí (VND) <span className="text-danger">*</span></Form.Label>
                <div className="position-relative">
                  <Form.Control 
                    type="number" 
                    placeholder="0"
                    isInvalid={!!errors.price}
                    {...register('price')}
                    className="py-2.5 px-3 border-gray"
                    disabled={submitting || isPending}
                  />
                  {Number(priceValue) > 0 && (
                    <span 
                      className="position-absolute badge rounded-pill bg-primary text-white" 
                      style={{ right: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px' }}
                    >
                      Premium
                    </span>
                  )}
                  {Number(priceValue) === 0 && (
                    <span 
                      className="position-absolute badge rounded-pill bg-success text-white" 
                      style={{ right: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px' }}
                    >
                      Miễn phí
                    </span>
                  )}
                  <Form.Control.Feedback type="invalid">{errors.price?.message}</Form.Control.Feedback>
                </div>
              </Form.Group>
            </Col>

            {/* Thumbnail URL */}
            <Col xs={12}>
              <Form.Group controlId="thumbnail">
                <Form.Label className="fw-semibold text-secondary">Đường dẫn ảnh Thumbnail (Tùy chọn)</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="https://example.com/image.jpg" 
                  isInvalid={!!errors.thumbnail}
                  {...register('thumbnail')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting || isPending}
                />
                <Form.Control.Feedback type="invalid">{errors.thumbnail?.message}</Form.Control.Feedback>
                <Form.Text className="text-muted small">Cung cấp đường dẫn URL ảnh để minh họa cho khóa học trên Dashboard.</Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* Form Actions */}
          <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top border-light">
            <Button 
              as={Link} 
              to="/teacher/courses" 
              variant="outline-secondary" 
              className="px-4 py-2 rounded-pill fw-semibold shadow-none border-gray text-secondary"
              disabled={submitting}
            >
              Quay lại
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              className="px-4 py-2 rounded-pill fw-semibold d-flex align-items-center gap-2"
              disabled={submitting || isPending}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" animation="border" /> Đang cập nhật...
                </>
              ) : (
                <>Cập nhật khóa học</>
              )}
            </Button>
          </div>
        </Form>
          </div>
        </div>
      </Container></div></div>
  );
}
