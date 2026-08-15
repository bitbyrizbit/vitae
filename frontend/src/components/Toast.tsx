"use client";

import { useToast } from "@/lib/store";

const toastColors: Record<string, string> = {
  success: "border-sage bg-surface-1 text-sage shadow-lg",
  error: "border-coral bg-surface-1 text-coral shadow-lg",
  info: "border-blue bg-surface-1 text-blue shadow-lg",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto px-5 py-3 text-sm font-medium rounded-[4px] border-l-4 cursor-pointer max-w-sm w-[320px] ${
            toastColors[toast.type]
          }`}
          style={{ animation: "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message.charAt(0).toUpperCase() + toast.message.slice(1)}
        </div>
      ))}
    </div>
  );
}
