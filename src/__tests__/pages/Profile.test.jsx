import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Profile from '../../pages/student/Profile';
import { changeCurrentUserPassword, updateUserProfile } from '../../services/userService';
import toast from 'react-hot-toast';

const mockUseAuth = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));
jest.mock('../../services/userService', () => ({
  updateUserProfile: jest.fn(),
  changeCurrentUserPassword: jest.fn(),
}));
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

const student = {
  id: 'u-student-1', fullName: 'Student One', email: 'student@example.com', role: 'student', status: 'active',
  dateOfBirth: '2000-02-29', currentBand: 5.5, targetBand: 7,
};

describe('shared Profile page', () => {
  const updateCurrentUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: student, updateCurrentUser });
    updateUserProfile.mockResolvedValue({ ...student, fullName: 'Updated Student' });
    changeCurrentUserPassword.mockResolvedValue({ message: 'Đổi mật khẩu thành công.' });
  });

  test('loads current user and shows Student-only band fields', async () => {
    render(<Profile />);
    await waitFor(() => expect(document.querySelector('#profileFullName')).toHaveValue('Student One'));
    expect(document.querySelector('#profileEmail')).toHaveValue('student@example.com');
    expect(document.querySelector('#profileEmail')).toHaveAttribute('readonly');
    expect(screen.getByTestId('student-band-summary')).toBeInTheDocument();
    expect(document.querySelector('#currentBand')).toBeInTheDocument();
    expect(document.querySelector('#targetBand')).toBeInTheDocument();
  });

  test.each(['teacher', 'admin'])('%s sees common fields but no Student band fields', async (role) => {
    mockUseAuth.mockReturnValue({
      user: { id: `u-${role}`, fullName: `${role} One`, email: `${role}@example.com`, role, status: 'active' },
      updateCurrentUser,
    });
    render(<Profile />);
    await waitFor(() => expect(document.querySelector('#profileFullName')).toHaveValue(`${role} One`));
    expect(screen.queryByTestId('student-band-summary')).not.toBeInTheDocument();
    expect(document.querySelector('#currentBand')).not.toBeInTheDocument();
    expect(document.querySelector('#targetBand')).not.toBeInTheDocument();
  });

  test('updates profile through API and immediately updates AuthContext', async () => {
    render(<Profile />);
    await waitFor(() => expect(document.querySelector('#profileFullName')).toHaveValue('Student One'));
    fireEvent.change(document.querySelector('#profileFullName'), { target: { value: '  Updated   Student  ' } });
    fireEvent.submit(document.querySelector('#profileFullName').closest('form'));

    await waitFor(() => expect(updateUserProfile).toHaveBeenCalledWith({
      fullName: 'Updated Student',
      dateOfBirth: '2000-02-29',
      avatar: '',
      currentBand: 5.5,
      targetBand: 7,
    }));
    expect(updateCurrentUser).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Updated Student' }));
    expect(toast.success).toHaveBeenCalled();
  });

  test('profile validation blocks an impossible date', async () => {
    render(<Profile />);
    await waitFor(() => expect(document.querySelector('#profileDateOfBirth')).toHaveValue('2000-02-29'));
    fireEvent.change(document.querySelector('#profileDateOfBirth'), { target: { value: '2999-01-01' } });
    fireEvent.submit(document.querySelector('#profileFullName').closest('form'));
    expect(updateUserProfile).not.toHaveBeenCalled();
    expect(document.querySelector('#profileDateOfBirth')).toHaveClass('is-invalid');
  });

  test('change password validates confirmation before sending a request', () => {
    render(<Profile />);
    fireEvent.change(document.querySelector('#currentPassword'), { target: { value: 'OldStrong1' } });
    fireEvent.change(document.querySelector('#newPassword'), { target: { value: 'NewStrong1' } });
    fireEvent.change(document.querySelector('#confirmNewPassword'), { target: { value: 'Different1' } });
    fireEvent.submit(document.querySelector('#currentPassword').closest('form'));
    expect(changeCurrentUserPassword).not.toHaveBeenCalled();
    expect(document.querySelector('#confirmNewPassword')).toHaveClass('is-invalid');
  });

  test('wrong current password is attached to the current-password field', async () => {
    const error = new Error('Mật khẩu hiện tại không đúng.');
    error.code = 'CURRENT_PASSWORD_INVALID';
    changeCurrentUserPassword.mockRejectedValue(error);
    render(<Profile />);
    fireEvent.change(document.querySelector('#currentPassword'), { target: { value: 'WrongPass1' } });
    fireEvent.change(document.querySelector('#newPassword'), { target: { value: 'NewStrong1' } });
    fireEvent.change(document.querySelector('#confirmNewPassword'), { target: { value: 'NewStrong1' } });
    fireEvent.submit(document.querySelector('#currentPassword').closest('form'));

    await waitFor(() => expect(document.querySelector('#currentPassword')).toHaveClass('is-invalid'));
    expect(toast.error).toHaveBeenCalledWith('Mật khẩu hiện tại không đúng.');
  });

  test('changes password successfully and clears all password inputs', async () => {
    render(<Profile />);
    fireEvent.change(document.querySelector('#currentPassword'), { target: { value: 'OldStrong1' } });
    fireEvent.change(document.querySelector('#newPassword'), { target: { value: 'NewStrong1' } });
    fireEvent.change(document.querySelector('#confirmNewPassword'), { target: { value: 'NewStrong1' } });
    fireEvent.submit(document.querySelector('#currentPassword').closest('form'));

    await waitFor(() => expect(changeCurrentUserPassword).toHaveBeenCalledWith({
      currentPassword: 'OldStrong1', newPassword: 'NewStrong1', confirmPassword: 'NewStrong1',
    }));
    await waitFor(() => expect(document.querySelector('#currentPassword')).toHaveValue(''));
    expect(document.querySelector('#newPassword')).toHaveValue('');
    expect(document.querySelector('#confirmNewPassword')).toHaveValue('');
  });
});
