export type Role = "ADMIN" | "STAFF" | "CUSTOMER";
export * from "./common";
export * from "./catalog";
export * from "./subscription";
export * from "./booking";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  isActive: boolean;
  createdAt?: string;
}