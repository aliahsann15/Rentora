import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
};

const toneClasses = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-tertiary",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-muted text-text-secondary",
};

export function MetricCard({ helper, icon, label, tone = "primary", value }: MetricCardProps) {
  return (
    <article className="rounded-md border border-border bg-surface p-5 shadow-[var(--rentora-shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-text-muted">{label}</p>
          <p className="mt-3 text-3xl font-bold leading-none text-text-primary">{value}</p>
        </div>
        {icon ? (
          <div className={["flex size-10 items-center justify-center rounded-md", toneClasses[tone]].join(" ")}>
            {icon}
          </div>
        ) : null}
      </div>
      {helper ? <p className="mt-4 text-sm font-medium text-text-secondary">{helper}</p> : null}
    </article>
  );
}
