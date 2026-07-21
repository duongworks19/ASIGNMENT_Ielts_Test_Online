import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import {
  fetchCurrentUser,
  getAccessToken,
  loginWithEmailAndPassword,
  logout as clearSession,
  registerNewUser,
} from '../../services/authService';

jest.mock('../../services/authService', () => ({
  fetchCurrentUser: jest.fn(),
  getAccessToken: jest.fn(),
  loginWithEmailAndPassword: jest.fn(),
  logout: jest.fn(),
  registerNewUser: jest.fn(),
  setCurrentUserSnapshot: jest.fn(),
}));

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="initializing">{String(auth.isInitializing)}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="user">{auth.user?.email || 'none'}</span>
      <button onClick={() => auth.login('user@example.com', 'StrongPass1')}>login</button>
      <button onClick={auth.logout}>logout</button>
      <button onClick={() => auth.register({ email: 'new@example.com' })}>register</button>
    </div>
  );
}

describe('AuthProvider session bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAccessToken.mockReturnValue(null);
  });

  test('finishes initialization immediately when no token exists', async () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));
    expect(fetchCurrentUser).not.toHaveBeenCalled();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  test('restores user only by validating stored token with /auth/me', async () => {
    getAccessToken.mockReturnValue('valid-token');
    fetchCurrentUser.mockResolvedValue({ id: 'u-1', email: 'user@example.com', role: 'student', status: 'active' });
    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('user@example.com'));
    expect(fetchCurrentUser).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
  });

  test('invalid or expired token clears the entire session', async () => {
    getAccessToken.mockReturnValue('expired-token');
    fetchCurrentUser.mockRejectedValue(new Error('expired'));
    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));
    expect(clearSession).toHaveBeenCalled();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  test('login and logout keep context state synchronized with token service', async () => {
    loginWithEmailAndPassword.mockResolvedValue({ id: 'u-2', email: 'teacher@example.com', role: 'teacher', status: 'active' });
    getAccessToken.mockReturnValueOnce(null).mockReturnValue('new-token');
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));

    fireEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));
    fireEvent.click(screen.getByText('logout'));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(clearSession).toHaveBeenCalled();
  });

  test('central 401 event logs out an already-restored session', async () => {
    getAccessToken.mockReturnValue('valid-token');
    fetchCurrentUser.mockResolvedValue({ id: 'u-1', email: 'user@example.com', role: 'student', status: 'active' });
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));

    act(() => window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { code: 'TOKEN_EXPIRED' } })));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  test('register delegates without authenticating the new account implicitly', async () => {
    registerNewUser.mockResolvedValue({ id: 'u-new', role: 'student' });
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));
    fireEvent.click(screen.getByText('register'));
    await waitFor(() => expect(registerNewUser).toHaveBeenCalledWith({ email: 'new@example.com' }));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });
});
