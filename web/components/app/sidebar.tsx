"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiLogOut, FiX } from "@/components/ui";
import { appNavItems } from "./app-nav";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onSignOut: () => void;
};

export function Sidebar({ isOpen = false, onClose, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  const navLinks = (isMobile = false) => (
    <nav className="flex flex-1 flex-col gap-2 px-4">
      {appNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            aria-label={item.label}
            className={[
              "flex h-12 items-center gap-3 overflow-hidden rounded-md transition-colors",
              isActive ? "bg-primary !text-white" : "text-text-primary hover:bg-surface-muted",
            ].join(" ")}
            href={item.href}
            key={item.href}
            onClick={isMobile ? onClose : undefined}
            tabIndex={isMobile && !isOpen ? -1 : 0}
            title={item.label}
          >
            <span className="flex size-12 shrink-0 items-center justify-center">
              <Icon aria-hidden="true" size={20} />
            </span>
            <span
              className={[
                "whitespace-nowrap text-sm font-semibold",
                isMobile ? "opacity-100" : "opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100",
              ].join(" ")}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="group/sidebar fixed inset-y-0 left-0 z-30 hidden w-20 overflow-hidden border-r border-divider bg-white shadow-sm transition-[width] duration-300 ease-out hover:w-64 lg:block">
        <div className="flex h-full flex-col py-5">
          <Link className="mx-4 mb-8 flex h-12 items-center overflow-hidden rounded-md" href="/app/dashboard">
            <span className="relative h-12 w-48 shrink-0">
              <Image
                alt="Rentora"
                className="absolute left-2 top-1/2 h-auto w-8.5 -translate-y-1/2 opacity-100 transition-opacity duration-300 ease-out group-hover/sidebar:opacity-0"
                height={512}
                src="/logo/logomark.png"
                width={512}
              />
              <Image
                alt="Rentora"
                className="absolute left-0 top-1/2 h-auto w-32 -translate-y-1/2 opacity-0 transition-opacity duration-300 ease-out group-hover/sidebar:opacity-100"
                height={959}
                priority
                src="/logo/logo.png"
                width={3867}
              />
            </span>
          </Link>

          {navLinks()}

          <div className="px-4">
            <button
              aria-label="Sign out"
              className="flex h-12 w-full items-center gap-3 overflow-hidden rounded-md text-text-primary transition-colors hover:bg-surface-muted"
              onClick={onSignOut}
              title="Sign out"
              type="button"
            >
              <span className="flex size-12 shrink-0 items-center justify-center">
                <FiLogOut aria-hidden="true" size={20} />
              </span>
              <span className="whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
                Sign out
              </span>
            </button>
          </div>
        </div>
      </aside>

      <div
        aria-hidden={!isOpen}
        className={[
          "fixed inset-0 z-40 lg:hidden",
          isOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
      >
          <button
            aria-label="Close navigation"
            className={[
              "absolute inset-0 bg-black/45 transition-opacity duration-300 ease-out",
              isOpen ? "opacity-100" : "opacity-0",
            ].join(" ")}
            onClick={onClose}
            tabIndex={isOpen ? 0 : -1}
            type="button"
          />
          <aside
            className={[
              "relative z-10 flex h-full w-[min(320px,86vw)] flex-col border-r border-divider bg-white py-5 shadow-[var(--rentora-shadow-panel)] transition-transform duration-300 ease-out will-change-transform",
              isOpen ? "translate-x-0" : "-translate-x-full",
            ].join(" ")}
          >
            <div className="mb-8 flex h-12 items-center justify-between gap-4 px-4">
              <Link className="flex min-w-0 items-center" href="/app/dashboard" onClick={onClose} tabIndex={isOpen ? 0 : -1}>
                <Image alt="Rentora" className="h-auto w-32" height={959} priority src="/logo/logo.png" width={3867} />
              </Link>
              <button
                aria-label="Close navigation"
                className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
                onClick={onClose}
                tabIndex={isOpen ? 0 : -1}
                type="button"
              >
                <FiX aria-hidden="true" size={18} />
              </button>
            </div>

            {navLinks(true)}

            <div className="px-4">
              <button
                aria-label="Sign out"
                className="flex h-12 w-full items-center gap-3 overflow-hidden rounded-md text-text-primary transition-colors hover:bg-surface-muted"
                onClick={onSignOut}
                tabIndex={isOpen ? 0 : -1}
                title="Sign out"
                type="button"
              >
                <span className="flex size-12 shrink-0 items-center justify-center">
                  <FiLogOut aria-hidden="true" size={20} />
                </span>
                <span className="whitespace-nowrap text-sm font-semibold">Sign out</span>
              </button>
            </div>
          </aside>
        </div>
    </>
  );
}
