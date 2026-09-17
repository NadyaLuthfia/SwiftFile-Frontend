import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 🎯 GANTI JADI sessionStorage SEMUA
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const [role, setRole] = useState(sessionStorage.getItem('role') || null);
  const [userName, setUserName] = useState(sessionStorage.getItem('user_name') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('token');
    const savedRole = sessionStorage.getItem('role');
    const savedNama = sessionStorage.getItem('user_name');

    if (savedToken) {
      setToken(savedToken);
      setRole(savedRole);
      setUserName(savedNama || '');
    }
    setLoading(false);
  }, []);

  const loginUser = (data) => {
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('role', data.role);
    if (data.name) sessionStorage.setItem('user_name', data.name);

    setToken(data.token);
    setRole(data.role);
    setUserName(data.name || '');
  };

  const logoutUser = () => {
    sessionStorage.clear(); // Bersihkan saat logout
    setToken(null);
    setRole(null);
    setUserName('');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ token, role, userName, loginUser, logoutUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);