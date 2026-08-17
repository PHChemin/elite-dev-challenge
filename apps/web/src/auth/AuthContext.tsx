import { useMemo, useState, type ReactNode } from 'react';
import { apiPost } from '../api/client';
import type { AuthUser, LoginResponse } from '../api/types';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-types';
import { clearSession, readSession, writeSession } from './storage';

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = readSession();
  const [token, setToken] = useState<string | null>(initial?.token ?? null);
  const [user, setUser] = useState<AuthUser | null>(initial?.user ?? null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      login: async (email, password) => {
        const result = await apiPost<LoginResponse>('/auth/login', {
          email,
          password,
        });
        writeSession(result.accessToken, result.user);
        setToken(result.accessToken);
        setUser(result.user);
      },
      logout: () => {
        clearSession();
        setToken(null);
        setUser(null);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
