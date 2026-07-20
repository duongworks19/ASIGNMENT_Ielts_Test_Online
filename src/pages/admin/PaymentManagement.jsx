import React, { useEffect, useMemo, useState } from 'react';
import {
  Container, Row, Col, Card, Table, Badge, Button, Form,
  Spinner, Alert, Modal, InputGroup, Tabs, Tab
} from 'react-bootstrap';
import api from '../../services/api';
import {
  getAllPayments, approvePayment, rejectPayment,
  formatVnd, PAYMENT_STATUS, PAYMENT_STATUS_LABEL,
} from '../../services/paymentService';


const STATUS_VARIANT = {
  pending: 'warning',
  paid: 'success',
  rejected: 'danger',
};

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'paid', label: 'Đã kích hoạt' },
  { key: 'rejected', label: 'Bị từ chối' },
];

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [coursesMap, setCoursesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [actingId, setActingId] = useState(null);


  // Modal từ chối
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    document.title = 'Quản lý thanh toán | Admin';
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [pays, usersRes, coursesRes] = await Promise.all([
        getAllPayments(),
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/courses').catch(() => ({ data: [] })),
      ]);
      setPayments(pays);

      const uMap = {};
      (usersRes.data || []).forEach((u) => { uMap[u.id] = u; });
      setUsersMap(uMap);

      const cMap = {};
      (coursesRes.data || []).forEach((c) => { cMap[c.id] = c; });
      setCoursesMap(cMap);
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu thanh toán.');
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const s = { pending: 0, paid: 0, rejected: 0, revenue: 0 };
    payments.forEach((p) => {
      if (p.status === PAYMENT_STATUS.PENDING) s.pending += 1;
      else if (p.status === PAYMENT_STATUS.PAID) { s.paid += 1; s.revenue += Number(p.amount || 0); }
      else if (p.status === PAYMENT_STATUS.REJECTED) s.rejected += 1;
    });
    return s;
  }, [payments]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (!kw) return true;
      const u = usersMap[p.userId];
      const c = coursesMap[p.courseId];
      return (
        (p.transferContent || '').toLowerCase().includes(kw) ||
        (u?.email || '').toLowerCase().includes(kw) ||
        (u?.fullName || u?.name || '').toLowerCase().includes(kw) ||
        (c?.title || '').toLowerCase().includes(kw)
      );
    });
  }, [payments, filter, search, usersMap, coursesMap]);

  const handleApprove = async (payment) => {
    setActingId(payment.id);
    setError('');
    try {
      await approvePayment(payment);
      await loadData();
    } catch (err) {
      setError(err.message || 'Duyệt thất bại.');
    } finally {
      setActingId(null);
    }
  };

  const openReject = (payment) => {
    setRejectTarget(payment);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setActingId(rejectTarget.id);
    setError('');
    try {
      await rejectPayment(rejectTarget.id, rejectReason);
      setRejectTarget(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Từ chối thất bại.');
    } finally {
      setActingId(null);
    }
  };

  const fmtDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-credit-card-fill"></i> Quản lý</div>
            <h1 className="tp-page-title">Thanh toán</h1>
            <p className="tp-page-sub">Đối soát giao dịch chuyển khoản và kích hoạt khóa học cho học viên</p>
          </div>
        </div>
      </div>

      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4">

              {/* THỐNG KÊ */}
              <Row className="g-3 mb-4">
                <Col xs={6} lg={3}>
                  <div className="tp-stat-card bg-white p-4 rounded-4 shadow-sm border border-light d-flex flex-column justify-content-center">
                    <div className="text-muted small fw-medium mb-1">Chờ xác nhận</div>
                    <div className="h3 fw-bold mb-0 text-warning">{stats.pending}</div>
                  </div>
                </Col>
                <Col xs={6} lg={3}>
                  <div className="tp-stat-card bg-white p-4 rounded-4 shadow-sm border border-light d-flex flex-column justify-content-center">
                    <div className="text-muted small fw-medium mb-1">Đã kích hoạt</div>
                    <div className="h3 fw-bold mb-0 text-success">{stats.paid}</div>
                  </div>
                </Col>
                <Col xs={6} lg={3}>
                  <div className="tp-stat-card bg-white p-4 rounded-4 shadow-sm border border-light d-flex flex-column justify-content-center">
                    <div className="text-muted small fw-medium mb-1">Bị từ chối</div>
                    <div className="h3 fw-bold mb-0 text-danger">{stats.rejected}</div>
                  </div>
                </Col>
                <Col xs={6} lg={3}>
                  <div className="tp-stat-card bg-white p-4 rounded-4 shadow-sm border border-light d-flex flex-column justify-content-center">
                    <div className="text-muted small fw-medium mb-1">Doanh thu (đã duyệt)</div>
                    <div className="h4 fw-bold mb-0 text-primary">{formatVnd(stats.revenue)}</div>
                  </div>
                </Col>
              </Row>

              {/* BỘ LỌC */}
              <Card className="studio-filter-card mb-4">
                <div className="d-flex flex-column flex-md-row gap-3 justify-content-between align-items-md-center">
                  <div className="d-flex gap-2 flex-wrap">
                    {FILTERS.map((f) => (
                      <Button
                        key={f.key}
                        size="sm"
                        variant={filter === f.key ? 'primary' : 'outline-secondary'}
                        onClick={() => setFilter(f.key)}
                        className="rounded-pill px-3"
                      >
                        {f.label}
                      </Button>
                    ))}
                  </div>
                  <InputGroup style={{ maxWidth: 320 }}>
                    <Form.Control
                      placeholder="Tìm theo email, tên, mã đơn..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="tp-input rounded-start-pill"
                    />
                    {search && (
                      <Button variant="outline-secondary" className="rounded-end-pill" onClick={() => setSearch('')}>×</Button>
                    )}
                  </InputGroup>
                </div>
              </Card>

              <Card className="studio-table-card">
                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-3 mb-0">Đang tải dữ liệu...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    Không có đơn thanh toán nào khớp bộ lọc.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table responsive hover className="align-middle">
                      <thead>
                        <tr>
                          <th className="ps-4">Học viên</th>
                          <th>Khóa học</th>
                          <th>Mã đơn / Nội dung CK</th>
                          <th className="text-end">Số tiền</th>
                          <th>Thời gian</th>
                          <th>Trạng thái</th>
                          <th className="text-end pe-4">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p) => {
                          const u = usersMap[p.userId];
                          const c = coursesMap[p.courseId];
                          const busy = actingId === p.id;
                          return (
                            <tr key={p.id}>
                              <td className="ps-4">
                                <div className="fw-medium text-dark">{u?.fullName || u?.name || 'Không rõ'}</div>
                                <div className="text-muted small">{u?.email || p.userId}</div>
                              </td>
                              <td>{c?.title || p.courseId}</td>
                              <td><code>{p.transferContent}</code></td>
                              <td className="text-end fw-semibold">{formatVnd(p.amount)}</td>
                              <td className="small text-muted">{fmtDate(p.createdAt)}</td>
                              <td>
                                <span className={`tp-badge badge-${STATUS_VARIANT[p.status] || 'secondary'} px-3`}>
                                  {PAYMENT_STATUS_LABEL[p.status] || p.status}
                                </span>
                                {p.status === PAYMENT_STATUS.REJECTED && p.rejectReason && (
                                  <div className="text-danger small mt-1" style={{ maxWidth: 200 }}>
                                    {p.rejectReason}
                                  </div>
                                )}
                              </td>
                              <td className="text-end pe-4">
                                {p.status === PAYMENT_STATUS.PENDING ? (
                                  <div className="d-flex gap-2 justify-content-end">
                                    <Button
                                      size="sm" variant="success" disabled={busy}
                                      onClick={() => handleApprove(p)}
                                      className="rounded-pill px-3"
                                    >
                                      {busy ? '...' : 'Duyệt'}
                                    </Button>
                                    <Button
                                      size="sm" variant="outline-danger" disabled={busy}
                                      onClick={() => openReject(p)}
                                      className="rounded-pill px-3"
                                    >
                                      Từ chối
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-muted small">
                                    {p.reviewedAt ? `Đã xử lý ${fmtDate(p.reviewedAt)}` : '—'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card>

      </Container>
      </div>

      {/* MODAL TỪ CHỐI */}
      <Modal show={Boolean(rejectTarget)} onHide={() => setRejectTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5">Từ chối đơn thanh toán</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small">
            Đơn <code>{rejectTarget?.transferContent}</code> sẽ bị từ chối. Học viên sẽ thấy lý do này.
          </p>
          <Form.Group>
            <Form.Label className="fw-semibold small">Lý do từ chối</Form.Label>
            <Form.Control
              as="textarea" rows={3}
              placeholder="VD: Không tìm thấy giao dịch khớp nội dung chuyển khoản."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="tp-input"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setRejectTarget(null)}>Hủy</Button>
          <Button variant="danger" className="rounded-pill px-4" onClick={confirmReject} disabled={actingId === rejectTarget?.id}>
            Xác nhận từ chối
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
