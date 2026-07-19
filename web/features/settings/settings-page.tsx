"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FiBriefcase,
  FiCheck,
  FiLock,
  FiLogOut,
  FiMail,
  FiRefreshCw,
  FiSettings,
  FiUser,
  TextArea,
  TextField,
} from "@/components/ui";
import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { SubscriptionStatus } from "@/lib/api/types";
import { clearAuthSession, getAuthUser, getRefreshToken, updateAuthUserSession } from "@/lib/auth/storage";
import type { AuthUser } from "@/lib/auth/types";
import {
  type AuthFieldErrors,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateRequired,
} from "@/lib/auth/validation";

type LoadState = "idle" | "loading" | "ready" | "error";
type ActionState = "profile" | "organization" | "password" | "logout" | "refresh" | null;
type SettingsTab = "account" | "workspace" | "notifications" | "security";

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
  profileImage: string;
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

const settingsTabs: Array<{
  description: string;
  id: SettingsTab;
  label: string;
}> = [
  {
    description: "Profile identity and login email",
    id: "account",
    label: "Account",
  },
  {
    description: "Company details and subscription",
    id: "workspace",
    label: "Workspace",
  },
  {
    description: "Operational update preferences",
    id: "notifications",
    label: "Notifications",
  },
  {
    description: "Password and browser session",
    id: "security",
    label: "Security",
  },
];

const emptyProfileForm: ProfileForm = {
  email: "",
  fullName: "",
  profileImage: "",
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

function validateOptionalUrl(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    const url = new URL(trimmedValue);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "Enter a valid image URL.";
    }

    return null;
  } catch {
    return "Enter a valid image URL.";
  }
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="grid gap-1 border-b border-divider py-3 last:border-b-0">
      <span className="text-xs font-semibold text-text-muted">{label}</span>
      <span className="break-words text-sm font-semibold text-text-primary">{value || "-"}</span>
    </div>
  );
}

function SectionTitle({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-sm bg-primary-soft text-primary">{icon}</span>
      <span>{children}</span>
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
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
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
  const [passwordErrors, setPasswordErrors] = useState<AuthFieldErrors<keyof PasswordForm>>({});
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(emptyPasswordForm);
  const [preferences, setPreferences] = useState<Preferences>(getInitialPreferences);
  const [profile, setProfile] = useState<ProfileResponse["profile"] | null>(null);
  const [profileErrors, setProfileErrors] = useState<AuthFieldErrors<keyof ProfileForm>>({});
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      setProfileForm({
        email: profileResponse.profile.email || "",
        fullName: profileResponse.profile.fullName || "",
        profileImage: profileResponse.profile.profileImage || "",
      });
      setOrganization(organizationResponse);
      setOrganizationForm({
        companyAddress: organizationResponse?.companyAddress || "",
        name: organizationResponse?.name || "",
      });
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

  const subscriptionRows = useMemo(
    () => [
      { label: "Plan", value: subscription?.planType || organization?.planType || "Trial" },
      { label: "Subscription", value: formatStatus(subscription?.subscriptionStatus || organization?.subscriptionStatus) },
      { label: "Unit limit", value: subscription?.unitLimit ?? organization?.unitLimit ?? "-" },
      { label: "Trial ends", value: formatDate(subscription?.trialEndsAt || organization?.trialEndsAt) },
      { label: "Workspace active", value: organization?.isActive === false ? "No" : "Yes" },
      { label: "Organization ID", value: organization?._id || currentUser?.organizationId },
    ],
    [currentUser?.organizationId, organization, subscription]
  );

  const updatePreference = (key: PreferenceKey, value: boolean) => {
    const nextPreferences = { ...preferences, [key]: value };
    setPreferences(nextPreferences);
    window.localStorage.setItem(preferenceStorageKey, JSON.stringify(nextPreferences));
    setSuccess("Preferences updated.");
    setError(null);
  };

  const updateProfileForm = (key: keyof ProfileForm, value: string) => {
    setProfileForm((current) => ({ ...current, [key]: value }));
    setProfileErrors((current) => ({ ...current, [key]: undefined }));
  };

  const updateOrganizationForm = (key: keyof OrganizationForm, value: string) => {
    setOrganizationForm((current) => ({ ...current, [key]: value }));
    setOrganizationErrors((current) => ({ ...current, [key]: undefined }));
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
      profileImage: validateOptionalUrl(profileForm.profileImage) || undefined,
    };

    setProfileErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setActionState("profile");
    setError(null);
    setSuccess(null);

    try {
      await apiPatch<{ message: string }, ProfileForm>("/auth/profile", {
        email: profileForm.email.trim().toLowerCase(),
        fullName: profileForm.fullName.trim(),
        profileImage: profileForm.profileImage.trim(),
      });
      updateAuthUserSession({
        email: profileForm.email.trim().toLowerCase(),
        name: profileForm.fullName.trim(),
      });
      setCurrentUser(getAuthUser());
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

    if (Object.values(nextErrors).some(Boolean)) {
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
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update password.");
    } finally {
      setActionState(null);
    }
  };

  const signOut = async () => {
    setActionState("logout");
    setError(null);

    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await apiPost<{ message: string }, { refreshToken: string }>("/auth/logout", { refreshToken });
      }
    } catch {
      // Local cleanup still completes sign out if the refresh token is already invalid.
    } finally {
      clearAuthSession();
      window.location.assign("/");
    }
  };

  return (
    <div className="mx-auto grid max-w-none gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-text-primary sm:text-3xl">Settings</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            Manage profile details, workspace information, subscription state, and security preferences.
          </p>
        </div>
        <Button
          icon={<FiRefreshCw aria-hidden="true" size={16} />}
          isLoading={actionState === "refresh" || loadState === "loading"}
          onClick={loadSettings}
          size="sm"
          variant="secondary"
        >
          Refresh
        </Button>
      </div>

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

      <section className="grid grid-flow-col auto-cols-[minmax(210px,1fr)] gap-3 overflow-x-auto pb-1">
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary">Signed in as</p>
          <p className="mt-2 truncate text-xl font-bold text-text-primary">{profile?.fullName || currentUser?.name || "-"}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary">Role</p>
          <p className="mt-2 text-xl font-bold text-text-primary">{formatRole(currentUser?.role)}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary">Organization</p>
          <p className="mt-2 truncate text-xl font-bold text-text-primary">{organization?.name || "-"}</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-semibold text-text-secondary">Plan</p>
          <p className="mt-2 text-xl font-bold text-text-primary">{subscription?.planType || organization?.planType || "Trial"}</p>
        </Card>
      </section>

      <nav
        aria-label="Settings sections"
        className="grid gap-2 rounded-md border border-border bg-surface p-2 shadow-sm md:grid-cols-4"
        role="tablist"
      >
        {settingsTabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              aria-selected={isActive}
              className={[
                "grid min-h-16 gap-1 rounded-sm px-4 py-3 text-left transition",
                isActive ? "bg-primary text-white" : "text-text-primary hover:bg-surface-muted",
              ].join(" ")}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              <span className="text-sm font-bold">{tab.label}</span>
              <span className={["text-xs font-medium leading-5", isActive ? "text-white/80" : "text-text-secondary"].join(" ")}>
                {tab.description}
              </span>
            </button>
          );
        })}
      </nav>

      {activeTab === "account" ? (
        <section className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
          <Card elevated>
            <CardHeader>
              <CardTitle>
                <SectionTitle icon={<FiUser aria-hidden="true" size={16} />}>Profile</SectionTitle>
              </CardTitle>
              <CardDescription>Account identity used across the web workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={saveProfile}>
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

                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-text-primary">Profile image URL</span>
                  <TextField
                    aria-invalid={Boolean(profileErrors.profileImage)}
                    onChange={(event) => updateProfileForm("profileImage", event.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    type="url"
                    value={profileForm.profileImage}
                  />
                  {profileErrors.profileImage ? (
                    <span className="text-xs font-medium text-danger">{profileErrors.profileImage}</span>
                  ) : null}
                </label>

                <div className="flex justify-end border-t border-divider pt-4">
                  <Button icon={<FiCheck aria-hidden="true" size={16} />} isLoading={actionState === "profile"} type="submit">
                    Save profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card elevated>
            <CardHeader>
              <CardTitle>Account context</CardTitle>
              <CardDescription>Read-only identity details from the current session.</CardDescription>
            </CardHeader>
            <CardContent>
              <InfoRow label="Role" value={formatRole(currentUser?.role)} />
              <InfoRow label="Email" value={profile?.email || currentUser?.email} />
              <InfoRow label="User ID" value={currentUser?._id} />
              <InfoRow label="Tenant property" value={profile?.propertyName} />
              <InfoRow label="Tenant unit" value={profile?.unitNumber} />
              <InfoRow label="Landlord" value={profile?.landlordName} />
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === "workspace" ? (
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card elevated>
            <CardHeader>
              <CardTitle>
                <SectionTitle icon={<FiBriefcase aria-hidden="true" size={16} />}>Organization</SectionTitle>
              </CardTitle>
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

                <div className="flex justify-end border-t border-divider pt-4">
                  <Button icon={<FiCheck aria-hidden="true" size={16} />} isLoading={actionState === "organization"} type="submit">
                    Save organization
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card elevated>
            <CardHeader>
              <CardTitle>
                <SectionTitle icon={<FiSettings aria-hidden="true" size={16} />}>Subscription</SectionTitle>
              </CardTitle>
              <CardDescription>Current plan and billing-linked workspace state.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-0">
                {subscriptionRows.map((row) => (
                  <InfoRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === "notifications" ? (
        <section className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
          <Card elevated>
            <CardHeader>
              <CardTitle>
                <SectionTitle icon={<FiMail aria-hidden="true" size={16} />}>Notifications</SectionTitle>
              </CardTitle>
              <CardDescription>Web preferences for operational updates.</CardDescription>
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

          <Card elevated>
            <CardHeader>
              <CardTitle>Preference storage</CardTitle>
              <CardDescription>These web preferences are saved for this browser.</CardDescription>
            </CardHeader>
            <CardContent>
              <InfoRow label="Request updates" value={preferences.requestUpdates ? "On" : "Off"} />
              <InfoRow label="Vendor alerts" value={preferences.vendorAlerts ? "On" : "Off"} />
              <InfoRow label="Email digest" value={preferences.emailDigest ? "On" : "Off"} />
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === "security" ? (
        <section className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
          <Card elevated>
            <CardHeader>
              <CardTitle>
                <SectionTitle icon={<FiLock aria-hidden="true" size={16} />}>Security</SectionTitle>
              </CardTitle>
              <CardDescription>Password and active browser session controls.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={changePassword}>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold text-text-primary">New password</span>
                  <TextField
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

                <div className="flex justify-end border-t border-divider pt-4">
                  <Button icon={<FiCheck aria-hidden="true" size={16} />} isLoading={actionState === "password"} type="submit">
                    Update password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card elevated>
            <CardHeader>
              <CardTitle>Session</CardTitle>
              <CardDescription>End this browser session and return to login.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                icon={<FiLogOut aria-hidden="true" size={16} />}
                isLoading={actionState === "logout"}
                onClick={signOut}
                type="button"
                variant="secondary"
              >
                Sign out
              </Button>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
