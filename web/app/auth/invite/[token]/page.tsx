"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { InviteRegistrationForm } from "@/features/auth/invite-registration-form";

export default function InvitePage() {
  const params = useParams();
  const rawToken = params?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : typeof rawToken === "string" ? rawToken : "";

  return (
    <AuthShell
      footer={
        <>
          Already registered?{" "}
          <Link className="font-semibold text-primary hover:text-primary-dark" href="/">
            Sign in
          </Link>
        </>
      }
      subtitle="Complete your profile to join Rentora"
      title="Accept invite"
    >
      <InviteRegistrationForm token={token} />
    </AuthShell>
  );
}
