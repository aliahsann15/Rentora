"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FiAlertCircle,
  FiCheck,
  FiEdit3,
  FiHome,
  FiPlus,
  FiSearch,
  FiTrash2,
  TextField,
} from "@/components/ui";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { PropertyItem, RequestItem, UnitItem } from "@/lib/api/types";

type LoadState = "idle" | "loading" | "ready" | "error";
type PropertyFormState = {
  city: string;
  country: string;
  line1: string;
  name: string;
  state: string;
  totalUnits: string;
  zip: string;
};
type UnitFormState = {
  propertyId: string;
  rentAmount: string;
  status: "OCCUPIED" | "VACANT";
  unitNumber: string;
};

const emptyPropertyForm: PropertyFormState = {
  city: "",
  country: "",
  line1: "",
  name: "",
  state: "",
  totalUnits: "",
  zip: "",
};

const emptyUnitForm: UnitFormState = {
  propertyId: "",
  rentAmount: "",
  status: "VACANT",
  unitNumber: "",
};

function formatAddress(property: PropertyItem) {
  const address = property.address;

  if (!address) {
    return "-";
  }

  return [address.line1, address.city, address.state, address.zip, address.country].filter(Boolean).join(", ");
}

function formatCurrency(value?: number) {
  if (typeof value !== "number") {
    return "-";
  }

  return new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function getPropertyUnits(units: UnitItem[], propertyId?: string) {
  return units.filter((unit) => unit.propertyId === propertyId);
}

function StatusText({ status }: { status: "OCCUPIED" | "VACANT" }) {
  const isOccupied = status === "OCCUPIED";

  return (
    <span className={["inline-flex items-center gap-2 text-sm font-semibold", isOccupied ? "text-success" : "text-tertiary"].join(" ")}>
      <span className={["size-2 rounded-full", isOccupied ? "bg-success" : "bg-warning"].join(" ")} />
      {isOccupied ? "Occupied" : "Vacant"}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-divider py-3 last:border-b-0">
      <span className="text-xs font-semibold text-text-muted">{label}</span>
      <span className="text-sm font-semibold text-text-primary">{value}</span>
    </div>
  );
}

export function PropertiesPage() {
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [propertyForm, setPropertyForm] = useState<PropertyFormState>(emptyPropertyForm);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [unitForm, setUnitForm] = useState<UnitFormState>(emptyUnitForm);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);

  const selectedProperty = useMemo(() => {
    return properties.find((property) => property._id === selectedPropertyId) || properties[0] || null;
  }, [properties, selectedPropertyId]);

  const selectedUnits = useMemo(() => getPropertyUnits(units, selectedProperty?._id), [selectedProperty?._id, units]);
  const selectedRequests = useMemo(
    () => requests.filter((request) => request.propertyId === selectedProperty?._id),
    [requests, selectedProperty?._id]
  );

  const loadPropertiesPage = async () => {
    setLoadState("loading");
    setError(null);

    try {
      const [propertyItems, unitItems, requestItems] = await Promise.all([
        apiGet<PropertyItem[]>("/properties"),
        apiGet<UnitItem[]>("/units"),
        apiGet<RequestItem[]>("/requests"),
      ]);

      setProperties(propertyItems);
      setUnits(unitItems);
      setRequests(requestItems);
      setSelectedPropertyId((current) => current || propertyItems[0]?._id || null);
      setLoadState("ready");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load properties.");
      setLoadState("error");
    }
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadPropertiesPage();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return properties;
    }

    return properties.filter((property) => {
      return [property.name, formatAddress(property)].join(" ").toLowerCase().includes(normalizedQuery);
    });
  }, [properties, query]);

  const totals = useMemo(() => {
    const occupiedUnits = units.filter((unit) => unit.status === "OCCUPIED").length;
    const activeRequests = requests.filter((request) => request.status !== "VERIFIED").length;

    return {
      activeRequests,
      occupiedUnits,
      properties: properties.length,
      totalUnits: units.length,
      vacantUnits: units.length - occupiedUnits,
    };
  }, [properties.length, requests, units]);

  const selectedUnitSummary = useMemo(() => {
    const occupied = selectedUnits.filter((unit) => unit.status === "OCCUPIED").length;
    const vacant = selectedUnits.length - occupied;

    return {
      occupied,
      vacant,
    };
  }, [selectedUnits]);

  const updatePropertyForm = (key: keyof PropertyFormState, value: string) => {
    setPropertyForm((current) => ({ ...current, [key]: value }));
  };

  const updateUnitForm = (key: keyof UnitFormState, value: string) => {
    setUnitForm((current) => ({ ...current, [key]: value }));
  };

  const resetPropertyForm = () => {
    setEditingPropertyId(null);
    setPropertyForm(emptyPropertyForm);
    setIsPropertyModalOpen(false);
  };

  const resetUnitForm = () => {
    setEditingUnitId(null);
    setUnitForm({ ...emptyUnitForm, propertyId: selectedProperty?._id || "" });
    setIsUnitModalOpen(false);
  };

  const openCreatePropertyModal = () => {
    setEditingPropertyId(null);
    setPropertyForm(emptyPropertyForm);
    setIsPropertyModalOpen(true);
  };

  const openCreateUnitModal = () => {
    setEditingUnitId(null);
    setUnitForm({ ...emptyUnitForm, propertyId: selectedProperty?._id || properties[0]?._id || "" });
    setIsUnitModalOpen(true);
  };

  const beginEditProperty = (property: PropertyItem) => {
    setEditingPropertyId(property._id);
    setSelectedPropertyId(property._id);
    setPropertyForm({
      city: property.address?.city || "",
      country: property.address?.country || "",
      line1: property.address?.line1 || "",
      name: property.name || "",
      state: property.address?.state || "",
      totalUnits: String(property.totalUnits || ""),
      zip: property.address?.zip || "",
    });
    setIsPropertyModalOpen(true);
  };

  const beginEditUnit = (unit: UnitItem) => {
    setEditingUnitId(unit._id);
    setUnitForm({
      propertyId: unit.propertyId,
      rentAmount: typeof unit.rentAmount === "number" ? String(unit.rentAmount) : "",
      status: unit.status,
      unitNumber: unit.unitNumber,
    });
    setIsUnitModalOpen(true);
  };

  const submitProperty = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = propertyForm.name.trim();
    const address = {
      city: propertyForm.city.trim(),
      country: propertyForm.country.trim(),
      line1: propertyForm.line1.trim(),
      state: propertyForm.state.trim(),
      zip: propertyForm.zip.trim(),
    };

    if (!name || !address.line1 || !address.city || !address.state || !address.country || !address.zip) {
      setError("Property name and full address are required.");
      return;
    }

    setUpdatingAction("property");
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        address,
        name,
        totalUnits: Number(propertyForm.totalUnits || 0),
      };
      const savedProperty = editingPropertyId
        ? await apiPatch<PropertyItem, typeof payload>(`/properties/${editingPropertyId}`, payload)
        : await apiPost<PropertyItem, typeof payload>("/properties", payload);

      setSuccess(editingPropertyId ? "Property updated." : "Property created.");
      resetPropertyForm();
      setSelectedPropertyId(savedProperty._id);
      await loadPropertiesPage();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save property.");
    } finally {
      setUpdatingAction(null);
    }
  };

  const submitUnit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!unitForm.propertyId) {
      setError("Select a property before saving the unit.");
      return;
    }

    if (!unitForm.unitNumber.trim()) {
      setError("Unit number is required.");
      return;
    }

    setUpdatingAction("unit");
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        propertyId: unitForm.propertyId,
        rentAmount: unitForm.rentAmount ? Number(unitForm.rentAmount) : undefined,
        status: unitForm.status,
        unitNumber: unitForm.unitNumber.trim(),
      };

      if (editingUnitId) {
        await apiPatch<UnitItem, Omit<typeof payload, "propertyId"> & { propertyId?: string }>(`/units/${editingUnitId}`, {
          propertyId: payload.propertyId,
          rentAmount: payload.rentAmount,
          status: payload.status,
          unitNumber: payload.unitNumber,
        });
      } else {
        await apiPost<UnitItem, typeof payload>("/units", payload);
      }

      setSuccess(editingUnitId ? "Unit updated." : "Unit created.");
      resetUnitForm();
      setSelectedPropertyId(payload.propertyId);
      await loadPropertiesPage();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save unit.");
    } finally {
      setUpdatingAction(null);
    }
  };

  const deleteProperty = async (property: PropertyItem) => {
    const confirmed = window.confirm(`Delete ${property.name}? This also removes related units and requests.`);

    if (!confirmed) {
      return;
    }

    setUpdatingAction(`delete-property-${property._id}`);
    setError(null);
    setSuccess(null);

    try {
      await apiDelete<{ message: string }>(`/properties/${property._id}`);
      setSuccess("Property deleted.");
      resetPropertyForm();
      setSelectedPropertyId(null);
      await loadPropertiesPage();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to delete property.");
    } finally {
      setUpdatingAction(null);
    }
  };

  const deleteUnit = async (unit: UnitItem) => {
    const confirmed = window.confirm(`Delete unit ${unit.unitNumber}?`);

    if (!confirmed) {
      return;
    }

    setUpdatingAction(`delete-unit-${unit._id}`);
    setError(null);
    setSuccess(null);

    try {
      await apiDelete<{ message: string }>(`/units/${unit._id}`);
      setSuccess("Unit deleted.");
      if (editingUnitId === unit._id) {
        resetUnitForm();
      }
      await loadPropertiesPage();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to delete unit.");
    } finally {
      setUpdatingAction(null);
    }
  };

  return (
    <div className="mx-auto grid max-w-none gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-text-primary sm:text-3xl">Properties</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            Manage property records, unit inventory, occupancy, and request context across the portfolio.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={<FiPlus aria-hidden="true" size={16} />} onClick={openCreatePropertyModal} size="sm">
            New property
          </Button>
          <Button icon={<FiPlus aria-hidden="true" size={16} />} onClick={openCreateUnitModal} size="sm" variant="secondary">
            New unit
          </Button>
          <Button isLoading={loadState === "loading"} onClick={loadPropertiesPage} size="sm" variant="secondary">
            Refresh
          </Button>
        </div>
      </div>

      <section className="grid grid-flow-col auto-cols-[minmax(190px,1fr)] gap-3 overflow-x-auto pb-1">
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary">Properties</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{loadState === "loading" ? "..." : totals.properties}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary">Total units</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{loadState === "loading" ? "..." : totals.totalUnits}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary">Occupied</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{loadState === "loading" ? "..." : totals.occupiedUnits}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary">Vacant</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{loadState === "loading" ? "..." : totals.vacantUnits}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary">Active requests</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{loadState === "loading" ? "..." : totals.activeRequests}</p>
        </Card>
      </section>

      {success ? (
        <div className="rounded-md border border-success bg-success-soft px-4 py-3 text-sm font-medium text-success">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-danger bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="grid content-start gap-6">
          <Card elevated>
            <CardHeader>
              <CardTitle>Property directory</CardTitle>
              <CardDescription>Search by property name or address, then select a row to manage details.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="grid max-w-xl gap-2">
                <span className="text-xs font-semibold text-text-primary">Search</span>
                <span className="relative">
                  <TextField
                    className="w-full pl-9"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Property name or address"
                    value={query}
                  />
                  <FiSearch aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                </span>
              </label>
            </CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead className="border-b border-divider bg-surface-muted text-xs font-bold uppercase text-text-secondary">
                  <tr>
                    <th className="px-5 py-3">Property</th>
                    <th className="px-5 py-3">Address</th>
                    <th className="px-5 py-3">Units</th>
                    <th className="px-5 py-3">Occupied</th>
                    <th className="px-5 py-3">Vacant</th>
                    <th className="px-5 py-3">Active requests</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {filteredProperties.map((property) => {
                    const propertyUnits = getPropertyUnits(units, property._id);
                    const occupied = propertyUnits.filter((unit) => unit.status === "OCCUPIED").length;
                    const activeRequests = requests.filter(
                      (request) => request.propertyId === property._id && request.status !== "VERIFIED"
                    ).length;
                    const isSelected = selectedProperty?._id === property._id;

                    return (
                      <tr
                        className={["cursor-pointer text-sm transition hover:bg-surface-muted", isSelected ? "bg-primary-soft/60" : ""].join(" ")}
                        key={property._id}
                        onClick={() => setSelectedPropertyId(property._id)}
                      >
                        <td className="px-5 py-4 font-bold text-text-primary">{property.name}</td>
                        <td className="max-w-[320px] px-5 py-4 text-text-secondary">
                          <p className="line-clamp-2">{formatAddress(property)}</p>
                        </td>
                        <td className="px-5 py-4 text-text-secondary">{propertyUnits.length}</td>
                        <td className="px-5 py-4 text-text-secondary">{occupied}</td>
                        <td className="px-5 py-4 text-text-secondary">{propertyUnits.length - occupied}</td>
                        <td className="px-5 py-4 text-text-secondary">{activeRequests}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              aria-label={`Edit ${property.name}`}
                              className="flex size-9 items-center justify-center rounded-md border border-border text-text-primary transition hover:bg-surface-muted"
                              onClick={(event) => {
                                event.stopPropagation();
                                beginEditProperty(property);
                              }}
                              type="button"
                            >
                              <FiEdit3 aria-hidden="true" size={16} />
                            </button>
                            <button
                              aria-label={`Delete ${property.name}`}
                              className="flex size-9 items-center justify-center rounded-md border border-border text-danger transition hover:bg-danger-soft"
                              onClick={(event) => {
                                event.stopPropagation();
                                void deleteProperty(property);
                              }}
                              type="button"
                            >
                              <FiTrash2 aria-hidden="true" size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!filteredProperties.length ? (
                    <tr>
                      <td className="px-5 py-10 text-center text-sm font-medium text-text-secondary" colSpan={7}>
                        No properties match the current search.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>

          {selectedProperty ? (
            <Card elevated>
              <CardHeader
                action={
                  <Button icon={<FiPlus aria-hidden="true" size={16} />} onClick={openCreateUnitModal} size="sm" variant="secondary">
                    New unit
                  </Button>
                }
              >
                <CardTitle>Units in {selectedProperty.name}</CardTitle>
                <CardDescription>Track rent, occupancy, and unit inventory for the selected property.</CardDescription>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead className="border-b border-divider bg-surface-muted text-xs font-bold uppercase text-text-secondary">
                    <tr>
                      <th className="px-5 py-3">Unit</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Rent</th>
                      <th className="px-5 py-3">Lease start</th>
                      <th className="px-5 py-3">Lease end</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {selectedUnits.map((unit) => (
                      <tr className="text-sm" key={unit._id}>
                        <td className="px-5 py-4 font-bold text-text-primary">{unit.unitNumber}</td>
                        <td className="px-5 py-4">
                          <StatusText status={unit.status} />
                        </td>
                        <td className="px-5 py-4 text-text-secondary">{formatCurrency(unit.rentAmount)}</td>
                        <td className="px-5 py-4 text-text-secondary">{unit.leaseStart ? unit.leaseStart.slice(0, 10) : "-"}</td>
                        <td className="px-5 py-4 text-text-secondary">{unit.leaseEnd ? unit.leaseEnd.slice(0, 10) : "-"}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              aria-label={`Edit unit ${unit.unitNumber}`}
                              className="flex size-9 items-center justify-center rounded-md border border-border text-text-primary transition hover:bg-surface-muted"
                              onClick={() => beginEditUnit(unit)}
                              type="button"
                            >
                              <FiEdit3 aria-hidden="true" size={16} />
                            </button>
                            <button
                              aria-label={`Delete unit ${unit.unitNumber}`}
                              className="flex size-9 items-center justify-center rounded-md border border-border text-danger transition hover:bg-danger-soft"
                              onClick={() => void deleteUnit(unit)}
                              type="button"
                            >
                              <FiTrash2 aria-hidden="true" size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {!selectedUnits.length ? (
                      <tr>
                        <td className="px-5 py-10 text-center text-sm font-medium text-text-secondary" colSpan={6}>
                          No units have been created for this property.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </div>

        <div className="grid content-start gap-6">
          {selectedProperty ? (
            <>
              <Card elevated>
                <CardHeader>
                  <CardTitle>Selected property</CardTitle>
                  <CardDescription>{selectedProperty.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-border bg-surface-muted px-4">
                    <InfoRow label="Address" value={formatAddress(selectedProperty)} />
                    <InfoRow label="Units" value={String(selectedUnits.length)} />
                    <InfoRow label="Occupied" value={String(selectedUnitSummary.occupied)} />
                    <InfoRow label="Vacant" value={String(selectedUnitSummary.vacant)} />
                    <InfoRow label="Active requests" value={String(selectedRequests.filter((request) => request.status !== "VERIFIED").length)} />
                  </div>
                </CardContent>
              </Card>

            </>
          ) : (
            <Card elevated>
              <CardContent>
                <div className="rounded-md border border-dashed border-border bg-surface-muted px-4 py-10 text-center">
                  <FiHome aria-hidden="true" className="mx-auto text-text-muted" size={24} />
                  <p className="mt-3 text-sm font-bold text-text-primary">No property selected</p>
                  <p className="mt-1 text-xs font-medium text-text-secondary">Create or select a property to manage units.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedRequests.length ? (
            <Card elevated>
              <CardHeader>
                <CardTitle>Recent property requests</CardTitle>
                <CardDescription>Requests linked to the selected property.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {selectedRequests.slice(0, 5).map((request) => (
                  <a
                    className="rounded-md border border-border bg-surface-muted p-3 transition hover:bg-surface"
                    href={`/app/requests/${request._id}`}
                    key={request._id}
                  >
                    <p className="text-sm font-bold text-text-primary">{request.title}</p>
                    <p className="mt-1 text-xs font-medium text-text-secondary">
                      {request.status.toLowerCase().replace("_", " ")} / {request.urgency.toLowerCase()}
                    </p>
                  </a>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {loadState === "error" ? (
            <Card elevated>
              <CardContent>
                <div className="rounded-md border border-warning bg-warning-soft p-3">
                  <p className="flex items-center gap-2 text-sm font-bold text-tertiary">
                    <FiAlertCircle aria-hidden="true" size={16} />
                    Unable to load portfolio
                  </p>
                  <p className="mt-1 text-xs font-medium text-text-secondary">Check your API connection and try refreshing.</p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      {isPropertyModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
          onClick={resetPropertyForm}
          role="presentation"
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--rentora-shadow-panel)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="border-b border-divider p-5">
              <h2 className="text-lg font-bold text-text-primary">{editingPropertyId ? "Edit property" : "Create property"}</h2>
              <p className="mt-1 text-sm text-text-secondary">Property name and address are required.</p>
            </div>
            <form className="grid gap-4 p-5" onSubmit={submitProperty}>
              <label className="grid gap-2">
                <span className="text-xs font-semibold text-text-primary">Property name</span>
                <TextField autoFocus onChange={(event) => updatePropertyForm("name", event.target.value)} value={propertyForm.name} />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold text-text-primary">Address line</span>
                <TextField onChange={(event) => updatePropertyForm("line1", event.target.value)} value={propertyForm.line1} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-text-primary">City</span>
                  <TextField onChange={(event) => updatePropertyForm("city", event.target.value)} value={propertyForm.city} />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-text-primary">State</span>
                  <TextField onChange={(event) => updatePropertyForm("state", event.target.value)} value={propertyForm.state} />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-text-primary">Country</span>
                  <TextField onChange={(event) => updatePropertyForm("country", event.target.value)} value={propertyForm.country} />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-text-primary">Zip</span>
                  <TextField onChange={(event) => updatePropertyForm("zip", event.target.value)} value={propertyForm.zip} />
                </label>
              </div>
              <label className="grid gap-2">
                <span className="text-xs font-semibold text-text-primary">Planned units</span>
                <TextField
                  min={0}
                  onChange={(event) => updatePropertyForm("totalUnits", event.target.value)}
                  type="number"
                  value={propertyForm.totalUnits}
                />
              </label>
              <div className="flex justify-end gap-2 border-t border-divider pt-4">
                <Button onClick={resetPropertyForm} type="button" variant="secondary">
                  Cancel
                </Button>
                <Button isLoading={updatingAction === "property"} type="submit">
                  {editingPropertyId ? "Update property" : "Create property"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isUnitModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
          onClick={resetUnitForm}
          role="presentation"
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--rentora-shadow-panel)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="border-b border-divider p-5">
              <h2 className="text-lg font-bold text-text-primary">{editingUnitId ? "Edit unit" : "Create unit"}</h2>
              <p className="mt-1 text-sm text-text-secondary">Select the property this unit belongs to.</p>
            </div>
            <form className="grid gap-4 p-5" onSubmit={submitUnit}>
              <label className="grid gap-2">
                <span className="text-xs font-semibold text-text-primary">Property</span>
                <select
                  className="h-11 rounded-md border border-border bg-surface px-3 text-sm font-medium text-text-primary shadow-sm outline-none transition hover:border-text-muted focus:border-text-primary"
                  onChange={(event) => updateUnitForm("propertyId", event.target.value)}
                  value={unitForm.propertyId}
                >
                  <option value="">Select property</option>
                  {properties.map((property) => (
                    <option key={property._id} value={property._id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold text-text-primary">Unit number</span>
                <TextField autoFocus onChange={(event) => updateUnitForm("unitNumber", event.target.value)} value={unitForm.unitNumber} />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold text-text-primary">Rent amount</span>
                <TextField
                  min={0}
                  onChange={(event) => updateUnitForm("rentAmount", event.target.value)}
                  type="number"
                  value={unitForm.rentAmount}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold text-text-primary">Status</span>
                <select
                  className="h-11 rounded-md border border-border bg-surface px-3 text-sm font-medium text-text-primary shadow-sm outline-none transition hover:border-text-muted focus:border-text-primary"
                  onChange={(event) => updateUnitForm("status", event.target.value)}
                  value={unitForm.status}
                >
                  <option value="VACANT">Vacant</option>
                  <option value="OCCUPIED">Occupied</option>
                </select>
              </label>
              <div className="flex justify-end gap-2 border-t border-divider pt-4">
                <Button onClick={resetUnitForm} type="button" variant="secondary">
                  Cancel
                </Button>
                <Button isLoading={updatingAction === "unit"} type="submit">
                  {editingUnitId ? "Update unit" : "Create unit"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
