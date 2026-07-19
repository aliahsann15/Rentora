import type { HTMLAttributes, ReactNode } from "react";

type PageHeaderProps = HTMLAttributes<HTMLElement> & {
  actions?: ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
};

export function PageShell({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <main
      className={["min-h-screen bg-background px-6 py-6 text-text-primary lg:px-8", className].join(" ")}
      {...props}
    />
  );
}

export function PageHeader({
  actions,
  className = "",
  eyebrow,
  subtitle,
  title,
  ...props
}: PageHeaderProps) {
  return (
    <header className={["mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className].join(" ")} {...props}>
      <div className="min-w-0">
        {eyebrow ? <p className="mb-2 text-xs font-bold uppercase text-primary">{eyebrow}</p> : null}
        <h1 className="text-2xl font-bold leading-tight text-text-primary">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionGrid({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={["grid gap-4 lg:grid-cols-12", className].join(" ")} {...props} />;
}
