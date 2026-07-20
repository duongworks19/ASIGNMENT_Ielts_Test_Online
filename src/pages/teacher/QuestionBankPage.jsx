import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Row, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../services/authService';
import { teacherCourseService } from '../../services/teacherCourseService';
import { teacherTestService } from '../../services/teacherTestService';
import { teacherQuestionService } from '../../services/teacherQuestionService';
import { auditLogService } from '../../services/auditLogService';
import { getPassageForQuestion, getReferenceOptions, normalizeTest, buildConfigQuestions } from '../../utils/testModel';

const emptyForm = {
  referenceId: '',
  type: 'multiple-choice',
  questionText: '',
  option0: '',
  option1: '',
  option2: '',
  option3: '',
  answer: '',
  explanation: '',
  score: 1,
};

const SUPPORTED_TYPES = {
  Reading: [
    ['multiple-choice', 'Multiple choice'],
    ['true-false-not-given', 'True / False / Not Given'],
    ['fill-in-the-blank', 'Fill in the blank'],
  ],
  Listening: [
    ['multiple-choice', 'Multiple choice'],
    ['fill-in-the-blank', 'Fill in the blank'],
    ['true-false-not-given', 'True / False / Not Given'],
  ],
  Speaking: [
    ['speaking-part', 'Speaking prompt'],
  ],
};

export default function QuestionBankPage() {
  const { id: testId } = useParams();
  const currentUser = getCurrentUser();
  const teacherId = currentUser?.id || 'u-teacher-001';

  const [test, setTest] = useState(null);
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const normalizedTest = useMemo(() => test ? normalizeTest(test) : null, [test]);
  const referenceOptions = useMemo(() => normalizedTest ? getReferenceOptions(normalizedTest) : [], [normalizedTest]);
  const selectedReference = referenceOptions.find((item) => item.id === form.referenceId) || referenceOptions[0];
  const isPending = course?.status === 'pending';
  const typeOptions = SUPPORTED_TYPES[normalizedTest?.skill] || SUPPORTED_TYPES.Reading;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [testData, questionsData] = await Promise.all([
          teacherTestService.getTestById(testId),
          teacherQuestionService.getQuestions(testId),
        ]);
        const normalized = normalizeTest(testData);

        if (normalized.teacherId && normalized.teacherId !== teacherId) {
          setIsUnauthorized(true);
          setLoading(false);
          return;
        }

        setTest(normalized);
        const embeddedQuestions = buildConfigQuestions(normalized).map((q, idx) => ({ ...q, isEmbedded: true, id: `embedded-${idx}` }));
        setQuestions([...embeddedQuestions, ...questionsData]);
        const refs = getReferenceOptions(normalized);
        setForm({
          ...emptyForm,
          referenceId: refs[0]?.id || '',
          type: normalized.skill === 'Speaking' ? 'speaking-part' : 'multiple-choice',
        });

        if (normalized.courseId) {
          const coursesData = await teacherCourseService.getCourses(teacherId);
          setCourse(coursesData.find((item) => String(item.id) === String(normalized.courseId)) || null);
        }
      } catch (err) {
        toast.error('Không thể tải ngân hàng câu hỏi.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [testId, teacherId]);

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const resetForm = (nextType = form.type) => {
    setEditingQuestionId(null);
    setForm({
      ...emptyForm,
      referenceId: referenceOptions[0]?.id || '',
      type: nextType,
    });
  };

  const validateForm = () => {
    if (!form.referenceId && normalizedTest?.skill !== 'Writing') {
      toast.error('Vui lòng chọn passage/section/part để gắn câu hỏi.');
      return false;
    }
    if (!form.questionText.trim() || form.questionText.trim().length < 5) {
      toast.error('Nội dung câu hỏi cần ít nhất 5 ký tự.');
      return false;
    }
    if (form.type !== 'speaking-part' && !form.answer.trim()) {
      toast.error('Vui lòng nhập đáp án đúng.');
      return false;
    }
    if (form.type === 'multiple-choice') {
      const options = [form.option0, form.option1, form.option2, form.option3].map((item) => item.trim());
      if (options.some((item) => !item)) {
        toast.error('Multiple choice cần đủ 4 phương án.');
        return false;
      }
      if (!options.includes(form.answer.trim())) {
        toast.error('Đáp án đúng phải trùng với một trong 4 phương án.');
        return false;
      }
    }
    return true;
  };

  const buildPayload = () => {
    let options = [];
    if (form.type === 'multiple-choice') {
      options = [form.option0.trim(), form.option1.trim(), form.option2.trim(), form.option3.trim()];
    }
    if (form.type === 'true-false-not-given') {
      options = ['True', 'False', 'Not Given'];
    }

    const payload = {
      testId,
      skill: normalizedTest.skill,
      referenceId: selectedReference?.id || form.referenceId,
      referenceType: selectedReference?.type || 'passage',
      type: form.type,
      order: editingQuestionId
        ? questions.find((question) => question.id === editingQuestionId)?.order || questions.length
        : questions.length + 1,
      questionText: form.questionText.trim(),
      prompt: form.questionText.trim(),
      options,
      answer: form.type === 'speaking-part' ? '' : form.answer.trim(),
      explanation: form.explanation.trim(),
      score: Number(form.score) || 1,
    };

    if (payload.referenceType === 'passage') {
      payload.passage = getPassageForQuestion(normalizedTest, payload);
    }
    if (payload.referenceType === 'section') {
      payload.section = selectedReference?.label;
    }
    if (payload.referenceType === 'part') {
      const partMatch = String(payload.referenceId).match(/(\d+)$/);
      payload.part = partMatch ? Number(partMatch[1]) : 1;
    }
    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isPending) {
      toast.error('Không thể chỉnh câu hỏi khi khóa học đang chờ duyệt.');
      return;
    }
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (editingQuestionId) {
        const updated = await teacherQuestionService.updateQuestion(editingQuestionId, payload);
        setQuestions((prev) => prev.map((question) => question.id === editingQuestionId ? { ...updated, id: editingQuestionId } : question));
        await auditLogService.logAction('UPDATE_QUESTION', { questionId: editingQuestionId, testId }, teacherId);
        toast.success('Đã cập nhật câu hỏi.');
      } else {
        const created = await teacherQuestionService.createQuestion(payload);
        setQuestions((prev) => [...prev, created]);
        await auditLogService.logAction('CREATE_QUESTION', { questionId: created.id, testId }, teacherId);
        toast.success('Đã thêm câu hỏi.');
      }
      resetForm(payload.type);
    } catch (err) {
      toast.error('Lưu câu hỏi thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (question) => {
    setEditingQuestionId(question.id);
    setForm({
      referenceId: question.referenceId || referenceOptions[0]?.id || '',
      type: question.type || 'multiple-choice',
      questionText: question.questionText || question.prompt || '',
      option0: question.options?.[0] || '',
      option1: question.options?.[1] || '',
      option2: question.options?.[2] || '',
      option3: question.options?.[3] || '',
      answer: question.answer || '',
      explanation: question.explanation || '',
      score: question.score || 1,
    });
  };

  const handleDeleteClick = (question) => {
    if (isPending) {
      toast.error('Không thể xóa câu hỏi khi khóa học đang chờ duyệt.');
      return;
    }
    setQuestionToDelete(question);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;
    setSubmitting(true);
    try {
      await teacherQuestionService.deleteQuestion(questionToDelete.id);
      await auditLogService.logAction('DELETE_QUESTION', { questionId: questionToDelete.id, testId }, teacherId);
      setQuestions((prev) => prev.filter((question) => question.id !== questionToDelete.id));
      setShowDeleteModal(false);
      setQuestionToDelete(null);
      toast.success('Đã xóa câu hỏi.');
    } catch (err) {
      toast.error('Xóa câu hỏi thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="tp-loading">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} />
        <p className="mt-3 fw-semibold text-secondary">Đang tải ngân hàng câu hỏi...</p>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="tp-main-content">
        <div className="tp-error">
          <i className="bi bi-exclamation-triangle-fill text-danger fs-4 mb-2"></i>
          <div>Bạn không có quyền chỉnh sửa câu hỏi của test này.</div>
        </div>
      </div>
    );
  }

  if (normalizedTest?.skill === 'Writing') {
    return (
      <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
        <div className="tp-page-header">
          <div className="tp-page-header-inner">
            <div>
              <div className="tp-page-badge"><i className="bi bi-patch-question-fill"></i> Question Bank</div>
              <h1 className="tp-page-title">{normalizedTest?.title}</h1>
              <p className="tp-page-sub">Writing test dùng Task 1 và Task 2 trong Content Builder, không cần tạo câu hỏi riêng.</p>
            </div>
            <Link to={`/teacher/tests/${testId}/edit`} className="tp-btn-primary" style={{ alignSelf: 'flex-end' }}>
              Quay lại chỉnh test
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-patch-question-fill"></i> Question Bank</div>
            <h1 className="tp-page-title">{normalizedTest?.title}</h1>
            <p className="tp-page-sub">Mode: {normalizedTest?.testMode} · Status: {normalizedTest?.status} · Câu hỏi: {questions.length}</p>
          </div>
          <Link to={`/teacher/tests/${testId}/edit`} className="tp-btn-primary" style={{ alignSelf: 'flex-end' }}>
            <i className="bi bi-pencil-square"></i> Chỉnh cấu trúc test
          </Link>
        </div>
      </div>
      
      <div className="tp-main-content">
        <div className="container-fluid py-2">
          {isPending && (
            <div className="tp-error mb-4 border border-warning bg-warning bg-opacity-10 text-dark">
              <i className="bi bi-exclamation-triangle-fill text-warning fs-4"></i>
              <div>Khóa học đang chờ duyệt, bạn không thể xóa hay sửa đổi câu hỏi.</div>
            </div>
          )}
          <Row className="g-4">
        <Col xl={7}>
          <div className="tp-card-static">
            <div className="p-4">
              <h5 className="tp-page-title fs-5 mb-3">Danh sách câu hỏi ({questions.length})</h5>
              {questions.length === 0 ? (
                <div className="tp-empty">
                  <div className="tp-empty-icon"><i className="bi bi-list-task"></i></div>
                  <div className="tp-empty-title">Chưa có câu hỏi nào.</div>
                  <p className="tp-empty-sub">Hãy chọn dạng bài và thêm câu hỏi mới vào ngân hàng.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {questions.map((question, index) => {
                    const ref = referenceOptions.find((item) => item.id === question.referenceId);
                    return (
                      <Card key={question.id} className="border">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start gap-3">
                            <div>
                              <Badge bg={question.isEmbedded ? "info" : "secondary"} className="mb-2">
                                Câu {index + 1}: {question.type} {question.isEmbedded ? '(Imported)' : ''}
                              </Badge>
                              {ref && <Badge bg="light" text="dark" className="ms-2 border">{ref.label}</Badge>}
                              <div className="fw-bold text-dark">{question.questionText || question.prompt}</div>
                            </div>
                            <div className="d-flex gap-2">
                              {!question.isEmbedded && (
                                <>
                                  <Button variant="outline-secondary" size="sm" onClick={() => handleEditClick(question)} disabled={isPending}>
                                    Sửa
                                  </Button>
                                  <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(question)} disabled={isPending}>
                                    Xóa
                                  </Button>
                                </>
                              )}
                              {question.isEmbedded && (
                                <Badge bg="light" text="muted" className="border d-flex align-items-center px-3">
                                  <i className="bi bi-lock-fill me-1" /> Read-only preview
                                </Badge>
                              )}
                            </div>
                          </div>
                          {question.options?.length > 0 && (
                            <div className="row g-2 mt-3 small">
                              {question.options.map((option, optionIndex) => (
                                <Col md={6} key={`${question.id}-${option}`}>
                                  <span className={option === question.answer ? 'text-success fw-bold' : 'text-muted'}>
                                    {String.fromCharCode(65 + optionIndex)}. {option}
                                  </span>
                                </Col>
                              ))}
                            </div>
                          )}
                          {question.answer && (
                            <div className="small text-success fw-semibold mt-2">Đáp án: {question.answer}</div>
                          )}
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Col>

        <Col xl={5}>
          <div className="tp-card-static" style={{ position: 'sticky', top: '24px' }}>
            <div className="p-4">
              <h5 className="tp-page-title fs-5 mb-3">{editingQuestionId ? 'Chỉnh câu hỏi' : 'Thêm câu hỏi'}</h5>
              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={7}>
                    <Form.Label>Gắn vào</Form.Label>
                    <Form.Select value={form.referenceId} onChange={(e) => updateForm({ referenceId: e.target.value })} disabled={isPending}>
                      {referenceOptions.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={5}>
                    <Form.Label>Dạng câu hỏi</Form.Label>
                    <Form.Select
                      value={form.type}
                      onChange={(e) => updateForm({
                        type: e.target.value,
                        answer: e.target.value === 'true-false-not-given' ? 'True' : '',
                      })}
                      disabled={isPending || Boolean(editingQuestionId)}
                    >
                      {typeOptions.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col xs={12}>
                    <Form.Label>Nội dung câu hỏi</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={form.questionText}
                      onChange={(e) => updateForm({ questionText: e.target.value })}
                      disabled={isPending}
                    />
                  </Col>

                  {form.type === 'multiple-choice' && (
                    <Col xs={12}>
                      <Form.Label>Phương án</Form.Label>
                      {[0, 1, 2, 3].map((index) => (
                        <Form.Control
                          key={index}
                          className="mb-2"
                          placeholder={`Phương án ${String.fromCharCode(65 + index)}`}
                          value={form[`option${index}`]}
                          onChange={(e) => updateForm({ [`option${index}`]: e.target.value })}
                          disabled={isPending}
                        />
                      ))}
                    </Col>
                  )}

                  {form.type === 'true-false-not-given' && (
                    <Col xs={12}>
                      <Alert variant="light" className="border mb-0">Options cố định: True, False, Not Given.</Alert>
                    </Col>
                  )}

                  {form.type !== 'speaking-part' && (
                    <Col md={8}>
                      <Form.Label>Đáp án đúng</Form.Label>
                      {form.type === 'multiple-choice' ? (
                        <Form.Select value={form.answer} onChange={(e) => updateForm({ answer: e.target.value })} disabled={isPending}>
                          <option value="">Chọn đáp án</option>
                          {[form.option0, form.option1, form.option2, form.option3].filter(Boolean).map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </Form.Select>
                      ) : form.type === 'true-false-not-given' ? (
                        <Form.Select value={form.answer} onChange={(e) => updateForm({ answer: e.target.value })} disabled={isPending}>
                          <option value="True">True</option>
                          <option value="False">False</option>
                          <option value="Not Given">Not Given</option>
                        </Form.Select>
                      ) : (
                        <Form.Control value={form.answer} onChange={(e) => updateForm({ answer: e.target.value })} disabled={isPending} />
                      )}
                    </Col>
                  )}

                  <Col md={4}>
                    <Form.Label>Điểm</Form.Label>
                    <Form.Control
                      type="number"
                      value={form.score}
                      onChange={(e) => updateForm({ score: Number(e.target.value) })}
                      disabled={isPending}
                    />
                  </Col>

                  <Col xs={12}>
                    <Form.Label>Giải thích</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={form.explanation}
                      onChange={(e) => updateForm({ explanation: e.target.value })}
                      disabled={isPending}
                    />
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  {editingQuestionId && (
                    <Button type="button" variant="outline-secondary" onClick={() => resetForm()}>
                      Hủy sửa
                    </Button>
                  )}
                  <Button type="submit" variant="primary" disabled={submitting || isPending}>
                    {submitting ? 'Đang lưu...' : editingQuestionId ? 'Cập nhật' : 'Lưu câu hỏi'}
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </Col>
      </Row>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Xác nhận xóa câu hỏi</Modal.Title>
        </Modal.Header>
        <Modal.Body>Hành động này không thể hoàn tác.</Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Hủy</Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={submitting}>Xóa</Button>
        </Modal.Footer>
      </Modal>
      </div></div></div>
  );
}
