"use client";

import { FormEvent, useMemo, useState } from "react";
import { PasswordInput } from "@/components/auth/password-input";
import { Button, Field, TextField } from "@/components/ui";
import { registerLandlord } from "@/lib/auth/client";
import { getPostLoginPath } from "@/lib/auth/routes";
import { saveAuthSession } from "@/lib/auth/storage";
import {
  validateEmail,
  validatePassword,
  validateRequired,
  type AuthFieldErrors,
} from "@/lib/auth/validation";

type RegisterField = "email" | "name" | "organizationName" | "password";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors<RegisterField>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 0 &&
      organizationName.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length > 0 &&
      !isLoading
    );
  }, [email, isLoading, name, organizationName, password]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors: AuthFieldErrors<RegisterField> = {
      email: validateEmail(email) || undefined,
      name: validateRequired(name, "Full name", 2, 80) || undefined,
      organizationName: validateRequired(organizationName, "Organization name", 2, 120) || undefined,
      password: validatePassword(password) || undefined,
    };

    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean) || !canSubmit) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await registerLandlord({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        organizationName: organizationName.trim(),
      });

      saveAuthSession(response);
      window.location.assign(getPostLoginPath(response.user.role));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create account. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <Field error={fieldErrors.name} label="Full name">
        <TextField
          aria-invalid={Boolean(fieldErrors.name)}
          autoComplete="name"
          name="name"
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
            setFieldErrors((current) => ({ ...current, name: undefined }));
          }}
          onBlur={() =>
            setFieldErrors((current) => ({
              ...current,
              name: validateRequired(name, "Full name", 2, 80) || undefined,
            }))
          }
          placeholder="Avery Brooks"
          value={name}
        />
      </Field>

      <Field error={fieldErrors.email} label="Email">
        <TextField
          aria-invalid={Boolean(fieldErrors.email)}
          autoComplete="email"
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

      <Field error={fieldErrors.password} label="Password" hint="Use at least 8 characters with A-Z, a-z, 0-9, and a symbol.">
        <PasswordInput
          aria-invalid={Boolean(fieldErrors.password)}
          autoComplete="new-password"
          name="password"
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          onBlur={() =>
            setFieldErrors((current) => ({ ...current, password: validatePassword(password) || undefined }))
          }
          placeholder="Create a password"
          value={password}
        />
      </Field>

      <Field error={fieldErrors.organizationName} label="Organization name">
        <TextField
          aria-invalid={Boolean(fieldErrors.organizationName)}
          autoComplete="organization"
          name="organizationName"
          onChange={(event) => {
            setOrganizationName(event.target.value);
            setError(null);
            setFieldErrors((current) => ({ ...current, organizationName: undefined }));
          }}
          onBlur={() =>
            setFieldErrors((current) => ({
              ...current,
              organizationName: validateRequired(organizationName, "Organization name", 2, 120) || undefined,
            }))
          }
          placeholder="Maple Court Property Group"
          value={organizationName}
        />
      </Field>

      {error ? (
        <div className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}

      <Button className="mt-1 w-full" disabled={!canSubmit} isLoading={isLoading} size="lg" type="submit">
        Create account
      </Button>
    </form>
  );
}
