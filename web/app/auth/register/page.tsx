import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-semibold text-primary hover:text-primary-dark" href="/login">
            Sign in
          </Link>
        </>
      }
      subtitle="Create your landlord workspace"
      title="Create account"
    >
      <RegisterForm />
    </AuthShell>
  );
}
