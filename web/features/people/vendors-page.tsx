"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, FiSearch, TextField } from "@/components/ui";
import { apiGet } from "@/lib/api/client";
import type { VendorItem } from "@/lib/api/types";

type LoadState = "idle" | "loading" | "ready" | "error";

function getVendorName(vendor: VendorItem) {
  if (vendor.name) {
    return vendor.name;
  }

  if (typeof vendor.userId === "object" && vendor.userId?.name) {
    return vendor.userId.name;
  }

  return "Vendor";
}

function getVendorEmail(vendor: VendorItem) {
  if (vendor.email) {
    return vendor.email;
  }

  if (typeof vendor.userId === "object" && vendor.userId?.email) {
    return vendor.userId.email;
  }

  return "-";
}

export function VendorsPage() {
  const [error, setError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [query, setQuery] = useState("");
  const [vendors, setVendors] = useState<VendorItem[]>([]);

  const loadVendors = async () => {
    setLoadState("loading");
    setError(null);

    try {
      const items = await apiGet<VendorItem[]>("/vendors");
      setVendors(items);
      setLoadState("ready");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load vendors.");
      setLoadState("error");
    }
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadVendors();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  const filteredVendors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return vendors;
    }

    return vendors.filter((vendor) =>
      [getVendorName(vendor), getVendorEmail(vendor), ...(vendor.services || [])].join(" ").toLowerCase().includes(normalizedQuery)
    );
  }, [query, vendors]);

  return (
    <div className="mx-auto grid max-w-none gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-normal text-text-primary sm:text-3xl">Vendors</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
          View vendor profiles, services, active state, and job history.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-danger bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}

      <Card elevated>
        <CardHeader>
          <CardTitle>Vendor directory</CardTitle>
          <CardDescription>{loadState === "loading" ? "Loading vendors..." : `${filteredVendors.length} vendors shown`}</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="grid max-w-xl gap-2">
            <span className="text-xs font-semibold text-text-primary">Search</span>
            <span className="relative">
              <TextField
                className="w-full pl-9"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, email, or service"
                value={query}
              />
              <FiSearch aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            </span>
          </label>
        </CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead className="border-b border-divider bg-surface-muted text-xs font-bold uppercase text-text-secondary">
              <tr>
                <th className="px-5 py-3">Vendor</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Services</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Jobs</th>
                <th className="px-5 py-3">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {filteredVendors.map((vendor) => (
                <tr className="text-sm" key={vendor._id}>
                  <td className="px-5 py-4 font-bold text-text-primary">{getVendorName(vendor)}</td>
                  <td className="px-5 py-4 text-text-secondary">{getVendorEmail(vendor)}</td>
                  <td className="max-w-[340px] px-5 py-4 text-text-secondary">{vendor.services?.join(", ") || "-"}</td>
                  <td className="px-5 py-4 text-text-secondary">{typeof vendor.rating === "number" ? vendor.rating.toFixed(1) : "-"}</td>
                  <td className="px-5 py-4 text-text-secondary">{vendor.totalJobs ?? 0}</td>
                  <td className={["px-5 py-4 font-semibold", vendor.isActive === false ? "text-danger" : "text-success"].join(" ")}>
                    {vendor.isActive === false ? "Inactive" : "Active"}
                  </td>
                </tr>
              ))}

              {!filteredVendors.length ? (
                <tr>
                  <td className="px-5 py-10 text-center text-sm font-medium text-text-secondary" colSpan={6}>
                    No vendors found.
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
