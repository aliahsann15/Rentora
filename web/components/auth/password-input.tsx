"use client";

import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import { FiEye, FiEyeOff } from "@/components/ui";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({ className = "", ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className={[
        "rentora-password-field flex h-11 items-center rounded-md border border-border bg-surface px-3 transition",
        "hover:border-text-muted focus-within:border-text-primary",
        className,
      ].join(" ")}
    >
      <input
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
        type={showPassword ? "text" : "password"}
        {...props}
      />
      <button
        aria-label={showPassword ? "Hide password" : "Show password"}
        className="ml-3 flex size-8 items-center justify-center rounded-sm text-primary transition hover:bg-primary-soft"
        onClick={() => setShowPassword((current) => !current)}
        type="button"
      >
        {showPassword ? <FiEyeOff aria-hidden="true" size={18} /> : <FiEye aria-hidden="true" size={18} />}
      </button>
    </div>
  );
}
