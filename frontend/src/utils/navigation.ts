import type { Role } from "../types";

export interface NavItem {
  label: string;
  to: string;
}

export const navItemsByRole: Record<Role, NavItem[]> = {
  ADMIN: [{ label: "Dashboard", to: "/admin" }],
  STAFF: [{ label: "Dashboard", to: "/staff" }],
  CUSTOMER: [{ label: "Dashboard", to: "/customer" }],
};