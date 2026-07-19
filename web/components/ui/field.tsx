import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type FieldProps = {
  children: ReactNode;
  error?: string;
  hint?: string;
  label: string;
};

export function Field({ children, error, hint, label }: FieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-text-muted">{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-danger">{error}</span> : null}
      {!error && hint ? <span className="text-xs font-medium text-text-muted">{hint}</span> : null}
    </label>
  );
}

export function FieldLabel({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={["grid gap-2 text-xs font-semibold text-text-muted", className].join(" ")} {...props} />;
}

export function TextField({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        "h-11 rounded-md border border-border bg-surface px-3 text-sm text-text-primary shadow-sm transition",
        "placeholder:text-text-muted hover:border-secondary-light focus:border-primary focus:outline-none",
        "disabled:bg-surface-muted disabled:text-text-muted",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={[
        "min-h-28 resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text-primary shadow-sm transition",
        "placeholder:text-text-muted hover:border-secondary-light focus:border-primary focus:outline-none",
        "disabled:bg-surface-muted disabled:text-text-muted",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
