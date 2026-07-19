"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, FiBell, FiPlus, FiSearch } from "@/components/ui";
import type { AuthUser } from "@/lib/auth/types";
import { appNavItems } from "./app-nav";

type TopbarProps = {
  user: AuthUser | null;
};

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-divider bg-white">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3 lg:hidden" href="/app/dashboard">
          <Image alt="Rentora" className="h-auto w-28" height={959} src="/logo.png" width={3867} />
        </Link>

        <div className="hidden items-center gap-3 sm:flex">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary-soft text-sm font-bold text-primary">
            {(user?.name || "R").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-text-primary">{user?.name || "Rentora user"}</p>
            <p className="truncate text-xs font-medium text-text-muted">{user?.role?.toLowerCase() || "workspace"}</p>
          </div>
        </div>

        <div className="ml-auto hidden w-full max-w-sm items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-muted shadow-sm md:flex">
          <FiSearch aria-hidden="true" className="shrink-0" size={17} />
          <span className="truncate">Search requests, properties, units, people</span>
        </div>

        <div className="flex items-center gap-2">
          <Button icon={<FiPlus aria-hidden="true" size={16} />} size="sm">
            New request
          </Button>
          <button
            aria-label="Notifications"
            className="flex size-9 items-center justify-center rounded-md border border-border bg-surface text-text-secondary transition hover:border-text-muted hover:text-text-primary"
            type="button"
          >
            <FiBell aria-hidden="true" size={17} />
          </button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-divider px-4 py-2 lg:hidden">
        {appNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              className={[
                "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
                isActive ? "bg-primary text-white" : "text-text-primary hover:bg-surface-muted",
              ].join(" ")}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
