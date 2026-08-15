"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/store";

export function TopBar() {
  const router = useRouter();
  const { name, role, clearSession } = useSession();

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <header className="border-b border-border bg-surface px-8 py-4 flex items-center justify-between">
      <div>
        <span className="text-lg text-ink font-serif">Vitae</span>
        <span className="ml-3 font-mono text-xs text-ink-soft uppercase tracking-wide">{role}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-ink-soft">{name}</span>
        <button onClick={handleLogout} className="text-sm text-maroon hover:underline">
          sign out
        </button>
      </div>
    </header>
  );
}