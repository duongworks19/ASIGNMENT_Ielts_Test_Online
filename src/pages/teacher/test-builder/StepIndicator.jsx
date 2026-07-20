import React from 'react';
import './StepIndicator.css';

const STEPS = [
  { label: 'Thông tin cơ bản', icon: 'bi-sliders2' },
  { label: 'Nội dung & Câu hỏi', icon: 'bi-layers' },
];

export default function StepIndicator({ currentStep, onStepClick }) {
  return (
    <div className="test-stepper-container">
      {STEPS.map((item, index) => {
        const step = index + 1;
        const active = currentStep === step;
        const done = currentStep > step;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onStepClick(step)}
            className={`test-stepper-item ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`}
          >
            <div className="test-stepper-icon">
              <i className={`bi ${done ? 'bi-check-lg' : item.icon}`} />
            </div>
            <div className="test-stepper-label">
              {step}. {item.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
