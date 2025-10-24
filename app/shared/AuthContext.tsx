"use client";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  name: string;
  role: "student" | "curator";
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (role: "student" | "curator") => void;
  logout: () => void;
};

const AuthCtx = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse auth user from localStorage", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (role: "student" | "curator") => {
    const newUser: User = { name: role === "student" ? "Студент" : "Куратор", role };
    localStorage.setItem("authUser", JSON.stringify(newUser));
    setUser(newUser);
    router.replace(role === "student" ? "/student/dashboard" : "/curator/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("authUser");
    setUser(null);
    router.replace("/login");
  };

  const value = { user, loading, login, logout };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
