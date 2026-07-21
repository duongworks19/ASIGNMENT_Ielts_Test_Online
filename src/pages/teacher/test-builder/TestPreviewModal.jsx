import React from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import QuestionRenderer from '../../../components/feature/quiz/QuestionRenderer';
import { getQuestionType } from '../../../utils/ieltsQuestionBlocks';

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
                             question={{ ...q, prompt: q.text, type: block.rendererType || getQuestionType(block.type) }} 
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
        {draft.skill === 'Listening' && (
          <div className="p-4">
            {config.audioUrl && (
              <div className="mb-4 p-3 bg-white border rounded shadow-sm">
                <h5 className="fw-bold mb-3 text-dark"><i className="bi bi-headphones me-2 text-primary"></i> Global Audio Preview</h5>
                <audio controls className="w-100">
                  <source src={config.audioUrl} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            
            {(config.sections || []).map((sec, sIdx) => (
              <div key={sec.id || sIdx} className="bg-white mb-4 p-4 border rounded shadow-sm">
                <h4 className="fw-bold mb-3 text-dark">{sec.title || `Section ${sec.order || sIdx + 1}`}</h4>
                
                {sec.audioUrl && (
                  <div className="mb-4 p-3 bg-light border rounded">
                     <h6 className="fw-bold mb-2 text-secondary"><i className="bi bi-play-circle me-2"></i> Section Audio</h6>
                     <audio controls className="w-100">
                        <source src={sec.audioUrl} />
                     </audio>
                  </div>
                )}

                <Row className="g-4">
                  {sec.transcript && sec.showTranscript && (
                    <Col lg={6}>
                      <div className="p-4 bg-light rounded-3 border" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <h5 className="fw-bold mb-3 border-bottom pb-2">Transcript</h5>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '15px' }} className="text-dark">
                          {sec.transcript}
                        </div>
                      </div>
                    </Col>
                  )}
                  <Col lg={sec.transcript && sec.showTranscript ? 6 : 12}>
                    <div className="p-3 bg-white rounded-3 border shadow-sm" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <h5 className="fw-bold mb-4 border-bottom pb-2">Questions</h5>
                      {sec.instruction && (
                        <div className="fw-semibold fst-italic text-secondary mb-4 p-2 bg-light rounded border-start border-4 border-info">
                          {sec.instruction}
                        </div>
                      )}
                      {(sec.blocks || []).map((block, bIdx) => (
                        <div key={bIdx} className="mb-4">
                          {block.type && <span className="badge bg-secondary mb-3">{block.type}</span>}
                          {block.instruction && <div className="mb-3 fst-italic text-muted">{block.instruction}</div>}
                          {(block.questions || []).map((q, qIdx) => (
                            <div key={q.id || qIdx} className="mb-4 p-3 border rounded">
                               <QuestionRenderer 
                                 question={{ ...q, prompt: q.text, type: block.rendererType || getQuestionType(block.type) }} 
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
          </div>
        )}

        {draft.skill === 'Writing' && (
          <div className="p-4">
            {config.task1 && (
              <div className="bg-white mb-4 p-4 border rounded shadow-sm">
                <h4 className="fw-bold mb-3 text-dark border-bottom pb-2">Task 1</h4>
                <div className="mb-4">
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '15px' }} className="text-dark mb-4">
                    {config.task1.prompt}
                  </div>
                  {config.task1.imageUrl && (
                    <div className="text-center mb-4">
                      <img src={config.task1.imageUrl} alt="Task 1 Diagram" className="img-fluid border rounded shadow-sm" style={{ maxHeight: '400px' }} />
                    </div>
                  )}
                  {config.task1.minimumWords && (
                    <div className="text-muted fst-italic">
                      <i className="bi bi-info-circle me-1"></i>
                      Minimum words: {config.task1.minimumWords}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {config.task2 && (
              <div className="bg-white mb-4 p-4 border rounded shadow-sm">
                <h4 className="fw-bold mb-3 text-dark border-bottom pb-2">Task 2</h4>
                <div className="mb-4">
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '15px' }} className="text-dark mb-4">
                    {config.task2.prompt}
                  </div>
                  {config.task2.minimumWords && (
                    <div className="text-muted fst-italic">
                      <i className="bi bi-info-circle me-1"></i>
                      Minimum words: {config.task2.minimumWords}
                    </div>
                  )}
                </div>
              </div>
            )}

            {config.bandCriteria && (
              <div className="bg-light p-3 border rounded">
                <h6 className="fw-bold mb-2 text-secondary">Band Criteria / Grading Notes</h6>
                <div className="text-muted small">{config.bandCriteria}</div>
              </div>
            )}
          </div>
        )}

        {draft.skill === 'Speaking' && (
          <div className="p-4">
            {(config.parts || []).map((part, pIdx) => (
              <div key={part.id || pIdx} className="bg-white mb-4 p-4 border rounded shadow-sm">
                <h4 className="fw-bold mb-3 text-dark border-bottom pb-2">
                  Part {part.partNumber || pIdx + 1}: {part.title || 'Untitled Part'}
                </h4>
                
                <div className="ps-3 border-start border-3 border-primary">
                  {(part.questions || []).map((q, qIdx) => (
                    <div key={q.id || qIdx} className="mb-3">
                      <div className="fw-semibold text-dark">
                        <span className="me-2 text-primary">{qIdx + 1}.</span>
                        {q.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {draft.skill !== 'Reading' && draft.skill !== 'Listening' && draft.skill !== 'Writing' && draft.skill !== 'Speaking' && (
          <div className="p-5 text-center text-muted">
            <i className="bi bi-tools fs-1 mb-3 d-block text-secondary"></i>
            <h5>Chức năng Preview Modal cho {draft.skill} đang được cập nhật.</h5>
            <p>Hiện tại hệ thống đã hỗ trợ đầy đủ 4 kỹ năng.</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-white">
        <Button variant="secondary" onClick={onHide}>Đóng</Button>
      </Modal.Footer>
    </Modal>
  );
}
