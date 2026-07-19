"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FiAlertCircle,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiHome,
  FiPlus,
  FiUsers,
  LuBuilding2,
  StatusBadge,
  UrgencyBadge,
} from "@/components/ui";
import { apiGet } from "@/lib/api/client";
import type { PropertyItem, RequestItem, SubscriptionStatus, UnitItem, UserItem, VendorItem } from "@/lib/api/types";
import type { RequestStatus } from "@/lib/design-system";

type DashboardData = {
  properties: PropertyItem[];
  requests: RequestItem[];
  subscription: SubscriptionStatus | null;
  tenants: UserItem[];
  units: UnitItem[];
  vendors: VendorItem[];
};

type LoadState = "idle" | "loading" | "ready" | "error";

const requestStatuses: RequestStatus[] = ["NEW", "ASSIGNED", "IN_PROGRESS", "DONE", "VERIFIED"];

const statusLabels: Record<RequestStatus, string> = {
  ASSIGNED: "Assigned",
  DONE: "Done",
  IN_PROGRESS: "In progress",
  NEW: "New",
  VERIFIED: "Verified",
};

function formatDate(value?: string) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function isThisMonth(value?: string) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function daysSince(value?: string) {
  if (!value) {
    return 0;
  }

  return Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
}

function MetricTile({
  icon: Icon,
  label,
  tone = "primary",
  value,
}: {
  icon: typeof FiHome;
  label: string;
  tone?: "primary" | "success" | "warning" | "danger" | "vendor";
  value: string;
}) {
  const toneClasses = {
    danger: "bg-danger-soft text-danger",
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    vendor: "bg-secondary-soft text-vendor",
    warning: "bg-warning-soft text-tertiary",
  };

  return (
    <div className="rounded-md border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-text-secondary">{label}</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <div className={["flex size-10 items-center justify-center rounded-md", toneClasses[tone]].join(" ")}>
          <Icon aria-hidden="true" size={19} />
        </div>
      </div>
    </div>
  );
}

export function LandlordDashboard() {
  const [data, setData] = useState<DashboardData>({
    properties: [],
    requests: [],
    subscription: null,
    tenants: [],
    units: [],
    vendors: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");

  const loadDashboard = async () => {
    setLoadState("loading");
    setError(null);

    try {
      const [requests, properties, units, tenants, vendors, subscription] = await Promise.all([
        apiGet<RequestItem[]>("/requests"),
        apiGet<PropertyItem[]>("/properties"),
        apiGet<UnitItem[]>("/units"),
        apiGet<UserItem[]>("/users?role=TENANT"),
        apiGet<VendorItem[]>("/vendors"),
        apiGet<SubscriptionStatus>("/subscriptions/status").catch(() => null),
      ]);

      setData({ properties, requests, subscription, tenants, units, vendors });
      setLoadState("ready");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load dashboard.");
      setLoadState("error");
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const occupiedUnits = data.units.filter((unit) => unit.status === "OCCUPIED").length;
    const vacantUnits = data.units.filter((unit) => unit.status === "VACANT").length;
    const openRequests = data.requests.filter((request) => request.status !== "VERIFIED").length;
    const pendingAssignments = data.requests.filter((request) => request.status === "NEW").length;
    const inProgressRequests = data.requests.filter((request) => request.status === "IN_PROGRESS").length;
    const completedThisMonth = data.requests.filter(
      (request) => (request.status === "DONE" || request.status === "VERIFIED") && isThisMonth(request.updatedAt || request.createdAt)
    ).length;

    return {
      completedThisMonth,
      inProgressRequests,
      occupiedUnits,
      openRequests,
      pendingAssignments,
      vacantUnits,
    };
  }, [data.requests, data.units]);

  const statusCounts = useMemo(() => {
    return requestStatuses.reduce<Record<RequestStatus, number>>(
      (counts, status) => ({
        ...counts,
        [status]: data.requests.filter((request) => request.status === status).length,
      }),
      {
        ASSIGNED: 0,
        DONE: 0,
        IN_PROGRESS: 0,
        NEW: 0,
        VERIFIED: 0,
      }
    );
  }, [data.requests]);

  const maxStatusCount = Math.max(1, ...Object.values(statusCounts));
  const urgentUnassigned = data.requests.filter((request) => request.urgency === "HIGH" && request.status === "NEW").length;
  const agingRequests = data.requests.filter((request) => request.status !== "VERIFIED" && daysSince(request.createdAt) >= 3).length;
  const recentRequests = [...data.requests]
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="mx-auto grid max-w-8xl gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-text-primary sm:text-3xl">Operations overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            Track requests, unit occupancy, active vendors, and workspace health from one landing screen.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={<FiPlus aria-hidden="true" size={16} />} size="sm">
            Add request
          </Button>
          <Button size="sm" variant="secondary">
            Export
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-danger bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={LuBuilding2} label="Properties" value={loadState === "loading" ? "..." : String(data.properties.length)} />
        <MetricTile icon={FiHome} label="Total units" value={loadState === "loading" ? "..." : String(data.units.length)} />
        <MetricTile icon={FiCheck} label="Occupied units" tone="success" value={loadState === "loading" ? "..." : String(summary.occupiedUnits)} />
        <MetricTile icon={FiAlertCircle} label="Vacant units" tone="warning" value={loadState === "loading" ? "..." : String(summary.vacantUnits)} />
        <MetricTile icon={FiBriefcase} label="Open requests" value={loadState === "loading" ? "..." : String(summary.openRequests)} />
        <MetricTile icon={FiCalendar} label="Pending assignment" tone="danger" value={loadState === "loading" ? "..." : String(summary.pendingAssignments)} />
        <MetricTile icon={FiBriefcase} label="In progress" tone="vendor" value={loadState === "loading" ? "..." : String(summary.inProgressRequests)} />
        <MetricTile icon={FiUsers} label="Tenants and vendors" value={loadState === "loading" ? "..." : String(data.tenants.length + data.vendors.length)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card elevated>
          <CardHeader
            action={
              <Link className="text-sm font-semibold text-primary hover:text-primary-dark" href="/app/requests">
                View requests
              </Link>
            }
          >
            <CardTitle>Request pipeline</CardTitle>
            <CardDescription>Status distribution across active maintenance work.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {requestStatuses.map((status) => {
              const count = statusCounts[status];
              const width = `${Math.max(5, (count / maxStatusCount) * 100)}%`;

              return (
                <div className="grid gap-2" key={status}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={status} />
                      <span className="text-sm font-semibold text-text-primary">{statusLabels[status]}</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-sm bg-surface-muted">
                    <div className="h-full rounded-sm bg-primary" style={{ width }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card elevated>
          <CardHeader>
            <CardTitle>Operational alerts</CardTitle>
            <CardDescription>Items that need attention before they slow work down.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-md border border-danger bg-danger-soft p-3">
              <p className="text-sm font-bold text-danger">{urgentUnassigned} urgent unassigned</p>
              <p className="mt-1 text-xs font-medium text-text-secondary">High urgency requests still waiting for assignment.</p>
            </div>
            <div className="rounded-md border border-warning bg-warning-soft p-3">
              <p className="text-sm font-bold text-tertiary">{agingRequests} aging requests</p>
              <p className="mt-1 text-xs font-medium text-text-secondary">Open requests older than three days.</p>
            </div>
            <div className="rounded-md border border-border bg-surface-muted p-3">
              <p className="text-sm font-bold text-text-primary">
                {data.subscription?.planType || "Trial"} plan
              </p>
              <p className="mt-1 text-xs font-medium text-text-secondary">
                {data.subscription?.unitLimit ? `${data.units.length}/${data.subscription.unitLimit} units used.` : "Subscription limits will appear here."}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
        <Card elevated>
          <CardHeader>
            <CardTitle>Recent requests</CardTitle>
            <CardDescription>Newest maintenance activity across the portfolio.</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="border-b border-divider bg-surface-muted text-xs font-bold uppercase text-text-secondary">
                <tr>
                  <th className="px-5 py-3">Request</th>
                  <th className="px-5 py-3">Property</th>
                  <th className="px-5 py-3">Unit</th>
                  <th className="px-5 py-3">Urgency</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {recentRequests.length ? (
                  recentRequests.map((request) => (
                    <tr className="text-sm" key={request._id}>
                      <td className="max-w-[220px] px-5 py-4">
                        <p className="truncate font-bold text-text-primary">{request.title}</p>
                        <p className="mt-1 truncate text-xs font-medium text-text-muted">{request.tenantName || "Tenant"}</p>
                      </td>
                      <td className="px-5 py-4 text-text-secondary">{request.propertyName || "Unassigned"}</td>
                      <td className="px-5 py-4 text-text-secondary">{request.unitNumber || "-"}</td>
                      <td className="px-5 py-4">
                        <UrgencyBadge urgency={request.urgency} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-5 py-4 text-text-secondary">{formatDate(request.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-8 text-center text-sm font-medium text-text-secondary" colSpan={6}>
                      No requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card elevated>
          <CardHeader
            action={
              <Link className="text-sm font-semibold text-primary hover:text-primary-dark" href="/app/properties">
                View properties
              </Link>
            }
          >
            <CardTitle>Property occupancy</CardTitle>
            <CardDescription>Unit status by property, based on current unit records.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.properties.slice(0, 5).map((property) => {
              const propertyUnits = data.units.filter((unit) => unit.propertyId === property._id);
              const occupied = propertyUnits.filter((unit) => unit.status === "OCCUPIED").length;
              const total = Math.max(1, propertyUnits.length || property.totalUnits || 0);
              const width = `${Math.min(100, (occupied / total) * 100)}%`;

              return (
                <div className="rounded-md border border-border bg-surface-muted p-3" key={property._id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-bold text-text-primary">{property.name}</p>
                    <p className="text-xs font-semibold text-text-secondary">
                      {occupied}/{total} occupied
                    </p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-sm bg-white">
                    <div className="h-full rounded-sm bg-success" style={{ width }} />
                  </div>
                </div>
              );
            })}

            {!data.properties.length ? (
              <div className="rounded-md border border-dashed border-border bg-surface-muted px-3 py-8 text-center">
                <p className="text-sm font-bold text-text-primary">No properties yet</p>
                <p className="mt-1 text-xs font-medium text-text-secondary">Create a property to start tracking units and requests.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
