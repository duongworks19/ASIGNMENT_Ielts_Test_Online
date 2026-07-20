/**
 * TransactionList.jsx — Admin: Xem giao dịch mock payment (read-only)
 * Route: /admin/transactions
 *
 * Traceability Matrix:
 * - ADM-CONTENT: Admin xem giao dịch mock payment (read-only)
 * - PLAN §2.2: Component dùng Bootstrap 5, PascalCase
 * - SPEC §6: Transactions collection với status: completed/pending/failed
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Form, Button, Badge, Spinner, Alert, Row, Col, Card, Container } from 'react-bootstrap';
import { getTransactions } from '../../services/adminService';

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', method: '' });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.method) params.method = filters.method;
      const data = await getTransactions(params);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Không thể tải danh sách giao dịch. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  };

  const getMethodLabel = (method) => {
    const methods = {
      'bank-transfer': '🏦 Bank Transfer',
      'momo': '📱 MoMo',
      'vnpay': '💳 VNPay',
    };
    return methods[method] || method;
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currency || 'VND' }).format(amount);
  };

  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const content = (
    <>
      {/* Summary Cards */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="tp-stat-card bg-white p-4 rounded-4 shadow-sm border-0 h-100">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}>
                <i className="bi bi-wallet2"></i>
              </div>
              <div>
                <div className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.5px' }}>Tổng doanh thu</div>
                <div className="fw-bold fs-3 text-dark">{formatCurrency(totalRevenue, 'VND')}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="tp-stat-card bg-white p-4 rounded-4 shadow-sm border-0 h-100">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}>
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <div>
                <div className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.5px' }}>Giao dịch thành công</div>
                <div className="fw-bold fs-3 text-dark">
                  {transactions.filter(t => t.status === 'completed').length} <span className="fs-6 text-muted fw-normal">giao dịch</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="tp-stat-card bg-white p-4 rounded-4 shadow-sm border-0 h-100">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-warning bg-opacity-10 text-warning d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <div>
                <div className="text-muted small fw-medium text-uppercase" style={{ letterSpacing: '0.5px' }}>Giao dịch chưa hoàn tất</div>
                <div className="fw-bold fs-3 text-dark">
                  {transactions.filter(t => t.status !== 'completed').length} <span className="fs-6 text-muted fw-normal">giao dịch</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      {/* Filter Bar */}
      <Card className="studio-filter-card mb-4 border-0 shadow-sm rounded-4">
        <Card.Body className="p-4">
          <Row className="g-3 align-items-center">
            <Col md={4}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-funnel text-muted"></i>
                <Form.Select name="status" value={filters.status} onChange={handleFilterChange} className="tp-input rounded-pill shadow-none" id="txn-status-filter">
                  <option value="">Tất cả trạng thái</option>
                  <option value="completed">Thành công (Completed)</option>
                  <option value="pending">Đang xử lý (Pending)</option>
                  <option value="failed">Thất bại (Failed)</option>
                </Form.Select>
              </div>
            </Col>
            <Col md={4}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-credit-card text-muted"></i>
                <Form.Select name="method" value={filters.method} onChange={handleFilterChange} className="tp-input rounded-pill shadow-none" id="txn-method-filter">
                  <option value="">Tất cả phương thức</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="momo">MoMo</option>
                  <option value="vnpay">VNPay</option>
                </Form.Select>
              </div>
            </Col>
            <Col md={4} className="text-md-end">
              <Button variant="light" className="rounded-pill px-4 text-secondary fw-medium border shadow-sm" onClick={() => setFilters({ status: '', method: '' })}>
                <i className="bi bi-arrow-clockwise me-2"></i>Làm mới
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Table */}
      <Card className="studio-table-card">
        {loading ? (
          <div className="d-flex justify-content-center p-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center p-5 text-muted">
            Không có giao dịch nào phù hợp.
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle border-top-0 mb-0">
              <thead className="bg-light text-muted">
                <tr>
                  <th className="ps-4 fw-medium border-0 py-3">Mã GD</th>
                  <th className="fw-medium border-0 py-3">User ID</th>
                  <th className="fw-medium border-0 py-3">Khóa học</th>
                  <th className="fw-medium border-0 py-3">Số tiền</th>
                  <th className="fw-medium border-0 py-3">Phương thức</th>
                  <th className="fw-medium border-0 py-3">Trạng thái</th>
                  <th className="text-end pe-4 fw-medium border-0 py-3">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {transactions.map(txn => (
                  <tr key={txn.id} style={{ transition: 'all 0.2s' }}>
                    <td className="ps-4 py-3">
                      <div className="fw-semibold text-dark mb-1">{txn.id}</div>
                    </td>
                    <td className="py-3">
                      <div className="text-secondary small fw-medium">{txn.userId || 'N/A'}</div>
                    </td>
                    <td className="py-3">
                      <div className="text-dark fw-medium">{txn.courseId || 'N/A'}</div>
                    </td>
                    <td className="py-3">
                      <div className="fw-bold text-primary">
                        {formatCurrency(txn.amount, txn.currency)}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-dark fw-medium">{getMethodLabel(txn.method)}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`tp-badge badge-${getStatusVariant(txn.status)} px-3`}>
                        {txn.status === 'completed' ? 'Thành công' : txn.status === 'pending' ? 'Chờ duyệt' : 'Thất bại'}
                      </span>
                    </td>
                    <td className="text-end pe-4 py-3">
                      <div className="text-muted small">
                        {txn.createdAt ? new Date(txn.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </>
  );



  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-receipt"></i> Giao dịch</div>
            <h1 className="tp-page-title">Transactions</h1>
            <p className="tp-page-sub">Xem toàn bộ giao dịch thanh toán trong hệ thống (chỉ xem)</p>
          </div>
        </div>
      </div>
      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4">
          {content}
        </Container>
      </div>
    </div>
  );
};

export default TransactionList;
