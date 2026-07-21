import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Table } from 'react-bootstrap';
import { getTransactions } from '../../services/adminService';
import { PAYMENT_STATUS_LABEL, formatVnd } from '../../services/paymentService';

const EMPTY_SUMMARY = { totalRevenue: 0, paidOrders: 0, pendingOrders: 0 };

const statusVariant = (status) => ({
  paid: 'success',
  pending: 'warning',
  cancelled: 'secondary',
  expired: 'dark',
  failed: 'danger',
}[status] || 'secondary');

export default function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [filters, setFilters] = useState({ status: '', q: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getTransactions(filters);
      setTransactions(Array.isArray(result?.data) ? result.data : []);
      setSummary(result?.summary || EMPTY_SUMMARY);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải lịch sử giao dịch.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    document.title = 'Lịch sử giao dịch | Admin';
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="admin-page-shell">
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-receipt" /> PayOS</div>
            <h1 className="tp-page-title">Lịch sử giao dịch</h1>
            <p className="tp-page-sub">Đơn mua khóa học được ghi nhận và đối soát tự động từ PayOS</p>
          </div>
          <Button variant="outline-light" className="border-2" onClick={fetchTransactions} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-2" />Làm mới
          </Button>
        </div>
      </div>

      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4">
          <Row className="g-3 mb-4">
            <Col lg={4} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4 d-flex align-items-center gap-3">
                  <div className="bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, borderRadius: 8 }}>
                    <i className="bi bi-cash-stack fs-5" />
                  </div>
                  <div>
                    <div className="small text-muted">Doanh thu trong kết quả</div>
                    <div className="h4 fw-bold mb-0">{formatVnd(summary.totalRevenue)}</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4 d-flex align-items-center gap-3">
                  <div className="bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, borderRadius: 8 }}>
                    <i className="bi bi-check-circle fs-5" />
                  </div>
                  <div>
                    <div className="small text-muted">Đã thanh toán</div>
                    <div className="h4 fw-bold mb-0">{summary.paidOrders} đơn</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4 d-flex align-items-center gap-3">
                  <div className="bg-warning bg-opacity-10 text-warning d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, borderRadius: 8 }}>
                    <i className="bi bi-clock-history fs-5" />
                  </div>
                  <div>
                    <div className="small text-muted">Đang chờ PayOS</div>
                    <div className="h4 fw-bold mb-0">{summary.pendingOrders} đơn</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {error && <Alert variant="danger">{error}</Alert>}

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-3">
              <Row className="g-3 align-items-center">
                <Col lg={7}>
                  <div className="position-relative">
                    <i className="bi bi-search position-absolute text-muted" style={{ left: 14, top: 11 }} />
                    <Form.Control
                      aria-label="Tìm giao dịch"
                      placeholder="Tìm mã đơn, mã ngân hàng, học viên hoặc khóa học"
                      value={filters.q}
                      onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
                      style={{ paddingLeft: 40 }}
                    />
                  </div>
                </Col>
                <Col lg={3}>
                  <Form.Select
                    aria-label="Lọc trạng thái giao dịch"
                    value={filters.status}
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="paid">Thành công</option>
                    <option value="pending">Chờ thanh toán</option>
                    <option value="cancelled">Đã hủy</option>
                    <option value="expired">Hết hạn</option>
                    <option value="failed">Thất bại</option>
                  </Form.Select>
                </Col>
                <Col lg={2}>
                  <Button
                    variant="light"
                    className="border w-100"
                    onClick={() => setFilters({ status: '', q: '' })}
                  >
                    <i className="bi bi-x-circle me-2" />Xóa lọc
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden">
            {loading ? (
              <div className="text-center py-5" role="status">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-muted py-5">
                <i className="bi bi-receipt fs-1 d-block mb-3" />
                Chưa có giao dịch PayOS phù hợp.
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4 py-3">Mã đơn</th>
                      <th>Học viên</th>
                      <th>Khóa học</th>
                      <th className="text-end">Số tiền</th>
                      <th>Mã ngân hàng</th>
                      <th>Trạng thái</th>
                      <th className="text-end pe-4">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="ps-4 py-3">
                          <div className="fw-semibold">#{transaction.orderCode}</div>
                          <small className="text-muted">{transaction.id}</small>
                        </td>
                        <td>
                          <div className="fw-semibold">{transaction.userName}</div>
                          <small className="text-muted">{transaction.userEmail}</small>
                        </td>
                        <td style={{ minWidth: 220 }}>
                          {transaction.courseTitles.map((title, index) => (
                            <div key={`${transaction.id}-${index}`} className="small mb-1">
                              <i className="bi bi-journal-bookmark me-2 text-primary" />{title}
                            </div>
                          ))}
                        </td>
                        <td className="text-end fw-bold text-primary">{formatVnd(transaction.amount)}</td>
                        <td><code>{transaction.providerReference || 'Chưa có'}</code></td>
                        <td>
                          <Badge bg={statusVariant(transaction.status)} text={transaction.status === 'pending' ? 'dark' : undefined}>
                            {PAYMENT_STATUS_LABEL[transaction.status] || transaction.status}
                          </Badge>
                        </td>
                        <td className="text-end pe-4 text-muted small text-nowrap">
                          {new Date(transaction.paidAt || transaction.createdAt).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card>
        </Container>
      </div>
    </div>
  );
}
