import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { getActiveToken, listSavedAccounts, migrateLegacyStorage } from '../services/vgStorage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  migrateLegacyStorage();
  const [currentUser, setCurrentUser] = useState(() => api.getSession());

  useEffect(() => {
    if (!getActiveToken()) return;

    api
      .getMe()
      .then((user) => {
        setCurrentUser(user);
      })
      .catch((error) => {
        console.error('Sessao expirada:', error);
        api.logout({ removeStoredAccount: true });
        setCurrentUser(null);
      });
  }, []);

  const login = useCallback(async (username, password) => {
    const user = await api.login(username, password);
    setCurrentUser(user);
    return user;
  }, []);

  const register = useCallback(async (payload) => {
    const user = await api.register(payload);
    setCurrentUser(user);
    return user;
  }, []);

  const logout = useCallback((options) => {
    api.logout(options);
    setCurrentUser(null);
  }, []);

  const endActiveSession = useCallback(() => {
    api.endActiveSession();
    setCurrentUser(null);
  }, []);

  const switchAccount = useCallback(async (username) => {
    if (!api.switchAccount(username)) {
      throw new Error('Conta nao encontrada no dispositivo.');
    }
    const user = await api.getMe();
    setCurrentUser(user);
    return user;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await api.getMe();
      setCurrentUser(user);
    } catch {
      setCurrentUser(api.getSession());
    }
  }, []);

  const savedAccounts = useMemo(() => listSavedAccounts(), [currentUser]);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      isAdmin: currentUser?.role === 'admin',
      login,
      register,
      logout,
      endActiveSession,
      switchAccount,
      refreshUser,
      savedAccounts,
    }),
    [currentUser, endActiveSession, login, logout, refreshUser, register, savedAccounts, switchAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
