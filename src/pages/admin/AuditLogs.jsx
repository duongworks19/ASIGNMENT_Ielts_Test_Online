import React, { useState, useEffect, useCallback } from 'react';
import { Table, Spinner, Alert, Container, Form, Row, Col, Pagination, Card, Button } from 'react-bootstrap';
import { getAuditLogs } from '../../services/adminService';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [filterAction, setFilterAction] = useState('all');
  const [filterTargetType, setFilterTargetType] = useState('all');
  const [filterActorId, setFilterActorId] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAuditLogs();
      const data = response?.data || response;
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      setError('Failed to load audit logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterActionChange = (e) => {
    setFilterAction(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterTargetChange = (e) => {
    setFilterTargetType(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterActorChange = (e) => {
    setFilterActorId(e.target.value);
    setCurrentPage(1);
  };

  const filteredLogs = logs.filter(log => {
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesTarget = filterTargetType === 'all' || log.targetType === filterTargetType;
    const matchesActor = !filterActorId || log.actorId?.toLowerCase().includes(filterActorId.toLowerCase().trim());
    return matchesAction && matchesTarget && matchesActor;
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedLogs.slice(indexOfFirstItem, indexOfLastItem);

  const getActionBadge = (action) => {
    switch (action) {
      case 'CHANGE_USER_ROLE':
        return <span className="tp-badge badge-info px-3">Role Change</span>;
      case 'CREATE_USER':
        return <span className="tp-badge badge-success px-3">User Created</span>;
      case 'UPDATE_USER':
        return <span className="tp-badge badge-info px-3">User Updated</span>;
      case 'UNLOCK_USER':
        return <span className="tp-badge badge-success px-3">User Unlocked</span>;
      case 'CHANGE_USER_STATUS':
        return <span className="tp-badge badge-warning px-3">Status Change</span>;
      case 'DELETE_USER':
        return <span className="tp-badge badge-danger px-3">User Deleted</span>;
      case 'APPROVE_CONTENT':
        return <span className="tp-badge badge-success px-3">Approve</span>;
      case 'REJECT_CONTENT':
        return <span className="tp-badge badge-secondary px-3">Reject</span>;
      default:
        return <span className="tp-badge badge-secondary px-3">{action}</span>;
    }
  };

  const getTargetBadge = (targetType) => {
    const tpClass = targetType === 'course' ? 'badge-primary' :
      targetType === 'user' ? 'badge-secondary' :
        targetType === 'lesson' ? 'badge-info' : 'badge-warning';
    return (
      <span className={`tp-badge ${tpClass} px-3 text-capitalize`}>
        {targetType}
      </span>
    );
  };

  const renderLogDetails = (log) => {
    const { action, oldValue, newValue, targetId } = log;
    switch (action) {
      case 'CHANGE_USER_ROLE':
        return `Changed role of user ${targetId} from "${oldValue?.role || 'N/A'}" to "${newValue?.role || 'N/A'}"`;
      case 'CREATE_USER':
        return `Created user ${targetId}`;
      case 'UPDATE_USER':
        return `Updated user ${targetId}`;
      case 'UNLOCK_USER':
        return `Unlocked user ${targetId}`;
      case 'CHANGE_USER_STATUS':
        return `Changed status of user ${targetId} from "${oldValue?.status || 'N/A'}" to "${newValue?.status || 'N/A'}"`;
      case 'DELETE_USER':
        return `Deleted user ${targetId}`;
      case 'APPROVE_CONTENT':
        return `Approved content with ID ${targetId}`;
      case 'REJECT_CONTENT':
        return `Rejected content with ID ${targetId}`;
      default:
        return `Target: ${targetId}`;
    }
  };

  return (
    <div style={{ background: 'var(--tp-page-bg)', minHeight: '100vh', paddingBottom: '40px' }}>
      <div className="tp-page-header" style={{ margin: '-24px -24px 24px', padding: '40px 32px' }}>
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-clock-history"></i> Kiểm duyệt & Lịch sử</div>
            <h1 className="tp-page-title mt-2">Audit Logs</h1>
            <p className="tp-page-sub mt-2 opacity-75">Xem lịch sử các thao tác thay đổi dữ liệu trong hệ thống toàn diện.</p>
          </div>
        </div>
      </div>

      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4">
          {/* Lọc Logs */}
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Body className="p-4">
              <Row className="g-3">
                <Col xs={12} md={4}>
                  <Form.Select value={filterAction} onChange={handleFilterActionChange} className="bg-light border-0 rounded-3 py-2 text-muted fw-medium">
                    <option value="all">Tất cả hành động</option>
                    <option value="CHANGE_USER_ROLE">Change Role</option>
                    <option value="CREATE_USER">Create User</option>
                    <option value="UPDATE_USER">Update User</option>
                    <option value="UNLOCK_USER">Unlock User</option>
                    <option value="CHANGE_USER_STATUS">Change Status</option>
                    <option value="DELETE_USER">Delete User</option>
                    <option value="APPROVE_CONTENT">Approve Content</option>
                    <option value="REJECT_CONTENT">Reject Content</option>
                  </Form.Select>
                </Col>
                <Col xs={12} md={3}>
                  <Form.Select value={filterTargetType} onChange={handleFilterTargetChange} className="bg-light border-0 rounded-3 py-2 text-muted fw-medium">
                    <option value="all">Tất cả đối tượng</option>
                    <option value="user">User</option>
                    <option value="course">Course</option>
                    <option value="lesson">Lesson</option>
                    <option value="test">Test</option>
                  </Form.Select>
                </Col>
                <Col xs={9} md={4}>
                  <div className="position-relative">
                    <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    <Form.Control
                      type="text"
                      placeholder="Tìm theo Actor ID..."
                      value={filterActorId}
                      onChange={handleFilterActorChange}
                      className="ps-5 bg-light border-0 rounded-3 py-2"
                    />
                  </div>
                </Col>
                <Col xs={3} md={1}>
                  <Button aria-label="Xóa bộ lọc" variant="light" className="w-100 border-0 rounded-3 py-2 text-danger fw-bold bg-danger bg-opacity-10" onClick={() => { setFilterAction('all'); setFilterTargetType('all'); setFilterActorId(''); setCurrentPage(1); }} title="Xóa bộ lọc">
                    <i className="bi bi-eraser-fill" />
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            {error && <Alert variant="danger" className="m-3">{error}</Alert>}
            {loading ? (
              <div className="d-flex justify-content-center p-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : currentItems.length === 0 ? (
              <div className="text-center p-5 text-muted">
                No audit logs found matching the current filters.
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover responsive className="align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="ps-4 py-3 border-bottom-0 text-muted fw-semibold">Time</th>
                        <th className="py-3 border-bottom-0 text-muted fw-semibold">Actor (Admin ID)</th>
                        <th className="py-3 border-bottom-0 text-muted fw-semibold">Action</th>
                        <th className="py-3 border-bottom-0 text-muted fw-semibold">Target Type</th>
                        <th className="pe-4 py-3 border-bottom-0 text-muted fw-semibold">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map(log => (
                        <tr key={log.id}>
                          <td className="ps-4 py-3 text-muted small">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 fw-medium text-dark">{log.actorId}</td>
                          <td className="py-3">{getActionBadge(log.action)}</td>
                          <td className="py-3">{getTargetBadge(log.targetType)}</td>
                          <td className="pe-4 py-3 text-muted">{renderLogDetails(log)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Phân trang */}
                {totalPages > 1 && (
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 border-top bg-white">
                    <div className="text-muted small mb-3 mb-md-0 fw-medium">
                      Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, sortedLogs.length)} trên tổng {sortedLogs.length} logs
                    </div>
                    <Pagination className="mb-0 custom-pagination">
                      <Pagination.Prev
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      />
                      {[...Array(totalPages)].map((_, idx) => (
                        <Pagination.Item
                          key={idx + 1}
                          active={idx + 1 === currentPage}
                          onClick={() => setCurrentPage(idx + 1)}
                        >
                          {idx + 1}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Card>
        </Container>
      </div>
    </div>
  );
}
