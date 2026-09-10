"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FiCamera,
  FiCheck,
  FiLock,
  FiRefreshCw,
  FiTrash2,
  TextArea,
  TextField,
} from "@/components/ui";
import { useToastMessages } from "@/components/app/toast-provider";
import { apiDelete, apiGet, apiPatch, apiPatchForm, apiPost } from "@/lib/api/client";
import { API_BASE_URL } from "@/lib/api/config";
import type { SubscriptionStatus } from "@/lib/api/types";
import { clearAuthSession, getAuthUser, updateAuthUserSession } from "@/lib/auth/storage";
import type { AuthUser } from "@/lib/auth/types";
import { showToast } from "@/lib/ui/toast";
import {
  type AuthFieldErrors,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateRequired,
} from "@/lib/auth/validation";

type LoadState = "idle" | "loading" | "ready" | "error";
type ActionState = "profile" | "organization" | "password" | "logout" | "refresh" | "deleteAccount" | null;

type ProfileResponse = {
  profile: {
    email: string;
    fullName: string;
    landlordName?: string;
    profileImage?: string;
    propertyName?: string;
    unitNumber?: string;
  };
};
type ProfileUpdateResponse = {
  message: string;
  profile?: {
    email?: string;
    fullName?: string;
    profileImage?: string;
  };
};

type OrganizationItem = {
  _id: string;
  companyAddress?: string;
  createdAt?: string;
  isActive?: boolean;
  name?: string;
  ownerId?: string;
  planType?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string;
  unitLimit?: number;
};

type ProfileForm = {
  email: string;
  fullName: string;
};

type OrganizationForm = {
  companyAddress: string;
  name: string;
};

type PasswordForm = {
  confirmPassword: string;
  password: string;
};

type PreferenceKey = "emailDigest" | "requestUpdates" | "vendorAlerts";
type Preferences = Record<PreferenceKey, boolean>;
type AccountContextRow = {
  label: string;
  value?: string | number | null;
};

const emptyProfileForm: ProfileForm = {
  email: "",
  fullName: "",
};

const emptyOrganizationForm: OrganizationForm = {
  companyAddress: "",
  name: "",
};

const emptyPasswordForm: PasswordForm = {
  confirmPassword: "",
  password: "",
};

const defaultPreferences: Preferences = {
  emailDigest: true,
  requestUpdates: true,
  vendorAlerts: true,
};

const preferenceStorageKey = "rentora_web_settings_preferences";

function getInitialPreferences(): Preferences {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  try {
    const rawPreferences = window.localStorage.getItem(preferenceStorageKey);

    if (!rawPreferences) {
      return defaultPreferences;
    }

    return { ...defaultPreferences, ...(JSON.parse(rawPreferences) as Partial<Preferences>) };
  } catch {
    return defaultPreferences;
  }
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatRole(role?: string) {
  if (!role) {
    return "-";
  }

  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function formatStatus(value?: string) {
  if (!value) {
    return "-";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveMediaUrl(value: string) {
  if (!value) {
    return "";
  }

  if (value.startsWith("/media/")) {
    return `${API_BASE_URL.replace(/\/api$/, "")}${value}`;
  }

  return value;
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="grid gap-1 border-b border-divider py-3 last:border-b-0">
      <span className="text-xs font-semibold text-text-muted">{label}</span>
      <span className="break-words text-sm font-semibold text-text-primary">{value || "-"}</span>
    </div>
  );
}

function ToggleRow({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-divider py-4 last:border-b-0">
      <span className="min-w-0">
        <span className="block text-sm font-bold text-text-primary">{label}</span>
        <span className="mt-1 block text-xs font-medium leading-5 text-text-secondary">{description}</span>
      </span>
      <input
        checked={checked}
        className="h-5 w-5 shrink-0 accent-primary outline-none"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

export function SettingsPage() {
  const [actionState, setActionState] = useState<ActionState>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return getAuthUser();
  });
  const [error, setError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [organization, setOrganization] = useState<OrganizationItem | null>(null);
  const [organizationErrors, setOrganizationErrors] = useState<AuthFieldErrors<keyof OrganizationForm>>({});
  const [organizationForm, setOrganizationForm] = useState<OrganizationForm>(emptyOrganizationForm);
  const [originalOrganizationForm, setOriginalOrganizationForm] = useState<OrganizationForm>(emptyOrganizationForm);
  const [passwordErrors, setPasswordErrors] = useState<AuthFieldErrors<keyof PasswordForm>>({});
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(emptyPasswordForm);
  const [preferences, setPreferences] = useState<Preferences>(getInitialPreferences);
  const [profile, setProfile] = useState<ProfileResponse["profile"] | null>(null);
  const [profileErrors, setProfileErrors] = useState<AuthFieldErrors<keyof ProfileForm>>({});
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm);
  const [profileImageError, setProfileImageError] = useState<string | null>(null);
  const [selectedProfileImageFile, setSelectedProfileImageFile] = useState<File | null>(null);
  const [selectedProfileImagePreview, setSelectedProfileImagePreview] = useState("");
  const [originalProfileForm, setOriginalProfileForm] = useState<ProfileForm>(emptyProfileForm);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);

  useToastMessages({ error, success });

  const loadSettings = async () => {
    setActionState((current) => current || "refresh");
    setLoadState("loading");
    setError(null);

    try {
      const [profileResponse, organizationResponse, subscriptionResponse] = await Promise.all([
        apiGet<ProfileResponse>("/auth/profile"),
        apiGet<OrganizationItem>("/organizations/me").catch(() => null),
        apiGet<SubscriptionStatus>("/subscriptions/status").catch(() => null),
      ]);

      setCurrentUser(getAuthUser());
      setProfile(profileResponse.profile);
      const nextProfileForm = {
        email: profileResponse.profile.email || "",
        fullName: profileResponse.profile.fullName || "",
      };
      setProfileForm(nextProfileForm);
      setOriginalProfileForm(nextProfileForm);
      setOrganization(organizationResponse);
      const nextOrganizationForm = {
        companyAddress: organizationResponse?.companyAddress || "",
        name: organizationResponse?.name || "",
      };
      setOrganizationForm(nextOrganizationForm);
      setOriginalOrganizationForm(nextOrganizationForm);
      setSubscription(subscriptionResponse);
      setLoadState("ready");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load settings.");
      setLoadState("error");
    } finally {
      setActionState(null);
    }
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    return () => {
      if (selectedProfileImagePreview) {
        URL.revokeObjectURL(selectedProfileImagePreview);
      }
    };
  }, [selectedProfileImagePreview]);

  const subscriptionRows = useMemo(
    () => [
      { label: "Plan", value: subscription?.planType || organization?.planType || "Trial" },
      { label: "Subscription", value: formatStatus(subscription?.subscriptionStatus || organization?.subscriptionStatus) },
      { label: "Unit limit", value: subscription?.unitLimit ?? organization?.unitLimit ?? "-" },
      { label: "Trial ends", value: formatDate(subscription?.trialEndsAt || organization?.trialEndsAt) },
    ],
    [organization, subscription]
  );

  const accountContextRows = useMemo<AccountContextRow[]>(() => {
    const baseRows: AccountContextRow[] = [
      { label: "Role", value: formatRole(currentUser?.role) },
      { label: "User ID", value: currentUser?._id },
      { label: "Organization ID", value: organization?._id || currentUser?.organizationId },
    ];

    if (currentUser?.role === "TENANT") {
      return [
        ...baseRows,
        { label: "Tenant property", value: profile?.propertyName },
        { label: "Tenant unit", value: profile?.unitNumber },
        { label: "Landlord", value: profile?.landlordName },
      ];
    }

    if (currentUser?.role === "VENDOR") {
      return baseRows;
    }

    return baseRows;
  }, [
    currentUser?._id,
    currentUser?.organizationId,
    currentUser?.role,
    organization?._id,
    profile?.landlordName,
    profile?.propertyName,
    profile?.unitNumber,
  ]);

  const accountEmail = profile?.email || currentUser?.email || "";
  const canConfirmAccountDeletion = Boolean(accountEmail) && deleteConfirmation.trim().toLowerCase() === accountEmail.toLowerCase();
  const profileImagePreview = selectedProfileImagePreview || resolveMediaUrl(profile?.profileImage || "");
  const profileInitial = (profileForm.fullName || profileForm.email || currentUser?.name || "R").trim().slice(0, 1).toUpperCase();
  const isProfileDirty =
    profileForm.email.trim().toLowerCase() !== originalProfileForm.email.trim().toLowerCase() ||
    profileForm.fullName.trim() !== originalProfileForm.fullName.trim() ||
    Boolean(selectedProfileImageFile);
  const isOrganizationDirty =
    organizationForm.name.trim() !== originalOrganizationForm.name.trim() ||
    organizationForm.companyAddress.trim() !== originalOrganizationForm.companyAddress.trim();

  const updatePreference = (key: PreferenceKey, value: boolean) => {
    const nextPreferences = { ...preferences, [key]: value };
    setPreferences(nextPreferences);
    window.localStorage.setItem(preferenceStorageKey, JSON.stringify(nextPreferences));
    showToast({ message: "Preferences updated.", tone: "success" });
    setError(null);
  };

  const updateProfileForm = (key: keyof ProfileForm, value: string) => {
    setProfileForm((current) => ({ ...current, [key]: value }));
    setProfileErrors((current) => ({ ...current, [key]: undefined }));
  };

  const selectProfileImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProfileImageError("Select a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileImageError("Select an image smaller than 2 MB.");
      return;
    }

    if (selectedProfileImagePreview) {
      URL.revokeObjectURL(selectedProfileImagePreview);
    }

    setSelectedProfileImageFile(file);
    setSelectedProfileImagePreview(URL.createObjectURL(file));
    setProfileImageError(null);
    setError(null);
    setSuccess(null);
  };

  const updateOrganizationForm = (key: keyof OrganizationForm, value: string) => {
    setOrganizationForm((current) => ({ ...current, [key]: value }));
    setOrganizationErrors((current) => ({ ...current, [key]: undefined }));
  };

  const resetProfileForm = () => {
    setProfileForm(originalProfileForm);
    setSelectedProfileImageFile(null);
    if (selectedProfileImagePreview) {
      URL.revokeObjectURL(selectedProfileImagePreview);
    }
    setSelectedProfileImagePreview("");
    setProfileImageError(null);
    setProfileErrors({});
    setError(null);
    setSuccess(null);
  };

  const resetOrganizationForm = () => {
    setOrganizationForm(originalOrganizationForm);
    setOrganizationErrors({});
    setError(null);
    setSuccess(null);
  };

  const updatePasswordForm = (key: keyof PasswordForm, value: string) => {
    setPasswordForm((current) => ({ ...current, [key]: value }));
    setPasswordErrors((current) => ({ ...current, [key]: undefined }));
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: AuthFieldErrors<keyof ProfileForm> = {
      email: validateEmail(profileForm.email) || undefined,
      fullName: validateRequired(profileForm.fullName, "Full name", 2, 120) || undefined,
    };

    setProfileErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean) || !isProfileDirty) {
      return;
    }

    setActionState("profile");
    setError(null);
    setSuccess(null);

    try {
      const payload = new FormData();
      payload.set("email", profileForm.email.trim().toLowerCase());
      payload.set("fullName", profileForm.fullName.trim());

      if (selectedProfileImageFile) {
        payload.set("profileImageFile", selectedProfileImageFile);
      }

      const updatedProfile = await apiPatchForm<ProfileUpdateResponse>("/auth/profile", payload);
      const nextProfileForm = {
        email: updatedProfile.profile?.email || profileForm.email.trim().toLowerCase(),
        fullName: updatedProfile.profile?.fullName || profileForm.fullName.trim(),
      };

      updateAuthUserSession({
        email: nextProfileForm.email,
        name: nextProfileForm.fullName,
      });
      setCurrentUser(getAuthUser());
      if (selectedProfileImagePreview) {
        URL.revokeObjectURL(selectedProfileImagePreview);
      }
      setSelectedProfileImageFile(null);
      setSelectedProfileImagePreview("");
      setProfileForm(nextProfileForm);
      setOriginalProfileForm(nextProfileForm);
      setSuccess("Profile updated.");
      await loadSettings();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update profile.");
    } finally {
      setActionState(null);
    }
  };

  const saveOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: AuthFieldErrors<keyof OrganizationForm> = {
      companyAddress: organizationForm.companyAddress.trim().length > 180 ? "Address must be 180 characters or fewer." : undefined,
      name: validateRequired(organizationForm.name, "Organization name", 2, 120) || undefined,
    };

    setOrganizationErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean) || !isOrganizationDirty) {
      return;
    }

    setActionState("organization");
    setError(null);
    setSuccess(null);

    try {
      const updatedOrganization = await apiPatch<OrganizationItem, OrganizationForm>("/organizations", {
        companyAddress: organizationForm.companyAddress.trim(),
        name: organizationForm.name.trim(),
      });

      setOrganization(updatedOrganization);
      setOriginalOrganizationForm({
        companyAddress: organizationForm.companyAddress.trim(),
        name: organizationForm.name.trim(),
      });
      window.dispatchEvent(new Event("rentora-header-context-changed"));
      setSuccess("Organization updated.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update organization.");
    } finally {
      setActionState(null);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: AuthFieldErrors<keyof PasswordForm> = {
      confirmPassword: validateConfirmPassword(passwordForm.password, passwordForm.confirmPassword) || undefined,
      password: validatePassword(passwordForm.password) || undefined,
    };

    setPasswordErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setActionState("password");
    setError(null);
    setSuccess(null);

    try {
      await apiPost<{ message: string }, { password: string }>("/auth/change-password", {
        password: passwordForm.password,
      });
      setPasswordForm(emptyPasswordForm);
      setSuccess("Password updated.");
      setIsPasswordDialogOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update password.");
    } finally {
      setActionState(null);
    }
  };

  const openPasswordDialog = () => {
    setPasswordForm(emptyPasswordForm);
    setPasswordErrors({});
    setError(null);
    setSuccess(null);
    setIsPasswordDialogOpen(true);
  };

  const closePasswordDialog = () => {
    if (actionState === "password") {
      return;
    }

    setPasswordForm(emptyPasswordForm);
    setPasswordErrors({});
    setIsPasswordDialogOpen(false);
  };

  const openDeleteDialog = () => {
    setDeleteConfirmation("");
    setError(null);
    setSuccess(null);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (actionState === "deleteAccount") {
      return;
    }

    setDeleteConfirmation("");
    setIsDeleteDialogOpen(false);
  };

  const deleteAccount = async () => {
    if (!canConfirmAccountDeletion) {
      return;
    }

    setActionState("deleteAccount");
    setError(null);
    setSuccess(null);

    try {
      await apiDelete<{ message: string }>("/auth/account");
      clearAuthSession();
      window.location.assign("/login");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to delete account.");
      setIsDeleteDialogOpen(false);
    } finally {
      setActionState(null);
    }
  };

  return (
    <div className="mx-auto grid max-w-none gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-normal text-text-primary sm:text-3xl">Settings</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            Manage profile details, workspace information, subscription state, and notification preferences.
          </p>
        </div>
        <Button
          icon={<FiRefreshCw aria-hidden="true" size={16} />}
          isLoading={actionState === "refresh" || loadState === "loading"}
          onClick={loadSettings}
          size="sm"
          variant="secondary"
        >
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {subscriptionRows.map((row) => (
          <Card className="p-4 shadow-sm" key={row.label}>
            <p className="text-xs font-semibold text-text-secondary">{row.label}</p>
            <p className="mt-2 truncate text-xl font-bold text-text-primary">{row.value}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
          <div className="grid gap-4">
            <Card elevated>
              <CardContent>
                <form className="grid gap-5" onSubmit={saveProfile}>
                  <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
                    <div className="grid content-start gap-3">
                      <div className="relative h-44 w-44 overflow-hidden rounded-md border border-border bg-primary-soft shadow-sm">
                        {profileImagePreview ? (
                          <div
                            aria-label="Profile image preview"
                            className="h-full w-full bg-cover bg-center"
                            role="img"
                            style={{ backgroundImage: `url(${JSON.stringify(profileImagePreview)})` }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-primary">
                            {profileInitial}
                          </div>
                        )}

                        <button
                          aria-label="Select profile image"
                          className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-md bg-primary text-white shadow-[0_12px_24px_rgb(62_84_211/24%)] transition hover:bg-primary-dark"
                          onClick={() => profileImageInputRef.current?.click()}
                          title="Select profile image"
                          type="button"
                        >
                          <FiCamera aria-hidden="true" size={18} />
                        </button>
                      </div>

                      <input
                        accept="image/*"
                        className="sr-only"
                        onChange={selectProfileImage}
                        ref={profileImageInputRef}
                        type="file"
                      />

                      {profileImageError ? (
                        <span className="max-w-44 text-xs font-medium leading-5 text-danger">{profileImageError}</span>
                      ) : null}
                    </div>

                    <div className="grid content-start gap-4">
                      <label className="grid gap-2">
                        <span className="text-xs font-semibold text-text-primary">Full name</span>
                        <TextField
                          aria-invalid={Boolean(profileErrors.fullName)}
                          onChange={(event) => updateProfileForm("fullName", event.target.value)}
                          placeholder="Avery Brooks"
                          value={profileForm.fullName}
                        />
                        {profileErrors.fullName ? <span className="text-xs font-medium text-danger">{profileErrors.fullName}</span> : null}
                      </label>

                      <label className="grid gap-2">
                        <span className="text-xs font-semibold text-text-primary">Email</span>
                        <TextField
                          aria-invalid={Boolean(profileErrors.email)}
                          onChange={(event) => updateProfileForm("email", event.target.value)}
                          placeholder="manager@rentora.com"
                          type="email"
                          value={profileForm.email}
                        />
                        {profileErrors.email ? <span className="text-xs font-medium text-danger">{profileErrors.email}</span> : null}
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-2 border-t border-divider pt-4 sm:flex-row sm:justify-end">
                    <Button
                      disabled={!isProfileDirty || actionState === "profile"}
                      onClick={resetProfileForm}
                      type="button"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!isProfileDirty}
                      icon={<FiCheck aria-hidden="true" size={16} />}
                      isLoading={actionState === "profile"}
                      type="submit"
                    >
                      Save profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card elevated>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
                <CardDescription>Workspace record attached to properties, units, tenants, and vendors.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4" onSubmit={saveOrganization}>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold text-text-primary">Organization name</span>
                    <TextField
                      aria-invalid={Boolean(organizationErrors.name)}
                      onChange={(event) => updateOrganizationForm("name", event.target.value)}
                      placeholder="Rentora Property Group"
                      value={organizationForm.name}
                    />
                    {organizationErrors.name ? <span className="text-xs font-medium text-danger">{organizationErrors.name}</span> : null}
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-semibold text-text-primary">Company address</span>
                    <TextArea
                      aria-invalid={Boolean(organizationErrors.companyAddress)}
                      onChange={(event) => updateOrganizationForm("companyAddress", event.target.value)}
                      placeholder="2400 Maple Court, Austin, TX"
                      value={organizationForm.companyAddress}
                    />
                    {organizationErrors.companyAddress ? (
                      <span className="text-xs font-medium text-danger">{organizationErrors.companyAddress}</span>
                    ) : null}
                  </label>

                  <div className="flex flex-col-reverse gap-2 border-t border-divider pt-4 sm:flex-row sm:justify-end">
                    <Button
                      disabled={!isOrganizationDirty || actionState === "organization"}
                      onClick={resetOrganizationForm}
                      type="button"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!isOrganizationDirty}
                      icon={<FiCheck aria-hidden="true" size={16} />}
                      isLoading={actionState === "organization"}
                      type="submit"
                    >
                      Save organization
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

          </div>

          <div className="grid content-start gap-4">
            <Card elevated>
              <CardHeader>
                <CardTitle>Account context</CardTitle>
                <CardDescription>Role-specific details for the current session.</CardDescription>
              </CardHeader>
              <CardContent>
                {accountContextRows.map((row) => (
                  <InfoRow key={row.label} label={row.label} value={row.value} />
                ))}

                <div className="mt-5 grid gap-2 border-t border-divider pt-5">
                  <Button
                    className="w-full justify-center"
                    icon={<FiLock aria-hidden="true" size={16} />}
                    onClick={openPasswordDialog}
                    type="button"
                  >
                    Change password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card elevated>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="py-1">
                <ToggleRow
                  checked={preferences.requestUpdates}
                  description="New request, status, and verification updates."
                  label="Request updates"
                  onChange={(checked) => updatePreference("requestUpdates", checked)}
                />
                <ToggleRow
                  checked={preferences.vendorAlerts}
                  description="Assignment, schedule, and completion activity."
                  label="Vendor alerts"
                  onChange={(checked) => updatePreference("vendorAlerts", checked)}
                />
                <ToggleRow
                  checked={preferences.emailDigest}
                  description="Daily summary for portfolio activity."
                  label="Email digest"
                  onChange={(checked) => updatePreference("emailDigest", checked)}
                />
              </CardContent>
            </Card>
          </div>
          <Card className="border-danger !bg-rose-50/80 shadow-[0_18px_44px_rgb(220_38_38/10%)] xl:col-span-2">
            <CardContent className="!bg-transparent">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-danger text-white">
                      <FiTrash2 aria-hidden="true" size={15} />
                    </span>
                    <h3 className="text-lg font-bold text-text-primary">Delete account</h3>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-text-secondary">
                    Permanently remove this account and its related Rentora data. A confirmation popup will ask for your email before deletion.
                  </p>
                </div>

                <Button
                  className="w-full sm:w-auto"
                  icon={<FiTrash2 aria-hidden="true" size={16} />}
                  onClick={openDeleteDialog}
                  type="button"
                  variant="danger"
                >
                  Delete account
                </Button>
              </div>
            </CardContent>
          </Card>
      </section>

      {isPasswordDialogOpen ? (
        <div
          aria-labelledby="change-password-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-md border border-border bg-surface shadow-[var(--rentora-shadow-panel)]">
            <div className="border-b border-divider p-5">
              <h2 className="text-lg font-bold text-text-primary" id="change-password-title">
                Change password
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Set a new password for this account session.
              </p>
            </div>

            <form className="grid gap-4 p-5" onSubmit={changePassword}>
              <label className="grid gap-2">
                <span className="text-xs font-semibold text-text-primary">New password</span>
                <TextField
                  autoFocus
                  aria-invalid={Boolean(passwordErrors.password)}
                  onChange={(event) => updatePasswordForm("password", event.target.value)}
                  type="password"
                  value={passwordForm.password}
                />
                {passwordErrors.password ? <span className="text-xs font-medium text-danger">{passwordErrors.password}</span> : null}
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold text-text-primary">Confirm password</span>
                <TextField
                  aria-invalid={Boolean(passwordErrors.confirmPassword)}
                  onChange={(event) => updatePasswordForm("confirmPassword", event.target.value)}
                  type="password"
                  value={passwordForm.confirmPassword}
                />
                {passwordErrors.confirmPassword ? (
                  <span className="text-xs font-medium text-danger">{passwordErrors.confirmPassword}</span>
                ) : null}
              </label>

              <div className="flex flex-col-reverse gap-2 border-t border-divider pt-4 sm:flex-row sm:justify-end">
                <Button
                  disabled={actionState === "password"}
                  onClick={closePasswordDialog}
                  type="button"
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button icon={<FiCheck aria-hidden="true" size={16} />} isLoading={actionState === "password"} type="submit">
                  Update password
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isDeleteDialogOpen ? (
        <div
          aria-labelledby="delete-account-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-md border border-danger bg-surface shadow-[var(--rentora-shadow-panel)]">
            <div className="border-b border-divider p-5">
              <h2 className="text-base font-bold text-text-primary" id="delete-account-title">
                Delete account
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                This action cannot be undone. Type <span className="font-bold text-text-primary">{accountEmail}</span> to confirm.
              </p>
            </div>

            <div className="grid gap-4 p-5">
              <label className="grid gap-2">
                <span className="text-xs font-semibold text-text-primary">Account email</span>
                <TextField
                  autoFocus
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  placeholder={accountEmail}
                  value={deleteConfirmation}
                />
              </label>

              <div className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm font-medium leading-6 text-danger">
                {currentUser?.role === "LANDLORD"
                  ? "Deleting a landlord owner account also deletes the organization, properties, units, users, vendors, requests, and notifications in this workspace."
                  : "Deleting your account removes your profile, session, notifications, and related assignments."}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-divider p-5 sm:flex-row sm:justify-end">
              <Button
                disabled={actionState === "deleteAccount"}
                onClick={closeDeleteDialog}
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                icon={<FiTrash2 aria-hidden="true" size={16} />}
                isLoading={actionState === "deleteAccount"}
                disabled={!canConfirmAccountDeletion}
                onClick={deleteAccount}
                type="button"
                variant="danger"
              >
                Permanently delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
