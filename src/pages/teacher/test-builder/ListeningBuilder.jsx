import React from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import QuestionBlockEditor from './QuestionBlockEditor';
import { LISTENING_SAMPLES } from '../../../utils/sampleQuestions';

const parseRange = (range, fallbackStart, fallbackEnd) => {
  const match = String(range || '').match(/(\d+)\s*-\s*(\d+)/);
  if (!match) return [fallbackStart, fallbackEnd];
  return [Number(match[1]), Number(match[2])];
};

const splitBlockByRange = (block, targetId, start, end) => {
  const questions = (block.questions || []).filter((question) => {
    const order = Number(question.questionOrder || 0);
    return order >= start && order <= end;
  });
  if (!questions.length) return null;

  const orders = questions.map((question) => Number(question.questionOrder)).filter(Boolean);
  return {
    ...block,
    id: String(block.id || '').includes(`:${targetId}`) ? block.id : `${block.id}:${targetId}`,
    range: `${Math.min(...orders)}-${Math.max(...orders)}`,
    questions,
  };
};

const flattenBlocks = (sections = []) => sections.flatMap((section) => section.blocks || []);

function AudioPreview({ audioUrl, label }) {
  if (!audioUrl) return null;

  return (
    <Alert variant="warning" className="border-0 mb-0">
      <div className="d-flex align-items-center gap-2 mb-2">
        <i className="bi bi-headphones" />
        <span className="fw-semibold">{label}</span>
      </div>
      <audio src={audioUrl} controls className="w-100" />
    </Alert>
  );
}

export default function ListeningBuilder({ value, onChange }) {
  const sections = value.sections || [];

  const updateSection = (id, patch) => {
    onChange({
      ...value,
      sections: sections.map((section) => (section.id === id ? { ...section, ...patch } : section)),
    });
  };

  const [expandedBulkId, setExpandedBulkId] = React.useState(null);

  const addSection = () => {
    const order = sections.length + 1;
    onChange({
      ...value,
      sections: [
        ...sections,
        {
          id: `section-${order}`,
          title: `Section ${order}`,
          instruction: `Listen and answer questions ${((order - 1) * 10) + 1}-${order * 10}.`,
          transcript: '',
          showTranscript: false,
          defaultRange: `${((order - 1) * 10) + 1}-${order * 10}`,
          audioUrl: '',
          blocks: [],
          order,
        },
      ],
    });
  };

  const removeSection = (id) => {
    onChange({ ...value, sections: sections.filter((section) => section.id !== id) });
  };

  return (
    <div className="d-flex flex-column gap-3">
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            <Col md={8}>
              <Form.Label>Global audio URL</Form.Label>
              <Form.Control
                value={value.audioUrl || ''}
                onChange={(event) => onChange({ ...value, audioUrl: event.target.value })}
                placeholder="https://example.com/listening-test.mp3"
              />
            </Col>
            <Col md={4}>
              <Form.Label>Audio policy</Form.Label>
              <Form.Select
                value={value.audioPolicy || 'allow-replay'}
                onChange={(event) => onChange({ ...value, audioPolicy: event.target.value })}
              >
                <option value="allow-replay">Allow replay</option>
                <option value="play-once">Play once</option>
              </Form.Select>
            </Col>
            <Col xs={12}>
              <AudioPreview audioUrl={value.audioUrl || ''} label="Global listening audio preview" />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {sections.map((section, index) => {
        const blockCount = (section.blocks || []).length;
        return (
        <Card className="border-0 shadow-sm" key={section.id}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-3">
                <h6 className="fw-bold mb-0">Listening Section {index + 1}</h6>
                <span className="badge bg-secondary rounded-pill px-3 py-2 fw-medium fs-6">
                  Questions {section.defaultRange || '1-10'}
                </span>
                <span className="badge bg-info text-dark rounded-pill px-3 py-2 fw-medium fs-6">
                  {blockCount} Blocks
                </span>
              </div>
              {sections.length > 1 && (
                <Button variant="outline-danger" size="sm" onClick={() => removeSection(section.id)}>
                  <i className="bi bi-trash me-1"></i> Delete section
                </Button>
              )}
            </div>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label className="fw-semibold text-secondary small text-uppercase mb-1">Section title</Form.Label>
                <Form.Control
                  value={section.title || ''}
                  onChange={(event) => updateSection(section.id, { title: event.target.value })}
                />
              </Col>
              <Col md={3}>
                <Form.Label className="fw-semibold text-secondary small text-uppercase mb-1">Question range</Form.Label>
                <Form.Control
                  value={section.defaultRange || ''}
                  placeholder="1-10"
                  onChange={(event) => updateSection(section.id, { defaultRange: event.target.value })}
                />
              </Col>
              <Col md={3}>
                <Form.Check
                  className="mt-4 pt-2 fw-semibold text-secondary small text-uppercase"
                  type="switch"
                  label="Show transcript"
                  checked={Boolean(section.showTranscript)}
                  onChange={(event) => updateSection(section.id, { showTranscript: event.target.checked })}
                />
              </Col>
              <Col xs={12}>
                <Form.Label className="fw-semibold text-secondary small text-uppercase mb-1">Section audio URL</Form.Label>
                <Form.Control
                  value={section.audioUrl || ''}
                  onChange={(event) => updateSection(section.id, { audioUrl: event.target.value })}
                  placeholder="Leave empty to use global audio"
                />
              </Col>
              <Col xs={12}>
                <AudioPreview audioUrl={section.audioUrl || ''} label={`${section.title || 'Section'} audio preview`} />
              </Col>
              <Col xs={12}>
                <Form.Label className="fw-semibold text-secondary small text-uppercase mb-1">Instruction</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={section.instruction || ''}
                  onChange={(event) => updateSection(section.id, { instruction: event.target.value })}
                />
              </Col>
              <Col xs={12}>
                <Form.Label className="fw-semibold text-secondary small text-uppercase mb-1">Transcript</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={section.transcript || ''}
                  onChange={(event) => updateSection(section.id, { transcript: event.target.value })}
                />
              </Col>
            </Row>

            {/* Action Buttons */}
            <div className="d-flex gap-3 mt-4">
              <Button 
                variant="primary" 
                onClick={() => setExpandedBulkId(expandedBulkId === section.id ? null : section.id)}
              >
                <i className="bi bi-ui-checks-grid me-2"></i> 
                {expandedBulkId === section.id ? 'Đóng Quản lý Câu hỏi' : 'Quản lý Câu hỏi (Questions)'}
              </Button>
            </div>

            {/* Bulk Add Editor Area */}
            {expandedBulkId === section.id && (
              <div className="mt-3 p-0 rounded-3 border overflow-hidden">
                <QuestionBlockEditor
                  title={`Question Import: ${section.title || `Section ${index + 1}`}`}
                  description={`${blockCount} blocks, ${(section.blocks || []).reduce((sum, b) => sum + (b.questions || []).length, 0)} questions. Paste questions specific to this section here.`}
                  variant="warning"
                  blocks={section.blocks || []}
                  defaultSampleText={LISTENING_SAMPLES[index]}
                  onChange={(newBlocks) => updateSection(section.id, { blocks: newBlocks })}
                  skill="Listening"
                  referenceIndex={index}
                />
              </div>
            )}
          </Card.Body>
        </Card>
      )})}
      <Button variant="outline-primary" onClick={addSection}>Add section</Button>
    </div>
  );
}
