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
          ?.detail || "login failed, check your credentials";
      setError(message);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-base flex flex-col">
      <div className="h-[2px] bg-gold" />

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm animate-in">
          <Link href="/" className="inline-block mb-8">
            <h1 className="text-3xl text-text font-display hover:text-gold transition-colors duration-200">
              Vitae
            </h1>
          </Link>
          <p className="font-mono text-[11px] text-text-tertiary mb-8">
            sign in to your faculty record
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] text-text-secondary mb-1.5">
                email
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
              <label className="block text-[12px] text-text-secondary mb-1.5">
                password
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
              <p
                className={`text-coral text-sm ${shaking ? "animate-shake" : ""}`}
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full"
            >
              {loading ? "signing in..." : "sign in"}
            </Button>
          </form>

          <p className="text-sm text-text-secondary mt-8">
            new faculty member?{" "}
            <Link
              href="/register"
              className="text-gold hover:text-gold-bright transition-colors duration-200"
            >
              register here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}