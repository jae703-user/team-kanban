"use client";

// app/components/AuthContext.tsx
// 웹앱 전체에 로그인한 사용자 정보를 공급해주는 React Context 파일입니다.
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (userData: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // 페이지가 처음 로드될 때 브라우저 쿠키에서 auth_user 정보를 읽어옵니다.
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      if (match) {
        try {
          return JSON.parse(decodeURIComponent(match[2]));
        } catch (e) {
          return null;
        }
      }
      return null;
    };

    const cookieUser = getCookie('auth_user');
    if (cookieUser) {
      setUser(cookieUser);
    }
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
