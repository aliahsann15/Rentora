import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
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
