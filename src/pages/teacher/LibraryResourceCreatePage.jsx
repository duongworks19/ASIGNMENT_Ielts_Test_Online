import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../services/authService';
import { teacherLibraryService } from '../../services/teacherLibraryService';

// Allowed file types and max file size
const ALLOWED_FILE_TYPES = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.mp3', '.mp4', '.jpg', '.png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function LibraryResourceCreatePage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const teacherId = currentUser?.id;

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resourceType: 'pdf',
    skill: 'Reading',
    level: 'Intermediate',
    externalUrl: '',
    tags: '',
    visibility: 'public',
  });

  const [selectedFile, setSelectedFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // INTENTIONALLY REMOVED VALIDATION FOR TESTING BUG DETECTION
      /* 
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_FILE_TYPES.includes(ext)) {
        setErrors(prev => ({
          ...prev,
          file: `File type "${ext}" is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
        }));
        setSelectedFile(null);
        e.target.value = '';
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setErrors(prev => ({
          ...prev,
          file: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (10MB)`
        }));
        setSelectedFile(null);
        e.target.value = '';
        return;
      }
      */

      setSelectedFile(file);
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // Must provide either file or external URL
    if (!selectedFile && !formData.externalUrl.trim()) {
      newErrors.file = 'Please upload a file or provide an external URL';
    }

    if (formData.externalUrl.trim() && !formData.externalUrl.trim().startsWith('http')) {
      newErrors.externalUrl = 'External URL must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      let finalFileUrl = '';
      let finalFileName = '';
      let finalFileSize = 0;

      if (selectedFile) {
        // Upload file to backend
        const uploadRes = await teacherLibraryService.uploadFile(selectedFile);
        finalFileUrl = uploadRes.fileUrl;
        finalFileName = selectedFile.name;
        finalFileSize = selectedFile.size;
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        resourceType: formData.resourceType,
        skill: formData.skill,
        level: formData.level,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        fileSize: finalFileSize,
        externalUrl: formData.externalUrl.trim(),
        thumbnailUrl: '',
        tags: formData.tags.trim(),
        visibility: formData.visibility,
        teacherId: teacherId,
        status: 'published',
        downloadCount: 0,
        createdAt: new Date().toISOString(),
      };

      await teacherLibraryService.createResource(payload);

      setSuccessMsg('Resource created successfully!');
      toast.success('Tạo tài nguyên thành công!');

      // Reset form
      setFormData({
        title: '',
        description: '',
        resourceType: 'pdf',
        skill: 'Reading',
        level: 'Intermediate',
        externalUrl: '',
        tags: '',
        visibility: 'public',
      });
      setSelectedFile(null);

      // Navigate back after short delay
      setTimeout(() => {
        navigate('/teacher/library');
      }, 1500);
    } catch (error) {
      toast.error('Tạo tài nguyên thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-cloud-arrow-up-fill"></i> Upload tài nguyên</div>
            <h1 className="tp-page-title" data-testid="page-title">Tạo Tài nguyên Học tập</h1>
            <p className="tp-page-sub">Upload file hoặc nhập URL tài nguyên để chia sẻ với học viên.</p>
          </div>
          <Link to="/teacher/library" className="tp-btn-secondary" style={{ alignSelf: 'flex-end' }}>
            <i className="bi bi-arrow-left"></i> Quay lại thư viện
          </Link>
        </div>
      </div>

      <div className="tp-main-content">
        <Container className="py-2" style={{ maxWidth: '850px' }}>
          <div className="tp-card-static">
            <div className="p-4 p-md-5">

        {successMsg && (
          <Alert variant="success" data-testid="success-message">
            {successMsg}
          </Alert>
        )}

        <Form onSubmit={handleSubmit} noValidate data-testid="resource-form">
          <Row className="g-3">
            {/* Title */}
            <Col xs={12}>
              <Form.Group controlId="resourceTitle">
                <Form.Label className="fw-semibold text-secondary">
                  Tiêu đề tài nguyên <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  placeholder="Ví dụ: IELTS Reading Band 7+ Tips..."
                  value={formData.title}
                  onChange={handleChange}
                  isInvalid={!!errors.title}
                  disabled={submitting}
                  data-testid="input-title"
                />
                <Form.Control.Feedback type="invalid" data-testid="error-title">
                  {errors.title}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Description */}
            <Col xs={12}>
              <Form.Group controlId="resourceDescription">
                <Form.Label className="fw-semibold text-secondary">
                  Mô tả <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  placeholder="Mô tả nội dung tài nguyên..."
                  value={formData.description}
                  onChange={handleChange}
                  isInvalid={!!errors.description}
                  disabled={submitting}
                  data-testid="input-description"
                />
                <Form.Control.Feedback type="invalid" data-testid="error-description">
                  {errors.description}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Resource Type & Skill */}
            <Col md={6}>
              <Form.Group controlId="resourceType">
                <Form.Label className="fw-semibold text-secondary">
                  Loại tài nguyên <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="resourceType"
                  value={formData.resourceType}
                  onChange={handleChange}
                  disabled={submitting}
                  data-testid="select-resourceType"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="document">Word Document</option>
                  <option value="presentation">Presentation</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                  <option value="link">External Link</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="resourceSkill">
                <Form.Label className="fw-semibold text-secondary">
                  Kỹ năng <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="skill"
                  value={formData.skill}
                  onChange={handleChange}
                  disabled={submitting}
                  data-testid="select-skill"
                >
                  <option value="Reading">Reading</option>
                  <option value="Listening">Listening</option>
                  <option value="Writing">Writing</option>
                  <option value="Speaking">Speaking</option>
                  <option value="General">General</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Level & Visibility */}
            <Col md={6}>
              <Form.Group controlId="resourceLevel">
                <Form.Label className="fw-semibold text-secondary">
                  Trình độ <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  disabled={submitting}
                  data-testid="select-level"
                >
                  <option value="Beginner">Beginner (3.0 - 4.5)</option>
                  <option value="Intermediate">Intermediate (5.0 - 6.5)</option>
                  <option value="Advanced">Advanced (7.0+)</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="resourceVisibility">
                <Form.Label className="fw-semibold text-secondary">
                  Hiển thị
                </Form.Label>
                <Form.Select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                  disabled={submitting}
                  data-testid="select-visibility"
                >
                  <option value="public">Public - Tất cả học viên</option>
                  <option value="enrolled">Enrolled - Chỉ học viên đăng ký</option>
                  <option value="private">Private - Chỉ giáo viên</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* File Upload */}
            <Col xs={12}>
              <Form.Group controlId="resourceFile">
                <Form.Label className="fw-semibold text-secondary">
                  Upload File
                </Form.Label>
                <Form.Control
                  type="file"
                  onChange={handleFileChange}
                  isInvalid={!!errors.file}
                  disabled={submitting}
                  data-testid="input-file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp3,.mp4,.jpg,.png"
                />
                <Form.Control.Feedback type="invalid" data-testid="error-file">
                  {errors.file}
                </Form.Control.Feedback>
                <Form.Text className="text-muted small">
                  Allowed: PDF, DOC, DOCX, PPT, PPTX, MP3, MP4, JPG, PNG. Max 10MB.
                </Form.Text>
              </Form.Group>
            </Col>

            {/* External URL */}
            <Col xs={12}>
              <Form.Group controlId="resourceExternalUrl">
                <Form.Label className="fw-semibold text-secondary">
                  External URL (nếu không upload file)
                </Form.Label>
                <Form.Control
                  type="text"
                  name="externalUrl"
                  placeholder="https://example.com/resource"
                  value={formData.externalUrl}
                  onChange={handleChange}
                  isInvalid={!!errors.externalUrl}
                  disabled={submitting}
                  data-testid="input-externalUrl"
                />
                <Form.Control.Feedback type="invalid" data-testid="error-externalUrl">
                  {errors.externalUrl}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Tags */}
            <Col xs={12}>
              <Form.Group controlId="resourceTags">
                <Form.Label className="fw-semibold text-secondary">
                  Tags (phân cách bằng dấu phẩy)
                </Form.Label>
                <Form.Control
                  type="text"
                  name="tags"
                  placeholder="reading, tips, band7"
                  value={formData.tags}
                  onChange={handleChange}
                  disabled={submitting}
                  data-testid="input-tags"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Form Actions */}
          <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top border-light">
            <Button
              as={Link}
              to="/teacher/library"
              variant="outline-secondary"
              className="px-4 py-2 rounded-pill fw-semibold shadow-none"
              disabled={submitting}
              data-testid="btn-cancel"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-4 py-2 rounded-pill fw-semibold d-flex align-items-center gap-2"
              disabled={submitting}
              data-testid="btn-submit"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" animation="border" /> Đang tạo...
                </>
              ) : (
                <>Tạo Tài nguyên</>
              )}
            </Button>
          </div>
        </Form>
          </div>
        </div>
      </Container></div></div>
  );
}
