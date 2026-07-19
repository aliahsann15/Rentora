import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      footer={
        <Link className="font-semibold text-primary hover:text-primary-dark" href="/">
          Back to sign in
        </Link>
      }
      subtitle="Paste your reset token and choose a new password"
      title="Set new password"
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
