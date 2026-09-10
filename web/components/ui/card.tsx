import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
};

export function Card({ className = "", elevated = false, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-md border border-border bg-surface",
        elevated ? "shadow-[var(--rentora-shadow-card)]" : "",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function CardHeader({
  action,
  children,
  className = "",
}: HTMLAttributes<HTMLDivElement> & { action?: ReactNode }) {
  return (
    <div className={["flex items-start justify-between gap-4 border-b border-divider p-5", className].join(" ")}>
      <div className="min-w-0">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardTitle({ className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={["text-lg font-bold leading-7 text-text-primary sm:text-xl", className].join(" ")}
      {...props}
    />
  );
}

export function CardDescription({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={["mt-1 text-sm leading-6 text-text-secondary", className].join(" ")}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["p-5", className].join(" ")} {...props} />;
}
