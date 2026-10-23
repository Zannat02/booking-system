import type { Role } from "../types";

export const getHomePath = (role: Role): string => {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "STAFF":
      return "/staff";
    default:
      return "/customer";
  }
};