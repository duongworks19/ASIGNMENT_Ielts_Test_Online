import React from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import QuestionRenderer from '../../../components/feature/quiz/QuestionRenderer';

export default function TestPreviewModal({ show, onHide, draft }) {
  if (!draft) return null;
  const config = draft.testConfig || {};

  return (
    <Modal show={show} onHide={onHide} size="xl" scrollable centered fullscreen="lg-down">
      <Modal.Header closeButton className="bg-light border-bottom">
        <Modal.Title className="fw-bold text-primary">
          <i className="bi bi-eye me-2"></i> Preview: {draft.title || 'Untitled Test'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0 bg-light">
        {draft.skill === 'Reading' && (config.passages || []).map((passage, pIdx) => (
          <div key={passage.id || pIdx} className="bg-white mb-4 p-4 border-bottom shadow-sm">
            <h4 className="fw-bold mb-3 text-dark">{passage.title || `Passage ${pIdx + 1}`}</h4>
            <Row className="g-4">
              <Col lg={7}>
                <div className="p-4 bg-light rounded-3 border" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {passage.instruction && (
                    <div className="fw-semibold fst-italic text-secondary mb-4 p-3 bg-white rounded border-start border-4 border-info shadow-sm">
                      {passage.instruction}
                    </div>
                  )}
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '15px' }} className="text-dark">
                    {passage.content}
                  </div>
                </div>
              </Col>
              <Col lg={5}>
                <div className="p-3 bg-white rounded-3 border shadow-sm" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  <h5 className="fw-bold mb-4 border-bottom pb-2">Questions</h5>
                  {(passage.blocks || []).map((block, bIdx) => (
                    <div key={bIdx} className="mb-4">
                      {block.type && <span className="badge bg-secondary mb-3">{block.type}</span>}
                      {(block.questions || []).map((q, qIdx) => (
                        <div key={q.id || qIdx} className="mb-4 p-3 border rounded">
                           <QuestionRenderer 
                             question={{ ...q, prompt: q.text }} 
                             currentAnswer={''} 
                             onAnswer={() => {}} 
                           />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          </div>
        ))}
        {draft.skill !== 'Reading' && (
          <div className="p-5 text-center text-muted">
            <i className="bi bi-tools fs-1 mb-3 d-block text-secondary"></i>
            <h5>Chức năng Preview Modal cho {draft.skill} đang được cập nhật.</h5>
            <p>Hiện tại hỗ trợ tốt nhất cho Reading Test.</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-white">
        <Button variant="secondary" onClick={onHide}>Đóng</Button>
      </Modal.Footer>
    </Modal>
  );
}
