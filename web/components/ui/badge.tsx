import type { HTMLAttributes } from "react";
import { statusTokens, urgencyTokens, type RequestStatus, type UrgencyLevel, type UserRole } from "@/lib/design-system";

type BadgeTone = "primary" | "success" | "warning" | "danger" | "neutral" | "tenant" | "vendor";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  primary: "border-primary-light bg-primary-soft text-primary-dark",
  success: "border-success bg-success-soft text-success",
  warning: "border-warning bg-warning-soft text-tertiary",
  danger: "border-danger bg-danger-soft text-danger",
  neutral: "border-border bg-surface-muted text-text-secondary",
  tenant: "border-tenant bg-emerald-50 text-tenant",
  vendor: "border-vendor bg-secondary-soft text-vendor",
};

export function Badge({ className = "", tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex h-7 items-center rounded-sm border px-2.5 text-xs font-semibold",
        toneClasses[tone],
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  const token = statusTokens[status];

  return (
    <span
      className="inline-flex h-7 items-center rounded-sm border px-2.5 text-xs font-semibold"
      style={{
        backgroundColor: token.background,
        borderColor: token.border,
        color: token.foreground,
      }}
    >
      {token.label}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  const token = urgencyTokens[urgency];

  return (
    <span
      className="inline-flex h-7 items-center rounded-sm border px-2.5 text-xs font-semibold"
      style={{
        backgroundColor: token.background,
        borderColor: token.border,
        color: token.foreground,
      }}
    >
      {token.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: UserRole }) {
  const tone: BadgeTone = role === "TENANT" ? "tenant" : role === "VENDOR" ? "vendor" : "primary";

  return <Badge tone={tone}>{role === "LANDLORD" ? "Property Manager" : role}</Badge>;
}
