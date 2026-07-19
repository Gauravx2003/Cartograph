import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "../lib/api-client";

export interface User {
  id: string;
  githubId: number;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  console.log(user);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await apiClient.get<{ user: User | null }>("/auth/me");
        setUser(data.user);
      } catch (error) {
        console.error("Session check failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
