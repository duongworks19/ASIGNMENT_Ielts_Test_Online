import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import { testService } from '../../services/testService';
import { testAttemptService } from '../../services/testAttemptService';
import { isFreeAccessibleTest, normalizeTest } from '../../utils/testModel';

const SKILL_CONFIG = {
  Reading: { color: '#0ea5e9', bg: '#e0f2fe', gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
  Listening: { color: '#f59e0b', bg: '#fef3c7', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  Writing: { color: '#8b5cf6', bg: '#ede9fe', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
  Speaking: { color: '#10b981', bg: '#d1fae5', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
};

const getSkill = (skill) => SKILL_CONFIG[skill] || SKILL_CONFIG.Reading;

const SKILL_GUIDE = {
  Reading: 'Đọc passage ở panel trái, trả lời câu hỏi ở panel phải và quản lý thời gian trong 60 phút.',
  Listening: 'Nghe audio, làm theo từng section và điền đáp án chính xác theo thứ tự câu hỏi.',
  Writing: 'Hoàn thành Task 1 và Task 2. Hệ thống hiển thị word count và chờ giáo viên chấm.',
  Speaking: 'Đi qua từng part, trả lời từng prompt/cue card. Bản demo lưu câu trả lời dạng text/mock audio.',
};

export default function TestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useMemo(() => getCurrentUser(), []);
  const isPublicFreeRoute = location.pathname.startsWith('/free-tests');
  const isEmbed = new URLSearchParams(location.search).get("embed") === "true";

  const [testDetail, setTestDetail] = useState(null);
  const [attemptInfo, setAttemptInfo] = useState({ limit: 0, used: 0, remaining: Infinity });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingAttempt, setIsCreatingAttempt] = useState(false);
  const [isFree, setIsFree] = useState(false);

  useEffect(() => {
    const fetchTestDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const test = await testService.getTestById(id);
        const normalized = normalizeTest(test);
        setTestDetail(normalized);

        let freeFlag = isFreeAccessibleTest(normalized);

        if (normalized.courseId) {
          const { getCourseById } = await import('../../services/courseLearning.service');
          const course = await getCourseById(normalized.courseId);
          if (course && (!course.price || course.price === 0)) {
            freeFlag = true;
          }
        }
        setIsFree(freeFlag);

        if (freeFlag) {
          const remaining = await testAttemptService.getRemainingAttempts(normalized, currentUser);
          setAttemptInfo(remaining);
        }
      } catch (err) {
        setError('Không tìm thấy bài test hoặc không thể tải dữ liệu.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTestDetail();
  }, [id, currentUser]);

  const canStart = useMemo(() => {
    if (!testDetail) return false;
    if (isFree) {
      return attemptInfo.remaining > 0;
    }
    return Boolean(currentUser);
  }, [testDetail, attemptInfo.remaining, currentUser, isFree]);

  const blockedMessage = useMemo(() => {
    if (!testDetail) return '';
    if (isFree && attemptInfo.remaining <= 0) {
      if (!currentUser) {
        return 'Bạn đã dùng hết 3 lượt làm bài miễn phí trên trình duyệt này. Hãy đăng ký khóa học Premium để làm bài không giới hạn và đồng bộ tiến trình.';
      }
      return 'Bạn đã dùng hết 3 lượt làm bài miễn phí. Hãy đăng ký khóa học Premium để làm bài không giới hạn và nhận hướng dẫn chi tiết.';
    }
    if (!currentUser && !isFree) {
      return 'Bạn cần đăng nhập để làm test thuộc khóa học.';
    }
    return '';
  }, [testDetail, attemptInfo.remaining, currentUser, isFree]);

  const handleStartTest = async () => {
    if (!testDetail) return;
    if (!canStart) return;

    setIsCreatingAttempt(true);
    try {
      const attempt = await testAttemptService.createAttempt(testDetail, currentUser);
      const prefix = isPublicFreeRoute ? '/free-tests' : '/learning/tests';
      navigate(`${prefix}/attempt/${attempt.id}${location.search}`);
    } catch (err) {
      alert('Lỗi khi bắt đầu bài thi: ' + (err.response?.data?.message || err.message || JSON.stringify(err)));
      setIsCreatingAttempt(false);
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status" />
        <p className="text-muted fw-semibold">Đang tải thông tin bài test...</p>
      </div>
    );
  }

  if (error || !testDetail) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger shadow-sm border-0 rounded-4 p-5 text-center">
          <h4 className="fw-bold mb-3">{error}</h4>
          <Link to={isPublicFreeRoute ? '/courses' : '/learning/tests'} className="btn btn-outline-danger rounded-pill px-4">
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  const sk = getSkill(testDetail.skill);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(120deg, #1e3a8a 0%, #3b82f6 100%)' }}>
        <div className="container py-3">
          {!isEmbed && (
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0" style={{ fontSize: 14 }}>
                <li className="breadcrumb-item">
                  <Link to={isPublicFreeRoute ? '/courses' : '/learning/tests'} className="text-decoration-none" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {isPublicFreeRoute ? 'Tài nguyên miễn phí' : 'Danh sách bài thi'}
                  </Link>
                </li>
                <li className="breadcrumb-item active" style={{ color: 'rgba(255,255,255,0.9)' }}>{testDetail.title}</li>
              </ol>
            </nav>
          )}
        </div>
        <div className="container pb-5 pt-2">
          <div className="row align-items-end">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="rounded-3" style={{ width: 48, height: 48, background: sk.gradient, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
                <span className="badge px-3 py-2 fw-semibold" style={{ background: sk.bg, color: sk.color, borderRadius: 20 }}>
                  {testDetail.skill}
                </span>
                {isFree && attemptInfo.limit === Infinity ? (
                  <span className="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm">
                    <i className="bi bi-star-fill text-danger me-1"></i> Đã nâng cấp
                  </span>
                ) : isFree ? (
                  <span className="badge bg-success px-3 py-2 rounded-pill">Free test</span>
                ) : null}
              </div>
              <h1 className="fw-bold text-white mb-2" style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)' }}>
                {testDetail.title}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 15, marginBottom: 0 }}>
                {testDetail.description || SKILL_GUIDE[testDetail.skill]}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-4 align-items-start">
          <div className="col-lg-7">
            <div className="row g-3 mb-4">
              {[
                { label: 'Thời gian', value: `${testDetail.durationMinutes} phút`, icon: 'bi-clock-history' },
                { label: 'Số câu hỏi', value: `${testDetail.totalQuestions} câu`, icon: 'bi-list-check' },
                { label: 'Thang điểm', value: testDetail.bandScale || 'IELTS 0-9', icon: 'bi-bar-chart-steps' },
              ].map((stat) => (
                <div className="col-md-4" key={stat.label}>
                  <div className="d-flex align-items-center p-3 rounded-4 bg-white" style={{ border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle me-3" style={{ width: 44, height: 44, background: '#f1f5f9', color: '#3b82f6' }}>
                      <i className={`bi ${stat.icon} fs-5`}></i>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{stat.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-4 p-4 mb-4 bg-white" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <h5 className="fw-bold text-dark mb-4 pb-3 border-bottom">
                <i className="bi bi-info-circle text-primary me-2"></i>Hướng dẫn làm bài
              </h5>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                <li className="d-flex align-items-start">
                  <i className="bi bi-check-circle-fill text-success mt-1 me-3"></i>
                  <span className="text-secondary">{SKILL_GUIDE[testDetail.skill]}</span>
                </li>
                <li className="d-flex align-items-start">
                  <i className="bi bi-check-circle-fill text-success mt-1 me-3"></i>
                  <span className="text-secondary">Tuyệt đối không tải lại (refresh) trang trong quá trình làm bài để tránh mất kết quả.</span>
                </li>
                <li className="d-flex align-items-start">
                  <i className="bi bi-check-circle-fill text-success mt-1 me-3"></i>
                  <span className="text-secondary">Hệ thống sẽ tự động thu bài và chấm điểm khi đồng hồ đếm ngược kết thúc.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="bg-white rounded-4 overflow-hidden" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', position: 'sticky', top: 80 }}>
              <div className="p-4 border-bottom bg-light text-center">
                <h4 className="fw-bold text-dark mb-1">Sẵn sàng làm bài?</h4>
                <p className="mb-0 text-muted" style={{ fontSize: 14 }}>
                  Đồng hồ bắt đầu đếm ngược ngay khi bạn nhấn nút.
                </p>
              </div>
              <div className="p-4">
                {isFree && (
                  <div className="alert alert-info border-0 rounded-3 mb-4 shadow-sm" style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                      <strong style={{ fontSize: 15 }}>Thông tin lượt làm bài</strong>
                    </div>
                    <div style={{ fontSize: 14 }}>
                      Lượt còn lại: <span className="fw-bold">{attemptInfo.remaining === Infinity ? 'Không giới hạn (Đã nâng cấp khóa Premium)' : `${attemptInfo.remaining}/${attemptInfo.limit || 3} (Giới hạn tối đa 3 lần)`}</span>
                    </div>
                    {!currentUser && (
                      <div className="mt-2 pt-2 border-top border-info border-opacity-25" style={{ fontSize: 13, opacity: 0.9 }}>
                        Lượt làm bài được lưu trên trình duyệt. Hãy đăng ký tài khoản để đồng bộ tiến trình.
                      </div>
                    )}
                  </div>
                )}

                {blockedMessage && (
                  <div className="alert alert-warning border-0 rounded-3 mb-4 shadow-sm" style={{ backgroundColor: '#fffbeb', color: '#b45309' }}>
                    <div className="d-flex align-items-start mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2 fs-5 mt-1"></i>
                      <div style={{ fontSize: 14 }}>{blockedMessage}</div>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      {!currentUser && (
                        <>
                          <Link to="/login" target="_top" className="btn btn-sm px-3 rounded-pill" style={{ background: '#b45309', color: '#fff' }}>Đăng nhập</Link>
                          <Link to="/register" target="_top" className="btn btn-sm px-3 rounded-pill btn-outline-warning text-dark border-warning">Đăng ký</Link>
                        </>
                      )}
                      {currentUser && testDetail.courseId && (
                        <Link to={`/learning/courses/${testDetail.courseId}`} target="_top" className="btn btn-sm px-3 rounded-pill fw-semibold" style={{ background: '#b45309', color: '#fff' }}>Đăng ký Premium (99K)</Link>
                      )}
                    </div>
                  </div>
                )}

                <button
                  className="btn w-100 fw-bold py-3 text-uppercase shadow-sm d-flex justify-content-center align-items-center gap-2"
                  style={{
                    background: !canStart || isCreatingAttempt ? '#cbd5e1' : '#2563eb',
                    color: !canStart || isCreatingAttempt ? '#64748b' : '#fff',
                    borderRadius: 12,
                    fontSize: 16,
                    border: 'none',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onClick={handleStartTest}
                  disabled={!canStart || isCreatingAttempt}
                >
                  {isCreatingAttempt ? (
                    <><span className="spinner-border spinner-border-sm" role="status"></span> Đang chuẩn bị...</>
                  ) : (
                    <><i className="bi bi-play-circle-fill fs-5"></i> Bắt đầu làm bài</>
                  )}
                </button>
                <div className="text-center mt-3 text-muted" style={{ fontSize: 12 }}>
                  <i className="bi bi-shield-check me-1"></i> Đề thi được kiểm duyệt bởi IELTS Master
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
