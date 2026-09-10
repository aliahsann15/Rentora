"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToastMessages } from "@/components/app/toast-provider";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dropdown,
  FiDownload,
  FiEdit3,
  FiFilter,
  FiSearch,
  TextField,
  TextArea,
} from "@/components/ui";
import { apiGet, apiPost } from "@/lib/api/client";
import type { PropertyItem, RequestItem, UnitItem, UserItem, VendorItem } from "@/lib/api/types";
import { getAuthUser } from "@/lib/auth/storage";
import type { AuthUser } from "@/lib/auth/types";
import { statusTokens, urgencyTokens, type RequestStatus, type UrgencyLevel } from "@/lib/design-system";
import { showToast } from "@/lib/ui/toast";

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

type NewRequestForm = {
  description: string;
  propertyId: string;
  title: string;
  unitId: string;
  urgency: UrgencyLevel;
};

type TenantAssignment = {
  propertyId: string;
  propertyName?: string;
  unitId: string;
  unitNumber: string;
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

const emptyNewRequestForm: NewRequestForm = {
  description: "",
  propertyId: "",
  title: "",
  unitId: "",
  urgency: "MEDIUM",
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

function escapeCsvValue(value: string | undefined) {
  const normalizedValue = value || "";
  return `"${normalizedValue.replaceAll('"', '""')}"`;
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

export function RequestsPage({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return typeof window === "undefined" ? null : getAuthUser();
  });
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RequestFilters>(() => ({ ...initialFilters, query: initialQuery }));
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [newRequestForm, setNewRequestForm] = useState<NewRequestForm>(emptyNewRequestForm);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [tenants, setTenants] = useState<UserItem[]>([]);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  useToastMessages({ error, success });

  const loadRequestsPage = async () => {
    setLoadState("loading");
    setError(null);

    try {
      const storedUser = getAuthUser();
      setCurrentUser(storedUser);

      if (storedUser?.role === "TENANT") {
        const [requestItems, assignment] = await Promise.all([
          apiGet<RequestItem[]>("/requests"),
          apiGet<TenantAssignment>("/auth/me-assignment").catch(() => null),
        ]);

        setRequests(requestItems);
        setProperties(
          assignment
            ? [{ _id: assignment.propertyId, name: assignment.propertyName || "Assigned property" }]
            : [],
        );
        setUnits(
          assignment
            ? [{
                _id: assignment.unitId,
                propertyId: assignment.propertyId,
                status: "OCCUPIED",
                tenantId: storedUser._id,
                unitNumber: assignment.unitNumber,
              }]
            : [],
        );
        setTenants([]);
        setVendors([]);
      } else {
        const [requestItems, propertyItems, unitItems, tenantItems, vendorItems] = await Promise.all([
          apiGet<RequestItem[]>("/requests"),
          apiGet<PropertyItem[]>("/properties"),
          apiGet<UnitItem[]>("/units"),
          apiGet<UserItem[]>("/users?role=TENANT"),
          apiGet<VendorItem[]>("/vendors"),
        ]);

        setRequests(requestItems);
        setProperties(propertyItems);
        setUnits(unitItems);
        setTenants(tenantItems);
        setVendors(vendorItems);
      }
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

  const requestableUnits = useMemo(() => {
    return units.filter((unit) => Boolean(unit.tenantId));
  }, [units]);

  const canCreateRequests = currentUser?.role === "LANDLORD" || currentUser?.role === "TENANT";

  const selectedRequestUnit = useMemo(() => {
    return requestableUnits.find((unit) => unit._id === newRequestForm.unitId) || null;
  }, [newRequestForm.unitId, requestableUnits]);

  const selectedRequestTenant = useMemo(() => {
    if (currentUser?.role === "TENANT") {
      return currentUser;
    }

    return tenants.find((tenant) => tenant._id === selectedRequestUnit?.tenantId) || null;
  }, [currentUser, selectedRequestUnit?.tenantId, tenants]);

  const openNewRequestModal = () => {
    const firstUnit = requestableUnits[0];

    if (!firstUnit) {
      showToast({
        message: currentUser?.role === "TENANT" ? "No unit is assigned to your account." : "Create or assign an occupied unit before adding a request.",
        tone: "error",
      });
      return;
    }

    setError(null);
    setSuccess(null);
    setNewRequestForm({
      ...emptyNewRequestForm,
      propertyId: firstUnit.propertyId,
      unitId: firstUnit._id,
    });
    setIsNewRequestModalOpen(true);
  };

  const closeNewRequestModal = () => {
    if (updatingAction) {
      return;
    }

    setIsNewRequestModalOpen(false);
    setNewRequestForm(emptyNewRequestForm);
  };

  const updateNewRequestForm = (key: keyof NewRequestForm, value: string) => {
    setNewRequestForm((current) => {
      if (key !== "propertyId") {
        return { ...current, [key]: value };
      }

      const firstUnitForProperty = requestableUnits.find((unit) => unit.propertyId === value);
      return {
        ...current,
        propertyId: value,
        unitId: firstUnitForProperty?._id || "",
      };
    });
  };

  const submitNewRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRequestUnit || !selectedRequestTenant || !newRequestForm.title.trim() || !newRequestForm.description.trim()) {
      setError("Complete the title, description, and assigned unit before creating this request.");
      return;
    }

    setUpdatingAction("new-request");
    setError(null);

    try {
      await apiPost<RequestItem, {
        description: string;
        propertyId: string;
        tenantId: string;
        title: string;
        unitId: string;
        urgency: UrgencyLevel;
      }>("/requests", {
        description: newRequestForm.description.trim(),
        propertyId: selectedRequestUnit.propertyId,
        tenantId: selectedRequestTenant._id,
        title: newRequestForm.title.trim(),
        unitId: selectedRequestUnit._id,
        urgency: newRequestForm.urgency,
      });
      await loadRequestsPage();
      setIsNewRequestModalOpen(false);
      setNewRequestForm(emptyNewRequestForm);
      setSuccess("Maintenance request created.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create the request.");
    } finally {
      setUpdatingAction(null);
    }
  };

  const exportRequests = () => {
    if (!filteredRequests.length) {
      showToast({ message: "There are no requests to export.", tone: "error" });
      return;
    }

    const headers = [
      "Title",
      "Description",
      "Status",
      "Urgency",
      "Property",
      "Unit",
      "Tenant",
      "Vendor",
      "Created at",
      "Updated at",
    ];
    const rows = filteredRequests.map((request) => [
      request.title,
      request.description,
      formatLabel(request.status),
      formatLabel(request.urgency),
      request.propertyName || "",
      request.unitNumber || "",
      request.tenantName || "",
      request.vendorName || "Unassigned",
      request.createdAt,
      request.updatedAt || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
    const downloadUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = `rentora-maintenance-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);
    showToast({ message: `${filteredRequests.length} request${filteredRequests.length === 1 ? "" : "s"} exported.`, tone: "success" });
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
          {canCreateRequests ? (
            <Button icon={<FiEdit3 aria-hidden="true" size={16} />} onClick={openNewRequestModal} size="sm">
              New request
            </Button>
          ) : null}
          <Button icon={<FiDownload aria-hidden="true" size={16} />} onClick={exportRequests} size="sm" variant="secondary">
            Export
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
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
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 md:col-span-2">
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

            <Dropdown
              label="Status"
              onChange={(value) => updateFilter("status", value)}
              options={statuses.map((status) => ({
                label: status === "ALL" ? "All statuses" : formatLabel(status),
                value: status,
              }))}
              value={filters.status}
            />

            <Dropdown
              label="Urgency"
              onChange={(value) => updateFilter("urgency", value)}
              options={urgencies.map((urgency) => ({
                label: urgency === "ALL" ? "All urgency" : formatLabel(urgency),
                value: urgency,
              }))}
              value={filters.urgency}
            />

            <Dropdown
              label="Property"
              onChange={(value) => updateFilter("propertyId", value)}
              options={[
                { label: "All properties", value: "ALL" },
                ...properties.map((property) => ({ label: property.name, value: property._id })),
              ]}
              value={filters.propertyId}
            />

            <Dropdown
              label="Vendor"
              onChange={(value) => updateFilter("vendorId", value)}
              options={[
                { label: "All vendors", value: "ALL" },
                { label: "Unassigned", value: "UNASSIGNED" },
                ...vendors.map((vendor) => ({ label: getVendorName(vendor), value: vendor._id })),
              ]}
              value={filters.vendorId}
            />

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

      {isNewRequestModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          onMouseDown={closeNewRequestModal}
          role="presentation"
        >
          <div
            aria-labelledby="new-request-title"
            aria-modal="true"
            className="w-full max-w-2xl overflow-visible rounded-md border border-border bg-surface shadow-[var(--rentora-shadow-panel)]"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="border-b border-divider p-5">
              <h2 className="text-lg font-bold text-text-primary" id="new-request-title">New maintenance request</h2>
              <p className="mt-1 text-sm text-text-secondary">Describe the issue and select the occupied unit it affects.</p>
            </div>
            <form className="grid gap-4 p-5" onSubmit={submitNewRequest}>
              {currentUser?.role === "LANDLORD" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Dropdown
                    label="Property"
                    onChange={(value) => updateNewRequestForm("propertyId", value)}
                    options={properties.map((property) => ({ label: property.name, value: property._id }))}
                    value={newRequestForm.propertyId}
                  />
                  <Dropdown
                    disabled={!newRequestForm.propertyId}
                    label="Occupied unit"
                    onChange={(value) => updateNewRequestForm("unitId", value)}
                    options={requestableUnits
                      .filter((unit) => unit.propertyId === newRequestForm.propertyId)
                      .map((unit) => ({ label: unit.unitNumber, value: unit._id }))}
                    value={newRequestForm.unitId}
                  />
                </div>
              ) : (
                <div className="grid gap-3 rounded-md border border-primary-light bg-primary-soft p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-primary">Property</p>
                    <p className="mt-1 text-sm font-bold text-text-primary">{properties[0]?.name || "Assigned property"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary">Unit</p>
                    <p className="mt-1 text-sm font-bold text-text-primary">{selectedRequestUnit?.unitNumber || "-"}</p>
                  </div>
                </div>
              )}
              <div className="rounded-md border border-divider bg-surface-muted px-3 py-2.5">
                <p className="text-xs font-semibold text-text-muted">Tenant</p>
                <p className="mt-1 text-sm font-bold text-text-primary">{selectedRequestTenant?.name || "No tenant assigned"}</p>
              </div>
              <label className="grid gap-2">
                <span className="text-xs font-semibold text-text-primary">Request title</span>
                <TextField
                  autoFocus
                  maxLength={140}
                  onChange={(event) => updateNewRequestForm("title", event.target.value)}
                  placeholder="e.g. Kitchen sink is leaking"
                  value={newRequestForm.title}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-text-primary">Description</span>
                  <TextArea
                    maxLength={2000}
                    onChange={(event) => updateNewRequestForm("description", event.target.value)}
                    placeholder="Include the location, what is happening, and any helpful details."
                    value={newRequestForm.description}
                  />
                </label>
                <Dropdown
                  label="Urgency"
                  onChange={(value) => updateNewRequestForm("urgency", value)}
                  options={urgencies.map((urgency) => ({ label: formatLabel(urgency), value: urgency }))}
                  value={newRequestForm.urgency}
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-divider pt-4">
                <Button disabled={Boolean(updatingAction)} onClick={closeNewRequestModal} type="button" variant="secondary">
                  Cancel
                </Button>
                <Button isLoading={updatingAction === "new-request"} type="submit">
                  Create request
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
