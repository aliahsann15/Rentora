"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiBell, FiCheck, FiMenu, FiRefreshCw } from "@/components/ui";
import { apiGet, apiPatch } from "@/lib/api/client";
import type { NotificationItem } from "@/lib/api/types";
import type { AuthUser } from "@/lib/auth/types";
import { useToastMessages } from "./toast-provider";

type TopbarProps = {
  onOpenSidebar: () => void;
  user: AuthUser | null;
};
type HeaderProfile = {
  profile?: {
    propertyName?: string;
  };
};
type HeaderOrganization = {
  name?: string;
};

const headerContextChangedEvent = "rentora-header-context-changed";

function formatNotificationTime(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function getNotificationTarget(notification: NotificationItem) {
  if (notification.referenceId && notification.type.startsWith("REQUEST_") && notification.type !== "REQUEST_DELETED") {
    return `/app/requests/${notification.referenceId}`;
  }

  return null;
}

export function Topbar({ onOpenSidebar, user }: TopbarProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [tenantPropertyName, setTenantPropertyName] = useState("");
  const [updatingNotificationId, setUpdatingNotificationId] = useState<string | null>(null);

  useToastMessages({ error });

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.isRead).length, [notifications]);
  const headerContext = useMemo(() => {
    if (user?.role === "TENANT") {
      return {
        subtitle: organizationName,
        title: tenantPropertyName || "Assigned property",
      };
    }

    if (user?.role === "VENDOR") {
      return {
        subtitle: "",
        title: organizationName || "Vendor workspace",
      };
    }

    return {
      subtitle: "",
      title: organizationName || "Workspace",
    };
  }, [organizationName, tenantPropertyName, user?.role]);

  const loadHeaderContext = useCallback(async () => {
    try {
      const [profileResponse, organizationResponse] = await Promise.all([
        user?.role === "TENANT" ? apiGet<HeaderProfile>("/auth/profile").catch(() => null) : Promise.resolve(null),
        apiGet<HeaderOrganization>("/organizations/me").catch(() => null),
      ]);

      setTenantPropertyName(profileResponse?.profile?.propertyName || "");
      setOrganizationName(organizationResponse?.name || "");
    } catch {
      setTenantPropertyName("");
      setOrganizationName("");
    }
  }, [user]);

  const loadNotifications = async () => {
    setIsLoadingNotifications(true);
    setError(null);

    try {
      const items = await apiGet<NotificationItem[]>("/notifications");
      setNotifications(items);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load notifications.");
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadNotifications();
      void loadHeaderContext();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadHeaderContext]);

  useEffect(() => {
    const refreshHeaderContext = () => {
      void loadHeaderContext();
    };

    window.addEventListener(headerContextChangedEvent, refreshHeaderContext);

    return () => window.removeEventListener(headerContextChangedEvent, refreshHeaderContext);
  }, [loadHeaderContext]);

  useEffect(() => {
    const closePanelOnOutsideClick = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsNotificationPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", closePanelOnOutsideClick);

    return () => document.removeEventListener("mousedown", closePanelOnOutsideClick);
  }, []);

  const markNotificationAsRead = async (notification: NotificationItem) => {
    if (notification.isRead) {
      return notification;
    }

    setUpdatingNotificationId(notification._id);

    try {
      const updatedNotification = await apiPatch<NotificationItem, Record<string, never>>(
        `/notifications/${notification._id}/read`,
        {}
      );
      setNotifications((current) =>
        current.map((currentNotification) =>
          currentNotification._id === updatedNotification._id ? updatedNotification : currentNotification
        )
      );

      return updatedNotification;
    } finally {
      setUpdatingNotificationId(null);
    }
  };

  const openNotification = async (notification: NotificationItem) => {
    try {
      await markNotificationAsRead(notification);
      const target = getNotificationTarget(notification);

      if (target) {
        setIsNotificationPanelOpen(false);
        router.push(target);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update notification.");
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((notification) => !notification.isRead);

    if (!unreadNotifications.length) {
      return;
    }

    setUpdatingNotificationId("all");
    setError(null);

    try {
      const updatedNotifications = await Promise.all(
        unreadNotifications.map((notification) =>
          apiPatch<NotificationItem, Record<string, never>>(`/notifications/${notification._id}/read`, {})
        )
      );
      const updatedMap = new Map(updatedNotifications.map((notification) => [notification._id, notification]));
      setNotifications((current) =>
        current.map((notification) => updatedMap.get(notification._id) || notification)
      );
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to mark notifications read.");
    } finally {
      setUpdatingNotificationId(null);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-divider bg-white">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          aria-label="Open navigation"
          className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-primary transition hover:border-text-muted hover:bg-surface-muted lg:hidden"
          onClick={onOpenSidebar}
          type="button"
        >
          <FiMenu aria-hidden="true" size={20} />
        </button>

        <div className="min-w-0">
          <p className="truncate text-xl font-bold leading-7 text-text-primary">{headerContext.title}</p>
          {headerContext.subtitle ? (
            <p className="truncate text-xs font-semibold leading-4 text-text-muted">{headerContext.subtitle}</p>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2" ref={panelRef}>
          <button
            aria-label="Notifications"
            aria-expanded={isNotificationPanelOpen}
            className="relative flex size-9 items-center justify-center rounded-md border border-border bg-surface text-text-secondary transition hover:border-text-muted hover:text-text-primary"
            onClick={() => setIsNotificationPanelOpen((current) => !current)}
            type="button"
          >
            <FiBell aria-hidden="true" size={17} />
            {unreadCount ? <span className="absolute right-2 top-2 size-2 rounded-full bg-danger" /> : null}
          </button>

          {isNotificationPanelOpen ? (
            <div className="absolute right-4 top-14 z-30 w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-md border border-border bg-white shadow-[var(--rentora-shadow-panel)] sm:right-6 lg:right-8">
              <div className="flex items-start justify-between gap-4 border-b border-divider p-4">
                <div>
                  <h2 className="text-sm font-bold text-text-primary">Notifications</h2>
                  <p className="mt-1 text-xs font-medium text-text-secondary">
                    {unreadCount ? `${unreadCount} unread` : "All caught up"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    aria-label="Refresh notifications"
                    className="flex size-8 items-center justify-center rounded-sm border border-border text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
                    onClick={() => void loadNotifications()}
                    type="button"
                  >
                    <FiRefreshCw aria-hidden="true" className={isLoadingNotifications ? "animate-spin" : ""} size={15} />
                  </button>
                  <button
                    aria-label="Mark all as read"
                    className="flex size-8 items-center justify-center rounded-sm border border-border text-text-secondary transition hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
                    disabled={!unreadCount || updatingNotificationId === "all"}
                    onClick={() => void markAllAsRead()}
                    type="button"
                  >
                    <FiCheck aria-hidden="true" size={15} />
                  </button>
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {isLoadingNotifications && !notifications.length ? (
                  <div className="px-4 py-10 text-center text-sm font-medium text-text-secondary">Loading notifications...</div>
                ) : null}

                {!isLoadingNotifications && !notifications.length ? (
                  <div className="px-4 py-10 text-center text-sm font-medium text-text-secondary">No notifications yet.</div>
                ) : null}

                {notifications.slice(0, 12).map((notification) => {
                  const target = getNotificationTarget(notification);
                  const isUpdating = updatingNotificationId === notification._id;

                  return (
                    <button
                      className="grid w-full gap-2 border-b border-divider px-4 py-3 text-left transition last:border-b-0 hover:bg-surface-muted"
                      key={notification._id}
                      onClick={() => void openNotification(notification)}
                      type="button"
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2">
                          {!notification.isRead ? <span className="size-2 shrink-0 rounded-full bg-primary" /> : null}
                          <span className="truncate text-sm font-bold text-text-primary">{notification.title}</span>
                        </span>
                        <span className="shrink-0 text-xs font-medium text-text-muted">
                          {isUpdating ? "Saving..." : formatNotificationTime(notification.createdAt)}
                        </span>
                      </span>
                      <span className="line-clamp-2 text-xs font-medium leading-5 text-text-secondary">{notification.body}</span>
                      {target ? <span className="text-xs font-semibold text-primary">Open request</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
