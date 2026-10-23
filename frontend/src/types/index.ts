export type Role = "ADMIN" | "STAFF" | "CUSTOMER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  isActive: boolean;
  createdAt?: string;
}