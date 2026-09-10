"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/features/auth/login-form";
import { verifyStoredAuthSession } from "@/lib/auth/session";
import { Button } from "@/components/ui";

export function LoginPage() {
  const router = useRouter();
  const [canShowForm, setCanShowForm] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function checkSession() {
      try {
        const verifiedUser = await verifyStoredAuthSession();

        if (!isActive) {
          return;
        }

        if (verifiedUser) {
          router.replace("/app/dashboard");
          return;
        }

        setCanShowForm(true);
        setSessionError(null);
      } catch (error) {
        if (isActive) setSessionError(error instanceof Error ? error.message : "Unable to verify session.");
      }
    }

    void checkSession();

    return () => {
      isActive = false;
    };
  }, [router, attempt]);

  if (!canShowForm) {
    if (sessionError) return (
      <AuthShell title="Welcome back" subtitle="Sign in to your account">
        <p className="mb-4 text-sm text-danger" role="alert">{sessionError}</p>
        <Button onClick={() => setAttempt((value) => value + 1)}>Retry</Button>
      </AuthShell>
    );
    return null;
  }

  return (
    <AuthShell
      footer={
        <>
          New landlord?{" "}
          <Link className="font-semibold text-primary hover:text-primary-dark" href="/auth/register">
            Create an organization
          </Link>
        </>
      }
      subtitle="Sign in to your account"
      title="Welcome back"
    >
      <LoginForm />
    </AuthShell>
  );
}
