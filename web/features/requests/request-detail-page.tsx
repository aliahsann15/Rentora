"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useToastMessages } from "@/components/app/toast-provider";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dropdown,
  FiAlertCircle,
  FiCheck,
  FiChevronLeft,
} from "@/components/ui";
import { apiGet, apiPatch } from "@/lib/api/client";
import { API_BASE_URL } from "@/lib/api/config";
import type { RequestItem, VendorItem } from "@/lib/api/types";
import { getAuthUser } from "@/lib/auth/storage";
import type { AuthUser } from "@/lib/auth/types";
import { statusTokens, urgencyTokens, type RequestStatus, type UrgencyLevel } from "@/lib/design-system";

type LoadState = "idle" | "loading" | "ready" | "error";

const allowedStatusTransitions: Record<RequestStatus, RequestStatus[]> = {
  ASSIGNED: ["IN_PROGRESS"],
  DONE: ["VERIFIED"],
  IN_PROGRESS: ["DONE"],
  NEW: ["ASSIGNED"],
  VERIFIED: [],
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
    year: "numeric",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveMediaUrl(value: string) {
  return value.startsWith("/media/") ? `${API_BASE_URL.replace(/\/api$/, "")}${value}` : value;
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

function getVendorEmail(vendor: VendorItem) {
  if (vendor.email) {
    return vendor.email;
  }

  if (typeof vendor.userId === "object" && vendor.userId?.email) {
    return vendor.userId.email;
  }

  return "";
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid gap-1 border-b border-divider py-3 last:border-b-0">
      <span className="text-xs font-semibold text-text-muted">{label}</span>
      <span className="text-sm font-semibold text-text-primary">{value || "-"}</span>
    </div>
  );
}

export function RequestDetailPage({ requestId }: { requestId: string }) {
  const [assigningVendorId, setAssigningVendorId] = useState("");
  const [currentUser] = useState<AuthUser | null>(() => (typeof window === "undefined" ? null : getAuthUser()));
  const [error, setError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [request, setRequest] = useState<RequestItem | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  useToastMessages({ error, success });

  const loadRequestDetail = useCallback(async () => {
    if (!requestId) {
      setError("Request id is missing.");
      setLoadState("error");
      return;
    }

    setLoadState("loading");
    setError(null);

    try {
      const [requestItem, vendorItems] = await Promise.all([
        apiGet<RequestItem>(`/requests/${requestId}`),
        currentUser?.role === "LANDLORD" ? apiGet<VendorItem[]>("/vendors") : Promise.resolve([]),
      ]);

      setRequest(requestItem);
      setAssigningVendorId(requestItem.vendorId || "");
      setVendors(vendorItems);
      setLoadState("ready");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load request.");
      setLoadState("error");
    }
  }, [currentUser, requestId]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadRequestDetail();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadRequestDetail]);

  const nextStatuses = useMemo(() => {
    return request ? allowedStatusTransitions[request.status] : [];
  }, [request]);

  const availableStatusActions = useMemo<RequestStatus[]>(() => {
    if (currentUser?.role === "LANDLORD") {
      return ["ASSIGNED", "IN_PROGRESS", "DONE", "VERIFIED"];
    }

    if (currentUser?.role === "VENDOR") {
      return ["IN_PROGRESS", "DONE"];
    }

    return [];
  }, [currentUser?.role]);

  const runRequestAction = async (actionId: string, action: () => Promise<RequestItem>, message: string) => {
    setUpdatingAction(actionId);
    setError(null);
    setSuccess(null);

    try {
      const updatedRequest = await action();
      const normalizedRequest = await apiGet<RequestItem>(`/requests/${updatedRequest._id}`);
      setRequest(normalizedRequest);
      setAssigningVendorId(normalizedRequest.vendorId || "");
      setSuccess(message);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update request.");
    } finally {
      setUpdatingAction(null);
    }
  };

  const assignVendor = () => {
    if (!request || !assigningVendorId) {
      setError("Select a vendor before assigning.");
      return;
    }

    void runRequestAction(
      "assign",
      () => apiPatch<RequestItem, { vendorId: string }>(`/requests/${request._id}/assign`, { vendorId: assigningVendorId }),
      "Vendor assigned."
    );
  };

  const updateStatus = (status: RequestStatus) => {
    if (!request) {
      return;
    }

    void runRequestAction(
      `status-${status}`,
      () => apiPatch<RequestItem, { status: RequestStatus }>(`/requests/${request._id}/status`, { status }),
      "Request status updated."
    );
  };

  const verifyRequest = () => {
    if (!request) {
      return;
    }

    void runRequestAction(
      "verify",
      () => apiPatch<RequestItem, Record<string, never>>(`/requests/${request._id}/verify`, {}),
      "Request verified."
    );
  };

  return (
    <div className="mx-auto grid max-w-none gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark" href="/app/requests">
            <FiChevronLeft aria-hidden="true" size={16} />
            Back to requests
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-normal text-text-primary sm:text-3xl">Request details</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            Assignment, lifecycle, property context, images, and vendor workflow for the selected request.
          </p>
        </div>
        <Button isLoading={loadState === "loading"} onClick={loadRequestDetail} size="sm" variant="secondary">
          Refresh
        </Button>
      </div>

      {request ? (
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card elevated>
            <CardHeader>
              <CardTitle>{request.title}</CardTitle>
              <CardDescription>{request.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <StatusText status={request.status} />
                <span className="text-text-muted">/</span>
                <UrgencyText urgency={request.urgency} />
              </div>

              <div className="rounded-md border border-border bg-surface-muted p-4">
                <p className="text-xs font-semibold text-text-muted">Description</p>
                <p className="mt-2 text-sm leading-6 text-text-primary">{request.description}</p>
              </div>

              {request.images?.length ? (
                <div className="grid gap-3">
                  <h2 className="text-base font-bold text-text-primary">Images</h2>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {request.images.map((image) => {
                      const imageUrl = resolveMediaUrl(image);

                      return (
                        <a
                          aria-label={`Open image for ${request.title}`}
                          className="aspect-video overflow-hidden rounded-md border border-border bg-surface-muted"
                          href={imageUrl}
                          key={image}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <span
                            aria-hidden="true"
                            className="block h-full w-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${JSON.stringify(imageUrl)})` }}
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="rounded-md border border-warning bg-warning-soft p-3">
                <p className="flex items-center gap-2 text-sm font-bold text-tertiary">
                  <FiAlertCircle aria-hidden="true" size={16} />
                  Lifecycle note
                </p>
                <p className="mt-1 text-xs font-medium leading-5 text-text-secondary">
                  Vendors can move assigned work through in-progress and done. Landlords verify completed work.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid content-start gap-6">
            <Card elevated>
              <CardHeader>
                <CardTitle>Context</CardTitle>
                <CardDescription>Property, people, and timestamps.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border bg-surface-muted px-4">
                  <InfoRow label="Property" value={request.propertyName} />
                  <InfoRow label="Unit" value={request.unitNumber ? `Unit ${request.unitNumber}` : undefined} />
                  <InfoRow label="Tenant" value={request.tenantName} />
                  <InfoRow label="Vendor" value={request.vendorName || "Unassigned"} />
                  <InfoRow label="Created" value={formatDateTime(request.createdAt)} />
                  <InfoRow label="Updated" value={formatDateTime(request.updatedAt)} />
                </div>
              </CardContent>
            </Card>

            {currentUser?.role !== "TENANT" ? (
              <Card elevated>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>Assign vendors and move the request through its lifecycle.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5">
                  {currentUser?.role === "LANDLORD" ? (
                    <div className="grid gap-3">
                  <Dropdown
                    label="Assign vendor"
                    onChange={setAssigningVendorId}
                    options={[
                      { label: "Select vendor", value: "" },
                      ...vendors.map((vendor) => ({
                        label: `${getVendorName(vendor)}${getVendorEmail(vendor) ? ` - ${getVendorEmail(vendor)}` : ""}`,
                        value: vendor._id,
                      })),
                    ]}
                    value={assigningVendorId}
                  />
                  <Button
                    disabled={!assigningVendorId || request.status !== "NEW"}
                    isLoading={updatingAction === "assign"}
                    onClick={assignVendor}
                    size="sm"
                  >
                    Assign vendor
                  </Button>
                  {request.status !== "NEW" ? (
                    <p className="text-xs font-medium text-text-muted">Vendor assignment is available while a request is new.</p>
                  ) : null}
                    </div>
                  ) : null}

                  {availableStatusActions.length ? (
                    <div className="grid gap-2">
                      <p className="text-xs font-semibold text-text-primary">Status actions</p>
                      <div className="grid grid-cols-2 gap-2">
                        {availableStatusActions.filter((status) => status !== "VERIFIED").map((status) => (
                          <Button
                            disabled={!nextStatuses.includes(status)}
                            isLoading={updatingAction === `status-${status}`}
                            key={status}
                            onClick={() => updateStatus(status)}
                            size="sm"
                            variant="secondary"
                          >
                            {formatLabel(status)}
                          </Button>
                        ))}
                        {currentUser?.role === "LANDLORD" ? (
                          <Button
                            disabled={!nextStatuses.includes("VERIFIED")}
                            icon={<FiCheck aria-hidden="true" size={16} />}
                            isLoading={updatingAction === "verify"}
                            onClick={verifyRequest}
                            size="sm"
                            variant="secondary"
                          >
                            Verify
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {request.vendorServices?.length ? (
                    <div className="grid gap-2">
                      <p className="text-xs font-semibold text-text-primary">Vendor services</p>
                      <p className="text-sm font-medium leading-6 text-text-secondary">{request.vendorServices.join(", ")}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>
      ) : loadState === "loading" ? (
        <Card elevated>
          <CardContent>
            <div className="rounded-md border border-dashed border-border bg-surface-muted px-4 py-12 text-center text-sm font-medium text-text-secondary">
              Loading request...
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
