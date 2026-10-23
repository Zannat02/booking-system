import type { Role } from "../types";

export interface NavItem {
    label: string;
    to: string;
}

export const navItemsByRole: Record<Role, NavItem[]> = {
    ADMIN: [
        { label: "Dashboard", to: "/admin" },
        { label: "Bookings", to: "/admin/bookings" },
        { label: "Slots", to: "/admin/slots" },
        { label: "Services", to: "/admin/services" },
        { label: "Categories", to: "/admin/categories" },
        { label: "Plans", to: "/admin/plans" },
    ],
    STAFF: [
        { label: "Dashboard", to: "/staff" },
        { label: "Bookings", to: "/staff/bookings" },
        { label: "Slots", to: "/staff/slots" },
        { label: "Services", to: "/staff/services" },
        { label: "Categories", to: "/staff/categories" },
    ],
    CUSTOMER: [
        { label: "Dashboard", to: "/customer" },
        { label: "Services", to: "/customer/services" },
        { label: "Plans", to: "/customer/plans" },
        { label: "Slots", to: "/customer/slots" },
        { label: "My Bookings", to: "/customer/bookings" },
    ],
};