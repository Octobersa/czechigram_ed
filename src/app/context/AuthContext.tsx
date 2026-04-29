"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

interface AuthContextType {
  token: string | null;
  userId: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const params = useParams(); 
  const student = params.student as string; 

  useEffect(() => {
    const savedToken = localStorage.getItem(`token_${student}`);
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [student]);

  useEffect(() => {
    const fetchUserId = async () => {
      if (token) {
        try {
          const response = await fetch(`/${student}/api/protected/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setUserId(data.id); // Assuming the response contains the user ID
            setIsAdmin(data.role === 'admin')
          }
        } catch (error) {
          console.error('Failed to fetch user ID:', error);
        }
      }
      setIsLoading(false);
    };

    fetchUserId();
  }, [student, token]);

  const login = (newToken: string) => {
    setToken(newToken);
    setIsAuthenticated(true);
    localStorage.setItem(`token_${student}`, newToken);
    router.push(`/${student}/dashboard`);
  };

  const logout = () => {
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem(`token_${student}`);
    router.push(`/${student}/login`);
  };

  return (
    <AuthContext.Provider value={{ token, userId, isAdmin, login, logout, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};