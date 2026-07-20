import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../services/authService';
import { teacherLibraryService } from '../../services/teacherLibraryService';
import api from '../../services/api'; // direct api access if teacherLibraryService doesn't have getResourceById

export default function LibraryResourceEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const teacherId = currentUser?.id || 'u-teacher-001';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  
  const [originalResource, setOriginalResource] = useState(null);

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

  useEffect(() => {
    const fetchResource = async () => {
      try {
        // Find the resource
        const res = await api.get(`/library_resources/${id}`);
        const data = res.data;
        
        setOriginalResource(data);
        
        // Populate form
        setFormData({
          title: data.title || '',
          description: data.description || '',
          resourceType: data.resourceType || 'pdf',
          skill: data.skill || 'Reading',
          level: data.level || 'Intermediate',
          externalUrl: data.externalUrl || data.url || '',
          tags: data.tags || '',
          visibility: data.visibility || 'public',
        });
      } catch (err) {
        toast.error('Không tìm thấy tài nguyên này!');
        navigate('/teacher/library');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResource();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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

    // Must provide either old file, new file, or external URL
    const hasOldFile = originalResource && (originalResource.fileUrl || originalResource.url);
    if (!selectedFile && !formData.externalUrl.trim() && !hasOldFile) {
      newErrors.file = 'Please upload a file or provide an external URL';
    }

    if (formData.externalUrl.trim() && !formData.externalUrl.trim().startsWith('http') && !formData.externalUrl.trim().startsWith('/')) {
      newErrors.externalUrl = 'External URL must start with http://, https://, or /';
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
      let finalFileUrl = originalResource.fileUrl;
      let finalFileName = originalResource.fileName;
      let finalFileSize = originalResource.fileSize;

      if (selectedFile) {
        const uploadRes = await teacherLibraryService.uploadFile(selectedFile);
        finalFileUrl = uploadRes.fileUrl;
        finalFileName = selectedFile.name;
        finalFileSize = selectedFile.size;
      }

      const payload = {
        ...originalResource, // preserve original attributes like createdAt, id, teacherId
        title: formData.title.trim(),
        description: formData.description.trim(),
        resourceType: formData.resourceType,
        skill: formData.skill,
        level: formData.level,
        externalUrl: formData.externalUrl.trim(),
        tags: formData.tags.trim(),
        visibility: formData.visibility,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        fileSize: finalFileSize,
      };

      await teacherLibraryService.updateResource(id, payload);

      setSuccessMsg('Cập nhật tài nguyên thành công!');
      toast.success('Cập nhật tài nguyên thành công!');

      setTimeout(() => {
        navigate('/teacher/library');
      }, 1500);
    } catch (error) {
      toast.error('Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="tp-loading">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} />
        <p className="mt-3 fw-semibold text-secondary">Đang tải...</p>
      </div>
    );
  }

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-pencil-square"></i> Cập nhật tài nguyên</div>
            <h1 className="tp-page-title" data-testid="page-title">Chỉnh sửa Tài nguyên</h1>
            <p className="tp-page-sub">Cập nhật thông tin tài nguyên hoặc upload file mới.</p>
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
          <Alert variant="success">{successMsg}</Alert>
        )}

        <Form onSubmit={handleSubmit} noValidate>
          <Row className="g-3">
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
                />
                <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
              </Form.Group>
            </Col>

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
                />
                <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
              </Form.Group>
            </Col>

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
                >
                  <option value="Reading">Reading</option>
                  <option value="Listening">Listening</option>
                  <option value="Writing">Writing</option>
                  <option value="Speaking">Speaking</option>
                  <option value="General">General</option>
                </Form.Select>
              </Form.Group>
            </Col>

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
                >
                  <option value="public">Public - Tất cả học viên</option>
                  <option value="enrolled">Enrolled - Chỉ học viên đăng ký</option>
                  <option value="private">Private - Chỉ giáo viên</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="resourceFile">
                <Form.Label className="fw-semibold text-secondary">
                  Upload File mới (chọn để thay thế file cũ)
                </Form.Label>
                <Form.Control
                  type="file"
                  onChange={handleFileChange}
                  isInvalid={!!errors.file}
                  disabled={submitting}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp3,.mp4,.jpg,.png"
                />
                {originalResource?.fileUrl && !selectedFile && (
                  <Form.Text className="text-success">
                    <i className="bi bi-file-earmark-check"></i> File hiện tại: {originalResource.fileName || 'Đã có file đính kèm'}
                  </Form.Text>
                )}
                <Form.Control.Feedback type="invalid">{errors.file}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="resourceExternalUrl">
                <Form.Label className="fw-semibold text-secondary">
                  External URL
                </Form.Label>
                <Form.Control
                  type="text"
                  name="externalUrl"
                  placeholder="https://example.com/resource"
                  value={formData.externalUrl}
                  onChange={handleChange}
                  isInvalid={!!errors.externalUrl}
                  disabled={submitting}
                />
                <Form.Control.Feedback type="invalid">{errors.externalUrl}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top border-light">
            <Button
              as={Link}
              to="/teacher/library"
              variant="outline-secondary"
              className="px-4 py-2 rounded-pill fw-semibold shadow-none"
              disabled={submitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-4 py-2 rounded-pill fw-semibold d-flex align-items-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <><Spinner size="sm" animation="border" /> Đang cập nhật...</>
              ) : (
                <>Lưu thay đổi</>
              )}
            </Button>
          </div>
        </Form>
          </div>
        </div>
      </Container></div></div>
  );
}
