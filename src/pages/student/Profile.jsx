import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../services/authService';
import { updateUserProfile } from '../../services/userService';
import './Profile.css';

const profileSchema = z.object({
  fullName:    z.string().min(1, { message: 'Full Name cannot be empty' }),
  dateOfBirth: z.string().optional(),
  avatar:      z.string().refine(v => v === '' || v.startsWith('http') || v.startsWith('data:image'), { message: 'Avatar must be a valid URL' }),
  currentBand: z.coerce.number().min(0).max(9),
  targetBand:  z.coerce.number().min(0).max(9),
}).refine(d => d.targetBand >= d.currentBand, { message: 'Target Band must be ≥ Current Band', path: ['targetBand'] });

const BAND_OPTS = ['0', '4.0', '4.5', '5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];

export default function Profile() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving,setIsSaving]= useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  useEffect(() => {
    const cu = getCurrentUser();
    if (cu) {
      setUser(cu);
      reset({ fullName: cu.fullName || cu.name || '', dateOfBirth: cu.dateOfBirth || '', avatar: cu.avatar || '', currentBand: cu.currentBand || 0, targetBand: cu.targetBand || 0 });
    }
    setLoading(false);
  }, [reset]);

  const onSubmit = async (data) => {
    const v = profileSchema.safeParse(data);
    if (!v.success) { toast.error(v.error.issues[0].message); return; }
    try {
      setIsSaving(true);
      const updated = await updateUserProfile(user.id, v.data);
      localStorage.setItem('ielts_auth_user', JSON.stringify(updated));
      setUser(updated);
      toast.success('Cập nhật hồ sơ thành công!');
      window.dispatchEvent(new Event('storage'));
    } catch (e) { toast.error(e.message || 'Cập nhật thất bại'); }
    finally { setIsSaving(false); }
  };

  const initials = (user?.fullName || user?.name || user?.email || 'S')
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const progress = user?.targetBand > 0
    ? Math.min(100, Math.round((user.currentBand / user.targetBand) * 100)) : 0;

  return (
    <div className="prf-page">
      {/* ── HERO ── */}
      <div className="prf-hero">
        <div className="prf-hero-orb o1"></div>
        <div className="prf-hero-orb o2"></div>
        <div className="container prf-hero-inner">
          <div className="prf-hero-badge"><i className="bi bi-person-badge-fill"></i> Hồ sơ cá nhân</div>
          <h1 className="prf-hero-title">Quản Lý <span>Tài Khoản</span></h1>
          <p className="prf-hero-sub">Cập nhật thông tin cá nhân và thiết lập mục tiêu IELTS của bạn.</p>
        </div>
      </div>

      <div className="container prf-main">
        {loading ? (
          <div className="prf-loading">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : !user ? (
          <div className="text-center py-5 text-muted">Không tìm thấy người dùng.</div>
        ) : (
          <div className="row g-4">
            {/* ── LEFT: Profile Overview ── */}
            <div className="col-lg-4">
              <div className="prf-overview sticky-top" style={{ top: '100px' }}>
                {/* Avatar */}
                <div className="prf-avatar-wrap">
                  <div className="prf-avatar">
                    {user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:image')) ? (
                      <img src={user.avatar} alt="Avatar" className="prf-avatar-img" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="prf-avatar-ring"></div>
                </div>

                <h4 className="prf-name">{user.fullName || user.name || 'No Name'}</h4>
                <p className="prf-email">{user.email}</p>
                <span className="prf-role-badge">{user.role?.toUpperCase()}</span>

                {/* Band Goal Progress */}
                <div className="prf-goal-section">
                  <div className="prf-goal-header">
                    <span><i className="bi bi-bullseye me-1 text-primary"></i>Mục tiêu IELTS</span>
                    <span className="prf-goal-percent">{progress}%</span>
                  </div>
                  <div className="prf-band-row">
                    <div className="prf-band-item current">
                      <div className="prf-band-label">Hiện tại</div>
                      <div className="prf-band-value">{user.currentBand || '—'}</div>
                    </div>
                    <div className="prf-band-arrow"><i className="bi bi-arrow-right text-muted"></i></div>
                    <div className="prf-band-item target">
                      <div className="prf-band-label">Mục tiêu</div>
                      <div className="prf-band-value">{user.targetBand || '—'}</div>
                    </div>
                  </div>
                  <div className="prf-progress-track">
                    <div className="prf-progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                {/* Join date */}
                <div className="prf-join-date">
                  <i className="bi bi-calendar-check me-2 text-muted"></i>
                  Tham gia {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Edit Form ── */}
            <div className="col-lg-8">
              <div className="prf-form-card">
                <div className="prf-form-header">
                  <div className="prf-form-icon">
                    <i className="bi bi-pencil-square"></i>
                  </div>
                  <div>
                    <div className="prf-form-title">Thông tin cá nhân</div>
                    <div className="prf-form-sub">Cập nhật thông tin và mục tiêu học tập của bạn</div>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="row g-3">
                    {/* Full Name */}
                    <div className="col-md-6">
                      <label className="prf-label">Họ và tên <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className={`prf-input ${errors.fullName ? 'is-invalid' : ''}`}
                        placeholder="Nguyễn Văn A"
                        {...register('fullName', { required: true })}
                      />
                      {errors.fullName && <div className="prf-error">Vui lòng nhập họ tên</div>}
                    </div>

                    {/* Date of Birth */}
                    <div className="col-md-6">
                      <label className="prf-label">Ngày sinh</label>
                      <input type="date" className="prf-input" {...register('dateOfBirth')} />
                    </div>

                    {/* Avatar URL */}
                    <div className="col-12">
                      <label className="prf-label">Avatar URL</label>
                      <input
                        type="url"
                        className="prf-input"
                        placeholder="https://example.com/avatar.jpg"
                        {...register('avatar')}
                      />
                      {errors.avatar && <div className="prf-error">{errors.avatar.message}</div>}
                    </div>

                    {/* Band scores */}
                    <div className="col-md-6">
                      <label className="prf-label">Band Score hiện tại</label>
                      <select className="prf-select" {...register('currentBand')}>
                        {BAND_OPTS.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="prf-label">Band Score mục tiêu</label>
                      <select className="prf-select" {...register('targetBand')}>
                        {BAND_OPTS.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      {errors.targetBand && <div className="prf-error">{errors.targetBand.message}</div>}
                    </div>

                    {/* Submit */}
                    <div className="col-12">
                      <div className="prf-form-footer">
                        <button type="submit" className="prf-save-btn" disabled={isSaving}>
                          {isSaving
                            ? <><span className="spinner-border spinner-border-sm me-2"></span>Đang lưu...</>
                            : <><i className="bi bi-check-circle-fill me-2"></i>Lưu thay đổi</>
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
