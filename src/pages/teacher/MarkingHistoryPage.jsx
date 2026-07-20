import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Form, Spinner, Row, Col } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import { markingService } from '../../services/markingService';
import { testService } from '../../services/testService';
import { normalizeTest, buildSpeakingQuestions, buildWritingQuestions, getAnswerValue } from '../../utils/testModel';

export default function MarkingHistoryPage() {
  const [markedSubmissions, setMarkedSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Grade View state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  const [questions, setQuestions] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const [c1, setC1] = useState('');
  const [c2, setC2] = useState('');
  const [c3, setC3] = useState('');
  const [c4, setC4] = useState('');

  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMarkedSubmissions();
  }, []);

  const fetchMarkedSubmissions = async () => {
    setLoading(true);
    try {
      const markedData = await markingService.getMarkedSubmissions();
      setMarkedSubmissions(markedData);
    } catch (error) {
      toast.error('Lỗi khi tải lịch sử chấm bài.');
    } finally {
      setLoading(false);
    }
  };

  const openGradeView = async (submission) => {
    setSelectedSubmission(submission);
    if (submission.criteriaScores) {
      setC1(submission.criteriaScores.C1 || '');
      setC2(submission.criteriaScores.C2 || '');
      setC3(submission.criteriaScores.C3 || '');
      setC4(submission.criteriaScores.C4 || '');
    } else {
      setC1(''); setC2(''); setC3(''); setC4('');
    }
    setFeedback(submission.feedback || '');
    setQuestions([]);
    setModalLoading(true);
    
    try {
      const testData = await testService.getTestById(submission.testId);
      const normalized = normalizeTest(testData);
      
      const qRecords = await testService.getQuestionsForTest(testData.id).catch(() => []);
      let sessionQuestions = [];
      
      if (normalized.skill === 'Writing') {
        sessionQuestions = buildWritingQuestions(normalized);
      } else if (normalized.skill === 'Speaking') {
        sessionQuestions = qRecords.length > 0 ? qRecords : buildSpeakingQuestions(normalized);
      }
      setQuestions(sessionQuestions);
    } catch (err) {
      toast.error('Lỗi khi tải thông tin đề thi');
    } finally {
      setModalLoading(false);
    }
  };

  const calculatedBand = React.useMemo(() => {
    const v1 = parseFloat(c1); const v2 = parseFloat(c2); const v3 = parseFloat(c3); const v4 = parseFloat(c4);
    if (isNaN(v1) || isNaN(v2) || isNaN(v3) || isNaN(v4)) return 'N/A';
    const avg = (v1 + v2 + v3 + v4) / 4;
    return (Math.round(avg * 2) / 2).toFixed(1);
  }, [c1, c2, c3, c4]);

  const handleSaveGrade = async () => {
    if (calculatedBand === 'N/A') {
      toast.error('Vui lòng nhập đầy đủ 4 tiêu chí điểm (0-9)');
      return;
    }
    setSaving(true);
    try {
      const criteriaScores = {
        C1: parseFloat(c1),
        C2: parseFloat(c2),
        C3: parseFloat(c3),
        C4: parseFloat(c4)
      };
      await markingService.gradeSubmission(selectedSubmission.id, { 
        score: parseFloat(calculatedBand), 
        criteriaScores, 
        feedback 
      });
      toast.success('Cập nhật điểm thành công!');
      setSelectedSubmission(null);
      fetchMarkedSubmissions();
    } catch (error) {
      toast.error('Lỗi khi lưu điểm.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Đang tải danh sách bài đã chấm...</p>
      </Container>
    );
  }

  // MARKING VIEW (Full Page)
  if (selectedSubmission) {
    return (
      <div className="bg-light min-vh-100 pb-5">
        <div className="bg-white shadow-none border border-dark sticky-top border-bottom" style={{ zIndex: 1020 }}>
          <Container className="py-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <Button variant="light" onClick={() => setSelectedSubmission(null)} className="rounded-0" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-arrow-left fs-5"></i>
              </Button>
              <div>
                <h4 className="fw-bold mb-0 text-dark">Chấm lại bài thi</h4>
                <div className="text-muted small mt-1 d-flex align-items-center gap-2">
                  <Badge bg="secondary">{selectedSubmission.skill}</Badge>
                  <span>{selectedSubmission.testTitle || selectedSubmission.testId}</span>
                  <span>•</span>
                  <span>Học viên: {selectedSubmission.userId}</span>
                </div>
              </div>
            </div>
            <Button variant="primary" onClick={handleSaveGrade} disabled={saving} className="rounded-0 px-4 fw-bold shadow-none border border-dark">
              {saving ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-check2-circle me-2"></i>}
              Hoàn tất & Cập nhật
            </Button>
          </Container>
        </div>

        <Container className="mt-4">
          <Row className="g-4">
            {/* Cột trái: Hiển thị bài làm */}
            <Col lg={7}>
              <Card className="border-0 shadow-none border border-dark rounded-0 h-100">
                <Card.Header className="bg-white border-bottom py-3">
                  <h6 className="fw-bold mb-0 text-dark"><i className="bi bi-journal-text me-2 text-primary"></i>Nội dung bài làm</h6>
                </Card.Header>
                <Card.Body className="p-4 bg-light" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                  {modalLoading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3 text-muted">Đang tải đề thi & bài làm...</p>
                    </div>
                  ) : questions.length > 0 ? (
                    <div className="d-flex flex-column gap-4">
                      {questions.map((q, idx) => {
                        const isWriting = selectedSubmission.skill === 'Writing';
                        const ans = getAnswerValue(selectedSubmission.answers, q, idx);
                        
                        return (
                          <div key={q.id} className="p-4 bg-white rounded-0 shadow-none border border-dark border border-light">
                            <div className="fw-bold text-primary mb-3" style={{ fontSize: '1.1rem' }}>
                              {isWriting ? `Writing Task ${q.taskNumber || idx + 1}` : `Speaking Part ${q.part || idx + 1}`}
                            </div>
                            <div className="mb-4 text-dark p-3 rounded-0" style={{ background: '#f8fafc', whiteSpace: 'pre-wrap', fontSize: '15px', lineHeight: '1.6' }}>
                              <div className="small text-muted fw-bold mb-2 text-uppercase">Đề bài (Prompt)</div>
                              {q.prompt || q.questionText || q.text}
                            </div>
                            
                            <div className="mt-4">
                              <div className="small text-muted fw-bold mb-2 text-uppercase d-flex align-items-center gap-2">
                                <i className="bi bi-person-fill text-success"></i> Câu trả lời của học viên
                              </div>
                              {isWriting ? (
                                <div className="text-dark p-3 border rounded-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '15px', minHeight: '150px' }}>
                                  {ans || <em className="text-muted">Học viên không có nội dung trả lời.</em>}
                                </div>
                              ) : (
                                <div className="d-flex align-items-center p-3 border rounded-0 bg-white">
                                  {ans ? (
                                    <audio src={ans} controls className="w-100" style={{ height: '45px' }} />
                                  ) : (
                                    <em className="text-muted">Học viên chưa ghi âm câu này.</em>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-5">Không tải được câu hỏi. Có thể dữ liệu cũ hoặc lỗi.</div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Cột phải: Tiêu chí chấm điểm & Nhận xét */}
            <Col lg={5}>
              <Card className="border-0 shadow-none border border-dark rounded-0 position-sticky" style={{ top: '100px' }}>
                <Card.Header className="bg-white border-bottom py-3">
                  <h6 className="fw-bold mb-0 text-dark"><i className="bi bi-pencil-square me-2 text-warning"></i>Phiếu chấm điểm</h6>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="mb-4">
                    <label className="fw-bold text-dark mb-3">1. Điểm 4 tiêu chí (0.0 - 9.0)</label>
                    <div className="row g-3">
                      <div className="col-6">
                        <div className="p-3 border rounded-0 bg-light">
                          <Form.Label className="fw-semibold small text-primary mb-1">{selectedSubmission.skill === 'Speaking' ? 'FC (Fluency & Coherence)' : 'TA/TR (Task Achievement)'}</Form.Label>
                          <Form.Control type="number" step="0.5" min="0" max="9" value={c1} onChange={e => setC1(e.target.value)} className="fw-bold" />
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 border rounded-0 bg-light">
                          <Form.Label className="fw-semibold small text-primary mb-1">{selectedSubmission.skill === 'Speaking' ? 'LR (Lexical Resource)' : 'CC (Coherence & Cohesion)'}</Form.Label>
                          <Form.Control type="number" step="0.5" min="0" max="9" value={c2} onChange={e => setC2(e.target.value)} className="fw-bold" />
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 border rounded-0 bg-light">
                          <Form.Label className="fw-semibold small text-primary mb-1">GRA (Grammar Range)</Form.Label>
                          <Form.Control type="number" step="0.5" min="0" max="9" value={c3} onChange={e => setC3(e.target.value)} className="fw-bold" />
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 border rounded-0 bg-light">
                          <Form.Label className="fw-semibold small text-primary mb-1">{selectedSubmission.skill === 'Speaking' ? 'PR (Pronunciation)' : 'LR (Lexical Resource)'}</Form.Label>
                          <Form.Control type="number" step="0.5" min="0" max="9" value={c4} onChange={e => setC4(e.target.value)} className="fw-bold" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 mb-4 rounded-0 d-flex align-items-center justify-content-between shadow-none border border-dark" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: '#fff' }}>
                    <span className="fw-bold" style={{ fontSize: '1.1rem' }}>Overall Band Score:</span>
                    <span className="fw-bold" style={{ fontSize: '2rem' }}>
                      {calculatedBand !== 'N/A' ? calculatedBand : '-.-'}
                    </span>
                  </div>

                  <Form.Group>
                    <label className="fw-bold text-dark mb-2">2. Nhận xét chi tiết (Feedback)</label>
                    <Form.Control 
                      as="textarea" 
                      rows={6} 
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Viết nhận xét chi tiết để học viên biết cách cải thiện (từ vựng, phát âm, lỗi ngữ pháp...)"
                      className="border-secondary-subtle p-3 shadow-none border border-dark"
                      style={{ lineHeight: '1.6' }}
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-clock-history"></i> Lịch sử</div>
            <h1 className="tp-page-title">Lịch sử chấm bài</h1>
            <p className="tp-page-sub">Các bài thi bạn đã chấm. Bạn có thể xem lại hoặc sửa điểm nếu cần.</p>
          </div>
          <div className="tp-badge tp-badge-success" style={{ alignSelf: 'flex-end', fontSize: '0.9rem', padding: '10px 18px' }}>
            <i className="bi bi-check-circle-fill"></i> {markedSubmissions.length} bài đã chấm
          </div>
        </div>
      </div>

      <div className="tp-main-content">
      <Container fluid="xxl" className="px-4">
        {markedSubmissions.length === 0 ? (
          <div className="tp-card-static">
            <div className="tp-empty">
              <div className="tp-empty-icon"><i className="bi bi-clock-history"></i></div>
              <div className="tp-empty-title">Chưa có lịch sử chấm</div>
              <p className="tp-empty-sub">Bạn chưa chấm bài thi nào.</p>
            </div>
          </div>
        ) : (
          <div className="tp-table-wrapper">
            <table className="tp-table">
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Bài thi</th>
                  <th>Kỹ năng</th>
                  <th>Điểm (Band)</th>
                  <th>Thời gian chấm</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {markedSubmissions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="fw-semibold text-dark">{sub.userId}</td>
                    <td>{sub.testTitle || sub.testId}</td>
                    <td>
                      <span className={`tp-badge ${sub.skill === 'Writing' ? 'tp-badge-info' : 'tp-badge-success'}`}>{sub.skill}</span>
                    </td>
                    <td className="fw-bold text-success" style={{ fontSize: '1.05rem' }}>
                      {sub.overallBandScore !== undefined ? Number(sub.overallBandScore).toFixed(1) : '-'}
                    </td>
                    <td className="text-secondary small">{new Date(sub.gradedAt || sub.completedAt).toLocaleString('vi-VN')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="tp-action-btn tp-action-btn-view" title="Xem lại" onClick={() => openGradeView(sub)}>
                        <i className="bi bi-eye"></i>
                      </button>
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
