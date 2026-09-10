import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Rentora | Property Maintenance Management Software for Landlords",
  description:
    "Rentora helps landlords track maintenance requests, assign vendors, manage tenants, and monitor every unit from one clean property management dashboard.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-text-primary">
      <section className="relative flex min-h-screen flex-col overflow-hidden px-5 py-6 sm:px-8 lg:px-12">
        <Image
          src="/images/hero-right.png"
          alt="Modern rental apartment building"
          priority
          width={1920}
          height={1080}
          className="absolute bottom-0 -right-132 h-auto w-350 opacity-65"
        />
        <Image
          alt="Modern rental apartment building"
          className="absolute -bottom-12 -left-60 h-225 w-auto opacity-80"
          height={1080}
          priority
          src="/images/hero-left1.png"
          width={1920}
        />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between">
          <Link aria-label="Rentora home" href="/">
            <Image alt="Rentora" className="h-auto w-32 sm:w-36" height={959} priority src="/logo/logo.png" width={3867} />
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-bold text-white! shadow-[0_12px_24px_rgb(62_84_211/20%)] transition hover:bg-primary-dark"
            href="/login"
          >
            Sign in
          </Link>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center justify-center py-20">
          <div className="max-w-6xl text-center flex flex-col items-center">
            <h1 className="max-w-5xl text-5xl font-black leading-[1.02] tracking-normal text-text-primary sm:text-6xl lg:text-7xl">
              Property Maintenance Without Scattered Messages and Follow-Ups.
            </h1>
            <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-text-secondary sm:text-xl">
              Manage maintenance requests, assign vendors, track repair progress, and keep tenants updated - all from one clear,
              structured workflow.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 text-sm font-bold text-white! shadow-[0_18px_36px_rgb(62_84_211/10%)] transition hover:bg-primary-dark"
                href="/login"
              >
                Start Free
              </Link>
              <a
                className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-white/80 px-6 text-sm font-bold text-text-primary shadow-sm transition hover:border-text-muted hover:bg-white"
                href="#maintenance-workflow"
              >
                See How It Works
              </a>
            </div>

            <p className="mt-7 max-w-3xl text-sm font-semibold leading-6 text-text-secondary">
              Built for landlords who want maintenance handled faster, with less back-and-forth.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
