import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { changeCurrentUserPassword, updateUserProfile } from '../../services/userService';
import './Profile.css';

const BAND_OPTIONS = ['0', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9'];

const validDate = (value) => {
  if (!value) return true;
  const parsed = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(parsed.getTime())
    && parsed.toISOString().slice(0, 10) === value
    && parsed <= new Date();
};
const validateDob = (value) => {
  if (!value) return { isValid: true };
  const parsedDate = new Date(`${value}T00:00:00Z`);
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(parsedDate.getTime())
    && parsedDate.toISOString().slice(0, 10) === value;

  if (!isValidDate) return { isValid: false, error: 'Ngày sinh không hợp lệ.' };

  const today = new Date();
  let age = today.getFullYear() - parsedDate.getUTCFullYear();
  const m = today.getMonth() - parsedDate.getUTCMonth();
  if (m < 0 || (m === 0 && today.getDate() < parsedDate.getUTCDate())) {
    age--;
  }

  if (parsedDate > today) return { isValid: false, error: 'Ngày sinh không thể nằm trong tương lai.' };
  if (age < 6) return { isValid: false, error: 'Bạn phải đủ 6 tuổi trở lên.' };
  if (age > 100) return { isValid: false, error: 'Tuổi không hợp lệ (lớn hơn 100 tuổi).' };

  return { isValid: true };
};

export default function Profile() {
  const { user, updateCurrentUser } = useAuth();
  const [profile, setProfile] = useState({ fullName: '', dateOfBirth: '', avatar: '', currentBand: 0, targetBand: 0 });
  const [profileErrors, setProfileErrors] = useState({});
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const isStudent = user?.role === 'student';

  useEffect(() => {
    if (!user) return;
    setProfile({
      fullName: user.fullName || user.name || '',
      dateOfBirth: user.dateOfBirth || '',
      avatar: user.avatar || '',
      currentBand: Number(user.currentBand || 0),
      targetBand: Number(user.targetBand || 0),
    });
  }, [user]);

  const initials = useMemo(() => (user?.fullName || user?.name || user?.email || 'U')
    .split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase(), [user]);

  const progress = isStudent && Number(profile.targetBand) > 0
    ? Math.min(100, Math.round((Number(profile.currentBand) / Number(profile.targetBand)) * 100))
    : 0;

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    const errors = {};
    const fullName = profile.fullName.trim().replace(/\s+/g, ' ');
    if (fullName.length < 2 || fullName.length > 100) errors.fullName = 'Họ tên phải có từ 2 đến 100 ký tự.';
    if (!validDate(profile.dateOfBirth)) errors.dateOfBirth = 'Ngày sinh không hợp lệ hoặc nằm trong tương lai.';
    const dobValidation = validateDob(profile.dateOfBirth);
    if (!dobValidation.isValid) errors.dateOfBirth = dobValidation.error;
    if (profile.avatar && !/^(https?:\/\/|data:image\/)/i.test(profile.avatar)) errors.avatar = 'Avatar phải là URL http(s) hoặc data image.';
    if (isStudent && Number(profile.targetBand) < Number(profile.currentBand)) errors.targetBand = 'Band mục tiêu phải lớn hơn hoặc bằng band hiện tại.';
    setProfileErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingProfile(true);
    try {
      const payload = { fullName, dateOfBirth: profile.dateOfBirth, avatar: profile.avatar.trim() };
      if (isStudent) {
        payload.currentBand = Number(profile.currentBand);
        payload.targetBand = Number(profile.targetBand);
      }
      const updated = await updateUserProfile(payload);
      updateCurrentUser(updated);
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (error) {
      setProfileErrors(error.errors || {});
      toast.error(error.message || 'Cập nhật hồ sơ thất bại.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!password.currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password.newPassword)) {
      errors.newPassword = 'Mật khẩu mới cần ít nhất 8 ký tự, có chữ hoa, chữ thường và số.';
    }
    if (password.newPassword !== password.confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    setPasswordErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingPassword(true);
    try {
      const result = await changeCurrentUserPassword(password);
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(result.message || 'Đổi mật khẩu thành công!');
    } catch (error) {
      const field = error.code === 'CURRENT_PASSWORD_INVALID' ? { currentPassword: error.message } : {};
      setPasswordErrors(field);
      toast.error(error.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return <div className="container py-5 text-center">Không tìm thấy phiên người dùng.</div>;

  return (
    <div className="prf-page">
      <div className="prf-hero">
        <div className="prf-hero-orb o1" />
        <div className="prf-hero-orb o2" />
        <div className="container prf-hero-inner">
          <div className="prf-hero-badge"><i className="bi bi-person-badge-fill" /> Hồ sơ cá nhân</div>
          <h1 className="prf-hero-title">Quản lý <span>tài khoản</span></h1>
          <p className="prf-hero-sub">Cập nhật thông tin cá nhân và bảo vệ tài khoản của bạn.</p>
        </div>
      </div>

      <div className="container prf-main">
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="prf-overview sticky-top" style={{ top: '100px' }}>
              <div className="prf-avatar-wrap">
                <div className="prf-avatar">
                  {user.avatar && /^(https?:\/\/|data:image\/)/i.test(user.avatar)
                    ? <img src={user.avatar} alt="Avatar" className="prf-avatar-img" />
                    : <span>{initials}</span>}
                </div>
                <div className="prf-avatar-ring" />
              </div>
              <h4 className="prf-name">{user.fullName || user.name}</h4>
              <p className="prf-email">{user.email}</p>
              <span className="prf-role-badge">{user.role?.toUpperCase()}</span>

              {isStudent && (
                <div className="prf-goal-section" data-testid="student-band-summary">
                  <div className="prf-goal-header"><span>Mục tiêu IELTS</span><span className="prf-goal-percent">{progress}%</span></div>
                  <div className="prf-band-row">
                    <div className="prf-band-item current"><div className="prf-band-label">Hiện tại</div><div className="prf-band-value">{profile.currentBand || '—'}</div></div>
                    <div className="prf-band-arrow"><i className="bi bi-arrow-right text-muted" /></div>
                    <div className="prf-band-item target"><div className="prf-band-label">Mục tiêu</div><div className="prf-band-value">{profile.targetBand || '—'}</div></div>
                  </div>
                  <div className="prf-progress-track"><div className="prf-progress-fill" style={{ width: `${progress}%` }} /></div>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-8">
            <div className="prf-form-card mb-4">
              <div className="prf-form-header"><div className="prf-form-icon"><i className="bi bi-pencil-square" /></div><div><div className="prf-form-title">Thông tin cá nhân</div><div className="prf-form-sub">Email được dùng làm định danh và chỉ đọc.</div></div></div>
              <form onSubmit={handleProfileSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="prf-label" htmlFor="profileFullName">Họ và tên</label>
                    <input id="profileFullName" className={`prf-input ${profileErrors.fullName ? 'is-invalid' : ''}`} value={profile.fullName} onChange={(event) => setProfile((old) => ({ ...old, fullName: event.target.value }))} />
                    {profileErrors.fullName && <div className="prf-error">{profileErrors.fullName}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="prf-label" htmlFor="profileEmail">Email</label>
                    <input id="profileEmail" className="prf-input text-muted" value={user.email} readOnly style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed' }} />
                    <div className="mt-1 fw-medium" style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                      * Không thể thay đổi do chính sách bảo mật.
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="prf-label" htmlFor="profileDateOfBirth">Ngày sinh</label>
                    <input id="profileDateOfBirth" type="date" className={`prf-input ${profileErrors.dateOfBirth ? 'is-invalid' : ''}`} value={profile.dateOfBirth} onChange={(event) => setProfile((old) => ({ ...old, dateOfBirth: event.target.value }))} />
                    {profileErrors.dateOfBirth && <div className="prf-error">{profileErrors.dateOfBirth}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="prf-label" htmlFor="profileAvatar">Avatar URL</label>
                    <input id="profileAvatar" className={`prf-input ${profileErrors.avatar ? 'is-invalid' : ''}`} value={profile.avatar} onChange={(event) => setProfile((old) => ({ ...old, avatar: event.target.value }))} />
                    {profileErrors.avatar && <div className="prf-error">{profileErrors.avatar}</div>}
                  </div>
                  {isStudent && <>
                    <div className="col-md-6"><label className="prf-label" htmlFor="currentBand">Band hiện tại</label><select id="currentBand" className="prf-select" value={profile.currentBand} onChange={(event) => setProfile((old) => ({ ...old, currentBand: event.target.value }))}>{BAND_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select></div>
                    <div className="col-md-6"><label className="prf-label" htmlFor="targetBand">Band mục tiêu</label><select id="targetBand" className="prf-select" value={profile.targetBand} onChange={(event) => setProfile((old) => ({ ...old, targetBand: event.target.value }))}>{BAND_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select>{profileErrors.targetBand && <div className="prf-error">{profileErrors.targetBand}</div>}</div>
                  </>}
                  <div className="col-12"><div className="prf-form-footer"><button className="prf-save-btn" type="submit" disabled={savingProfile}>{savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div></div>
                </div>
              </form>
            </div>

            <div className="prf-form-card">
              <div className="prf-form-header"><div className="prf-form-icon"><i className="bi bi-shield-lock" /></div><div><div className="prf-form-title">Đổi mật khẩu</div><div className="prf-form-sub">Xác nhận mật khẩu hiện tại trước khi đổi.</div></div></div>
              <form onSubmit={handlePasswordSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-12"><label className="prf-label" htmlFor="currentPassword">Mật khẩu hiện tại</label><input id="currentPassword" type="password" autoComplete="current-password" className={`prf-input ${passwordErrors.currentPassword ? 'is-invalid' : ''}`} value={password.currentPassword} onChange={(event) => setPassword((old) => ({ ...old, currentPassword: event.target.value }))} />{passwordErrors.currentPassword && <div className="prf-error">{passwordErrors.currentPassword}</div>}</div>
                  <div className="col-md-6"><label className="prf-label" htmlFor="newPassword">Mật khẩu mới</label><input id="newPassword" type="password" autoComplete="new-password" className={`prf-input ${passwordErrors.newPassword ? 'is-invalid' : ''}`} value={password.newPassword} onChange={(event) => setPassword((old) => ({ ...old, newPassword: event.target.value }))} />{passwordErrors.newPassword && <div className="prf-error">{passwordErrors.newPassword}</div>}</div>
                  <div className="col-md-6"><label className="prf-label" htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</label><input id="confirmNewPassword" type="password" autoComplete="new-password" className={`prf-input ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`} value={password.confirmPassword} onChange={(event) => setPassword((old) => ({ ...old, confirmPassword: event.target.value }))} />{passwordErrors.confirmPassword && <div className="prf-error">{passwordErrors.confirmPassword}</div>}</div>
                  <div className="col-12"><div className="prf-form-footer"><button className="prf-save-btn" type="submit" disabled={savingPassword}>{savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}</button></div></div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
