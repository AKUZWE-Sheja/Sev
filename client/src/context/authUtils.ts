import { createContext, useContext } from 'react';

export interface User {
  id: number;
  fname: string;
  lname: string;
  email: string;
  role: 'DONOR' | 'ACCEPTOR' | 'ADMIN';
  isVerified: boolean;
  address: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
}

export const AuthContext = createContext<AuthContextType>({ user: null, token: null });

export const useAuth = () => useContext(AuthContext);