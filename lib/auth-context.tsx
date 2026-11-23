"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AuthUser } from "@/lib/types";
import { loginApi, loginWithGoogleApi, registerApi, getMeApi, logoutApi } from "@/lib/api";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: (idToken: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getMeApi();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    const res = await loginApi(email, password, rememberMe);
    setUser(res.user);
  };

  const loginWithGoogle = async (idToken: string, rememberMe: boolean = true) => {
    const res = await loginWithGoogleApi(idToken, rememberMe);
    setUser(res.user);
  };

  const register = async (email: string, password: string, fullName: string) => {
    const res = await registerApi(email, password, fullName);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
