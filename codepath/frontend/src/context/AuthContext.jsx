/**
 * context/AuthContext.jsx
 * -----------------------
 * Provides { user, token, login, register, logout, loading } to the app.
 * Persists the JWT + user object to localStorage so a page refresh
 * doesn't log the user out.
 */

import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("codepath_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("codepath_token"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Keep localStorage in sync whenever user/token change
    if (token) localStorage.setItem("codepath_token", token);
    else localStorage.removeItem("codepath_token");

    if (user) localStorage.setItem("codepath_user", JSON.stringify(user));
    else localStorage.removeItem("codepath_user");
  }, [user, token]);

  async function login(email, password) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  }

  async function register(name, email, password) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Registration failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
