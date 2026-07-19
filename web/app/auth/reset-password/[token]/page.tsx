"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export default function ResetPasswordTokenPage() {
  const params = useParams();
  const rawToken = params?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : typeof rawToken === "string" ? rawToken : "";

  return (
    <AuthShell
      footer={
        <Link className="font-semibold text-primary hover:text-primary-dark" href="/">
          Back to sign in
        </Link>
      }
      subtitle="Choose a new password for your account"
      title="Set new password"
    >
      <ResetPasswordForm initialToken={token} />
    </AuthShell>
  );
}
