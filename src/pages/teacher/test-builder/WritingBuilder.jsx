import React from 'react';
import { Alert, Card, Col, Form, Row } from 'react-bootstrap';

export default function WritingBuilder({ value, onChange }) {
  const task1 = value.task1 || {};
  const task2 = value.task2 || {};

  const updateTask = (key, patch) => {
    onChange({
      ...value,
      [key]: {
        ...(value[key] || {}),
        ...patch,
      },
    });
  };

  return (
    <div className="d-flex flex-column gap-3">
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <h6 className="fw-bold mb-3">Writing Task 1</h6>
          <Row className="g-3">
            <Col md={8}>
              <Form.Label>Task 1 visual link</Form.Label>
              <Form.Control
                placeholder="https://example.com/chart-map-process.png"
                value={task1.imageUrl || ''}
                onChange={(e) => updateTask('task1', { imageUrl: e.target.value })}
              />
              <Form.Text className="text-muted">
                Gan link anh chart, table, map hoac process cho IELTS Academic Task 1.
              </Form.Text>
            </Col>
            <Col md={4}>
              <Form.Label>Minimum words</Form.Label>
              <Form.Control
                type="number"
                value={task1.minimumWords || 150}
                onChange={(e) => updateTask('task1', { minimumWords: Number(e.target.value) })}
              />
            </Col>
            <Col xs={12}>
              {task1.imageUrl ? (
                <div className="rounded-3 border p-3" style={{ background: '#f8fafc' }}>
                  <div className="d-flex align-items-center gap-2 mb-2 fw-semibold">
                    <i className="bi bi-image" />
                    Task 1 image preview
                  </div>
                  <img
                    src={task1.imageUrl}
                    alt="Writing Task 1 visual preview"
                    className="img-fluid rounded-3 border"
                    style={{ maxHeight: 320, objectFit: 'contain', background: '#fff' }}
                  />
                </div>
              ) : (
                <Alert variant="light" className="border mb-0">
                  <i className="bi bi-link-45deg me-2" />
                  Chua gan link anh cho Task 1. Neu la Academic, hay dan link chart/map/process vao o tren.
                </Alert>
              )}
            </Col>
            <Col xs={12}>
              <Form.Label>Prompt Task 1</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={task1.prompt || ''}
                onChange={(e) => updateTask('task1', { prompt: e.target.value })}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <h6 className="fw-bold mb-3">Writing Task 2</h6>
          <Row className="g-3">
            <Col md={4}>
              <Form.Label>Minimum words</Form.Label>
              <Form.Control
                type="number"
                value={task2.minimumWords || 250}
                onChange={(e) => updateTask('task2', { minimumWords: Number(e.target.value) })}
              />
            </Col>
            <Col xs={12}>
              <Form.Label>Prompt Task 2</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={task2.prompt || ''}
                onChange={(e) => updateTask('task2', { prompt: e.target.value })}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Form.Label>Band criteria / Ghi chú chấm điểm</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={value.bandCriteria || ''}
            onChange={(e) => onChange({ ...value, bandCriteria: e.target.value })}
          />
        </Card.Body>
      </Card>
    </div>
  );
}
