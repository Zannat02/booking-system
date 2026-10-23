import { createContext } from "react";
import type { LoginData, RegisterData } from "../services/authService";
import type { AuthUser } from "../types";

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (data: LoginData) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);