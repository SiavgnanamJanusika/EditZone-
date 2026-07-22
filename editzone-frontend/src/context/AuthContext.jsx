/* eslint-disable react/only-export-components -- provider and its hook form one public auth API */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("ez_access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      localStorage.removeItem("ez_access_token");
      localStorage.removeItem("ez_refresh_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const applySession = (data) => {
    localStorage.setItem("ez_access_token", data.access_token);
    localStorage.setItem("ez_refresh_token", data.refresh_token);
  };

  const login = async (email, password, nic) => {
    const res = await api.post("/auth/login", { email, password, nic: nic || undefined });
    applySession(res.data);
    await fetchMe();
    return res.data;
  };

  const register = async (payload) => {
    const res = await api.post("/auth/register", payload);
    applySession(res.data);
    await fetchMe();
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("ez_access_token");
    localStorage.removeItem("ez_refresh_token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
