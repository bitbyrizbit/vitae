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
            <label className="block text-[13px] font-medium text-text-secondary mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
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