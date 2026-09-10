"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiAlertCircle, FiCheck, FiX } from "@/components/ui";
import { RENTORA_TOAST_EVENT, type ToastPayload } from "@/lib/ui/toast";

type ToastItem = ToastPayload & {
  id: number;
};

const toastDurationMs = 4200;

export function useToastMessages({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  useEffect(() => {
    if (success) {
      window.dispatchEvent(
        new CustomEvent<ToastPayload>(RENTORA_TOAST_EVENT, {
          detail: { message: success, tone: "success" },
        })
      );
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      window.dispatchEvent(
        new CustomEvent<ToastPayload>(RENTORA_TOAST_EVENT, {
          detail: { message: error, tone: "error" },
        })
      );
    }
  }, [error]);
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);
  const timersRef = useRef(new Map<number, number>());

  const dismissToast = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    const timers = timersRef.current;

    const handleToast = (event: Event) => {
      const payload = (event as CustomEvent<ToastPayload>).detail;
      if (!payload?.message?.trim()) {
        return;
      }

      const id = nextIdRef.current;
      nextIdRef.current += 1;

      setToasts((current) => {
        const nextToasts = [{ ...payload, id }, ...current];

        nextToasts.slice(4).forEach((toast) => {
          const timer = timers.get(toast.id);
          if (timer) {
            window.clearTimeout(timer);
            timers.delete(toast.id);
          }
        });

        return nextToasts.slice(0, 4);
      });

      const timer = window.setTimeout(() => dismissToast(id), toastDurationMs);
      timers.set(id, timer);
    };

    window.addEventListener(RENTORA_TOAST_EVENT, handleToast);

    return () => {
      window.removeEventListener(RENTORA_TOAST_EVENT, handleToast);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, [dismissToast]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-relevant="additions text"
      className="pointer-events-none fixed right-4 top-4 z-[80] grid w-[min(420px,calc(100vw-32px))] gap-3 sm:right-6 sm:top-6"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.tone === "success";
        const Icon = isSuccess ? FiCheck : FiAlertCircle;

        return (
          <div
            className={[
              "pointer-events-auto flex items-start gap-3 rounded-md border px-4 py-3 shadow-[0_18px_48px_rgb(15_23_42/16%)] backdrop-blur-md",
              isSuccess
                ? "border-success/35 bg-emerald-50/90 text-success"
                : "border-danger/35 bg-rose-50/90 text-danger",
            ].join(" ")}
            key={toast.id}
          >
            <span
              className={[
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                isSuccess ? "bg-emerald-100/90" : "bg-rose-100/90",
              ].join(" ")}
            >
              <Icon aria-hidden="true" size={15} />
            </span>
            <p className="min-w-0 flex-1 text-sm font-semibold leading-6 text-text-primary">
              {toast.message}
            </p>
            <button
              aria-label="Dismiss notification"
              className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
              onClick={() => dismissToast(toast.id)}
              type="button"
            >
              <FiX aria-hidden="true" size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
