"use client";

import { useToast } from "@/lib/store";

const toastColors: Record<string, string> = {
  success: "border-gold/30 bg-gold/10 text-gold-bright",
  error: "border-coral/30 bg-coral/10 text-coral",
  info: "border-rule bg-surface-2 text-text-secondary",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto px-4 py-3 text-sm rounded-[3px] border cursor-pointer max-w-xs shadow-lg ${
            toastColors[toast.type]
          }`}
          style={{ animation: "toastSlideIn 0.25s ease-out both" }}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
