import React, { useEffect, useState } from 'react';
import { Alert, Card, Col, Container, Row, Spinner, Table } from 'react-bootstrap';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getRevenueStatistics } from '../../services/adminService';
import { formatVnd } from '../../services/paymentService';

const EMPTY_REPORT = {
  summary: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, coursesSold: 0 },
  byCourse: [],
  byMonth: [],
};

const compactMoney = (amount) => {
  if (amount >= 1000000) return `${Math.round(amount / 100000) / 10}tr`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}k`;
  return String(amount);
};

export default function RevenueStatistics() {
  const [report, setReport] = useState(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Thống kê doanh thu | Admin';
    let active = true;
    const loadRevenue = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getRevenueStatistics();
        if (active) setReport({ ...EMPTY_REPORT, ...data, summary: { ...EMPTY_REPORT.summary, ...data.summary } });
      } catch (requestError) {
        if (active) setError(requestError.message || 'Không thể tải dữ liệu doanh thu.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadRevenue();
    return () => { active = false; };
  }, []);

  const monthlyData = report.byMonth.map((entry) => ({
    ...entry,
    label: entry.month.split('-').reverse().join('/'),
  }));
  const topCourses = report.byCourse.slice(0, 8).map((entry) => ({
    ...entry,
    shortTitle: entry.courseTitle.length > 28 ? `${entry.courseTitle.slice(0, 28)}...` : entry.courseTitle,
  }));

  return (
    <div className="admin-page-shell">
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-graph-up-arrow" /> Doanh thu thật</div>
            <h1 className="tp-page-title">Thống kê doanh thu</h1>
            <p className="tp-page-sub">Số liệu từ các đơn PayOS đã thanh toán, phân bổ đến từng khóa học</p>
          </div>
        </div>
      </div>

      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="text-center py-5" role="status">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Đang tổng hợp giao dịch PayOS...</p>
            </div>
          ) : (
            <>
              <Row className="g-3 mb-4">
                {[
                  { label: 'Tổng doanh thu', value: formatVnd(report.summary.totalRevenue), icon: 'bi-cash-stack', color: 'success' },
                  { label: 'Đơn thành công', value: `${report.summary.totalOrders} đơn`, icon: 'bi-receipt-cutoff', color: 'primary' },
                  { label: 'Giá trị trung bình', value: formatVnd(report.summary.averageOrderValue), icon: 'bi-calculator', color: 'warning' },
                  { label: 'Lượt khóa học bán', value: `${report.summary.coursesSold} lượt`, icon: 'bi-journal-check', color: 'info' },
                ].map((stat) => (
                  <Col xl={3} md={6} key={stat.label}>
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Body className="p-4 d-flex align-items-center gap-3">
                        <div className={`bg-${stat.color} bg-opacity-10 text-${stat.color} d-flex align-items-center justify-content-center`} style={{ width: 48, height: 48, borderRadius: 8 }}>
                          <i className={`bi ${stat.icon} fs-5`} />
                        </div>
                        <div className="min-w-0">
                          <div className="small text-muted">{stat.label}</div>
                          <div className="h5 fw-bold mb-0 text-truncate">{stat.value}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {report.summary.totalOrders === 0 && (
                <Alert variant="info">
                  Chưa có giao dịch PayOS thành công. Biểu đồ và bảng doanh thu sẽ tự cập nhật sau lần mua đầu tiên.
                </Alert>
              )}

              <Row className="g-4 mb-4">
                <Col xl={7}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="p-4">
                      <h2 className="h6 fw-bold mb-4">Doanh thu theo tháng</h2>
                      <div style={{ width: '100%', height: 320 }}>
                        {monthlyData.length ? (
                          <ResponsiveContainer>
                            <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="label" axisLine={false} tickLine={false} />
                              <YAxis axisLine={false} tickLine={false} tickFormatter={compactMoney} />
                              <Tooltip formatter={(value) => [formatVnd(value), 'Doanh thu']} />
                              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-100 d-flex align-items-center justify-content-center text-muted">Chưa có dữ liệu</div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={5}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="p-4">
                      <h2 className="h6 fw-bold mb-4">Khóa học theo doanh thu</h2>
                      <div style={{ width: '100%', height: 320 }}>
                        {topCourses.length ? (
                          <ResponsiveContainer>
                            <BarChart data={topCourses} layout="vertical" margin={{ top: 0, right: 15, left: 20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                              <XAxis type="number" tickFormatter={compactMoney} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="shortTitle" width={135} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                              <Tooltip formatter={(value) => [formatVnd(value), 'Doanh thu']} />
                              <Bar dataKey="revenue" fill="#16a34a" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-100 d-flex align-items-center justify-content-center text-muted">Chưa có dữ liệu</div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card className="border-0 shadow-sm overflow-hidden">
                <Card.Header className="bg-white border-bottom p-4">
                  <h2 className="h6 fw-bold mb-1">Doanh thu theo từng khóa học</h2>
                  <p className="small text-muted mb-0">Số tiền sau giảm giá được phân bổ theo tỷ lệ giá của từng khóa trong đơn.</p>
                </Card.Header>
                {report.byCourse.length ? (
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="ps-4 py-3">Khóa học</th>
                          <th>Giảng viên</th>
                          <th className="text-end">Lượt bán</th>
                          <th className="text-end">Người mua</th>
                          <th className="text-end">Số đơn</th>
                          <th className="text-end pe-4">Doanh thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.byCourse.map((course) => (
                          <tr key={course.courseId}>
                            <td className="ps-4 py-3">
                              <div className="fw-semibold">{course.courseTitle}</div>
                              <code className="small text-muted">{course.courseId}</code>
                            </td>
                            <td>
                              <div>{course.teacherName || 'Chưa gán'}</div>
                              {course.teacherId && <code className="small text-muted">{course.teacherId}</code>}
                            </td>
                            <td className="text-end">{course.sales}</td>
                            <td className="text-end">{course.buyers}</td>
                            <td className="text-end">{course.orders}</td>
                            <td className="text-end pe-4 fw-bold text-success">{formatVnd(course.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center text-muted py-5">Chưa có khóa học phát sinh doanh thu.</div>
                )}
              </Card>
            </>
          )}
        </Container>
      </div>
    </div>
  );
}
