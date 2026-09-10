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
  TextField,
} from "@/components/ui";
import { useToastMessages } from "@/components/app/toast-provider";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { UnitItem, UserItem } from "@/lib/api/types";
import { type AuthFieldErrors, validateEmail, validateOptionalPhone, validateRequired } from "@/lib/auth/validation";

type LoadState = "idle" | "loading" | "ready" | "error";
type TenantActionModal = "view" | "edit" | "delete" | null;
type TenantForm = {
  avatar: string;
  email: string;
  name: string;
  phone: string;
  unitId: string;
};
type TenantEditForm = {
  avatar: string;
  isActive: string;
  name: string;
  phone: string;
};
type TenantField = keyof TenantForm | keyof TenantEditForm;

const emptyTenantForm: TenantForm = {
  avatar: "",
  email: "",
  name: "",
  phone: "",
  unitId: "",
};
const emptyTenantEditForm: TenantEditForm = {
  avatar: "",
  isActive: "true",
  name: "",
  phone: "",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-1 border-b border-divider py-3 last:border-b-0">
      <span className="text-xs font-semibold text-text-muted">{label}</span>
      <span className="break-words text-sm font-semibold text-text-primary">{value || "-"}</span>
    </div>
  );
}

export function TenantsPage() {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors<TenantField>>({});
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [query, setQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<UserItem | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tenantActionModal, setTenantActionModal] = useState<TenantActionModal>(null);
  const [tenantEditForm, setTenantEditForm] = useState<TenantEditForm>(emptyTenantEditForm);
  const [tenantForm, setTenantForm] = useState<TenantForm>(emptyTenantForm);
  const [tenants, setTenants] = useState<UserItem[]>([]);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);

  useToastMessages({ error, success });

  const loadTenants = async () => {
    setLoadState("loading");
    setError(null);

    try {
      const [items, unitItems] = await Promise.all([
        apiGet<UserItem[]>("/users?role=TENANT"),
        apiGet<UnitItem[]>("/units"),
      ]);
      setTenants(items);
      setUnits(unitItems);
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

  const vacantUnits = useMemo(() => {
    return units.filter((unit) => !unit.tenantId && unit.status === "VACANT");
  }, [units]);

  const openTenantModal = () => {
    setTenantForm({ ...emptyTenantForm, unitId: vacantUnits[0]?._id || "" });
    setFieldErrors({});
    setError(null);
    setSuccess(null);
    setIsTenantModalOpen(true);
  };

  const closeTenantModal = () => {
    setIsTenantModalOpen(false);
    setTenantForm(emptyTenantForm);
    setFieldErrors({});
  };

  const updateTenantForm = (key: keyof TenantForm, value: string) => {
    setTenantForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const openTenantActionModal = (tenant: UserItem, mode: Exclude<TenantActionModal, null>) => {
    setSelectedTenant(tenant);
    setTenantActionModal(mode);
    setFieldErrors({});
    setError(null);
    setSuccess(null);
    setTenantEditForm({
      avatar: tenant.avatar || "",
      isActive: tenant.isActive === false ? "false" : "true",
      name: tenant.name || "",
      phone: tenant.phone || "",
    });
  };

  const closeTenantActionModal = () => {
    setSelectedTenant(null);
    setTenantActionModal(null);
    setTenantEditForm(emptyTenantEditForm);
    setFieldErrors({});
  };

  const updateTenantEditForm = (key: keyof TenantEditForm, value: string) => {
    setTenantEditForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submitTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors: AuthFieldErrors<keyof TenantForm> = {
      avatar: tenantForm.avatar.trim() && !tenantForm.avatar.trim().startsWith("http") ? "Enter a valid image URL." : undefined,
      email: validateEmail(tenantForm.email) || undefined,
      name: tenantForm.name.trim() ? validateRequired(tenantForm.name, "Name", 2, 120) || undefined : undefined,
      phone: validateOptionalPhone(tenantForm.phone) || undefined,
      unitId: tenantForm.unitId ? undefined : "Select an unassigned unit.",
    };

    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean)) {
      return;
    }

    setUpdatingAction("tenant");
    setError(null);
    setSuccess(null);

    try {
      const response = await apiPost<{ message: string }, TenantForm>("/users/tenant", {
        avatar: tenantForm.avatar.trim(),
        email: tenantForm.email.trim().toLowerCase(),
        name: tenantForm.name.trim(),
        phone: tenantForm.phone.trim(),
        unitId: tenantForm.unitId,
      });

      setSuccess(response.message || "Tenant added.");
      closeTenantModal();
      await loadTenants();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to add tenant.");
    } finally {
      setUpdatingAction(null);
    }
  };

  const submitTenantEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedTenant) {
      return;
    }

    const nextFieldErrors: AuthFieldErrors<keyof TenantEditForm> = {
      avatar: tenantEditForm.avatar.trim() && !tenantEditForm.avatar.trim().startsWith("http") ? "Enter a valid image URL." : undefined,
      name: validateRequired(tenantEditForm.name, "Name", 2, 120) || undefined,
      phone: validateOptionalPhone(tenantEditForm.phone) || undefined,
    };

    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean)) {
      return;
    }

    setUpdatingAction(`edit-tenant-${selectedTenant._id}`);
    setError(null);
    setSuccess(null);

    try {
      await apiPatch<UserItem, { avatar: string; isActive: boolean; name: string; phone: string }>(`/users/${selectedTenant._id}`, {
        avatar: tenantEditForm.avatar.trim(),
        isActive: tenantEditForm.isActive === "true",
        name: tenantEditForm.name.trim(),
        phone: tenantEditForm.phone.trim(),
      });
      setSuccess("Tenant updated.");
      closeTenantActionModal();
      await loadTenants();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update tenant.");
    } finally {
      setUpdatingAction(null);
    }
  };

  const deleteTenant = async () => {
    if (!selectedTenant) {
      return;
    }

    setUpdatingAction(`delete-tenant-${selectedTenant._id}`);
    setError(null);
    setSuccess(null);

    try {
      await apiDelete<{ message: string }>(`/users/${selectedTenant._id}`);
      setSuccess("Tenant deleted.");
      closeTenantActionModal();
      await loadTenants();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to delete tenant.");
    } finally {
      setUpdatingAction(null);
    }
  };

  return (
    <div className="mx-auto grid max-w-none gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-text-primary sm:text-3xl">Tenants</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            View tenant users and their assigned unit context.
          </p>
        </div>
        <Button icon={<FiPlus aria-hidden="true" size={16} />} onClick={openTenantModal} size="sm">
          Add tenant
        </Button>
      </div>

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
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {filteredTenants.map((tenant) => (
                <tr className="text-sm" key={tenant._id}>
                  <td className="px-5 py-4 font-bold text-text-primary">{tenant.name}</td>
                  <td className="px-5 py-4 text-text-secondary">{tenant.email}</td>
                  <td className="px-5 py-4 text-text-secondary">{tenant.assignedUnitNumber || "-"}</td>
                  <td className="px-5 py-4 text-text-secondary">{tenant.createdAt ? tenant.createdAt.slice(0, 10) : "-"}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        aria-label={`View ${tenant.name}`}
                        className="flex size-9 items-center justify-center rounded-md border border-border text-text-primary transition hover:bg-surface-muted"
                        onClick={() => openTenantActionModal(tenant, "view")}
                        type="button"
                      >
                        <FiEye aria-hidden="true" size={16} />
                      </button>
                      <button
                        aria-label={`Edit ${tenant.name}`}
                        className="flex size-9 items-center justify-center rounded-md border border-border text-text-primary transition hover:bg-surface-muted"
                        onClick={() => openTenantActionModal(tenant, "edit")}
                        type="button"
                      >
                        <FiEdit3 aria-hidden="true" size={16} />
                      </button>
                      <button
                        aria-label={`Delete ${tenant.name}`}
                        className="flex size-9 items-center justify-center rounded-md border border-border text-danger transition hover:bg-danger-soft"
                        onClick={() => openTenantActionModal(tenant, "delete")}
                        type="button"
                      >
                        <FiTrash2 aria-hidden="true" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredTenants.length ? (
                <tr>
                  <td className="px-5 py-10 text-center text-sm font-medium text-text-secondary" colSpan={5}>
                    No tenants found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {isTenantModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          onMouseDown={closeTenantModal}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-md border border-border bg-surface shadow-[var(--rentora-shadow-panel)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="border-b border-divider p-5">
              <h2 className="text-lg font-bold text-text-primary">Add tenant</h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">Create a tenant account and assign it to a vacant unit.</p>
            </div>
            <form className="grid gap-4 p-5" onSubmit={submitTenant}>
              <Dropdown
                error={fieldErrors.unitId}
                label="Unit"
                onChange={(value) => updateTenantForm("unitId", value)}
                options={[
                  { label: "Select vacant unit", value: "" },
                  ...vacantUnits.map((unit) => ({ label: `Unit ${unit.unitNumber}`, value: unit._id })),
                ]}
                value={tenantForm.unitId}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-text-primary">Name</span>
                  <TextField
                    aria-invalid={Boolean(fieldErrors.name)}
                    onChange={(event) => updateTenantForm("name", event.target.value)}
                    placeholder="Jordan Lee"
                    value={tenantForm.name}
                  />
                  {fieldErrors.name ? <span className="text-xs font-medium text-danger">{fieldErrors.name}</span> : null}
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-text-primary">Email</span>
                  <TextField
                    aria-invalid={Boolean(fieldErrors.email)}
                    onChange={(event) => updateTenantForm("email", event.target.value)}
                    placeholder="tenant@example.com"
                    type="email"
                    value={tenantForm.email}
                  />
                  {fieldErrors.email ? <span className="text-xs font-medium text-danger">{fieldErrors.email}</span> : null}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-text-primary">Phone</span>
                  <TextField
                    aria-invalid={Boolean(fieldErrors.phone)}
                    onChange={(event) => updateTenantForm("phone", event.target.value)}
                    placeholder="+1 415-555-0102"
                    value={tenantForm.phone}
                  />
                  {fieldErrors.phone ? <span className="text-xs font-medium text-danger">{fieldErrors.phone}</span> : null}
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-text-primary">Avatar URL</span>
                  <TextField
                    aria-invalid={Boolean(fieldErrors.avatar)}
                    onChange={(event) => updateTenantForm("avatar", event.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    value={tenantForm.avatar}
                  />
                  {fieldErrors.avatar ? <span className="text-xs font-medium text-danger">{fieldErrors.avatar}</span> : null}
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-divider pt-4">
                <Button onClick={closeTenantModal} type="button" variant="secondary">
                  Cancel
                </Button>
                <Button isLoading={updatingAction === "tenant"} type="submit">
                  Add tenant
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {tenantActionModal && selectedTenant ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          onMouseDown={closeTenantActionModal}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-md border border-border bg-surface shadow-[var(--rentora-shadow-panel)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {tenantActionModal === "view" ? (
              <>
                <div className="border-b border-divider p-5">
                  <h2 className="text-lg font-bold text-text-primary">{selectedTenant.name}</h2>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">Tenant profile and unit assignment.</p>
                </div>
                <div className="p-5">
                  <InfoRow label="Name" value={selectedTenant.name} />
                  <InfoRow label="Email" value={selectedTenant.email} />
                  <InfoRow label="Phone" value={selectedTenant.phone} />
                  <InfoRow label="Assigned unit" value={selectedTenant.assignedUnitNumber} />
                  <InfoRow label="State" value={selectedTenant.isActive === false ? "Inactive" : "Active"} />
                  <InfoRow label="Created" value={selectedTenant.createdAt ? selectedTenant.createdAt.slice(0, 10) : undefined} />
                </div>
                <div className="flex justify-end gap-2 border-t border-divider p-5">
                  <Button onClick={closeTenantActionModal} type="button" variant="secondary">
                    Close
                  </Button>
                  <Button onClick={() => openTenantActionModal(selectedTenant, "edit")} type="button">
                    Edit tenant
                  </Button>
                </div>
              </>
            ) : null}

            {tenantActionModal === "edit" ? (
              <>
                <div className="border-b border-divider p-5">
                  <h2 className="text-lg font-bold text-text-primary">Edit tenant</h2>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">{selectedTenant.email}</p>
                </div>
                <form className="grid gap-4 p-5" onSubmit={submitTenantEdit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold text-text-primary">Name</span>
                      <TextField
                        aria-invalid={Boolean(fieldErrors.name)}
                        onChange={(event) => updateTenantEditForm("name", event.target.value)}
                        value={tenantEditForm.name}
                      />
                      {fieldErrors.name ? <span className="text-xs font-medium text-danger">{fieldErrors.name}</span> : null}
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs font-semibold text-text-primary">Phone</span>
                      <TextField
                        aria-invalid={Boolean(fieldErrors.phone)}
                        onChange={(event) => updateTenantEditForm("phone", event.target.value)}
                        value={tenantEditForm.phone}
                      />
                      {fieldErrors.phone ? <span className="text-xs font-medium text-danger">{fieldErrors.phone}</span> : null}
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-xs font-semibold text-text-primary">Avatar URL</span>
                    <TextField
                      aria-invalid={Boolean(fieldErrors.avatar)}
                      onChange={(event) => updateTenantEditForm("avatar", event.target.value)}
                      value={tenantEditForm.avatar}
                    />
                    {fieldErrors.avatar ? <span className="text-xs font-medium text-danger">{fieldErrors.avatar}</span> : null}
                  </label>

                  <Dropdown
                    label="State"
                    onChange={(value) => updateTenantEditForm("isActive", value)}
                    options={[
                      { label: "Active", value: "true" },
                      { label: "Inactive", value: "false" },
                    ]}
                    value={tenantEditForm.isActive}
                  />

                  <div className="flex justify-end gap-2 border-t border-divider pt-4">
                    <Button onClick={closeTenantActionModal} type="button" variant="secondary">
                      Cancel
                    </Button>
                    <Button isLoading={updatingAction === `edit-tenant-${selectedTenant._id}`} type="submit">
                      Save changes
                    </Button>
                  </div>
                </form>
              </>
            ) : null}

            {tenantActionModal === "delete" ? (
              <>
                <div className="border-b border-divider p-5">
                  <h2 className="text-lg font-bold text-text-primary">Delete tenant</h2>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    This will remove {selectedTenant.name}, unassign their unit, and delete their related requests.
                  </p>
                </div>
                <div className="flex justify-end gap-2 p-5">
                  <Button onClick={closeTenantActionModal} type="button" variant="secondary">
                    Cancel
                  </Button>
                  <Button
                    isLoading={updatingAction === `delete-tenant-${selectedTenant._id}`}
                    onClick={deleteTenant}
                    type="button"
                    variant="danger"
                  >
                    Delete tenant
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
