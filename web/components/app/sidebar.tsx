"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiLogOut } from "@/components/ui";
import { appNavItems } from "./app-nav";

type SidebarProps = {
  onSignOut: () => void;
};

export function Sidebar({ onSignOut }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="group/sidebar fixed inset-y-0 left-0 z-30 hidden w-20 overflow-hidden border-r border-divider bg-white shadow-sm transition-[width] duration-300 ease-out hover:w-64 lg:block">
      <div className="flex h-full flex-col py-5">
        <Link className="mx-4 mb-8 flex h-12 items-center overflow-hidden rounded-md" href="/app/dashboard">
          <span className="relative h-12 w-48 shrink-0">
            <Image
              alt="Rentora"
              className="absolute left-2 top-1/2 h-auto w-8.5 -translate-y-1/2 opacity-100 transition-opacity duration-300 ease-out group-hover/sidebar:opacity-0"
              height={512}
              src="/logomark.png"
              width={512}
            />
            <Image
              alt="Rentora"
              className="absolute left-0 top-1/2 h-auto w-32 -translate-y-1/2 opacity-0 transition-opacity duration-300 ease-out group-hover/sidebar:opacity-100"
              height={959}
              priority
              src="/logo.png"
              width={3867}
            />
          </span>
        </Link>

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
                title={item.label}
              >
                <span className="flex size-12 shrink-0 items-center justify-center">
                  <Icon aria-hidden="true" size={20} />
                </span>
                <span className="whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

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
  );
}
