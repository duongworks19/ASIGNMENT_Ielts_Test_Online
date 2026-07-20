import React from 'react';
import { Card } from 'react-bootstrap';
import { getReferenceOptions, normalizeTest } from '../../../utils/testModel';

export default function LiveChecklist({ test, questionCount = 0, onGoToStep }) {
  const normalized = normalizeTest(test);
  const references = getReferenceOptions(normalized);
  const config = normalized.testConfig || {};

  const common = [
    { label: 'Co tieu de', ok: normalized.title?.trim().length >= 5, step: 1 },
    { label: 'Da chon ky nang', ok: Boolean(normalized.skill), step: 1 },
    { label: 'Co thoi gian lam bai', ok: Number(normalized.durationMinutes) > 0, step: 1 },
    { label: 'Co mode hien thi', ok: Boolean(normalized.testMode), step: 1 },
  ];

  const skillItems = [];
  if (normalized.skill === 'Reading') {
    const passages = config.passages || [];
    skillItems.push(
      { label: 'Co it nhat 1 passage', ok: passages.length > 0, step: 2 },
      { label: 'Passage co noi dung', ok: passages.some((p) => p.content?.trim()), step: 2 },
      { label: 'Co cau hoi gan passage', ok: questionCount > 0, step: 2 },
    );
  }
  if (normalized.skill === 'Listening') {
    const sections = config.sections || [];
    skillItems.push(
      { label: 'Audio nghe duoc', ok: Boolean(config.audioUrl || sections.some((s) => s.audioUrl)), step: 2 },
      { label: 'Co section nghe', ok: sections.length > 0, step: 2 },
      { label: 'Co cau hoi gan section', ok: questionCount > 0, step: 2 },
    );
  }
  if (normalized.skill === 'Writing') {
    skillItems.push(
      { label: 'Task 1 co prompt', ok: Boolean(config.task1?.prompt?.trim()), step: 2 },
      { label: 'Task 2 co prompt', ok: Boolean(config.task2?.prompt?.trim()), step: 2 },
      { label: 'Minimum words hop le', ok: Number(config.task1?.minimumWords) >= 100 && Number(config.task2?.minimumWords) >= 200, step: 2 },
    );
  }
  if (normalized.skill === 'Speaking') {
    const parts = config.parts || [];
    const part2 = parts.find((p) => Number(p.partNumber) === 2);
    skillItems.push(
      { label: 'Co du 3 parts', ok: parts.length >= 3, step: 2 },
      { label: 'Part 2 co cue card', ok: Boolean(part2?.cueCard?.trim()), step: 2 },
      { label: 'Part 1/3 co cau hoi', ok: parts.some((p) => p.partNumber !== 2 && p.questions?.some((q) => q.text?.trim())), step: 2 },
    );
  }

  const items = [
    ...common,
    { label: 'Co vung noi dung', ok: references.length > 0, step: 2 },
    ...skillItems,
  ];
  const done = items.filter((item) => item.ok).length;
  const progress = Math.round((done / items.length) * 100);

  return (
    <Card className="lux-checklist sticky-top" style={{ top: 16 }}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <div className="small text-uppercase fw-bold lux-eyebrow">Publish system</div>
            <h6 className="fw-bold mb-0">Checklist</h6>
          </div>
          <span className="lux-progress-badge">{progress}%</span>
        </div>

        <div className="lux-progress-track mb-3">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="d-flex flex-column gap-2">
          {items.map((item, index) => (
            <button
              type="button"
              key={item.label}
              onClick={() => onGoToStep(item.step)}
              className={`lux-check-item ${item.ok ? 'is-ok' : ''}`}
              style={{ '--check-index': index }}
            >
              <span className="lux-check-icon">
                <i className={`bi ${item.ok ? 'bi-check2' : 'bi-exclamation-lg'}`} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}
