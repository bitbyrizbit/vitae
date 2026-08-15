"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSession } from "@/lib/store";
import { Button } from "@/components/Button";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useSession((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      const { access_token, role, name } = res.data;
      setSession(access_token, role, name);

      if (["admin", "hod", "iqac"].includes(role)) {
        router.push("/registry");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Login failed, please check your credentials";
      setError(message);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault();
    alert("Reset password link sent to your email (Demo mode)");
  }

  return (
    <main className="min-h-screen bg-surface-2 flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-surface-1 p-8 md:p-10 rounded-[4px] shadow-sm border border-rule animate-in">
        
        <Link href="/" className="inline-block mb-10">
          <h1 className="text-3xl text-blue font-display tracking-tight hover:text-brown transition-colors">
            Vitae
          </h1>
        </Link>
        
        <h2 className="text-xl text-text font-medium mb-1">Welcome back</h2>
        <p className="text-sm text-text-tertiary mb-8">
          Sign in to access your faculty dossier.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-2">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-[13px] font-medium text-text-secondary">
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[12px] font-medium text-brown hover:text-brown-dim transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-ghost hover:text-text-secondary transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className={`text-coral text-[13px] font-medium ${shaking ? "animate-shake" : ""}`}>
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            className="w-full mt-2"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-10 pt-6 border-t border-rule text-center">
          <p className="text-sm text-text-secondary">
            New faculty member?{" "}
            <Link
              href="/register"
              className="font-medium text-brown hover:text-brown-dim transition-colors"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}