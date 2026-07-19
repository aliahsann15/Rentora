import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  subtitle: string;
  title: string;
};

export function AuthShell({ children, footer, subtitle, title }: AuthShellProps) {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-10 text-text-primary"
      style={{
        backgroundImage:
          "linear-gradient(rgb(243 244 248 / 86%), rgb(243 244 248 / 86%)), url('/bg.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <section className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="Rentora home">
            <Image
              alt="Rentora"
              className="h-auto w-40"
              height={959}
              priority
              src="/logo.png"
              width={3867}
            />
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-white/95 p-6 shadow-[var(--rentora-shadow-card)] backdrop-blur-sm sm:p-8">
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
            <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
          </div>

          {children}

          {footer ? <div className="mt-7 border-t border-divider pt-5 text-center text-sm text-text-secondary">{footer}</div> : null}
        </div>
      </section>
    </main>
  );
}
