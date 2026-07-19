"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { PasswordInput } from "@/components/auth/password-input";
import { Button, Field, TextField } from "@/components/ui";
import { loginWithPassword } from "@/lib/auth/client";
import { getPostLoginPath } from "@/lib/auth/routes";
import { saveAuthSession } from "@/lib/auth/storage";
import { validateEmail, validateLoginPassword, type AuthFieldErrors } from "@/lib/auth/validation";

type LoginField = "email" | "password";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors<LoginField>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !isLoading;
  }, [email, isLoading, password]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors: AuthFieldErrors<LoginField> = {
      email: validateEmail(email) || undefined,
      password: validateLoginPassword(password) || undefined,
    };

    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean) || !canSubmit) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await loginWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      saveAuthSession({ ...response, rememberMe });
      window.location.assign(getPostLoginPath(response.user.role));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to sign in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <Field error={fieldErrors.email} label="Email">
        <TextField
          aria-invalid={Boolean(fieldErrors.email)}
          autoComplete="email"
          autoFocus
          name="email"
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
          onBlur={() => setFieldErrors((current) => ({ ...current, email: validateEmail(email) || undefined }))}
          placeholder="manager@rentora.com"
          type="email"
          value={email}
        />
      </Field>

      <Field error={fieldErrors.password} label="Password">
        <PasswordInput
          aria-invalid={Boolean(fieldErrors.password)}
          autoComplete="current-password"
          name="password"
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          onBlur={() =>
            setFieldErrors((current) => ({ ...current, password: validateLoginPassword(password) || undefined }))
          }
          placeholder="Enter your password"
          value={password}
        />
      </Field>

      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
          <input
            checked={rememberMe}
            className="size-4 rounded border-border accent-[var(--rentora-primary)]"
            onChange={(event) => setRememberMe(event.target.checked)}
            type="checkbox"
          />
          Remember me
        </label>
        <Link className="text-sm font-semibold text-primary hover:text-primary-dark" href="/auth/forgot-password">
          Forgot password?
        </Link>
      </div>

      {error ? (
        <div className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}

      <Button className="mt-1 w-full" disabled={!canSubmit} isLoading={isLoading} size="lg" type="submit">
        Sign in
      </Button>
    </form>
  );
}
