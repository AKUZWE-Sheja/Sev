import React, { useState, useEffect } from 'react';
import type { User } from './authUtils';
import { AuthContext } from './authUtils';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
      setToken(localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token }}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;