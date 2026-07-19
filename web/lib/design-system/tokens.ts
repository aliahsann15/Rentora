export const colors = {
  primary: "#3E54D3",
  primaryLight: "#6B78F6",
  primarySoft: "#EEF0FF",
  primaryDark: "#2E39A8",
  secondary: "#6C74A7",
  secondaryLight: "#8F95C6",
  secondarySoft: "#F0F1F8",
  tertiary: "#A44400",
  tertiaryLight: "#C86A2B",
  tertiarySoft: "#FFF4EA",
  success: "#10B981",
  successSoft: "#ECFDF5",
  warning: "#F59E0B",
  warningSoft: "#FFFBEB",
  danger: "#DC2626",
  dangerSoft: "#FEF2F2",
  background: "#F3F4F8",
  backgroundDark: "#1F2024",
  surface: "#FFFFFF",
  surfaceMuted: "#F8F9FC",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  border: "#E2E6F0",
  divider: "#EAEDF6",
  tenantAccent: "#14B8A6",
  vendorAccent: "#6C74A7",
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "40px",
} as const;

export const typography = {
  headingXL: "28px",
  headingL: "22px",
  headingM: "18px",
  bodyL: "16px",
  bodyM: "14px",
  caption: "12px",
} as const;

export const radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
} as const;

export const shadows = {
  card: "0 10px 28px rgb(15 23 42 / 7%)",
  panel: "0 20px 60px rgb(15 23 42 / 10%)",
} as const;

export type UserRole = "LANDLORD" | "TENANT" | "VENDOR";
export type RequestStatus = "NEW" | "ASSIGNED" | "IN_PROGRESS" | "DONE" | "VERIFIED";
export type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH";

export const roleAccents: Record<UserRole, string> = {
  LANDLORD: colors.primary,
  TENANT: colors.tenantAccent,
  VENDOR: colors.vendorAccent,
};

export const statusTokens: Record<
  RequestStatus,
  { label: string; foreground: string; background: string; border: string }
> = {
  NEW: {
    label: "New",
    foreground: colors.primaryDark,
    background: colors.primarySoft,
    border: colors.primaryLight,
  },
  ASSIGNED: {
    label: "Assigned",
    foreground: colors.tertiary,
    background: colors.warningSoft,
    border: colors.warning,
  },
  IN_PROGRESS: {
    label: "In Progress",
    foreground: colors.primary,
    background: colors.primarySoft,
    border: colors.primary,
  },
  DONE: {
    label: "Done",
    foreground: colors.success,
    background: colors.successSoft,
    border: colors.success,
  },
  VERIFIED: {
    label: "Verified",
    foreground: colors.success,
    background: colors.successSoft,
    border: colors.success,
  },
};

export const urgencyTokens: Record<
  UrgencyLevel,
  { label: string; foreground: string; background: string; border: string }
> = {
  LOW: {
    label: "Low",
    foreground: colors.secondary,
    background: colors.secondarySoft,
    border: colors.secondaryLight,
  },
  MEDIUM: {
    label: "Medium",
    foreground: colors.tertiary,
    background: colors.tertiarySoft,
    border: colors.tertiaryLight,
  },
  HIGH: {
    label: "High",
    foreground: colors.danger,
    background: colors.dangerSoft,
    border: colors.danger,
  },
};
