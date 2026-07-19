"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PasswordInput } from "@/components/auth/password-input";
import { Button, Field, TextField } from "@/components/ui";
import { registerFromInvite, validateInviteToken } from "@/lib/auth/client";
import { getPostLoginPath } from "@/lib/auth/routes";
import { saveAuthSession } from "@/lib/auth/storage";
import type { InviteValidationResponse } from "@/lib/auth/types";
import {
  validateOptionalPhone,
  validatePassword,
  validateRequired,
  type AuthFieldErrors,
} from "@/lib/auth/validation";

type InviteRegistrationFormProps = {
  token: string;
};

type InviteField = "name" | "password" | "phone";

export function InviteRegistrationForm({ token }: InviteRegistrationFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors<InviteField>>({});
  const [invite, setInvite] = useState<InviteValidationResponse | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInvite() {
      if (!token) {
        setError("Invite token is missing.");
        setIsLoadingInvite(false);
        return;
      }

      try {
        const response = await validateInviteToken(token);
        if (isMounted) {
          setInvite(response);
          setError(null);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to validate invite.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingInvite(false);
        }
      }
    }

    loadInvite();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const canSubmit = useMemo(() => {
    return Boolean(invite) && name.trim().length > 0 && password.length > 0 && !isSubmitting;
  }, [invite, isSubmitting, name, password]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors: AuthFieldErrors<InviteField> = {
      name: validateRequired(name, "Full name", 2, 80) || undefined,
      password: validatePassword(password) || undefined,
      phone: validateOptionalPhone(phone) || undefined,
    };

    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean) || !canSubmit) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await registerFromInvite({
        token,
        name: name.trim(),
        password,
        phone: phone.trim() || undefined,
      });

      saveAuthSession(response);
      window.location.assign(getPostLoginPath(response.user.role));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to accept invite. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isLoadingInvite) {
    return (
      <div className="rounded-md border border-border bg-surface-muted px-3 py-3 text-center text-sm font-medium text-text-secondary">
        Checking invite...
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <Field label="Invite email">
        <TextField disabled value={invite?.email || ""} />
      </Field>

      <Field error={fieldErrors.name} label="Full name">
        <TextField
          aria-invalid={Boolean(fieldErrors.name)}
          autoComplete="name"
          autoFocus
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

      <Field error={fieldErrors.phone} label="Phone">
        <TextField
          aria-invalid={Boolean(fieldErrors.phone)}
          autoComplete="tel"
          name="phone"
          onChange={(event) => {
            setPhone(event.target.value);
            setError(null);
            setFieldErrors((current) => ({ ...current, phone: undefined }));
          }}
          onBlur={() =>
            setFieldErrors((current) => ({ ...current, phone: validateOptionalPhone(phone) || undefined }))
          }
          placeholder="Optional"
          type="tel"
          value={phone}
        />
      </Field>

      <Field error={fieldErrors.password} label="Password" hint="Use at least 8 characters with A-Z, a-z, 0-9, and a symbol.">
        <PasswordInput
          aria-invalid={Boolean(fieldErrors.password)}
          autoComplete="new-password"
          disabled={!invite}
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

      {invite ? (
        <div className="rounded-md border border-divider bg-surface-muted px-3 py-2 text-sm font-medium text-text-secondary">
          Role: <span className="text-text-primary">{invite.role.toLowerCase()}</span>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}

      <Button className="mt-1 w-full" disabled={!canSubmit} isLoading={isSubmitting} size="lg" type="submit">
        Accept invite
      </Button>
    </form>
  );
}
