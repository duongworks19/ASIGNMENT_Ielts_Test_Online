import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchCurrentUser,
  getAccessToken,
  loginWithEmailAndPassword,
  logout as clearSession,
  registerNewUser,
  setCurrentUserSnapshot,
} from '../services/authService';
import { AUTH_TOKEN_STORAGE_KEY } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getAccessToken());
  const [isInitializing, setIsInitializing] = useState(true);

  const updateCurrentUser = useCallback((nextUser) => {
    setUser((previous) => {
      const value = typeof nextUser === 'function' ? nextUser(previous) : nextUser;
      setCurrentUserSnapshot(value || null);
      return value || null;
    });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setToken(null);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const current = await fetchCurrentUser();
    setUser(current);
    setToken(getAccessToken());
    return current;
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      if (!getAccessToken()) {
        if (active) setIsInitializing(false);
        return;
      }
      try {
        const current = await fetchCurrentUser();
        if (active) {
          setUser(current);
          setToken(getAccessToken());
        }
      } catch (_) {
        clearSession();
        if (active) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (active) setIsInitializing(false);
      }
    };
    initialize();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const invalidate = () => {
      clearSession();
      setUser(null);
      setToken(null);
      setIsInitializing(false);
    };
    const syncAcrossTabs = (event) => {
      if (event.key && event.key !== AUTH_TOKEN_STORAGE_KEY) return;
      if (!getAccessToken()) invalidate();
      else {
        setIsInitializing(true);
        refreshCurrentUser().catch(invalidate).finally(() => setIsInitializing(false));
      }
    };
    window.addEventListener('auth:unauthorized', invalidate);
    window.addEventListener('auth:account-blocked', invalidate);
    window.addEventListener('storage', syncAcrossTabs);
    return () => {
      window.removeEventListener('auth:unauthorized', invalidate);
      window.removeEventListener('auth:account-blocked', invalidate);
      window.removeEventListener('storage', syncAcrossTabs);
    };
  }, [refreshCurrentUser]);

  const login = useCallback(async (email, password) => {
    const loggedInUser = await loginWithEmailAndPassword(email, password);
    setUser(loggedInUser);
    setToken(getAccessToken());
    return loggedInUser;
  }, []);

  const register = useCallback((payload) => registerNewUser(payload), []);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isInitializing,
    login,
    register,
    logout,
    refreshCurrentUser,
    updateCurrentUser,
  }), [user, token, isInitializing, login, register, logout, refreshCurrentUser, updateCurrentUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export default AuthContext;
