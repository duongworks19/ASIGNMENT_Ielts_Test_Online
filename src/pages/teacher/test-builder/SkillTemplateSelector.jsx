import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';

const SKILL_CARDS = [
  {
    skill: 'Reading',
    title: 'Reading',
    detail: '3 passages, objective blocks, IELTS ranges.',
    meta: 'Passage lab',
    color: '#0ea5e9',
    soft: '#e0f2fe',
    icon: 'bi-book',
  },
  {
    skill: 'Listening',
    title: 'Listening',
    detail: '4 sections, playable audio, marker import.',
    meta: 'Audio suite',
    color: '#d97706',
    soft: '#fff7ed',
    icon: 'bi-headphones',
  },
  {
    skill: 'Writing',
    title: 'Writing',
    detail: 'Task 1 + Task 2 with IELTS criteria.',
    meta: 'Essay desk',
    color: '#7c3aed',
    soft: '#f5f3ff',
    icon: 'bi-pencil-square',
  },
  {
    skill: 'Speaking',
    title: 'Speaking',
    detail: 'Part 1, cue card, discussion prompts.',
    meta: 'Interview room',
    color: '#059669',
    soft: '#ecfdf5',
    icon: 'bi-mic',
  },
];

export default function SkillTemplateSelector({ value, onChange }) {
  return (
    <Row className="g-3">
      {SKILL_CARDS.map((item, index) => {
        const active = value === item.skill;
        return (
          <Col md={6} xl={3} key={item.skill}>
            <Card
              role="button"
              aria-pressed={active}
              tabIndex={0}
              className={`lux-skill-card h-100 ${active ? 'is-active' : ''}`}
              onClick={() => onChange(item.skill)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onChange(item.skill);
                }
              }}
              style={{
                '--skill-color': item.color,
                '--skill-soft': item.soft,
                '--skill-index': index,
              }}
            >
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <span className="lux-skill-icon">
                    <i className={`bi ${item.icon}`} />
                  </span>
                  <span className="lux-skill-status">
                    <i className={`bi ${active ? 'bi-check2' : 'bi-plus-lg'}`} />
                  </span>
                </div>

                <div className="small text-uppercase fw-bold lux-skill-meta">{item.meta}</div>
                <h6 className="fw-bold mb-2">{item.title}</h6>
                <p className="small text-secondary mb-0">{item.detail}</p>

                <div className="lux-skill-line mt-auto">
                  <span />
                </div>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
