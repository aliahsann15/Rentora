export type ToastTone = "error" | "success";

export type ToastPayload = {
  message: string;
  tone: ToastTone;
};

export const RENTORA_TOAST_EVENT = "rentora-toast";

export function showToast(payload: ToastPayload) {
  if (typeof window === "undefined" || !payload.message.trim()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ToastPayload>(RENTORA_TOAST_EVENT, {
      detail: {
        message: payload.message,
        tone: payload.tone,
      },
    })
  );
}
