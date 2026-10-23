import { useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  type LoginData,
  type RegisterData,
} from "../services/authService";
import type { AuthUser } from "../types";

const TOKEN_KEY = "token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem(TOKEN_KEY))
  );


  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      return;
    }

    let cancelled = false;

    const restoreSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!cancelled) {
          setUser(currentUser);
        }
      } 
     catch {
   
        if (!cancelled) {
          setUser(null);
        }
      }
      finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (data: LoginData): Promise<AuthUser> => {
    const response = await loginUser(data);
    localStorage.setItem(TOKEN_KEY, response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const register = async (data: RegisterData): Promise<AuthUser> => {
    const response = await registerUser(data);
    localStorage.setItem(TOKEN_KEY, response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}