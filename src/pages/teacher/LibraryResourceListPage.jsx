import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { getCurrentUser } from '../../services/authService';
import { teacherLibraryService } from '../../services/teacherLibraryService';

export default function LibraryResourceListPage() {
  const currentUser = getCurrentUser();
  const teacherId = currentUser?.id;

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await teacherLibraryService.getResources(teacherId);
      setResources(data);
    } catch (err) {
      setError('Không thể tải danh sách tài nguyên.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài nguyên này?')) return;
    try {
      await teacherLibraryService.deleteResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Xóa thất bại.');
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      pdf: 'danger',
      document: 'primary',
      presentation: 'warning',
      audio: 'info',
      video: 'success',
      image: 'secondary',
      link: 'dark',
    };
    return <Badge bg={colors[type] || 'secondary'}>{type.toUpperCase()}</Badge>;
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
            <div className="tp-page-badge"><i className="bi bi-journal-album"></i> Thư viện</div>
            <h1 className="tp-page-title" data-testid="library-page-title">Thư viện Tài nguyên</h1>
            <p className="tp-page-sub">Quản lý các tài nguyên học tập đã tạo.</p>
          </div>
          <Link to="/teacher/library/create" className="tp-btn-primary" data-testid="btn-create-resource" style={{ alignSelf: 'flex-end' }}>
            <i className="bi bi-plus-circle-fill"></i> Tạo tài nguyên mới
          </Link>
        </div>
      </div>

      <div className="tp-main-content">
      <Container fluid="xxl" className="px-4">
      {error && <div className="tp-error mb-4"><i className="bi bi-exclamation-triangle-fill text-danger fs-4"></i><div className="text-secondary">{error}</div></div>}

      {resources.length === 0 ? (
        <div className="tp-card-static">
          <div className="tp-empty">
            <div className="tp-empty-icon"><i className="bi bi-folder2-open"></i></div>
            <div className="tp-empty-title" data-testid="empty-state">Chưa có tài nguyên nào.</div>
            <p className="tp-empty-sub">Hãy tạo tài nguyên đầu tiên để thêm vào thư viện.</p>
            <Link to="/teacher/library/create" className="btn btn-primary rounded-pill px-4 mt-3 fw-semibold">
              <i className="bi bi-plus-lg me-2"></i> Tạo tài nguyên
            </Link>
          </div>
        </div>
      ) : (
        <div className="tp-table-wrapper">
          <table className="tp-table" data-testid="resource-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th>Tiêu đề</th>
                <th>Loại</th>
                <th>Kỹ năng</th>
                <th>Trình độ</th>
                <th>Hiển thị</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource, idx) => (
                <tr key={resource.id} data-testid={`resource-row-${resource.id}`}>
                  <td>{idx + 1}</td>
                  <td className="fw-semibold" data-testid={`resource-title-${resource.id}`}>
                    {resource.title}
                  </td>
                  <td>{getTypeBadge(resource.resourceType)}</td>
                  <td>{resource.skill}</td>
                  <td>{resource.level}</td>
                  <td>
                    <Badge bg={resource.visibility === 'public' ? 'success' : 'secondary'}>
                      {resource.visibility}
                    </Badge>
                  </td>
                  <td>{new Date(resource.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="d-flex justify-content-end gap-2">
                      <Link to={`/teacher/library/edit/${resource.id}`} className="tp-action-btn tp-action-btn-view" data-testid={`btn-edit-${resource.id}`} title="Sửa">
                        <i className="bi bi-pencil-square"></i>
                      </Link>
                      <button className="tp-action-btn tp-action-btn-danger" onClick={() => handleDelete(resource.id)} data-testid={`btn-delete-${resource.id}`} title="Xóa">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </Container></div></div>
  );
}
