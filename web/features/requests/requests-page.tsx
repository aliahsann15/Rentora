"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FiChevronDown,
  FiEdit3,
  FiFilter,
  FiSearch,
  TextField,
} from "@/components/ui";
import { apiGet } from "@/lib/api/client";
import type { PropertyItem, RequestItem, VendorItem } from "@/lib/api/types";
import { statusTokens, urgencyTokens, type RequestStatus, type UrgencyLevel } from "@/lib/design-system";

type LoadState = "idle" | "loading" | "ready" | "error";
type StatusFilter = "ALL" | RequestStatus;
type UrgencyFilter = "ALL" | UrgencyLevel;

type RequestFilters = {
  dateFrom: string;
  dateTo: string;
  propertyId: string;
  query: string;
  status: StatusFilter;
  urgency: UrgencyFilter;
  vendorId: string;
};

const statuses: StatusFilter[] = ["ALL", "NEW", "ASSIGNED", "IN_PROGRESS", "DONE", "VERIFIED"];
const urgencies: UrgencyFilter[] = ["ALL", "LOW", "MEDIUM", "HIGH"];

const initialFilters: RequestFilters = {
  dateFrom: "",
  dateTo: "",
  propertyId: "ALL",
  query: "",
  status: "ALL",
  urgency: "ALL",
  vendorId: "ALL",
};

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StatusText({ status }: { status: RequestStatus }) {
  const token = statusTokens[status];

  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: token.foreground }}>
      <span className="size-2 rounded-full" style={{ backgroundColor: token.foreground }} />
      {token.label}
    </span>
  );
}

function UrgencyText({ urgency }: { urgency: UrgencyLevel }) {
  const token = urgencyTokens[urgency];

  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: token.foreground }}>
      <span className="size-2 rounded-full" style={{ backgroundColor: token.foreground }} />
      {token.label}
    </span>
  );
}

function getVendorName(vendor: VendorItem) {
  if (vendor.name) {
    return vendor.name;
  }

  if (typeof vendor.userId === "object" && vendor.userId?.name) {
    return vendor.userId.name;
  }

  if (vendor.email) {
    return vendor.email;
  }

  if (typeof vendor.userId === "object" && vendor.userId?.email) {
    return vendor.userId.email;
  }

  return "Vendor";
}

function isWithinDateRange(request: RequestItem, dateFrom: string, dateTo: string) {
  const createdAt = new Date(request.createdAt).getTime();

  if (dateFrom && createdAt < new Date(`${dateFrom}T00:00:00`).getTime()) {
    return false;
  }

  if (dateTo && createdAt > new Date(`${dateTo}T23:59:59`).getTime()) {
    return false;
  }

  return true;
}

function SelectField({
  label,
  onChange,
  value,
  children,
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-text-primary">{label}</span>
      <span className="relative">
        <select
          className="h-11 w-full appearance-none rounded-md border border-border bg-surface px-3 pr-9 text-sm font-medium text-text-primary shadow-sm outline-none transition hover:border-text-muted focus:border-text-primary"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {children}
        </select>
        <FiChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
          size={16}
        />
      </span>
    </label>
  );
}

export function RequestsPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RequestFilters>(initialFilters);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);

  const loadRequestsPage = async () => {
    setLoadState("loading");
    setError(null);

    try {
      const [requestItems, propertyItems, vendorItems] = await Promise.all([
        apiGet<RequestItem[]>("/requests"),
        apiGet<PropertyItem[]>("/properties"),
        apiGet<VendorItem[]>("/vendors"),
      ]);

      setRequests(requestItems);
      setProperties(propertyItems);
      setVendors(vendorItems);
      setLoadState("ready");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load requests.");
      setLoadState("error");
    }
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadRequestsPage();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  const filteredRequests = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return requests.filter((request) => {
      const searchableText = [
        request.title,
        request.description,
        request.propertyName,
        request.unitNumber,
        request.tenantName,
        request.vendorName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || searchableText.includes(query);
      const matchesStatus = filters.status === "ALL" || request.status === filters.status;
      const matchesUrgency = filters.urgency === "ALL" || request.urgency === filters.urgency;
      const matchesProperty = filters.propertyId === "ALL" || request.propertyId === filters.propertyId;
      const matchesVendor =
        filters.vendorId === "ALL" ||
        (filters.vendorId === "UNASSIGNED" ? !request.vendorId : request.vendorId === filters.vendorId);
      const matchesDate = isWithinDateRange(request, filters.dateFrom, filters.dateTo);

      return matchesQuery && matchesStatus && matchesUrgency && matchesProperty && matchesVendor && matchesDate;
    });
  }, [filters, requests]);

  const metrics = useMemo(() => {
    return {
      doneAwaitingVerification: requests.filter((request) => request.status === "DONE").length,
      highUrgency: requests.filter((request) => request.urgency === "HIGH").length,
      inProgress: requests.filter((request) => request.status === "IN_PROGRESS").length,
      open: requests.filter((request) => request.status !== "VERIFIED").length,
      unassigned: requests.filter((request) => request.status === "NEW" || !request.vendorId).length,
    };
  }, [requests]);

  const updateFilter = (key: keyof RequestFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  return (
    <div className="mx-auto grid max-w-none gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-text-primary sm:text-3xl">Maintenance requests</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            Search, filter, and open each request as a focused sub-page under the Requests tab.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={<FiEdit3 aria-hidden="true" size={16} />} size="sm">
            New request
          </Button>
          <Button size="sm" variant="secondary">
            Export
          </Button>
        </div>
      </div>

      <section className="grid grid-flow-col auto-cols-[minmax(190px,1fr)] gap-3 overflow-x-auto pb-1">
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary">Open requests</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{loadState === "loading" ? "..." : metrics.open}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary">Unassigned</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{loadState === "loading" ? "..." : metrics.unassigned}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary">In progress</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{loadState === "loading" ? "..." : metrics.inProgress}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary">High urgency</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{loadState === "loading" ? "..." : metrics.highUrgency}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary">Awaiting verification</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">
            {loadState === "loading" ? "..." : metrics.doneAwaitingVerification}
          </p>
        </Card>
      </section>

      <Card elevated>
        <CardHeader
          action={
            <Button isLoading={loadState === "loading"} onClick={loadRequestsPage} size="sm" variant="secondary">
              Refresh
            </Button>
          }
        >
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine by keyword, status, urgency, property, vendor, and date.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr]">
            <label className="grid gap-2">
              <span className="text-xs font-semibold text-text-primary">Search</span>
              <span className="relative">
                <TextField
                  className="w-full pl-9"
                  onChange={(event) => updateFilter("query", event.target.value)}
                  placeholder="Title, tenant, unit, property"
                  value={filters.query}
                />
                <FiSearch
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  size={16}
                />
              </span>
            </label>

            <SelectField label="Status" onChange={(value) => updateFilter("status", value)} value={filters.status}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All statuses" : formatLabel(status)}
                </option>
              ))}
            </SelectField>

            <SelectField label="Urgency" onChange={(value) => updateFilter("urgency", value)} value={filters.urgency}>
              {urgencies.map((urgency) => (
                <option key={urgency} value={urgency}>
                  {urgency === "ALL" ? "All urgency" : formatLabel(urgency)}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.65fr_0.65fr_auto]">
            <SelectField label="Property" onChange={(value) => updateFilter("propertyId", value)} value={filters.propertyId}>
              <option value="ALL">All properties</option>
              {properties.map((property) => (
                <option key={property._id} value={property._id}>
                  {property.name}
                </option>
              ))}
            </SelectField>

            <SelectField label="Vendor" onChange={(value) => updateFilter("vendorId", value)} value={filters.vendorId}>
              <option value="ALL">All vendors</option>
              <option value="UNASSIGNED">Unassigned</option>
              {vendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {getVendorName(vendor)}
                </option>
              ))}
            </SelectField>

            <label className="grid gap-2">
              <span className="text-xs font-semibold text-text-primary">From</span>
              <TextField
                onChange={(event) => updateFilter("dateFrom", event.target.value)}
                type="date"
                value={filters.dateFrom}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold text-text-primary">To</span>
              <TextField
                onChange={(event) => updateFilter("dateTo", event.target.value)}
                type="date"
                value={filters.dateTo}
              />
            </label>

            <div className="flex items-end">
              <Button className="w-full" onClick={clearFilters} size="md" variant="secondary">
                Clear filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-md border border-danger bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}

      <Card elevated className="overflow-hidden">
        <CardHeader
          action={
            <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <FiFilter aria-hidden="true" size={16} />
              {filteredRequests.length} shown
            </div>
          }
        >
          <CardTitle>Request table</CardTitle>
          <CardDescription>Click a row to open the request detail page.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="sticky top-0 border-b border-divider bg-surface-muted text-xs font-bold uppercase text-text-secondary">
              <tr>
                <th className="px-5 py-3">Request</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Urgency</th>
                <th className="px-5 py-3">Property</th>
                <th className="px-5 py-3">Unit</th>
                <th className="px-5 py-3">Tenant</th>
                <th className="px-5 py-3">Vendor</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {filteredRequests.map((request) => (
                <tr
                  className="cursor-pointer text-sm transition hover:bg-surface-muted"
                  key={request._id}
                  onClick={() => router.push(`/app/requests/${request._id}`)}
                >
                  <td className="max-w-[260px] px-5 py-4">
                    <p className="truncate font-bold text-text-primary">{request.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs font-medium text-text-muted">{request.description}</p>
                  </td>
                  <td className="px-5 py-4">
                    <StatusText status={request.status} />
                  </td>
                  <td className="px-5 py-4">
                    <UrgencyText urgency={request.urgency} />
                  </td>
                  <td className="px-5 py-4 text-text-secondary">{request.propertyName || "-"}</td>
                  <td className="px-5 py-4 text-text-secondary">{request.unitNumber || "-"}</td>
                  <td className="px-5 py-4 text-text-secondary">{request.tenantName || "-"}</td>
                  <td className="px-5 py-4 text-text-secondary">{request.vendorName || "Unassigned"}</td>
                  <td className="px-5 py-4 text-text-secondary">{formatDateTime(request.createdAt)}</td>
                  <td className="px-5 py-4 text-text-secondary">{formatDateTime(request.updatedAt)}</td>
                </tr>
              ))}

              {!filteredRequests.length ? (
                <tr>
                  <td className="px-5 py-10 text-center text-sm font-medium text-text-secondary" colSpan={9}>
                    No requests match the current filters.
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
