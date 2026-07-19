import type { IconType } from "react-icons";
import { FiBriefcase, FiGrid, FiSettings, FiUsers, LuBuilding2 } from "@/components/ui";

export type AppNavItem = {
  href: string;
  icon: IconType;
  label: string;
};

export const appNavItems: AppNavItem[] = [
  { href: "/app/dashboard", icon: FiGrid, label: "Dashboard" },
  { href: "/app/requests", icon: FiBriefcase, label: "Requests" },
  { href: "/app/properties", icon: LuBuilding2, label: "Properties" },
  { href: "/app/tenants", icon: FiUsers, label: "Tenants" },
  { href: "/app/vendors", icon: FiBriefcase, label: "Vendors" },
  { href: "/app/settings", icon: FiSettings, label: "Settings" },
];
