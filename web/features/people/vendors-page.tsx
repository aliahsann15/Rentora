"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dropdown,
  FiEdit3,
  FiEye,
  FiPlus,
  FiSearch,
  FiTrash2,
  TextArea,
  TextField,
} from "@/components/ui";
import { useToastMessages } from "@/components/app/toast-provider";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { UserItem, VendorItem } from "@/lib/api/types";
import { type AuthFieldErrors, validateEmail, validateOptionalPhone, validateRequired } from "@/lib/auth/validation";

type LoadState = "idle" | "loading" | "ready" | "error";
type VendorActionModal = "view" | "edit" | "delete" | null;
type VendorForm = {
  email: string;
};
type VendorEditForm = {
  avatar: string;
  isActive: string;
  name: string;
  notes: string;
  phone: string;
  services: string;
};
type VendorField = keyof VendorForm | keyof VendorEditForm;

const emptyVendorForm: VendorForm = {
  email: "",
};
const emptyVendorEditForm: VendorEditForm = {
  avatar: "",
  isActive: "true",
  name: "",
  notes: "",
  phone: "",
  services: "",
};

function getVendorUser(vendor: VendorItem) {
  return typeof vendor.userId === "object" ? vendor.userId : null;
}

function getVendorUserId(vendor: VendorItem) {
  return typeof vendor.userId === "object" ? vendor.userId?._id : vendor.userId;
}

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

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="grid gap-1 border-b border-divider py-3 last:border-b-0">
      <span className="text-xs font-semibold text-text-muted">{label}</span>
      <span className="break-words text-sm font-semibold text-text-primary">{value || "-"}</span>
    </div>
  );
}

export function VendorsPage() {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors<VendorField>>({});
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [query, setQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<VendorItem | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);
  const [vendorActionModal, setVendorActionModal] = useState<VendorActionModal>(null);
  const [vendorEditForm, setVendorEditForm] = useState<VendorEditForm>(emptyVendorEditForm);
  const [vendorForm, setVendorForm] = useState<VendorForm>(emptyVendorForm);
  const [vendors, setVendors] = useState<VendorItem[]>([]);

  useToastMessages({ error, success });

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

  const openVendorModal = () => {
    setVendorForm(emptyVendorForm);
    setFieldErrors({});
    setError(null);
    setSuccess(null);
    setIsVendorModalOpen(true);
  };

  const closeVendorModal = () => {
    setIsVendorModalOpen(false);
    setVendorForm(emptyVendorForm);
    setFieldErrors({});
  };

  const updateVendorForm = (key: keyof VendorForm, value: string) => {
    setVendorForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const openVendorActionModal = (vendor: VendorItem, mode: Exclude<VendorActionModal, null>) => {
    const vendorUser = getVendorUser(vendor);

    setSelectedVendor(vendor);
    setVendorActionModal(mode);
    setFieldErrors({});
    setError(null);
    setSuccess(null);
    setVendorEditForm({
      avatar: vendorUser?.avatar || "",
      isActive: vendor.isActive === false ? "false" : "true",
      name: getVendorName(vendor),
      notes: vendor.notes || "",
      phone: vendorUser?.phone || "",
      services: vendor.services?.join(", ") || "",
    });
  };

  const closeVendorActionModal = () => {
    setSelectedVendor(null);
    setVendorActionModal(null);
    setVendorEditForm(emptyVendorEditForm);
    setFieldErrors({});
  };

  const updateVendorEditForm = (key: keyof VendorEditForm, value: string) => {
    setVendorEditForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submitVendor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors: AuthFieldErrors<keyof VendorForm> = {
      email: validateEmail(vendorForm.email) || undefined,
    };

    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean)) {
      return;
    }

    setUpdatingAction("vendor");
    setError(null);
    setSuccess(null);

    try {
      const response = await apiPost<
        { emailDelivered?: boolean; emailFailureReason?: string; generatedPassword?: string },
        { email: string; role: "VENDOR" }
      >("/invites", {
        email: vendorForm.email.trim().toLowerCase(),
        role: "VENDOR",
      });

      setSuccess(
        response.emailDelivered === false
          ? `Vendor account created. Email was not delivered. Temporary password: ${response.generatedPassword || "Vendor1"}`
          : "Vendor account created and onboarding email sent."
      );
      closeVendorModal();
      await loadVendors();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to add vendor.");
    } finally {
      setUpdatingAction(null);
    }
  };

  const submitVendorEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedVendor) {
      return;
    }

    const userId = getVendorUserId(selectedVendor);
    const nextFieldErrors: AuthFieldErrors<keyof VendorEditForm> = {
      avatar: vendorEditForm.avatar.trim() && !vendorEditForm.avatar.trim().startsWith("http") ? "Enter a valid image URL." : undefined,
      name: userId ? validateRequired(vendorEditForm.name, "Name", 2, 120) || undefined : undefined,
      phone: validateOptionalPhone(vendorEditForm.phone) || undefined,
    };

    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean)) {
      return;
    }

    setUpdatingAction(`edit-vendor-${selectedVendor._id}`);
    setError(null);
    setSuccess(null);

    try {
      const services = vendorEditForm.services
        .split(",")
        .map((service) => service.trim())
        .filter(Boolean);

      const updates: Promise<unknown>[] = [
        apiPatch<VendorItem, { isActive: boolean; notes: string; services: string[] }>(`/vendors/${selectedVendor._id}`, {
          isActive: vendorEditForm.isActive === "true",
          notes: vendorEditForm.notes.trim(),
          services,
        }),
      ];

      if (userId) {
        updates.push(
          apiPatch<UserItem, { avatar: string; isActive: boolean; name: string; phone: string }>(`/users/${userId}`, {
            avatar: vendorEditForm.avatar.trim(),
            isActive: vendorEditForm.isActive === "true",
            name: vendorEditForm.name.trim(),
            phone: vendorEditForm.phone.trim(),
          })
        );
      }

      await Promise.all(updates);
      setSuccess("Vendor updated.");
      closeVendorActionModal();
      await loadVendors();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update vendor.");
    } finally {
      setUpdatingAction(null);
    }
  };

  const deleteVendor = async () => {
    if (!selectedVendor) {
      return;
    }

    const userId = getVendorUserId(selectedVendor);
    setUpdatingAction(`delete-vendor-${selectedVendor._id}`);
    setError(null);
    setSuccess(null);

    try {
      if (userId) {
        await apiDelete<{ message: string }>(`/users/${userId}`);
      } else {
        await apiDelete<{ message: string }>(`/vendors/${selectedVendor._id}`);
      }

      setSuccess("Vendor deleted.");
      closeVendorActionModal();
      await loadVendors();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to delete vendor.");
    } finally {
      setUpdatingAction(null);
    }
  };

  return (
    <div className="mx-auto grid max-w-none gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-text-primary sm:text-3xl">Vendors</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            View vendor profiles, services, active state, and job history.
          </p>
        </div>
        <Button icon={<FiPlus aria-hidden="true" size={16} />} onClick={openVendorModal} size="sm">
          Add vendor
        </Button>
      </div>

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
                <th className="px-5 py-3">Actions</th>
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
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        aria-label={`View ${getVendorName(vendor)}`}
                        className="flex size-9 items-center justify-center rounded-md border border-border text-text-primary transition hover:bg-surface-muted"
                        onClick={() => openVendorActionModal(vendor, "view")}
                        type="button"
                      >
                        <FiEye aria-hidden="true" size={16} />
                      </button>
                      <button
                        aria-label={`Edit ${getVendorName(vendor)}`}
                        className="flex size-9 items-center justify-center rounded-md border border-border text-text-primary transition hover:bg-surface-muted"
                        onClick={() => openVendorActionModal(vendor, "edit")}
                        type="button"
                      >
                        <FiEdit3 aria-hidden="true" size={16} />
                      </button>
                      <button
                        aria-label={`Delete ${getVendorName(vendor)}`}
                        className="flex size-9 items-center justify-center rounded-md border border-border text-danger transition hover:bg-danger-soft"
                        onClick={() => openVendorActionModal(vendor, "delete")}
                        type="button"
                      >
                        <FiTrash2 aria-hidden="true" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredVendors.length ? (
                <tr>
                  <td className="px-5 py-10 text-center text-sm font-medium text-text-secondary" colSpan={7}>
                    No vendors found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {isVendorModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          onMouseDown={closeVendorModal}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-md border border-border bg-surface shadow-[var(--rentora-shadow-panel)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="border-b border-divider p-5">
              <h2 className="text-lg font-bold text-text-primary">Add vendor</h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">Create a vendor account with a temporary password.</p>
            </div>
            <form className="grid gap-4 p-5" onSubmit={submitVendor}>
              <label className="grid gap-2">
                <span className="text-xs font-semibold text-text-primary">Email</span>
                <TextField
                  aria-invalid={Boolean(fieldErrors.email)}
                  onChange={(event) => updateVendorForm("email", event.target.value)}
                  placeholder="vendor@example.com"
                  type="email"
                  value={vendorForm.email}
                />
                {fieldErrors.email ? <span className="text-xs font-medium text-danger">{fieldErrors.email}</span> : null}
              </label>

              <div className="flex justify-end gap-2 border-t border-divider pt-4">
                <Button onClick={closeVendorModal} type="button" variant="secondary">
                  Cancel
                </Button>
                <Button isLoading={updatingAction === "vendor"} type="submit">
                  Add vendor
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {vendorActionModal && selectedVendor ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          onMouseDown={closeVendorActionModal}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-md border border-border bg-surface shadow-[var(--rentora-shadow-panel)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {vendorActionModal === "view" ? (
              <>
                <div className="border-b border-divider p-5">
                  <h2 className="text-lg font-bold text-text-primary">{getVendorName(selectedVendor)}</h2>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">Vendor profile and service history.</p>
                </div>
                <div className="p-5">
                  <InfoRow label="Name" value={getVendorName(selectedVendor)} />
                  <InfoRow label="Email" value={getVendorEmail(selectedVendor)} />
                  <InfoRow label="Phone" value={getVendorUser(selectedVendor)?.phone} />
                  <InfoRow label="Services" value={selectedVendor.services?.join(", ")} />
                  <InfoRow label="Rating" value={typeof selectedVendor.rating === "number" ? selectedVendor.rating.toFixed(1) : undefined} />
                  <InfoRow label="Jobs" value={selectedVendor.totalJobs ?? 0} />
                  <InfoRow label="State" value={selectedVendor.isActive === false ? "Inactive" : "Active"} />
                </div>
                <div className="flex justify-end gap-2 border-t border-divider p-5">
                  <Button onClick={closeVendorActionModal} type="button" variant="secondary">
                    Close
                  </Button>
                  <Button onClick={() => openVendorActionModal(selectedVendor, "edit")} type="button">
                    Edit vendor
                  </Button>
                </div>
              </>
            ) : null}

            {vendorActionModal === "edit" ? (
              <>
                <div className="border-b border-divider p-5">
                  <h2 className="text-lg font-bold text-text-primary">Edit vendor</h2>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">{getVendorEmail(selectedVendor)}</p>
                </div>
                <form className="grid gap-4 p-5" onSubmit={submitVendorEdit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold text-text-primary">Name</span>
                      <TextField
                        aria-invalid={Boolean(fieldErrors.name)}
                        disabled={!getVendorUserId(selectedVendor)}
                        onChange={(event) => updateVendorEditForm("name", event.target.value)}
                        value={vendorEditForm.name}
                      />
                      {fieldErrors.name ? <span className="text-xs font-medium text-danger">{fieldErrors.name}</span> : null}
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs font-semibold text-text-primary">Phone</span>
                      <TextField
                        aria-invalid={Boolean(fieldErrors.phone)}
                        disabled={!getVendorUserId(selectedVendor)}
                        onChange={(event) => updateVendorEditForm("phone", event.target.value)}
                        value={vendorEditForm.phone}
                      />
                      {fieldErrors.phone ? <span className="text-xs font-medium text-danger">{fieldErrors.phone}</span> : null}
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-xs font-semibold text-text-primary">Services</span>
                    <TextField
                      onChange={(event) => updateVendorEditForm("services", event.target.value)}
                      placeholder="Plumbing, Electrical"
                      value={vendorEditForm.services}
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-semibold text-text-primary">Notes</span>
                    <TextArea
                      onChange={(event) => updateVendorEditForm("notes", event.target.value)}
                      value={vendorEditForm.notes}
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold text-text-primary">Avatar URL</span>
                      <TextField
                        aria-invalid={Boolean(fieldErrors.avatar)}
                        disabled={!getVendorUserId(selectedVendor)}
                        onChange={(event) => updateVendorEditForm("avatar", event.target.value)}
                        value={vendorEditForm.avatar}
                      />
                      {fieldErrors.avatar ? <span className="text-xs font-medium text-danger">{fieldErrors.avatar}</span> : null}
                    </label>

                    <Dropdown
                      label="State"
                      onChange={(value) => updateVendorEditForm("isActive", value)}
                      options={[
                        { label: "Active", value: "true" },
                        { label: "Inactive", value: "false" },
                      ]}
                      value={vendorEditForm.isActive}
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t border-divider pt-4">
                    <Button onClick={closeVendorActionModal} type="button" variant="secondary">
                      Cancel
                    </Button>
                    <Button isLoading={updatingAction === `edit-vendor-${selectedVendor._id}`} type="submit">
                      Save changes
                    </Button>
                  </div>
                </form>
              </>
            ) : null}

            {vendorActionModal === "delete" ? (
              <>
                <div className="border-b border-divider p-5">
                  <h2 className="text-lg font-bold text-text-primary">Delete vendor</h2>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    This will remove {getVendorName(selectedVendor)} and clear their request assignments.
                  </p>
                </div>
                <div className="flex justify-end gap-2 p-5">
                  <Button onClick={closeVendorActionModal} type="button" variant="secondary">
                    Cancel
                  </Button>
                  <Button
                    isLoading={updatingAction === `delete-vendor-${selectedVendor._id}`}
                    onClick={deleteVendor}
                    type="button"
                    variant="danger"
                  >
                    Delete vendor
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
