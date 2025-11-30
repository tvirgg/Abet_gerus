"use client";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type User = {
  id: string;
  name: string;
  role: "student" | "curator" | "admin";
  countryId?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
};

const AuthCtx = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = async (token: string) => {
      try {
          const res = await fetch(`${API_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
              const profile = await res.json();
              setUser(profile);
          } else {
              logout();
          }
      } catch (e) {
          logout();
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      const token = localStorage.getItem("accessToken");
      if (token) {
          fetchProfile(token);
      } else {
          setLoading(false);
      }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) throw new Error("Invalid credentials");
    
    const data = await res.json();
    localStorage.setItem("accessToken", data.accessToken);
    await fetchProfile(data.accessToken);

    if (data.user.role === "student") {
      router.replace("/student/dashboard");
    } else {
      router.replace("/curator/dashboard");
    }
  };

  const register = async (data: any) => {
      const res = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
      });

      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Register failed");
      }

      // Auto login
      const loginData = await res.json();
      localStorage.setItem("accessToken", loginData.accessToken);
      await fetchProfile(loginData.accessToken);

      if (loginData.user.role === "student") {
        router.replace("/student/dashboard");
      } else {
        router.replace("/curator/dashboard");
      }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    router.replace("/login");
  };

  const value = { user, loading, login, register, logout };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
