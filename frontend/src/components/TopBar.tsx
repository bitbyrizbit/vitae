"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/store";

export function TopBar() {
  const router = useRouter();
  const { name, role, clearSession } = useSession();

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  const homeHref =
    role && ["admin", "hod", "iqac"].includes(role) ? "/registry" : "/dashboard";

  return (
    <>
      <div className="h-[2px] bg-gold" />
      <header className="border-b border-rule bg-surface-1 px-6 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={homeHref}
            className="text-xl text-text font-display hover:text-gold transition-colors duration-200"
          >
            Vitae
          </Link>
          {role && (
            <span className="text-[11px] text-text-tertiary font-mono hidden sm:inline">
              {role === "hod"
                ? "head of department"
                : role === "iqac"
                  ? "iqac coordinator"
                  : role}
            </span>
          )}
        </div>
        <div className="flex items-center gap-5">
          {role && ["admin", "hod", "iqac"].includes(role) && (
            <Link
              href="/registry"
              className="text-sm text-text-secondary hover:text-text transition-colors duration-200"
            >
              registry
            </Link>
          )}
          {name && (
            <span className="text-sm text-text-secondary hidden sm:inline">{name}</span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-text-tertiary hover:text-coral transition-colors duration-200 cursor-pointer"
          >
            sign out
          </button>
        </div>
      </header>
    </>
  );
}