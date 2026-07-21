import React, { useState } from 'react';
import { Badge, Button, Card, Col, Form, Row } from 'react-bootstrap';
import QuestionBlockEditor from './QuestionBlockEditor';
import { READING_SAMPLES } from '../../../utils/sampleQuestions';

// Utils removed as blocks are now managed locally per passage

export default function ReadingBuilder({ value, onChange }) {
  const passages = value.passages || [];
  const [expandedBulkId, setExpandedBulkId] = useState(null);

  const updatePassage = (id, patch) => {
    onChange({
      ...value,
      passages: passages.map((passage) => (passage.id === id ? { ...passage, ...patch } : passage)),
    });
  };

  const addPassage = () => {
    const order = passages.length + 1;
    const defaultEnd = order === 3 ? 40 : order * 13;
    onChange({
      ...value,
      passages: [
        ...passages,
        {
          id: `passage-${order}`,
          title: `Passage ${order}`,
          content: '',
          instruction: '',
          imageUrl: '',
          defaultRange: `${(order - 1) * 13 + 1}-${defaultEnd}`,
          blocks: [],
          order,
        },
      ],
    });
  };

  const removePassage = (id) => {
    onChange({ ...value, passages: passages.filter((passage) => passage.id !== id) });
  };

  // distributeBlocks removed since each passage manages its own blocks

  return (
    <div className="d-flex flex-column gap-4">
      {passages.map((passage, index) => {
        const blockCount = (passage.blocks || []).length;
        return (
        <Card className="border-0 shadow-sm" key={passage.id}>
          <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <h5 className="mb-0 fw-bold">Passage {index + 1}</h5>
              <Badge bg="secondary" className="px-3 py-2 rounded-pill fw-medium fs-6">
                Questions {passage.defaultRange || '1-13'}
              </Badge>
              <Badge bg="info" className="px-3 py-2 rounded-pill fw-medium fs-6 text-dark">
                {blockCount} Blocks
              </Badge>
            </div>
            {passages.length > 1 && (
              <Button variant="outline-danger" size="sm" onClick={() => removePassage(passage.id)}>
                <i className="bi bi-trash me-1"></i> Delete
              </Button>
            )}
          </Card.Header>
          <Card.Body className="pt-3">
            <div className="d-flex flex-column gap-3">
              <div>
                <Form.Label className="fw-semibold text-secondary small text-uppercase mb-1">Passage Instruction</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Read the passage below and answer Questions 1–13."
                  value={passage.instruction || ''}
                  onChange={(event) => updatePassage(passage.id, { instruction: event.target.value })}
                />
              </div>

              <div>
                <Form.Label className="fw-semibold text-secondary small text-uppercase mb-1">Passage Title</Form.Label>
                <Form.Control
                  placeholder={`Title of passage ${index + 1}`}
                  value={passage.title || ''}
                  onChange={(event) => updatePassage(passage.id, { title: event.target.value })}
                />
              </div>

              <div>
                <Form.Label className="fw-semibold text-secondary small text-uppercase mb-1">Content</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  placeholder="Paste passage content here..."
                  value={passage.content || ''}
                  onChange={(event) => updatePassage(passage.id, { content: event.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-3 mt-2">
                <Button 
                  variant="primary" 
                  onClick={() => setExpandedBulkId(expandedBulkId === passage.id ? null : passage.id)}
                >
                  <i className="bi bi-ui-checks-grid me-2"></i> 
                  {expandedBulkId === passage.id ? 'Đóng Quản lý Câu hỏi' : 'Quản lý Câu hỏi (Questions)'}
                </Button>
              </div>

              {/* Bulk Add Editor Area */}
              {expandedBulkId === passage.id && (
                <div className="mt-3 p-0 rounded-3 border overflow-hidden">
                  <QuestionBlockEditor
                    title={`Question Import: ${passage.title || `Passage ${index + 1}`}`}
                    description={`${blockCount} blocks, ${(passage.blocks || []).reduce((sum, b) => sum + (b.questions || []).length, 0)} questions. Paste questions specific to this passage here.`}
                    variant="primary"
                    blocks={passage.blocks || []}
                    defaultSampleText={READING_SAMPLES[index]}
                    onChange={(newBlocks) => updatePassage(passage.id, { blocks: newBlocks })}
                    skill="Reading"
                    referenceIndex={index}
                  />
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      )})}
      <Button variant="outline-primary" onClick={addPassage}>Add passage</Button>
    </div>
  );
}
