import React from 'react';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';

export default function SpeakingBuilder({ value, onChange }) {
  const parts = value.parts || [];

  const updatePart = (partId, patch) => {
    onChange({
      ...value,
      parts: parts.map((part) => part.id === partId ? { ...part, ...patch } : part),
    });
  };

  const updateQuestion = (partId, questionId, patch) => {
    const part = parts.find((item) => item.id === partId);
    if (!part) return;
    updatePart(partId, {
      questions: (part.questions || []).map((question) => question.id === questionId ? { ...question, ...patch } : question),
    });
  };

  const addQuestion = (partId) => {
    const part = parts.find((item) => item.id === partId);
    if (!part) return;
    const next = (part.questions || []).length + 1;
    updatePart(partId, {
      questions: [
        ...(part.questions || []),
        { id: `${partId}-q-${next}`, text: '', answerSeconds: part.partNumber === 3 ? 60 : 45 },
      ],
    });
  };

  const removeQuestion = (partId, questionId) => {
    const part = parts.find((item) => item.id === partId);
    if (!part) return;
    updatePart(partId, {
      questions: (part.questions || []).filter((question) => question.id !== questionId),
    });
  };

  return (
    <div className="d-flex flex-column gap-3">
      {parts.map((part) => (
        <Card className="border-0 shadow-sm" key={part.id}>
          <Card.Body>
            <h6 className="fw-bold mb-3">Speaking Part {part.partNumber}: {part.title}</h6>

            {part.partNumber === 2 ? (
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label>Prep seconds</Form.Label>
                  <Form.Control
                    type="number"
                    value={part.prepSeconds || 60}
                    onChange={(e) => updatePart(part.id, { prepSeconds: Number(e.target.value) })}
                  />
                </Col>
                <Col md={6}>
                  <Form.Label>Answer seconds</Form.Label>
                  <Form.Control
                    type="number"
                    value={part.answerSeconds || 120}
                    onChange={(e) => updatePart(part.id, { answerSeconds: Number(e.target.value) })}
                  />
                </Col>
                <Col xs={12}>
                  <Form.Label>Cue card</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={part.cueCard || ''}
                    onChange={(e) => updatePart(part.id, { cueCard: e.target.value })}
                  />
                </Col>
                <Col xs={12}>
                  <Form.Label>Bullet prompts, mỗi dòng một ý</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={(part.bulletPrompts || []).join('\n')}
                    onChange={(e) => updatePart(part.id, { bulletPrompts: e.target.value.split('\n') })}
                  />
                </Col>
              </Row>
            ) : (
              <div className="d-flex flex-column gap-3">
                {(part.questions || []).map((question, index) => (
                  <Row className="g-2 align-items-end" key={question.id}>
                    <Col md={8}>
                      <Form.Label>Câu hỏi {index + 1}</Form.Label>
                      <Form.Control
                        value={question.text || ''}
                        onChange={(e) => updateQuestion(part.id, question.id, { text: e.target.value })}
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Label>Seconds</Form.Label>
                      <Form.Control
                        type="number"
                        value={question.answerSeconds || 45}
                        onChange={(e) => updateQuestion(part.id, question.id, { answerSeconds: Number(e.target.value) })}
                      />
                    </Col>
                    <Col md={1}>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeQuestion(part.id, question.id)}
                        disabled={(part.questions || []).length <= 1}
                      >
                        X
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Button variant="outline-primary" size="sm" onClick={() => addQuestion(part.id)}>
                  Thêm câu hỏi Part {part.partNumber}
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
