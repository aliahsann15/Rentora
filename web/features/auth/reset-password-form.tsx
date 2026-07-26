"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { PasswordInput } from "@/components/auth/password-input";
import { Button, Field, TextField } from "@/components/ui";
import { resetPassword } from "@/lib/auth/client";
import {
  extractResetToken,
  validateConfirmPassword,
  validatePassword,
  validateResetToken,
  type AuthFieldErrors,
} from "@/lib/auth/validation";

type ResetPasswordFormProps = {
  initialToken?: string;
};

type ResetPasswordField = "confirmPassword" | "password" | "token";

export function ResetPasswordForm({ initialToken = "" }: ResetPasswordFormProps) {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors<ResetPasswordField>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(initialToken);

  const canSubmit = useMemo(() => {
    return token.trim().length > 0 && password.length > 0 && confirmPassword.length > 0 && !isLoading;
  }, [confirmPassword, isLoading, password, token]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors: AuthFieldErrors<ResetPasswordField> = {
      confirmPassword: validateConfirmPassword(password, confirmPassword) || undefined,
      password: validatePassword(password) || undefined,
      token: validateResetToken(token) || undefined,
    };

    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean) || !canSubmit) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await resetPassword({ token: extractResetToken(token), password });
      setMessage(response.message || "Password has been reset successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      {!initialToken ? (
        <Field error={fieldErrors.token} label="Reset token">
          <TextField
            aria-invalid={Boolean(fieldErrors.token)}
            autoComplete="one-time-code"
            autoFocus
            name="token"
            onChange={(event) => {
              setToken(event.target.value);
              setError(null);
              setFieldErrors((current) => ({ ...current, token: undefined }));
              setMessage(null);
            }}
            onBlur={() =>
              setFieldErrors((current) => ({ ...current, token: validateResetToken(token) || undefined }))
            }
            placeholder="Paste your reset token"
            value={token}
          />
        </Field>
      ) : null}

      <Field error={fieldErrors.password} label="New password" hint="Use at least 8 characters with A-Z, a-z, 0-9, and a symbol.">
        <PasswordInput
          aria-invalid={Boolean(fieldErrors.password)}
          autoComplete="new-password"
          autoFocus={Boolean(initialToken)}
          name="password"
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
            setFieldErrors((current) => ({ ...current, password: undefined, confirmPassword: undefined }));
            setMessage(null);
          }}
          onBlur={() =>
            setFieldErrors((current) => ({ ...current, password: validatePassword(password) || undefined }))
          }
          placeholder="Create a new password"
          value={password}
        />
      </Field>

      <Field error={fieldErrors.confirmPassword} label="Confirm password">
        <PasswordInput
          aria-invalid={Boolean(fieldErrors.confirmPassword)}
          autoComplete="new-password"
          name="confirmPassword"
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setError(null);
            setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
            setMessage(null);
          }}
          onBlur={() =>
            setFieldErrors((current) => ({
              ...current,
              confirmPassword: validateConfirmPassword(password, confirmPassword) || undefined,
            }))
          }
          placeholder="Confirm your new password"
          value={confirmPassword}
        />
      </Field>

      {message ? (
        <div className="rounded-md border border-success bg-success-soft px-3 py-2 text-sm font-medium text-success">
          {message}{" "}
          <Link className="font-semibold underline underline-offset-2" href="/login">
            Sign in
          </Link>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}

      <Button className="mt-1 w-full" disabled={!canSubmit} isLoading={isLoading} size="lg" type="submit">
        Reset password
      </Button>
    </form>
  );
}
