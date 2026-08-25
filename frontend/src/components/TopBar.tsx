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
    <header className="border-b border-rule bg-surface-1 sticky top-0 z-40">
      <div className="h-1 bg-brown" />
      <div className="w-full px-6 md:px-12 h-16 flex items-center justify-between relative">
        
        {/* Left: Navigation */}
        <div className="flex items-center gap-6 w-1/3">
          {role && ["admin", "hod", "iqac"].includes(role) ? (
            <Link
              href="/registry"
              className="text-sm font-medium text-text-secondary hover:text-brown transition-colors"
            >
              Registry
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-text-secondary hover:text-brown transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Center: Brand */}
        <div className="w-1/3 flex justify-center absolute left-1/2 -translate-x-1/2">
          <Link
            href={homeHref}
            className="text-2xl text-blue font-display tracking-tight hover:text-brown transition-colors"
          >
            Vitae
          </Link>
        </div>

        {/* Right: Profile & Logout */}
        <div className="flex items-center justify-end gap-6 w-1/3">
          {name && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-text">{name}</p>
              <p className="text-[11px] text-text-tertiary font-mono">
                {role === "hod"
                  ? "Head of department"
                  : role === "iqac"
                  ? "IQAC coordinator"
                  : role === "faculty"
                  ? "Faculty member"
                  : "Administrator"}
              </p>
            </div>
          )}
          {name ? (
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-text-tertiary hover:text-coral transition-colors cursor-pointer"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-text-tertiary hover:text-brown transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}