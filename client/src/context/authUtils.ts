import { createContext, useContext } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'DONOR' | 'ACCEPTOR' | 'ADMIN';
  isVerified: boolean;
  address: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  setAuth: (user: User | null, token: string | null) => void;
  clearAuth: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  setAuth: () => {},
  clearAuth: () => {},
});

export const useAuth = () => useContext(AuthContext);