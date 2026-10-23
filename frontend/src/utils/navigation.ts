import type { Role } from "../types";

export interface NavItem {
    label: string;
    to: string;
}

export const navItemsByRole: Record<Role, NavItem[]> = {
    ADMIN: [
        { label: "Dashboard", to: "/admin" },
        { label: "Bookings", to: "/admin/bookings" },
    ],
    STAFF: [
        { label: "Dashboard", to: "/staff" },
        { label: "Bookings", to: "/staff/bookings" },
    ],
    CUSTOMER: [
        { label: "Dashboard", to: "/customer" },
        { label: "Services", to: "/customer/services" },
        { label: "Plans", to: "/customer/plans" },
        { label: "Slots", to: "/customer/slots" },
        { label: "My Bookings", to: "/customer/bookings" },
    ],
};