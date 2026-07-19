"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button, Field, TextField } from "@/components/ui";
import { requestPasswordReset } from "@/lib/auth/client";
import { validateEmail, type AuthFieldErrors } from "@/lib/auth/validation";

type ForgotPasswordField = "email";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors<ForgotPasswordField>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 0 && !isLoading, [email, isLoading]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors: AuthFieldErrors<ForgotPasswordField> = {
      email: validateEmail(email) || undefined,
    };

    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean) || !canSubmit) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await requestPasswordReset({ email: email.trim().toLowerCase() });
      setMessage(response.message || "If this email exists, password reset instructions have been sent.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to send reset instructions.");
    } finally {
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
            setMessage(null);
          }}
          onBlur={() => setFieldErrors((current) => ({ ...current, email: validateEmail(email) || undefined }))}
          placeholder="manager@rentora.com"
          type="email"
          value={email}
        />
      </Field>

      {message ? (
        <div className="rounded-md border border-success bg-success-soft px-3 py-2 text-sm font-medium text-success">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}

      <Button className="mt-1 w-full" disabled={!canSubmit} isLoading={isLoading} size="lg" type="submit">
        Send reset link
      </Button>
    </form>
  );
}
