import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface User {
  id: number;
  fname: string;
  lname: string;
  email: string;
  role: 'DONOR' | 'ACCEPTOR' | 'ADMIN';
  isVerified: boolean;
  address: string;
}

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user: User | null = JSON.parse(localStorage.getItem('user') || 'null');
  const token: string | null = localStorage.getItem('token');

  if (!token || !user ) {
    return <Navigate to="/login" replace />;
  }

  return children;
}