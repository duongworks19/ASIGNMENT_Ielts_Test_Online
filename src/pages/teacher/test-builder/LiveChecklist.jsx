import React from 'react';
import { getReferenceOptions, normalizeTest } from '../../../utils/testModel';

export default function LiveChecklist({ test, questionCount = 0, onGoToStep }) {
  const normalized = normalizeTest(test);
  const references = getReferenceOptions(normalized);
  const config = normalized.testConfig || {};

  const common = [
    { label: 'Có tiêu đề', ok: normalized.title?.trim().length >= 5, step: 1 },
    { label: 'Đã chọn kỹ năng', ok: Boolean(normalized.skill), step: 1 },
    { label: 'Có thời gian làm bài', ok: Number(normalized.durationMinutes) > 0, step: 1 },
    { label: 'Có chế độ hiển thị', ok: Boolean(normalized.testMode), step: 1 },
  ];

  const skillItems = [];
  if (normalized.skill === 'Reading') {
    const passages = config.passages || [];
    skillItems.push(
      { label: 'Có ít nhất 1 Passage', ok: passages.length > 0, step: 2 },
      { label: 'Passage có nội dung', ok: passages.some((p) => p.content?.trim()), step: 2 },
      { label: 'Có câu hỏi gắn với Passage', ok: questionCount > 0, step: 2 },
    );
  }
  if (normalized.skill === 'Listening') {
    const sections = config.sections || [];
    skillItems.push(
      { label: 'Audio có thể phát được', ok: Boolean(config.audioUrl || sections.some((s) => s.audioUrl)), step: 2 },
      { label: 'Có Section (Phần thi)', ok: sections.length > 0, step: 2 },
      { label: 'Có câu hỏi gắn với Section', ok: questionCount > 0, step: 2 },
    );
  }
  if (normalized.skill === 'Writing') {
    skillItems.push(
      { label: 'Task 1 có đề bài (Prompt)', ok: Boolean(config.task1?.prompt?.trim()), step: 2 },
      { label: 'Task 2 có đề bài (Prompt)', ok: Boolean(config.task2?.prompt?.trim()), step: 2 },
      { label: 'Giới hạn từ tối thiểu hợp lệ', ok: Number(config.task1?.minimumWords) >= 100 && Number(config.task2?.minimumWords) >= 200, step: 2 },
    );
  }
  if (normalized.skill === 'Speaking') {
    const parts = config.parts || [];
    const part2 = parts.find((p) => Number(p.partNumber) === 2);
    skillItems.push(
      { label: 'Có đủ 3 Parts', ok: parts.length >= 3, step: 2 },
      { label: 'Part 2 có Cue Card', ok: Boolean(part2?.cueCard?.trim()), step: 2 },
      { label: 'Part 1 & 3 có câu hỏi', ok: parts.some((p) => p.partNumber !== 2 && p.questions?.some((q) => q.text?.trim())), step: 2 },
    );
  }

  const items = [
    ...common,
    { label: 'Có vùng nội dung (Nguồn)', ok: references.length > 0, step: 2 },
    ...skillItems,
  ];
  const done = items.filter((item) => item.ok).length;
  const progress = items.length === 0 ? 0 : Math.round((done / items.length) * 100);
  const isAllDone = progress === 100;

  return (
    <>
      <style>
        {`
          .premium-checklist-card {
            background: linear-gradient(145deg, #ffffff, #fdfdff);
            border: 1px solid rgba(0, 0, 0, 0.05);
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0,0,0,0.02);
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            overflow: hidden;
            position: relative;
          }
          .premium-checklist-card:hover {
            box-shadow: 0 14px 40px rgba(0, 0, 0, 0.06), 0 2px 5px rgba(0,0,0,0.03);
            transform: translateY(-2px);
          }
          .premium-checklist-header {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            padding: 20px 24px 16px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.04);
            position: sticky;
            top: 0;
            z-index: 10;
          }
          .premium-progress-bg {
            height: 6px;
            background-color: #f1f3f5;
            border-radius: 999px;
            overflow: hidden;
            margin-top: 12px;
          }
          .premium-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
            border-radius: 999px;
            transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .premium-progress-fill.all-done {
            background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
          }
          .premium-checklist-body {
            padding: 16px 24px 24px;
            max-height: calc(100vh - 200px);
            overflow-y: auto;
          }
          .premium-checklist-body::-webkit-scrollbar {
            width: 6px;
          }
          .premium-checklist-body::-webkit-scrollbar-thumb {
            background: #e2e8f0;
            border-radius: 4px;
          }
          .premium-check-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 12px;
            background: #ffffff;
            border: 1px solid #f1f5f9;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            text-align: left;
            width: 100%;
            font-size: 14.5px;
            font-weight: 500;
            color: #475569;
          }
          .premium-check-item:hover {
            background: #f8fafc;
            transform: translateX(4px);
            border-color: #e2e8f0;
          }
          .premium-check-item.is-ok {
            background: rgba(16, 185, 129, 0.04);
            border-color: rgba(16, 185, 129, 0.15);
            color: #059669;
          }
          .premium-check-item.is-ok:hover {
            background: rgba(16, 185, 129, 0.08);
          }
          .premium-icon-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            flex-shrink: 0;
            transition: all 0.3s ease;
          }
          .premium-check-item:not(.is-ok) .premium-icon-wrap {
            background: #f1f5f9;
            color: #94a3b8;
          }
          .premium-check-item.is-ok .premium-icon-wrap {
            background: #10b981;
            color: #ffffff;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
            animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes popIn {
            0% { transform: scale(0.5); opacity: 0; }
            70% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
      <div className="premium-checklist-card sticky-top" style={{ top: 16 }}>
        <div className="premium-checklist-header">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="text-uppercase fw-bold text-primary" style={{ fontSize: '11px', letterSpacing: '1px' }}>
              Publish Checklist
            </span>
            <span className={`badge rounded-pill ${isAllDone ? 'bg-success' : 'bg-primary'}`} style={{ fontSize: '12px', padding: '6px 10px' }}>
              {progress}%
            </span>
          </div>
          <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '18px' }}>Điều kiện xuất bản</h5>
          <div className="premium-progress-bg">
            <div className={`premium-progress-fill ${isAllDone ? 'all-done' : ''}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="premium-checklist-body">
          {items.map((item, index) => (
            <button
              type="button"
              key={index}
              onClick={() => onGoToStep(item.step)}
              className={`premium-check-item ${item.ok ? 'is-ok' : ''}`}
            >
              <div className="premium-icon-wrap">
                <i className={`bi ${item.ok ? 'bi-check2' : 'bi-dash'}`} style={{ fontSize: '14px', strokeWidth: '1px' }} />
              </div>
              <span style={{ textDecoration: item.ok ? 'line-through' : 'none', opacity: item.ok ? 0.8 : 1 }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
