import React, { useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row } from 'react-bootstrap';
import { parseAdvancedQuestionText } from '../../../utils/ieltsQuestionBlocks';
import { READING_SAMPLES, LISTENING_SAMPLES, DEFAULT_SAMPLE } from '../../../utils/sampleQuestions';

const SAMPLE_TEXT = `[MCQ]
1. Why does the speaker call the office?
A. To cancel a booking
*B. To change a reservation
C. To ask for directions
Explanation: The speaker says she needs another date.

[NOTE COMPLETION]
2. Customer name: ____.
*Martin Hale
Explanation: The receptionist repeats the name.`;

const MARKER_CHIPS = ['[MCQ]', '[T/F/NG]', '[Y/N/NG]', '[NOTE COMPLETION]', '[SENTENCE COMPLETION]', '[SAQ]'];

const getQuestionCount = (blocks = []) => blocks.reduce((sum, block) => sum + (block.questions || []).length, 0);

export default function QuestionBlockEditor({
  title,
  description,
  blocks = [],
  onChange,
  variant = 'primary',
  defaultSampleText,
  skill = 'Reading',
  referenceIndex = 0,
}) {
  const [rawText, setRawText] = useState('');
  const [parsedBlocks, setParsedBlocks] = useState([]);
  const [errors, setErrors] = useState(null);
  const [editingContext, setEditingContext] = useState(null);

  const totalQuestions = useMemo(() => getQuestionCount(blocks), [blocks]);

  const appendMarker = (marker) => {
    setRawText((value) => {
      const prefix = value.trim() ? `${value.trimEnd()}\n\n` : '';
      return `${prefix}${marker}\n`;
    });
  };

  const parseText = () => {
    const result = parseAdvancedQuestionText(rawText);
    setParsedBlocks(result.blocks || []);
    setErrors(result.errors || null);
  };

  const confirmBlocks = () => {
    if (!parsedBlocks.length || errors?.length) return;
    onChange([...(blocks || []), ...parsedBlocks]);
    setRawText('');
    setParsedBlocks([]);
    setErrors(null);
  };

  const removeBlock = (blockId) => {
    onChange((blocks || []).filter((block) => block.id !== blockId));
  };

  const handleEditQuestion = (blockId, question) => {
    setEditingContext({
      blockId,
      question: { ...question, options: question.options?.length >= 4 ? question.options : ['', '', '', ''] }
    });
  };

  const handleSaveQuestion = () => {
    if (!editingContext) return;
    const { blockId, question } = editingContext;
    const newBlocks = blocks.map(block => {
      if (block.id !== blockId) return block;
      return {
        ...block,
        questions: block.questions.map(q => q.id === question.id ? question : q)
      };
    });
    onChange(newBlocks);
    setEditingContext(null);
  };

  return (
    <>
      <div className="lux-block-editor">
      <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-3">
        <div>
          <div className="small text-uppercase fw-bold lux-eyebrow">Advanced import</div>
          <h6 className="fw-bold mb-1">{title}</h6>
          <div className="text-secondary small">{description || `${blocks.length} block, ${totalQuestions} questions. Paste all 40 questions once; ranges will route them automatically.`}</div>
        </div>
        <span className="lux-mini-counter">{totalQuestions}</span>
      </div>

      <Card className="lux-import-card">
        <Card.Body>
          <Form.Label className="fw-semibold">Paste full question text</Form.Label>
          <Form.Control
            as="textarea"
            rows={9}
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="[MCQ]\n1. Question text\nA. Option\n*B. Correct option\nExplanation: ..."
          />

          <div className="lux-marker-dock mt-3">
            <div>
              <div className="small text-uppercase fw-bold text-secondary mb-2">Markers append to the end</div>
              <div className="d-flex gap-2 flex-wrap">
                {MARKER_CHIPS.map((marker) => (
                  <button
                    key={marker}
                    type="button"
                    className="lux-marker-chip"
                    onClick={() => appendMarker(marker)}
                  >
                    {marker}
                  </button>
                ))}
              </div>
            </div>

            <div className="d-flex gap-2 flex-wrap justify-content-end mt-3">
              <Button
                type="button"
                variant={`outline-${variant}`}
                onClick={() => {
                  let sampleText = defaultSampleText || DEFAULT_SAMPLE || SAMPLE_TEXT;
                  if (skill === 'Reading' && READING_SAMPLES[referenceIndex]) {
                    sampleText = READING_SAMPLES[referenceIndex];
                  } else if (skill === 'Listening' && LISTENING_SAMPLES[referenceIndex]) {
                    sampleText = LISTENING_SAMPLES[referenceIndex];
                  }
                  setRawText((value) => value || sampleText);
                }}
              >
                <i className="bi bi-stars me-1" />
                Sample
              </Button>
              <Button type="button" variant="outline-secondary" onClick={() => {
                setRawText('');
                setParsedBlocks([]);
                setErrors(null);
              }}>
                Clear
              </Button>
              <Button type="button" variant={variant} onClick={parseText} disabled={!rawText.trim()}>
                <i className="bi bi-check2-circle me-1" />
                Kiểm tra câu hỏi
              </Button>
            </div>

            {errors?.length > 0 && (
              <Alert variant="danger" className="mt-3 mb-0 shadow-sm border-0 border-start border-danger border-4">
                <div className="fw-bold mb-1"><i className="bi bi-exclamation-triangle-fill me-2"></i> Lỗi cú pháp:</div>
                <ul className="mb-0 ps-3">
                  {errors.map((error, idx) => <li key={idx}>{error}</li>)}
                </ul>
              </Alert>
            )}
          </div>
        </Card.Body>
      </Card>

      {parsedBlocks.length > 0 && !errors?.length && (
        <Card className="lux-preview-card mt-4 border border-2 border-success shadow-sm">
          <Card.Body>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 p-3 bg-success bg-opacity-10 rounded">
              <div>
                <h6 className="fw-bold mb-1 text-success">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Phân tích cú pháp thành công!
                </h6>
                <div className="text-muted small">
                  Bạn cần bấm nút <strong>Lưu</strong> bên cạnh để chính thức thêm {getQuestionCount(parsedBlocks)} câu hỏi này vào đoạn văn.
                </div>
              </div>
              <Button type="button" variant="success" size="lg" onClick={confirmBlocks} className="fw-bold px-4 shadow">
                <i className="bi bi-cloud-arrow-down-fill me-2" />
                LƯU {getQuestionCount(parsedBlocks)} CÂU HỎI VÀO BÀI
              </Button>
            </div>
            <div className="d-flex flex-column gap-3">
              {parsedBlocks.map((block, blockIndex) => (
                <div key={block.id} className="lux-preview-block p-3 border rounded bg-light" style={{ '--block-index': blockIndex }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Badge bg={variant}>{block.type}</Badge>
                    <span className="text-muted small">Range {block.range}</span>
                  </div>
                  {(block.questions || []).slice(0, 3).map((question) => (
                    <div key={question.id} className="small mb-2">
                      <span className="fw-semibold">{question.questionOrder}. {question.text}</span>
                      <span className="text-success ms-2">Answer: {question.correctAnswer}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {blocks.length > 0 && (
        <div className="d-flex flex-column gap-2 mt-3">
          {blocks.map((block, index) => (
            <Card key={block.id || index} className="lux-saved-block">
              <Card.Body className="py-3">
                <Row className="g-3 align-items-start">
                  <Col md={8}>
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                      <Badge bg="dark">Block {index + 1}</Badge>
                      <span className="fw-semibold">{block.type}</span>
                      <span className="text-muted small">Range {block.range}</span>
                    </div>
                    <div className="d-flex flex-column gap-2">
                      {(block.questions || []).map((question) => (
                        <div key={question.id} className="d-flex justify-content-between align-items-start bg-light p-2 rounded border">
                          <div className="small">
                            <strong>{question.questionOrder}.</strong> {question.text} 
                            <div className="text-success mt-1">Đáp án: {question.correctAnswer}</div>
                          </div>
                          <Button variant="outline-primary" size="sm" className="ms-2" onClick={() => handleEditQuestion(block.id, question)}>
                            <i className="bi bi-pencil" /> Sửa
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Col>
                  <Col md={4} className="d-flex justify-content-md-end">
                    <Button type="button" variant="outline-danger" size="sm" onClick={() => removeBlock(block.id)}>
                      <i className="bi bi-trash me-1" />
                      Remove
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
      
      {/* Edit Question Modal */}
      <Modal show={!!editingContext} onHide={() => setEditingContext(null)} size="lg" centered backdrop="static">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fs-5 fw-bold"><i className="bi bi-pencil-square me-2"></i>Sửa câu hỏi {editingContext?.question?.questionOrder}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingContext?.question && (
            <div className="d-flex flex-column gap-3">
              <Form.Group>
                <Form.Label className="fw-semibold">Nội dung câu hỏi</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  value={editingContext.question.text || ''} 
                  onChange={(e) => setEditingContext(prev => ({ ...prev, question: { ...prev.question, text: e.target.value } }))}
                />
              </Form.Group>
              
              <Form.Group>
                <Form.Label className="fw-semibold">Đáp án đúng</Form.Label>
                <Form.Control 
                  value={editingContext.question.correctAnswer || ''} 
                  onChange={(e) => setEditingContext(prev => ({ ...prev, question: { ...prev.question, correctAnswer: e.target.value } }))}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="fw-semibold">Giải thích (Explanation)</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={2} 
                  value={editingContext.question.explanation || ''} 
                  onChange={(e) => setEditingContext(prev => ({ ...prev, question: { ...prev.question, explanation: e.target.value } }))}
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setEditingContext(null)}>Hủy</Button>
          <Button variant="primary" onClick={handleSaveQuestion}>Lưu thay đổi</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
