import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      footer={
        <Link className="font-semibold text-primary hover:text-primary-dark" href="/">
          Back to sign in
        </Link>
      }
      subtitle="Enter your email and we will send reset instructions"
      title="Reset password"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
