"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Modal({ open, onClose, title, children }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-text/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-surface-1 border border-rule rounded-[4px] p-8 shadow-2xl"
        style={{ animation: "scaleIn 0.2s ease-out both" }}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-rule-subtle">
          <h3 className="text-2xl font-display text-blue">{title}</h3>
          <button
            onClick={onClose}
            className="text-text-ghost hover:text-coral transition-colors text-xl leading-none cursor-pointer w-8 h-8 flex items-center justify-center rounded-[3px] hover:bg-coral-bg"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
