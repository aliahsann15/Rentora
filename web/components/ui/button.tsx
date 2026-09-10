import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  isLoading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-[0_12px_24px_rgb(62_84_211/20%)] hover:bg-primary-dark",
  secondary:
    "border border-primary-light bg-primary-soft text-primary hover:border-primary hover:bg-[#e3e7ff]",
  danger: "bg-danger text-white hover:bg-red-700",
  ghost: "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 gap-2 rounded-sm px-3 text-xs",
  md: "h-11 gap-2 rounded-md px-4 text-sm",
  lg: "h-12 gap-2.5 rounded-md px-5 text-sm",
};

export function Button({
  className = "",
  children,
  disabled,
  icon,
  isLoading = false,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={[
        "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold transition",
        "disabled:pointer-events-none disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      disabled={isDisabled}
      type={type}
      {...props}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
