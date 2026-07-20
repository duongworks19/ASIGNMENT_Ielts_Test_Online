import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * SpeakingRenderer — Renders IELTS Speaking Part prompts
 * Mock UI: shows topic card + cue card + mock recording button (no real audio recording)
 */
const SpeakingRenderer = ({ question, currentAnswer, onAnswer, isReviewMode = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(currentAnswer || null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(0); // mock volume for visualizer

  const part = question.part || 1;

  const partConfig = {
    1: { label: 'Part 1 – Introduction & Interview', color: '#0ea5e9', bg: '#f0f9ff', tip: 'Answer in 2–3 sentences. Be natural and conversational.' },
    2: { label: 'Part 2 – Individual Long Turn', color: '#8b5cf6', bg: '#faf5ff', tip: `You have 1 minute to prepare, then speak for 1–2 minutes about the topic.` },
    3: { label: 'Part 3 – Two-way Discussion', color: '#f59e0b', bg: '#fffbeb', tip: 'Discuss ideas in depth. Give reasons and examples.' },
  };
  const cfg = partConfig[part] || partConfig[1];

  useEffect(() => {
    let volInterval;
    if (isRecording) {
      volInterval = setInterval(() => {
        // mock audio visualizer volume
        setVolume(Math.random() * 60 + 20); 
      }, 100);
    } else {
      setVolume(0);
    }
    return () => clearInterval(volInterval);
  }, [isRecording]);

  const handleStartRecording = async () => {
    if (isReviewMode) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsUploading(true);
        try {
          const file = new File([audioBlob], `speaking-${question.id}-${Date.now()}.webm`, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('file', file);
          
          const res = await fetch('http://localhost:9999/upload', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.fileUrl) {
            const uploadedUrl = `http://localhost:9999${data.fileUrl}`;
            setAudioUrl(uploadedUrl);
            if (onAnswer) onAnswer(question.id, uploadedUrl);
          }
        } catch (err) {
          console.error('Audio upload failed', err);
          alert('Không thể lưu file ghi âm. Vui lòng ghi âm lại!');
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    } catch (err) {
      alert('Không thể truy cập Microphone. Vui lòng cấp quyền trong trình duyệt!');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div className="speaking-renderer" data-testid={`speaking-question-${question.id}`}>
      
      {/* Header bar */}
      <div className="d-flex align-items-center gap-3 mb-4 border-bottom pb-3">
        <div style={{
          background: cfg.color, color: '#fff', 
          padding: '6px 14px', borderRadius: '8px', 
          fontSize: '14px', fontWeight: '700', letterSpacing: '0.5px'
        }}>
          {cfg.label}
        </div>
        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
          <i className="bi bi-info-circle me-1"></i> {cfg.tip}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="row g-4 align-items-stretch">
        
        {/* Left Side: Question Prompt */}
        <div className="col-12 col-lg-7 d-flex flex-column">
          {part === 2 ? (
            <div className="flex-grow-1 p-5 rounded-4 shadow-sm"
              style={{ background: '#fdfbf7', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <div className="d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-file-earmark-text-fill" style={{ color: '#d97706', fontSize: '20px' }}></i>
                <div className="fw-bold" style={{ fontSize: '15px', color: '#d97706', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Candidate Task Card
                </div>
              </div>
              <h4 className="fw-bold text-dark lh-base mb-4" style={{ fontSize: '20px' }}>
                {question.prompt || question.questionText || question.text}
              </h4>
              <p className="text-secondary fw-semibold mb-3">You should say:</p>
              
              {question.subPoints && (
                <ul className="text-dark fs-6 lh-lg mb-4 ps-4" style={{ listStyleType: 'disc' }}>
                  {question.subPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                </ul>
              )}
              {question.bulletPrompts && (
                <ul className="text-dark fs-6 lh-lg mb-4 ps-4" style={{ listStyleType: 'disc' }}>
                  {question.bulletPrompts.map((pt, i) => <li key={i}>{pt}</li>)}
                </ul>
              )}
              <div className="mt-auto pt-4 border-top">
                <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                  and explain <strong>why</strong> this is important to you.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-grow-1 p-5 rounded-4 shadow-sm d-flex flex-column justify-content-center"
              style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div style={{ width: '40px', height: '4px', background: cfg.color, borderRadius: '2px' }}></div>
              </div>
              <h3 className="fw-bold text-dark lh-base mb-0" style={{ fontSize: '22px' }}>
                {question.prompt || question.questionText || question.text}
              </h3>
              {question.subPoints && (
                <ul className="text-secondary fs-6 mt-4 mb-0 ps-3">
                  {question.subPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Recording Interface */}
        <div className="col-12 col-lg-5">
          <div className="h-100 p-4 rounded-4 shadow-sm d-flex flex-column align-items-center justify-content-center text-center" 
               style={{ background: isRecording ? '#fff1f2' : '#f8fafc', border: `2px solid ${isRecording ? '#ffe4e6' : '#e2e8f0'}`, transition: 'all 0.3s ease' }}>
            
            {!isReviewMode ? (
              <>
                {/* Visualizer / Mic Icon */}
                <div className="mb-4 position-relative d-flex justify-content-center align-items-center" style={{ width: '120px', height: '120px' }}>
                  {isRecording ? (
                    <>
                      <div className="position-absolute rounded-circle" style={{ width: '100%', height: '100%', border: '2px solid #fecdd3', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                      <div className="rounded-circle d-flex align-items-center justify-content-center" 
                           style={{ width: '80px', height: '80px', background: '#e11d48', boxShadow: `0 0 ${volume/2}px ${volume/4}px rgba(225, 29, 72, 0.4)`, transition: 'all 0.1s ease' }}>
                        <i className="bi bi-mic-fill text-white fs-1"></i>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-circle d-flex align-items-center justify-content-center" 
                         style={{ width: '80px', height: '80px', background: '#e2e8f0' }}>
                      <i className="bi bi-mic-mute-fill text-secondary fs-1"></i>
                    </div>
                  )}
                </div>

                {/* Status Text & Timer */}
                <div className="mb-4">
                  {isRecording ? (
                    <>
                      <h4 className="fw-bold mb-1" style={{ color: '#e11d48', fontFamily: 'monospace', fontSize: '28px' }}>
                        {formatTime(elapsed)}
                      </h4>
                      <p className="text-muted fw-semibold mb-0" style={{ fontSize: '14px', letterSpacing: '1px' }}>RECORDING IN PROGRESS</p>
                    </>
                  ) : (
                    <>
                      <h4 className="fw-bold text-dark mb-1" style={{ fontSize: '22px' }}>Ready to speak?</h4>
                      <p className="text-muted mb-0" style={{ fontSize: '14px' }}>Click the button below to start.</p>
                    </>
                  )}
                </div>

                {/* Record Controls */}
                <div className="d-flex align-items-center justify-content-center gap-3 w-100">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="btn fw-bold w-100 py-3"
                      style={{ background: '#2563eb', color: '#fff', borderRadius: '12px', fontSize: '16px', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
                    >
                      <i className="bi bi-mic-fill me-2"></i> Start Recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      disabled={isUploading}
                      className="btn fw-bold w-100 py-3"
                      style={{ background: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '16px' }}
                    >
                      {isUploading ? <><span className="spinner-border spinner-border-sm me-2" /> Saving...</> : <><i className="bi bi-stop-circle-fill me-2"></i> Stop Recording</>}
                    </button>
                  )}
                </div>
              </>
            ) : (
              // Review Mode UI
              <div className="w-100 d-flex flex-column align-items-center">
                <div className="rounded-circle d-flex align-items-center justify-content-center mb-4" 
                     style={{ width: '80px', height: '80px', background: '#dcfce7' }}>
                  <i className="bi bi-headphones text-success fs-1"></i>
                </div>
                <h4 className="fw-bold text-dark mb-2">Your Answer</h4>
                {currentAnswer ? (
                  <div className="w-100 mt-3 p-3 bg-white rounded-3 shadow-sm border">
                    <audio src={currentAnswer} controls className="w-100" />
                  </div>
                ) : (
                  <div className="w-100 mt-3 p-3 rounded-3" style={{ background: '#fee2e2', border: '1px solid #fca5a5' }}>
                    <span className="fw-semibold text-danger"><i className="bi bi-x-circle-fill me-2"></i>No recording submitted</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Playback after recording */}
            {!isReviewMode && audioUrl && !isRecording && (
              <div className="w-100 mt-4 p-3 bg-white rounded-3 border" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-check-circle-fill text-success"></i>
                  <span className="fw-bold" style={{ fontSize: '13px', color: '#065f46' }}>Recording Saved</span>
                </div>
                <audio src={audioUrl} controls className="w-100" />
              </div>
            )}
          </div>
        </div>

      </div>
      
      {/* CSS for ping animation */}
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

SpeakingRenderer.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    prompt: PropTypes.string,
    questionText: PropTypes.string,
    part: PropTypes.number,
    subPoints: PropTypes.arrayOf(PropTypes.string),
    bulletPrompts: PropTypes.arrayOf(PropTypes.string),
    text: PropTypes.string,
  }).isRequired,
  currentAnswer: PropTypes.any,
  onAnswer: PropTypes.func,
  isReviewMode: PropTypes.bool,
};

export default SpeakingRenderer;
