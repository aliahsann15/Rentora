"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, FiSearch, TextField } from "@/components/ui";
import { apiGet } from "@/lib/api/client";
import type { UserItem } from "@/lib/api/types";

type LoadState = "idle" | "loading" | "ready" | "error";

export function TenantsPage() {
  const [error, setError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [query, setQuery] = useState("");
  const [tenants, setTenants] = useState<UserItem[]>([]);

  const loadTenants = async () => {
    setLoadState("loading");
    setError(null);

    try {
      const items = await apiGet<UserItem[]>("/users?role=TENANT");
      setTenants(items);
      setLoadState("ready");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load tenants.");
      setLoadState("error");
    }
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadTenants();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  const filteredTenants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return tenants;
    }

    return tenants.filter((tenant) =>
      [tenant.name, tenant.email, tenant.assignedUnitNumber || ""].join(" ").toLowerCase().includes(normalizedQuery)
    );
  }, [query, tenants]);

  return (
    <div className="mx-auto grid max-w-none gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-normal text-text-primary sm:text-3xl">Tenants</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
          View tenant users and their assigned unit context.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-danger bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}

      <Card elevated>
        <CardHeader>
          <CardTitle>Tenant directory</CardTitle>
          <CardDescription>{loadState === "loading" ? "Loading tenants..." : `${filteredTenants.length} tenants shown`}</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="grid max-w-xl gap-2">
            <span className="text-xs font-semibold text-text-primary">Search</span>
            <span className="relative">
              <TextField
                className="w-full pl-9"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, email, or unit"
                value={query}
              />
              <FiSearch aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            </span>
          </label>
        </CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="border-b border-divider bg-surface-muted text-xs font-bold uppercase text-text-secondary">
              <tr>
                <th className="px-5 py-3">Tenant</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Assigned unit</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {filteredTenants.map((tenant) => (
                <tr className="text-sm" key={tenant._id}>
                  <td className="px-5 py-4 font-bold text-text-primary">{tenant.name}</td>
                  <td className="px-5 py-4 text-text-secondary">{tenant.email}</td>
                  <td className="px-5 py-4 text-text-secondary">{tenant.assignedUnitNumber || "-"}</td>
                  <td className="px-5 py-4 text-text-secondary">{tenant.createdAt ? tenant.createdAt.slice(0, 10) : "-"}</td>
                </tr>
              ))}

              {!filteredTenants.length ? (
                <tr>
                  <td className="px-5 py-10 text-center text-sm font-medium text-text-secondary" colSpan={4}>
                    No tenants found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
