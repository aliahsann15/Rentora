"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/features/auth/login-form";
import { verifyStoredAuthSession } from "@/lib/auth/session";

export function LoginPage() {
  const router = useRouter();
  const [canShowForm, setCanShowForm] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function checkSession() {
      const verifiedUser = await verifyStoredAuthSession();

      if (!isActive) {
        return;
      }

      if (verifiedUser) {
        router.replace("/app/dashboard");
        return;
      }

      setCanShowForm(true);
    }

    void checkSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  if (!canShowForm) {
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
